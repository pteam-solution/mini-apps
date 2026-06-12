import React, { useMemo, useState } from 'react';
import {
  assignTeams,
  findDuplicateNames,
  parseNames,
  shuffleNames,
  validateTeamRequest
} from './teamUtils.js';

const EXAMPLE_TEXT = '김철수, 이영희 박민수\n최지훈';
const TEAM_COUNT_OPTIONS = Array.from({ length: 9 }, (_, index) => index + 2);
const ANIMATION_SPEEDS = {
  1: { label: '매우 느림', scale: 2.05 },
  2: { label: '느림', scale: 1.6 },
  3: { label: '보통', scale: 1.25 },
  4: { label: '빠름', scale: 0.9 },
  5: { label: '매우 빠름', scale: 0.68 }
};

function PeopleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
      <path d="M8.5 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm7.25-.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM3.25 18.7c0-3.12 2.76-5.2 6.25-5.2s6.25 2.08 6.25 5.2c0 .58-.47 1.05-1.05 1.05H4.3c-.58 0-1.05-.47-1.05-1.05Zm12.4.55h3.55c.55 0 1-.45 1-1 0-2.3-1.9-4-4.48-4.13.83.78 1.37 1.82 1.37 3.1 0 .72-.2 1.4-.44 1.98Z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="button-icon">
      <path d="M17.6 4.25 21 7.65l-3.4 3.4-1.28-1.28 1.2-1.2h-1.4c-2.12 0-3.16 1.04-4.58 3.1l-.72 1.04c-1.48 2.13-3.02 3.54-6 3.54H3v-1.9h1.82c2.08 0 3.1-1 4.52-3.06l.72-1.04c1.5-2.15 3.05-3.55 6.06-3.55h1.38l-1.18-1.17 1.28-1.28Zm-12.78.5c2.98 0 4.52 1.4 6 3.54l.18.26-1.14 1.63-.42-.61C8.32 7.96 7.2 6.65 4.82 6.65H3v-1.9h1.82Zm12.78 9.2L21 17.35l-3.4 3.4-1.28-1.28 1.2-1.2h-1.4c-2.28 0-3.78-.8-5.3-2.85l1.16-1.66c1.3 1.9 2.35 2.52 4.14 2.52h1.38l-1.18-1.17 1.28-1.16Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="button-icon">
      <path d="M12 5.2a6.8 6.8 0 1 1-6.28 9.4l1.75-.74A4.9 4.9 0 1 0 8.3 8.3l2.18 2.18H4.65V4.65l1.99 1.99A6.78 6.78 0 0 1 12 5.2Z" />
    </svg>
  );
}

function TeamCard({ animationScale, team }) {
  const teamDelay = (team.id - 1) * 130 * animationScale;

  return (
    <article
      className="team-card"
      style={{
        '--card-delay': `${teamDelay}ms`,
        '--card-duration': `${460 * animationScale}ms`
      }}
    >
      <header className="team-card__header">
        <div className="team-card__title">
          <PeopleIcon />
          <h3>{team.name}</h3>
        </div>
        <strong>{team.members.length}명</strong>
      </header>
      <ol className="member-list">
        {team.members.map((member, index) => (
          <li
            key={`${team.id}-${index}-${member}`}
            style={{
              '--member-delay': `${teamDelay + 260 * animationScale + index * 190 * animationScale}ms`,
              '--member-duration': `${560 * animationScale}ms`
            }}
          >
            <span>{member}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function App() {
  const [rawNames, setRawNames] = useState(EXAMPLE_TEXT);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultVersion, setResultVersion] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(3);

  const parsedNames = useMemo(() => parseNames(rawNames), [rawNames]);
  const duplicateNames = useMemo(() => findDuplicateNames(parsedNames), [parsedNames]);
  const animationScale = ANIMATION_SPEEDS[animationSpeed].scale;
  const maxMembersPerTeam = teams.length > 0 ? Math.ceil(parsedNames.length / Number(teamCount)) : 0;
  const successDelay =
    teams.length > 0
      ? ((teams.length - 1) * 130 + 260 + Math.max(maxMembersPerTeam - 1, 0) * 190 + 480) * animationScale
      : 0;
  const buildTeams = () => {
    const validationMessage = validateTeamRequest(parsedNames, Number(teamCount));

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setTeams([]);
      return;
    }

    const shuffledNames = shuffleNames(parsedNames);
    setTeams(assignTeams(shuffledNames, Number(teamCount)));
    setResultVersion((version) => version + 1);
    setErrorMessage('');
  };

  const handleReset = () => {
    setRawNames('');
    setTeamCount(2);
    setTeams([]);
    setErrorMessage('');
    setResultVersion(0);
  };

  const handleAnimationSpeedChange = (event) => {
    setAnimationSpeed(Number(event.target.value));

    if (teams.length > 0) {
      setResultVersion((version) => version + 1);
    }
  };

  const helperMessage =
    duplicateNames.length > 0
      ? `중복 이름이 있습니다: ${duplicateNames.join(', ')}`
      : '줄바꿈, 쉼표, 공백을 모두 이름 구분자로 사용할 수 있습니다.';

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <PeopleIcon />
          <div>
            <h1>조 편성 도구</h1>
            <p>간편하고 공정한 팀 구성</p>
          </div>
        </div>
        <div className="summary">
          <span>
            현재 인원 <strong>{parsedNames.length}명</strong>
          </span>
          <span>
            생성된 조 <strong>{teams.length}개</strong>
          </span>
        </div>
      </header>

      <section className="workspace" aria-label="조 편성 작업 영역">
        <form
          className="input-panel"
          onSubmit={(event) => {
            event.preventDefault();
            buildTeams();
          }}
        >
          <div className="section-heading">
            <div>
              <h2>1. 이름 입력</h2>
              <p>최대 20명까지 입력할 수 있습니다.</p>
            </div>
            <span>{parsedNames.length}명 입력됨</span>
          </div>

          <label className="field">
            <span className="sr-only">이름 목록</span>
            <textarea
              value={rawNames}
              onChange={(event) => {
                setRawNames(event.target.value);
                setErrorMessage('');
              }}
              placeholder="예: 김철수, 이영희 박민수&#10;최지훈"
              rows={12}
            />
          </label>

          <p className={duplicateNames.length > 0 ? 'notice notice--warning' : 'field-help'}>
            {helperMessage}
          </p>

          <div className="section-heading section-heading--compact">
            <div>
              <h2>2. 조 개수 선택</h2>
              <p>2개부터 10개까지 선택하세요.</p>
            </div>
          </div>

          <label className="field">
            <span className="sr-only">조 개수</span>
            <select value={teamCount} onChange={(event) => setTeamCount(Number(event.target.value))}>
              {TEAM_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}개
                </option>
              ))}
            </select>
          </label>

          <div className="section-heading section-heading--compact">
            <div>
              <h2>3. 효과 속도</h2>
              <p>이름이 떠오르는 속도를 조절하세요.</p>
            </div>
            <span>{ANIMATION_SPEEDS[animationSpeed].label}</span>
          </div>

          <label className="speed-control">
            <span className="sr-only">효과 속도</span>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={animationSpeed}
              onChange={handleAnimationSpeedChange}
            />
            <span className="speed-control__labels" aria-hidden="true">
              <span>느림</span>
              <span>빠름</span>
            </span>
          </label>

          {errorMessage && (
            <div className="notice notice--error" role="alert">
              <strong>확인해 주세요</strong>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="actions">
            <button type="submit" className="primary-button">
              <PeopleIcon />
              조 편성하기
            </button>
            <div className="secondary-actions">
              <button type="button" onClick={buildTeams} disabled={teams.length === 0}>
                <ShuffleIcon />
                다시 섞기
              </button>
              <button type="button" onClick={handleReset}>
                <ResetIcon />
                초기화
              </button>
            </div>
          </div>
        </form>

        <section className="result-panel" aria-live="polite">
          <div className="result-heading">
            <div>
              <h2>편성 결과</h2>
              <p>
                {teams.length > 0
                ? `총 ${parsedNames.length}명 / ${teams.length}개 조`
                  : '조 편성하기 버튼을 누르면 결과가 표시됩니다.'}
              </p>
            </div>
          </div>

          {teams.length > 0 ? (
            <>
              <div className="team-grid">
                {teams.map((team) => (
                  <TeamCard
                    key={`${resultVersion}-${animationSpeed}-${team.id}`}
                    animationScale={animationScale}
                    team={team}
                  />
                ))}
              </div>
              <div
                className="success-message"
                style={{
                  '--success-delay': `${successDelay}ms`,
                  '--success-duration': `${440 * animationScale}ms`
                }}
              >
                <strong>고르게 편성되었습니다!</strong>
                <span>각 조의 인원 수 차이가 1명 이하가 되도록 배정했습니다.</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <PeopleIcon />
              <strong>아직 결과가 없습니다</strong>
              <span>이름과 조 개수를 확인한 뒤 조 편성을 시작하세요.</span>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
