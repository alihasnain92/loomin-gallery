"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
    created_at: string;
    prompts: Prompt[];
    like_count: number;
    username: string;
}

export default function ArtworkDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [artwork, setArtwork] = useState<Artwork | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        const fetchArtwork = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/artworks/${params.id}`
                );
                if (!response.ok) throw new Error("Artwork not found");

                const data = await response.json();
                setArtwork(data);
                setLikeCount(data.like_count);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchArtwork();
    }, [params.id]);

    const handleCopyPrompt = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLike = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/artworks/${params.id}/like`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) return;
            const data = await res.json();
            setLikeCount(data.like_count);
        } catch {
            // Silently fail
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-gray-500 animate-pulse text-lg">Loading artwork...</div>
            </main>
        );
    }

    if (error || !artwork) {
        return (
            <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 text-lg">{error || "Artwork not found"}</p>
                <Link
                    href="/"
                    className="text-blue-500 hover:text-blue-400 transition-colors text-sm"
                >
                    ← Back to Gallery
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-950 px-6 py-12">
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Gallery
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left: Image */}
                    <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                        <Image
                            src={artwork.image_url}
                            alt={artwork.title}
                            width={800}
                            height={800}
                            className="w-full h-auto object-cover"
                            priority
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                    </div>

                    {/* Right: Details */}
                    <div className="flex flex-col gap-6">
                        {/* Title & Meta */}
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{artwork.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>
                                    by <span className="text-white font-medium">{artwork.username}</span>
                                </span>
                                <span className="inline-block bg-blue-600 text-xs font-bold px-2.5 py-1 rounded text-white">
                                    {artwork.ai_model}
                                </span>
                            </div>
                        </div>

                        {/* Like Button */}
                        <button
                            onClick={handleLike}
                            className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-5 py-3 hover:border-red-500/50 transition-colors w-max group"
                        >
                            <svg
                                className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span className="text-white font-bold">{likeCount}</span>
                            <span className="text-gray-400 text-sm">likes</span>
                        </button>

                        {/* Prompt Section */}
                        {artwork.prompts.length > 0 && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-500 font-mono text-xs tracking-wider">PROMPT</span>
                                    <button
                                        onClick={() => handleCopyPrompt(artwork.prompts[0].prompt_text)}
                                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${copied
                                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700"
                                            }`}
                                    >
                                        {copied ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Copy Prompt
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {artwork.prompts[0].prompt_text}
                                </p>

                                {/* Negative Prompt */}
                                {artwork.prompts[0].negative_prompt && (
                                    <div className="mt-6 pt-6 border-t border-gray-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-500 font-mono text-xs tracking-wider">NEGATIVE PROMPT</span>
                                            <button
                                                onClick={() =>
                                                    handleCopyPrompt(artwork.prompts[0].negative_prompt!)
                                                }
                                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                                            {artwork.prompts[0].negative_prompt}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Created Date */}
                        <p className="text-gray-600 text-xs">
                            Uploaded on{" "}
                            {new Date(artwork.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
