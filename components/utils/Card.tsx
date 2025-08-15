import React, { ReactNode } from 'react';

interface CardProps {
	children: ReactNode;
	className?: string;
	variant?: 'default' | 'hover' | 'bordered';
	padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default', padding = 'md' }) => {
	const baseStyles = 'bg-white rounded-lg';

	const variants = {
		default: 'shadow-md',
		hover: 'shadow-md hover:shadow-xl transition-shadow duration-300',
		bordered: 'border border-gray-200',
	};

	const paddings = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8',
	};

	return <div className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}>{children}</div>;
};

export default Card;

export const CardHeader: React.FC<{
	children: ReactNode;
	className?: string;
}> = ({ children, className = '' }) => <div className={`mb-4 ${className}`}>{children}</div>;

export const CardBody: React.FC<{
	children: ReactNode;
	className?: string;
}> = ({ children, className = '' }) => <div className={className}>{children}</div>;

export const CardFooter: React.FC<{
	children: ReactNode;
	className?: string;
}> = ({ children, className = '' }) => <div className={`mt-4 ${className}`}>{children}</div>;
