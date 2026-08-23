'use client'

/**
 * 首页 — 精选推荐区块
 */
import { Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { featuredTrips } from '@/app/home-data'
import { Badge } from '@/components/ui/badge'

export function FeaturedTripsSection() {
  return (
    <section className="relative mx-auto max-w-[1200px] px-6 py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
      </div>

      <div className="mb-8 flex items-center justify-between scroll-reveal">
        <h2
          className="flex items-center gap-3 font-serif text-2xl font-bold text-stone-900"
          id="featured-title"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-800/20">
            <Star size={20} />
          </span>
          <span>精选手账路线</span>
        </h2>
        <Link
          className="group flex items-center gap-1 text-xs font-bold text-emerald-800 transition-colors hover:text-emerald-900"
          href="/detail"
        >
          更多精选手账
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featuredTrips.map((trip, index) => (
          <Link
            className="group block overflow-hidden rounded-3xl bg-[#FDFBF7] border border-stone-200/90 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-700/60 hover:shadow-xl scroll-reveal"
            data-delay={index}
            href={`/detail?city=${encodeURIComponent(trip.city)}`}
            key={trip.title}
          >
            <div className="relative h-[210px] w-full overflow-hidden">
              <Image
                alt={trip.title}
                className="object-cover transition-transform duration-700 group-hover:scale-108"
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={trip.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
              <Badge className="absolute left-3.5 top-3.5 bg-white/95 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-md rounded-full border border-stone-200">
                🌿
                {' '}
                {trip.city}
              </Badge>
              <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1">
                <Badge className="border-0 bg-stone-950/70 text-xs font-bold text-amber-300 backdrop-blur-md rounded-full px-2.5 py-0.5" variant="outline">
                  <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                  {trip.rating}
                </Badge>
              </div>
            </div>
            <div className="p-5">
              <h3 className="mb-1 font-serif text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">{trip.title}</h3>
              <p className="mb-4 text-xs text-stone-500 line-clamp-2 leading-relaxed">{trip.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-stone-200/70">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-emerald-800">
                    ¥
                    {trip.price}
                  </span>
                  <span className="text-xs text-stone-400 line-through">
                    ¥
                    {trip.originalPrice}
                  </span>
                </div>
                <Badge className="bg-amber-100 text-amber-900 border border-amber-300/80 rounded-full font-bold text-[11px]" variant="outline">
                  {trip.tag}
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
