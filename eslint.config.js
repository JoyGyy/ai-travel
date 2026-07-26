import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  react: true,
  rules: {
    'react-refresh/only-export-components': 'off',
    'react/no-array-index-key': 'off',
  },
})
