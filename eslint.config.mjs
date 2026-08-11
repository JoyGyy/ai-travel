import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.mjs', '*.cjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // TypeScript 严格规则
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],

      // 代码风格（可自动修复）
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',

      // 比较与逻辑（可自动修复）
      'eqeqeq': ['error', 'always'],
      'no-else-return': 'error',
      'curly': ['error', 'all'],
      'no-unneeded-ternary': 'error',

      // 函数相关（可自动修复）
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',

      // 对象与字符串（可自动修复）
      'dot-notation': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',

      // Promise/异步（可自动修复）
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      'prefer-promise-reject-errors': 'error',
      'no-promise-executor-return': 'error',

      // 导入规范（可自动修复）
      'no-useless-rename': 'error',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      // React/JSX（可自动修复）
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/self-closing-comp': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
      'no-extra-boolean-cast': 'error',
      'no-unexpected-multiline': 'error',

      // TypeScript 补充（可自动修复）
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',

      // JS/Next.js（可自动修复）
      'no-unreachable': 'error',
      'no-case-declarations': 'error',
      '@next/next/no-img-element': 'error',

      // 防坏习惯（规范严格）
      'no-nested-ternary': 'warn', // 允许嵌套一层，超过警告
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-useless-return': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': 'allow-with-description' },
      ],
      '@typescript-eslint/no-empty-function': 'error',

      // 解构优先（放宽：只警告，不报错）
      'prefer-destructuring': [
        'warn',
        { array: true, object: true },
      ],

      // React 安全
      'react/display-name': 'off',
      'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
      'react/no-direct-mutation-state': 'error',
      'react/no-render-return-value': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // TypeScript 强化（养成好习惯）
      '@typescript-eslint/no-floating-promises': 'warn', // 放宽：只警告
      '@typescript-eslint/no-require-imports': 'error',
    },
  },
  // Prettier 配置（禁用与 Prettier 冲突的规则）
  prettier,
  // 全局忽略
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.claude/**',
  ]),
])

export default eslintConfig
