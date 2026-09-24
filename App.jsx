import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [prompts, setPrompts] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  // LOGIN
  const login = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        setLoginError("Invalid username or password");
        return;
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      setToken(data.token);

      setUsername("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setLoginError("Unable to connect to server");
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setPrompts([]);
  };

  // LOAD PROMPTS
  const loadPrompts = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/prompts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error("Error loading prompts:", error);
    }
  };

  useEffect(() => {
    if (token) {
      loadPrompts();
    }
  }, [token]);

  // CREATE PROMPT
  const addPrompt = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/prompts`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
            category,
            content,
          }),
        }
      );

      if (response.ok) {
        setTitle("");
        setCategory("");
        setContent("");

        loadPrompts();
      }
    } catch (error) {
      console.error("Error creating prompt:", error);
    }
  };

  // EDIT PROMPT
  const editPrompt = async (prompt) => {
    const newTitle = window.prompt(
      "Edit title:",
      prompt.title
    );

    if (newTitle === null) return;

    const newCategory = window.prompt(
      "Edit category:",
      prompt.category
    );

    if (newCategory === null) return;

    const newContent = window.prompt(
      "Edit prompt:",
      prompt.content
    );

    if (newContent === null) return;

    try {
      const response = await fetch(
        `${API_URL}/api/prompts/${prompt.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: newTitle,
            category: newCategory,
            content: newContent,
          }),
        }
      );

      if (response.ok) {
        loadPrompts();
      }
    } catch (error) {
      console.error("Error updating prompt:", error);
    }
  };

  // DELETE PROMPT
  const deletePrompt = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/prompts/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        loadPrompts();
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  };

  // LOGIN PAGE
  if (!token) {
    return (
      <div className="container">
        <h1>AI Prompt Manager</h1>

        <p className="subtitle">
          Secure access to your AI prompt collection
        </p>

        <div className="login-card">
          <h2>Login</h2>

          <form onSubmit={login}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            <button type="submit">
              Login
            </button>

            {loginError && (
              <p className="error">
                {loginError}
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  // PROMPT MANAGER PAGE
  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>AI Prompt Manager</h1>

          <p className="subtitle">
            Create and manage useful AI prompts
          </p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </div>

      <div className="form-card">
        <h2>Add New Prompt</h2>

        <form onSubmit={addPrompt}>
          <input
            type="text"
            placeholder="Prompt title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            required
          />

          <textarea
            placeholder="Write your AI prompt here..."
            value={content}
            onChange={(e) =>
              setContent(e.target.value)
            }
            required
          />

          <button type="submit">
            Save Prompt
          </button>
        </form>
      </div>

      <h2>Saved Prompts</h2>

      <div className="prompt-list">
        {prompts.length === 0 ? (
          <p>No prompts saved yet.</p>
        ) : (
          prompts.map((prompt) => (
            <div
              className="prompt-card"
              key={prompt.id}
            >
              <h3>{prompt.title}</h3>

              <span className="category">
                {prompt.category}
              </span>

              <p>{prompt.content}</p>

              <div className="actions">
                <button
                  onClick={() =>
                    editPrompt(prompt)
                  }
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    deletePrompt(prompt.id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;