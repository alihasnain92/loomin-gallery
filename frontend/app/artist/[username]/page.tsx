"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface ArtistProfile {
    id: number;
    username: string;
    created_at: string;
    followers_count: number;
    following_count: number;
    is_followed_by_me: boolean;
}

interface Artwork {
    id: number;
    title: string;
    image_url: string;
    ai_model: string;
    like_count: number;
}

export default function ArtistPage() {
    const params = useParams();
    const username = params.username as string;

    const [profile, setProfile] = useState<ArtistProfile | null>(null);
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFollowingState, setIsFollowingState] = useState(false);
    const [followerCountState, setFollowerCountState] = useState(0);
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtistData = async () => {
            const token = localStorage.getItem("token");

            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setCurrentUsername(payload.sub);
                } catch (e) {
                    // Ignore parsing errors
                }
            }

            try {
                // Fetch profile
                const profileHeaders: HeadersInit = {};
                if (token) profileHeaders["Authorization"] = `Bearer ${token}`;

                const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/profile`, {
                    headers: profileHeaders
                });

                if (!profileRes.ok) throw new Error("Artist not found");
                const profileData = await profileRes.json();
                setProfile(profileData);
                setIsFollowingState(profileData.is_followed_by_me);
                setFollowerCountState(profileData.followers_count);

                // Fetch artwork
                const artworksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/artworks`);
                if (!artworksRes.ok) throw new Error("Could not load artworks");
                const artworksData = await artworksRes.json();
                setArtworks(artworksData);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (username) fetchArtistData();
    }, [username]);

    const handleFollow = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            import("../../components/Toast").then(({ showToast }) => {
                showToast("Please log in to follow artists.", "error");
            });
            return;
        }

        try {
            // Optimistic UI Update
            setIsFollowingState(!isFollowingState);
            setFollowerCountState(prev => isFollowingState ? prev - 1 : prev + 1);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/follow`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to follow/unfollow");
            }

            const data = await response.json();

            import("../../components/Toast").then(({ showToast }) => {
                showToast(data.message, "success");
            });

        } catch (err: any) {
            // Revert on error
            setIsFollowingState(!isFollowingState);
            setFollowerCountState(prev => isFollowingState ? prev + 1 : prev - 1);
            import("../../components/Toast").then(({ showToast }) => {
                showToast(err.message, "error");
            });
        }
    };

    if (error) {
        return (
            <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">404 - {error}</h2>
                <Link href="/" className="text-blue-500 hover:text-blue-400">Return to Gallery</Link>
            </main>
        );
    }

    if (isLoading || !profile) {
        return (
            <main className="min-h-screen bg-gray-950 flex justify-center items-center">
                <div className="text-xl text-gray-400 animate-pulse">Loading artist profile...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-950">
            {/* HERO SECTION */}
            <div className="bg-gray-900 border-b border-gray-800 pt-20 pb-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start md:justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full mx-auto md:mx-0 mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">{profile.username}</h1>
                        <p className="text-gray-400 mt-2">Member since {new Date(profile.created_at).getFullYear()}</p>

                        <div className="flex justify-center md:justify-start gap-6 mt-4 opacity-80">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-white">{followerCountState}</span>
                                <span className="text-xs uppercase tracking-wider text-gray-400">Followers</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-white">{profile.following_count}</span>
                                <span className="text-xs uppercase tracking-wider text-gray-400">Following</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-white">{artworks.length}</span>
                                <span className="text-xs uppercase tracking-wider text-gray-400">Artworks</span>
                            </div>
                        </div>
                    </div>

                    {currentUsername !== profile.username && (
                        <button
                            onClick={handleFollow}
                            className={`px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-xl ${isFollowingState
                                ? "bg-gray-800 text-white hover:bg-gray-700 border border-gray-600"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                        >
                            {isFollowingState ? "Following" : "Follow Artist"}
                        </button>
                    )}
                </div>
            </div>

            {/* ARTWORK GALLERY */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold text-white mb-8">Artworks by {profile.username}</h2>

                {artworks.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-lg">This artist hasn't uploaded any artworks yet.</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                        {artworks.map((artwork, index) => (
                            <motion.div
                                key={artwork.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20"
                            >
                                <Link href={`/artwork/${artwork.id}`} className="block relative">
                                    <Image
                                        src={artwork.image_url}
                                        alt={artwork.title}
                                        width={600}
                                        height={800}
                                        className="w-full h-auto object-cover"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                        <h3 className="font-bold text-lg text-white mb-1 truncate drop-shadow-md">
                                            {artwork.title}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold text-blue-400 bg-blue-950/50 px-2 py-1 rounded-md border border-blue-900/50 backdrop-blur-sm">
                                                {artwork.ai_model}
                                            </span>
                                            <div className="flex items-center gap-1 text-pink-400 bg-pink-950/50 px-2 py-1 rounded-md border border-pink-900/50 backdrop-blur-sm text-xs font-semibold">
                                                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                                {artwork.like_count}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
