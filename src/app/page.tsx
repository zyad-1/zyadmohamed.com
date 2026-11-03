import Nav        from '@/components/Nav'
import Hero       from '@/components/Hero'
import Marquee    from '@/components/Marquee'
import About      from '@/components/About'
import Services   from '@/components/Services'
import Work       from '@/components/Work'
import ArabicStrip from '@/components/ArabicStrip'
import Contact    from '@/components/Contact'
import Footer     from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Services />
      <Work />
      <ArabicStrip />
      <Contact />
      <Footer />
    </main>
  )
}
