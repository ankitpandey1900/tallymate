export const GROUP_TYPE_LABELS: Record<string, string> = {
  TRIP: "Trip",
  FAMILY: "Family",
  FLATMATES: "Roommates",
  COUPLE: "Couple",
  FRIENDS: "Friends",
  CUSTOM: "Other",
};

export function formatGroupType(type: string) {
  return GROUP_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}
