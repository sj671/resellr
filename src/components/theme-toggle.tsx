"use client";

export default function ThemeToggle() {
  // Dark-only mode for now; show a static icon for spacing consistency
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border opacity-60">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
    </span>
  );
}


