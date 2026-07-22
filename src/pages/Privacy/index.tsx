/**
 * 隐私政策页面
 * 说明个人备案站点在旅行规划场景下的基础信息处理方式。
 */
import { Link } from 'react-router-dom'

import '@/pages/Legal/style.css'

const contactEmail = 'joygyzhi@outlook.com'

export default function Privacy() {
  return (
    <main className="legal-page" aria-labelledby="privacy-title">
      <div className="legal-page__inner">
        <Link className="legal-page__back" to="/">返回首页</Link>
        <article className="legal-page__card">
          <p className="legal-page__eyebrow">Privacy Policy</p>
          <h1 id="privacy-title" className="legal-page__title">隐私政策</h1>
          <p className="legal-page__updated">更新日期：2026 年 7 月 22 日</p>
          <p className="legal-page__intro">
            Travel AI 尊重你的个人信息和隐私。本政策说明本站在提供 AI 旅行规划、天气查询、景点推荐和旅行咨询服务时如何收集、使用和保护必要信息。本站为个人备案网站，由 ICP 备案主体作为本站运营者负责运营。
          </p>

          <div className="legal-page__content">
            <section className="legal-page__section">
              <h2>一、我们可能收集的信息</h2>
              <ul>
                <li>账号信息：用户名、登录状态和认证令牌。</li>
                <li>旅行规划信息：目的地、预算、天数、出行偏好、行程输入和生成结果。</li>
                <li>对话信息：你在 AI 咨询中主动输入的问题、上下文和系统返回内容。</li>
                <li>查询信息：天气查询城市、景点浏览和基础操作记录。</li>
                <li>技术信息：浏览器类型、访问时间、网络请求状态和必要的错误日志。</li>
              </ul>
            </section>

            <section className="legal-page__section">
              <h2>二、我们如何使用信息</h2>
              <ul>
                <li>用于完成账号登录、身份识别和基础安全保护。</li>
                <li>用于生成旅行行程、预算参考、景点推荐和 AI 咨询回复。</li>
                <li>用于查询天气、改善页面体验、排查故障和维护服务稳定。</li>
                <li>用于遵守法律法规、备案管理和必要的安全审计要求。</li>
              </ul>
            </section>

            <section className="legal-page__section">
              <h2>三、本地存储</h2>
              <p>本站前端会使用浏览器本地存储保存登录状态，例如 `travel_auth`。你可以通过退出登录、清理浏览器缓存或删除站点数据来移除本地保存的信息。</p>
            </section>

            <section className="legal-page__section">
              <h2>四、第三方服务</h2>
              <p>为提供 AI 生成、天气查询、异常监控、服务器托管等能力，本站可能将必要请求数据发送给相关第三方服务。我们只会在实现功能所需范围内处理这些信息。</p>
            </section>

            <section className="legal-page__section">
              <h2>五、信息保护</h2>
              <p>我们会采取合理的技术和管理措施保护信息安全，例如访问控制、认证校验、接口限流和 HTTPS 传输配置。但请理解，互联网服务无法保证绝对安全。</p>
            </section>

            <section className="legal-page__section">
              <h2>六、你的权利</h2>
              <p>你可以通过本政策中的联系方式请求查询、更正或删除与账号相关的信息。为保护账号安全，我们可能需要先验证请求人与账号之间的关系。</p>
            </section>

            <section className="legal-page__section">
              <h2>七、未成年人使用</h2>
              <p>未成年人应在监护人指导下使用本站服务。如果监护人认为未成年人向本站提供了不适当的信息，可以通过邮箱联系我们处理。</p>
            </section>

            <section className="legal-page__section">
              <h2>八、政策更新</h2>
              <p>我们可能根据功能变化、法律法规或运营需要更新本政策。更新后的政策将在本页面展示，并自发布时生效。</p>
            </section>

            <section className="legal-page__section">
              <h2>九、联系我们</h2>
              <p>
                如你希望咨询、投诉或行使个人信息相关权利，请发送邮件至
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                。
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
