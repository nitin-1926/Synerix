import React, { ReactNode } from 'react';

interface GridProps {
	children: ReactNode;
	className?: string;
	cols?: 1 | 2 | 3 | 4 | 6 | 12;
	gap?: 'none' | 'sm' | 'md' | 'lg';
}

const Grid: React.FC<GridProps> = ({ children, className = '', cols = 3, gap = 'md' }) => {
	const columns = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
		6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
		12: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-12',
	};

	const gaps = {
		none: 'gap-0',
		sm: 'gap-4',
		md: 'gap-6',
		lg: 'gap-8',
	};

	return <div className={`grid ${columns[cols]} ${gaps[gap]} ${className}`}>{children}</div>;
};

export default Grid;
