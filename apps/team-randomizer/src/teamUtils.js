const NAME_LIMIT = 20;
const MIN_PEOPLE = 2;

export function parseNames(input) {
  return input
    .split(/[\s,]+/u)
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

export function shuffleNames(names) {
  const shuffled = [...names];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export function assignTeams(names, teamCount) {
  return Array.from({ length: teamCount }, (_, index) => ({
    id: index + 1,
    name: `${index + 1}조`,
    members: names.filter((_, memberIndex) => memberIndex % teamCount === index)
  }));
}

export function validateTeamRequest(names, teamCount) {
  if (names.length > NAME_LIMIT) {
    return `최대 ${NAME_LIMIT}명까지만 입력할 수 있습니다. 현재 ${names.length}명이 입력되었습니다.`;
  }

  if (names.length < MIN_PEOPLE) {
    return '조 편성을 위해 최소 2명 이상 입력해 주세요.';
  }

  if (teamCount > names.length) {
    return '조 개수는 입력된 인원 수보다 많을 수 없습니다.';
  }

  return '';
}

export { MIN_PEOPLE, NAME_LIMIT };
