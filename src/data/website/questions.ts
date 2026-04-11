export const businessDiagnosticQuestions = [
	{
		id: '1',
		question: 'Could operations halt for >3 days if 1 critical employee leaves?',
		options: [
			{ id: '1', content: 'No, we have backups', weightAge: '2' },
			{ id: '2', content: 'Yes, but we are training others', weightAge: '1' },
			{ id: '3', content: 'Yes, operations would be severely impacted', weightAge: '0' },
		],
		category: 'People & Compliance',
	},
	{
		id: '2',
		question: 'What % of shop-floor workers left in the last year?',
		options: [
			{ id: '1', content: 'Less than or equal to 15%', weightAge: '2' },
			{ id: '2', content: '16-25%', weightAge: '1' },
			{ id: '3', content: 'Greater than 25%', weightAge: '0' },
		],
		category: 'People & Compliance',
	},
	{
		id: '3',
		question: 'Are GST, PF, ESIC, factory act filings 100% up-to-date?',
		options: [
			{ id: '1', content: '100% up-to-date', weightAge: '2' },
			{ id: '2', content: 'Minor delays (less than or equal to 15 days)', weightAge: '1' },
			{ id: '3', content: 'Major lapses (greater than 15 days)', weightAge: '0' },
		],
		category: 'People & Compliance',
	},
	{
		id: '4',
		question:
			'Can you cover 3 months of operating expenses (salaries, rent, raw materials) without new sales or loans?',
		options: [
			{ id: '1', content: 'Yes, fully covered', weightAge: '2' },
			{ id: '2', content: 'Partially (covers 1-2 months)', weightAge: '1' },
			{ id: '3', content: 'No, less than 1 month coverage', weightAge: '0' },
		],
		category: 'Financial Health',
	},
	{
		id: '5',
		question: 'Is your total debt ≤ 50% of your net worth?',
		options: [
			{ id: '1', content: 'Yes, debt is less than or equal to 50% of net worth', weightAge: '2' },
			{ id: '2', content: 'Yes, between 30% and 50%', weightAge: '1' },
			{ id: '3', content: 'No, debt exceeds 50% of net worth', weightAge: '0' },
		],
		category: 'Financial Health',
	},
	{
		id: '6',
		question:
			'How many days does cash stay tied up in inventory + receivables before payment? (Cash Conversion Cycle)',
		options: [
			{ id: '1', content: 'Less than 60 days', weightAge: '2' },
			{ id: '2', content: '60-90 days', weightAge: '1' },
			{ id: '3', content: 'Greater than 90 days', weightAge: '0' },
		],
		category: 'Financial Health',
	},
	{
		id: '7',
		question: 'Is your Gross Profit Margin (GPM) consistently ≥ 25%?',
		options: [
			{ id: '1', content: 'Yes, consistently greater than or equal to 25%', weightAge: '2' },
			{ id: '2', content: 'Sometimes, but fluctuates between 15-24%', weightAge: '1' },
			{ id: '3', content: 'No, less than 15%', weightAge: '0' },
		],
		category: 'Financial Health',
	},
	{
		id: '8',
		question: 'Does your largest customer contribute more than 20% of your revenue?',
		options: [
			{
				id: '1',
				content: 'No, largest customer contributes less than or equal to 20% of revenue',
				weightAge: '2',
			},
			{ id: '2', content: 'Yes, but we are working to diversify (21-50%)', weightAge: '1' },
			{ id: '3', content: 'Yes, greater than 50% of revenue', weightAge: '0' },
		],
		category: 'Market & Growth',
	},
	{
		id: '9',
		question: 'What % of your production capacity is actively used?',
		options: [
			{ id: '1', content: '75-85% (optimal utilization)', weightAge: '2' },
			{ id: '2', content: '60-74% (under-utilized) OR 86-90%', weightAge: '1' },
			{ id: '3', content: 'Less than 60% OR greater than 90%', weightAge: '0' },
		],
		category: 'Operational Efficiency',
	},
	{
		id: '10',
		question: 'Inventory Turnover Ratio: How many times/year do you sell and replace inventory?',
		options: [
			{ id: '1', content: 'Greater than or equal to 8 times/year', weightAge: '2' },
			{ id: '2', content: '4-7 times/year', weightAge: '1' },
			{ id: '3', content: 'Less than 4 times a year', weightAge: '0' },
		],
		category: 'Operational Efficiency',
	},
	{
		id: '11',
		question: 'Scrap/Rework Rate: What % of raw material costs are lost to defects/rework?',
		options: [
			{ id: '1', content: 'Less than or equal to 5%', weightAge: '2' },
			{ id: '2', content: '6-10%', weightAge: '1' },
			{ id: '3', content: 'Greater than 10%', weightAge: '0' },
		],
		category: 'Operational Efficiency',
	},
	{
		id: '12',
		question: 'On-Time Delivery (OTD): What % of orders ship by the committed date?',
		options: [
			{ id: '1', content: 'Greater than or equal to 95%', weightAge: '2' },
			{ id: '2', content: '90-94%', weightAge: '1' },
			{ id: '3', content: 'Below 90%', weightAge: '0' },
		],
		category: 'Operational Efficiency',
	},
	{
		id: '13',
		question: 'Maintenance Downtime: What % of production time is lost to machine breakdowns?',
		options: [
			{ id: '1', content: 'Less than or equal to 10%', weightAge: '2' },
			{ id: '2', content: '11-20%', weightAge: '1' },
			{ id: '3', content: 'Greater than 20%', weightAge: '0' },
		],
		category: 'Operational Efficiency',
	},
	{
		id: '14',
		question: 'Order Pipeline Visibility: Can you forecast sales for the next 90 days with >70% accuracy?',
		options: [
			{ id: '1', content: 'Yes, with high confidence (greater than or equal to 70% accuracy)', weightAge: '2' },
			{ id: '2', content: 'Somewhat (50-69% accuracy)', weightAge: '1' },
			{ id: '3', content: 'No, less than 50% accuracy', weightAge: '0' },
		],
		category: 'Market & Growth',
	},
	{
		id: '15',
		question:
			'New Customer Acquisition Cost (CAC): How much do you spend (marketing + sales) to gain 1 new customer, relative to their first-year value?',
		options: [
			{ id: '1', content: 'CAC is less than 25% of first-year value', weightAge: '2' },
			{ id: '2', content: 'CAC is 26-40% of first-year value', weightAge: '1' },
			{ id: '3', content: 'CAC is greater than 40% of first-year value', weightAge: '0' },
		],
		category: 'Market & Growth',
	},
	{
		id: '16',
		question: 'Competitive Differentiation: Can customers articulate why they choose you over competitors?',
		options: [
			{ id: '1', content: 'Yes, clearly defined differentiation', weightAge: '2' },
			{ id: '2', content: 'Somewhat clear', weightAge: '1' },
			{ id: '3', content: 'No, we compete mainly on price', weightAge: '0' },
		],
		category: 'Market & Growth',
	},
	{
		id: '17',
		question: 'Sales Growth vs. Inflation: Is your YoY revenue growth ≥ current inflation rate + 5%?',
		options: [
			{ id: '1', content: 'Yes, growth is greater than or equal to inflation + 5%', weightAge: '2' },
			{ id: '2', content: 'Growth matches inflation to inflation + 4%', weightAge: '1' },
			{ id: '3', content: 'No, it is below inflation', weightAge: '0' },
		],
		category: 'Market & Growth',
	},
	{
		id: '18',
		question: 'Technology Adoption: Do you use digital tools for inventory, production planning?',
		options: [
			{ id: '1', content: 'Yes, for all key areas', weightAge: '2' },
			{ id: '2', content: 'Partially, in some areas (1-2 tools)', weightAge: '1' },
			{ id: '3', content: 'No digital tools', weightAge: '0' },
		],
		category: 'Strategy & Resilience',
	},
	{
		id: '19',
		question: 'Supplier Reliability: Do you have ≥2 suppliers for critical raw materials?',
		options: [
			{
				id: '1',
				content: 'Yes, greater than or equal to 2 suppliers for all critical materials',
				weightAge: '2',
			},
			{ id: '2', content: 'For some critical materials, but not all', weightAge: '1' },
			{ id: '3', content: 'Single-source for critical items', weightAge: '0' },
		],
		category: 'Strategy & Resilience',
	},
	{
		id: '20',
		question: 'Profit Reinvestment Rate: What % of profits are reinvested in machinery/tech/training?',
		options: [
			{ id: '1', content: 'Greater than or equal to 20%', weightAge: '2' },
			{ id: '2', content: '10-19%', weightAge: '1' },
			{ id: '3', content: 'Less than 10%', weightAge: '0' },
		],
		category: 'Strategy & Resilience',
	},
];
