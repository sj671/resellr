"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Cool SnapFlip banner with colors
    console.log(`
%c
███████╗███╗   ██╗ █████╗ ██████╗ ███████╗██╗     ██╗██████╗ 
██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔════╝██║     ██║██╔══██╗
███████╗██╔██╗ ██║███████║██████╔╝█████╗  ██║     ██║██████╔╝
╚════██║██║╚██╗██║██╔══██║██╔═══╝ ██╔══╝  ██║     ██║██╔═══╝ 
███████║██║ ╚████║██║  ██║██║     ██║     ███████╗██║██║     
╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝╚═╝`,
'color: #8b5cf6; font-family: monospace; font-size: 12px; font-weight: bold;');
    
    // Additional welcome message
    console.log('%cReady to flip some items? Let\'s get started!', 'color: #06b6d4; font-size: 14px; font-weight: bold;');
  }, []);
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Snapflip</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="/signup" className="px-4 py-2 rounded bg-foreground text-background">
            Get started
          </a>
          <a href="/login" className="px-4 py-2 rounded border">
            Log in
          </a>
        </div>
      </section>
    </div>
  );
}
