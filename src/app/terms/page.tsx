/**
 * 用户协议页面
 * 面向个人备案站点的基础服务条款，不公开个人主体姓名。
 */
import Link from 'next/link'

const contactEmail = 'joygyzhi@outlook.com'

export default function Terms() {
  return (
    <main
      className="min-h-full py-[clamp(32px,6vw,72px)] sm:py-6 px-6 sm:px-4 text-travel-ink"
      style={{
        background:
          'radial-gradient(circle, rgba(28, 25, 23, 0.06) 1px, transparent 1px) 18px 18px, linear-gradient(180deg, #fffaf4 0%, #fafaf8 46%, #f8fafc 100%)',
      }}
    >
      <div className="max-w-[880px] mx-auto">
        <Link
          className="inline-flex items-center mb-[18px] text-travel-ocean/68 text-3.25 font-extrabold no-underline transition-colors motion-reduce:transition-none hover:text-travel-ocean focus-visible:outline-2 focus-visible:outline-primary/46 focus-visible:outline-offset-4 focus-visible:rounded-md"
          href="/"
        >
          返回首页
        </Link>
        <article className="p-[clamp(24px,5vw,44px)] border border-travel-ink/6 sm:rounded-[28px] rounded-[22px] bg-white/90 shadow-sm">
          <p className="m-0 mb-2.5 text-primary text-xs font-black tracking-[0.12em] uppercase">
            Terms of Service
          </p>
          <h1
            className="m-0 text-travel-ocean text-[clamp(28px,5vw,42px)] font-black tracking-[-0.03em] leading-[1.15]"
            id="terms-title"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            用户协议
          </h1>
          <p className="mt-3 m-0 text-travel-muted text-3.25">更新日期：2026 年 7 月 22 日</p>
          <p className="mt-[26px] m-0 p-4 px-[18px] rounded-[18px] text-travel-ocean/76 bg-primary/8 leading-[1.8]">
            欢迎使用 Travel AI。本协议适用于你访问和使用本站提供的 AI
            旅行规划、天气查询、景点推荐和旅行咨询等服务。本站为个人备案网站，由 ICP
            备案主体作为本站运营者负责运营。
          </p>

          <div className="mt-[30px]">
            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                一、服务内容
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                本站提供旅行目的地查询、AI
                行程规划、天气信息展示、景点推荐、预算参考和旅行咨询等功能。部分内容由 AI
                或第三方数据服务生成，仅用于帮助你提高旅行规划效率。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                二、账号使用
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                你在注册或登录时应提供真实、合法、有效的信息，并妥善保管账号和密码。因你主动泄露账号信息或在不安全环境中使用账号导致的损失，由你自行承担。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                三、用户行为规范
              </h2>
              <ul className="m-0 pl-5">
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  不得提交违法违规、侵权、骚扰、攻击、欺诈或破坏服务稳定性的内容。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  不得通过自动化脚本、异常高频请求或其他方式滥用本站接口和资源。
                </li>
                <li className="text-travel-ocean/72 text-sm leading-[1.9]">
                  不得冒用他人身份、侵犯他人隐私，或利用本站从事违反法律法规的活动。
                </li>
              </ul>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                四、AI 内容说明
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                AI
                生成的行程、预算、路线、天气解读和旅行建议仅供参考，可能存在延迟、遗漏或不准确。实际出行前，请以官方渠道、景区公告、交通平台、酒店政策、天气预警和现场情况为准。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                五、知识产权
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                本站页面设计、文案、代码组织和服务中由本站提供的内容，除依法属于第三方或用户自行提供的内容外，相关权益由本站运营者或合法权利人享有。未经许可，不得用于商业化复制、传播或改编。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                六、服务变更与中止
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                本站为个人项目，可能根据维护情况、成本、第三方服务状态或法律法规要求调整、暂停或终止部分功能。我们会尽量减少对正常使用的影响。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                七、责任限制
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                因网络故障、第三方服务异常、政策变化、天气变化、景区临时调整、交通延误或不可抗力导致的信息变化或出行损失，本站不承担超出法律规定范围的责任。
              </p>
            </section>

            <section className="mt-7 pt-6 border-t border-travel-ink/6 [&:first-child]:mt-0 [&:first-child]:pt-0 [&:first-child]:border-t-0">
              <h2 className="m-0 mb-3 text-travel-ocean text-lg font-black">
                八、联系我们
              </h2>
              <p className="m-0 text-travel-ocean/72 text-sm leading-[1.9] [&+p]:mt-2.5">
                如你对本协议有疑问，可以发送邮件至
                <a
                  className="text-primary font-extrabold no-underline hover:underline focus-visible:outline-2 focus-visible:outline-primary/46 focus-visible:outline-offset-4 focus-visible:rounded-md"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
                与本站运营者联系。
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
