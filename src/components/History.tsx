"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Post = {
  id: string;
  media_url: string;
  caption: string;
  created_at: string;
};

export default function History() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setPosts(data);
    };

    fetchPosts();
  }, []);

  return (
    <div className="mt-8 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2">History</h3>
      {posts.length === 0 && <p>No captions yet.</p>}
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="border rounded p-2">
            <p className="text-sm text-gray-600">
              {new Date(p.created_at).toLocaleString()}
            </p>
            <p className="font-medium">{p.caption}</p>
            <a
              href={p.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm underline"
            >
              View Media
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
