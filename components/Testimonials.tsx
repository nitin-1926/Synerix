import React from 'react';

const Testimonials: React.FC = () => {
	return (
		<section className="relative">
			{/* Illustration behind content */}
			<div
				className="absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none -mb-32"
				aria-hidden="true"
			>
				<svg width="1760" height="518" viewBox="0 0 1760 518" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="illustration-02">
							<stop stopColor="#FFF" offset="0%" />
							<stop stopColor="#EAEAEA" offset="77.402%" />
							<stop stopColor="#DFDFDF" offset="100%" />
						</linearGradient>
					</defs>
					<g transform="translate(0 -3)" fill="url(#illustration-02)" fillRule="evenodd">
						<circle cx="1630" cy="128" r="128" />
						<circle cx="178" cy="481" r="40" />
					</g>
				</svg>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				<div className="py-12 md:py-20">
					{/* Section header */}
					<div className="max-w-4xl mx-auto text-center pb-12 md:pb-16">
						<h2 className="h2 mb-4">Experts with 25+ years of experience</h2>
						<p className="text-xl text-gray-600" data-aos="zoom-y-out">
							Unlock your organizational business potential with Synerix's seasoned experts, boasting over
							25 years of diversified industrial experience in MSME consulting services. Today, leverage
							our tailored guidance and expertise to conquer challenges and open doors to unparalleled
							opportunities. Our professionals, with deep industry insight, specialize in financial
							management, operational efficiency, strategic planning, marketing, and technology adoption.
							Let us be your trusted guide, propelling your success story forward and building a resilient
							future for your Indian small manufacturing enterprise. With Synerix's experts by your side,
							every step forward is a stride toward unlocking your business's immense potential. Choose
							confidence, choose Synerix.
						</p>
					</div>

					{/* Items */}
					<div className="max-w-sm md:max-w-4xl mx-auto grid gap-2">
						<img
							className="relative md:max-w-none mx-auto rounded"
							src="/images/0017.png"
							width="800"
							height="562"
							alt="Features bg"
						/>

						{/* Item */}
						{/* <div className="flex items-center justify-center py-2 col-span-2 md:col-auto">
              <img className="md:max-w-none mx-auto rounded" style={{filter: 'opacity(0.6)'}} src={Rocketium} width="150" height="562" alt="Features bg" />
            </div> */}

						{/* Item */}
						{/* <div className="flex items-center justify-center py-2 col-span-2 md:col-auto">
            <img className="md:max-w-none mx-auto rounded" src={Jupiter} width="90" height="562" alt="Features bg" />

            </div> */}

						{/* Item */}
						{/* <div className="flex items-center justify-center py-2 col-span-2 md:col-auto">
              <img className="md:max-w-none mx-auto rounded" style={{filter: 'opacity(0.6)'}} src={Oracle} width="110" height="562" alt="Features bg" />
            </div> */}

						{/* Item */}
						{/* <div className="flex items-center justify-center py-2 col-span-2 md:col-auto">
              <img className="md:max-w-none mx-auto rounded" style={{filter: 'opacity(0.4)'}} src={Geeky} width="150" height="562" alt="Features bg" />
            </div> */}

						{/* Item */}
						{/* <div className="flex items-center justify-center py-2 col-span-2 md:col-auto col-start-2 col-end-4">
              <svg className="max-w-full fill-current text-gray-400" width="109" height="33" viewBox="0 0 109 33" xmlns="http://www.w3.org/2000/svg">
                <path d="M67.43 25.591c-6.293 4.653-15.447 7.132-23.342 7.132-11.06 0-20.976-4.08-28.527-10.87-.572-.533-.077-1.258.648-.839 8.124 4.73 18.154 7.552 28.528 7.552 6.98 0 14.683-1.45 21.777-4.462 1.068-.42 1.945.724.915 1.487zm2.631-3.013c-.8-1.03-5.34-.496-7.36-.229-.611.077-.725-.457-.153-.839 3.623-2.555 9.534-1.792 10.22-.953.687.839-.19 6.789-3.584 9.61-.534.42-1.03.192-.801-.38.763-1.908 2.479-6.14 1.678-7.209zM62.815 3.585V1.106c0-.381.267-.61.61-.61h11.06c.343 0 .648.267.648.61v2.098c0 .343-.305.8-.839 1.563l-5.72 8.162c2.135-.038 4.386.267 6.293 1.335.419.229.533.61.572.953v2.632c0 .381-.382.8-.801.572-3.395-1.792-7.933-1.983-11.67.038-.382.19-.802-.19-.802-.572V15.37c0-.381 0-1.068.42-1.678l6.636-9.497h-5.759c-.343 0-.648-.267-.648-.61zm-40.313 15.37h-3.356c-.305-.038-.572-.267-.61-.572V1.144c0-.343.305-.61.648-.61h3.127c.343 0 .572.267.61.572v2.25h.077c.8-2.174 2.364-3.203 4.424-3.203 2.097 0 3.432 1.03 4.348 3.203.8-2.174 2.67-3.203 4.653-3.203 1.41 0 2.936.572 3.89 1.906 1.068 1.45.839 3.547.839 5.416v10.908c0 .343-.305.61-.649.61h-3.318c-.343-.038-.61-.305-.61-.61V9.23c0-.725.076-2.556-.076-3.242-.267-1.144-.992-1.488-1.983-1.488-.801 0-1.678.534-2.022 1.412-.343.877-.305 2.326-.305 3.318v9.153c0 .343-.305.61-.648.61h-3.356c-.344-.038-.61-.305-.61-.61V9.23c0-1.907.304-4.768-2.06-4.768-2.403 0-2.327 2.746-2.327 4.768v9.153c-.038.305-.305.572-.686.572zM84.668.153c4.996 0 7.704 4.271 7.704 9.725 0 5.263-2.975 9.458-7.704 9.458-4.882 0-7.551-4.271-7.551-9.61-.038-5.378 2.67-9.573 7.551-9.573zm0 3.546c-2.479 0-2.631 3.395-2.631 5.492 0 2.098-.039 6.598 2.593 6.598 2.593 0 2.746-3.623 2.746-5.835 0-1.449-.076-3.203-.496-4.576-.381-1.22-1.144-1.679-2.212-1.679zm14.15 15.256H95.46c-.343-.038-.61-.305-.61-.61V1.068A.66.66 0 0195.5.496h3.127c.305 0 .534.229.61.496v2.631h.077c.953-2.364 2.25-3.47 4.576-3.47 1.488 0 2.975.533 3.928 2.02.878 1.374.878 3.7.878 5.378v10.87c-.038.305-.305.534-.649.534h-3.356c-.305-.038-.572-.267-.61-.534V9.04c0-1.907.229-4.653-2.098-4.653-.8 0-1.563.534-1.945 1.373-.458 1.068-.534 2.098-.534 3.28v9.306a.698.698 0 01-.686.61zm-41.42-.038a.69.69 0 01-.8.076c-1.106-.915-1.335-1.373-1.945-2.25-1.83 1.869-3.166 2.44-5.53 2.44-2.822 0-5.035-1.754-5.035-5.224 0-2.746 1.488-4.577 3.586-5.492 1.83-.801 4.385-.954 6.33-1.182v-.42c0-.8.077-1.754-.419-2.44-.42-.611-1.182-.878-1.869-.878-1.296 0-2.44.648-2.708 2.021-.076.305-.267.61-.572.61l-3.241-.343c-.267-.076-.573-.267-.496-.686C45.46 1.182 49.009 0 52.212 0c1.64 0 3.776.42 5.073 1.678 1.64 1.526 1.487 3.585 1.487 5.797V12.7c0 1.564.648 2.25 1.259 3.128.228.305.266.686 0 .877-.725.572-1.946 1.64-2.632 2.212zm-44.088 0a.69.69 0 01-.8.076c-1.106-.915-1.335-1.373-1.946-2.25-1.83 1.869-3.165 2.44-5.53 2.44C2.212 19.184 0 17.43 0 13.96c0-2.746 1.487-4.577 3.585-5.492 1.83-.801 4.386-.954 6.331-1.182v-.42c0-.8.076-1.754-.42-2.44-.419-.611-1.182-.878-1.868-.878-1.297 0-2.441.648-2.708 2.021-.076.305-.267.61-.572.61l-3.242-.343C.839 5.76.534 5.568.61 5.15 1.373 1.182 4.92 0 8.124 0c1.64 0 3.775.42 5.072 1.678 1.64 1.526 1.487 3.585 1.487 5.797V12.7c0 1.564.649 2.25 1.259 3.128.229.305.267.686 0 .877-.725.572-1.945 1.64-2.632 2.212zm40.695-8.2v-.725c-2.441 0-4.997.534-4.997 3.395 0 1.449.763 2.44 2.06 2.44.953 0 1.792-.571 2.326-1.525.649-1.182.61-2.288.61-3.585zm-44.05 0v-.725c-2.442 0-4.997.534-4.997 3.395 0 1.449.763 2.44 2.06 2.44.953 0 1.792-.571 2.326-1.525.648-1.182.61-2.288.61-3.585z" />
              </svg>
            </div> */}

						{/* </div> */}

						{/* Testimonials */}
						{/* <div className="max-w-3xl mx-auto mt-20" data-aos="zoom-y-out"> */}
						{/* <div className="relative flex items-start border-2 border-gray-200 rounded bg-white"> */}

						{/* Testimonial */}
						{/* <div className="text-center px-12 py-8 pt-20 mx-4 md:mx-0">
                <div className="absolute top-0 -mt-8 left-1/2 transform -translate-x-1/2">
                  					<svg className="absolute top-0 right-0 -mt-3 -mr-8 w-16 h-16 fill-current text-secondary-500" viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                    <path d="M37.89 58.338c-2.648-5.63-3.572-10.045-2.774-13.249.8-3.203 8.711-13.383 23.737-30.538l2.135.532c-6.552 10.033-10.532 17.87-11.939 23.515-.583 2.34.22 6.158 2.41 11.457l-13.57 8.283zm-26.963-6.56c-2.648-5.63-3.572-10.046-2.773-13.25.799-3.203 8.71-13.382 23.736-30.538l2.136.533c-6.552 10.032-10.532 17.87-11.94 23.515-.583 2.339.22 6.158 2.41 11.456l-13.57 8.283z" />
                  </svg>
                  <img className="relative rounded-full" src={TestimonialImage} width="96" height="96" alt="Testimonial 01" />
                </div>
                <blockquote className="text-xl font-medium mb-4">
                  “ I love the ease Monkster have added to our workflow and streamlined the whole interview process. Could be not easier to use. We have started getting nice result. “
                </blockquote>
                <cite className="block font-bold text-lg not-italic mb-1">Utkarsh Singh</cite>
                <div className="text-gray-600">
                  					<span>Program Manager</span> <a className="text-primary-600 hover:underline" href="https://acciojob.com/" target='_blank'>@AccioJob</a>
                </div>
              </div> */}

						{/* </div> */}
					</div>
				</div>
			</div>
		</section>
	);
};

export default Testimonials;
