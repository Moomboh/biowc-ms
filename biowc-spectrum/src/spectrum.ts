import { Ok, Err, Result } from 'ts-results';

export enum SpectrumSource { // eslint-disable-line no-shadow -- seems to be a bug in eslint
  jPOST = 'https://repository.jpostdb.org/proxi/spectra',
  MassIVE = 'https://massive.ucsd.edu/ProteoSAFe/proxi/v0.1/spectra',
  PeptideAtlas = 'https://peptideatlas.org/api/proxi/v0.1/spectra',
  PRIDE = 'https://www.ebi.ac.uk/pride/proxi/archive/v0.1/spectra',
  ProteomeCentral = 'https://proteomecentral.proteomexchange.org/api/proxi/v0.1/spectra',
}

type SpectrumSourcePriority = Array<SpectrumSource>;

const DEFAULT_SPECTRUM_SOURCE_PRIORITY: SpectrumSourcePriority = [
  SpectrumSource.ProteomeCentral,
  SpectrumSource.PRIDE,
  SpectrumSource.PeptideAtlas,
  SpectrumSource.MassIVE,
  SpectrumSource.jPOST,
];

export interface SpectrumAttributes {
  accession: string;
  name: string;
  value: string;
}

export interface Spectrum {
  attributes: Array<SpectrumAttributes>;
  intensities: Array<number>;
  mzs: Array<number>;
}

export async function fetchSpectrumFromSource(
  usi: string,
  source: SpectrumSource
): Promise<Result<Spectrum, Error>> {
  const params = new URLSearchParams({ usi, resultType: 'full' });
  const url = `${source}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    return Err(
      new Error(
        `Failed to fetch spectrum from ${url}: ${response.status} ${response.statusText}`
      )
    );
  }

  let spectrum: Spectrum;

  try {
    spectrum = await response.json();
  } catch (error) {
    return Err(
      new Error(`Failed to parse spectrum json from ${url}: ${error}`)
    );
  }

  return Ok(spectrum);
}

export async function fetchSpectrum(
  usi: string,
  priority: SpectrumSourcePriority = DEFAULT_SPECTRUM_SOURCE_PRIORITY
): Promise<Result<Spectrum, Error[]>> {
  const spectraResults = await Promise.all(
    priority.map(source => fetchSpectrumFromSource(usi, source))
  );

  return Result.any(...spectraResults);
}
