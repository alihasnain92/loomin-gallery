"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            setIsLoggedIn(!!token);
        };

        checkAuth();
        window.addEventListener("auth-change", checkAuth);

        return () => {
            window.removeEventListener("auth-change", checkAuth);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        window.dispatchEvent(new Event("auth-change"));
        setIsMobileMenuOpen(false);
        router.push("/login");
    };

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4 relative z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* The Logo / Brand */}
                <Link href="/" onClick={closeMenu} className="text-xl font-bold text-white tracking-wide hover:text-gray-300 transition-colors">
                    Loomin<span className="text-blue-500">.ai</span>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center gap-6">
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

                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden text-gray-400 hover:text-white transition-colors"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-gray-950 border-b border-gray-800 shadow-2xl">
                    <div className="flex flex-col px-6 py-4 gap-1">
                        <Link
                            href="/"
                            onClick={closeMenu}
                            className="text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors py-3 px-4 rounded-lg"
                        >
                            Gallery
                        </Link>

                        {isLoggedIn ? (
                            <>
                                <Link
                                    href="/upload"
                                    onClick={closeMenu}
                                    className="text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors py-3 px-4 rounded-lg"
                                >
                                    Upload
                                </Link>
                                <Link
                                    href="/profile"
                                    onClick={closeMenu}
                                    className="text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors py-3 px-4 rounded-lg"
                                >
                                    Manage Library
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-900 transition-colors py-3 px-4 rounded-lg text-left"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                onClick={closeMenu}
                                className="bg-white text-black px-4 py-3 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors text-center mt-2"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}