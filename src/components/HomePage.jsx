import { useRef, useEffect, useState } from 'react';
import { RARITY_CONFIG, RARITY_ORDER } from '../utils/constants';
import { fetchStats } from '../services/api';
import { useIsMobile } from '../hooks/useIsMobile';

const rand = (a, b) => Math.random() * (b - a) + a;

function DecoBubbles({ width, height }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !width || !height) return;

    cv.width = width * 2;
    cv.height = height * 2;
    const ctx = cv.getContext('2d');
    ctx.scale(2, 2);

    const colors = RARITY_ORDER.map(r => RARITY_CONFIG[r]);
    const bubbles = Array.from({ length: 120 }, () => {
      const cfg = colors[Math.floor(Math.random() * colors.length)];
      const r = rand(2, 18);
      return {
        x: rand(0, width), y: rand(0, height), r,
        vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
        color: cfg.color, alpha: rand(0.08, 0.4),
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const b of bubbles) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -20) b.x = width + 20;
        if (b.x > width + 20) b.x = -20;
        if (b.y < -20) b.y = height + 20;
        if (b.y > height + 20) b.y = -20;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color + Math.round(b.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = b.color + '33';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        opacity: 0.6,
      }}
    />
  );
}

export default function HomePage({ onLaunch }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [stats, setStats] = useState(null);
  const [entered, setEntered] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  const handleLaunch = () => {
    setEntered(true);
    setTimeout(onLaunch, 600);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw', height: '100vh', background: '#040804',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        position: 'relative', overflow: 'hidden',
        opacity: entered ? 0 : 1,
        transform: entered ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        padding: isMobile ? '20px 16px' : 0,
      }}
    >
      <DecoBubbles width={dims.w} height={dims.h} />

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%' }}>
        {/* Hero Image */}
        <img
          src="/hero.png"
          alt="GRIDZILLA - Mapping the Grid"
          style={{
            width: isMobile ? '90%' : '95%',
            maxWidth: isMobile ? 360 : 700,
            marginBottom: isMobile ? 16 : 24,
            filter: 'drop-shadow(0 0 60px #EF444422)',
            animation: 'floatLogo 4s ease-in-out infinite',
          }}
        />

        {/* Subtitle */}
        <div style={{
          fontSize: isMobile ? 11 : 12, color: '#555',
          marginBottom: isMobile ? 24 : 40,
          maxWidth: isMobile ? 300 : 420,
          margin: `0 auto ${isMobile ? 24 : 40}px`,
          padding: '0 10px',
        }}>
          Real-time visualization of 10,000 validator nodes on the GunZ blockchain
        </div>

        {/* Stats Preview */}
        {stats?.totals && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 8 : 20,
            justifyContent: 'center',
            marginBottom: isMobile ? 24 : 40,
            maxWidth: isMobile ? 340 : 600,
            margin: `0 auto ${isMobile ? 24 : 40}px`,
            padding: '0 10px',
          }}>
            {[
              { l: 'NODES', v: stats.totals.total?.toLocaleString(), c: '#4ADE80' },
              { l: 'ACTIVE', v: stats.totals.active?.toLocaleString(), c: '#60A5FA' },
              { l: 'TOTAL HEXES', v: stats.totals.totalHexes?.toLocaleString(), c: '#C084FC' },
              { l: 'HASHPOWER', v: stats.totals.activeHashpower?.toLocaleString(), c: '#FBBF24' },
            ].map((s, i) => (
              <div key={i} style={{
                background: '#0a120a88', border: '1px solid #142014',
                borderRadius: 10, padding: isMobile ? '10px 12px' : '12px 20px',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: isMobile ? 8 : 9, color: '#778', letterSpacing: 2, marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Launch Button */}
        <button
          onClick={handleLaunch}
          style={{
            background: 'linear-gradient(135deg, #4ADE80, #22c55e)',
            color: '#000', border: 'none',
            padding: isMobile ? '12px 36px' : '14px 48px',
            borderRadius: 8,
            fontSize: isMobile ? 13 : 14, fontWeight: 800, fontFamily: 'inherit',
            letterSpacing: 3, cursor: 'pointer',
            boxShadow: '0 0 30px #4ADE8044, 0 4px 20px #00000066',
            transition: 'transform 0.2s, box-shadow 0.2s',
            textTransform: 'uppercase',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 50px #4ADE8066, 0 6px 30px #00000088';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px #4ADE8044, 0 4px 20px #00000066';
          }}
        >
          Launch App
        </button>

        {/* Version */}
        <div style={{ marginTop: 30, fontSize: 10, color: '#444', letterSpacing: 2 }}>
          GRIDZILLA v1.0
        </div>
      </div>

      <style>{`
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
