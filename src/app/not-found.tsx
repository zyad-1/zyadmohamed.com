import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-void flex flex-col items-center justify-center gap-8 px-12 text-center">
      <p className="font-mono font-semibold text-[11px] tracking-[0.35em] uppercase text-authority">404 — Not Found</p>
      <img
        src="/logo/logo-primary.png"
        alt="Logo"
        className="h-24 md:h-32 w-auto object-contain opacity-30"
      />
      <p className="font-body font-light text-luminance/75 text-lg">This page doesn't exist.</p>
      <Link
        href="/"
        className="font-mono font-semibold text-[11px] tracking-[0.2em] uppercase bg-authority/15 border border-authority/40 text-off-white px-8 py-4 rounded-lg hover:bg-authority transition-colors"
      >
        ← Back Home
      </Link>
    </main>
  )
}
