import { useEffect, useRef } from 'react';

/* ─── Spectral classes as [r,g,b] tuples ─────────────────────── */
type RGB = [number, number, number];
const STAR_COLORS: RGB[] = [
  [180, 215, 255], // blue-white O/B
  [220, 235, 255], // white A
  [255, 248, 220], // yellow-white F
  [255, 255, 200], // yellow G (sun-like)
  [255, 210, 160], // orange K
  [255, 190, 190], // faint red M
];
const STAR_WEIGHTS = [0.22, 0.30, 0.18, 0.14, 0.10, 0.06];

function pickColor(): RGB {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < STAR_WEIGHTS.length; i++) {
    acc += STAR_WEIGHTS[i];
    if (r < acc) return STAR_COLORS[i];
  }
  return STAR_COLORS[1];
}

interface Star {
  x: number;
  y: number;
  r: number;
  driftX: number;
  driftY: number;
  twinklePhase: number;
  twinkleFreq: number;
  twinkleAmp: number;
  color: RGB;
  isGiant: boolean;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  len: number;
}

export function RocketLaunchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── Generate 340 realistic stars ── */
    const STAR_COUNT = 340;
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
      const isGiant = Math.random() < 0.07;
      const isMed = !isGiant && Math.random() < 0.3;
      return {
        x: Math.random(),
        y: Math.random(),
        r: isGiant
          ? 1.9 + Math.random() * 1.3
          : isMed
            ? 1.0 + Math.random() * 0.5
            : 0.35 + Math.random() * 0.45,
        driftX: (Math.random() - 0.5) * (isGiant ? 3.5 : isMed ? 1.8 : 0.8),
        driftY: (Math.random() - 0.5) * (isGiant ? 1.2 : 0.5),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleFreq: isGiant
          ? 0.3 + Math.random() * 0.4
          : isMed
            ? 0.6 + Math.random() * 0.9
            : 1.2 + Math.random() * 2.2,
        twinkleAmp: isGiant
          ? 0.18 + Math.random() * 0.14
          : isMed
            ? 0.28 + Math.random() * 0.22
            : 0.38 + Math.random() * 0.42,
        color: pickColor(),
        isGiant,
      };
    });

    const shooters: Shooter[] = [];
    let nextShooterIn = 3 + Math.random() * 5;
    let lastTs = 0;
    let animId = 0;

    function loop(ts: number) {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;
      const t = ts / 1000;

      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      /* ── Deep space background gradient ── */
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#000003');
      sky.addColorStop(0.4, '#010915');
      sky.addColorStop(0.75, '#021224');
      sky.addColorStop(1, '#051830');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      /* ── Subtle deep space cosmic nebula dust ── */
      const neb1 = ctx.createRadialGradient(W * 0.25, H * 0.35, 10, W * 0.25, H * 0.35, W * 0.45);
      neb1.addColorStop(0, 'rgba(11, 61, 145, 0.09)');
      neb1.addColorStop(0.6, 'rgba(56, 189, 248, 0.03)');
      neb1.addColorStop(1, 'transparent');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, W, H);

      const neb2 = ctx.createRadialGradient(W * 0.8, H * 0.65, 10, W * 0.8, H * 0.65, W * 0.4);
      neb2.addColorStop(0, 'rgba(79, 70, 229, 0.07)');
      neb2.addColorStop(0.7, 'transparent');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, W, H);

      /* ── Realistic twinkling stars ── */
      stars.forEach((s) => {
        const sx = (((s.x + (s.driftX * t) / (W * 10)) % 1) + 1) % 1 * W;
        const sy = (((s.y + (s.driftY * t) / (H * 15)) % 1) + 1) % 1 * H;

        const tw =
          0.5 +
          0.5 *
            Math.sin(t * s.twinkleFreq * Math.PI * 2 + s.twinklePhase) *
            Math.sin(t * s.twinkleFreq * 0.37 * Math.PI * 2 + s.twinklePhase * 1.6);
        const brightness = Math.max(0.05, 1 - s.twinkleAmp + s.twinkleAmp * tw);
        const [cr, cg, cb] = s.color;

        /* Giant stars: soft radial glow halo + 4-point diffraction spike */
        if (s.isGiant) {
          const haloR = s.r * 5.5;
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
          halo.addColorStop(0, `rgba(${cr},${cg},${cb},${brightness * 0.4})`);
          halo.addColorStop(0.4, `rgba(${cr},${cg},${cb},${brightness * 0.1})`);
          halo.addColorStop(1, 'transparent');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
          ctx.fill();

          const spikeLen = s.r * (3.5 + 2.5 * brightness);
          ctx.save();
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${brightness * 0.55})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(sx - spikeLen, sy);
          ctx.lineTo(sx + spikeLen, sy);
          ctx.moveTo(sx, sy - spikeLen);
          ctx.lineTo(sx, sy + spikeLen);
          ctx.stroke();
          ctx.restore();
        }

        /* Star disc */
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.3, s.r * brightness), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${Math.min(1, brightness)})`;
        ctx.fill();
      });

      /* ── Shooting stars / meteors ── */
      nextShooterIn -= dt;
      if (nextShooterIn <= 0) {
        nextShooterIn = 4 + Math.random() * 8;
        const angle = (14 + Math.random() * 26) * (Math.PI / 180);
        const spd = 600 + Math.random() * 500;
        shooters.push({
          x: Math.random() * W * 0.85,
          y: Math.random() * H * 0.45,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 1,
          maxLife: 0.45 + Math.random() * 0.4,
          len: 90 + Math.random() * 120,
        });
      }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.life -= dt / sh.maxLife;
        if (sh.life <= 0 || sh.x > W + 60 || sh.y > H) {
          shooters.splice(i, 1);
          continue;
        }
        const mag = Math.hypot(sh.vx, sh.vy);
        const tailX = sh.x - (sh.vx / mag) * sh.len * sh.life;
        const tailY = sh.y - (sh.vy / mag) * sh.len * sh.life;
        const tail = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
        tail.addColorStop(0, 'transparent');
        tail.addColorStop(1, `rgba(210,235,255,${sh.life * 0.92})`);
        ctx.save();
        ctx.strokeStyle = tail;
        ctx.lineWidth = 1.8 * sh.life;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(sh.x, sh.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 2.2 * sh.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,245,255,${sh.life})`;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block pointer-events-none"
    />
  );
}
