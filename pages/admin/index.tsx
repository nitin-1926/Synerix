import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const AdminLogin: React.FC = () => {
	const router = useRouter();
	const [credentials, setCredentials] = useState({
		username: '',
		password: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setCredentials(prev => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			// Check credentials against environment variables
			const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USER_NAME || 'admin';
			const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Synerix@Apple@123';

			if (credentials.username === adminUsername && credentials.password === adminPassword) {
				// Store authentication in sessionStorage
				sessionStorage.setItem('adminAuthenticated', 'true');
				router.push('/admin/dashboard');
			} else {
				setError('Invalid username or password');
			}
		} catch (err) {
			setError('An error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Head>
				<title>Admin Login - Synerix</title>
				<meta name="description" content="Admin login for Synerix Business Solutions" />
			</Head>

			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<div className="text-center">
						<div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
						</div>
						<h2 className="text-3xl font-extrabold text-gray-900">Admin Access</h2>
						<p className="mt-2 text-sm text-gray-600">Sign in to access the admin dashboard</p>
					</div>
				</div>

				<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
					<div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-200">
						<form className="space-y-6" onSubmit={handleSubmit}>
							<div>
								<label htmlFor="username" className="block text-sm font-medium text-gray-700">
									Username
								</label>
								<div className="mt-1">
									<input
										id="username"
										name="username"
										type="text"
										autoComplete="username"
										required
										value={credentials.username}
										onChange={handleInputChange}
										className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
										placeholder="Enter username"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="password" className="block text-sm font-medium text-gray-700">
									Password
								</label>
								<div className="mt-1">
									<input
										id="password"
										name="password"
										type="password"
										autoComplete="current-password"
										required
										value={credentials.password}
										onChange={handleInputChange}
										className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
										placeholder="Enter password"
									/>
								</div>
							</div>

							{error && (
								<div className="rounded-md bg-red-50 p-4">
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

							<div>
								<button
									type="submit"
									disabled={isLoading}
									className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
								>
									{isLoading ? (
										<div className="flex items-center">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Signing in...
										</div>
									) : (
										'Sign in'
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</>
	);
};

export default AdminLogin;
