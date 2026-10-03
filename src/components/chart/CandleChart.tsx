"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Candle } from "@/lib/avalon/types";
import { CandleChartEngine } from "./engine";
import type { ChartTheme } from "./theme";

interface CandleChartProps {
  candles: readonly Candle[];
  /** Price decimals. */
  precision?: number;
  watermark?: string;
  theme?: Partial<ChartTheme>;
  /** Fired when panning nears the left edge of the loaded history. */
  onNeedOlder?: () => void;
  className?: string;
}

/**
 * Live candle chart on a single canvas.
 *
 * Drag to pan, wheel to zoom, move to place the crosshair. While the viewport
 * is pinned to the right edge new candles scroll in by themselves; pan away and
 * the view holds its place until "Go live" snaps it back.
 */
export function CandleChart({
  candles,
  precision = 2,
  watermark,
  theme,
  onNeedOlder,
  className,
}: CandleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CandleChartEngine | null>(null);
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null);
  const [atLive, setAtLive] = useState(true);

  // Latest callback without re-creating the engine on every parent render.
  const needOlderRef = useRef(onNeedOlder);
  needOlderRef.current = onNeedOlder;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const engine = new CandleChartEngine(canvas, {
      theme,
      precision,
      watermark,
      onNeedOlder: () => needOlderRef.current?.(),
    });
    engineRef.current = engine;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      engine.resize(width, height);
    });
    observer.observe(container);
    engine.resize(container.clientWidth, container.clientHeight);

    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // The engine is configured once; later prop changes go through the setters
    // below so a theme tweak never discards the viewport.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setCandles(candles);
  }, [candles]);

  useEffect(() => {
    engineRef.current?.setPrecision(precision);
  }, [precision]);

  useEffect(() => {
    engineRef.current?.setWatermark(watermark ?? "");
  }, [watermark]);

  // Non-passive so the page does not scroll while zooming the chart.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      if (event.shiftKey) {
        engine.pan(event.deltaY);
      } else {
        engine.zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1);
      }
      setAtLive(engine.isAtLive());
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const localPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  return (
    <div className={cn("relative size-full overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className={cn("block touch-none", dragRef.current ? "cursor-grabbing" : "cursor-crosshair")}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { x: event.clientX, moved: false };
        }}
        onPointerMove={(event) => {
          const engine = engineRef.current;
          if (!engine) return;
          const drag = dragRef.current;
          if (drag) {
            const delta = event.clientX - drag.x;
            if (delta !== 0) {
              drag.x = event.clientX;
              drag.moved = true;
              engine.pan(delta);
              setAtLive(engine.isAtLive());
            }
          }
          const { x, y } = localPoint(event);
          engine.setCrosshair(x, y, true);
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          dragRef.current = null;
        }}
        onPointerLeave={() => {
          dragRef.current = null;
          engineRef.current?.setCrosshair(0, 0, false);
        }}
      />

      {atLive ? null : (
        <button
          type="button"
          onClick={() => {
            engineRef.current?.scrollToLive();
            setAtLive(true);
          }}
          className="absolute bottom-[34px] right-[84px] rounded-full bg-[#1e1f21] px-[10px] py-[5px] text-[11px] text-white hover:bg-[#282a2c]"
        >
          Go live
        </button>
      )}
    </div>
  );
}
