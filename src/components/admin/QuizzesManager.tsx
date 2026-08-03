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
  const [error, setError] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);

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

  function handleAddOption(qIndex: number) {
    setQuestions((prev) => {
      const next = [...prev];
      const targetQ = { ...next[qIndex] };
      targetQ.options = [
        ...targetQ.options,
        { optionId: `o_${Date.now()}`, optionText: "New Option", icon: "✨", recommendedServiceId: services[0]?._id || "" },
      ];
      next[qIndex] = targetQ;
      return next;
    });
  }

  async function handleSaveQuiz() {
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
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete quiz");
    }
  }

  return (
    <div className="w-full text-left space-y-8">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Diagnostic Skin Quizzes
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Configure dynamic treatment finder questions, options, and recommended service mappings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer shrink-0"
        >
          + Create New Quiz
        </button>
      </div>

      {/* Quizzes Table */}
      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--ink)]">
          <thead className="text-[var(--ink-soft)]/75 border-b border-[var(--border-color)]">
            <tr>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Quiz Title</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Slug</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Questions</th>
              <th className="py-2.5 pr-4 font-bold text-xs uppercase">Status</th>
              <th className="py-2.5 text-right font-bold text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q._id} className="border-b border-[var(--border-color)]/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4 font-semibold text-xs text-[var(--ink)]">
                  {q.title}
                  {q.description && (
                    <span className="block text-[11px] text-[var(--ink-soft)] font-normal truncate max-w-[200px]">
                      {q.description}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-[#c8a86b]">
                  {q.slug}
                </td>
                <td className="py-3 pr-4 text-xs font-bold font-mono">
                  {q.questions?.length || 0} Questions
                </td>
                <td className="py-3 pr-4 text-xs font-bold">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${
                      q.active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-gray-500/40 bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {q.active ? "Active" : "Draft"}
                  </span>
                </td>
                <td className="py-3 text-right text-xs space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(q)}
                    className="px-3 py-1 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--ink)] hover:border-[#c8a86b] transition-all cursor-pointer"
                  >
                    ✏️ Edit Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(q._id)}
                    className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quizzes.length === 0 && (
          <p className="py-8 text-center text-xs text-[var(--ink-soft)] italic">
            No quizzes created yet. Click "+ Create New Quiz" to build one!
          </p>
        )}
      </div>

      {/* QUIZ BUILDER WIZARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl border border-[var(--border-color)] bg-[var(--background)] p-6 sm:p-8 rounded-3xl shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h2 className="text-2xl font-[family-name:var(--font-display)] font-bold text-[var(--ink)]">
                {editingId ? "Edit Quiz Builder" : "Create New Diagnostic Quiz"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm cursor-pointer p-1"
              >
                ✕
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
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] block mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Find Your Ideal Skincare Treatment"
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b] font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] block mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. skin-treatment-finder"
                  className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief summary shown on quiz introduction card..."
                className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
              />
            </div>

            {/* Questions Manager */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <h3 className="text-sm uppercase font-extrabold tracking-wider text-[#c8a86b]">
                  Questions ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-xs font-bold text-[#c8a86b] hover:underline cursor-pointer"
                >
                  + Add Question
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div key={q.questionId || qIdx} className="border border-[var(--border-color)] bg-black/5 dark:bg-black/20 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#c8a86b]">
                      Question #{qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove Question
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
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
                        className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-[var(--ink-soft)] block mb-1">
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
                        className="w-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--ink)] rounded-xl focus:outline-none focus:border-[#c8a86b]"
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
                        className="text-[11px] font-semibold text-[#c8a86b] hover:underline cursor-pointer"
                      >
                        + Add Choice Option
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
                            className="w-full border border-[var(--border-color)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--ink)] rounded-lg text-center"
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
                            className="w-full border border-[var(--border-color)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--ink)] rounded-lg"
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
                            className="text-xs text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
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

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-[var(--border-color)] text-xs font-bold text-[var(--ink-soft)] rounded-xl cursor-pointer hover:text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveQuiz()}
                className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
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
