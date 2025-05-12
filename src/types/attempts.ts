interface CoordinatesInterface {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SettingsInterface {
  timeoutDuration: number;
  highlightColor: string;
  font: string;
  fontSize: number;
  buttonColor: string;
  // Add any other optional settings keys
}

export interface AttemptInterface {
  id: string;
  type: string;
  name?: string | null;
  role?: string | null;
  hotspotType?: string | null;
  coordinates?: CoordinatesInterface | null;
  text?: string | null;
  x_coordinates?: number;
  y_coordinates?: number;
  length?: number;
  options?: any[];
  settings?: SettingsInterface;
}
