import nodemailer from "nodemailer";

/**
 * Transactional email for the studio app (workspace invites). Same Gmail SMTP
 * pattern as the marketing site's send-enquiry route: GMAIL_USERNAME +
 * GMAIL_PASSWORD (app password). When creds are missing, senders resolve
 * false instead of throwing — email is a courtesy, never a gate (invites
 * auto-accept on first sign-in regardless).
 */
function createTransporter() {
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

const APP_URL = process.env.WEBSITE_URL ?? "https://www.synerix.in";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Send a workspace invite. Returns whether the email actually went out. */
export async function sendInviteEmail(opts: {
  to: string;
  workspaceName: string;
  invitedByName: string | null;
  /** True when the invitee already had an account and was added directly. */
  alreadyMember: boolean;
}): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
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
    await transporter.sendMail({
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
