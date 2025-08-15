function Expert() {
	return (
		<section className="relative">
			{/* Section background (needs .relative class on parent and next sibling elements) */}
			<div className="absolute inset-0 bg-gray-100 pointer-events-none mb-16" aria-hidden="true"></div>
			<div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>

			<div className="relative max-w-6xl mx-auto px-4 sm:px-6">
				<div className="pt-12 md:pt-20">
					{/* Section content */}
					<div className="md:grid md:grid-cols-12 md:gap-6 max-h-xl">
						{/* Content */}
						<div
							className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6"
							data-aos="fade-right"
						>
							<div className="md:pr-4 lg:pr-12 xl:pr-16 mb-8">
								<h3 className="h3 mb-3">Experts with 25+ years of experience</h3>
								<p className="text text-gray-600">
									Unlock your organizational business potential with Synerix's seasoned experts,
									boasting over 25 years of diversified industrial experience in MSME consulting
									services. Today, leverage our tailored guidance and expertise to conquer challenges
									and open doors to unparalleled opportunities. Our professionals, with deep industry
									insight, specialize in financial management, operational efficiency, strategic
									planning, marketing, and technology adoption. Let us be your trusted guide,
									propelling your success story forward and building a resilient future for your
									Indian small manufacturing enterprise. With Synerix's experts by your side, every
									step forward is a stride toward unlocking your business's immense potential. Choose
									confidence, choose Synerix.
								</p>
							</div>
						</div>

						<div
							className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1"
							data-aos="zoom-y-out"
						>
							<img
								className="relative md:max-w-none mx-auto rounded"
								src={'/images/0017.png'}
								width="800"
								height="200"
								alt="Features bg"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Expert;
