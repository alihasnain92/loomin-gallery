"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// 1. Tell TypeScript what our database data looks like
interface Prompt {
  id: number;
  prompt_text: string;
  negative_prompt: string | null;
}

interface Artwork {
  id: number;
  title: string;
  image_url: string;
  ai_model: string;
  prompts: Prompt[];
}

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch all artworks from your FastAPI backend when the page loads
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/artworks/");
        if (!response.ok) throw new Error("Failed to fetch artworks");

        const data = await response.json();
        setArtworks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Discover AI Creations
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Hover over any image to reveal the exact prompts and models used to generate it.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-gray-500 py-20 animate-pulse">
            Loading the gallery...
          </div>
        )}

        {/* 3. The Masonry Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {artworks.map((artwork, index) => (
            <motion.div
              key={artwork.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }} // Staggered fade-in
              className="relative group break-inside-avoid rounded-xl overflow-hidden bg-gray-900 border border-gray-800"
            >
              {/* The Image */}
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* The Hover Reveal Overlay */}
              <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h3 className="text-xl font-bold text-white mb-2">{artwork.title}</h3>

                <span className="inline-block bg-blue-600 text-xs font-bold px-2 py-1 rounded mb-4 w-max">
                  {artwork.ai_model}
                </span>

                {artwork.prompts.length > 0 && (
                  <div className="text-sm text-gray-300">
                    <span className="text-gray-500 font-mono text-[10px] tracking-wider block mb-1">PROMPT</span>
                    <p className="line-clamp-4 leading-relaxed">
                      {artwork.prompts[0].prompt_text}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && artworks.length === 0 && (
          <div className="text-center text-gray-500 py-20 border border-dashed border-gray-800 rounded-xl">
            No artworks found. Be the first to upload!
          </div>
        )}

      </div>
    </main>
  );
}