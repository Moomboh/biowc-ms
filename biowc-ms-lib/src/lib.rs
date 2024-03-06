mod utils;

use wasm_bindgen::prelude::*;
use mzcore::msms::annotator;
use mzcore::msms::fragmentation;
use mzcore::msms::model::FragmentIonSeries;
use mzcore::chemistry::table::STANDARD_AMINO_ACID_TABLE;


#[wasm_bindgen(js_name = annotateSpectrum)]
pub fn annotate_spectrum(pep_seq: String, mzs: &[f64], intensities: &[f64], mz_error_tol: f64) -> Result<String, JsValue> {
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
    );

    Ok(format!("{:?}", matched_peaks))
    // Ok(format!("{:?}", matched_peaks))
}
