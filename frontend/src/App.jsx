import React, { useState } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [popup, setPopup] = useState("");

  const MESSAGE_LIMIT = 20;
  const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

  const sendPrompt = async () => {
    if (!prompt.trim() && !file) return;

    // Message limit check
    if (messages.length >= MESSAGE_LIMIT) {
      setPopup("⚠️ Message limit reached! Please clear chat.");
      return;
    }

    const userMessage = { role: "user", content: prompt, file };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setFile(null);
    setLoading(true);

    let aiMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (file) formData.append("file", file);

      const res = await fetch("http://localhost:9000/generate_stream", {
        method: "POST",
        body: formData,
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
        setMessages((prev) => [...prev.slice(0, -1), { ...aiMessage }]);
      }
    } catch (err) {
      aiMessage.content = "Error connecting to backend.";
      setMessages((prev) => [...prev.slice(0, -1), aiMessage]);
    }

    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // File size validation
    if (selectedFile.size > FILE_SIZE_LIMIT) {
      setPopup("⚠️ File too large! Max allowed size is 10MB.");
      e.target.value = ""; // reset input
      return;
    }
    setFile(selectedFile);
  };

  return (
    <div className="container">
      <h1>🚀 Gemini Copilot</h1>

      {/* Popup */}
      {popup && (
        <div className="popup">
          {popup}
          <button onClick={() => setPopup("")}>❌</button>
        </div>
      )}

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role === "user" ? "user" : "assistant"}`}
          >
            {msg.content && <ReactMarkdown>{msg.content}</ReactMarkdown>}

            {msg.file && msg.file.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(msg.file)}
                alt="uploaded"
                style={{ maxWidth: "200px", borderRadius: "8px" }}
              />
            )}

            {msg.file && msg.file.type.startsWith("video/") && (
              <video
                controls
                src={URL.createObjectURL(msg.file)}
                style={{ maxWidth: "250px", borderRadius: "8px" }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="input-box">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me anything..."
        />

        {/* File upload */}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
        />

        <button onClick={sendPrompt} disabled={loading}>
          {loading ? "⏳ Generating..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
