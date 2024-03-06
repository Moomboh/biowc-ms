import { MatchedPeak } from 'biowc-ms-lib';

export interface IndexedMatchedPeaks {
  [index: number]: MatchedPeak;
}

export function indexMatchedPeaks(
  matchedPeaks: MatchedPeak[],
): IndexedMatchedPeaks {
  return matchedPeaks.reduce((acc: IndexedMatchedPeaks, peak) => {
    acc[peak.peak_index] = peak;
    return acc;
  }, {});
}

export const PEAK_COLOR_MAP = new Map([
  ['b', '#0000ff'],
  ['y', '#ff0000'],
]);
