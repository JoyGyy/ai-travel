import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/hooks/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          strong: '#0d9488',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          strong: '#d63350',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // 自定义颜色（与 globals.css CSS 变量保持一致）
        travel: {
          orange: '#14b8a6',
          'orange-dark': '#0d9488',
          ink: '#1c1917',
          'ink-light': '#44403c',
          muted: 'rgba(28, 25, 23, 0.76)',
          'muted-light': '#a8a29e',
          surface: '#fafaf8',
          'surface-strong': '#ffffff',
          'surface-muted': '#f5f3ef',
          frosted: '#f0eeeb',
          border: 'rgba(28, 25, 23, 0.08)',
          'border-light': '#e7e5e4',
          sand: '#d4a76a',
          'sand-light': '#fff0d6',
          ocean: '#292524',
          'ocean-light': '#57534e',
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        serif: ['var(--font-serif)'],
      },
      animation: {
        'spin-slow': 'spin 0.6s linear infinite',
      },
    },
  },
}

export default config
