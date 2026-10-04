"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminContent = {
  id: number;
  kind: string;
  locale: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  author: string | null;
  startsAt: string | null;
  endsAt: string | null;
  durationMins: number | null;
  priority: number;
  enabled: boolean;
};

/**
 * The panels an item can be written for, and what each one is called in the
 * traderoom's own left bar — so an editor picks a place they have seen rather
 * than a word from the schema.
 */
const KINDS = [
  { value: "WEBINAR", label: "Webinars" },
  { value: "TUTORIAL", label: "Video Tutorials" },
  { value: "NEWS", label: "Market Analysis — news" },
  { value: "HELP", label: "Help" },
  { value: "PROMO", label: "Promo" },
];

const LOCALES = [
  { value: "", label: "All languages" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "es", label: "Español" },
];

type Draft = {
  kind: string;
  locale: string;
  title: string;
  summary: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  author: string;
  startsAt: string;
  endsAt: string;
  durationMins: string;
  priority: string;
  enabled: boolean;
};

const BLANK: Draft = {
  kind: "WEBINAR", locale: "", title: "", summary: "", body: "", imageUrl: "", linkUrl: "",
  author: "", startsAt: "", endsAt: "", durationMins: "", priority: "0", enabled: true,
};

/** `2026-10-04T21:30` — what `datetime-local` reads and writes. */
function forInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function draftOf(item: AdminContent): Draft {
  return {
    kind: item.kind,
    locale: item.locale ?? "",
    title: item.title,
    summary: item.summary ?? "",
    body: item.body ?? "",
    imageUrl: item.imageUrl ?? "",
    linkUrl: item.linkUrl ?? "",
    author: item.author ?? "",
    startsAt: forInput(item.startsAt),
    endsAt: forInput(item.endsAt),
    durationMins: item.durationMins === null ? "" : String(item.durationMins),
    priority: String(item.priority),
    enabled: item.enabled,
  };
}

const field = "w-full rounded border border-white/10 bg-[#0f1013] px-2 py-1.5 text-[13px] text-white outline-none focus:border-avalon-primary";
const label = "mb-1 block text-[11px] uppercase tracking-wide text-[#73747a]";

/**
 * What the traderoom's editorial panels show, written here.
 *
 * One editor for five panels, because they hold the same thing: a dated item
 * with a title, a body, a picture and somewhere to go. Which fields matter
 * varies — a webinar has a presenter and a time, a help article has neither —
 * so the form shows all of them and says what each panel reads.
 *
 * The traderoom caches these for a minute, which the banner says, so nobody
 * wonders why a correction has not appeared yet.
 */
export function ContentEditor({ items }: { items: AdminContent[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  function edit(item: AdminContent) {
    setEditing(item.id);
    setDraft(draftOf(item));
    setError(null);
  }

  function create() {
    setEditing("new");
    setDraft({ ...BLANK, kind: filter || "WEBINAR" });
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);

    const payload = {
      ...draft,
      locale: draft.locale || null,
      durationMins: draft.durationMins ? Number(draft.durationMins) : null,
      priority: Number(draft.priority) || 0,
    };

    const response = await fetch(
      editing === "new" ? "/api/admin/content" : `/api/admin/content/${editing}`,
      {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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
    const response = await fetch(`/api/admin/content/${id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError("could not delete");
      return;
    }
    if (editing === id) setEditing(null);
    router.refresh();
  }

  const shown = filter ? items.filter((item) => item.kind === filter) : items;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className={`${field} w-auto`}>
          <option value="">Every panel</option>
          {KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>{kind.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={create}
          className="rounded bg-avalon-primary px-3 py-1.5 text-[13px] font-medium text-white hover:bg-avalon-primary-hover"
        >
          Write a new item
        </button>

        <span className="ml-auto text-[12px] text-[#73747a]">
          The traderoom re-reads these about once a minute.
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
            <span className={label}>Panel</span>
            <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} className={field}>
              {KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
            </select>
          </div>

          <div>
            <span className={label}>Language</span>
            <select value={draft.locale} onChange={(e) => setDraft({ ...draft, locale: e.target.value })} className={field}>
              {LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <span className={label}>Title</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={field} />
          </div>

          <div className="sm:col-span-2">
            <span className={label}>Summary — the line under the title in a list</span>
            <input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className={field} />
          </div>

          <div className="sm:col-span-2">
            <span className={label}>Body — shown when the item is opened</span>
            <textarea rows={5} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={field} />
          </div>

          <div>
            <span className={label}>Picture URL</span>
            <input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} className={field} />
          </div>

          <div>
            <span className={label}>Link — where it opens</span>
            <input value={draft.linkUrl} onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })} className={field} />
          </div>

          <div>
            <span className={label}>Presenter or source</span>
            <input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} className={field} />
          </div>

          <div>
            <span className={label}>Minutes — webinars and tutorials</span>
            <input type="number" min={0} value={draft.durationMins} onChange={(e) => setDraft({ ...draft, durationMins: e.target.value })} className={field} />
          </div>

          <div>
            <span className={label}>Starts — a webinar&apos;s time, a news item&apos;s date</span>
            <input type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} className={field} />
          </div>

          <div>
            <span className={label}>Stops being shown — leave empty to never expire</span>
            <input type="datetime-local" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} className={field} />
          </div>

          <div>
            <span className={label}>Priority — higher sits nearer the top</span>
            <input type="number" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} className={field} />
          </div>

          <label className="flex items-end gap-2 text-[13px] text-[#a0a1a6]">
            <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
            Shown in the traderoom
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
            <th className="py-2 pr-3">Panel</th>
            <th className="py-2 pr-3">Title</th>
            <th className="py-2 pr-3">Language</th>
            <th className="py-2 pr-3">Starts</th>
            <th className="py-2 pr-3">Priority</th>
            <th className="py-2 pr-3">Shown</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {shown.map((item) => (
            <tr key={item.id} className="border-b border-white/5">
              <td className="py-2 pr-3 text-[#a0a1a6]">{KINDS.find((k) => k.value === item.kind)?.label ?? item.kind}</td>
              <td className="py-2 pr-3">{item.title}</td>
              <td className="py-2 pr-3 text-[#a0a1a6]">{item.locale ?? "all"}</td>
              <td className="py-2 pr-3 text-[#a0a1a6]">
                {item.startsAt ? new Date(item.startsAt).toLocaleString() : "—"}
              </td>
              <td className="py-2 pr-3 text-[#a0a1a6]">{item.priority}</td>
              <td className="py-2 pr-3">{item.enabled ? "yes" : "no"}</td>
              <td className="py-2 text-right">
                <button type="button" onClick={() => edit(item)} className="text-avalon-primary hover:underline">Edit</button>
                <button type="button" onClick={() => void remove(item.id)} disabled={busy} className="ml-3 text-avalon-danger hover:underline disabled:opacity-50">
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {shown.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-[#73747a]">
                Nothing written yet. The traderoom shows its empty state for this panel.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
