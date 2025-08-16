import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t py-8 mt-10">
      <div className="container text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-muted-foreground">© {new Date().getFullYear()} Snapflip</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}


