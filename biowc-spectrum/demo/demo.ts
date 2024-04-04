import { html, render } from 'lit';
import init, { annotateSpectrum, matchPeaks } from 'biowc-ms-lib';
import {
  fetchSpectrumFromSource,
  Spectrum,
  SpectrumSource,
} from '../src/spectrum.js';
// eslint-disable-next-line import/no-duplicates
import '../src/BiowcSpectrum.js';
// eslint-disable-next-line import/no-duplicates
import { BiowcSpectrum } from '../src/BiowcSpectrum.js';

import usiSpec from './usi-spec.js';
import koinaSpec from './koina-spec.js';

async function fetchKoinaProxiSpectrum(): Promise<Spectrum> {
  const params = new URLSearchParams({
    peptide_sequences: 'VLHPLEGAVVIIFK',
    collision_energies: '30',
    precursor_charges: '2',
    instrument_types: 'LUMOS',
  });

  const response = await fetch(
    `https://koina.wilhelmlab.org/v2/models/Prosit_2019_intensity/usi?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return response.json();
}

function toggleUnmatchedPeaks() {
  const spectrumEl = document.querySelector('#spectrum')! as BiowcSpectrum;
  spectrumEl.hideUnmatchedPeaks = !spectrumEl.hideUnmatchedPeaks;

  const toggleButton = document.querySelector(
    '#toggle-hide-peaks',
  )! as HTMLButtonElement;
  toggleButton.textContent = spectrumEl.hideUnmatchedPeaks
    ? 'Show unmatched Peaks'
    : 'Hide unmatched Peaks';
}

export async function mount(el: HTMLElement) {
  await init();

  const pepSeq = 'VLHPLEGAVVIIFK';
  const charge = 2;

  const spectrumResponse = await fetchSpectrumFromSource(
    'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2',
    SpectrumSource.ProteomeCentral,
  );

  const mirrorSpectrum = await fetchKoinaProxiSpectrum();

  if (spectrumResponse.err) {
    render(
      html`
        <h3>Error fetching spectrum:</h3>
        <div>${spectrumResponse.val}</div>
      `,
      el,
    );
  } else {
    const spectrum = spectrumResponse.val[0];

    const matchedFragments = annotateSpectrum(
      pepSeq,
      new Float64Array(spectrum.mzs),
      new Float64Array(spectrum.intensities),
      1e-3,
    );

    const mirrorMatchedFragments = annotateSpectrum(
      pepSeq,
      new Float64Array(mirrorSpectrum.mzs),
      new Float64Array(mirrorSpectrum.intensities),
      1e-3,
    );

    const matchedPeaks = matchPeaks(
      new Float64Array(spectrum.mzs),
      new Float64Array(spectrum.intensities),
      new Float64Array(mirrorSpectrum.mzs),
      new Float64Array(mirrorSpectrum.intensities),
      1e-3,
    );

    render(
      html`
        <biowc-spectrum
          id="spectrum"
          .spectrum=${spectrum}
          .matchedIons=${matchedFragments}
          .pepSeq=${pepSeq}
          .charge=${charge}
          .mirrorSpectrum=${mirrorSpectrum}
          .mirrorMatchedIons=${mirrorMatchedFragments}
          .normalizeIntensity=${true}
          .matchedPeaks=${matchedPeaks}
        ></biowc-spectrum>
        <button id="toggle-hide-peaks" @click=${toggleUnmatchedPeaks}>
          Hide unmatched Peaks
        </button>
      `,
      el,
    );
  }
}

export async function mountCached(el: HTMLElement) {
  await init();

  const pepSeq = 'VLHPLEGAVVIIFK';
  const charge = 2;
  const spectrum = usiSpec;
  const mirrorSpectrum = koinaSpec;

  const matchedFragments = annotateSpectrum(
    pepSeq,
    new Float64Array(spectrum.mzs),
    new Float64Array(spectrum.intensities),
    1e-3,
  );

  const mirrorMatchedFragments = annotateSpectrum(
    pepSeq,
    new Float64Array(mirrorSpectrum.mzs),
    new Float64Array(mirrorSpectrum.intensities),
    1e-3,
  );

  const matchedPeaks = matchPeaks(
    new Float64Array(spectrum.mzs),
    new Float64Array(spectrum.intensities),
    new Float64Array(mirrorSpectrum.mzs),
    new Float64Array(mirrorSpectrum.intensities),
    1e-3,
  );

  render(
    html`
      <biowc-spectrum
        id="spectrum"
        .spectrum=${spectrum}
        .matchedIons=${matchedFragments}
        .pepSeq=${pepSeq}
        .charge=${charge}
        .mirrorSpectrum=${mirrorSpectrum}
        .mirrorMatchedIons=${mirrorMatchedFragments}
        .normalizeIntensity=${true}
        .matchedPeaks=${matchedPeaks}
      ></biowc-spectrum>
      <button id="toggle-hide-peaks" @click=${toggleUnmatchedPeaks}>
        Hide unmatched Peaks
      </button>
    `,
    el,
  );
}
