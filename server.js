const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "student-secret-key";

// ---------------- DATABASE ----------------

const db = new sqlite3.Database("./prompts.db", (err) => {
  if (err) {
    console.error("Database error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL
  )
`);

// ---------------- AUTH ----------------

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  });
}

// ---------------- HOME ----------------

app.get("/", (req, res) => {
  res.json({
    message: "AI Capsule API is running!"
  });
});

// ---------------- LOGIN ----------------

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Simple demonstration login for the assessment
  if (username === "student" && password === "password123") {
    const token = jwt.sign(
      { username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful",
      token
    });
  }

  res.status(401).json({
    message: "Invalid username or password"
  });
});

// ---------------- GET PROMPTS ----------------

app.get("/api/prompts", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM prompts ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Could not load prompts"
        });
      }

      res.json(rows);
    }
  );
});

// ---------------- ADD PROMPT ----------------

app.post("/api/prompts", authenticateToken, (req, res) => {
  const { title, category, content } = req.body;

  if (!title || !category || !content) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  const sql =
    "INSERT INTO prompts (title, category, content) VALUES (?, ?, ?)";

  db.run(sql, [title, category, content], function (err) {
    if (err) {
      return res.status(500).json({
        message: "Could not save prompt"
      });
    }

    res.status(201).json({
      id: this.lastID,
      title,
      category,
      content
    });
  });
});

// ---------------- UPDATE PROMPT ----------------

app.put("/api/prompts/:id", authenticateToken, (req, res) => {
  const { title, category, content } = req.body;
  const id = req.params.id;

  if (!title || !category || !content) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  const sql = `
    UPDATE prompts
    SET title = ?, category = ?, content = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [title, category, content, id],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: "Could not update prompt"
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: "Prompt not found"
        });
      }

      res.json({
        id: Number(id),
        title,
        category,
        content
      });
    }
  );
});

// ---------------- DELETE PROMPT ----------------

app.delete("/api/prompts/:id", authenticateToken, (req, res) => {
  const id = req.params.id;

  db.run(
    "DELETE FROM prompts WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: "Could not delete prompt"
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: "Prompt not found"
        });
      }

      res.json({
        message: "Prompt deleted successfully"
      });
    }
  );
});

// ---------------- START SERVER ----------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});