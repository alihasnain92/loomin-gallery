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
      </body>
    </html>
  );
}