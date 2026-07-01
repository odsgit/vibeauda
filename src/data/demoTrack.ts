import type { ChordEvent, LyricLine, SheetData } from '../types/sheet';

const BPM = 120;
const TS: [number, number] = [4, 4];
const beat = 60 / BPM; // 0.5s
const bar = TS[0] * beat; // 2.0s

export const DEMO_CHORDS: ChordEvent[] = [
  { name: 'Am', startTime: 0, duration: bar },
  { name: 'G', startTime: bar, duration: bar },
  { name: 'C', startTime: bar * 2, duration: bar },
  { name: 'Em', startTime: bar * 3, duration: bar },
];

export const DEMO_LYRICS: LyricLine[] = [
  { text: '어둠이 내린 하늘 아래서', startTime: 0, endTime: bar * 2 },
  { text: '별빛을 찾아 헤매이네', startTime: bar * 2, endTime: bar * 4 },
  { text: '너의 목소리가 들려오는 듯', startTime: bar * 4, endTime: bar * 6 },
  { text: '여기 서서 기다리고 있어', startTime: bar * 6, endTime: bar * 8 },
];

export const DEMO_VOCAL: SheetData = {
  bpm: BPM,
  timeSignature: TS,
  notes: [
    // Measure 1 – Am: A4 C5 B4 A4 (quarter notes)
    { pitch: 69, startTime: 0, duration: beat, velocity: 80 },
    { pitch: 72, startTime: beat, duration: beat, velocity: 80 },
    { pitch: 71, startTime: beat * 2, duration: beat, velocity: 80 },
    { pitch: 69, startTime: beat * 3, duration: beat, velocity: 80 },
    // Measure 2 – G: G4 half, A4 half
    { pitch: 67, startTime: bar, duration: beat * 2, velocity: 80 },
    { pitch: 69, startTime: bar + beat * 2, duration: beat * 2, velocity: 80 },
    // Measure 3 – C: C5 B4 A4 (quarter quarter half)
    { pitch: 72, startTime: bar * 2, duration: beat, velocity: 80 },
    { pitch: 71, startTime: bar * 2 + beat, duration: beat, velocity: 80 },
    { pitch: 69, startTime: bar * 2 + beat * 2, duration: beat * 2, velocity: 80 },
    // Measure 4 – Em: E4 whole
    { pitch: 64, startTime: bar * 3, duration: bar, velocity: 80 },
  ],
};

export const DEMO_GUITAR1: SheetData = {
  bpm: BPM,
  timeSignature: TS,
  notes: [
    // Measure 1 – Am arpeggio: A3 E4 A4 C5
    { pitch: 57, startTime: 0, duration: beat, velocity: 70 },
    { pitch: 64, startTime: beat, duration: beat, velocity: 70 },
    { pitch: 69, startTime: beat * 2, duration: beat, velocity: 70 },
    { pitch: 72, startTime: beat * 3, duration: beat, velocity: 70 },
    // Measure 2 – G arpeggio: G3 D4 G4 B4
    { pitch: 55, startTime: bar, duration: beat, velocity: 70 },
    { pitch: 62, startTime: bar + beat, duration: beat, velocity: 70 },
    { pitch: 67, startTime: bar + beat * 2, duration: beat, velocity: 70 },
    { pitch: 71, startTime: bar + beat * 3, duration: beat, velocity: 70 },
    // Measure 3 – C arpeggio: C4 G4 C5 E5
    { pitch: 60, startTime: bar * 2, duration: beat, velocity: 70 },
    { pitch: 67, startTime: bar * 2 + beat, duration: beat, velocity: 70 },
    { pitch: 72, startTime: bar * 2 + beat * 2, duration: beat, velocity: 70 },
    { pitch: 76, startTime: bar * 2 + beat * 3, duration: beat, velocity: 70 },
    // Measure 4 – Em arpeggio: E3 B3 E4 G4
    { pitch: 52, startTime: bar * 3, duration: beat, velocity: 70 },
    { pitch: 59, startTime: bar * 3 + beat, duration: beat, velocity: 70 },
    { pitch: 64, startTime: bar * 3 + beat * 2, duration: beat, velocity: 70 },
    { pitch: 67, startTime: bar * 3 + beat * 3, duration: beat, velocity: 70 },
  ],
};

export const DEMO_GUITAR2: SheetData = {
  bpm: BPM,
  timeSignature: TS,
  notes: [
    // Power-chord roots on beat 1 and 3 (half notes)
    { pitch: 57, startTime: 0, duration: beat * 2, velocity: 75 }, // Am: A3
    { pitch: 57, startTime: beat * 2, duration: beat * 2, velocity: 75 }, // Am: A3
    { pitch: 55, startTime: bar, duration: beat * 2, velocity: 75 }, // G: G3
    { pitch: 55, startTime: bar + beat * 2, duration: beat * 2, velocity: 75 },
    { pitch: 60, startTime: bar * 2, duration: beat * 2, velocity: 75 }, // C: C4
    { pitch: 60, startTime: bar * 2 + beat * 2, duration: beat * 2, velocity: 75 },
    { pitch: 52, startTime: bar * 3, duration: beat * 2, velocity: 75 }, // Em: E3
    { pitch: 52, startTime: bar * 3 + beat * 2, duration: beat * 2, velocity: 75 },
  ],
};

export const DEMO_BASS: SheetData = {
  bpm: BPM,
  timeSignature: TS,
  notes: [
    { pitch: 45, startTime: 0, duration: bar, velocity: 85 }, // A2 whole – Am
    { pitch: 43, startTime: bar, duration: bar, velocity: 85 }, // G2 whole – G
    { pitch: 48, startTime: bar * 2, duration: bar, velocity: 85 }, // C3 whole – C
    { pitch: 40, startTime: bar * 3, duration: bar, velocity: 85 }, // E2 whole – Em
  ],
};

export const DEMO_DRUM: SheetData = {
  bpm: BPM,
  timeSignature: TS,
  notes: [0, 1, 2, 3].flatMap((m) => [
    { pitch: 36, startTime: bar * m, duration: beat, velocity: 90 }, // kick  beat 1
    { pitch: 38, startTime: bar * m + beat, duration: beat, velocity: 80 }, // snare beat 2
    { pitch: 36, startTime: bar * m + beat * 2, duration: beat, velocity: 90 }, // kick  beat 3
    { pitch: 38, startTime: bar * m + beat * 3, duration: beat, velocity: 80 }, // snare beat 4
  ]),
};

export const DEMO_SYNTH: SheetData = {
  bpm: BPM,
  timeSignature: TS,
  notes: [
    // Sustained whole notes per chord, one octave above bass
    { pitch: 57, startTime: 0, duration: bar, velocity: 60 }, // A3 – Am
    { pitch: 55, startTime: bar, duration: bar, velocity: 60 }, // G3 – G
    { pitch: 60, startTime: bar * 2, duration: bar, velocity: 60 }, // C4 – C
    { pitch: 52, startTime: bar * 3, duration: bar, velocity: 60 }, // E3 – Em
  ],
};
