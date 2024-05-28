import { LitElement, PropertyValueMap, svg } from 'lit';
import { customElement, property, query, queryAll } from 'lit/decorators.js';
import { MatchedFragmentPeak } from 'biowclib-mz';
import range from './utils/range.js';
import styles from './styles/biowc-spectrum-error.css.js';

// eslint-disable-next-line no-shadow
export enum MzErrorType {
  ppm = 'ppm',
  da = 'da',
  mmu = 'mmu',
}

function getMzErrorTypeLabel(mzErrorType: MzErrorType): string {
  switch (mzErrorType) {
    case MzErrorType.ppm:
      return 'Error (ppm)';
    case MzErrorType.da:
      return 'Error (Da)';
    case MzErrorType.mmu:
      return 'Error (mmu)';
    default:
      return 'Error';
  }
}

function transformMzError(
  referenceMz: number,
  mzError: number,
  mzErrorType: MzErrorType,
): number {
  switch (mzErrorType) {
    case MzErrorType.ppm:
      return (mzError / referenceMz) * 1e6;
    case MzErrorType.da:
      return mzError;
    case MzErrorType.mmu:
      return (mzError / referenceMz) * 1e3;
    default:
      return mzError;
  }
}

// TODO: deduplicate axes/zoom/scroll with BiowcSpectrumPeaks
@customElement('biowc-spectrum-error')
export class BiowcSpectrumError extends LitElement {
  static styles = styles;

  @property({ type: Array })
  matchedIons: MatchedFragmentPeak[] = [];

  @property({ type: Number })
  height: number = 200;

  @property({ type: Number, attribute: 'min-mz' })
  minMz: number = 0;

  @property({ type: Number, attribute: 'max-mz' })
  maxMz: number = 0;

  @property({ type: String, attribute: 'mz-error-type' })
  mzErrorType: MzErrorType = MzErrorType.da;

  @property({ type: String, attribute: 'error-label' })
  errorLabel = '';

  @property({ type: String, attribute: 'mz-label' })
  mzLabel = 'm/z';

  @property({ type: Boolean, attribute: 'hide-mz-axis-label' })
  hideMzAxisLabel = false;

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

  @property({ type: Number, attribute: 'x-axis-padding' })
  xAxisPadding = 12;

  @property({ type: Number, attribute: 'y-axis-padding-frac' })
  yAxisPaddingFrac = 0.1;

  @property({ type: Number, attribute: 'zoom-sensitivity' })
  zoomSensitivity = 0.001;

  @property({ type: Number, attribute: 'scroll-sensitivity' })
  scrollSensitivity = 0.1;

  @queryAll('.x-tick-label')
  private _xTickLabels: SVGTextElement[] | undefined;

  @query('#error-dots')
  private _errorDotsGroup: SVGGElement | undefined;

  @queryAll('.error-dot')
  private _errorDots: SVGCircleElement[] | undefined;

  private get _errorLabel() {
    return this.errorLabel || getMzErrorTypeLabel(this.mzErrorType);
  }

  get xTickWidth() {
    if (this._xTickWidth === 0) {
      const xTickLabelLenghts = range(0, this.nXTicks - 1).map(
        (i: number) =>
          (this.minMz + (i / (this.nXTicks - 1)) * this._mzRange).toPrecision(
            this.xTicksPrecision,
          ).length,
      );

      return (
        Math.max(...xTickLabelLenghts) *
        this.tickLetterWidthRatio *
        this.tickFontSize
      );
    }

    return this._xTickWidth;
  }

  set xTickWidth(width: number) {
    this._xTickWidth = width;
  }

  private _xTickWidth = 0;

  get yTickWidth() {
    if (this._yTickWidth === 0) {
      const yTickLabelLengths = range(0, this.nYTicks - 1).map(
        (i: number) =>
          (
            this._maxError -
            (i / (this.nYTicks - 1)) * this._errorRange
          ).toPrecision(this.yTicksPrecision).length,
      );

      return (
        Math.max(...yTickLabelLengths) *
        this.tickLetterWidthRatio *
        this.tickFontSize
      );
    }

    return this._yTickWidth;
  }

  set yTickWidth(width: number) {
    this._yTickWidth = width;
  }

  private _yTickWidth = 0;

  private get _minError() {
    return Math.min(
      ...this.matchedIons.map(ion =>
        transformMzError(ion.peak_mz, ion.mz_error, this.mzErrorType),
      ),
    );
  }

  private get _maxError() {
    return Math.max(
      ...this.matchedIons.map(ion =>
        transformMzError(ion.peak_mz, ion.mz_error, this.mzErrorType),
      ),
    );
  }

  private get _mzRange() {
    return this.maxMz - this.minMz;
  }

  private get _errorRange() {
    return this._maxError - this._minError;
  }

  private get _axesXStart() {
    return (
      3 +
      this.axesLabelFontSize +
      3 + // TODO: check why SVG-Text elements are 3px larger than their font-size
      this.axesLabelMargin +
      this.yTickWidth +
      this.tickMargin
    );
  }

  private get _axesXStartPadded() {
    return this._axesXStart + this.xAxisPadding;
  }

  private get _axesXEnd() {
    return this.offsetWidth - this.xTickWidth / 2;
  }

  private get _axesXEndPadded() {
    return this._axesXEnd - this.xAxisPadding;
  }

  private get _axesYStart() {
    return (
      this.height -
      2 * this.tickLength -
      this.tickFontSize -
      3 - // TODO: check why SVG-Text elements are 3px larger than their font-size
      this.axesLabelMargin -
      this.axesLabelFontSize -
      3 - // TODO: check why SVG-Text elements are 3px larger than their font-size
      this.tickMargin
    );
  }

  private get _axesYEnd() {
    return this.tickFontSize / 2;
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
    return this._axesYStart - this._axesYEnd;
  }

  private _mzToX(mz: number) {
    return (
      this._axesXStartPadded +
      ((mz - this.minMz) / this._mzRange) * this._axesXWidthPadded
    );
  }

  private _errorToY(error: number) {
    return (
      this._axesYStart -
      (1 - (error + this._maxError) / this._errorRange) * this._axesYHeight
    );
  }

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

  private _xZoom = 1;

  private _xScroll = 0;

  render() {
    return svg`
      <svg
        width="${this.offsetWidth}"
        height="${this.height}"
      >
        ${this._renderAxes()}
        ${this._renderErrors()}
      </svg>
    `;
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

  protected updated(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    this._updateZoomAndScroll();
  }

  updateZoomScroll(xZoom: number, xScroll: number) {
    this._xZoom = xZoom;
    this._xScroll = xScroll;

    this._updateZoomAndScroll(true);
  }

  private _renderAxes() {
    const xAxesLabelX = this._axesXCenter;
    const xAxesLabelY = this.offsetHeight - this.axesLabelMargin;
    const yAxesLabelX = this.axesLabelMargin + 6; // TODO: check why svg text elements are 3px larger than font-size
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
        <line
          x1="${this._axesXStart}"
          y1="${this._axesYEnd}"
          x2="${this._axesXEnd}"
          y2="${this._axesYEnd}"
          stroke="black"
        />

        <!-- Zero line -->
        <line
          x1="${this._axesXStart}"
          y1="${this._errorToY(0.0)}"
          x2="${this._axesXEnd}"
          y2="${this._errorToY(0.0)}"
          stroke="grey"
          stroke-dasharray="5, 5"
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
          ${this._errorLabel}
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
        <line
          x1="${this._axesXEnd}"
          y1="${this._axesYStart}"
          x2="${this._axesXEnd}"
          y2="${this._axesYEnd}"
          stroke="black"
        />
      </g>
    `;
  }

  private _renderXtick(axesFrac: number) {
    const x = this._mzToX(this.minMz + axesFrac * this._mzRange);

    const lineY1 = this._axesYStart;
    const lineY2 = lineY1 + this.tickLength;
    const textY = lineY2 + this.tickFontSize + this.tickMargin;

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
    const y = this._errorToY(axesFrac * this._errorRange - this._maxError);

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
      >${this._yTickFractionToErrorLabel(axesFrac)}</text>
    `;
  }

  private _renderErrors() {
    const transformOrigin = `${this._axesXStartPadded} ${this._axesYStart}`;
    const transform = `translate(${this._xScroll}, 0) scale(${this._xZoom}, 1)`;

    const clipX = this._axesXStart;
    const clipY = this._axesYEnd;

    return svg`
      <clipPath id="error-dots-clip">
        <rect
          x="${clipX}"
          y="${clipY}"
          width="${this._axesXWidth}"
          height="${this._axesYHeight}"
        />
      </clipPath>

      <g clip-path="url(#error-dots-clip)">
        <g
          id="error-dots"
          transform-origin="${transformOrigin}"
          transform="${transform}"
        >
          ${this.matchedIons.map(ion =>
            this._renderError(ion.mz_error, ion.peak_mz),
          )}
        </g>
      </g>
    `;
  }

  private _renderError(error: number, mz: number) {
    const x = this._mzToX(mz);
    const y = this._errorToY(transformMzError(mz, error, this.mzErrorType));

    return svg`
      <circle
        cx="${x}"
        cy="${y}"
        r="3"
        fill="black"
        transform="scale(${1 / this._xZoom}, 1)"
        transform-origin="${x} ${y}"
        class="error-dot"
      />
    `;
  }

  private _updateZoomAndScroll(suppressEvent = false) {
    this._errorDotsGroup?.setAttribute(
      'transform',
      `translate(${this._xScroll}, 0) scale(${this._xZoom}, 1)`,
    );

    this._errorDots?.forEach(errorDot => {
      errorDot.setAttribute('transform', `scale(${1 / this._xZoom}, 1)`);
    });

    this._xTickLabels?.forEach(tickLabel => {
      const fraction = parseFloat(tickLabel.dataset.fraction || '0');
      // eslint-disable-next-line no-param-reassign
      tickLabel.textContent = this._xTickFractionToMzLabel(fraction);
    });

    if (!suppressEvent) {
      const event = new CustomEvent('zoom-scroll', {
        detail: {
          xZoom: this._xZoom,
          xScroll: this._xScroll,
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
    } else if (this._xZoom > 1) {
      this._handleXScroll(e.deltaX);
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

  private _clipXOffset(xOffset: number): number {
    const maxOffset = (this._xZoom - 1) * this._axesXWidthPadded;
    return Math.min(Math.max(xOffset, -maxOffset), 0);
  }

  private _xTickFractionToMzLabel(fraction: number): string {
    const scaledMinMz =
      this.minMz +
      (-this._xScroll / (this._axesXWidthPadded * this._xZoom)) * this._mzRange;
    const scaledMaxMz = scaledMinMz + this._mzRange / this._xZoom;
    const scaledMzRange = scaledMaxMz - scaledMinMz;

    return (scaledMinMz + fraction * scaledMzRange).toPrecision(
      this.xTicksPrecision,
    );
  }

  private _yTickFractionToErrorLabel(fraction: number): string {
    return (this._maxError - fraction * this._errorRange).toPrecision(
      this.yTicksPrecision,
    );
  }
}
