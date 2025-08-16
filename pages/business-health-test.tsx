import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { businessDiagnosticQuestions } from '../data/questions';

interface UserInfo {
	name: string;
	businessName: string;
	businessDescription: string;
	email?: string;
}

interface Answer {
	questionId: string;
	optionId: string;
	weightage: number;
}

const BusinessHealthTest: React.FC = () => {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(0);
	const [userInfo, setUserInfo] = useState<UserInfo>({
		name: '',
		businessName: '',
		businessDescription: '',
	});
	const [answers, setAnswers] = useState<Answer[]>([]);
	const [showCongratulations, setShowCongratulations] = useState(false);
	const [showEmailForm, setShowEmailForm] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
	const [inputValue, setInputValue] = useState('');

	// Total steps: 3 user info + business diagnostic questions
	const totalSteps = 3 + businessDiagnosticQuestions.length;
	const progress = ((currentStep + 1) / totalSteps) * 100;

	useEffect(() => {
		// Set initial input value based on current step
		if (currentStep === 0) setInputValue(userInfo.name);
		else if (currentStep === 1) setInputValue(userInfo.businessName);
		else if (currentStep === 2) setInputValue(userInfo.businessDescription);
		else setInputValue('');
	}, [currentStep, userInfo]);

	const handleInputChange = (value: string) => {
		setInputValue(value);
	};

	const handleAnswerSelect = (questionId: string, optionId: string, weightage: number) => {
		setAnswers(prev => {
			const existing = prev.findIndex(a => a.questionId === questionId);
			const newAnswer = { questionId, optionId, weightage };

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
		const totalScore = answers.reduce((sum, answer) => sum + answer.weightage, 0);
		const maxPossibleScore = businessDiagnosticQuestions.length * 2;
		return Math.round((totalScore / maxPossibleScore) * 100);
	};

	const handleNext = () => {
		// Save user info based on current step
		if (currentStep === 0) {
			setUserInfo(prev => ({ ...prev, name: inputValue }));
		} else if (currentStep === 1) {
			setUserInfo(prev => ({ ...prev, businessName: inputValue }));
		} else if (currentStep === 2) {
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
		setShowEmailForm(true);
	};

	const handleEmailSubmit = () => {
		if (!userInfo.email?.trim()) return;

		setIsSubmitting(true);
		setTimeout(() => {
			const score = calculateScore();
			alert(
				`🎉 Congratulations! Your Business Health Score is ${score}%\n\nBased on your responses, ${getScoreMessage(score)}`,
			);
			setIsSubmitting(false);
			router.push('/');
		}, 1500);
	};

	const getScoreMessage = (score: number) => {
		if (score >= 80) return 'your business shows excellent health with strong fundamentals across all areas!';
		if (score >= 60) return 'your business is performing well but has some areas for improvement.';
		if (score >= 40) return 'your business has potential but needs strategic improvements in key areas.';
		return 'your business requires immediate attention in several critical areas to ensure sustainability.';
	};

	const canProceed = () => {
		if (currentStep <= 2) return inputValue.trim() !== '';
		if (currentStep >= 3) {
			const questionIndex = currentStep - 3;
			const questionId = businessDiagnosticQuestions[questionIndex]?.id;
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
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
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
								<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-scale-in">
									<svg
										className="w-10 h-10 text-green-600"
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
								<div className="absolute inset-0 w-20 h-20 border-4 border-green-200 rounded-full mx-auto animate-ping"></div>
							</div>

							{/* Congratulations Text */}
							<div className="space-y-4">
								<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🎉 Well done!</h1>
								<p className="text-base sm:text-lg text-gray-600 leading-relaxed">
									You've successfully completed the Business Health Assessment. Your insights are
									ready!
								</p>
							</div>

							{/* Email Form or Success Button */}
							{!showEmailForm ? (
								<div className="space-y-4">
									<p className="text-gray-700">
										Get your detailed analysis report and personalized recommendations.
									</p>
									<button
										onClick={handleFinishTest}
										className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
									>
										Get My Detailed Report
									</button>
								</div>
							) : (
								<div className="space-y-6">
									<div className="text-left">
										<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
											Email address
										</label>
										<input
											type="email"
											id="email"
											className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
											placeholder="your.email@example.com"
											value={userInfo.email || ''}
											onChange={e => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
											onKeyPress={e => e.key === 'Enter' && handleEmailSubmit()}
										/>
									</div>
									<button
										onClick={handleEmailSubmit}
										disabled={isSubmitting || !userInfo.email?.trim()}
										className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
				question: "What's your business name?",
				type: 'input' as const,
				placeholder: 'Enter your business name',
				subtitle: 'Tell us about your business',
			};
		} else if (currentStep === 2) {
			return {
				question: 'What does your business do?',
				type: 'textarea' as const,
				placeholder: 'Describe what your business does, what products/services you offer...',
				subtitle: 'Help us understand your business better',
			};
		} else {
			const questionIndex = currentStep - 3;
			const question = businessDiagnosticQuestions[questionIndex];
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
		currentStep >= 3 ? answers.find(a => a.questionId === businessDiagnosticQuestions[currentStep - 3]?.id) : null;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
			{/* Header */}
			<Header />

			{/* Progress Bar */}
			<div className="fixed top-16 md:top-20 left-0 right-0 z-50">
				<div className="h-1 bg-gray-200">
					<div
						className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
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
								<div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
										type="text"
										className="w-full px-4 py-4 text-base sm:text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 bg-white"
										placeholder={currentQuestion.placeholder}
										value={inputValue}
										onChange={e => handleInputChange(e.target.value)}
										onKeyPress={handleKeyPress}
										autoFocus
									/>
								</div>
							)}

							{currentQuestion.type === 'textarea' && (
								<div className="px-2">
									<textarea
										rows={4}
										className="w-full px-4 py-4 text-base sm:text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 resize-none bg-white"
										placeholder={currentQuestion.placeholder}
										value={inputValue}
										onChange={e => handleInputChange(e.target.value)}
										onKeyPress={handleKeyPress}
										autoFocus
									/>
									<div className="text-xs text-gray-500 mt-2 text-right">
										{inputValue.length}/500 characters
									</div>
								</div>
							)}

							{currentQuestion.type === 'options' && (
								<div className="space-y-3 px-2">
									{currentQuestion.options?.map((option, index) => (
										<button
											key={option.id}
											onClick={() =>
												handleAnswerSelect(
													businessDiagnosticQuestions[currentStep - 3].id,
													option.id,
													parseInt(option.weightage),
												)
											}
											className={`w-full p-4 sm:p-5 text-left border-2 rounded-xl transition-all duration-200 hover:shadow-md group animate-stagger-in ${
												selectedAnswer?.optionId === option.id
													? 'border-blue-500 bg-blue-50 shadow-md'
													: 'border-gray-200 hover:border-gray-300'
											}`}
											style={{ animationDelay: `${index * 150}ms` }}
										>
											<div className="flex items-start">
												<div
													className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 sm:mr-4 flex-shrink-0 ${
														selectedAnswer?.optionId === option.id
															? 'border-blue-500 bg-blue-500'
															: 'border-gray-300 group-hover:border-gray-400'
													}`}
												>
													{selectedAnswer?.optionId === option.id && (
														<div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center">
															<div className="w-2 h-2 rounded-full bg-white"></div>
														</div>
													)}
												</div>
												<span className="text-gray-800 leading-relaxed text-sm sm:text-base">
													{option.content}
												</span>
											</div>
										</button>
									))}
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
									className="flex items-center px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg text-sm sm:text-base"
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
