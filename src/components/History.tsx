"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Post = {
  id: string;
  caption: string;
  platforms: string[];
  scheduled_time: string | null;
  created_at: string;
};

export default function History() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("id, caption, platforms, scheduled_time, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase fetch error:", error);
          setError("Failed to fetch post history");
          return;
        }

        if (data) {
          setPosts(data);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const getPostStatus = (scheduledTime: string | null) => {
    if (!scheduledTime) {
      return { status: "posted", text: "✅ Posted immediately", color: "text-green-600" };
    }

    const scheduledDate = new Date(scheduledTime);
    const now = new Date();

    if (scheduledDate > now) {
      return {
        status: "scheduled",
        text: `⏳ Scheduled for ${scheduledDate.toLocaleString()}`,
        color: "text-orange-600"
      };
    } else {
      return {
        status: "posted",
        text: `✅ Posted (was scheduled for ${scheduledDate.toLocaleString()})`,
        color: "text-green-600"
      };
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Delete error:", error);
        alert("Failed to delete post");
        return;
      }

      // Remove from local state
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="mt-8 max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Post History</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Post History</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Post History</h3>
        {posts.length > 0 && (
          <span className="text-sm text-gray-500">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No posts yet</p>
          <p className="text-sm">Generated captions will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const postStatus = getPostStatus(post.scheduled_time);
            
            return (
              <div key={post.id} className="border rounded-lg p-4 bg-white shadow-sm">
                {/* Header with timestamp and delete button */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {formatRelativeTime(post.created_at)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete post"
                  >
                    Delete
                  </button>
                </div>

                {/* Caption */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                    {post.caption}
                  </p>
                </div>

                {/* Platforms */}
                {post.platforms && post.platforms.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Platforms:</span> {post.platforms.join(", ")}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${postStatus.color}`}>
                    {postStatus.text}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    postStatus.status === 'scheduled' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {postStatus.status === 'scheduled' ? 'Scheduled' : 'Posted'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}