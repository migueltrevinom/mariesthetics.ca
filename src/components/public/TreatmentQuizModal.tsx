"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TreatmentQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TreatmentQuizModal({ isOpen, onClose }: TreatmentQuizModalProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState<any>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { optionId: string; optionText: string; recommendedServiceId?: any }>>({});
  
  // Client details & result state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recommendedService, setRecommendedService] = useState<any>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError("");
    setCurrentStep(0);
    setAnswers({});
    setCompleted(false);
    setRecommendedService(null);

    fetch("/api/public/quizzes/skin-treatment-finder")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.quiz) {
          setQuiz(data.quiz);
        } else {
          setError("Failed to load skin diagnostic quiz.");
        }
      })
      .catch(() => setError("Failed to fetch diagnostic quiz."))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const questions = quiz?.questions || [];
  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];

  function handleSelectOption(opt: any) {
    const nextAnswers = {
      ...answers,
      [currentQuestion.questionId]: {
        optionId: opt.optionId,
        optionText: opt.optionText,
        recommendedServiceId: opt.recommendedServiceId,
      },
    };
    setAnswers(nextAnswers);

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final Step Reached -> Calculate Recommendation!
      calculateAndFinish(nextAnswers);
    }
  }

  function calculateAndFinish(finalAnswers: Record<string, any>) {
    // Find the first option that provides a recommended service ID
    let rec: any = null;
    for (const qId in finalAnswers) {
      if (finalAnswers[qId]?.recommendedServiceId) {
        rec = finalAnswers[qId].recommendedServiceId;
        break;
      }
    }

    setRecommendedService(rec);
    setCompleted(true);
  }

  async function handleProceedToBooking() {
    if (!quiz || !recommendedService) {
      router.push("/book");
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      // Save submission record for analytics & client profile
      const payloadAnswers = Object.keys(answers).map((qId) => ({
        questionId: qId,
        optionId: answers[qId].optionId,
        selectedText: answers[qId].optionText,
      }));

      await fetch("/api/public/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz._id,
          guest: { name: guestName, email: guestEmail },
          answers: payloadAnswers,
          recommendedServiceId: typeof recommendedService === "object" ? recommendedService._id : recommendedService,
        }),
      });

      const serviceId = typeof recommendedService === "object" ? recommendedService._id : recommendedService;
      const serviceSlug = typeof recommendedService === "object" ? recommendedService.slug : "";

      if (serviceSlug) {
        router.push(`/book?service=${serviceSlug}`);
      } else if (serviceId) {
        router.push(`/book?serviceId=${serviceId}`);
      } else {
        router.push("/book");
      }
      onClose();
    } catch (err) {
      console.error("[Submit Quiz Error]:", err);
      router.push("/book");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl border border-[#c8a86b]/40 bg-[var(--card-bg)] text-[var(--ink)] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-left relative transition-colors duration-200">
        
        {/* Header Close */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                {quiz?.title || "Find Your Ideal Treatment"}
              </h2>
              <p className="text-[11px] text-[var(--ink-soft)] font-mono">
                30-Sec Skin Diagnostic Quiz
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#c8a86b] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[var(--ink-soft)] font-medium">Preparing diagnostic quiz...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-xs text-rose-500 font-semibold">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary py-2 px-6 text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : completed ? (
          /* RESULT RECOMMENDATION CARD */
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="p-5 rounded-2xl border border-[#c8a86b]/40 bg-[#c8a86b]/10 text-center space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#b08d4b] dark:text-[#c8a86b] block">
                ⭐ Your Tailored Recommendation
              </span>
              <h3 className="text-2xl font-bold text-[var(--ink)] font-[family-name:var(--font-display)]">
                {typeof recommendedService === "object" ? recommendedService.name : "Signature Facial Treatment"}
              </h3>
              <p className="text-xs text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                Based on your skin goals and preferences, this treatment delivers deep hydration, cellular renewal, and an instant studio glow.
              </p>
            </div>

            {/* Optional Guest Contact Info */}
            <div className="space-y-3 pt-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block">
                Save Quiz Results to Your Profile (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b]"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleProceedToBooking()}
                className="btn-primary w-full py-3 text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? "Directing to Studio Calendar..." : "📅 Book Recommended Treatment →"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* QUESTION WIZARD STEP */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono font-bold text-[var(--ink-soft)]">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span className="text-[#c8a86b]">{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--ink)]">
                    {currentQuestion.questionText}
                  </h3>
                  {currentQuestion.subtitle && (
                    <p className="text-xs text-[var(--ink-soft)] mt-1 font-medium">
                      {currentQuestion.subtitle}
                    </p>
                  )}
                </div>

                {/* Options List */}
                <div className="grid gap-3 pt-2">
                  {currentQuestion.options?.map((opt: any) => (
                    <button
                      key={opt.optionId}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className="w-full border border-[var(--border-color)] bg-black/5 dark:bg-white/5 hover:border-[#c8a86b] hover:bg-[#c8a86b]/10 p-4 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.icon || "✨"}</span>
                        <span className="text-xs font-bold text-[var(--ink)] group-hover:text-[#c8a86b] transition-colors">
                          {opt.optionText}
                        </span>
                      </div>
                      <span className="text-xs text-[#c8a86b] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
