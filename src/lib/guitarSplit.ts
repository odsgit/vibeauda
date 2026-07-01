import { fft, ifft } from './fft';

export interface GuitarSplitOptions {
  /** STFT frame size in samples, must be a power of two. */
  frameSize?: number;
  /** STFT hop size in samples. Defaults to frameSize / 4 (75% overlap, COLA for Hann). */
  hopSize?: number;
  /** Frequency (Hz) above which content is weighted toward "lead". */
  crossoverHz?: number;
  /** Blend weight for the frequency-band score (0..1). Paired with panWeight. */
  freqWeight?: number;
  /** Blend weight for the stereo-panning score (0..1). Paired with freqWeight. */
  panWeight?: number;
}

export interface GuitarChannelSplit {
  lead: Float32Array;
  rhythm: Float32Array;
}

export interface GuitarSplitResult {
  lead: AudioBuffer;
  rhythm: AudioBuffer;
}

const DEFAULT_FRAME_SIZE = 2048;
const DEFAULT_CROSSOVER_HZ = 500;
const DEFAULT_FREQ_WEIGHT = 0.6;
const DEFAULT_PAN_WEIGHT = 0.4;
/** Controls how sharply the frequency score transitions across the crossover, in bins. */
const SIGMOID_STEEPNESS = 0.15;

function hannWindow(size: number): Float64Array {
  const window = new Float64Array(size);
  for (let i = 0; i < size; i += 1) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  }
  return window;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Splits a single guitar stem into "lead" and "rhythm" signals by blending a
 * per-bin frequency-band score (high frequencies -> lead) with a per-bin
 * stereo-panning score (content panned toward the right -> lead), then
 * applying the resulting soft mask to each STFT frame before reconstructing
 * via overlap-add. This is an approximate separation, not a clean split.
 */
export function splitGuitarChannels(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  options: GuitarSplitOptions = {},
): GuitarChannelSplit {
  const frameSize = options.frameSize ?? DEFAULT_FRAME_SIZE;
  const hopSize = options.hopSize ?? frameSize / 4;
  const crossoverHz = options.crossoverHz ?? DEFAULT_CROSSOVER_HZ;
  const freqWeight = options.freqWeight ?? DEFAULT_FREQ_WEIGHT;
  const panWeight = options.panWeight ?? DEFAULT_PAN_WEIGHT;

  if (!Number.isInteger(Math.log2(frameSize))) {
    throw new Error('frameSize must be a power of two');
  }

  const { length } = left;
  const window = hannWindow(frameSize);
  const halfBins = frameSize / 2;
  const freqPerBin = sampleRate / frameSize;
  const crossoverBin = crossoverHz / freqPerBin;

  const freqScore = new Float64Array(halfBins + 1);
  for (let k = 0; k <= halfBins; k += 1) {
    freqScore[k] = 1 / (1 + Math.exp(-SIGMOID_STEEPNESS * (k - crossoverBin)));
  }

  const leadOut = new Float64Array(length);
  const rhythmOut = new Float64Array(length);
  const windowSumSquare = new Float64Array(length);

  const reL = new Float64Array(frameSize);
  const imL = new Float64Array(frameSize);
  const reR = new Float64Array(frameSize);
  const imR = new Float64Array(frameSize);
  const outReLead = new Float64Array(frameSize);
  const outImLead = new Float64Array(frameSize);
  const outReRhythm = new Float64Array(frameSize);
  const outImRhythm = new Float64Array(frameSize);

  for (let start = 0; start < length; start += hopSize) {
    for (let i = 0; i < frameSize; i += 1) {
      const s = start + i;
      const w = window[i];
      const l = s < length ? left[s] : 0;
      const r = s < length ? right[s] : 0;
      reL[i] = l * w;
      reR[i] = r * w;
      imL[i] = 0;
      imR[i] = 0;
    }

    fft(reL, imL);
    fft(reR, imR);

    for (let k = 0; k <= halfBins; k += 1) {
      const magL = Math.hypot(reL[k], imL[k]);
      const magR = Math.hypot(reR[k], imR[k]);
      const pan = (magR - magL) / (magR + magL + 1e-9); // -1 (hard left) .. 1 (hard right)
      const panScore = clamp01((pan + 1) / 2); // 0..1, right-leaning -> lead

      const leadWeight = clamp01(freqWeight * freqScore[k] + panWeight * panScore);

      // Mono (mid) downmix of this bin is the basis for both outputs.
      const sumRe = (reL[k] + reR[k]) / 2;
      const sumIm = (imL[k] + imR[k]) / 2;

      outReLead[k] = sumRe * leadWeight;
      outImLead[k] = sumIm * leadWeight;
      outReRhythm[k] = sumRe * (1 - leadWeight);
      outImRhythm[k] = sumIm * (1 - leadWeight);

      const mirror = frameSize - k;
      if (k > 0 && k < mirror) {
        outReLead[mirror] = outReLead[k];
        outImLead[mirror] = -outImLead[k];
        outReRhythm[mirror] = outReRhythm[k];
        outImRhythm[mirror] = -outImRhythm[k];
      }
    }

    ifft(outReLead, outImLead);
    ifft(outReRhythm, outImRhythm);

    for (let i = 0; i < frameSize; i += 1) {
      const s = start + i;
      if (s >= length) break;
      const w = window[i];
      leadOut[s] += outReLead[i] * w;
      rhythmOut[s] += outReRhythm[i] * w;
      windowSumSquare[s] += w * w;
    }
  }

  const lead = new Float32Array(length);
  const rhythm = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const norm = windowSumSquare[i] > 1e-9 ? windowSumSquare[i] : 1;
    lead[i] = leadOut[i] / norm;
    rhythm[i] = rhythmOut[i] / norm;
  }

  return { lead, rhythm };
}

/** Browser convenience wrapper: splits a stereo guitar stem AudioBuffer into two mono AudioBuffers. */
export function splitGuitarStem(
  stereoBuffer: AudioBuffer,
  options: GuitarSplitOptions = {},
): GuitarSplitResult {
  const left = stereoBuffer.getChannelData(0);
  const right = stereoBuffer.numberOfChannels > 1 ? stereoBuffer.getChannelData(1) : left;

  const { lead, rhythm } = splitGuitarChannels(left, right, stereoBuffer.sampleRate, options);

  const leadBuffer = new AudioBuffer({
    length: stereoBuffer.length,
    numberOfChannels: 1,
    sampleRate: stereoBuffer.sampleRate,
  });
  const rhythmBuffer = new AudioBuffer({
    length: stereoBuffer.length,
    numberOfChannels: 1,
    sampleRate: stereoBuffer.sampleRate,
  });
  leadBuffer.copyToChannel(Float32Array.from(lead), 0);
  rhythmBuffer.copyToChannel(Float32Array.from(rhythm), 0);

  return { lead: leadBuffer, rhythm: rhythmBuffer };
}
