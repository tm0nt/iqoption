"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { DOCUMENT_TYPES, type CountryRule } from "@/lib/kyc/rules-types";
import { TableShell, buttonClass, hintClass, inputClass, td, th } from "./ui";

/**
 * The accepted-documents matrix: a row per country, a tick per document.
 *
 * Saved whole, like every other settings editor here, and checked before it
 * is sent so the usual mistakes — a country with nothing ticked, a code typed
 * twice — are said beside the table rather than coming back as a 400.
 */
export function KycRulesEditor({
  initial,
  names,
  locale,
}: {
  initial: CountryRule[];
  /** Country names in the admin's language, by code. */
  names: Record<string, string>;
  locale: string;
}) {
  const t = adminMoneyCopy(locale).kyc;
  const failed = adminMoneyCopy(locale).common.actionFailed;
  const router = useRouter();
  const [rows, setRows] = useState<CountryRule[]>(initial);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, start] = useTransition();

  const display = (value: string) => {
    if (names[value]) return names[value];
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(value) ?? value;
    } catch {
      return value;
    }
  };

  function toggle(index: number, doc: CountryRule["documents"][number]) {
    setMessage(null);
    setRows((current) =>
      current.map((row, i) =>
        i !== index
          ? row
          : {
              ...row,
              documents: row.documents.includes(doc)
                ? row.documents.filter((value) => value !== doc)
                : DOCUMENT_TYPES.filter((value) => value === doc || row.documents.includes(value)),
            },
      ),
    );
  }

  function add() {
    const value = code.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(value)) return setMessage({ tone: "error", text: t.unknownCountry });
    if (rows.some((row) => row.code === value)) return setMessage({ tone: "error", text: t.duplicate });
    setRows((current) => [...current, { code: value, documents: ["ID_CARD", "PASSPORT"] }]);
    setCode("");
    setMessage(null);
  }

  function save() {
    const empty = rows.find((row) => row.documents.length === 0);
    if (empty) return setMessage({ tone: "error", text: t.needOneDocument(display(empty.code)) });
    setMessage(null);
    start(async () => {
      const response = await fetch("/api/admin/kyc/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ countries: rows }),
      }).catch(() => null);
      const said = await response?.json().catch(() => null);
      if (!response?.ok) {
        setMessage({ tone: "error", text: said?.error ?? failed });
        return;
      }
      setMessage({ tone: "ok", text: t.saved });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <TableShell>
        <thead>
          <tr>
            <th className={th}>{t.country}</th>
            {DOCUMENT_TYPES.map((doc) => (
              <th key={doc} className={`${th} text-center`}>
                {t.docTypes[doc]}
              </th>
            ))}
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.code}>
              <td className={td}>
                <span className="font-medium text-white">{display(row.code)}</span>
                <span className="ml-2 text-[11px] text-[#6f7076]">{row.code}</span>
              </td>
              {DOCUMENT_TYPES.map((doc) => (
                <td key={doc} className={`${td} text-center`}>
                  <input
                    type="checkbox"
                    checked={row.documents.includes(doc)}
                    onChange={() => toggle(index, doc)}
                    aria-label={`${display(row.code)} · ${t.docTypes[doc]}`}
                    className="size-4 cursor-pointer accent-[var(--accent)]"
                  />
                </td>
              ))}
              <td className={`${td} text-right`}>
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                  className={buttonClass("ghost", "sm")}
                >
                  {t.remove}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <p className={hintClass}>{t.noBack}</p>

      <div className="flex flex-wrap items-end gap-2">
        <label>
          <span className="sr-only">{t.addCountry}</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
            maxLength={2}
            placeholder={t.addCountryHint}
            className={`${inputClass} w-[200px] uppercase placeholder:normal-case`}
          />
        </label>
        <button type="button" onClick={add} className={buttonClass("secondary")}>
          {t.addCountry}
        </button>
        <button type="button" onClick={save} disabled={busy} className={`${buttonClass("primary")} ml-auto`}>
          {busy ? adminMoneyCopy(locale).common.saving : t.save}
        </button>
      </div>
      {message && (
        <p className={`text-[13px] ${message.tone === "ok" ? "text-emerald-300" : "text-[#ff8a99]"}`}>{message.text}</p>
      )}
    </div>
  );
}
