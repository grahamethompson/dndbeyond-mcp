export interface DdbCharacter {
  id: number;
  readonlyUrl: string;
  name: string;
  race: DdbRace;
  classes: DdbClass[];
  background: DdbBackground;
  stats: DdbAbilityScore[];
  bonusStats: DdbAbilityScore[];
  overrideStats: DdbAbilityScore[];
  baseHitPoints: number;
  bonusHitPoints: number | null;
  overrideHitPoints: number | null;
  removedHitPoints: number;
  temporaryHitPoints: number;
  currentXp: number;
  alignmentId: number;
  lifestyleId: number;
  currencies: DdbCurrencies;
  spells: DdbSpellsContainer;
  classSpells?: Array<{
    entityTypeId: number;
    characterClassId: number;
    spells: DdbSpell[];
  }>;
  inventory: DdbInventoryItem[];
  deathSaves: DdbDeathSaves;
  traits: DdbTraits;
  preferences: Record<string, unknown>;
  configuration: Record<string, unknown>;
  actions: Record<string, DdbAction[]>;
  modifiers: Record<string, DdbModifier[]>;
  campaign: { id: number; name: string } | null;
  feats: DdbFeat[];
  notes: DdbNotes;
  options?: Record<string, DdbCharacterOption[] | null>;
  customProficiencies?: DdbCustomProficiency[];
  characterValues?: DdbCharacterValue[];
  level?: number;
  pactMagic?: {
    level: number;
    used: number;
    available: number;
  } | Array<{
    level: number;
    used: number;
    available: number;
  }> | null;
  spellSlots?: Array<{
    level: number;
    used: number;
    available: number;
  }>;
  hitDiceUsed?: number;
}

export interface DdbRace {
  fullName: string;
  baseRaceName: string;
  isHomebrew: boolean;
  racialTraits: DdbRacialTrait[];
  weightSpeeds?: {
    normal?: { walk?: number; fly?: number; burrow?: number; swim?: number; climb?: number };
  };
}

export interface DdbClass {
  id: number;
  definition: { id: number; name: string };
  subclassDefinition: { name: string; classFeatures: DdbClassFeature[] } | null;
  level: number;
  isStartingClass: boolean;
  classFeatures: DdbClassFeature[];
  hitDiceUsed?: number;
}

export interface DdbBackground {
  definition: {
    id?: number;
    definitionKey?: string;
    name: string;
    description: string;
    featureName: string | null;
    featureDescription: string | null;
    snippet: string | null;
    skillProficienciesDescription: string | null;
    toolProficienciesDescription: string | null;
    equipmentDescription: string | null;
  } | null;
}

export interface DdbAbilityScore {
  id: number; // 1=STR, 2=DEX, 3=CON, 4=INT, 5=WIS, 6=CHA
  value: number | null;
}

export interface DdbCurrencies {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface DdbSpellsContainer {
  race: DdbSpell[] | null;
  class: DdbSpell[] | null;
  background: DdbSpell[] | null;
  item: DdbSpell[] | null;
  feat: DdbSpell[] | null;
}

export interface DdbSpell {
  id: number;
  definition: {
    id?: number;
    definitionKey?: string;
    name: string;
    level: number;
    school: string;
    description: string;
    range: {
      origin: string;
      rangeValue: number | null;
      aoeType: string | null;
      aoeValue: number | null;
    } | null;
    duration: {
      durationInterval: number | null;
      durationUnit: string | null; // "Hour", "Minute", etc.
      durationType: string; // "Concentration" or "Time"
    } | null;
    activation: {
      activationTime: number;
      activationType: number; // 1=Action, 3=Bonus Action, 6=Reaction
    } | null;
    components: number[] | null; // 1=V, 2=S, 3=M
    componentsDescription: string | null;
    concentration: boolean;
    ritual: boolean;
    isLegacy?: boolean;
    sources?: Array<{ sourceId: number; pageNumber?: number | null; sourceType?: number }>;
  };
  prepared: boolean;
  alwaysPrepared: boolean;
  usesSpellSlot: boolean;
}

export interface DdbInventoryItem {
  id: number;
  definition: {
    name: string;
    description: string;
    type: string;
    rarity: string;
    weight: number;
    cost: number | null;
    isHomebrew: boolean;
    armorClass?: number | null;
    filterType?: string;
    armorTypeId?: number | null;
    baseArmorName?: string | null;
  };
  equipped: boolean;
  isAttuned?: boolean;
  quantity: number;
}

export interface DdbCharacterOption {
  componentId?: number;
  componentTypeId?: number;
  definition: {
    id?: number;
    name: string;
    description?: string | null;
    snippet?: string | null;
  };
}

export interface DdbCustomProficiency {
  id?: number;
  name: string;
  type: number;
  statId?: number | null;
  proficiencyLevel?: number;
}

export interface DdbCharacterValue {
  typeId: number;
  value: string | number | null;
  valueId: string | number;
  valueTypeId?: string | number;
}

export interface DdbDeathSaves {
  failCount: number | null;
  successCount: number | null;
  isStabilized: boolean;
}

export interface DdbTraits {
  personalityTraits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  appearance: string | null;
}

export interface DdbLimitedUse {
  maxUses: number;
  numberUsed: number;
  resetType: number; // 1 = Short Rest, 2 = Long Rest, 3 = Dawn, 4 = Other
  resetTypeDescription: string;
}

export interface DdbAction {
  id: number;
  entityTypeId: number;
  name: string;
  componentId: number;
  componentTypeId: number;
  limitedUse: DdbLimitedUse | null;
}

export interface DdbModifier {
  id: string | number;
  type: string;
  subType: string;
  value: number | null;
  friendlyTypeName: string;
  friendlySubtypeName: string;
  componentId: number;
  componentTypeId: number;
}

export interface DdbFeat {
  definition: {
    name: string;
    description: string;
    snippet: string | null;
    prerequisite: string | null;
  };
  componentId: number;
  componentTypeId: number;
}

export interface DdbClassFeature {
  // Class features nest under .definition; subclass features are flat
  definition?: {
    name: string;
    requiredLevel: number;
    description: string;
    snippet: string | null;
  };
  // Flat fields (subclass features)
  name?: string;
  requiredLevel?: number;
  description?: string;
}

export interface DdbRacialTrait {
  definition: {
    name: string;
    description: string;
    snippet: string | null;
  };
}

export interface DdbNotes {
  personalPossessions: string | null;
  backstory: string | null;
  otherNotes: string | null;
  allies: string | null;
  organizations: string | null;
}

export interface CharacterSummary {
  id: number;
  name: string;
  race: string;
  classes: string;
  level: number;
  hp: { current: number; max: number; temp: number };
  ac: number;
  campaignName: string | null;
}
