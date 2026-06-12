# Mini Apps

작은 웹앱들을 한 곳에서 관리하고 GitHub Pages로 배포하는 저장소입니다.

## 앱 목록

- `apps/team-randomizer`: 조 편성 도구

## 로컬 실행

```powershell
npm run dev:team-randomizer
```

또는 앱 폴더로 직접 이동해서 실행할 수 있습니다.

```powershell
cd apps/team-randomizer
npm install
npm run dev
```

## GitHub Pages 배포 구조

배포 후 주소는 아래처럼 구성됩니다.

```text
https://pteam-solution.github.io/mini-apps/
https://pteam-solution.github.io/mini-apps/team-randomizer/
```

GitHub 저장소의 `Settings > Pages`에서 `Source`를 `GitHub Actions`로 설정하면, `main` 브랜치 push 시 자동 배포됩니다.
