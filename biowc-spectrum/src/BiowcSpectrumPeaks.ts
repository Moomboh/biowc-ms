import { LitElement, PropertyValueMap, svg } from 'lit';
import { customElement, property, query, queryAll } from 'lit/decorators.js';
import styles from './styles/biowc-spectrum-peaks.css.js';
import range from './utils/range.js';
import { IndexedMatchedIons, PEAK_COLOR_MAP } from './peaks.js';

@customElement('biowc-spectrum-peaks')
export class BiowcSpectrumPeaks extends LitElement {
  static styles = styles;

  @property({ type: Boolean, attribute: 'mirror' })
  mirror = false;

  @property({ type: Array, attribute: 'mzs' })
  mzs: number[] = [];

  @property({ type: Array, attribute: 'intensities' })
  intensities: number[] = [];

  // TODO: this is currently only required for its length
  //       to correctly number the ions.
  //       Maybe this can be removed in the future by adding the
  //       correct numbering to the matched peaks.
  @property({ type: String, attribute: 'pep-seq' })
  pepSeq = '';

  @property({ type: Object, attribute: 'matched-peaks' })
  indexedMatchedIons: IndexedMatchedIons = {};

  @property({ type: Array, attribute: 'hide-peak-indices' })
  hidePeakIndices: number[] = [];

  @property({ type: Number, attribute: 'min-mz' })
  minMz: number | null = null;

  @property({ type: Number, attribute: 'max-mz' })
  maxMz: number | null = null;

  @property({ type: String, attribute: 'mz-label' })
  mzLabel = 'm/z';

  @property({ type: Boolean, attribute: 'hide-mz-axis-label' })
  hideMzAxisLabel = false;

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
  yTicksPrecision = 2;

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

  @property({ type: Number, attribute: 'annotation-font-size' })
  annotationFontSize = 12;

  @property({ type: String, attribute: 'annotation-font-family' })
  annotationFontFamily = 'monospace';

  @property({ type: Number, attribute: 'x-axis-padding' })
  xAxisPadding = 12;

  @property({ type: Number, attribute: 'y-axis-padding-frac' })
  yAxisPaddingFrac = 0.1;

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

  get xScroll() {
    return this._xScroll;
  }

  set xScroll(xScroll: number) {
    this._xScroll = xScroll;
    this._updateZoomAndScroll();
  }

  get yZoom() {
    return this._yZoom;
  }

  set yZoom(yZoom: number) {
    this._yZoom = yZoom;
    this._updateZoomAndScroll();
  }

  get yScroll() {
    return this._yScroll;
  }

  set yScroll(yScroll: number) {
    this._yScroll = yScroll;
    this._updateZoomAndScroll();
  }

  @query('#peaks')
  private _peaksGroup: SVGGElement | undefined;

  @queryAll('.annotation')
  private _annotations: SVGTextElement[] | undefined;

  @queryAll('.x-tick-label')
  private _xTickLabels: SVGTextElement[] | undefined;

  @queryAll('.y-tick-label')
  private _yTickLabels: SVGTextElement[] | undefined;

  private _xZoom = 1;

  private _xScroll = 0;

  private _yZoom = 1;

  private _yScroll = 0;

  private get _minMz() {
    if (this.minMz !== null) {
      return this.minMz;
    }

    return Math.min(...this.mzs);
  }

  private get _maxMz() {
    if (this.maxMz !== null) {
      return this.maxMz;
    }

    return Math.max(...this.mzs);
  }

  private get _mzRange() {
    return this._maxMz - this._minMz;
  }

  private get _maxIntensity() {
    return Math.max(...this.intensities) * (1 + this.yAxisPaddingFrac);
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
    return this.mirror
      ? 2 * this.tickLength +
          this.tickFontSize +
          3 + // TODO: check why SVG-Text elements are 3px larger than their font-size
          (this.hideMzAxisLabel
            ? 0
            : this.axesLabelMargin + this.axesLabelFontSize + 3) + // TODO: check why SVG-Text elements are 3px larger than their font-size
          this.tickMargin
      : this.offsetHeight -
          2 * this.tickLength -
          this.tickFontSize -
          3 - // TODO: check why SVG-Text elements are 3px larger than their font-size
          this.axesLabelMargin -
          this.axesLabelFontSize -
          3 - // TODO: check why SVG-Text elements are 3px larger than their font-size
          this.tickMargin;
  }

  private get _axesYEnd() {
    return this.mirror
      ? this.offsetHeight - this.tickFontSize / 2
      : this.tickFontSize / 2;
  }

  private get _axesXCenter() {
    return this._axesXStart + (this._axesXEnd - this._axesXStart) / 2;
  }

  private get _axesYCenter() {
    return this._axesYEnd + (this._axesYStart - this._axesYEnd) / 2;
  }

  private get _axesXWidth() {
    return this._axesXEnd - this._axesXStart;
  }

  private get _axesXWidthPadded() {
    return this._axesXEndPadded - this._axesXStartPadded;
  }

  private get _axesYHeight() {
    return this.mirror
      ? this._axesYEnd - this._axesYStart
      : this._axesYStart - this._axesYEnd;
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

  protected updated(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    this._updateZoomAndScroll();
  }

  updateZoomScroll(
    xZoom: number,
    xScroll: number,
    yZoom: number,
    yScroll: number,
  ) {
    this._xZoom = xZoom;
    this._xScroll = xScroll;
    this._yZoom = yZoom;
    this._yScroll = yScroll;

    this._updateZoomAndScroll(true);
  }

  private _renderAxes() {
    const xAxesLabelX = this._axesXCenter;
    const xAxesLabelY = this.mirror
      ? this.axesLabelFontSize + 3 // TODO: check why svg text elements are 3px larger than font-size
      : this.offsetHeight - this.axesLabelMargin;
    const yAxesLabelX = this.axesLabelMargin + 3; // TODO: check why svg text elements are 3px larger than font-size
    const yAxesLabelY = this._axesYCenter;

    return svg`
      <g>
        <!-- Intensity/y-axis -->
        ${
          this.hideMzAxisLabel
            ? svg``
            : svg`
          <text
            x="${xAxesLabelX}"
            y="${xAxesLabelY}"
            font-size="${this.axesLabelFontSize}"
            font-family="${this.axesLabelFontFamily}"
            text-anchor="middle"
          >
            ${this.mzLabel}
          </text>
        `
        }

        ${range(0, this.nXTicks - 1).map((i: number) =>
          this._renderXtick(i / (this.nXTicks - 1)),
        )}

        <line
          x1="${this._axesXStart}"
          y1="${this._axesYStart}"
          x2="${this._axesXEnd}"
          y2="${this._axesYStart}"
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
          this._renderYtick(i / (this.nYTicks - 1)),
        )}

        <line
          x1="${this._axesXStart}"
          y1="${this._axesYEnd}"
          x2="${this._axesXStart}"
          y2="${this._axesYStart}"
          stroke="black"
        />
      </g>
    `;
  }

  private _renderXtick(axesFrac: number) {
    const x = this._mzToX(this._minMz + axesFrac * this._mzRange);

    const lineY1 = this._axesYStart;
    const lineY2 = this.mirror
      ? lineY1 - this.tickLength
      : lineY1 + this.tickLength;
    const textY = this.mirror
      ? lineY2 - this.tickMargin
      : lineY2 + this.tickFontSize + this.tickMargin;

    return svg`
      <line
        x1="${x}"
        y1="${lineY1}"
        x2="${x}"
        y2="${lineY2}"
        stroke="black"
      />
      <text
        x="${x}"
        y="${textY}"
        font-size="${this.tickFontSize}"
        font-family="${this.tickFontFamily}"
        text-anchor="middle"
        class="x-tick-label"
        data-fraction="${axesFrac}"
      ></text>
    `;
  }

  private _renderYtick(axesFrac: number) {
    const y = this._intensityToY(
      this._intensityRange - axesFrac * this._intensityRange,
    );

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
      ></text>
    `;
  }

  private _renderPeaks() {
    const transformOrigin = `${this._axesXStartPadded} ${this._axesYStart}`;
    const transform = `translate(${this._xScroll}, ${-this._yScroll}) scale(${
      this._xZoom
    }, ${this._yZoom})`;

    const clipX = this._axesXStart;
    const clipY = this.mirror ? this._axesYStart : this._axesYEnd;

    return svg`
      <clipPath id="peaks-clip">
        <rect
          x="${clipX}"
          y="${clipY}"
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
            this._renderPeak(mz, this.intensities[i], i),
          )}
        </g>
      </g>
    `;
  }

  private _renderPeak(mz: number, intensity: number, i: number) {
    if (this.hidePeakIndices.includes(i)) {
      return svg``;
    }

    let stroke = 'grey';
    let annotationSvg = svg``;

    if (this.indexedMatchedIons[i]) {
      const matchedPeak = this.indexedMatchedIons[i];
      const ionType = matchedPeak.ion_type;
      let aaPosition = matchedPeak.aa_position;

      if (ionType === 'y') {
        aaPosition = this.pepSeq.length - aaPosition + 1;
      }

      const { charge } = matchedPeak;

      stroke = PEAK_COLOR_MAP.get(ionType) || 'grey';

      const annotationX = this._mzToX(mz);
      const annotationY = this._intensityToY(intensity);
      const text = `${ionType}${aaPosition}${'+'.repeat(charge)}`;

      annotationSvg = svg`
        <text
          x="${annotationX}"
          y="${annotationY}"
          font-size="${this.annotationFontSize}"
          font-family="${this.annotationFontFamily}"
          text-anchor="left"
          alignment-baseline="middle"
          fill="${stroke}"
          transform="${this.mirror ? 'rotate(90)' : 'rotate(-90)'} scale(${1 / this._xZoom}, ${1 / this._yZoom})"
          transform-origin="${annotationX} ${annotationY}"
          class="annotation"
          vector-effect="non-scaling-stroke"
        >
          ${text}
        </text>
      `;
    }

    const x = this._mzToX(mz);

    const lineSvg = svg`
      <line
        x1="${x}"
        y1="${this._axesYStart}"
        x2="${x}"
        y2="${this._intensityToY(intensity)}"
        stroke="${stroke}"
        vector-effect="non-scaling-stroke"
      />
    `;

    return svg`
      ${lineSvg}
      ${annotationSvg}
    `;
  }

  private _updateZoomAndScroll(suppressEvent = false) {
    this._peaksGroup?.setAttribute(
      'transform',
      `translate(${this._xScroll}, ${-this._yScroll}) scale(${this._xZoom}, ${
        this._yZoom
      })`,
    );

    this._annotations?.forEach(annotation => {
      annotation.setAttribute(
        'transform',
        `${this.mirror ? 'rotate(90)' : 'rotate(-90)'} scale(${1 / this._yZoom}, ${1 / this._xZoom})`,
      );
    });

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

    if (!suppressEvent) {
      const event = new CustomEvent('zoom-scroll', {
        detail: {
          xZoom: this._xZoom,
          xScroll: this._xScroll,
          yZoom: this._yZoom,
          yScroll: this._yScroll,
        },
      });

      this.dispatchEvent(event);
    }
  }

  private _handleResize() {
    this.requestUpdate();
  }

  private _handleWheel(e: WheelEvent) {
    e.preventDefault();

    if (e.ctrlKey) {
      this._handleXZoom(e.deltaX, e.offsetX - this._axesXStartPadded);
      this._handleYZoom(e.deltaY, this._axesYStart - e.offsetY);
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
      zoomChange * (this._xScroll - xCenter) + xCenter,
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
      zoomChange * (this._yScroll - yCenter) + yCenter,
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
    const clippedOffset = this.mirror
      ? Math.max(Math.min(yOffset, maxOffset), 0)
      : Math.min(Math.max(yOffset, -maxOffset), 0);
    return clippedOffset;
  }

  private _mzToX(mz: number) {
    return (
      this._axesXStartPadded +
      ((mz - this._minMz) / this._mzRange) * this._axesXWidthPadded
    );
  }

  private _intensityToY(intensity: number) {
    return this.mirror
      ? this._axesYEnd -
          (1 - intensity / this._intensityRange) * this._axesYHeight
      : this._axesYEnd +
          (1 - intensity / this._intensityRange) * this._axesYHeight;
  }

  private _xTickFractionToMzLabel(fraction: number): string {
    const scaledMinMz =
      this._minMz +
      (-this._xScroll / (this._axesXWidthPadded * this._xZoom)) * this._mzRange;
    const scaledMaxMz = scaledMinMz + this._mzRange / this._xZoom;
    const scaledMzRange = scaledMaxMz - scaledMinMz;

    return (scaledMinMz + fraction * scaledMzRange).toPrecision(
      this.xTicksPrecision,
    );
  }

  private _yTickFractionToIntensityLabel(fraction: number): string {
    const scaledMinIntensity = this.mirror
      ? (this._yScroll / (this._axesYHeight * this._yZoom)) *
        this._intensityRange
      : (-this._yScroll / (this._axesYHeight * this._yZoom)) *
        this._intensityRange;

    const scaledMaxIntensity =
      scaledMinIntensity + this._intensityRange / this._yZoom;

    const scaledIntensityRange = scaledMaxIntensity - scaledMinIntensity;

    return (scaledMaxIntensity - fraction * scaledIntensityRange).toPrecision(
      this.yTicksPrecision,
    );
  }
}
