import {
	BusinessPlanningIcon,
	FinancialManagementIcon,
	OperationsIcon,
	MarketingIcon,
	TechIcon,
	SupplyChainIcon,
} from '../components/icons/FeatureIcons';

export interface FeatureData {
	title: string;
	description: string;
	icon: React.ComponentType;
}

export const featuresData: FeatureData[] = [
	{
		title: 'Business Planning & Strategy 🚀',
		description:
			"At Synerix, we believe that a robust plan is the cornerstone of a thriving business. Collaborating closely with you, our experts develop comprehensive business plans and strategies tailored to achieve your short and long-term goals. From in-depth market analysis and competitive research to meticulous financial forecasting and risk management, we've got every aspect covered.",
		icon: BusinessPlanningIcon,
	},
	{
		title: 'Financial Management 💰',
		description:
			'For MSMEs, effective allocation of financial resources is paramount. Our financial consultants are dedicated to assisting you with budgeting, cash flow management, cost optimization, and financial modeling. We aim to empower you with the knowledge and tools needed to make informed decisions, ensuring your finances are not just managed but optimized for maximum profitability.',
		icon: FinancialManagementIcon,
	},
	{
		title: 'OPS & Process Improvement 🔄',
		description:
			'Efficiency is the key to sustained growth. Our consultants specialize in identifying bottlenecks and streamlining processes to enhance productivity and reduce costs. By analyzing your operations and implementing best practices, we empower your business to deliver exceptional products or services. We transform challenges into opportunities, ensuring your operations are finely tuned for success.',
		icon: OperationsIcon,
	},
	{
		title: 'Marketing and Branding 📢',
		description:
			"In the competitive landscape of MSMEs, effective marketing is non-negotiable. Our marketing experts collaborate closely with you to develop personalized strategies, build your brand's identity, and deploy various channels to generate leads and boost visibility. From conceptualization to execution, we ensure your brand stands out.",
		icon: MarketingIcon,
	},
	{
		title: 'Tech & Digital Transformation 🔧',
		description:
			'In the digital age, staying ahead is imperative. Our consultants guide you through the process of digital transformation, leveraging technology to streamline operations, drive innovation, enhance customer experience, and gain a competitive edge. We ensure your business not only adapts to the digital era but thrives in it.',
		icon: TechIcon,
	},
	{
		title: 'Supply Chain Optimization 🌐',
		description:
			'Efficient supply chain management is the backbone of successful businesses. Our consultants work closely with you to optimize your supply chain, ensuring smooth and cost-effective operations. From inventory management to logistics optimization, we enhance your supply chain efficiency, ultimately contributing to your overall business success.',
		icon: SupplyChainIcon,
	},
];
