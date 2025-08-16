import React, { useEffect, useRef, useState } from 'react';
import Transition from './Transition';

const Features: React.FC = () => {
	const [tab, setTab] = useState<number>(1);

	const tabs = useRef(null);

	const heightFix = () => {
		if (tabs.current.children[tab]) {
			tabs.current.style.height = tabs.current.children[tab - 1].offsetHeight + 'px';
		}
	};

	useEffect(() => {
		heightFix();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab]);

	return (
		<section className="relative">
			{/* Section background (needs .relative class on parent and next sibling elements) */}
			<div className="absolute inset-0 bg-gray-100 pointer-events-none mb-16" aria-hidden="true"></div>
			<div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>

			<div className="relative max-w-6xl mx-auto px-4 sm:px-6">
				<div className="pt-12 md:pt-20">
					{/* Section header */}
					<div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
						<h1 className="h2 mb-4">What can we bring for you?</h1>
						<p className="text-xl text-gray-600">
							At Synerix, we understand the unique challenges that an enterprise faces in today's
							competitive business landscape. Whether you are just starting your business or looking to
							expand, our experienced team of consultants is here to provide you with tailored solutions
							that drive growth, improve efficiency, and maximize profitability.
						</p>
					</div>

					{/* Section content */}
					<div className="md:grid md:grid-cols-12 md:gap-6">
						{/* Content */}
						<div
							className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6"
							data-aos="fade-right"
						>
							<div className="md:pr-4 lg:pr-12 xl:pr-16 mb-8">
								<h3 className="h3 mb-3">Why Choose Us?</h3>
								<p className="text-md text-gray-600">
									Partnering with us offers the advantage of our deep local expertise in the Indian
									market. We understand the cultural, economic, and regulatory intricacies, ensuring
									our strategies align with your business needs. Synerix stays current on industry
									trends and government policies, providing precise and timely advice for a
									competitive edge.
								</p>
							</div>
							{/* Tabs buttons */}
							<div className="mb-8 md:mb-0">
								<a
									className={`flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${
										tab !== 1
											? 'bg-white shadow-md border-gray-200 hover:shadow-lg'
											: 'bg-gray-200 border-transparent'
									}`}
									href="#0"
									onClick={e => {
										e.preventDefault();
										setTab(1);
									}}
								>
									<div>
										<div className="font-bold leading-snug tracking-tight mb-1">Experience:</div>
										<div className="text-gray-600 text-sm">
											We possess extensive experience across various industries, allowing us to
											offer tailor-made solutions that cater to your specific business needs.
										</div>
									</div>
									<div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
										<svg
											className="w-3 h-3 fill-current"
											viewBox="0 0 12 12"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path d="M11.953 4.29a.5.5 0 00-.454-.292H6.14L6.984.62A.5.5 0 006.12.173l-6 7a.5.5 0 00.379.825h5.359l-.844 3.38a.5.5 0 00.864.445l6-7a.5.5 0 00.075-.534z" />
										</svg>
									</div>
								</a>
								<a
									className={`flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${
										tab !== 2
											? 'bg-white shadow-md border-gray-200 hover:shadow-lg'
											: 'bg-gray-200 border-transparent'
									}`}
									href="#0"
									onClick={e => {
										e.preventDefault();
										setTab(2);
									}}
								>
									<div>
										<div className="font-bold leading-snug tracking-tight mb-1">
											Holistic Approach:
										</div>
										<div className="text-gray-600 text-sm">
											We prioritize understanding your unique circumstances and goals to develop
											comprehensive strategies.
										</div>
									</div>
									<div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
										<svg
											className="w-3 h-3 fill-current"
											viewBox="0 0 12 12"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M11.854.146a.5.5 0 00-.525-.116l-11 4a.5.5 0 00-.015.934l4.8 1.921 1.921 4.8A.5.5 0 007.5 12h.008a.5.5 0 00.462-.329l4-11a.5.5 0 00-.116-.525z"
												fillRule="nonzero"
											/>
										</svg>
									</div>
								</a>
								<a
									className={`flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${
										tab !== 3
											? 'bg-white shadow-md border-gray-200 hover:shadow-lg'
											: 'bg-gray-200 border-transparent'
									}`}
									href="#0"
									onClick={e => {
										e.preventDefault();
										setTab(3);
									}}
								>
									<div>
										<div className="font-bold leading-snug tracking-tight mb-1">
											Results-Driven:{' '}
										</div>
										<div className="text-gray-600 text-sm">
											We are committed to achieving tangible and measurable results. Our
											consultants will work with you every step of the way to ensure the
											successful implementation of our recommendations.
										</div>
									</div>
									<div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
										<svg
											className="w-3 h-3 fill-current"
											viewBox="0 0 12 12"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M11.334 8.06a.5.5 0 00-.421-.237 6.023 6.023 0 01-5.905-6c0-.41.042-.82.125-1.221a.5.5 0 00-.614-.586 6 6 0 106.832 8.529.5.5 0 00-.017-.485z"
												fill="#191919"
												fillRule="nonzero"
											/>
										</svg>
									</div>
								</a>
								<a
									className={`flex items-center text-base p-5 rounded border transition duration-300 ease-in-out mb-3 ${
										tab !== 4
											? 'bg-white shadow-md border-gray-200 hover:shadow-lg'
											: 'bg-gray-200 border-transparent'
									}`}
									href="#0"
									onClick={e => {
										e.preventDefault();
										setTab(4);
									}}
								>
									<div>
										<div className="font-bold leading-snug tracking-tight mb-1">
											Long-term Partnership:{' '}
										</div>
										<div className="text-gray-600 text-sm">
											We view our relationship with clients as a long-term partnership. We will be
											there to support you not only during the initial consulting process but also
											as your business continues to grow and evolve.
										</div>
									</div>
									<div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
										<svg
											className="w-3 h-3 fill-current"
											viewBox="0 0 12 12"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M11.334 8.06a.5.5 0 00-.421-.237 6.023 6.023 0 01-5.905-6c0-.41.042-.82.125-1.221a.5.5 0 00-.614-.586 6 6 0 106.832 8.529.5.5 0 00-.017-.485z"
												fill="#191919"
												fillRule="nonzero"
											/>
										</svg>
									</div>
								</a>
							</div>
						</div>

						{/* Tabs items */}
						<div
							className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1"
							data-aos="zoom-y-out"
							ref={tabs}
						>
							<div className="relative flex flex-col text-center lg:text-right">
								{/* Item 1 */}
								<Transition
									show={tab === 1}
									appear={true}
									className="w-full"
									enter="transition ease-in-out duration-700 transform order-first"
									enterStart="opacity-0 translate-y-16"
									enterEnd="opacity-100 translate-y-0"
									leave="transition ease-in-out duration-300 transform absolute"
									leaveStart="opacity-100 translate-y-0"
									leaveEnd="opacity-0 -translate-y-16"
								>
									<div className="relative inline-flex flex-col">
										<img
											className="relative md:max-w-none mx-auto rounded"
											src="/images/AVATARZ - Tomas.png"
											width="800"
											height="562"
											alt="Features bg"
										/>
										{/* <img className="md:max-w-none absolute w-full left-0 transform animate-float" src={FeaturesElement} width="500" height="44" alt="Element" style={{ top: '30%' }} /> */}
									</div>
								</Transition>
								{/* Item 2 */}
								<Transition
									show={tab === 2}
									appear={true}
									className="w-full"
									enter="transition ease-in-out duration-700 transform order-first"
									enterStart="opacity-0 translate-y-16"
									enterEnd="opacity-100 translate-y-0"
									leave="transition ease-in-out duration-300 transform absolute"
									leaveStart="opacity-100 translate-y-0"
									leaveEnd="opacity-0 -translate-y-16"
								>
									<div className="relative inline-flex flex-col">
										<img
											className="relative md:max-w-none mx-auto rounded"
											src="/images/0275.png"
											width="800"
											height="562"
											alt="Features bg"
										/>
										{/* <img className="md:max-w-none absolute w-full left-0 transform animate-float" src={FeaturesElement} width="500" height="44" alt="Element" style={{ top: '30%' }} /> */}
									</div>
								</Transition>
								{/* Item 3 */}
								<Transition
									show={tab === 3}
									appear={true}
									className="w-full"
									enter="transition ease-in-out duration-700 transform order-first"
									enterStart="opacity-0 translate-y-16"
									enterEnd="opacity-100 translate-y-0"
									leave="transition ease-in-out duration-300 transform absolute"
									leaveStart="opacity-100 translate-y-0"
									leaveEnd="opacity-0 -translate-y-16"
								>
									<div className="relative inline-flex flex-col">
										<img
											className="relative md:max-w-none mx-auto rounded"
											src="/images/35.png"
											width="800"
											height="562"
											alt="Features bg"
										/>
										{/* <img className="md:max-w-none absolute w-full left-0 transform animate-float" src={FeaturesElement} width="500" height="44" alt="Element" style={{ top: '30%' }} /> */}
									</div>
								</Transition>
								{/* Item 4 */}
								<Transition
									show={tab === 4}
									appear={true}
									className="w-full"
									enter="transition ease-in-out duration-700 transform order-first"
									enterStart="opacity-0 translate-y-16"
									enterEnd="opacity-100 translate-y-0"
									leave="transition ease-in-out duration-300 transform absolute"
									leaveStart="opacity-100 translate-y-0"
									leaveEnd="opacity-0 -translate-y-16"
								>
									<div className="relative inline-flex flex-col">
										<img
											className="relative md:max-w-none mx-auto rounded"
											src="/images/Working from Home.png"
											width="800"
											height="562"
											alt="Features bg"
										/>
										{/* <img className="md:max-w-none absolute w-full left-0 transform animate-float" src={FeaturesElement} width="500" height="44" alt="Element" style={{ top: '30%' }} /> */}
									</div>
								</Transition>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Features;
