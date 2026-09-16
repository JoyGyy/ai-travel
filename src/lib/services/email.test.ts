import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockQuery = vi.fn();
vi.mock('../db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn((..._args: unknown[]) => ({
  sendMail: mockSendMail,
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn((...args: unknown[]) =>
      mockCreateTransport(...args),
    ),
  },
}));

vi.mock('../env', () => ({
  env: {
    SMTP_FROM: '"远方 AI 旅行" <service@joygytrip.cn>',
    SMTP_HOST: 'smtp.exmail.qq.com',
    SMTP_PASS: 'mock-pass',
    SMTP_PORT: 465,
    SMTP_SECURE: true,
    SMTP_USER: 'service@joygytrip.cn',
  },
}));

import {
  generateVerificationCode,
  getEmailTransporter,
  saveVerificationCode,
  sendVerificationCodeEmail,
  verifyAndConsumeCode,
} from './email';

describe('email 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVerificationCode', () => {
    it('生成 6 位纯数字验证码', () => {
      const code = generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe('saveVerificationCode', () => {
    it('保存验证码至数据库，标准化邮箱并设置 10 分钟有效期', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await saveVerificationCode('  Test@Example.COM ', '123456', 'register');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO email_verification_codes');
      expect(params).toEqual(['test@example.com', '123456', 'register']);
    });
  });

  describe('verifyAndConsumeCode', () => {
    it('验证码正确且未过期时返回 true 并销毁', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const isValid = await verifyAndConsumeCode(
        'test@example.com',
        '123456',
        'register',
      );

      expect(isValid).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('DELETE FROM email_verification_codes');
      expect(params).toEqual(['test@example.com', 'register', '123456']);
    });

    it('验证码错误或已过期时返回 false', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const isValid = await verifyAndConsumeCode(
        'test@example.com',
        'wrong',
        'register',
      );

      expect(isValid).toBe(false);
    });
  });

  describe('sendVerificationCodeEmail', () => {
    it('调用 nodemailer 发送包含验证码的美化 HTML 邮件', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'msg-123' });

      const result = await sendVerificationCodeEmail(
        'user@test.com',
        '654321',
        'register',
      );

      expect(result.messageId).toBe('msg-123');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"远方 AI 旅行" <service@joygytrip.cn>',
          to: 'user@test.com',
          subject: '【远方 AI 旅行】注册账号验证码',
          text: expect.stringContaining('654321'),
          html: expect.stringContaining('654321'),
        }),
      );
    });
  });
});
