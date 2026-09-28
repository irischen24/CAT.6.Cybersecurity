/* CAT.6 brand source of truth. Pages never hard-code the logo: they call C.ui.brand (js/ui/brand.js).
 * Asset paths are relative to the site root (GitHub Pages base path safe). Empty path = the official file has not been
 * supplied yet; the component then falls back to the existing CAT.6 SVG mark (no new logo is generated).
 * To install the official logo: put the files in assets/brand/ and fill the paths below. */
CAT6.data.brand = {
  name: 'CAT.6 Cybersecurity',
  short: 'CAT.6',
  assets: {
    logo: '',          // e.g. 'assets/brand/cat6-logo.png'            — full logo (cover pages)
    horizontal: '',    // e.g. 'assets/brand/cat6-logo-horizontal.png' — compact lockup for nav bars
    mark: '',          // e.g. 'assets/brand/cat6-mark.png'            — square symbol (sidebar, rails)
    favicon: ''        // e.g. 'assets/brand/favicon.png'              — 32 / 180 px icon
  },
  status: 'PENDING_OFFICIAL_LOGO'
};
