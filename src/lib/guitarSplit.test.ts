import { describe, expect, it } from 'vitest';
import { splitGuitarChannels } from './guitarSplit';

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

function cosineSim(a: Float32Array, b: Float32Array): number {
  return dot(a, b) / (Math.sqrt(dot(a, a)) * Math.sqrt(dot(b, b)) + 1e-9);
}

describe('splitGuitarChannels', () => {
  const sampleRate = 44100;
  const length = sampleRate; // 1 second
  const lowFreq = 200; // rhythm-like: low frequency, panned hard left
  const highFreq = 3000; // lead-like: high frequency, panned hard right

  const lowTone = new Float32Array(length);
  const highTone = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    lowTone[i] = Math.sin((2 * Math.PI * lowFreq * i) / sampleRate);
    highTone[i] = Math.sin((2 * Math.PI * highFreq * i) / sampleRate);
  }

  // Hard-panned: low tone only in left channel, high tone only in right channel.
  const left = lowTone;
  const right = highTone;

  it('routes the high-frequency, right-panned tone mostly into the lead output', () => {
    const { lead } = splitGuitarChannels(left, right, sampleRate);
    expect(cosineSim(lead, highTone)).toBeGreaterThan(cosineSim(lead, lowTone));
  });

  it('routes the low-frequency, left-panned tone mostly into the rhythm output', () => {
    const { rhythm } = splitGuitarChannels(left, right, sampleRate);
    expect(cosineSim(rhythm, lowTone)).toBeGreaterThan(cosineSim(rhythm, highTone));
  });

  it('reconstructs the mono downmix when lead and rhythm are summed', () => {
    const { lead, rhythm } = splitGuitarChannels(left, right, sampleRate);
    const monoDownmix = new Float32Array(length);
    const reconstructed = new Float32Array(length);
    for (let i = 0; i < length; i += 1) {
      monoDownmix[i] = (left[i] + right[i]) / 2;
      reconstructed[i] = lead[i] + rhythm[i];
    }
    expect(cosineSim(reconstructed, monoDownmix)).toBeGreaterThan(0.99);
  });

  it('throws when frameSize is not a power of two', () => {
    expect(() => splitGuitarChannels(left, right, sampleRate, { frameSize: 100 })).toThrow();
  });

  it('respects a custom crossover frequency', () => {
    // With an extremely high crossover, everything should be scored as rhythm on the frequency axis;
    // with panWeight at 0 the high tone (right-panned) no longer gets pulled into lead.
    const { lead, rhythm } = splitGuitarChannels(left, right, sampleRate, {
      crossoverHz: 20000,
      freqWeight: 1,
      panWeight: 0,
    });
    expect(cosineSim(rhythm, highTone)).toBeGreaterThan(cosineSim(lead, highTone));
  });
});
