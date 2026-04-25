/**
 * Enum option lists for Profile / Preferences — emoji + slug.
 * Mirrors iOS `UserProfile.*` enums so labels stay in sync.
 * Display labels come from i18n via `t(\`profile.${kind}.${slug}\`)`.
 */

export type EnumOption = { value: string; emoji: string };

export const GOAL_OPTIONS: EnumOption[] = [
  { value: 'lose_fat', emoji: '🔥' },
  { value: 'gain_muscle', emoji: '💪' },
  { value: 'maintain_weight', emoji: '⚖️' },
  { value: 'eat_healthier', emoji: '🥗' },
  { value: 'medical_diet', emoji: '🏥' },
];

export const DIET_OPTIONS: EnumOption[] = [
  { value: 'no_restrictions', emoji: '🍽' },
  { value: 'vegetarian', emoji: '🥬' },
  { value: 'vegan', emoji: '🌱' },
  { value: 'keto', emoji: '🥑' },
  { value: 'paleo', emoji: '🦴' },
  { value: 'gluten_free', emoji: '🚫' },
  { value: 'dairy_free', emoji: '🥛' },
];

export const CUISINE_OPTIONS: EnumOption[] = [
  { value: 'any', emoji: '🌍' },
  { value: 'asian', emoji: '🍜' },
  { value: 'mediterranean', emoji: '🫒' },
  { value: 'american', emoji: '🍔' },
  { value: 'mexican', emoji: '🌮' },
  { value: 'italian', emoji: '🍝' },
  { value: 'middle_eastern', emoji: '🧆' },
];

export const COOKING_LEVEL_OPTIONS: EnumOption[] = [
  { value: 'beginner', emoji: '🌱' },
  { value: 'home_cook', emoji: '🏠' },
  { value: 'advanced', emoji: '⭐' },
  { value: 'chef', emoji: '👨‍🍳' },
];

export const COOKING_TIME_OPTIONS: EnumOption[] = [
  { value: 'quick', emoji: '⚡' },
  { value: 'medium', emoji: '⏱' },
  { value: 'long', emoji: '🕐' },
  { value: 'any', emoji: '♾️' },
];
