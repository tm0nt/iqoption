"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminAsset = {
  id: number;
  ticker: string;
  name: string;
  kind: string;
  groupId: number;
  source: "BINANCE" | "SIMULATED";
  sourceSymbol: string | null;
  precision: number;
  profit: number;
  priority: number;
  enabled: boolean;
  group: { name: string } | null;
};

export type AdminGroup = { id: number; name: string };

/**
 * The columns worth changing from a screen. Everything else the API accepts —
 * spreads, expiries, trading hours — is there and not here, because a table
 * with thirty columns is not a table anyone reads.
 */
type Editable = "name" | "kind" | "groupId" | "source" | "sourceSymbol" | "precision" | "profit" | "priority";

type Draft = Partial<Record<Editable, string>>;

/**
 * The instrument catalogue, editable in place.
 *
 * Changes go to `/api/admin/assets`, which validates them — the rules there are
 * about what the wire requires, and duplicating them here would mean two
 * answers to the same question. This shows what the server says.
 *
 * Nothing saved here reaches the running feed until the catalogue is reloaded;
 * the banner says so rather than letting someone wonder why the traderoom has
 * not changed.
 */
export function AssetTable({ assets, groups }: { assets: AdminAsset[]; groups: AdminGroup[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function startEditing(asset: AdminAsset) {
    setEditing(asset.id);
    setError(null);
    setDraft({
      name: asset.name,
      kind: asset.kind,
      groupId: String(asset.groupId),
      source: asset.source,
      sourceSymbol: asset.sourceSymbol ?? "",
      precision: String(asset.precision),
      profit: String(asset.profit),
      priority: String(asset.priority),
    });
  }

  async function send(id: number, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/assets/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const answer = await response.json();
      if (!response.ok) {
        setError(answer.error ?? "The change was refused.");
        return false;
      }
      setDirty(true);
      router.refresh();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reach the server.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(id: number) {
    const body: Record<string, unknown> = {
      name: draft.name,
      kind: draft.kind,
      groupId: Number(draft.groupId),
      source: draft.source,
      precision: Number(draft.precision),
      profit: Number(draft.profit),
      priority: Number(draft.priority),
    };
    // An empty symbol is "none", which only makes sense without a feed.
    if (draft.source === "BINANCE") body.sourceSymbol = (draft.sourceSymbol ?? "").trim().toUpperCase();

    if (await send(id, body)) setEditing(null);
  }

  return (
    <div className="space-y-4">
      {dirty && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">
          Saved. The running feed still has the old catalogue — reload it from the{" "}
          <a href="../admin" className="underline">
            overview
          </a>{" "}
          for this to reach the traderoom.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-avalon-danger/30 bg-avalon-danger/10 px-4 py-3 text-[13px] text-avalon-danger">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="bg-[#1b1c21] text-[12px] uppercase tracking-wide text-[#a0a1a6]">
            <tr>
              {["Id", "Ticker", "Name", "Group", "Source", "Precision", "Payout", "Priority", ""].map((head) => (
                <th key={head} className="px-4 py-3 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {assets.map((asset) => {
              const isEditing = editing === asset.id;
              return (
                <tr key={asset.id} className={asset.enabled ? "bg-[#15161a]" : "bg-[#15161a] text-[#6f7076]"}>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{asset.id}</td>
                  <td className="px-4 py-2.5 font-medium">{asset.ticker}</td>

                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <Input value={draft.name ?? ""} onChange={(v) => setDraft({ ...draft, name: v })} />
                    ) : (
                      asset.name
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <Select
                        value={draft.groupId ?? ""}
                        onChange={(v) => setDraft({ ...draft, groupId: v })}
                        options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
                      />
                    ) : (
                      (asset.group?.name ?? asset.groupId)
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <Select
                          value={draft.source ?? ""}
                          onChange={(v) => setDraft({ ...draft, source: v })}
                          options={[
                            { value: "BINANCE", label: "Binance" },
                            { value: "SIMULATED", label: "Synthetic" },
                          ]}
                        />
                        {draft.source === "BINANCE" && (
                          <Input
                            value={draft.sourceSymbol ?? ""}
                            onChange={(v) => setDraft({ ...draft, sourceSymbol: v })}
                            placeholder="BTCUSDT"
                            className="w-28"
                          />
                        )}
                      </div>
                    ) : asset.source === "BINANCE" ? (
                      <span>
                        Binance <span className="font-mono text-[12px] text-[#a0a1a6]">{asset.sourceSymbol}</span>
                      </span>
                    ) : (
                      <span className="text-[#a0a1a6]">Synthetic</span>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <Input
                        value={draft.precision ?? ""}
                        onChange={(v) => setDraft({ ...draft, precision: v })}
                        className="w-16"
                      />
                    ) : (
                      asset.precision
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <Input
                        value={draft.profit ?? ""}
                        onChange={(v) => setDraft({ ...draft, profit: v })}
                        className="w-16"
                      />
                    ) : (
                      `${asset.profit}%`
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {isEditing ? (
                      <Input
                        value={draft.priority ?? ""}
                        onChange={(v) => setDraft({ ...draft, priority: v })}
                        className="w-16"
                      />
                    ) : (
                      asset.priority
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => save(asset.id)}
                            disabled={busy}
                            className="rounded bg-avalon-primary px-3 py-1 text-[12px] font-medium text-white hover:bg-avalon-primary-hover disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="rounded px-3 py-1 text-[12px] text-[#a0a1a6] hover:text-white"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(asset)}
                            className="rounded px-3 py-1 text-[12px] text-[#a0a1a6] hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => send(asset.id, { enabled: !asset.enabled })}
                            disabled={busy}
                            className="rounded px-3 py-1 text-[12px] text-[#a0a1a6] hover:text-white disabled:opacity-50"
                          >
                            {asset.enabled ? "Disable" : "Enable"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] leading-relaxed text-[#6f7076]">
        Disabling takes an instrument off the platform without losing it, and is the
        one to reach for. The id is <code className="font-mono">active_id</code> on
        the wire and cannot change once deals reference it.
      </p>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`rounded border border-white/15 bg-[#0f1013] px-2 py-1 text-[13px] text-white outline-none focus:border-avalon-primary ${className}`}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded border border-white/15 bg-[#0f1013] px-2 py-1 text-[13px] text-white outline-none focus:border-avalon-primary"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
