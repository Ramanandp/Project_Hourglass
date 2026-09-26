import { createGame, assignToken, assignRequiredTokens, removeToken, startRoundResolution, resolveNextAction, continueBattle, TOKEN_META, actionComplete, currentAction, actionPreview, compatible, tokenCount, WATCHTOWER_QUEST, acceptQuest, chooseOutboundTravel, chooseQuestNode, restAtQuestNode, finishQuest, resolveReturnTravel, returnToTavern, questRoute } from './game.js';

const root = document.querySelector('#game');
let game = createGame(); let selected = null; let resolutionTimer = null; let hitShakeTimer = null; let actionFlipTimer = null; let flippingActionId = null; let effectId = 0; let floatingEffects = []; let transcriptScrollTop = 0; let transcriptFollowsLatest = true; let draggedToken = null; let renderedDrawSequence = null;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const TOKEN_HELP = Object.freeze({ health: 'As an extra token, restores 2 HP after the action; it can also power First Aid.', physical: 'Powers weapon actions and adds +2 potency when used as an extra matching token.', magical: 'Powers Rune Bolt and adds +2 potency when used as an extra matching token.', special: 'Powers mixed, defensive, and special actions; extras add +2 potency.', speed: 'Universal modifier: adds +1 initiative, helping the action resolve earlier.', critical: 'Universal gamble: each one flips at 50%. Any failed flip makes the action fail; successes multiply potency.' });
const token = (type, index, assigned = false, actionId = '', drawOrder = null) => `<button class="token ${type}${selected === index && !assigned ? ' selected' : ''}${drawOrder === null ? '' : ' token-drawn'}" ${drawOrder === null ? '' : `style="--draw-order:${drawOrder}"`} data-token="${index}" data-token-type="${type}" data-action="${actionId}" title="${TOKEN_META[type].label}: ${TOKEN_HELP[type]}" aria-label="${assigned ? 'Remove ' : 'Select '}${TOKEN_META[type].label}. ${TOKEN_HELP[type]}" ${!assigned && game.phase === 'planning' ? 'draggable="true"' : ''} ${game.phase !== 'planning' ? 'disabled' : ''}><b>${TOKEN_META[type].symbol}</b><span>${TOKEN_META[type].short}</span></button>`;
function meter(label, value, max, cls = '', target = '') { const effects = floatingEffects.filter(effect => effect.target === target).map(effect => `<b class="combat-float ${effect.delta < 0 ? 'loss' : 'gain'}">${effect.label}</b>`).join(''); return `<div class="meter ${cls}"><span>${label} <b>${value}/${max}</b></span><div class="meter-track"><i><em style="width:${Math.max(0, Math.min(100, value / max * 100))}%"></em></i>${effects}</div></div>`; }
function actionCard(action) { const preview = actionPreview(action); const { data } = preview; const complete = actionComplete(action); const base = action.base.map(type => `<b class="requirement-token" data-requirement="${type}">${TOKEN_META[type].short}</b>`).join(' + '); const label = ({ damage: 'Damage', heal: 'Heal', armor: 'Armor' })[data.kind]; const displayedPotency = preview.potency + (data.kind === 'heal' ? preview.healthAmount : 0); const potency = displayedPotency === preview.basePotency ? `${label} ${preview.basePotency}` : `${label} ${preview.basePotency} &rarr; <b class="preview-value">${displayedPotency}</b>`; const modifiers = [preview.bonus && `<b class="preview-bonus">+${preview.bonus} matching</b>`, preview.healthAmount && `<b class="preview-benefit">+${preview.healthAmount} Health</b>`].filter(Boolean).join(' '); const initiative = preview.speed ? `Init ${preview.baseInitiative} &rarr; <b class="preview-value">${preview.initiative}</b>` : `Init ${preview.baseInitiative}`; const critical = preview.criticals ? `<b class="preview-critical">Critical: x${preview.criticalMultiplier} on success</b>` : ''; return `<article class="action ${complete ? 'complete' : ''}${flippingActionId === action.id ? ' action-flipping' : ''}" data-action-card="${action.id}" tabindex="0" role="button" aria-label="Assign selected token to ${data.name}" aria-disabled="${game.phase !== 'planning'}"><div><h3>${esc(data.name)} ${action.evolved ? '<small>evolved</small>' : ''}</h3><p>${esc(action.note)}</p></div><div class="requirements"><span>Need: ${base}</span><span class="action-preview">${potency} ${modifiers}</span><span class="action-preview">${initiative}</span>${critical}</div><div class="assigned">${action.assigned.map((t, i) => token(t, i, true, action.id)).join('') || '<span class="empty">Awaiting tokens</span>'}</div></article>`; }
function resolutionPanel(battle) {
  const message = game.combatMessage || { text: 'Choose tokens and prepare your actions.', type: 'info', state: `Round ${game.round}` };
  const state = message.state || (game.phase === 'resolving' ? 'Resolving round' : `Round ${game.round}`);
  const transcript = [...game.log].reverse();
  const critical = game.resolution?.pendingCritical;
  const gamble = critical ? `<div class="critical-gamble ${critical.outcome === 'failed' ? 'failed' : critical.outcome === 'passed' ? 'passed' : ''}" aria-live="polite"><div class="critical-coins">${critical.flips.map((flip, index) => `<b class="critical-coin ${index < critical.revealed ? (flip ? 'win' : 'loss') : index === critical.revealed && critical.mode === 'spinning' ? 'spinning' : 'waiting'}">${index < critical.revealed ? (flip ? '✦' : '×') : '?'}</b>`).join('')}</div><p>${critical.outcome === 'failed' ? 'FAILED · x0' : critical.outcome === 'passed' ? `SUCCESS · x${critical.multiplier}` : `Flip ${Math.min(critical.revealed + 1, critical.flips.length)}/${critical.flips.length}`}</p></div>` : '';
  const resolution = game.resolution;
  const timeline = resolution ? `<ol class="initiative-timeline" aria-label="Round initiative order">${resolution.queue.map((item, index) => { const resolved = resolution.resolved[index]; const current = !resolution.awaitingFinish && index === resolution.index; const status = resolved ? 'resolved' : current ? 'current' : 'upcoming'; const name = resolved ? resolved.name : item.side === 'hero' ? item.data.name : 'Enemy intent hidden'; const statusText = resolved ? 'Resolved' : current ? (critical ? 'Resolving Critical' : 'Up next') : 'Waiting'; return `<li class="${status} ${item.side}"><b class="timeline-order">${index + 1}</b><span><strong>${esc(name)}</strong><small>${statusText}</small></span></li>`; }).join('')}</ol>` : '';
  return `<div class="resolution-panel"><div class="versus">VS<br><small>Battle ${battle}/2</small></div>${timeline}<div class="battle-message ${message.type}" aria-live="polite"><p class="resolution-state">${esc(state)}</p><p>${esc(message.text)}</p></div>${gamble}<ol class="battle-log" aria-label="Battle chronicle">${transcript.map(item => `<li class="${item.type}">${esc(item.text)}</li>`).join('')}</ol></div>`;
}
function syncBattleTranscript() {
  const transcript = root.querySelector('.battle-log');
  if (!transcript) return;
  transcript.scrollTop = transcriptFollowsLatest ? transcript.scrollHeight : transcriptScrollTop;
  transcript.addEventListener('scroll', () => {
    transcriptScrollTop = transcript.scrollTop;
    transcriptFollowsLatest = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 8;
  });
}
function triggerHitShake() {
  const app = document.querySelector('.app');
  if (!app) return;
  clearTimeout(hitShakeTimer); app.classList.remove('hit-shake'); void app.offsetWidth; app.classList.add('hit-shake');
  hitShakeTimer = setTimeout(() => app.classList.remove('hit-shake'), 420);
}
function triggerActionFlip(actionId) {
  clearTimeout(actionFlipTimer); flippingActionId = actionId;
  actionFlipTimer = setTimeout(() => { flippingActionId = null; render(); }, 600);
}
function showEffects(effects = []) {
  const added = effects.filter(effect => effect.delta !== 0).map(effect => ({ ...effect, id: ++effectId }));
  if (effects.some(effect => effect.target === 'hero-hp' && effect.delta < 0)) triggerHitShake();
  if (!added.length) return;
  floatingEffects.push(...added);
  setTimeout(() => { const ids = new Set(added.map(effect => effect.id)); floatingEffects = floatingEffects.filter(effect => !ids.has(effect.id)); render(); }, 900);
}
function playResolution(delay = 2000) {
  clearTimeout(resolutionTimer);
  resolutionTimer = setTimeout(() => {
    const result = resolveNextAction(game);
    if (result) { showEffects(result.effects); if (result.evolvedActionId) triggerActionFlip(result.evolvedActionId); }
    render();
    if (game.phase === 'resolving') playResolution(result?.kind?.startsWith('critical-') ? 900 : 2000);
  }, delay);
}
function actionForCard(card) { return game.actions.find(action => action.id === card?.dataset.actionCard); }
function canDropOn(card) { return game.phase === 'planning' && !!draggedToken && !!actionForCard(card) && compatible(actionForCard(card), draggedToken.type); }
function clearRequirementHighlights() { root.querySelectorAll('.token.required-token').forEach(tokenButton => tokenButton.classList.remove('required-token')); }
function showRequiredTokenHighlights(card) {
  clearRequirementHighlights();
  if (game.phase !== 'planning') return;
  const action = actionForCard(card);
  if (!action) return;
  for (const type of [...new Set(action.base)]) {
    let remaining = tokenCount(action.base, type) - tokenCount(action.assigned, type);
    if (remaining <= 0) continue;
    for (const tokenButton of root.querySelectorAll(`.reserve-row [data-token-type="${type}"]`)) {
      if (remaining-- <= 0) break;
      tokenButton.classList.add('required-token');
    }
  }
}
function clearDragState() {
  draggedToken = null;
  clearRequirementHighlights();
  root.querySelectorAll('.token.dragging').forEach(tokenButton => tokenButton.classList.remove('dragging'));
  root.querySelectorAll('.action').forEach(card => {
    card.classList.remove('drag-compatible', 'drop-active');
    Object.keys(TOKEN_META).forEach(type => card.classList.remove(`drag-token-${type}`));
  });
}
function showDropTargets() {
  root.querySelectorAll('[data-action-card]').forEach(card => {
    if (!canDropOn(card)) return;
    card.classList.add('drag-compatible', `drag-token-${draggedToken.type}`);
  });
}
function campaignBar() { return `<div class="campaign-bar"><span>Day <b>${game.day}</b></span><span>Gold <b>${game.gold}</b></span><span>${game.hero.name} · ${game.hero.hp}/${game.hero.maxHp} HP</span></div>`; }
function questRouteView() {
  const nodes = questRoute(game); if (!nodes.length) return '';
  return `<nav class="quest-route" aria-label="Quest route"><p>Quest route</p><ol>${nodes.map(node => `<li class="route-node ${node.status}${node.completed ? ' completed' : ''}" ${node.status === 'current' ? 'aria-current="step"' : ''}><b aria-hidden="true">${node.completed ? '✓' : node.status === 'current' ? '●' : '○'}</b><span>${esc(node.label)}</span></li>`).join('')}</ol></nav>`;
}
function tavernView() {
  const exhausted = game.hero.hp <= 0;
  if (game.completedQuest) return `<section class="summary won"><p class="eyebrow">The tavern, day ${game.day}</p><h2>The board is quiet</h2><p>The Old Watchtower has been cleared. Mara’s tale is now part of the tavern’s history.</p><p><b>${game.gold} gold</b> carried home.</p><button class="primary" data-restart>Start a fresh tale</button></section>`;
  if (exhausted) return `<section class="summary lost"><p class="eyebrow">The tavern, day ${game.day}</p><h2>Mara needs a new beginning</h2><p>Her last outing ended in defeat. This prototype has no retirement system yet.</p><button class="primary" data-restart>Start a fresh tale</button></section>`;
  const q = WATCHTOWER_QUEST;
  return `<section class="tavern-panel"><p class="eyebrow">The inn and tavern · day ${game.day}</p><h2>What tale will Mara tell?</h2><p>The innkeeper turns the quest board toward you.</p><article class="quest-card"><div><p class="eyebrow">${esc(q.risk)}</p><h3>${esc(q.title)}</h3><p>${esc(q.objective)}</p></div><dl><div><dt>Location</dt><dd>${esc(q.location)}</dd></div><div><dt>Estimated duration</dt><dd>${esc(q.estimatedDays)}</dd></div><div><dt>Known enemies</dt><dd>${esc(q.enemies)}</dd></div><div><dt>Guaranteed reward</dt><dd>${q.rewardGold} gold</dd></div><div><dt>Expires</dt><dd>${esc(q.expiration)}</dd></div></dl><button class="primary" data-accept>Accept quest</button></article></section>`;
}
function travelView() { return `<section class="story-panel"><p class="eyebrow">Outward journey · quest day ${game.quest.days}</p><h2>The road to the Old Watchtower</h2><p>Rain gathers in the ruts ahead. A faded lantern trail follows the old road; brambles hide a narrower way through the woods.</p><div class="choice-grid"><button class="choice" data-travel="lantern"><b>Follow the lantern trail</b><span>Trust the old road and its weathered markers.</span></button><button class="choice" data-travel="bramble"><b>Take the bramble path</b><span>Push through the close, quiet woods.</span></button></div></section>`; }
function mapView() {
  const q = game.quest;
  const beforeObjective = !q.objectiveComplete;
  return `<section class="story-panel"><p class="eyebrow">Old Watchtower · quest day ${q.days}</p><h2>${beforeObjective ? 'Choose the next part of the tale' : 'The watchtower is clear'}</h2><p>${beforeObjective ? 'You see only the paths immediately before you. Each sign gives a sense of its cost.' : 'The objective is complete. You can leave now or search one more place.'}</p><div class="map-status"><b>${q.objectiveComplete ? 'Objective complete' : 'Objective: clear the watchtower'}</b><span>${q.rested ? 'The shrine has already sheltered you.' : 'A safe shrine lies off the road.'}</span></div><div class="choice-grid">${beforeObjective ? `${!q.rested ? '<button class="choice" data-node="rest"><b>Crumbled shrine · Rest</b><span>A safe place to recover. Estimated: 1–2 days.</span></button>' : ''}<button class="choice danger" data-node="watchtower"><b>Watchtower gate · Encounter</b><span>The captain’s camp blocks the way. Estimated: 1 day.</span></button>` : `${!q.cacheFound ? '<button class="choice" data-node="cache"><b>Search the fallen archive · Story</b><span>There may be something left beneath the stones. Estimated: 1 day.</span></button>' : '<div class="choice used"><b>Fallen archive searched</b><span>The hidden cache is safely packed away.</span></div>'}<button class="choice finish" data-finish><b>Finish Quest</b><span>Return to town with the story you have.</span></button>`}</div>${beforeObjective ? '<button class="text-button" data-finish>Finish Quest</button>' : ''}</section>`;
}
function restView() { return `<section class="story-panel"><p class="eyebrow">Crumbled shrine</p><h2>How long will Mara rest?</h2><p>The old shrine is dry, quiet, and safe. Each day restores 5 HP.</p><div class="choice-grid"><button class="choice" data-rest="1"><b>One night</b><span>Rest, then continue at first light.</span></button><button class="choice" data-rest="2"><b>Two nights</b><span>Take the time to recover more fully.</span></button></div></section>`; }
function returnTravelView() { return `<section class="story-panel"><p class="eyebrow">Return journey</p><h2>Homeward through the rain</h2><p>The road feels shorter with the tower behind you. By evening, tavern light spills across the mud.</p><button class="primary" data-return>Return to the tavern</button></section>`; }
function resultView() { const result = game.questHistory.at(-1); const won = result.outcome === 'completed'; return `<section class="summary ${won ? 'won' : 'lost'}"><p class="eyebrow">${won ? 'A tale well told' : 'An unfinished tale'}</p><h2>${won ? 'Quest Complete' : result.outcome === 'defeated' ? 'Mara Has Fallen' : 'Quest Abandoned'}</h2><p>${won ? `The tavern pays Mara ${result.reward} gold for clearing the Old Watchtower.` : 'No quest reward is paid, but the tavern door is still open.'}</p><div class="summary-grid"><b>Quest days ${result.days}</b><b>Reward ${result.reward} gold</b><b>${result.cacheFound ? 'Archive cache found' : 'No archive cache'}</b></div><button class="primary" data-tavern>Return to tavern</button></section>`; }
function render() {
  const previousTranscript = root.querySelector('.battle-log');
  if (previousTranscript) {
    transcriptScrollTop = previousTranscript.scrollTop;
    transcriptFollowsLatest = previousTranscript.scrollHeight - previousTranscript.scrollTop - previousTranscript.clientHeight < 8;
  }
  if (['intro', 'tavern'].includes(game.phase)) { root.innerHTML = campaignBar() + tavernView(); return; }
  if (game.phase === 'outbound-travel') { root.innerHTML = campaignBar() + questRouteView() + travelView(); return; }
  if (game.phase === 'quest-map') { root.innerHTML = campaignBar() + questRouteView() + mapView(); return; }
  if (game.phase === 'rest') { root.innerHTML = campaignBar() + questRouteView() + restView(); return; }
  if (game.phase === 'return-travel') { root.innerHTML = campaignBar() + questRouteView() + returnTravelView(); return; }
  if (game.phase === 'quest-result') { root.innerHTML = campaignBar() + resultView(); return; }
  const enemy = game.enemy; const battle = game.battleIndex + 1; const draw = game.lastDraw?.sequence !== renderedDrawSequence ? game.lastDraw : null; const available = game.reserve.map((t, i) => { const drawOrder = draw && i >= draw.startIndex && i < draw.startIndex + draw.tokens.length ? i - draw.startIndex : null; return token(t, i, false, '', drawOrder); }).join('') || '<span class="empty">No reserve tokens</span>';
  if (game.phase === 'summary') { const won = game.hero.hp > 0; root.innerHTML = `<section class="summary ${won?'won':'lost'}"><p class="eyebrow">${won?'A story well told':'An unfinished tale'}</p><h2>${won ? 'Encounter Complete' : 'Mara Has Fallen'}</h2><p>${won ? 'The Gargoyle crumbles into dust as the tavern erupts in applause.' : 'The encounter ends, but the next telling begins with what you learned.'}</p><div class="summary-grid"><b>Battles ${game.battleIndex + 1}/${2}</b><b>Rounds ${game.round}</b><b>Tokens drawn ${game.metrics.draws}</b><b>Actions resolved ${game.metrics.actions}</b><b>Critical successes ${game.metrics.critSuccesses}</b><b>Critical failures ${game.metrics.critFailures}</b></div><button class="primary" data-restart>Tell it again</button></section>`; return; }
  root.innerHTML = `<section class="scene"><div class="status hero"><p class="eyebrow">Your adventurer</p><h2>${game.hero.name}</h2>${meter('Health',game.hero.hp,game.hero.maxHp,'health','hero-hp')}${meter('Armor',game.hero.armor,game.hero.maxHp,'armor','hero-armor')}<p class="statline">VIT 4 &middot; STR 5 &middot; INT 3 &middot; DEX 3 &middot; SPD 4 &middot; LUCK 5</p></div>${resolutionPanel(battle)}<div class="status enemy"><p class="eyebrow">Hidden intent</p><h2>${enemy.name}</h2>${meter('Health',enemy.hp,enemy.maxHp,'enemyhp','enemy-hp')}<p class="statline">Attack cards remaining: ${enemy.remaining}/${enemy.cards.length}</p></div></section>
  ${game.phase === 'battle-transition' ? `<section class="transition"><h2>Another foe closes in</h2><p>Your armor and evolving actions carry onward. The reserve and bag refresh.</p><button class="primary" data-continue>Continue battle</button></section>` : `<section class="combat ${game.phase === 'resolving' ? 'resolving' : ''}"><div class="reserve"><div class="section-title"><h2>Token Reserve</h2><span>${game.reserve.length}/8</span></div><p>${game.phase === 'resolving' ? 'Actions are resolving…' : 'Select a token, then an action.'}</p><div class="reserve-row"><div class="tokens">${available}</div><button class="primary" data-resolve ${game.phase !== 'planning' ? 'disabled' : ''}>${game.phase === 'resolving' ? 'Resolving round…' : `Resolve round ${game.round}`}</button></div></div><div class="actions"><div class="section-title"><h2>Equipment actions</h2><span>Completed actions glow</span></div><div class="action-grid">${game.actions.map(actionCard).join('')}</div></div></section>`}`;
  if (draw) renderedDrawSequence = draw.sequence;
  syncBattleTranscript();
}
root.addEventListener('click', event => { const tok = event.target.closest('[data-token]'); const card = event.target.closest('[data-action-card]'); const travel = event.target.closest('[data-travel]'); const node = event.target.closest('[data-node]'); const rest = event.target.closest('[data-rest]'); if (event.target.closest('[data-accept]')) { acceptQuest(game); render(); return; } if (travel) { chooseOutboundTravel(game, travel.dataset.travel); render(); return; } if (node) { chooseQuestNode(game, node.dataset.node); render(); return; } if (rest) { restAtQuestNode(game, Number(rest.dataset.rest)); render(); return; } if (event.target.closest('[data-finish]')) { if (!game.quest?.objectiveComplete && !window.confirm('Leave before clearing the watchtower? This abandons the quest and forfeits its reward.')) return; finishQuest(game); render(); return; } if (event.target.closest('[data-return]')) { resolveReturnTravel(game); render(); return; } if (event.target.closest('[data-tavern]')) { returnToTavern(game); render(); return; } if (tok && tok.dataset.action) { removeToken(game, tok.dataset.action, Number(tok.dataset.token)); selected = null; render(); return; } if (tok) { selected = Number(tok.dataset.token); render(); return; } if (card && game.phase === 'planning') { assignRequiredTokens(game, card.dataset.actionCard); selected = null; render(); return; } if (event.target.closest('[data-start]')) { continueBattle(game); render(); } if (event.target.closest('[data-resolve]')) { selected = null; if (startRoundResolution(game)) { render(); playResolution(); } return; } if (event.target.closest('[data-continue]')) { continueBattle(game); render(); } if (event.target.closest('[data-restart]')) { clearTimeout(resolutionTimer); clearTimeout(hitShakeTimer); clearTimeout(actionFlipTimer); flippingActionId = null; document.querySelector('.app')?.classList.remove('hit-shake'); floatingEffects = []; game = createGame(); renderedDrawSequence = null; selected = null; render(); } });
root.addEventListener('dragstart', event => {
  const tok = event.target.closest('[data-token]');
  if (!tok || tok.dataset.action || game.phase !== 'planning') return;
  draggedToken = { index: Number(tok.dataset.token), type: tok.dataset.tokenType };
  event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', draggedToken.type);
  tok.classList.add('dragging'); showDropTargets();
});
root.addEventListener('dragover', event => {
  const card = event.target.closest('[data-action-card]');
  if (!canDropOn(card)) return;
  event.preventDefault(); event.dataTransfer.dropEffect = 'move';
  card.classList.add('drop-active');
});
root.addEventListener('dragleave', event => {
  const card = event.target.closest('[data-action-card]');
  if (card && !card.contains(event.relatedTarget)) card.classList.remove('drop-active');
});
root.addEventListener('drop', event => {
  const card = event.target.closest('[data-action-card]');
  if (!canDropOn(card)) return;
  event.preventDefault(); const assigned = assignToken(game, draggedToken.index, card.dataset.actionCard);
  clearDragState(); if (assigned) { selected = null; render(); }
});
root.addEventListener('dragend', clearDragState);
root.addEventListener('pointerover', event => { const card = event.target.closest('[data-action-card]'); if (card && !card.contains(event.relatedTarget)) showRequiredTokenHighlights(card); });
root.addEventListener('pointerout', event => { const card = event.target.closest('[data-action-card]'); if (card && !card.contains(event.relatedTarget)) clearRequirementHighlights(); });
root.addEventListener('focusin', event => { const card = event.target.closest('[data-action-card]'); if (card) showRequiredTokenHighlights(card); });
root.addEventListener('focusout', event => { const card = event.target.closest('[data-action-card]'); if (card && !card.contains(event.relatedTarget)) clearRequirementHighlights(); });
root.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action-card]')) { event.preventDefault(); event.target.click(); } });
render();
