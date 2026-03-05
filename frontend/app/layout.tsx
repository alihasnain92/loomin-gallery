import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "AI Prompt Gallery",
  description: "A full-stack portfolio project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen flex flex-col antialiased">
        <Navbar />
        {/* This {children} is where your individual pages will render */}
        <div className="flex-grow">
          {children}
        </div>
        {/* Footer */}
        <footer className="border-t border-gray-800 bg-gray-950 px-6 py-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Loomin<span className="text-blue-500">.ai</span> &mdash; Built by Ali Hasnain
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/alihasnain92"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/alihasnainn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}