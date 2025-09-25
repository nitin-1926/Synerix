import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

interface Question {
	id: string;
	question: string;
	options: {
		id: string;
		content: string;
		weightAge: string | number;
	}[];
	category: string;
}

interface Test {
	id: string;
	name: string;
	type: string;
	description: string;
	questions: Question[];
}

interface UserInfo {
	name: string;
	phoneNumber: string;
	email: string;
	businessName: string;
	businessDescription: string;
}

interface Answer {
	questionId: string;
	optionId: string;
	weightAge: number;
}

const BusinessHealthTest: React.FC = () => {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(0);
	const [testData, setTestData] = useState<Test | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [userInfo, setUserInfo] = useState<UserInfo>({
		name: '',
		phoneNumber: '',
		email: '',
		businessName: '',
		businessDescription: '',
	});
	const [answers, setAnswers] = useState<Answer[]>([]);
	const [showCongratulations, setShowCongratulations] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [reportSent, setReportSent] = useState(false);
	const [isCheckingUser, setIsCheckingUser] = useState(false);
	const [existingUser, setExistingUser] = useState<any>(null);
	const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
	const [inputValue, setInputValue] = useState('');
	const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

	// Fetch test data on component mount
	useEffect(() => {
		const fetchTestData = async () => {
			// Wait for router to be ready and get testId from query params
			if (!router.isReady) return;

			const testId = (router.query.testId as string) || 'cmfjv3jsj0000o68f591sdr03'; // fallback to default

			try {
				const response = await fetch(`/api/test?testId=${testId}`);
				const result = await response.json();

				if (response.ok && result.success) {
					setTestData(result.data);
				} else {
					setError(result.error || 'Failed to load test');
				}
			} catch (err) {
				setError('Failed to load test data');
				console.error('Error fetching test:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchTestData();
	}, [router.isReady, router.query.testId]);

	// Total steps: 5 user info + questions from database
	const totalSteps = 5 + (testData?.questions?.length || 0);
	const progress = ((currentStep + 1) / totalSteps) * 100;

	useEffect(() => {
		// Set initial input value based on current step
		if (currentStep === 0) setInputValue(userInfo.name);
		else if (currentStep === 1) setInputValue(userInfo.phoneNumber);
		else if (currentStep === 2) setInputValue(userInfo.email);
		else if (currentStep === 3) setInputValue(userInfo.businessName);
		else if (currentStep === 4) setInputValue(userInfo.businessDescription);
		else setInputValue('');
	}, [currentStep, userInfo]);

	// Validation functions
	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const validatePhoneNumber = (phone: string): boolean => {
		// Remove all non-digit characters
		const digitsOnly = phone.replace(/\D/g, '');
		// Check if it's between 10-15 digits (international format)
		return digitsOnly.length >= 10 && digitsOnly.length <= 15;
	};

	const validateCurrentStep = (): boolean => {
		const errors: { [key: string]: string } = {};

		if (currentStep === 0 && !inputValue.trim()) {
			errors.name = 'Name is required';
		}

		if (currentStep === 1) {
			if (!inputValue.trim()) {
				errors.phoneNumber = 'Phone number is required';
			} else if (!validatePhoneNumber(inputValue)) {
				errors.phoneNumber = 'Please enter a valid phone number (10-15 digits)';
			}
		}

		if (currentStep === 2) {
			if (!inputValue.trim()) {
				errors.email = 'Email is required';
			} else if (!validateEmail(inputValue)) {
				errors.email = 'Please enter a valid email address';
			}
		}

		if (currentStep === 3 && !inputValue.trim()) {
			errors.businessName = 'Business name is required';
		}

		if (currentStep === 4 && !inputValue.trim()) {
			errors.businessDescription = 'Business description is required';
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleInputChange = (value: string) => {
		setInputValue(value);
		// Clear validation errors when user starts typing
		setValidationErrors({});
	};

	const handleAnswerSelect = (questionId: string, optionId: string, weightAge: number) => {
		setAnswers(prev => {
			const existing = prev.findIndex(a => a.questionId === questionId);
			const newAnswer = { questionId, optionId, weightAge };

			if (existing >= 0) {
				const updated = [...prev];
				updated[existing] = newAnswer;
				return updated;
			}
			return [...prev, newAnswer];
		});

		// Auto-advance after selection
		setTimeout(() => {
			handleNext();
		}, 300);
	};

	const calculateScore = () => {
		if (!testData?.questions?.length) return 0;

		const totalScore = answers.reduce((sum, answer) => sum + answer.weightAge, 0);
		const maxPossibleScore = testData.questions.length * 2;
		return Math.round((totalScore / maxPossibleScore) * 100);
	};

	const checkExistingUser = async (email: string) => {
		if (!userInfo.phoneNumber.trim()) return;

		setIsCheckingUser(true);
		try {
			const response = await fetch('/api/check-user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					phoneNumber: userInfo.phoneNumber,
					email: email,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				if (result.hasTakenTest) {
					setExistingUser(result);
				} else {
					// User doesn't exist, proceed to next step
					setAnimationDirection('forward');
					setCurrentStep(prev => prev + 1);
				}
			} else {
				console.error('Check user error:', result);
				// Show error message instead of proceeding
				setError('Unable to verify user information. Please try again.');
			}
		} catch (error) {
			console.error('Error checking user:', error);
			// Show error message instead of proceeding
			setError('Network error occurred while checking user information. Please try again.');
		} finally {
			setIsCheckingUser(false);
		}
	};

	const handleNext = () => {
		// Validate current step before proceeding
		if (!validateCurrentStep()) {
			return;
		}

		// Save user info based on current step
		if (currentStep === 0) {
			setUserInfo(prev => ({ ...prev, name: inputValue }));
		} else if (currentStep === 1) {
			setUserInfo(prev => ({ ...prev, phoneNumber: inputValue }));
		} else if (currentStep === 2) {
			setUserInfo(prev => ({ ...prev, email: inputValue }));
			// Check if user already exists after entering email
			checkExistingUser(inputValue);
			return; // Don't proceed until check is complete
		} else if (currentStep === 3) {
			setUserInfo(prev => ({ ...prev, businessName: inputValue }));
		} else if (currentStep === 4) {
			setUserInfo(prev => ({ ...prev, businessDescription: inputValue }));
		}

		if (currentStep < totalSteps - 1) {
			setAnimationDirection('forward');
			setCurrentStep(prev => prev + 1);
		} else {
			setShowCongratulations(true);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setAnimationDirection('backward');
			setCurrentStep(prev => prev - 1);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && canProceed()) {
			e.preventDefault();
			handleNext();
		}
	};

	const handleFinishTest = () => {
		handleEmailSubmit();
	};

	const handleEmailSubmit = async () => {
		setIsSubmitting(true);

		try {
			const score = calculateScore();
			const testId = (router.query.testId as string) || 'cmfjv3jsj0000o68f591sdr03'; // fallback to default

			const response = await fetch('/api/send-test-report', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: userInfo.email,
					phoneNumber: userInfo.phoneNumber,
					name: userInfo.name,
					businessName: userInfo.businessName,
					businessDescription: userInfo.businessDescription,
					testScore: score,
					testId: testId,
					answers: answers,
				}),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Show success message with elegant UI
				setReportSent(true);
				setShowCongratulations(true);

				// Navigate back to home after 5 seconds
				setTimeout(() => {
					try {
						router.push('/');
					} catch (error) {
						console.error('Error during navigation:', error);
						// Fallback to window.location if router fails
						window.location.href = '/';
					}
				}, 5000);
			} else {
				console.error('API Error:', result);

				// Handle specific error cases
				let errorMessage = result.error || 'Something went wrong. Please try again.';

				if (result.error === 'Test already completed') {
					// Handle duplicate test submission - show existing user interface
					setExistingUser({
						hasTakenTest: true,
						message: result.message,
						testDate: result.testDate,
						testScore: result.testScore,
					});
					return; // Exit early to show existing user UI
				} else if (result.error === 'Email service not configured') {
					errorMessage = 'Email service is currently unavailable. Please contact support or try again later.';
				} else if (result.error === 'Email service configuration error') {
					errorMessage = 'Email service configuration error. Please contact support.';
				} else if (result.error && result.error.includes('Invalid email')) {
					errorMessage = 'Please enter a valid email address and try again.';
				} else if (result.error && result.error.includes('cannot receive emails')) {
					errorMessage = 'This email address cannot receive emails. Please use a different email address.';
				}

				alert(`Error sending report: ${errorMessage}\n\nPlease check the console for more details.`);
			}
		} catch (error) {
			console.error('Error sending report:', error);

			// Handle network errors more gracefully
			let errorMessage = 'Failed to send report. Please check your internet connection and try again.';

			if (error instanceof TypeError && error.message.includes('fetch')) {
				errorMessage = 'Network error. Please check your internet connection and try again.';
			}

			alert(`${errorMessage}\n\nError details logged to console.`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getScoreMessage = (score: number) => {
		if (score >= 80) return 'your business shows excellent health with strong fundamentals across all areas!';
		if (score >= 60) return 'your business is performing well but has some areas for improvement.';
		if (score >= 40) return 'your business has potential but needs strategic improvements in key areas.';
		return 'your business requires immediate attention in several critical areas to ensure sustainability.';
	};

	const canProceed = () => {
		if (currentStep <= 4) return inputValue.trim() !== '' && Object.keys(validationErrors).length === 0;
		if (currentStep >= 5 && testData?.questions) {
			const questionIndex = currentStep - 5;
			const questionId = testData.questions[questionIndex]?.id;
			return answers.some(a => a.questionId === questionId);
		}
		return false;
	};

	// Add keyboard navigation
	useEffect(() => {
		const handleGlobalKeyPress = (e: KeyboardEvent) => {
			if (e.key === 'Enter' && currentStep >= 3 && canProceed()) {
				// Don't auto-advance on options, let user click
				return;
			}
			if (e.key === 'Escape') {
				router.push('/');
			}
		};

		window.addEventListener('keydown', handleGlobalKeyPress);
		return () => window.removeEventListener('keydown', handleGlobalKeyPress);
	}, [currentStep, canProceed, router]);

	// Congratulations Screen
	if (showCongratulations) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
				{/* Header */}
				<Header />

				{/* Close Button */}
				<div className="absolute top-20 md:top-24 right-4 z-40">
					<button
						onClick={() => router.push('/')}
						className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center text-gray-500 hover:text-gray-700"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Main Content */}
				<div className="flex-1 flex items-center justify-center p-4 sm:p-6 pt-24 md:pt-28">
					<div className="max-w-md w-full">
						<div className="text-center space-y-6 sm:space-y-8 animate-fade-in">
							{/* Success Icon */}
							<div className="relative">
								<div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto animate-scale-in">
									<svg
										className="w-10 h-10 text-secondary-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<div className="absolute inset-0 w-20 h-20 border-4 border-secondary-200 rounded-full mx-auto animate-ping"></div>
							</div>

							{/* Congratulations Text */}
							<div className="space-y-4">
								{reportSent ? (
									<>
										<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
											📧 Report Sent Successfully!
										</h1>
										<div className="space-y-3">
											<p className="text-base sm:text-lg text-gray-600 leading-relaxed">
												🎉 Congratulations! Your Business Health Score is {calculateScore()}%
											</p>
											<p className="text-base text-gray-600 leading-relaxed">
												Your detailed report has been sent to <strong>{userInfo.email}</strong>
											</p>
											<p className="text-sm text-gray-500 leading-relaxed">
												Based on your responses, {getScoreMessage(calculateScore())}
											</p>
											<div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
												<p className="text-sm text-green-800">
													📬 Please check your email (including spam folder) for your
													comprehensive business health report.
												</p>
											</div>
											<p className="text-xs text-gray-400 mt-4">
												Redirecting to home page in 5 seconds...
											</p>
										</div>
									</>
								) : (
									<>
										<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🎉 Well done!</h1>
										<p className="text-base sm:text-lg text-gray-600 leading-relaxed">
											You've successfully completed the Business Health Assessment. Your insights
											are ready!
										</p>
									</>
								)}
							</div>

							{/* Email Form or Success Button */}
							{!reportSent && (
								<div className="space-y-4">
									<p className="text-gray-700">
										Get your detailed analysis report and personalized recommendations.
									</p>
									<button
										onClick={handleFinishTest}
										disabled={isSubmitting}
										className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
									>
										{isSubmitting ? (
											<div className="flex items-center justify-center">
												<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
												Generating Report...
											</div>
										) : (
											'Send My Report'
										)}
									</button>
								</div>
							)}

							{/* Return Link */}
							<button
								onClick={() => router.push('/')}
								className="text-gray-500 hover:text-gray-700 text-sm underline"
							>
								← Return to Homepage
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const getCurrentQuestion = () => {
		if (currentStep === 0) {
			return {
				question: "What's your name?",
				type: 'input' as const,
				placeholder: 'Enter your full name',
				subtitle: "Let's start by getting to know you",
			};
		} else if (currentStep === 1) {
			return {
				question: "What's your phone number?",
				type: 'input' as const,
				placeholder: 'Enter your phone number (e.g., +91 9876543210)',
				subtitle: 'We need this to connect with you',
			};
		} else if (currentStep === 2) {
			return {
				question: "What's your email address?",
				type: 'input' as const,
				placeholder: 'Enter your email address',
				subtitle: 'Your detailed report will be sent here',
			};
		} else if (currentStep === 3) {
			return {
				question: "What's your business name?",
				type: 'input' as const,
				placeholder: 'Enter your business name',
				subtitle: 'Tell us about your business',
			};
		} else if (currentStep === 4) {
			return {
				question: 'What does your business do?',
				type: 'textarea' as const,
				placeholder: 'Describe what your business does, what products/services you offer...',
				subtitle: 'Help us understand your business better',
			};
		} else {
			const questionIndex = currentStep - 5;
			if (!testData?.questions || questionIndex >= testData.questions.length) {
				return {
					question: 'Loading...',
					type: 'options' as const,
					options: [],
				};
			}
			const question = testData.questions[questionIndex];
			return {
				question: question.question,
				type: 'options' as const,
				options: question.options,
				category: question.category,
			};
		}
	};

	const currentQuestion = getCurrentQuestion();
	const selectedAnswer =
		currentStep >= 5 && testData?.questions
			? answers.find(a => a.questionId === testData.questions[currentStep - 5]?.id)
			: null;

	// Show loading state
	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
				<Header />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading test...</p>
					</div>
				</div>
			</div>
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
				<Header />
				<div className="flex-1 flex items-center justify-center p-4">
					<div className="text-center max-w-md">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Test</h3>
						<p className="text-gray-600 mb-4">{error}</p>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Show existing user message
	if (existingUser) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
				{/* Header */}
				<Header />

				{/* Main Content */}
				<div className="flex-1 flex items-center justify-center p-4 sm:p-6 pt-24 md:pt-28">
					<div className="max-w-md w-full">
						<div className="text-center space-y-6 sm:space-y-8 animate-fade-in">
							{/* Warning Icon */}
							<div className="relative">
								<div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto animate-scale-in">
									<svg
										className="w-10 h-10 text-yellow-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
										/>
									</svg>
								</div>
							</div>

							{/* Message */}
							<div className="space-y-4">
								<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
									You've Already Taken This Test! 🎯
								</h1>
								<div className="space-y-3">
									<p className="text-base sm:text-lg text-gray-600 leading-relaxed">
										We found that you've already completed the Business Health Assessment on{' '}
										<strong>{new Date(existingUser.testDate).toLocaleDateString()}</strong> with a
										score of <strong>{existingUser.testScore}%</strong>.
									</p>
									<p className="text-base text-gray-600 leading-relaxed">{existingUser.message}</p>
									<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
										<p className="text-sm text-amber-800">
											📋 <strong>One Test Per User Policy:</strong> To ensure data integrity and
											prevent duplicate assessments, each phone number and email combination can
											only take the test once.
										</p>
									</div>
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
										<p className="text-sm text-blue-800">
											💼 Ready for personalized consulting? Our experts can help you implement the
											recommendations from your previous assessment.
										</p>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-4">
								<button
									onClick={() => {
										// Trigger the connect functionality from the main page
										window.location.href = '/#services';
									}}
									className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
								>
									Connect for Personalized Consulting
								</button>
								<button
									onClick={() => router.push('/')}
									className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
								>
									Return to Home
								</button>
							</div>

							{/* Return Link */}
							<button
								onClick={() => router.push('/')}
								className="text-gray-500 hover:text-gray-700 text-sm underline"
							>
								← Return to Homepage
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex flex-col">
			{/* Header */}
			<Header />

			{/* Progress Bar */}
			<div className="fixed top-16 md:top-20 left-0 right-0 z-50">
				<div className="h-1 bg-gray-200">
					<div
						className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out"
						style={{ width: `${progress}%` }}
					></div>
				</div>
			</div>

			{/* Close Button */}
			<div className="absolute top-20 md:top-24 right-4 z-40">
				<button
					onClick={() => router.push('/')}
					className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center text-gray-500 hover:text-gray-700"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex items-center justify-center p-4 pt-24 md:pt-28 pb-20">
				<div className="max-w-2xl w-full">
					{/* Question Container */}
					<div
						key={currentStep}
						className={`transform transition-all duration-500 ease-out ${
							animationDirection === 'forward' ? 'animate-slide-up' : 'animate-slide-down'
						}`}
					>
						{/* Question Header */}
						<div className="text-center mb-8 space-y-3">
							{currentQuestion.category && (
								<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
									{currentQuestion.category}
								</div>
							)}
							<div className="text-sm text-gray-500 font-medium">{currentQuestion.subtitle}</div>
							<h1 className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-900 leading-tight px-2">
								{currentQuestion.question}
							</h1>
						</div>

						{/* Answer Section */}
						<div className="space-y-4">
							{currentQuestion.type === 'input' && (
								<div className="px-2">
									<input
										type={currentStep === 2 ? 'email' : currentStep === 1 ? 'tel' : 'text'}
										className={`w-full px-4 py-4 text-base sm:text-lg border-2 rounded-xl focus:ring-0 transition-colors duration-200 bg-white ${
											validationErrors[Object.keys(validationErrors)[0]]
												? 'border-red-500 focus:border-red-500'
												: 'border-gray-200 focus:border-primary-500'
										}`}
										placeholder={currentQuestion.placeholder}
										value={inputValue}
										onChange={e => handleInputChange(e.target.value)}
										onKeyPress={handleKeyPress}
										autoFocus
									/>
									{validationErrors[Object.keys(validationErrors)[0]] && (
										<div className="mt-2 text-sm text-red-600 flex items-center">
											<svg
												className="w-4 h-4 mr-1"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
												/>
											</svg>
											{validationErrors[Object.keys(validationErrors)[0]]}
										</div>
									)}
								</div>
							)}

							{currentQuestion.type === 'textarea' && (
								<div className="px-2">
									<textarea
										rows={4}
										className={`w-full px-4 py-4 text-base sm:text-lg border-2 rounded-xl focus:ring-0 transition-colors duration-200 resize-none bg-white ${
											validationErrors[Object.keys(validationErrors)[0]]
												? 'border-red-500 focus:border-red-500'
												: 'border-gray-200 focus:border-primary-500'
										}`}
										placeholder={currentQuestion.placeholder}
										value={inputValue}
										onChange={e => handleInputChange(e.target.value)}
										onKeyPress={handleKeyPress}
										autoFocus
									/>
									{validationErrors[Object.keys(validationErrors)[0]] && (
										<div className="mt-2 text-sm text-red-600 flex items-center">
											<svg
												className="w-4 h-4 mr-1"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
												/>
											</svg>
											{validationErrors[Object.keys(validationErrors)[0]]}
										</div>
									)}
									<div className="text-xs text-gray-500 mt-2 text-right">
										{inputValue.length}/500 characters
									</div>
								</div>
							)}

							{currentQuestion.type === 'options' && testData?.questions && (
								<div className="space-y-3 px-2">
									{currentQuestion.options?.map((option, index) => {
										const questionIndex = currentStep - 5;
										const questionId = testData.questions[questionIndex]?.id;

										return (
											<button
												key={option.id}
												onClick={() =>
													handleAnswerSelect(
														questionId,
														option.id,
														parseInt(String(option.weightAge)),
													)
												}
												className={`w-full p-4 sm:p-5 text-left border-2 rounded-xl transition-all duration-200 hover:shadow-md group animate-stagger-in ${
													selectedAnswer?.optionId === option.id
														? 'border-primary-500 bg-primary-50 shadow-md'
														: 'border-gray-200 hover:border-gray-300'
												}`}
												style={{ animationDelay: `${index * 150}ms` }}
											>
												<div className="flex items-start">
													<div
														className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 sm:mr-4 flex-shrink-0 ${
															selectedAnswer?.optionId === option.id
																? 'border-primary-500 bg-primary-500'
																: 'border-gray-300 group-hover:border-gray-400'
														}`}
													>
														{selectedAnswer?.optionId === option.id && (
															<div className="w-full h-full rounded-full bg-primary-500 flex items-center justify-center">
																<div className="w-2 h-2 rounded-full bg-white"></div>
															</div>
														)}
													</div>
													<span className="text-gray-800 leading-relaxed text-sm sm:text-base">
														{option.content}
													</span>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* Navigation */}
						<div className="flex items-center justify-between mt-8 sm:mt-12 px-2">
							<button
								onClick={handleBack}
								disabled={currentStep === 0}
								className={`flex items-center px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 text-sm sm:text-base ${
									currentStep === 0 ? 'invisible' : ''
								}`}
							>
								<svg
									className="w-4 h-4 mr-1 sm:mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 19l-7-7 7-7"
									/>
								</svg>
								Back
							</button>

							{currentQuestion.type !== 'options' && (
								<button
									onClick={handleNext}
									disabled={!canProceed()}
									className="flex items-center px-6 sm:px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg text-sm sm:text-base"
								>
									{currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
									<svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Progress Indicator */}
			<div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40">
				<div className="bg-white rounded-full px-3 sm:px-4 py-2 shadow-lg border border-gray-200">
					<div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
						<span className="font-medium">{currentStep + 1}</span>
						<span>of</span>
						<span>{totalSteps}</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BusinessHealthTest;
