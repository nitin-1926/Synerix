import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/nextauth";
import { prisma } from "@/lib/db";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";

export const metadata = { title: "Request access | Synerix Studio" };

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
    <>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Synerix Studio</p>
        <h1 className="mt-2 font-display text-4xl">Studio is invite-only</h1>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        You&apos;re signed in as <span className="font-medium text-foreground">{session.user.email}</span>, but this
        email doesn&apos;t have workspace access yet. Ask your workspace admin for an invite, or contact us and
        we&apos;ll set you up.
      </p>
      <div className="mt-8 space-y-2">
        <Link
          href="mailto:consulting.synerix@gmail.com?subject=Synerix%20Studio%20access%20request"
          className={buttonVariants({
            variant: "default",
            size: "lg",
            className: "h-11 w-full active:scale-[0.98] motion-reduce:active:scale-100",
          })}
        >
          Request access
        </Link>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="lg" className="h-11 w-full">
            Sign in with a different account
          </Button>
        </form>
      </div>
    </>
  );
}
