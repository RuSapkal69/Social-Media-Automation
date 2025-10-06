"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const PLATFORMS = [
  { name: "Instagram", icon: "📷", color: "bg-pink-500" },
  { name: "LinkedIn", icon: "💼", color: "bg-blue-600" },
  { name: "Pinterest", icon: "📌", color: "bg-red-500" },
  { name: "YouTube", icon: "▶️", color: "bg-red-600" },
];

export default function PlatformConnections() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectedPlatforms();
  }, []);

  const fetchConnectedPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_tokens")
        .select("platform");

      if (error) {
        console.error("Error fetching platforms:", error);
        return;
      }

      if (data) {
        setConnectedPlatforms(data.map((p) => p.platform));
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    window.location.href = `/api/auth/${platform.toLowerCase()}`;
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;

    try {
      const { error } = await supabase
        .from("platform_tokens")
        .delete()
        .eq("platform", platform.toLowerCase());

      if (error) {
        console.error("Error disconnecting:", error);
        alert("Failed to disconnect platform");
        return;
      }

      setConnectedPlatforms(
        connectedPlatforms.filter((p) => p !== platform.toLowerCase())
      );
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred");
    }
  };

  const isConnected = (platform: string) =>
    connectedPlatforms.includes(platform.toLowerCase());

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Connect Social Media Platforms</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Connect Social Media Platforms</h2>
      <p className="text-gray-600 mb-6">
        Connect your accounts to automatically post content
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => {
          const connected = isConnected(platform.name);

          return (
            <div
              key={platform.name}
              className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center text-2xl`}
                >
                  {platform.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{platform.name}</h3>
                  <p className="text-sm text-gray-500">
                    {connected ? (
                      <span className="text-green-600">✓ Connected</span>
                    ) : (
                      <span className="text-gray-400">Not connected</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  connected
                    ? handleDisconnect(platform.name)
                    : handleConnect(platform.name)
                }
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  connected
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          📋 Setup Instructions
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Connect" to authorize each platform</li>
          <li>• You'll be redirected to the platform's login page</li>
          <li>• Grant the necessary permissions</li>
          <li>• You'll be redirected back to confirm connection</li>
        </ul>
      </div>

      {connectedPlatforms.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            🎉 {connectedPlatforms.length} platform
            {connectedPlatforms.length > 1 ? "s" : ""} connected! You can now
            schedule automatic posts.
          </p>
        </div>
      )}
    </div>
  );
}