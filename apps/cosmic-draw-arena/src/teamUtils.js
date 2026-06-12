export const MIN_PARTICIPANTS = 2;

export function parseNames(input) {
  return input
    .split(/[\n,]+/u)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function findDuplicateNames(names) {
  const seen = new Set();
  const duplicates = new Set();

  names.forEach((name) => {
    const normalized = name.toLocaleLowerCase('ko-KR');

    if (seen.has(normalized)) {
      duplicates.add(name);
    }

    seen.add(normalized);
  });

  return Array.from(duplicates);
}

export function shuffleItems(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function createCards(names) {
  return shuffleItems(names).map((name, index) => ({
    id: `${Date.now()}-${index}-${name}`,
    name,
    status: 'alive'
  }));
}

export function getEligibleNames(names, previousWinners, allowRepeatWinners) {
  if (allowRepeatWinners) {
    return names;
  }

  return names.filter((name) => !previousWinners.includes(name));
}

export function validateDraw(names) {
  if (names.length < MIN_PARTICIPANTS) {
    return '최소 2명 이상 입력해 주세요.';
  }

  return '';
}
