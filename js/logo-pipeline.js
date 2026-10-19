/**
 * LOGO & THEME PIPELINE (js/logo-pipeline.js)
 * -----------------------------------------------------------------------------
 * Loaded immediately after `js/config.js` and BEFORE `hero-aurora.js`, this module
 * acts as the single source of truth for:
 *
 *  A. UNIFIED COSMIC THEME ENGINE (`window.BlueprintTheme` + `window.setBlueprintTheme`)
 *     Resolves `config.theme.preset` ("sapphire", "crimson", "purple", "emerald",
 *     "gold", or "custom") and updates:
 *       1. All CSS custom properties on `:root` (`--bg-void`, `--cyan-glow`,
 *          `--theme-primary-rgb`, `--theme-glow-rgb`, `--theme-deep-rgb`, etc.)
 *       2. The 5 multi-frequency Aurora ribbon palettes for `hero-aurora.js`
 *       3. The 3D Glass Logo extrusion, caustics, and alpha specular rim tint
 *
 *  B. ZERO-CONFIG LOGO PIPELINE (`window.BlueprintLogo`)
 *     1. AUTO-DETECTS a logo in `assets/logo/` by probing `center-logo.<ext>`
 *        (svg, png, webp, avif, jpg, jpeg, gif) plus friendly fallback names.
 *     2. MEASURES intrinsic aspect ratio and border alpha (cut-out vs. opaque plate).
 *     3. GENERATES a theme-tinted specular rim from the logo's own alpha channel.
 *     4. SYNCS the Navbar icon, 3D Hero centerpiece, and Browser Tab Favicon.
 */

(function initThemeAndLogoPipeline() {
  // Prevent reload scroll-jump from mid-page (Spatial Immersion) back to Hero:
  // Disable automatic scroll restoration on reload, clear any stale URL #hash,
  // snap immediately to (0, 0) while scroll-behavior is 'auto', then enable smooth scrolling after load.
  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  } catch (e) {}

  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      document.documentElement.classList.add('smooth-scroll-ready');
    });
  });

  const rootCfg = window.BLUEPRINT_CONFIG || {};
  const heroCfg = rootCfg.hero || {};
  const cfg = heroCfg.logo || {};

  // ===========================================================================
  // PART A: UNIFIED COSMIC THEME ENGINE
  // ===========================================================================
  const THEME_PRESETS = {
    sapphire: {
      name: 'sapphire',
      voidBg: '#020614',
      darkBg: '#070b16',
      bentoTop: '#09193a',
      primaryHex: '#2575fc',
      glowHex: '#60c5ff',
      secondaryHex: '#3b1d7a',
      deepRgb: [5, 11, 26],
      extrusionRgb: [8, 30, 82]
    },
    crimson: {
      name: 'crimson',
      voidBg: '#120307',
      darkBg: '#1a060c',
      bentoTop: '#380918',
      primaryHex: '#e11d48',
      glowHex: '#fda4af',
      secondaryHex: '#7f1d1d',
      deepRgb: [26, 6, 12],
      extrusionRgb: [76, 10, 26]
    },
    purple: {
      name: 'purple',
      voidBg: '#080316',
      darkBg: '#100724',
      bentoTop: '#240d52',
      primaryHex: '#7c3aed',
      glowHex: '#c4b5fd',
      secondaryHex: '#be185d',
      deepRgb: [16, 7, 34],
      extrusionRgb: [46, 14, 88]
    },
    amethyst: {
      name: 'purple',
      voidBg: '#080316',
      darkBg: '#100724',
      bentoTop: '#240d52',
      primaryHex: '#7c3aed',
      glowHex: '#c4b5fd',
      secondaryHex: '#be185d',
      deepRgb: [16, 7, 34],
      extrusionRgb: [46, 14, 88]
    },
    emerald: {
      name: 'emerald',
      voidBg: '#02120e',
      darkBg: '#051b15',
      bentoTop: '#08382c',
      primaryHex: '#059669',
      glowHex: '#6ee7b7',
      secondaryHex: '#0f766e',
      deepRgb: [4, 22, 18],
      extrusionRgb: [8, 62, 48]
    },
    gold: {
      name: 'gold',
      voidBg: '#110c03',
      darkBg: '#1a1205',
      bentoTop: '#362408',
      primaryHex: '#d97706',
      glowHex: '#fde68a',
      secondaryHex: '#78350f',
      deepRgb: [24, 16, 6],
      extrusionRgb: [72, 44, 10]
    }
  };

  function hexToRgbArray(hex, fallback) {
    if (!hex || typeof hex !== 'string') return fallback || [37, 117, 252];
    const clean = hex.trim().replace(/^#/, '');
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16)
      ];
    }
    if (clean.length >= 6) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return [r, g, b];
      }
    }
    return fallback || [37, 117, 252];
  }

  function rgbaStr(rgb, alpha) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function mixRgb(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  function resolveTheme(overridePresetOrObj) {
    const themeCfg = rootCfg.theme || {};
    const rawPreset =
      typeof overridePresetOrObj === 'string'
        ? overridePresetOrObj
        : (themeCfg.preset || 'sapphire').toLowerCase().trim();

    let base = THEME_PRESETS[rawPreset] || THEME_PRESETS.sapphire;

    // Support "custom" preset or object overrides
    const customSrc =
      (typeof overridePresetOrObj === 'object' && overridePresetOrObj) ||
      (rawPreset === 'custom' ? themeCfg.custom : null);

    if (customSrc) {
      const pRgb = hexToRgbArray(customSrc.primaryAccent, [37, 117, 252]);
      const voidRgb = hexToRgbArray(customSrc.voidBg, [2, 6, 20]);
      base = {
        name: 'custom',
        voidBg: customSrc.voidBg || '#020614',
        darkBg: customSrc.darkBg || '#070b16',
        bentoTop: customSrc.bentoTop || rgbaStr(mixRgb(voidRgb, pRgb, 0.25), 1),
        primaryHex: customSrc.primaryAccent || '#2575fc',
        glowHex: customSrc.glowAccent || '#60c5ff',
        secondaryHex: customSrc.secondaryAccent || '#3b1d7a',
        deepRgb: mixRgb(voidRgb, pRgb, 0.12),
        extrusionRgb: mixRgb(voidRgb, pRgb, 0.35)
      };
    }

    const primaryRgb = hexToRgbArray(base.primaryHex, [37, 117, 252]);
    const glowRgb = hexToRgbArray(base.glowHex, [96, 197, 255]);
    const secondaryRgb = hexToRgbArray(base.secondaryHex, [59, 29, 122]);
    const voidRgb = hexToRgbArray(base.voidBg, [2, 6, 22]);
    const deepMidRgb = mixRgb(primaryRgb, voidRgb, 0.45);
    const softGlowRgb = mixRgb(glowRgb, [255, 255, 255], 0.35);

    const ribbons = [
      {
        x: 0.55, y: 0.42, r: 0.80,
        speed: [0.24, 0.17], amp: [0.26, 0.20], phase: [0.0, 0.0],
        stops: [
          [0, rgbaStr(primaryRgb, 0.50)],
          [0.45, rgbaStr(deepMidRgb, 0.30)],
          [1, rgbaStr(voidRgb, 0)]
        ]
      },
      {
        x: 0.78, y: 0.55, r: 0.66,
        speed: [0.20, 0.27], amp: [0.19, 0.23], phase: [1.3, 0.7],
        stops: [
          [0, rgbaStr(glowRgb, 0.40)],
          [0.5, rgbaStr(primaryRgb, 0.18)],
          [1, rgbaStr(voidRgb, 0)]
        ]
      },
      {
        x: 0.25, y: 0.30, r: 0.68,
        speed: [0.14, 0.21], amp: [0.21, 0.20], phase: [2.0, 1.0],
        stops: [
          [0, rgbaStr(secondaryRgb, 0.36)],
          [1, rgbaStr(voidRgb, 0)]
        ]
      },
      {
        x: 0.42, y: 0.74, r: 0.72,
        speed: [0.17, 0.30], amp: [0.23, 0.18], phase: [0.5, 2.4],
        stops: [
          [0, rgbaStr(mixRgb(primaryRgb, glowRgb, 0.35), 0.34)],
          [1, rgbaStr(voidRgb, 0)]
        ]
      },
      {
        x: 0.68, y: 0.24, r: 0.58,
        speed: [0.28, 0.15], amp: [0.16, 0.25], phase: [3.0, 1.6],
        stops: [
          [0, rgbaStr(softGlowRgb, 0.30)],
          [1, rgbaStr(voidRgb, 0)]
        ]
      }
    ];

    const resolved = {
      name: base.name,
      voidBg: base.voidBg,
      darkBg: base.darkBg,
      bentoTop: base.bentoTop,
      primaryHex: base.primaryHex,
      glowHex: base.glowHex,
      secondaryHex: base.secondaryHex,
      primaryRgb,
      glowRgb,
      secondaryRgb,
      softGlowRgb,
      deepRgb: base.deepRgb,
      extrusionRgb: base.extrusionRgb,
      ribbons
    };

    // Apply CSS custom properties to :root so the entire page updates in sync
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--bg-void', resolved.voidBg);
    rootStyle.setProperty('--bg-dark', resolved.darkBg);
    rootStyle.setProperty('--cyan-glow', resolved.glowHex);
    rootStyle.setProperty('--apple-blue', resolved.primaryHex);
    rootStyle.setProperty('--theme-primary-rgb', primaryRgb.join(', '));
    rootStyle.setProperty('--theme-glow-rgb', glowRgb.join(', '));
    rootStyle.setProperty('--theme-deep-rgb', resolved.deepRgb.join(', '));
    rootStyle.setProperty('--theme-bento-top', resolved.bentoTop);

    window.BlueprintTheme = resolved;
    return resolved;
  }

  resolveTheme();

  // Public helper to switch theme at runtime (e.g., window.setBlueprintTheme('crimson'))
  window.setBlueprintTheme = function setBlueprintTheme(presetOrCustom) {
    const updated = resolveTheme(presetOrCustom);
    if (state.ready && state.image && !state.hasBackground) {
      state.rim = buildSpecularRim(state.image, state.aspect);
    }
    window.dispatchEvent(new CustomEvent('blueprint-theme-changed', { detail: updated }));
    return updated;
  };

  // ===========================================================================
  // PART B: ZERO-CONFIG LOGO PIPELINE
  // ===========================================================================
  const dir = cfg.dir || './assets/logo/';
  const baseName = cfg.baseName || 'center-logo';
  const extensions = cfg.extensions || ['svg', 'png', 'webp', 'avif', 'jpg', 'jpeg', 'gif'];
  const fallbackBaseNames = cfg.fallbackBaseNames || ['logo', 'custom-logo', 'brand-logo', 'hero-logo'];
  const explicitPath = cfg.explicitPath || '';

  // Public handle — read by hero-aurora.js and scroll-immersion.js
  const state = {
    src: null,
    image: null,
    aspect: 1,
    hasBackground: false,
    mode: null,      // "silhouette" | "plate" | null
    rim: null,       // { canvas, pad, W, H } precomputed specular rim (silhouette only)
    ready: false
  };
  window.BlueprintLogo = state;

  // ---------------------------------------------------------------------------
  // Build the probe list: explicit path first, then canonical base name, then
  // friendly fallbacks — each across every supported extension.
  // ---------------------------------------------------------------------------
  const probes = [];
  if (explicitPath) probes.push(explicitPath);
  [baseName].concat(fallbackBaseNames).forEach((base) => {
    extensions.forEach((ext) => probes.push(`${dir}${base}.${ext}`));
  });

  // ---------------------------------------------------------------------------
  // Does the artwork have an opaque background? (i.e. a photo / flat plate rather
  // than a cut-out logo). We sample a 2px border ring of a downscaled copy: a
  // cut-out logo leaves the border transparent, a filled image does not.
  // Returns true/false, or null when the pixels are unreadable (e.g. file://).
  // ---------------------------------------------------------------------------
  function detectOpaqueBackground(img) {
    const N = 56;
    const c = document.createElement('canvas');
    c.width = N;
    c.height = N;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.clearRect(0, 0, N, N);
    cx.drawImage(img, 0, 0, N, N);
    const data = cx.getImageData(0, 0, N, N).data; // throws if the canvas is tainted
    const inset = 2;
    let total = 0;
    let opaque = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (x >= inset && x < N - inset && y >= inset && y < N - inset) continue;
        total++;
        if (data[(y * N + x) * 4 + 3] > 200) opaque++;
      }
    }
    return total > 0 ? opaque / total > 0.6 : false;
  }

  // ---------------------------------------------------------------------------
  // Generate a specular rim bitmap straight from the logo's alpha channel:
  // silhouette -> dilate -> subtract -> tint (using the active Cosmic Theme).
  // ---------------------------------------------------------------------------
  function buildSpecularRim(img, aspect) {
    const H = 640;
    const W = Math.max(1, Math.round(H * aspect));
    const pad = Math.round(H * 0.08);
    const cw = W + pad * 2;
    const ch = H + pad * 2;

    const mask = document.createElement('canvas');
    mask.width = cw;
    mask.height = ch;
    const mctx = mask.getContext('2d');
    mctx.drawImage(img, pad, pad, W, H);
    mctx.globalCompositeOperation = 'source-in'; // solid silhouette from alpha
    mctx.fillStyle = '#ffffff';
    mctx.fillRect(0, 0, cw, ch);

    const ring = document.createElement('canvas');
    ring.width = cw;
    ring.height = ch;
    const rctx = ring.getContext('2d');
    const r = Math.max(2, Math.round(H * 0.005));
    const steps = 28;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      rctx.drawImage(mask, Math.cos(a) * r, Math.sin(a) * r);
    }
    rctx.globalCompositeOperation = 'destination-out'; // ring = dilated - silhouette
    rctx.drawImage(mask, 0, 0);

    const thm = window.BlueprintTheme || THEME_PRESETS.sapphire;
    const softRgb = thm.softGlowRgb || [198, 234, 255];
    const glowRgb = thm.glowRgb || [96, 197, 255];

    rctx.globalCompositeOperation = 'source-in'; // tint the ring with active theme glow
    const grad = rctx.createLinearGradient(0, 0, cw * 0.55, ch);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    grad.addColorStop(0.5, rgbaStr(softRgb, 0.85));
    grad.addColorStop(1, rgbaStr(glowRgb, 0.74));
    rctx.fillStyle = grad;
    rctx.fillRect(0, 0, cw, ch);
    rctx.globalCompositeOperation = 'source-over';

    return { canvas: ring, pad, W, H };
  }

  // ---------------------------------------------------------------------------
  // Keep the browser TAB ICON in sync with the resolved logo, so the favicon is
  // always the exact same asset as the hero centerpiece and the navbar brand mark.
  // Drop in a new file (center-logo.png, a custom logo, …) and the tab updates too.
  // ---------------------------------------------------------------------------
  const MIME_BY_EXT = {
    svg: 'image/svg+xml',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg'
  };

  function applyFavicon(src) {
    if (!src) return;
    const ext = (src.split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
    let link =
      document.getElementById('blueprintFavicon') ||
      document.querySelector('link[rel~="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      (document.head || document.documentElement).appendChild(link);
    }
    const mime = MIME_BY_EXT[ext];
    link.id = 'blueprintFavicon';
    if (mime) link.type = mime;
    link.href = src;
  }

  function finalize(img) {
    state.image = img;
    state.src = img.src;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    // Vector logos can, in some browsers, report 0x0 — fall back to a configurable ratio.
    state.aspect = nw > 0 && nh > 0 ? nw / nh : (cfg.aspectFallback || 1);

    let hasBg = null;
    try {
      hasBg = detectOpaqueBackground(img);
    } catch (e) {
      hasBg = null; // canvas tainted (file://) — fall back to a filename heuristic
    }
    if (hasBg === null) hasBg = /\.jpe?g(\?|#|$)/i.test(state.src);
    state.hasBackground = hasBg;
    state.mode = hasBg ? 'plate' : 'silhouette';
    state.rim = hasBg ? null : buildSpecularRim(img, state.aspect);
    state.ready = true;

    // Tab icon = the same resolved logo (hero + navbar + favicon all agree).
    applyFavicon(state.src);

    window.BLUEPRINT_LOGO_SRC = state.src;
    window.dispatchEvent(
      new CustomEvent('blueprint-logo-ready', {
        detail: { src: state.src, aspect: state.aspect, mode: state.mode }
      })
    );
  }

  function probe(index) {
    if (index >= probes.length) return; // nothing found -> built-in Apple logo stays
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (img.naturalWidth > 0 || img.naturalHeight > 0 || /\.svg(\?|#|$)/i.test(img.src)) {
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {}).finally(() => finalize(img));
        } else {
          finalize(img);
        }
      } else {
        probe(index + 1);
      }
    };
    img.onerror = () => probe(index + 1);
    img.src = probes[index];
  }

  probe(0);
})();
