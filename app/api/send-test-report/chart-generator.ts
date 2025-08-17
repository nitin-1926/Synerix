export interface ChartData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		backgroundColor: string[];
		borderColor: string[];
		borderWidth: number;
	}[];
}

export function generateCategoryChart(categoryAnalysis: Array<{ category: string; percentage: number }>): string {
	// Create HTML-based bar chart that works well in emails
	let html = `
		<div style="background: #f8fafc; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif;">
			<h4 style="text-align: center; margin: 0 0 20px 0; color: #374151; font-size: 16px;">Business Health by Category</h4>
			<div style="max-width: 500px; margin: 0 auto;">
	`;

	categoryAnalysis.forEach(category => {
		const color = getScoreColor(category.percentage);
		const categoryName =
			category.category.length > 20 ? category.category.substring(0, 20) + '...' : category.category;

		html += `
			<div style="margin-bottom: 15px;">
				<table style="width: 100%; margin-bottom: 5px;">
					<tr>
						<td style="font-size: 12px; color: #4b5563; font-weight: 600;">${categoryName}</td>
						<td style="text-align: right; font-size: 12px; color: ${color}; font-weight: bold;">${category.percentage}%</td>
					</tr>
				</table>
				<div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
					<div style="background: ${color}; height: 100%; width: ${category.percentage}%; border-radius: 10px;"></div>
				</div>
			</div>
		`;
	});

	html += `
			</div>
		</div>
	`;

	return html;
}

export function generateRadarChart(categoryAnalysis: Array<{ category: string; percentage: number }>): string {
	// Create HTML-based multi-dimensional analysis display
	let html = `
		<div style="background: #f8fafc; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif;">
			<h4 style="text-align: center; margin: 0 0 20px 0; color: #374151; font-size: 16px;">Multi-Dimensional Analysis</h4>
			<div style="max-width: 400px; margin: 0 auto;">
	`;

	// Create a circular layout representation
	const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

	categoryAnalysis.forEach((category, index) => {
		const color = colors[index % colors.length];
		const categoryName =
			category.category.length > 15 ? category.category.substring(0, 15) + '...' : category.category;

		html += `
			<div style="margin-bottom: 12px; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
				<table style="width: 100%;">
					<tr>
						<td style="width: 40px; vertical-align: top;">
							<div style="width: 30px; height: 30px; border-radius: 50%; background: ${color}; text-align: center; line-height: 30px; color: white; font-weight: bold; font-size: 12px;">
								${category.percentage}%
							</div>
						</td>
						<td style="vertical-align: top; padding-left: 12px;">
							<div style="font-size: 12px; color: #374151; font-weight: 600; margin-bottom: 4px;">${categoryName}</div>
							<div style="background: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
								<div style="background: ${color}; height: 100%; width: ${category.percentage}%; border-radius: 3px;"></div>
							</div>
						</td>
					</tr>
				</table>
			</div>
		`;
	});

	html += `
			</div>
		</div>
	`;

	return html;
}

export function generatePieChart(categoryAnalysis: Array<{ category: string; percentage: number }>): string {
	// Create HTML-based performance distribution display
	let html = `
		<div style="background: #f8fafc; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif;">
			<h4 style="text-align: center; margin: 0 0 20px 0; color: #374151; font-size: 16px;">Performance Distribution</h4>
			<div style="max-width: 350px; margin: 0 auto;">
	`;

	// Colors for categories
	const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
	const total = categoryAnalysis.reduce((sum, cat) => sum + cat.percentage, 0);

	// Create visual representation with colored blocks
	categoryAnalysis.forEach((category, index) => {
		const color = colors[index % colors.length];
		const categoryName =
			category.category.length > 18 ? category.category.substring(0, 18) + '...' : category.category;
		const relativeSize = (category.percentage / total) * 100;

		html += `
			<div style="margin-bottom: 10px;">
				<table style="width: 100%; margin-bottom: 5px;">
					<tr>
						<td style="width: 20px;">
							<div style="width: 16px; height: 16px; background: ${color}; border-radius: 3px;"></div>
						</td>
						<td style="font-size: 12px; color: #374151; font-weight: 600; padding-left: 8px;">${categoryName}</td>
						<td style="text-align: right; font-size: 12px; color: ${color}; font-weight: bold;">${category.percentage}%</td>
					</tr>
				</table>
				<div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
					<div style="background: ${color}; height: 100%; width: ${relativeSize}%; border-radius: 4px;"></div>
				</div>
			</div>
		`;
	});

	// Add summary statistics
	const averageScore = Math.round(total / categoryAnalysis.length);
	const highPerformers = categoryAnalysis.filter(cat => cat.percentage >= 70).length;
	const lowPerformers = categoryAnalysis.filter(cat => cat.percentage <= 40).length;

	html += `
			<div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
				<div style="font-size: 11px; color: #6b7280; text-align: center;">
					<div style="margin-bottom: 8px;">
						<strong style="color: #374151;">Summary:</strong> Average ${averageScore}% 
						${highPerformers > 0 ? `• ${highPerformers} Strong Areas` : ''} 
						${lowPerformers > 0 ? `• ${lowPerformers} Need Focus` : ''}
					</div>
				</div>
			</div>
		`;

	html += `
			</div>
		</div>
	`;

	return html;
}

function getScoreColor(percentage: number): string {
	if (percentage >= 80) return '#059669'; // Green
	if (percentage >= 60) return '#d97706'; // Orange
	if (percentage >= 40) return '#dc2626'; // Red
	return '#dc2626'; // Red
}
