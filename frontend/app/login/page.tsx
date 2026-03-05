"use client"; // This tells Next.js this is an interactive component

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    // 1. State to hold the user's typing and any error messages
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
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