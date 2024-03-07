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

init();

interface KoinaOutput {
  name: string;
  datatype: string;
  shape: number[];
  data: any[];
}

interface KoinaSpectrum {
  id: string;
  model_name: string;
  model_version: string;
  outputs: KoinaOutput[];
  parameters: {
    [key: string]: any;
  };
}

async function fetchKoinaSpectrum(pepSeq: string): Promise<KoinaSpectrum> {
  const response = (
    await fetch(`/koina/v2/models/Prosit_2020_intensity_HCD/infer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: '0',
        inputs: [
          {
            name: 'peptide_sequences',
            shape: [1, 1],
            datatype: 'BYTES',
            data: [pepSeq],
          },
          {
            name: 'precursor_charges',
            shape: [1, 1],
            datatype: 'INT32',
            data: [2],
          },
          {
            name: 'collision_energies',
            shape: [1, 1],
            datatype: 'FP32',
            data: [25],
          },
        ],
      }),
    })
  ).json();

  return response;
}

function transformKoinaSpectrum(spectrum: KoinaSpectrum): Spectrum {
  const mzs = spectrum.outputs.find(output => output.name === 'mz')?.data || [];
  const intensities =
    spectrum.outputs.find(output => output.name === 'intensities')?.data || [];

  return {
    attributes: [],
    // Koina returns -1 not null values for missing values, so we filter them out
    mzs: mzs.filter(mz => mz > 0),
    intensities: intensities.filter(intensity => intensity > 0),
  };
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
  const pepSeq = 'VLHPLEGAVVIIFK';
  const charge = 2;

  const spectrumResponse = await fetchSpectrumFromSource(
    'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2',
    SpectrumSource.ProteomeCentral,
  );

  const mirrorSpectrum = transformKoinaSpectrum(
    await fetchKoinaSpectrum(pepSeq),
  );

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
