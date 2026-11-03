import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center font-ar cursor-auto"
    >
      <img
        src="/logo/logo-primary.png"
        alt="APX"
        className="h-24 md:h-32 w-auto object-contain opacity-30"
      />
      <p className="text-lg font-bold text-white">هذه الصفحة غير موجودة — 404</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-authority hover:bg-crown text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-300"
      >
        العودة للصفحة الرئيسية ←
      </Link>
    </main>
  )
}
