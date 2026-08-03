"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Review Details
  const [reviewDetails, setReviewDetails] = useState<{
    _id: string;
    status: string;
    rating: number;
    comment: string;
    guestName: string;
    serviceName: string;
    durationMin: number;
    appointmentDate: string | null;
  } | null>(null);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Review link is invalid or token is missing.");
      setValidating(false);
      return;
    }

    setValidating(true);
    fetch(`/api/reviews/validate?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.review) {
          setError(data.error || "Invalid or expired review link.");
        } else {
          setReviewDetails(data.review);
          if (data.review.status === "submitted") {
            setSubmitted(true);
            setRating(data.review.rating || 5);
            setComment(data.review.comment || "");
          }
        }
      })
      .catch(() => {
        setError("Failed to validate review token.");
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (validating) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 border-2 border-[#c8a86b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--ink-soft)] font-medium">Validating review invitation link...</p>
        </div>
      </div>
    );
  }

  if (error && !reviewDetails) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full border border-rose-500/30 bg-rose-500/5 p-8 rounded-2xl shadow-xl space-y-4">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-xl font-[family-name:var(--font-display)] font-bold text-[var(--ink)]">Review Link Unavailable</h2>
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">{error}</p>
          <div className="pt-4">
            <Link href="/" className="btn-primary inline-block py-2.5 px-6 text-xs font-bold shadow-md">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 flex items-center justify-center text-left">
      <div className="max-w-xl w-full border border-[#c8a86b]/40 bg-[var(--card-bg)] text-[var(--ink)] p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8 backdrop-blur-md transition-colors duration-200">
        
        {/* Header Branding */}
        <div className="text-center space-y-1 border-b border-[var(--border-color)] pb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-widest text-[#c8a86b] uppercase">
            Mari Esthetics
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--ink-soft)] font-semibold">
            Edmonton Esthetics Studio
          </p>
        </div>

        {/* Appointment Card */}
        {reviewDetails && (
          <div className="border border-[var(--border-color)] bg-black/5 dark:bg-white/5 p-5 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#b08d4b] dark:text-[#c8a86b] block">
              ✨ Treatment Appointment
            </span>
            <h2 className="text-lg font-bold text-[var(--ink)] font-[family-name:var(--font-display)]">
              {reviewDetails.serviceName}
            </h2>
            <p className="text-xs text-[var(--ink-soft)] font-medium">
              Client: <strong className="text-[var(--ink)]">{reviewDetails.guestName}</strong>
              {reviewDetails.appointmentDate && (
                <span> · {format(new Date(reviewDetails.appointmentDate), "EEEE, MMM d, yyyy")}</span>
              )}
            </p>
          </div>
        )}

        {/* Submitted Confirmation State */}
        {submitted ? (
          <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center text-3xl mx-auto shadow-md">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-[family-name:var(--font-display)] font-bold text-[var(--ink)]">
                Thank You for Your Review!
              </h3>
              <p className="text-xs text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                Your feedback helps us continuously deliver exceptional beauty and esthetics experiences at Mari Esthetics Studio.
              </p>
            </div>

            {/* Display submitted rating stars */}
            <div className="flex justify-center gap-1.5 text-2xl text-[#c8a86b]">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>{star <= rating ? "★" : "☆"}</span>
              ))}
            </div>

            {comment && (
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-xs text-[var(--ink-soft)] italic max-w-md mx-auto">
                "{comment}"
              </div>
            )}

            <div className="pt-4">
              <Link href="/" className="btn-primary inline-block py-2.5 px-8 text-xs font-bold shadow-md">
                Visit Studio Website →
              </Link>
            </div>
          </div>
        ) : (
          /* Review Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 text-center">
              <label className="text-xs uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block">
                How would you rate your service?
              </label>

              {/* Star Selection Rating */}
              <div className="flex justify-center gap-2 text-3xl sm:text-4xl text-[#c8a86b]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="cursor-pointer transform hover:scale-125 transition-transform duration-150 focus:outline-none"
                  >
                    {star <= (hoverRating || rating) ? "★" : "☆"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#c8a86b] font-semibold h-4">
                {rating === 5 && "⭐ Excellent - Loved It!"}
                {rating === 4 && "Great Experience"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Needs Improvement"}
              </p>
            </div>

            {/* Feedback Comment */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-extrabold tracking-wider text-[var(--ink-soft)] block">
                Share your feedback or comments (Optional)
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you loved about your treatment, results, or esthetician..."
                className="w-full border border-[var(--border-color)] bg-[var(--background)] px-4 py-3 rounded-2xl text-xs text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] leading-relaxed"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? "Submitting Review..." : "⭐ Submit Review"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PublicReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center p-6 text-xs text-[var(--ink-soft)]">Loading...</div>}>
      <ReviewPageContent />
    </Suspense>
  );
}
