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

export const WATCHTOWER_QUEST = Object.freeze({
  id: 'old-watchtower', title: 'Clear the Old Watchtower', objective: 'Defeat the threats occupying the Old Watchtower.',
  location: 'Old Watchtower · 2 days from town', estimatedDays: '4–6 days', enemies: 'Bandit Captain, unknown stone guardian',
  risk: 'High risk', rewardGold: 25, expiration: 'Day 12',
});

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
export function actionPreview(action) {
  const data = currentAction(action);
  const bonus = data.bonus.filter(token => token !== TOKEN.HEALTH).reduce((total, token) => total + Math.max(0, tokenCount(action.assigned, token) - tokenCount(action.base, token)) * 2, 0);
  const health = Math.max(0, tokenCount(action.assigned, TOKEN.HEALTH) - tokenCount(action.base, TOKEN.HEALTH));
  const healthAmount = health * 2;
  const speed = tokenCount(action.assigned, TOKEN.SPEED);
  const criticals = tokenCount(action.assigned, TOKEN.CRITICAL);
  return { data, basePotency: data.potency, potency: data.potency + bonus, bonus, health, healthAmount, baseInitiative: data.initiative, initiative: data.initiative + speed, speed, criticals, criticalMultiplier: criticals * 2 };
}
export function createGame(seed = 8675309) {
  const rng = seededRandom(seed); return { seed, rng, phase: 'intro', day: 1, gold: 0, quest: null, completedQuest: false, questHistory: [], battleIndex: 0, round: 0, hero: { ...HERO, hp: HERO.stats.vitality * 4, maxHp: HERO.stats.vitality * 4, armor: 0 }, actions: createActionState(), log: [], metrics: { draws: 0, actions: 0, critSuccesses: 0, critFailures: 0 }, bag: [], discard: [], reserve: [], enemy: null, resolution: null, combatMessage: null };
}
export function log(game, text, type = 'info') { game.log.unshift({ text, type }); }
export function setCombatMessage(game, text, type = 'info', state = '') { game.combatMessage = { text, type, state }; }
export function acceptQuest(game, questId = WATCHTOWER_QUEST.id) {
  if (!['intro', 'tavern'].includes(game.phase) || game.quest || game.completedQuest || questId !== WATCHTOWER_QUEST.id) return false;
  game.quest = { id: questId, startedDay: game.day, days: 0, currentNode: 'outbound', objectiveComplete: false, rested: false, cacheFound: false, bonusGold: 0, outcome: null };
  game.phase = 'outbound-travel'; log(game, `Accepted: ${WATCHTOWER_QUEST.title}.`, 'event'); return true;
}
export function chooseOutboundTravel(game, choice) {
  if (game.phase !== 'outbound-travel' || !game.quest || !['lantern', 'bramble'].includes(choice)) return false;
  const cautious = choice === 'lantern'; const days = cautious ? 2 : 1; const healing = cautious ? 2 : 0;
  advanceQuestDays(game, days); if (healing) game.hero.hp = Math.min(game.hero.maxHp, game.hero.hp + healing);
  game.quest.currentNode = 'crossroads'; game.phase = 'quest-map'; log(game, cautious ? 'A lantern-lit detour keeps the road kind.' : 'The brambles scratch at Mara’s sleeves, but the shortcut holds.', 'event'); return true;
}
export function chooseQuestNode(game, node) {
  if (game.phase !== 'quest-map' || !game.quest) return false;
  if (node === 'rest' && !game.quest.rested && !game.quest.objectiveComplete) { game.quest.currentNode = 'shrine'; game.phase = 'rest'; return true; }
  if (node === 'watchtower' && !game.quest.objectiveComplete) return startQuestEncounter(game);
  if (node === 'cache' && game.quest.objectiveComplete && !game.quest.cacheFound) { advanceQuestDays(game, 1); game.quest.currentNode = 'archive'; game.quest.cacheFound = true; game.quest.bonusGold += 10; log(game, 'A hidden cache yields 10 bonus gold.', 'good'); return true; }
  return false;
}
export function restAtQuestNode(game, days) {
  if (game.phase !== 'rest' || !game.quest || ![1, 2].includes(days)) return false;
  advanceQuestDays(game, days); game.hero.hp = Math.min(game.hero.maxHp, game.hero.hp + days * 5); game.quest.rested = true; game.quest.currentNode = 'shrine'; game.phase = 'quest-map'; log(game, `Rested safely for ${days} day${days === 1 ? '' : 's'}.`, 'good'); return true;
}
export function startQuestEncounter(game) {
  if (game.phase !== 'quest-map' || !game.quest || game.quest.objectiveComplete) return false;
  advanceQuestDays(game, 1); game.quest.currentNode = 'watchtower'; game.battleIndex = 0; game.round = 0; startBattle(game); return true;
}
export function finishQuest(game) {
  if (!['quest-map', 'rest'].includes(game.phase) || !game.quest) return false;
  if (!game.quest.objectiveComplete) return endQuest(game, 'abandoned');
  game.quest.currentNode = 'return'; game.phase = 'return-travel'; return true;
}
export function resolveReturnTravel(game) {
  if (game.phase !== 'return-travel' || !game.quest) return false;
  advanceQuestDays(game, 1); return endQuest(game, 'completed');
}
export function advanceQuestDays(game, days) { game.day += days; if (game.quest) game.quest.days += days; }
export function questRoute(game) {
  if (!game.quest || !['outbound-travel', 'quest-map', 'rest', 'return-travel'].includes(game.phase)) return [];
  const done = (id, label, current = false) => ({ id, label, status: current ? 'current' : 'completed', completed: true });
  const current = (id, label) => ({ id, label, status: 'current', completed: false });
  const available = (id, label) => ({ id, label, status: 'available', completed: false });
  const town = done('town', 'Tavern'); const outward = done('outbound', 'Outward journey', game.quest.currentNode === 'outbound');
  if (game.phase === 'outbound-travel') return [town, outward];
  if (!game.quest.objectiveComplete) {
    if (game.phase === 'rest') return [town, outward, done('crossroads', 'Crossroads'), current('shrine', 'Crumbled shrine'), available('watchtower', 'Old Watchtower')];
    if (game.quest.rested) return [town, outward, done('shrine', 'Crumbled shrine', game.quest.currentNode === 'shrine'), available('watchtower', 'Old Watchtower')];
    return [town, outward, current('crossroads', 'Crossroads'), available('shrine', 'Crumbled shrine'), available('watchtower', 'Old Watchtower')];
  }
  const route = [town, outward];
  if (game.quest.rested) route.push(done('shrine', 'Crumbled shrine'));
  route.push(done('watchtower', 'Old Watchtower', game.quest.currentNode === 'watchtower'));
  if (game.quest.cacheFound) route.push(done('archive', 'Fallen archive', game.quest.currentNode === 'archive'));
  else route.push(available('archive', 'Fallen archive'));
  route.push(game.phase === 'return-travel' ? current('return', 'Homeward journey') : available('return', 'Return to tavern'));
  return route;
}
export function endQuest(game, outcome) {
  if (!game.quest) return false;
  const quest = game.quest; quest.outcome = outcome;
  const reward = outcome === 'completed' ? WATCHTOWER_QUEST.rewardGold + quest.bonusGold : 0;
  game.gold += reward;
  game.questHistory.push({ title: WATCHTOWER_QUEST.title, outcome, days: quest.days, reward, cacheFound: quest.cacheFound });
  game.completedQuest ||= outcome === 'completed'; game.quest = null; game.hero.armor = 0; game.actions.forEach(action => { action.evolved = false; action.assigned = []; });
  game.phase = 'quest-result'; game.enemy = null; game.resolution = null; game.reserve = []; game.bag = []; game.discard = [];
  log(game, outcome === 'completed' ? `Quest complete. Earned ${reward} gold.` : `Quest ${outcome}; no rewards earned.`, outcome === 'completed' ? 'victory' : 'defeat'); return true;
}
export function returnToTavern(game) { if (game.phase !== 'quest-result') return false; game.phase = 'tavern'; return true; }
export function startBattle(game) {
  game.bag = shuffle(buildBag(), game.rng); game.discard = []; game.reserve = []; game.actions.forEach(a => a.assigned = []); game.enemy = createEnemy(ENCOUNTER[game.battleIndex], game.rng); game.phase = 'planning';
  const message = `A ${game.enemy.name} appears!`;
  log(game, message, 'event'); setCombatMessage(game, message, 'event', `Battle ${game.battleIndex + 1}`); drawRound(game);
}
export function drawOne(game) { if (!game.bag.length && game.discard.length) { game.bag = shuffle(game.discard, game.rng); game.discard = []; log(game, 'The discard pile returns to your bag.', 'event'); } if (!game.bag.length) return null; return game.bag.pop(); }
export function drawRound(game) {
  game.round++; let drawn = [];
  const attempts = 4 + [...Array(4)].filter(() => game.rng() < HERO.stats.luck / (HERO.stats.luck + 20)).length;
  for (let i = 0; i < attempts && game.reserve.length < 8; i++) { const token = drawOne(game); if (token) { game.reserve.push(token); drawn.push(token); } }
  game.metrics.draws += drawn.length;
  log(game, `Round ${game.round}: drew ${drawn.map(t => TOKEN_META[t].short).join(', ') || 'nothing'} (${game.reserve.length}/8 reserve).`, 'draw');
  const message = `Round ${game.round}: allocate your tokens to prepare actions.`;
  log(game, message, 'event'); setCombatMessage(game, message, 'event', 'Allocate tokens');
  return drawn;
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
  const queue = [...completed.map(action => { const preview = actionPreview(action); return { side: 'hero', action, data: preview.data, initiative: preview.initiative }; }), { side: 'enemy', data: enemyCard, initiative: enemyCard.initiative }]
    .sort((a, b) => b.initiative - a.initiative || (a.side === 'hero' ? -1 : 1));
  game.resolution = { queue, index: 0, last: null };
  setCombatMessage(game, 'Actions are set. The enemy prepares an attack.', 'event', 'Preparing actions');
  return true;
}
export function resolveNextAction(game) {
  if (game.phase !== 'resolving' || !game.resolution) return null;
  const resolution = game.resolution;
  if (resolution.awaitingFinish) return finishRoundResolution(game);
  if (resolution.pendingCritical) return advanceCriticalGamble(game, resolution);
  const item = resolution.queue[resolution.index];
  if (!item || game.hero.hp <= 0 || game.enemy.hp <= 0) return finishRoundResolution(game);
  if (item.side === 'hero') {
    const crits = tokenCount(item.action.assigned, TOKEN.CRITICAL);
    if (crits) return beginCriticalGamble(game, resolution, item, crits);
  }
  const result = item.side === 'hero'
    ? resolveHeroAction(game, item.action, item.data, item.initiative)
    : resolveEnemyAction(game, item.data, item.initiative);
  finishQueueItem(game, resolution, item, result);
  return result;
}
export function finishQueueItem(game, resolution, item, result) {
  resolution.index++;
  resolution.last = result;
  const finalAction = game.hero.hp <= 0 || game.enemy.hp <= 0 || resolution.index >= resolution.queue.length;
  setCombatMessage(game, result.message, result.type, finalAction ? 'Final action resolved' : (item.side === 'hero' ? 'Mara acts' : 'Enemy action revealed'));
  if (finalAction) resolution.awaitingFinish = true;
}
export function beginCriticalGamble(game, resolution, item, crits) {
  const flips = [...Array(crits)].map(() => game.rng() < 0.5);
  resolution.pendingCritical = { item, flips, revealed: 0, mode: 'spinning', outcome: null, multiplier: 0 };
  setCombatMessage(game, `Mara risks ${crits} Critical ${crits === 1 ? 'coin' : 'coins'}!`, 'event', `Critical flip 1/${crits}`);
  return { kind: 'critical-spin', side: 'hero', critical: { flip: 1, total: crits } };
}
export function advanceCriticalGamble(game, resolution) {
  const critical = resolution.pendingCritical;
  if (critical.mode === 'spinning') {
    const success = critical.flips[critical.revealed];
    critical.revealed++;
    critical.mode = 'revealed';
    if (!success) {
      critical.outcome = 'failed'; critical.multiplier = 0; game.metrics.critFailures++;
      const message = 'Critical gamble failed! x0.';
      log(game, message, 'bad'); setCombatMessage(game, message, 'bad', 'Critical failed');
      return { kind: 'critical-reveal', side: 'hero', critical: { flip: critical.revealed, total: critical.flips.length, success, multiplier: 0, failed: true } };
    }
    if (critical.revealed === critical.flips.length) {
      critical.outcome = 'passed'; critical.multiplier = critical.flips.length * 2; game.metrics.critSuccesses += critical.flips.length;
      const message = `Critical success! x${critical.multiplier} potency.`;
      log(game, message, 'good'); setCombatMessage(game, message, 'good', 'Critical success');
      return { kind: 'critical-reveal', side: 'hero', critical: { flip: critical.revealed, total: critical.flips.length, success, multiplier: critical.multiplier, failed: false } };
    }
    setCombatMessage(game, `Critical coin ${critical.revealed}/${critical.flips.length} succeeds!`, 'good', `Critical flip ${critical.revealed}/${critical.flips.length}`);
    return { kind: 'critical-reveal', side: 'hero', critical: { flip: critical.revealed, total: critical.flips.length, success, multiplier: 0, failed: false } };
  }
  if (!critical.outcome) {
    critical.mode = 'spinning';
    const nextFlip = critical.revealed + 1;
    setCombatMessage(game, `Critical coin ${nextFlip}/${critical.flips.length} is flipping…`, 'event', `Critical flip ${nextFlip}/${critical.flips.length}`);
    return { kind: 'critical-spin', side: 'hero', critical: { flip: nextFlip, total: critical.flips.length } };
  }
  resolution.pendingCritical = null;
  let result;
  if (critical.outcome === 'failed') {
    discardAction(game, critical.item.action);
    result = { side: 'hero', name: critical.item.data.name, initiative: critical.item.initiative, message: 'Critical gamble failed! x0.', type: 'bad', effects: [] };
  } else result = resolveHeroAction(game, critical.item.action, critical.item.data, critical.item.initiative, critical.multiplier);
  finishQueueItem(game, resolution, critical.item, result);
  return result;
}
export function finishRoundResolution(game) {
  if (game.phase !== 'resolving') return null;
  game.resolution = null;
  if (game.hero.hp <= 0) { if (game.quest) { endQuest(game, 'defeated'); return { finished: 'defeat' }; } game.phase = 'summary'; const message = 'Mara falls. The tavern grows quiet.'; log(game, message, 'defeat'); setCombatMessage(game, message, 'defeat', 'Defeat'); return { finished: 'defeat' }; }
  if (game.enemy.hp <= 0) { finishBattle(game); return { finished: 'victory' }; }
  game.phase = 'planning'; drawRound(game);
  return { finished: 'planning' };
}
export function resolveRound(game) {
  if (!startRoundResolution(game)) return;
  while (game.phase === 'resolving') resolveNextAction(game);
}
export function resolveHeroAction(game, action, data, initiative, multiplier = 1) {
  const preview = actionPreview(action);
  const amount = preview.potency * multiplier;
  let message; let effects;
  const criticalText = multiplier > 1 ? ` x${multiplier}!` : '!';
  const applyHealthBonus = () => { const before = game.hero.hp; game.hero.hp = Math.min(game.hero.maxHp, game.hero.hp + preview.healthAmount); return game.hero.hp - before; };
  if (data.kind === 'damage') { const before = game.enemy.hp; game.enemy.hp = Math.max(0, game.enemy.hp - amount); const applied = before - game.enemy.hp; const recovered = applyHealthBonus(); message = `Mara uses ${data.name}${criticalText} ${game.enemy.name} takes ${applied} damage.${recovered ? ` Mara recovers ${recovered} HP.` : ''}`; effects = [{ target: 'enemy-hp', delta: -applied, label: `-${applied} HP` }, ...(recovered ? [{ target: 'hero-hp', delta: recovered, label: `+${recovered} HP` }] : [])]; }
  if (data.kind === 'armor') { const before = game.hero.armor; game.hero.armor = Math.min(game.hero.maxHp, game.hero.armor + amount); const applied = game.hero.armor - before; const recovered = applyHealthBonus(); message = `Mara uses ${data.name}${criticalText} Armor rises by ${applied}.${recovered ? ` Mara recovers ${recovered} HP.` : ''}`; effects = [{ target: 'hero-armor', delta: applied, label: `+${applied} Armor` }, ...(recovered ? [{ target: 'hero-hp', delta: recovered, label: `+${recovered} HP` }] : [])]; }
  if (data.kind === 'heal') { const before = game.hero.hp; game.hero.hp = Math.min(game.hero.maxHp, game.hero.hp + amount + preview.healthAmount); const applied = game.hero.hp - before; message = `Mara uses ${data.name}${criticalText} Mara recovers ${applied} HP.`; effects = [{ target: 'hero-hp', delta: applied, label: `+${applied} HP` }]; }
  log(game, message, 'good');
  game.metrics.actions++; action.evolved = !action.evolved; discardAction(game, action);
  return { side: 'hero', name: data.name, initiative, message, type: 'good', effects };
}
export function discardAction(game, action) { game.discard.push(...action.assigned); action.assigned = []; }
export function resolveEnemyAction(game, card, initiative) {
  if (card.kind === 'miss') { const message = `${game.enemy.name} attacks, but misses!`; log(game, message, 'info'); return { side: 'enemy', name: card.name, initiative, message, type: 'info', effects: [] }; }
  const data = card.evolved && card.evolve ? { ...card, ...card.evolve } : card; let damage = data.potency; const absorbed = Math.min(game.hero.armor, damage); game.hero.armor -= absorbed; damage -= absorbed; const before = game.hero.hp; game.hero.hp = Math.max(0, game.hero.hp - damage); const applied = before - game.hero.hp;
  const message = `${game.enemy.name} uses ${data.name}! Mara takes ${applied} damage.${absorbed ? ` Armor absorbs ${absorbed}.` : ''}`;
  const effects = [ ...(absorbed ? [{ target: 'hero-armor', delta: -absorbed, label: `-${absorbed} Armor` }] : []), ...(applied ? [{ target: 'hero-hp', delta: -applied, label: `-${applied} HP` }] : []) ];
  log(game, message, applied ? 'bad' : 'good'); if (card.evolve) card.evolved = !card.evolved;
  return { side: 'enemy', name: data.name, initiative, message, type: applied ? 'bad' : 'good', effects };
}
export function finishBattle(game) { const victory = `${game.enemy.name} is defeated!`; log(game, victory, 'victory'); setCombatMessage(game, victory, 'victory', 'Victory'); if (game.battleIndex === ENCOUNTER.length - 1) { if (game.quest) { game.quest.objectiveComplete = true; game.quest.currentNode = 'watchtower'; game.phase = 'quest-map'; log(game, 'The Old Watchtower is clear. You may search its ruins or finish the quest.', 'victory'); return; } game.phase = 'summary'; const message = 'The encounter is complete. Your story earns a round of applause.'; log(game, message, 'victory'); setCombatMessage(game, message, 'victory', 'Victory'); return; } game.battleIndex++; game.phase = 'battle-transition'; log(game, 'No rest—another shape moves in the candlelight.', 'event'); }
export function continueBattle(game) { if (['intro', 'battle-transition'].includes(game.phase)) startBattle(game); }
