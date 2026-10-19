/**
 * 3D PRODUCT ROLL SHOWCASE (js/hardware-disassembly.js)
 * Configured in `js/config.js -> hardwareDisassembly`.
 *
 * - Colorways: each colour has its own folder of ordered images (layer-1.png ... layer-N.png).
 *   The colour picker under the stage swaps the set (default = `defaultColorway`).
 * - Desktop: scrolling through the section rolls layer 1 -> last layer -> back to layer 1,
 *   then the page continues to the next section. The phone can also be dragged with the cursor.
 * - Touch devices: no scroll runway. The user swipes the phone itself:
 *     swipe left  -> next layer   (1 -> 2 -> 3 ...)
 *     swipe right -> previous     (1 -> N -> N-1 ...)   (endless loop)
 * - Each layer can carry a `pin` (feature callout). `pin: null` shows nothing for that angle.
 */

(function initProductRollShowcase() {
  const cfg = (window.BLUEPRINT_CONFIG && window.BLUEPRINT_CONFIG.hardwareDisassembly) || {};
  const track = document.getElementById('hardware-disassembly');
  const canvas = document.getElementById('disassemblyCanvas');
  if (!track || !canvas) return;
  const ctx = canvas.getContext('2d');

  const colorways = Array.isArray(cfg.colorways) ? cfg.colorways : [];
  if (!colorways.length) return;

  const COARSE = window.matchMedia('(hover: none) and (pointer: coarse)');
  const PRODUCT_SCALE = typeof cfg.productScale === 'number' ? cfg.productScale : 0.84;
  const DRAG_PX = typeof cfg.dragPxPerLayer === 'number' ? cfg.dragPxPerLayer : 140;
  let activeAnimStyle = (cfg.animationStyle || 'roll-360').toLowerCase();

  // Compact mode (touch devices OR narrow windows): no scroll runway, phone is rolled by swiping.
  let IS_TOUCH = false;
  function applyLayoutMode() {
    IS_TOUCH = COARSE.matches || window.innerWidth <= 900;
    track.classList.toggle('hw-touch', IS_TOUCH);
    if (IS_TOUCH) {
      track.style.height = 'auto';
    } else if (typeof cfg.trackHeightVh === 'number') {
      track.style.height = `${Math.max(140, cfg.trackHeightVh)}vh`;
    }
  }
  applyLayoutMode();


  // ---------------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const eyebrowEl = $('hwEyebrow');
  const titleEl = $('hwMainTitle');
  const headerOverlay = $('hwHeaderOverlay');
  const card = $('hwMilestoneCard');
  const cardColor = $('hwCardColor');
  const cardTitle = $('hwMilestoneTitle');
  const cardBody = $('hwMilestoneBody');
  const cardSpecs = $('hwMilestoneSpecs');
  const dock = $('hwRollDock');
  const picker = $('hwColorPicker');
  const pinBox = $('hwPinCallout');
  const pinTitle = $('hwPinTitle');
  const pinDetail = $('hwPinDetail');

  if (eyebrowEl) eyebrowEl.textContent = cfg.eyebrow || '';
  if (titleEl) titleEl.textContent = cfg.headline || '';

  const spec = cfg.specCard || {};
  if (cardTitle) cardTitle.textContent = spec.title || '';
  if (cardBody) cardBody.textContent = spec.body || '';
  if (cardSpecs) {
    cardSpecs.innerHTML = (spec.specs || [])
      .map((s) => `
        <div class="hw-spec-item">
          <span class="hw-spec-label">${s.label}</span>
          <span class="hw-spec-val">${s.value}</span>
        </div>`)
      .join('');
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (n, m) => ((n % m) + m) % m;
  const ease = (t) => t * t * (3 - 2 * t);
  function hexToRgb(hex, fb = [255, 255, 255]) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : fb;
  }
  const rgba = (rgb, a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

  // Removes a solid white studio background (flood fill from the border).
  // Already-transparent images are returned untouched.
  // NOTE: requires a local server (canvas pixel access is blocked on file://).
  function prepareTransparentCutout(img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    try {
      const off = document.createElement('canvas');
      off.width = iw;
      off.height = ih;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0, iw, ih);
      const imgData = octx.getImageData(0, 0, iw, ih);
      const data = imgData.data;

      const corners = [0, (iw - 1) * 4, (ih - 1) * iw * 4, ((ih - 1) * iw + (iw - 1)) * 4];
      if (corners.some((c) => data[c + 3] < 240)) return { source: img, width: iw, height: ih };
      if (!corners.every((c) => data[c] >= 235 && data[c + 1] >= 235 && data[c + 2] >= 235)) {
        return { source: img, width: iw, height: ih };
      }

      const visited = new Uint8Array(iw * ih);
      const queue = new Int32Array(iw * ih);
      let head = 0;
      let tail = 0;
      const pushIfBg = (x, y) => {
        const idx = y * iw + x;
        if (visited[idx]) return;
        const p = idx * 4;
        const r = data[p], g = data[p + 1], b = data[p + 2];
        if (r >= 225 && g >= 225 && b >= 225 && Math.max(r, g, b) - Math.min(r, g, b) <= 22) {
          visited[idx] = 1;
          queue[tail++] = idx;
        }
      };
      for (let x = 0; x < iw; x++) { pushIfBg(x, 0); pushIfBg(x, ih - 1); }
      for (let y = 0; y < ih; y++) { pushIfBg(0, y); pushIfBg(iw - 1, y); }
      while (head < tail) {
        const curr = queue[head++];
        data[curr * 4 + 3] = 0;
        const cx = curr % iw;
        const cy = (curr / iw) | 0;
        if (cx > 0) pushIfBg(cx - 1, cy);
        if (cx + 1 < iw) pushIfBg(cx + 1, cy);
        if (cy > 0) pushIfBg(cx, cy - 1);
        if (cy + 1 < ih) pushIfBg(cx, cy + 1);
      }
      octx.putImageData(imgData, 0, 0);
      return { source: off, width: iw, height: ih };
    } catch (_e) {
      return { source: img, width: iw, height: ih };
    }
  }

  function loadLayer(folder, index, layerCfg) {
    const entry = { ready: false, source: null, width: 1200, height: 1600 };
    const num = index + 1;
    const candidates = [];
    if (layerCfg && layerCfg.image) candidates.push(layerCfg.image);
    ['png', 'webp', 'jpg', 'jpeg'].forEach((ext) => candidates.push(`${folder}layer-${num}.${ext}`));
    const tryNext = (i) => {
      if (i >= candidates.length) return;
      const img = new Image();
      img.onload = () => {
        const prepared = prepareTransparentCutout(img);
        Object.assign(entry, prepared, { ready: true });
      };
      img.onerror = () => tryNext(i + 1);
      img.src = candidates[i];
    };
    tryNext(0);
    return entry;
  }

  // Preload every colorway so switching colour is instant
  const frames = colorways.map((cw) =>
    (cw.layers || []).map((layer, i) => loadLayer(cw.folder || '', i, layer))
  );

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  let cwIdx = Math.max(0, colorways.findIndex((c) => c.id === cfg.defaultColorway));
  let scrollRoll = 0;     // driven by page scroll (desktop only)
  let dragOffset = 0;     // driven by drag / swipe
  let roll = 0;           // smoothed displayed roll (in layer units)
  let glowRgb = hexToRgb(colorways[cwIdx].glow);
  let dragging = null;

  const layerCount = () => Math.max(1, (colorways[cwIdx].layers || []).length);

  // ---------------------------------------------------------------------------
  // COLOUR PICKER (liquid iOS buttons)
  // ---------------------------------------------------------------------------
  const colorButtons = colorways.map((cw, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hw-color-btn';
    btn.id = `hwColor-${cw.id}`;
    btn.setAttribute('role', 'radio');
    btn.style.setProperty('--swatch', cw.swatch || '#ffffff');
    btn.style.setProperty('--glow', cw.glow || cw.swatch || '#ffffff');
    btn.innerHTML = `<span class="hw-color-dot"></span><span>${cw.label}</span>`;
    btn.addEventListener('click', () => selectColorway(idx));
    picker && picker.appendChild(btn);
    return btn;
  });

  function selectColorway(idx) {
    const prevCount = layerCount();
    const settledLayer = mod(Math.round(roll), prevCount);
    cwIdx = idx;
    const newCount = layerCount();
    // Keep the same "side" when possible: front stays front after switching
    const target = settledLayer === 0 ? 0 : Math.round((settledLayer / prevCount) * newCount);
    const base = IS_TOUCH ? 0 : scrollRollFor(newCount);
    dragOffset = target - Math.round(base);
    roll = base + dragOffset;
    colorButtons.forEach((b, i) => {
      b.classList.toggle('active', i === idx);
      b.setAttribute('aria-checked', i === idx ? 'true' : 'false');
    });
    const cw = colorways[idx];
    track.style.setProperty('--hw-glow', cw.glow || '#ffffff');
    track.style.setProperty('--hw-glow-rgb', hexToRgb(cw.glow).join(', '));
    if (cardColor) cardColor.textContent = cw.label;
  }

  // ---------------------------------------------------------------------------
  // SCROLL (desktop): progress 0..1 maps to roll 0..N  (N == layer 1 again)
  // ---------------------------------------------------------------------------
  let scrollProgress = 0;
  function updateScroll() {
    if (IS_TOUCH) return;
    const rect = track.getBoundingClientRect();
    const maxScroll = Math.max(1, rect.height - window.innerHeight);
    scrollProgress = clamp(-rect.top / maxScroll, 0, 1);
  }
  const scrollRollFor = (n) => scrollProgress * n;
  window.addEventListener('scroll', updateScroll, { passive: true });

  // ---------------------------------------------------------------------------
  // DRAG / SWIPE (both desktop cursor and touch)
  // ---------------------------------------------------------------------------
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = { id: e.pointerId, startX: e.clientX, startOffset: dragOffset, moved: false };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('grabbing');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== dragging.id) return;
    const dx = e.clientX - dragging.startX;
    if (Math.abs(dx) > 4) dragging.moved = true;
    // Drag LEFT (dx < 0) -> next layer, drag RIGHT -> previous layer
    dragOffset = dragging.startOffset - dx / DRAG_PX;
  });
  const endDrag = (e) => {
    if (!dragging || (e && e.pointerId !== dragging.id)) return;
    const base = IS_TOUCH ? 0 : scrollRoll;
    // Snap to the nearest whole layer
    dragOffset = Math.round(base + dragOffset) - base;
    dragging = null;
    canvas.classList.remove('grabbing');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);

  // ---------------------------------------------------------------------------
  // CANVAS SIZING
  // ---------------------------------------------------------------------------
  let dpr = 1, w = 0, h = 0;
  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    w = canvas.width = Math.round(r.width * dpr);
    h = canvas.height = Math.round(r.height * dpr);
  }
  window.addEventListener('resize', () => {
    applyLayoutMode();
    resizeCanvas();
    updateScroll();
  });

  // Stage geometry (CSS px relative to canvas) — product sits large & centred
  function getStage() {
    const cr = canvas.getBoundingClientRect();
    const hb = headerOverlay ? headerOverlay.getBoundingClientRect().bottom - cr.top + 8 : 120;
    let bottom = cr.height - 20;
    if (dock && !IS_TOUCH) bottom = Math.min(bottom, dock.getBoundingClientRect().top - cr.top - 12);
    const top = Math.max(70, hb);
    const stageH = Math.max(200, bottom - top);
    const desktop = cr.width > 1000 && !IS_TOUCH;
    return { cx: cr.width * (desktop ? 0.47 : 0.5), cy: top + stageH / 2, stageH, desktop, cr };
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  function drawFrame(entry, cxPx, cyPx, drawH, scaleX, alpha, sheen) {
    if (!entry || !entry.ready) return null;
    const drawW = drawH * (entry.width / Math.max(1, entry.height));
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.translate(cxPx * dpr, cyPx * dpr);
    ctx.scale(Math.max(0.04, scaleX), 1);
    ctx.drawImage(entry.source, (-drawW / 2) * dpr, (-drawH / 2) * dpr, drawW * dpr, drawH * dpr);
    if (sheen > 0.01) {
      ctx.globalCompositeOperation = 'source-atop';
      const g = ctx.createLinearGradient((-drawW / 2) * dpr, 0, (drawW / 2) * dpr, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${0.10 * sheen})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect((-drawW / 2) * dpr, (-drawH / 2) * dpr, drawW * dpr, drawH * dpr);
    }
    ctx.restore();
    return { drawW, drawH };
  }

  let lastPinKey = '';
  function updatePin(stage, drawH, layerIdx, settled) {
    const cw = colorways[cwIdx];
    const layer = (cw.layers || [])[layerIdx];
    const pin = layer && layer.pin;
    const entry = frames[cwIdx][layerIdx];
    const show = Boolean(pin && settled && entry && entry.ready);
    if (pinBox) pinBox.classList.toggle('visible', show);
    if (!show) return;

    const key = `${cwIdx}-${layerIdx}`;
    if (key !== lastPinKey) {
      lastPinKey = key;
      if (pinTitle) pinTitle.textContent = pin.title || '';
      if (pinDetail) pinDetail.textContent = pin.detail || '';
    }

    const drawW = drawH * (entry.width / Math.max(1, entry.height));
    const px = stage.cx + (pin.x - 0.5) * drawW;
    const py = stage.cy + (pin.y - 0.5) * drawH;

    if (stage.desktop) {
      const boxRight = stage.cx - drawW * 0.30 - 24;
      pinBox.style.left = `${boxRight}px`;
      pinBox.style.top = `${py}px`;
      pinBox.classList.remove('stacked');

      // leader line + glowing dot
      ctx.save();
      ctx.strokeStyle = rgba(glowRgb, 0.75);
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.moveTo((boxRight + 10) * dpr, py * dpr);
      ctx.lineTo(px * dpr, py * dpr);
      ctx.stroke();
      ctx.shadowColor = rgba(glowRgb, 1);
      ctx.shadowBlur = 14 * dpr;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px * dpr, py * dpr, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      pinBox.classList.add('stacked');
      pinBox.style.left = '';
      pinBox.style.top = '';
    }
  }

  function render() {
    const n = layerCount();
    scrollRoll = IS_TOUCH ? 0 : scrollRollFor(n);
    const target = scrollRoll + dragOffset;
    roll += (target - roll) * (dragging ? 0.35 : 0.12);
    glowRgb = glowRgb.map((c, i) => c + (hexToRgb(colorways[cwIdx].glow)[i] - c) * 0.08);

    ctx.clearRect(0, 0, w, h);
    const stage = getStage();
    const drawH = stage.stageH * PRODUCT_SCALE / 0.86; // images carry ~14% padding
    const { cx, cy } = stage;

    // Studio glow in the selected colour
    const glow = ctx.createRadialGradient(cx * dpr, cy * dpr, 0, cx * dpr, cy * dpr, stage.stageH * 0.75 * dpr);
    glow.addColorStop(0, rgba(glowRgb, 0.30));
    glow.addColorStop(0.5, rgba(glowRgb, 0.08));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Floor shadow
    ctx.save();
    ctx.translate(cx * dpr, (cy + stage.stageH * PRODUCT_SCALE * 0.5 + 10) * dpr);
    ctx.scale(1, 0.14);
    const fs = ctx.createRadialGradient(0, 0, 0, 0, 0, stage.stageH * 0.32 * dpr);
    fs.addColorStop(0, rgba(glowRgb, 0.35));
    fs.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fs;
    ctx.beginPath();
    ctx.arc(0, 0, stage.stageH * 0.32 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (activeAnimStyle === 'explode') {
      // Exploded vertical layer teardown
      const expT = IS_TOUCH
        ? clamp(Math.abs(roll) / Math.max(1, n - 1), 0, 1)
        : clamp(scrollProgress * 1.15, 0, 1);
      const explosionCurve = Math.sin(expT * Math.PI * 0.5);
      const maxSpreadPx = stage.stageH * 0.28;
      const set = frames[cwIdx];

      // Draw dashed laser alignment bus lines connecting top and bottom layers
      if (explosionCurve > 0.04 && n > 1) {
        const topY = cy - maxSpreadPx * explosionCurve;
        const botY = cy + maxSpreadPx * explosionCurve;
        const halfW = (drawH * 0.45) * 0.5;

        ctx.save();
        ctx.strokeStyle = rgba(glowRgb, 0.4 * explosionCurve);
        ctx.lineWidth = 1.25 * dpr;
        ctx.setLineDash([5 * dpr, 6 * dpr]);

        // Left bus
        ctx.beginPath();
        ctx.moveTo((cx - halfW) * dpr, topY * dpr);
        ctx.lineTo((cx - halfW) * dpr, botY * dpr);
        ctx.stroke();

        // Right bus
        ctx.beginPath();
        ctx.moveTo((cx + halfW) * dpr, topY * dpr);
        ctx.lineTo((cx + halfW) * dpr, botY * dpr);
        ctx.stroke();

        // Center bus
        ctx.beginPath();
        ctx.moveTo(cx * dpr, topY * dpr);
        ctx.lineTo(cx * dpr, botY * dpr);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw each layer from bottom to top
      const nearest = mod(Math.round(roll), n);
      for (let idx = n - 1; idx >= 0; idx--) {
        const entry = set[idx];
        const lyrCfg = (colorways[cwIdx].layers || [])[idx] || {};
        const factor = typeof lyrCfg.spreadFactor === 'number'
          ? lyrCfg.spreadFactor
          : ((idx - (n - 1) / 2) * (2.0 / Math.max(1, n - 1)));
        const layerY = cy + factor * explosionCurve * maxSpreadPx;
        const isHighlighted = idx === nearest;

        ctx.save();
        if (explosionCurve > 0.05) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 18 * dpr * explosionCurve;
          ctx.shadowOffsetY = 10 * dpr * explosionCurve;
        }
        drawFrame(entry, cx, layerY, drawH * 0.72, 1, 1, isHighlighted ? 0.2 : 0);
        ctx.restore();
      }

      updatePin(stage, drawH * 0.72, nearest, true);
    } else if (activeAnimStyle === 'flip-360') {
      // 360° Turntable Flip on Y-axis
      const base = Math.floor(roll);
      const t = roll - base;
      const e = ease(t);
      const set = frames[cwIdx];
      const out = set[mod(base, n)];
      const inc = set[mod(base + 1, n)];

      // Flip on the Y-axis: cos goes from 1 to 0 (at e = 0.5) to -1
      if (e < 0.5) {
        const sx = Math.cos(e * Math.PI);
        drawFrame(out, cx, cy, drawH, Math.max(0.04, sx), 1, e * 2);
      } else {
        const sx = Math.cos((1 - e) * Math.PI);
        drawFrame(inc, cx, cy, drawH, Math.max(0.04, sx), 1, (1 - e) * 2);
      }

      const nearest = mod(Math.round(roll), n);
      const settled = Math.abs(roll - Math.round(roll)) < 0.12 && !dragging;
      updatePin(stage, drawH, nearest, settled);
    } else {
      // "roll-360": 3D orbital perspective roll across angles (loops endlessly)
      const base = Math.floor(roll);
      const t = roll - base;
      const e = ease(t);
      const set = frames[cwIdx];
      const out = set[mod(base, n)];
      const inc = set[mod(base + 1, n)];
      const shift = stage.stageH * 0.10;

      if (t < 0.001) {
        drawFrame(out, cx, cy, drawH, 1, 1, 0);
      } else {
        // outgoing turns away to the left, incoming arrives from the right
        drawFrame(out, cx - e * shift, cy, drawH, Math.cos(e * Math.PI / 2), 1 - e, e);
        drawFrame(inc, cx + (1 - e) * shift, cy, drawH, Math.sin(e * Math.PI / 2), e, 1 - e);
      }

      const nearest = mod(Math.round(roll), n);
      const settled = Math.abs(roll - Math.round(roll)) < 0.12 && !dragging;
      updatePin(stage, drawH, nearest, settled);
    }

    requestAnimationFrame(render);
  }

  resizeCanvas();
  updateScroll();
  selectColorway(cwIdx);
  render();

  // Console helpers for live switching:
  window.setProductColor = (id) => {
    const idx = colorways.findIndex((c) => c.id === id);
    if (idx >= 0) selectColorway(idx);
    return colorways[cwIdx].id;
  };

  window.setHardwareAnimation = (style) => {
    if (typeof style === 'string') {
      activeAnimStyle = style.toLowerCase();
    }
    return activeAnimStyle;
  };
})();