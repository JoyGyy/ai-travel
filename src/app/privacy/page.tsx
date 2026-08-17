/**
 * 隐私政策页面
 * 说明个人备案站点在旅行规划场景下的基础信息处理方式。
 */
import Link from 'next/link'

const contactEmail = 'joygyzhi@outlook.com'

export default function Privacy() {
  return (
    <main
      aria-labelledby="privacy-title"
      className="min-h-full py-[clamp(32px,6vw,72px)] sm:py-6 px-6 sm:px-4 text-travel-ink"
      style={{
        background:
          'radial-gradient(circle, rgba(28, 25, 23, 0.06) 1px, transparent 1px) 18px 18px, linear-gradient(180deg, #fffaf4 0%, #fafaf8 46%, #f8fafc 100%)',
      }}
    >
      <div className="max-w-[880px] mx-auto">
        <Link
          className="inline-flex items-center mb-[18px] text-travel-ocean/68 text-[13px] font-extrabold no-underline transition-colors motion-reduce:transition-none hover:text-travel-ocean focus-visible:outline-2 focus-visible:outline-primary/46 focus-visible:outline-offset-4 focus-visible:rounded-md"
          href="/"
        >
          返回首页
        </Link>
        <article className="p-[clamp(24px,5vw,44px)] border border-travel-ink/6 sm:rounded-[28px] rounded-[22px] bg-white/90 shadow-sm">
          <p className="m-0 mb-2.5 text-primary text-xs font-black tracking-[0.12em] uppercase">
            Privacy Policy
          </p>
          <h1
            className="m-0 text-travel-ocean text-[clamp(28px,5vw,42px)] font-black tracking-[-0.03em] leading-[1.15]"
            id="privacy-title"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            隐私政策
          </h1>
          <p className="mt-3 m-0 text-travel-muted text-[13px]">更新日期：2026 年 7 月 22 日</p>
          <p className="mt-[26px] m-0 p-4 px-[18px] rounded-[18px] text-travel-ocean/76 bg-primary/8 leading-[1.8]">
            Travel AI 尊重你的个人信息和隐私。本政策说明本站在提供 AI
            旅行规划、天气查询、景点推荐和旅行咨询服务时如何收集、使用和保护必要信息。本站为个人备案网站，由
            ICP 备案主体作为本站运营者负责运营。
          </p>

          <div className="mt-[30px]">
            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                一、我们可能收集的信息
              </h2>
              <ul className="m-0 pl-5">
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  账号信息：用户名、登录状态和认证令牌。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  旅行规划信息：目的地、预算、天数、出行偏好、行程输入和生成结果。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  对话信息：你在 AI 咨询中主动输入的问题、上下文和系统返回内容。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  查询信息：天气查询城市、景点浏览和基础操作记录。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  技术信息：浏览器类型、访问时间、网络请求状态和必要的错误日志。
                </li>
              </ul>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                二、我们如何使用信息
              </h2>
              <ul className="m-0 pl-5">
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  用于完成账号登录、身份识别和基础安全保护。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  用于生成旅行行程、预算参考、景点推荐和 AI 咨询回复。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  用于查询天气、改善页面体验、排查故障和维护服务稳定。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  用于遵守法律法规、备案管理和必要的安全审计要求。
                </li>
              </ul>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                三、本地存储
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                本站前端会使用浏览器本地存储保存登录状态，例如
                `travel_auth`。你可以通过退出登录、清理浏览器缓存或删除站点数据来移除本地保存的信息。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                四、第三方服务
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                为提供 AI
                生成、天气查询、异常监控、服务器托管等能力，本站可能将必要请求数据发送给相关第三方服务。我们只会在实现功能所需范围内处理这些信息。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                五、信息保护
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                我们会采取合理的技术和管理措施保护信息安全，例如访问控制、认证校验、接口限流和 HTTPS
                传输配置。但请理解，互联网服务无法保证绝对安全。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                六、你的权利
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                你可以通过本政策中的联系方式请求查询、更正或删除与账号相关的信息。为保护账号安全，我们可能需要先验证请求人与账号之间的关系。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                七、未成年人使用
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                未成年人应在监护人指导下使用本站服务。如果监护人认为未成年人向本站提供了不适当的信息，可以通过邮箱联系我们处理。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                八、政策更新
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                我们可能根据功能变化、法律法规或运营需要更新本政策。更新后的政策将在本页面展示，并自发布时生效。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                九、联系我们
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                如你希望咨询、投诉或行使个人信息相关权利，请发送邮件至
                <a
                  className="text-primary font-extrabold no-underline hover:underline focus-visible:outline-2 focus-visible:outline-primary/46 focus-visible:outline-offset-4 focus-visible:rounded-md"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
                。
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
