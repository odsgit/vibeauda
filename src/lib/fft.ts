/* eslint-disable no-bitwise, no-param-reassign */
/**
 * Iterative radix-2 Cooley-Tukey FFT, in place on parallel re/im arrays.
 * `re.length` must be a power of two.
 * Bit-reversal permutation and in-place butterfly updates are intrinsic to
 * this algorithm, hence the relaxed bitwise/param-reassign rules above.
 */

function bitReverseCopy(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; (j & bit) !== 0; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const tempRe = re[i];
      re[i] = re[j];
      re[j] = tempRe;
      const tempIm = im[i];
      im[i] = im[j];
      im[j] = tempIm;
    }
  }
}

function transform(re: Float64Array, im: Float64Array, invert: boolean): void {
  const n = re.length;
  if (n === 0 || !Number.isInteger(Math.log2(n))) {
    throw new Error('FFT size must be a power of two');
  }

  bitReverseCopy(re, im);

  for (let len = 2; len <= n; len <<= 1) {
    const angle = ((invert ? 1 : -1) * 2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    const half = len / 2;

    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;

      for (let j = 0; j < half; j += 1) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + half] * curRe - im[i + j + half] * curIm;
        const vIm = re[i + j + half] * curIm + im[i + j + half] * curRe;

        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;

        const nextRe = curRe * wRe - curIm * wIm;
        const nextIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
        curIm = nextIm;
      }
    }
  }

  if (invert) {
    for (let i = 0; i < n; i += 1) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

export function fft(re: Float64Array, im: Float64Array): void {
  transform(re, im, false);
}

export function ifft(re: Float64Array, im: Float64Array): void {
  transform(re, im, true);
}
