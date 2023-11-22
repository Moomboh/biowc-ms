import { expect } from '@open-wc/testing';
import { Result } from 'ts-results';

import {
  fetchSpectrum,
  fetchSpectrumFromSource,
  SpectrumSource,
  Spectrum,
} from '../src/spectrum.js';

function validateSpectrum(spectrum: Result<Spectrum, Error | Error[]>) {
  expect(spectrum.ok).to.be.true;
  expect(spectrum.val).to.have.property('mzs');
  expect(spectrum.val).to.have.property('intensities');
  expect(spectrum.val).to.have.property('attributes');
}

describe('fetchSpectrumFromSource', () => {
  it('should fetch a spectrum from ProteomeCentral', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.ProteomeCentral
    );
    validateSpectrum(spectrumResult);
  });

  it('should fetch a spectrum from PRIDE', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.PRIDE
    );
    validateSpectrum(spectrumResult);
  });

  it('should fetch a spectrum from PeptideAtlas', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.PeptideAtlas
    );
    validateSpectrum(spectrumResult);
  });

  it('should fetch a spectrum from MassIVE', async () => {
    const usi =
      'mzspec:PXD000561:Adult_CD4Tcells_bRP_Elite_28_f15:scan:12517:SYEAALLPLYMEGGFVEVIHDK/3';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.MassIVE
    );
    validateSpectrum(spectrumResult);
  });

  it('should fetch a spectrum from jPOST', async () => {
    const usi = 'mzspec:PXD005172:111222_HL01:scan:5293:LETGQFLTFR/2';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.jPOST
    );
    validateSpectrum(spectrumResult);
  });

  it('should return an error if the spectrum is not found', async () => {
    const usi = 'mzspec:invalid:invalid:scan:invalid';
    const spectrumResult = await fetchSpectrumFromSource(
      usi,
      SpectrumSource.ProteomeCentral
    );
    expect(spectrumResult.ok).to.be.false;
    console.log(spectrumResult.err);
  });
});

describe('fetchSpectrum', () => {
  it('should fetch a spectrum', async () => {
    const usi =
      'mzspec:PXD000561:Adult_Frontalcortex_bRP_Elite_85_f09:scan:17555:VLHPLEGAVVIIFK/2';
    const spectrumResult = await fetchSpectrum(usi);
    validateSpectrum(spectrumResult);
  });

  it('shoudld return an error if the spectrum is not found', async () => {
    const usi = 'mzspec:invalid:invalid:scan:invalid';
    const spectrumResult = await fetchSpectrum(usi);
    expect(spectrumResult.ok).to.be.false;
    console.log(spectrumResult.err);
  });
});
