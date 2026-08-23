import type { Metadata } from 'next'
import Link from 'next/link'

import { ComplianceFooter } from '@/components/ComplianceFooter'
import { buildCreditsByCity } from '@/lib/credits'

export const metadata: Metadata = {
  description: '本站景点图片的来源作者与许可信息',
  title: '图片版权声明 - Travel AI',
}

export default function ImageCreditsPage() {
  const byCity = buildCreditsByCity()
  const total = byCity.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <main className="mx-auto max-w-[900px] px-6 py-12">
      <nav aria-label="面包屑" className="mb-6 text-sm text-travel-muted">
        <Link className="hover:text-travel-ocean" href="/">首页</Link>
        <span className="mx-2">/</span>
        <span>图片版权声明</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-travel-ink">图片版权声明</h1>
        <p className="mt-2 text-sm leading-relaxed text-travel-muted">
          本站景点图片共
          {' '}
          {total}
          {' '}
          张，均来自公开授权来源（以 Wikimedia Commons 为主）。此处逐一记录每张图片的来源页面、作者与许可协议，供追溯。
        </p>
      </header>

      <div className="space-y-8">
        {byCity.map(group => (
          <section key={group.city} aria-label={`${group.city}景点图片`}>
            <h2 className="mb-3 border-b border-travel-ink/6 pb-2 text-xl font-semibold text-travel-ink">
              {group.city}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.items.map(({ name, credit }) => (
                <li
                  key={credit.attractionId}
                  className="rounded-lg border border-travel-ink/6 bg-travel-surface p-3 text-sm"
                >
                  <p className="font-medium text-travel-ink">{name}</p>
                  <p className="mt-1 text-travel-muted">
                    作者：
                    {credit.author || '未知'}
                  </p>
                  <p className="mt-1 text-travel-muted">
                    许可：
                    {credit.licenseUrl
                      ? (
                          <a
                            className="text-travel-ocean underline-offset-2 hover:underline"
                            href={credit.licenseUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {credit.license}
                          </a>
                        )
                      : credit.license}
                  </p>
                  <p className="mt-1">
                    <a
                      className="text-travel-ocean underline-offset-2 hover:underline"
                      href={credit.sourcePage}
                      rel="noreferrer"
                      target="_blank"
                    >
                      来源页面 ↗
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <ComplianceFooter />
      </div>
    </main>
  )
}
