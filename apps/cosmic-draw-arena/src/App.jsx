import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createCards,
  findDuplicateNames,
  getEligibleNames,
  parseNames,
  pickRandom,
  validateDraw
} from './teamUtils.js';

const EXAMPLE_NAMES = '김민준, 이서연, 박지후\n최윤아, 정도윤, 한지민\n오준서, 강하은';

const SPEED_OPTIONS = {
  slow: {
    label: '느림',
    flashTicks: 16,
    flashInterval: 145,
    lockDelay: 520,
    vanishDelay: 760,
    nextDelay: 500,
    finaleDelay: 780
  },
  normal: {
    label: '보통',
    flashTicks: 12,
    flashInterval: 95,
    lockDelay: 360,
    vanishDelay: 560,
    nextDelay: 330,
    finaleDelay: 560
  },
  fast: {
    label: '빠름',
    flashTicks: 8,
    flashInterval: 68,
    lockDelay: 250,
    vanishDelay: 390,
    nextDelay: 220,
    finaleDelay: 380
  },
  turbo: {
    label: '초고속',
    flashTicks: 5,
    flashInterval: 42,
    lockDelay: 150,
    vanishDelay: 260,
    nextDelay: 120,
    finaleDelay: 240
  }
};

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
      <path d="M12 2.4 14.45 9 21.2 12l-6.75 3L12 21.6 9.55 15 2.8 12l6.75-3L12 2.4Zm7.25 1.3.82 2.2 2.23.85-2.23.85-.82 2.2-.82-2.2-2.23-.85 2.23-.85.82-2.2ZM4.65 4.9l.64 1.7 1.71.65-1.71.65-.64 1.7-.64-1.7-1.71-.65 1.71-.65.64-1.7Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="button-icon">
      <path d="M7.2 4.6c0-1.05 1.15-1.7 2.05-1.15l10.4 6.4c.85.53.85 1.77 0 2.3l-10.4 6.4c-.9.55-2.05-.1-2.05-1.15V4.6Z" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="button-icon">
      <path d="M12 4.15a7.9 7.9 0 1 1-7.2 11.14l2.08-.86A5.65 5.65 0 1 0 7.92 8l2.27 2.27H3.95V4.03l2.33 2.33A7.86 7.86 0 0 1 12 4.15Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="button-icon">
      <path d="M6.2 5 5 6.2 10.8 12 5 17.8 6.2 19 12 13.2 17.8 19 19 17.8 13.2 12 19 6.2 17.8 5 12 10.8 6.2 5Z" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="crown-icon">
      <path d="M4 8.1 8.35 12 12 5.3 15.65 12 20 8.1l-1.55 9.35H5.55L4 8.1Zm1.75 11.15h12.5v1.85H5.75v-1.85Z" />
    </svg>
  );
}

function TimerLayer({ runKey, isRunning }) {
  return (
    <div className="scan-ring" aria-hidden="true" key={`${runKey}-${isRunning}`}>
      <span />
      <span />
      <span />
    </div>
  );
}

function Fireworks({ burstKey }) {
  if (burstKey === 0) {
    return null;
  }

  return (
    <div className="fireworks" aria-hidden="true" key={burstKey}>
      <span className="firework firework--one" />
      <span className="firework firework--two" />
      <span className="firework firework--three" />
    </div>
  );
}

function ParticipantCard({ card, isFlashing }) {
  const statusLabel = {
    alive: '생존',
    eliminating: '탈락',
    gone: '탈락',
    winner: '최후의 1인'
  }[card.status];

  return (
    <article
      className={[
        'participant-card',
        `participant-card--${card.status}`,
        isFlashing ? 'participant-card--flash' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="participant-card__shine" />
      <div className="participant-card__top">
        <span>{statusLabel}</span>
        {card.status === 'winner' ? <CrownIcon /> : <i aria-hidden="true" />}
      </div>
      <strong>{card.name}</strong>
      <div className="card-fragments" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="elimination-mark" aria-hidden="true">
        ×
      </div>
    </article>
  );
}

function App() {
  const [rawNames, setRawNames] = useState(EXAMPLE_NAMES);
  const [speedKey, setSpeedKey] = useState('normal');
  const [allowRepeatWinners, setAllowRepeatWinners] = useState(false);
  const [cards, setCards] = useState([]);
  const [drawState, setDrawState] = useState('idle');
  const [winnerName, setWinnerName] = useState('');
  const [previousWinners, setPreviousWinners] = useState([]);
  const [eliminatedNames, setEliminatedNames] = useState([]);
  const [flashId, setFlashId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [runKey, setRunKey] = useState(0);
  const [shakeArena, setShakeArena] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const timersRef = useRef([]);
  const parsedNames = useMemo(() => parseNames(rawNames), [rawNames]);
  const duplicateNames = useMemo(() => findDuplicateNames(parsedNames), [parsedNames]);
  const speed = SPEED_OPTIONS[speedKey];
  const isRunning = drawState === 'running';
  const remainingCount = cards.filter((card) => card.status !== 'gone').length;
  const eligibleNames = useMemo(
    () => getEligibleNames(parsedNames, previousWinners, allowRepeatWinners),
    [allowRepeatWinners, parsedNames, previousWinners]
  );

  const addTimer = (callback, delay) => {
    const timerId = window.setTimeout(callback, delay);
    timersRef.current.push(timerId);
    return timerId;
  };

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const declareWinner = (winnerCard) => {
    addTimer(() => {
      setCards((currentCards) =>
        currentCards.map((card) => (card.id === winnerCard.id ? { ...card, status: 'winner' } : card))
      );
      setWinnerName(winnerCard.name);
      setPreviousWinners((currentWinners) =>
        currentWinners.includes(winnerCard.name) ? currentWinners : [...currentWinners, winnerCard.name]
      );
      setDrawState('complete');
      setFlashId('');
      setBurstKey((key) => key + 1);
    }, speed.finaleDelay);
  };

  const runEliminationRound = (aliveCards) => {
    if (aliveCards.length === 1) {
      declareWinner(aliveCards[0]);
      return;
    }

    let tick = 0;

    const flashNext = () => {
      const flashingCard = pickRandom(aliveCards);
      setFlashId(flashingCard.id);
      tick += 1;

      if (tick < speed.flashTicks) {
        addTimer(flashNext, speed.flashInterval);
        return;
      }

      addTimer(() => {
        const eliminatedCard = pickRandom(aliveCards);
        setFlashId(eliminatedCard.id);
        setShakeArena(true);
        setCards((currentCards) =>
          currentCards.map((card) =>
            card.id === eliminatedCard.id ? { ...card, status: 'eliminating' } : card
          )
        );

        addTimer(() => {
          setCards((currentCards) =>
            currentCards.map((card) => (card.id === eliminatedCard.id ? { ...card, status: 'gone' } : card))
          );
          setEliminatedNames((names) => [eliminatedCard.name, ...names].slice(0, 8));
          setShakeArena(false);
          setFlashId('');

          const nextAliveCards = aliveCards.filter((card) => card.id !== eliminatedCard.id);
          addTimer(() => runEliminationRound(nextAliveCards), speed.nextDelay);
        }, speed.vanishDelay);
      }, speed.lockDelay);
    };

    flashNext();
  };

  const startDraw = () => {
    const baseValidationMessage = validateDraw(parsedNames);

    if (baseValidationMessage) {
      setErrorMessage(baseValidationMessage);
      return;
    }

    const nextEligibleNames = getEligibleNames(parsedNames, previousWinners, allowRepeatWinners);
    const eligibleValidationMessage = validateDraw(nextEligibleNames);

    if (eligibleValidationMessage) {
      setErrorMessage('남은 후보가 2명 미만입니다. 중복당첨 허용을 켜거나 리셋해 주세요.');
      return;
    }

    clearTimers();
    const nextCards = createCards(nextEligibleNames);
    setCards(nextCards);
    setDrawState('running');
    setWinnerName('');
    setEliminatedNames([]);
    setFlashId('');
    setErrorMessage('');
    setShakeArena(false);
    setBurstKey(0);
    setRunKey((key) => key + 1);
    addTimer(() => runEliminationRound(nextCards), 420);
  };

  const resetAll = () => {
    clearTimers();
    setRawNames('');
    setCards([]);
    setDrawState('idle');
    setWinnerName('');
    setPreviousWinners([]);
    setEliminatedNames([]);
    setFlashId('');
    setErrorMessage('');
    setShakeArena(false);
    setBurstKey(0);
    setRunKey((key) => key + 1);
  };

  const helperMessage =
    duplicateNames.length > 0
      ? `같은 이름이 있어요: ${duplicateNames.join(', ')}`
      : '줄바꿈 또는 쉼표로 이름을 구분할 수 있어요.';

  return (
    <main className="app-shell">
      <div className="stars stars--near" aria-hidden="true" />
      <div className="stars stars--far" aria-hidden="true" />
      <Fireworks burstKey={burstKey} />

      <section className="control-panel" aria-label="추첨 설정">
        <header className="brand">
          <div className="brand-mark">
            <SparkleIcon />
          </div>
          <div>
            <h1>우주 추첨 아레나</h1>
            <p>한 명씩 탈락하고 최후의 1인을 남깁니다.</p>
          </div>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!isRunning) {
              startDraw();
            }
          }}
        >
          <label className="field">
            <span>이름 입력</span>
            <textarea
              value={rawNames}
              onChange={(event) => {
                setRawNames(event.target.value);
                setErrorMessage('');
              }}
              placeholder={'김민준, 이서연, 박지후\n최윤아, 정도윤'}
              rows={9}
              disabled={isRunning}
            />
          </label>

          <p className={duplicateNames.length > 0 ? 'helper helper--warning' : 'helper'}>{helperMessage}</p>

          <div className="speed-group" aria-label="속도">
            <span>속도</span>
            <div className="speed-options">
              {Object.entries(SPEED_OPTIONS).map(([key, option]) => (
                <button
                  type="button"
                  key={key}
                  className={speedKey === key ? 'is-selected' : ''}
                  onClick={() => setSpeedKey(key)}
                  disabled={isRunning}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="repeat-toggle">
            <input
              type="checkbox"
              checked={allowRepeatWinners}
              onChange={(event) => setAllowRepeatWinners(event.target.checked)}
              disabled={isRunning}
            />
            <span>중복당첨 허용</span>
          </label>

          {errorMessage && (
            <div className="notice" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="actions">
            <button type="submit" className="primary-button" disabled={isRunning}>
              <PlayIcon />
              {isRunning ? '추첨 중' : '추첨 시작'}
            </button>
            <button type="button" onClick={startDraw} disabled={isRunning || parsedNames.length < 2}>
              <ReplayIcon />
              다시하기
            </button>
            <button type="button" onClick={resetAll}>
              <ResetIcon />
              리셋
            </button>
          </div>
        </form>

        <div className="stats" aria-label="추첨 현황">
          <div>
            <span>입력</span>
            <strong>{parsedNames.length}</strong>
          </div>
          <div>
            <span>후보</span>
            <strong>{eligibleNames.length}</strong>
          </div>
          <div>
            <span>이전 우승</span>
            <strong>{previousWinners.length}</strong>
          </div>
        </div>
      </section>

      <section className={['arena', shakeArena ? 'arena--shake' : ''].filter(Boolean).join(' ')} aria-live="polite">
        <TimerLayer runKey={runKey} isRunning={isRunning} />
        <header className="arena-header">
          <div>
            <span>생존자 {remainingCount}명</span>
            <h2>{winnerName ? `${winnerName} 우승` : isRunning ? '랜덤 카드 점멸 중' : '추첨 대기 중'}</h2>
          </div>
          <div className="stage-status">
            {isRunning ? '탈락 진행' : winnerName ? '최후의 1인' : '준비 완료'}
          </div>
        </header>

        {cards.length > 0 ? (
          <div className="card-grid">
            {cards.map((card) => (
              <ParticipantCard key={card.id} card={card} isFlashing={flashId === card.id && isRunning} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <SparkleIcon />
            <strong>이름을 입력하고 추첨 시작을 눌러주세요.</strong>
            <span>카드가 하나씩 탈락하고 마지막 카드에 왕관이 올라갑니다.</span>
          </div>
        )}

        <aside className="elimination-log" aria-label="탈락 기록">
          <strong>탈락</strong>
          {eliminatedNames.length > 0 ? (
            <ol>
              {eliminatedNames.map((name, index) => (
                <li key={`${name}-${index}`}>{name}</li>
              ))}
            </ol>
          ) : (
            <span>아직 탈락자가 없습니다.</span>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;
