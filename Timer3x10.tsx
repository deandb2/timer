import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Simple, self-contained interval timer: default 3 minutes repeated 10 times.
// Features: start/pause/reset, editable duration & rounds, progress bar,
// sound + vibration at each turn, big readable display.

function beep(duration = 300, frequency = 880, volume = 0.2) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = frequency;
    g.gain.value = volume;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, duration);
  } catch (e) {
    // ignore if AudioContext not available or user blocked autoplay
  }
}

export default function Timer3x10() {
  const [minutes, setMinutes] = useState(3);
  const [rounds, setRounds] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [currentRound, setCurrentRound] = useState(1);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const intervalRef = useRef<number | null>(null);

  // keep seconds in sync when minutes slider changes and timer not running
  useEffect(() => {
    if (!running && !finished) {
      setSecondsLeft(minutes * 60);
    }
  }, [minutes]);

  useEffect(() => {
    document.title = running
      ? `⏱️ ${formatTime(secondsLeft)} • Round ${currentRound}/${rounds}`
      : "Timer 3×10";
  }, [running, secondsLeft, currentRound, rounds]);

  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        running ? pause() : start();
      }
    };
    window.addEventListener("keydown", onSpace);
    return () => window.removeEventListener("keydown", onSpace);
  }, [running]);

  const tick = () => {
    setSecondsLeft((s) => {
      if (s > 1) return s - 1;
      // End of a round
      navigator.vibrate?.(150);
      beep();
      if (currentRound < rounds) {
        // next round
        setCurrentRound((r) => r + 1);
        return minutes * 60; // reset seconds for next round
      } else {
        // finished all rounds
        clearTimer();
        setFinished(true);
        navigator.vibrate?.([150, 100, 150]);
        beep(500, 660);
        return 0;
      }
    });
  };

  const start = () => {
    if (finished) return; // don't start if finished; user can reset
    if (intervalRef.current !== null) return; // already running
    setRunning(true);
    intervalRef.current = window.setInterval(tick, 1000);
  };

  const pause = () => {
    clearTimer();
    setRunning(false);
  };

  const reset = () => {
    clearTimer();
    setRunning(false);
    setFinished(false);
    setCurrentRound(1);
    setSecondsLeft(minutes * 60);
  };

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const totalSeconds = minutes * 60;
  const progress = finished ? 1 : 1 - secondsLeft / totalSeconds;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Timer 3 minuti × 10</h1>
          <p className="text-slate-300 mt-1">Intervallo predefinito: 3:00 per 10 ripetizioni</p>
        </div>

        {/* Display Card */}
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl shadow-lg p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm uppercase tracking-wide text-slate-400">Round</span>
            <span className="text-lg font-semibold">{currentRound}/{rounds}</span>
          </div>

          <div className="flex flex-col items-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={secondsLeft}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-7xl font-mono tabular-nums"
              >
                {formatTime(secondsLeft)}
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="w-full mt-6 h-3 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={running ? pause : start}
            className={`px-4 py-3 rounded-2xl shadow font-semibold border transition active:scale-[.98] ${
              running
                ? "bg-amber-500/10 border-amber-400 text-amber-200 hover:bg-amber-500/20"
                : "bg-emerald-500/10 border-emerald-400 text-emerald-200 hover:bg-emerald-500/20"
            }`}
          >
            {running ? "Pausa (Spazio)" : "Avvia (Spazio)"}
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-2xl shadow font-semibold border bg-slate-700/40 border-slate-600 hover:bg-slate-700/60 transition active:scale-[.98]"
          >
            Reset
          </button>
          <button
            onClick={() => {
              if (!running) {
                setFinished(false);
                setCurrentRound(1);
                setSecondsLeft(minutes * 60);
              }
            }}
            className="px-4 py-3 rounded-2xl shadow font-semibold border bg-slate-700/40 border-slate-600 hover:bg-slate-700/60 transition active:scale-[.98] disabled:opacity-50"
            disabled={running}
            title={running ? "Ferma il timer per modificare" : "Modifica impostazioni"}
          >
            Pronto
          </button>
        </div>

        {/* Settings */}
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl shadow-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Impostazioni (facoltative)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Minuti per round</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value))}
                  className="w-full"
                  disabled={running}
                />
                <span className="w-12 text-center font-mono">{minutes}:00</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Numero di round</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                  className="w-full"
                  disabled={running}
                />
                <span className="w-12 text-center font-mono">{rounds}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">Suggerimenti: premi Spazio per avviare/mettere in pausa. Lascia lo schermo attivo per l'audio. Il timer vibra su dispositivi che lo supportano.</p>
        </div>
      </div>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}