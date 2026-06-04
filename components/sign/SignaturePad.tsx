"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
};

export default function SignaturePad({ onChange, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function pos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    if (disabled) return;
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    const p = pos(e);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const p = pos(e);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
    setEmpty(false);
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas || empty) {
      onChange(null);
      return;
    }
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={clear}
        className="text-xs font-semibold text-slate-500 underline hover:text-slate-800"
      >
        Borrar firma
      </button>
    </div>
  );
}
