import { useEffect, useRef } from "react";
import type SignaturePad from "signature_pad";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignatureCapture({ onFile }: { onFile: (file: File | undefined) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<SignaturePad | null>(null);
  const callback = useRef(onFile);
  callback.current = onFile;

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    void import("signature_pad").then(({ default: Pad }) => {
      const element = canvas.current;
      if (cancelled || !element) return;
      const styles = getComputedStyle(element);
      const instance = new Pad(element, { penColor: styles.color, backgroundColor: styles.backgroundColor });
      pad.current = instance;
      const resize = () => {
        const strokes = instance.toData();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        element.width = element.offsetWidth * ratio;
        element.height = element.offsetHeight * ratio;
        element.getContext("2d")?.scale(ratio, ratio);
        instance.clear();
        instance.fromData(strokes);
      };
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(element);
      instance.addEventListener("endStroke", () => {
        if (instance.isEmpty()) return;
        const encoded = instance.toDataURL("image/png").split(",")[1];
        if (!encoded) return;
        const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
        callback.current(new File([bytes], "assinatura-saida.png", { type: "image/png" }));
      });
    });
    return () => { cancelled = true; observer?.disconnect(); pad.current?.off(); pad.current = null; };
  }, []);

  return <div className="space-y-2">
    <canvas ref={canvas} aria-label="Assinatura do visitante" className="h-56 w-full touch-none rounded-md border border-border bg-background text-foreground" />
    <Button type="button" variant="outline" className="min-h-11" onClick={() => { pad.current?.clear(); onFile(undefined); }}>
      <Eraser className="size-4" /> Limpar assinatura
    </Button>
  </div>;
}