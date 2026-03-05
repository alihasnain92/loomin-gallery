"use client"; // This tells Next.js this is an interactive component

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    // 1. State to hold the user's typing and any error messages
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Next.js router for redirecting the user after a successful login
    const router = useRouter();

    // 2. The function that fires when the user clicks "Sign In"
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Stops the page from refreshing
        setError(""); // Clear any old errors

        try {
            // 3. The crucial step: Formatting data specifically for FastAPI's OAuth2
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            // 4. The Bridge: Talking to your Python backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Invalid username or password");
            }

            const data = await response.json();

            // 5. Success! Save the JWT token to the browser's local storage
            localStorage.setItem("token", data.access_token);

            // FIRE THE FLARE! Tell the Navbar to update immediately
            window.dispatchEvent(new Event("auth-change"));

            // 6. Redirect the user back to the main gallery page
            router.push("/");

        } catch (err: any) {
            setError(err.message);
        }
    };

    // 7. The UI: A sleek, dark-mode Tailwind form
    return (
        <main className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>

                <p className="mt-2 text-center text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                        Sign up here
                    </Link>
                </p>

                {/* If there is an error, show this red alert box */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </main>
    );
}