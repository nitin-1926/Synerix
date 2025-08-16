import React from 'react';
import FeatureBlock from './FeatureBlock';
import { featuresData } from '../data/features';

const FeaturesBlocks: React.FC = () => {
	return (
		<section id="services" className="relative">
			{/* Section background (needs .relative class on parent and next sibling elements) */}
			<div
				className="absolute inset-0 top-1/2 md:mt-24 lg:mt-0 bg-gray-900 pointer-events-none"
				aria-hidden="true"
			></div>
			<div className="absolute left-0 right-0 bottom-0 m-auto w-px p-px h-20 bg-gray-200 transform translate-y-1/2"></div>

			<div className="relative max-w-6xl mx-auto px-4 sm:px-6">
				<div className="py-12 md:py-20">
					{/* Section header */}
					<div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
						<h2 className="h2 mb-4">Our services</h2>
						<p className="text-xl text-gray-600">
							We are passionate about empowering MSMEs to thrive. We believe that every small manufacturer
							deserves the opportunity to succeed, and through our consulting services, we aim to level
							the playing field and insightful resources that can propel your business forward. At
							Synerix, our array of services is designed to elevate every aspect of your MSME journey.
							Choose excellence, choose Synerix! 🌟
						</p>
					</div>

					{/* Items */}
					<div className="max-w-sm mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start md:max-w-2xl lg:max-w-none">
						{featuresData.map((feature, index) => {
							const IconComponent = feature.icon;
							return (
								<FeatureBlock
									key={index}
									title={feature.title}
									description={feature.description}
									icon={<IconComponent />}
								/>
							);
						})}
					</div>

					{/* Business Health Test CTA */}
					<div className="max-w-4xl mx-auto mt-16 text-center" data-aos="fade-up">
						<div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 md:p-12 border border-primary-100">
							<div className="mb-6">
								<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4">
									<svg
										className="w-8 h-8 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
									Is Your Business Ready for Growth?
								</h3>
								<p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
									Take our comprehensive Business Health Test to discover your strengths, identify
									areas for improvement, and get a roadmap for sustainable growth. It's completely
									free and takes just 5 minutes!
								</p>
							</div>
							<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
								<a
									href="/business-health-test"
									className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:from-primary-700 hover:to-secondary-700 transform hover:scale-105 transition-all duration-200"
								>
									<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
									Start Your Free Assessment
								</a>
								<div className="flex items-center text-sm text-gray-500">
									<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									5 minutes • No signup required
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default FeaturesBlocks;
