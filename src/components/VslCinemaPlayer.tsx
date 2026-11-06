'use client'

import React, { useState } from 'react'
import { Play, Volume2, Sparkles } from 'lucide-react'

export function resolveVslEmbed(rawUrl: string): {
  type: 'youtube' | 'vimeo' | 'loom' | 'video' | 'none'
  src: string
  youtubeThumb?: string
} {
  const url = String(rawUrl || '').trim()
  if (!url) return { type: 'none', src: '' }

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  )
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1]
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      youtubeThumb: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    }
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`,
    }
  }

  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
  if (loomMatch && loomMatch[1]) {
    return {
      type: 'loom',
      src: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`,
    }
  }

  return { type: 'video', src: url }
}

interface VslCinemaPlayerProps {
  videoUrl: string
  posterUrl?: string
  caption?: string
  onPlay?: () => void
}

export default function VslCinemaPlayer({
  videoUrl,
  posterUrl,
  caption,
  onPlay,
}: VslCinemaPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const embed = resolveVslEmbed(videoUrl)
  const effectivePoster = posterUrl || embed.youtubeThumb || ''

  const handleStart = () => {
    setPlaying(true)
    onPlay?.()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative aspect-video rounded-3xl overflow-hidden border border-authority/35 bg-[#0A0612] shadow-[0_24px_70px_-15px_rgba(139,92,246,0.32)]">
        {playing && embed.type !== 'none' ? (
          embed.type === 'video' ? (
            <video
              src={embed.src}
              poster={effectivePoster || undefined}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <iframe
              src={embed.src}
              title={caption || 'APX Strategy Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )
        ) : (
          <button
            type="button"
            onClick={handleStart}
            className="w-full h-full relative flex flex-col items-center justify-center p-6 md:p-10 text-center group cursor-pointer bg-gradient-to-b from-[#170E29] via-[#0B0614] to-[#130A24] overflow-hidden"
          >
            {effectivePoster && (
              <img
                src={effectivePoster}
                alt={caption || 'APX Strategy Video'}
                className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 group-hover:opacity-65 transition-all duration-500"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#08050E]/90 via-[#08050E]/35 to-transparent pointer-events-none" />

            {/* Top subtle pill */}
            <div className="relative z-10 mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] text-white/90 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>تأكد من تشغيل الصوت — شرح عملي مختصر</span>
            </div>

            {/* Center Play Button */}
            <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white flex items-center justify-center shadow-[0_0_45px_rgba(139,92,246,0.75)] group-hover:scale-110 transition-transform duration-300 border border-white/30">
              <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" />
            </div>

            {caption && (
              <p className="relative z-10 mt-5 text-xs sm:text-sm md:text-base font-bold text-white max-w-lg leading-relaxed drop-shadow">
                {caption}
              </p>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
