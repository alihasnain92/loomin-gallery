"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Prompt {
    id: number;
    prompt_text: string;
}

interface Artwork {
    id: number;
    title: string;
    image_url: string;
    user_id: number;
    prompts: Prompt[];
}

export default function ProfilePage() {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchMyArtworks = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                // Fetch the artworks
                // Update the URL and add the Authorization header!
                const response = await fetch("http://127.0.0.1:8000/my-artworks/", {
                    headers: {
                        "Authorization": `Bearer ${token}` // Show the VIP pass to get the private data
                    }
                });
                if (!response.ok) throw new Error("Failed to fetch artworks");

                const data = await response.json();
                setArtworks(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyArtworks();
    }, [router]);

    const handleDelete = async (id: number) => {
        // Confirm before deleting
        if (!window.confirm("Are you sure you want to delete this artwork? This cannot be undone.")) {
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`http://127.0.0.1:8000/artworks/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}` // Show VIP pass to delete
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to delete");
            }

            // Remove the deleted image from the screen immediately for a snappy UI
            setArtworks((prevArtworks) => prevArtworks.filter((art) => art.id !== id));

        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <main className="min-h-screen bg-gray-950 px-6 py-12">
            <div className="max-w-7xl mx-auto">

                <div className="mb-12 border-b border-gray-800 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Manage Library</h1>
                        <p className="text-gray-400 mt-2">View and manage your AI generations.</p>
                    </div>
                </div>

                {error && <p className="text-red-500 mb-6">{error}</p>}

                {isLoading ? (
                    <div className="text-gray-500 animate-pulse">Loading your library...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {artworks.map((artwork, index) => (
                            <motion.div
                                key={artwork.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group"
                            >
                                <div className="relative h-48 overflow-hidden bg-gray-950">
                                    <img
                                        src={artwork.image_url}
                                        alt={artwork.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* The Delete Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => handleDelete(artwork.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
                                        >
                                            Delete Artwork
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-white truncate">{artwork.title}</h3>
                                    {artwork.prompts && artwork.prompts.length > 0 && (
                                        <p className="text-sm text-gray-500 truncate mt-1">
                                            {artwork.prompts[0].prompt_text}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </div>
        </main>
    );
}