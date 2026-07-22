/**
 * 站点合规页脚组件
 * 集中展示版权、ICP备案、公安备案、用户协议和隐私政策入口。
 */
import { Link } from 'react-router-dom'

import { imageUrl } from '@/lib/images'

import './style.css'

interface ComplianceFooterProps {
  /** 展示场景：default 用于普通页面，overlay 用于图片/深色背景 */
  variant?: 'default' | 'overlay'
  /** 是否展示版权信息 */
  showCopyright?: boolean
  /** 额外类名，便于页面级定位 */
  className?: string
}

/* ========== 备案与协议配置 ========== */

const icpRecordText = '浙ICP备2026054747号-1'
const icpRecordHref = 'https://beian.miit.gov.cn/'
const policeRecordCode = '33019202003146'
const policeRecordText = `浙公网安备${policeRecordCode}号`
const policeRecordHref = `https://beian.mps.gov.cn/#/query/webSearch?code=${policeRecordCode}`

/** 站点合规页脚：统一维护备案和协议入口 */
export function ComplianceFooter({ variant = 'default', showCopyright = true, className = '' }: ComplianceFooterProps) {
  const classes = [
    'compliance-footer',
    `compliance-footer--${variant}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <footer className={classes} aria-label="网站备案与协议信息">
      {showCopyright && <span className="compliance-footer__copyright">© 2026 Travel AI</span>}
      <a className="compliance-footer__link" href={icpRecordHref} rel="noreferrer" target="_blank">
        {icpRecordText}
      </a>
      <a className="compliance-footer__link compliance-footer__police" href={policeRecordHref} rel="noreferrer" target="_blank">
        <img className="compliance-footer__police-icon" src={imageUrl('/images/beian-gongan.png')} alt="公安备案图标" />
        <span>{policeRecordText}</span>
      </a>
      <Link className="compliance-footer__link" to="/terms">用户协议</Link>
      <Link className="compliance-footer__link" to="/privacy">隐私政策</Link>
    </footer>
  )
}
