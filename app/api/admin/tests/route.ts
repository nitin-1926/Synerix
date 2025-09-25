import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';

// Schema for test validation
const testSchema = z.object({
	name: z.string().min(1, 'Test name is required'),
	type: z.enum(['paid', 'free']),
	description: z.string().optional(),
	questions: z.array(
		z.object({
			id: z.string(),
			question: z.string(),
			options: z.array(
				z.object({
					id: z.string(),
					content: z.string(),
					weightAge: z.union([z.string(), z.number()]),
				}),
			),
			category: z.string(),
		}),
	),
	isActive: z.boolean().optional(),
});

// GET /api/admin/tests - Get all tests
export async function GET() {
	try {
		const tests = await prisma.test.findMany({
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json({
			success: true,
			data: tests,
		});
	} catch (error) {
		console.error('Error fetching tests:', error);
		return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
	}
}

// POST /api/admin/tests - Create a new test
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const validatedData = testSchema.parse(body);

		const test = await prisma.test.create({
			data: {
				name: validatedData.name,
				type: validatedData.type,
				description: validatedData.description,
				questions: validatedData.questions,
				isActive: validatedData.isActive ?? true,
			},
		});

		return NextResponse.json({
			success: true,
			data: test,
			message: 'Test created successfully',
		});
	} catch (error) {
		console.error('Error creating test:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
		}

		return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
	}
}
