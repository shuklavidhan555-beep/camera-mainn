import React, { useEffect, useRef } from 'react';
import { CameraFeed } from '../../types';

interface SyntheticCCTVStreamProps {
  camera: CameraFeed;
  isNightVision?: boolean;
  className?: string;
}

interface StreamVehicle {
  id: number;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  speed: number;
  width: number;
  length: number;
  color: string;
  type: 'car' | 'truck' | 'bus' | 'motorcycle';
  lane: number;
  direction: 1 | -1;
  angle?: number;
}

interface StreamPedestrian {
  x: number;
  y: number;
  speed: number;
  dir: 1 | -1;
}

export const EdgeVisionStream: React.FC<SyntheticCCTVStreamProps> = ({
  camera,
  isNightVision = false,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let dashOffset = 0;
    let scanlineY = 0;
    let lightCycleTimer = 0;

    const theme = camera.videoTheme || 'highway';
    const isOffline = camera.status === 'offline';

    // Track real dimensions with high DPI support
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let viewW = 640;
    let viewH = 360;

    const updateSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      viewW = Math.max(320, rect.width || 640);
      viewH = Math.max(180, rect.height || 360);
      canvas.width = Math.round(viewW * dpr);
      canvas.height = Math.round(viewH * dpr);
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    // Vehicle palette & population based on camera telemetry
    const vehicleColors = ['#94a3b8', '#38bdf8', '#fbbf24', '#f87171', '#cbd5e1', '#64748b', '#3b82f6'];
    const numVehicles = Math.min(10, Math.max(3, Math.floor((camera.vehicleCount || 30) / 9)));
    const vehicles: StreamVehicle[] = [];

    for (let i = 0; i < numVehicles; i++) {
      const lane = i % 3;
      const isReverse = theme === 'intersection' ? (i % 2 === 1) : false;
      const types: ('car' | 'truck' | 'bus' | 'motorcycle')[] = ['car', 'car', 'truck', 'bus', 'motorcycle'];
      const type = types[i % types.length];

      const vLength = type === 'truck' ? 36 : type === 'bus' ? 32 : type === 'motorcycle' ? 12 : 22;
      const vWidth = type === 'motorcycle' ? 8 : type === 'truck' ? 16 : 14;

      vehicles.push({
        id: i,
        x: 18 + (lane * 22) + (Math.sin(i * 99) * 4),
        y: (i * (100 / numVehicles) + (camera.id.charCodeAt(camera.id.length - 1) * 3)) % 100,
        speed: (theme === 'highway' ? 38 : 22) * (0.8 + (i % 3) * 0.2),
        width: vWidth,
        length: vLength,
        color: vehicleColors[i % vehicleColors.length],
        type,
        lane,
        direction: isReverse ? -1 : 1,
        angle: 0
      });
    }

    // Pedestrians for urban crosswalk scenes
    const pedestrians: StreamPedestrian[] = [
      { x: 30, y: 50, speed: 6, dir: 1 },
      { x: 70, y: 52, speed: 5, dir: -1 },
      { x: 45, y: 48, speed: 4, dir: 1 }
    ];

    // Edge Vision roadway hazard scenario
    const hasAnimal = camera.objects?.some(o => o.type === 'animal') || camera.incidentType === 'Traffic Accident';
    const animal = {
      x: 48,
      y: 55,
      speed: 5,
      dir: (1 as 1 | -1)
    };

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      lightCycleTimer += dt;

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = viewW;
      const h = viewH;

      // -------------------------------------------------------------
      // OFFLINE // NO SIGNAL SCREEN
      // -------------------------------------------------------------
      if (isOffline) {
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, w, h);

        // Digital noise grain
        const imgData = ctx.createImageData(Math.floor(w), Math.floor(h));
        const buf = new Uint32Array(imgData.data.buffer);
        for (let p = 0; p < buf.length; p++) {
          if (Math.random() < 0.12) {
            const g = Math.floor(Math.random() * 80);
            buf[p] = (255 << 24) | (g << 16) | (g << 8) | g;
          }
        }
        ctx.putImageData(imgData, 0, 0);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO SYNC // OPTICAL CARRIER TIMEOUT', w / 2, h / 2 - 10);
        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText(`SENSOR ID: ${camera.id} (RTSP 504 TIMEOUT)`, w / 2, h / 2 + 15);

        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // -------------------------------------------------------------
      // 1. THEME-SPECIFIC BACKGROUND & ROADWAY SURFACE
      // -------------------------------------------------------------
      ctx.fillStyle = isNightVision ? '#041409' : '#0a0f1d';
      ctx.fillRect(0, 0, w, h);

      if (theme === 'highway') {
        // Perspective Highway Surface
        ctx.fillStyle = isNightVision ? '#092111' : '#141d30';
        ctx.beginPath();
        ctx.moveTo(w * 0.12, 0);
        ctx.lineTo(w * 0.88, 0);
        ctx.lineTo(w * 0.98, h);
        ctx.lineTo(w * 0.02, h);
        ctx.closePath();
        ctx.fill();

        // Guardrails & shoulders
        ctx.strokeStyle = isNightVision ? '#155e2e' : '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, 0);
        ctx.lineTo(w * 0.02, h);
        ctx.moveTo(w * 0.88, 0);
        ctx.lineTo(w * 0.98, h);
        ctx.stroke();

        // Dashed Lane Dividers (animated scrolling)
        dashOffset = (dashOffset + dt * 50) % 30;
        ctx.strokeStyle = isNightVision ? '#22c55e' : '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([12, 18]);
        ctx.lineDashOffset = -dashOffset;

        ctx.beginPath();
        ctx.moveTo(w * 0.38, 0);
        ctx.lineTo(w * 0.34, h);
        ctx.stroke();

        // Center median divider (amber)
        ctx.strokeStyle = isNightVision ? '#4ade80' : '#f59e0b';
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();

        ctx.strokeStyle = isNightVision ? '#22c55e' : '#f8fafc';
        ctx.setLineDash([12, 18]);
        ctx.beginPath();
        ctx.moveTo(w * 0.62, 0);
        ctx.lineTo(w * 0.66, h);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (theme === 'tunnel') {
        // Tunnel with arched perspective walls and sodium lighting
        ctx.fillStyle = isNightVision ? '#06180c' : '#0f172a';
        ctx.fillRect(w * 0.1, 0, w * 0.8, h);

        // Tunnel ceiling curve & wall ribs
        ctx.strokeStyle = isNightVision ? '#14532d' : '#1e293b';
        ctx.lineWidth = 2;
        for (let y = 0; y < h; y += 35) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w * 0.1, y * 0.9);
          ctx.moveTo(w, y);
          ctx.lineTo(w * 0.9, y * 0.9);
          ctx.stroke();
        }

        // Overhead yellow sodium tube lights moving with traffic
        dashOffset = (dashOffset + dt * 40) % 60;
        ctx.fillStyle = isNightVision ? 'rgba(74, 222, 128, 0.4)' : 'rgba(251, 191, 36, 0.45)';
        for (let y = -30 + dashOffset; y < h; y += 60) {
          ctx.fillRect(w * 0.3, y, 4, 18);
          ctx.fillRect(w * 0.7, y, 4, 18);
        }

        // Road center dashed line
        ctx.strokeStyle = isNightVision ? '#22c55e' : '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([14, 16]);
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (theme === 'bridge') {
        // Bridge deck with suspension cable pylons
        // Water on left & right margins
        ctx.fillStyle = isNightVision ? '#020d06' : '#030712';
        ctx.fillRect(0, 0, w * 0.15, h);
        ctx.fillRect(w * 0.85, 0, w * 0.15, h);

        // Bridge asphalt deck
        ctx.fillStyle = isNightVision ? '#092111' : '#172033';
        ctx.fillRect(w * 0.15, 0, w * 0.7, h);

        // Suspension cable tower at top center
        ctx.strokeStyle = isNightVision ? '#22c55e' : '#0284c7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.5, h * 0.25);
        ctx.stroke();

        // Diagonal stay cables
        ctx.strokeStyle = isNightVision ? 'rgba(34, 197, 94, 0.4)' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.2;
        for (let i = 1; i <= 5; i++) {
          ctx.beginPath();
          ctx.moveTo(w * 0.5, h * 0.05 * i);
          ctx.lineTo(w * 0.15, h * 0.2 * i);
          ctx.moveTo(w * 0.5, h * 0.05 * i);
          ctx.lineTo(w * 0.85, h * 0.2 * i);
          ctx.stroke();
        }

        dashOffset = (dashOffset + dt * 42) % 28;
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([12, 16]);
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (theme === 'roundabout') {
        // Roundabout circle layout
        ctx.fillStyle = isNightVision ? '#092111' : '#141d30';
        ctx.fillRect(0, 0, w, h);

        // Feeder roads (North, South, East, West)
        ctx.fillStyle = isNightVision ? '#06180c' : '#0f172a';
        ctx.fillRect(w * 0.4, 0, w * 0.2, h);
        ctx.fillRect(0, h * 0.4, w, h * 0.2);

        // Outer Ring Road
        ctx.strokeStyle = isNightVision ? '#15803d' : '#334155';
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.32, 0, Math.PI * 2);
        ctx.stroke();

        // Inner landscaped central island
        ctx.fillStyle = isNightVision ? '#022c14' : '#064e3b';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.20, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isNightVision ? '#22c55e' : '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (theme === 'crosswalk') {
        // Urban crosswalk with pedestrians
        ctx.fillStyle = isNightVision ? '#092111' : '#141d30';
        ctx.fillRect(w * 0.15, 0, w * 0.7, h);

        // Zebra stripes in middle
        ctx.fillStyle = isNightVision ? '#22c55e' : '#f8fafc';
        for (let x = w * 0.16; x < w * 0.84; x += 18) {
          ctx.fillRect(x, h * 0.45, 10, 24);
        }

        dashOffset = (dashOffset + dt * 25) % 24;
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([10, 14]);
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.5, h * 0.45);
        ctx.moveTo(w * 0.5, h * 0.45 + 24);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Render walking pedestrians
        for (const ped of pedestrians) {
          ped.x += ped.speed * ped.dir * dt * 4;
          if (ped.x > 82) ped.dir = -1;
          if (ped.x < 18) ped.dir = 1;

          const px = (ped.x / 100) * w;
          const py = (ped.y / 100) * h;

          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Pedestrian bounding box tag
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.strokeRect(px - 5, py - 6, 10, 14);
        }
      } else {
        // Intersection layout
        ctx.fillStyle = isNightVision ? '#092111' : '#141d30';
        ctx.fillRect(w * 0.2, 0, w * 0.6, h);
        ctx.fillRect(0, h * 0.2, w, h * 0.6);

        // Zebra crosswalks on approaches
        ctx.fillStyle = isNightVision ? '#1e542c' : '#475569';
        for (let x = w * 0.22; x < w * 0.78; x += 14) {
          ctx.fillRect(x, h * 0.16, 8, 12);
          ctx.fillRect(x, h * 0.82, 8, 12);
        }
        for (let y = h * 0.22; y < h * 0.78; y += 14) {
          ctx.fillRect(w * 0.16, y, 12, 8);
          ctx.fillRect(w * 0.82, y, 12, 8);
        }

        // Traffic Light Indicator
        const isGreen = Math.floor(lightCycleTimer / 4) % 2 === 0;
        ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.22, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // -------------------------------------------------------------
      // 2. EDGE STREAM VEHICLES WITH HEADLIGHTS & TAILLIGHTS
      // -------------------------------------------------------------
      for (const v of vehicles) {
        if (theme === 'roundabout') {
          // Circular trajectory around roundabout center
          v.angle = ((v.angle || 0) + (v.speed * 0.03 * dt)) % (Math.PI * 2);
          const radius = Math.min(w, h) * 0.32;
          const posX = w / 2 + Math.cos(v.angle) * radius;
          const posY = h / 2 + Math.sin(v.angle) * radius;

          ctx.save();
          ctx.translate(posX, posY);
          ctx.rotate(v.angle + Math.PI / 2);

          // Body
          ctx.fillStyle = isNightVision ? '#15803d' : v.color;
          ctx.beginPath();
          ctx.roundRect(-v.width / 2, -v.length / 2, v.width, v.length, 3);
          ctx.fill();

          // Taillights
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-v.width * 0.4, v.length / 2 - 2, 3, 2);
          ctx.fillRect(v.width * 0.4 - 3, v.length / 2 - 2, 3, 2);

          ctx.restore();
          continue;
        }

        // Linear road trajectories
        v.y = (v.y + (v.speed * dt * 0.8 * v.direction) + 100) % 100;
        const posX = (v.x / 100) * w;
        const posY = (v.y / 100) * h;

        // Vehicle Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(posX - v.width / 2 + 2, posY - v.length / 2 + 2, v.width, v.length);

        // Vehicle Body
        ctx.fillStyle = isNightVision ? '#15803d' : v.color;
        ctx.beginPath();
        ctx.roundRect(posX - v.width / 2, posY - v.length / 2, v.width, v.length, 3);
        ctx.fill();

        // Windshield
        ctx.fillStyle = isNightVision ? '#052e16' : '#0f172a';
        ctx.fillRect(posX - v.width * 0.35, posY - v.length * 0.2, v.width * 0.7, v.length * 0.25);

        // Headlight beams
        if (v.direction === 1) {
          const beamGrad = ctx.createLinearGradient(posX, posY + v.length / 2, posX, posY + v.length / 2 + 45);
          beamGrad.addColorStop(0, isNightVision ? 'rgba(74, 222, 128, 0.4)' : 'rgba(254, 240, 138, 0.4)');
          beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(posX - v.width * 0.4, posY + v.length / 2);
          ctx.lineTo(posX + v.width * 0.4, posY + v.length / 2);
          ctx.lineTo(posX + v.width * 0.8, posY + v.length / 2 + 45);
          ctx.lineTo(posX - v.width * 0.8, posY + v.length / 2 + 45);
          ctx.closePath();
          ctx.fill();

          // Taillights at top of vehicle
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(posX - v.width * 0.4, posY - v.length / 2, 3, 2);
          ctx.fillRect(posX + v.width * 0.4 - 3, posY - v.length / 2, 3, 2);
        } else {
          // Pointing upward
          const beamGrad = ctx.createLinearGradient(posX, posY - v.length / 2, posX, posY - v.length / 2 - 45);
          beamGrad.addColorStop(0, isNightVision ? 'rgba(74, 222, 128, 0.4)' : 'rgba(254, 240, 138, 0.4)');
          beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(posX - v.width * 0.4, posY - v.length / 2);
          ctx.lineTo(posX + v.width * 0.4, posY - v.length / 2);
          ctx.lineTo(posX + v.width * 0.8, posY - v.length / 2 - 45);
          ctx.lineTo(posX - v.width * 0.8, posY - v.length / 2 - 45);
          ctx.closePath();
          ctx.fill();

          // Taillights at bottom
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(posX - v.width * 0.4, posY + v.length / 2 - 2, 3, 2);
          ctx.fillRect(posX + v.width * 0.4 - 3, posY + v.length / 2 - 2, 3, 2);
        }
      }

      // -------------------------------------------------------------
      // 2.5. EDGE VISION ROADWAY HAZARD
      // -------------------------------------------------------------
      if (hasAnimal) {
        animal.x += animal.speed * animal.dir * dt * 2.2;
        if (animal.x > 72) animal.dir = -1;
        if (animal.x < 32) animal.dir = 1;

        const ax = (animal.x / 100) * w;
        const ay = (animal.y / 100) * h;

        // Animal torso
        ctx.fillStyle = isNightVision ? '#a855f7' : '#c084fc';
        ctx.beginPath();
        ctx.ellipse(ax, ay, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animal head & ears
        ctx.beginPath();
        ctx.arc(ax + (animal.dir * 8), ay - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing purple warning bounding box
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(ax - 12, ay - 9, 24, 18);

        // Connecting hazard vector line to nearest approaching vehicle
        if (vehicles.length > 0) {
          const nearestV = vehicles[0];
          const vx = (nearestV.x / 100) * w;
          const vy = (nearestV.y / 100) * h;

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(vx, vy);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // -------------------------------------------------------------
      // 3. SCANLINES & CRT VIGNETTE
      // -------------------------------------------------------------
      scanlineY = (scanlineY + dt * 60) % h;
      ctx.fillStyle = isNightVision ? 'rgba(74, 222, 128, 0.10)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, scanlineY, w, 2);

      // Camera Watermark Header & Telemetry
      ctx.fillStyle = isNightVision ? 'rgba(74, 222, 128, 0.8)' : 'rgba(203, 213, 225, 0.7)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `CAM // ${camera.id} • ${camera.zone.toUpperCase()} • ${theme.toUpperCase()} • 30FPS`,
        12,
        h - 12
      );

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [camera.id, camera.zone, camera.status, camera.videoTheme, camera.vehicleCount, camera.objects, camera.incidentType, isNightVision]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full object-cover block select-none ${className || ''}`}
    />
  );
};

export { EdgeVisionStream as SyntheticCCTVStream };

