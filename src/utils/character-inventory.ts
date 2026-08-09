import type { DdbCharacter, DdbInventoryItem } from "../types/character.js";

const CUSTOM_ITEM_NAME_TYPE_ID = 8;

export function getInventoryDisplayName(
  char: DdbCharacter,
  item: DdbInventoryItem
): string {
  const customName = char.characterValues?.find(
    (value) => value.typeId === CUSTOM_ITEM_NAME_TYPE_ID
      && String(value.valueId) === String(item.id)
      && typeof value.value === "string"
      && value.value.trim().length > 0
  )?.value;

  return typeof customName === "string" ? customName.trim() : item.definition.name;
}

export function formatInventoryItemLabel(
  char: DdbCharacter,
  item: DdbInventoryItem
): string {
  const quantity = item.quantity > 1 ? ` (x${item.quantity})` : "";
  const attunement = item.isAttuned ? " [attuned]" : "";
  return `${getInventoryDisplayName(char, item)}${quantity}${attunement}`;
}
