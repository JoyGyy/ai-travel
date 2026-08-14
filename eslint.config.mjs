import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import perfectionist from 'eslint-plugin-perfectionist'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

const eslintConfig = defineConfig([
  // Next.js 核心规则（包含 React、React Hooks、Next.js 插件）
  ...nextVitals,
  // TypeScript 规则
  ...nextTs,

  // ========== 自定义规则（仅代码质量，格式化交给 Prettier）==========
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // ========== 代码风格 ==========
      'no-var': 'warn',
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',

      // ========== 比较与逻辑 ==========
      eqeqeq: ['warn', 'always'],
      'no-else-return': 'warn',
      curly: ['warn', 'all'],
      'no-unneeded-ternary': 'error',

      // ========== 函数相关 ==========
      'prefer-arrow-callback': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',

      // ========== 对象与字符串 ==========
      'dot-notation': 'warn',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',

      // ========== Promise/异步 ==========
      'prefer-promise-reject-errors': 'error',
      'no-promise-executor-return': 'error',

      // ========== 导入规范 ==========
      'no-useless-rename': 'warn',

      // ========== React/JSX ==========
      'react/self-closing-comp': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/display-name': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // ========== JS/Next.js ==========
      'no-extra-boolean-cast': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'no-case-declarations': 'error',

      // ========== 防坏习惯 ==========
      'no-nested-ternary': 'off',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-useless-return': 'error',

      // ========== console 规范 ==========
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ========== TypeScript 规则（仅 .ts/.tsx 文件）==========
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
      '@typescript-eslint/no-empty-function': 'error',
    },
  },

  // ========== import 排序（eslint-plugin-perfectionist）==========
  perfectionist.configs['recommended-natural'],

  // ========== Prettier 必须放最后，关闭所有格式化规则 ==========
  prettier,

  // ========== 全局忽略 ==========
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.claude/**',
    '*.config.js',
    '*.config.mjs',
    '*.config.ts',
  ]),
])

export default eslintConfig
