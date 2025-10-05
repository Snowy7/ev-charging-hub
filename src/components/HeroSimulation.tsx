"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get initial canvas size
    const rect = canvas.getBoundingClientRect();
    let canvasWidth = rect.width;
    let canvasHeight = rect.height;

    // Simulation state with responsive initial positions
    const robot = { x: canvasWidth * 0.15, y: canvasHeight * 0.5, targetX: canvasWidth * 0.55, targetY: canvasHeight * 0.5, speed: 0 };
    const car = { x: canvasWidth * 0.75, y: canvasHeight * 0.5 };
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number }> = [];
    let phase: "idle" | "moving" | "aligning" | "charging" | "complete" = "idle";
    let phaseTimer = 0;
    let chargeLevel = 0;
    
    // Set canvas size and update positions on resize
    const updateSize = () => {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvasWidth = rect.width;
      canvasHeight = rect.height;
      
      // Update positions based on new canvas size
      const centerY = canvasHeight * 0.5;
      robot.x = canvasWidth * 0.15;
      robot.y = centerY;
      robot.targetX = canvasWidth * 0.55;
      robot.targetY = centerY;
      car.x = canvasWidth * 0.75;
      car.y = centerY;
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    function drawCar(x: number, y: number, charging: boolean) {
      if (!ctx) return;
      // Scale based on canvas width - responsive sizing
      const scale = Math.min(1, canvasWidth / 480);
      const carW = 80 * scale;
      const carH = 40 * scale;
      
      // Car body with shadow
      ctx.fillStyle = "#1e293b";
      ctx.shadowBlur = 8 * scale;
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(x - carW/2, y - carH/2, carW, carH);
      ctx.shadowBlur = 0;
      
      // Car accent lines
      ctx.fillStyle = charging ? "#4da3ff" : "#00ffa3";
      if (charging) {
        ctx.shadowBlur = 15 * scale;
        ctx.shadowColor = "#4da3ff";
      }
      ctx.fillRect(x - carW/2 - 2 * scale, y - carH/2 - 2 * scale, carW + 4 * scale, 3 * scale);
      ctx.fillRect(x - carW/2 - 2 * scale, y + carH/2 - scale, carW + 4 * scale, 3 * scale);
      ctx.shadowBlur = 0;
      
      // Charging port
      ctx.fillStyle = charging ? "#4da3ff" : "#334155";
      if (charging) {
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor = "#4da3ff";
      }
      ctx.beginPath();
      ctx.arc(x - carW/2 + 8 * scale, y, 7 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Wheels
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(x - carW/4, y + carH/2, 6 * scale, 0, Math.PI * 2);
      ctx.arc(x + carW/4, y + carH/2, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawRobot(x: number, y: number, charging: boolean) {
      if (!ctx) return;
      // Scale based on canvas width - responsive sizing
      const scale = Math.min(1, canvasWidth / 480);
      
      // Robot glow when charging
      if (charging) {
        ctx.shadowBlur = 25 * scale;
        ctx.shadowColor = "#4da3ff";
        ctx.fillStyle = "rgba(77, 163, 255, 0.25)";
        ctx.beginPath();
        ctx.arc(x, y, 28 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Robot body
      ctx.shadowBlur = 8 * scale;
      ctx.shadowColor = "#1e40af";
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(x, y, 16 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Robot sensor (always glowing)
      ctx.shadowBlur = 15 * scale;
      ctx.shadowColor = "#4da3ff";
      ctx.fillStyle = "#4da3ff";
      ctx.beginPath();
      ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function animate() {
      if (!canvas || !ctx) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Clear with dark background
      ctx.fillStyle = "#0a0f14";
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid
      ctx.strokeStyle = "rgba(77, 163, 255, 0.12)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Only update if running
      if (!isRunning) {
        // Draw idle state
        drawRobot(robot.x, robot.y, false);
        drawCar(car.x, car.y, false);
        
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Update phase
      phaseTimer++;
      if (phase === "idle") {
        phase = "moving";
      } else if (phase === "moving") {
        const dx = robot.targetX - robot.x;
        const dy = robot.targetY - robot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 3) {
          robot.speed = Math.min(robot.speed + 0.05, 1);
          robot.x += (dx / dist) * robot.speed;
          robot.y += (dy / dist) * robot.speed;
        } else {
          phase = "aligning";
          phaseTimer = 0;
        }
      } else if (phase === "aligning") {
        if (phaseTimer > 90) {
          phase = "charging";
          phaseTimer = 0;
        }
      } else if (phase === "charging") {
        chargeLevel = Math.min(chargeLevel + 0.25, 100);
        
        // Create energy particles (slower)
        if (Math.random() > 0.85) {
          particles.push({
            x: robot.x + 18,
            y: robot.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            life: 1,
            size: Math.random() * 2.5 + 1.5,
          });
        }
        
        if (chargeLevel >= 100) {
          phase = "complete";
          phaseTimer = 0;
        }
      } else if (phase === "complete") {
        if (phaseTimer > 180) {
          // Reset with responsive positions
          robot.x = canvasWidth * 0.15;
          robot.y = canvasHeight * 0.5;
          robot.targetX = canvasWidth * 0.55;
          robot.targetY = canvasHeight * 0.5;
          robot.speed = 0;
          chargeLevel = 0;
          phase = "moving";
          phaseTimer = 0;
          particles.length = 0;
        }
      }

      // Update and draw particles with glow
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * 0.4;
        p.y += p.vy * 0.4;
        p.life -= 0.012;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#4da3ff";
          ctx.fillStyle = `rgba(77, 163, 255, ${p.life * 0.9})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw car
      drawCar(car.x, car.y, phase === "charging");

      // Draw robot
      drawRobot(robot.x, robot.y, phase === "charging");

      // Draw connection line during charging with responsive sizing
      if (phase === "charging" || phase === "complete") {
        const scale = Math.min(1, w / 480);
        ctx.shadowBlur = 18 * scale;
        ctx.shadowColor = "#4da3ff";
        const robotEdge = robot.x + 16 * scale;
        const carEdge = car.x - (80 * scale) / 2 + 8 * scale;
        const gradient = ctx.createLinearGradient(robotEdge, robot.y, carEdge, car.y);
        gradient.addColorStop(0, "rgba(77, 163, 255, 0.9)");
        gradient.addColorStop(0.5, "rgba(77, 163, 255, 0.7)");
        gradient.addColorStop(1, "rgba(77, 163, 255, 0.4)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.moveTo(robotEdge, robot.y);
        ctx.lineTo(carEdge, car.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw status text with glow - responsive sizing
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#4da3ff";
      ctx.fillStyle = "#4da3ff";
      const fontSize = Math.max(12, Math.min(16, w * 0.035));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = "left";
      let status = "";
      if (phase === "moving") status = "◉ NAVIGATING";
      else if (phase === "aligning") status = "◉ ALIGNING";
      else if (phase === "charging") status = `◉ CHARGING ${Math.floor(chargeLevel)}%`;
      else status = "✓ COMPLETE";
      
      const padding = Math.max(16, w * 0.04);
      ctx.fillText(status, padding, padding + fontSize);
      ctx.shadowBlur = 0;

      // Draw charge bar with glow - responsive sizing
      if (phase === "charging" || phase === "complete") {
        const barWidth = Math.min(240, w * 0.5);
        const barHeight = Math.max(24, Math.min(32, h * 0.08));
        const barX = padding;
        const barY = h - barHeight - padding;
        
        // Bar background
        ctx.fillStyle = "rgba(77, 163, 255, 0.15)";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Bar border
        ctx.strokeStyle = "rgba(77, 163, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Charge fill with glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#4da3ff";
        const fillGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        fillGradient.addColorStop(0, "#4da3ff");
        fillGradient.addColorStop(1, "#60a5fa");
        ctx.fillStyle = fillGradient;
        const fillWidth = (chargeLevel / 100) * (barWidth - 6);
        ctx.fillRect(barX + 3, barY + 3, fillWidth, barHeight - 6);
        ctx.shadowBlur = 0;
        
        // Percentage text
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#000";
        ctx.fillStyle = "#0a0f14";
        const textSize = Math.max(11, Math.min(14, barHeight * 0.5));
        ctx.font = `bold ${textSize}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`${Math.floor(chargeLevel)}%`, barX + barWidth / 2, barY + barHeight / 2 + textSize / 3);
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
  };

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ imageRendering: "auto" }}
      />
      {!isRunning && (
        <>
          {/* Dark overlay when paused */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          <button
            onClick={handleStart}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full bg-[color:var(--color-neon-blue)]/20 p-6 backdrop-blur-md transition-all hover:bg-[color:var(--color-neon-blue)]/30 hover:scale-110 hover:shadow-[0_0_40px_rgba(77,163,255,0.6)]"
            aria-label="Start simulation"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[color:var(--color-neon-blue)]"
            >
              <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}