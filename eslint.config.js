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
    // 允许 console.warn 和 console.error
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // Next.js 项目不需要这些
    'antfu/no-top-level-await': 'off',
    'node/prefer-global/process': 'off',
    // React 相关
    'react/display-name': 'off',
  },
  ignores: [
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '*.config.js',
    '*.config.mjs',
    '*.config.ts',
  ],
})
