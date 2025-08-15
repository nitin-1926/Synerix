import emailjs from '@emailjs/browser';
import { useState } from 'react';

function Newsletter() {
	const [email, setEmail] = useState('');
	const [emailSent, setEmailSent] = useState(false);
	function sendEmail(e) {
		if (email.trim() === '') {
			return;
		}
		e.preventDefault();
		setEmailSent(true);
		var templateParams = {
			to_name: 'Synerix',
			from_name: email,
		};

		emailjs.send('service_pvhk1dk', 'template_z32oftj', templateParams, 'cP7kxt5F88IIaqTgE').then(
			function (response) {
				console.log('SUCCESS!', response.status, response.text);
			},
			function (error) {
				console.log('FAILED...', error);
			},
		);
		setEmail('');
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
								<h3 className="h3 text-white mb-2">Unleash the power of your Business</h3>
								<p className="text-gray-300 text-lg mb-6">
									To learn more about how our Synerix Business Consulting services can benefit your
									organization, please feel free to reach out to us via email or phone. Our team is
									eagerly waiting to embark on this journey with you and help your MSME thrive in
									today's competitive market.
								</p>

								{/* CTA form */}
								<form className="w-full lg:w-auto">
									<div className="flex flex-col sm:flex-row justify-start max-w-xs mx-auto sm:max-w-md lg:mx-0">
										{!emailSent && (
											<input
												type="email"
												className="form-input w-full appearance-none bg-gray-800 border border-gray-700 focus:border-gray-600 rounded-sm px-4 py-3 mb-2 sm:mb-0 sm:mr-2 text-white placeholder-gray-500"
												placeholder="Your email…"
												aria-label="Your email…"
												onChange={e => setEmail(e.target.value)}
											/>
										)}
										<a
											className="btn text-white bg-orange-600 hover:bg-orange-500 shadow"
											href="#0"
											onClick={sendEmail}
										>
											{!emailSent ? 'Connect' : 'We will reach you back!'}
										</a>
									</div>
									{/* Success message */}
									{/* <p className="text-sm text-gray-400 mt-3">Thanks for subscribing!</p> */}
									{/* <p className="text-sm text-gray-400 mt-3">7 days free trial. No credit card required.</p> */}
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
