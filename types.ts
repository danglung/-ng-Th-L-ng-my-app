
export enum VoiceType {
  NORTH_FEMALE = 'Kore',
  SOUTH_FEMALE = 'Puck',
  MALE = 'Charon',
  NATURAL_AI = 'Zephyr',
  STRONG_MALE = 'Fenrir',
  LYRICAL_FEMALE = 'Aoede',
  SERIOUS_FEMALE = 'Ananke',
  YOUNG_MALE = 'Arcas'
}

export interface VoiceOption {
  id: VoiceType;
  label: string;
  description: string;
}

export interface AudioResult {
  blob: Blob;
  url: string;
  voiceName: string;
  duration: number;
}
