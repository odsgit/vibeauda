import { useEffect, useRef } from 'react';
import {
  Renderer,
  Stave,
  TabStave,
  StaveNote,
  TabNote,
  Voice,
  Formatter,
  Accidental,
  GhostNote,
} from 'vexflow';
import type { Part, MidiNote, SheetViewProps } from '../types/sheet';

/* ─── Layout constants ───────────────────────────────── */
const STAVE_W = 380;
const FIRST_EXTRA_W = 50;
const PAD_X = 15;
const PAD_TOP_STD = 50;
const PAD_TOP_TAB = 40;
const SVG_H_STD = 130;
const SVG_H_TAB = 120;

/* ─── GM Drum map ────────────────────────────────────── */
const DRUM_MAP: Record<number, { key: string; xHead: boolean }> = {
  35: { key: 'c/5', xHead: false }, // Acoustic bass drum
  36: { key: 'c/5', xHead: false }, // Bass drum 1
  37: { key: 'd/5', xHead: true }, // Side stick
  38: { key: 'e/5', xHead: false }, // Acoustic snare
  40: { key: 'e/5', xHead: false }, // Electric snare
  41: { key: 'c/5', xHead: false }, // Low floor tom
  43: { key: 'd/5', xHead: false }, // High floor tom
  45: { key: 'f/5', xHead: false }, // Low-mid tom
  47: { key: 'g/5', xHead: false }, // High-mid tom
  48: { key: 'a/5', xHead: false }, // High tom 1
  50: { key: 'b/5', xHead: false }, // High tom 2
  42: { key: 'b/5', xHead: true }, // Closed hi-hat
  44: { key: 'b/5', xHead: true }, // Pedal hi-hat
  46: { key: 'b/5', xHead: true }, // Open hi-hat
  49: { key: 'c/6', xHead: true }, // Crash cymbal 1
  57: { key: 'c/6', xHead: true }, // Crash cymbal 2
  51: { key: 'b/5', xHead: true }, // Ride cymbal 1
  59: { key: 'b/5', xHead: true }, // Ride cymbal 2
  53: { key: 'c/6', xHead: true }, // Ride bell
};

/* ─── Tuning ─────────────────────────────────────────── */
const GUITAR_OPEN = [64, 59, 55, 50, 45, 40]; // E4 B3 G3 D3 A2 E2
const BASS_OPEN = [43, 38, 33, 28]; // G2 D2 A1 E1

/* ─── Pure utilities ─────────────────────────────────── */
const NOTE_LETTERS = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const SHARP_SEMITONES = new Set([1, 3, 6, 8, 10]);

function midiToKey(midi: number): string {
  return `${NOTE_LETTERS[midi % 12]}/${Math.floor(midi / 12) - 1}`;
}

function midiAccidental(midi: number): string | null {
  return SHARP_SEMITONES.has(midi % 12) ? '#' : null;
}

function beatsToDur(beats: number): { vex: string; actual: number } {
  if (beats >= 3.5) return { vex: 'w', actual: 4 };
  if (beats >= 1.75) return { vex: 'h', actual: 2 };
  if (beats >= 0.875) return { vex: 'q', actual: 1 };
  if (beats >= 0.4375) return { vex: '8', actual: 0.5 };
  return { vex: '16', actual: 0.25 };
}

function midiToTabPos(midi: number, tuning: number[]): { str: number; fret: number } {
  const found = tuning
    .map((open, i) => ({ str: i + 1, fret: midi - open }))
    .find(({ fret }) => fret >= 0 && fret <= 24);
  return found ?? { str: tuning.length, fret: Math.max(0, midi - tuning[tuning.length - 1]) };
}

function groupByMeasure(
  notes: MidiNote[],
  bpm: number,
  timeSig: [number, number],
): { measures: MidiNote[][]; spm: number; spb: number } {
  const spb = 60 / bpm;
  const spm = timeSig[0] * spb;

  const map = new Map<number, MidiNote[]>();
  notes.forEach((n) => {
    const idx = Math.floor(n.startTime / spm);
    if (!map.has(idx)) map.set(idx, []);
    map.get(idx)!.push(n);
  });

  const maxIdx = notes.length > 0 ? Math.max(...map.keys()) : 0;
  const measures = Array.from({ length: maxIdx + 1 }, (_, i) => map.get(i) ?? []);
  return { measures, spm, spb };
}

/* ─── Tickable builders ──────────────────────────────── */
type StdAcc = { tickables: StaveNote[]; beat: number };
type TabAcc = { tickables: (TabNote | GhostNote)[]; beat: number };

function buildStdTickables(
  notes: MidiNote[],
  measureStartSec: number,
  beatsPerMeasure: number,
  spb: number,
  clef: string,
  isDrum: boolean,
): StaveNote[] {
  if (notes.length === 0) {
    return [new StaveNote({ clef, keys: ['b/4'], duration: 'wr' })];
  }

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);
  const inRange = sorted.filter(
    (n) =>
      (n.startTime - measureStartSec) / spb >= 0 &&
      (n.startTime - measureStartSec) / spb < beatsPerMeasure,
  );

  const { tickables, beat: finalBeat } = inRange.reduce<StdAcc>(
    (acc, note) => {
      if (acc.beat >= beatsPerMeasure - 0.05) return acc;

      const noteBeat = (note.startTime - measureStartSec) / spb;
      const result: StaveNote[] = [...acc.tickables];
      let { beat } = acc;

      // Fill gap
      const gap = noteBeat - beat;
      if (gap > 0.1) {
        const { vex, actual } = beatsToDur(gap);
        result.push(new StaveNote({ clef, keys: ['b/4'], duration: `${vex}r` }));
        beat += actual;
      }

      const durBeats = Math.min(note.duration / spb, beatsPerMeasure - beat);
      if (durBeats < 0.05) return { tickables: result, beat };

      const { vex, actual } = beatsToDur(Math.max(durBeats, 0.0625));
      let sn: StaveNote;

      if (isDrum) {
        const info = DRUM_MAP[note.pitch] ?? { key: 'c/5', xHead: false };
        sn = new StaveNote({
          clef,
          keys: [info.key],
          duration: vex,
          ...(info.xHead ? { note_type: 'x' } : {}),
        });
      } else {
        sn = new StaveNote({ clef, keys: [midiToKey(note.pitch)], duration: vex });
        const acc2 = midiAccidental(note.pitch);
        if (acc2) sn.addModifier(new Accidental(acc2), 0);
      }

      return { tickables: [...result, sn], beat: beat + actual };
    },
    { tickables: [], beat: 0 },
  );

  // Trailing rest
  const trailing =
    finalBeat < beatsPerMeasure - 0.05
      ? [
          new StaveNote({
            clef,
            keys: ['b/4'],
            duration: `${beatsToDur(beatsPerMeasure - finalBeat).vex}r`,
          }),
        ]
      : [];

  return [...tickables, ...trailing];
}

function buildTabTickables(
  notes: MidiNote[],
  measureStartSec: number,
  beatsPerMeasure: number,
  spb: number,
  tuning: number[],
): (TabNote | GhostNote)[] {
  if (notes.length === 0) {
    return [new GhostNote({ duration: 'w' })];
  }

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);
  const inRange = sorted.filter(
    (n) =>
      (n.startTime - measureStartSec) / spb >= 0 &&
      (n.startTime - measureStartSec) / spb < beatsPerMeasure,
  );

  const { tickables, beat: finalBeat } = inRange.reduce<TabAcc>(
    (acc, note) => {
      if (acc.beat >= beatsPerMeasure - 0.05) return acc;

      const noteBeat = (note.startTime - measureStartSec) / spb;
      const result: (TabNote | GhostNote)[] = [...acc.tickables];
      let { beat } = acc;

      // Fill gap with ghost note
      const gap = noteBeat - beat;
      if (gap > 0.1) {
        const { vex, actual } = beatsToDur(gap);
        result.push(new GhostNote({ duration: vex }));
        beat += actual;
      }

      const durBeats = Math.min(note.duration / spb, beatsPerMeasure - beat);
      if (durBeats < 0.05) return { tickables: result, beat };

      const { vex, actual } = beatsToDur(Math.max(durBeats, 0.0625));
      const pos =
        note.string !== undefined && note.fret !== undefined
          ? { str: note.string + 1, fret: note.fret }
          : midiToTabPos(note.pitch, tuning);

      return {
        tickables: [...result, new TabNote({ positions: [pos], duration: vex })],
        beat: beat + actual,
      };
    },
    { tickables: [], beat: 0 },
  );

  // Trailing ghost note
  const trailing =
    finalBeat < beatsPerMeasure - 0.05
      ? [new GhostNote({ duration: beatsToDur(beatsPerMeasure - finalBeat).vex })]
      : [];

  return [...tickables, ...trailing];
}

/* ─── Part → render config ───────────────────────────── */
function getClef(part: Part): string {
  if (part === 'drum') return 'percussion';
  if (part === 'bass') return 'bass';
  return 'treble';
}

function isTabPart(part: Part): boolean {
  return part === 'guitar1' || part === 'guitar2' || part === 'bass';
}

/* ─── Component ──────────────────────────────────────── */
export default function SheetView({ data, part }: SheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const { bpm, timeSignature, notes } = data;
    const { measures, spm, spb } = groupByMeasure(notes, bpm, timeSignature);
    const clef = getClef(part);
    const tabMode = isTabPart(part);
    const tuning = part === 'bass' ? BASS_OPEN : GUITAR_OPEN;
    const isDrum = part === 'drum';
    const beatsPerMeasure = timeSignature[0];
    const numMeasures = Math.max(measures.length, 1);

    const svgWidth = PAD_X + FIRST_EXTRA_W + numMeasures * STAVE_W + PAD_X;
    const svgHeight = tabMode ? SVG_H_TAB : SVG_H_STD;
    const staveY = tabMode ? PAD_TOP_TAB : PAD_TOP_STD;

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(svgWidth, svgHeight);
    const ctx = renderer.getContext();

    Array.from({ length: numMeasures }).forEach((_, i) => {
      const isFirst = i === 0;
      const staveX = PAD_X + (isFirst ? 0 : FIRST_EXTRA_W) + i * STAVE_W;
      const staveWidth = isFirst ? STAVE_W + FIRST_EXTRA_W : STAVE_W;
      const measureNotes = measures[i] ?? [];
      const measureStartSec = i * spm;

      if (tabMode) {
        const stave = new TabStave(staveX, staveY, staveWidth);
        if (isFirst) stave.addClef('tab');
        stave.setContext(ctx).draw();

        const tickables = buildTabTickables(
          measureNotes,
          measureStartSec,
          beatsPerMeasure,
          spb,
          tuning,
        );
        const voice = new Voice({ numBeats: beatsPerMeasure, beatValue: timeSignature[1] });
        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables(tickables);
        const noteWidth = stave.getX() + stave.getWidth() - stave.getNoteStartX() - 10;
        new Formatter().joinVoices([voice]).format([voice], noteWidth);
        voice.draw(ctx, stave);
      } else {
        const stave = new Stave(staveX, staveY, staveWidth);
        if (isFirst) {
          stave.addClef(clef);
          stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
        }
        stave.setContext(ctx).draw();

        const tickables = buildStdTickables(
          measureNotes,
          measureStartSec,
          beatsPerMeasure,
          spb,
          clef,
          isDrum,
        );
        const voice = new Voice({ numBeats: beatsPerMeasure, beatValue: timeSignature[1] });
        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables(tickables);
        const noteWidth = stave.getX() + stave.getWidth() - stave.getNoteStartX() - 10;
        new Formatter().joinVoices([voice]).format([voice], noteWidth);
        voice.draw(ctx, stave);
      }
    });
  }, [data, part]);

  return (
    <div style={{ overflowX: 'auto', width: '100%', background: '#fff', borderRadius: 8 }}>
      <div ref={containerRef} />
    </div>
  );
}
