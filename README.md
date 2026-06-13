# Mini Apps

업무용 미니앱을 한곳에서 관리하고 GitHub Pages로 배포하는 저장소입니다.

## 앱 목록

- `apps/team-randomizer`: 팀 랜덤 배정 도구
- `apps/ai-analysis-skillset`: AI 분석 스킬 셋 시각화 도구
- `apps/glory-vortex`: Gravity Vortex 방식의 소용돌이 추첨 게임

## 로컬 실행

```powershell
npm run dev:team-randomizer
npm run dev:ai-analysis-skillset
npm run dev:glory-vortex
```

또는 각 앱 폴더로 직접 이동해서 실행할 수 있습니다.

```powershell
cd apps/ai-analysis-skillset
npm install
npm run dev
```

## GitHub Pages 배포 구조

배포 후 주소는 아래처럼 구성됩니다.

```text
https://pteam-solution.github.io/mini-apps/
https://pteam-solution.github.io/mini-apps/team-randomizer/
https://pteam-solution.github.io/mini-apps/ai-analysis-skillset/
https://pteam-solution.github.io/mini-apps/glory-vortex/
```

GitHub 저장소의 `Settings > Pages`에서 `Source`를 `GitHub Actions`로 설정하면, `main` 브랜치에 push할 때 자동 배포됩니다.
