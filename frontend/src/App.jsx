import React, { useState } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:9000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.response || data.error || "No response.");
    } catch (err) {
      setResponse("Error connecting to backend.");
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Gemini Copilot</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask me anything..."
      />
      <button onClick={sendPrompt} disabled={loading}>
        {loading ? "Thinking..." : "Generate"}
      </button>
      <div className="response">
        <ReactMarkdown>{response}</ReactMarkdown>
      </div>
    </div>
  );
}

export default App;