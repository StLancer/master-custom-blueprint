/**
 * HERO ENGINE (js/hero-aurora.js)
 * 1. Deep cosmic sapphire aurora. Multiple soft light ribbons drift INDEPENDENTLY along smooth
 *    multi-frequency (pseudo-random wave) paths and blend additively for a rich, high-quality glow.
 *    No pixelation, no grain.
 * 2. Bold white constellation particles that break links & scatter when the cursor approaches,
 *    then smoothly drift back and re-link. Each particle connects to a random 3..5 neighbours
 *    so the field forms 3-5 node clusters. Particles are square / triangle "sparks".
 * 3. 3D Glassmorphic centerpiece logo (Liquid Glass interior + specular rim + cursor tilt).
 *    By default it renders a correctly-proportioned Apple logo. Drop a transparent image into
 *    ./assets/logo/ and it is auto-detected and wrapped in the same glass. The resolved logo
 *    is also broadcast so the navbar brand icon can reuse the exact same file.
 */

(function initBlueprintHero() {
  const cfg = window.BLUEPRINT_CONFIG.hero;

  // ------------------------------------------------------------------------
  // Hero composition tuning (js/config.js -> hero.layout). Declared up-front so
  // the very first resizeCanvases() call can position the copy under the logo.
  // ------------------------------------------------------------------------
  const layoutCfg = cfg.layout || {};
  const LOGO_SCALE = typeof layoutCfg.logoScale === 'number' ? layoutCfg.logoScale : 0.38;
  const TEXT_GAP_PX = typeof layoutCfg.textGapPx === 'number' ? layoutCfg.textGapPx : 30;
  const GROUP_OFFSET_YH = typeof layoutCfg.groupOffsetYh === 'number' ? layoutCfg.groupOffsetYh : 0;
  const NAV_SAFE_PX = 96;  // minimum clearance below the fixed navbar

  // Centerpiece motion (js/config.js -> hero.logo.motion, TASK 3.8). The logo is STILL
  // by default; only a cursor that comes NEAR it nudges it a little — never a
  // whole-viewport follow.
  const motionCfg = (cfg.logo && cfg.logo.motion) || {};
  const MOTION_MAX_OFFSET_PX =
    typeof motionCfg.maxOffsetPx === 'number' ? Math.max(0, motionCfg.maxOffsetPx) : 6;
  const MOTION_RADIUS_FACTOR = typeof motionCfg.radiusFactor === 'number' ? motionCfg.radiusFactor : 1.25;
  const MOTION_EASE = typeof motionCfg.ease === 'number' ? motionCfg.ease : 0.08;
  // The old whole-viewport follow ranged ±18px. The nudge now tops out at
  // MOTION_MAX_OFFSET_PX, so the glass-reaction factors (extrusion depth + fluid caustic)
  // are scaled by the ratio to keep the same peak response at closest approach.
  const MOTION_REF_PX = 18;
  const TILT_RANGE_RATIO = MOTION_MAX_OFFSET_PX > 0 ? MOTION_REF_PX / MOTION_MAX_OFFSET_PX : 0;

  // Live layout, recomputed by syncHeroLayout(): the logo's vertical centre and the
  // copy's top edge (both in CSS px). Keeps the whole logo + title + subtitle block
  // optically centred in the hero rather than pinned to a fixed fraction.
  const heroLayout = { logoCenterY: (window.innerHeight || 720) * 0.34, textTop: 0 };
  let layoutRetries = 0;

  // ------------------------------------------------------------------------
  // Hydrate Hero Text & CTAs
  // ------------------------------------------------------------------------
  document.getElementById('heroEyebrow').textContent = cfg.eyebrow || '';
  document.getElementById('heroTitle').textContent = cfg.title;
  document.getElementById('heroSubtitle').textContent = cfg.subtitle;

  const ctaBar = document.getElementById('heroCtaBar');
  cfg.ctas.forEach((cta) => {
    const a = document.createElement('a');
    a.href = cta.href;
    a.className = `liquid-btn ${cta.primary ? 'primary' : ''}`;
    a.textContent = cta.label;
    ctaBar.appendChild(a);
  });

  const bgCanvas = document.getElementById('auroraConstellationCanvas');
  const bgCtx = bgCanvas.getContext('2d');
  const logoCanvas = document.getElementById('glassLogoCanvas');
  const logoCtx = logoCanvas.getContext('2d');

  const stage = document.querySelector('.hero-stage');
  let w = window.innerWidth;
  let h = window.innerHeight;

  // The canvases sit inside .hero-stage and are stretched to 100% of it, so their
  // bitmaps must match the STAGE box — not the viewport. The stage is `max(100vh, 720px)`,
  // so on short windows it is taller than the viewport and viewport-sized bitmaps would
  // be vertically stretched. Measuring the stage keeps everything pixel-accurate.
  function measureStage() {
    if (stage) {
      const r = stage.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        w = r.width;
        h = r.height;
        return;
      }
    }
    w = window.innerWidth;
    h = window.innerHeight;
  }

  function resizeCanvases() {
    measureStage();
    bgCanvas.width = Math.round(w);
    bgCanvas.height = Math.round(h);
    logoCanvas.width = Math.round(w * window.devicePixelRatio);
    logoCanvas.height = Math.round(h * window.devicePixelRatio);
    syncHeroLayout();
  }
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);

  // Lays out the hero so the whole block — 3D logo, gap, then the title/subtitle — is
  // optically centred in the hero, while never colliding with the fixed navbar or the
  // bottom CTA bar (both measured live, so it adapts when the CTAs wrap to two rows).
  // Publishes the copy's top edge as a CSS variable consumed by .hero-content-wrap.
  //
  // ROBUSTNESS (TASK 3.7): the boot measurement can land before CSS/fonts/layout
  // settle, latching a degenerate value that sticks until a manual window resize —
  // which is exactly the "hero intermittently has no logo and no copy" bug. So this
  // re-measures every time, refuses to commit a non-finite/zero layout (retrying on
  // the next frame instead), and never publishes a bad `--hero-text-top` (an invalid
  // custom property drops the copy's `top`, throwing it off-screen).
  function syncHeroLayout() {
    measureStage();

    // Not laid out yet? Retry next frame instead of committing a broken layout.
    if (!(w > 0) || !(h > 0)) {
      if (layoutRetries++ < 60) requestAnimationFrame(syncHeroLayout);
      return;
    }
    layoutRetries = 0;

    const isMobile = w <= 768;
    const wrap = document.querySelector('.hero-content-wrap');
    const textH = wrap ? (wrap.offsetHeight || wrap.getBoundingClientRect().height || 92) : 92;
    const logoH = Math.min(w, h) * LOGO_SCALE;
    const gapPx = isMobile ? 18 : TEXT_GAP_PX;
    const groupH = logoH + gapPx + textH;

    // IMPORTANT: #topNavbar is position:fixed, so its bottom inside the hero stage is simply
    // its fixed offsetTop + offsetHeight (~76px). Never subtract stage.getBoundingClientRect().top!
    const nav = document.getElementById('topNavbar');
    const navBottom = nav ? (nav.offsetTop + nav.offsetHeight) : 76;

    // #heroCtaBar is anchored near the bottom of .hero-stage. Measure its stage-local top
    // so Logo + Name + Slogan centers cleanly in the middle between the Navbar and CTA buttons.
    const cta = document.getElementById('heroCtaBar');
    const ctaH = cta ? (cta.offsetHeight || 46) : 46;
    const ctaBottomGap = isMobile ? 34 : Math.min(56, Math.max(32, h * 0.055));
    const ctaTop = cta && cta.offsetTop > 0 ? cta.offsetTop : h - ctaBottomGap - ctaH;

    const availTop = Math.max(isMobile ? 88 : NAV_SAFE_PX, navBottom + (isMobile ? 16 : 20));
    const availBottom = Math.max(availTop + groupH, ctaTop - (isMobile ? 24 : 20));

    // Center the Logo + Name + Slogan block in the middle of [availTop, availBottom]
    let top = availTop + (availBottom - availTop - groupH) * 0.5 + GROUP_OFFSET_YH * h;
    top = Math.min(top, availBottom - groupH);
    top = Math.max(availTop, top);

    const minLogoY = availTop + logoH * 0.48;
    const maxLogoY = Math.max(minLogoY, availBottom - textH - gapPx - logoH * 0.5);
    const logoCenterY = Math.min(maxLogoY, Math.max(minLogoY, top + logoH / 2));
    const textTop = Math.min(
      ctaTop - textH - 16,
      Math.max(availTop + logoH * 0.85, logoCenterY + logoH / 2 + gapPx)
    );

    if (!Number.isFinite(logoCenterY) || !Number.isFinite(textTop)) return;

    heroLayout.logoCenterY = logoCenterY;
    heroLayout.textTop = textTop;
    document.documentElement.style.setProperty('--hero-text-top', `${Math.round(textTop)}px`);
  }

  // Re-run the layout whenever inputs change: resize, the async logo pipeline
  // resolving (aspect ratio -> drawn height), and web-font swap (title height).
  window.addEventListener('blueprint-logo-ready', syncHeroLayout);
  window.addEventListener('load', syncHeroLayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeroLayout);

  // Self-correct a boot-time mis-measure: re-run after the first couple of frames
  // so the hero never needs a manual window resize to appear.
  requestAnimationFrame(() => requestAnimationFrame(syncHeroLayout));

  // Returning from the bfcache / becoming visible can leave stale canvas bitmaps and
  // a missed size change; re-measure and redraw, but only touch the bitmaps when the
  // box actually changed (a needless resize clears the logo for one frame).
  function refreshHero() {
    measureStage();
    const dpr = window.devicePixelRatio;
    const sameSize =
      bgCanvas.width === Math.round(w) &&
      bgCanvas.height === Math.round(h) &&
      logoCanvas.width === Math.round(w * dpr) &&
      logoCanvas.height === Math.round(h * dpr);
    if (sameSize) syncHeroLayout();
    else resizeCanvases();
  }
  window.addEventListener('pageshow', refreshHero);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshHero();
  });

  // Pointer position in STAGE coordinates (same space as the particles' x/y). No
  // normalised values are needed any more — the logo reacts to CURSOR PROXIMITY, not
  // to the pointer's position across the whole viewport.
  const mouse = { x: -9999, y: -9999, active: false };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ==========================================================================
  // CONSTELLATION PARTICLES (bold white square / triangle sparks, 3-5 clusters)
  // ==========================================================================
  const pConfig = cfg.constellation;
  const minLinks = pConfig.minLinksPerParticle || 3;
  const maxLinks = pConfig.maxLinksPerParticle || 5;
  const shapeMode = pConfig.particleShape || 'mixed';

  function pickShape() {
    if (shapeMode === 'square' || shapeMode === 'triangle') return shapeMode;
    return Math.random() < 0.5 ? 'square' : 'triangle';
  }

  const particles = [];
  for (let i = 0; i < pConfig.particleCount; i++) {
    const homeX = Math.random() * w;
    const homeY = Math.random() * h;
    particles.push({
      homeX,
      homeY,
      x: homeX,
      y: homeY,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: 1.1 + Math.random() * pConfig.particleRadius,
      shape: pickShape(),
      rotation: Math.random() * Math.PI,
      // Random per-particle connection budget so clusters are 3..5 nodes wide.
      maxLinks: Math.floor(Math.random() * (maxLinks - minLinks + 1)) + minLinks,
      brokenFactor: 0 // 0 = calm & linked, 1 = broken & scattered by cursor
    });
  }

  // ==========================================================================
  // CENTERPIECE LOGO: resolved by js/logo-pipeline.js (loaded before this file).
  // The pipeline auto-detects ./assets/logo/center-logo.<any ext>, works out the
  // aspect ratio and whether the artwork has an opaque background, and precomputes
  // a specular rim from the logo's alpha. If it resolved nothing, the built-in
  // Apple path below is used instead.
  // ==========================================================================
  const logo = window.BlueprintLogo || { ready: false, image: null, aspect: 1, mode: null, rim: null };

  // Single, correctly-proportioned Apple logo path (apple body + leaf in one silhouette).
  const LOGO_VB_W = 814;
  const LOGO_VB_H = 1000;
  const appleLogoPath = new Path2D(
    "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
  );

  // ==========================================================================
  // AURORA RIBBONS — independent smooth multi-frequency drift (no pixelation)
  // ==========================================================================
  // Fallback Sapphire ribbons if window.BlueprintTheme is unavailable.
  const defaultAuroraRibbons = [
    {
      x: 0.55, y: 0.42, r: 0.80,
      speed: [0.24, 0.17], amp: [0.26, 0.20], phase: [0.0, 0.0],
      stops: [[0, 'rgba(37, 117, 252, 0.50)'], [0.45, 'rgba(16, 62, 155, 0.30)'], [1, 'rgba(2, 6, 22, 0)']]
    },
    {
      x: 0.78, y: 0.55, r: 0.66,
      speed: [0.20, 0.27], amp: [0.19, 0.23], phase: [1.3, 0.7],
      stops: [[0, 'rgba(96, 197, 255, 0.40)'], [0.5, 'rgba(28, 78, 216, 0.18)'], [1, 'rgba(2, 6, 22, 0)']]
    },
    {
      x: 0.25, y: 0.30, r: 0.68,
      speed: [0.14, 0.21], amp: [0.21, 0.20], phase: [2.0, 1.0],
      stops: [[0, 'rgba(67, 56, 202, 0.32)'], [1, 'rgba(2, 6, 22, 0)']]
    },
    {
      x: 0.42, y: 0.74, r: 0.72,
      speed: [0.17, 0.30], amp: [0.23, 0.18], phase: [0.5, 2.4],
      stops: [[0, 'rgba(56, 120, 255, 0.34)'], [1, 'rgba(2, 6, 22, 0)']]
    },
    {
      x: 0.68, y: 0.24, r: 0.58,
      speed: [0.28, 0.15], amp: [0.16, 0.25], phase: [3.0, 1.6],
      stops: [[0, 'rgba(125, 211, 252, 0.30)'], [1, 'rgba(2, 6, 22, 0)']]
    }
  ];

  function getActiveTheme() {
    return window.BlueprintTheme || {
      voidBg: '#020616',
      primaryRgb: [37, 117, 252],
      glowRgb: [96, 197, 255],
      softGlowRgb: [160, 220, 255],
      deepRgb: [5, 11, 26],
      extrusionRgb: [8, 30, 82],
      ribbons: defaultAuroraRibbons
    };
  }

  function rgbAlpha(rgb, a) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
  }

  let time = 0;
  let tiltX = 0;
  let tiltY = 0;

  function drawAurora() {
    const thm = getActiveTheme();
    const ribbons = thm.ribbons || defaultAuroraRibbons;

    // Deep cosmic void base
    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.fillStyle = thm.voidBg || '#020616';
    bgCtx.fillRect(0, 0, w, h);

    // Additive light ribbons
    bgCtx.globalCompositeOperation = 'lighter';
    const maxDim = Math.max(w, h);
    for (const rb of ribbons) {
      const cx = w * (
        rb.x +
        Math.sin(time * rb.speed[0] + rb.phase[0]) * rb.amp[0] +
        Math.sin(time * rb.speed[0] * 0.37 + rb.phase[0] * 1.7) * rb.amp[0] * 0.45
      );
      const cy = h * (
        rb.y +
        Math.cos(time * rb.speed[1] + rb.phase[1]) * rb.amp[1] +
        Math.cos(time * rb.speed[1] * 0.41 + rb.phase[1] * 1.3) * rb.amp[1] * 0.45
      );
      const radius = maxDim * rb.r;
      const grad = bgCtx.createRadialGradient(cx, cy, radius * 0.02, cx, cy, radius);
      for (const [stop, color] of rb.stops) grad.addColorStop(stop, color);
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, 0, w, h);
    }
    bgCtx.globalCompositeOperation = 'source-over';

    // Soft smooth vignette for depth (no grain)
    const vignette = bgCtx.createRadialGradient(
      w * 0.5, h * 0.48, Math.min(w, h) * 0.15,
      w * 0.5, h * 0.5, Math.max(w, h) * 0.78
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    bgCtx.fillStyle = vignette;
    bgCtx.fillRect(0, 0, w, h);
  }

  function drawGlassAppleLogo(cx, cy, dpr) {
    const thm = getActiveTheme();
    const extRgb = thm.extrusionRgb || [8, 30, 82];
    const glowRgb = thm.glowRgb || [96, 197, 255];
    const priRgb = thm.primaryRgb || [37, 117, 252];

    const scale = (Math.min(w, h) * LOGO_SCALE * dpr) / LOGO_VB_H;
    const devToVb = 1 / scale; // convert device pixels into viewBox units

    logoCtx.save();
    logoCtx.translate(cx, cy);
    logoCtx.scale(scale, scale);
    logoCtx.translate(-LOGO_VB_W / 2, -LOGO_VB_H / 2); // now drawing in 0..814 x 0..1000 space

    // 1. 3D extruded back depth (repeated offset fills create the glass thickness).
    //    The tilt term is scaled by TILT_RANGE_RATIO because the offset is now a small
    //    proximity nudge rather than a ±18px whole-viewport lean.
    const depthX = -tiltX * 0.45 * TILT_RANGE_RATIO * devToVb;
    const depthY = (-tiltY * 0.45 * TILT_RANGE_RATIO + 9) * devToVb;
    for (let i = 6; i >= 1; i--) {
      const f = i / 6;
      logoCtx.save();
      logoCtx.translate(depthX * f, depthY * f);
      logoCtx.fillStyle = rgbAlpha(extRgb, (0.12 + 0.07 * f).toFixed(3));
      logoCtx.fill(appleLogoPath);
      logoCtx.restore();
    }

    // 2. Clipped translucent glass interior (fluid caustics + sheen)
    logoCtx.save();
    logoCtx.clip(appleLogoPath);

    const glassBase = logoCtx.createLinearGradient(0, 0, LOGO_VB_W, LOGO_VB_H);
    glassBase.addColorStop(0, 'rgba(255, 255, 255, 0.40)');
    glassBase.addColorStop(0.45, rgbAlpha(glowRgb, 0.22));
    glassBase.addColorStop(1, rgbAlpha(priRgb, 0.34));
    logoCtx.fillStyle = glassBase;
    logoCtx.fillRect(-LOGO_VB_W * 0.2, -LOGO_VB_H * 0.2, LOGO_VB_W * 1.4, LOGO_VB_H * 1.4);

    const fluidX = LOGO_VB_W / 2 + Math.sin(time * 1.6) * LOGO_VB_W * 0.30 - tiltX * 2.4 * TILT_RANGE_RATIO;
    const fluidY = LOGO_VB_H / 2 + Math.cos(time * 1.3) * LOGO_VB_H * 0.24 - tiltY * 2.4 * TILT_RANGE_RATIO;
    const fluidGrad = logoCtx.createRadialGradient(fluidX, fluidY, 6, fluidX, fluidY, LOGO_VB_W * 0.42);
    fluidGrad.addColorStop(0, 'rgba(255, 255, 255, 0.68)');
    fluidGrad.addColorStop(0.5, rgbAlpha(glowRgb, 0.36));
    fluidGrad.addColorStop(1, rgbAlpha(priRgb, 0));
    logoCtx.fillStyle = fluidGrad;
    logoCtx.fillRect(-LOGO_VB_W * 0.2, -LOGO_VB_H * 0.2, LOGO_VB_W * 1.4, LOGO_VB_H * 1.4);

    const sheenGrad = logoCtx.createLinearGradient(0, 0, LOGO_VB_W * 0.8, LOGO_VB_H * 0.9);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    sheenGrad.addColorStop(0.32, 'rgba(255, 255, 255, 0.08)');
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    sheenGrad.addColorStop(1, rgbAlpha(glowRgb, 0.28));
    logoCtx.fillStyle = sheenGrad;
    logoCtx.fillRect(-LOGO_VB_W * 0.2, -LOGO_VB_H * 0.2, LOGO_VB_W * 1.4, LOGO_VB_H * 1.4);
    logoCtx.restore();

    // 3. High-contrast specular rim around the silhouette
    logoCtx.save();
    logoCtx.shadowColor = rgbAlpha(glowRgb, 0.78);
    logoCtx.shadowBlur = 26 * devToVb;
    logoCtx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    logoCtx.lineWidth = 2.2 * devToVb;
    logoCtx.stroke(appleLogoPath);
    logoCtx.restore();

    logoCtx.restore();
  }

  // Rounded-rectangle helper (used by the Liquid Glass plate)
  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // --- Treatment A: transparent logo -> liquid-glass interior + alpha-derived rim ---
  function drawGlassSilhouetteLogo(dx, dy, iw, ih) {
    const img = logo.image;
    const thm = getActiveTheme();
    const glowRgb = thm.glowRgb || [96, 197, 255];
    const priRgb = thm.primaryRgb || [37, 117, 252];

    // 1. Specular rim generated from the logo's own alpha channel (blitted at the
    //    same box as the artwork, so it traces ANY silhouette perfectly).
    if (logo.rim) {
      const sx = iw / logo.rim.W;
      const sy = ih / logo.rim.H;
      logoCtx.save();
      logoCtx.shadowColor = rgbAlpha(glowRgb, 0.85);
      logoCtx.shadowBlur = 26;
      logoCtx.drawImage(
        logo.rim.canvas,
        dx - logo.rim.pad * sx,
        dy - logo.rim.pad * sy,
        logo.rim.canvas.width * sx,
        logo.rim.canvas.height * sy
      );
      logoCtx.restore();
    }

    // 2. The artwork itself with a soft theme context glow.
    logoCtx.save();
    logoCtx.filter = `drop-shadow(0 0 22px ${rgbAlpha(glowRgb, 0.72)})`;
    logoCtx.drawImage(img, dx, dy, iw, ih);
    logoCtx.restore();

    // 3. Liquid Glass tint + fluid caustic, clipped to the logo's opaque pixels.
    logoCtx.save();
    logoCtx.globalCompositeOperation = 'source-atop';

    const glassBase = logoCtx.createLinearGradient(dx, dy, dx + iw, dy + ih);
    glassBase.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    glassBase.addColorStop(0.45, rgbAlpha(glowRgb, 0.14));
    glassBase.addColorStop(1, rgbAlpha(priRgb, 0.26));
    logoCtx.fillStyle = glassBase;
    logoCtx.fillRect(dx, dy, iw, ih);

    const fluidX = dx + iw / 2 + Math.sin(time * 1.6) * iw * 0.28;
    const fluidY = dy + ih / 2 + Math.cos(time * 1.3) * ih * 0.22;
    const fluidGrad = logoCtx.createRadialGradient(fluidX, fluidY, 4, fluidX, fluidY, iw * 0.5);
    fluidGrad.addColorStop(0, 'rgba(255, 255, 255, 0.40)');
    fluidGrad.addColorStop(1, rgbAlpha(priRgb, 0));
    logoCtx.fillStyle = fluidGrad;
    logoCtx.fillRect(dx, dy, iw, ih);

    logoCtx.restore();
  }

  // --- Treatment B: opaque / photo logo -> presentation inside a Liquid Glass plate ---
  function drawGlassPlateLogo(dx, dy, iw, ih) {
    const img = logo.image;
    const thm = getActiveTheme();
    const glowRgb = thm.glowRgb || [96, 197, 255];
    const deepRgb = thm.deepRgb || [10, 26, 58];
    const r = Math.min(iw, ih) * 0.2;
    const lineW = Math.max(1.4, Math.min(iw, ih) * 0.006);

    // Outer glow + frosted glass body
    logoCtx.save();
    logoCtx.shadowColor = rgbAlpha(glowRgb, 0.48);
    logoCtx.shadowBlur = 34;
    roundRectPath(logoCtx, dx, dy, iw, ih, r);
    logoCtx.fillStyle = rgbAlpha(deepRgb, 0.58);
    logoCtx.fill();
    logoCtx.restore();

    // Plate interior: artwork + glossy overlays, all clipped to the rounded plate
    logoCtx.save();
    roundRectPath(logoCtx, dx, dy, iw, ih, r);
    logoCtx.clip();

    logoCtx.drawImage(img, dx, dy, iw, ih);

    const plateGlass = logoCtx.createLinearGradient(dx, dy, dx + iw * 0.7, dy + ih);
    plateGlass.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
    plateGlass.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    plateGlass.addColorStop(1, rgbAlpha(glowRgb, 0.18));
    logoCtx.fillStyle = plateGlass;
    logoCtx.fillRect(dx, dy, iw, ih);

    const sheen = logoCtx.createLinearGradient(dx, dy, dx + iw * 0.5, dy + ih * 0.75);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
    sheen.addColorStop(0.42, 'rgba(255, 255, 255, 0)');
    logoCtx.fillStyle = sheen;
    logoCtx.fillRect(dx, dy, iw, ih);
    logoCtx.restore();

    // Specular edge (top-bright, bottom-theme-glow) + inner highlight
    logoCtx.save();
    roundRectPath(logoCtx, dx, dy, iw, ih, r);
    const edge = logoCtx.createLinearGradient(dx, dy, dx, dy + ih);
    edge.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    edge.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
    edge.addColorStop(1, rgbAlpha(glowRgb, 0.58));
    logoCtx.strokeStyle = edge;
    logoCtx.lineWidth = lineW;
    logoCtx.stroke();
    logoCtx.restore();
  }

  function drawGlassImageLogo(cx, cy, targetH) {
    const img = logo.image;
    const ar = logo.aspect > 0 ? logo.aspect : 1;
    const ih = targetH;
    const iw = ih * ar;
    const dx = cx - iw / 2;
    const dy = cy - ih / 2;

    if (logo.hasBackground) {
      drawGlassPlateLogo(dx, dy, iw, ih);
    } else {
      drawGlassSilhouetteLogo(dx, dy, iw, ih);
    }
  }

  function renderScene() {
    time += 0.012;

    // ========================================================================
    // PART A: Deep cosmic sapphire aurora
    // ========================================================================
    drawAurora();

    // ========================================================================
    // PART B: BREAK-AND-RELINK CONSTELLATION
    // ========================================================================
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Gentle ambient drift of the home anchor
      p.homeX += p.vx;
      p.homeY += p.vy;
      if (p.homeX < 0 || p.homeX > w) p.vx *= -1;
      if (p.homeY < 0 || p.homeY > h) p.vy *= -1;

      const dxCursor = p.x - mouse.x;
      const dyCursor = p.y - mouse.y;
      const distCursor = Math.hypot(dxCursor, dyCursor);

      if (distCursor < pConfig.cursorBreakRadius) {
        const repelStrength = (1 - distCursor / pConfig.cursorBreakRadius) * 5.2;
        p.x += (dxCursor / (distCursor || 1)) * repelStrength;
        p.y += (dyCursor / (distCursor || 1)) * repelStrength;
        p.brokenFactor = Math.min(1, p.brokenFactor + 0.14);
      } else {
        p.x += (p.homeX - p.x) * 0.045;
        p.y += (p.homeY - p.y) * 0.045;
        p.brokenFactor = Math.max(0, p.brokenFactor - 0.035);
      }
    }

    // Draw links, capped so each node connects to at most its random 3..5 neighbours.
    const linkCount = new Array(particles.length).fill(0);
    bgCtx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      if (linkCount[i] >= p1.maxLinks) continue;

      for (let j = i + 1; j < particles.length; j++) {
        if (linkCount[i] >= p1.maxLinks) break;
        const p2 = particles[j];
        if (linkCount[j] >= p2.maxLinks) continue;

        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist >= pConfig.linkDistance) continue;

        const intactRatio = (1 - p1.brokenFactor) * (1 - p2.brokenFactor);
        const distRatio = 1 - dist / pConfig.linkDistance;
        const alpha = distRatio * intactRatio * pConfig.lineMaxOpacity;

        if (alpha > 0.01) {
          bgCtx.strokeStyle = `rgba(226, 244, 255, ${alpha.toFixed(3)})`;
          bgCtx.beginPath();
          bgCtx.moveTo(p1.x, p1.y);
          bgCtx.lineTo(p2.x, p2.y);
          bgCtx.stroke();
          linkCount[i]++;
          linkCount[j]++;
        }
      }
    }

    // Draw bold white square / triangle "sparks" with a shared glow pass
    bgCtx.save();
    bgCtx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    bgCtx.shadowBlur = pConfig.particleGlow;
    bgCtx.fillStyle = `rgba(255, 255, 255, ${pConfig.particleMaxOpacity})`;
    for (const p of particles) {
      const r = p.radius;
      if (p.shape === 'square') {
        bgCtx.save();
        bgCtx.translate(p.x, p.y);
        bgCtx.rotate(p.rotation);
        bgCtx.fillRect(-r, -r, r * 2, r * 2);
        bgCtx.restore();
      } else {
        bgCtx.beginPath();
        bgCtx.moveTo(p.x, p.y - r * 1.3);
        bgCtx.lineTo(p.x + r * 1.15, p.y + r);
        bgCtx.lineTo(p.x - r * 1.15, p.y + r);
        bgCtx.closePath();
        bgCtx.fill();
      }
    }
    bgCtx.restore();

    // ========================================================================
    // PART C: 3D GLASSMORPHIC CENTERPIECE LOGO
    // ========================================================================
    const dpr = window.devicePixelRatio;
    logoCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);

    const safeLogoCenterY = Number.isFinite(heroLayout.logoCenterY)
      ? heroLayout.logoCenterY
      : h * 0.34;
    const targetH = Math.min(w, h) * LOGO_SCALE * dpr;
    const useCustomLogo = logo.ready && logo.image && logo.image.complete;

    // --- Proximity nudge (TASK 3.8) -----------------------------------------
    // The logo is STILL unless the cursor is NEAR it. The activation radius scales
    // with the logo's drawn size, so it feels identical at any viewport. Inside the
    // radius the logo shifts a few px TOWARDS the cursor, eased by a squared falloff
    // (0 at the edge → full at closest approach). No cursor (touch device, or the
    // pointer left the window) ⇒ target 0 ⇒ the logo eases back to dead centre.
    const drawnH = targetH / dpr;
    const drawnW = drawnH * (useCustomLogo
      ? (logo.aspect > 0 ? logo.aspect : 1)
      : LOGO_VB_W / LOGO_VB_H);
    const radius = Math.max(drawnW, drawnH) * MOTION_RADIUS_FACTOR;

    let targetTiltX = 0;
    let targetTiltY = 0;
    if (mouse.active && radius > 0) {
      const ndx = mouse.x - w * 0.5;
      const ndy = mouse.y - safeLogoCenterY;
      const dist = Math.hypot(ndx, ndy);
      if (dist < radius) {
        const falloff = Math.pow(1 - dist / radius, 2);
        const inv = 1 / (dist || 1); // normalised direction (logo → cursor)
        targetTiltX = ndx * inv * MOTION_MAX_OFFSET_PX * falloff;
        targetTiltY = ndy * inv * MOTION_MAX_OFFSET_PX * falloff;
      }
    }
    tiltX += (targetTiltX - tiltX) * MOTION_EASE;
    tiltY += (targetTiltY - tiltY) * MOTION_EASE;

    const centerX = (w * 0.5 + tiltX) * dpr;
    const centerY = (safeLogoCenterY + tiltY) * dpr;

    if (useCustomLogo) {
      drawGlassImageLogo(centerX, centerY, targetH);
    } else {
      drawGlassAppleLogo(centerX, centerY, dpr);
    }
  }

  // A thrown frame (NaN gradient, a transient canvas/compositing hiccup, …) must
  // never stop the animation loop — otherwise the loop dies mid-frame and the logo
  // never comes back until reload. Catch, log once, and keep going.
  function renderFrame() {
    try {
      renderScene();
    } catch (err) {
      if (!renderFrame.warned) {
        renderFrame.warned = true;
        console.error('[hero] render frame error (loop recovered):', err);
      }
    } finally {
      requestAnimationFrame(renderFrame);
    }
  }

  renderFrame();
})();
