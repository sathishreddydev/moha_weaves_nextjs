import type { Config } from 'tailwindcss'

const config: Config = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					'50': '#fef2f2',
					'100': '#fee2e2',
					'200': '#fecaca',
					'300': '#fca5a5',
					'400': '#991b1b',
					'500': '#991b1b',
					'600': '#991b1b',
					'700': '#991b1b',
					'800': '#991b1b',
					'900': '#991b1b',
					'950': '#991b1b',
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					'50': '#f8fafc',
					'100': '#f1f5f9',
					'200': '#e2e8f0',
					'300': '#cbd5e1',
					'400': '#94a3b8',
					'500': '#64748b',
					'600': '#475569',
					'700': '#334155',
					'800': '#1e293b',
					'900': '#0f172a',
					'950': '#020617',
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				accent: {
					'50': '#fdf4ff',
					'100': '#fae8ff',
					'200': '#f5d0fe',
					'300': '#f0abfc',
					'400': '#e879f9',
					'500': '#d946ef',
					'600': '#c026d3',
					'700': '#a21caf',
					'800': '#86198f',
					'900': '#701a75',
					'950': '#4a044e',
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'sans-serif'
				]
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem'
			},
			borderRadius: {
				'4xl': '2rem',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out'
			},
			keyframes: {
				fadeIn: {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				slideUp: {
					'0%': {
						transform: 'translateY(10px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
export default config
