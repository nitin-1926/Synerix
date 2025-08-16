/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#E6F2FF',
					100: '#CCE5FF',
					200: '#99CBFF',
					300: '#66B1FF',
					400: '#3397FF',
					500: '#007E97', // Main primary color (darker teal from logo)
					600: '#006785', // Another logo color
					700: '#005570',
					800: '#00445A',
					900: '#002070', // Darkest logo color
				},
				secondary: {
					50: '#E6FEFE',
					100: '#CCFDFD',
					200: '#99FBFB',
					300: '#66F9F9',
					400: '#33F7F7',
					500: '#00C6C9', // Bright cyan from logo
					600: '#00B3B6',
					700: '#009FA2',
					800: '#008C8F',
					900: '#016D8A', // Medium teal-blue from logo
				},
				accent: {
					50: '#E6F9FA',
					100: '#CCF3F5',
					200: '#99E7EB',
					300: '#66DBE1',
					400: '#33CFD7',
					500: '#00C6C9', // Bright cyan (same as secondary-500 for cohesion)
					600: '#00B3B6',
					700: '#009FA2',
					800: '#008C8F',
					900: '#007E97', // Teal from logo
				},
				gray: {
					50: '#F9FAFB',
					100: '#F3F4F6',
					200: '#E5E7EB',
					300: '#D1D5DB',
					400: '#9CA3AF',
					500: '#6B7280',
					600: '#4B5563',
					700: '#374151',
					800: '#1F2937',
					900: '#111827',
				},
			},
			boxShadow: {
				xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
				sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
				inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
				outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
				none: 'none',
			},
			spacing: {
				'9/16': '56.25%',
				'3/4': '75%',
				'1/1': '100%',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
				'3xl': '2rem',
				'4xl': '2.625rem',
				'5xl': '3.25rem',
				'6xl': '5.5rem',
			},
			inset: {
				'1/2': '50%',
				full: '100%',
			},
			letterSpacing: {
				tighter: '-0.02em',
				tight: '-0.01em',
				normal: '0',
				wide: '0.01em',
				wider: '0.02em',
				widest: '0.4em',
			},
			lineHeight: {
				none: '1',
				tighter: '1.125',
				tight: '1.25',
				snug: '1.375',
				normal: '1.5',
				relaxed: '1.625',
				loose: '2',
				3: '.75rem',
				4: '1rem',
				5: '1.2rem',
				6: '1.5rem',
				7: '1.75rem',
				8: '2rem',
				9: '2.25rem',
				10: '2.5rem',
			},
			minWidth: {
				10: '2.5rem',
				48: '12rem',
			},
			opacity: {
				90: '0.9',
			},
			scale: {
				98: '.98',
			},
			animation: {
				float: 'float 3s ease-in-out infinite',
				'fade-in': 'fadeIn 0.5s ease-in',
				'fade-out': 'fadeOut 0.5s ease-out',
				'slide-up': 'slideUp 0.5s ease-out',
				'slide-down': 'slideDown 0.5s ease-out',
				'bounce-light': 'bounceLight 1s infinite',
				'stagger-in': 'staggerIn 0.6s ease-out forwards',
			},
			keyframes: {
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5%)' },
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				fadeOut: {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				slideDown: {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				bounceLight: {
					'0%, 100%': { transform: 'translateY(-2%)' },
					'50%': { transform: 'translateY(0)' },
				},
				staggerIn: {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			zIndex: {
				'-1': '-1',
			},
		},
	},
	variants: {
		extend: {
			backgroundColor: ['active', 'group-hover'],
			textColor: ['active', 'group-hover'],
			transform: ['hover', 'focus', 'group-hover'],
			scale: ['hover', 'focus', 'group-hover'],
			translate: ['hover', 'focus', 'group-hover'],
			boxShadow: ['hover', 'focus', 'focus-within'],
			opacity: ['hover', 'group-hover'],
			borderWidth: ['hover', 'focus'],
		},
	},
	plugins: [require('@tailwindcss/forms')],
};
