"use client";

import { useEffect, useRef } from "react";
import type { PoseLandmark } from "@/hooks/usePoseLandmarker";

// MediaPipe Pose connections (pairs of landmark indices)
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso sides
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [0, 11], [0, 12], // neck to shoulders (approx)
];

// Simple standing-human silhouette as SVG path commands (normalized 0-1 space)
// Defined on a 100x180 grid, centered at (50, 90)
function drawSilhouette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2;
  const scaleX = w * 0.28;
  const scaleY = h * 0.88;
  const topY = h * 0.04;

  ctx.save();
  ctx.strokeStyle = "rgba(200,169,110,0.30)";
  ctx.fillStyle = "rgba(200,169,110,0.06)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);

  // Head (ellipse)
  const headR = scaleX * 0.22;
  const headCY = topY + headR * 1.1;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headR * 0.78, headR, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Body outline (torso + legs as a single path)
  const shoulderY = headCY + headR * 1.15;
  const shoulderW = scaleX * 0.52;
  const hipY = shoulderY + scaleY * 0.38;
  const hipW = scaleX * 0.42;
  const kneeY = hipY + scaleY * 0.30;
  const ankleY = topY + scaleY;
  const footW = scaleX * 0.15;

  ctx.beginPath();
  // left shoulder → left hip → left knee → left ankle → right ankle → right knee → right hip → right shoulder
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.lineTo(cx - hipW, hipY);
  ctx.lineTo(cx - hipW * 0.55, kneeY);
  ctx.lineTo(cx - footW, ankleY);
  ctx.lineTo(cx + footW, ankleY);
  ctx.lineTo(cx + hipW * 0.55, kneeY);
  ctx.lineTo(cx + hipW, hipY);
  ctx.lineTo(cx + shoulderW, shoulderY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Arms
  const armEndY = hipY - scaleY * 0.02;
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.lineTo(cx - shoulderW * 1.35, armEndY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + shoulderW, shoulderY);
  ctx.lineTo(cx + shoulderW * 1.35, armEndY);
  ctx.stroke();

  ctx.restore();
}

function drawCenterLine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(200,169,110,0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.restore();
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  w: number,
  h: number,
  ready: boolean
) {
  if (!landmarks.length) return;

  const color = ready ? "rgba(92,184,122," : "rgba(200,169,110,";

  // Connections
  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.setLineDash([]);
  for (const [a, b] of POSE_CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb) continue;
    const vis = Math.min(la.visibility, lb.visibility);
    if (vis < 0.3) continue;
    const alpha = Math.min(vis * 0.9, 0.85);
    ctx.strokeStyle = `${color}${alpha})`;
    ctx.beginPath();
    // Mirror x because video is mirrored
    ctx.moveTo((1 - la.x) * w, la.y * h);
    ctx.lineTo((1 - lb.x) * w, lb.y * h);
    ctx.stroke();
  }

  // Landmark dots
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || lm.visibility < 0.35) continue;
    const alpha = Math.min(lm.visibility * 0.95, 0.9);
    ctx.fillStyle = `${color}${alpha})`;
    ctx.beginPath();
    ctx.arc((1 - lm.x) * w, lm.y * h, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

interface Props {
  landmarks: PoseLandmark[];
  ready: boolean;
  showSilhouette: boolean;
}

export default function ScanOverlay({ landmarks, ready, showSilhouette }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    if (showSilhouette && !landmarks.length) {
      drawSilhouette(ctx, w, h);
    }
    drawCenterLine(ctx, w, h);
    drawSkeleton(ctx, landmarks, w, h, ready);
  }, [landmarks, ready, showSilhouette]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={480}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
