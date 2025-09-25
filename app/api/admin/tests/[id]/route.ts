import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../../lib/prisma';

// Schema for test update validation
const updateTestSchema = z.object({
	name: z.string().min(1, 'Test name is required').optional(),
	type: z.enum(['paid', 'free']).optional(),
	description: z.string().optional(),
	questions: z
		.array(
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
		)
		.optional(),
	isActive: z.boolean().optional(),
});

// GET /api/admin/tests/[id] - Get a specific test
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const test = await prisma.test.findUnique({
			where: { id: params.id },
		});

		if (!test) {
			return NextResponse.json({ error: 'Test not found' }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			data: test,
		});
	} catch (error) {
		console.error('Error fetching test:', error);
		return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
	}
}

// PUT /api/admin/tests/[id] - Update a specific test
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await req.json();
		const validatedData = updateTestSchema.parse(body);

		const test = await prisma.test.update({
			where: { id: params.id },
			data: validatedData,
		});

		return NextResponse.json({
			success: true,
			data: test,
			message: 'Test updated successfully',
		});
	} catch (error) {
		console.error('Error updating test:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
		}

		return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
	}
}

// DELETE /api/admin/tests/[id] - Delete a specific test
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		await prisma.test.delete({
			where: { id: params.id },
		});

		return NextResponse.json({
			success: true,
			message: 'Test deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting test:', error);
		return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
	}
}
