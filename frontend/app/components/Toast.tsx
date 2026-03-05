"use client";

import { useEffect, useState, useCallback } from "react";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error" | "info";
}

let toastId = 0;

// Global function to show toasts from anywhere
export function showToast(message: string, type: "success" | "error" | "info" = "info") {
    window.dispatchEvent(
        new CustomEvent("show-toast", { detail: { message, type } })
    );
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: "success" | "error" | "info") => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const { message, type } = (e as CustomEvent).detail;
            addToast(message, type);
        };

        window.addEventListener("show-toast", handler);
        return () => window.removeEventListener("show-toast", handler);
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-slide-up backdrop-blur-sm ${toast.type === "success"
                            ? "bg-green-500/15 border-green-500/30 text-green-400"
                            : toast.type === "error"
                                ? "bg-red-500/15 border-red-500/30 text-red-400"
                                : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                        }`}
                >
                    {/* Icon */}
                    {toast.type === "success" && (
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {toast.type === "error" && (
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {toast.type === "info" && (
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
