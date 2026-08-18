import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  nextjs: true,
  typescript: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  rules: {
    // 允许 console.warn、console.error 和 console.info
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    // Next.js 项目不需要这些
    'antfu/no-top-level-await': 'off',
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    // 风格调整
    'style/multiline-ternary': 'off',
    // React 相关
    'react/display-name': 'off',
    // 允许 confirm/alert
    'no-alert': 'off',
  },
  ignores: [
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '*.config.js',
    '*.config.mjs',
    '*.config.ts',
    'db/**',
    'scripts/**',
  ],
})
