import { MatchedPeak } from 'biowc-ms-lib';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './styles/biowc-pep-seq.css.js';

@customElement('biowc-pep-seq')
export class BiowcPepSeq extends LitElement {
  static styles = styles;

  @property({ type: String })
  pepSeq: string = '';

  @property({ type: Object })
  matchedPeaks: MatchedPeak[] = [];

  render() {
    return html` <div>${this.pepSeq}</div> `;
  }
}
