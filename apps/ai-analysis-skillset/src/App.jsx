import { useMemo, useState } from 'react';

const steps = [
  {
    id: '01',
    title: 'Concept Map',
    question: '이게 뭐야?',
    phase: '이해',
    accent: '#0f766e',
    description: '생소한 기업, 기술, 시장을 처음 만났을 때 전체 지형과 핵심 개념을 빠르게 잡습니다.',
    output: '개념 지도, 핵심 용어, 이해관계자, 시장 맥락',
    useCase: '첫 리서치, 회의 전 배경 파악, 신규 시장 온보딩',
    prompt: '다음 주제를 처음 접하는 기획자에게 설명해줘. 핵심 개념, 이해관계자, 시장 맥락, 관련 용어를 Concept Map 형태로 구조화해줘.',
    link: 'https://github.com/juree85-netizen/my-prompts/blob/main/concept-map.md'
  },
  {
    id: '02',
    title: 'Brand House',
    question: '이 기업의 포지셔닝은?',
    phase: '포지셔닝',
    accent: '#b45309',
    description: '경쟁 구도와 핵심 메시지를 한눈에 정리해 브랜드의 위치와 차별화 포인트를 봅니다.',
    output: '타깃, 약속, 근거, 톤앤매너, 경쟁 대비 메시지',
    useCase: '경쟁사 분석, 제안서 메시지 정리, 브랜드 전략 리뷰',
    prompt: '다음 기업을 Brand House 관점으로 분석해줘. 타깃 고객, 핵심 약속, 차별화 근거, 메시지 톤, 경쟁 대비 포지션을 정리해줘.',
    link: 'https://github.com/juree85-netizen/my-prompts/blob/main/brand-house.md'
  },
  {
    id: '03',
    title: 'Mental Model',
    question: '왜 이렇게 움직여?',
    phase: '작동원리',
    accent: '#4338ca',
    description: '성장 이유, 수익 구조, 경쟁 방어력을 연결해 기업이나 시장이 움직이는 내부 원리를 해석합니다.',
    output: '성장 엔진, 수익 논리, 진입장벽, 플라이휠',
    useCase: '사업모델 분석, 투자/제휴 검토, 성장성 설명',
    prompt: '다음 기업 또는 시장의 작동 원리를 Mental Model로 설명해줘. 성장 동인, 수익 구조, 방어력, 리스크를 인과관계로 연결해줘.',
    link: 'https://github.com/juree85-netizen/my-prompts/blob/main/mental-model.md'
  },
  {
    id: '04',
    title: 'Business Diagnosis',
    question: '어디가 문제야?',
    phase: '진단',
    accent: '#be123c',
    description: 'BMC 기반으로 문제가 생기는 위치를 특정하고, 병목 원인과 해결 방향을 분리합니다.',
    output: '문제 위치, 원인 가설, 영향도, 해결책 후보',
    useCase: '성과 부진 진단, 사업 개선안, 이슈 트리 정리',
    prompt: '다음 사업을 Business Model Canvas 기준으로 진단해줘. 문제가 발생하는 위치, 원인 가설, 영향도, 가능한 해결책을 구분해줘.',
    link: 'https://github.com/juree85-netizen/my-prompts/blob/main/business-diagnosis.md'
  },
  {
    id: '05',
    title: 'Strategy Canvas',
    question: '뭘 해야 해?',
    phase: '전략',
    accent: '#0369a1',
    description: '분석 결과를 전략 선택지와 실행 로드맵으로 바꿔 다음 행동을 결정합니다.',
    output: '전략 옵션, 우선순위, 로드맵, 실행 리스크',
    useCase: '전략안 작성, 경영진 보고, 실행 계획 수립',
    prompt: '앞선 분석을 바탕으로 Strategy Canvas를 만들어줘. 가능한 전략 선택지, 평가 기준, 우선순위, 실행 로드맵과 리스크를 제시해줘.',
    link: 'https://github.com/juree85-netizen/my-prompts/blob/main/strategy-canvas.md'
  }
];

const modes = [
  { id: 'flow', label: '전체 흐름' },
  { id: 'solo', label: '단독 사용' },
  { id: 'chain', label: '순차 실행' }
];

const modeCopy = {
  flow: {
    title: '사고 흐름을 한 번에 펼쳐보기',
    body: '이해에서 전략까지 기획자의 질문이 어떻게 깊어지는지 보여줍니다. 프로젝트 초기에 팀의 분석 범위를 맞출 때 좋습니다.'
  },
  solo: {
    title: '필요한 질문만 꺼내 쓰기',
    body: '각 스킬은 독립적으로 사용할 수 있습니다. 지금 막힌 지점이 개념, 포지셔닝, 진단 중 어디인지 고른 뒤 바로 적용합니다.'
  },
  chain: {
    title: '01에서 05까지 이어서 실행하기',
    body: '낯선 주제를 이해한 뒤 포지셔닝, 작동원리, 진단, 전략으로 이어가면 보고서의 논리 흐름이 자연스럽게 쌓입니다.'
  }
};

function Icon({ type }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };

  const paths = {
    map: (
      <>
        <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </>
    ),
    house: (
      <>
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    model: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="M5.6 5.6l2.1 2.1" />
        <path d="M16.3 16.3l2.1 2.1" />
        <path d="M18.4 5.6l-2.1 2.1" />
        <path d="M7.7 16.3l-2.1 2.1" />
      </>
    ),
    diagnosis: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M15 15l3 3" />
      </>
    ),
    strategy: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l4-4 3 3 5-7" />
        <path d="M16 7h3v3" />
      </>
    ),
    copy: (
      <>
        <path d="M8 8h11v11H8z" />
        <path d="M5 16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
      </>
    )
  };

  return <svg {...common}>{paths[type]}</svg>;
}

function App() {
  const [activeId, setActiveId] = useState('01');
  const [mode, setMode] = useState('flow');
  const [copied, setCopied] = useState(false);

  const activeStep = useMemo(() => steps.find((step) => step.id === activeId), [activeId]);
  const activeIndex = steps.findIndex((step) => step.id === activeId);
  const iconTypes = ['map', 'house', 'model', 'diagnosis', 'strategy'];

  async function copyPrompt() {
    const text = `[${activeStep.id} ${activeStep.title}] ${activeStep.prompt}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>AI 분석 스킬 셋</h1>
          <p>기획자의 질문을 이해 → 포지셔닝 → 작동원리 → 진단 → 전략으로 정렬합니다.</p>
        </div>
        <nav className="mode-switch" aria-label="보기 방식">
          {modes.map((item) => (
            <button
              className={mode === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => setMode(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="workspace">
        <aside className="step-rail" aria-label="분석 단계">
          <div className="rail-title">
            <span>5-Step Flow</span>
            <strong>{activeStep.phase}</strong>
          </div>
          {steps.map((step, index) => (
            <button
              className={`rail-item ${step.id === activeId ? 'selected' : ''}`}
              key={step.id}
              onClick={() => setActiveId(step.id)}
              style={{ '--accent': step.accent }}
              type="button"
            >
              <span className="rail-number">{step.id}</span>
              <span>
                <strong>{step.title}</strong>
                <small>{step.question}</small>
              </span>
              <Icon type={iconTypes[index]} />
            </button>
          ))}
        </aside>

        <section className="map-panel" aria-labelledby="map-title">
          <div className="mode-brief">
            <div>
              <h2 id="map-title">{modeCopy[mode].title}</h2>
              <p>{modeCopy[mode].body}</p>
            </div>
            <div className="progress-meter" aria-label={`현재 ${activeStep.id} 단계`}>
              <span>{activeStep.id}</span>
              <div>
                <i style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className={`flow-map ${mode}`}>
            {steps.map((step, index) => (
              <button
                className={`flow-node ${step.id === activeId ? 'selected' : ''} ${index < activeIndex ? 'passed' : ''}`}
                key={step.id}
                onClick={() => setActiveId(step.id)}
                style={{ '--accent': step.accent }}
                type="button"
              >
                <span className="node-index">{step.id}</span>
                <span className="node-icon">
                  <Icon type={iconTypes[index]} />
                </span>
                <strong>{step.phase}</strong>
                <small>{step.question}</small>
              </button>
            ))}
          </div>

          <div className="analysis-strip">
            <div>
              <span>입력</span>
              <strong>기업·기술·시장 주제</strong>
            </div>
            <div>
              <span>질문 전환</span>
              <strong>{activeStep.question}</strong>
            </div>
            <div>
              <span>산출물</span>
              <strong>{activeStep.output}</strong>
            </div>
          </div>

          <section className="prompt-card">
            <div className="prompt-head">
              <div>
                <span>{activeStep.id} Prompt Skeleton</span>
                <h3>{activeStep.title}</h3>
              </div>
              <button className="icon-button" onClick={copyPrompt} title="프롬프트 복사" type="button">
                <Icon type="copy" />
                <span>{copied ? '복사됨' : '복사'}</span>
              </button>
            </div>
            <p>{activeStep.prompt}</p>
          </section>
        </section>

        <aside className="detail-panel" style={{ '--accent': activeStep.accent }}>
          <div className="detail-number">{activeStep.id}</div>
          <h2>{activeStep.title}</h2>
          <p className="question">{activeStep.question}</p>
          <p className="description">{activeStep.description}</p>

          <div className="detail-block">
            <span>언제 쓰나</span>
            <strong>{activeStep.useCase}</strong>
          </div>
          <div className="detail-block">
            <span>무엇이 나오나</span>
            <strong>{activeStep.output}</strong>
          </div>

          <a className="source-link" href={activeStep.link} rel="noreferrer" target="_blank">
            <Icon type="link" />
            원문 프롬프트 보기
          </a>
        </aside>
      </section>
    </main>
  );
}

export default App;
