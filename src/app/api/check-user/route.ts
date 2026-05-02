import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const checkUserSchema = z.object({
	phoneNumber: z.string().min(1, 'Phone number is required'),
	email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
	try {
		if (!rateLimit(`check-user:${clientIp(req)}`, { limit: 20, windowMs: 10 * 60_000 })) {
			return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
		}

		const body = await req.json();
		const { phoneNumber, email } = checkUserSchema.parse(body);

		// Check if user has already taken the test with this exact phone number and email combination.
		// Deliberately returns a boolean only — no score/date — so this endpoint
		// can't be used to enumerate other people's results.
		const existingTest = await prisma.testResult.findFirst({
			where: {
				AND: [{ phoneNumber: phoneNumber }, { email: email }],
			},
			select: { id: true },
		});

		if (existingTest) {
			return NextResponse.json({
				hasTakenTest: true,
				message:
					'You have already taken this test. Would you like to connect with us for personalized consulting?',
			});
		}

		return NextResponse.json({
			hasTakenTest: false,
			message: 'You can proceed with the test.',
		});
	} catch (error) {
		console.error('Check user error:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
