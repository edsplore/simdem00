export const mapLevelToCode = (level: string): string => {
  const normalized = level.toLowerCase().replace(/\s+/g, "");
  switch (normalized) {
    case "level01":
    case "level1":
    case "1":
    case "lvl1":
      return "lvl1";
    case "level02":
    case "level2":
    case "2":
    case "lvl2":
      return "lvl2";
    case "level03":
    case "level3":
    case "3":
    case "lvl3":
      return "lvl3";
    default:
      return normalized;
  }
};
