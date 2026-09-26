import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, TOKEN, assignToken, assignRequiredTokens, removeToken, actionComplete, resolveRound, startRoundResolution, resolveNextAction, resolveHeroAction, drawRound, drawEnemyCard, buildBag, compatible, currentAction, actionPreview, continueBattle, WATCHTOWER_QUEST, acceptQuest, chooseOutboundTravel, chooseQuestNode, restAtQuestNode, finishQuest, resolveReturnTravel, finishBattle, endQuest, returnToTavern, questRoute } from './game.js';

const readyGame = seed => { const game = createGame(seed); continueBattle(game); return game; };

test('fixed bag contains one token per stat point', () => { const bag = buildBag(); assert.equal(bag.length, 24); assert.equal(bag.filter(t => t === TOKEN.PHYSICAL).length, 5); assert.equal(bag.filter(t => t === TOKEN.CRITICAL).length, 5); });
test('reserve never exceeds eight tokens', () => { const game = readyGame(2); game.reserve = Array(8).fill(TOKEN.PHYSICAL); drawRound(game); assert.equal(game.reserve.length, 8); });
test('each planning round announces that tokens should be allocated', () => { const game = readyGame(2); assert.equal(game.log[0].text, 'Round 1: allocate your tokens to prepare actions.'); assert.equal(game.combatMessage.state, 'Allocate tokens'); });
test('each draw records its sequence and appended reserve tokens for presentation', () => { const game = readyGame(2); const sequence = game.drawSequence; const startIndex = game.reserve.length; const drawn = drawRound(game); assert.equal(game.lastDraw.sequence, sequence + 1); assert.equal(game.lastDraw.startIndex, startIndex); assert.deepEqual(game.lastDraw.tokens, drawn); assert.deepEqual(game.reserve.slice(startIndex), drawn); });
test('assignment, removal, and completion preserve tokens', () => { const game = readyGame(3); game.reserve = [TOKEN.PHYSICAL, TOKEN.PHYSICAL]; const action = game.actions[0]; assert.equal(assignToken(game, 0, action.id), true); assert.equal(assignToken(game, 0, action.id), true); assert.equal(actionComplete(action), true); assert.equal(game.reserve.length, 0); assert.equal(removeToken(game, action.id, 0), true); assert.equal(actionComplete(action), false); assert.equal(game.reserve.length, 1); });
test('auto-fill assigns only the missing base requirements in reserve order', () => { const game = readyGame(3); game.reserve = [TOKEN.CRITICAL, TOKEN.PHYSICAL, TOKEN.SPEED, TOKEN.PHYSICAL, TOKEN.PHYSICAL]; const action = game.actions.find(item => item.id === 'steel-strike'); assert.equal(assignRequiredTokens(game, action.id), 2); assert.deepEqual(action.assigned, [TOKEN.PHYSICAL, TOKEN.PHYSICAL]); assert.deepEqual(game.reserve, [TOKEN.CRITICAL, TOKEN.SPEED, TOKEN.PHYSICAL]); });
test('auto-fill respects already assigned and unavailable requirements', () => { const game = readyGame(3); const action = game.actions.find(item => item.id === 'shield-bash'); action.assigned = [TOKEN.PHYSICAL]; game.reserve = [TOKEN.SPECIAL, TOKEN.CRITICAL]; assert.equal(assignRequiredTokens(game, action.id), 1); assert.deepEqual(action.assigned, [TOKEN.PHYSICAL, TOKEN.SPECIAL]); assert.deepEqual(game.reserve, [TOKEN.CRITICAL]); game.reserve = [TOKEN.PHYSICAL]; assert.equal(assignRequiredTokens(game, action.id), 0); assert.deepEqual(game.reserve, [TOKEN.PHYSICAL]); });
test('compatibility identifies drag destinations for required, bonus, and universal tokens', () => { const game = readyGame(4); const steelStrike = game.actions.find(action => action.id === 'steel-strike'); const runeBolt = game.actions.find(action => action.id === 'rune-bolt'); assert.equal(compatible(steelStrike, TOKEN.PHYSICAL), true); assert.equal(compatible(steelStrike, TOKEN.MAGICAL), false); steelStrike.assigned = [TOKEN.PHYSICAL, TOKEN.PHYSICAL]; assert.equal(compatible(steelStrike, TOKEN.PHYSICAL), true); assert.equal(compatible(runeBolt, TOKEN.HEALTH), true); assert.equal(compatible(runeBolt, TOKEN.SPEED), true); assert.equal(compatible(runeBolt, TOKEN.CRITICAL), true); });
test('action previews show live Health, Speed, and Critical modifiers', () => { const game = readyGame(5); const quickStrike = game.actions.find(action => action.id === 'quick-strike'); quickStrike.assigned = [TOKEN.PHYSICAL, TOKEN.HEALTH, TOKEN.SPEED, TOKEN.CRITICAL]; const quickPreview = actionPreview(quickStrike); assert.deepEqual({ potency: quickPreview.potency, health: quickPreview.health, healthAmount: quickPreview.healthAmount, initiative: quickPreview.initiative, speed: quickPreview.speed, criticalMultiplier: quickPreview.criticalMultiplier }, { potency: 3, health: 1, healthAmount: 2, initiative: 6, speed: 1, criticalMultiplier: 2 }); const firstAid = game.actions.find(action => action.id === 'first-aid'); const guard = game.actions.find(action => action.id === 'guard-stance'); firstAid.assigned = [TOKEN.HEALTH, TOKEN.HEALTH]; guard.assigned = [TOKEN.HEALTH]; assert.equal(actionPreview(firstAid).healthAmount, 0); firstAid.assigned.push(TOKEN.HEALTH); assert.equal(actionPreview(firstAid).healthAmount, 2); assert.equal(actionPreview(guard).healthAmount, 2); for (const count of [1, 2, 3]) { quickStrike.assigned = Array(count).fill(TOKEN.CRITICAL); assert.equal(actionPreview(quickStrike).criticalMultiplier, count * 2); } });
test('extra Health restores 2 HP without increasing damage or armor potency', () => { const game = readyGame(6); const quickStrike = game.actions.find(action => action.id === 'quick-strike'); game.hero.hp = 10; quickStrike.assigned = [TOKEN.PHYSICAL, TOKEN.HEALTH]; const enemyBefore = game.enemy.hp; const result = resolveHeroAction(game, quickStrike, currentAction(quickStrike), 5); assert.equal(enemyBefore - game.enemy.hp, 3); assert.equal(game.hero.hp, 12); assert.equal(result.evolvedActionId, 'quick-strike'); assert.match(result.message, /takes 3 damage\. Mara recovers 2 HP\./); const guard = game.actions.find(action => action.id === 'guard-stance'); game.hero.hp = 10; guard.assigned = [TOKEN.SPECIAL, TOKEN.SPECIAL, TOKEN.HEALTH]; const armorBefore = game.hero.armor; resolveHeroAction(game, guard, currentAction(guard), 5); assert.equal(game.hero.armor - armorBefore, 6); assert.equal(game.hero.hp, 12); });
test('matching token bonuses apply only beyond an action requirement', () => { const game = readyGame(6); const quickStrike = game.actions.find(action => action.id === 'quick-strike'); const runeBolt = game.actions.find(action => action.id === 'rune-bolt'); const shieldBash = game.actions.find(action => action.id === 'shield-bash'); quickStrike.assigned = [TOKEN.PHYSICAL]; assert.equal(actionPreview(quickStrike).bonus, 0); quickStrike.assigned.push(TOKEN.PHYSICAL); assert.equal(actionPreview(quickStrike).bonus, 2); runeBolt.assigned = [TOKEN.MAGICAL, TOKEN.MAGICAL]; assert.equal(actionPreview(runeBolt).bonus, 0); runeBolt.assigned.push(TOKEN.MAGICAL); assert.equal(actionPreview(runeBolt).bonus, 2); shieldBash.assigned = [TOKEN.PHYSICAL, TOKEN.SPECIAL]; assert.equal(actionPreview(shieldBash).bonus, 0); shieldBash.assigned.push(TOKEN.SPECIAL); assert.equal(actionPreview(shieldBash).bonus, 2); });
test('successful Critical coins resolve sequentially with 2x per coin', () => { for (const count of [1, 2, 3]) { const game = readyGame(30 + count); game.rng = () => 0; game.reserve = [TOKEN.PHYSICAL, ...Array(count).fill(TOKEN.CRITICAL)]; assignToken(game, 0, 'quick-strike'); for (let i = 0; i < count; i++) assignToken(game, 0, 'quick-strike'); game.enemy.drawPile = [0]; startRoundResolution(game); const before = game.enemy.hp; assert.equal(resolveNextAction(game).kind, 'critical-spin'); for (let i = 0; i < count; i++) { const reveal = resolveNextAction(game); assert.equal(reveal.kind, 'critical-reveal'); assert.equal(reveal.critical.success, true); if (i < count - 1) assert.equal(resolveNextAction(game).kind, 'critical-spin'); } const result = resolveNextAction(game); assert.match(result.message, new RegExp(`x${count * 2}!`)); assert.equal(before - game.enemy.hp, Math.min(before, 3 * count * 2)); } });
test('a failed Critical coin cancels the action before its effect applies', () => { const game = readyGame(40); const rolls = [0, 0.75]; game.rng = () => rolls.shift(); game.reserve = [TOKEN.PHYSICAL, TOKEN.CRITICAL, TOKEN.CRITICAL]; assignToken(game, 0, 'quick-strike'); assignToken(game, 0, 'quick-strike'); assignToken(game, 0, 'quick-strike'); game.enemy.drawPile = [0]; const before = game.enemy.hp; startRoundResolution(game); resolveNextAction(game); resolveNextAction(game); resolveNextAction(game); const failed = resolveNextAction(game); assert.equal(failed.critical.failed, true); assert.equal(game.enemy.hp, before); assert.equal(game.metrics.critFailures, 1); const result = resolveNextAction(game); assert.equal(result.message, 'Critical gamble failed! x0.'); assert.equal(result.evolvedActionId, undefined); assert.equal(game.actions.find(action => action.id === 'quick-strike').assigned.length, 0); });
test('completed player action damages enemy and evolves', () => { const game = readyGame(5); game.reserve = [TOKEN.PHYSICAL, TOKEN.PHYSICAL]; assignToken(game, 0, 'steel-strike'); assignToken(game, 0, 'steel-strike'); game.enemy.drawPile = [2]; const before = game.enemy.hp; resolveRound(game); assert.ok(game.enemy.hp < before); assert.equal(game.actions[0].evolved, true); assert.equal(currentAction(game.actions[0]).name, 'Tempered Strike'); });
test('armor absorbs enemy damage and persists into next planning round', () => { const game = readyGame(7); game.hero.armor = 5; game.enemy.drawPile = [0]; resolveRound(game); assert.equal(game.hero.hp, game.hero.maxHp); assert.equal(game.hero.armor, 1); });
test('enemy Miss reshuffles and enemy cards evolve after resolving', () => { const game = readyGame(11); assert.equal(game.enemy.cards.length, 8); game.enemy.drawPile = [7]; const miss = drawEnemyCard(game); assert.equal(miss.kind, 'miss'); assert.equal(game.enemy.drawPile.length, game.enemy.cards.length); game.enemy.drawPile = [0]; resolveRound(game); assert.equal(game.enemy.cards[0].evolved, true); });
test('lethal player action cancels enemy action later in initiative', () => { const game = readyGame(13); game.enemy.hp = 1; game.reserve = [TOKEN.PHYSICAL]; assignToken(game, 0, 'quick-strike'); game.enemy.drawPile = [0]; const hp = game.hero.hp; resolveRound(game); assert.equal(game.hero.hp, hp); assert.equal(game.phase, 'battle-transition'); });
test('lethal final action waits before the battle transitions', () => { const game = readyGame(13); game.enemy.hp = 1; game.reserve = [TOKEN.PHYSICAL]; assignToken(game, 0, 'quick-strike'); game.enemy.drawPile = [0]; assert.equal(startRoundResolution(game), true); resolveNextAction(game); assert.equal(game.phase, 'resolving'); assert.equal(game.resolution.awaitingFinish, true); assert.equal(game.combatMessage.state, 'Final action resolved'); resolveNextAction(game); assert.equal(game.phase, 'battle-transition'); });
test('round resolution holds the final result before entering planning', () => { const game = readyGame(17); game.reserve = [TOKEN.PHYSICAL]; assignToken(game, 0, 'quick-strike'); game.enemy.drawPile = [0]; const enemyHp = game.enemy.hp; assert.equal(startRoundResolution(game), true); assert.equal(game.phase, 'resolving'); assert.equal(game.resolution.queue.length, 2); const result = resolveNextAction(game); assert.equal(result.name, 'Quick Strike'); assert.ok(game.enemy.hp < enemyHp); assert.equal(game.phase, 'resolving'); resolveNextAction(game); assert.equal(game.phase, 'resolving'); assert.equal(game.resolution.awaitingFinish, true); assert.equal(game.combatMessage.state, 'Final action resolved'); resolveNextAction(game); assert.equal(game.phase, 'planning'); assert.equal(game.combatMessage.state, 'Allocate tokens'); });
test('resolution results expose applied armor and health changes', () => { const game = readyGame(19); game.hero.armor = 5; game.enemy.drawPile = [0]; startRoundResolution(game); const result = resolveNextAction(game); assert.deepEqual(result.effects, [{ target: 'hero-armor', delta: -4, label: '-4 Armor' }]); assert.equal(game.hero.hp, game.hero.maxHp); });
test('enemy attack stays hidden until its scheduled resolution', () => { const game = readyGame(23); game.reserve = [TOKEN.PHYSICAL]; assignToken(game, 0, 'quick-strike'); game.enemy.drawPile = [0]; startRoundResolution(game); assert.equal(game.combatMessage.text, 'Actions are set. The enemy prepares an attack.'); assert.equal(game.resolution.resolved.length, 0); assert.equal(game.log.some(item => item.text.includes('Slash')), false); const heroResult = resolveNextAction(game); assert.match(heroResult.message, /^Mara uses Quick Strike!/); assert.equal(game.resolution.resolved[0].name, 'Quick Strike'); assert.equal(game.log.some(item => item.text.includes('uses Slash')), false); const enemyResult = resolveNextAction(game); assert.match(enemyResult.message, /uses Slash!/); assert.equal(game.resolution.resolved[1].name, 'Slash'); assert.equal(game.combatMessage.state, 'Final action resolved'); resolveNextAction(game); assert.equal(game.combatMessage.state, 'Allocate tokens'); });

test('the Watchtower listing has the promised board metadata and only accepts once', () => {
  const game = createGame();
  assert.equal(WATCHTOWER_QUEST.rewardGold, 25);
  assert.match(WATCHTOWER_QUEST.location, /Watchtower/);
  assert.equal(acceptQuest(game), true);
  assert.equal(game.phase, 'outbound-travel');
  assert.equal(acceptQuest(game), false);
});

test('travel, rest, encounter, and archive nodes advance the quest calendar', () => {
  const game = createGame(); acceptQuest(game);
  chooseOutboundTravel(game, 'bramble'); assert.equal(game.day, 2);
  chooseQuestNode(game, 'rest'); assert.equal(game.phase, 'rest');
  game.hero.hp = 4; restAtQuestNode(game, 2); assert.equal(game.day, 4); assert.equal(game.hero.hp, 14);
  chooseQuestNode(game, 'watchtower'); assert.equal(game.phase, 'planning'); assert.equal(game.day, 5);
  game.battleIndex = 1; finishBattle(game); assert.equal(game.phase, 'quest-map'); assert.equal(game.quest.objectiveComplete, true);
  chooseQuestNode(game, 'cache'); assert.equal(game.day, 6); assert.equal(game.quest.bonusGold, 10);
});

test('quest completion grants base and cache rewards then clears quest-local armor and evolution', () => {
  const game = createGame(); acceptQuest(game); chooseOutboundTravel(game, 'lantern');
  game.quest.objectiveComplete = true; game.quest.bonusGold = 10; game.hero.armor = 8; game.actions[0].evolved = true;
  assert.equal(finishQuest(game), true); assert.equal(game.phase, 'return-travel');
  assert.equal(resolveReturnTravel(game), true); assert.equal(game.phase, 'quest-result');
  assert.equal(game.gold, 35); assert.equal(game.hero.armor, 0); assert.equal(game.actions[0].evolved, false);
  assert.equal(game.completedQuest, true); assert.equal(returnToTavern(game), true); assert.equal(game.phase, 'tavern');
});

test('abandoning or being defeated forfeits rewards and records the outcome', () => {
  const abandoned = createGame(); acceptQuest(abandoned); chooseOutboundTravel(abandoned, 'bramble');
  assert.equal(finishQuest(abandoned), true); assert.equal(abandoned.questHistory.at(-1).outcome, 'abandoned'); assert.equal(abandoned.gold, 0);
  const defeated = createGame(); acceptQuest(defeated); defeated.hero.armor = 5; assert.equal(endQuest(defeated, 'defeated'), true);
  assert.equal(defeated.questHistory.at(-1).outcome, 'defeated'); assert.equal(defeated.gold, 0); assert.equal(defeated.hero.armor, 0);
});

test('a deterministic tavern-to-completion flow returns Mara with the quest reward', () => {
  const game = createGame(99);
  assert.equal(acceptQuest(game), true);
  assert.equal(chooseOutboundTravel(game, 'bramble'), true);
  assert.equal(chooseQuestNode(game, 'watchtower'), true);
  game.battleIndex = 1; finishBattle(game);
  assert.equal(game.quest.objectiveComplete, true);
  assert.equal(finishQuest(game), true);
  assert.equal(resolveReturnTravel(game), true);
  assert.deepEqual(game.questHistory.at(-1), { title: WATCHTOWER_QUEST.title, outcome: 'completed', days: 3, reward: 25, cacheFound: false });
  assert.equal(returnToTavern(game), true);
});

test('quest route exposes only current and immediate route nodes outside combat', () => {
  const game = createGame(); acceptQuest(game);
  assert.deepEqual(questRoute(game).map(node => [node.id, node.status]), [['town', 'completed'], ['outbound', 'current']]);
  chooseOutboundTravel(game, 'bramble');
  assert.deepEqual(questRoute(game).map(node => [node.id, node.status]), [['town', 'completed'], ['outbound', 'completed'], ['crossroads', 'current'], ['shrine', 'available'], ['watchtower', 'available']]);
  chooseQuestNode(game, 'rest'); assert.equal(game.quest.currentNode, 'shrine');
  assert.deepEqual(questRoute(game).map(node => [node.id, node.status]), [['town', 'completed'], ['outbound', 'completed'], ['crossroads', 'completed'], ['shrine', 'current'], ['watchtower', 'available']]);
  restAtQuestNode(game, 1); assert.equal(game.quest.currentNode, 'shrine');
  assert.deepEqual(questRoute(game).map(node => [node.id, node.status]), [['town', 'completed'], ['outbound', 'completed'], ['shrine', 'current'], ['watchtower', 'available']]);
  chooseQuestNode(game, 'watchtower'); assert.equal(game.quest.currentNode, 'watchtower'); assert.deepEqual(questRoute(game), []);
  game.battleIndex = 1; finishBattle(game);
  assert.deepEqual(questRoute(game).map(node => [node.id, node.status]), [['town', 'completed'], ['outbound', 'completed'], ['shrine', 'completed'], ['watchtower', 'current'], ['archive', 'available'], ['return', 'available']]);
  chooseQuestNode(game, 'cache'); assert.equal(game.quest.currentNode, 'archive');
  assert.equal(questRoute(game).find(node => node.id === 'archive').status, 'current');
  finishQuest(game); assert.equal(game.quest.currentNode, 'return');
  assert.equal(questRoute(game).find(node => node.id === 'return').status, 'current');
});
