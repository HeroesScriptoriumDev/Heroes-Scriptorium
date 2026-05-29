/************************************************************
                    CONST SECTION
************************************************************/
let currentAbility = null;
let storeData = [];
let inventoryData = [];
let filteredViewData = [];
let activeView = "inventory";
let currentDetailItemId = null;


// Const Section

const heightOptions = {
  Small: [
    "2ft  8in",
    "2ft  9in",
    "2ft 10in",
    "2ft 11in",
    "3ft  0in",
    "3ft  1in",
    "3ft  2in",
    "3ft  3in",
    "3ft  4in",
    "3ft  5in",
    "3ft  6in",
    "3ft  7in",
    "3ft  8in",
    "3ft  9in",
    "3ft 10in"
  ],
  Medium: [
    "4ft  8in",
    "4ft  9in",
    "4ft 10in",
    "4ft 11in",
    "5ft  0in",
    "5ft  1in",
    "5ft  2in",
    "5ft  3in",
    "5ft  4in",
    "5ft  5in",
    "5ft  6in",
    "5ft  7in",
    "5ft  8in",
    "5ft  9in",
    "5ft 10in",
    "5ft 11in",
    "6ft  0in",
    "6ft  1in",
    "6ft  2in"
  ]
};
const weightOptions = {
  Small: [
    "28 lbs",
    "30 lbs",
    "32 lbs",
    "34 lbs",
    "36 lbs",
    "38 lbs",
    "40 lbs",
    "42 lbs",
    "44 lbs",
    "46 lbs",
    "48 lbs",
    "50 lbs",
    "52 lbs",
    "54 lbs",
    "56 lbs"
  ],
  Medium: [
    " 95 lbs",
    " 97 lbs",
    " 99 lbs",
    "102 lbs",
    "105 lbs",
    "108 lbs",
    "111 lbs",
    "114 lbs",
    "117 lbs",
    "120 lbs",
    "123 lbs",
    "126 lbs",
    "129 lbs",
    "132 lbs",
    "135 lbs",
    "138 lbs",
    "142 lbs",
    "145 lbs",
    "148 lbs"
  ]
};
const racialSize = {
  dwarf: "Medium",
  elf: "Medium",
  gnome: "Small",
  halfelf: "Medium",
  halfling: "Small",
  halforc: "Medium",
  human: "Medium"
};
const sizeModifiers = {
  fine: 8,
  diminutive: 4,
  tiny: 2,
  small: 1,
  medium: 0,
  large: -1,
  huge: -2,
  gargantuan: -4,
  colossal: -8
};
const alignmentTable = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"];
const racialSpeed = {
  dwarf: 20,
  elf: 30,
  gnome: 20,
  halfelf: 30,
  halfling: 20,
  halforc: 30,
  human: 30
};
const classHitDie = {
  barbarian: 12,
  bard: 6,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 8,
  rogue: 6,
  sorcerer: 4,
  wizard: 4
};
const racialNaturalArmor = {
  dwarf: 0,
  elf: 0,
  gnome: 0,
  halfelf: 0,
  halfling: 0,
  halforc: 0,
  human: 0
};
const classBABProgression = {
  barbarian: "full",
  bard: "medium",
  cleric: "medium",
  druid: "medium",
  fighter: "full",
  monk: "medium",
  paladin: "full",
  ranger: "full",
  rogue: "medium",
  sorcerer: "poor",
  wizard: "poor"
};
const classSaveProgression = {
  barbarian: {
    fortitude: "good",
    reflex: "poor",
    will: "poor"
  },
  bard: {
    fortitude: "poor",
    reflex: "good",
    will: "good"
  },
  cleric: {
    fortitude: "good",
    reflex: "poor",
    will: "good"
  },
  druid: {
    fortitude: "good",
    reflex: "poor",
    will: "good"
  },
  fighter: {
    fortitude: "good",
    reflex: "poor",
    will: "poor"
  },
  monk: {
    fortitude: "good",
    reflex: "good",
    will: "good"
  },
  paladin: {
    fortitude: "good",
    reflex: "poor",
    will: "poor"
  },
  ranger: {
    fortitude: "good",
    reflex: "good",
    will: "poor"
  },
  rogue: {
    fortitude: "poor",
    reflex: "good",
    will: "poor"
  },
  sorcerer: {
    fortitude: "poor",
    reflex: "poor",
    will: "good"
  },
  wizard: {
    fortitude: "poor",
    reflex: "poor",
    will: "good"
  }
};
const classAlignmentRestrictions = {
  barbarian: ["CG", "CN", "CE", "NG", "N", "NE"],
  bard: ["LG", "NG", "CG", "LN", "N", "CN"],
  cleric: ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"],
  druid: ["NG", "N", "NE"],
  monk: ["LG", "LN", "LE"],
  paladin: ["LG"],
  ranger: ["LG", "NG", "CG", "LN", "N", "CN"],
  rogue: ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"],
  fighter: ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"],
  sorcerer: ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"],
  wizard: ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"]
};
const Deities = {
  boccob: {
    name: "Boccob",
    alignments: ["N", "NG", "LN", "CN", "NE"],
    races: [],
    classes: [],
    domains: ["Knowledge", "Magic", "Trickery"],
    favoredWeapon: "Quarterstaff",
    source: "PHB p.90"
  },
  corellon: {
    name: "Corellon Larethian",
    alignments: ["CG", "NG", "CN"],
    races: [],
    classes: [],
    domains: ["Chaos", "Good", "Protection", "War"],
    favoredWeapon: "Longsword",
    source: "PHB p.91"
  },
  ehlonna: {
    name: "Ehlonna",
    alignments: ["NG", "CG", "LG", "N"],
    races: [],
    classes: [],
    domains: ["Animal", "Good", "Plant", "Sun"],
    favoredWeapon: "Longbow",
    source: "PHB p.92"
  },
  erythnul: {
    name: "Erythnul",
    alignments: ["CE", "CN", "NE"],
    races: [],
    classes: [],
    domains: ["Chaos", "Evil", "Trickery", "War"],
    favoredWeapon: "Morningstar",
    source: "PHB p.92"
  },
  fharlanghn: {
    name: "Fharlanghn",
    alignments: ["N", "NG", "LN", "CN", "NE"],
    races: [],
    classes: [],
    domains: ["Luck", "Protection", "Travel"],
    favoredWeapon: "Quarterstaff",
    source: "PHB p.92"
  },
  garl: {
    name: "Garl Glittergold",
    alignments: ["NG", "LG", "CG", "N"],
    races: ["gnome"],
    classes: [],
    domains: ["Good", "Luck", "Protection"],
    favoredWeapon: "Battleaxe",
    source: "PHB p.94"
  },
  gruumsh: {
    name: "Gruumsh",
    alignments: ["CE", "CN", "NE"],
    races: ["orc", "halforc"],
    classes: [],
    domains: ["Chaos", "Evil", "Strength", "War"],
    favoredWeapon: "Spear",
    source: "PHB p.93"
  },
  heironeous: {
    name: "Heironeous",
    alignments: ["LG", "NG", "LN"],
    races: [],
    classes: [],
    domains: ["Good", "Law", "War"],
    favoredWeapon: "Longsword",
    source: "PHB p.94"
  },
  hextor: {
    name: "Hextor",
    alignments: ["LE", "LN", "NE"],
    races: [],
    classes: [],
    domains: ["Destruction", "Evil", "Law", "War"],
    favoredWeapon: "Flail",
    source: "PHB p.94"
  },
  kord: {
    name: "Kord",
    alignments: ["CG", "CN", "NG"],
    races: [],
    classes: [],
    domains: ["Chaos", "Good", "Strength", "Luck"],
    favoredWeapon: "Greatsword",
    source: "PHB p.95"
  },
  moradin: {
    name: "Moradin",
    alignments: ["LG", "LN", "NG"],
    races: ["dwarf"],
    classes: [],
    domains: ["Earth", "Good", "Law", "Protection"],
    favoredWeapon: "Warhammer",
    source: "PHB p.95"
  },
  nerull: {
    name: "Nerull",
    alignments: ["NE", "LE", "CE"],
    races: [],
    classes: [],
    domains: ["Death", "Evil", "Trickery"],
    favoredWeapon: "Scythe",
    source: "PHB p.95"
  },
  obadhai: {
    name: "Obad-Hai",
    alignments: ["N", "NG", "LN", "CN", "NE"],
    races: [],
    classes: [],
    domains: ["Air", "Animal", "Earth", "Fire", "Plant", "Water"],
    favoredWeapon: "Quarterstaff",
    source: "PHB p.95"
  },
  olidammara: {
    name: "Olidammara",
    alignments: ["CN", "CG", "CE", "N"],
    races: [],
    classes: [],
    domains: ["Chaos", "Luck", "Trickery"],
    favoredWeapon: "Rapier",
    source: "PHB p.96"
  },
  pelor: {
    name: "Pelor",
    alignments: ["NG", "LG", "CG", "N"],
    races: [],
    classes: [],
    domains: ["Good", "Healing", "Strength", "Sun"],
    favoredWeapon: "Mace",
    source: "PHB p.96"
  },
  stcuthbert: {
    name: "St. Cuthbert",
    alignments: ["LN", "LG", "LE", "N"],
    races: [],
    classes: [],
    domains: ["Destruction", "Law", "Protection", "Strength"],
    favoredWeapon: "Mace",
    source: "PHB p.96"
  },
  vecna: {
    name: "Vecna",
    alignments: ["NE", "LE", "CE"],
    races: [],
    classes: [],
    domains: ["Evil", "Knowledge", "Magic"],
    favoredWeapon: "Dagger",
    source: "PHB p.96"
  },
  weejas: {
    name: "Wee Jas",
    alignments: ["LN", "LG", "LE", "N"],
    races: [],
    classes: [],
    domains: ["Death", "Law", "Magic"],
    favoredWeapon: "Dagger",
    source: "PHB p.97"
  },
  yondalla: {
    name: "Yondalla",
    alignments: ["LG", "NG", "LN"],
    races: ["halfling"],
    classes: [],
    domains: ["Good", "Law", "Protection"],
    favoredWeapon: "Shortsword",
    source: "PHB p.97"
  }
};
const racialStrengthModifiers = {
  dwarf: 0,
  elf: -2,
  gnome: -2,
  halfelf: 0,
  halfling: -2,
  halforc: 2,
  human: 0
};
const racialDexterityModifiers = {
  dwarf: 0,
  elf: 2,
  gnome: 0,
  halfelf: 0,
  halfling: 2,
  halforc: 0,
  human: 0
};
const racialConstitutionModifiers = {
  dwarf: 2,
  elf: -2,
  gnome: 2,
  halfelf: 0,
  halfling: 0,
  halforc: 0,
  human: 0
};
const racialIntelligenceModifiers = {
  dwarf: 0,
  elf: 0,
  gnome: 0,
  halfelf: 0,
  halfling: 0,
  halforc: -2,
  human: 0
};
const racialWisdomModifiers = {
  dwarf: 0,
  elf: 0,
  gnome: 0,
  halfelf: 0,
  halfling: 0,
  halforc: 0,
  human: 0
};
const racialCharismaModifiers = {
  dwarf: -2,
  elf: 0,
  gnome: 0,
  halfelf: 0,
  halfling: 0,
  halforc: -2,
  human: 0
};
const racialModifierTables = {
  strength: racialStrengthModifiers,
  dexterity: racialDexterityModifiers,
  constitution: racialConstitutionModifiers,
  intelligence: racialIntelligenceModifiers,
  wisdom: racialWisdomModifiers,
  charisma: racialCharismaModifiers
};
const ageStrengthModifiers = {
  childhood: -6,
  adulthood: 0,
  middleage: -1,
  old: -2,
  venerable: -3
};
const ageDexterityModifiers = {
  childhood: -6,
  adulthood: 0,
  middleage: -1,
  old: -2,
  venerable: -3
};
const ageConstitutionModifiers = {
  childhood: -6,
  adulthood: 0,
  middleage: -1,
  old: -2,
  venerable: -3
};
const ageIntelligenceModifiers = {
  childhood: 0,
  adulthood: 0,
  middleage: 1,
  old: 1,
  venerable: 1
};
const ageWisdomModifiers = {
  childhood: 0,
  adulthood: 0,
  middleage: 1,
  old: 1,
  venerable: 1
};
const ageCharismaModifiers = {
  childhood: 0,
  adulthood: 0,
  middleage: 1,
  old: 1,
  venerable: 1
};
const ageModifierTables = {
  strength: ageStrengthModifiers,
  dexterity: ageDexterityModifiers,
  constitution: ageConstitutionModifiers,
  intelligence: ageIntelligenceModifiers,
  wisdom: ageWisdomModifiers,
  charisma: ageCharismaModifiers
};
const skillAbilityMap = {
  appraise: "INT",
  balance: "DEX",
  bluff: "CHA",
  climb: "STR",
  concentration: "CON",
  craft: "INT",
  decipherScript: "INT",
  diplomacy: "CHA",
  disableDevice: "INT",
  disguise: "CHA",
  escapeArtist: "DEX",
  forgery: "INT",
  gatherInformation: "CHA",
  handleAnimal: "CHA",
  heal: "WIS",
  hide: "DEX",
  intimidate: "CHA",
  jump: "STR",
  knowledge: "INT",
  listen: "WIS",
  moveSilently: "DEX",
  openLock: "DEX",
  perform: "CHA",
  profession: "WIS",
  ride: "DEX",
  search: "INT",
  senseMotive: "WIS",
  sleightOfHand: "DEX",
  spellcraft: "INT",
  spot: "WIS",
  survival: "WIS",
  swim: "STR",
  tumble: "DEX",
  useMagicDevice: "CHA",
  useRope: "DEX"
};
const classSkillPointsPerLevel = {
  barbarian: 4,
  bard: 6,
  cleric: 2,
  druid: 4,
  fighter: 2,
  monk: 4,
  paladin: 2,
  ranger: 6,
  rogue: 8,
  sorcerer: 2,
  wizard: 2
};
const skillRules = {
  appraise: {
    trainedOnly: false
  },
  balance: {
    trainedOnly: false
  },
  bluff: {
    trainedOnly: false
  },
  climb: {
    trainedOnly: false
  },
  concentration: {
    trainedOnly: false
  },
  craft: {
    trainedOnly: false
  },
  decipherScript: {
    trainedOnly: true
  },
  diplomacy: {
    trainedOnly: false
  },
  disableDevice: {
    trainedOnly: true
  },
  disguise: {
    trainedOnly: false
  },
  escapeArtist: {
    trainedOnly: false
  },
  forgery: {
    trainedOnly: false
  },
  gatherInformation: {
    trainedOnly: false
  },
  handleAnimal: {
    trainedOnly: false
  },
  heal: {
    trainedOnly: false
  },
  hide: {
    trainedOnly: false
  },
  intimidate: {
    trainedOnly: false
  },
  jump: {
    trainedOnly: false
  },
  knowledge: {
    trainedOnly: true
  },
  listen: {
    trainedOnly: false
  },
  moveSilently: {
    trainedOnly: false
  },
  openLock: {
    trainedOnly: true
  },
  perform: {
    trainedOnly: false
  },
  profession: {
    trainedOnly: true
  },
  ride: {
    trainedOnly: false
  },
  search: {
    trainedOnly: false
  },
  senseMotive: {
    trainedOnly: false
  },
  sleightOfHand: {
    trainedOnly: true
  },
  spellcraft: {
    trainedOnly: true
  },
  spot: {
    trainedOnly: false
  },
  survival: {
    trainedOnly: false
  },
  swim: {
    trainedOnly: false
  },
  tumble: {
    trainedOnly: true
  },
  useMagicDevice: {
    trainedOnly: true
  },
  useRope: {
    trainedOnly: false
  }
};
const classSkillsByClass = {
  barbarian: [
    "climb",
    "craft",
    "handleAnimal",
    "intimidate",
    "jump",
    "listen",
    "ride",
    "survival",
    "swim"
  ],
  bard: [
    "appraise",
    "balance",
    "bluff",
    "climb",
    "concentration",
    "craft",
    "decipherScript",
    "diplomacy",
    "disguise",
    "escapeArtist",
    "gatherInformation",
    "hide",
    "jump",
    "knowledge",
    "listen",
    "moveSilently",
    "perform",
    "profession",
    "senseMotive",
    "sleightOfHand",
    "spellcraft",
    "swim",
    "tumble",
    "useMagicDevice"
  ],
  cleric: [
    "concentration",
    "craft",
    "diplomacy",
    "heal",
    "knowledge",
    "profession",
    "spellcraft"
  ],
  druid: [
    "concentration",
    "craft",
    "diplomacy",
    "handleAnimal",
    "heal",
    "knowledge",
    "listen",
    "profession",
    "ride",
    "spellcraft",
    "spot",
    "survival",
    "swim"
  ],
  fighter: [
    "climb",
    "craft",
    "handleAnimal",
    "intimidate",
    "jump",
    "ride",
    "swim"
  ],
  monk: [
    "balance",
    "climb",
    "concentration",
    "craft",
    "diplomacy",
    "escapeArtist",
    "hide",
    "jump",
    "knowledge",
    "listen",
    "moveSilently",
    "perform",
    "profession",
    "senseMotive",
    "spot",
    "swim",
    "tumble"
  ],
  paladin: [
    "concentration",
    "craft",
    "diplomacy",
    "handleAnimal",
    "heal",
    "knowledge",
    "profession",
    "ride",
    "senseMotive"
  ],
  ranger: [
    "climb",
    "concentration",
    "craft",
    "handleAnimal",
    "heal",
    "hide",
    "jump",
    "knowledge",
    "listen",
    "moveSilently",
    "profession",
    "ride",
    "search",
    "spot",
    "survival",
    "swim",
    "useRope"
  ],
  rogue: [
    "appraise",
    "balance",
    "bluff",
    "climb",
    "craft",
    "decipherScript",
    "diplomacy",
    "disableDevice",
    "disguise",
    "escapeArtist",
    "forgery",
    "gatherInformation",
    "hide",
    "intimidate",
    "jump",
    "knowledge",
    "listen",
    "moveSilently",
    "openLock",
    "perform",
    "profession",
    "search",
    "senseMotive",
    "sleightOfHand",
    "spot",
    "swim",
    "tumble",
    "useMagicDevice",
    "useRope"
  ],
  sorcerer: [
    "bluff",
    "concentration",
    "craft",
    "knowledge",
    "profession",
    "spellcraft"
  ],
  wizard: [
    "concentration",
    "craft",
    "decipherScript",
    "knowledge",
    "profession",
    "spellcraft"
  ]
};
const RAW_STORE_DATA = {
  simple_weapons: [
    {
      id: "weapon_gauntlet",
      name: "Gauntlet",
      category: null,
      subcategory: "unarmed_attacks",
      combat_type: "melee",
      handedness: "light",
      cost: "2 gp",
      damage: { small: "1d2", medium: "1d3" },
      critical: "x2",
      range_increment: null,
      weight: "1 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_unarmed_strike",
      name: "Unarmed Strike",
      category: null,
      subcategory: "unarmed_attacks",
      combat_type: "melee",
      handedness: "light",
      cost: null,
      damage: { small: "1d2", medium: "1d3" },
      critical: "x2",
      range_increment: null,
      weight: null,
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_dagger",
      name: "Dagger",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "2 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "19-20/x2",
      range_increment: "10ft",
      weight: "1 lb.",
      damage_type: ["piercing", "slashing"]
    },
    {
      id: "weapon_dagger_punching",
      name: "Dagger, Punching",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "2 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x3",
      range_increment: null,
      weight: "1 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_gauntlet_spiked",
      name: "Gauntlet, spiked",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "5 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: null,
      weight: "1 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_mace_light",
      name: "Mace, Light",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "5 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "4 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_sickle",
      name: "Sickle",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "6 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "2 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_club",
      name: "Club",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: null,
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: "10ft",
      weight: "3 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_mace_heavy",
      name: "Mace, Heavy",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "12 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x2",
      range_increment: null,
      weight: "8 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_morningstar",
      name: "Morningstar",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "8 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x2",
      range_increment: null,
      weight: "6 lb.",
      damage_type: ["bludgeoning", "piercing"]
    },
    {
      id: "weapon_shortspear",
      name: "Shortspear",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "1 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: "20ft",
      weight: "3 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_longspear",
      name: "Longspear",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "5 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: null,
      weight: "9 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_quarterstaff",
      name: "Quarterstaff",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: null,
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "4 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_spear",
      name: "Spear",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "2 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: "20ft",
      weight: "6 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_crossbow_heavy",
      name: "Crossbow, Heavy",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "50 gp",
      damage: { small: "1d8", medium: "1d10" },
      critical: "19-20/x2",
      range_increment: "120ft",
      weight: "8 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_bolts_crossbow_(x10)",
      name: "Bolts, Crossbow (x10)",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "1 gp",
      damage: { small: null, medium: null },
      critical: null,
      range_increment: null,
      weight: "1 lb.",
      damage_type: []
    },
    {
      id: "weapon_crossbow_light",
      name: "Crossbow, Light",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "35 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "19-20/x2",
      range_increment: "80ft",
      weight: "4 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_dart",
      name: "Dart",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "5 sp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: "20ft",
      weight: "1/2 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_javelin",
      name: "Javelin",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "1 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: "30ft",
      weight: 2,
      damage_type: ["piercing"]
    },
    {
      id: "weapon_sling",
      name: "Sling",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: null,
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: "50ft",
      weight: "0 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_bullets_sling_(x10)",
      name: "Bullets, Sling (x10)",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "1 sp",
      damage: { small: null, medium: null },
      critical: null,
      range_increment: null,
      weight: "5 lb.",
      damage_type: []
    }
  ],

  martial_weapons: [
    {
      id: "weapon_axe_throwing",
      name: "Axe, Throwing",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "8 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: "10ft",
      weight: "2 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_hammer_light",
      name: "Hammer, Light",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "1 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: "20ft",
      weight: "2 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_handaxe",
      name: "Handaxe",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "6 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x3",
      range_increment: null,
      weight: "3 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_kukri",
      name: "Kukri",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "8 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "18-20/x2",
      range_increment: null,
      weight: "2 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_pick_light",
      name: "Pick, Light",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "4 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x4",
      range_increment: null,
      weight: "3 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_sap",
      name: "Sap",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "1 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "2 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_shield_light",
      name: "Shield, Light",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "special",
      damage: { small: "1d2", medium: "1d3" },
      critical: "x2",
      range_increment: null,
      weight: "special",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_spiked_armor",
      name: "Spiked Armor",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "special",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "special",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_spiked_shield_light",
      name: "Spiked Shield, Light",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "special",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: null,
      weight: "special",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_short_sword",
      name: "Short Sword",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "10 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "19-20/x2",
      range_increment: null,
      weight: "2 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_battleaxe",
      name: "Battleaxe",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "10 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: null,
      weight: "6 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_flail",
      name: "Flail",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "8 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x2",
      range_increment: null,
      weight: "5 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_longsword",
      name: "Longsword",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "15 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "19-20/x2",
      range_increment: null,
      weight: "4 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_pick_heavy",
      name: "Pick, Heavy",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "8 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x4",
      range_increment: null,
      weight: "6 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_rapier",
      name: "Rapier",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "20 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "18-20/x2",
      range_increment: null,
      weight: "2 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_scimitar",
      name: "Scimitar",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "15 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "18-20/x2",
      range_increment: null,
      weight: "4 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_shield_heavy",
      name: "Shield, Heavy",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "special",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: null,
      weight: "special",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_spiked_shield_heavy",
      name: "Spiked Shield, Heavy",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "special",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "special",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_trident",
      name: "Trident",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "15 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x2",
      range_increment: "10ft",
      weight: "4 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_warhammer",
      name: "Warhammer",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "12 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: null,
      weight: "5 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_falchion",
      name: "Falchion",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "75 gp",
      damage: { small: "1d6", medium: "2d4" },
      critical: "18-20/x2",
      range_increment: null,
      weight: "8 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_glaive",
      name: "Glaive",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "8 gp",
      damage: { small: "1d8", medium: "1d10" },
      critical: "x3",
      range_increment: null,
      weight: "10 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_greataxe",
      name: "Greataxe",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "20 gp",
      damage: { small: "1d10", medium: "1d12" },
      critical: "x3",
      range_increment: null,
      weight: "12 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_greatclub",
      name: "Greatclub",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "5 gp",
      damage: { small: "1d8", medium: "1d10" },
      critical: "x2",
      range_increment: null,
      weight: "8 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_flail_heavy",
      name: "Flail, Heavy",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "15 gp",
      damage: { small: "1d8", medium: "1d10" },
      critical: "19-20/x2",
      range_increment: null,
      weight: "10 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_greatsword",
      name: "Greatsword",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "50 gp",
      damage: { small: "1d10", medium: "2d6" },
      critical: "19-20/x2",
      range_increment: null,
      weight: "8 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_guisarme",
      name: "Guisarme",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "9 gp",
      damage: { small: "1d6", medium: "2d4" },
      critical: "x3",
      range_increment: null,
      weight: "12 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_halberd",
      name: "Halberd",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "10 gp",
      damage: { small: "1d8", medium: "1d10" },
      critical: "x3",
      range_increment: null,
      weight: "12 lb.",
      damage_type: ["piercing", "slashing"]
    },
    {
      id: "weapon_lance",
      name: "Lance",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "10 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: null,
      weight: "10 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_ranseur",
      name: "Ranseur",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "10 gp",
      damage: { small: "1d6", medium: "2d4" },
      critical: "x3",
      range_increment: null,
      weight: "12 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_scythe",
      name: "Scythe",
      category: null,
      subcategory: "two_handed_melee",
      combat_type: "melee",
      handedness: "two_handed",
      cost: "18 gp",
      damage: { small: "1d6", medium: "2d4" },
      critical: "x4",
      range_increment: null,
      weight: "10 lb.",
      damage_type: ["piercing", "slashing"]
    },
    {
      id: "weapon_longbow",
      name: "Longbow",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "75 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: "100ft",
      weight: "3 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_arrows_(x20)",
      name: "Arrows (x20)",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "1 gp",
      damage: { small: null, medium: null },
      critical: null,
      range_increment: null,
      weight: "3 lb.",
      damage_type: []
    },
    {
      id: "weapon_longbow_composite",
      name: "Longbow, Composite",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "100 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: "110ft",
      weight: "3 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_shortbow",
      name: "Shortbow",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "30 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x3",
      range_increment: "60ft",
      weight: "2 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_shortbow_composite",
      name: "Shortbow, Composite",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "75 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x3",
      range_increment: "70ft",
      weight: "2 lb.",
      damage_type: ["piercing"]
    }
  ],

  exotic_weapons: [
    {
      id: "weapon_kama",
      name: "Kama",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "2 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "2 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_nunchaku",
      name: "Nunchaku",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "2 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "2 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_sai",
      name: "Sai",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "1 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: "10ft",
      weight: "1 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_siangham",
      name: "Siangham",
      category: null,
      subcategory: "light_melee",
      combat_type: "melee",
      handedness: "light",
      cost: "3 gp",
      damage: { small: "1d4", medium: "1d6" },
      critical: "x2",
      range_increment: null,
      weight: "1 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_axe_orc_double",
      name: "Axe, Orc Double",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "60 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: null,
      weight: "15 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_chain_spiked",
      name: "Chain, Spiked",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "25 gp",
      damage: { small: "1d6", medium: "2d4" },
      critical: "x2",
      range_increment: null,
      weight: "10 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_flail_dire",
      name: "Flail, Dire",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "90 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x2",
      range_increment: null,
      weight: "10 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_hammer_gnome_hooked",
      name: "Hammer, Gnome Hooked",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "20 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: null,
      weight: "6 lb.",
      damage_type: ["bludgeoning", "piercing"]
    },
    {
      id: "weapon_sword_two-bladed",
      name: "Sword, Two-Bladed",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "100 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "19-20/x2",
      range_increment: null,
      weight: "10 lb.",
      damage_type: ["slashing"]
    },
    {
      id: "weapon_urgrosh_dwarven",
      name: "Urgrosh, Dwarven",
      category: null,
      subcategory: "one_handed_melee",
      combat_type: "melee",
      handedness: "one_handed",
      cost: "50 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "x3",
      range_increment: null,
      weight: "12 lb.",
      damage_type: ["slashing", "piercing"]
    },
    {
      id: "weapon_bolas",
      name: "Bolas",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "5 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "x2",
      range_increment: "10ft",
      weight: "2 lb.",
      damage_type: ["bludgeoning"]
    },
    {
      id: "weapon_crossbow_hand",
      name: "Crossbow, Hand",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "100 gp",
      damage: { small: "1d3", medium: "1d4" },
      critical: "19-20/x2",
      range_increment: "30ft",
      weight: "2 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_crossbow_repeating_heavy",
      name: "Crossbow, Repeating Heavy",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "400 gp",
      damage: { small: "1d8", medium: "1d10" },
      critical: "19-20/x2",
      range_increment: "120ft",
      weight: "12 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_crossbow_repeating_light",
      name: "Crossbow, Repeating Light",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "250 gp",
      damage: { small: "1d6", medium: "1d8" },
      critical: "19-20/x2",
      range_increment: "80ft",
      weight: "6 lb.",
      damage_type: ["piercing"]
    },
    {
      id: "weapon_net",
      name: "Net",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "20 gp",
      damage: { small: null, medium: null },
      critical: null,
      range_increment: "10ft",
      weight: "6 lb.",
      damage_type: []
    },
    {
      id: "weapon_shuriken_(x5)",
      name: "Shuriken (x5)",
      category: null,
      subcategory: "ranged",
      combat_type: "ranged",
      handedness: "varies",
      cost: "1 gp",
      damage: { small: 1, medium: "1d2" },
      critical: "x2",
      range_increment: "10ft",
      weight: "1/2 lb",
      damage_type: ["piercing"]
    }
  ],

  armor: [
    {
      id: "armor_padded",
      name: "Padded",
      category: "light_armor",
      cost: "5 gp",
      armor_bonus: "+1",
      max_dex_bonus: "+8",
      armor_check_penalty: 0,
      arcane_spell_failure: 0.05,
      speed: { speed_30ft: "30ft", speed_20ft: "20ft" },
      weight: "10 lb."
    },
    {
      id: "armor_leather",
      name: "Leather",
      category: "light_armor",
      cost: "10 gp",
      armor_bonus: "+2",
      max_dex_bonus: "+6",
      armor_check_penalty: 0,
      arcane_spell_failure: 0.1,
      speed: { speed_30ft: "30ft", speed_20ft: "20ft" },
      weight: "15 lb."
    },
    {
      id: "armor_studded_leather",
      name: "Studded Leather",
      category: "light_armor",
      cost: "25 gp",
      armor_bonus: "+3",
      max_dex_bonus: "+5",
      armor_check_penalty: -1,
      arcane_spell_failure: 0.15,
      speed: { speed_30ft: "30ft", speed_20ft: "20ft" },
      weight: "20 lb."
    },
    {
      id: "armor_chain_shirt",
      name: "Chain Shirt",
      category: "light_armor",
      cost: "100 gp",
      armor_bonus: "+4",
      max_dex_bonus: "+4",
      armor_check_penalty: -2,
      arcane_spell_failure: 0.2,
      speed: { speed_30ft: "30ft", speed_20ft: "20ft" },
      weight: "25 lb."
    },
    {
      id: "armor_hide",
      name: "Hide",
      category: "medium_armor",
      cost: "15 gp",
      armor_bonus: "+3",
      max_dex_bonus: "+4",
      armor_check_penalty: -3,
      arcane_spell_failure: 0.2,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "25 lb."
    },
    {
      id: "armor_scale_mail",
      name: "Scale Mail",
      category: "medium_armor",
      cost: "50 gp",
      armor_bonus: "+4",
      max_dex_bonus: "+3",
      armor_check_penalty: -4,
      arcane_spell_failure: 0.25,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "30 lb."
    },
    {
      id: "armor_chainmail",
      name: "Chainmail",
      category: "medium_armor",
      cost: "150 gp",
      armor_bonus: "+5",
      max_dex_bonus: "+2",
      armor_check_penalty: -5,
      arcane_spell_failure: 0.3,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "40 lb."
    },
    {
      id: "armor_breastplate",
      name: "Breastplate",
      category: "medium_armor",
      cost: "200 gp",
      armor_bonus: "+5",
      max_dex_bonus: "+3",
      armor_check_penalty: -4,
      arcane_spell_failure: 0.25,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "30 lb."
    },
    {
      id: "armor_splint_mail",
      name: "Splint Mail",
      category: "heavy_armor",
      cost: "200 gp",
      armor_bonus: "+",
      max_dex_bonus: "+0",
      armor_check_penalty: -7,
      arcane_spell_failure: 0.4,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "45 lb."
    },
    {
      id: "armor_banded_mail",
      name: "Banded Mail",
      category: "heavy_armor",
      cost: "250 gp",
      armor_bonus: "+6",
      max_dex_bonus: "+1",
      armor_check_penalty: -6,
      arcane_spell_failure: 0.35,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "35 lb."
    },
    {
      id: "armor_half-plate",
      name: "Half-Plate",
      category: "heavy_armor",
      cost: "600 gp",
      armor_bonus: "+7",
      max_dex_bonus: "+0",
      armor_check_penalty: -7,
      arcane_spell_failure: 0.4,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "50 lb."
    },
    {
      id: "armor_full_plate",
      name: "Full Plate",
      category: "heavy_armor",
      cost: "1,500 gp",
      armor_bonus: "+8",
      max_dex_bonus: "+2",
      armor_check_penalty: -6,
      arcane_spell_failure: 0.35,
      speed: { speed_30ft: "20ft", speed_20ft: "15ft" },
      weight: "50 lb."
    },
    {
      id: "armor_buckler",
      name: "Buckler",
      category: "shields",
      cost: "15 gp",
      armor_bonus: "+1",
      max_dex_bonus: null,
      armor_check_penalty: -1,
      arcane_spell_failure: 0.05,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "5 lb."
    },
    {
      id: "armor_shield_light_wooden",
      name: "Shield, Light Wooden",
      category: "shields",
      cost: "3 gp",
      armor_bonus: "+1",
      max_dex_bonus: null,
      armor_check_penalty: -1,
      arcane_spell_failure: 0.05,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "5 lb."
    },
    {
      id: "armor_shield_light_steel",
      name: "Shield, Light Steel",
      category: "shields",
      cost: "9 gp",
      armor_bonus: "+1",
      max_dex_bonus: null,
      armor_check_penalty: -1,
      arcane_spell_failure: 0.05,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "6 lb."
    },
    {
      id: "armor_shield_heavy_wooden",
      name: "Shield, Heavy Wooden",
      category: "shields",
      cost: "7 gp",
      armor_bonus: "+2",
      max_dex_bonus: null,
      armor_check_penalty: -2,
      arcane_spell_failure: 0.15,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "10 lb."
    },
    {
      id: "armor_shield_heavy_steel",
      name: "Shield, Heavy Steel",
      category: "shields",
      cost: "20 gp",
      armor_bonus: "+2",
      max_dex_bonus: null,
      armor_check_penalty: -2,
      arcane_spell_failure: 0.15,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "15 lb."
    },
    {
      id: "armor_shield_tower",
      name: "Shield, Tower",
      category: "shields",
      cost: "30 gp",
      armor_bonus: "+4",
      max_dex_bonus: "+2",
      armor_check_penalty: -10,
      arcane_spell_failure: 0.5,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "45 lb."
    },
    {
      id: "armor_extra",
      name: "Extra",
      category: "shields",
      cost: null,
      armor_bonus: null,
      max_dex_bonus: null,
      armor_check_penalty: null,
      arcane_spell_failure: null,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: null
    },
    {
      id: "armor_armor_spikes",
      name: "Armor Spikes",
      category: "shields",
      cost: "50 gp",
      armor_bonus: null,
      max_dex_bonus: null,
      armor_check_penalty: null,
      arcane_spell_failure: null,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "10 lb."
    },
    {
      id: "armor_gauntlet_spiked",
      name: "Gauntlet, Spiked",
      category: "shields",
      cost: "8 gp",
      armor_bonus: null,
      max_dex_bonus: null,
      armor_check_penalty: "special",
      arcane_spell_failure: null,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "5 lb."
    },
    {
      id: "armor_shield_spikes",
      name: "Shield Spikes",
      category: "shields",
      cost: "10 gp",
      armor_bonus: null,
      max_dex_bonus: null,
      armor_check_penalty: null,
      arcane_spell_failure: null,
      speed: { speed_30ft: null, speed_20ft: null },
      weight: "5 lb."
    }
  ],

  adventuring_gear: [
    {
      id: "gear_backpack_(empty)",
      name: "Backpack (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 gp",
      weight: "2 lb.",
      description:
        "A leather pack carried on the back, typically with straps to secure it."
    },
    {
      id: "gear_barrel_(empty)",
      name: "Barrel (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 gp",
      weight: "30 lb.",
      description: null
    },
    {
      id: "gear_basket_(empty)",
      name: "Basket (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "4 sp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_bedroll",
      name: "Bedroll",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_blanket_winter",
      name: "Blanket, Winter",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 sp",
      weight: "3 lb.",
      description:
        "A thick, quilted, wool blanket made to keep you warm in cold weather."
    },
    {
      id: "gear_block_tackle",
      name: "Block & Tackle",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 gp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_bottle_wine_glass",
      name: "Bottle, Wine, Glass",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_bucket_(empty)",
      name: "Bucket (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 sp",
      weight: "2 lb.",
      description: null
    },
    {
      id: "gear_caltrops",
      name: "Caltrops",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "2 lb.",
      description:
        "A caltrops is a four-pronged iron spike crafted so that one prong faces up no matter how the caltrop comes to rest."
    },
    {
      id: "gear_candle",
      name: "Candle",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 cp",
      weight: null,
      description:
        "A candle dimly illuminates a 5-foot radius and burns for 1 hour."
    },
    {
      id: "gear_canvas_(sq_yd)",
      name: "Canvas (sq. yd.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_case_map_or_scroll",
      name: "Case, Map or Scroll",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "1/2 lb.",
      description:
        "This capped leather or tin rube holds rolled pieces of parchment or paper."
    },
    {
      id: "gear_chain_(10_ft)",
      name: "Chain (10 ft.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "30 gp",
      weight: "2 lb.",
      description: null
    },
    {
      id: "gear_chalk_(1_pc)",
      name: "Chalk (1 pc.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 cp",
      weight: null,
      description: null
    },
    {
      id: "gear_chest_(empty)",
      name: "Chest (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 gp",
      weight: "25 lb.",
      description: null
    },
    {
      id: "gear_crowbar",
      name: "Crowbar",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 gp",
      weight: "5 lb.",
      description: "This iron bar is made for levering closed items open."
    },
    {
      id: "gear_firewood_(per_day)",
      name: "Firewood (per day)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 cp",
      weight: "20 lb.",
      description: null
    },
    {
      id: "gear_fishhook",
      name: "Fishhook",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_fishing_net_(25_sq_ft)",
      name: "Fishing Net (25 sq ft.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "4 gp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_flask_(empty)",
      name: "Flask (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "3 cp",
      weight: "1 1/2 lb.",
      description:
        "This ceramic, glass, or metal container is fitted with a tight stopper and holds 1 pint of liquid."
    },
    {
      id: "gear_flint_steel",
      name: "Flint & Steel",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: null,
      description: "Striking steel and flint together creates sparks."
    },
    {
      id: "gear_grappling_hook",
      name: "Grappling Hook",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "4 lb.",
      description:
        "When tied to the end of a rope, a grappling hook can secure the rope to a battlement, window ledge, tree limb, or other protrusion."
    },
    {
      id: "gear_hammer",
      name: "Hammer",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 sp",
      weight: "2 lb.",
      description:
        "This one-handed hammer with an iron head is useful for pounding pitons into a wall."
    },
    {
      id: "gear_ink_vial_(1_oz)",
      name: "Ink Vial (1 oz.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "8 gp",
      weight: null,
      description:
        "Ink is generally black unless specified and colored ink costs twice as much."
    },
    {
      id: "gear_inkpen",
      name: "Inkpen",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: null,
      description:
        "An inkpen is a wooden stick with a special tip on the end that draws in ink when dipped into a vial."
    },
    {
      id: "gear_jug_clay",
      name: "Jug, Clay",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "3 cp",
      weight: "9 lb.",
      description:
        "This basic ceramic jug is fitted with a stopper and holds 1 gallon of liquid."
    },
    {
      id: "gear_ladder_(10_ft)",
      name: "Ladder (10 ft.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 cp",
      weight: "20 lb.",
      description: "This item is a straight, simple wooden ladder."
    },
    {
      id: "gear_lamp_common",
      name: "Lamp, Common",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: "1 lb.",
      description:
        "A lamp clearly immuminates a 15-foot radius, provides shadowy immumination for a 30-foot radius, and burns for 6 hours on a pint of oil."
    },
    {
      id: "gear_lantern_bullseye",
      name: "Lantern, Bullseye",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "12 gp",
      weight: "3 lb.",
      description:
        "A bullseye lantern has only a single shutter and its other sides are highly polished to provide illumination in a single direction."
    },
    {
      id: "gear_lantern_hooded",
      name: "Lantern, Hooded",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "7 gp",
      weight: "2 lb.",
      description: "A hooded lantern has shuttered or hinged sides."
    },
    {
      id: "gear_lock_very_simple",
      name: "Lock, Very Simple",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "20 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_lock_average",
      name: "Lock, Average",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "40 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_lock_good",
      name: "Lock, Good",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "80 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_lock_amazing",
      name: "Lock, Amazing",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "150 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_manacles",
      name: "Manacles",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "15 gp",
      weight: "2 lb.",
      description:
        "Manacles, unless otherwise noted, are able to bind up to a 'medium'-sized creature."
    },
    {
      id: "gear_manacles_masterwork",
      name: "Manacles, Masterwork",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "50 gp",
      weight: "2 lb.",
      description: null
    },
    {
      id: "gear_mirror_small_steel",
      name: "Mirror, Small Steel",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "10 gp",
      weight: "1/2 lb.",
      description: "A polished steel mirror."
    },
    {
      id: "gear_mugtankard_clay",
      name: "Mug/Tankard, Clay",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 cp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_oil_flask_(1_pt)",
      name: "Oil Flask (1 pt.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: "1 lb.",
      description:
        "A pint of oil burns for 6 hours in a lantern or be used as a splash weapon."
    },
    {
      id: "gear_paper_(1_sheet)",
      name: "Paper (1 sheet)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "4 sp",
      weight: null,
      description: "A sheet of standard paper made from cloth fibers."
    },
    {
      id: "gear_parchment_(1_sheet)",
      name: "Parchment (1 sheet)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 sp",
      weight: null,
      description:
        "A sheet of parchment is a piece of goat hide or sheepskin that has been prepared for writing on."
    },
    {
      id: "gear_pick_miners",
      name: "Pick, Miner's",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "3 gp",
      weight: "10 lb.",
      description: null
    },
    {
      id: "gear_pitcher_clay",
      name: "Pitcher, Clay",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 cp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_piton",
      name: "Piton",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: "1/2 lb.",
      description: null
    },
    {
      id: "gear_pole_(10_ft)",
      name: "Pole (10 ft.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 sp",
      weight: "8 lb.",
      description: null
    },
    {
      id: "gear_pot_iron",
      name: "Pot, Iron",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 sp",
      weight: "10 lb.",
      description: null
    },
    {
      id: "gear_pouch_belt_(empty)",
      name: "Pouch, Belt (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "1/2 lb.",
      description: "A leather pouch that straps to a belt."
    },
    {
      id: "gear_ram_portable",
      name: "Ram, Portable",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "10 gp",
      weight: "20 lb.",
      description: "An iron-shod wooden beam perfect for battering a door down."
    },
    {
      id: "gear_rations_trail_(per_day)",
      name: "Rations, Trail (per day)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 sp",
      weight: "1 lb.",
      description: "Compact, dry, high-energy foods suitable for travel."
    },
    {
      id: "gear_rope_hempen_(50_ft)",
      name: "Rope, Hempen (50 ft.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "10 lb.",
      description: null
    },
    {
      id: "gear_rope_silk_(50_ft)",
      name: "Rope, Silk (50 ft.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "10 gp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_sack_(empty)",
      name: "Sack (empty)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 sp",
      weight: "1/2 lb.",
      description:
        "Made of burlap or of similar materials that contains a drawstring as to be closed."
    },
    {
      id: "gear_sealing_wax",
      name: "Sealing Wax",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_sewing_needle",
      name: "Sewing Needle",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_signal_whistle",
      name: "Signal Whistle",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "8 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_signet_ring",
      name: "Signet Ring",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 gp",
      weight: null,
      description:
        "A ring with a distinctive design carved into it denoting status or rank."
    },
    {
      id: "gear_sledge",
      name: "Sledge",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "10 lb.",
      description: "A two-handed, iron-headed hammer."
    },
    {
      id: "gear_soap_(per_lb)",
      name: "Soap (per lb.)",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "5 sp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_spade",
      name: "Spade",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 gp",
      weight: "8 lb.",
      description: null
    },
    {
      id: "gear_shovel",
      name: "Shovel",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 gp",
      weight: "8 lb.",
      description: null
    },
    {
      id: "gear_spyglass",
      name: "Spyglass",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1,000 gp",
      weight: "1 lb.",
      description:
        "Objects viewed through a spyglass are magnified to twice their size."
    },
    {
      id: "gear_tent",
      name: "Tent",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "10 gp",
      weight: "20 lb.",
      description: "A simple tent that sleeps two."
    },
    {
      id: "gear_torch",
      name: "Torch",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 cp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_waterskin",
      name: "Waterskin",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "1 gp",
      weight: "4 lb.",
      description: "A leather pouch with a narrow neck used for holding water."
    },
    {
      id: "gear_whetstone",
      name: "Whetstone",
      category: "Goods & Services",
      subcategory: "Adventuring Gear",
      cost: "2 cp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_acid_(flask)",
      name: "Acid (flask)",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "10 gp",
      weight: "1 lb.",
      description: "Able to be thrown as a splash attack."
    },
    {
      id: "gear_alchemists_fire_(flask)",
      name: "Alchemist's Fire (flask)",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "20 gp",
      weight: "1 lb.",
      description:
        "A sticky, adhesive substance that ignites into flames when exposed to air."
    },
    {
      id: "gear_antitoxin_(vial)",
      name: "Antitoxin (vial)",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "50 gp",
      weight: null,
      description:
        "When drunk, antitoxin gives a +5 alchemical bonus on fortitude saves against poison for 1 hour."
    },
    {
      id: "gear_everburning_torch",
      name: "Everburning Torch",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "110 gp",
      weight: "1 lb.",
      description:
        "An otherwise normal looking torch that has continual flame cast upon it."
    },
    {
      id: "gear_holy_water_(flask)",
      name: "Holy Water (flask)",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "25 gp",
      weight: "1 lb.",
      description: "Holy water damages undead creatures as if it was acid."
    },
    {
      id: "gear_smokestick",
      name: "Smokestick",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "20 gp",
      weight: "1/2 lb.",
      description:
        "An alchemically treated wooded stick that creates a thick, opaque smoke when ignited."
    },
    {
      id: "gear_sunrod",
      name: "Sunrod",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "2 gp",
      weight: "1 lb.",
      description:
        "A 1-foot long, gold-tipped, iron rod that glows brightly when struck."
    },
    {
      id: "gear_tanglefoot_bag",
      name: "Tanglefoot Bag",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "50 gp",
      weight: "4 lb.",
      description: "A round leather bag filled with alchemical goo."
    },
    {
      id: "gear_thunderstone",
      name: "Thunderstone",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "30 gp",
      weight: "1 lb.",
      description:
        "When struck against a hard surface, it creates a deafening bang that is treated like a sonic attack."
    },
    {
      id: "gear_tindertwig",
      name: "Tindertwig",
      category: "Goods & Services",
      subcategory: "Special Substances & Items",
      cost: "1 gp",
      weight: null,
      description:
        "An alchemical substance left on the end of a small wooden stick that ignites when struck against a rough surface."
    },
    {
      id: "gear_alchemists_lab",
      name: "Alchemist's Lab",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "500 gp",
      weight: "40 lb.",
      description: null
    },
    {
      id: "gear_artisans_tools",
      name: "Artisan's Tools",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "5 gp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_artisans_tools_masterwork",
      name: "Artisan's Tools, Masterwork",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "55 gp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_climbers_kit",
      name: "Climber's Kit",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "80 gp",
      weight: "5 lb.",
      description: null
    },
    {
      id: "gear_disguise_kit",
      name: "Disguise Kit",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "50 gp",
      weight: "8 lb.",
      description: null
    },
    {
      id: "gear_healers_kit",
      name: "Healer's Kit",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "50 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_holly_mistletoe",
      name: "Holly & Mistletoe",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: null,
      weight: null,
      description: null
    },
    {
      id: "gear_holy_symbol_wooden",
      name: "Holy Symbol, Wooden",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "1 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_holy_symbol_silver",
      name: "Holy Symbol, Silver",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "25 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_hourglass",
      name: "Hourglass",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "25 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_magnifying_glass",
      name: "Magnifying Glass",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "100 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_musical_instrument_common",
      name: "Musical Instrument, Common",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "5 gp",
      weight: "3 lb.",
      description: null
    },
    {
      id: "gear_musical_instrument_masterwork",
      name: "Musical Instrument, Masterwork",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "100 gp",
      weight: "3 lb.",
      description: null
    },
    {
      id: "gear_scale_merchants",
      name: "Scale, Merchant's",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "2 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_spell_component_pouch",
      name: "Spell Component Pouch",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "5 gp",
      weight: "2 lb.",
      description: null
    },
    {
      id: "gear_thieves_tools",
      name: "Thieves' Tools",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "30 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_thieves_tools_masterwork",
      name: "Thieves' Tools, Masterwork",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "100 gp",
      weight: "2 lb.",
      description: null
    },
    {
      id: "gear_tool_masterwork",
      name: "Tool, Masterwork",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "50 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_water_clock",
      name: "Water Clock",
      category: "Goods & Services",
      subcategory: "Tools & Skill Kits",
      cost: "1,000 gp",
      weight: "200 lb.",
      description: null
    },
    {
      id: "gear_ale_(1_gal)",
      name: "Ale (1 gal.)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "2 sp",
      weight: "8 lb.",
      description: null
    },
    {
      id: "gear_ale_(1_mug)",
      name: "Ale (1 mug)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "4 cp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_banquet_(per_person)",
      name: "Banquet (per person)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "10 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_bread_(per_loaf)",
      name: "Bread (per loaf)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "2 cp",
      weight: "1/2 lb.",
      description: null
    },
    {
      id: "gear_cheese_hunk_of",
      name: "Cheese, Hunk of",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "1 sp",
      weight: "1/2 lb.",
      description: null
    },
    {
      id: "gear_inn_stay_good_(per_day)",
      name: "Inn Stay, Good (per day)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "2 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_inn_stay_common_(per_day)",
      name: "Inn Stay, Common (per day)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "5 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_inn_stay_poor_(per_day)",
      name: "Inn Stay, Poor (per day)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "2 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_meals_good_(per_day)",
      name: "Meals, Good (per day)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "5 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_meals_common_(per_day)",
      name: "Meals, Common (per day)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "3 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_meals_poor_(per_day)",
      name: "Meals, Poor (per day)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "2 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_meat_chunk_of",
      name: "Meat, Chunk of",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "3 sp",
      weight: "1/2 lb.",
      description: null
    },
    {
      id: "gear_wine_common_(pitcher)",
      name: "Wine, Common (pitcher)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "2 sp",
      weight: "6 lb.",
      description: null
    },
    {
      id: "gear_wine_fine_(bottle)",
      name: "Wine, Fine (bottle)",
      category: "Goods & Services",
      subcategory: "Food, Drink, & Lodging",
      cost: "10 gp",
      weight: "1 1/2 lb.",
      description: null
    },
    {
      id: "gear_barding_medium_creature_(stabling)",
      name: "Barding, Medium Creature (stabling)",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "x2",
      weight: "x1",
      description: null
    },
    {
      id: "gear_barding_large_creature_(stabling)",
      name: "Barding, Large Creature (stabling)",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "x4",
      weight: "x2",
      description: null
    },
    {
      id: "gear_bit_bridle",
      name: "Bit & Bridle",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "2 gp",
      weight: "1 lb.",
      description: null
    },
    {
      id: "gear_dog_guard",
      name: "Dog, Guard",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "25 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_dog_riding",
      name: "Dog, Riding",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "150 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_donkey",
      name: "Donkey",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "8 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_mule",
      name: "Mule",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "8 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_feed_(per_day)",
      name: "Feed (per day)",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "5 cp",
      weight: null,
      description: null
    },
    {
      id: "gear_horse_heavy",
      name: "Horse, Heavy",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "200 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_horse_light",
      name: "Horse, Light",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "75 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_horse_pony",
      name: "Horse, Pony",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "30 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_horse_warhorse_heavy",
      name: "Horse, Warhorse, Heavy",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "400 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_horse_warhorse_light",
      name: "Horse, Warhorse, Light",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "150 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_horse_warpony",
      name: "Horse, Warpony",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "100 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_saddle_military",
      name: "Saddle, Military",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "20 gp",
      weight: "30 lb.",
      description: null
    },
    {
      id: "gear_saddle_pack",
      name: "Saddle, Pack",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "5 gp",
      weight: "15 lb.",
      description: null
    },
    {
      id: "gear_saddle_riding",
      name: "Saddle, Riding",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "10 gp",
      weight: "25 lb.",
      description: null
    },
    {
      id: "gear_saddle_military_(exotic)",
      name: "Saddle, Military (exotic)",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "60 gp",
      weight: "40 lb.",
      description: null
    },
    {
      id: "gear_saddle_pack_(exotic)",
      name: "Saddle, Pack (exotic)",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "15 gp",
      weight: "20 lb.",
      description: null
    },
    {
      id: "gear_saddle_riding_(exotic)",
      name: "Saddle, Riding (exotic)",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "30 gp",
      weight: "30 lb.",
      description: null
    },
    {
      id: "gear_saddlebags",
      name: "Saddlebags",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "4 gp",
      weight: "8 lb.",
      description: null
    },
    {
      id: "gear_stabling_(per_day)",
      name: "Stabling (per day)",
      category: "Goods & Services",
      subcategory: "Mounts & Related Gear",
      cost: "5 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_carriage",
      name: "Carriage",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "100 gp",
      weight: "600 lb.",
      description: null
    },
    {
      id: "gear_cart",
      name: "Cart",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "15 gp",
      weight: "200 lb.",
      description: null
    },
    {
      id: "gear_galley",
      name: "Galley",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "30,000 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_keelboat",
      name: "Keelboat",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "3,000 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_longship",
      name: "Longship",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "10,000 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_rowboat",
      name: "Rowboat",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "50 gp",
      weight: "100 lb.",
      description: null
    },
    {
      id: "gear_oar",
      name: "Oar",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "2 gp",
      weight: "10 lb.",
      description: null
    },
    {
      id: "gear_sailing_ship",
      name: "Sailing Ship",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "10,000 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_sled",
      name: "Sled",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "20 gp",
      weight: "300 lb.",
      description: null
    },
    {
      id: "gear_wagon",
      name: "Wagon",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "35 gp",
      weight: "400 lb.",
      description: null
    },
    {
      id: "gear_warship",
      name: "Warship",
      category: "Goods & Services",
      subcategory: "Transport",
      cost: "25,000 gp",
      weight: null,
      description: null
    },
    {
      id: "gear_coach_cab_(per_mile)",
      name: "Coach Cab (per mile)",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "3 cp",
      weight: null,
      description: null
    },
    {
      id: "gear_hireling_traveled_(per_day)",
      name: "Hireling, Traveled (per day)",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "3 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_hireling_untrained_(per_day)",
      name: "Hireling, Untrained (per day)",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "1 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_messenger_(per_mile)",
      name: "Messenger (per mile)",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "2 cp",
      weight: null,
      description: null
    },
    {
      id: "gear_roadgate_toll",
      name: "Road/Gate Toll",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "1 cp",
      weight: null,
      description: null
    },
    {
      id: "gear_ships_passage_(per_mile)",
      name: "Ship's Passage (per mile)",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "1 sp",
      weight: null,
      description: null
    },
    {
      id: "gear_spell_0-level",
      name: "Spell, 0-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "5 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_1st-level",
      name: "Spell, 1st-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "10 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_2nd-level",
      name: "Spell, 2nd-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "20 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_3rd-level",
      name: "Spell, 3rd-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "30 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_4th-level",
      name: "Spell, 4th-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "40 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_5th-level",
      name: "Spell, 5th-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "50 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_6th-level",
      name: "Spell, 6th-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "60 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_7th-level",
      name: "Spell, 7th-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "70 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_8th-level",
      name: "Spell, 8th-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "80 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    },
    {
      id: "gear_spell_9th-level",
      name: "Spell, 9th-level",
      category: "Goods & Services",
      subcategory: "Spellcasting & Services",
      cost: "90 gp",
      weight: null,
      description: "Cost is equal to caster level x price."
    }
  ]
};

const ABILITY_NAMES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma"
];



const params =
    new URLSearchParams(
        window.location.search
    );

const characterId =
    params.get("id");




    console.log(
        "Character ID:",
        characterId
    );
// End Const Section

/************************************************************
                    END CONST SECTION
************************************************************/

async function loadCharacter() {

    try {

        const response =
            await fetch(
                `/api/characters/${characterId}`,
                {
                    headers: {
                        token:
                            localStorage.getItem(
                                "token"
                            )
                    }
                }
            );

        const data =
            await response.json();

        const sheetData =
            data.character.sheet_data;

        Object.keys(sheetData).forEach(key => {

            const field =
                document.getElementById(key);

            if (!field) {
                return;
            }

            if (
                field.type === "checkbox"
            ) {

                field.checked =
                    sheetData[key];

            } else {

                field.value =
                    sheetData[key];

            }

        });

    }

    catch(error) {

        console.error(
            "Load Failed:",
            error
        );

    }

}

function collectSheetData() {

    const sheetData = {};

    const fields = document.querySelectorAll(
        "input, select, textarea"
    );

    fields.forEach(field => {

        if (!field.id) {
            return;
        }

        if (field.type === "checkbox") {

            sheetData[field.id] =
                field.checked;

        } else {

            sheetData[field.id] =
                field.value;

        }

    });

    return sheetData;
}

async function saveCharacter() {

    try {

        const sheetData =
            collectSheetData();

        const response =
            await fetch(
                `/api/characters/${characterId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        token: localStorage.getItem("token")
                    },

                    body: JSON.stringify({

                        character_name:
                            sheetData["character-name"] ||
                            "Unnamed Character",

                        player_name:
                            sheetData["player-name"] ||
                            "",

                        sheet_data:
                            sheetData

                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "Character Saved:",
            data
        );

    }

    catch(error) {

        console.error(
            "Save Failed:",
            error
        );

    }

}



/* =========================================================
   NAVIGATION SYSTEM
   ========================================================= */

function navigate(destination){

  switch(destination){

    /* =====================================================
       HOME
       ===================================================== */

    case "home":
      window.location.href = "home_en.html";
    break;


    /* =====================================================
       PLAYER MODE
       ===================================================== */


        // Not Toggleable during Player Character Viewing


    /* =====================================================
       PROFILE
       ===================================================== */

    case "profile":

      window.location.href =
        "profile_en.html";

      break;


    /* =====================================================
       SETTINGS
       ===================================================== */

    case "settings":

      window.location.href =
        "settings_en.html";

      break;
  }
}

function returnCharacter() {

    window.location.href =
        "characters_35e_home_en.html";

}


/************************************************************
                    HEADER SECTION
************************************************************/

// function section

function toDisplayLabel(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
}
function resetSelect(selectId, placeholderText) {
  const select = document.getElementById(selectId);

  if (!select) {
    console.warn(`${selectId} not found.`);
    return null;
  }

  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholderText;
  select.appendChild(placeholderOption);

  return select;
}
function populateSelectFromArray(
  selectId,
  values,
  placeholderText,
  labelFormatter = null
) {
  const select = resetSelect(selectId, placeholderText);
  if (!select) return;

  values.forEach(function (value) {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = labelFormatter ? labelFormatter(value) : value;
    select.appendChild(option);
  });
}
function populateSelectFromObjects(
  selectId,
  items,
  placeholderText,
  valueKey,
  labelKey
) {
  const select = resetSelect(selectId, placeholderText);
  if (!select) return;

  items.forEach(function (item) {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = item[labelKey];
    select.appendChild(option);
  });
}
function getClassOptions() {
  return Object.keys(classAlignmentRestrictions);
}
function getRaceOptions() {
  return Object.keys(racialSize);
}
function getAgeOptions() {
  return Object.keys(ageStrengthModifiers);
}
function getAgeModifierTable(abilityName) {
  const ability = String(abilityName).toLowerCase();
  return ageModifierTables[ability] || null;
}
function getLevelOptions(minLevel = 1, maxLevel = 20) {
  const levels = [];

  for (let i = minLevel; i <= maxLevel; i++) {
    levels.push(String(i));
  }

  return levels;
}
function getDeityOptions() {
  return Object.entries(Deities).map(function ([key, deityData]) {
    return {
      value: key,
      label: deityData.name
    };
  });
}
function populateClassSelect() {
  const classOptions = getClassOptions();

  populateSelectFromArray(
    "classSelect",
    classOptions,
    "Class",
    function (value) {
      return toDisplayLabel(value);
    }
  );
}
function populateLevelSelect() {
  const levelOptions = getLevelOptions(1, 20);

  populateSelectFromArray("levelSelect", levelOptions, "Level");
}
function populateRaceSelect() {
  const raceOptions = getRaceOptions();

  populateSelectFromArray("raceSelect", raceOptions, "Race", function (value) {
    return toDisplayLabel(value);
  });
}
function populateAlignmentSelect() {
  const alignmentOptions = alignmentTable;

  populateSelectFromArray("alignmentSelect", alignmentOptions, "Alignment");
}
function populateDeitySelect() {
  const previousValue = getTextFieldValue("deitySelect", "");
  const select = resetSelect("deitySelect", "Deity");
  if (!select) return;

  const selectedAlignment = getTextFieldValue(
    "alignmentSelect",
    ""
  ).toUpperCase();
  let restoredPreviousValue = false;

  Object.entries(Deities).forEach(function ([deityKey, deityData]) {
    const alignmentMatches =
      !selectedAlignment || deityData.alignments.includes(selectedAlignment);

    if (!alignmentMatches) return;

    const option = document.createElement("option");
    option.value = deityKey;
    option.textContent = deityData.name;

    if (previousValue && previousValue === deityKey) {
      option.selected = true;
      restoredPreviousValue = true;
    }

    select.appendChild(option);
  });

  if (previousValue && !restoredPreviousValue) {
    console.log(
      `Previous deity "${previousValue}" is not valid for the selected alignment.`
    );
  }
}
function populateAgeSelect() {
  const ageOptions = getAgeOptions();

  populateSelectFromArray("ageSelect", ageOptions, "Age", function (value) {
    return toDisplayLabel(value);
  });
}
function updateSizeFieldFromRace() {
  const race = getTextFieldValue("raceSelect", " ").toLowerCase();
  const size = racialSize[race] || " ";

  setFieldValue("sizeField", size);
  console.log("Selected Race:", race);
  console.log("Derived Size:", size);
}
function updateSpeedFieldFromRace() {
  const race = getTextFieldValue("raceSelect", "").toLowerCase();
  const speed = racialSpeed[race] || 0;

  setFieldValue("speedTotal", `${speed} ft.`);

  console.log("Selected Race:", race);
  console.log("Derived Speed:", speed);
}
function updateHitDieFromClass() {
  const className = getTextFieldValue("classSelect", "").toLowerCase();
  const hitDie = classHitDie[className] || 0;

  // Example: store it somewhere (hidden or visible)
  setFieldValue("hitDieField", `d${hitDie}`);

  console.log("Selected Class:", className);
  console.log("Hit Die:", hitDie);
}
function updateHitPointsTotal() {
  console.log("updateHitPointsTotal() was called");

  const selectedClass =
    document.getElementById("classSelect")?.value?.toLowerCase() || "";

  const level =
    parseInt(document.getElementById("levelSelect")?.value, 10) || 0;

  const hitDie = classHitDie[selectedClass] || 0;

  const constitutionModifier =
    parseInt(document.getElementById("constitutionModifier")?.value, 10) || 0;

  const hitPointsFromHitDie = level * hitDie;
  const hitPointsFromConstitution = level * constitutionModifier;

  const totalHitPoints = hitPointsFromHitDie + hitPointsFromConstitution;

  console.log("Selected Class:", selectedClass);
  console.log("Level:", level);
  console.log("Hit Die:", hitDie);
  console.log("Constitution Modifier:", constitutionModifier);
  console.log("Hit Points From Hit Die:", hitPointsFromHitDie);
  console.log("Hit Points From Constitution:", hitPointsFromConstitution);
  console.log("Total Hit Points:", totalHitPoints);

  const hitPointsField = document.getElementById("hitPointsTotal");

  if (hitPointsField) {
    hitPointsField.value = totalHitPoints;
    console.log("hitPointsTotal set to:", totalHitPoints);
  } else {
    console.warn("hitPointsTotal field not found.");
  }
}
function populateHeightAndWeightFromRace() {
  const race = getTextFieldValue("raceSelect", " ").toLowerCase();
  const size = racialSize[race] || " ";
  const heights = heightOptions[size] || [];
  const weights = weightOptions[size] || [];

  console.log("populateHeightAndWeightFromRace() was called.");
  console.log("Selected Race:", race);
  console.log("Derived Size:", size);

  populateSelectFromArray("heightSelect", heights, "Height");
  populateSelectFromArray("weightSelect", weights, "Weight");
}
function handleRaceChange() {
  console.log("handleRaceChange() was called.");

  updateSizeFieldFromRace();
  populateHeightAndWeightFromRace();
  updateSpeedFieldFromRace();
  updateACDerivedFields();
  updateAllSkills();

  if (typeof updateAllRacialModifiers === "function") {
    updateAllRacialModifiers();
  }

  if (typeof updateAllAbilities === "function") {
    updateAllAbilities();
  }
}
function handleAgeChange() {
  console.log("handleAgeChange() was called.");

  if (typeof updateAllAgeModifiers === "function") {
    updateAllAgeModifiers();
  }

  if (typeof updateAllAbilities === "function") {
    updateAllAbilities();
  }
}
function handleAlignmentChange() {
  console.log("handleAlignmentChange() was called.");
  populateDeitySelect();
}
function handleClassChange() {
  console.log("handleClassChange() was called");

  updateHitPointsTotal();
  updateBaseAttackBonusTotal();
  updateAllSkills();
}
function handleLevelChange() {
  console.log("handleLevelChange() was called");

  updateHitPointsTotal();
  updateBaseAttackBonusTotal();
  updateClassLevelDerivedFields();
  updateAllSavingThrows();
  updateAllSkills();
}
function populateDeitySelect() {
  const select = resetSelect("deitySelect", "Deity");
  if (!select) return;

  const selectedAlignment = getTextFieldValue(
    "alignmentSelect",
    ""
  ).toUpperCase();

  Object.entries(Deities).forEach(function ([deityKey, deityData]) {
    /*
      If no alignment is selected yet, show all deities.
      If an alignment is selected, only show matching deities.
    */
    const alignmentMatches =
      !selectedAlignment || deityData.alignments.includes(selectedAlignment);

    if (!alignmentMatches) return;

    const option = document.createElement("option");
    option.value = deityKey;
    option.textContent = deityData.name;
    select.appendChild(option);
  });
}
function populateHeaderSelects() {
  console.log("populateHeaderSelects() was called.");

  populateClassSelect();
  populateLevelSelect();
  populateRaceSelect();
  populateAlignmentSelect();
  populateDeitySelect();
  populateAgeSelect();

  populateSelectFromArray("heightSelect", [], "Height");
  populateSelectFromArray("weightSelect", [], "Weight");
}
function attachHeaderSelectEvents() {
  console.log("attachHeaderSelectEvents() was called.");

  const raceSelect = document.getElementById("raceSelect");
  const ageSelect = document.getElementById("ageSelect");
  const alignmentSelect = document.getElementById("alignmentSelect");
  const classSelect = document.getElementById("classSelect");
  const levelSelect = document.getElementById("levelSelect");

  if (raceSelect) {
    raceSelect.addEventListener("change", handleRaceChange);
  } else {
    console.warn("raceSelect not found.");
  }

  if (ageSelect) {
    ageSelect.addEventListener("change", handleAgeChange);
  } else {
    console.warn("ageSelect not found.");
  }

  if (alignmentSelect) {
    alignmentSelect.addEventListener("change", handleAlignmentChange);
  } else {
    console.warn("alignmentSelect not found.");
  }

  if (classSelect) {
    classSelect.addEventListener("change", handleClassChange);
  } else {
    console.warn("classSelect not found.");
  }

  if (levelSelect) {
    levelSelect.addEventListener("change", handleLevelChange);
  } else {
    console.warn("levelSelect not found.");
  }
}
function initializeHeaderSection() {
  console.log("initializeHeaderSection() was called.");

  populateHeaderSelects();
  attachHeaderSelectEvents();
}

// End Function Section

/************************************************************
                    END HEADER SECTION
************************************************************/

/************************************************************
                    ABILITIES SECTION
************************************************************/

// Update Abilities Section

function getNumericFieldValue(id, fallback = 0) {
  return parseInt(document.getElementById(id)?.value, 10) || fallback;
}
function getTextFieldValue(id, fallback = " ") {
  return document.getElementById(id)?.value?.trim() || fallback;
}
function setFieldValue(id, value) {
  const field = document.getElementById(id);

  if (field) {
    field.value = value;
    return true;
  } else {
    console.warn(`${id} not found.`);
    return false;
  }
}
function formatAbilityLabel(abilityName) {
  const ability = String(abilityName).toLowerCase();
  return ability.charAt(0).toUpperCase() + ability.slice(1);
}
function getRacialModifierTable(abilityName) {
  const ability = String(abilityName).toLowerCase();
  return racialModifierTables[ability] || null;
}
function getPermanentAbilityValues(abilityName) {
  const ability = String(abilityName).toLowerCase();
  const race = getTextFieldValue("raceSelect", " ").toLowerCase();
  const racialModifierTable = getRacialModifierTable(ability);
  const racial = racialModifierTable ? racialModifierTable[race] ?? 0 : 0;
  const values = {
    base: getNumericFieldValue(`${ability}Base`, 0),
    racial: racial,
    level: getNumericFieldValue(`${ability}Level`, 0),
    age: getNumericFieldValue(`${ability}Age`, 0),
    inherent1: getNumericFieldValue(`${ability}Inherent1`, 0),
    inherent2: getNumericFieldValue(`${ability}Inherent2`, 0),
    inherent3: getNumericFieldValue(`${ability}Inherent3`, 0),
    feat1: getNumericFieldValue(`${ability}Feat1`, 0),
    feat2: getNumericFieldValue(`${ability}Feat2`, 0),
    feat3: getNumericFieldValue(`${ability}Feat3`, 0)
  };

  values.permanentBonus =
    values.racial +
    values.level +
    values.age +
    values.inherent1 +
    values.inherent2 +
    values.inherent3 +
    values.feat1 +
    values.feat2 +
    values.feat3;

  values.adjusted = values.base + values.permanentBonus;

  return values;
}
function getTemporaryAbilityValues(abilityName) {
  const ability = String(abilityName).toLowerCase();
  const values = {
    attunement1: getNumericFieldValue(`${ability}Attunement1`, 0),
    attunement2: getNumericFieldValue(`${ability}Attunement2`, 0),
    attunement3: getNumericFieldValue(`${ability}Attunement3`, 0),
    spell1: getNumericFieldValue(`${ability}Spell1`, 0),
    spell2: getNumericFieldValue(`${ability}Spell2`, 0),
    spell3: getNumericFieldValue(`${ability}Spell3`, 0),
    rage: getNumericFieldValue(`${ability}Rage`, 0),
    haste: getNumericFieldValue(`${ability}Haste`, 0),
    bardic: getNumericFieldValue(`${ability}BardicInspiration`, 0),
    fatigued: getNumericFieldValue(`${ability}Fatigued`, 0),
    exhausted: getNumericFieldValue(`${ability}Exhausted`, 0)
  };

  values.temporaryBonus =
    values.attunement1 +
    values.attunement2 +
    values.attunement3 +
    values.spell1 +
    values.spell2 +
    values.spell3 +
    values.rage +
    values.haste +
    values.bardic +
    values.fatigued +
    values.exhausted;

  return values;
}
function getModifier(rawScore) {
  console.log("getModifier(rawScore) was called.");

  const score = parseInt(rawScore, 10);
  if (isNaN(score) || score <= 3 || score > 90) {
    console.warn(`Invalid Ability Score Input: ${rawScore}`);
    return 0;
  }
  return Math.floor((score - 10) / 2);
}
function formatModifier(mod) {
  console.log("formatModifier(mod) was called.");

  return (mod >= 0 ? "+" : " ") + mod;
}
function updateRacialModifier(abilityName) {
  console.log(`updateRacialModifier("${abilityName}") was called`);

  const ability = String(abilityName).toLowerCase();
  const race = getTextFieldValue("raceSelect", "").toLowerCase();

  const racialModifierTable = getRacialModifierTable(ability);

  if (!racialModifierTable) {
    console.error(
      `Invalid ability name passed to updateRacialModifier(): "${abilityName}"`
    );
    return;
  }

  const mod = racialModifierTable[race] ?? 0;

  console.log("Selected Race:", race);
  console.log("Racial Modifier:", mod);

  const success = setFieldValue(`${ability}Racial`, mod);

  if (success) {
    console.log(`${ability}Racial set to: ${mod}`);
  } else {
    console.warn(`${ability}Racial hidden input not found.`);
  }
}
function updateAllRacialModifiers() {
  ABILITY_NAMES.forEach(updateRacialModifier);
}
function updateAgeModifier(abilityName) {
  console.log(`updateAgeModifier("${abilityName}") was called`);

  const ability = String(abilityName).toLowerCase();
  const age = getTextFieldValue("ageSelect", "").toLowerCase();

  const ageModifierTable = getAgeModifierTable(ability);

  if (!ageModifierTable) {
    console.error(
      `Invalid ability name passed to updateAgeModifier(): "${abilityName}"`
    );
    return;
  }

  const mod = ageModifierTable[age] ?? 0;

  console.log("Selected Age:", age);
  console.log("Age Modifier:", mod);

  const success = setFieldValue(`${ability}Age`, mod);

  if (success) {
    console.log(`${ability}Age set to: ${mod}`);
  } else {
    console.warn(`${ability}Age hidden input not found.`);
  }
}
function updateAllAgeModifiers() {
  ABILITY_NAMES.forEach(updateAgeModifier);
}
function updateAbility(abilityName) {
  console.log(`updateAbility("${abilityName}") was called`);

  const ability = String(abilityName).toLowerCase();
  const abilityLabel = formatAbilityLabel(ability);
  const race = getTextFieldValue("raceSelect", "").toLowerCase();

  const permanentValues = getPermanentAbilityValues(ability);

  setFieldValue(`${ability}Total`, permanentValues.adjusted);

  const temporaryValues = getTemporaryAbilityValues(ability);

  const effective = permanentValues.adjusted + temporaryValues.temporaryBonus;

  setFieldValue(`${ability}TemporaryTotal`, effective);

  console.log(`== ${abilityLabel} Permanent Bonus Breakdown ==`);
  console.log("Base Input:", permanentValues.base);
  console.log("Race Selected:", race);
  console.log("Racial Modifier:", permanentValues.racial);
  console.log("Level Adjustment:", permanentValues.level);
  console.log("Age Modifier:", permanentValues.age);
  console.log("Inherent One Modifier:", permanentValues.inherent1);
  console.log("Inherent Two Modifier:", permanentValues.inherent2);
  console.log("Inherent Three Modifier:", permanentValues.inherent3);
  console.log(
    "Inherents:",
    permanentValues.inherent1,
    permanentValues.inherent2,
    permanentValues.inherent3
  );
  console.log("Feat One Modifier:", permanentValues.feat1);
  console.log("Feat Two Modifier:", permanentValues.feat2);
  console.log("Feat Three Modifier:", permanentValues.feat3);
  console.log(
    "Feats:",
    permanentValues.feat1,
    permanentValues.feat2,
    permanentValues.feat3
  );
  console.log("Permanent Total:", permanentValues.permanentBonus);
  console.log("Adjusted (Total):", permanentValues.adjusted);
  console.log(`== ${abilityLabel} Temporary Bonus Breakdown ==`);
  console.log("Attunement1:", temporaryValues.attunement1);
  console.log("Attunement2:", temporaryValues.attunement2);
  console.log("Attunement3:", temporaryValues.attunement3);
  console.log(
    "Attunements:",
    temporaryValues.attunement1,
    temporaryValues.attunement2,
    temporaryValues.attunement3
  );
  console.log("Spell1:", temporaryValues.spell1);
  console.log("Spell2:", temporaryValues.spell2);
  console.log("Spell3:", temporaryValues.spell3);
  console.log(
    "Spells:",
    temporaryValues.spell1,
    temporaryValues.spell2,
    temporaryValues.spell3
  );
  console.log("Rage:", temporaryValues.rage);
  console.log("Haste:", temporaryValues.haste);
  console.log("Bardic Inspiration:", temporaryValues.bardic);
  console.log("Fatigued:", temporaryValues.fatigued);
  console.log("Exhausted:", temporaryValues.exhausted);
  console.log("Temporary Bonus:", temporaryValues.temporaryBonus);
  console.log("Effective Temporary Bonus (Final):", effective);
  const adjustedModifier = getModifier(permanentValues.adjusted);
  const effectiveModifier = getModifier(effective);

  console.log("Modifier (Adjusted):", adjustedModifier);
  console.log("Modifier (Effective):", effectiveModifier);
  setFieldValue(`${ability}Modifier`, adjustedModifier);
  setFieldValue(`${ability}TemporaryModifier`, effectiveModifier);

  updateSkillAbilityModifiers();
  updateAllSkills();

  if (ability === "constitution") {
    updateHitPointsTotal();
    updateSavingThrow("fortitude");
  }

  if (ability === "dexterity") {
    updateACDerivedFields();
    updateInitiativeTotal();
    updateSavingThrow("reflex");
  }

  if (ability === "wisdom") {
    updateSavingThrow("will");
  }
}
function updateAllAbilities() {
  ABILITY_NAMES.forEach(updateAbility);
}
function updateStrength() {
  updateAbility("strength");
}
function updateDexterity() {
  updateAbility("dexterity");
}
function updateConstitution() {
  updateAbility("constitution");
  updateHitPointsTotal();
}
function updateIntelligence() {
  updateAbility("intelligence");
}
function updateWisdom() {
  updateAbility("wisdom");
}
function updateCharisma() {
  updateAbility("charisma");
}
function updateEntireAbilitySystem() {
  console.log(`updateEntireAbilitySystem() was called.`);

  updateAllRacialModifiers();
  updateAllAgeModifiers();
  updateAllAbilities();
}

// End Update Abilities Section

// Open/Close Ability Modal Section

function openAbilityModal(abilityName) {
  console.log(`openAbilityModal("${abilityName}") was called.`);

  const ability = String(abilityName).toLowerCase();

  const fieldMap = {
    Base: "abilityModalBase",
    Racial: "abilityModalRacial",
    Level: "abilityModalLevelAdjustment",
    Age: "abilityModalAgeModifier",
    Inherent1: "abilityModalInherentOne",
    Inherent2: "abilityModalInherentTwo",
    Inherent3: "abilityModalInherentThree",
    Feat1: "abilityModalFeatOne",
    Feat2: "abilityModalFeatTwo",
    Feat3: "abilityModalFeatThree",
    Attunement1: "abilityModalAttunementOne",
    Attunement2: "abilityModalAttunementTwo",
    Attunement3: "abilityModalAttunementThree",
    Spell1: "abilityModalSpellOne",
    Spell2: "abilityModalSpellTwo",
    Spell3: "abilityModalSpellThree",
    Rage: "abilityModalRage",
    Haste: "abilityModalHaste",
    BardicInspiration: "abilityModalBardicInspiration",
    Fatigued: "abilityModalFatigued",
    Exhausted: "abilityModalExhausted"
  };

  Object.entries(fieldMap).forEach(([fieldSuffix, modalId]) => {
    const sourceId = `${ability}${fieldSuffix}`;
    const sourceEl = document.getElementById(sourceId);
    const modalEl = document.getElementById(modalId);

    if (!sourceEl) {
      console.warn(`Source field not found: ${sourceId}`);
      return;
    }

    if (!modalEl) {
      console.warn(`Modal field not found: ${modalId}`);
      return;
    }

    modalEl.value = sourceEl.value;
    console.log(`Copied ${sourceId} -> ${modalId}:`, sourceEl.value);
  });

  const modal = document.getElementById("abilityModal");
  const backdrop = document.getElementById("abilityModalBackdrop");
  const title = document.getElementById("abilityModalTitle");

  if (!modal) {
    console.warn("abilityModal not found.");
    return;
  }

  if (!backdrop) {
    console.warn("abilityModalBackdrop not found.");
    return;
  }

  modal.dataset.ability = ability;

  if (title) {
    title.textContent = `Edit ${
      ability.charAt(0).toUpperCase() + ability.slice(1)
    }`;
  }

  modal.style.display = "block";
  backdrop.style.display = "block";

  modal.classList.add("is-open");
  backdrop.classList.add("is-open");

  console.log(`Ability modal opened for: ${ability}`);
}
function saveAbilityModal() {
  console.log("saveAbilityModal() was called.");

  /*
    Get the currently edited ability from the modal.
    This was stored when the modal was opened.
  */
  const modal = document.getElementById("abilityModal");

  if (!modal) {
    console.warn("abilityModal not found.");
    return;
  }

  const ability = String(modal.dataset.ability || "").toLowerCase();

  if (!ability) {
    console.warn("No ability is currently stored on the modal.");
    return;
  }

  /*
    This map connects:
    main hidden input suffix -> modal input ID

    Left side:
    the suffix used on the main sheet hidden inputs

    Right side:
    the actual modal field IDs from your HTML
  */
  const fieldMap = {
    Base: "abilityModalBase",
    Racial: "abilityModalRacial",
    Level: "abilityModalLevelAdjustment",
    Age: "abilityModalAgeModifier",
    Inherent1: "abilityModalInherentOne",
    Inherent2: "abilityModalInherentTwo",
    Inherent3: "abilityModalInherentThree",
    Feat1: "abilityModalFeatOne",
    Feat2: "abilityModalFeatTwo",
    Feat3: "abilityModalFeatThree",
    Attunement1: "abilityModalAttunementOne",
    Attunement2: "abilityModalAttunementTwo",
    Attunement3: "abilityModalAttunementThree",
    Spell1: "abilityModalSpellOne",
    Spell2: "abilityModalSpellTwo",
    Spell3: "abilityModalSpellThree",
    Rage: "abilityModalRage",
    Haste: "abilityModalHaste",
    BardicInspiration: "abilityModalBardicInspiration",
    Fatigued: "abilityModalFatigued",
    Exhausted: "abilityModalExhausted"
  };

  /*
    Copy values from modal -> main hidden sheet inputs
  */
  Object.entries(fieldMap).forEach(([fieldSuffix, modalId]) => {
    const modalField = document.getElementById(modalId);
    const mainFieldId = `${ability}${fieldSuffix}`;
    const mainField = document.getElementById(mainFieldId);

    if (!modalField) {
      console.warn(`Modal field not found: ${modalId}`);
      return;
    }

    if (!mainField) {
      console.warn(`Main hidden input not found: ${mainFieldId}`);
      return;
    }

    mainField.value = modalField.value;
    console.log(`Copied ${modalId} -> ${mainFieldId}:`, modalField.value);
  });

  /*
    Recalculate the visible totals/modifiers for this ability
  */
  updateAbility(ability);

  /*
    Close the modal after saving
  */
  closeAbilityModal();
}
function closeAbilityModal() {
  document.getElementById("abilityModal").style.display = "none";
  document.getElementById("abilityModalBackdrop").style.display = "none";
}

// End Open/Close Ability Modal Section

/************************************************************
                    END ABILITIES SECTION
************************************************************/

/************************************************************
                    ARMOR CLASS SECTION
************************************************************/

// Function Section

function updateACDexterityModifier() {
  console.log("updateACDexterityModifier() was called.");

  const dexterityModifier =
    parseInt(document.getElementById("dexterityModifier")?.value, 10) || 0;

  const acDexterityField = document.getElementById("acDexterityModifier");

  if (acDexterityField) {
    acDexterityField.value = dexterityModifier;
    console.log("acDexterityModifier set to:", dexterityModifier);
  } else {
    console.warn("acDexterityModifier field not found.");
  }
}
function updateACSizeModifier() {
  console.log("updateACSizeModifier() was called.");

  const race = getTextFieldValue("raceSelect", "").toLowerCase();
  const size = racialSize[race]?.toLowerCase() || "";
  const sizeModifier = sizeModifiers[size] ?? 0;

  const acSizeField = document.getElementById("acSizeModifier");

  if (acSizeField) {
    acSizeField.value = sizeModifier;
    console.log("Selected Race:", race);
    console.log("Derived Size:", size);
    console.log("acSizeModifier set to:", sizeModifier);
  } else {
    console.warn("acSizeModifier field not found.");
  }
}
function updateACTotal() {
  console.log("updateACTotal() was called.");

  const armorBonus =
    parseInt(document.getElementById("armorBonus")?.value, 10) || 0;

  const shieldBonus =
    parseInt(document.getElementById("shieldBonus")?.value, 10) || 0;

  const dexterityModifier =
    parseInt(document.getElementById("acDexterityModifier")?.value, 10) || 0;

  const sizeModifier =
    parseInt(document.getElementById("acSizeModifier")?.value, 10) || 0;

  const miscModifier =
    parseInt(document.getElementById("acMiscModifier")?.value, 10) || 0;

  const total =
    10 +
    armorBonus +
    shieldBonus +
    dexterityModifier +
    sizeModifier +
    miscModifier;

  const acTotalField = document.getElementById("acTotal");

  if (acTotalField) {
    acTotalField.value = total;
    console.log("acTotal set to:", total);
  } else {
    console.warn("acTotal field not found.");
  }
}
function updateACDerivedFields() {
  console.log("updateACDerivedFields() was called.");

  updateACDexterityModifier();
  updateACSizeModifier();
  updateACFromEquippedGear();
  updateACTotal();
}
function updateInitiativeTotal() {
  console.log("updateInitiativeTotal() was called.");

  const dexterityModifier =
    parseInt(document.getElementById("dexterityModifier")?.value, 10) || 0;
  const miscInitiativeModifier =
    parseInt(document.getElementById("initiativeMiscModifier")?.value, 10) || 0;

  const initiativeTotal = dexterityModifier + miscInitiativeModifier;

  const initiativeField = document.getElementById("initiativeTotal");

  if (initiativeField) {
    initiativeField.value = initiativeTotal;
    console.log("initiativeTotal set to:", initiativeTotal);
  } else {
    console.warn("initiativeTotal field not found.");
  }
}
function calculateBaseAttackBonus(className, level) {
  const progression = classBABProgression[className] || "";

  if (progression === "full") {
    return level;
  }

  if (progression === "medium") {
    return Math.floor(level * 0.75);
  }

  if (progression === "poor") {
    return Math.floor(level * 0.5);
  }

  return 0;
}
function updateBaseAttackBonusTotal() {
  console.log("updateBaseAttackBonusTotal() was called.");

  const selectedClass = getTextFieldValue("classSelect", "").toLowerCase();

  const level =
    parseInt(document.getElementById("levelSelect")?.value, 10) || 0;

  const baseAttackBonus = calculateBaseAttackBonus(selectedClass, level);

  const baseAttackBonusField = document.getElementById("baseAttackBonusTotal");

  if (baseAttackBonusField) {
    baseAttackBonusField.value = baseAttackBonus;
    console.log("Selected Class:", selectedClass);
    console.log("Level:", level);
    console.log("Base Attack Bonus:", baseAttackBonus);
  } else {
    console.warn("baseAttackBonusTotal field not found.");
  }
}
function updateClassLevelDerivedFields() {
  console.log("updateClassLevelDerivedFields() was called.");

  updateHitPointsTotal();
  updateBaseAttackBonusTotal();
}
function calculateBaseSave(level, progressionType) {
  if (progressionType === "good") {
    return 2 + Math.floor(level / 2);
  }

  if (progressionType === "poor") {
    return Math.floor(level / 3);
  }

  return 0;
}
function getSaveAbilityModifier(saveName) {
  const save = String(saveName).toLowerCase();

  if (save === "fortitude") {
    return (
      parseInt(document.getElementById("constitutionModifier")?.value, 10) || 0
    );
  }

  if (save === "reflex") {
    return (
      parseInt(document.getElementById("dexterityModifier")?.value, 10) || 0
    );
  }

  if (save === "will") {
    return parseInt(document.getElementById("wisdomModifier")?.value, 10) || 0;
  }

  return 0;
}
function updateSavingThrow(saveName) {
  console.log(`updateSavingThrow("${saveName}") was called.`);

  const save = String(saveName).toLowerCase();
  const selectedClass = getTextFieldValue("classSelect", "").toLowerCase();
  const level =
    parseInt(document.getElementById("levelSelect")?.value, 10) || 0;

  const classSaveData = classSaveProgression[selectedClass];
  if (!classSaveData) {
    console.warn(`No save progression data found for class: ${selectedClass}`);
    return;
  }

  const progressionType = classSaveData[save] || "poor";
  const baseSave = calculateBaseSave(level, progressionType);

  const abilityModifier = getSaveAbilityModifier(save);

  let savePrefix = "";

  if (save === "fortitude") {
    savePrefix = "savingThrowFortitude";
  } else if (save === "reflex") {
    savePrefix = "savingThrowReflex";
  } else if (save === "will") {
    savePrefix = "savingThrowWill";
  } else {
    console.warn(`Invalid save name: ${save}`);
    return;
  }

  const magicModifier =
    parseInt(
      document.getElementById(`${savePrefix}MagicModifier`)?.value,
      10
    ) || 0;

  const miscModifier =
    parseInt(document.getElementById(`${savePrefix}MiscModifier`)?.value, 10) ||
    0;

  const temporaryModifier =
    parseInt(
      document.getElementById(`${savePrefix}TemporaryModifier`)?.value,
      10
    ) || 0;

  const totalSave =
    baseSave +
    abilityModifier +
    magicModifier +
    miscModifier +
    temporaryModifier;

  const totalField = document.getElementById(`${savePrefix}Total`);
  const baseField = document.getElementById(`${savePrefix}Base`);
  const abilityModifierField = document.getElementById(
    `${savePrefix}AbilityModifier`
  );

  if (totalField) {
    totalField.value = totalSave;
  } else {
    console.warn(`${savePrefix}Total field not found.`);
  }

  if (baseField) {
    baseField.value = baseSave;
  } else {
    console.warn(`${savePrefix}Base field not found.`);
  }

  if (abilityModifierField) {
    abilityModifierField.value = abilityModifier;
  } else {
    console.warn(`${savePrefix}AbilityModifier field not found.`);
  }

  console.log("Selected Class:", selectedClass);
  console.log("Level:", level);
  console.log("Save Name:", save);
  console.log("Progression Type:", progressionType);
  console.log("Base Save:", baseSave);
  console.log("Ability Modifier:", abilityModifier);
  console.log("Magic Modifier:", magicModifier);
  console.log("Misc Modifier:", miscModifier);
  console.log("Temporary Modifier:", temporaryModifier);
  console.log("Total Save:", totalSave);
}
function updateAllSavingThrows() {
  console.log("updateAllSavingThrows() was called.");

  updateSavingThrow("fortitude");
  updateSavingThrow("reflex");
  updateSavingThrow("will");
}

// End Function Section

/************************************************************
                    END ARMOR CLASS SECTION
************************************************************/

/************************************************************
                    SKILLS SECTION
************************************************************/

// Function Section

function getAbilityModifierByShortName(shortName) {
  const key = String(shortName).trim().toUpperCase();

  if (key === "STR")
    return (
      parseInt(document.getElementById("strengthModifier")?.value, 10) || 0
    );
  if (key === "DEX")
    return (
      parseInt(document.getElementById("dexterityModifier")?.value, 10) || 0
    );
  if (key === "CON")
    return (
      parseInt(document.getElementById("constitutionModifier")?.value, 10) || 0
    );
  if (key === "INT")
    return (
      parseInt(document.getElementById("intelligenceModifier")?.value, 10) || 0
    );
  if (key === "WIS")
    return parseInt(document.getElementById("wisdomModifier")?.value, 10) || 0;
  if (key === "CHA")
    return (
      parseInt(document.getElementById("charismaModifier")?.value, 10) || 0
    );

  return 0;
}
function updateSkillAbilityModifiers() {
  console.log("updateSkillAbilityModifiers() was called.");

  Object.entries(skillAbilityMap).forEach(function ([skillKey, shortName]) {
    const modifier = getAbilityModifierByShortName(shortName);
    const field = document.getElementById(`${skillKey}AbilityModifier`);

    if (!field) {
      console.warn(`${skillKey}AbilityModifier not found.`);
      return;
    }

    field.value = modifier;

    console.log(`${skillKey} uses ${shortName} -> ${modifier}`);
  });
}
function isHumanCharacter() {
  const race = getTextFieldValue("raceSelect", "").toLowerCase();
  return race === "human";
}
function getTotalSkillPointsAvailable() {
  const selectedClass = getTextFieldValue("classSelect", "").toLowerCase();
  const level =
    parseInt(document.getElementById("levelSelect")?.value, 10) || 0;
  const intelligenceModifier =
    parseInt(document.getElementById("intelligenceModifier")?.value, 10) || 0;

  const baseSkillPoints = classSkillPointsPerLevel[selectedClass] || 0;
  const humanBonus = isHumanCharacter() ? 1 : 0;

  const perLevelSkillPoints = Math.max(
    1,
    baseSkillPoints + intelligenceModifier + humanBonus
  );

  if (level <= 0) return 0;

  const firstLevelPoints = perLevelSkillPoints * 4;
  const laterLevelPoints = perLevelSkillPoints * Math.max(0, level - 1);

  return firstLevelPoints + laterLevelPoints;
}
function isClassSkill(skillKey) {
  const selectedClass = getTextFieldValue("classSelect", "").toLowerCase();
  const classSkills = classSkillsByClass[selectedClass] || [];
  return classSkills.includes(skillKey);
}
function getSkillRankCap(skillKey) {
  const level =
    parseInt(document.getElementById("levelSelect")?.value, 10) || 0;

  if (isClassSkill(skillKey)) {
    return level + 3;
  }

  return (level + 3) / 2;
}
function getSkillRankCost(skillKey, ranks) {
  if (isClassSkill(skillKey)) {
    return ranks;
  }

  return ranks * 2;
}
function clampSkillRanksToLegalMaximum(skillKey) {
  const ranksField = document.getElementById(`${skillKey}Ranks`);

  if (!ranksField) {
    console.warn(`${skillKey}Ranks not found.`);
    return;
  }

  let ranks = parseFloat(ranksField.value) || 0;
  const maxRanks = getSkillRankCap(skillKey);

  if (isClassSkill(skillKey)) {
    ranks = Math.round(ranks);
  } else {
    ranks = Math.round(ranks * 2) / 2;
  }

  if (ranks > maxRanks) {
    ranks = maxRanks;
  }

  if (ranks < 0) {
    ranks = 0;
  }

  ranksField.value = ranks;
}
function clampSkillRanksToAvailablePoints(skillKey) {
  const ranksField = document.getElementById(`${skillKey}Ranks`);

  if (!ranksField) {
    console.warn(`${skillKey}Ranks not found.`);
    return;
  }

  const totalAvailable = getTotalSkillPointsAvailable();
  const spentElsewhere = getTotalSkillPointsSpentExcluding(skillKey);

  let ranks = parseFloat(ranksField.value) || 0;

  if (ranks < 0) {
    ranks = 0;
  }

  if (isClassSkill(skillKey)) {
    const maxAffordableRanks = Math.max(0, totalAvailable - spentElsewhere);

    if (ranks > maxAffordableRanks) {
      ranks = maxAffordableRanks;
    }

    ranks = Math.round(ranks);
  } else {
    const maxAffordableRanks = Math.max(
      0,
      (totalAvailable - spentElsewhere) / 2
    );

    if (ranks > maxAffordableRanks) {
      ranks = maxAffordableRanks;
    }

    ranks = Math.round(ranks * 2) / 2;
  }

  ranksField.value = ranks;
}
function updateSkillPointSummary() {
  console.log("updateSkillPointSummary() was called.");

  const totalAvailable = getTotalSkillPointsAvailable();

  let totalSpent = 0;

  Object.keys(skillAbilityMap).forEach(function (skillKey) {
    clampSkillRanksToLegalMaximum(skillKey);
    clampSkillRanksToAvailablePoints(skillKey);
  });

  Object.keys(skillAbilityMap).forEach(function (skillKey) {
    const ranks =
      parseFloat(document.getElementById(`${skillKey}Ranks`)?.value) || 0;
    totalSpent += getSkillRankCost(skillKey, ranks);
  });

  let totalRemaining = totalAvailable - totalSpent;

  if (totalRemaining < 0) {
    totalRemaining = 0;
  }

  const summaryField = document.getElementById("maxSkillRanksTotal");

  if (summaryField) {
    summaryField.value = `${totalRemaining} / ${totalAvailable}`;
  } else {
    console.warn("maxSkillRanksTotal field not found.");
  }
}
function updateSingleSkill(skillKey) {
  const shortAbility = skillAbilityMap[skillKey];

  if (!shortAbility) {
    console.warn(`No ability map found for skill: ${skillKey}`);
    return;
  }

  clampSkillRanksToLegalMaximum(skillKey);
  clampSkillRanksToAvailablePoints(skillKey);

  const abilityModifier = getAbilityModifierByShortName(shortAbility);

  const abilityModifierField = document.getElementById(
    `${skillKey}AbilityModifier`
  );
  const ranksField = document.getElementById(`${skillKey}Ranks`);
  const synergyModifierField = document.getElementById(
    `${skillKey}SynergyModifier`
  );
  const skillModifierField = document.getElementById(
    `${skillKey}SkillModifier`
  );

  const ranks = parseFloat(ranksField?.value) || 0;
  const synergy = parseInt(synergyModifierField?.value, 10) || 0;

  const trainedOnly = skillRules[skillKey]?.trainedOnly ?? false;

  if (abilityModifierField) {
    abilityModifierField.value = abilityModifier;
  } else {
    console.warn(`${skillKey}AbilityModifier not found.`);
  }

  if (skillModifierField) {
    skillModifierField.value = abilityModifier + ranks + synergy;
  } else {
    console.warn(`${skillKey}SkillModifier not found.`);
  }

  const skillButton = document.querySelector(
    `.skill-${skillKey.replace(
      /[A-Z]/g,
      (m) => "-" + m.toLowerCase()
    )}-section .skill-btn`
  );

  if (skillButton) {
    if (trainedOnly && ranks <= 0) {
      skillButton.title = "Trained Only - requires ranks to use";
    } else if (!isClassSkill(skillKey)) {
      skillButton.title = "Cross-Class Skill";
    } else {
      skillButton.title = "Class Skill";
    }
  }
}
function attachSkillRankEvents() {
  console.log("attachSkillRankEvents() was called.");

  Object.keys(skillAbilityMap).forEach(function (skillKey) {
    const ranksField = document.getElementById(`${skillKey}Ranks`);

    if (!ranksField) {
      console.warn(`${skillKey}Ranks not found.`);
      return;
    }

    ranksField.addEventListener("input", function () {
      updateSingleSkill(skillKey);
      updateSkillPointSummary();
    });

    ranksField.addEventListener("change", function () {
      updateSingleSkill(skillKey);
      updateSkillPointSummary();
    });
  });
}
function getTotalSkillPointsSpentExcluding(skillKeyToExclude) {
  let totalSpent = 0;

  Object.keys(skillAbilityMap).forEach(function (skillKey) {
    if (skillKey === skillKeyToExclude) {
      return;
    }

    const ranks =
      parseFloat(document.getElementById(`${skillKey}Ranks`)?.value) || 0;
    totalSpent += getSkillRankCost(skillKey, ranks);
  });

  return totalSpent;
}

function updateAllSkills() {
  console.log("updateAllSkills() was called.");

  Object.keys(skillAbilityMap).forEach(function (skillKey) {
    updateSingleSkill(skillKey);
  });

  updateSkillPointSummary();
}

// End Function Section

/************************************************************
                    END SKILLS SECTION
************************************************************/

/************************************************************
                    INVENTORY SECTION
************************************************************/

// Function Section

function OpenInventoryModal() {
  const modal = document.getElementById("inventory-modal");
  if (!modal) {
    console.warn("inventoryModalBackdrop not found.");
    return;
  }

  modal.style.display = "block";
  modal.classList.add("is-open");
  document.body.classList.add("modal-open");
  console.log("Inventory modal opened.");
}
function CloseInventoryModal() {
  const modal = document.getElementById("inventory-modal");
  if (!modal) {
    console.warn("inventoryModalBackdrop not found.");
    return;
  }

  modal.classList.remove("is-open");
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
  console.log("Inventory modal closed.");
}
function safeText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}
function toTitleCase(text) {
  if (!text) return "-";
  return String(text)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
function formatArray(value) {
  if (!Array.isArray(value) || !value.length) return "-";
  return value.map((v) => toTitleCase(v)).join(", ");
}
function formatPercentFromDecimal(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return `${Math.round(value * 100)}%`;
  return safeText(value);
}
function parseWeight(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "special"
  ) {
    return 0;
  }

  if (typeof value === "number") return value;

  const text = String(value).trim().toLowerCase();
  if (!text) return 0;
  if (text.startsWith("x")) return 0;

  const mixedFractionMatch = text.match(/(\d+)\s+(\d+)\/(\d+)/);
  if (mixedFractionMatch) {
    const whole = Number(mixedFractionMatch[1]);
    const numerator = Number(mixedFractionMatch[2]);
    const denominator = Number(mixedFractionMatch[3]);
    return denominator ? whole + numerator / denominator : whole;
  }

  const fractionMatch = text.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    return denominator ? numerator / denominator : 0;
  }

  const numericMatch = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
  if (!numericMatch) return 0;

  return Number(numericMatch[0]);
}
function parseCostToCopper(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "special"
  ) {
    return null;
  }

  if (typeof value === "number") return value;

  const text = String(value).trim().toLowerCase().replace(/,/g, "");
  if (!text || text.startsWith("x")) return null;

  const match = text.match(/(\d+(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)/);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    cp: 1,
    sp: 10,
    ep: 50,
    gp: 100,
    pp: 1000
  };

  return amount * (multipliers[unit] ?? 0);
}
function formatCoinBreakdownFromCopper(totalCopper) {
  const safeCopper = Math.max(0, Math.floor(Number(totalCopper) || 0));

  let remaining = safeCopper;

  const pp = Math.floor(remaining / 1000);
  remaining %= 1000;

  const gp = Math.floor(remaining / 100);
  remaining %= 100;

  const ep = Math.floor(remaining / 50);
  remaining %= 50;

  const sp = Math.floor(remaining / 10);
  remaining %= 10;

  const cp = remaining;

  return `${pp} PP ${gp} GP ${ep} EP ${sp} SP ${cp} CP`;
}
function normalizeWeapon(item, proficiencyGroup) {
  return {
    ...item,
    item_type: "weapon",
    category: "weapon",
    proficiency_group: proficiencyGroup,
    source_group: proficiencyGroup
  };
}
function normalizeArmor(item) {
  const isShield =
    String(item.category ?? "").toLowerCase() === "shields" &&
    [
      "armor_buckler",
      "armor_shield_light_wooden",
      "armor_shield_light_steel",
      "armor_shield_heavy_wooden",
      "armor_shield_heavy_steel",
      "armor_shield_tower"
    ].includes(item.id);

  const isArmorAttachment =
    String(item.category ?? "").toLowerCase() === "shields" && !isShield;

  return {
    ...item,
    item_type: isShield
      ? "shield"
      : isArmorAttachment
      ? "shield_or_armor_attachment"
      : "armor",
    subcategory: item.category,
    source_group: "armor"
  };
}
function normalizeGear(item) {
  return {
    ...item,
    item_type: "gear",
    source_group: "gear"
  };
}
function flattenStoreData(rawData) {
  const simpleWeapons = (rawData.simple_weapons ?? []).map((item) =>
    normalizeWeapon(item, "simple")
  );
  const martialWeapons = (rawData.martial_weapons ?? []).map((item) =>
    normalizeWeapon(item, "martial")
  );
  const exoticWeapons = (rawData.exotic_weapons ?? []).map((item) =>
    normalizeWeapon(item, "exotic")
  );
  const armor = (rawData.armor ?? []).map(normalizeArmor);
  const gear = (rawData.adventuring_gear ?? []).map(normalizeGear);

  return [
    ...simpleWeapons,
    ...martialWeapons,
    ...exoticWeapons,
    ...armor,
    ...gear
  ];
}
function matchesUiFilter(item, filterValue) {
  if (!filterValue || filterValue === "all") return true;

  const sub = String(item.subcategory ?? "").toLowerCase();
  const name = String(item.name ?? "").toLowerCase();
  const itemType = String(item.item_type ?? "").toLowerCase();

  switch (String(filterValue).toLowerCase()) {
    case "weapons":
    case "weapons & armor":
      return (
        itemType === "weapon" ||
        itemType === "armor" ||
        itemType === "shield" ||
        itemType === "shield_or_armor_attachment"
      );

    case "alchemical":
      return (
        sub.includes("special substances") ||
        name.includes("acid") ||
        name.includes("alchemist") ||
        name.includes("antitoxin") ||
        name.includes("holy water") ||
        name.includes("smokestick") ||
        name.includes("sunrod") ||
        name.includes("tanglefoot") ||
        name.includes("thunderstone") ||
        name.includes("tindertwig")
      );

    case "basic":
      return sub.includes("adventuring gear");

    case "food":
      return sub.includes("food, drink");

    case "mounts":
      return sub.includes("mounts") || sub.includes("transport");

    case "services":
      return sub.includes("spellcasting & services");

    default:
      return true;
  }
}
function itemMatchesSearch(item, search) {
  if (!search) return true;

  const blob = [
    item.name,
    item.category,
    item.subcategory,
    item.item_type,
    item.proficiency_group,
    item.combat_type,
    item.handedness,
    item.description,
    ...(item.damage_type ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return blob.includes(search);
}
function sortItems(items, sortValue) {
  const sorted = [...items];

  switch (sortValue) {
    case "weight":
      sorted.sort((a, b) => {
        const aWeight = parseWeight(a.weight) * (a.quantity ?? 1);
        const bWeight = parseWeight(b.weight) * (b.quantity ?? 1);
        return aWeight - bWeight;
      });
      break;

    case "value":
      sorted.sort((a, b) => {
        const aCost = parseCostToCopper(a.cost);
        const bCost = parseCostToCopper(b.cost);
        return (
          (aCost ?? Number.MAX_SAFE_INTEGER) -
          (bCost ?? Number.MAX_SAFE_INTEGER)
        );
      });
      break;

    case "qty":
      sorted.sort((a, b) => (b.quantity ?? 1) - (a.quantity ?? 1));
      break;

    case "name":
    default:
      sorted.sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""))
      );
      break;
  }

  return sorted;
}
function getToolbarValues() {
  return {
    search:
      document
        .getElementById("inventory-search")
        ?.value?.trim()
        .toLowerCase() ?? "",
    filterValue: document.getElementById("inventory-filter")?.value ?? "all",
    sortValue: document.getElementById("inventory-sort")?.value ?? "name"
  };
}
function loadStoreAndInventoryData() {
  storeData = flattenStoreData(RAW_STORE_DATA);
  inventoryData = [];
  filteredViewData = [];
  activeView = "inventory";
  updateActiveNav();
  applyCurrentViewFilters();
  updateEquipmentDropdowns();
}

function updateActiveNav() {
  document
    .querySelectorAll(".inventory-navigation-item[data-view]")
    .forEach((btn) => {
      const btnView = btn.dataset.view;
      const isActive =
        (activeView === "inventory" && btnView === "inventory") ||
        (activeView === "store" && btnView === "gear-hub") ||
        (activeView === "transfer" && btnView === "transfer") ||
        (activeView === "services" && btnView === "services");

      btn.classList.toggle("is-active", isActive);
    });
}
function setActiveView(viewName) {
  const viewMap = {
    inventory: "inventory",
    "gear-hub": "store",
    transfer: "transfer",
    services: "services"
  };

  activeView = viewMap[viewName] ?? "inventory";
  updateActiveNav();
  hideDetailPanel();

  const title =
    document.querySelector(".topbar-title") ||
    document.querySelector(".inventory-title") ||
    document.querySelector("h1");

  if (title) {
    title.textContent =
      activeView === "store"
        ? "Gear & Equipment Store"
        : activeView === "transfer"
        ? "Transfer Items"
        : activeView === "services"
        ? "Services"
        : "Inventory";
  }

  if (activeView === "inventory" || activeView === "store") {
    applyCurrentViewFilters();
  } else {
    renderPlaceholderView(activeView);
  }
}
function renderPlaceholderView(viewName) {
  const list = document.getElementById("inventory-list");
  if (!list) return;

  const labels = {
    transfer: "Transfer Items coming later",
    services: "Services coming later"
  };

  list.innerHTML = `<div class="inventory-empty">${
    labels[viewName] ?? "This section is coming later"
  }</div>`;
}
function addItemToInventory(itemId) {
  const selectedItem = storeData.find((item) => item.id === itemId);
  if (!selectedItem) return;

  const existingItem = inventoryData.find((item) => item.id === itemId);

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity ?? 1) + 1;
  } else {
    inventoryData.push({
      ...selectedItem,
      quantity: 1
    });
  }

  updateInventorySummary();
  updateFooterSummary();
  updateEquipmentDropdowns();
  applyCurrentViewFilters();
}
function removeOneFromInventory(itemId) {
  const itemIndex = inventoryData.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return;

  const qty = inventoryData[itemIndex].quantity ?? 1;

  if (qty > 1) {
    inventoryData[itemIndex].quantity = qty - 1;
  } else {
    inventoryData.splice(itemIndex, 1);
  }

  updateInventorySummary();
  updateFooterSummary();
  updateEquipmentDropdowns();
  applyCurrentViewFilters();
}
function applyCurrentViewFilters() {
  const { search, filterValue, sortValue } = getToolbarValues();

  let items = activeView === "store" ? [...storeData] : [...inventoryData];
  items = items.filter((item) => itemMatchesSearch(item, search));
  items = items.filter((item) => matchesUiFilter(item, filterValue));
  items = sortItems(items, sortValue);

  filteredViewData = items;
  renderCurrentList(items);
  updateInventorySummary();
  updateFooterSummary();
}
function renderCurrentList(items) {
  if (activeView === "store") {
    renderStoreList(items);
  } else {
    renderInventoryList(items);
  }
}
function renderStoreList(items) {
  const list = document.getElementById("inventory-list");
  if (!list) return;

  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<div class="inventory-empty">No store items found</div>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "inventory-card";

    card.innerHTML = `
      <div class="inventory-card-name">${safeText(item.name)}</div>
      <div class="inventory-card-meta">
        <span>${safeText(toTitleCase(item.item_type))}</span>
        <span>${safeText(
          item.subcategory ? toTitleCase(item.subcategory) : "-"
        )}</span>
        <span>${safeText(item.cost)}</span>
        <span>${safeText(item.weight)}</span>
      </div>
    `;

    card.addEventListener("click", () => openStoreDetail(item));
    list.appendChild(card);
  });
}
function renderInventoryList(items) {
  const list = document.getElementById("inventory-list");
  if (!list) return;

  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `<div class="inventory-empty">No items in inventory</div>`;
    return;
  }

  items.forEach((item) => {
    const quantity = item.quantity ?? 1;
    const totalWeight = parseWeight(item.weight) * quantity;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "inventory-card";

    card.innerHTML = `
      <div class="inventory-card-name">${safeText(item.name)}</div>
      <div class="inventory-card-meta">
        <span>Qty: ${quantity}</span>
        <span>${safeText(item.cost)}</span>
        <span>${safeText(item.weight)} each</span>
        <span>${totalWeight} lb total</span>
      </div>
    `;

    card.addEventListener("click", () => openInventoryDetail(item));
    list.appendChild(card);
  });
}
function hideDetailPanel() {
  const detail = document.getElementById("inventory-detail");
  if (detail) detail.hidden = true;
  currentDetailItemId = null;
}
function openStoreDetail(item) {
  const detail = document.getElementById("inventory-detail");
  const title = document.getElementById("inventory-detail-title");
  const body = document.getElementById("inventory-detail-body");
  if (!detail || !title || !body) return;

  currentDetailItemId = item.id;
  title.textContent = item.name ?? "Item";

  body.innerHTML = `
    <div><b>Item Type:</b> ${safeText(toTitleCase(item.item_type))}</div>
    <div><b>Category:</b> ${safeText(
      item.category ? toTitleCase(item.category) : "-"
    )}</div>
    <div><b>Subcategory:</b> ${safeText(
      item.subcategory ? toTitleCase(item.subcategory) : "-"
    )}</div>
    <div><b>Cost:</b> ${safeText(item.cost)}</div>
    <div><b>Weight:</b> ${safeText(item.weight)}</div>
    <div><b>Description:</b> ${safeText(item.description)}</div>
    <div style="margin-top:12px;">
      <button type="button" id="inventory-add-from-detail-btn">Add to Inventory</button>
    </div>
  `;

  document
    .getElementById("inventory-add-from-detail-btn")
    ?.addEventListener("click", () => {
      addItemToInventory(item.id);
    });

  detail.hidden = false;
}
function openInventoryDetail(item) {
  const detail = document.getElementById("inventory-detail");
  const title = document.getElementById("inventory-detail-title");
  const body = document.getElementById("inventory-detail-body");
  if (!detail || !title || !body) return;

  currentDetailItemId = item.id;
  title.textContent = item.name ?? "Item";

  const quantity = item.quantity ?? 1;
  const totalWeight = parseWeight(item.weight) * quantity;

  body.innerHTML = `
    <div><b>Item Type:</b> ${safeText(toTitleCase(item.item_type))}</div>
    <div><b>Category:</b> ${safeText(
      item.category ? toTitleCase(item.category) : "-"
    )}</div>
    <div><b>Subcategory:</b> ${safeText(
      item.subcategory ? toTitleCase(item.subcategory) : "-"
    )}</div>
    <div><b>Cost:</b> ${safeText(item.cost)}</div>
    <div><b>Weight Each:</b> ${safeText(item.weight)}</div>
    <div><b>Quantity:</b> ${quantity}</div>
    <div><b>Total Weight:</b> ${totalWeight} lb</div>
    <div><b>Description:</b> ${safeText(item.description)}</div>
    <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
      <button type="button" id="inventory-add-one-btn">Add One</button>
      <button type="button" id="inventory-remove-one-btn">Remove One</button>
    </div>
  `;

  document
    .getElementById("inventory-add-one-btn")
    ?.addEventListener("click", () => {
      addItemToInventory(item.id);
    });

  document
    .getElementById("inventory-remove-one-btn")
    ?.addEventListener("click", () => {
      removeOneFromInventory(item.id);
    });

  detail.hidden = false;
}
function getInventoryTotalWeight() {
  return inventoryData.reduce(
    (sum, item) => sum + parseWeight(item.weight) * (item.quantity ?? 1),
    0
  );
}
function getInventoryTotalCopperValue() {
  return inventoryData.reduce((sum, item) => {
    const cost = parseCostToCopper(item.cost);
    return sum + (cost ?? 0) * (item.quantity ?? 1);
  }, 0);
}
function updateInventorySummary() {
  const totalWeight = getInventoryTotalWeight();
  const totalCoins = formatCoinBreakdownFromCopper(
    getInventoryTotalCopperValue()
  );

  const weightSummary = document.getElementById("inventory-weight-summary");
  if (weightSummary) {
    weightSummary.textContent = `Total Weight: ${totalWeight} lb`;
  }

  const coinSummary = document.getElementById("inventory-coin-summary");
  if (coinSummary) {
    coinSummary.textContent = totalCoins;
  }
}
function updateFooterSummary() {
  const totalWeight = getInventoryTotalWeight();
  const totalCoins = formatCoinBreakdownFromCopper(
    getInventoryTotalCopperValue()
  );

  const footerWeight = document.getElementById("inventory-weight-footer");
  if (footerWeight) {
    footerWeight.textContent = `${totalWeight} lb`;
  }

  const footerCoins = document.getElementById("inventory-coin-footer");
  if (footerCoins) {
    footerCoins.textContent = totalCoins;
  }
}
function isInventoryWeapon(item) {
  return item?.item_type === "weapon";
}
function isInventoryArmor(item) {
  return item?.item_type === "armor";
}
function isInventoryShield(item) {
  return item?.item_type === "shield";
}
function clearSelectKeepFirstOption(selectElement) {
  if (!selectElement) return;

  const firstOption = selectElement.options[0];
  const placeholderText = firstOption ? firstOption.textContent : "Select";

  selectElement.innerHTML = "";
  selectElement.appendChild(new Option(placeholderText, ""));
}
function populateSelectFromInventory(selectId, items) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const previousValue = select.value;
  clearSelectKeepFirstOption(select);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = safeText(item.name, "Unnamed Item");
    select.appendChild(option);
  });

  const stillExists = items.some((item) => item.id === previousValue);
  select.value = stillExists ? previousValue : "";
}
function updateEquipmentDropdowns() {
  const inventoryWeapons = inventoryData.filter(isInventoryWeapon);
  const inventoryArmor = inventoryData.filter(isInventoryArmor);
  const inventoryShields = inventoryData.filter(isInventoryShield);

  populateSelectFromInventory("weaponOneSelect", inventoryWeapons);
  populateSelectFromInventory("weaponTwoSelect", inventoryWeapons);
  populateSelectFromInventory("armorSelect", inventoryArmor);
  populateSelectFromInventory("shieldSelect", inventoryShields);
}
function getInventoryItemById(itemId) {
  return inventoryData.find((item) => item.id === itemId) ?? null;
}
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? "";
}
function getAbilityModifierNumber(abilityId) {
  const el = document.getElementById(abilityId);
  if (!el) return 0;

  const value = Number(el.value);
  return Number.isFinite(value) ? value : 0;
}
function getBaseAttackBonusNumber() {
  const el = document.getElementById("baseAttackBonusTotal");
  if (!el) return 0;

  const value = Number(el.value);
  return Number.isFinite(value) ? value : 0;
}
function getSizeModifierNumber() {
  const el = document.getElementById("acSizeMod");
  if (!el) return 0;

  const value = Number(el.value);
  return Number.isFinite(value) ? value : 0;
}
function calculateWeaponAttackBonus(item) {
  const bab = getBaseAttackBonusNumber();
  const sizeMod = getSizeModifierNumber();

  const usesDex = item?.combat_type === "ranged";

  const abilityMod = usesDex
    ? getAbilityModifierNumber("dexMod")
    : getAbilityModifierNumber("strMod");

  return bab + abilityMod + sizeMod;
}
function getWeaponAmmunitionLabel(item) {
  if (!item) return "";

  const name = String(item.name ?? "").toLowerCase();

  if (name.includes("crossbow")) return "Bolts";
  if (name.includes("longbow") || name.includes("shortbow")) return "Arrows";
  if (name.includes("sling")) return "Bullets";
  if (name.includes("dart")) return "Darts";
  if (name.includes("javelin")) return "Javelins";
  if (name.includes("shuriken")) return "Shuriken";
  if (name.includes("net")) return "Net";
  if (name.includes("bolas")) return "Bolas";

  return "-";
}
function fillWeaponFields(prefix, item) {
  if (!item) {
    setInputValue(`${prefix}AttackBonus`, "");
    setInputValue(`${prefix}Damage`, "");
    setInputValue(`${prefix}Critical`, "");
    setInputValue(`${prefix}Range`, "");
    setInputValue(`${prefix}Type`, "");
    setInputValue(`${prefix}Ammunition`, "");
    return;
  }

  const damageValue = safeText(item.damage?.medium, "");
  const criticalValue = safeText(item.critical, "");
  const rangeValue = safeText(item.range_increment, "");
  const typeValue = Array.isArray(item.damage_type)
    ? item.damage_type.join(", ")
    : "";
  const ammunitionValue = getWeaponAmmunitionLabel(item);
  const attackBonusValue = calculateWeaponAttackBonus(item);

  setInputValue(`${prefix}AttackBonus`, attackBonusValue);
  setInputValue(`${prefix}Damage`, damageValue);
  setInputValue(`${prefix}Critical`, criticalValue);
  setInputValue(`${prefix}Range`, rangeValue);
  setInputValue(`${prefix}Type`, typeValue);
  setInputValue(`${prefix}Ammunition`, ammunitionValue);
}
function fillArmorFields(item) {
  if (!item) {
    setInputValue("armorType", "");
    setInputValue("armorACBonus", "");
    setInputValue("armorMaxDex", "");
    setInputValue("armorCheckPenalty", "");
    setInputValue("armorSpellFailure", "");
    setInputValue("armorSpeed", "");
    setInputValue("armorWeight", "");
    setInputValue("armorProperties", "");
    
    syncEquipmentToAC();
    return;
  }

  const category = String(item.category ?? "").toLowerCase();
  let armorTypeLabel = "";

  if (category === "light_armor") armorTypeLabel = "Light Armor";
  else if (category === "medium_armor") armorTypeLabel = "Medium Armor";
  else if (category === "heavy_armor") armorTypeLabel = "Heavy Armor";
  else armorTypeLabel = safeText(toTitleCase(item.category), "");

  setInputValue("armorType", armorTypeLabel);
  setInputValue("armorACBonus", safeText(item.armor_bonus, ""));
  setInputValue("armorMaxDex", safeText(item.max_dex_bonus, ""));
  setInputValue("armorCheckPenalty", safeText(item.armor_check_penalty, ""));
  setInputValue(
    "armorSpellFailure",
    item.arcane_spell_failure !== null &&
      item.arcane_spell_failure !== undefined &&
      item.arcane_spell_failure !== ""
      ? Math.round(Number(item.arcane_spell_failure) * 100)
      : ""
  );
  setInputValue("armorSpeed", safeText(item.speed?.speed_30ft, ""));
  setInputValue("armorWeight", safeText(item.weight, ""));
  setInputValue("armorProperties", "");
  
  syncEquipmentToAC();
}
function fillShieldFields(item) {
  if (!item) {
    setInputValue("shieldType", "");
    setInputValue("shieldACBonus", "");
    setInputValue("shieldCheckPenalty", "");
    setInputValue("shieldSpellFailure", "");
    setInputValue("shieldWeight", "");
    setInputValue("shieldProperties", "");
    
    syncEquipmentToAC();
    return;
  }

  const lowerName = String(item.name ?? "").toLowerCase();
  let shieldType = "";

  if (lowerName.includes("buckler")) {
    shieldType = "Buckler";
  } else if (lowerName.includes("tower")) {
    shieldType = "Tower Shield";
  } else if (lowerName.includes("light")) {
    shieldType = "Light Shield";
  } else if (lowerName.includes("heavy")) {
    shieldType = "Heavy Shield";
  } else {
    shieldType = "Shield";
  }

  const props = [];
  if (lowerName.includes("wooden")) props.push("Wooden");
  if (lowerName.includes("steel")) props.push("Steel");

  const shieldSpellFailure =
    item.arcane_spell_failure !== null &&
    item.arcane_spell_failure !== undefined &&
    item.arcane_spell_failure !== ""
      ? Math.round(Number(item.arcane_spell_failure) * 100)
      : "";

  setInputValue("shieldType", shieldType);
  setInputValue("shieldACBonus", safeText(item.armor_bonus, ""));
  setInputValue("shieldCheckPenalty", safeText(item.armor_check_penalty, ""));
  setInputValue("shieldSpellFailure", shieldSpellFailure);
  setInputValue("shieldWeight", safeText(item.weight, ""));
  setInputValue("shieldProperties", props.join(" | "));
  
  syncEquipmentToAC();
}
function bindEquipmentSelectionListeners() {
  document
    .getElementById("weaponOneSelect")
    ?.addEventListener("change", function () {
      fillWeaponFields("weaponOne", getInventoryItemById(this.value));
    });

  document
    .getElementById("weaponTwoSelect")
    ?.addEventListener("change", function () {
      fillWeaponFields("weaponTwo", getInventoryItemById(this.value));
    });

  document
    .getElementById("armorSelect")
    ?.addEventListener("change", function () {
      fillArmorFields(getInventoryItemById(this.value));
    });

  document
    .getElementById("shieldSelect")
    ?.addEventListener("change", function () {
      fillShieldFields(getInventoryItemById(this.value));
    });
}
function bindInventoryStoreEventListeners() {
  document
    .getElementById("inventory-search")
    ?.addEventListener("input", applyCurrentViewFilters);

  document
    .getElementById("inventory-filter")
    ?.addEventListener("change", applyCurrentViewFilters);

  document
    .getElementById("inventory-sort")
    ?.addEventListener("change", applyCurrentViewFilters);

  document
    .getElementById("inventory-detail-close")
    ?.addEventListener("click", hideDetailPanel);

  document
    .querySelectorAll(".inventory-navigation-item[data-view]")
    .forEach((btn) => {
      btn.addEventListener("click", () => setActiveView(btn.dataset.view));
    });

  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-close]");
    if (closeBtn && closeBtn.dataset.close === "inventory") {
      CloseInventoryModal();
      return;
    }

    const nav = e.target.closest("[data-nav]");
    if (!nav) return;

    if (
      nav.dataset.nav === "close" ||
      nav.dataset.nav === "back-to-character"
    ) {
      CloseInventoryModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("inventory-modal");
      if (modal?.classList.contains("is-open")) {
        CloseInventoryModal();
      }
    }
  });
}
function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[^\d\-]/g, "");
  return parseInt(cleaned, 10) || 0;
}
function getEquippedArmorAndShield() {
  const equippedItems = inventoryData.filter(item => item && item.equipped);

  let equippedArmor = null;
  let equippedShield = null;

  for (const item of equippedItems) {
    const category = String(item.category || item.type || "").toLowerCase();
    const subcategory = String(item.subcategory || "").toLowerCase();
    const slot = String(item.slot || "").toLowerCase();
    const armorType = String(item.armorType || "").toLowerCase();

    const isShield =
      category.includes("shield") ||
      subcategory.includes("shield") ||
      slot === "shield" ||
      armorType === "shield";

    const isArmor =
      category.includes("armor") ||
      subcategory.includes("armor") ||
      slot === "armor" ||
      [
        "light armor",
        "medium armor",
        "heavy armor"
      ].includes(armorType);

    if (isShield && !equippedShield) {
      equippedShield = item;
      continue;
    }

    if (isArmor && !isShield && !equippedArmor) {
      equippedArmor = item;
    }
  }

  return { equippedArmor, equippedShield };
}
function updateACFromEquippedGear() {
  const armorBonusField = document.getElementById("armorBonus");
  const shieldBonusField = document.getElementById("shieldBonus");
  const armorCheckPenaltyField = document.getElementById("armorCheckPenaltyModifier");
  const arcaneSpellFailureField = document.getElementById("arcaneSpellFailureModifier");
  const armorTypeField = document.getElementById("armorType");

  if (!armorBonusField || !shieldBonusField || !armorCheckPenaltyField || !arcaneSpellFailureField || !armorTypeField) {
    console.warn("One or more AC gear fields were not found.");
    return;
  }

  const { equippedArmor, equippedShield } = getEquippedArmorAndShield();

  const armorBonus = equippedArmor
    ? normalizeNumber(
        equippedArmor.acBonus ??
        equippedArmor.armorBonus ??
        equippedArmor.bonus ??
        equippedArmor.ac
      )
    : 0;

  const shieldBonus = equippedShield
    ? normalizeNumber(
        equippedShield.acBonus ??
        equippedShield.shieldBonus ??
        equippedShield.bonus ??
        equippedShield.ac
      )
    : 0;

  const armorCheckPenaltyArmor = equippedArmor
    ? normalizeNumber(
        equippedArmor.armorCheckPenalty ??
        equippedArmor.checkPenalty ??
        equippedArmor.acp
      )
    : 0;

  const armorCheckPenaltyShield = equippedShield
    ? normalizeNumber(
        equippedShield.armorCheckPenalty ??
        equippedShield.checkPenalty ??
        equippedShield.acp
      )
    : 0;

  const arcaneFailureArmor = equippedArmor
    ? normalizeNumber(
        equippedArmor.arcaneSpellFailure ??
        equippedArmor.spellFailure ??
        equippedArmor.asf
      )
    : 0;

  const arcaneFailureShield = equippedShield
    ? normalizeNumber(
        equippedShield.arcaneSpellFailure ??
        equippedShield.spellFailure ??
        equippedShield.asf
      )
    : 0;

  armorBonusField.value = armorBonus;
  shieldBonusField.value = shieldBonus;
  armorCheckPenaltyField.value = armorCheckPenaltyArmor + armorCheckPenaltyShield;
  arcaneSpellFailureField.value = `${arcaneFailureArmor + arcaneFailureShield}%`;

  if (equippedArmor && equippedShield) {
    armorTypeField.value = `${equippedArmor.name || "Armor"} + ${equippedShield.name || "Shield"}`;
  } else if (equippedArmor) {
    armorTypeField.value = equippedArmor.name || "Armor";
  } else if (equippedShield) {
    armorTypeField.value = equippedShield.name || "Shield";
  } else {
    armorTypeField.value = "";
  }

  updateACTotal();
}
function syncEquipmentToAC() {
  console.log("syncEquipmentToAC() running");

  const armorAC = parseInt(document.getElementById("armorACBonus")?.value, 10) || 0;
  const shieldAC = parseInt(document.getElementById("shieldACBonus")?.value, 10) || 0;

  const armorCheck = parseInt(document.getElementById("armorCheckPenalty")?.value, 10) || 0;
  const shieldCheck = parseInt(document.getElementById("shieldCheckPenalty")?.value, 10) || 0;

  const armorSpell = parseInt(document.getElementById("armorSpellFailure")?.value, 10) || 0;
  const shieldSpell = parseInt(document.getElementById("shieldSpellFailure")?.value, 10) || 0;

  // Push into AC system
  document.getElementById("armorBonus").value = armorAC;
  document.getElementById("shieldBonus").value = shieldAC;

  document.getElementById("armorCheckPenaltyModifier").value = armorCheck + shieldCheck;
  document.getElementById("arcaneSpellFailureModifier").value = (armorSpell + shieldSpell) + "%";

  updateACTotal();
}

// End Function Section

/************************************************************
                    END INVENTORY SECTION
************************************************************/

window.addEventListener("DOMContentLoaded", function () {
  initializeHeaderSection();
  updateEntireAbilitySystem();
  updateClassLevelDerivedFields();
  updateAllSavingThrows();
  updateAllSkills();
  attachSkillRankEvents();
  bindInventoryStoreEventListeners();
  bindEquipmentSelectionListeners();
  loadStoreAndInventoryData();
  updateEquipmentDropdowns();

  const classSelect = document.getElementById("classSelect");
  const levelSelect = document.getElementById("levelSelect");

  if (classSelect) {
    classSelect.addEventListener("change", handleClassChange);
  }

  if (levelSelect) {
    levelSelect.addEventListener("change", handleLevelChange);
  }
});

loadCharacter();