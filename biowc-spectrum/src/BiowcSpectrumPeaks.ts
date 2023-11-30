import { LitElement, svg } from 'lit';
import { customElement, property, query, queryAll } from 'lit/decorators.js';
import styles from './styles/biowc-spectrum-peaks.css.js';
import range from './utils/range.js';

@customElement('biowc-spectrum-peaks')
export class BiowcSpectrumPeaks extends LitElement {
  static styles = styles;

  @property({ type: Array, attribute: 'mzs' })
  mzs: number[] = [];

  @property({ type: Array, attribute: 'intensities' })
  intensities: number[] = [];

  @property({ type: String, attribute: 'mz-label' })
  mzLabel = 'm/z';

  @property({ type: String, attribute: 'intensity-label' })
  intensityLabel = 'Intensity';

  @property({ type: Number, attribute: 'axes-label-font-size' })
  axesLabelFontSize = 20;

  @property({ type: Number, attribute: 'axes-label-margin' })
  axesLabelMargin = 10;

  @property({ type: String, attribute: 'axes-label-font-family' })
  axesLabelFontFamily = 'sans-serif';

  @property({ type: Number, attribute: 'n-x-ticks' })
  nXTicks = 5;

  @property({ type: Number, attribute: 'n-y-ticks' })
  nYTicks = 5;

  @property({ type: Number, attribute: 'x-ticks-precision' })
  xTicksPrecision = 5;

  @property({ type: Number, attribute: 'y-ticks-precision' })
  yTicksPrecision = 5;

  @property({ type: Number, attribute: 'tick-font-size' })
  tickFontSize = 16;

  @property({ type: String, attribute: 'tick-font-family' })
  tickFontFamily = 'monospace';

  @property({ type: Number, attribute: 'tick-letter-width-ratio' })
  tickLetterWidthRatio = 0.6;

  @property({ type: Number, attribute: 'tick-margin' })
  tickMargin = 5;

  @property({ type: Number, attribute: 'tick-length' })
  tickLength = 8;

  @property({ type: Number, attribute: 'x-axis-padding-frac' })
  xAxisPadding = 12;

  @property({ type: Number, attribute: 'zoom-sensitivity' })
  zoomSensitivity = 0.001;

  @property({ type: Number, attribute: 'scroll-sensitivity' })
  scrollSensitivity = 0.1;

  get xZoom() {
    return this._xZoom;
  }

  set xZoom(xZoom: number) {
    this._xZoom = xZoom;
    this._updateZoomAndScroll();
  }

  @query('#peaks')
  private _peaksGroup: SVGGElement | undefined;

  @queryAll('.x-tick-label')
  private _xTickLabels: SVGTextElement[] | undefined;

  @queryAll('.y-tick-label')
  private _yTickLabels: SVGTextElement[] | undefined;

  private _xZoom = 1;

  private _xScroll = 0;

  private _yZoom = 1;

  private _yScroll = 0;

  private get _minMz() {
    return Math.min(...this.mzs);
  }

  private get _maxMz() {
    return Math.max(...this.mzs);
  }

  private get _mzRange() {
    return this._maxMz - this._minMz;
  }

  private get _maxIntensity() {
    return Math.max(...this.intensities);
  }

  private get _intensityRange() {
    return this._maxIntensity;
  }

  private get _axesXStart() {
    const yTickWidth =
      this._maxIntensity.toPrecision(this.yTicksPrecision).length *
      this.tickLetterWidthRatio *
      this.tickFontSize;

    return (
      this.axesLabelFontSize +
      3 + // TODO: check why SVG-Text elements are 3px larger than their font-size
      this.axesLabelMargin +
      yTickWidth +
      this.tickMargin
    );
  }

  private get _axesXStartPadded() {
    return this._axesXStart + this.xAxisPadding;
  }

  private get _axesXEnd() {
    const xTickWidth =
      this._maxMz.toPrecision(this.xTicksPrecision).length *
      this.tickLetterWidthRatio *
      this.tickFontSize;

    return this.offsetWidth - xTickWidth / 2;
  }

  private get _axesXEndPadded() {
    return this._axesXEnd - this.xAxisPadding;
  }

  private get _axesYStart() {
    return this.tickFontSize / 2;
  }

  private get _axesYEnd() {
    return (
      this.offsetHeight -
      2 * this.tickLength -
      this.tickFontSize -
      3 - // TODO: check why SVG-Text elements are 3px larger than their font-size
      this.axesLabelMargin -
      this.axesLabelFontSize -
      3 - // TODO: check why SVG-Text elements are 3px larger than their font-size
      this.tickMargin
    );
  }

  private get _axesXCenter() {
    return this._axesXStart + (this._axesXEnd - this._axesXStart) / 2;
  }

  private get _axesYCenter() {
    return this._axesYStart + (this._axesYEnd - this._axesYStart) / 2;
  }

  private get _axesXWidth() {
    return this._axesXEnd - this._axesXStart;
  }

  private get _axesXWidthPadded() {
    return this._axesXEndPadded - this._axesXStartPadded;
  }

  private get _axesYHeight() {
    return this._axesYEnd - this._axesYStart;
  }

  constructor() {
    super();
    new ResizeObserver(this._handleResize.bind(this)).observe(this);
  }

  connectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();

    this.addEventListener('wheel', this._handleWheel);
    // TODO: add touch events
  }

  disconnectedCallback() {
    // eslint-disable-next-line wc/guard-super-call
    super.disconnectedCallback();

    this.removeEventListener('wheel', this._handleWheel);
    // TODO: add touch events
  }

  render() {
    const width = `${this.offsetWidth}`;
    const height = `${this.offsetHeight}`;

    return svg`
      <svg
        width="${width}"
        height="${height}"
        class="biowc-spectrum-peaks"
      >
        ${this._renderAxes()}
        ${this._renderPeaks()}
      </svg>
    `;
  }

  private _renderAxes() {
    const xAxesLabelX = this._axesXCenter;
    const xAxesLabelY = this.offsetHeight - this.axesLabelMargin;
    const yAxesLabelX = this.axesLabelMargin + 3; // TODO: check why svg text elements are 3px larger than font-size
    const yAxesLabelY = this._axesYCenter;

    return svg`
      <g>
        <!-- Intensity/y-axis -->
        <text
          x="${xAxesLabelX}"
          y="${xAxesLabelY}"
          font-size="${this.axesLabelFontSize}"
          font-family="${this.axesLabelFontFamily}"
          text-anchor="middle"
        >
          ${this.mzLabel}
        </text>

        ${range(0, this.nXTicks - 1).map((i: number) =>
          this._renderXtick(i / (this.nXTicks - 1))
        )}

        <line
          x1="${this._axesXStart}"
          y1="${this._axesYEnd}"
          x2="${this._axesXEnd}"
          y2="${this._axesYEnd}"
          stroke="black"
        />

        <!-- mz/x-axis -->
        <text
          x="${yAxesLabelX}"
          y="${yAxesLabelY}"
          font-size="${this.axesLabelFontSize}"
          font-family="${this.axesLabelFontFamily}"
          text-anchor="middle"
          transform="rotate(-90, ${yAxesLabelX}, ${yAxesLabelY})"
        >
          ${this.intensityLabel}
        </text>

        ${range(0, this.nYTicks - 1).map((i: number) =>
          this._renderYtick(i / (this.nYTicks - 1))
        )}

        <line
          x1="${this._axesXStart}"
          y1="${this._axesYStart}"
          x2="${this._axesXStart}"
          y2="${this._axesYEnd}"
          stroke="black"
        />
      </g>
    `;
  }

  private _renderXtick(axesFrac: number) {
    const x = this._mzToX(this._minMz + axesFrac * this._mzRange);
    const label = this._xTickFractionToMzLabel(axesFrac);

    return svg`
      <line
        x1="${x}"
        y1="${this._axesYEnd}"
        x2="${x}"
        y2="${this._axesYEnd + this.tickLength}"
        stroke="black"
      />
      <text
        x="${x}"
        y="${
          this._axesYEnd + this.tickLength + this.tickFontSize + this.tickMargin
        }"
        font-size="${this.tickFontSize}"
        font-family="${this.tickFontFamily}"
        text-anchor="middle"
        class="x-tick-label"
        data-fraction="${axesFrac}"
      >
        ${label}
      </text>
    `;
  }

  private _renderYtick(axesFrac: number) {
    const y = this._intensityToY(
      this._intensityRange - axesFrac * this._intensityRange
    );
    const label = this._yTickFractionToIntensityLabel(axesFrac);

    return svg`
      <line
        x1="${this._axesXStart - this.tickLength}"
        y1="${y}"
        x2="${this._axesXStart}"
        y2="${y}"
        stroke="black"
      />
      <text
        x="${this._axesXStart - this.tickLength - this.tickMargin}"
        y="${y + this.tickFontSize / 3}"
        font-size="${this.tickFontSize}"
        font-family="${this.tickFontFamily}"
        text-anchor="end"
        class="y-tick-label"
        data-fraction="${axesFrac}"
      >
        ${label}
      </text>
    `;
  }

  private _renderPeaks() {
    const transformOrigin = `${this._axesXStartPadded} ${this._axesYEnd}`;
    const transform = `translate(${this._xScroll}, ${-this._yScroll}) scale(${
      this._xZoom
    }, ${this._yZoom})`;

    return svg`
      <clipPath id="peaks-clip">
        <rect
          x="${this._axesXStart}"
          y="${this._axesYStart}"
          width="${this._axesXWidth}"
          height="${this._axesYHeight}"
        />
      </clipPath>

      <g clip-path="url(#peaks-clip)">
        <g
          id="peaks"
          transform-origin="${transformOrigin}"
          transform="${transform}"
        >
          ${this.mzs.map((mz: number, i: number) =>
            this._renderPeak(mz, this.intensities[i])
          )}
        </g>
      </g>
    `;
  }

  private _renderPeak(mz: number, intensity: number) {
    return svg`
      <line
        x1="${this._mzToX(mz)}"
        y1="${this._axesYEnd}"
        x2="${this._mzToX(mz)}"
        y2="${this._intensityToY(intensity)}"
        stroke="grey"
        vector-effect="non-scaling-stroke"
      />
    `;
  }

  private _updateZoomAndScroll() {
    this._peaksGroup?.setAttribute(
      'transform',
      `translate(${this._xScroll}, ${-this._yScroll}) scale(${this._xZoom}, ${
        this._yZoom
      })`
    );

    this._xTickLabels?.forEach(tickLabel => {
      const fraction = parseFloat(tickLabel.dataset.fraction || '0');
      // eslint-disable-next-line no-param-reassign
      tickLabel.textContent = this._xTickFractionToMzLabel(fraction);
    });

    this._yTickLabels?.forEach(tickLabel => {
      const fraction = parseFloat(tickLabel.dataset.fraction || '0');
      // eslint-disable-next-line no-param-reassign
      tickLabel.textContent = this._yTickFractionToIntensityLabel(fraction);
    });
  }

  private _handleResize() {
    this.requestUpdate();
  }

  private _handleWheel(e: WheelEvent) {
    e.preventDefault();

    if (e.ctrlKey) {
      this._handleXZoom(e.deltaX, e.offsetX - this._axesXStartPadded);
      this._handleYZoom(e.deltaY, e.offsetY - this._axesYStart);
    } else {
      if (this._xZoom > 1) {
        this._handleXScroll(e.deltaX);
      }

      if (this._yZoom > 1) {
        this._handleYScroll(e.deltaY);
      }
    }
  }

  private _handleXZoom(xDelta: number, xCenter: number) {
    const xZoomDelta = xDelta * this.zoomSensitivity;
    const zoomChange = 1 + xZoomDelta;
    const xZoom = this._xZoom * zoomChange;

    this._xZoom = Math.max(1, xZoom);
    this._xScroll = this._clipXOffset(
      zoomChange * (this._xScroll - xCenter) + xCenter
    );

    this._updateZoomAndScroll();
  }

  private _handleXScroll(xDelta: number) {
    const xScrollDelta = xDelta * this.scrollSensitivity;
    this._xScroll = this._clipXOffset(this._xScroll + xScrollDelta);

    this._updateZoomAndScroll();
  }

  private _handleYZoom(yDelta: number, yCenter: number) {
    const yZoomDelta = yDelta * this.zoomSensitivity;
    const zoomChange = 1 + yZoomDelta;
    const yZoom = this._yZoom * zoomChange;

    this._yZoom = Math.max(1, yZoom);
    this._yScroll = this._clipYOffset(
      zoomChange * (this._yScroll - yCenter) + yCenter
    );

    this._updateZoomAndScroll();
  }

  private _handleYScroll(yDelta: number) {
    const yScrollDelta = yDelta * this.scrollSensitivity;
    this._yScroll = this._clipYOffset(this._yScroll + yScrollDelta);

    this._updateZoomAndScroll();
  }

  private _clipXOffset(xOffset: number): number {
    const maxOffset = (this._xZoom - 1) * this._axesXWidthPadded;
    return Math.min(Math.max(xOffset, -maxOffset), 0);
  }

  private _clipYOffset(yOffset: number): number {
    const maxOffset = (this._yZoom - 1) * this._axesYHeight;
    return Math.min(Math.max(yOffset, -maxOffset), 0);
  }

  private _mzToX(mz: number) {
    return (
      this._axesXStartPadded +
      ((mz - this._minMz) / this._mzRange) * this._axesXWidthPadded
    );
  }

  private _intensityToY(intensity: number) {
    return (
      this._axesYStart +
      (1 - intensity / this._intensityRange) * this._axesYHeight
    );
  }

  private _xTickFractionToMzLabel(fraction: number): string {
    const scaledMinMz =
      this._minMz +
      (-this._xScroll / (this._axesXWidthPadded * this._xZoom)) * this._mzRange;
    const scaledMaxMz = scaledMinMz + this._mzRange / this._xZoom;
    const scaledMzRange = scaledMaxMz - scaledMinMz;

    return (scaledMinMz + fraction * scaledMzRange).toPrecision(
      this.xTicksPrecision
    );
  }

  private _yTickFractionToIntensityLabel(fraction: number): string {
    const scaledMinIntensity =
      this._intensityRange -
      (this._yScroll / (this._axesYHeight * this._yZoom)) *
        this._intensityRange;
    const scaledMaxIntensity =
      scaledMinIntensity + this._intensityRange / this._yZoom;
    const scaledIntensityRange = scaledMaxIntensity - scaledMinIntensity;

    return (scaledMinIntensity - fraction * scaledIntensityRange).toPrecision(
      this.yTicksPrecision
    );
  }
}
