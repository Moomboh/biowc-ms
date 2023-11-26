import { expect } from '@open-wc/testing';
import { Result } from 'ts-results';

import {
  fetchSpectrum,
  fetchSpectrumFromSource,
  SpectrumSource,
  Spectrum,
} from '../src/spectrum.js';

function validateSpectra(spectraResult: Result<Spectrum[], Error | Error[]>) {
  if (spectraResult.err) {
    console.error(spectraResult.val);
  }

  expect(spectraResult.ok).to.be.true;

  for (const spectrum of spectraResult.val as Spectrum[]) {
    expect(spectrum.mzs).to.be.an('array');
    expect(spectrum.intensities).to.be.an('array');
  }
}
// eslint-disable-next-line func-names -- mocha needs to use this
describe('fetchSpectrumFromSource', function () {
  this.timeout(10000);

  it('should fetch a spectrum from ProteomeCentral', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.ProteomeCentral
    );
    validateSpectra(spectrumResult);
  });

  it('should fetch a spectrum from PRIDE', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.PRIDE
    );
    validateSpectra(spectrumResult);
  });

  it('should fetch a spectrum from PeptideAtlas', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.PeptideAtlas
    );
    validateSpectra(spectrumResult);
  });

  // TODO: MassiVE is setting the Access-Control-Allow-Origin header to
  //       Origin instead of * which is causing the request to fail
  //       when calling from a browser.
  xit('should fetch a spectrum from MassIVE', async () => {
    const usi =
      'mzspec:PXD000561:Adult_CD4Tcells_bRP_Elite_28_f15:scan:12517:SYEAALLPLYMEGGFVEVIHDK/3';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.MassIVE
    );
    validateSpectra(spectrumResult);
  });

  // TODO: jPOST is returning 404 on the USI endpoint even though the spectrum is
  //       available on the jPOST website:
  //       https://repository.jpostdb.org/spectrum/?USI=mzspec:PXD005172:111222_HL01:scan:5293:LETGQFLTFR/2
  xit('should fetch a spectrum from jPOST', async () => {
    const usi = 'mzspec:PXD005172:111222_HL01:scan:5293:LETGQFLTFR/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.jPOST
    );
    validateSpectra(spectrumResult);
  });

  it('should return an error if the spectrum is not found', async () => {
    const usi = 'mzspec:invalid:invalid:scan:invalid';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.ProteomeCentral
    );
    expect(spectrumResult.ok).to.be.false;
  });
});

// eslint-disable-next-line func-names -- mocha needs to use this
describe('fetchSpectrum', function () {
  this.timeout(20000);

  it('should fetch a spectrum', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrum(usi);
    validateSpectra(spectrumResult);
  });

  it('should return an error if the spectrum is not found', async () => {
    const usi = 'mzspec:invalid:invalid:scan:invalid';
    const spectrumResult = await fetchSpectrum(usi);
    expect(spectrumResult.err).to.be.true;
  });
});
