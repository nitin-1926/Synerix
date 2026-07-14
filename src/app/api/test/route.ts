import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const testId = searchParams.get('testId');

		let test;

		if (testId) {
			// Get specific test by testId. Inactive tests are not publicly
			// readable — this endpoint is unauthenticated.
			test = await prisma.test.findFirst({
				where: {
					id: testId,
					isActive: true,
				},
				select: {
					id: true,
					name: true,
					type: true,
					description: true,
					questions: true,
				},
			});
		} else {
			// Get the active test (fallback to existing behavior)
			test = await prisma.test.findFirst({
				where: {
					isActive: true,
					type: 'free', // For the business health assessment
				},
				select: {
					id: true,
					name: true,
					type: true,
					description: true,
					questions: true,
				},
			});
		}

		if (!test) {
			return NextResponse.json(
				{
					success: false,
					error: testId ? `Test with ID ${testId} not found` : 'No active test found',
				},
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			data: test,
		});
	} catch (error) {
		console.error('Error fetching test:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to fetch test',
			},
			{ status: 500 },
		);
	}
}
