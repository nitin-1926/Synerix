import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/html";

// Schema for validation
const enquirySchema = z.object({
	email: z.string().email('Invalid email address'),
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

// Generate enquiry notification email to business owner
function generateEnquiryNotificationEmail(userEmail: string) {
	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>New Enquiry - Synerix</title>
			<style>
				@media only screen and (max-width: 600px) {
					.container { width: 100% !important; }
					.content { padding: 20px !important; }
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
			<div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-radius: 16px; overflow: hidden;">
				
				<!-- Header -->
				<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 40px 30px; text-align: center; color: white;">
					<h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎉 New Enquiry Received!</h1>
					<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Someone is interested in Synerix services</p>
				</div>

				<!-- Content -->
				<div style="padding: 40px 30px;">
					<h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px; font-weight: 600;">📧 New Website Enquiry</h2>
					
					<div style="background: #f8fafc; padding: 25px; border-radius: 15px; border-left: 5px solid #667eea; margin-bottom: 25px;">
						<h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; font-weight: 600;">Enquiry Details</h3>
						<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #667eea; text-decoration: none;">${userEmail}</a></p>
						<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Source:</strong> Website Contact Form</p>
						<p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}</p>
					</div>

					<div style="background: #eff6ff; padding: 25px; border-radius: 15px; border-left: 5px solid #3b82f6;">
						<h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px; font-weight: 600;">🚀 Next Steps</h3>
						<ul style="margin: 0; padding-left: 20px; color: #374151;">
							<li style="margin-bottom: 8px;">Send a personalized welcome email within 24 hours</li>
							<li style="margin-bottom: 8px;">Schedule a discovery call to understand their business needs</li>
							<li style="margin-bottom: 8px;">Prepare a customized proposal based on their requirements</li>
							<li style="margin-bottom: 0;">Follow up with additional resources and case studies</li>
						</ul>
					</div>

					<div style="text-align: center; margin-top: 30px;">
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cta-buttons" style="border-collapse: separate; border-spacing: 15px 15px; max-width: 600px; margin: 0 auto;">
							<tr>
								<td style="text-align: center; vertical-align: top; width: 33.33%;">
									<a href="mailto:${userEmail}?subject=Thank you for your interest in Synerix&body=Hi there,%0A%0AThank you for reaching out to Synerix! We're excited to learn more about your business and how we can help you grow.%0A%0AOur team will be in touch within 24 hours to schedule a consultation.%0A%0ABest regards,%0AThe Synerix Team" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; text-decoration: none; border-radius: 25px; font-weight: 600; width: 100%; box-sizing: border-box; font-size: 14px;">
										✉️ Reply via<br/>Email
									</a>
								</td>
								<td style="text-align: center; vertical-align: top; width: 33.33%;">
									<a href="https://wa.me/${process.env.WHATSAPP_NUMBER}?text=Hi,%20I%20received%20a%20new%20enquiry%20from%20${userEmail}%20through%20the%20website.%20Please%20help%20me%20follow%20up." style="display: inline-block; background: #25d366; color: white; padding: 15px 20px; text-decoration: none; border-radius: 25px; font-weight: 600; width: 100%; box-sizing: border-box; font-size: 14px;">
										📱 WhatsApp<br/>Team
									</a>
								</td>
								<td style="text-align: center; vertical-align: top; width: 33.33%;">
									<a href=${process.env.WEBSITE_URL} style="display: inline-block; background: #f1f5f9; color: #374151; padding: 15px 20px; text-decoration: none; border-radius: 25px; font-weight: 600; border: 2px solid #e2e8f0; width: 100%; box-sizing: border-box; font-size: 14px;">
										🌐 View<br/>Website
									</a>
								</td>
							</tr>
						</table>
					</div>
				</div>

				<!-- Footer -->
				<div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white;">
					<p style="margin: 0; font-size: 14px; opacity: 0.8;">
						This enquiry was received from your website contact form on ${new Date().toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}.
					</p>
				</div>
			</div>
		</body>
		</html>
	`;

	const text = `
═══════════════════════════════════════════════════════════════
NEW ENQUIRY RECEIVED - SYNERIX
═══════════════════════════════════════════════════════════════

🎉 New Website Enquiry!

Someone has submitted an enquiry through your website contact form.

📧 ENQUIRY DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Email: ${userEmail}
• Source: Website Contact Form
• Date: ${new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})}

🚀 NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Send a personalized welcome email within 24 hours
2. Schedule a discovery call to understand their business needs
3. Prepare a customized proposal based on their requirements
4. Follow up with additional resources and case studies

📧 Quick Reply: mailto:${userEmail}?subject=Thank you for your interest in Synerix
📱 WhatsApp Team: https://wa.me/${process.env.WHATSAPP_NUMBER}?text=New%20enquiry%20from%20${userEmail}

═══════════════════════════════════════════════════════════════
Synerix Business Solutions
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

// Generate confirmation email to user
function generateUserConfirmationEmail(userEmail: string) {
	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Thank you for your enquiry - Synerix</title>
			<style>
				@media only screen and (max-width: 600px) {
					.container { width: 100% !important; }
					.content { padding: 20px !important; }
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
			<div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-radius: 16px; overflow: hidden;">
				
				<!-- Header -->
				<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 40px 30px; text-align: center; color: white;">
					<h1 style="margin: 0; font-size: 28px; font-weight: 700;">Thank You! 🙏</h1>
					<p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We've received your enquiry and we're excited to help!</p>
				</div>

				<!-- Content -->
				<div style="padding: 40px 30px;">
					<h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px; font-weight: 600;">Your Enquiry Has Been Received</h2>
					
					<p style="color: #4b5563; margin-bottom: 25px; font-size: 16px; line-height: 1.7;">
						Thank you for reaching out to <strong>Synerix Business Solutions</strong>! We're thrilled that you're interested in taking your business to the next level.
					</p>

					<div style="background: #f0f9ff; padding: 25px; border-radius: 15px; border-left: 5px solid #3b82f6; margin-bottom: 25px;">
						<h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px; font-weight: 600;">📅 What Happens Next?</h3>
						<ul style="margin: 0; padding-left: 20px; color: #374151;">
							<li style="margin-bottom: 8px;">Our team will review your enquiry within the next few hours</li>
							<li style="margin-bottom: 8px;">You'll receive a personalized response within 24 hours</li>
							<li style="margin-bottom: 8px;">We'll schedule a free consultation call to understand your needs</li>
							<li style="margin-bottom: 0;">Together, we'll create a customized growth strategy for your business</li>
						</ul>
					</div>

					<div style="background: #ecfdf5; padding: 25px; border-radius: 15px; border-left: 5px solid #059669; margin-bottom: 25px;">
						<h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px; font-weight: 600;">🎯 While You Wait</h3>
						<p style="margin: 0 0 15px 0; color: #374151;">
							Want to get started right away? Take our free <strong>Business Health Assessment</strong> to identify your growth opportunities:
						</p>
						<a href="${process.env.WEBSITE_URL}tests/business-health" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 20px; font-weight: 600;">
							Take Free Business Health Test
						</a>
					</div>

					<div style="text-align: center; margin-top: 30px;">
						<p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
							Have questions? Feel free to reach out to us directly:
						</p>
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="cta-buttons" style="border-collapse: separate; border-spacing: 15px 15px; max-width: 400px; margin: 0 auto;">
							<tr>
								<td style="text-align: center; vertical-align: top; width: 50%;">
									<a href="mailto:${process.env.GMAIL_USERNAME}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: 600; width: 100%; box-sizing: border-box; font-size: 14px;">
										✉️ Email Us<br/>Directly
									</a>
								</td>
								<td style="text-align: center; vertical-align: top; width: 50%;">
									<a href="https://wa.me/${process.env.WHATSAPP_NUMBER}?text=Hi%20Synerix%20Team,%20I%20submitted%20an%20enquiry%20and%20have%20some%20questions." style="display: inline-block; background: #25d366; color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: 600; width: 100%; box-sizing: border-box; font-size: 14px;">
										📱 WhatsApp Us<br/>Instantly
									</a>
								</td>
							</tr>
						</table>
					</div>
				</div>

				<!-- Footer -->
				<div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white;">
					<h3 style="color: white; margin-bottom: 15px; font-size: 20px; font-weight: 700;">Synerix Business Solutions</h3>
					<p style="margin: 0 0 15px 0; font-size: 16px; opacity: 0.9;">Empowering businesses with data-driven insights and strategic solutions</p>
					<div style="margin-top: 20px;">
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="contact-table" style="margin: 0 0 20px 0; border-collapse: separate; border-spacing: 0; max-width: 400px; margin: 20px auto 0 auto;">
							<tr>
								<td style="width: 33.33%; padding: 10px 5px; vertical-align: top; text-align: center;">
									<div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
										<div style="font-size: 12px; margin-bottom: 3px;">🌐</div>
										<a href=${process.env.WEBSITE_URL} style="color: #94a3b8; text-decoration: none; font-size: 12px;">Website</a>
									</div>
								</td>
								<td style="width: 33.33%; padding: 10px 5px; vertical-align: top; text-align: center;">
									<div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
										<div style="font-size: 12px; margin-bottom: 3px;">📧</div>
										<a href="mailto:${process.env.GMAIL_USERNAME}" style="color: #94a3b8; text-decoration: none; font-size: 12px;">Email</a>
									</div>
								</td>
								<td style="width: 33.33%; padding: 10px 5px; vertical-align: top; text-align: center;">
									<div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
										<div style="font-size: 12px; margin-bottom: 3px;">📱</div>
										<a href="https://wa.me/${process.env.WHATSAPP_NUMBER}" style="color: #25d366; text-decoration: none; font-size: 12px;">WhatsApp</a>
									</div>
								</td>
							</tr>
						</table>
					</div>
					<p style="margin: 20px 0 0 0; font-size: 12px; opacity: 0.7; font-style: italic;">
						"Looking forward to helping your business achieve remarkable growth!"
					</p>
				</div>
			</div>
		</body>
		</html>
	`;

	const text = `
═══════════════════════════════════════════════════════════════
THANK YOU FOR YOUR ENQUIRY - SYNERIX
═══════════════════════════════════════════════════════════════

Thank You! 🙏

Your enquiry has been received and we're excited to help you take your business to the next level!

📅 WHAT HAPPENS NEXT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Our team will review your enquiry within the next few hours
• You'll receive a personalized response within 24 hours
• We'll schedule a free consultation call to understand your needs
• Together, we'll create a customized growth strategy for your business

🎯 WHILE YOU WAIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Want to get started right away? Take our free Business Health Assessment to identify your growth opportunities:

Take Free Business Health Test: ${process.env.WEBSITE_URL}tests/business-health

📧 CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Have questions? Feel free to reach out to us directly:
📧 Email: ${process.env.GMAIL_USERNAME}
📱 WhatsApp: ${process.env.WHATSAPP_NUMBER}

═══════════════════════════════════════════════════════════════
Synerix Business Solutions
Empowering businesses with data-driven insights and strategic solutions

Website: ${process.env.WEBSITE_URL}
Email: ${process.env.GMAIL_USERNAME}
WhatsApp: ${process.env.WHATSAPP_NUMBER}

"Looking forward to helping your business achieve remarkable growth!"
═══════════════════════════════════════════════════════════════
	`.trim();

	return { html, text };
}

export async function POST(req: NextRequest) {
	try {
		if (!rateLimit(`send-enquiry:${clientIp(req)}`, { limit: 5, windowMs: 60 * 60_000 })) {
			return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
		}

		const body = await req.json();
		const { email } = enquirySchema.parse(body);

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

		// Generate email content
		const notificationEmail = generateEnquiryNotificationEmail(email);
		const confirmationEmail = generateUserConfirmationEmail(email);

		// Send notification email to business owner
		const notificationMailOptions = {
			from: {
				name: 'Synerix Website Enquiry',
				address: process.env.GMAIL_USERNAME!,
			},
			to: process.env.GMAIL_USERNAME,
			subject: `New Website Enquiry - ${email}`,
			html: notificationEmail.html,
			text: notificationEmail.text,
			replyTo: email,
		};

		// Send confirmation email to user
		const confirmationMailOptions = {
			from: {
				name: 'Synerix Business Solutions',
				address: process.env.GMAIL_USERNAME!,
			},
			to: email,
			subject: 'Thank you for your enquiry - Synerix',
			html: confirmationEmail.html,
			text: confirmationEmail.text,
			replyTo: process.env.GMAIL_USERNAME,
		};

		try {
			// Send both emails
			const [notificationInfo, confirmationInfo] = await Promise.all([
				transporter.sendMail(notificationMailOptions),
				transporter.sendMail(confirmationMailOptions),
			]);

			console.log('Enquiry emails sent successfully:');
			console.log(`Notification sent to ${process.env.GMAIL_USERNAME}:`, notificationInfo.messageId);
			console.log('Confirmation sent to user:', confirmationInfo.messageId);
			console.log(`Enquiry from: ${email}`);

			return NextResponse.json({
				success: true,
				message: 'Enquiry submitted successfully',
				notificationMessageId: notificationInfo.messageId,
				confirmationMessageId: confirmationInfo.messageId,
			});
		} catch (caught: unknown) {
			console.error('Error sending enquiry emails:', caught);
			const error = caught as { code?: string; response?: string; message?: string };

			// Check for specific Nodemailer/SMTP errors
			let errorMessage = 'Failed to send enquiry emails';
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
		console.error('Enquiry submission error:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Invalid email address', details: error.issues }, { status: 400 });
		}

		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
