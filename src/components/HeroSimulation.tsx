"use client";

import { useEffect, useRef } from "react";

export default function HeroSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    // Simulation state
    const robot = { x: 50, y: 200, targetX: 350, targetY: 200, speed: 0 };
    const car = { x: 350, y: 200 };
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
    let phase: "moving" | "aligning" | "charging" | "complete" = "moving";
    let phaseTimer = 0;
    let chargeLevel = 0;

    function animate() {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Clear with slight trail effect
      ctx.fillStyle = "rgba(10, 15, 20, 0.15)";
      ctx.fillRect(0, 0, w, h);

      // Draw grid
      ctx.strokeStyle = "rgba(77, 163, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Update phase
      phaseTimer++;
      if (phase === "moving") {
        const dx = robot.targetX - robot.x;
        const dy = robot.targetY - robot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          robot.speed = Math.min(robot.speed + 0.2, 3);
          robot.x += (dx / dist) * robot.speed;
          robot.y += (dy / dist) * robot.speed;
        } else {
          phase = "aligning";
          phaseTimer = 0;
        }
      } else if (phase === "aligning") {
        if (phaseTimer > 60) {
          phase = "charging";
          phaseTimer = 0;
        }
      } else if (phase === "charging") {
        chargeLevel = Math.min(chargeLevel + 0.5, 100);
        
        // Create energy particles
        if (Math.random() > 0.7) {
          particles.push({
            x: robot.x + 15,
            y: robot.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
          });
        }
        
        if (chargeLevel >= 100) {
          phase = "complete";
          phaseTimer = 0;
        }
      } else if (phase === "complete") {
        if (phaseTimer > 120) {
          // Reset
          robot.x = 50;
          robot.y = 200;
          robot.speed = 0;
          chargeLevel = 0;
          phase = "moving";
          phaseTimer = 0;
          particles.length = 0;
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.fillStyle = `rgba(77, 163, 255, ${p.life})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw car
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(car.x - 30, car.y - 15, 60, 30);
      ctx.fillStyle = "#00ffa3";
      ctx.fillRect(car.x - 32, car.y - 17, 64, 2);
      ctx.fillRect(car.x - 32, car.y + 15, 64, 2);
      
      // Draw charging port
      ctx.fillStyle = phase === "charging" ? "#4da3ff" : "#2a2a2a";
      ctx.beginPath();
      ctx.arc(car.x - 25, car.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw robot
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(robot.x, robot.y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Robot glow
      if (phase === "charging") {
        ctx.fillStyle = "rgba(77, 163, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(robot.x, robot.y, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Robot sensor
      ctx.fillStyle = "#4da3ff";
      ctx.beginPath();
      ctx.arc(robot.x, robot.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw connection line during charging
      if (phase === "charging") {
        const gradient = ctx.createLinearGradient(robot.x, robot.y, car.x - 25, car.y);
        gradient.addColorStop(0, "rgba(77, 163, 255, 0.8)");
        gradient.addColorStop(1, "rgba(77, 163, 255, 0.3)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(robot.x + 12, robot.y);
        ctx.lineTo(car.x - 25, car.y);
        ctx.stroke();
      }

      // Draw status text
      ctx.fillStyle = "#4da3ff";
      ctx.font = "14px monospace";
      let status = "";
      if (phase === "moving") status = "NAVIGATING...";
      else if (phase === "aligning") status = "ALIGNING...";
      else if (phase === "charging") status = `CHARGING ${Math.floor(chargeLevel)}%`;
      else status = "COMPLETE ✓";
      
      ctx.fillText(status, 20, 30);

      // Draw charge bar
      if (phase === "charging" || phase === "complete") {
        ctx.strokeStyle = "rgba(77, 163, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(20, h - 40, 200, 20);
        
        ctx.fillStyle = "#4da3ff";
        ctx.fillRect(22, h - 38, (chargeLevel / 100) * 196, 16);
      }

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ imageRendering: "crisp-edges" }}
    />
  );
}
