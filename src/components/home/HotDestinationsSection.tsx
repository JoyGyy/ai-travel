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
          className="flex items-center gap-3 font-serif text-2xl font-bold text-stone-900"
          id="hot-dest-title"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
            <Flame size={20} />
          </span>
          <span>热门灵感目的地</span>
        </h2>
        <Link
          className="group flex items-center gap-1 text-xs font-bold text-emerald-800 transition-colors hover:text-emerald-900"
          href="/attractions"
        >
          探索全部目的地
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {hotDestinations.map((dest, index) => (
          <Link
            className="group block overflow-hidden rounded-3xl bg-[#FDFBF7] border border-stone-200/90 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-700/60 hover:shadow-xl scroll-reveal"
            data-delay={index}
            href={`/detail?city=${encodeURIComponent(dest.name)}`}
            key={dest.name}
          >
            <div className="relative h-[230px] w-full overflow-hidden">
              <Image
                alt={dest.name}
                className="object-cover transition-transform duration-700 group-hover:scale-108"
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={dest.img}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
              <Badge className="absolute left-3.5 top-3.5 bg-white/95 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-md rounded-full border border-stone-200">
                🌿
                {' '}
                {dest.tag}
              </Badge>
              <Badge className="absolute bottom-3.5 right-3.5 border-0 bg-stone-950/70 text-xs font-bold text-amber-300 backdrop-blur-md rounded-full px-2.5 py-0.5" variant="outline">
                {dest.temp}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4.5">
              <span className="font-serif text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">{dest.name}</span>
              <span className="text-base font-black text-emerald-800">{dest.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
