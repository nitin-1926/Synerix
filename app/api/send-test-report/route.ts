import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { businessDiagnosticQuestions } from '../../../data/questions';
import { generateCategoryChart, generateRadarChart, generatePieChart } from './chart-generator';

// Generate comprehensive business health report
function generateBusinessHealthReport(
	name: string,
	businessName: string,
	businessDescription: string,
	testScore: number,
	answers: Array<{ questionId: string; optionId: string; weightAge: number }>,
) {
	// Analyze answers by category
	const categoryScores: { [key: string]: { score: number; total: number; questions: any[] } } = {};

	businessDiagnosticQuestions.forEach(question => {
		const answer = answers.find(a => a.questionId === question.id);
		if (answer) {
			if (!categoryScores[question.category]) {
				categoryScores[question.category] = { score: 0, total: 0, questions: [] };
			}
			categoryScores[question.category].score += answer.weightAge;
			categoryScores[question.category].total += 2; // Max score per question is 2
			categoryScores[question.category].questions.push({
				question: question.question,
				answer: question.options.find(opt => opt.id === answer.optionId)?.content,
				score: answer.weightAge,
				maxScore: 2,
			});
		}
	});

	// Calculate category percentages
	const categoryAnalysis = Object.entries(categoryScores).map(([category, data]) => ({
		category,
		percentage: Math.round((data.score / data.total) * 100),
		score: data.score,
		total: data.total,
		questions: data.questions,
	}));

	// Identify strengths and weaknesses
	const strengths = categoryAnalysis.filter(cat => cat.percentage >= 70).map(cat => cat.category);
	const weaknesses = categoryAnalysis.filter(cat => cat.percentage <= 40).map(cat => cat.category);
	const greyAreas = categoryAnalysis
		.filter(cat => cat.percentage > 40 && cat.percentage < 70)
		.map(cat => cat.category);

	// Generate risk analysis
	const riskLevel = testScore >= 80 ? 'LOW' : testScore >= 60 ? 'MODERATE' : testScore >= 40 ? 'HIGH' : 'CRITICAL';
	const riskColor =
		testScore >= 80 ? '#10B981' : testScore >= 60 ? '#F59E0B' : testScore >= 40 ? '#EF4444' : '#DC2626';

	// Generate recommendations
	const recommendations = generateRecommendations(categoryAnalysis, testScore);

	// Generate charts
	console.log(
		'Generating charts for categories:',
		categoryAnalysis.map(c => c.category),
	);

	const categoryChart = generateCategoryChart(categoryAnalysis);
	console.log('Category chart generated, length:', categoryChart.length);

	const radarChart = generateRadarChart(categoryAnalysis);
	console.log('Radar chart generated, length:', radarChart.length);

	const pieChart = generatePieChart(categoryAnalysis);
	console.log('Pie chart generated, length:', pieChart.length);

	// Calculate additional insights
	const totalQuestions = businessDiagnosticQuestions.length;
	const averageScore = Math.round(
		categoryAnalysis.reduce((sum, cat) => sum + cat.percentage, 0) / categoryAnalysis.length,
	);
	const topPerformingCategory = categoryAnalysis.reduce((max, cat) => (cat.percentage > max.percentage ? cat : max));
	const lowestPerformingCategory = categoryAnalysis.reduce((min, cat) =>
		cat.percentage < min.percentage ? cat : min,
	);
	const industryBenchmark = 75; // Industry average benchmark
	const performanceGap = averageScore - industryBenchmark;

	// Generate HTML email
	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Business Health Report - ${businessName}</title>
			<style>
				@media only screen and (max-width: 600px) {
					.container { width: 100% !important; }
					.content { padding: 20px !important; }
					table { 
						width: 100% !important; 
						border-spacing: 10px 0 !important;
					}
					td { 
						padding: 10px 5px !important; 
						display: block !important;
						width: 100% !important;
					}
					.mobile-stack td {
						display: block !important;
						width: 100% !important;
						border-spacing: 0 !important;
					}
					.cta-buttons td {
						display: block !important;
						width: 100% !important;
						margin-bottom: 10px !important;
					}
					.cta-buttons a {
						width: 100% !important;
						font-size: 16px !important;
						padding: 18px 20px !important;
					}
					.contact-table td {
						display: block !important;
						width: 100% !important;
						margin-bottom: 10px !important;
					}
				}
			</style>
		</head>
		<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #1f2937; line-height: 1.6;">
			<div class="container" style="max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-radius: 16px; overflow: hidden;">
				
				<!-- Professional Introduction -->
				<div class="content" style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); color: white; text-align: center;">
					<div style="max-width: 500px; margin: 0 auto;">
						<h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700;">Hello ${name}! 👋</h1>
						<p style="margin: 0 0 20px 0; font-size: 18px; opacity: 0.95; line-height: 1.7;">Hope you're doing well and thank you for taking the time to complete our comprehensive Business Health Assessment.</p>
						<p style="margin: 0 0 25px 0; font-size: 16px; opacity: 0.9; line-height: 1.7;">Please find your detailed <strong>Synerix Business Health Report</strong> below. This analysis provides valuable insights into your business performance and actionable recommendations for growth.</p>
						<p style="margin: 0 0 30px 0; font-size: 16px; opacity: 0.9; line-height: 1.7;">We're excited to discuss these findings with you and explore how we can help <strong>${businessName}</strong> reach new heights of success.</p>
						<div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 15px 25px; border-radius: 25px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3);">
							<p style="margin: 0; font-size: 14px; opacity: 0.9;">📧 Looking forward to your response!</p>
						</div>
					</div>
				</div>
				<!-- Executive Summary Header -->
				<div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center; color: white; position: relative; overflow: hidden;">
					<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.3;"></div>
					<div style="position: relative; z-index: 2;">
						<h1 style="margin: 0; font-size: 36px; font-weight: 800; margin-bottom: 15px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">📊 Executive Business Health Report</h1>
						<p style="margin: 0 0 30px 0; font-size: 20px; opacity: 0.95; font-weight: 300;">Comprehensive Analysis for ${businessName}</p>
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 auto; border-collapse: separate; border-spacing: 20px 0; table-layout: fixed;">
							<tr>
								<td align="center" valign="top" style="background: rgba(255,255,255,0.15); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); min-width: 180px; backdrop-filter: blur(15px);">
									<div style="font-size: 52px; font-weight: 900; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${testScore}%</div>
									<div style="font-size: 14px; opacity: 0.9; font-weight: 500;">Overall Health Score</div>
								</td>
								<td align="center" valign="top" style="background: rgba(255,255,255,0.15); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); min-width: 180px; backdrop-filter: blur(15px);">
									<div style="font-size: 52px; font-weight: 900; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${performanceGap > 0 ? '+' : ''}${performanceGap}</div>
									<div style="font-size: 14px; opacity: 0.9; font-weight: 500;">vs Industry Avg</div>
								</td>
							</tr>
						</table>
					</div>
				</div>

				<!-- Business Overview & Key Metrics -->
				<div class="content" style="padding: 40px 30px; border-bottom: 2px solid #f1f5f9;">
					<h2 style="color: #1e293b; margin-bottom: 25px; font-size: 28px; font-weight: 700; text-align: center;">📋 Business Overview & Key Insights</h2>
					
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; border-collapse: separate; border-spacing: 25px 0;">
						<tr>
							<td style="width: 50%; vertical-align: top; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 15px; border-left: 5px solid #667eea; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
								<h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; font-weight: 600;">Company Information</h3>
								<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Business Name:</strong> ${businessName}</p>
								<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Description:</strong> ${businessDescription}</p>
								<p style="margin: 0; color: #4b5563;"><strong>Assessment Date:</strong> ${new Date().toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}</p>
							</td>
							<td style="width: 50%; vertical-align: top; background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%); padding: 25px; border-radius: 15px; border-left: 5px solid #3b82f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
								<h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; font-weight: 600;">Assessment Summary</h3>
								<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Questions Analyzed:</strong> ${totalQuestions}</p>
								<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Categories Evaluated:</strong> ${categoryAnalysis.length}</p>
								<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Average Score:</strong> ${averageScore}%</p>
								<p style="margin: 0; color: #4b5563;"><strong>Industry Benchmark:</strong> ${industryBenchmark}% ${performanceGap >= 0 ? '✅' : '⚠️'}</p>
							</td>
						</tr>
					</table>
					
					<!-- Performance Highlights -->
					<div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 25px; border-radius: 15px; border-left: 5px solid #f59e0b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
						<h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600;">🎯 Performance Highlights</h3>
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate; border-spacing: 20px 0;">
							<tr>
								<td style="width: 50%; vertical-align: top;">
									<p style="margin: 0 0 8px 0; color: #059669; font-weight: 600;">🌟 Top Performing Area:</p>
									<p style="margin: 0; color: #4b5563;">${topPerformingCategory.category} (${topPerformingCategory.percentage}%)</p>
								</td>
								<td style="width: 50%; vertical-align: top;">
									<p style="margin: 0 0 8px 0; color: #dc2626; font-weight: 600;">🎯 Focus Area:</p>
									<p style="margin: 0; color: #4b5563;">${lowestPerformingCategory.category} (${lowestPerformingCategory.percentage}%)</p>
								</td>
							</tr>
						</table>
					</div>
				</div>

				<!-- Risk Assessment -->
				<div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
					<h2 style="color: #374151; margin-bottom: 20px; font-size: 24px;">⚠️ Risk Assessment</h2>
					<div style="background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 4px solid ${riskColor};">
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
							<tr>
								<td style="width: 24px; vertical-align: top; padding-top: 2px;">
									<div style="width: 12px; height: 12px; background: ${riskColor}; border-radius: 50%;"></div>
								</td>
								<td style="vertical-align: top;">
									<h3 style="margin: 0; color: ${riskColor}; font-size: 20px; line-height: 1.2;">Risk Level: ${riskLevel}</h3>
								</td>
							</tr>
						</table>
						<p style="margin: 0; color: #6b7280; line-height: 1.6; padding-left: 24px;">
							${getRiskDescription(testScore)}
						</p>
					</div>
				</div>

				<!-- Key Statistics Dashboard -->
				<div class="content" style="padding: 40px 30px; border-bottom: 2px solid #f1f5f9; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
					<h2 style="color: #1e293b; margin-bottom: 30px; font-size: 28px; font-weight: 700; text-align: center;">📈 Performance Dashboard</h2>
					
					<table style="width: 100%; max-width: 800px; margin: 0 auto 30px auto; border-collapse: collapse;">
						<tr>
							<td style="width: 50%; padding: 10px; vertical-align: top;">
								<div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 15px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-left: 4px solid ${getScoreColor(testScore)}; text-align: center;">
									<div style="background: ${getScoreColor(testScore)}; color: white; width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 15px; line-height: 50px; font-size: 20px;">🎯</div>
									<h3 style="color: #374151; margin-bottom: 10px; font-size: 16px; font-weight: 600;">Overall Health Score</h3>
									<div style="font-size: 36px; font-weight: 900; color: ${getScoreColor(testScore)}; margin-bottom: 8px;">${testScore}%</div>
									<div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Business Health Index</div>
								</div>
							</td>
							<td style="width: 50%; padding: 10px; vertical-align: top;">
								<div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 15px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-left: 4px solid #667eea; text-align: center;">
									<div style="background: #667eea; color: white; width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 15px; line-height: 50px; font-size: 20px;">📊</div>
									<h3 style="color: #374151; margin-bottom: 10px; font-size: 16px; font-weight: 600;">Categories Analyzed</h3>
									<div style="font-size: 36px; font-weight: 900; color: #667eea; margin-bottom: 8px;">${categoryAnalysis.length}</div>
									<div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Business Areas</div>
								</div>
							</td>
						</tr>
						<tr>
							<td style="width: 50%; padding: 10px; vertical-align: top;">
								<div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 15px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-left: 4px solid #059669; text-align: center;">
									<div style="background: #059669; color: white; width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 15px; line-height: 50px; font-size: 20px;">💡</div>
									<h3 style="color: #374151; margin-bottom: 10px; font-size: 16px; font-weight: 600;">Strategic Recommendations</h3>
									<div style="font-size: 36px; font-weight: 900; color: #059669; margin-bottom: 8px;">${recommendations.length}</div>
									<div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Action Items</div>
								</div>
							</td>
							<td style="width: 50%; padding: 10px; vertical-align: top;">
								<div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 15px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-left: 4px solid ${performanceGap >= 0 ? '#059669' : '#dc2626'}; text-align: center;">
									<div style="background: ${performanceGap >= 0 ? '#059669' : '#dc2626'}; color: white; width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 15px; line-height: 50px; font-size: 20px;">${performanceGap >= 0 ? '📈' : '📉'}</div>
									<h3 style="color: #374151; margin-bottom: 10px; font-size: 16px; font-weight: 600;">Industry Comparison</h3>
									<div style="font-size: 36px; font-weight: 900; color: ${performanceGap >= 0 ? '#059669' : '#dc2626'}; margin-bottom: 8px;">${performanceGap > 0 ? '+' : ''}${performanceGap}%</div>
									<div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">vs Industry Average</div>
								</div>
							</td>
						</tr>
					</table>
				</div>

				<!-- Visual Analytics Section -->
				<div class="content" style="padding: 40px 30px; border-bottom: 2px solid #f1f5f9;">
					<h2 style="color: #1e293b; margin-bottom: 30px; font-size: 28px; font-weight: 700; text-align: center;">📊 Visual Analytics & Category Performance</h2>
					
					<!-- Main Category Chart -->
					<div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); margin-bottom: 30px; text-align: center;">
						<h3 style="color: #374151; margin-bottom: 25px; font-size: 20px; font-weight: 600;">📈 Category Performance Overview</h3>
						<div style="display: inline-block; max-width: 100%; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
							${categoryChart}
						</div>
					</div>
					
					<!-- Detailed Analytics -->
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; border-collapse: separate; border-spacing: 25px 0;">
						<tr>
							<td style="width: 50%; vertical-align: top; text-align: center;">
								<div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
									<h3 style="color: #374151; margin-bottom: 20px; font-size: 18px; font-weight: 600;">🎯 Multi-Dimensional Analysis</h3>
									<div style="border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
										${radarChart}
									</div>
								</div>
							</td>
							<td style="width: 50%; vertical-align: top; text-align: center;">
								<div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
									<h3 style="color: #374151; margin-bottom: 20px; font-size: 18px; font-weight: 600;">🏆 Performance Distribution</h3>
									<div style="border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
										${pieChart}
									</div>
								</div>
							</td>
						</tr>
					</table>
					
					<!-- Detailed Category Performance -->
					<div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
						<h3 style="color: #1e293b; margin-bottom: 25px; font-size: 22px; font-weight: 700; text-align: center;">📋 Detailed Category Performance Analysis</h3>
						<div style="display: grid; gap: 20px;">
							${categoryAnalysis
								.map(
									category => `
								<div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 15px; border-left: 5px solid ${getScoreColor(category.percentage)}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: transform 0.2s ease;">
									<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
										<tr>
											<td style="vertical-align: top; padding-right: 20px;">
												<h4 style="margin: 0 0 5px 0; color: #1e293b; font-size: 18px; font-weight: 600;">${category.category}</h4>
												<p style="margin: 0; color: #64748b; font-size: 14px;">${category.score} out of ${category.total} points earned</p>
											</td>
											<td style="text-align: right; vertical-align: top; width: 120px;">
												<div style="background: ${getScoreColor(category.percentage)}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 5px;">
													<span style="font-size: 20px; font-weight: 700;">${category.percentage}%</span>
												</div>
												<div style="font-size: 12px; color: #64748b; white-space: nowrap;">
													${category.percentage >= 80 ? 'Excellent' : category.percentage >= 60 ? 'Good' : category.percentage >= 40 ? 'Needs Improvement' : 'Critical'}
												</div>
											</td>
										</tr>
									</table>
									<div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; position: relative;">
										<div style="background: ${getScoreColor(category.percentage)}; height: 100%; width: ${category.percentage}%; border-radius: 5px; transition: width 0.5s ease; position: relative;"></div>
										<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: 600; color: #374151;">${category.percentage}%</div>
									</div>
								</div>
							`,
								)
								.join('')}
						</div>
					</div>
				</div>

				<!-- Strengths & Weaknesses -->
				<div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
					<h2 style="color: #374151; margin-bottom: 20px; font-size: 24px;">🎯 Key Insights</h2>
					
					${
						strengths.length > 0
							? `
						<div style="margin-bottom: 25px;">
							<h3 style="color: #059669; margin-bottom: 15px; font-size: 18px;">✅ Your Strengths</h3>
							<div style="background: #ecfdf5; padding: 20px; border-radius: 10px; border-left: 4px solid #059669;">
								${strengths
									.map(
										strength => `
									<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
										<tr>
											<td style="width: 20px; vertical-align: top;">
												<span style="color: #059669;">✓</span>
											</td>
											<td style="color: #374151; vertical-align: top;">
												${strength}
											</td>
										</tr>
									</table>
								`,
									)
									.join('')}
							</div>
						</div>
					`
							: ''
					}

					${
						weaknesses.length > 0
							? `
						<div style="margin-bottom: 25px;">
							<h3 style="color: #dc2626; margin-bottom: 15px; font-size: 18px;">⚠️ Areas Needing Attention</h3>
							<div style="background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 4px solid #dc2626;">
								${weaknesses
									.map(
										weakness => `
									<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
										<tr>
											<td style="width: 20px; vertical-align: top;">
												<span style="color: #dc2626;">⚠</span>
											</td>
											<td style="color: #374151; vertical-align: top;">
												${weakness}
											</td>
										</tr>
									</table>
								`,
									)
									.join('')}
							</div>
						</div>
					`
							: ''
					}

					${
						greyAreas.length > 0
							? `
						<div style="margin-bottom: 25px;">
							<h3 style="color: #d97706; margin-bottom: 15px; font-size: 18px;">🔄 Improvement Opportunities</h3>
							<div style="background: #fffbeb; padding: 20px; border-radius: 10px; border-left: 4px solid #d97706;">
								${greyAreas
									.map(
										area => `
									<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
										<tr>
											<td style="width: 20px; vertical-align: top;">
												<span style="color: #d97706;">🔄</span>
											</td>
											<td style="color: #374151; vertical-align: top;">
												${area}
											</td>
										</tr>
									</table>
								`,
									)
									.join('')}
							</div>
						</div>
					`
							: ''
					}
				</div>

				<!-- Recommendations -->
				<div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
					<h2 style="color: #374151; margin-bottom: 20px; font-size: 24px;">💡 Strategic Recommendations</h2>
					<div style="background: #eff6ff; padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6;">
						${recommendations
							.map(
								(rec, index) => `
							<div style="margin-bottom: ${index < recommendations.length - 1 ? '20px' : '0'};">
								<h4 style="color: #1e40af; margin-bottom: 8px; font-size: 16px;">${rec.title}</h4>
								<p style="margin: 0; color: #374151; line-height: 1.6;">${rec.description}</p>
							</div>
						`,
							)
							.join('')}
					</div>
				</div>

				<!-- Strategic Call to Action -->
				<div style="padding: 50px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); color: white; position: relative; overflow: hidden;">
					<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08) 2px, transparent 2px), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.08) 2px, transparent 2px); background-size: 25px 25px; opacity: 0.4;"></div>
					<div style="position: relative; z-index: 2; max-width: 600px; margin: 0 auto;">
						<h2 style="margin-bottom: 25px; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚀 Ready to Transform ${businessName}?</h2>
						<p style="margin-bottom: 35px; font-size: 18px; opacity: 0.95; line-height: 1.7; font-weight: 300;">
							This comprehensive analysis is just the beginning of your business transformation journey. Our expert consultants are ready to help you implement these strategic recommendations and drive measurable improvements.
						</p>
						<div style="background: rgba(255,255,255,0.15); padding: 25px; border-radius: 20px; backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2); margin-bottom: 30px;">
							<p style="margin: 0; font-size: 16px; opacity: 0.9; line-height: 1.6;">
								💼 <strong>We're all set to move forward with detailed discussions</strong><br/>
								🎯 Personalized strategy development for ${businessName}<br/>
								📈 Implementation roadmap with measurable milestones<br/>
								🤝 Ongoing support to ensure sustainable growth
							</p>
						</div>
						<p style="margin-bottom: 35px; font-size: 17px; opacity: 0.95; line-height: 1.6; font-style: italic;">
							"Let us know a suitable time for you to connect and take ${businessName} to new heights of success!"
						</p>
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cta-buttons" style="border-collapse: separate; border-spacing: 15px 15px;">
							<tr>
								<td style="text-align: center; vertical-align: top; width: 33.33%;">
									<a href=${process.env.WEBSITE_URL} style="display: inline-block; background: white; color: #667eea; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 2px solid white; width: 100%; box-sizing: border-box; min-height: 50px; line-height: 1.2;">
										📅 Schedule Free<br/>Strategy Session
									</a>
								</td>
								<td style="text-align: center; vertical-align: top; width: 33.33%;">
									<a href="mailto:${process.env.GMAIL_USERNAME}?subject=Business Health Report Discussion - ${businessName}&body=Hi Synerix Team,%0A%0AI've reviewed my business health report and would like to discuss the next steps for ${businessName}.%0A%0APlease let me know your availability for a consultation.%0A%0AThank you!" style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: 700; font-size: 14px; border: 2px solid rgba(255,255,255,0.3); width: 100%; box-sizing: border-box; min-height: 50px; line-height: 1.2;">
										✉️ Email Us<br/>Directly
									</a>
								</td>
								<td style="text-align: center; vertical-align: top; width: 33.33%;">
									<a href="https://wa.me/${process.env.WHATSAPP_NUMBER}?text=Hi%20Synerix%20Team,%20I%20received%20my%20business%20health%20report%20and%20would%20like%20to%20discuss%20the%20next%20steps%20for%20my%20business." style="display: inline-block; background: #25d366; color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: 700; font-size: 14px; border: 2px solid #25d366; width: 100%; box-sizing: border-box; min-height: 50px; line-height: 1.2;">
										📱 WhatsApp Us<br/>Instantly
									</a>
								</td>
							</tr>
						</table>
					</div>
				</div>

				<!-- Professional Footer -->
				<div style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white;">
					<div style="max-width: 600px; margin: 0 auto;">
						<div style="margin-bottom: 25px;">
							<h3 style="color: white; margin-bottom: 15px; font-size: 24px; font-weight: 700;">Synerix Business Solutions</h3>
							<p style="margin: 0; font-size: 16px; opacity: 0.9; line-height: 1.6;">Empowering businesses with data-driven insights and strategic solutions</p>
							<div style="margin-top: 20px; text-align: center;">
								<table style="margin: 0 auto; border-collapse: collapse;">
									<tr>
										<td style="padding: 0 7px;">
											<span style="background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 20px; font-size: 14px; display: inline-block;">💼 Business Consulting</span>
										</td>
										<td style="padding: 0 7px;">
											<span style="background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 20px; font-size: 14px; display: inline-block;">📊 Strategic Analysis</span>
										</td>
										<td style="padding: 0 7px;">
											<span style="background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 20px; font-size: 14px; display: inline-block;">🚀 Growth Solutions</span>
										</td>
									</tr>
								</table>
							</div>
						</div>
						<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 25px;">
							<p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.8;">
								This comprehensive business health report was generated on ${new Date().toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								})}.
							</p>
							<p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.8;">
								For questions about this report or to schedule a consultation, contact us:
							</p>
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="contact-table" style="margin: 0 0 20px 0; border-collapse: separate; border-spacing: 0;">
								<tr>
									<td style="width: 50%; padding: 10px 5px; vertical-align: top; text-align: center;">
										<div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);">
											<div style="font-size: 16px; margin-bottom: 8px;">📧</div>
											<div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">Email</div>
											<a href="mailto:${process.env.GMAIL_USERNAME}" style="color: #60a5fa; text-decoration: none; font-weight: 600; font-size: 13px; word-break: break-all;">${process.env.GMAIL_USERNAME}</a>
										</div>
									</td>
									<td style="width: 50%; padding: 10px 5px; vertical-align: top; text-align: center;">
										<div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);">
											<div style="font-size: 16px; margin-bottom: 8px;">📱</div>
											<div style="font-size: 12px; opacity: 0.7; margin-bottom: 5px;">WhatsApp</div>
											<a href="https://wa.me/${process.env.WHATSAPP_NUMBER}?text=Hi%20Synerix%20Team,%20I%20received%20my%20business%20health%20report%20and%20would%20like%20to%20discuss%20the%20next%20steps." style="color: #25d366; text-decoration: none; font-weight: 600; font-size: 13px;">${process.env.WHATSAPP_NUMBER}</a>
										</div>
									</td>
								</tr>
							</table>
							<div style="text-align: center; font-size: 13px;">
								<table style="margin: 0 auto; border-collapse: collapse;">
									<tr>
										<td style="padding: 0 10px;">
											<a href=${process.env.WEBSITE_URL} style="color: #94a3b8; text-decoration: none; transition: color 0.3s ease;">🌐 Visit Our Website</a>
										</td>
										<td style="padding: 0 10px;">
											<a href="${process.env.WEBSITE_URL}" style="color: #94a3b8; text-decoration: none; transition: color 0.3s ease;">🔒 Privacy Policy</a>
										</td>
										<td style="padding: 0 10px;">
											<a href="${process.env.WEBSITE_URL}" style="color: #94a3b8; text-decoration: none; transition: color 0.3s ease;">📋 Terms of Service</a>
										</td>
									</tr>
								</table>
							</div>
							<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
								<p style="margin: 0; font-size: 12px; opacity: 0.7; font-style: italic;">"Looking forward to your response and helping ${businessName} achieve remarkable growth!"</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</body>
		</html>
	`;

	// Generate enhanced plain text version
	const text = `
═══════════════════════════════════════════════════════════════
BUSINESS HEALTH REPORT - ${businessName.toUpperCase()}
═══════════════════════════════════════════════════════════════

Hello ${name}! 👋

Hope you're doing well and thank you for taking the time to complete our comprehensive Business Health Assessment for ${businessName}.

We're excited to share your detailed analysis and discuss how we can help take your business to new heights!

🎯 EXECUTIVE SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Overall Health Score: ${testScore}%
• Industry Comparison: ${performanceGap > 0 ? '+' : ''}${performanceGap}% vs Industry Average (${industryBenchmark}%)
• Questions Analyzed: ${totalQuestions}
• Categories Evaluated: ${categoryAnalysis.length}
• Strategic Recommendations: ${recommendations.length}
• Risk Level: ${riskLevel}

📊 PERFORMANCE HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 Top Performing Area: ${topPerformingCategory.category} (${topPerformingCategory.percentage}%)
🎯 Focus Area: ${lowestPerformingCategory.category} (${lowestPerformingCategory.percentage}%)
📈 Average Score: ${averageScore}%

⚠️ RISK ASSESSMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getRiskDescription(testScore)}

📊 DETAILED CATEGORY ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${categoryAnalysis
	.map(cat => {
		const bar = '█'.repeat(Math.floor(cat.percentage / 5)) + '░'.repeat(20 - Math.floor(cat.percentage / 5));
		const status =
			cat.percentage >= 80
				? '(Excellent)'
				: cat.percentage >= 60
					? '(Good)'
					: cat.percentage >= 40
						? '(Needs Improvement)'
						: '(Critical)';
		return `${cat.category}: ${cat.percentage}% ${bar} ${status}\n   └─ Score: ${cat.score}/${cat.total} points`;
	})
	.join('\n\n')}

🎯 KEY INSIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${strengths.length > 0 ? `✅ YOUR STRENGTHS:\n${strengths.map(s => `   ✓ ${s}`).join('\n')}\n\n` : ''}
${weaknesses.length > 0 ? `⚠️ AREAS NEEDING ATTENTION:\n${weaknesses.map(w => `   ⚠ ${w}`).join('\n')}\n\n` : ''}
${greyAreas.length > 0 ? `🔄 IMPROVEMENT OPPORTUNITIES:\n${greyAreas.map(a => `   🔄 ${a}`).join('\n')}\n\n` : ''}
💡 STRATEGIC RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recommendations.map((rec, i) => `${i + 1}. ${rec.title}\n   ${rec.description}`).join('\n\n')}

🚀 NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We're all set to move forward with detailed discussions about your business growth strategy.

📅 Schedule your free consultation: ${process.env.WEBSITE_URL}
📧 Email us directly: ${process.env.GMAIL_USERNAME}
📱 WhatsApp us: ${process.env.WHATSAPP_NUMBER}

Let us know a suitable time for you to connect and take ${businessName} to new heights of success!

Looking forward to your response!

Best regards,
The Synerix Consulting Team

═══════════════════════════════════════════════════════════════
Synerix Business Solutions
Empowering businesses with data-driven insights and strategic solutions

Report Generated: ${new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})}
═══════════════════════════════════════════════════════════════
	`.trim();

	return { html, text };
}

// Helper functions
function getScoreColor(percentage: number): string {
	if (percentage >= 80) return '#059669';
	if (percentage >= 60) return '#d97706';
	if (percentage >= 40) return '#dc2626';
	return '#dc2626';
}

function getRiskDescription(score: number): string {
	if (score >= 80)
		return 'Your business shows excellent health with strong fundamentals across all areas. Focus on maintaining these high standards and exploring growth opportunities.';
	if (score >= 60)
		return 'Your business is performing well but has some areas for improvement. Strategic investments in weak areas can significantly boost performance.';
	if (score >= 40)
		return 'Your business has potential but needs strategic improvements in key areas. Immediate attention to critical issues is recommended.';
	return 'Your business requires immediate attention in several critical areas to ensure sustainability. Professional consultation is highly recommended.';
}

function generateRecommendations(
	categoryAnalysis: any[],
	overallScore: number,
): Array<{ title: string; description: string }> {
	const recommendations: Array<{ title: string; description: string }> = [];

	// Overall recommendations based on score
	if (overallScore < 50) {
		recommendations.push({
			title: 'Immediate Risk Mitigation',
			description:
				'Focus on addressing critical vulnerabilities first, particularly in areas with the lowest scores. Consider professional consultation for rapid improvement.',
		});
	}

	// Category-specific recommendations
	categoryAnalysis.forEach(category => {
		if (category.percentage <= 40) {
			switch (category.category) {
				case 'Financial Health':
					recommendations.push({
						title: 'Financial Stability Enhancement',
						description:
							'Improve cash flow management, reduce debt burden, and build emergency reserves. Consider restructuring debt and optimizing pricing strategies.',
					});
					break;
				case 'People & Compliance':
					recommendations.push({
						title: 'Compliance & Talent Management',
						description:
							'Ensure all regulatory filings are up-to-date and implement robust backup plans for critical personnel. Invest in employee retention strategies.',
					});
					break;
				case 'Operational Efficiency':
					recommendations.push({
						title: 'Operational Optimization',
						description:
							'Streamline production processes, reduce waste, and improve delivery performance. Consider implementing lean manufacturing principles.',
					});
					break;
				case 'Market & Growth':
					recommendations.push({
						title: 'Market Strategy Development',
						description:
							'Diversify customer base, improve competitive positioning, and develop clear value propositions. Focus on customer acquisition efficiency.',
					});
					break;
				case 'Strategy & Resilience':
					recommendations.push({
						title: 'Strategic Planning & Technology',
						description:
							'Develop comprehensive strategic plans, invest in technology adoption, and build supplier redundancy. Increase profit reinvestment for long-term growth.',
					});
					break;
			}
		}
	});

	// Add general improvement recommendations
	if (recommendations.length < 3) {
		recommendations.push({
			title: 'Continuous Improvement Program',
			description:
				'Implement regular performance monitoring and establish improvement cycles. Set up key performance indicators (KPIs) for each category.',
		});
	}

	return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

// Schema for validation
const emailSchema = z.object({
	email: z.string().email('Invalid email address'),
	name: z.string().min(1, 'Name is required'),
	businessName: z.string().min(1, 'Business name is required'),
	businessDescription: z.string().min(1, 'Business description is required'),
	testScore: z.number().min(0, 'Test score is required'),
	answers: z.array(
		z.object({
			questionId: z.string(),
			optionId: z.string(),
			weightAge: z.number(),
		}),
	),
});

// Create nodemailer transporter
const createTransporter = () => {
	return nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.GMAIL_USERNAME,
			pass: process.env.GMAIL_PASSWORD,
		},
	});
};

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { email, name, businessName, businessDescription, testScore, answers } = emailSchema.parse(body);

		// Check if Gmail credentials are configured
		if (!process.env.GMAIL_USERNAME || !process.env.GMAIL_PASSWORD) {
			console.error('Gmail credentials not configured');
			return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
		}

		// Create transporter
		const transporter = createTransporter();

		// Verify transporter configuration
		try {
			await transporter.verify();
		} catch (error) {
			console.error('SMTP configuration error:', error);
			return NextResponse.json({ error: 'Email service configuration error' }, { status: 500 });
		}

		// Analyze answers by category for additional data extraction
		const categoryScores: { [key: string]: { score: number; total: number; questions: any[] } } = {};

		businessDiagnosticQuestions.forEach(question => {
			const answer = answers.find(a => a.questionId === question.id);
			if (answer) {
				if (!categoryScores[question.category]) {
					categoryScores[question.category] = { score: 0, total: 0, questions: [] };
				}
				categoryScores[question.category].score += answer.weightAge;
				categoryScores[question.category].total += 2; // Max score per question is 2
				categoryScores[question.category].questions.push({
					question: question.question,
					answer: question.options.find(opt => opt.id === answer.optionId)?.content,
					score: answer.weightAge,
					maxScore: 2,
				});
			}
		});

		// Calculate category percentages
		const categoryAnalysis = Object.entries(categoryScores).map(([category, data]) => ({
			category,
			percentage: Math.round((data.score / data.total) * 100),
			score: data.score,
			total: data.total,
			questions: data.questions,
		}));

		// Generate risk analysis
		const riskLevel =
			testScore >= 80 ? 'LOW' : testScore >= 60 ? 'MODERATE' : testScore >= 40 ? 'HIGH' : 'CRITICAL';

		// Generate recommendations
		const recommendations = generateRecommendations(categoryAnalysis, testScore);

		// Generate comprehensive business health report
		const reportData = generateBusinessHealthReport(name, businessName, businessDescription, testScore, answers);

		// Send business health report email to customer
		const mailOptions = {
			from: {
				name: 'Synerix Business Solutions',
				address: process.env.GMAIL_USERNAME!,
			},
			to: email,
			bcc: process.env.GMAIL_USERNAME, // Send copy to business owner
			subject: `Your Comprehensive Business Health Report - ${businessName}`,
			html: reportData.html,
			text: reportData.text,
			replyTo: process.env.GMAIL_USERNAME,
		};

		try {
			const info = await transporter.sendMail(mailOptions);
			console.log('Business health report sent successfully:', info.messageId);
			console.log(`Report sent to: ${email} with copy to ${process.env.GMAIL_USERNAME}`);
			console.log(`Business: ${businessName}, Score: ${testScore}%, Risk: ${riskLevel}`);

			return NextResponse.json({
				success: true,
				message: 'Business health report sent successfully',
				messageId: info.messageId,
				reportSummary: {
					businessName,
					overallScore: testScore,
					riskLevel,
					categoriesAnalyzed: categoryAnalysis.length,
					recommendations: recommendations.length,
				},
			});
		} catch (error: any) {
			console.error('Error sending email:', error);

			// Check for specific Nodemailer/SMTP errors
			let errorMessage = 'Failed to send verification email';
			let statusCode = 500;

			if (error.code) {
				switch (error.code) {
					case 'EAUTH':
						errorMessage = 'Email authentication failed. Please check email configuration.';
						statusCode = 500;
						break;
					case 'EENVELOPE':
					case 'EMESSAGE':
						errorMessage = 'Invalid email address. Please check and try again.';
						statusCode = 400;
						break;
					case 'ECONNECTION':
					case 'ETIMEDOUT':
						errorMessage = 'Email service temporarily unavailable. Please try again later.';
						statusCode = 503;
						break;
					default:
						if (error.response && error.response.includes('550')) {
							errorMessage = 'This email address cannot receive emails. Please use a different email.';
							statusCode = 400;
						}
						break;
				}
			} else if (error.message) {
				const errorMsg = error.message.toLowerCase();

				if (errorMsg.includes('invalid email') || errorMsg.includes('email address')) {
					errorMessage = 'Invalid email address. Please check and try again.';
					statusCode = 400;
				} else if (errorMsg.includes('blocked') || errorMsg.includes('bounced')) {
					errorMessage = 'This email address cannot receive emails. Please use a different email.';
					statusCode = 400;
				} else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
					errorMessage = 'Too many emails sent. Please try again later.';
					statusCode = 429;
				}
			}

			return NextResponse.json({ error: errorMessage }, { status: statusCode });
		}
	} catch (error) {
		console.error('Email verification error:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
