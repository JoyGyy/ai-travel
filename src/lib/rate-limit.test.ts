import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetRateLimitStore, checkRateLimit } from './rate-limit';

describe('rate-limit 限流工具', () => {
  beforeEach(() => {
    _resetRateLimitStore();
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.ENABLE_DEV_RATE_LIMIT;
  });

  afterEach(() => {
    _resetRateLimitStore();
    vi.unstubAllEnvs();
    delete process.env.ENABLE_DEV_RATE_LIMIT;
  });

  it('在本地开发环境下默认跳过限流', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = new Request('http://localhost/api/test');

    // 连续发起超过限额的请求，应全部放行
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit(req, 'test:dev', 2, 60_000);
      expect(result).toBeNull();
    }
  });

  it('开发环境下若显式启用 ENABLE_DEV_RATE_LIMIT 则正常限流', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.env.ENABLE_DEV_RATE_LIMIT = 'true';
    const req = new Request('http://localhost/api/test');

    const res1 = await checkRateLimit(req, 'test:dev-enabled', 2, 60_000);
    const res2 = await checkRateLimit(req, 'test:dev-enabled', 2, 60_000);
    const res3 = await checkRateLimit(req, 'test:dev-enabled', 2, 60_000);

    expect(res1).toBeNull();
    expect(res2).toBeNull();
    expect(res3).not.toBeNull();
    expect(res3?.status).toBe(429);
  });

  it('在生产环境下正常执行滑动窗口限流', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new Request('http://localhost/api/test', {
      headers: { 'x-real-ip': '192.168.1.1' },
    });

    const res1 = await checkRateLimit(req, 'test:prod', 2, 60_000);
    const res2 = await checkRateLimit(req, 'test:prod', 2, 60_000);
    const res3 = await checkRateLimit(req, 'test:prod', 2, 60_000);

    expect(res1).toBeNull();
    expect(res2).toBeNull();
    expect(res3?.status).toBe(429);

    const json = await res3?.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain('过于频繁');
    expect(json.retryAfter).toBeGreaterThan(0);
  });

  it('针对不同 IP / 用户 ID 独立计数', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const reqUserA = new Request('http://localhost/api/test', {
      headers: { 'x-real-ip': '1.1.1.1' },
    });
    const reqUserB = new Request('http://localhost/api/test', {
      headers: { 'x-real-ip': '2.2.2.2' },
    });

    await checkRateLimit(reqUserA, 'test:separate', 1, 60_000);
    const blockedA = await checkRateLimit(reqUserA, 'test:separate', 1, 60_000);
    const okB = await checkRateLimit(reqUserB, 'test:separate', 1, 60_000);

    expect(blockedA?.status).toBe(429);
    expect(okB).toBeNull();
  });
});
