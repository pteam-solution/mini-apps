import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_NAMES,
  clampWinnerCount,
  findDuplicateNames,
  getEligibleNames,
  parseNames,
  validateRound
} from './raffle.js';

const SPEEDS = {
  slow: { label: '느림', interval: 2100, pull: 1250, spin: 0.58 },
  normal: { label: '보통', interval: 1550, pull: 980, spin: 0.82 },
  fast: { label: '빠름', interval: 1050, pull: 760, spin: 1.08 },
  turbo: { label: '터보', interval: 620, pull: 520, spin: 1.42 }
};

const PALETTE = ['#39d8ff', '#8f6bff', '#ff4fb6', '#ffcc4d', '#62f29d', '#ff6b55', '#6a93ff', '#e4ff6a'];

function useArcadeSound(enabled) {
  const audioRef = useRef(null);

  return useCallback(
    (type) => {
      if (!enabled) {
        return;
      }

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          return;
        }

        if (!audioRef.current) {
          audioRef.current = new AudioContext();
        }

        const audio = audioRef.current;
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const now = audio.currentTime;
        const tones = {
          start: [270, 0.2, 0.08],
          pull: [92, 0.28, 0.13],
          hit: [460, 0.05, 0.035],
          win: [720, 0.34, 0.12]
        };
        const [frequency, duration, volume] = tones[type] ?? tones.hit;

        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(type === 'pull' ? 40 : frequency * 1.55, now + duration);
        oscillator.type = type === 'pull' ? 'sawtooth' : 'triangle';
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.04);
      } catch {
        // Sound is optional; visuals should continue when autoplay policies block audio.
      }
    },
    [enabled]
  );
}

function makeParticle(name, index, total, width, height) {
  const shortSide = Math.min(width, height);
  const ring = index % 4;
  const spread = total > 1 ? index / total : 0;
  const angle = spread * Math.PI * 2 + ring * 0.34;
  const radius = shortSide * (0.23 + ring * 0.055) + Math.random() * 18;

  return {
    id: `${index}-${name}-${Math.random().toString(36).slice(2)}`,
    name,
    angle,
    color: PALETTE[index % PALETTE.length],
    radius,
    baseRadius: radius,
    size: Math.max(30, Math.min(48, shortSide * 0.046)),
    speed: (0.32 + Math.random() * 0.18) * (index % 2 === 0 ? 1 : -1),
    wobble: Math.random() * Math.PI * 2,
    status: 'alive',
    pullStart: 0,
    pullDuration: 900,
    fromX: 0,
    fromY: 0,
    x: 0,
    y: 0
  };
}

function drawLabel(ctx, text, x, y, size, fill = '#ffffff') {
  ctx.save();
  ctx.font = `900 ${Math.max(13, Math.min(18, size * 0.36))}px Inter, "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.64)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function VortexArena({ entrants, winners, mode, runKey, speed, winnerCount, onComplete, playSound }) {
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const playSoundRef = useRef(playSound);
  const particlesRef = useRef([]);
  const entrantsKey = entrants.join('|');
  const winnersKey = winners.join('|');

  useEffect(() => {
    onCompleteRef.current = onComplete;
    playSoundRef.current = playSound;
  }, [onComplete, playSound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    const speedConfig = SPEEDS[speed];
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let startedAt = performance.now();
    let lastElimination = startedAt + 900;
    let completed = false;
    let vortexPulse = 0;
    let eliminatedNames = [];
    const stars = Array.from({ length: 170 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.65 + 0.2,
      drift: Math.random() * 0.35 + 0.12
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const seed = mode === 'complete' && winners.length > 0 ? winners : entrants;
    particlesRef.current = seed.slice(0, 36).map((name, index) => makeParticle(name, index, seed.length, width, height));

    if (mode === 'running') {
      playSoundRef.current('start');
    }

    const pickElimination = (now) => {
      const alive = particlesRef.current.filter((particle) => particle.status === 'alive');
      if (alive.length <= winnerCount) {
        return;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const weighted = alive.map((particle) => {
        const gatePull = 1 + Math.max(0, Math.cos(particle.angle + now * 0.0012)) * 1.8;
        const innerRisk = 1 + Math.max(0, 1 - particle.radius / Math.max(width, height)) * 1.2;
        return { particle, weight: gatePull + innerRisk + Math.random() * 1.4 };
      });
      const victim = weighted.sort((a, b) => b.weight - a.weight)[0]?.particle;

      if (!victim) {
        return;
      }

      victim.status = 'eliminating';
      victim.pullStart = now;
      victim.pullDuration = speedConfig.pull;
      victim.fromX = victim.x || centerX + Math.cos(victim.angle) * victim.radius;
      victim.fromY = victim.y || centerY + Math.sin(victim.angle) * victim.radius;
      eliminatedNames = [victim.name, ...eliminatedNames];
      vortexPulse = 1;
      playSoundRef.current('pull');
    };

    const completeRound = () => {
      if (completed) {
        return;
      }

      completed = true;
      const finalWinners = particlesRef.current
        .filter((particle) => particle.status === 'alive')
        .slice(0, winnerCount)
        .map((particle) => particle.name);

      particlesRef.current.forEach((particle, index) => {
        if (finalWinners.includes(particle.name)) {
          particle.status = 'winner';
          particle.baseRadius = Math.min(width, height) * (0.16 + index * 0.006);
          particle.color = '#ffd45f';
        }
      });

      playSoundRef.current('win');
      window.setTimeout(() => onCompleteRef.current(finalWinners, eliminatedNames), 760);
    };

    const drawBackground = (now, centerX, centerY) => {
      const bg = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.72);
      bg.addColorStop(0, '#10172a');
      bg.addColorStop(0.42, '#080b18');
      bg.addColorStop(1, '#03040a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        const x = ((star.x * width + now * star.drift * 0.012) % width) || 0;
        const y = star.y * height;
        ctx.globalAlpha = star.a + Math.sin(now * 0.002 + star.x * 8) * 0.2;
        ctx.fillStyle = star.r > 1.3 ? '#9cf5ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawVortex = (now, centerX, centerY) => {
      const maxRadius = Math.min(width, height) * 0.42;
      const spin = now * 0.0015 * speedConfig.spin;

      for (let arm = 0; arm < 4; arm += 1) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(spin + arm * (Math.PI / 2));
        const gradient = ctx.createLinearGradient(0, 0, maxRadius, 0);
        gradient.addColorStop(0, 'rgba(255, 208, 91, 0.0)');
        gradient.addColorStop(0.22, 'rgba(255, 70, 120, 0.18)');
        gradient.addColorStop(1, 'rgba(57, 216, 255, 0.0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 18;
        ctx.beginPath();
        for (let t = 0; t < 5.3; t += 0.06) {
          const r = (t / 5.3) * maxRadius;
          const x = Math.cos(t * 1.7) * r;
          const y = Math.sin(t * 1.7) * r * 0.42;
          if (t === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      for (let index = 0; index < 5; index += 1) {
        ctx.strokeStyle = `rgba(${index % 2 ? '255, 78, 132' : '56, 211, 255'}, ${0.22 - index * 0.028})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, maxRadius * (0.38 + index * 0.16), maxRadius * (0.2 + index * 0.095), spin * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      const pulse = 1 + vortexPulse * 0.4 + Math.sin(now * 0.006) * 0.05;
      const core = ctx.createRadialGradient(centerX, centerY, 6, centerX, centerY, maxRadius * 0.28 * pulse);
      core.addColorStop(0, '#000000');
      core.addColorStop(0.38, '#02030a');
      core.addColorStop(0.62, 'rgba(255, 37, 91, 0.64)');
      core.addColorStop(1, 'rgba(57, 216, 255, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.28 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.12, 0, Math.PI * 2);
      ctx.fill();
      vortexPulse = Math.max(0, vortexPulse - 0.035);
    };

    const drawParticle = (particle, now, centerX, centerY) => {
      const time = (now - startedAt) / 1000;
      const isWinner = particle.status === 'winner';
      const isEliminating = particle.status === 'eliminating';

      if (isEliminating) {
        const progress = Math.min(1, (now - particle.pullStart) / particle.pullDuration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const swirl = (1 - progress) * 74;
        particle.x = particle.fromX * (1 - ease) + centerX * ease + Math.sin(progress * Math.PI * 5) * swirl;
        particle.y = particle.fromY * (1 - ease) + centerY * ease + Math.cos(progress * Math.PI * 4) * swirl * 0.35;
        particle.size = Math.max(2, particle.size * (1 - progress * 0.085));

        if (progress >= 1) {
          particle.status = 'gone';
          playSoundRef.current('hit');
          const aliveCount = particlesRef.current.filter((item) => item.status === 'alive').length;
          if (aliveCount <= winnerCount) {
            completeRound();
          }
          return;
        }
      } else if (particle.status === 'gone') {
        return;
      } else {
        const orbitSpeed = particle.speed * speedConfig.spin * (isWinner ? 0.52 : 1);
        particle.angle += orbitSpeed * 0.018;
        particle.wobble += 0.032 * speedConfig.spin;
        const tension = mode === 'running' ? Math.max(0.72, 1 - time * 0.012) : 1;
        const wobbleRadius = Math.sin(particle.wobble) * (isWinner ? 4 : 18);
        const ringY = isWinner ? 0.46 : 0.66;
        const radius = (isWinner ? Math.min(width, height) * 0.22 : particle.baseRadius * tension) + wobbleRadius;
        particle.radius = radius;
        particle.x = centerX + Math.cos(particle.angle) * radius;
        particle.y = centerY + Math.sin(particle.angle) * radius * ringY;
      }

      const glowSize = particle.size * (isWinner ? 2.6 : isEliminating ? 3 : 2);
      const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glowSize);
      glow.addColorStop(0, isWinner ? 'rgba(255, 233, 148, 0.85)' : particle.color);
      glow.addColorStop(0.36, isWinner ? 'rgba(255, 190, 57, 0.55)' : `${particle.color}99`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = isWinner ? '#ffd45f' : particle.color;
      ctx.shadowBlur = isWinner ? 32 : 20;
      const body = ctx.createRadialGradient(
        particle.x - particle.size * 0.22,
        particle.y - particle.size * 0.26,
        2,
        particle.x,
        particle.y,
        particle.size
      );
      body.addColorStop(0, '#ffffff');
      body.addColorStop(0.22, isWinner ? '#ffe899' : particle.color);
      body.addColorStop(1, isWinner ? '#c67913' : '#14233d');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (isEliminating ? 0.84 : 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawLabel(ctx, particle.name, particle.x, particle.y - particle.size * 1.05, particle.size, isWinner ? '#2c1700' : '#ffffff');
    };

    const animate = (now) => {
      const centerX = width / 2;
      const centerY = height / 2;

      drawBackground(now, centerX, centerY);
      drawVortex(now, centerX, centerY);

      if (mode === 'running' && !completed && now - lastElimination > speedConfig.interval) {
        lastElimination = now;
        pickElimination(now);
      }

      particlesRef.current
        .slice()
        .sort((a, b) => a.radius - b.radius)
        .forEach((particle) => drawParticle(particle, now, centerX, centerY));

      if (mode !== 'running' && mode !== 'complete') {
        const hint = '궤도가 무너지면 운명이 갈립니다';
        ctx.save();
        ctx.font = '800 15px Inter, "Noto Sans KR", sans-serif';
        ctx.fillStyle = 'rgba(235, 243, 255, 0.68)';
        ctx.textAlign = 'center';
        ctx.fillText(hint, centerX, height - 28);
        ctx.restore();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [entrantsKey, mode, runKey, speed, winnerCount, winnersKey]);

  return <canvas ref={canvasRef} className="vortex-canvas" aria-label="Gravity Vortex raffle arena" />;
}

function Stepper({ value, min, max, disabled, onChange }) {
  return (
    <div className="stepper">
      <button type="button" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label="선정 인원 줄이기">
        -
      </button>
      <strong>{value}</strong>
      <button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label="선정 인원 늘리기">
        +
      </button>
    </div>
  );
}

export default function App() {
  const [rawNames, setRawNames] = useState(DEFAULT_NAMES);
  const [winnerCount, setWinnerCount] = useState(3);
  const [speed, setSpeed] = useState('normal');
  const [allowRepeatWinners, setAllowRepeatWinners] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mode, setMode] = useState('idle');
  const [runKey, setRunKey] = useState(0);
  const [currentEntrants, setCurrentEntrants] = useState([]);
  const [previousWinners, setPreviousWinners] = useState([]);
  const [winners, setWinners] = useState([]);
  const [eliminated, setEliminated] = useState([]);
  const [message, setMessage] = useState('대기');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const names = useMemo(() => parseNames(rawNames), [rawNames]);
  const duplicates = useMemo(() => findDuplicateNames(names), [names]);
  const eligibleNames = useMemo(
    () => getEligibleNames(names, previousWinners, allowRepeatWinners),
    [allowRepeatWinners, names, previousWinners]
  );
  const selectedWinnerCount = clampWinnerCount(winnerCount, Math.max(eligibleNames.length - 1, 1));
  const playSound = useArcadeSound(soundEnabled);
  const isRunning = mode === 'running';

  useEffect(() => {
    setWinnerCount((count) => clampWinnerCount(count, Math.max(eligibleNames.length - 1, 1)));
  }, [eligibleNames.length]);

  const startRound = () => {
    const validation = validateRound(eligibleNames, selectedWinnerCount);
    if (validation) {
      setError(validation);
      return;
    }

    setCurrentEntrants(eligibleNames);
    setWinners([]);
    setEliminated([]);
    setMessage('궤도 붕괴');
    setError('');
    setCopied(false);
    setMode('running');
    setRunKey((key) => key + 1);
  };

  const resetAll = () => {
    setRawNames('');
    setWinnerCount(1);
    setCurrentEntrants([]);
    setPreviousWinners([]);
    setWinners([]);
    setEliminated([]);
    setMessage('대기');
    setError('');
    setCopied(false);
    setMode('idle');
    setRunKey((key) => key + 1);
  };

  const completeRound = useCallback((finalWinners, finalEliminated) => {
    setWinners(finalWinners);
    setEliminated(finalEliminated.slice(0, 10));
    setPreviousWinners((values) => Array.from(new Set([...values, ...finalWinners])));
    setMessage('선정 완료');
    setMode('complete');
  }, []);

  const copyResults = async () => {
    if (winners.length === 0) {
      return;
    }

    await navigator.clipboard.writeText(winners.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const helperText =
    duplicates.length > 0 ? `중복 이름: ${duplicates.join(', ')}` : '줄바꿈 또는 쉼표로 후보를 나눌 수 있습니다.';

  return (
    <main className="shell">
      <section className="control-panel" aria-label="추첨 설정">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!isRunning) {
              startRound();
            }
          }}
        >
          <label className="field">
            <span>후보</span>
            <textarea
              value={rawNames}
              onChange={(event) => {
                setRawNames(event.target.value);
                setError('');
              }}
              rows={9}
              disabled={isRunning}
              placeholder="김민준, 이서연, 박지후"
            />
          </label>
          <p className={duplicates.length > 0 ? 'helper warning' : 'helper'}>{helperText}</p>

          <div className="control-row">
            <span>선정</span>
            <Stepper
              value={selectedWinnerCount}
              min={1}
              max={Math.max(eligibleNames.length - 1, 1)}
              disabled={isRunning}
              onChange={setWinnerCount}
            />
          </div>

          <div className="speed-group">
            <span>속도</span>
            <div className="speed-options">
              {Object.entries(SPEEDS).map(([key, option]) => (
                <button
                  type="button"
                  key={key}
                  disabled={isRunning}
                  className={speed === key ? 'selected' : ''}
                  onClick={() => setSpeed(key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="toggle-grid">
            <label>
              <input
                type="checkbox"
                checked={allowRepeatWinners}
                disabled={isRunning}
                onChange={(event) => setAllowRepeatWinners(event.target.checked)}
              />
              <span>중복당첨 허용</span>
            </label>
            <label>
              <input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
              <span>효과음</span>
            </label>
          </div>

          {error && (
            <div className="notice" role="alert">
              {error}
            </div>
          )}

          <div className="actions">
            <button className="primary-button" type="submit" disabled={isRunning}>
              {isRunning ? '진행 중' : '시작'}
            </button>
            <button type="button" disabled={isRunning || eligibleNames.length < 2} onClick={startRound}>
              다시하기
            </button>
            <button type="button" onClick={resetAll}>
              리셋
            </button>
            <button type="button" disabled={winners.length === 0} onClick={copyResults}>
              {copied ? '복사 완료' : '결과 복사'}
            </button>
          </div>
        </form>

        <div className="stats" aria-label="라운드 현황">
          <div>
            <span>후보</span>
            <strong>{eligibleNames.length}</strong>
          </div>
          <div>
            <span>선정</span>
            <strong>{winners.length || selectedWinnerCount}</strong>
          </div>
          <div>
            <span>상태</span>
            <strong>{message}</strong>
          </div>
        </div>
      </section>

      <section className="arena-panel" aria-live="polite">
        <div className="status-bar">
          <span>{mode === 'running' ? 'Gravity Lock' : mode === 'complete' ? 'Glory Orbit' : 'Ready'}</span>
          <strong>{mode === 'running' ? '운명의 궤도' : mode === 'complete' ? '최종 생존' : '소용돌이 대기'}</strong>
        </div>

        <VortexArena
          entrants={mode === 'idle' ? eligibleNames : currentEntrants}
          winners={winners}
          mode={mode}
          runKey={runKey}
          speed={speed}
          winnerCount={selectedWinnerCount}
          onComplete={completeRound}
          playSound={playSound}
        />

        <div className="result-dock">
          <div>
            <strong>선정</strong>
            <span>{winners.length > 0 ? winners.join(' · ') : '아직 궤도가 닫히지 않았습니다'}</span>
          </div>
          <div>
            <strong>탈락</strong>
            <span>{eliminated.length > 0 ? eliminated.slice(0, 6).join(' · ') : 'No collapse yet'}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
