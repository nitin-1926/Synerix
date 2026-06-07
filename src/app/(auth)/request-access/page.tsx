import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/nextauth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/app/actions/auth";

export const metadata = { title: "Request access — Synerix Studio" };

/**
 * Landing page for a signed-in Google account that has no workspace and no
 * pending invite (invite-only product). Deliberately does NOT call
 * requireAuth — that would redirect right back here.
 */
export default async function RequestAccessPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  // Already provisioned (invite accepted since sign-in, or member all along)?
  // Straight into the product.
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: { take: 1 } },
  });
  const invited = await prisma.workspaceInvite.findFirst({
    where: { email: session.user.email, status: "PENDING" },
  });
  if (user?.memberships.length || invited) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Synerix</p>
          <h1 className="mt-1 font-display text-4xl">Studio</h1>
        </div>
        <Card>
          <CardContent className="space-y-4 py-6 text-center">
            <h2 className="text-lg font-semibold">Studio is invite-only</h2>
            <p className="text-sm text-muted-foreground">
              You&apos;re signed in as <span className="font-medium text-foreground">{session.user.email}</span>, but this
              email doesn&apos;t have workspace access yet. Ask your workspace admin for an invite, or contact us and
              we&apos;ll set you up.
            </p>
            <Link
              href="mailto:consulting.synerix@gmail.com?subject=Synerix%20Studio%20access%20request"
              className={buttonVariants({ variant: "default", className: "w-full" })}
            >
              Request access
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" className="w-full">
                Sign in with a different account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
