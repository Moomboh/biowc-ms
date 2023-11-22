import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('biowc-spectrum')
export class BiowcSpectrum extends LitElement {
  // Render the UI as a function of component state
  render() {
    return html`<p>Hello, BiowcSpectrum!</p>`;
  }
}
