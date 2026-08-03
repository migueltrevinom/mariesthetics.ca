"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ServiceItem {
  _id: string;
  name: string;
}

export interface QuizOptionItem {
  optionId: string;
  optionText: string;
  icon?: string;
  recommendedServiceId?: string | null;
  scoreWeight?: number;
}

export interface QuizQuestionItem {
  questionId: string;
  questionText: string;
  subtitle?: string;
  order?: number;
  options: QuizOptionItem[];
}

export interface QuizItem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  active: boolean;
  questions: QuizQuestionItem[];
}

interface QuizzesManagerProps {
  initialQuizzes: QuizItem[];
  services: ServiceItem[];
}

export function QuizzesManager({ initialQuizzes, services }: QuizzesManagerProps) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const showErr = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  function handleOpenCreate() {
    setEditingId(null);
    setFormTitle("Find Your Ideal Skincare Treatment");
    setFormSlug("skin-treatment-finder");
    setFormDesc("3-step interactive skin diagnostic quiz.");
    setFormActive(true);
    setQuestions([
      {
        questionId: "q1",
        questionText: "What is your primary skincare goal?",
        subtitle: "Select the result you want to achieve today.",
        order: 1,
        options: [
          { optionId: "o1", optionText: "Deep Hydration & Radiant Glow", icon: "✨", recommendedServiceId: services[0]?._id || "" },
          { optionId: "o2", optionText: "Lifting & Lash Definition", icon: "👁️", recommendedServiceId: services[1]?._id || "" },
        ],
      },
    ]);
    setError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(quiz: QuizItem) {
    setEditingId(quiz._id);
    setFormTitle(quiz.title);
    setFormSlug(quiz.slug);
    setFormDesc(quiz.description || "");
    setFormActive(quiz.active !== false);
    setQuestions(quiz.questions || []);
    setError("");
    setIsModalOpen(true);
  }

  function handleAddQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        questionId: `q_${Date.now()}`,
        questionText: "New Question",
        subtitle: "",
        order: prev.length + 1,
        options: [
          { optionId: `o_${Date.now()}_1`, optionText: "Option 1", icon: "✨", recommendedServiceId: services[0]?._id || "" },
        ],
      },
    ]);
  }

  function handleAddOption(qIdx: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const targetQ = { ...next[qIdx] };
      const currentOpts = targetQ.options || [];
      targetQ.options = [
        ...currentOpts,
        {
          optionId: `o_${Date.now()}_${currentOpts.length + 1}`,
          optionText: "New Choice Option",
          icon: "🌿",
          recommendedServiceId: services[0]?._id || "",
        },
      ];
      next[qIdx] = targetQ;
      return next;
    });
  }

  async function handleSaveQuiz() {
    if (!formTitle.trim() || !formSlug.trim()) {
      setError("Title and URL Slug are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        title: formTitle,
        slug: formSlug,
        description: formDesc,
        active: formActive,
        questions,
      };

      const url = editingId ? `/api/admin/quizzes/${editingId}` : `/api/admin/quizzes`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save quiz");

      if (editingId) {
        setQuizzes((prev) => prev.map((q) => (q._id === editingId ? data.quiz : q)));
      } else {
        setQuizzes((prev) => [data.quiz, ...prev]);
      }

      setIsModalOpen(false);
      showMsg(editingId ? "Quiz updated successfully!" : "Quiz created successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete quiz");

      setQuizzes((prev) => prev.filter((q) => q._id !== id));
      showMsg("Quiz deleted.");
      router.refresh();
    } catch (err: any) {
      showErr(err.message || "Failed to delete quiz");
    }
  }

  async function toggleActive(quiz: QuizItem) {
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          active: !quiz.active,
          questions: quiz.questions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to toggle status");
      setQuizzes((prev) =>
        prev.map((q) => (q._id === quiz._id ? { ...q, active: !q.active } : q))
      );
      showMsg(`Quiz "${quiz.title}" status updated.`);
      router.refresh();
    } catch (err: any) {
      showErr(err.message || "Failed to update status");
    }
  }

  const inputCls =
    "w-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-2.5 rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[#c8a86b] transition-colors";

  return (
    <div className="space-y-6 text-[var(--ink)]">
      {/* Top Banner Header matching Categories & Promotions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            🧪 Diagnostic Skin Quizzes
          </h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            Configure dynamic treatment finder questions, option choices, and recommended service mappings for website clients.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary text-xs !py-2.5 !px-5 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <span>+</span> Create New Quiz
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          ✓ {message}
        </div>
      )}
      {error && !isModalOpen && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold animate-in fade-in duration-200">
          ⚠️ {error}
        </div>
      )}

      {/* Standardized Admin Quizzes Grid Table */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] uppercase font-bold tracking-wider text-[10px]">
                <th className="p-4">Quiz Title</th>
                <th className="p-4">URL Slug</th>
                <th className="p-4">Questions</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--ink-soft)] italic">
                    No quizzes created yet. Click "+ Create New Quiz" to build one!
                  </td>
                </tr>
              ) : (
                quizzes.map((q) => (
                  <tr key={q._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-sm text-[var(--ink)]">
                      <div>{q.title}</div>
                      {q.description && (
                        <div className="text-[11px] text-[var(--ink-soft)] font-normal truncate max-w-xs mt-0.5">
                          {q.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md bg-black/10 dark:bg-white/10 font-mono text-[10px] text-[#c8a86b] font-semibold">
                        {q.slug}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                        {q.questions?.length || 0} Question{q.questions?.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => void toggleActive(q)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          q.active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {q.active ? "● Active (Published)" : "○ Draft"}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(q)}
                        className="px-3 py-1.5 border border-[#c8a86b]/50 bg-[#c8a86b]/10 text-[#c8a86b] rounded-xl text-xs font-bold hover:bg-[#c8a86b]/20 transition-all cursor-pointer"
                      >
                        ✏️ Edit Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(q._id)}
                        className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── QUIZ BUILDER WIZARD MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl max-w-3xl w-full text-left space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h3 className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--ink)] flex items-center gap-2">
                <span>🧪</span>
                <span>{editingId ? "Edit Quiz Builder" : "Create New Diagnostic Quiz"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Find Your Ideal Skincare Treatment"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. skin-treatment-finder"
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                Description / Subtitle
              </label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief summary shown on quiz introduction card..."
                className={inputCls}
              />
            </div>

            {/* Questions Manager */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c8a86b] flex items-center gap-2">
                  <span>Questions Builder ({questions.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 border border-[#c8a86b]/40 bg-[#c8a86b]/10 text-[#c8a86b] text-xs font-bold rounded-xl hover:bg-[#c8a86b]/20 transition-all cursor-pointer"
                >
                  ＋ Add Question
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div key={q.questionId || qIdx} className="p-4 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)]/50 pb-2">
                    <span className="text-xs font-mono font-bold text-[#c8a86b]">
                      Question #{qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))}
                      className="text-xs text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
                    >
                      🗑️ Remove Question
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                        Question Title
                      </label>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions((prev) => {
                            const next = [...prev];
                            next[qIdx] = { ...next[qIdx], questionText: val };
                            return next;
                          });
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                        Subtitle / Hint
                      </label>
                      <input
                        type="text"
                        value={q.subtitle || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions((prev) => {
                            const next = [...prev];
                            next[qIdx] = { ...next[qIdx], subtitle: val };
                            return next;
                          });
                        }}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)]">
                        Option Choices ({q.options.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="text-xs font-bold text-[#c8a86b] hover:underline cursor-pointer"
                      >
                        ＋ Add Choice Option
                      </button>
                    </div>

                    {q.options.map((opt, oIdx) => (
                      <div key={opt.optionId || oIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-color)]">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Emoji"
                            value={opt.icon || "✨"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) => {
                                const next = [...prev];
                                const targetQ = { ...next[qIdx] };
                                const targetOpts = [...targetQ.options];
                                targetOpts[oIdx] = { ...targetOpts[oIdx], icon: val };
                                targetQ.options = targetOpts;
                                next[qIdx] = targetQ;
                                return next;
                              });
                            }}
                            className="w-full border border-[var(--border-color)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--ink)] rounded-lg text-center font-bold"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder="Option Label Text"
                            value={opt.optionText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) => {
                                const next = [...prev];
                                const targetQ = { ...next[qIdx] };
                                const targetOpts = [...targetQ.options];
                                targetOpts[oIdx] = { ...targetOpts[oIdx], optionText: val };
                                targetQ.options = targetOpts;
                                next[qIdx] = targetQ;
                                return next;
                              });
                            }}
                            className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--ink)] rounded-lg font-medium"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <select
                            value={opt.recommendedServiceId || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) => {
                                const next = [...prev];
                                const targetQ = { ...next[qIdx] };
                                const targetOpts = [...targetQ.options];
                                targetOpts[oIdx] = { ...targetOpts[oIdx], recommendedServiceId: val || null };
                                targetQ.options = targetOpts;
                                next[qIdx] = targetQ;
                                return next;
                              });
                            }}
                            className="w-full border border-[var(--border-color)] bg-[var(--background)] px-2 py-1.5 text-[11px] text-[var(--ink)] rounded-lg cursor-pointer"
                          >
                            <option value="">-- No Service Link --</option>
                            {services.map((s) => (
                              <option key={s._id} value={s._id}>
                                Recommend: {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setQuestions((prev) => {
                                const next = [...prev];
                                const targetQ = { ...next[qIdx] };
                                targetQ.options = targetQ.options.filter((_, idx) => idx !== oIdx);
                                next[qIdx] = targetQ;
                                return next;
                              });
                            }}
                            className="text-xs text-rose-500 hover:text-rose-600 p-1 cursor-pointer font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs border border-[var(--border-color)] rounded-xl text-[var(--ink-soft)] font-semibold hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveQuiz()}
                className="btn-primary text-xs !py-2.5 !px-6 disabled:opacity-40 font-bold cursor-pointer"
              >
                {saving ? "Saving Quiz..." : "💾 Save Quiz Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
