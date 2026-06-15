// ==================== GAME CONFIG ====================
const GRID_SIZE = 10;

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

// ==================== DATA POOLS ====================
const ENEMY_POOL = [
  // Level 1 — weak, low everything
  { name: 'Glitch Drone',     emoji: '🤖', hp: 18, atk: 2, def: 1, evd: 1, dice: 4, xp: 2, creds: 10 },
  { name: 'Rogue Drone Swarm',emoji: '🐝', hp: 20, atk: 2, def: 1, evd: 2, dice: 6, xp: 4, creds: 15 },
  // Level 2 — tanky, weak hits
  { name: 'Chrome Ganger',    emoji: '🧟', hp: 30, atk: 2, def: 3, evd: 1, dice: 4, xp: 5, creds: 20 },
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
  // Pure DEF — gives reliable damage reduction, but no evasion
  { name: 'Exo Frame',     def: 5, evd: 0 },
  { name: 'Plated Jacket', def: 4, evd: 0 },
  { name: 'Flak Vest',     def: 3, evd: 0 },
  { name: 'Crash Padding', def: 2, evd: 0 },
  { name: 'Kevlar Vest',   def: 1, evd: 0 },
  { name: 'Grav Harness',  def: 0, evd: 0 },

  // Pure EVD — all-or-nothing, when it hits it hurts
  { name: 'Ghost Mantle',  def: 0, evd: 10 },
  { name: 'Phase Cloak',   def: 0, evd: 7 },
  { name: 'Reflex Mesh',   def: 0, evd: 3 },
  { name: 'Thermal Cloak', def: 0, evd: 2 },

  // Balanced — moderate of both, leans toward EVD
  { name: 'Hardlight Field', def: 3, evd: 5 },
  { name: 'Scav Plating',    def: 2, evd: 4 },
  { name: 'Magnet Shield',   def: 1, evd: 2 },
  { name: 'Nano-Weave Suit', def: 1, evd: 1 },

  // Trade-offs — big upside with a downside
  { name: 'Riot Shield',      def:  6, evd: -2 },
  { name: 'Chainmail Tarp',   def:  5, evd: -1 },
  { name: 'Glass Cannon Rig', def: -2, evd: 12 },
  { name: 'Servo Harness',    def: -1, evd: 10 },
];

// ==================== VAULT GEAR ====================
const VAULT_WEAPON = { name: 'Eclipse Fang', type: 'weapon', dice: 8, bonus: 10 };
const VAULT_ARMOR = { name: 'Phantom Shell', type: 'armor', def: 12, evd: 12 };

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
  vault:  { item: { ...VAULT_WEAPON }, msg: '🏦 Armory vault breached! Found Eclipse Fang (d8+10).' },
  vault2: { item: { ...VAULT_ARMOR },  msg: '🏦 DEF vault breached! Found Phantom Shell (+12 DEF / +12 EVD).' },
  vault3: { item: { name: 'Room Scanner', type: 'scanner' },      msg: '🏦 Scanner vault breached! Found a Room Scanner — reveals adjacent rooms on the grid.' },
  vault4: { item: { name: 'Backup Module', type: 'revive' },      msg: '🏦 Med vault breached! Found a Backup Module — prevents death once.' },
  vault5: { item: { name: 'Chem Analyzer', type: 'analyzer' },    msg: '🏦 Chem vault breached! Found a Chem Analyzer — reveals injector effects.' },
  vault6: { item: { name: 'Threat Array', type: 'trap-vision' },  msg: '🏦 Security vault breached! Found a Threat Array — reveals traps on the map.' },
  vault7: { item: { name: 'Med Scanner', type: 'heal-vision' },   msg: '🏦 Med-tech vault breached! Found a Med Scanner — reveals healing rooms on the map.' },
};

const PASSIVE_ITEM_ICONS = { scanner: '📡', analyzer: '🔬', 'trap-vision': '⚡', 'heal-vision': '💊' };

// ==================== ROOM VARIANTS ====================
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
