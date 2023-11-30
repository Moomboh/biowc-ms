import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './BiowcSpectrumPeaks.js';
import { Spectrum } from './spectrum.js';

@customElement('biowc-spectrum')
export class BiowcSpectrum extends LitElement {
  @property({ type: Object })
  spectrum: Spectrum = {
    attributes: [],
    intensities: [],
    mzs: [],
  };

  render() {
    return html`
      <biowc-spectrum-peaks
        .mzs=${this.spectrum.mzs}
        .intensities=${this.spectrum.intensities}
        style="width: 100%; height: 40vh;"
      ></biowc-spectrum-peaks>
    `;
  }
}
