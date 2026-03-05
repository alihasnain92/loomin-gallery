"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

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
    user_id: number;
    prompts: Prompt[];
}

export default function ProfilePage() {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit Modal State
    const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editModel, setEditModel] = useState("Midjourney");
    const [editPrompt, setEditPrompt] = useState("");
    const [editNegativePrompt, setEditNegativePrompt] = useState("");
    const [isSaving, setIsSaving] = useState(false);
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
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-artworks/`, {
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

    const handleDelete = async (artworkId: number) => {
        // Confirm before deleting
        if (!window.confirm("Are you sure you want to delete this artwork? This cannot be undone.")) {
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artworks/${artworkId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}` // Show VIP pass to delete
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to delete artwork");
            }

            // Remove the deleted image from the screen immediately for a snappy UI
            setArtworks((prev) => prev.filter((a) => a.id !== artworkId));

            // Show toast notification
            import("../components/Toast").then(({ showToast }) => {
                showToast("Artwork successfully deleted.", "info");
            });

        } catch (err: any) {
            setError(err.message);
        }
    };

    const openEditModal = (artwork: Artwork) => {
        setEditingArtwork(artwork);
        setEditTitle(artwork.title);
        setEditModel(artwork.ai_model || "Midjourney");
        if (artwork.prompts && artwork.prompts.length > 0) {
            setEditPrompt(artwork.prompts[0].prompt_text);
            setEditNegativePrompt(artwork.prompts[0].negative_prompt || "");
        } else {
            setEditPrompt("");
            setEditNegativePrompt("");
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingArtwork) return;

        setIsSaving(true);
        const token = localStorage.getItem("token");

        try {
            const updateData = {
                title: editTitle,
                ai_model: editModel,
                prompts: [{
                    prompt_text: editPrompt,
                    negative_prompt: editNegativePrompt || null
                }]
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artworks/${editingArtwork.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) throw new Error("Failed to update artwork");

            const updatedArtwork = await response.json();

            // Update UI list
            setArtworks((prev) =>
                prev.map((art) => art.id === updatedArtwork.id ? updatedArtwork : art)
            );

            // Close modal
            setEditingArtwork(null);

            // Show toast
            import("../components/Toast").then(({ showToast }) => {
                showToast("Artwork updated successfully!", "success");
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
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
                                    <Image
                                        src={artwork.image_url}
                                        alt={artwork.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    />
                                    {/* The Hover Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        <button
                                            onClick={() => openEditModal(artwork)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 w-32"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(artwork.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 w-32"
                                        >
                                            Delete
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

            {/* EDIT MODAL */}
            {editingArtwork && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
                        <button
                            onClick={() => setEditingArtwork(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Edit Artwork</h2>

                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">AI Model</label>
                                <select
                                    value={editModel}
                                    onChange={(e) => setEditModel(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Midjourney">Midjourney</option>
                                    <option value="DALL-E 3">DALL-E 3</option>
                                    <option value="Stable Diffusion">Stable Diffusion</option>
                                    <option value="Gemini">Gemini</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">The Prompt</label>
                                <textarea
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Negative Prompt</label>
                                <textarea
                                    value={editNegativePrompt}
                                    onChange={(e) => setEditNegativePrompt(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-16"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingArtwork(null)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-6 py-2 rounded-lg font-bold text-white transition-colors ${isSaving ? "bg-blue-800 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}