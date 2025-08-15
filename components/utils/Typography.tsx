import React, { ReactNode } from 'react';

interface TypographyProps {
	children: ReactNode;
	className?: string;
}

export const H1: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<h1 className={`text-4xl md:text-5xl font-display font-bold leading-tight tracking-tighter mb-4 ${className}`}>
		{children}
	</h1>
);

export const H2: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<h2 className={`text-3xl md:text-4xl font-display font-bold leading-tight tracking-tighter mb-4 ${className}`}>
		{children}
	</h2>
);

export const H3: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<h3 className={`text-2xl md:text-3xl font-display font-bold leading-tight mb-3 ${className}`}>{children}</h3>
);

export const H4: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<h4 className={`text-xl md:text-2xl font-display font-semibold leading-snug mb-2 ${className}`}>{children}</h4>
);

export const Paragraph: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<p className={`text-lg leading-relaxed mb-4 ${className}`}>{children}</p>
);

export const Lead: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<p className={`text-xl md:text-2xl leading-relaxed mb-6 ${className}`}>{children}</p>
);

export const SmallText: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<p className={`text-sm leading-normal ${className}`}>{children}</p>
);

export const Quote: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<blockquote
		className={`text-xl italic font-semibold text-gray-900 border-l-4 border-primary-500 pl-4 py-2 mb-4 ${className}`}
	>
		{children}
	</blockquote>
);

export const List: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<ul className={`list-disc list-inside space-y-2 mb-4 ${className}`}>{children}</ul>
);

export const ListItem: React.FC<TypographyProps> = ({ children, className = '' }) => (
	<li className={`text-lg leading-relaxed ${className}`}>{children}</li>
);
