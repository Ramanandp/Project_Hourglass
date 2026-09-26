import { createGame, assignToken, assignRequiredTokens, removeToken, startRoundResolution, resolveNextAction, continueBattle, TOKEN_META, actionComplete, currentAction, actionPreview, compatible, tokenCount, WATCHTOWER_QUEST, INTRO_BEATS, advanceIntro, skipIntro, chooseTavernResponse, openQuestBoard, beginQuestAcceptance, acceptQuest, chooseOutboundTravel, chooseQuestNode, restAtQuestNode, finishQuest, resolveReturnTravel, returnToTavern, questRoute } from './game.js';

const root = document.querySelector('#game');
let game = createGame(); let selected = null; let resolutionTimer = null; let hitShakeTimer = null; let actionFlipTimer = null; let flippingActionId = null; let effectId = 0; let floatingEffects = []; let transcriptScrollTop = 0; let transcriptFollowsLatest = true; let draggedToken = null; let renderedDrawSequence = null;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const TOKEN_HELP = Object.freeze({ health: 'As an extra token, restores 2 HP after the action; it can also power First Aid.', physical: 'Powers weapon actions and adds +2 potency when used as an extra matching token.', magical: 'Powers Rune Bolt and adds +2 potency when used as an extra matching token.', special: 'Powers mixed, defensive, and special actions; extras add +2 potency.', speed: 'Universal modifier: adds +1 initiative, helping the action resolve earlier.', critical: 'Universal gamble: each one flips at 50%. Any failed flip makes the action fail; successes multiply potency.' });
const token = (type, index, assigned = false, actionId = '', drawOrder = null) => `<button class="token ${type}${selected === index && !assigned ? ' selected' : ''}${drawOrder === null ? '' : ' token-drawn'}" ${drawOrder === null ? '' : `style="--draw-order:${drawOrder}"`} data-token="${index}" data-token-type="${type}" data-action="${actionId}" title="${TOKEN_META[type].label}: ${TOKEN_HELP[type]}" aria-label="${assigned ? 'Record that you kept ' : 'Record that you committed '}${TOKEN_META[type].label}. ${TOKEN_HELP[type]}" ${!assigned && game.phase === 'planning' ? 'draggable="true"' : ''} ${game.phase !== 'planning' ? 'disabled' : ''}><b>${TOKEN_META[type].symbol}</b><span>${TOKEN_META[type].short}</span></button>`;
function meter(label, value, max, cls = '', target = '') { const effects = floatingEffects.filter(effect => effect.target === target).map(effect => `<b class="combat-float ${effect.delta < 0 ? 'loss' : 'gain'}">${effect.label}</b>`).join(''); return `<div class="meter ${cls}"><span>${label} <b>${value}/${max}</b></span><div class="meter-track"><i><em style="width:${Math.max(0, Math.min(100, value / max * 100))}%"></em></i>${effects}</div></div>`; }
function actionCard(action) { const preview = actionPreview(action); const { data } = preview; const complete = actionComplete(action); const base = action.base.map(type => `<b class="requirement-token" data-requirement="${type}">${TOKEN_META[type].short}</b>`).join(' + '); const label = ({ damage: 'Damage', heal: 'Heal', armor: 'Armor' })[data.kind]; const displayedPotency = preview.potency + (data.kind === 'heal' ? preview.healthAmount : 0); const potency = displayedPotency === preview.basePotency ? `${label} ${preview.basePotency}` : `${label} ${preview.basePotency} &rarr; <b class="preview-value">${displayedPotency}</b>`; const modifiers = [preview.bonus && `<b class="preview-bonus">+${preview.bonus} matching</b>`, preview.healthAmount && `<b class="preview-benefit">+${preview.healthAmount} Health</b>`].filter(Boolean).join(' '); const initiative = preview.speed ? `Init ${preview.baseInitiative} &rarr; <b class="preview-value">${preview.initiative}</b>` : `Init ${preview.baseInitiative}`; const critical = preview.criticals ? `<b class="preview-critical">Critical: x${preview.criticalMultiplier} on success</b>` : ''; return `<article class="action ${complete ? 'complete' : ''}${flippingActionId === action.id ? ' action-flipping' : ''}" data-action-card="${action.id}" tabindex="0" role="button" aria-label="Record the selected token as part of your ${data.name}" aria-disabled="${game.phase !== 'planning'}"><div><h3>${esc(data.name)} ${action.evolved ? '<small>evolved</small>' : ''}</h3><p>${esc(action.note)}</p></div><div class="requirements"><span>Needed: ${base}</span><span class="action-preview">${potency} ${modifiers}</span><span class="action-preview">${initiative}</span>${critical}</div><div class="assigned">${action.assigned.map((t, i) => token(t, i, true, action.id)).join('') || '<span class="empty">No tokens had been committed</span>'}</div></article>`; }
function resolutionPanel(battle) {
  const message = game.combatMessage || { text: 'What had you committed to your actions?', type: 'info', state: `Round ${game.round}` };
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
  return `<nav class="quest-route" aria-label="Your remembered route"><p>Your remembered route</p><ol>${nodes.map(node => `<li class="route-node ${node.status}${node.completed ? ' completed' : ''}" ${node.status === 'current' ? 'aria-current="step"' : ''}><b aria-hidden="true">${node.completed ? '✓' : node.status === 'current' ? '●' : '○'}</b><span>${esc(node.label)}</span></li>`).join('')}</ol></nav>`;
}
function dialoguePanel(speaker, text, options = '', extraClass = '') { return `<section class="dialogue-panel ${extraClass}"><p class="eyebrow">One evening at the inn and tavern</p><p class="speaker">${esc(speaker)}</p><p class="dialogue-copy">${esc(text)}</p>${options}</section>`; }
function introView() {
  const step = game.dialogue.introStep; const beat = INTRO_BEATS[step]; const last = step === INTRO_BEATS.length - 1;
  return dialoguePanel(beat.speaker, beat.text, `<div class="dialogue-actions"><button class="primary" data-intro-next>${last ? 'Begin your account' : 'Listen on'}</button>${!last ? '<button class="text-button" data-intro-skip>Skip the introduction</button>' : ''}</div><ol class="dialogue-progress" aria-label="Introduction progress">${INTRO_BEATS.map((_, index) => `<li class="${index <= step ? 'seen' : ''}" ${index === step ? 'aria-current="step"' : ''}><span class="sr-only">Step ${index + 1}</span></li>`).join('')}</ol>`, 'intro-dialogue');
}
function tavernGreeting() {
  const responses = [
    ['ready', '“I took the dangerous job.”', 'Then you took the old Watchtower job. The town still needs it cleared.'],
    ['curious', '“I asked what worried the town.”', 'The road around the Watchtower is quiet now—and quiet is rarely kind.'],
    ['practical', '“I asked which job paid.”', 'The Watchtower still has twenty-five gold posted, and a reason for every coin.'],
  ];
  if (!game.dialogue.tavernResponse) return dialoguePanel('Innkeeper', 'Mara, what did you come looking for?', `<div class="choice-grid dialogue-choices">${responses.map(([id, label]) => `<button class="choice" data-tavern-response="${id}"><b>${label}</b><span>Tell the innkeeper what you had done.</span></button>`).join('')}</div>`);
  const response = responses.find(([id]) => id === game.dialogue.tavernResponse);
  return dialoguePanel('Innkeeper', response[2], '<button class="primary" data-show-board>Ask what the board had offered</button>');
}
function tavernView() {
  const exhausted = game.hero.hp <= 0;
  if (game.completedQuest) return `<section class="summary won"><p class="eyebrow">The tavern, day ${game.day}</p><h2>The board is quiet</h2><p>The Old Watchtower has been cleared. Your tale is now part of the tavern’s history.</p><p><b>${game.gold} gold</b> carried home.</p><button class="primary" data-restart>Start a fresh tale</button></section>`;
  if (exhausted) return `<section class="summary lost"><p class="eyebrow">The tavern, day ${game.day}</p><h2>You need a new beginning</h2><p>Your last outing ended in defeat. This prototype has no retirement system yet.</p><button class="primary" data-restart>Start a fresh tale</button></section>`;
  if (!game.dialogue.tavernResponse || !game.dialogue.boardOpen) return tavernGreeting();
  const q = WATCHTOWER_QUEST;
  return `<section class="tavern-panel"><p class="eyebrow">The inn and tavern · day ${game.day}</p><h2>The innkeeper turns the board toward you</h2><article class="quest-card"><div><p class="eyebrow">${esc(q.risk)}</p><h3>${esc(q.title)}</h3><p>${esc(q.objective)}</p></div><dl><div><dt>Location</dt><dd>${esc(q.location)}</dd></div><div><dt>Estimated duration</dt><dd>${esc(q.estimatedDays)}</dd></div><div><dt>Known enemies</dt><dd>${esc(q.enemies)}</dd></div><div><dt>Guaranteed reward</dt><dd>${q.rewardGold} gold</dd></div><div><dt>Expires</dt><dd>${esc(q.expiration)}</dd></div></dl><button class="primary" data-accept>“I took the Watchtower job.”</button></article></section>`;
}
function questConfirmationView() { const q = WATCHTOWER_QUEST; return dialoguePanel('Innkeeper', `So you took the Watchtower job. It is two days out, and the town pays ${q.rewardGold} gold if it is cleared. How did you set out?`, '<div class="dialogue-actions"><button class="primary" data-confirm-quest>“I set out for the Watchtower.”</button><button class="text-button" data-decline-quest>“I left it for another night.”</button></div>'); }
function travelView() { return `<section class="story-panel"><p class="eyebrow">Your telling · outward journey · quest day ${game.quest.days}</p><h2>“The rain had already found the road.”</h2><p>You recall a faded lantern trail along the old road and brambles concealing a narrower way through the woods. The innkeeper waits to hear which you chose.</p><div class="choice-grid"><button class="choice" data-travel="lantern"><b>“I followed the lantern trail.”</b><span>Trust the old road and its weathered markers.</span></button><button class="choice" data-travel="bramble"><b>“I took the bramble path.”</b><span>Push through the close, quiet woods.</span></button></div></section>`; }
function mapView() {
  const q = game.quest;
  const beforeObjective = !q.objectiveComplete;
  return `<section class="story-panel"><p class="eyebrow">Your telling · Old Watchtower · quest day ${q.days}</p><h2>${beforeObjective ? '“What did you do next?”' : '“And after the Watchtower was clear?”'}</h2><p>${beforeObjective ? 'The innkeeper waits for the next remembered turn in your road.' : 'The innkeeper asks whether you had searched the ruins or returned at once.'}</p><div class="map-status"><b>${q.objectiveComplete ? 'Objective remembered: Watchtower cleared' : 'Tale so far: reach the Watchtower'}</b><span>${q.rested ? 'You had already sheltered at the shrine.' : 'A safe shrine was on the road.'}</span></div><div class="choice-grid">${beforeObjective ? `${!q.rested ? '<button class="choice" data-node="rest"><b>“I rested at the crumbled shrine.”</b><span>A safe pause in your account. It took 1–2 days.</span></button>' : ''}<button class="choice danger" data-node="watchtower"><b>“I faced the Watchtower gate.”</b><span>The captain’s camp had blocked the way. It took 1 day.</span></button>` : `${!q.cacheFound ? '<button class="choice" data-node="cache"><b>“I searched the fallen archive.”</b><span>There may have been something beneath the stones. It took 1 day.</span></button>' : '<div class="choice used"><b>“I searched the fallen archive.”</b><span>The hidden cache had been packed away.</span></div>'}<button class="choice finish" data-finish><b>“I returned to town.”</b><span>End your account of the road.</span></button>`}</div>${beforeObjective ? '<button class="text-button" data-finish>“I turned back before clearing it.”</button>' : ''}</section>`;
}
function restView() { return `<section class="story-panel"><p class="eyebrow">Your telling · crumbled shrine</p><h2>“The shrine was dry. That was enough.”</h2><p>The old stones offer a safe pause in your story. Each day restores 5 HP.</p><div class="choice-grid"><button class="choice" data-rest="1"><b>“I stayed one night.”</b><span>Rest, then continue at first light.</span></button><button class="choice" data-rest="2"><b>“I stayed two nights.”</b><span>Take the time to recover more fully.</span></button></div></section>`; }
function returnTravelView() { return `<section class="story-panel"><p class="eyebrow">Your telling · return journey</p><h2>“By evening, I could see the tavern light.”</h2><p>The road had felt shorter with the tower behind you. The innkeeper reaches for the ledger now.</p><button class="primary" data-return>“Then I came home.”</button></section>`; }
function resultView() { const result = game.questHistory.at(-1); const won = result.outcome === 'completed'; const text = won ? `The innkeeper sets ${result.reward} gold beside your mug. “The Watchtower is clear, then. I’ll make sure the town remembers who did it.”` : result.outcome === 'defeated' ? 'The innkeeper lets the silence settle before speaking. “That was a hard road. Rest now; this story is not the last you will tell.”' : 'The innkeeper closes the ledger without taking notes. “Some roads are left for another night. You made it home.”'; return `${dialoguePanel('Innkeeper', text, `<div class="summary-grid"><b>Quest days ${result.days}</b><b>Reward ${result.reward} gold</b><b>${result.cacheFound ? 'Archive cache found' : 'No archive cache'}</b></div><button class="primary" data-tavern>Return to the tavern</button>`, won ? 'won' : 'lost')}`; }
function render() {
  const previousTranscript = root.querySelector('.battle-log');
  if (previousTranscript) {
    transcriptScrollTop = previousTranscript.scrollTop;
    transcriptFollowsLatest = previousTranscript.scrollHeight - previousTranscript.scrollTop - previousTranscript.clientHeight < 8;
  }
  if (game.phase === 'intro-dialogue') { root.innerHTML = introView(); return; }
  if (game.phase === 'tavern') { root.innerHTML = campaignBar() + tavernView(); return; }
  if (game.phase === 'quest-confirmation') { root.innerHTML = campaignBar() + questConfirmationView(); return; }
  if (game.phase === 'outbound-travel') { root.innerHTML = campaignBar() + questRouteView() + travelView(); return; }
  if (game.phase === 'quest-map') { root.innerHTML = campaignBar() + questRouteView() + mapView(); return; }
  if (game.phase === 'rest') { root.innerHTML = campaignBar() + questRouteView() + restView(); return; }
  if (game.phase === 'return-travel') { root.innerHTML = campaignBar() + questRouteView() + returnTravelView(); return; }
  if (game.phase === 'quest-result') { root.innerHTML = campaignBar() + resultView(); return; }
  const enemy = game.enemy; const battle = game.battleIndex + 1; const draw = game.lastDraw?.sequence !== renderedDrawSequence ? game.lastDraw : null; const available = game.reserve.map((t, i) => { const drawOrder = draw && i >= draw.startIndex && i < draw.startIndex + draw.tokens.length ? i - draw.startIndex : null; return token(t, i, false, '', drawOrder); }).join('') || '<span class="empty">No reserve tokens</span>';
  if (game.phase === 'summary') { const won = game.hero.hp > 0; root.innerHTML = `<section class="summary ${won?'won':'lost'}"><p class="eyebrow">${won?'A story well told':'An unfinished tale'}</p><h2>${won ? 'Encounter Complete' : 'Your Tale Ended'}</h2><p>${won ? 'The Gargoyle crumbles into dust as the tavern erupts in applause.' : 'The encounter ended, but the next telling begins with what you learned.'}</p><div class="summary-grid"><b>Battles ${game.battleIndex + 1}/${2}</b><b>Rounds ${game.round}</b><b>Tokens drawn ${game.metrics.draws}</b><b>Actions resolved ${game.metrics.actions}</b><b>Critical successes ${game.metrics.critSuccesses}</b><b>Critical failures ${game.metrics.critFailures}</b></div><button class="primary" data-restart>Tell it again</button></section>`; return; }
  root.innerHTML = `<section class="scene"><div class="status hero"><p class="eyebrow">Your adventurer</p><h2>${game.hero.name}</h2>${meter('Health',game.hero.hp,game.hero.maxHp,'health','hero-hp')}${meter('Armor',game.hero.armor,game.hero.maxHp,'armor','hero-armor')}<p class="statline">VIT 4 &middot; STR 5 &middot; INT 3 &middot; DEX 3 &middot; SPD 4 &middot; LUCK 5</p></div>${resolutionPanel(battle)}<div class="status enemy"><p class="eyebrow">Hidden intent</p><h2>${enemy.name}</h2>${meter('Health',enemy.hp,enemy.maxHp,'enemyhp','enemy-hp')}<p class="statline">Attack cards remaining: ${enemy.remaining}/${enemy.cards.length}</p></div></section>
  ${game.phase === 'battle-transition' ? `<section class="transition"><h2>Then another foe had closed in</h2><p>Your Armor and evolving actions had carried onward. Your reserve and bag had refreshed.</p><button class="primary" data-continue>Continue your account</button></section>` : `<section class="combat ${game.phase === 'resolving' ? 'resolving' : ''}"><div class="reserve"><div class="section-title"><h2>Tokens you had held</h2><span>${game.reserve.length}/8</span></div><p>${game.phase === 'resolving' ? 'The exchange is being remembered…' : 'Choose a token, then record where you had committed it.'}</p><div class="reserve-row"><div class="tokens">${available}</div><button class="primary" data-resolve ${game.phase !== 'planning' ? 'disabled' : ''}>${game.phase === 'resolving' ? 'Remembering the exchange…' : `Tell round ${game.round}`}</button></div></div><div class="actions"><div class="section-title"><h2>Actions you had available</h2><span>Completed actions glow</span></div><div class="action-grid">${game.actions.map(actionCard).join('')}</div></div></section>`}`;
  if (draw) renderedDrawSequence = draw.sequence;
  syncBattleTranscript();
}
root.addEventListener('click', event => { const tok = event.target.closest('[data-token]'); const card = event.target.closest('[data-action-card]'); const travel = event.target.closest('[data-travel]'); const node = event.target.closest('[data-node]'); const rest = event.target.closest('[data-rest]'); const response = event.target.closest('[data-tavern-response]');
  if (event.target.closest('[data-intro-next]')) { advanceIntro(game); render(); return; }
  if (event.target.closest('[data-intro-skip]')) { skipIntro(game); render(); return; }
  if (response) { chooseTavernResponse(game, response.dataset.tavernResponse); render(); return; }
  if (event.target.closest('[data-show-board]')) { openQuestBoard(game); render(); return; }
  if (event.target.closest('[data-accept]')) { beginQuestAcceptance(game); render(); return; }
  if (event.target.closest('[data-confirm-quest]')) { acceptQuest(game); render(); return; }
  if (event.target.closest('[data-decline-quest]')) { game.phase = 'tavern'; render(); return; }
  if (travel) { chooseOutboundTravel(game, travel.dataset.travel); render(); return; } if (node) { chooseQuestNode(game, node.dataset.node); render(); return; } if (rest) { restAtQuestNode(game, Number(rest.dataset.rest)); render(); return; } if (event.target.closest('[data-finish]')) { if (!game.quest?.objectiveComplete && !window.confirm('Leave before clearing the watchtower? This abandons the quest and forfeits its reward.')) return; finishQuest(game); render(); return; } if (event.target.closest('[data-return]')) { resolveReturnTravel(game); render(); return; } if (event.target.closest('[data-tavern]')) { returnToTavern(game); render(); return; } if (tok && tok.dataset.action) { removeToken(game, tok.dataset.action, Number(tok.dataset.token)); selected = null; render(); return; } if (tok) { selected = Number(tok.dataset.token); render(); return; } if (card && game.phase === 'planning') { assignRequiredTokens(game, card.dataset.actionCard); selected = null; render(); return; } if (event.target.closest('[data-start]')) { continueBattle(game); render(); } if (event.target.closest('[data-resolve]')) { selected = null; if (startRoundResolution(game)) { render(); playResolution(); } return; } if (event.target.closest('[data-continue]')) { continueBattle(game); render(); } if (event.target.closest('[data-restart]')) { clearTimeout(resolutionTimer); clearTimeout(hitShakeTimer); clearTimeout(actionFlipTimer); flippingActionId = null; document.querySelector('.app')?.classList.remove('hit-shake'); floatingEffects = []; game = createGame(); renderedDrawSequence = null; selected = null; render(); } });
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
