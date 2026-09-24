import { createGame, assignToken, removeToken, startRoundResolution, resolveNextAction, continueBattle, TOKEN_META, actionComplete, currentAction, actionPreview, compatible } from './game.js';

const root = document.querySelector('#game');
let game = createGame(); let selected = null; let resolutionTimer = null; let effectId = 0; let floatingEffects = []; let transcriptScrollTop = 0; let transcriptFollowsLatest = true; let draggedToken = null;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const TOKEN_HELP = Object.freeze({ health: 'As an extra token, restores 2 HP after the action; it can also power First Aid.', physical: 'Powers weapon actions and adds +2 potency when used as an extra matching token.', magical: 'Powers Rune Bolt and adds +2 potency when used as an extra matching token.', special: 'Powers mixed, defensive, and special actions; extras add +2 potency.', speed: 'Universal modifier: adds +1 initiative, helping the action resolve earlier.', critical: 'Universal gamble: each one flips at 50%. Any failed flip makes the action fail; successes multiply potency.' });
const token = (type, index, assigned = false, actionId = '') => `<button class="token ${type}${selected === index && !assigned ? ' selected' : ''}" data-token="${index}" data-token-type="${type}" data-action="${actionId}" title="${TOKEN_META[type].label}: ${TOKEN_HELP[type]}" aria-label="${assigned ? 'Remove ' : 'Select '}${TOKEN_META[type].label}. ${TOKEN_HELP[type]}" ${!assigned && game.phase === 'planning' ? 'draggable="true"' : ''} ${game.phase !== 'planning' ? 'disabled' : ''}><b>${TOKEN_META[type].symbol}</b><span>${TOKEN_META[type].short}</span></button>`;
function meter(label, value, max, cls = '', target = '') { const effects = floatingEffects.filter(effect => effect.target === target).map(effect => `<b class="combat-float ${effect.delta < 0 ? 'loss' : 'gain'}">${effect.label}</b>`).join(''); return `<div class="meter ${cls}"><span>${label} <b>${value}/${max}</b></span><div class="meter-track"><i><em style="width:${Math.max(0, Math.min(100, value / max * 100))}%"></em></i>${effects}</div></div>`; }
function actionCard(action) { const preview = actionPreview(action); const { data } = preview; const complete = actionComplete(action); const base = action.base.map(type => `<b class="requirement-token" data-requirement="${type}">${TOKEN_META[type].short}</b>`).join(' + '); const label = ({ damage: 'Damage', heal: 'Heal', armor: 'Armor' })[data.kind]; const displayedPotency = preview.potency + (data.kind === 'heal' ? preview.healthAmount : 0); const potency = displayedPotency === preview.basePotency ? `${label} ${preview.basePotency}` : `${label} ${preview.basePotency} &rarr; <b class="preview-value">${displayedPotency}</b>`; const modifiers = [preview.bonus && `<b class="preview-bonus">+${preview.bonus} matching</b>`, preview.healthAmount && `<b class="preview-benefit">+${preview.healthAmount} Health</b>`].filter(Boolean).join(' '); const initiative = preview.speed ? `Init ${preview.baseInitiative} &rarr; <b class="preview-value">${preview.initiative}</b>` : `Init ${preview.baseInitiative}`; const critical = preview.criticals ? `<b class="preview-critical">Critical: x${preview.criticalMultiplier} on success</b>` : ''; return `<article class="action ${complete ? 'complete' : ''}" data-action-card="${action.id}" tabindex="0" role="button" aria-label="Assign selected token to ${data.name}" aria-disabled="${game.phase !== 'planning'}"><div><h3>${esc(data.name)} ${action.evolved ? '<small>evolved</small>' : ''}</h3><p>${esc(action.note)}</p></div><div class="requirements"><span>Need: ${base}</span><span class="action-preview">${potency} ${modifiers}</span><span class="action-preview">${initiative}</span>${critical}</div><div class="assigned">${action.assigned.map((t, i) => token(t, i, true, action.id)).join('') || '<span class="empty">Awaiting tokens</span>'}</div></article>`; }
function resolutionPanel(battle) {
  const message = game.combatMessage || { text: 'Choose tokens and prepare your actions.', type: 'info', state: `Round ${game.round}` };
  const state = message.state || (game.phase === 'resolving' ? 'Resolving round' : `Round ${game.round}`);
  const transcript = [...game.log].reverse();
  const critical = game.resolution?.pendingCritical;
  const gamble = critical ? `<div class="critical-gamble ${critical.outcome === 'failed' ? 'failed' : critical.outcome === 'passed' ? 'passed' : ''}" aria-live="polite"><div class="critical-coins">${critical.flips.map((flip, index) => `<b class="critical-coin ${index < critical.revealed ? (flip ? 'win' : 'loss') : index === critical.revealed && critical.mode === 'spinning' ? 'spinning' : 'waiting'}">${index < critical.revealed ? (flip ? '✦' : '×') : '?'}</b>`).join('')}</div><p>${critical.outcome === 'failed' ? 'FAILED · x0' : critical.outcome === 'passed' ? `SUCCESS · x${critical.multiplier}` : `Flip ${Math.min(critical.revealed + 1, critical.flips.length)}/${critical.flips.length}`}</p></div>` : '';
  return `<div class="resolution-panel"><div class="versus">VS<br><small>Battle ${battle}/2</small></div><div class="battle-message ${message.type}" aria-live="polite"><p class="resolution-state">${esc(state)}</p><p>${esc(message.text)}</p></div>${gamble}<ol class="battle-log" aria-label="Battle chronicle">${transcript.map(item => `<li class="${item.type}">${esc(item.text)}</li>`).join('')}</ol></div>`;
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
function showEffects(effects = []) {
  const added = effects.filter(effect => effect.delta !== 0).map(effect => ({ ...effect, id: ++effectId }));
  if (!added.length) return;
  floatingEffects.push(...added);
  setTimeout(() => { const ids = new Set(added.map(effect => effect.id)); floatingEffects = floatingEffects.filter(effect => !ids.has(effect.id)); render(); }, 900);
}
function playResolution(delay = 2000) {
  clearTimeout(resolutionTimer);
  resolutionTimer = setTimeout(() => {
    const result = resolveNextAction(game);
    if (result) showEffects(result.effects);
    render();
    if (game.phase === 'resolving') playResolution(result?.kind?.startsWith('critical-') ? 900 : 2000);
  }, delay);
}
function actionForCard(card) { return game.actions.find(action => action.id === card?.dataset.actionCard); }
function canDropOn(card) { return game.phase === 'planning' && !!draggedToken && !!actionForCard(card) && compatible(actionForCard(card), draggedToken.type); }
function clearDragState() {
  draggedToken = null;
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
function render() {
  const previousTranscript = root.querySelector('.battle-log');
  if (previousTranscript) {
    transcriptScrollTop = previousTranscript.scrollTop;
    transcriptFollowsLatest = previousTranscript.scrollHeight - previousTranscript.scrollTop - previousTranscript.clientHeight < 8;
  }
  if (game.phase === 'intro') { root.innerHTML = `<section class="summary"><p class="eyebrow">A warm tavern. A dangerous world.</p><h2>Ready to tell your tale?</h2><p>Mara the Wayfarer faces a Bandit Captain, then a hidden second foe. Her token bag determines which actions she can prepare each round.</p><button class="primary" data-start>Begin the tale</button></section>`; return; }
  const enemy = game.enemy; const battle = game.battleIndex + 1; const available = game.reserve.map((t,i) => token(t,i)).join('') || '<span class="empty">No reserve tokens</span>';
  if (game.phase === 'summary') { const won = game.hero.hp > 0; root.innerHTML = `<section class="summary ${won?'won':'lost'}"><p class="eyebrow">${won?'A story well told':'An unfinished tale'}</p><h2>${won ? 'Encounter Complete' : 'Mara Has Fallen'}</h2><p>${won ? 'The Gargoyle crumbles into dust as the tavern erupts in applause.' : 'The encounter ends, but the next telling begins with what you learned.'}</p><div class="summary-grid"><b>Battles ${game.battleIndex + 1}/${2}</b><b>Rounds ${game.round}</b><b>Tokens drawn ${game.metrics.draws}</b><b>Actions resolved ${game.metrics.actions}</b><b>Critical successes ${game.metrics.critSuccesses}</b><b>Critical failures ${game.metrics.critFailures}</b></div><button class="primary" data-restart>Tell it again</button></section>`; return; }
  root.innerHTML = `<section class="scene"><div class="status hero"><p class="eyebrow">Your adventurer</p><h2>${game.hero.name}</h2>${meter('Health',game.hero.hp,game.hero.maxHp,'health','hero-hp')}${meter('Armor',game.hero.armor,game.hero.maxHp,'armor','hero-armor')}<p class="statline">VIT 4 &middot; STR 5 &middot; INT 3 &middot; DEX 3 &middot; SPD 4 &middot; LUCK 5</p></div>${resolutionPanel(battle)}<div class="status enemy"><p class="eyebrow">Hidden intent</p><h2>${enemy.name}</h2>${meter('Health',enemy.hp,enemy.maxHp,'enemyhp','enemy-hp')}<p class="statline">Attack cards remaining: ${enemy.remaining}/${enemy.cards.length}</p></div></section>
  ${game.phase === 'battle-transition' ? `<section class="transition"><h2>The next tale begins</h2><p>Your armor and evolving actions carry onward. The reserve and bag refresh.</p><button class="primary" data-continue>Face the next foe</button></section>` : `<section class="combat ${game.phase === 'resolving' ? 'resolving' : ''}"><div class="reserve"><div class="section-title"><h2>Token Reserve</h2><span>${game.reserve.length}/8</span></div><p>${game.phase === 'resolving' ? 'Actions are resolving…' : 'Select a token, then an action.'}</p><div class="tokens">${available}</div><button class="primary" data-resolve ${game.phase !== 'planning' ? 'disabled' : ''}>${game.phase === 'resolving' ? 'Resolving round…' : `Resolve round ${game.round}`}</button></div><div class="actions"><div class="section-title"><h2>Equipment actions</h2><span>Completed actions glow</span></div>${game.actions.map(actionCard).join('')}</div></section>`}`;
  syncBattleTranscript();
}
root.addEventListener('click', event => { const tok = event.target.closest('[data-token]'); const card = event.target.closest('[data-action-card]'); if (tok && tok.dataset.action) { removeToken(game, tok.dataset.action, Number(tok.dataset.token)); selected = null; render(); return; } if (tok) { selected = Number(tok.dataset.token); render(); return; } if (card && selected !== null) { assignToken(game, selected, card.dataset.actionCard); selected = null; render(); return; } if (event.target.closest('[data-start]')) { continueBattle(game); render(); } if (event.target.closest('[data-resolve]')) { selected = null; if (startRoundResolution(game)) { render(); playResolution(); } return; } if (event.target.closest('[data-continue]')) { continueBattle(game); render(); } if (event.target.closest('[data-restart]')) { clearTimeout(resolutionTimer); floatingEffects = []; game = createGame(); selected = null; render(); } });
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
root.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action-card]')) { event.preventDefault(); event.target.click(); } });
render();
