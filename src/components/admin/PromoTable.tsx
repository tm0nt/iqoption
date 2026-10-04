"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminPromo = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  descriptionShort: string | null;
  type: string;
  params: unknown;
  instructions: unknown;
  information: unknown;
  endsAt: string | null;
  enabled: boolean;
  uses: number;
};

const TYPES = [
  { value: "deposit_bonus", label: "Deposit bonus" },
  { value: "higher_payouts", label: "Higher payouts" },
];

type Draft = {
  code: string;
  title: string;
  description: string;
  descriptionShort: string;
  type: string;
  params: string;
  instructions: string;
  information: string;
  endsAt: string;
  enabled: boolean;
};

const BLANK: Draft = {
  code: "", title: "", description: "", descriptionShort: "", type: "deposit_bonus",
  params: "", instructions: "", information: "", endsAt: "", enabled: true,
};

function forInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const json = (value: unknown) => (value ? JSON.stringify(value, null, 2) : "");

const field = "w-full rounded border border-white/10 bg-[#0f1013] px-2 py-1.5 text-[13px] text-white outline-none focus:border-avalon-primary";
const label = "mb-1 block text-[11px] uppercase tracking-wide text-[#73747a]";

/**
 * The codes the Promo panel offers.
 *
 * Three of the fields are JSON because the traderoom treats them as opaque: it
 * renders what is there and checks nothing beyond its own panel. The
 * placeholders show the shape a recording of the live platform carries, so an
 * editor has something to copy rather than a blank box.
 */
export function PromoTable({ codes }: { codes: AdminPromo[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function edit(code: AdminPromo) {
    setEditing(code.id);
    setError(null);
    setDraft({
      code: code.code,
      title: code.title,
      description: code.description ?? "",
      descriptionShort: code.descriptionShort ?? "",
      type: code.type,
      params: json(code.params),
      instructions: json(code.instructions),
      information: json(code.information),
      endsAt: forInput(code.endsAt),
      enabled: code.enabled,
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    const response = await fetch(
      editing === "new" ? "/api/admin/promo" : `/api/admin/promo/${editing}`,
      {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      },
    ).catch(() => null);

    setBusy(false);
    if (!response?.ok) {
      const said = await response?.json().catch(() => null);
      setError(said?.error ?? "could not save");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(id: number) {
    setBusy(true);
    const response = await fetch(`/api/admin/promo/${id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError("could not delete");
      return;
    }
    if (editing === id) setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { setEditing("new"); setDraft(BLANK); setError(null); }}
          className="rounded bg-avalon-primary px-3 py-1.5 text-[13px] font-medium text-white hover:bg-avalon-primary-hover"
        >
          New code
        </button>
        <span className="text-[12px] text-[#73747a]">
          Applying a code records that it was used. Nothing pays a bonus out yet.
        </span>
      </div>

      {error && (
        <p className="rounded border border-avalon-danger/40 bg-avalon-danger/10 px-3 py-2 text-[13px] text-avalon-danger">
          {error}
        </p>
      )}

      {editing !== null && (
        <form
          onSubmit={(event) => { event.preventDefault(); void save(); }}
          className="grid gap-4 rounded border border-white/10 bg-[#15161a] p-4 sm:grid-cols-2"
        >
          <div>
            <span className={label}>Code</span>
            <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} className={field} placeholder="WELCOME100" />
          </div>

          <div>
            <span className={label}>Kind</span>
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className={field}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <span className={label}>Title</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={field} placeholder="Bonus up to 100%" />
          </div>

          <div className="sm:col-span-2">
            <span className={label}>One line, for the list</span>
            <input value={draft.descriptionShort} onChange={(e) => setDraft({ ...draft, descriptionShort: e.target.value })} className={field} />
          </div>

          <div className="sm:col-span-2">
            <span className={label}>The long description</span>
            <textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={field} />
          </div>

          <div className="sm:col-span-2">
            <span className={label}>Steps — JSON</span>
            <textarea
              rows={5}
              value={draft.instructions}
              onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
              className={`${field} font-mono text-[12px]`}
              placeholder={'{"title": "How to get it?", "steps": [{"title": "…", "description": "…"}]}'}
            />
          </div>

          <div className="sm:col-span-2">
            <span className={label}>Details — JSON</span>
            <textarea
              rows={3}
              value={draft.information}
              onChange={(e) => setDraft({ ...draft, information: e.target.value })}
              className={`${field} font-mono text-[12px]`}
              placeholder={'{"details": "Turnover goal: the bonus × 200 within 30 days."}'}
            />
          </div>

          <div>
            <span className={label}>Stops being offered</span>
            <input type="datetime-local" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} className={field} />
          </div>

          <label className="flex items-end gap-2 text-[13px] text-[#a0a1a6]">
            <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
            Offered in the traderoom
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy} className="rounded bg-avalon-primary px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded border border-white/10 px-4 py-1.5 text-[13px] text-[#a0a1a6]">
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#73747a]">
            <th className="py-2 pr-3">Code</th>
            <th className="py-2 pr-3">Title</th>
            <th className="py-2 pr-3">Kind</th>
            <th className="py-2 pr-3">Used</th>
            <th className="py-2 pr-3">Ends</th>
            <th className="py-2 pr-3">Offered</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => (
            <tr key={code.id} className="border-b border-white/5">
              <td className="py-2 pr-3 font-mono">{code.code}</td>
              <td className="py-2 pr-3">{code.title}</td>
              <td className="py-2 pr-3 text-[#a0a1a6]">{TYPES.find((t) => t.value === code.type)?.label ?? code.type}</td>
              <td className="py-2 pr-3 text-[#a0a1a6]">{code.uses}</td>
              <td className="py-2 pr-3 text-[#a0a1a6]">{code.endsAt ? new Date(code.endsAt).toLocaleDateString() : "never"}</td>
              <td className="py-2 pr-3">{code.enabled ? "yes" : "no"}</td>
              <td className="py-2 text-right">
                <button type="button" onClick={() => edit(code)} className="text-avalon-primary hover:underline">Edit</button>
                <button type="button" onClick={() => void remove(code.id)} disabled={busy} className="ml-3 text-avalon-danger hover:underline disabled:opacity-50">
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {codes.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-[#73747a]">No codes yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
