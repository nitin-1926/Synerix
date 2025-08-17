import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import React from 'react';
import FeaturesHome from '../components/Features';
import FeaturesBlocks from '../components/FeaturesBlocks';
import Footer from '../components/Footer';
import Header from '../components/Header';
import HeroHome from '../components/HeroHome';
import Newsletter from '../components/Newsletter';
import Testimonials from '../components/Testimonials';

const Home: React.FC = () => {
	return (
		<>
			<SpeedInsights />
			<Analytics />
			<div className="flex flex-col min-h-screen overflow-hidden">
				{/*  Site header */}
				<Header />

				{/*  Page content */}
				<main className="flex-grow">
					{/*  Page sections */}
					<HeroHome />
					<FeaturesHome />
					<FeaturesBlocks />
					{/* <Expert /> */}
					<Testimonials />
					<Newsletter />
				</main>

				{/* <Banner /> */}

				{/*  Site footer */}
				<Footer />
			</div>
		</>
	);
};

export default Home;
