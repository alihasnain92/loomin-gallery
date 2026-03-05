"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  like_count: number;
  username: string;
}

const PAGE_SIZE = 12;
const AI_MODELS = ["All", "Midjourney", "DALL-E 3", "Stable Diffusion", "Gemini"];

export default function Home() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedModel, setSelectedModel] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchArtworks = useCallback(async (skip: number, isInitial: boolean, model: string, search: string) => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/artworks/?skip=${skip}&limit=${PAGE_SIZE}`;
      if (model !== "All") {
        url += `&ai_model=${encodeURIComponent(model)}`;
      }
      if (search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch artworks");

      const data = await response.json();
      setTotal(data.total);

      if (isInitial) {
        setArtworks(data.artworks);
      } else {
        setArtworks((prev) => [...prev, ...data.artworks]);
      }
    } catch (err: any) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // Debounce the search so we don't spam the API on every keystroke
    const timer = setTimeout(() => {
      fetchArtworks(0, true, selectedModel, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchArtworks, selectedModel, searchQuery]);

  const handleLoadMore = () => {
    fetchArtworks(artworks.length, false, selectedModel, searchQuery);
  };

  const handleFilterChange = (model: string) => {
    setSelectedModel(model);
    setArtworks([]);
  };

  const handleLike = async (e: React.MouseEvent, artworkId: number) => {
    e.preventDefault(); // Prevent navigation to detail page
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) return; // Silently ignore if not logged in

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artworks/${artworkId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      // Update the like count in the local state
      setArtworks((prev) =>
        prev.map((a) =>
          a.id === artworkId ? { ...a, like_count: data.like_count } : a
        )
      );
    } catch {
      // Silently fail
    }
  };

  const hasMore = artworks.length < total;

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Discover AI Creations
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Click any image to see the full prompt. Hover to preview details.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">

          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts or titles..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedModel}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="appearance-none w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-4 pr-10 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 cursor-pointer hover:border-gray-500 transition-colors"
            >
              {AI_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model === "All" ? "All Models" : model}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-gray-500 py-20 animate-pulse">
            Loading the gallery...
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-20 border border-dashed border-red-800/50 rounded-xl bg-red-500/5">
            <p className="text-red-400 font-medium text-lg mb-2">Something went wrong</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}

        {/* The Masonry Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {artworks.map((artwork, index) => (
              <motion.div
                key={artwork.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (index % PAGE_SIZE) * 0.1 }}
                onClick={() => router.push(`/artwork/${artwork.id}`)}
                className="relative group break-inside-avoid rounded-xl overflow-hidden bg-gray-900 border border-gray-800 cursor-pointer mb-6"
              >
                {/* The Image */}
                <Image
                  src={artwork.image_url}
                  alt={artwork.title}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* The Hover Reveal Overlay */}
                <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{artwork.title}</h3>
                  <p className="text-xs text-gray-400 mb-3 relative z-20">
                    by{" "}
                    <Link
                      href={`/artist/${artwork.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-blue-400 hover:underline transition-colors"
                    >
                      {artwork.username}
                    </Link>
                  </p>

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

                {/* Like Button - always visible at bottom-right */}
                <div className="absolute bottom-3 right-3 z-10">
                  <button
                    onClick={(e) => handleLike(e, artwork.id)}
                    className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white hover:bg-black/80 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="font-medium">{artwork.like_count}</span>
                  </button>
                </div>
              </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        {!isLoading && !error && hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className={`px-8 py-3 rounded-lg font-bold text-sm transition-colors duration-200 ${isLoadingMore
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
                }`}
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && artworks.length === 0 && (
          <div className="text-center text-gray-500 py-20 border border-dashed border-gray-800 rounded-xl">
            {selectedModel !== "All"
              ? `No ${selectedModel} artworks found. Try a different model.`
              : "No artworks found. Be the first to upload!"}
          </div>
        )}

      </div>
    </main>
  );
}