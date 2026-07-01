export interface MidiNote {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
  string?: number; // 0-indexed, 0 = highest string (guitar/bass TAB)
  fret?: number;
}

export interface SheetData {
  bpm: number;
  timeSignature: [number, number];
  notes: MidiNote[];
}

export type Part = 'vocal' | 'guitar1' | 'guitar2' | 'bass' | 'drum' | 'synth';

export interface SheetViewProps {
  data: SheetData;
  part: Part;
  width?: number;
}

export interface LyricLine {
  text: string;
  startTime: number;
  endTime: number;
}

export interface ChordEvent {
  name: string;
  startTime: number;
  duration: number;
}
