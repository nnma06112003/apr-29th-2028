"use client"; // Bắt buộc phải có dòng này trong Next.js App Router để dùng hook

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { spawnSakura } from "@/components/SakuraFalling";

export default function Home() {
  const start = new Date("2026-04-29T00:00:00Z").getTime();
  const end = new Date("2028-04-29T00:00:00Z").getTime();
  const totalDuration = end - start;

  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Hàm cập nhật tiến độ và thời gian còn lại
    const updateStats = () => {
      const now = new Date().getTime();

      // 1. Tính % tiến độ
      let p = 0;
      if (now >= end) {
        p = 100;
      } else if (now <= start) {
        p = 0;
      } else {
        const elapsedDuration = now - start;
        p = (elapsedDuration / totalDuration) * 100;
      }
      setProgress(p);

      // 2. Tính thời gian còn lại (dd:hh:mm:ss)
      const remaining = Math.max(0, end - now);
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);
      const seconds = Math.floor((remaining / 1000) % 60);

      const formatted = `${days}d ${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      setTimeLeft(formatted);
    };

    // Chạy ngay lần đầu tiên nhưng không đồng bộ (bằng setTimeout 0)
    // để tránh lỗi cascading renders trong React.
    const initialTimeout = setTimeout(() => {
      updateStats();
    }, 0);

    // Thiết lập interval để cập nhật lại mỗi 1 giây (1000ms)
    const interval = setInterval(() => {
      updateStats();
    }, 1000);

    // Dọn dẹp để tránh rò rỉ bộ nhớ (memory leak)
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [start, end, totalDuration]);

  const handleProgressTap = (e: React.PointerEvent<HTMLDivElement>) => {
    spawnSakura({ x: e.clientX, y: e.clientY });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      spawnSakura();
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black transition-colors duration-300">
      <ThemeToggle />
      <div className="w-1/2 space-y-4">
        <div className="space-y-2">
          <div
            role="button"
            tabIndex={0}
            aria-label="Progress bar - tap to spawn sakura flowers"
            title="Tap to spawn sakura 🌸"
            onPointerDown={handleProgressTap}
            onKeyDown={handleKeyDown}
            className="group cursor-pointer select-none py-2 -my-2 transition-transform active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-pink-300 rounded-full"
          >
            <Progress value={progress} />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 font-mono select-none">
            <span>{progress.toFixed(6)}%</span>
            <span>{timeLeft}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
