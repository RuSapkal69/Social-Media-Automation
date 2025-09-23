"use client";

import React, { useState } from "react";

const PLATFORMS = ["Instagram", "LinkedIn", "Pinterest", "YouTube"];

export default function UploadForm() {
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!mediaUrl) return;
    setLoading(true);
    setCaption("");

    try {
      const res = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl, platforms, scheduledTime }),
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

  const isImage = (url: string) =>
    /\.(jpeg|jpg|gif|png|webp)$/i.test(url.split("?")[0]);
  const isVideo = (url: string) =>
    /\.(mp4|webm|ogg)$/i.test(url.split("?")[0]);

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

      {mediaUrl && (
        <div className="mb-4">
          {isImage(mediaUrl) && (
            <img src={mediaUrl} alt="preview" className="w-full rounded-lg border" />
          )}
          {isVideo(mediaUrl) && (
            <video src={mediaUrl} controls className="w-full rounded-lg border" />
          )}
        </div>
      )}

      <div className="mb-4">
        <p className="font-medium mb-2">Select Platforms:</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              type="button"
              className={`px-3 py-1 rounded border ${
                platforms.includes(platform)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="font-medium mb-2">Schedule Time (optional):</p>
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !mediaUrl}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Scheduling..." : "Generate & Post"}
      </button>

      {caption && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          <strong>Generated Caption:</strong>
          <p>{caption}</p>
          {scheduledTime ? (
            <p className="text-sm text-gray-600 mt-1">
              Scheduled for: {new Date(scheduledTime).toLocaleString()}
            </p>
          ) : (
            <p className="text-sm text-gray-600 mt-1">Posted immediately</p>
          )}
        </div>
      )}
    </div>
  );
}
