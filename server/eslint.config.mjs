import antfu from '@antfu/eslint-config'

export default antfu(
  { typescript: true },
  {
    rules: {
      // 后端代码 JSDoc 未全覆盖，暂时关闭 @returns 描述要求
      'jsdoc/require-returns-description': 'off',
    },
  },
  {
    files: ['index.ts'],
    rules: {
      // 入口文件的启动日志允许 console
      'no-console': 'off',
    },
  },
)
