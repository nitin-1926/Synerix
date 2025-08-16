import Link from 'next/link';
import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	href?: string;
	className?: string;
	isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
	children,
	variant = 'primary',
	size = 'md',
	href,
	className = '',
	isLoading = false,
	...props
}) => {
	const baseStyles =
		'inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';

	const variants = {
		primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
		secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
		accent: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500',
		outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
		ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
	};

	const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

	const content = (
		<>
			{isLoading && (
				<svg
					className="animate-spin -ml-1 mr-2 h-4 w-4"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					></circle>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			)}
			{children}
		</>
	);

	if (href) {
		return (
			<Link href={href} className={buttonClasses}>
				{content}
			</Link>
		);
	}

	return (
		<button className={buttonClasses} disabled={isLoading} {...props}>
			{content}
		</button>
	);
};

export default Button;
