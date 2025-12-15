import { formatTime } from "../../utils/formatTime";
import { Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface TimerProgressProps {
  timerMinutes: number;
  onTimeUp?: () => void;
  formId: string;
  submissionDone?: boolean;
  onStartTimer?: () => void;
}

export default function TimerProgress({
  timerMinutes,
  onTimeUp,
  formId,
  submissionDone = false,
  onStartTimer,
}: TimerProgressProps) {
  const TOTAL_TIME = timerMinutes * 60;
  const STORAGE_KEY = `exam-start-${formId}`;

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  // Use refs to avoid stale closures and infinite loops
  const onTimeUpRef = useRef(onTimeUp);
  const onStartTimerRef = useRef(onStartTimer);
  const hasInitialized = useRef(false);
  const submissionDoneRef = useRef(submissionDone);

  // Keep refs updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    onStartTimerRef.current = onStartTimer;
    submissionDoneRef.current = submissionDone;
  });

  // Reset when submission is done
  useEffect(() => {
    if (submissionDone) {
      localStorage.removeItem(STORAGE_KEY);
      setTimeLeft(TOTAL_TIME);
      hasInitialized.current = false;
    }
  }, [submissionDone, STORAGE_KEY, TOTAL_TIME]);

  // Initialize timer with localStorage
  useEffect(() => {
    if (submissionDone) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let startTime = localStorage.getItem(STORAGE_KEY);

    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(STORAGE_KEY, startTime);
      onStartTimerRef.current?.();
    }

    const elapsed = Math.floor((Date.now() - Number(startTime)) / 1000);
    const newTimeLeft = TOTAL_TIME - elapsed;

    setTimeLeft(newTimeLeft > 0 ? newTimeLeft : 0);

    if (newTimeLeft <= 0) {
      onTimeUpRef.current?.();
    }
  }, [submissionDone, TOTAL_TIME, STORAGE_KEY]);

  // Countdown
  useEffect(() => {
    if (submissionDone) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      if (submissionDoneRef.current) {
        clearInterval(interval);
        return;
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!submissionDoneRef.current) {
            onTimeUpRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submissionDone, timeLeft]);

  // Timer bar only - no start screen
  return (
    <div className="flex items-center gap-3 -mt-3 -mx-3">
      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            timeLeft <= 60 ? "bg-red-500" : timeLeft <= 300 ? "bg-yellow-500" : "bg-indigo-600"
          }`}
          style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}
        />
      </div>

      <div
        className={`flex items-center gap-1.5 font-semibold text-lg min-w-[90px] ${
          timeLeft <= 60 ? "text-red-600" : timeLeft <= 300 ? "text-yellow-600" : "text-gray-800"
        }`}
      >
        <Clock size={19} />
        <span>{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
}
