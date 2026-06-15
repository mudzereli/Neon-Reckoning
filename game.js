// ==================== TIMER ====================
let timerStart = null;
let timerInterval = null;
let timerElapsed = 0;

function formatTime(ms) {
  let totalSec = Math.floor(ms / 1000);
  let min = String(Math.floor(totalSec / 60)).padStart(2, '0');
  let sec = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

function updateTimerDisplay() {
  let el = document.getElementById('timerDisplay');
  if (!el) return;
  if (timerStart !== null) {
    timerElapsed = Date.now() - timerStart;
  }
  el.textContent = `⏱ ${formatTime(timerElapsed)}`;
}

function startTimer() {
  stopTimer();
  timerStart = Date.now();
  timerElapsed = 0;
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (timerStart !== null) {
    timerElapsed = Date.now() - timerStart;
    timerStart = null;
  }
}

function getTimeString() {
  if (timerStart !== null) {
    return formatTime(Date.now() - timerStart);
  }
  return formatTime(timerElapsed);
}

let state = {
  grid: [],         // 2D array of room objects
  px: 0, py: 0,    // player position
  hp: CONFIG.START_HP, maxHp: CONFIG.START_HP,
  atk: CONFIG.START_ATK,
  def: CONFIG.START_DEF,
  evd: CONFIG.START_EVD,
  level: 1,
  xp: 0, xpToLevel: CONFIG.START_XP_TO_LEVEL,
  creds: 0,
  weapon: { name: CONFIG.START_WEAPON.name, dice: CONFIG.START_WEAPON.dice, bonus: CONFIG.START_WEAPON.bonus },
  armor: { name: CONFIG.START_ARMOR.name, def: CONFIG.START_ARMOR.def, evd: CONFIG.START_ARMOR.evd },
  inventory: [],   // [{name, type:'weapon'|'armor'|'heal', ...}]
  hasKey: false,
  bossDefeated: false,
  bossRevealed: false,
  intelRoom: null,
  gameOver: false,
  visited: new Set(),
  searchedRooms: new Set(),
  bossRoom: null,  // {x,y}
  keyRoom: null,   // {x,y}
  keyRevealed: false,
  vaultRoom: null,  // weapon vault
  vaultRoom2: null, // DEF armor vault
  vaultRoom3: null, // scanner vault
  vaultRoom4: null, // revive vault
  vaultRoom5: null, // analyzer vault
  vaultRoom6: null, // trap scanner vault
  vaultRoom7: null, // heal scanner vault
};

// ==================== ROOM GENERATION ====================
function generateFloor() {
  // Pick random start position anywhere on the grid
  let startX = Math.floor(Math.random() * GRID_SIZE);
  let startY = Math.floor(Math.random() * GRID_SIZE);
  state.px = startX;
  state.py = startY;

  // Create empty grid with random room variants
  let pickVariant = () => Math.floor(Math.random() * variants.length);
  state.grid = Array.from({length: GRID_SIZE}, () => Array.from({length: GRID_SIZE}, () => ({ type: 'empty', variant: pickVariant() })));
  state.visited = new Set();
  state.visited.add(`${startX},${startY}`);

  // Pick random boss room (not adjacent to start)
  let candidates = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === startX && y === startY) continue;
      let dist = Math.abs(x - startX) + Math.abs(y - startY);
      if (dist >= CONFIG.BOSS_MIN_DIST) candidates.push({x, y});
    }
  }
  let boss = candidates[Math.floor(Math.random() * candidates.length)];
  state.bossRoom = boss;
  state.grid[boss.y][boss.x] = { type: 'boss', locked: true, variant: pickVariant() };

  // Pick random key room (not start, not boss)
  candidates = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if ((x === startX && y === startY) || (x === boss.x && y === boss.y)) continue;
      candidates.push({x, y});
    }
  }
  let key = candidates[Math.floor(Math.random() * candidates.length)];
  state.keyRoom = key;
  state.grid[key.y][key.x] = { type: 'key', variant: pickVariant() };

  // Pick random intel room (not start, boss, or key)
  candidates = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if ((x === startX && y === startY) || (x === boss.x && y === boss.y) || (x === key.x && y === key.y)) continue;
      candidates.push({x, y});
    }
  }
  let intel = candidates[Math.floor(Math.random() * candidates.length)];
  state.intelRoom = intel;
  state.grid[intel.y][intel.x] = { type: 'intel', variant: pickVariant() };

  // Track used cells to avoid overlap
  let used = new Set([`${startX},${startY}`, `${boss.x},${boss.y}`, `${key.x},${key.y}`, `${intel.x},${intel.y}`]);
  let pickUnique = () => {
    let c = [];
    for (let y = 0; y < GRID_SIZE; y++)
      for (let x = 0; x < GRID_SIZE; x++)
        if (!used.has(`${x},${y}`)) c.push({x, y});
    let p = c[Math.floor(Math.random() * c.length)];
    used.add(`${p.x},${p.y}`);
    return p;
  };

  // Place all vaults in a loop
  VAULT_ROOMS.forEach(v => {
    let pos = pickUnique();
    state[v.stateKey] = pos;
    state.grid[pos.y][pos.x] = { type: v.type, variant: pickVariant() };
  });

  // Fill remaining rooms
  let roomTypes = ['enemy', 'enemy', 'enemy', 'enemy', 'loot', 'loot', 'loot', 'heal', 'trap', 'empty'];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (used.has(`${x},${y}`)) continue;
      let t = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      state.grid[y][x] = { type: t, variant: pickVariant() };
    }
  }

  // Starting room always has loot
  state.grid[startY][startX].type = 'loot';
}

// ==================== ENEMIES ====================
/**
 * Generates a random enemy scaled to the current floor level.
 * Pulls from the available enemy pool (unlocking tougher enemies as the player levels up),
 * then applies level-based scaling to HP, XP, and credits.
 * @returns {{ name: string, emoji: string, hp: number, maxHp: number, atk: number, def: number, evd: number, dice: number, xp: number, creds: number }}
 */
function getEnemyForFloor() {
  let poolSize = Math.max(1, Math.min(state.level * 3, ENEMY_POOL.length));
  let pool = ENEMY_POOL.slice(0, poolSize);
  let e = pool[Math.floor(Math.random() * pool.length)];
  return {
    name: e.name,
    emoji: e.emoji,
    hp: e.hp + state.level * CONFIG.ENEMY_HP,
    maxHp: e.hp + state.level * CONFIG.ENEMY_HP,
    atk: e.atk,
    def: e.def,
    evd: e.evd,
    dice: e.dice,
    xp: e.xp + state.level * CONFIG.ENEMY_XP,
    creds: e.creds + state.level * CONFIG.ENEMY_CREDS,
  };
}

function getBoss() {
  return BOSSES[Math.floor(Math.random() * BOSSES.length)];
}

// ==================== DICE ROLLING ====================
function roll(sides) { return Math.floor(Math.random() * sides) + 1; }

// ==================== COMBAT ====================
let combatEnemy = null;
let defending = false;

function startCombat(enemy) {
  combatEnemy = { ...enemy };
  document.getElementById('combatPanel').style.display = 'flex';
  document.getElementById('fleeBtn').disabled = !!enemy._isBoss;
  updateCombatPanel();
}

function updateCombatPanel() {
  let e = combatEnemy;
  if (!e) return;
  document.getElementById('combatEnemyName').textContent = e.name;
  document.getElementById('combatEnemyDesc').textContent = e.desc || '';
  document.getElementById('combatEnemyHp').textContent = `${e.hp}/${e.maxHp}`;
  document.getElementById('combatEnemyHpBar').style.width = `${(e.hp/e.maxHp)*100}%`;
  document.getElementById('combatEnemyAtk').textContent = `d${e.dice}+${e.atk}`;
  document.getElementById('combatEnemyDef').textContent = e.def;
  document.getElementById('combatEnemyEvd').textContent = e.evd;

  // Show injector button if player has injectors
  let injectors = state.inventory.filter(i => i.type === 'heal');
  let btn = document.getElementById('injectBtn');
  if (injectors.length > 0) {
    let hasAnalyzer = state.inventory.some(i => i.type === 'analyzer');
    if (hasAnalyzer) {
      let best = Math.max(...injectors.map(i => i.amount));
      btn.textContent = `💉 Injector (+${best} HP)`;
    } else {
      btn.textContent = `💉 Injector (${injectors.length})`;
    }
    btn.style.display = '';
  } else {
    btn.style.display = 'none';
  }
}

function useCombatInjector() {
  if (!combatEnemy || state.gameOver) return;
  let injectors = state.inventory.filter(i => i.type === 'heal');
  if (injectors.length === 0) return;

  let idx;
  let hasAnalyzer = state.inventory.some(i => i.type === 'analyzer');
  if (hasAnalyzer) {
    // Find the best healing injector (highest positive amount)
    let best = injectors.filter(i => i.amount > 0).sort((a, b) => b.amount - a.amount)[0];
    if (!best) {
      addLog('🔬 No safe injectors detected.', 'msg');
      return;
    }
    idx = state.inventory.indexOf(best);
  } else {
    // Random injector — could be risky
    idx = state.inventory.indexOf(injectors[Math.floor(Math.random() * injectors.length)]);
  }

  let item = state.inventory[idx];
  state.hp = Math.min(state.maxHp, state.hp + item.amount);
  if (item.amount > 0) {
    addLog(`💉 Used an Injector. +${item.amount} HP.`, 'info');
  } else {
    addLog(`⚠ Injector backfired! ${item.amount} HP.`, 'danger');
  }
  state.inventory.splice(idx, 1);
  if (state.hp <= 0) { state.hp = 0; gameOverLose(); return; }
  updateCombatPanel();
  render();
}

function endCombat() {
  combatEnemy = null;
  defending = false;
  document.getElementById('combatPanel').style.display = 'none';
}

function playerAttack() {
  if (!combatEnemy) return;
  let e = combatEnemy;
  let totalAtk = state.atk + state.weapon.bonus + (defending ? -CONFIG.DEFEND_ATK_PENALTY : 0);
  let dmgRoll = roll(state.weapon.dice) + totalAtk;

  if (dmgRoll <= e.evd) {
    addLog(`💨 ${e.name} evaded! (d${state.weapon.dice}+${totalAtk}=${dmgRoll} ≤ EVD ${e.evd})`, 'combat');
  } else if (dmgRoll <= e.def) {
    addLog(`🛡️ ${e.name} blocked! (d${state.weapon.dice}+${totalAtk}=${dmgRoll} > EVD ${e.evd}, ≤ DEF ${e.def})`, 'combat');
  } else {
    let dmg = dmgRoll - e.def;
    e.hp -= dmg;
    addLog(`🎯 You hit ${e.name} for <b>${dmg}</b> damage. (d${state.weapon.dice}+${totalAtk}=${dmgRoll} - ${e.def} DEF)`, 'combat');
  }

  if (e.hp <= 0) {
    let wasBoss = e._isBoss;
    endCombat();
    state.xp += (e.xp || 0);
    state.creds += (e.creds || 0);
    checkLevelUp();
    state.grid[state.py][state.px].type = 'empty';
    // Preserve any existing loot on the room object
    state.searchedRooms.add(`${state.px},${state.py}`);
    if (wasBoss) {
      addLog(`💀 ${e.name} DESTROYED!`, 'win');
      gameOverWin();
    } else {
      addLog(`💀 ${e.name} destroyed! +${e.xp} XP, +${e.creds}¢`, 'win');
      addLog('🔍 You search the remains...', 'msg');
      handleLootRoom();
    }
    render();
    return;
  }

  // Enemy counter-attacks after a short delay
  updateCombatPanel();
  setTimeout(() => enemyAttack(), CONFIG.ENEMY_ATTACK_DELAY);
}

function enemyAttack() {
  if (!combatEnemy) return;
  let e = combatEnemy;
  let dmgRoll = roll(e.dice) + e.atk;
  let effectiveDef = state.def + (defending ? CONFIG.DEFEND_DEF_BONUS : 0);
  let defLabel = defending ? `${state.def}+${CONFIG.DEFEND_DEF_BONUS}` : state.def;
  let effectiveEvd = state.evd + (defending ? CONFIG.DEFEND_EVD_BONUS : 0);
  let evdLabel = defending ? `${state.evd}+${CONFIG.DEFEND_EVD_BONUS}` : state.evd;
  defending = false;

  if (dmgRoll <= effectiveEvd) {
    addLog(`💨 You evade ${e.name}! (d${e.dice}+${e.atk}=${dmgRoll} ≤ EVD ${evdLabel})`, 'info');
  } else if (dmgRoll <= effectiveDef) {
    addLog(`🛡️ Your armor blocks ${e.name}! (d${e.dice}+${e.atk}=${dmgRoll} > EVD ${evdLabel}, ≤ DEF ${defLabel})`, 'info');
  } else {
    let dmg = dmgRoll - effectiveDef;
    state.hp -= dmg;
    addLog(`💥 ${e.name} hits you for <b>${dmg}</b> damage. (d${e.dice}+${e.atk}=${dmgRoll} > EVD ${evdLabel}, - ${defLabel} DEF)`, 'danger');
  }

  if (state.hp <= 0) {
    state.hp = 0;
    gameOverLose();
    return;
  }

  updateCombatPanel();
  render(); // update your HP bar
}

function playerDefend() {
  if (!combatEnemy) return;
  defending = true;
  addLog(`🛡️ Defensive stance: +${CONFIG.DEFEND_DEF_BONUS} DEF, +${CONFIG.DEFEND_EVD_BONUS} EVD, −${CONFIG.DEFEND_ATK_PENALTY} ATK.`, 'info');
  updateCombatPanel();
  playerAttack();
}

function playerFlee() {
  if (!combatEnemy) return;
  let fleeRoll = roll(state.weapon.dice) + state.atk + state.weapon.bonus;
  let enemyRoll = roll(combatEnemy.dice) + combatEnemy.atk;
  // Mark room as fled so enemy stays
  state.grid[state.py][state.px].fled = true;
  endCombat();
  if (fleeRoll >= enemyRoll - CONFIG.FLEE_DIFF) {
    addLog('↩ You fled successfully.', 'info');
  } else {
    let dmg = roll(CONFIG.FAILED_FLEE_DICE);
    state.hp -= dmg;
    addLog(`↩ Failed to flee! Enemy strikes for <b>${dmg}</b> damage.`, 'danger');
    if (state.hp <= 0) { state.hp = 0; gameOverLose(); return; }
  }
  render();
}

// ==================== DIRECTIONAL MOVEMENT (D-PAD) ====================
function movePlayer(dx, dy) {
  if (state.gameOver) return;
  if (combatEnemy) return;
  let panel = document.getElementById('combatPanel');
  if (panel._pendingBoss) return;
  let nx = state.px + dx;
  let ny = state.py + dy;
  if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return;
  enterRoom(nx, ny);
}

// ==================== ROOM ACTIONS ====================
function enterRoom(x, y) {
  if (state.gameOver) return;
  if (combatEnemy) return;

  let room = state.grid[y][x];

  // Boss room - check if locked
  if (room.type === 'boss') {
    if (room.locked && !state.hasKey) {
      state.bossRevealed = true;
      addLog('🔒 The boss chamber is locked. You need a key.', 'danger');
      render();
      return;
    }
    if (room.locked && state.hasKey) {
      room.locked = false;
      addLog('🔑 You use the key. The door slides open with a hiss of steam...', 'info');
      state.hasKey = false;
      render();
      return; // Don't auto-fight — player must choose to enter
    }
    // Boss room is unlocked — prompt to accept
    if (!room.locked) {
      showBossPrompt();
      return;
    }
  }

  // Move player
  state.px = x;
  state.py = y;
  state.visited.add(`${x},${y}`);

  // Enemy rooms start combat immediately
  if (room.type === 'enemy') {
    let enemy = getEnemyForFloor();
    state._currentEnemyEmoji = enemy.emoji;
    room._enemyEmoji = enemy.emoji;
    addLog(`⚠ ${enemy.emoji} ${enemy.name} detected!`, 'danger');
    startCombat(enemy);
    render();
    return;
  }

  // Traps auto-activate when entering
  if (room.type === 'trap') {
    let trapRoll = roll(CONFIG.TRAP_DICE) + CONFIG.TRAP_BONUS;
    if (trapRoll <= state.evd) {
      addLog(`💨 You evade the trap! (d${CONFIG.TRAP_DICE}+${CONFIG.TRAP_BONUS}=${trapRoll} ≤ EVD ${state.evd})`, 'info');
    } else if (trapRoll <= state.def) {
      addLog(`🛡️ Your armor blocks the trap! (d${CONFIG.TRAP_DICE}+${CONFIG.TRAP_BONUS}=${trapRoll} > EVD ${state.evd}, ≤ DEF ${state.def})`, 'info');
    } else {
      let dmg = trapRoll - state.def;
      state.hp -= dmg;
      addLog(`⚡ Shock trap hits for <b>${dmg}</b> damage! (d${CONFIG.TRAP_DICE}+${CONFIG.TRAP_BONUS}=${trapRoll} - ${state.def} DEF)`, 'danger');
    }
    state.searchedRooms.add(`${x},${y}`);
    if (state.hp <= 0) { state.hp = 0; gameOverLose(); return; }
    render();
    return;
  }

  // Already-searched rooms just log
  let key = `${x},${y}`;
  if (state.searchedRooms.has(key)) {
    if (room.type === 'empty' || room.cleared) {
      addLog('This room has already been cleared.', 'msg');
    }
    render();
    return;
  }

  render();
}

// ==================== SEARCH ROOM ====================
function searchRoom() {
  if (state.gameOver) return;
  if (combatEnemy) return;
  let room = state.grid[state.py][state.px];
  let key = `${state.px},${state.py}`;

  // Can't search rooms with active threats
  if (room.type === 'enemy' || room.type === 'boss' || room.type === 'trap') {
    addLog('No time to search — deal with the room first.', 'msg');
    return;
  }

  // Already searched
  if (state.searchedRooms.has(key)) return;

  state.searchedRooms.add(key);

  switch (room.type) {
    case 'empty':
      addLog('You search the room. Nothing but dust and dead terminals.', 'msg');
      break;
    case 'key':
      if (room.cleared) { addLog('You already grabbed the keycard from here.', 'msg'); break; }
      state.hasKey = true;
      let keyRoom = state.grid[state.py][state.px];
      keyRoom.cleared = true;
      addLog('🔑 You found an access keycard! The boss chamber can now be unlocked.', 'loot');
      break;
    case 'intel':
      if (room.cleared) { addLog('The terminal is already looted.', 'msg'); break; }
      state.bossRevealed = true;
      state.keyRevealed = true;
      let intelRoom = state.grid[state.py][state.px];
      intelRoom.cleared = true;
      addLog('💡 Intel terminal! Boss (◆) and key (🔑) locations revealed on the grid.', 'loot');
      break;
    default:
      if (VAULT_TYPES.has(room.type)) {
        if (room.cleared) { addLog('The vault has already been looted.', 'msg'); break; }
        let vLoot = VAULT_LOOT[room.type];
        if (!room.loot) room.loot = [];
        room.loot.push({ ...vLoot.item });
        room.cleared = true;
        addLog(vLoot.msg, 'loot');
        break;
      }
    case 'loot':
      handleLootRoom();
      // Items are on the floor — pick them up from room panel
      break;
    case 'heal':
      let healAmt = roll(CONFIG.HEAL_ROOM_DICE) + CONFIG.HEAL_ROOM_BONUS;
      state.hp = Math.min(state.maxHp, state.hp + healAmt);
      addLog(`💚 Med-station restored ${healAmt} HP.`, 'info');
      room.type = 'empty';
      break;
  }

  render();
}

function showBossPrompt() {
  let boss = getBoss();
  document.getElementById('combatPanel').style.display = 'flex';
  document.getElementById('combatEnemyName').textContent = boss.name + ' (BOSS)';
  document.getElementById('combatEnemyDesc').textContent = boss.desc;
  document.getElementById('combatEnemyHp').textContent = `${boss.hp}/${boss.hp}`;
  document.getElementById('combatEnemyHpBar').style.width = '100%';
  document.getElementById('combatEnemyAtk').textContent = `d${boss.dice}+${boss.atk}`;
  document.getElementById('combatEnemyDef').textContent = boss.def;
  document.getElementById('combatEnemyEvd').textContent = boss.evd;
  // Replace buttons
  let panel = document.getElementById('combatPanel');
  panel.querySelector('.btn-row').innerHTML = `
    <button class="btn danger" onclick="acceptBossFight()">⚔ Challenge</button>
    <button class="btn" onclick="declineBoss()">↩ Step Back</button>
  `;
  // Store boss for later
  panel._pendingBoss = boss;
}

function acceptBossFight() {
  let panel = document.getElementById('combatPanel');
  let boss = panel._pendingBoss;
  panel._pendingBoss = null;
  // Restore normal combat buttons
  panel.querySelector('.btn-row').innerHTML = `
    <button class="btn danger" onclick="playerAttack()">⚔ <u>A</u>ttack</button>
    <button class="btn" onclick="playerDefend()">🛡️ <u>D</u>efend</button>
    <button class="btn" id="fleeBtn" onclick="playerFlee()" disabled>↩ <u>F</u>lee</button>
  `;
  boss._isBoss = true;
  addLog(`⚠ BOSS: ${boss.name} — ${boss.desc}`, 'danger');
  startCombat(boss);
}

function declineBoss() {
  let panel = document.getElementById('combatPanel');
  panel._pendingBoss = null;
  document.getElementById('combatPanel').style.display = 'none';
  // Restore normal combat buttons so they don't stay as "Challenge / Step Back"
  panel.querySelector('.btn-row').innerHTML = `
    <button class="btn danger" onclick="playerAttack()">⚔ <u>A</u>ttack</button>
    <button class="btn" onclick="playerDefend()">🛡️ <u>D</u>efend</button>
    <button class="btn" id="fleeBtn" onclick="playerFlee()">↩ <u>F</u>lee</button>
  `;
  addLog('You step back from the boss chamber. Prepare yourself.', 'info');
  render();
}

function handleLootRoom() {
  let room = state.grid[state.py][state.px];
  if (!room.loot) room.loot = [];
  let r = Math.random();
  if (r < CONFIG.LOOT_WEAPON_CHANCE) {
    let w = WEAPON_POOL[Math.floor(Math.random() * WEAPON_POOL.length)];
    room.loot.push({ name: w.name, type: 'weapon', dice: w.dice, bonus: w.bonus });
    addLog(`🗡️ Found ${w.name} on the floor.`, 'loot');
  } else if (r < CONFIG.LOOT_ARMOR_CHANCE) {
    let a = ARMOR_POOL[Math.floor(Math.random() * ARMOR_POOL.length)];
    room.loot.push({ name: a.name, type: 'armor', def: a.def, evd: a.evd });
    addLog(`🛡️ Found ${a.name} on the floor.`, 'loot');
  } else if (r < CONFIG.LOOT_HEAL_CHANCE) {
    let amt = Math.random() < CONFIG.INJECTOR_HEAL_CHANCE ? roll(CONFIG.INJECTOR_HEAL.dice) + CONFIG.INJECTOR_HEAL.bonus : -(roll(CONFIG.INJECTOR_DAMAGE.dice) + CONFIG.INJECTOR_DAMAGE.bonus);
    room.loot.push({ name: 'Injector', type: 'heal', amount: amt });
    addLog(`💉 Found an Injector${amt > 0 ? ' on the floor.' : ' — looks damaged...'}`, 'loot');
  } else {
    let creds = roll(CONFIG.LOOT_CREDS_DICE) + CONFIG.LOOT_CREDS_BONUS;
    state.creds += creds;
    addLog(`💰 Found ${creds}¢ in a discarded cred-chip.`, 'loot');
  }
}

function pickUpItem(idx) {
  let room = state.grid[state.py][state.px];
  if (!room.loot || idx < 0 || idx >= room.loot.length) return;
  let item = room.loot.splice(idx, 1)[0];
  state.inventory.push(item);
  addLog(`⤑ Picked up ${item.name}.`, 'loot');
  // If room was a loot room and all items taken, mark as empty
  if (room.loot.length === 0 && state.searchedRooms.has(`${state.px},${state.py}`)) {
    if (room.type === 'loot' || room.type === 'empty') {
      room.type = 'empty';
    }
  }
  render();
}

// ==================== LEVEL UP ====================
function checkLevelUp() {
  while (state.xp >= state.xpToLevel) {
    state.xp -= state.xpToLevel;
    state.level++;
    state.xpToLevel = Math.floor(state.xpToLevel * CONFIG.LEVEL_XP_MULT);
    state.maxHp += CONFIG.LEVEL_HP_GAIN;
    state.hp = state.maxHp; // full heal on level up
    state.atk += CONFIG.LEVEL_ATK_GAIN;
    let atkMsg = CONFIG.LEVEL_ATK_GAIN > 0 ? `, +${CONFIG.LEVEL_ATK_GAIN} ATK` : '';
    addLog(`⬆ LEVEL UP! You are now level ${state.level}. +${CONFIG.LEVEL_HP_GAIN} max HP${atkMsg}, fully healed.`, 'win');
  }
}

// ==================== GAME OVER ====================
function gameOverLose() {
  // Check for Backup Module — consume it and survive instead
  let reviveIdx = state.inventory.findIndex(i => i.type === 'revive');
  if (reviveIdx !== -1) {
    state.inventory.splice(reviveIdx, 1);
    state.hp = state.maxHp;
    addLog('❤️ Backup Module consumed! You wake up, restored to full health.', 'win');
    render();
    return;
  }

  state.gameOver = true;
  stopTimer();
  endCombat();
  addLog('💀 CONNECTION TERMINATED. You died in the Spire.', 'danger');
  render();
  showOverlay(`
    <div class="modal" style="max-width:400px">
      <h2>☠ FLATLINED</h2>
      <p>Your body is another data-ghost in the Spire. Floor reached: <b>${state.level}</b></p>
      <p style="color:#7a9aaa">⏱ Time: ${getTimeString()}</p>
      <p style="color:#ffcc00">Creds lost: ${state.creds}¢</p>
      <button class="btn danger" onclick="newGame()">⟳ JACK IN AGAIN</button>
    </div>
  `);
}

function gameOverWin() {
  state.gameOver = true;
  stopTimer();
  state.bossDefeated = true;
  addLog('🏆 BOSS DEFEATED! The Spire\'s grip on this sector is broken... for now.', 'win');
  render();
  showOverlay(`
    <div class="modal" style="max-width:400px">
      <h2>🏆 SPIRE BREAKER</h2>
      <p>You destroyed the boss and escaped with <b>${state.creds}¢</b> at level <b>${state.level}</b>.</p>
      <p style="color:#39ff14">⏱ Time: ${getTimeString()}</p>
      <p style="color:#39ff14">The Neon Reckoning spreads...</p>
      <button class="btn gold" onclick="newGame()">⟳ NEW RUN</button>
    </div>
  `);
}

// ==================== OVERLAY ====================
function showOverlay(html) {
  document.getElementById('overlayContainer').innerHTML = `<div class="overlay">${html}</div>`;
}
function closeOverlay() {
  document.getElementById('overlayContainer').innerHTML = '';
}

// ==================== INVENTORY MODAL ====================
function showInventoryModal() {
  let html = '<div class="modal modal-scroll">';
  html += '<h2>◈ INVENTORY</h2>';

  // Player stats + equipped (merged box)
  html += '<div style="margin-bottom:6px;padding:5px 6px;border:1px solid #1a3a4a">';
  html += '<div style="color:#7a9aaa;font-size:.7rem;margin-bottom:3px">PLAYER STATS</div>';
  html += `<div style="display:flex;gap:12px;font-size:.85rem;flex-wrap:wrap">`;
  html += `<span>HP <span style="color:#ff2a6d">${state.hp}/${state.maxHp}</span></span>`;
  html += `<span>LVL <span style="color:#ffcc00">${state.level}</span></span>`;
  html += `<span>¢<span style="color:#ffcc00">${state.creds}</span></span>`;
  html += `<span>XP <span style="color:#05d5ff">${state.xp}/${state.xpToLevel}</span></span>`;
  html += '</div>';
  html += `<div style="display:flex;gap:12px;font-size:.85rem;flex-wrap:wrap;margin-top:4px">`;
  html += `<span>ATK <span style="color:#ffcc00">d${state.weapon.dice}+${state.atk + state.weapon.bonus}</span></span>`;
  html += `<span>DEF <span style="color:#ffcc00">${state.def}</span></span>`;
  html += `<span>EVD <span style="color:#ffcc00">${state.evd}</span></span>`;
  html += '</div>';
  html += '<hr style="border:none;border-top:1px solid #1a3a4a;margin:5px 0">';
  html += '<div style="color:#7a9aaa;font-size:.7rem;margin-bottom:2px">EQUIPPED</div>';
  html += `<div><span style="color:#ff8c42">⚔️ ${state.weapon.name}</span></div>`;
  html += `<div><span style="color:#05d5ff">🛡️ ${state.armor.name}</span></div>`;
  html += '</div>';

  if (state.inventory.length === 0) {
    html += '<div style="border:1px solid #1a3a4a;padding:5px 6px;color:#4a6a7a;text-align:center">no items carried</div>';
  } else {
    html += '<div style="margin-bottom:6px;padding:5px 6px;border:1px solid #1a3a4a">';
    html += '<div style="color:#7a9aaa;font-size:.7rem;margin-bottom:2px">CARRIED</div>';
    const hasAnalyzer = state.inventory.some(j => j.type === 'analyzer');
    state.inventory.forEach((item, i) => {
      let label, action;
      if (item.type === 'weapon') {
        label = '🗡️ ' + item.name;
        action = `<span class="use" onclick="equipItem(${i});render();showInventoryModal();">[equip]</span>`;
      } else if (item.type === 'armor') {
        label = '🛡️ ' + item.name;
        action = `<span class="use" onclick="equipItem(${i});render();showInventoryModal();">[equip]</span>`;
      } else if (item.type === 'revive') {
        label = '❤️ ' + item.name;
        action = '';
      } else if (PASSIVE_ITEM_ICONS[item.type]) {
        label = (PASSIVE_ITEM_ICONS[item.type] || '📡') + ' ' + item.name;
        action = '';
      } else {
        label = '💉 ' + item.name;
        let amtDisplay = hasAnalyzer ? (item.amount > 0 ? `<span style="color:#39ff14;font-size:.7rem">+${item.amount}</span>` : `<span style="color:#ff2a6d;font-size:.7rem">${item.amount}</span>`) : '';
        if (amtDisplay) label += ' ' + amtDisplay;
        action = `<span class="use" onclick="useItem(${i});render();showInventoryModal();">[use]</span>`;
      }
      html += `<div class="inv-item" style="font-size:.78rem">
        <span>${label}</span>
        <span>${action} <span class="use" style="color:#ff2a6d;margin-left:4px" onclick="dropItem(${i});render();showInventoryModal();">[drop]</span></span>
      </div>`;
    });
    html += '</div>';
  }

  html += '<div style="text-align:center;margin-top:8px"><button class="btn" onclick="closeInventoryModal()">CLOSE</button></div>';
  html += '</div>';
  showOverlay(html);
}

function closeInventoryModal() {
  closeOverlay();
}

// ==================== LOG ====================
function addLog(msg, cls) {
  let log = document.getElementById('log');
  let div = document.createElement('div');
  div.className = cls || 'msg';
  div.innerHTML = '> ' + msg;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// ==================== RENDER ====================
function render() {
  // HP
  document.getElementById('hpText').textContent = `${state.hp}/${state.maxHp}`;
  document.getElementById('hpBar').style.width = `${(state.hp / state.maxHp) * 100}%`;
  // Stats
  document.getElementById('atkVal').textContent = `d${state.weapon.dice}+${state.atk + state.weapon.bonus}`;
  document.getElementById('defVal').textContent = state.def;
  document.getElementById('evdVal').textContent = state.evd;
  document.getElementById('lvlVal').textContent = state.level;
  document.getElementById('credsVal').textContent = state.creds;
  // Key in stats header
  let keyEl = document.getElementById('statsKey');
  if (keyEl) {
    keyEl.innerHTML = state.hasKey ? '🔑' : '🔒';
    keyEl.style.color = state.hasKey ? '#ffcc00' : '#7a9aaa';
  }
  // XP
  document.getElementById('xpText').textContent = `${state.xp}/${state.xpToLevel}`;
  document.getElementById('xpBar').style.width = `${(state.xp / state.xpToLevel) * 100}%`;
  // Gear in stats panel
  let gearEl = document.getElementById('statsGear');
  if (gearEl) {
    gearEl.innerHTML = `<div><span style="color:#ff8c42">⚔️ ${state.weapon.name}</span></div>` +
      `<div><span style="color:#05d5ff">🛡️ ${state.armor.name}</span></div>`;
  }
  // Grid
  renderGrid();
  // Room
  renderRoom();
  // Combat panel (if active)
  if (combatEnemy) updateCombatPanel();

  // Sync right column height to match the grid panel (after grid is rendered)
  let gridPanel = document.querySelector('.col-left > .panel');
  let rightCol = document.querySelector('.col-right');
  if (gridPanel && rightCol) {
    // Right column has 3 panels (6px bottom margin each) vs left's 1 panel
    let margin = parseFloat(getComputedStyle(gridPanel).marginBottom) || 0;
    rightCol.style.maxHeight = (gridPanel.offsetHeight + margin) + 'px';
  }
}

function equipItem(idx) {
  if (state.gameOver || combatEnemy) return;
  let item = state.inventory[idx];
  if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return;
  if (item.type === 'weapon') {
    let old = { ...state.weapon, type: 'weapon' };
    state.weapon = { name: item.name, dice: item.dice, bonus: item.bonus };
    state.inventory.splice(idx, 1);
    state.inventory.push(old);
  } else {
    // Unequip old armor, apply new DEF and EVD
    state.def -= state.armor.def;
    state.evd -= state.armor.evd;
    let old = { ...state.armor, type: 'armor' };
    state.armor = { name: item.name, def: item.def, evd: item.evd || 0 };
    state.def += item.def;
    state.evd += (item.evd || 0);
    state.inventory.splice(idx, 1);
    state.inventory.push(old);
  }
  addLog(`Equipped ${item.name}.`, 'info');
  render();
}

function useItem(idx) {
  if (state.gameOver) return;
  let item = state.inventory[idx];
  if (!item || item.type !== 'heal') return;
  state.hp = Math.min(state.maxHp, state.hp + item.amount);
  if (item.amount > 0) {
    addLog(`Used ${item.name}. +${item.amount} HP.`, 'info');
  } else {
    addLog(`⚠ ${item.name} backfired! ${item.amount} HP.`, 'danger');
  }
  state.inventory.splice(idx, 1);
  if (state.hp <= 0) { state.hp = 0; gameOverLose(); return; }
  render();
}

function dropItem(idx) {
  if (state.gameOver) return;
  let item = state.inventory[idx];
  if (!item) return;
  state.inventory.splice(idx, 1);
  let room = state.grid[state.py][state.px];
  if (!room.loot) room.loot = [];
  room.loot.push(item);
  addLog(`Dropped ${item.name}.`, 'msg');
  render();
}

function renderGrid() {
  let grid = document.getElementById('grid');
  grid.innerHTML = '';

  // Set 11 columns: 1 label + 10 grid cells
  grid.style.gridTemplateColumns = '16px ' + '1fr '.repeat(GRID_SIZE).trim();

  // Top-left corner (empty)
  let tl = document.createElement('div');
  tl.style.cssText = 'font-size:.55rem;color:#3a5a6a;display:flex;align-items:center;justify-content:center';
  grid.appendChild(tl);

  // Column labels (0-9)
  for (let x = 0; x < GRID_SIZE; x++) {
    let lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:.55rem;color:#3a5a6a;display:flex;align-items:center;justify-content:center';
    lbl.textContent = x;
    grid.appendChild(lbl);
  }

  // Hoist inventory checks — computed once, not per cell
  let hasTrapVision = state.inventory.some(i => i.type === 'trap-vision');
  let hasHealVision = state.inventory.some(i => i.type === 'heal-vision');
  let hasScanner = state.inventory.some(i => i.type === 'scanner');

  for (let y = 0; y < GRID_SIZE; y++) {
    // Row label
    let rl = document.createElement('div');
    rl.style.cssText = 'font-size:.55rem;color:#3a5a6a;display:flex;align-items:center;justify-content:center';
    rl.textContent = y;
    grid.appendChild(rl);

    for (let x = 0; x < GRID_SIZE; x++) {
      let cell = document.createElement('div');
      cell.className = 'cell';
      let key = `${x},${y}`;
      let room = state.grid[y][x];
      let dist = Math.abs(x - state.px) + Math.abs(y - state.py);

      let icon = '';
      if (x === state.px && y === state.py) {
        icon = '⬡';
        cell.classList.add('current');
      } else if (state.visited.has(key)) {
        cell.classList.add('visited');
        if (room.type === 'boss') icon = room.locked ? '🔒' : '◆';
        else if (room.type === 'key') { icon = '🔑'; if (room.cleared) cell.classList.add('cleared'); }
        else if (room.type === 'intel') { icon = '💡'; if (room.cleared) cell.classList.add('cleared'); }
        else if (VAULT_TYPES.has(room.type)) { icon = '⭐'; if (room.cleared) cell.classList.add('cleared'); }
        else if (room.type === 'enemy' && room.fled) { icon = room._enemyEmoji || '⚠'; }
        else if (room.type === 'trap') { icon = '·'; }
        else icon = '·';
      } else if (state.bossRevealed && x === state.bossRoom.x && y === state.bossRoom.y) {
        icon = state.grid[y][x].locked ? '🔒' : '◆';
      }

      // Adjacent cells
      if (dist === 1 && !state.gameOver) {
        cell.classList.add('adjacent');
        if (!state.visited.has(key) && !(state.bossRevealed && x===state.bossRoom.x && y===state.bossRoom.y) && !(state.keyRevealed && x===state.keyRoom.x && y===state.keyRoom.y)) {
          if (hasScanner) {
            if (room.type === 'boss') icon = '🔒';
            else if (room.type === 'key') icon = '🔑';
            else if (room.type === 'intel') icon = '💡';
            else if (VAULT_TYPES.has(room.type)) icon = '⭐';
            else if (hasTrapVision && room.type === 'trap') icon = '⚡';
            else if (hasHealVision && room.type === 'heal') icon = '💊';
            else icon = '?';
          } else {
            icon = '?';
          }
        }
        cell.onclick = () => enterRoom(x, y);
      }

      // Monster icons on visited enemy rooms
      if (state.visited.has(key) && room.type === 'enemy' && room._enemyEmoji) {
        icon = room._enemyEmoji;
      }

      // Also show revealed boss icon for non-adjacent
      if (state.bossRevealed && x === state.bossRoom.x && y === state.bossRoom.y && !state.visited.has(key)) {
        icon = state.grid[y][x].locked ? '🔒' : '◆';
      }

      // Show revealed key room on the grid
      if (state.keyRevealed && x === state.keyRoom.x && y === state.keyRoom.y && !state.visited.has(key)) {
        icon = '🔑';
      }

      // Trap-vision — show ⚡ on visited trap rooms
      if (hasTrapVision && room.type === 'trap' && state.visited.has(key) && (icon === '·' || icon === '')) {
        icon = '⚡';
      }

      // Heal-vision — show 💊 on visited heal rooms
      if (hasHealVision && room.type === 'heal' && state.visited.has(key) && (icon === '·' || icon === '')) {
        icon = '💊';
      }

      cell.textContent = icon || '';
      grid.appendChild(cell);
    }
  }
}

function renderRoom() {
  let room = state.grid[state.py][state.px];
  let artEl = document.getElementById('roomArt');
  let descEl = document.getElementById('roomDesc');
  let resultEl = document.getElementById('roomSearchResult');
  let searchBtn = document.getElementById('searchBtn');
  let dpadSearch = document.getElementById('dpadSearchBtn');
  let key = `${state.px},${state.py}`;
  let searched = state.searchedRooms.has(key);

  // Hide D-pad search button when there's a threat or already searched
  let canSearch = !state.gameOver && !combatEnemy && room.type !== 'enemy' && room.type !== 'boss' && room.type !== 'trap' && !searched;
  if (dpadSearch) dpadSearch.style.display = canSearch ? '' : 'none';

  // Get room variant (atmosphere fluff)
  let v = variants[room.variant] || variants[0];

  // Enemy rooms — variant + monster
  if (room.type === 'enemy') {
    artEl.textContent = `${v.emoji} ${state._currentEnemyEmoji || '👾'}`;
    descEl.textContent = v.desc;
    resultEl.textContent = '';
    searchBtn.style.display = 'none';
    let lootEl = document.getElementById('roomLoot');
    if (lootEl) lootEl.style.display = 'none';
    return;
  }

  // Boss room — variant + boss icon
  if (room.type === 'boss') {
    artEl.textContent = `${v.emoji} 👹`;
    descEl.textContent = v.desc;
    if (room.locked) {
      resultEl.textContent = state.hasKey ? '🔑 Use the keycard to unlock' : '🔒 Requires access keycard';
    } else {
      resultEl.textContent = '';
    }
    searchBtn.style.display = 'none';
    let lootEl = document.getElementById('roomLoot');
    if (lootEl) lootEl.style.display = 'none';
    return;
  }

  // Trap rooms — hide search, already triggered
  if (room.type === 'trap') {
    artEl.textContent = `${v.emoji} ⚡`;
    descEl.textContent = v.desc;
    resultEl.textContent = '⚠️ Trap triggered';
    searchBtn.style.display = 'none';
    let lootEl = document.getElementById('roomLoot');
    if (lootEl) lootEl.style.display = 'none';
    return;
  }

  // Content icon for this room (skip for plain empty rooms)
  let contentIcon = roomEmoji[room.type] || roomEmoji.empty;
  if (room.type === 'empty') contentIcon = '';

  let hasLoot = room.loot && room.loot.length > 0;

  if (searched) {
    // Already searched — override content icon if cleared
    if (room.cleared && VAULT_TYPES.has(room.type)) {
      contentIcon = '📭';
    } else if (room.cleared && (room.type === 'key' || room.type === 'intel')) {
      contentIcon = '🗑️';
    }
    artEl.textContent = `${v.emoji} ${contentIcon}`;
    descEl.textContent = v.desc;
    resultEl.textContent = '';
    searchBtn.style.display = 'none';
  } else if (hasLoot && !searched) {
    // Has loot but not yet searched (e.g. vault just opened)
    artEl.textContent = `${v.emoji} ${contentIcon}`;
    descEl.textContent = v.desc;
    resultEl.textContent = '';
    searchBtn.style.display = 'none';
  } else {
    // Not searched yet — show Search button
    artEl.textContent = `${v.emoji} ${contentIcon}`;
    descEl.textContent = v.desc;
    resultEl.textContent = '';
    searchBtn.style.display = 'block';
    searchBtn.textContent = '🔍 Search Room';
  }

  // Toggle room content layout: centered when no loot, top when loot is present
  let contentEl = document.getElementById('roomContent');
  if (contentEl) {
    contentEl.style.justifyContent = hasLoot ? 'flex-start' : 'center';
    contentEl.style.paddingTop = hasLoot ? '6px' : '0';
  }

  // Room loot display
  let lootEl = document.getElementById('roomLoot');
  if (lootEl) lootEl.style.display = hasLoot ? 'block' : 'none';
  if (hasLoot) {
    let lootHtml = '<div style="border-top:1px solid #1a3a4a;margin-top:6px;padding-top:4px">';
    lootHtml += '<div style="color:#ffcc00;font-size:.7rem;letter-spacing:1px;margin-bottom:3px">📦 ROOM LOOT</div>';
    room.loot.forEach((item, i) => {
      let label;
      if (item.type === 'weapon') {
        label = '🗡️ ' + item.name;
      } else if (item.type === 'armor') {
        label = '🛡️ ' + item.name;
      } else if (item.type === 'heal') {
        label = '💉 ' + item.name;
      } else if (PASSIVE_ITEM_ICONS[item.type]) {
        label = (PASSIVE_ITEM_ICONS[item.type] || '📡') + ' ' + item.name;
      } else if (item.type === 'revive') {
        label = '❤️ ' + item.name;
      } else {
        label = item.name;
      }
      lootHtml += `<div class="inv-item" style="font-size:.75rem">
        <span>${label}</span>
        <span class="use" onclick="pickUpItem(${i})" style="font-size:.7rem">[pick up]</span>
      </div>`;
    });
    lootHtml += '</div>';
    lootEl.innerHTML = lootHtml;
    lootEl.style.display = '';
  }
}

// ==================== KEYBOARD ====================
document.addEventListener('keydown', (e) => {
  // Allow Enter on game over overlay to restart
  if (document.getElementById('overlayContainer').innerHTML) {
    if (state.gameOver && (e.key === 'Enter')) { e.preventDefault(); newGame(); }
    return;
  }

  if (state.gameOver) return;

  if (combatEnemy) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'a' || e.key === 'A') { e.preventDefault(); playerAttack(); }
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); playerDefend(); }
    if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') { e.preventDefault(); playerFlee(); }
    return;
  }

  // Search if button is visible (pressing Enter or S key)
  let searchBtn = document.getElementById('searchBtn');
  if (searchBtn.style.display !== 'none') {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 's' || e.key === 'S') { e.preventDefault(); searchRoom(); return; }
  }

  // Boss prompt active — use combat panel but no combatEnemy
  let panel = document.getElementById('combatPanel');
  if (panel._pendingBoss) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'a' || e.key === 'A') { e.preventDefault(); acceptBossFight(); }
    if (e.key === 'Escape') { e.preventDefault(); declineBoss(); }
    return;
  }

  let dx = 0, dy = 0;
  if (e.key === 'ArrowUp') dy = -1;
  if (e.key === 'ArrowDown') dy = 1;
  if (e.key === 'ArrowLeft') dx = -1;
  if (e.key === 'ArrowRight') dx = 1;

  if (dx === 0 && dy === 0) return;
  e.preventDefault();

  let nx = state.px + dx;
  let ny = state.py + dy;
  if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return;

  enterRoom(nx, ny);
});

// ==================== NEW GAME ====================
function newGame() {
  closeOverlay();
  state = {
    grid: [],
    px: 0, py: 0,
    hp: CONFIG.START_HP, maxHp: CONFIG.START_HP,
    atk: CONFIG.START_ATK, def: CONFIG.START_DEF, evd: CONFIG.START_EVD,
    level: 1,
    xp: 0, xpToLevel: CONFIG.START_XP_TO_LEVEL,
    creds: 0,
    weapon: { name: CONFIG.START_WEAPON.name, dice: CONFIG.START_WEAPON.dice, bonus: CONFIG.START_WEAPON.bonus },
    armor: { name: CONFIG.START_ARMOR.name, def: CONFIG.START_ARMOR.def, evd: CONFIG.START_ARMOR.evd },
    inventory: [],
    hasKey: false,
    bossDefeated: false,
    bossRevealed: false,
    intelRoom: null,
    gameOver: false,
    visited: new Set(),
    searchedRooms: new Set(),
    bossRoom: null,
    keyRoom: null,
    keyRevealed: false,
    vaultRoom: null,
    vaultRoom2: null,
    vaultRoom3: null,
    vaultRoom4: null,
    vaultRoom5: null,
    vaultRoom6: null,
    vaultRoom7: null,
  };
  combatEnemy = null;
  endCombat();
  generateFloor();
  document.getElementById('log').innerHTML = '';
  addLog('System boot: Welcome to the Spire, runner. Find the key. Unlock the boss chamber. Survive.', 'msg');
  startTimer();
  render();
}

// ==================== INIT ====================
newGame();
