# \<biowc-spectrum>

This webcomponent follows the [open-wc](https://github.com/open-wc/open-wc) recommendation.

## Installation

```bash
npm i biowc-spectrum
```

## Usage

```html
<script type="module">
  import 'biowc-spectrum/biowc-spectrum.js';
</script>

<biowc-spectrum></biowc-spectrum>
```


## Backlog 

### Bug Fixes

### Features
- [ ] Match mirror peaks and highlight them on hover
- [ ] Highlight corresponding peptide fragments/peaks on hover
- [ ] Add spectral angle/pearson correlation/dot product score
- [ ] Make touch friendly (zooming, scrolling)
- [ ] Add options for all ion types
- [ ] Add tooltip for peak details
- [ ] Fix y-axis labels cut off
- [ ] Allow mz tol in ppm

### Refactor
- [ ] Refactor variable names
  - MatchedIons
- [ ] Refactor component names
  - biowc-pep-seq -> biowc-spectrum-pepseq
