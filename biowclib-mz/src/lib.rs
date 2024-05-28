mod utils;

use std::collections::HashSet;
use std::vec;

use mzcore::chemistry::table::STANDARD_AMINO_ACID_TABLE;
use mzcore::ms::utils::MassTolWindow;
use mzcore::msms::annotator;
use mzcore::msms::fragmentation;
use mzcore::msms::model::FragmentIonSeries;
use wasm_bindgen::prelude::*;

impl Into<MatchedFragmentPeak> for annotator::MatchedPeak {
    fn into(self) -> MatchedFragmentPeak {
        let ion_type = match self.ion_type {
            FragmentIonSeries::a => "a",
            FragmentIonSeries::a_H2O => "a-H2O",
            FragmentIonSeries::a_NH3 => "a-NH3",
            FragmentIonSeries::b => "b",
            FragmentIonSeries::b_H2O => "b-H2O",
            FragmentIonSeries::b_NH3 => "b-NH3",
            FragmentIonSeries::c => "c",
            FragmentIonSeries::c_dot => "c_dot",
            FragmentIonSeries::c_m1 => "c_m1",
            FragmentIonSeries::c_p1 => "c_p1",
            FragmentIonSeries::c_p2 => "c_p2",
            FragmentIonSeries::c_H2O => "c-H2O",
            FragmentIonSeries::c_NH3 => "c-NH3",
            FragmentIonSeries::d => "d",
            FragmentIonSeries::v => "v",
            FragmentIonSeries::w => "w",
            FragmentIonSeries::x => "x",
            FragmentIonSeries::x_H2O => "x-H2O",
            FragmentIonSeries::x_NH3 => "x-NH3",
            FragmentIonSeries::y => "y",
            FragmentIonSeries::y_H2O => "y-H2O",
            FragmentIonSeries::y_NH3 => "y-NH3",
            FragmentIonSeries::ya => "ya",
            FragmentIonSeries::yb => "yb",
            FragmentIonSeries::z => "z",
            FragmentIonSeries::z_H2O => "z-H2O",
            FragmentIonSeries::z_NH3 => "z-NH3",
            FragmentIonSeries::z_dot => "z_dot",
            FragmentIonSeries::z_p1 => "z_p1",
            FragmentIonSeries::z_p2 => "z_p2",
            FragmentIonSeries::z_p3 => "z_p3",
            FragmentIonSeries::immonium => "immonium",
        };

        MatchedFragmentPeak {
            peak_index: self.peak_index,
            peak_mz: self.peak_mz,
            peak_intensity: self.peak_intensity,
            theo_mz: self.theo_mz,
            mz_error: self.mz_error,
            charge: self.charge,
            ion_type: ion_type.to_string(),
            frag_index: self.frag_index,
            aa_position: self.aa_position,
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
pub struct MatchedPeakIndex(pub usize, pub usize);

#[wasm_bindgen(getter_with_clone)]
#[derive(Clone, PartialEq, Debug)]
pub struct MatchedFragmentPeak {
    pub peak_index: usize,
    pub peak_mz: f64,
    pub peak_intensity: f64,
    pub theo_mz: f64,
    pub mz_error: f32,
    pub charge: i8,
    pub ion_type: String,
    pub frag_index: u16, // index of m/z value in the fragmentation table (starts at 0)
    pub aa_position: u16, // AA position in amino acid sequence (starts at 1)
}

#[wasm_bindgen]
pub enum MzErrorTolType {
    Ppm,
    Da,
    Mmu,
}

// TODO: allow ppm mz_error_tol. Probably needs extension of mzcore-rs
#[wasm_bindgen(js_name = annotateSpectrum)]
pub fn annotate_spectrum(
    pep_seq: String,
    mzs: &[f64],
    intensities: &[f64],
    mz_error_tol_lo: f64,
    mz_error_tol_hi: f64,
    mz_error_tol_type: MzErrorTolType,
) -> Result<Vec<MatchedFragmentPeak>, JsValue> {
    let frag_table = fragmentation::compute_frag_table_without_mods(
        &pep_seq,
        &[FragmentIonSeries::b, FragmentIonSeries::y],
        &vec![1, 2, 3, 4],
        &STANDARD_AMINO_ACID_TABLE,
    )
    .map_err(|err| format!("{:?}", err))?;

    let peaks = mzs
        .iter()
        .zip(intensities.iter())
        .map(|(x, y)| [*x, *y])
        .collect::<Vec<[f64; 2]>>();

    let tol_window = match mz_error_tol_type {
        MzErrorTolType::Ppm => MassTolWindow::ppm(mz_error_tol_lo, mz_error_tol_hi),
        MzErrorTolType::Da => MassTolWindow::Da(mz_error_tol_lo, mz_error_tol_hi),
        MzErrorTolType::Mmu => MassTolWindow::mmu(mz_error_tol_lo, mz_error_tol_hi),
    };

    let matched_peaks = annotator::annotate_spectrum(&peaks, &frag_table, tol_window)
        .into_iter()
        .map(|x| x.into())
        .collect::<Vec<MatchedFragmentPeak>>();

    Ok(matched_peaks)
}

#[wasm_bindgen(js_name = matchPeaks)]
pub fn match_peaks(
    query_mzs: &[f64],
    query_intensities: &[f64],
    reference_mzs: &[f64],
    reference_intensities: &[f64],
    mz_error_tol_lo: f64,
    mz_error_tol_hi: f64,
    mz_error_tol_type: MzErrorTolType,
) -> Vec<MatchedPeakIndex> {
    // TODO: deduplicate this code and make it more efficient, elegant and readable

    let tol_window = match mz_error_tol_type {
        MzErrorTolType::Ppm => MassTolWindow::ppm(mz_error_tol_lo, mz_error_tol_hi),
        MzErrorTolType::Da => MassTolWindow::Da(mz_error_tol_lo, mz_error_tol_hi),
        MzErrorTolType::Mmu => MassTolWindow::mmu(mz_error_tol_lo, mz_error_tol_hi),
    };

    let query_matches: HashSet<MatchedPeakIndex> = query_mzs
        .iter()
        .enumerate()
        .map(|(i, q)| {
            let mut matched = vec![];

            for (j, r) in reference_mzs.iter().enumerate() {
                if tol_window.contains(*q, *r) {
                    matched.push(j);
                }
            }

            let max_intensity: Option<(usize, f64)> = matched
                .iter()
                .map(|&j| (j, reference_intensities[j]))
                .max_by(|(_, a), (_, b)| {
                    a.partial_cmp(b)
                        .expect("Failed to compare intensity values")
                });

            if let Some((j, _)) = max_intensity {
                (i, Some(j))
            } else {
                (i, None)
            }
        })
        .filter(|x| x.1.is_some())
        .map(|x| MatchedPeakIndex(x.0, x.1.unwrap()))
        .collect();

    let reference_matches: HashSet<MatchedPeakIndex> = reference_mzs
        .iter()
        .enumerate()
        .map(|(i, r)| {
            let mut matched = vec![];

            for (j, q) in query_mzs.iter().enumerate() {
                if tol_window.contains(*q, *r) {
                    matched.push(j);
                }
            }

            let max_intensity: Option<(usize, f64)> = matched
                .iter()
                .map(|&j| (j, query_mzs[j]))
                .max_by(|(_, a), (_, b)| {
                    a.partial_cmp(b)
                        .expect("Failed to compare intensity values")
                });

            if let Some((j, _)) = max_intensity {
                (i, Some(j))
            } else {
                (i, None)
            }
        })
        .filter(|x| x.1.is_some())
        .map(|x| MatchedPeakIndex(x.1.unwrap(), x.0))
        .collect();

    let mut unique_matches: HashSet<_> = query_matches.union(&reference_matches).cloned().collect();

    unique_matches.clone().into_iter().for_each(|matched_peak| {
        unique_matches
            .clone()
            .into_iter()
            .for_each(|other_matched_peak| {
                if matched_peak.0 == other_matched_peak.0 && matched_peak.1 == other_matched_peak.1
                {
                    return;
                }

                if matched_peak.0 == other_matched_peak.0 || matched_peak.1 == other_matched_peak.1
                {
                    let intensity_sum_matched =
                        query_intensities[matched_peak.0] + reference_intensities[matched_peak.1];
                    let intensity_sum_other_matched = query_intensities[other_matched_peak.0]
                        + reference_intensities[other_matched_peak.1];

                    if intensity_sum_matched > intensity_sum_other_matched {
                        unique_matches.remove(&other_matched_peak);
                    } else {
                        unique_matches.remove(&matched_peak);
                    }
                }
            });
    });

    unique_matches.into_iter().collect()
}

#[wasm_bindgen(start)]
pub fn main() {
    utils::set_panic_hook();
}
