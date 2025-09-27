"use client";

import React, { useState } from "react";

const PLATFORMS = ["Instagram", "LinkedIn", "Pinterest", "YouTube"];

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [prompt, setPrompt] = useState("Write a social media caption");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError("");
    setCaption("");
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setCaption("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt || "Write a social media caption");
      formData.append("platforms", JSON.stringify(platforms));
      if (scheduledTime) {
        formData.append("scheduledTime", scheduledTime);
      }

      const res = await fetch("/api/caption", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate caption");
      }

      setCaption(data.caption);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Error generating caption.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFileSize = (bytes: number) => {
    const MB = bytes / (1024 * 1024);
    return MB < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${MB.toFixed(1)} MB`;
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">AI Caption Generator</h2>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Upload File</label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
        {file && (
          <p className="text-sm text-gray-600 mt-1">
            Selected: {file.name} ({getFileSize(file.size)})
          </p>
        )}
      </div>

      {/* File Preview */}
      {file && (
        <div className="mb-4">
          {file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="w-full max-h-64 object-contain rounded-lg border"
            />
          ) : (
            <video
              src={URL.createObjectURL(file)}
              controls
              className="w-full max-h-64 rounded-lg border"
            />
          )}
        </div>
      )}

      {/* Custom Prompt */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Caption Prompt</label>
        <textarea
          placeholder="Enter your caption prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      {/* Platforms */}
      <div className="mb-4">
        <p className="block text-sm font-medium mb-2">Select Platforms:</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              type="button"
              className={`px-3 py-1 rounded border transition-colors ${
                platforms.includes(platform)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-100 hover:bg-gray-200 border-gray-300"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
        {platforms.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Selected: {platforms.join(", ")}
          </p>
        )}
      </div>

      {/* Scheduled Posting */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Schedule Time (optional):
        </label>
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="w-full p-2 border rounded"
          min={new Date().toISOString().slice(0, 16)}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !file}
        className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Generating..." : "Generate Caption"}
      </button>

      {/* Caption Output */}
      {caption && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <strong className="block mb-2">Generated Caption:</strong>
          <p className="mb-3 whitespace-pre-wrap">{caption}</p>
          
          {platforms.length > 0 && (
            <p className="text-sm text-gray-600 mb-1">
              For: {platforms.join(", ")}
            </p>
          )}
          
          {scheduledTime ? (
            <p className="text-sm text-gray-600">
              Scheduled for: {new Date(scheduledTime).toLocaleString()}
            </p>
          ) : (
            <p className="text-sm text-gray-600">Ready to post immediately</p>
          )}
        </div>
      )}
    </div>
  );
}