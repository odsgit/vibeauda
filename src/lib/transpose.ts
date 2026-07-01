import type { MidiNote, Part, SheetData } from '../types/sheet';

export interface TransposeResult {
  data: SheetData;
  guide?: string;
}

/* ─── Fretboard constants ────────────────────────────── */

const GUITAR_OPEN = [64, 59, 55, 50, 45, 40]; // E4 B3 G3 D3 A2 E2 (str 1→6)
const BASS_OPEN = [43, 38, 33, 28]; //            G2 D2 A1 E1 (str 1→4)
const MAX_FRET = 24;

/* ─── Internal utilities ─────────────────────────────── */

function midiToTabPos(midi: number, tuning: number[]): { str: number; fret: number } {
  const found = tuning
    .map((open, i) => ({ str: i + 1, fret: midi - open }))
    .find(({ fret }) => fret >= 0 && fret <= MAX_FRET);
  return found ?? { str: tuning.length, fret: Math.max(0, midi - tuning[tuning.length - 1]) };
}

function shiftTabNote(note: MidiNote, delta: number, tuning: number[]): MidiNote {
  const minPitch = tuning[tuning.length - 1];
  let pitch = note.pitch + delta;

  if (pitch < minPitch) {
    pitch += 12;
  }

  const pos = midiToTabPos(pitch, tuning);
  return { ...note, pitch, string: pos.str - 1, fret: pos.fret };
}

function detectGuide(originalPitch: number, delta: number, tuning: number[]): string | undefined {
  const minPitch = tuning[tuning.length - 1];
  const shifted = originalPitch + delta;
  if (shifted >= minPitch) return undefined;
  const afterOctaveUp = shifted + 12;
  if (afterOctaveUp >= minPitch) return undefined;

  // One octave up is not enough
  if (minPitch - afterOctaveUp <= 2) {
    return 'Drop D 튜닝 필요 — 6번 현을 E→D로 낮추면 해결됩니다';
  }
  if (delta > 0) {
    return `카포 ${delta}번 사용 시 원래 코드 폼으로 연주 가능합니다`;
  }
  return '범위 초과 — 튜닝 조정이 필요합니다';
}

/* ─── Public API ─────────────────────────────────────── */

export function transposeKey(
  sheetData: SheetData,
  part: Part,
  deltaSemitones: number,
): TransposeResult {
  if (deltaSemitones === 0 || part === 'drum') {
    return { data: sheetData };
  }

  if (part === 'vocal' || part === 'synth') {
    return {
      data: {
        ...sheetData,
        notes: sheetData.notes.map((n) => ({ ...n, pitch: n.pitch + deltaSemitones })),
      },
    };
  }

  // guitar1 / guitar2 / bass — fretboard re-mapping
  const tuning = part === 'bass' ? BASS_OPEN : GUITAR_OPEN;

  const guides = new Set<string>(
    sheetData.notes
      .map((n) => detectGuide(n.pitch, deltaSemitones, tuning))
      .filter((g): g is string => g !== undefined),
  );

  const notes: MidiNote[] = sheetData.notes.map((n) => shiftTabNote(n, deltaSemitones, tuning));

  return {
    data: { ...sheetData, notes },
    guide: guides.size > 0 ? [...guides].join(' / ') : undefined,
  };
}
