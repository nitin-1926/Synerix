import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/html";

/**
 * Gmail SMTP transport shared by transactional email (workspace invites) and
 * the marketing site's send-enquiry / send-test-report routes: GMAIL_USERNAME +
 * GMAIL_PASSWORD (app password). Returns null when creds are missing; invite
 * senders then resolve false instead of throwing — email is a courtesy, never
 * a gate (invites auto-accept on first sign-in regardless).
 */
export function transporter() {
  const user = process.env.GMAIL_USERNAME;
  const pass = process.env.GMAIL_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
}

/** Map a Nodemailer/SMTP send failure to a user-facing JSON error response. */
export function smtpErrorResponse(caught: unknown, fallbackMessage: string) {
  const error = caught as { code?: string; response?: string; message?: string };

  // Check for specific Nodemailer/SMTP errors
  let errorMessage = fallbackMessage;
  let statusCode = 500;

  if (error.code) {
    switch (error.code) {
      case "EAUTH":
        errorMessage = "Email authentication failed. Please check email configuration.";
        statusCode = 500;
        break;
      case "EENVELOPE":
      case "EMESSAGE":
        errorMessage = "Invalid email address. Please check and try again.";
        statusCode = 400;
        break;
      case "ECONNECTION":
      case "ETIMEDOUT":
        errorMessage = "Email service temporarily unavailable. Please try again later.";
        statusCode = 503;
        break;
      default:
        if (error.response && error.response.includes("550")) {
          errorMessage = "This email address cannot receive emails. Please use a different email.";
          statusCode = 400;
        }
        break;
    }
  } else if (error.message) {
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes("invalid email") || errorMsg.includes("email address")) {
      errorMessage = "Invalid email address. Please check and try again.";
      statusCode = 400;
    } else if (errorMsg.includes("blocked") || errorMsg.includes("bounced")) {
      errorMessage = "This email address cannot receive emails. Please use a different email.";
      statusCode = 400;
    } else if (errorMsg.includes("rate limit") || errorMsg.includes("quota")) {
      errorMessage = "Too many emails sent. Please try again later.";
      statusCode = 429;
    }
  }

  return NextResponse.json({ error: errorMessage }, { status: statusCode });
}

const APP_URL = process.env.WEBSITE_URL ?? "https://www.synerix.in";

/** Send a workspace invite. Returns whether the email actually went out. */
export async function sendInviteEmail(opts: {
  to: string;
  workspaceName: string;
  invitedByName: string | null;
  /** True when the invitee already had an account and was added directly. */
  alreadyMember: boolean;
}): Promise<boolean> {
  const mailer = transporter();
  if (!mailer) {
    console.warn("[email] GMAIL_USERNAME/GMAIL_PASSWORD not set — invite email skipped");
    return false;
  }
  const inviter = opts.invitedByName ? escapeHtml(opts.invitedByName) : "Your teammate";
  const workspace = escapeHtml(opts.workspaceName);
  const loginUrl = `${APP_URL}/login`;
  const lede = opts.alreadyMember
    ? `${inviter} added you to the <strong>${workspace}</strong> workspace on Synerix Studio.`
    : `${inviter} invited you to the <strong>${workspace}</strong> workspace on Synerix Studio.`;

  try {
    await mailer.sendMail({
      from: `Synerix Studio <${process.env.GMAIL_USERNAME}>`,
      to: opts.to,
      subject: `You've been invited to ${opts.workspaceName} on Synerix Studio`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0b1f4e;">
          <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #007e97; margin: 0 0 4px;">Synerix Studio</p>
          <h1 style="font-size: 22px; margin: 0 0 16px;">You're invited</h1>
          <p style="font-size: 15px; line-height: 1.6;">${lede}</p>
          <p style="font-size: 15px; line-height: 1.6;">Sign in with Google using <strong>this email address</strong> (${escapeHtml(opts.to)}) and you'll land straight in the workspace.</p>
          <p style="margin: 24px 0;">
            <a href="${loginUrl}" style="background: #0b1f4e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-size: 15px;">Open Synerix Studio</a>
          </p>
          <p style="font-size: 12px; color: #44506b;">If you weren't expecting this invite, you can ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error(`[email] invite send failed: ${(e as Error).message}`);
    return false;
  }
}
