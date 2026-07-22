/**
 * 用户协议页面
 * 面向个人备案站点的基础服务条款，不公开个人主体姓名。
 */
import { Link } from 'react-router-dom'

import '@/pages/Legal/style.css'

const contactEmail = 'joygyzhi@outlook.com'

export default function Terms() {
  return (
    <main className="legal-page" aria-labelledby="terms-title">
      <div className="legal-page__inner">
        <Link className="legal-page__back" to="/">返回首页</Link>
        <article className="legal-page__card">
          <p className="legal-page__eyebrow">Terms of Service</p>
          <h1 id="terms-title" className="legal-page__title">用户协议</h1>
          <p className="legal-page__updated">更新日期：2026 年 7 月 22 日</p>
          <p className="legal-page__intro">
            欢迎使用 Travel AI。本协议适用于你访问和使用本站提供的 AI 旅行规划、天气查询、景点推荐和旅行咨询等服务。本站为个人备案网站，由 ICP 备案主体作为本站运营者负责运营。
          </p>

          <div className="legal-page__content">
            <section className="legal-page__section">
              <h2>一、服务内容</h2>
              <p>本站提供旅行目的地查询、AI 行程规划、天气信息展示、景点推荐、预算参考和旅行咨询等功能。部分内容由 AI 或第三方数据服务生成，仅用于帮助你提高旅行规划效率。</p>
            </section>

            <section className="legal-page__section">
              <h2>二、账号使用</h2>
              <p>你在注册或登录时应提供真实、合法、有效的信息，并妥善保管账号和密码。因你主动泄露账号信息或在不安全环境中使用账号导致的损失，由你自行承担。</p>
            </section>

            <section className="legal-page__section">
              <h2>三、用户行为规范</h2>
              <ul>
                <li>不得提交违法违规、侵权、骚扰、攻击、欺诈或破坏服务稳定性的内容。</li>
                <li>不得通过自动化脚本、异常高频请求或其他方式滥用本站接口和资源。</li>
                <li>不得冒用他人身份、侵犯他人隐私，或利用本站从事违反法律法规的活动。</li>
              </ul>
            </section>

            <section className="legal-page__section">
              <h2>四、AI 内容说明</h2>
              <p>AI 生成的行程、预算、路线、天气解读和旅行建议仅供参考，可能存在延迟、遗漏或不准确。实际出行前，请以官方渠道、景区公告、交通平台、酒店政策、天气预警和现场情况为准。</p>
            </section>

            <section className="legal-page__section">
              <h2>五、知识产权</h2>
              <p>本站页面设计、文案、代码组织和服务中由本站提供的内容，除依法属于第三方或用户自行提供的内容外，相关权益由本站运营者或合法权利人享有。未经许可，不得用于商业化复制、传播或改编。</p>
            </section>

            <section className="legal-page__section">
              <h2>六、服务变更与中止</h2>
              <p>本站为个人项目，可能根据维护情况、成本、第三方服务状态或法律法规要求调整、暂停或终止部分功能。我们会尽量减少对正常使用的影响。</p>
            </section>

            <section className="legal-page__section">
              <h2>七、责任限制</h2>
              <p>因网络故障、第三方服务异常、政策变化、天气变化、景区临时调整、交通延误或不可抗力导致的信息变化或出行损失，本站不承担超出法律规定范围的责任。</p>
            </section>

            <section className="legal-page__section">
              <h2>八、联系我们</h2>
              <p>
                如你对本协议有疑问，可以发送邮件至
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                与本站运营者联系。
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
