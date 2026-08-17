/**
 * 站点合规页脚组件
 * 集中展示版权、ICP备案、公安备案、用户协议和隐私政策入口。
 */
import Image from 'next/image'
import Link from 'next/link'

import { imageUrl } from '@/lib/images'

interface ComplianceFooterProps {
  /** 额外类名，便于页面级定位 */
  className?: string
  /** 是否展示版权信息 */
  showCopyright?: boolean
  /** 展示场景：default 用于普通页面，overlay 用于图片/深色背景 */
  variant?: 'default' | 'overlay'
}

/* ========== 备案与协议配置 ========== */

const icpRecordText = '浙ICP备2026054747号-1'
const icpRecordHref = 'https://beian.miit.gov.cn/'
const policeRecordCode = '33019202003146'
const policeRecordText = `浙公网安备${policeRecordCode}号`
const policeRecordHref = `https://beian.mps.gov.cn/#/query/webSearch?code=${policeRecordCode}`

/** 站点合规页脚：统一维护备案和协议入口 */
export function ComplianceFooter({
  className = '',
  showCopyright = true,
  variant = 'default',
}: ComplianceFooterProps) {
  const isOverlay = variant === 'overlay'

  const footerBase
    = 'flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 px-6 py-[18px] pb-[22px] text-xs leading-normal max-sm:px-4'
  const footerVariant = isOverlay
    ? 'justify-start gap-x-3.5 gap-y-2 p-0 text-white/62 max-sm:p-0'
    : 'border-t border-travel-ink/6 bg-travel-surface text-travel-muted'

  const copyrightColor = isOverlay ? 'text-white/58' : 'text-travel-ocean/56'

  const linkBase
    = 'inline-flex items-center gap-1.5 no-underline transition-colors duration-[var(--motion-fast)] ease-standard motion-reduce:transition-none'
  const linkColor = isOverlay
    ? 'text-white/66 hover:text-travel-white focus-visible:outline-[rgba(255,255,255,0.72)]'
    : 'text-travel-ocean/60 hover:text-travel-ocean focus-visible:outline-primary/46'
  const linkFocus
    = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:rounded-md'

  return (
    <footer
      aria-label="网站备案与协议信息"
      className={`${footerBase} ${footerVariant} ${className}`.trim()}
    >
      {showCopyright && <span className={copyrightColor}>© 2026 Travel AI</span>}
      <a
        className={`${linkBase} ${linkColor} ${linkFocus}`}
        href={icpRecordHref}
        rel="noreferrer"
        target="_blank"
      >
        {icpRecordText}
      </a>
      <a
        className={`${linkBase} ${linkColor} ${linkFocus} gap-1.5`}
        href={policeRecordHref}
        rel="noreferrer"
        target="_blank"
      >
        <Image
          alt="公安备案图标"
          className="h-[17px] w-4 shrink-0"
          height={16}
          src={imageUrl('/images/beian-gongan.png')}
          width={16}
        />
        <span>{policeRecordText}</span>
      </a>
      <Link className={`${linkBase} ${linkColor} ${linkFocus}`} href="/terms">
        用户协议
      </Link>
      <Link className={`${linkBase} ${linkColor} ${linkFocus}`} href="/privacy">
        隐私政策
      </Link>
    </footer>
  )
}
