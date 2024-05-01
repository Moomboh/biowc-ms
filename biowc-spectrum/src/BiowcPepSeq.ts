import { MatchedFragmentPeak } from 'biowclib-mz';
import { LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './styles/biowc-pep-seq.css.js';

@customElement('biowc-pep-seq')
export class BiowcPepSeq extends LitElement {
  static styles = styles;

  @property({ type: String })
  pepSeq: string = '';

  @property({ type: Object })
  matchedIons: MatchedFragmentPeak[] = [];

  @property({ type: Number })
  fontSize: number = 20;

  @property({ type: String })
  fontFamily: string = 'monospace';

  @property({ type: String })
  fontWeight: string = 'normal';

  @property({ type: Number })
  spacing: number = 1.66;

  @property({ type: Number })
  letterWidthRatio: number = 0.6;

  @property({ type: Number })
  ionStrokeWidth: number = 3;

  private get _pepSeqLength() {
    return this.pepSeq.length;
  }

  private get _svgWidth() {
    return (this._pepSeqLength + 1) * this.spacing * this.fontSize;
  }

  render() {
    return svg`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${this._svgWidth}"
        height="${this.fontSize * this.spacing}"
        class="biowc-pep-seq"
      >
        ${this._renderPepSeq()}
        ${this._renderMatchedIons()}
      </svg>
    `;
  }

  private _renderPepSeq() {
    return svg`
      ${Array.from(this.pepSeq).map(
        (aa, i) => svg`
          <text
            x="${(i + 1) * this.spacing * this.fontSize - (this.letterWidthRatio * this.fontSize) / 2}"
            y="${(this.spacing / 2 + 0.5) * this.fontSize - 3}"
            font-size="${this.fontSize}"
            font-family="${this.fontFamily}"
            font-weight="${this.fontWeight}"
            fill="black"
          >
            ${aa}
          </text>
        `,
      )}
    `;
  }

  private _renderMatchedIons() {
    return svg`
      ${this.matchedIons.map(
        ion => svg`
          ${this._renderIonFragment(ion)}
        `,
      )}
    `;
  }

  private _renderIonFragment(ion: MatchedFragmentPeak) {
    // TODO: add all possible ion types
    //       Also make it non redundant for different ion types
    //       i.e. just decide between N and C terminal and color accordingly
    if (ion.ion_type === 'b') {
      return this._renderBIonFragment(ion.aa_position);
    }

    if (ion.ion_type === 'y') {
      return this._renderYIonFragment(ion.aa_position);
    }

    return svg``;
  }

  private _renderBIonFragment(aaPosition: number) {
    return svg`
      <path
        d="
          M ${aaPosition * this.spacing * this.fontSize + (this.spacing / 4) * this.fontSize} 0
          l ${(this.spacing / 4) * this.fontSize} ${(this.spacing / 4) * this.fontSize}
          l 0 ${(this.spacing / 4) * this.fontSize}
        "
        stroke="blue"
        fill="none"
        stroke-width="${this.ionStrokeWidth}"
      />
    `;
  }

  private _renderYIonFragment(aaPosition: number) {
    return svg`
      <path
        d="
          M ${aaPosition * this.spacing * this.fontSize - (this.spacing / 4) * this.fontSize} ${this.spacing * this.fontSize}
          l -${(this.spacing / 4) * this.fontSize} -${(this.spacing / 4) * this.fontSize}
          l 0 -${(this.spacing / 4) * this.fontSize}
        "
        stroke="red"
        fill="none"
        stroke-width="${this.ionStrokeWidth}"
      />
    `;
  }
}
