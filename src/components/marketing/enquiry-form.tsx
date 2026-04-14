"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type FormStatus = "idle" | "sending" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EnquiryForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/send-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus("error");
        setErrorMessage(
          data?.error ?? "Something went wrong. Please try again, or email us directly."
        );
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please try again, or email us directly.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-mk-line bg-white p-8 md:p-10">
        <p className="mk-mono text-[11px] text-mk-cyan-deep">Enquiry received</p>
        <p className="mk-display mt-4 text-2xl font-medium text-mk-ink">
          Thanks! We&rsquo;ll reach out within a working day.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-mk-slate">
          A confirmation is on its way to your inbox. If it&rsquo;s urgent, WhatsApp us and
          we&rsquo;ll pick it up sooner.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-mk-line bg-white p-8 md:p-10"
    >
      <label htmlFor="enquiry-email" className="mk-mono block text-[11px] text-mk-slate">
        Your work email
      </label>
      <input
        id="enquiry-email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        placeholder="you@yourbusiness.in"
        disabled={status === "sending"}
        className="mt-3 w-full rounded-xl border border-mk-line bg-white px-4 py-3.5 text-[15px] text-mk-ink placeholder:text-mk-slate/50 focus:border-mk-ink focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mk-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-mk-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Request a call back"}
        {status !== "sending" && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </button>
      {status === "error" && (
        <p className="mt-4 text-sm leading-relaxed text-red-700" role="alert">
          {errorMessage}
        </p>
      )}
      <p className="mt-5 text-xs leading-relaxed text-mk-slate">
        No newsletter, no spam. One email from a real person to set up a conversation.
      </p>
    </form>
  );
}
