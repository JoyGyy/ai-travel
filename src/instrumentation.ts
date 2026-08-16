/**
 * Next.js Instrumentation 文件
 * 用于在应用启动时注册 Sentry SDK
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // 仅在 Node.js 环境中初始化服务端 Sentry
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  // 在 Edge Runtime 中初始化 Edge Sentry
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
