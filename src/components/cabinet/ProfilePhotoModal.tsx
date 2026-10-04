"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "./icons";

const RULES = [
  "sexually explicit or pornographic images",
  "images intended to incite ethnic or racial hatred or hostility",
  "photos of people under the age of 18",
  "third-party copyright-protected photos",
  "images larger than 5 MB and in a format other than JPG or PNG",
];

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
export function ProfilePhotoModal({ closeHref, hasPhoto }: { closeHref: string; hasPhoto: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    router.push(closeHref);
  }

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("That image is larger than 5 MB.");
      return;
    }
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Only JPG and PNG images are accepted.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("photo", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      const answer = await response.json();
      if (!response.ok) {
        setError(answer.errors?.photo?.[0] ?? answer.error ?? "The upload was refused.");
        return;
      }
      router.push(closeHref);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reach the server.");
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-6 py-[60px]">
      <div className="relative w-full max-w-[840px] bg-white px-6 pb-0 pt-[30px]">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-5 top-5 text-avalon-text transition-colors hover:text-avalon-text-strong"
        >
          <CloseIcon width={14} height={14} />
        </button>

        <h2 className="text-center text-[23px] font-semibold leading-[20px] text-avalon-text">Your profile photo</h2>

        <div className="mx-auto mt-10 max-w-[644px]">
          <p className="text-center text-[16px] font-medium text-avalon-text">It is not allowed to publish:</p>

          <ul className="mt-5 bg-[#fdeff1] px-5 py-5 text-[15px] leading-[23px] text-avalon-text">
            {RULES.map((rule) => (
              <li key={rule}>— {rule}</li>
            ))}
          </ul>

          <p className="mt-9 text-center text-[15px] leading-[23px] text-avalon-text">
            Your face must be clearly visible in the photo.
            <br />
            All photos and videos you upload must meet these requirements
            <br />
            or they may be removed.
          </p>

          {error && <p className="mt-6 text-center text-[14px] text-avalon-danger">{error}</p>}
        </div>

        <div className="-mx-6 mt-10 flex items-center justify-center gap-4 bg-avalon-surface-hover px-6 py-[16px]">
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
            {busy ? "Uploading…" : "Select a Photo"}
          </button>

          {hasPhoto && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="h-[41px] rounded-[2px] px-4 text-[15px] text-avalon-text transition-colors hover:text-avalon-danger disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
