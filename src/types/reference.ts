export interface SpellSearchParams {
  name?: string;
  level?: number;
  class?: string;
  school?: string;
  concentration?: boolean;
  ritual?: boolean;
  campaignId?: number;
  rulesVersion?: "2014" | "2024" | "all";
}

export interface MonsterSearchParams {
  name?: string;
  cr?: number;
  type?: string;
  size?: string;
  environment?: string;
  page?: number;
  showHomebrew?: boolean;
  source?: string;
}

export interface ItemSearchParams {
  name?: string;
  rarity?: string;
  type?: string;
  attunement?: boolean;
  campaignId?: number;
}

export interface FeatSearchParams {
  name?: string;
  prerequisite?: string;
  campaignId?: number;
}

export interface RaceSearchParams {
  name?: string;
  campaignId?: number;
}

export interface BackgroundSearchParams {
  name?: string;
  campaignId?: number;
}

export interface ClassFeatureSearchParams {
  name?: string;
  className?: string;
  level?: number;
  campaignId?: number;
}

export interface RacialTraitSearchParams {
  name?: string;
  raceName?: string;
  campaignId?: number;
}
