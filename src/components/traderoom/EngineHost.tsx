"use client";

import { useEffect, useRef } from "react";
import { bootEngine, type EngineHostOptions } from "@/lib/engine/host";

type Props = Omit<EngineHostOptions, "statusElement">;

/**
 * The traderoom: the engine, filling the viewport.
 *
 * The engine draws into a canvas it creates itself and owns the whole window,
 * so this renders nothing but the overlay. It boots from an effect rather than
 * from a script tag because the order matters — the shims have to be installed
 * before the engine's own script is appended, and appending it ourselves is the
 * only way to be sure of that.
 *
 * `bootEngine` refuses a second call. Strict Mode runs effects twice in
 * development, and a 103 MB WASM module booting twice would fight itself for
 * the canvas.
 */
export function EngineHost(props: Props) {
  const overlay = useRef<HTMLPreElement>(null);

  useEffect(() => {
    bootEngine({ ...props, statusElement: overlay.current });
    // Boots once for the life of the page; the props are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // The overlay covers a corner of the traderoom, so it starts hidden and the
    // backquote key toggles it.
    function onKey(event: KeyboardEvent) {
      if (event.key !== "`" && event.key !== "~") return;
      const element = overlay.current;
      if (element) element.style.display = element.style.display === "block" ? "none" : "block";
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <pre
      ref={overlay}
      id="host-status"
      title="press ` to hide"
      className="fixed bottom-3 left-3 z-[9999] m-0 hidden max-h-[42vh] max-w-[64ch] overflow-auto whitespace-pre-wrap rounded-md bg-black/80 px-2.5 py-2 font-mono text-[11px]/[1.5] text-[#8b8c8e]"
    >
      booting…
    </pre>
  );
}
