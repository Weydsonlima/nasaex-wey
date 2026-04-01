"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AchievementData {
  type: "level_up" | "achievement";
  title: string;          // e.g. "Nível desbloqueado!"
  message: string;        // e.g. "Você chegou a Marte 🔴"
  badgeNumber?: number;   // 1-24 for level-up
  badgeUrl?: string;      // custom S3 URL if configured
  planetEmoji?: string;
}

interface AchievementPopupProps {
  data: AchievementData | null;
  onDismiss: () => void;
}

// Confetti particle
function Particle({ delay, color }: { delay: number; color: string }) {
  const style = {
    "--delay": `${delay}s`,
    "--color": color,
    left: `${Math.random() * 100}%`,
    animationDelay: `${delay}s`,
  } as React.CSSProperties;

  return (
    <div
      className="absolute top-0 w-1.5 h-1.5 rounded-full animate-[confetti-fall_1.8s_ease-in_forwards]"
      style={{ ...style, background: color }}
    />
  );
}

const CONFETTI_COLORS = ["#7a1fe7", "#a855f7", "#ec4899", "#fbbf24", "#34d399", "#60a5fa"];

export function AchievementPopup({ data, onDismiss }: AchievementPopupProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!data) {
      setVisible(false);
      setExiting(false);
      return;
    }

    setVisible(true);
    setExiting(false);

    // Play chime sound via Web Audio API (no external file needed)
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.35);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } catch { /* silently skip if audio not available */ }

    // Auto-dismiss after 5s
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 400);
  };

  if (!data || !visible) return null;

  const particles = Array.from({ length: 24 }, (_, i) => ({
    delay: i * 0.06,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  const content = (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
        }
        @keyframes popup-in {
          0%   { transform: scale(0.6) translateY(40px); opacity: 0; }
          70%  { transform: scale(1.05) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes popup-out {
          0%   { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.85) translateY(20px); opacity: 0; }
        }
        @keyframes astro-float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50%  { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(122,31,231,0.4), 0 0 60px rgba(122,31,231,0.15); }
          50%  { box-shadow: 0 0 40px rgba(122,31,231,0.7), 0 0 80px rgba(122,31,231,0.3); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-auto"
        style={{ zIndex: 10001 }}
        onClick={handleDismiss}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Card */}
        <div
          className={cn(
            "relative z-10 w-80 flex flex-col items-center rounded-3xl border border-[#7a1fe7]/50 overflow-hidden pointer-events-auto",
            "bg-gradient-to-b from-[#1a0a3d] via-[#0d0720] to-[#050510]",
            exiting ? "animate-[popup-out_0.4s_ease-in_forwards]" : "animate-[popup-in_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
          )}
          style={{ animation: exiting
            ? "popup-out 0.4s ease-in forwards"
            : "popup-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
            boxShadow: "0 0 40px rgba(122,31,231,0.5), 0 0 80px rgba(122,31,231,0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confetti */}
          <div className="absolute inset-x-0 top-0 h-48 overflow-hidden pointer-events-none">
            {particles.map((p, i) => (
              <Particle key={i} delay={p.delay} color={p.color} />
            ))}
          </div>

          {/* Stars decorative bg */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: 1, height: 1,
                  left:  `${((i * 1_234_567) % 9_973) / 9_973 * 100}%`,
                  top:   `${((i * 7_654_321) % 9_973) / 9_973 * 100}%`,
                  opacity: 0.2 + (i % 5) * 0.08,
                }}
              />
            ))}
          </div>

          {/* Astro mascot */}
          <div
            className="relative z-10 mt-6 mb-1"
            style={{ animation: "astro-float 3s ease-in-out infinite" }}
          >
            <Image
              src="/icon-astro.svg"
              alt="Astro"
              width={80}
              height={80}
              className="drop-shadow-[0_0_16px_rgba(122,31,231,0.8)]"
            />
          </div>

          {/* Badge (for level-up) */}
          {data.badgeNumber && (
            <div className="relative z-10 -mt-4 mb-1">
              <div className="relative w-20 h-20">
                <Image
                  src={data.badgeUrl ?? `/space-point/badges/${data.badgeNumber}.svg`}
                  alt="Badge"
                  fill
                  className="object-contain drop-shadow-[0_0_20px_rgba(122,31,231,0.9)]"
                />
              </div>
            </div>
          )}

          {/* Text */}
          <div className="relative z-10 text-center px-6 pb-6 pt-2">
            <p className="text-xs font-semibold text-[#a78bfa] uppercase tracking-widest mb-1">
              {data.type === "level_up" ? "🎉 Novo nível!" : "🏅 Conquista!"}
            </p>
            <p className="text-xl font-extrabold text-white leading-tight mb-2">
              {data.title}
            </p>
            <p className="text-sm text-[#c4b5fd] leading-relaxed">
              {data.message}
            </p>

            {/* CTA */}
            <button
              onClick={handleDismiss}
              className="mt-4 w-full bg-gradient-to-r from-[#7a1fe7] to-[#a855f7] text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Incrível! 🚀
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
