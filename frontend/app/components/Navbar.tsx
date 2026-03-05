"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Upgraded useEffect: Checks on load AND listens for custom events
    useEffect(() => {
        // 1. Define the check function
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsLoggedIn(!!token); // !! converts the string/null into a strict true/false boolean
        };

        // 2. Run it immediately on component mount
        checkAuth();

        // 3. Start listening for the "auth-change" flare
        window.addEventListener("auth-change", checkAuth);

        // 4. Clean up the listener so we don't cause memory leaks
        return () => {
            window.removeEventListener("auth-change", checkAuth);
        };
    }, []);

    // The logout function
    const handleLogout = () => {
        localStorage.removeItem("token"); // Destroy the key!
        setIsLoggedIn(false); // Immediately update local state
        window.dispatchEvent(new Event("auth-change")); // Fire the flare for the rest of the app!
        router.push("/login"); // Kick them back to the login screen
    };

    return (
        <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* The Logo / Brand */}
                <Link href="/" className="text-xl font-bold text-white tracking-wide hover:text-gray-300 transition-colors">
                    Loomin<span className="text-blue-500">.ai</span>
                </Link>

                {/* The Navigation Links */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Gallery
                    </Link>

                    {isLoggedIn ? (
                        <>
                            <Link href="/upload" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                                Upload
                            </Link>
                            <Link href="/profile" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                                Manage Library
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}