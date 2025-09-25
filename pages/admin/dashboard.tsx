import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TestForm from '../../components/TestForm';

interface Test {
	id: string;
	name: string;
	type: 'paid' | 'free';
	description: string;
	questions: any[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

const AdminDashboard: React.FC = () => {
	const router = useRouter();
	const [tests, setTests] = useState<Test[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [editingTest, setEditingTest] = useState<Test | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		// Check authentication
		const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
		if (!isAuthenticated) {
			router.push('/admin');
			return;
		}

		fetchTests();
	}, [router]);

	const fetchTests = async () => {
		try {
			const response = await fetch('/api/admin/tests');
			const result = await response.json();

			if (response.ok && result.success) {
				setTests(result.data);
			} else {
				setError(result.error || 'Failed to fetch tests');
			}
		} catch (err) {
			setError('Failed to fetch tests');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateTest = () => {
		setEditingTest(null);
		setShowForm(true);
	};

	const handleEditTest = (test: Test) => {
		setEditingTest(test);
		setShowForm(true);
	};

	const handleSaveTest = async (testData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>) => {
		setSaving(true);
		try {
			const method = editingTest ? 'PUT' : 'POST';
			const url = editingTest ? `/api/admin/tests/${editingTest.id}` : '/api/admin/tests';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(testData),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				await fetchTests(); // Refresh the list
				setShowForm(false);
				setEditingTest(null);
			} else {
				setError(result.error || 'Failed to save test');
			}
		} catch (err) {
			setError('Error saving test');
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteTest = async (testId: string) => {
		if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/tests/${testId}`, {
				method: 'DELETE',
			});

			const result = await response.json();

			if (response.ok && result.success) {
				await fetchTests(); // Refresh the list
			} else {
				setError(result.error || 'Failed to delete test');
			}
		} catch (err) {
			setError('Error deleting test');
		}
	};

	const handleLogout = () => {
		sessionStorage.removeItem('adminAuthenticated');
		router.push('/admin');
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>Admin Dashboard - Synerix</title>
				<meta name="description" content="Admin dashboard for managing tests" />
			</Head>

			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<div className="bg-white shadow-sm border-b border-gray-200">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center py-4">
							<div className="flex items-center">
								<div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center mr-3">
									<svg
										className="w-5 h-5 text-white"
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
								</div>
								<h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
							</div>
							<button
								onClick={handleLogout}
								className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
							>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Logout
							</button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
					{error && (
						<div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
							<div className="flex">
								<div className="flex-shrink-0">
									<svg
										className="h-5 w-5 text-red-400"
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
								<div className="ml-3">
									<p className="text-sm font-medium text-red-800">{error}</p>
								</div>
							</div>
						</div>
					)}

					{/* Header with Create Button */}
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">Test Management</h2>
							<p className="mt-1 text-sm text-gray-600">Manage your business health assessment tests</p>
						</div>
						<button
							onClick={handleCreateTest}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
						>
							<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Create New Test
						</button>
					</div>

					{/* Tests Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{tests.map(test => (
							<div
								key={test.id}
								className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="text-lg font-semibold text-gray-900 mb-2">{test.name}</h3>
										<div className="flex items-center mb-3">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													test.type === 'free'
														? 'bg-green-100 text-green-800'
														: 'bg-blue-100 text-blue-800'
												}`}
											>
												{test.type}
											</span>
											<span
												className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													test.isActive
														? 'bg-green-100 text-green-800'
														: 'bg-red-100 text-red-800'
												}`}
											>
												{test.isActive ? 'Active' : 'Inactive'}
											</span>
										</div>
										{test.description && (
											<p className="text-sm text-gray-600 mb-3 line-clamp-2">
												{test.description}
											</p>
										)}
										<div className="text-sm text-gray-500">
											<p>{test.questions.length} questions</p>
											<p>Created {new Date(test.createdAt).toLocaleDateString()}</p>
										</div>
									</div>
								</div>

								<div className="mt-4 flex space-x-2">
									<button
										onClick={() => handleEditTest(test)}
										className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
									>
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
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
										Edit
									</button>
									<button
										onClick={() => handleDeleteTest(test.id)}
										className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
									>
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>

					{tests.length === 0 && !isLoading && (
						<div className="text-center py-12">
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
							<h3 className="mt-2 text-sm font-medium text-gray-900">No tests</h3>
							<p className="mt-1 text-sm text-gray-500">Get started by creating a new test.</p>
							<div className="mt-6">
								<button
									onClick={handleCreateTest}
									className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
								>
									<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										/>
									</svg>
									Create New Test
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Test Form Modal */}
				{showForm && (
					<TestForm
						test={editingTest}
						onSave={handleSaveTest}
						onCancel={() => {
							setShowForm(false);
							setEditingTest(null);
						}}
						isLoading={saving}
					/>
				)}
			</div>
		</>
	);
};

export default AdminDashboard;
