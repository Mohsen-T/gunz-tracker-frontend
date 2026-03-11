import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { RARITY_CONFIG, STATUS_CONFIG, NODE_IMAGE_URL, GUNZSCAN_NODE_URL } from '../utils/constants';
import { formatNum, shortenAddr, formatPct } from '../utils/format';

const rand = (a, b) => Math.random() * (b - a) + a;

export default function BubbleCanvas({ nodes, onSelect, selectedId }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bubblesRef = useRef([]);
  const hovRef = useRef(null);
  const [hov, setHov] = useState(null);
  const [mp, setMp] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const maxHP = useMemo(
    () => Math.max(...nodes.map(n => Number(n.hashpower) || 0), 1),
    [nodes]
  );

  // Build bubbles and animate
  useEffect(() => {
    const cv = canvasRef.current;
    const ct = containerRef.current;
    if (!cv || !ct || nodes.length === 0) return;

    const w = ct.clientWidth;
    const h = ct.clientHeight;
    cv.width = w * 2;
    cv.height = h * 2;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    const ctx = cv.getContext('2d');
    ctx.scale(2, 2);

    const cnt = nodes.length;
    const minR = cnt > 5000 ? 1.5 : cnt > 1000 ? 2.5 : 4;
    const maxR = cnt > 5000 ? 14 : cnt > 1000 ? 20 : 28;
    const logMax = Math.log(maxHP + 1);

    const bubbles = nodes.map(n => {
      const hp = Number(n.hashpower) || 0;
      const r = minR + (Math.log(hp + 1) / logMax) * (maxR - minR);
      return {
        n,
        x: rand(r + 2, w - r - 2),
        y: rand(r + 2, h - r - 2),
        r,
        vx: rand(-0.12, 0.12),
        vy: rand(-0.12, 0.12),
      };
    });
    bubblesRef.current = bubbles;

    // Pre-compute per-bubble constants to avoid per-frame lookups
    for (const b of bubbles) {
      const cfg = RARITY_CONFIG[b.n.rarity] || RARITY_CONFIG.Common;
      b.color = cfg.color;
      b.glow = cfg.glow;
      b.rarity = b.n.rarity || 'Common';
      b.isActive = b.n.activity === 'Active';
      b.isCommon = b.rarity === 'Common';
      b.fillActive = cfg.color + 'CC';
      b.fillInactive = cfg.color + '30';
      b.strokeActive = cfg.color + '88';
      b.strokeInactive = cfg.color + '33';
    }

    let frameCount = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      frameCount++;
      const hovId = hovRef.current;

      for (const b of bubbles) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x - b.r < 0 || b.x + b.r > w) b.vx *= -1;
        if (b.y - b.r < 0 || b.y + b.r > h) b.vy *= -1;
        b.x = Math.max(b.r, Math.min(w - b.r, b.x));
        b.y = Math.max(b.r, Math.min(h - b.r, b.y));

        const isHov = hovId === b.n.id;
        const isSel = selectedId === b.n.id;
        const highlight = isHov || isSel;
        const dr = b.r * (isHov ? 2.5 : isSel ? 1.8 : 1);

        // === Common nodes: simple fill only, no stroke/text (perf) ===
        if (b.isCommon && !highlight) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, dr, 0, Math.PI * 2);
          ctx.fillStyle = b.isActive ? b.fillActive : b.fillInactive;
          ctx.fill();
          continue;
        }

        // === Non-common or highlighted: full rendering ===
        ctx.beginPath();
        ctx.arc(b.x, b.y, dr, 0, Math.PI * 2);

        if (highlight) {
          ctx.shadowColor = b.glow;
          ctx.shadowBlur = 25;
          ctx.fillStyle = b.color;
        } else if (dr > 6) {
          ctx.shadowBlur = 0;
          const grad = ctx.createRadialGradient(b.x - dr * 0.3, b.y - dr * 0.3, 0, b.x, b.y, dr);
          grad.addColorStop(0, b.color + (b.isActive ? 'FF' : '60'));
          grad.addColorStop(1, b.color + (b.isActive ? '66' : '15'));
          ctx.fillStyle = grad;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = b.isActive ? b.fillActive : b.fillInactive;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outline ring — rarity-specific
        const strokeColor = b.isActive ? b.strokeActive : b.strokeInactive;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = highlight ? 2.5 : 1.2;

        if (b.rarity === 'Epic') {
          ctx.setLineDash([3, 3]);
        } else if (b.rarity === 'Ancient') {
          ctx.beginPath();
          ctx.arc(b.x, b.y, dr + 3, 0, Math.PI * 2);
          ctx.strokeStyle = b.color + '44';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = highlight ? 2.5 : 1.2;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, dr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Legendary pulsing glow
        if (b.rarity === 'Legendary' && b.isActive) {
          const pulse = Math.sin(frameCount * 0.04 + b.x) * 0.3 + 0.5;
          ctx.beginPath();
          ctx.arc(b.x, b.y, dr + 2, 0, Math.PI * 2);
          ctx.strokeStyle = b.color + Math.round(pulse * 100).toString(16).padStart(2, '0');
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Rare double ring
        if (b.rarity === 'Rare' && dr > 4) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, dr + 2, 0, Math.PI * 2);
          ctx.strokeStyle = b.color + '33';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }

        // Node ID text — only on non-Common nodes large enough to read
        if (dr > 7) {
          const fontSize = Math.max(6, Math.min(dr * 0.55, 12));
          ctx.font = `700 ${fontSize}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = highlight ? '#000' : (b.isActive ? '#ffffffCC' : '#ffffff55');
          ctx.fillText(`#${b.n.id}`, b.x, b.y);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, maxHP, selectedId]);

  const handleMouseMove = useCallback(e => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMp({ x: e.clientX, y: e.clientY });

    let found = null;
    const bs = bubblesRef.current;
    for (let i = bs.length - 1; i >= 0; i--) {
      const b = bs[i];
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy < (b.r + 5) * (b.r + 5)) {
        found = b.n;
        break;
      }
    }
    hovRef.current = found?.id || null;
    setHov(found);
  }, []);

  const handleClick = useCallback(() => {
    if (hovRef.current) {
      const node = bubblesRef.current.find(b => b.n.id === hovRef.current)?.n;
      if (node) onSelect(node);
    }
  }, [onSelect]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', height: '100%',
        cursor: hov ? 'pointer' : 'crosshair',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Tooltip */}
      {hov && (
        <div
          style={{
            position: 'fixed',
            left: mp.x + 16,
            top: mp.y - 12,
            background: '#080e08f2',
            border: `1px solid ${(RARITY_CONFIG[hov.rarity] || RARITY_CONFIG.Common).color}44`,
            borderRadius: 10,
            padding: '12px 16px',
            zIndex: 999,
            pointerEvents: 'none',
            minWidth: 230,
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: `0 8px 32px ${(RARITY_CONFIG[hov.rarity] || RARITY_CONFIG.Common).color}20`,
          }}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <img
              src={NODE_IMAGE_URL(hov.id)}
              alt=""
              style={{
                width: 52, height: 52, borderRadius: 6, objectFit: 'cover',
                border: `1px solid ${(RARITY_CONFIG[hov.rarity] || RARITY_CONFIG.Common).color}44`,
                flexShrink: 0, background: '#0a120a',
              }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  color: (RARITY_CONFIG[hov.rarity] || RARITY_CONFIG.Common).color,
                  fontWeight: 800, fontSize: 16,
                }}>
                  #{hov.id}
                </span>
                <span style={{
                  fontSize: 9, color: '#000',
                  background: (RARITY_CONFIG[hov.rarity] || RARITY_CONFIG.Common).color,
                  padding: '2px 8px', borderRadius: 4, fontWeight: 800,
                }}>
                  {hov.rarity?.toUpperCase()}
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: (STATUS_CONFIG[hov.activity] || STATUS_CONFIG.Inactive).color,
              }}>
                {(STATUS_CONFIG[hov.activity] || STATUS_CONFIG.Inactive).icon}{' '}
                {(STATUS_CONFIG[hov.activity] || STATUS_CONFIG.Inactive).label}
              </span>
            </div>
          </div>
          <div style={{ color: '#aaa', fontSize: 11, lineHeight: 2.1 }}>
            <div>HEXes: <span style={{ color: '#fff', fontWeight: 700 }}>{Number(hov.hexesDecoded || 0).toLocaleString()}</span></div>
            <div>Hashpower: <span style={{ color: '#fff', fontWeight: 700 }}>{Number(hov.hashpower || 0).toLocaleString()}</span></div>
            <div>Distribution: <span style={{ color: '#fff', fontWeight: 700 }}>{formatPct(hov.hexesDistributionRate, 5)}</span></div>
            <div>Owner: <span style={{ color: '#666' }}>{shortenAddr(hov.hackerWalletAddress)}</span></div>
          </div>
          <div style={{
            marginTop: 6, paddingTop: 6, borderTop: '1px solid #ffffff0a',
            fontSize: 9, color: '#555', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Click to view details / GunzScan
          </div>
        </div>
      )}
    </div>
  );
}
