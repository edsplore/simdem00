export const mapLevelToCode = (level: string): string => {
  switch (level) {
    case "Level 01":
      return "lvl1";
    case "Level 02":
      return "lvl2";
    case "Level 03":
      return "lvl3";
    default:
      return level.toLowerCase();
  }
};
