import AOS from 'aos';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Seo from '../components/Seo';

import 'aos/dist/aos.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
	const router = useRouter();

	useEffect(() => {
		// Enhanced AOS configuration
		AOS.init({
			once: true,
			disable: false, // Enable on all devices
			duration: 800,
			easing: 'ease-out-cubic',
			mirror: true, // Whether elements should animate out while scrolling past them
			anchorPlacement: 'top-bottom', // Anchor placement
			offset: 120, // Offset (in px) from the original trigger point
			delay: 0, // Values from 0 to 3000, with step 50ms
			// Additional settings for better performance
			debounceDelay: 50, // The delay on debounce used while resizing window
			throttleDelay: 99, // The delay on throttle used while scrolling the page
		});

		// Refresh AOS when window is resized
		window.addEventListener('resize', () => {
			AOS.refresh();
		});

		return () => {
			window.removeEventListener('resize', () => {
				AOS.refresh();
			});
		};
	}, []);

	useEffect(() => {
		// Smooth scroll handling for route changes
		const handleStart = () => {
			document.querySelector('html')!.style.scrollBehavior = 'auto';
		};

		const handleStop = () => {
			window.scroll({ top: 0, behavior: 'smooth' });
			document.querySelector('html')!.style.scrollBehavior = 'smooth';
		};

		router.events.on('routeChangeStart', handleStart);
		router.events.on('routeChangeComplete', handleStop);
		router.events.on('routeChangeError', handleStop);

		return () => {
			router.events.off('routeChangeStart', handleStart);
			router.events.off('routeChangeComplete', handleStop);
			router.events.off('routeChangeError', handleStop);
		};
	}, [router]);

	return (
		<>
			<Seo />
			<div className="transition-all duration-300 ease-in-out">
				<Component {...pageProps} />
			</div>
		</>
	);
}

export default MyApp;
