import path from 'node:path'

function buildEslintCommand(filenames) {
  return `eslint --fix ${filenames
    .map(f => `"${path.relative(process.cwd(), f)}"`)
    .join(' ')}`
}

export default {
  '*.{js,jsx,ts,tsx,json,css,scss,md}': ['prettier --write'],
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
}
