'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Calendar, MessageCircle, ShieldCheck, Clock, Video } from 'lucide-react'
import { trackFunnelEvent } from '@/lib/analytics'

export default function BookedThankYouPage() {
  const [clientName, setClientName] = useState('')
  const [bookedDate, setBookedDate] = useState('')

  useEffect(() => {
    trackFunnelEvent('Schedule_Call')
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const n = sp.get('name') || ''
      const d = sp.get('date') || ''
      if (n) setClientName(n)
      if (d) setBookedDate(d)
    }
  }, [])

  const waText = encodeURIComponent(
    `أهلاً APX،${clientName ? ` أنا ${clientName}،` : ''} قمت بحجز المكالمة الاستراتيجية${
      bookedDate ? ` (${bookedDate})` : ''
    } وأؤكد حضوري للموعد.`
  )
  const whatsappConfirmUrl = `https://wa.me/201007311562?text=${waText}`

  return (
    <main
      dir="rtl"
      className="min-h-screen flex flex-col justify-between px-6 py-10 font-ar cursor-auto relative overflow-hidden"
    >
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo/logo-white.png"
            alt="APX"
            className="h-7 md:h-8 w-auto object-contain"
          />
        </Link>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
          تم تأكيد الطلب
        </span>
      </header>

      {/* Main Confirmation Card */}
      <div className="my-12 max-w-2xl w-full mx-auto">
        <div className="glass rounded-3xl p-8 md:p-12 border border-authority/35 shadow-[0_0_90px_rgba(139,92,246,0.2)] space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-authority/25 rounded-full blur-3xl pointer-events-none" />

          {/* Badge & Icon */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-white leading-snug">
              تم حجز مكالمتك الاستراتيجية بنجاح{clientName ? ` يا ${clientName}` : ''}!
            </h1>

            <p className="text-sm md:text-base text-luminance/80 max-w-lg leading-relaxed">
              تبقى خطوة واحدة سريعة لتثبيت موعدك نهائياً في جدول{' '}
              <strong className="text-white font-mono">APX</strong> واستلام رابط الاجتماع:
            </p>
          </div>

          {/* Step 1: WhatsApp Confirmation CTA */}
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/35 p-6 text-center space-y-4">
            <p className="text-xs md:text-sm font-bold text-emerald-200">
              اضغط على الزر بالأسفل لإرسال رسالة تأكيد الحضور على واتساب
            </p>
            <a
              href={whatsappConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-2xl bg-[#25D366] hover:bg-[#1ebe5a] text-[#080608] font-bold text-base md:text-lg py-4 px-8 transition-all duration-300 shadow-[0_0_35px_rgba(37,211,102,0.35)] flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6 fill-current" />
              <span>اضغط هنا لتأكيد موعدك عبر واتساب</span>
            </a>
          </div>

          {/* 3 Pre-Call Preparation Points */}
          <div className="space-y-4 pt-4 border-t border-authority/20">
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-authority" />
              <span>3 نقاط سريعة قبل المكالمة:</span>
            </h2>

            <div className="grid gap-3.5">
              <div className="rounded-2xl bg-void/70 border border-authority/20 p-4 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-authority/20 border border-authority/35 flex items-center justify-center text-authority font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                  01
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-authority" />
                    <span>قبول دعوة التقويم في بريدك الإلكتروني</span>
                  </p>
                  <p className="text-xs text-luminance/75 leading-relaxed">
                    افتح الرسالة التي وصلت لبريدك الإلكتروني واضغط على قبول الدعوة لإضافة الموعد لتقويمك.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-void/70 border border-authority/20 p-4 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-authority/20 border border-authority/35 flex items-center justify-center text-authority font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                  02
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-authority" />
                    <span>التواجد في مكان هادئ وقت الاجتماع</span>
                  </p>
                  <p className="text-xs text-luminance/75 leading-relaxed">
                    سنستعرض خلال الـ 30 دقيقة وضع حضورك الرقمي الحالي ونرسم ملامح خطة الـ 90 يوماً على الشاشة.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-void/70 border border-authority/20 p-4 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-authority/20 border border-authority/35 flex items-center justify-center text-authority font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                  03
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-authority" />
                    <span>الالتزام بالموعد المحدد</span>
                  </p>
                  <p className="text-xs text-luminance/75 leading-relaxed">
                    إذا طرأ أي ظرف يمنعك من الحضور يرجى إبلاغنا عبر واتساب قبل الموعد بـ 24 ساعة على الأقل.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-luminance/60 hover:text-white transition-colors"
            >
              ← العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-luminance/40 font-ar">
        © 2025 APX — جميع الحقوق محفوظة.
      </footer>
    </main>
  )
}
