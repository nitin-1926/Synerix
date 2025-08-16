import React, { ReactNode } from 'react';
import Footer from '../Footer';
import Header from '../Header';
import AnimateOnView from '../utils/AnimateOnView';

interface MainLayoutProps {
	children: ReactNode;
	className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, className = '' }) => {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />

			<main className={`flex-grow ${className}`}>
				<AnimateOnView animation="fade-in" delay={100}>
					{children}
				</AnimateOnView>
			</main>

			<Footer />
		</div>
	);
};

export default MainLayout;
