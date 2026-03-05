"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";

export default function UploadPage() {
    const router = useRouter();

    // Redirect to login if not authenticated
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        }
    }, [router]);

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [aiModel, setAiModel] = useState("Midjourney");
    const [promptText, setPromptText] = useState("");
    const [negativePrompt, setNegativePrompt] = useState("");

    // UI State
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            // Create a preview URL for the selected image
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const removePreview = () => {
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
    };

    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        // --- 1. THE DEFENSIVE GUARDRAILS ---

        // Check if a file was actually selected
        if (!file) {
            setError("Please select an image to upload.");
            return;
        }

        // Enforce a 5MB file size limit (5 * 1024 * 1024 bytes)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setError("Image is too large. Please upload a file smaller than 5MB.");
            return;
        }

        // Enforce a prompt length limit
        if (promptText.length > 500) {
            setError("Prompt is too long. Please keep it under 500 characters.");
            return;
        }

        // --- 2. GRAB THE VIP PASS ---
        const token = localStorage.getItem("token");
        if (!token) {
            setError("You must be logged in to upload artwork.");
            return;
        }

        // --- 3. PROCEED WITH UPLOAD ---
        setIsUploading(true);

        try {
            // --- STEP 1: Compress the image on the client side ---
            // Even if the user uploads a 4MB 4K image, this will shrink it down
            // to a web-optimized 1920px image, saving Cloudinary bandwidth!
            const compressionOptions = {
                maxSizeMB: 1,          // Aim for under 1MB
                maxWidthOrHeight: 1920, // Don't allow larger than 1080p-ish dimensions
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, compressionOptions);

            // --- STEP 2: Upload the Image to Cloudinary via FastAPI ---
            const imageFormData = new FormData();
            // Important: passing the compressedFile instead of the original file
            imageFormData.append("file", compressedFile, file.name);

            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: imageFormData,
            });

            if (!uploadRes.ok) throw new Error("Image upload failed");

            const uploadData = await uploadRes.json();
            const imageUrl = uploadData.url;

            // --- STEP 2: Save everything to the Database ---
            const artworkData = {
                title: title,
                image_url: imageUrl,
                ai_model: aiModel,
                prompts: [
                    {
                        prompt_text: promptText,
                        negative_prompt: negativePrompt || null
                    }
                ]
            };

            const dbRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artworks/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(artworkData),
            });

            if (!dbRes.ok) throw new Error("Failed to save to database");

            // Success! Send them back to the gallery
            router.push("/");

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-950 p-8">
            <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-8">Upload New Artwork</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Preview */}
                    {preview && (
                        <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-950">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full max-h-64 object-contain"
                            />
                            <button
                                type="button"
                                onClick={removePreview}
                                className="absolute top-3 right-3 bg-black/70 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Image File</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors"
                            required
                        />
                    </div>

                    {/* Title & AI Model */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="E.g., Neon Cyberpunk City"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">AI Model Used</label>
                            <select
                                value={aiModel}
                                onChange={(e) => setAiModel(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="Midjourney">Midjourney</option>
                                <option value="DALL-E 3">DALL-E 3</option>
                                <option value="Stable Diffusion">Stable Diffusion</option>
                                <option value="Gemini">Gemini</option>
                            </select>
                        </div>
                    </div>

                    {/* Prompts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">The Prompt</label>
                        <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24"
                            placeholder="What did you type to generate this?"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Negative Prompt (Optional)</label>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-16"
                            placeholder="What did you tell the AI to avoid?"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isUploading}
                        className={`w-full font-bold py-4 rounded-lg transition-colors duration-200 ${isUploading
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-white text-black hover:bg-gray-200"
                            }`}
                    >
                        {isUploading ? "Uploading to Cloud..." : "Publish to Gallery"}
                    </button>
                </form>
            </div>
        </main>
    );
}