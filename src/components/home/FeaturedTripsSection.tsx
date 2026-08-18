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
    <section aria-labelledby="featured-title" className="relative mx-auto max-w-[1200px] px-6 py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
      </div>

      <div className="mb-8 flex items-center justify-between scroll-reveal">
        <h2
          className="flex items-center gap-3 text-2xl font-bold"
          id="featured-title"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg">
            <Star aria-hidden="true" size={20} />
          </span>
          <span className="bg-gradient-to-r from-travel-ink to-travel-ink/70 bg-clip-text text-transparent">
            精选推荐
          </span>
        </h2>
        <Link
          className="group flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
          href="/detail"
        >
          更多行程
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featuredTrips.map((trip, index) => (
          <Link
            className="group block overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-2 hover:ring-2 hover:ring-cyan-200 scroll-reveal"
            data-delay={index}
            href={`/detail?city=${encodeURIComponent(trip.city)}`}
            key={trip.title}
          >
            <div className="relative h-[200px] w-full overflow-hidden">
              <Image
                alt={trip.title}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={trip.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Badge className="absolute left-3 top-3 bg-white/90 text-xs font-bold text-primary shadow-sm backdrop-blur-sm">
                {trip.city}
              </Badge>
              <div className="absolute bottom-3 right-3 flex items-center gap-1">
                <Badge className="border-0 bg-black/60 text-xs text-white backdrop-blur-sm" variant="outline">
                  <Star className="mr-0.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {trip.rating}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-base font-bold text-travel-ink">{trip.title}</h3>
              <p className="mb-3 text-xs text-travel-muted">{trip.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-primary">
                    ¥
                    {trip.price}
                  </span>
                  <span className="text-xs text-travel-muted line-through">
                    ¥
                    {trip.originalPrice}
                  </span>
                </div>
                <Badge className="bg-red-50 text-red-600" variant="outline">
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
