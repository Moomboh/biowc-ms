import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { MatchedFragmentPeak, MatchedPeakIndex } from 'biowc-ms-lib';
// eslint-disable-next-line import/no-duplicates
import './BiowcSpectrumPeaks.js';
// eslint-disable-next-line import/no-duplicates
import { BiowcSpectrumPeaks } from './BiowcSpectrumPeaks.js';
import './BiowcPepSeq.js';
import { Spectrum } from './spectrum.js';
import { indexMatchedIons } from './peaks.js';

@customElement('biowc-spectrum')
export class BiowcSpectrum extends LitElement {
  @property({ type: Object })
  spectrum: Spectrum = {
    attributes: [],
    intensities: [],
    mzs: [],
  };

  @property({ type: String })
  pepSeq: string = '';

  @property({ type: Number })
  charge: number = 0;

  @property({ type: Array })
  matchedIons: MatchedFragmentPeak[] = [];

  @property({ type: Object })
  mirrorSpectrum: Spectrum = {
    attributes: [],
    intensities: [],
    mzs: [],
  };

  @property({ type: Array })
  mirrorMatchedIons: MatchedFragmentPeak[] = [];

  @property({ type: Boolean })
  normalizeIntensity: boolean = false;

  @property({ type: Array })
  matchedPeaks: MatchedPeakIndex[] = [];

  @property({ type: Boolean })
  hideUnmatchedPeaks: boolean = false;

  @query('#peaks')
  peaks: BiowcSpectrumPeaks | undefined;

  @query('#mirror-peaks')
  mirrorPeaks: BiowcSpectrumPeaks | undefined;

  private get _minMz() {
    return Math.min(
      Math.min(...this.spectrum.mzs),
      Math.min(...this.mirrorSpectrum.mzs),
    );
  }

  private get _maxMz() {
    return Math.max(
      Math.max(...this.spectrum.mzs),
      Math.max(...this.mirrorSpectrum.mzs),
    );
  }

  private get _intensities() {
    const maxIntensity = Math.max(...this.spectrum.intensities);

    return this.normalizeIntensity
      ? this.spectrum.intensities.map(intensity => intensity / maxIntensity)
      : this.spectrum.intensities;
  }

  private get _mirrorIntensities() {
    const maxIntensity = Math.max(...this.mirrorSpectrum.intensities);

    return this.normalizeIntensity
      ? this.mirrorSpectrum.intensities.map(
          intensity => intensity / maxIntensity,
        )
      : this.mirrorSpectrum.intensities;
  }

  private get _hasMirrorSpectrum() {
    return (
      this.mirrorSpectrum.mzs.length > 0 &&
      this.mirrorSpectrum.intensities.length > 0
    );
  }

  private get _hidePeakIndices() {
    if (!this.hideUnmatchedPeaks) return [];

    const matchedPeakIndices = this.matchedPeaks.map(
      matchIndex => matchIndex[0],
    );

    return this.spectrum.mzs
      .map((_, i) => i)
      .filter(i => !matchedPeakIndices.includes(i));
  }

  private get _hideMirrorPeakIndices() {
    if (!this.hideUnmatchedPeaks) return [];

    const matchedMirrorPeakIndices = this.matchedPeaks.map(
      matchIndex => matchIndex[1],
    );

    return this.mirrorSpectrum.mzs
      .map((_, i) => i)
      .filter(i => !matchedMirrorPeakIndices.includes(i));
  }

  private _handleZoomScroll(e: CustomEvent) {
    const { xZoom, xScroll, yZoom, yScroll } = e.detail;
    this.mirrorPeaks?.updateZoomScroll(xZoom, xScroll, yZoom, -yScroll);
  }

  private _handleMirrorZoomScroll(e: CustomEvent) {
    const { xZoom, xScroll, yZoom, yScroll } = e.detail;
    this.peaks?.updateZoomScroll(xZoom, xScroll, yZoom, -yScroll);
  }

  render() {
    return html`
      <biowc-pep-seq
        .pepSeq=${this.pepSeq}
        .matchedIons=${this.matchedIons}
      ></biowc-pep-seq>

      <biowc-spectrum-peaks
        id="peaks"
        .mzs=${this.spectrum.mzs}
        .intensities=${this._intensities}
        .indexedMatchedIons=${indexMatchedIons(this.matchedIons)}
        .minMz=${this._minMz}
        .maxMz=${this._maxMz}
        .hidePeakIndices=${this._hidePeakIndices}
        @zoom-scroll=${this._handleZoomScroll}
        style="width: 100%; height: 40vh;"
      ></biowc-spectrum-peaks>

      ${this._hasMirrorSpectrum
        ? html`
            <biowc-spectrum-peaks
              id="mirror-peaks"
              .mzs=${this.mirrorSpectrum.mzs}
              .intensities=${this._mirrorIntensities}
              .indexedMatchedIons=${indexMatchedIons(this.mirrorMatchedIons)}
              .mirror=${true}
              .hideMzAxisLabel=${true}
              .minMz=${this._minMz}
              .maxMz=${this._maxMz}
              .hidePeakIndices=${this._hideMirrorPeakIndices}
              @zoom-scroll=${this._handleMirrorZoomScroll}
              style="width: 100%; height: 40vh;"
            ></biowc-spectrum-peaks>
          `
        : ''}
    `;
  }
}
