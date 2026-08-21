'use client'

/**
 * 首页 — 热门目的地区块
 */
import { Flame } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { hotDestinations } from '@/app/home-data'
import { Badge } from '@/components/ui/badge'

export function HotDestinationsSection() {
  return (
    <section className="relative mx-auto max-w-[1200px] px-6 py-12">
      <div className="mb-8 flex items-center justify-between scroll-reveal">
        <h2
          className="flex items-center gap-3 text-2xl font-bold"
          id="hot-dest-title"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg">
            <Flame size={20} />
          </span>
          <span className="bg-gradient-to-r from-travel-ink to-travel-ink/70 bg-clip-text text-transparent">
            热门目的地
          </span>
        </h2>
        <Link
          className="group flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
          href="/attractions"
        >
          查看更多
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {hotDestinations.map((dest, index) => (
          <Link
            className="group block overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-2 hover:ring-2 hover:ring-teal-200 scroll-reveal"
            data-delay={index}
            href={`/detail?city=${encodeURIComponent(dest.name)}`}
            key={dest.name}
          >
            <div className="relative h-[220px] w-full overflow-hidden">
              <Image
                alt={dest.name}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={dest.img}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Badge className="absolute left-3 top-3 bg-white/90 text-xs font-bold text-primary shadow-sm backdrop-blur-sm">
                {dest.tag}
              </Badge>
              <Badge className="absolute bottom-3 right-3 border-0 bg-black/60 text-xs font-medium text-white backdrop-blur-sm" variant="outline">
                {dest.temp}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-lg font-bold text-travel-ink">{dest.name}</span>
              <span className="text-lg font-bold text-primary">{dest.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
