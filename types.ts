
export enum AppState {
  IDLE,
  ANALYZING,
  FETCHING_HISTORY,
  GENERATING_AUDIO,
  RESULT,
  ERROR,
}

export interface LandmarkInfo {
  name: string;
  location: string;
  description: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}
