"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { CloseIcon } from "./icons";

/**
 * The profile photo dialog.
 *
 * Opened by `?act=changephoto`, which is how the live site opens it — so the
 * state lives in the URL and the "Upload a photo" button is an ordinary link.
 * That also makes it survive a reload and a shared address.
 *
 * The size and format are checked here as well as on the server. Not instead:
 * this check exists so a 40 MB photo is refused before it is uploaded, and the
 * server's exists because this one is a courtesy a client can skip.
 */
export function ProfilePhotoModal({ closeHref, hasPhoto, locale }: { closeHref: string; hasPhoto: boolean; locale: string }) {
  const t = cabinetExtra(locale).profile;
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    router.push(closeHref);
  }

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError(t.tooLarge);
      return;
    }
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError(t.wrongType);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("photo", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      if (!response.ok) {
        // The server's reasons are the same three checks, already worded here.
        setError(response.status === 413 ? t.tooLarge : response.status === 415 ? t.wrongType : t.uploadRefused);
        return;
      }
      router.push(closeHref);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.unreachable);
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    await fetch("/api/profile/avatar", { method: "DELETE" }).catch(() => {});
    setBusy(false);
    router.push(closeHref);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-6 sm:px-6 sm:py-[60px]">
      <div role="dialog" aria-modal="true" aria-label={t.photoTitle} className="relative w-full max-w-[840px] bg-white px-5 pb-0 pt-[30px] sm:px-6">
        <button
          type="button"
          onClick={close}
          aria-label={t.cancel}
          className="absolute right-5 top-5 text-avalon-text transition-colors hover:text-avalon-text-strong"
        >
          <CloseIcon width={14} height={14} />
        </button>

        <h2 className="px-6 text-center text-[20px] font-semibold leading-[26px] text-avalon-text sm:text-[23px]">{t.photoTitle}</h2>

        <div className="mx-auto mt-10 max-w-[644px]">
          <p className="text-center text-[16px] font-medium text-avalon-text">{t.notAllowed}</p>

          <ul className="mt-5 bg-[#fdeff1] px-5 py-5 text-[15px] leading-[23px] text-avalon-text">
            {t.rules.map((rule) => (
              <li key={rule}>— {rule}</li>
            ))}
          </ul>

          <p className="mx-auto mt-9 max-w-[480px] text-center text-[15px] leading-[23px] text-avalon-text">{t.faceVisible}</p>

          {error && <p className="mt-6 text-center text-[14px] text-avalon-danger">{error}</p>}
        </div>

        <div className="-mx-5 mt-10 flex items-center justify-center gap-4 bg-avalon-surface-hover px-6 py-[16px] sm:-mx-6">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="h-[41px] rounded-[2px] bg-avalon-primary px-6 text-[15px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60"
          >
            {busy ? t.uploading : t.selectPhoto}
          </button>

          {hasPhoto && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="h-[41px] rounded-[2px] px-4 text-[15px] text-avalon-text transition-colors hover:text-avalon-danger disabled:opacity-60"
            >
              {t.removePhoto}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
