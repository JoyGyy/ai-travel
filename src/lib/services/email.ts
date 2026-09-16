/**
 * 邮件发送服务
 * 基于 SMTP (Nodemailer) 发送注册验证码、密码找回等系统邮件
 */
import nodemailer, { type Transporter } from 'nodemailer';

import { query } from '../db';
import { env } from '../env';

let cachedTransporter: Transporter | null = null;

/** 获取或创建 Nodemailer Transporter 单例 */
export function getEmailTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('邮件服务未配置（缺少 SMTP 环境变量）');
  }

  cachedTransporter = nodemailer.createTransport({
    auth: {
      pass: env.SMTP_PASS,
      user: env.SMTP_USER,
    },
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
  });

  return cachedTransporter;
}

/** 生成 6 位纯数字验证码 */
export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type EmailCodeType = 'register' | 'reset_password';

/** 保存验证码至数据库（有效期 10 分钟，支持同邮箱覆盖更新） */
export async function saveVerificationCode(
  email: string,
  code: string,
  type: EmailCodeType = 'register',
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await query(
    `INSERT INTO email_verification_codes (email, code, type, expires_at, created_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', NOW())
     ON CONFLICT (email, type)
     DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes', created_at = NOW()`,
    [normalizedEmail, code, type],
  );
}

/** 校验并销毁验证码（一次性使用，成功即删除） */
export async function verifyAndConsumeCode(
  email: string,
  code: string,
  type: EmailCodeType = 'register',
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  const result = await query(
    `DELETE FROM email_verification_codes
     WHERE email = $1 AND type = $2 AND code = $3 AND expires_at > NOW()
     RETURNING id`,
    [normalizedEmail, type, trimmedCode],
  );

  return result.rows.length > 0;
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationCodeEmail(
  toEmail: string,
  code: string,
  type: EmailCodeType = 'register',
): Promise<{ messageId: string }> {
  const transporter = getEmailTransporter();
  const from = env.SMTP_FROM || `"远方 AI 旅行" <${env.SMTP_USER}>`;

  const isRegister = type === 'register';
  const actionName = isRegister ? '注册账号' : '重置密码';
  const subject = `【远方 AI 旅行】${actionName}验证码`;

  const text = `您好！您正在申请${actionName}，验证码为：${code}，10 分钟内有效。如非本人操作，请忽略此邮件。`;

  const html = `
    <div style="max-width: 520px; margin: 0 auto; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #0d9488;"></span>
        <span style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: 0.5px;">远方 AI 旅行 · Travel AI</span>
      </div>

      <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0;">
        ${actionName}安全验证
      </h2>

      <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        您好，我们收到了您在【远方 AI 旅行】的${actionName}申请。请在验证页面输入下方 6 位数字验证码：
      </p>

      <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border: 1.5px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f766e; display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
          ${code}
        </span>
      </div>

      <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin: 0 0 8px 0;">
        ⏱️ 验证码有效期为 <strong>10 分钟</strong>。为保障账号安全，请勿向任何人泄露此验证码。
      </p>
      <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0 0 24px 0;">
        如非您本人操作，请忽略此邮件，您的账号信息不会被更改。
      </p>

      <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          远方 AI 旅行 · 让每一次出发都更从容 · <a href="https://joygytrip.cn" style="color: #0d9488; text-decoration: none;">joygytrip.cn</a>
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    html,
    subject,
    text,
    to: toEmail,
  });

  return { messageId: info.messageId };
}
