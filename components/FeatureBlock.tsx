import React from 'react';

interface FeatureBlockProps {
	title: string;
	description: string;
	icon: React.ReactNode;
}

const FeatureBlock: React.FC<FeatureBlockProps> = ({ title, description, icon }) => {
	return (
		<div className="relative flex flex-col p-6 bg-white rounded shadow-xl h-full">
			<center>
				<div className={`w-16 h-16 p-1 -mt-1 mb-2 text-secondary-700`}>
					<svg className="w-16 h-16 p-1 -mt-1 mb-2" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
						<g fill="none" fillRule="evenodd">
							<rect className="fill-current text-secondary-700" width="64" height="64" rx="32" />
							{icon}
						</g>
					</svg>
				</div>
			</center>
			<h4 className="text-lg font-bold leading-snug tracking-tight mb-1">{title}</h4>
			<p className="text-gray-600 text-md">{description}</p>
		</div>
	);
};

export default FeatureBlock;
