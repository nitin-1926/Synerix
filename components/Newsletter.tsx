import { useState } from 'react';

function Newsletter() {
	const [email, setEmail] = useState('');
	const [emailSent, setEmailSent] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	async function sendEnquiry(e) {
		if (email.trim() === '') {
			setError('Please enter your email address');
			return;
		}

		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			const response = await fetch('/api/send-enquiry', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: email.trim() }),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				setEmailSent(true);
				setEmail('');
			} else {
				console.error('API Error:', result);
				setError(result.error || 'Something went wrong. Please try again.');
			}
		} catch (error) {
			console.error('Error sending enquiry:', error);
			setError('Failed to send enquiry. Please check your internet connection and try again.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<section>
			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				<div className="pb-12 md:pb-20">
					{/* CTA box */}
					<div
						className="relative bg-gray-900 rounded py-10 px-8 md:py-16 md:px-12 shadow-2xl overflow-hidden"
						data-aos="zoom-y-out"
					>
						{/* Background illustration */}
						<div
							className="absolute right-0 bottom-0 pointer-events-none hidden lg:block"
							aria-hidden="true"
						>
							<svg width="428" height="328" xmlns="http://www.w3.org/2000/svg">
								<defs>
									<radialGradient
										cx="35.542%"
										cy="34.553%"
										fx="35.542%"
										fy="34.553%"
										r="96.031%"
										id="ni-a"
									>
										<stop stopColor="#DFDFDF" offset="0%" />
										<stop stopColor="#4C4C4C" offset="44.317%" />
										<stop stopColor="#333" offset="100%" />
									</radialGradient>
								</defs>
								<g fill="none" fillRule="evenodd">
									<g fill="#FFF">
										<ellipse fillOpacity=".04" cx="185" cy="15.576" rx="16" ry="15.576" />
										<ellipse fillOpacity=".24" cx="100" cy="68.402" rx="24" ry="23.364" />
										<ellipse fillOpacity=".12" cx="29" cy="251.231" rx="29" ry="28.231" />
										<ellipse fillOpacity=".64" cx="29" cy="251.231" rx="8" ry="7.788" />
										<ellipse fillOpacity=".12" cx="342" cy="31.303" rx="8" ry="7.788" />
										<ellipse fillOpacity=".48" cx="62" cy="126.811" rx="2" ry="1.947" />
										<ellipse fillOpacity=".12" cx="78" cy="7.072" rx="2" ry="1.947" />
										<ellipse fillOpacity=".64" cx="185" cy="15.576" rx="6" ry="5.841" />
									</g>
									<circle fill="url(#ni-a)" cx="276" cy="237" r="200" />
								</g>
							</svg>
						</div>

						<div className="relative flex flex-col lg:flex-row justify-between items-center">
							{/* CTA content */}
							<div className="text-center lg:text-left lg:max-w-xl">
								<h3 className="h3 text-white mb-2">🚀 Ready to Transform Your Business?</h3>
								<p className="text-gray-300 text-lg mb-6">
									Ready to take your business to the next level? Start with our free Business Health
									Test to identify your growth opportunities, or enquire with us directly for
									personalized consulting services.
								</p>

								{/* Business Health Test CTA */}
								<div className="mb-6 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm border border-white border-opacity-20">
									<div className="flex items-center mb-3">
										<div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center mr-3">
											<svg
												className="w-4 h-4 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12l2 2 4-4"
												/>
											</svg>
										</div>
										<span className="text-white font-semibold">
											🎯 Free Business Health Assessment
										</span>
									</div>
									<p className="text-gray-200 text-sm mb-4">
										Discover your business strengths and get actionable insights in just 5 minutes.
									</p>
									<a
										href="/tests/business-health?testId=cmfjv3jsj0000o68f591sdr03"
										className="inline-flex items-center px-6 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
									>
										Take Free Test
										<svg
											className="w-4 h-4 ml-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M13 7l5 5m0 0l-5 5m5-5H6"
											/>
										</svg>
									</a>
								</div>

								{/* Growth Consultation CTA */}
								<div className="mb-6 p-4 bg-gradient-to-r from-primary-500 to-secondary-500 bg-opacity-20 rounded-lg backdrop-blur-sm border border-primary-400 border-opacity-30">
									<div className="flex items-center mb-3">
										<div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
											<svg
												className="w-4 h-4 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M13 10V3L4 14h7v7l9-11h-7z"
												/>
											</svg>
										</div>
										<span className="text-white font-semibold">
											💼 Personalized Growth Consultation
										</span>
									</div>
									<p className="text-gray-200 text-sm mb-4">
										Get expert guidance tailored to your business needs. Free initial consultation.
									</p>
									<div className="text-xs text-gray-300 mb-3">✨ What you'll get:</div>
									<ul className="text-xs text-gray-300 mb-4 space-y-1">
										<li>• Custom growth strategy roadmap</li>
										<li>• Industry-specific insights</li>
										<li>• Actionable recommendations</li>
										<li>• Ongoing support framework</li>
									</ul>
								</div>

								<p className="text-gray-300 text-lg mb-6">
									Or enquire with us directly for personalized consulting services. Our team is
									eagerly waiting to embark on this journey with you and help your business thrive in
									today's competitive market.
								</p>

								{/* CTA form */}
								<form className="w-full lg:w-auto" onSubmit={sendEnquiry}>
									<div className="flex flex-col sm:flex-row justify-start max-w-xs mx-auto sm:max-w-md lg:mx-0">
										{!emailSent && (
											<input
												type="email"
												className="form-input w-full appearance-none bg-gray-800 border border-gray-700 focus:border-gray-600 rounded-sm px-4 py-3 mb-2 sm:mb-0 sm:mr-2 text-white placeholder-gray-500"
												placeholder="Your email…"
												aria-label="Your email…"
												value={email}
												onChange={e => setEmail(e.target.value)}
												disabled={isSubmitting}
											/>
										)}
										<button
											type="submit"
											className="btn text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow disabled:opacity-50 disabled:cursor-not-allowed"
											disabled={isSubmitting || emailSent}
										>
											{isSubmitting ? (
												<div className="flex items-center">
													<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
													Sending...
												</div>
											) : !emailSent ? (
												'Enquire for Growth'
											) : (
												"Thank You! We'll Reach Out Soon"
											)}
										</button>
									</div>
									{/* Error message */}
									{error && (
										<p className="text-red-400 text-sm mt-3 text-center lg:text-left">{error}</p>
									)}
									{/* Success message */}
									{emailSent && (
										<div className="mt-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded-lg">
											<p className="text-green-300 text-sm text-center lg:text-left">
												✅ Thank you! We've received your enquiry and will reach out within 24
												hours.
											</p>
										</div>
									)}
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Newsletter;
