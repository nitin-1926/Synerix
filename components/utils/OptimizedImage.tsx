import Image from 'next/image';
import React from 'react';
import { useInView } from 'react-intersection-observer';

interface OptimizedImageProps {
	src: string;
	alt: string;
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
	quality?: number;
	objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
	src,
	alt,
	width,
	height,
	className = '',
	priority = false,
	quality = 75,
	objectFit = 'cover',
}) => {
	const { ref, inView } = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	return (
		<div ref={ref} className={`relative ${className}`}>
			{inView && (
				<Image
					src={src}
					alt={alt}
					width={width}
					height={height}
					className={`transition-opacity duration-300 ${className}`}
					priority={priority}
					quality={quality}
					style={{ objectFit }}
					loading={priority ? 'eager' : 'lazy'}
				/>
			)}
		</div>
	);
};

export default OptimizedImage;
