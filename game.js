// ==================== GAME STATE ====================
const GRID_SIZE = 10;

// ==================== GAME CONFIG ====================
const CONFIG = {
  // Starting stats
  START_HP: 20,
  START_ATK: 2,
  START_DEF: 3,
  START_EVD: 2,
  START_XP_TO_LEVEL: 10,

  // Starting gear
  START_WEAPON: { name: 'Rusty Pipe', dice: 4, bonus: 0 },
  START_ARMOR: { name: 'Torn Jacket', def: 0, evd: 0 },

  // Level up
  LEVEL_HP_GAIN: 2,
  LEVEL_ATK_GAIN: 0,
  LEVEL_XP_MULT: 1.5,

  // Room effects
  HEAL_ROOM_DICE: 8,
  HEAL_ROOM_BONUS: 2,
  TRAP_DICE: 12,
  TRAP_BONUS: 2,

  // Injectors
  INJECTOR_HEAL_CHANCE: 0.75,
  INJECTOR_HEAL: { dice: 6, bonus: 2 },
  INJECTOR_DAMAGE: { dice: 6, bonus: 4 },

  // Loot creds
  LOOT_CREDS_DICE: 20,
  LOOT_CREDS_BONUS: 10,

  // Loot probabilities
  LOOT_WEAPON_CHANCE: 0.25,
  LOOT_ARMOR_CHANCE: 0.50,
  LOOT_HEAL_CHANCE: 0.72,

  // Flee
  FLEE_DIFF: 2,
  FAILED_FLEE_DICE: 4,

  // Enemy scaling per level
  ENEMY_HP: 4,
  ENEMY_XP: 1,
  ENEMY_CREDS: 5,

  // Boss min distance from start
  BOSS_MIN_DIST: 3,

  // Combat delay (ms)
  ENEMY_ATTACK_DELAY: 500,

  // Defend stance
  DEFEND_DEF_BONUS: 2,
  DEFEND_EVD_BONUS: 1,
  DEFEND_ATK_PENALTY: 2,
};

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

// ==================== DATA POOLS ====================
const ENEMY_POOL = [
  // Level 1 — weak, low everything
  { name: 'Glitch Drone',     emoji: '🤖', hp: 18, atk: 2, def: 1, evd: 1, dice: 4, xp: 2, creds: 10 },
  { name: 'Rogue Drone Swarm',emoji: '🐝', hp: 20, atk: 2, def: 1, evd: 2, dice: 6, xp: 4, creds: 15 },

  // Level 2 — tanky, weak hits
  { name: 'Chrome Ganger',    emoji: '🧟', hp: 30, atk: 2, def: 4, evd: 1, dice: 4, xp: 5, creds: 20 },

  // Level 3 — balanced soldier
  { name: 'CorpSec Enforcer', emoji: '👮', hp: 26, atk: 3, def: 3, evd: 2, dice: 6, xp: 7, creds: 30 },

  // Level 4 — glass cannon (low HP, high ATK/evasion)
  { name: 'Data Shade',       emoji: '👤', hp: 16, atk: 4, def: 1, evd: 4, dice: 8, xp: 7, creds: 30 },

  // Level 5 — mid-range pair
  { name: 'Synth-Cultists',   emoji: '👥', hp: 28, atk: 3, def: 3, evd: 3, dice: 6, xp: 9, creds: 40 },

  // Level 6 — offensive specialist
  { name: 'Rocker-Hacker',    emoji: '👨‍🎤', hp: 24, atk: 4, def: 2, evd: 4, dice: 8, xp: 11, creds: 50 },

  // Level 7 — slippery striker
  { name: 'Ghost Runner',     emoji: '👻', hp: 20, atk: 5, def: 1, evd: 6, dice: 8, xp: 12, creds: 55 },

  // Level 8 — heavy hitter, easy to hit
  { name: 'Cybergorgon',      emoji: '🐉', hp: 40, atk: 5, def: 4, evd: 1, dice: 10, xp: 14, creds: 65 },

  // Level 9 — well-rounded elite
  { name: 'Apex Warden',      emoji: '🧿', hp: 38, atk: 5, def: 4, evd: 3, dice: 8, xp: 15, creds: 70 },

  // Level 10 — endgame bruiser
  { name: 'Plague Wraith',    emoji: '🦠', hp: 50, atk: 6, def: 5, evd: 0, dice: 12, xp: 18, creds: 85 },
];

const BOSSES = [
  { name: 'OVERSEER v2.0',  emoji: '👁️', hp: 80, maxHp:80, atk: 5, def: 4, evd: 3, dice: 12, xp: 20, creds: 120,
    desc: 'A massive security AI core, crackling with malevolent energy.' },
  { name: 'CYBER-LICH',     emoji: '💀', hp: 70, maxHp:70, atk: 6, def: 4, evd: 4, dice: 10, xp: 18, creds: 100,
    desc: 'A former netrunner fused with the Spire\'s mainframe.' },
];

const WEAPON_POOL = [
  { name: 'Shock Baton',    dice: 4, bonus: 3 },
  { name: 'Mono-Katana',    dice: 6, bonus: 1 },
  { name: 'Plasma Cutter',  dice: 6, bonus: 2 },
  { name: 'Pulse Rifle',    dice: 8, bonus: 0 },
  { name: 'Scrap Cannon',   dice: 10, bonus: 0 },
  { name: 'Needle Pistol',  dice: 4, bonus: 1 },
  { name: 'Arc Blaster',    dice: 6, bonus: 3 },
  { name: 'Rail Driver',    dice: 8, bonus: 1 },
  { name: 'Thermite Axe',   dice: 8, bonus: 2 },
  { name: 'Ion Gauntlets',  dice: 6, bonus: 0 },
  { name: 'Razor Whip',     dice: 4, bonus: 4 },
  { name: 'Nail Gun',       dice: 6, bonus: 0 },
  { name: 'Gauss Rifle',    dice: 10, bonus: 1 },
  { name: 'Saw Blade',      dice: 8, bonus: 0 },
  { name: 'EMP Rod',        dice: 4, bonus: 2 },
  { name: 'Concussion Hammer', dice: 9, bonus: 1 },
  { name: 'Laser Lance',    dice: 6, bonus: 4 },
  { name: 'Flechette Gun',  dice: 8, bonus: 0 },
  { name: 'Overcharged Cell', dice: 4, bonus: 6 },
  { name: 'Rusty Cleaver',  dice: 6, bonus: 0 },
];

const ARMOR_POOL = [
  // Pure DEF
  { name: 'Exo Frame',     def: 6, evd: 0 },
  { name: 'Plated Jacket', def: 5, evd: 0 },
  { name: 'Flak Vest',     def: 4, evd: 0 },
  { name: 'Crash Padding', def: 3, evd: 0 },
  { name: 'Kevlar Vest',   def: 2, evd: 0 },
  { name: 'Grav Harness',  def: 1, evd: 0 },

  // Pure EVD
  { name: 'Ghost Mantle',  def: 0, evd: 12 },
  { name: 'Phase Cloak',   def: 0, evd: 8 },
  { name: 'Reflex Mesh',   def: 0, evd: 4 },
  { name: 'Thermal Cloak', def: 0, evd: 2 },

  // Balanced
  { name: 'Hardlight Field', def: 4, evd: 7 },
  { name: 'Scav Plating',    def: 3, evd: 5 },
  { name: 'Magnet Shield',   def: 2, evd: 3 },
  { name: 'Nano-Weave Suit', def: 1, evd: 1 },

  // Trade-offs
  { name: 'Riot Shield',      def:  8, evd: -2 },
  { name: 'Chainmail Tarp',   def:  7, evd: -1 },
  { name: 'Glass Cannon Rig', def: -3, evd: 14 },
  { name: 'Servo Harness',    def: -2, evd: 13 },
];

// ==================== VAULT GEAR ====================
const VAULT_WEAPON = { name: 'Synth-Katana', type: 'weapon', dice: 10, bonus: 2 };
const VAULT_ARMOR = { name: 'Chrome Carapace', type: 'armor', def: 10, evd: 1 };

const VAULT_TYPES = new Set(['vault','vault2','vault3','vault4','vault5','vault6','vault7']);

const VAULT_ROOMS = [
  { stateKey: 'vaultRoom', type: 'vault' },
  { stateKey: 'vaultRoom2', type: 'vault2' },
  { stateKey: 'vaultRoom3', type: 'vault3' },
  { stateKey: 'vaultRoom4', type: 'vault4' },
  { stateKey: 'vaultRoom5', type: 'vault5' },
  { stateKey: 'vaultRoom6', type: 'vault6' },
  { stateKey: 'vaultRoom7', type: 'vault7' },
];

const VAULT_LOOT = {
  vault:  { item: { ...VAULT_WEAPON }, msg: '🏦 Armory vault breached! Found Synth-Katana (d10+2).' },
  vault2: { item: { ...VAULT_ARMOR },  msg: '🏦 DEF vault breached! Found Chrome Carapace (+10 DEF / +1 EVD).' },
  vault3: { item: { name: 'Room Scanner', type: 'scanner' },      msg: '🏦 Scanner vault breached! Found a Room Scanner — reveals adjacent rooms on the grid.' },
  vault4: { item: { name: 'Backup Module', type: 'revive' },      msg: '🏦 Med vault breached! Found a Backup Module — prevents death once.' },
  vault5: { item: { name: 'Chem Analyzer', type: 'analyzer' },    msg: '🏦 Chem vault breached! Found a Chem Analyzer — reveals injector effects.' },
  vault6: { item: { name: 'Threat Array', type: 'trap-vision' },  msg: '🏦 Security vault breached! Found a Threat Array — reveals traps on the map.' },
  vault7: { item: { name: 'Med Scanner', type: 'heal-vision' },   msg: '🏦 Med-tech vault breached! Found a Med Scanner — reveals healing rooms on the map.' },
};

const PASSIVE_ITEM_ICONS = { scanner: '📡', analyzer: '🔬', 'trap-vision': '⚡', 'heal-vision': '💊' };

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
  inventoryFilters: new Set(['weapon', 'armor', 'heal', 'passive']),
};

// ==================== ROOM GENERATION ====================
function generateFloor() {
  // Create empty grid with random room variants
  let pickVariant = () => Math.floor(Math.random() * variants.length);
  state.grid = Array.from({length: GRID_SIZE}, () => Array.from({length: GRID_SIZE}, () => ({ type: 'empty', variant: pickVariant() })));
  state.visited = new Set();
  state.visited.add('0,0');

  // Pick random boss room (not adjacent to start)
  let candidates = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 0 && y === 0) continue;
      let dist = Math.abs(x - 0) + Math.abs(y - 0);
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
      if ((x === 0 && y === 0) || (x === boss.x && y === boss.y)) continue;
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
      if ((x === 0 && y === 0) || (x === boss.x && y === boss.y) || (x === key.x && y === key.y)) continue;
      candidates.push({x, y});
    }
  }
  let intel = candidates[Math.floor(Math.random() * candidates.length)];
  state.intelRoom = intel;
  state.grid[intel.y][intel.x] = { type: 'intel', variant: pickVariant() };

  // Track used cells to avoid overlap
  let used = new Set(['0,0', `${boss.x},${boss.y}`, `${key.x},${key.y}`, `${intel.x},${intel.y}`]);
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
  state.grid[0][0].type = 'loot';
}

// ==================== ENEMIES ====================
/**
 * Generates a random enemy scaled to the current floor level.
 * Pulls from the available enemy pool (unlocking tougher enemies as the player levels up),
 * then applies level-based scaling to HP, XP, and credits.
 * @returns {{ name: string, emoji: string, hp: number, maxHp: number, atk: number, def: number, evd: number, dice: number, xp: number, creds: number }}
 */
function getEnemyForFloor() {
  let pool = ENEMY_POOL.slice(0, Math.min(state.level + 1, ENEMY_POOL.length));
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
  document.getElementById('inv').style.display = 'none';
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
  document.getElementById('inv').style.display = '';
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
    state.grid[state.py][state.px] = { type: 'empty', variant: state.grid[state.py][state.px].variant };
    state.searchedRooms.add(`${state.px},${state.py}`);
    if (wasBoss) {
      addLog(`💀 ${e.name} DESTROYED!`, 'win');
      gameOverWin();
    } else {
      addLog(`💀 ${e.name} destroyed! +${e.xp} XP, +${e.creds}¢`, 'win');
      // Auto-loot the room after defeating the enemy
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
    endCombat();
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
      updateKeyStatus();
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
    let trapDmg = roll(CONFIG.TRAP_DICE) + CONFIG.TRAP_BONUS;
    state.hp -= trapDmg;
    addLog(`⚡ Shock trap! You take ${trapDmg} damage.`, 'danger');
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
      state.grid[state.py][state.px] = { type: 'key', cleared: true };
      addLog('🔑 You found an access keycard! The boss chamber can now be unlocked.', 'loot');
      updateKeyStatus();
      break;
    case 'intel':
      if (room.cleared) { addLog('The terminal is already looted.', 'msg'); break; }
      state.bossRevealed = true;
      state.keyRevealed = true;
      state.grid[state.py][state.px] = { type: 'intel', cleared: true };
      addLog('💡 Intel terminal! Boss (◆) and key (🔑) locations revealed on the grid.', 'loot');
      break;
    default:
      if (VAULT_TYPES.has(room.type)) {
        if (room.cleared) { addLog('The vault has already been looted.', 'msg'); break; }
        let loot = VAULT_LOOT[room.type];
        state.grid[state.py][state.px] = { type: room.type, cleared: true };
        state.inventory.push({ ...loot.item });
        addLog(loot.msg, 'loot');
        break;
      }
    case 'loot':
      handleLootRoom();
      state.grid[state.py][state.px] = { type: 'empty', variant: room.variant };
      break;
    case 'heal':
      let healAmt = roll(CONFIG.HEAL_ROOM_DICE) + CONFIG.HEAL_ROOM_BONUS;
      state.hp = Math.min(state.maxHp, state.hp + healAmt);
      addLog(`💚 Med-station restored ${healAmt} HP.`, 'info');
      state.grid[state.py][state.px] = { type: 'empty', variant: room.variant };
      break;
  }

  render();
}

function showBossPrompt() {
  let boss = getBoss();
  document.getElementById('inv').style.display = 'none';
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
  document.getElementById('inv').style.display = '';
  // Restore normal combat buttons so they don't stay as "Challenge / Step Back"
  panel.querySelector('.btn-row').innerHTML = `
    <button class="btn danger" onclick="playerAttack()">⚔ <u>A</u>ttack</button>
    <button class="btn" onclick="playerDefend()">🛡️ <u>D</u>efend</button>
    <button class="btn" id="fleeBtn" onclick="playerFlee()">↩ <u>F</u>lee</button>
  `;
  addLog('You step back from the boss chamber. Prepare yourself.', 'info');
}

function handleLootRoom() {
  let r = Math.random();
  if (r < CONFIG.LOOT_WEAPON_CHANCE) {
    // Weapon
    let w = WEAPON_POOL[Math.floor(Math.random() * WEAPON_POOL.length)];
    state.inventory.push({ name: w.name, type: 'weapon', dice: w.dice, bonus: w.bonus });
    addLog(`🗡️ Found ${w.name} (d${w.dice}+${w.bonus}).`, 'loot');
  } else if (r < CONFIG.LOOT_ARMOR_CHANCE) {
    // Armor
    let a = ARMOR_POOL[Math.floor(Math.random() * ARMOR_POOL.length)];
    state.inventory.push({ name: a.name, type: 'armor', def: a.def, evd: a.evd });
    let dStr = a.def !== 0 ? (a.def > 0 ? '+' : '') + a.def + ' DEF' : '';
    let eStr = a.evd !== 0 ? (a.evd > 0 ? '+' : '') + a.evd + ' EVD' : '';
    let label = dStr + (dStr && eStr ? ' / ' : '') + eStr;
    addLog(`🛡️ Found ${a.name} (${label}).`, 'loot');
  } else if (r < CONFIG.LOOT_HEAL_CHANCE) {
    // Healing item
    state.inventory.push({ name: 'Injector', type: 'heal', amount: Math.random() < CONFIG.INJECTOR_HEAL_CHANCE ? roll(CONFIG.INJECTOR_HEAL.dice) + CONFIG.INJECTOR_HEAL.bonus : -(roll(CONFIG.INJECTOR_DAMAGE.dice) + CONFIG.INJECTOR_DAMAGE.bonus) });
    let amt = state.inventory[state.inventory.length - 1].amount;
    addLog(`💉 Found an Injector${amt > 0 ? '.' : ' — looks damaged...'}`, 'loot');
  } else {
    // Creds
    let creds = roll(CONFIG.LOOT_CREDS_DICE) + CONFIG.LOOT_CREDS_BONUS;
    state.creds += creds;
    addLog(`💰 Found ${creds}¢ in a discarded cred-chip.`, 'loot');
  }
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
    endCombat();
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
    <div class="modal">
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
    <div class="modal">
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
  // XP
  document.getElementById('xpText').textContent = `${state.xp}/${state.xpToLevel}`;
  document.getElementById('xpBar').style.width = `${(state.xp / state.xpToLevel) * 100}%`;
  // Key
  updateKeyStatus();
  // Grid
  renderGrid();
  // Room
  renderRoom();
  // Inventory
  renderInventory();
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

function updateKeyStatus() {
  let el = document.getElementById('keyStatus');
  if (state.hasKey) {
    el.innerHTML = '🔑 Key';
    el.style.color = '#ffcc00';
  } else {
    el.innerHTML = '🔒 No key';
    el.style.color = '#7a9aaa';
  }
}

function toggleInventoryFilter(type) {
  if (type === 'all') {
    state.inventoryFilters = new Set(['weapon', 'armor', 'heal', 'passive']);
  } else {
    if (state.inventoryFilters.has(type)) {
      state.inventoryFilters.delete(type);
    } else {
      state.inventoryFilters.add(type);
    }
  }
  render();
}

function getItemTypeLabel(item) {
  if (item.type === 'weapon') return 'weapon';
  if (item.type === 'armor') return 'armor';
  if (item.type === 'revive') return 'passive';
  if (PASSIVE_ITEM_ICONS[item.type]) return 'passive';
  if (item.type === 'heal') return 'heal';
  return 'other';
}

function renderInventory() {
  let inv = document.getElementById('invItems');
  // Update filter chip active state — multi-select
  let allActive = ['weapon', 'armor', 'heal', 'passive'].every(t => state.inventoryFilters.has(t));
  document.querySelectorAll('.inv-filter').forEach(el => {
    if (el.dataset.filter === 'all') {
      el.classList.toggle('active', allActive);
    } else {
      el.classList.toggle('active', state.inventoryFilters.has(el.dataset.filter));
    }
  });
  let w = state.weapon;
  let a = state.armor;
  let html = '';
  // Equipped gear (always visible) — single row, stats omitted (see STATS panel)
  html += `<div class="inv-item" style="display:flex;gap:8px">
    <span style="color:#ff8c42;flex:1">⚔️ ${w.name}</span>
    <span style="color:#05d5ff;flex:1;text-align:right">🛡️ ${a.name}</span>
  </div>`;

  // Filter items — multi-select
  let filtered = state.inventory.filter((item) => {
    return state.inventoryFilters.has(getItemTypeLabel(item));
  });

  if (filtered.length === 0) {
    html += '<div style="color:#4a6a7a;font-size:.7rem;padding-top:4px">no items</div>';
  } else {
    // Use original index for actions so [equip]/[use]/[drop] work correctly
    html += filtered.map((item, fi) => {
      let i = state.inventory.indexOf(item);
      let label, stat, action;
      if (item.type === 'weapon') {
        label = item.name;
        stat = '';
        action = `<span class="use" onclick="equipItem(${i})">[equip]</span>`;
      } else if (item.type === 'armor') {
        label = item.name;
        stat = '';
        action = `<span class="use" onclick="equipItem(${i})">[equip]</span>`;
      } else if (item.type === 'revive') {
        label = '❤️ ' + item.name;
        stat = '<span style="color:#ff2a6d">[auto-save]</span>';
        action = '';
      } else if (PASSIVE_ITEM_ICONS[item.type]) {
        label = (PASSIVE_ITEM_ICONS[item.type] || '📡') + ' ' + item.name;
        stat = '<span style="color:#05d5ff">[passive]</span>';
        action = '';
      } else {
        label = item.name;
        let hasAnalyzer = state.inventory.some(i => i.type === 'analyzer');
        if (hasAnalyzer) {
          let sign = item.amount > 0 ? '+' : '';
          stat = `<span style="color:#7a9aaa">[${sign}${item.amount}HP]</span>`;
        } else {
          stat = '<span style="color:#7a9aaa">[???]</span>';
        }
        action = `<span class="use" onclick="useItem(${i})">[use]</span>`;
      }
      return `<div class="inv-item clickable">
        <span>${label} ${stat}</span>
        <span>${action} <span class="use" style="color:#ff2a6d;margin-left:4px" onclick="event.stopPropagation();dropItem(${i})">[drop]</span></span>
      </div>`;
    }).join('');
  }
  inv.innerHTML = html;
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
  addLog(`Dropped ${item.name}.`, 'msg');
  state.inventory.splice(idx, 1);
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

      cell.textContent = icon || (x === 0 && y === 0 ? '⚑' : '');
      grid.appendChild(cell);
    }
  }
}

// Room variant fluff (atmosphere type for each cell)
const variants = [
  { emoji: '🏢', desc: 'Abandoned cubicles. Flickering monitors. Dust and silence.' },
  { emoji: '🚪', desc: 'A long, narrow hallway. Flickering fluorescent lights buzz overhead.' },
  { emoji: '📊', desc: 'A conference room. Holo-projectors display corrupted data streams.' },
  { emoji: '🧹', desc: 'A janitorial closet. Mops, buckets, and the sharp smell of industrial cleaner.' },
  { emoji: '☕', desc: 'A break room. An old coffee maker gurgles with something dark and unknown.' },
  { emoji: '🔧', desc: 'A maintenance closet. Pipes hiss and valves drip onto the floor.' },
  { emoji: '📁', desc: 'A filing room. Cabinets stuffed with obsolete records and dead media.' },
  { emoji: '🪑', desc: 'A waiting area. Chairs bolted to the floor. Dusty magazines scattered about.' },
  { emoji: '🛏️', desc: 'An abandoned sleeping pod. The mattress is torn and stained.' },
  { emoji: '🚻', desc: 'A restroom. Graffiti covers the mirrors. The taps run with rusty water.' },
  { emoji: '📡', desc: 'A server room. Dead racks loom in the dark. A single red light blinks.' },
  { emoji: '🏗️', desc: 'An unfinished construction zone. Rebar juts from exposed concrete.' },
];

const roomEmoji = {
  empty: '🏢',
  key: '🔑',
  intel: '🖥️',
  heal: '💊',
  trap: '⚡',
  loot: '📦',
  boss: '👹',
  vault: '⚔️',
  vault2: '🛡️',
  vault3: '📡',
  vault4: '❤️',
  vault5: '🔬',
  vault6: '⚡',
  vault7: '💊',
};

const roomDesc = {
  empty: 'Abandoned cubicles. Flickering monitors. Dust and silence.',
  enemy: 'A figure moves in the shadows. Weapon drawn.',
  key: 'A keycard terminal pulses with a soft blue light.',
  intel: 'Data terminals flicker. Floor plans scroll across screens.',
  heal: 'A dusty med-station. A few vials remain intact.',
  trap: 'Tripped a motion sensor. Something just activated.',
  loot: 'Abandoned gear and scattered cred-chips litter the floor.',
  boss: 'Massive blast doors. The Spire\'s master awaits inside.',
  vault: 'A reinforced vault. Rare tech glimmers behind the grate.',
  vault2: 'A reinforced vault. Thick plating lines the interior.',
  vault3: 'A reinforced vault. Surveillance monitors line the walls, some still flickering.',
  vault4: 'A reinforced vault. Cryogenic pods line the walls. One still hums with power.',
  vault5: 'A reinforced vault. Chem-lab equipment glitters under UV light. Analysis terminals blink.',
  vault6: 'A reinforced vault. Security schematics glow on holographic displays. Trap data streams across the console.',
  vault7: 'A reinforced vault. Medical monitors beep softly. Shelves of sterile supplies line the walls.',
};

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
    return;
  }

  // Trap rooms — hide search, already triggered
  if (room.type === 'trap') {
    artEl.textContent = `${v.emoji} ⚡`;
    descEl.textContent = v.desc;
    resultEl.textContent = '⚠️ Trap triggered';
    searchBtn.style.display = 'none';
    return;
  }

  // Content icon for this room (skip for plain empty rooms)
  let contentIcon = roomEmoji[room.type] || roomEmoji.empty;
  if (room.type === 'empty') contentIcon = '';

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
  } else {
    // Not searched yet — show Search button
    artEl.textContent = `${v.emoji} ${contentIcon}`;
    descEl.textContent = v.desc;
    resultEl.textContent = '';
    searchBtn.style.display = 'block';
    searchBtn.textContent = '🔍 Search Room';
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
    inventoryFilters: new Set(['weapon', 'armor', 'heal', 'passive']),
  };
  combatEnemy = null;
  endCombat();
  state.visited.add('0,0');
  generateFloor();
  document.getElementById('log').innerHTML = '';
  addLog('System boot: Welcome to the Spire, runner. Find the key. Unlock the boss chamber. Survive.', 'msg');
  startTimer();
  render();
}

// ==================== INIT ====================
newGame();
