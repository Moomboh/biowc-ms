import { MatchedFragmentPeak } from 'biowc-ms-lib';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './styles/biowc-pep-seq.css.js';

@customElement('biowc-pep-seq')
export class BiowcPepSeq extends LitElement {
  static styles = styles;

  @property({ type: String })
  pepSeq: string = '';

  @property({ type: Object })
  matchedIons: MatchedFragmentPeak[] = [];

  render() {
    return html` <div>${this.pepSeq}</div> `;
  }
}
