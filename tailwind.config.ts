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
          strong: '#185c65',
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
          strong: '#aa473f',
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
          orange: '#226f78',
          'orange-dark': '#185c65',
          ink: '#19343c',
          'ink-light': '#4b666e',
          muted: 'rgba(25, 52, 60, 0.72)',
          'muted-light': '#91a6ab',
          surface: '#f5f8f8',
          'surface-strong': '#ffffff',
          'surface-muted': '#edf4f4',
          frosted: '#eaf1f2',
          border: 'rgba(25, 52, 60, 0.1)',
          'border-light': '#d9e4e5',
          sand: '#b89562',
          'sand-light': '#f7f0e4',
          ocean: '#19343c',
          'ocean-light': '#4b666e',
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
