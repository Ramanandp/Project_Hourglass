export const TOKEN = Object.freeze({ HEALTH: 'health', PHYSICAL: 'physical', MAGICAL: 'magical', SPECIAL: 'special', SPEED: 'speed', CRITICAL: 'critical' });

export const TOKEN_META = Object.freeze({
  health: { label: 'Health', symbol: '✚', short: 'H' }, physical: { label: 'Physical', symbol: '⚔', short: 'P' },
  magical: { label: 'Magical', symbol: '✦', short: 'M' }, special: { label: 'Special', symbol: '◆', short: 'S' },
  speed: { label: 'Speed', symbol: '➟', short: 'Sp' }, critical: { label: 'Critical', symbol: '!', short: 'C' },
});

export const HERO = Object.freeze({ name: 'Mara the Wayfarer', stats: { vitality: 4, strength: 5, intelligence: 3, dexterity: 3, speed: 4, luck: 5 } });

export const ACTIONS = Object.freeze([
  { id: 'steel-strike', name: 'Steel Strike', kind: 'damage', base: [TOKEN.PHYSICAL, TOKEN.PHYSICAL], bonus: [TOKEN.PHYSICAL], potency: 5, initiative: 3, evolve: { name: 'Tempered Strike', potency: 8, initiative: 3 }, note: 'Reliable damage.' },
  { id: 'quick-strike', name: 'Quick Strike', kind: 'damage', base: [TOKEN.PHYSICAL], bonus: [TOKEN.PHYSICAL], potency: 3, initiative: 5, evolve: { name: 'Swift Strike', potency: 5, initiative: 6 }, note: 'Acts early.' },
  { id: 'rune-bolt', name: 'Rune Bolt', kind: 'damage', base: [TOKEN.MAGICAL, TOKEN.MAGICAL], bonus: [TOKEN.MAGICAL], potency: 6, initiative: 2, evolve: { name: 'Charged Bolt', potency: 10, initiative: 2 }, note: 'Heavy magical damage.' },
  { id: 'shield-bash', name: 'Shield Bash', kind: 'damage', base: [TOKEN.PHYSICAL, TOKEN.SPECIAL], bonus: [TOKEN.PHYSICAL, TOKEN.SPECIAL], potency: 4, initiative: 4, evolve: { name: 'Crushing Bash', potency: 6, initiative: 4 }, note: 'A balanced mixed action.' },
  { id: 'guard-stance', name: 'Guard Stance', kind: 'armor', base: [TOKEN.SPECIAL, TOKEN.SPECIAL], bonus: [TOKEN.SPECIAL], potency: 6, initiative: 5, evolve: { name: 'Iron Guard', potency: 9, initiative: 5 }, note: 'Adds persistent Armor.' },
  { id: 'first-aid', name: 'First Aid', kind: 'heal', base: [TOKEN.HEALTH, TOKEN.HEALTH], bonus: [TOKEN.HEALTH], potency: 4, initiative: 4, evolve: { name: 'Field Medicine', potency: 7, initiative: 4 }, note: 'Restores Health.' },
]);

export const ENCOUNTER = Object.freeze([
  { name: 'Bandit Captain', maxHp: 16, deck: [
    { id: 'slash', name: 'Slash', kind: 'damage', potency: 4, initiative: 3, evolve: { name: 'Heavy Slash', potency: 6, initiative: 3 } },
    { id: 'slash-2', name: 'Slash', kind: 'damage', potency: 4, initiative: 3, evolve: { name: 'Heavy Slash', potency: 6, initiative: 3 } },
    { id: 'slash-3', name: 'Slash', kind: 'damage', potency: 4, initiative: 3, evolve: { name: 'Heavy Slash', potency: 6, initiative: 3 } },
    { id: 'slash-4', name: 'Slash', kind: 'damage', potency: 4, initiative: 3, evolve: { name: 'Heavy Slash', potency: 6, initiative: 3 } },
    { id: 'jab', name: 'Jab', kind: 'damage', potency: 3, initiative: 5, evolve: { name: 'Frenzied Jab', potency: 4, initiative: 6 } },
    { id: 'jab-2', name: 'Jab', kind: 'damage', potency: 3, initiative: 5, evolve: { name: 'Frenzied Jab', potency: 4, initiative: 6 } },
    { id: 'jab-3', name: 'Jab', kind: 'damage', potency: 3, initiative: 5, evolve: { name: 'Frenzied Jab', potency: 4, initiative: 6 } },
    { id: 'miss', name: 'Miss', kind: 'miss', potency: 0, initiative: 1 },
  ] },
  { name: 'Gargoyle', maxHp: 21, deck: [
    { id: 'claw', name: 'Stone Claw', kind: 'damage', potency: 5, initiative: 4, evolve: { name: 'Rending Claw', potency: 7, initiative: 4 } },
    { id: 'claw-2', name: 'Stone Claw', kind: 'damage', potency: 5, initiative: 4, evolve: { name: 'Rending Claw', potency: 7, initiative: 4 } },
    { id: 'claw-3', name: 'Stone Claw', kind: 'damage', potency: 5, initiative: 4, evolve: { name: 'Rending Claw', potency: 7, initiative: 4 } },
    { id: 'claw-4', name: 'Stone Claw', kind: 'damage', potency: 5, initiative: 4, evolve: { name: 'Rending Claw', potency: 7, initiative: 4 } },
    { id: 'crush', name: 'Wing Crush', kind: 'damage', potency: 7, initiative: 2, evolve: { name: 'Falling Stone', potency: 9, initiative: 1 } },
    { id: 'crush-2', name: 'Wing Crush', kind: 'damage', potency: 7, initiative: 2, evolve: { name: 'Falling Stone', potency: 9, initiative: 1 } },
    { id: 'crush-3', name: 'Wing Crush', kind: 'damage', potency: 7, initiative: 2, evolve: { name: 'Falling Stone', potency: 9, initiative: 1 } },
    { id: 'miss', name: 'Miss', kind: 'miss', potency: 0, initiative: 1 },
  ] },
]);

export function seededRandom(seed = 8675309) { let state = seed >>> 0; return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; }; }
export function shuffle(items, rng) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
export function buildBag(stats = HERO.stats) { return [ ...Array(stats.vitality).fill(TOKEN.HEALTH), ...Array(stats.strength).fill(TOKEN.PHYSICAL), ...Array(stats.intelligence).fill(TOKEN.MAGICAL), ...Array(stats.dexterity).fill(TOKEN.SPECIAL), ...Array(stats.speed).fill(TOKEN.SPEED), ...Array(stats.luck).fill(TOKEN.CRITICAL) ]; }
export function createActionState() { return ACTIONS.map(def => ({ ...def, evolved: false, assigned: [] })); }
export function createEnemy(def, rng) { return { ...def, hp: def.maxHp, cards: def.deck.map(card => ({ ...card, evolved: false })), drawPile: shuffle(def.deck.map((_, i) => i), rng), remaining: def.deck.length }; }
export function tokenCount(tokens, token) { return tokens.filter(t => t === token).length; }
export function actionComplete(action) { return action.base.every(type => tokenCount(action.assigned, type) >= tokenCount(action.base, type)); }
export function compatible(action, token) {
  if ([TOKEN.HEALTH, TOKEN.SPEED, TOKEN.CRITICAL].includes(token)) return true;
  const required = tokenCount(action.base, token); const assigned = tokenCount(action.assigned, token);
  return required > assigned || action.bonus.includes(token);
}
export function currentAction(action) { return action.evolved ? { ...action, name: action.evolve.name, potency: action.evolve.potency, initiative: action.evolve.initiative } : action; }
export function createGame(seed = 8675309) {
  const rng = seededRandom(seed); return { seed, rng, phase: 'intro', battleIndex: 0, round: 0, hero: { ...HERO, hp: HERO.stats.vitality * 4, maxHp: HERO.stats.vitality * 4, armor: 0 }, actions: createActionState(), log: [], metrics: { draws: 0, actions: 0, critSuccesses: 0, critFailures: 0 }, bag: [], discard: [], reserve: [], enemy: null, resolution: null };
}
export function log(game, text, type = 'info') { game.log.unshift({ text, type }); }
export function startBattle(game) {
  game.bag = shuffle(buildBag(), game.rng); game.discard = []; game.reserve = []; game.actions.forEach(a => a.assigned = []); game.enemy = createEnemy(ENCOUNTER[game.battleIndex], game.rng); game.phase = 'planning';
  log(game, `Battle ${game.battleIndex + 1}: ${game.enemy.name} emerges from the tavern tale.`, 'event'); drawRound(game);
}
export function drawOne(game) { if (!game.bag.length && game.discard.length) { game.bag = shuffle(game.discard, game.rng); game.discard = []; log(game, 'The discard pile returns to your bag.', 'event'); } if (!game.bag.length) return null; return game.bag.pop(); }
export function drawRound(game) {
  game.round++; let drawn = [];
  const attempts = 4 + [...Array(4)].filter(() => game.rng() < HERO.stats.luck / (HERO.stats.luck + 20)).length;
  for (let i = 0; i < attempts && game.reserve.length < 8; i++) { const token = drawOne(game); if (token) { game.reserve.push(token); drawn.push(token); } }
  game.metrics.draws += drawn.length; log(game, `Round ${game.round}: drew ${drawn.map(t => TOKEN_META[t].short).join(', ') || 'nothing'} (${game.reserve.length}/8 reserve).`, 'draw'); return drawn;
}
export function assignToken(game, reserveIndex, actionId) {
  if (game.phase !== 'planning') return false; const action = game.actions.find(a => a.id === actionId); const token = game.reserve[reserveIndex]; if (!action || !token || !compatible(action, token)) return false;
  action.assigned.push(token); game.reserve.splice(reserveIndex, 1); log(game, `${TOKEN_META[token].label} assigned to ${currentAction(action).name}.`); return true;
}
export function removeToken(game, actionId, assignedIndex) { const action = game.actions.find(a => a.id === actionId); if (!action || game.reserve.length >= 8 || assignedIndex < 0) return false; const [token] = action.assigned.splice(assignedIndex, 1); if (!token) return false; game.reserve.push(token); log(game, `${TOKEN_META[token].label} returned to reserve.`); return true; }
export function drawEnemyCard(game) { const enemy = game.enemy; if (!enemy.drawPile.length) { enemy.drawPile = shuffle(enemy.cards.map((_, i) => i), game.rng); log(game, `${enemy.name}'s attack deck reshuffles.`, 'event'); } const index = enemy.drawPile.pop(); const card = enemy.cards[index]; enemy.remaining = enemy.drawPile.length; if (card.kind === 'miss') { enemy.drawPile = shuffle(enemy.cards.map((_, i) => i), game.rng); enemy.remaining = enemy.drawPile.length; } return card; }
export function startRoundResolution(game) {
  if (game.phase !== 'planning') return false;
  game.phase = 'resolving';
  const completed = game.actions.filter(actionComplete);
  const enemyCard = drawEnemyCard(game);
  const queue = [...completed.map(action => ({ side: 'hero', action, data: currentAction(action), initiative: currentAction(action).initiative + tokenCount(action.assigned, TOKEN.SPEED) })), { side: 'enemy', data: enemyCard, initiative: enemyCard.initiative }]
    .sort((a, b) => b.initiative - a.initiative || (a.side === 'hero' ? -1 : 1));
  game.resolution = { queue, index: 0, last: null };
  log(game, `${game.enemy.name} reveals ${enemyCard.name}.`, 'event');
  return true;
}
export function resolveNextAction(game) {
  if (game.phase !== 'resolving' || !game.resolution) return null;
  const resolution = game.resolution;
  const item = resolution.queue[resolution.index];
  if (!item || game.hero.hp <= 0 || game.enemy.hp <= 0) return finishRoundResolution(game);
  const result = item.side === 'hero'
    ? resolveHeroAction(game, item.action, item.data, item.initiative)
    : resolveEnemyAction(game, item.data, item.initiative);
  resolution.index++;
  resolution.last = result;
  if (game.hero.hp <= 0 || game.enemy.hp <= 0 || resolution.index >= resolution.queue.length) finishRoundResolution(game);
  return result;
}
export function finishRoundResolution(game) {
  if (game.phase !== 'resolving') return null;
  game.resolution = null;
  if (game.hero.hp <= 0) { game.phase = 'summary'; log(game, 'Mara falls. The tavern grows quiet.', 'defeat'); return { finished: 'defeat' }; }
  if (game.enemy.hp <= 0) { finishBattle(game); return { finished: 'victory' }; }
  game.phase = 'planning'; drawRound(game);
  return { finished: 'planning' };
}
export function resolveRound(game) {
  if (!startRoundResolution(game)) return;
  while (game.phase === 'resolving') resolveNextAction(game);
}
export function resolveHeroAction(game, action, data, initiative) {
  const crits = tokenCount(action.assigned, TOKEN.CRITICAL); let multiplier = 1;
  if (crits) { const passed = [...Array(crits)].every(() => game.rng() < 0.5); if (!passed) { game.metrics.critFailures++; const message = `${data.name} fails its Critical gamble.`; log(game, message, 'bad'); discardAction(game, action); return { side: 'hero', name: data.name, initiative, message, type: 'bad', effects: [] }; } game.metrics.critSuccesses += crits; multiplier = 1 + crits; }
  const bonus = action.assigned.filter(t => data.bonus.includes(t)).length * 2; const health = tokenCount(action.assigned, TOKEN.HEALTH);
  const amount = (data.potency + bonus + health) * multiplier;
  let message; let effects;
  if (data.kind === 'damage') { const before = game.enemy.hp; game.enemy.hp = Math.max(0, game.enemy.hp - amount); const applied = before - game.enemy.hp; message = `${data.name} deals ${applied} damage at initiative ${initiative}.`; effects = [{ target: 'enemy-hp', delta: -applied, label: `-${applied} HP` }]; }
  if (data.kind === 'armor') { const before = game.hero.armor; game.hero.armor = Math.min(game.hero.maxHp, game.hero.armor + amount); const applied = game.hero.armor - before; message = `${data.name} adds ${applied} Armor.`; effects = [{ target: 'hero-armor', delta: applied, label: `+${applied} Armor` }]; }
  if (data.kind === 'heal') { const before = game.hero.hp; game.hero.hp = Math.min(game.hero.maxHp, game.hero.hp + amount); const applied = game.hero.hp - before; message = `${data.name} restores ${applied} HP.`; effects = [{ target: 'hero-hp', delta: applied, label: `+${applied} HP` }]; }
  log(game, message, 'good');
  game.metrics.actions++; action.evolved = !action.evolved; discardAction(game, action);
  return { side: 'hero', name: data.name, initiative, message, type: 'good', effects };
}
export function discardAction(game, action) { game.discard.push(...action.assigned); action.assigned = []; }
export function resolveEnemyAction(game, card, initiative) {
  if (card.kind === 'miss') { const message = `${game.enemy.name} misses at initiative ${initiative}.`; log(game, message, 'info'); return { side: 'enemy', name: card.name, initiative, message, type: 'info', effects: [] }; }
  const data = card.evolved && card.evolve ? { ...card, ...card.evolve } : card; let damage = data.potency; const absorbed = Math.min(game.hero.armor, damage); game.hero.armor -= absorbed; damage -= absorbed; const before = game.hero.hp; game.hero.hp = Math.max(0, game.hero.hp - damage); const applied = before - game.hero.hp;
  const message = `${game.enemy.name}'s ${data.name} deals ${applied}${absorbed ? ` after ${absorbed} Armor` : ''}.`;
  const effects = [ ...(absorbed ? [{ target: 'hero-armor', delta: -absorbed, label: `-${absorbed} Armor` }] : []), ...(applied ? [{ target: 'hero-hp', delta: -applied, label: `-${applied} HP` }] : []) ];
  log(game, message, applied ? 'bad' : 'good'); if (card.evolve) card.evolved = !card.evolved;
  return { side: 'enemy', name: data.name, initiative, message, type: applied ? 'bad' : 'good', effects };
}
export function finishBattle(game) { log(game, `${game.enemy.name} is defeated.`, 'victory'); if (game.battleIndex === ENCOUNTER.length - 1) { game.phase = 'summary'; log(game, 'The encounter is complete. Your story earns a round of applause.', 'victory'); return; } game.battleIndex++; game.phase = 'battle-transition'; log(game, 'No rest—another shape moves in the candlelight.', 'event'); }
export function continueBattle(game) { if (['intro', 'battle-transition'].includes(game.phase)) startBattle(game); }
