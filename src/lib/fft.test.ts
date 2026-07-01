import { describe, expect, it } from 'vitest';
import { fft, ifft } from './fft';

describe('fft/ifft', () => {
  it('round-trips a random signal back to the original', () => {
    const n = 64;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      re[i] = Math.sin(i) * 0.7;
    }
    const original = re.slice();

    fft(re, im);
    ifft(re, im);

    for (let i = 0; i < n; i += 1) {
      expect(re[i]).toBeCloseTo(original[i], 6);
      expect(im[i]).toBeCloseTo(0, 6);
    }
  });

  it('concentrates a DC signal entirely in bin 0', () => {
    const n = 16;
    const re = new Float64Array(n).fill(1);
    const im = new Float64Array(n);

    fft(re, im);

    expect(re[0]).toBeCloseTo(n, 6);
    for (let k = 1; k < n; k += 1) {
      expect(Math.hypot(re[k], im[k])).toBeCloseTo(0, 6);
    }
  });

  it('places a pure sinusoid at the expected bin', () => {
    const n = 64;
    const targetBin = 5;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      re[i] = Math.cos((2 * Math.PI * targetBin * i) / n);
    }

    fft(re, im);

    const magAt = (k: number) => Math.hypot(re[k], im[k]);
    // A real cosine produces two equal-magnitude conjugate peaks at k and n-k.
    expect(magAt(targetBin)).toBeCloseTo(magAt(n - targetBin), 6);
    for (let k = 0; k < n; k += 1) {
      if (k !== targetBin && k !== n - targetBin) {
        expect(magAt(k)).toBeLessThan(magAt(targetBin) * 0.01);
      }
    }
  });

  it('throws when the length is not a power of two', () => {
    const re = new Float64Array(6);
    const im = new Float64Array(6);
    expect(() => fft(re, im)).toThrow();
  });
});
