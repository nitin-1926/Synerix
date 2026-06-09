"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, TriangleAlert } from "lucide-react";

export interface WizardQuestion {
  id: string;
  question: string;
  options: { id: string; content: string; weightAge: string | number }[];
  category: string;
}

interface Answer {
  questionId: string;
  optionId: string;
  weightAge: number;
}

interface ExistingUser {
  message?: string;
}

type UserInfoKey =
  | "name"
  | "phoneNumber"
  | "email"
  | "businessName"
  | "businessDescription";

const INFO_STEPS: {
  key: UserInfoKey;
  eyebrow: string;
  question: string;
  placeholder: string;
  inputType: "text" | "tel" | "email" | "textarea";
}[] = [
  {
    key: "name",
    eyebrow: "Let's start by getting to know you",
    question: "What's your name?",
    placeholder: "Your full name",
    inputType: "text",
  },
  {
    key: "phoneNumber",
    eyebrow: "We need this to connect with you",
    question: "What's your phone number?",
    placeholder: "+91 98765 43210",
    inputType: "tel",
  },
  {
    key: "email",
    eyebrow: "Your detailed report will be sent here",
    question: "What's your email address?",
    placeholder: "you@yourbusiness.com",
    inputType: "email",
  },
  {
    key: "businessName",
    eyebrow: "Tell us about your business",
    question: "What's your business name?",
    placeholder: "Your business name",
    inputType: "text",
  },
  {
    key: "businessDescription",
    eyebrow: "Help us understand your business better",
    question: "What does your business do?",
    placeholder: "Products or services you offer, who you sell to…",
    inputType: "textarea",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhoneNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getScoreMessage(score: number) {
  if (score >= 80)
    return "Your business shows excellent health with strong fundamentals across all areas.";
  if (score >= 60)
    return "Your business is performing well but has some areas for improvement.";
  if (score >= 40)
    return "Your business has potential but needs strategic improvements in key areas.";
  return "Your business requires immediate attention in several critical areas to ensure sustainability.";
}

export function BusinessHealthWizard({
  testId,
  questions,
}: {
  testId: string | null;
  questions: WizardQuestion[];
}) {
  const [step, setStep] = useState(0);
  const [userInfo, setUserInfo] = useState<Record<UserInfoKey, string>>({
    name: "",
    phoneNumber: "",
    email: "",
    businessName: "",
    businessDescription: "",
  });
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [existingUser, setExistingUser] = useState<ExistingUser | null>(null);
  const [phase, setPhase] = useState<"questions" | "review" | "sent">("questions");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const totalSteps = INFO_STEPS.length + questions.length;
  const infoStep = step < INFO_STEPS.length ? INFO_STEPS[step] : null;
  const question = infoStep ? null : questions[step - INFO_STEPS.length];
  const selectedAnswer = question
    ? answers.find((a) => a.questionId === question.id)
    : undefined;

  const progress =
    phase === "questions" ? ((step + 1) / totalSteps) * 100 : 100;

  const score = Math.round(
    (answers.reduce((sum, a) => sum + a.weightAge, 0) /
      (questions.length * 2)) *
      100,
  );

  const stepValid = (() => {
    if (infoStep) {
      const value = userInfo[infoStep.key].trim();
      if (!value) return false;
      if (infoStep.key === "phoneNumber") return isValidPhoneNumber(value);
      if (infoStep.key === "email") return EMAIL_REGEX.test(value);
      return true;
    }
    return Boolean(selectedAnswer);
  })();

  // Live hint for partially-typed phone / email values.
  const inputHint = (() => {
    if (!infoStep) return null;
    const value = userInfo[infoStep.key].trim();
    if (!value) return null;
    if (infoStep.key === "phoneNumber" && !isValidPhoneNumber(value))
      return "Please enter a valid phone number (10-15 digits).";
    if (infoStep.key === "email" && !EMAIL_REGEX.test(value))
      return "Please enter a valid email address.";
    return null;
  })();

  const goNext = () => {
    setStepError(null);
    if (step < totalSteps - 1) setStep(step + 1);
    else setPhase("review");
  };

  const goBack = () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setStepError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const checkExistingUser = async () => {
    setIsCheckingUser(true);
    setStepError(null);
    try {
      const response = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: userInfo.phoneNumber.trim(),
          email: userInfo.email.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setStepError("Unable to verify your details. Please try again.");
        return;
      }
      if (result.hasTakenTest) {
        setExistingUser({ message: result.message });
        return;
      }
      goNext();
    } catch {
      setStepError(
        "Network error while verifying your details. Please check your connection and try again.",
      );
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleContinue = () => {
    if (!stepValid || isCheckingUser) return;
    if (infoStep?.key === "email") {
      // Duplicate check before moving past the email step.
      void checkExistingUser();
      return;
    }
    goNext();
  };

  const handleInputChange = (key: UserInfoKey, value: string) => {
    setStepError(null);
    setUserInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnswerSelect = (
    q: WizardQuestion,
    optionId: string,
    weightAge: string | number,
  ) => {
    const next: Answer = {
      questionId: q.id,
      optionId,
      weightAge: parseInt(String(weightAge), 10),
    };
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === q.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = next;
        return updated;
      }
      return [...prev, next];
    });
    // Auto-advance shortly after selection (legacy behaviour).
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(goNext, 350);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/send-test-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userInfo.email.trim(),
          phoneNumber: userInfo.phoneNumber.trim(),
          name: userInfo.name.trim(),
          businessName: userInfo.businessName.trim(),
          businessDescription: userInfo.businessDescription.trim(),
          testScore: score,
          testId: testId ?? "",
          answers,
        }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setPhase("sent");
        return;
      }

      if (result.error === "Test already completed") {
        setExistingUser({ message: result.message });
        return;
      }

      if (!testId) {
        setSubmitError(
          "Test submissions are temporarily unavailable. Please try again later.",
        );
        return;
      }

      let message = result.error || "Something went wrong. Please try again.";
      if (
        result.error === "Email service not configured" ||
        result.error === "Email service configuration error"
      ) {
        message =
          "Our email service is currently unavailable. Please try again later or contact support.";
      } else if (
        typeof result.error === "string" &&
        result.error.includes("Invalid email")
      ) {
        message = "Please go back and check your email address, then try again.";
      } else if (
        typeof result.error === "string" &&
        result.error.includes("cannot receive emails")
      ) {
        message =
          "This email address cannot receive emails. Please go back and use a different one.";
      }
      setSubmitError(message);
    } catch {
      setSubmitError(
        "Network error. Please check your internet connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ====== Already taken the test ====== */
  if (existingUser) {
    return (
      <div className="rounded-2xl border border-mk-line bg-white p-8 md:p-12">
        <span className="mk-mono inline-flex items-center gap-2 rounded-full border border-mk-line px-3 py-1.5 text-[10px] text-mk-slate">
          <TriangleAlert className="size-3 text-mk-cyan-deep" />
          Already completed
        </span>
        <h2 className="mk-display mt-6 text-2xl font-medium text-mk-ink md:text-3xl">
          You&apos;ve already taken this test
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-mk-slate">
          We found a completed Business Health Check for this phone number and
          email.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-mk-slate">
          To keep results trustworthy, each phone number and email combination
          can take the test once. Ready for the next step? Our consultants can
          help you act on your report.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/consulting"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-mk-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-mk-navy"
          >
            Talk to us about consulting
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-mk-line px-6 py-3.5 text-sm font-medium text-mk-slate transition hover:border-mk-cyan-deep hover:text-mk-ink"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  /* ====== Report sent ====== */
  if (phase === "sent") {
    return (
      <div className="mk-grain relative overflow-hidden rounded-2xl bg-mk-ink p-8 text-center text-white md:p-12">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-mk-cyan/15 ring-1 ring-mk-cyan/40">
          <Check className="size-7 text-mk-cyan-bright" />
        </div>
        <p className="mk-mono mt-8 text-[11px] text-mk-cyan">
          Your business health score
        </p>
        <p className="mk-display mt-2 text-6xl font-medium md:text-7xl">
          {score}
          <span className="text-3xl text-mk-mist">%</span>
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-mk-mist">
          {getScoreMessage(score)}
        </p>
        <h2 className="mk-display mt-10 text-balance text-2xl font-medium md:text-3xl">
          Your report is on its way to your inbox
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mk-mist">
          We&apos;ve sent the full breakdown to{" "}
          <strong className="font-semibold text-white">
            {userInfo.email.trim()}
          </strong>
          . If it doesn&apos;t arrive in a few minutes, check your spam folder.
        </p>
        <Link
          href="/"
          className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-mk-cyan px-6 py-3.5 text-sm font-semibold text-mk-ink transition hover:bg-mk-cyan-bright"
        >
          Back to home
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  /* ====== All questions answered — send the report ====== */
  if (phase === "review") {
    return (
      <div className="rounded-2xl border border-mk-line bg-white p-8 md:p-12">
        <span className="mk-mono text-[11px] text-mk-cyan-deep">
          All {questions.length} questions answered
        </span>
        <h2 className="mk-display mt-5 text-2xl font-medium text-mk-ink md:text-3xl">
          Well done, {userInfo.name.trim().split(" ")[0]}.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mk-slate">
          Your Business Health Check is complete. We&apos;ll score your answers
          across finance, people, operations, market and strategy, and send the
          detailed report with personalised recommendations to{" "}
          <strong className="text-mk-ink">{userInfo.email.trim()}</strong>.
        </p>
        {submitError && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {submitError}
          </div>
        )}
        <div className="mt-9 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPhase("questions")}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mk-slate transition hover:text-mk-ink disabled:opacity-40"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-mk-ink px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-mk-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Sending your report…" : "Send my report"}
            {!isSubmitting && <ArrowRight className="size-4" />}
          </button>
        </div>
      </div>
    );
  }

  /* ====== Wizard ====== */
  const progressLabel = infoStep
    ? `About you: ${pad(step + 1)} / ${pad(INFO_STEPS.length)}`
    : `Question ${pad(step - INFO_STEPS.length + 1)} / ${pad(questions.length)}`;

  return (
    <div className="rounded-2xl border border-mk-line bg-white p-6 md:p-10">
      {/* Progress */}
      <div className="flex items-center justify-between gap-3">
        <span className="mk-mono text-[11px] text-mk-slate">{progressLabel}</span>
        {question && (
          <span className="mk-mono rounded-full border border-mk-line px-2.5 py-1 text-[10px] text-mk-cyan-deep">
            {question.category}
          </span>
        )}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-mk-paper-dim">
        <div
          className="h-full rounded-full bg-mk-cyan-deep transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step body */}
      {infoStep ? (
        <div key={infoStep.key} className="mt-9">
          <p className="mk-mono text-[11px] text-mk-cyan-deep">
            {infoStep.eyebrow}
          </p>
          <h2 className="mk-display mt-3 text-2xl font-medium leading-snug text-mk-ink">
            {infoStep.question}
          </h2>
          <div className="mt-7">
            {infoStep.inputType === "textarea" ? (
              <textarea
                rows={4}
                autoFocus
                placeholder={infoStep.placeholder}
                value={userInfo[infoStep.key]}
                onChange={(e) => handleInputChange(infoStep.key, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleContinue();
                  }
                }}
                className="w-full resize-none rounded-xl border border-mk-line bg-white px-4 py-3 text-[15px] text-mk-ink placeholder:text-mk-slate/50 transition focus:border-mk-cyan-deep focus:outline-none focus:ring-2 focus:ring-mk-cyan/30"
              />
            ) : (
              <input
                type={infoStep.inputType}
                autoFocus
                placeholder={infoStep.placeholder}
                value={userInfo[infoStep.key]}
                onChange={(e) => handleInputChange(infoStep.key, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleContinue();
                  }
                }}
                className="w-full rounded-xl border border-mk-line bg-white px-4 py-3 text-[15px] text-mk-ink placeholder:text-mk-slate/50 transition focus:border-mk-cyan-deep focus:outline-none focus:ring-2 focus:ring-mk-cyan/30"
              />
            )}
            {(inputHint || stepError) && (
              <p className="mt-2.5 flex items-start gap-1.5 text-[13px] leading-relaxed text-red-600">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {stepError ?? inputHint}
              </p>
            )}
          </div>
        </div>
      ) : question ? (
        <div key={question.id} className="mt-9">
          <h2 className="mk-display text-2xl font-medium leading-snug text-mk-ink">
            {question.question}
          </h2>
          <div className="mt-7 space-y-3">
            {question.options.map((option) => {
              const isSelected = selectedAnswer?.optionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    handleAnswerSelect(question, option.id, option.weightAge)
                  }
                  className={`flex w-full items-center gap-3.5 rounded-xl border px-5 py-4 text-left text-[15px] leading-snug transition ${
                    isSelected
                      ? "border-mk-cyan-deep bg-mk-cyan/5 text-mk-ink"
                      : "border-mk-line text-mk-slate hover:border-mk-cyan-deep hover:text-mk-ink"
                  }`}
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full transition ${
                      isSelected
                        ? "bg-mk-cyan-deep"
                        : "border border-mk-slate/40"
                    }`}
                  />
                  {option.content}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className={`inline-flex items-center gap-1.5 text-sm font-medium text-mk-slate transition hover:text-mk-ink ${
            step === 0 ? "invisible" : ""
          }`}
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!stepValid || isCheckingUser}
          className="inline-flex items-center gap-2 rounded-full bg-mk-ink px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-mk-navy disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCheckingUser
            ? "Checking…"
            : step === totalSteps - 1
              ? "Finish"
              : "Continue"}
          {!isCheckingUser && <ArrowRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}
