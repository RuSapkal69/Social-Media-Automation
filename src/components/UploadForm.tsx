"use client";

import React, { useState } from "react";

export default function UploadForm() {
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!mediaUrl) return;
    setLoading(true);
    setCaption("");

    try {
      const res = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl }),
      });

      const data = await res.json();
      setCaption(data.caption);
    } catch (err) {
      console.error(err);
      setCaption("Error generating caption.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">AI Caption Generator</h2>

      <input
        type="text"
        placeholder="Enter media URL..."
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate AI Caption"}
      </button>

      {caption && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          <strong>Generated Caption:</strong>
          <p>{caption}</p>
        </div>
      )}
    </div>
  );
}
