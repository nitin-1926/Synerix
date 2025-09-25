import React, { useState, useEffect } from 'react';

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
	id?: string;
	name: string;
	type: 'paid' | 'free';
	description: string;
	questions: Question[];
	isActive: boolean;
}

interface TestFormProps {
	test?: Test | null;
	onSave: (test: Omit<Test, 'id'>) => Promise<void>;
	onCancel: () => void;
	isLoading: boolean;
}

const TestForm: React.FC<TestFormProps> = ({ test, onSave, onCancel, isLoading }) => {
	const [formData, setFormData] = useState<Omit<Test, 'id'>>({
		name: '',
		type: 'free',
		description: '',
		questions: [],
		isActive: true,
	});

	useEffect(() => {
		if (test) {
			setFormData({
				name: test.name,
				type: test.type,
				description: test.description || '',
				questions: test.questions,
				isActive: test.isActive,
			});
		}
	}, [test]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const addQuestion = () => {
		const newQuestion: Question = {
			id: Date.now().toString(),
			question: '',
			options: [
				{ id: '1', content: '', weightAge: '2' },
				{ id: '2', content: '', weightAge: '1' },
				{ id: '3', content: '', weightAge: '0' },
			],
			category: '',
		};

		setFormData(prev => ({
			...prev,
			questions: [...prev.questions, newQuestion],
		}));
	};

	const updateQuestion = (questionIndex: number, field: keyof Question, value: any) => {
		setFormData(prev => ({
			...prev,
			questions: prev.questions.map((q, i) => (i === questionIndex ? { ...q, [field]: value } : q)),
		}));
	};

	const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			questions: prev.questions.map((q, i) =>
				i === questionIndex
					? {
							...q,
							options: q.options.map((opt, j) => (j === optionIndex ? { ...opt, [field]: value } : opt)),
						}
					: q,
			),
		}));
	};

	const removeQuestion = (questionIndex: number) => {
		setFormData(prev => ({
			...prev,
			questions: prev.questions.filter((_, i) => i !== questionIndex),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSave(formData);
	};

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
				<div className="mt-3">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-medium text-gray-900">{test ? 'Edit Test' : 'Create New Test'}</h3>
						<button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Basic Information */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
								<input
									type="text"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									placeholder="Enter test name"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
								<select
									name="type"
									value={formData.type}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									<option value="free">Free</option>
									<option value="paid">Paid</option>
								</select>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
							<textarea
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								placeholder="Enter test description (optional)"
							/>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								name="isActive"
								checked={formData.isActive}
								onChange={handleInputChange}
								className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
							/>
							<label className="ml-2 block text-sm text-gray-900">Active (visible to users)</label>
						</div>

						{/* Questions Section */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h4 className="text-md font-medium text-gray-900">Questions</h4>
								<button
									type="button"
									onClick={addQuestion}
									className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
								>
									<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										/>
									</svg>
									Add Question
								</button>
							</div>

							<div className="space-y-4 max-h-96 overflow-y-auto">
								{formData.questions.map((question, questionIndex) => (
									<div key={question.id} className="border border-gray-200 rounded-lg p-4">
										<div className="flex items-start justify-between mb-3">
											<div className="flex-1 mr-4">
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Question {questionIndex + 1}
												</label>
												<input
													type="text"
													value={question.question}
													onChange={e =>
														updateQuestion(questionIndex, 'question', e.target.value)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
													placeholder="Enter your question"
												/>
											</div>
											<button
												type="button"
												onClick={() => removeQuestion(questionIndex)}
												className="text-red-500 hover:text-red-700 p-1"
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>

										<div className="mb-3">
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Category
											</label>
											<input
												type="text"
												value={question.category}
												onChange={e =>
													updateQuestion(questionIndex, 'category', e.target.value)
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
												placeholder="e.g., Financial Health, People & Compliance"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Options (with weightage)
											</label>
											<div className="space-y-2">
												{question.options.map((option, optionIndex) => (
													<div key={option.id} className="flex items-center space-x-2">
														<span className="text-sm text-gray-500 w-6">
															{optionIndex + 1}.
														</span>
														<input
															type="text"
															value={option.content}
															onChange={e =>
																updateOption(
																	questionIndex,
																	optionIndex,
																	'content',
																	e.target.value,
																)
															}
															className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
															placeholder="Option text"
														/>
														<input
															type="number"
															value={option.weightAge}
															onChange={e =>
																updateOption(
																	questionIndex,
																	optionIndex,
																	'weightAge',
																	e.target.value,
																)
															}
															className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
															placeholder="Score"
														/>
													</div>
												))}
											</div>
										</div>
									</div>
								))}
							</div>

							{formData.questions.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									<svg
										className="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									<p className="mt-2 text-sm">No questions added yet</p>
									<p className="text-xs">Click "Add Question" to get started</p>
								</div>
							)}
						</div>

						{/* Form Actions */}
						<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
							<button
								type="button"
								onClick={onCancel}
								className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? 'Saving...' : test ? 'Update Test' : 'Create Test'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default TestForm;
