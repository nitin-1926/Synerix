import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

/**
 * NextAuth v5 (Auth.js). Google-only sign-in at launch.
 * JWT session strategy: the adapter persists User/Account rows, but sessions
 * live in the cookie — proxy.ts can gate routes without a DB round-trip.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Trust the deployment host header. Auth.js auto-enables this on Vercel, but
  // set it explicitly so a custom domain (www.synerix.in) behind a proxy never
  // throws UntrustedHost, which surfaces as the generic "server configuration"
  // error on the sign-in page.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      // On sign-in, persist the DB user id into the token.
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string | undefined) ?? token.sub ?? "";
      }
      return session;
    },
  },
});

/** The platform super-admin (god-view over all workspaces). */
export function superAdminEmail(): string {
  return (process.env.SUPER_ADMIN_EMAIL ?? "consulting.synerix@gmail.com").toLowerCase();
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase() === superAdminEmail());
}
