import { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimateOnViewProps {
	children: ReactNode;
	animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'bounce-light';
	delay?: number;
	threshold?: number;
	className?: string;
}

export default function AnimateOnView({
	children,
	animation = 'fade-in',
	delay = 0,
	threshold = 0.1,
	className = '',
}: AnimateOnViewProps) {
	const { ref, inView } = useInView({
		threshold,
		triggerOnce: true,
	});

	const animationClasses = {
		'fade-in': 'animate-fade-in',
		'slide-up': 'animate-slide-up',
		'slide-down': 'animate-slide-down',
		'bounce-light': 'animate-bounce-light',
	};

	return (
		<div
			ref={ref}
			className={`${className} ${inView ? animationClasses[animation] : 'opacity-0'}`}
			style={{ animationDelay: `${delay}ms` }}
		>
			{children}
		</div>
	);
}
