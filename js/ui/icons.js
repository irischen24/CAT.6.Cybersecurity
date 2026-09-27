/* Inline stroke icons (24px grid, currentColor). */
(function (C) {
  var P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    assess: '<path d="M9 11l2 2 4-4"/><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>',
    library: '<path d="M4 5h5v14H4zM10 5h4v14h-4zM15.5 5.5l4 .9-2.9 13.2-4-.9"/>',
    mapping: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6h7M7.2 8.2l3.6 7.6M16.8 8.2l-3.6 7.6"/>',
    fair: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    iso: '<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8l5.5-.8z"/>',
    treat: '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.1-.4-.4-2.1z"/>',
    import: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    report: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 13h7M9 17h5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/>',
    arrow: '<path d="M7 17L17 7M9 7h8v8"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
    register: '<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M4 4h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12l4 4 10-10"/>',
    evidence: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 14l2 2 4-4"/>',
    audit: '<circle cx="10" cy="10" r="6"/><path d="M20 20l-5.5-5.5M8 10l1.5 1.5L12.5 8"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    setup: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[name] + '</svg>';
  }
  /* CAT.6 mark: outer hexagon (six frameworks) around a solid core. */
  function mark(cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="c6m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9A6FF"/><stop offset="1" stop-color="#7C5CFC"/></linearGradient></defs>' +
      '<path d="M16 2.5l11.7 6.75v13.5L16 29.5 4.3 22.75V9.25z" fill="none" stroke="url(#c6m)" stroke-width="1.6"/>' +
      '<path d="M16 10l5.2 3v6L16 22l-5.2-3v-6z" fill="url(#c6m)"/></svg>';
  }
  C.ui.icons = { icon: icon, mark: mark };
})(globalThis.CAT6);
