"use client";

import React, { useEffect, useRef } from "react";

export interface SakuraSpawnDetail {
  x?: number;
  y?: number;
  count?: number;
}

export const SAKURA_SPAWN_EVENT = "sakura:spawn";

/**
 * Triggers falling sakura flowers to spawn.
 * Call this function on user interaction (e.g., tapping the progress bar).
 */
export const spawnSakura = (options?: SakuraSpawnDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SakuraSpawnDetail>(SAKURA_SPAWN_EVENT, {
      detail: options,
    })
  );
};

export interface SakuraFallingProps {
  petalCount?: number;
  maxPetals?: number;
}

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  targetSpeedY: number;
  speedX: number;
  swayAngle: number;
  swaySpeed: number;
  swayRadius: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  color: string;
}

const SAKURA_PALETTE = [
  "rgba(255, 183, 197, 0.85)",
  "rgba(255, 197, 208, 0.80)",
  "rgba(255, 218, 224, 0.75)",
  "rgba(244, 166, 183, 0.85)",
];

const createPetal = (
  width: number,
  height: number,
  initialPlacement = false,
  originX?: number,
  originY?: number
): Petal => {
  const size = 10 + Math.random() * 6; // 10–16px
  const targetSpeedY = 1.0 + Math.random() * 1.5;

  let x: number;
  let y: number;
  let speedY: number;
  let speedX: number;

  if (originX !== undefined && originY !== undefined) {
    // Burst upwards from the tap position
    x = originX + (Math.random() - 0.5) * 40;
    y = originY + (Math.random() - 0.5) * 16;
    speedY = -(1.2 + Math.random() * 2.2);
    speedX = (Math.random() - 0.5) * 2.5 + 0.6;
  } else {
    // Fall down from top of the screen
    x = initialPlacement ? Math.random() * width : Math.random() * (width + 40) - 20;
    y = initialPlacement ? Math.random() * height : -20 - Math.random() * 20;
    speedY = targetSpeedY;
    speedX = 0.8 + Math.random() * 1.2;
  }

  return {
    x,
    y,
    size,
    speedY,
    targetSpeedY,
    speedX,
    swayAngle: Math.random() * Math.PI * 2,
    swaySpeed: 0.02 + Math.random() * 0.03,
    swayRadius: 0.5 + Math.random() * 1.2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
    flip: Math.random() * Math.PI * 2,
    flipSpeed: 0.02 + Math.random() * 0.03,
    color: SAKURA_PALETTE[Math.floor(Math.random() * SAKURA_PALETTE.length)],
  };
};

export const SakuraFalling: React.FC<SakuraFallingProps> = ({
  petalCount = 0,
  maxPetals = 500,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Accessibility check: skip animation if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = false;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initial petals (default 0 so nothing falls until tap)
    const petals: Petal[] = Array.from({ length: petalCount }, () =>
      createPetal(width, height, true)
    );

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const drawPetal = (petal: Petal) => {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.scale(1, Math.sin(petal.flip)); // 3D tumbling effect

      ctx.fillStyle = petal.color;
      ctx.beginPath();

      const w = petal.size * 0.7;
      const h = petal.size;

      // Realistic sakura petal shape with characteristic small notch/indentation at the tip
      ctx.moveTo(0, h * 0.5);
      // Left lobe curve
      ctx.bezierCurveTo(-w * 0.8, h * 0.2, -w * 0.9, -h * 0.25, -w * 0.45, -h * 0.5);
      // Left side of the notch
      ctx.bezierCurveTo(-w * 0.25, -h * 0.46, -w * 0.08, -h * 0.36, 0, -h * 0.32);
      // Right side of the notch
      ctx.bezierCurveTo(w * 0.08, -h * 0.36, w * 0.25, -h * 0.46, w * 0.45, -h * 0.5);
      // Right lobe curve down to base
      ctx.bezierCurveTo(w * 0.9, -h * 0.25, w * 0.8, h * 0.2, 0, h * 0.5);

      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      if (petals.length === 0) {
        isRunning = false;
        return;
      }

      for (let i = 0; i < petals.length; i++) {
        const petal = petals[i];

        // Smooth gravity acceleration towards target fall speed
        if (petal.speedY < petal.targetSpeedY) {
          petal.speedY += 0.06;
        }

        // Physics & sway updates
        petal.y += petal.speedY;
        petal.x += petal.speedX + Math.sin(petal.swayAngle) * petal.swayRadius;
        petal.swayAngle += petal.swaySpeed;
        petal.rotation += petal.rotationSpeed;
        petal.flip += petal.flipSpeed;

        // Seamless recycling back to top or left
        if (petal.y > height + 20) {
          petal.y = -20;
          petal.x = Math.random() * (width + 40) - 20;
          petal.speedY = petal.targetSpeedY;
        } else if (petal.x > width + 20) {
          petal.x = -20;
          petal.y = Math.random() * (height + 40) - 20;
          petal.speedY = petal.targetSpeedY;
        } else if (petal.x < -30) {
          petal.x = width + 20;
        }

        drawPetal(petal);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const startAnimationIfNeeded = () => {
      if (!isRunning && petals.length > 0) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Spawn handler for user taps/clicks
    const handleSpawn = (event: Event) => {
      const customEvent = event as CustomEvent<SakuraSpawnDetail>;
      const { x, y, count = 10 } = customEvent.detail || {};

      const currentCount = petals.length;
      const spawnCount = Math.min(count, Math.max(0, maxPetals - currentCount));

      if (spawnCount <= 0) return;

      const burstCount = x !== undefined && y !== undefined ? Math.ceil(spawnCount / 2) : 0;
      const topCount = spawnCount - burstCount;

      // Burst half from tap point
      for (let i = 0; i < burstCount; i++) {
        petals.push(createPetal(width, height, false, x, y));
      }

      // Rain half from the top of the screen
      for (let i = 0; i < topCount; i++) {
        petals.push(createPetal(width, height, false));
      }

      startAnimationIfNeeded();
    };

    window.addEventListener(SAKURA_SPAWN_EVENT, handleSpawn);

    if (petals.length > 0) {
      startAnimationIfNeeded();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(SAKURA_SPAWN_EVENT, handleSpawn);
    };
  }, [petalCount, maxPetals]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
};

export default SakuraFalling;
