// Filtering and the spoiler rule. Spoilers hide the name and description of story
// trophies until they are earned; everything else always shows.
export function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

// One place for the spoiler rule, so the list, the detail panel, the roadmap and
// Next Up all hide the same trophies. A trophy the player revealed with the
// Reveal button (or one already earned) is never hidden.
export function isSpoilerHidden(trophy, earned, spoilersOn, revealed) {
  if (!spoilersOn) return false;
  if (!isStoryTrophy(trophy)) return false;
  if (earned.has(trophy.id)) return false;
  if (revealed && revealed.has(trophy.id)) return false;
  return true;
}

export function displayName(trophy, earned, spoilersOn, revealed) {
  if (isSpoilerHidden(trophy, earned, spoilersOn, revealed)) {
    return 'Hidden story trophy';
  }
  return trophy.name;
}

export function displayDescription(trophy, earned, spoilersOn, revealed) {
  if (isSpoilerHidden(trophy, earned, spoilersOn, revealed)) {
    return 'Hidden until earned — turn spoilers off to reveal it.';
  }
  return trophy.description;
}

export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'online') return false;
  return trophy.kind === kind;
}

export function filterTrophies(trophies, state) {
  const query = (state.search || '').trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (!matchesKind(trophy, state.kind)) return false;
    if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
    if (state.earned === 'earned' && !state.earnedSet.has(trophy.id)) return false;
    if (state.earned === 'unearned' && state.earnedSet.has(trophy.id)) return false;
    if (query) {
      const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function nextUpTrophies(trophies, earned, limit) {
  const open = trophies.filter((t) => !earned.has(t.id));
  open.sort((a, b) => a.roadmap_stage - b.roadmap_stage || a.id - b.id);
  return open.slice(0, limit);
}
