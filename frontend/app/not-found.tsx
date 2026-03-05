import Link from "next/link";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter mb-4 opacity-10">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Page Not Found</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg">
                Oops! The page you were looking for doesn't exist. It might have been moved or deleted.
            </p>

            <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 inline-flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Gallery
            </Link>
        </main>
    );
}
