mod utils;

use wasm_bindgen::prelude::*;
use mzcore::msms::annotator;
use mzcore::msms::fragmentation;
use mzcore::msms::model::FragmentIonSeries;
use mzcore::chemistry::table::STANDARD_AMINO_ACID_TABLE;

impl Into<MatchedPeak> for annotator::MatchedPeak {
    fn into(self) -> MatchedPeak {
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

        MatchedPeak {
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


#[wasm_bindgen(getter_with_clone)]
#[derive(Clone, PartialEq, Debug)]
pub struct MatchedPeak {
    pub peak_index: usize,
    pub peak_mz: f64,
    pub peak_intensity: f64,
    pub theo_mz: f64,
    pub mz_error: f32,
    pub charge: i8,
    pub ion_type: String,
    pub frag_index: u16,  // index of m/z value in the fragmentation table (starts at 0)
    pub aa_position: u16, // AA position in amino acid sequence (starts at 1)
}

// TODO: allow ppm mz_error_tol. Probably needs extension of mzcore-rs
#[wasm_bindgen(js_name = annotateSpectrum)]
pub fn annotate_spectrum(pep_seq: String, mzs: &[f64], intensities: &[f64], mz_error_tol: f64) -> Result<Vec<MatchedPeak>, JsValue> {
    let frag_table = fragmentation::compute_frag_table_without_mods(
        &pep_seq,
        &[FragmentIonSeries::b, FragmentIonSeries::y],
        &vec![1, 2, 3, 4],
        &STANDARD_AMINO_ACID_TABLE
    ).map_err(|err| format!("{:?}", err))?;

    let peaks = mzs.iter().zip(intensities.iter()).map(|(x, y)| [*x, *y]).collect::<Vec<[f64;2]>>();

    let matched_peaks = annotator::annotate_spectrum(
        &peaks,
        &frag_table,
        mz_error_tol
    )
    .into_iter()
    .map(|x| x.into())
    .collect::<Vec<MatchedPeak>>();

    Ok(matched_peaks)
}

#[wasm_bindgen(start)]
pub fn main() {
    utils::set_panic_hook();
}