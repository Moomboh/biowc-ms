import { MatchedFragmentPeak } from 'biowclib-ms';

export interface IndexedMatchedIons {
  [index: number]: MatchedFragmentPeak;
}

export function indexMatchedIons(
  matchedIons: MatchedFragmentPeak[],
): IndexedMatchedIons {
  return matchedIons.reduce((acc: IndexedMatchedIons, peak) => {
    acc[peak.peak_index] = peak;
    return acc;
  }, {});
}

export const PEAK_COLOR_MAP = new Map([
  ['b', '#0000ff'],
  ['y', '#ff0000'],
]);
