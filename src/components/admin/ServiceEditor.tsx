"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ServiceRow = {
  id?: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents: number;
  active: boolean;
  sortOrder: number;
  category: string;
};

export function ServiceEditor({ initial }: { initial: ServiceRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ServiceRow>({
    name: "",
    description: "",
    durationMin: 60,
    priceCents: 10000,
    depositCents: 2500,
    active: true,
    sortOrder: initial.length,
    category: "general",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function load(row: ServiceRow) {
    setEditingId(row.id ?? null);
    setForm(row);
  }

  async function save() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/services", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...form } : form,
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEditingId(null);
      setForm({
        name: "",
        description: "",
        durationMin: 60,
        priceCents: 10000,
        depositCents: 2500,
        active: true,
        sortOrder: initial.length + 1,
        category: "general",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-white/60">
        {editingId ? "Edit service" : "Add service"}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input
          placeholder="Name"
          className="border border-white/15 bg-black/20 px-3 py-2 text-white"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Category"
          className="border border-white/15 bg-black/20 px-3 py-2 text-white"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          placeholder="Duration (min)"
          type="number"
          className="border border-white/15 bg-black/20 px-3 py-2 text-white"
          value={form.durationMin}
          onChange={(e) =>
            setForm({ ...form, durationMin: Number(e.target.value) })
          }
        />
        <input
          placeholder="Price cents"
          type="number"
          className="border border-white/15 bg-black/20 px-3 py-2 text-white"
          value={form.priceCents}
          onChange={(e) =>
            setForm({ ...form, priceCents: Number(e.target.value) })
          }
        />
        <input
          placeholder="Deposit cents"
          type="number"
          className="border border-white/15 bg-black/20 px-3 py-2 text-white"
          value={form.depositCents}
          onChange={(e) =>
            setForm({ ...form, depositCents: Number(e.target.value) })
          }
        />
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active
        </label>
        <textarea
          placeholder="Description"
          className="sm:col-span-2 border border-white/15 bg-black/20 px-3 py-2 text-white"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !form.name}
          className="bg-[#2f5d4a] px-4 py-2 text-sm text-white"
          onClick={() => void save()}
        >
          {editingId ? "Update" : "Create"}
        </button>
        {initial.map((row) => (
          <button
            key={row.id}
            type="button"
            className="border border-white/15 px-3 py-2 text-xs text-white/60"
            onClick={() => load(row)}
          >
            Edit {row.name}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-[#e8a0a2]">{error}</p>}
    </div>
  );
}
