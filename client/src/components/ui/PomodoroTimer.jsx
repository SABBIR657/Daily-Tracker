import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Coffee,
  BookOpen,
  Timer,
} from "lucide-react";

const MODES = {
  focus: {
    label: "Focus",
    duration: 25 * 60,
    color: "text-primary-500",
    bg: "bg-primary-500",
  },
  shortBreak: {
    label: "Short Break",
    duration: 5 * 60,
    color: "text-emerald-500",
    bg: "bg-emerald-500",
  },
  longBreak: {
    label: "Long Break",
    duration: 15 * 60,
    color: "text-amber-500",
    bg: "bg-amber-500",
  },
};

export default function PomodoroTimer({ onSessionComplete, onClose }) {
  const [mode, setMode] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0); // completed focus sessions
  const [customMins, setCustomMins] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // Update page title with timer
  useEffect(() => {
    document.title = isRunning
      ? // eslint-disable-next-line react-hooks/immutability
        `${formatTime(timeLeft)} — ${MODES[mode].label} · Daily Tracker`
      : "Daily Tracker";
    return () => {
      document.title = "Daily Tracker";
    };
  }, [timeLeft, isRunning, mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            // eslint-disable-next-line react-hooks/immutability
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode]);

  const handleSessionEnd = () => {
    setIsRunning(false);
    playSound();

    if (mode === "focus") {
      const minutesCompleted = Math.round(MODES.focus.duration / 60);
      setSessions((s) => s + 1);
      // Auto-fill study log
      onSessionComplete(minutesCompleted);

      // Auto switch to break
      const newSessions = sessions + 1;
      if (newSessions % 4 === 0) {
        switchMode("longBreak");
      } else {
        switchMode("shortBreak");
      }
    } else {
      switchMode("focus");
    }
  };

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].duration);
  };

  const applyCustomTime = () => {
    const mins = parseInt(customMins);
    if (mins > 0 && mins <= 120) {
      setTimeLeft(mins * 60);
      setIsRunning(false);
      setShowCustom(false);
      setCustomMins("");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const totalDuration = MODES[mode].duration;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const currentMode = MODES[mode];
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="card border-primary-200 dark:border-primary-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-primary-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Pomodoro Timer
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              mode === key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-36 h-36">
          <svg className="-rotate-90 w-36 h-36">
            {/* Track */}
            <circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-100 dark:text-gray-800"
            />
            {/* Progress */}
            <circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              stroke={
                mode === "focus"
                  ? "#6366f1"
                  : mode === "shortBreak"
                    ? "#10b981"
                    : "#f59e0b"
              }
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={
                circumference - (progress / 100) * circumference
              }
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          {/* Time text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${currentMode.color}`}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
              {currentMode.label}
            </span>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i <= sessions % 4
                  ? "bg-primary-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
            {sessions} done
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={() => setIsRunning((v) => !v)}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-white transition-colors ${
            mode === "focus"
              ? "bg-primary-500 hover:bg-primary-600"
              : mode === "shortBreak"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-amber-500 hover:bg-amber-600"
          }`}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? "Pause" : "Start"}
        </button>

        <button
          onClick={() => setShowCustom((v) => !v)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Custom duration"
        >
          <Timer size={18} />
        </button>
      </div>

      {/* Custom time input */}
      {showCustom && (
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={customMins}
            onChange={(e) => setCustomMins(e.target.value)}
            placeholder="Minutes (1-120)"
            className="input text-sm flex-1"
            min={1}
            max={120}
          />
          <button
            onClick={applyCustomTime}
            className="btn-primary text-sm px-3"
          >
            Set
          </button>
        </div>
      )}

      {/* Info */}
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
        <BookOpen size={12} />
        <span>
          {mode === "focus"
            ? "Focus session — log auto-fills when complete"
            : mode === "shortBreak"
              ? "Short break — stretch and rest your eyes"
              : "Long break — you earned it! Take 15 minutes"}
        </span>
      </div>
    </div>
  );
}
