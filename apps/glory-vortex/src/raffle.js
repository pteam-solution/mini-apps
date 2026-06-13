export const DEFAULT_NAMES =
  '김민준, 이서연, 박지후, 최윤아\n정도윤, 한지민, 오준서, 강하은\n신우진, 유다희, 이준호, 박서연';

export function parseNames(value) {
  return value
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function findDuplicateNames(names) {
  const seen = new Set();
  const duplicates = new Set();

  names.forEach((name) => {
    if (seen.has(name)) {
      duplicates.add(name);
    }
    seen.add(name);
  });

  return Array.from(duplicates);
}

export function getEligibleNames(names, previousWinners, allowRepeatWinners) {
  if (allowRepeatWinners) {
    return names;
  }

  const blocked = new Set(previousWinners);
  return names.filter((name) => !blocked.has(name));
}

export function clampWinnerCount(count, max) {
  return Math.max(1, Math.min(Number(count) || 1, Math.max(max, 1)));
}

export function validateRound(names, winnerCount) {
  if (names.length < 2) {
    return '최소 2명 이상 입력하세요.';
  }

  if (winnerCount >= names.length) {
    return '선정 인원은 후보 수보다 적어야 합니다.';
  }

  return '';
}
