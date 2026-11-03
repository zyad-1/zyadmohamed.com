export default function Footer() {
  return (
    <footer className="glass px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-4 mt-12 mb-6 mx-6 rounded-xl">
      <a href="#" className="flex items-center">
        <img
          src="/logo/logo-white.png"
          alt="Logo"
          className="h-6 w-auto object-contain"
        />
      </a>
      <span className="font-mono font-medium text-[10px] tracking-[0.3em] uppercase text-authority">
        Your Content. Elevated.
      </span>
      <span className="font-mono text-[10px] tracking-[0.2em] text-luminance/50">
        © 2025 — All Rights Reserved
      </span>
    </footer>
  )
}
