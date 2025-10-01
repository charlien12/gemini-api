import React, { useState } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]); // store conversation history
  const [loading, setLoading] = useState(false);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    // add user message immediately
    const userMessage = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    let aiMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const res = await fetch("http://localhost:9000/generate_stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.body) {
        aiMessage.content = "No response stream available.";
        setMessages((prev) => [...prev.slice(0, -1), aiMessage]);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiMessage.content += chunk;
        // update last message (assistant)
        setMessages((prev) => [...prev.slice(0, -1), { ...aiMessage }]);
      }
    } catch (err) {
      aiMessage.content = "Error connecting to backend.";
      setMessages((prev) => [...prev.slice(0, -1), aiMessage]);
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>🚀 Gemini Copilot</h1>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role === "user" ? "user" : "assistant"}`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
      </div>

      <div className="input-box">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me anything..."
        />
        <button onClick={sendPrompt} disabled={loading}>
          {loading ? "⏳ Generating..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
