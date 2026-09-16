/**
 * 发送验证码 API 测试
 * POST /api/auth/send-code
 */
import type * as httpUtils from '@/lib/utils/http';

import { query } from '@/lib/db';
import {
  generateVerificationCode,
  saveVerificationCode,
  sendVerificationCodeEmail,
} from '@/lib/services/email';
import { POST } from './route';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/services/email', () => ({
  generateVerificationCode: vi.fn(() => '123456'),
  saveVerificationCode: vi.fn(),
  sendVerificationCodeEmail: vi.fn(),
}));

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal();
  return {
    ...actual,
    withPublicPost:
      (
        _name: string,
        _max: number,
        _windowMs: number,
        handler: (req: Request) => Promise<Response>,
      ) =>
      async (req: Request) => {
        try {
          return await handler(req);
        } catch (err) {
          return actual.errorResponse(err);
        }
      },
  };
});

const mockQuery = vi.mocked(query);
const mockSave = vi.mocked(saveVerificationCode);
const mockSend = vi.mocked(sendVerificationCodeEmail);

describe('POST /api/auth/send-code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有效未注册邮箱应成功生成并发送验证码', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    mockSave.mockResolvedValueOnce();
    mockSend.mockResolvedValueOnce({ messageId: 'm-1' });

    const req = new Request('http://localhost/api/auth/send-code', {
      body: JSON.stringify({ email: 'newuser@example.com', type: 'register' }),
      method: 'POST',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSave).toHaveBeenCalledWith(
      'newuser@example.com',
      '123456',
      'register',
    );
    expect(mockSend).toHaveBeenCalledWith(
      'newuser@example.com',
      '123456',
      'register',
    );
  });

  it('邮箱格式无效时返回 400', async () => {
    const req = new Request('http://localhost/api/auth/send-code', {
      body: JSON.stringify({ email: 'invalid-email' }),
      method: 'POST',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe('请输入有效的邮箱地址');
  });

  it('已注册邮箱申请注册验证码时返回 400', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] } as never);

    const req = new Request('http://localhost/api/auth/send-code', {
      body: JSON.stringify({ email: 'existing@example.com', type: 'register' }),
      method: 'POST',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe('该邮箱已被注册，请直接登录');
  });
});
