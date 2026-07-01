import { describe, it, expect } from 'vitest';
import { transposeKey } from './transpose';
import type { SheetData } from '../types/sheet';

/* ─── Fixtures ───────────────────────────────────────── */

const baseSheet: SheetData = {
  bpm: 120,
  timeSignature: [4, 4],
  notes: [
    { pitch: 60, startTime: 0, duration: 0.5, velocity: 80 }, // C4
    { pitch: 64, startTime: 0.5, duration: 0.5, velocity: 80 }, // E4
  ],
};

function sheet(pitches: number[]): SheetData {
  return {
    bpm: 120,
    timeSignature: [4, 4],
    notes: pitches.map((p, i) => ({ pitch: p, startTime: i * 0.5, duration: 0.5, velocity: 70 })),
  };
}

/* ─── Tests ──────────────────────────────────────────── */

describe('transposeKey — no-op cases', () => {
  it('delta=0 returns the exact same SheetData reference', () => {
    const result = transposeKey(baseSheet, 'vocal', 0);
    expect(result.data).toBe(baseSheet);
    expect(result.guide).toBeUndefined();
  });

  it('drum part is never transposed regardless of delta', () => {
    const drumSheet = sheet([36, 38, 36, 38]);
    const result = transposeKey(drumSheet, 'drum', 5);
    expect(result.data).toBe(drumSheet);
    expect(result.guide).toBeUndefined();
  });
});

describe('transposeKey — vocal / synth (parallel pitch shift)', () => {
  it('vocal: all pitches shifted up by delta', () => {
    const result = transposeKey(baseSheet, 'vocal', 3);
    expect(result.data.notes.map((n) => n.pitch)).toEqual([63, 67]);
    expect(result.guide).toBeUndefined();
  });

  it('synth: all pitches shifted down by delta', () => {
    const result = transposeKey(baseSheet, 'synth', -2);
    expect(result.data.notes.map((n) => n.pitch)).toEqual([58, 62]);
    expect(result.guide).toBeUndefined();
  });

  it('does not mutate the original SheetData', () => {
    const originalPitch = baseSheet.notes[0].pitch;
    transposeKey(baseSheet, 'vocal', 5);
    expect(baseSheet.notes[0].pitch).toBe(originalPitch);
  });

  it('non-pitch fields (startTime, duration, velocity) are preserved', () => {
    const result = transposeKey(baseSheet, 'vocal', 1);
    expect(result.data.notes[0].startTime).toBe(0);
    expect(result.data.notes[0].duration).toBe(0.5);
    expect(result.data.notes[0].velocity).toBe(80);
  });
});

describe('transposeKey — guitar (TAB fretboard re-mapping)', () => {
  it('guitar1 +2: pitch and fret/string updated correctly', () => {
    // E4 (64) +2 → F#4 (66): string 1, fret 2
    const result = transposeKey(sheet([64]), 'guitar1', 2);
    expect(result.data.notes[0].pitch).toBe(66);
    expect(result.data.notes[0].string).toBe(0); // string 1, 0-indexed
    expect(result.data.notes[0].fret).toBe(2);
    expect(result.guide).toBeUndefined();
  });

  it('guitar1 -3: pitch adjusted, valid fret assigned', () => {
    // D4 (62) -3 → B3 (59): string 2, fret 0 (open B string)
    const result = transposeKey(sheet([62]), 'guitar1', -3);
    expect(result.data.notes[0].pitch).toBe(59);
    expect(result.data.notes[0].fret).toBe(0);
    expect(result.guide).toBeUndefined();
  });

  it('guitar2: same fretboard logic as guitar1', () => {
    const result = transposeKey(sheet([64]), 'guitar2', 5);
    expect(result.data.notes[0].pitch).toBe(69); // A4
    expect(result.guide).toBeUndefined();
  });

  it('auto octave-up when pitch falls below E2 (40) after delta', () => {
    // E2 (40) -5 → B1 (35) < 40 → +12 → B2 (47)
    const result = transposeKey(sheet([40]), 'guitar1', -5);
    expect(result.data.notes[0].pitch).toBe(47);
    expect(result.guide).toBeUndefined();
  });
});

describe('transposeKey — bass (TAB fretboard re-mapping)', () => {
  it('bass +2: pitch and fret updated correctly', () => {
    // A1 (33) +2 → B1 (35)
    // midiToTabPos: str3(A1=33) fret=35-33=2 → {str:3, fret:2}
    const result = transposeKey(sheet([33]), 'bass', 2);
    expect(result.data.notes[0].pitch).toBe(35);
    expect(result.data.notes[0].string).toBe(2); // str 3, 0-indexed
    expect(result.data.notes[0].fret).toBe(2);
    expect(result.guide).toBeUndefined();
  });

  it('bass: auto octave-up when below E1 (28)', () => {
    // A1 (33) -6 → Eb1 (27) < 28 → +12 → Eb2 (39)
    const result = transposeKey(sheet([33]), 'bass', -6);
    expect(result.data.notes[0].pitch).toBe(39);
    expect(result.guide).toBeUndefined();
  });
});

describe('transposeKey — guide strings', () => {
  it('returns Drop D guide when octave-up lands 1–2 below minPitch (guitar)', () => {
    // Guitar minPitch = 40. Need: shifted+12 = 38 or 39.
    // A1 (33) -6 → 27 → +12 = 39 < 40. 40-39=1 ≤ 2 → Drop D
    const result = transposeKey(sheet([33]), 'guitar1', -6);
    expect(result.guide).toContain('Drop D');
  });

  it('returns 범위 초과 guide when gap > 2 and delta < 0', () => {
    // E1 (28) -6 → 22 → +12 = 34 < 40. 40-34=6 > 2, delta<0 → 범위 초과
    const result = transposeKey(sheet([28]), 'guitar1', -6);
    expect(result.guide).toContain('범위 초과');
  });

  it('returns 카포 guide when gap > 2 and delta > 0', () => {
    // Artificial: force a note far below guitar range (MIDI 15)
    // 15 +1 = 16 → +12 = 28 < 40. 40-28=12 > 2, delta>0 → 카포
    const result = transposeKey(sheet([15]), 'guitar1', 1);
    expect(result.guide).toContain('카포');
    expect(result.guide).toContain('1');
  });

  it('deduplicates identical guide messages across notes', () => {
    // Two notes both triggering the same guide → guide appears once
    const result = transposeKey(sheet([33, 33]), 'guitar1', -6);
    const count = (result.guide ?? '').split('Drop D').length - 1;
    expect(count).toBe(1);
  });

  it('guide is undefined when no notes fall out of range', () => {
    const result = transposeKey(baseSheet, 'guitar1', 2);
    expect(result.guide).toBeUndefined();
  });
});
