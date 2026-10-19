/**
 * SCROLL IMMERSION & TEMPLATE HYDRATION ENGINE (js/scroll-immersion.js)
 * - Hydrates Navbar, Account Modal, Bento Grid, 3 Pinned Blur-to-Clear Sections,
 *   3 ApplePic.jpg Editorial Scrollable Bento Carousels, Accordion Q&A, and Footer.
 * - Enforces exact Apple Vision Pro scroll physics:
 *   The fullscreen backdrop stays pinned still at inset:0 while unblurring & brightening,
 *   and ONLY the headline scrolls upward and exits out the top of the viewport.
 */

(function initScrollImmersionAndLayout() {
  const cfg = window.BLUEPRINT_CONFIG;

  // Immersion scroll tuning (falls back to sensible defaults if not present in config.js)
  const tune = cfg.immersionTuning || {
    trackHeightVh: 175,
    initialBlurPx: 10,
    initialBrightness: 0.7,
    vignetteOpacity: 0.55,
    headlineHoldProgress: 0.12,
    focusEndProgress: 0.7,
    headlineExitVh: 100
  };

  window.BLUEPRINT_AUTOPLAY_VIDEOS = true;

  // Shared IntersectionObserver so videos auto-play in view and pause offscreen
  const videoViewportObserver =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const vid = entry.target;
              if (entry.isIntersecting) {
                if (vid.dataset.userPaused !== 'true' && window.BLUEPRINT_AUTOPLAY_VIDEOS !== false) {
                  vid.play().catch(() => {});
                }
              } else {
                vid.pause();
              }
            });
          },
          { threshold: 0.25 }
        )
      : null;

  // Known studio-border fallback map when opened via file:// (where browser CORS rules block canvas.getImageData)
  const FILE_PROTOCOL_STUDIO_MAP = {
    'sec1-card1.jpg': { type: 'edge', color: 'rgb(189, 203, 212)' },
    'sec1-card2.jpg': { type: 'edge', color: 'rgb(132, 169, 172)' },
    'sec1-card3.jpg': { type: 'white-cutout' },
    'sec2-card1.jpg': { type: 'white-cutout' },
    'sec2-card2.jpg': { type: 'white-cutout', dock: 'left' },
    'sec2-card3.jpg': { type: 'white-cutout' },
    'sec3-card1.jpg': { type: 'white-cutout' },
    'sec3-card2.jpg': { type: 'cover' },
    'bento-1.jpg':    { type: 'cover' },
    'bento-2.jpg':    { type: 'cover' },
    'bento-3.jpg':    { type: 'cover' },
    'bento-4.jpg':    { type: 'cover' }
  };

  // Detects if a cutout product touches one specific border of the image canvas (e.g., cropped on the left edge)
  // so we can dock that cut edge flush against the card wall instead of floating cut in mid-air.
  function detectCutoutDockEdge(data, S) {
    function isProductPixel(x, y) {
      const i = (y * S + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 210) return false; // transparent
      if (r >= 238 && g >= 238 && b >= 238) return false; // white background
      return true;
    }

    let leftHits = 0, rightHits = 0, topHits = 0, bottomHits = 0;
    const span = S - 8;
    for (let k = 4; k < S - 4; k++) {
      if (isProductPixel(0, k) || isProductPixel(1, k)) leftHits++;
      if (isProductPixel(S - 1, k) || isProductPixel(S - 2, k)) rightHits++;
      if (isProductPixel(k, 0) || isProductPixel(k, 1)) topHits++;
      if (isProductPixel(k, S - 1) || isProductPixel(k, S - 2)) bottomHits++;
    }

    const leftRatio = leftHits / span;
    const rightRatio = rightHits / span;
    const topRatio = topHits / span;
    const bottomRatio = bottomHits / span;

    if (leftRatio > 0.22 && rightRatio < 0.08 && topRatio < 0.15 && bottomRatio < 0.15) return 'left';
    if (rightRatio > 0.22 && leftRatio < 0.08 && topRatio < 0.15 && bottomRatio < 0.15) return 'right';
    if (bottomRatio > 0.22 && topRatio < 0.08 && leftRatio < 0.15 && rightRatio < 0.15) return 'bottom';
    if (topRatio > 0.18 && bottomRatio < 0.08 && leftRatio < 0.15 && rightRatio < 0.15) return 'top';
    return null;
  }

  /**
   * Samples the outer border pixels of a loaded image to decide the cleanest presentation:
   * 1. Transparent PNG cutout -> .media-cutout (sits on #f5f5f7 dimmer white box; docks flush if cut on one edge)
   * 2. White studio cutout    -> .media-white-cutout (mix-blend-mode: multiply blends #ffffff into #f5f5f7 box)
   * 3. Solid dark/color border-> .media-edge-matched (fills box with exact border RGB so zero seam lines appear)
   * 4. Full-scene photograph  -> .media-cover (fills rounded box edge-to-edge)
   */
  function applySmartBoxStyling(img, wrapper, resolvedSrc, cardObj) {
    const isEditorialBox = wrapper.classList.contains('editorial-image-box');

    if (cardObj && cardObj.dock) {
      wrapper.classList.add(`dock-${cardObj.dock}`);
    }

    // 1. Explicit per-card config overrides (optional in js/config.js)
    if (cardObj && cardObj.bgColor) {
      wrapper.classList.add('media-edge-matched');
      wrapper.style.background = cardObj.bgColor;
      return;
    }
    if (cardObj && cardObj.boxStyle) {
      if (cardObj.boxStyle === 'glass' || cardObj.boxStyle === 'cutout') {
        const isJpg = /\.(jpe?g)(\?.*)?$/i.test(resolvedSrc);
        wrapper.classList.add(isJpg && isEditorialBox ? 'media-white-cutout' : 'media-cutout');
        return;
      }
      if (cardObj.boxStyle === 'cover') {
        wrapper.classList.add('media-cover');
        return;
      }
    }

    // 2. Offscreen 64x64 border pixel inspection
    try {
      const S = 64;
      const cvs = document.createElement('canvas');
      cvs.width = S;
      cvs.height = S;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, S, S);
      const data = ctx.getImageData(0, 0, S, S).data;

      let totalBorder = 0;
      let transparentCount = 0;
      let whiteCount = 0;
      const samples = [];

      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          // Sample outer 4px perimeter ring (left, right, top, bottom)
          if (x < 4 || x >= S - 4 || y < 4 || y >= S - 4) {
            totalBorder++;
            const i = (y * S + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 210) {
              transparentCount++;
            } else {
              if (r >= 238 && g >= 238 && b >= 238) whiteCount++;
              samples.push([r, g, b]);
            }
          }
        }
      }

      const transparentRatio = totalBorder > 0 ? transparentCount / totalBorder : 0;
      const whiteRatio = totalBorder > 0 ? whiteCount / totalBorder : 0;
      const autoDock = !(cardObj && cardObj.dock) ? detectCutoutDockEdge(data, S) : null;

      // Case A: True transparent cutout (.png / .webp / .svg / transparent image)
      if (transparentRatio > 0.20) {
        wrapper.classList.add('media-cutout');
        if (autoDock) wrapper.classList.add(`dock-${autoDock}`);
        return;
      }

      // Case B: White studio cutout (even if one edge is cropped through the product, >=55% of border is white)
      if (whiteRatio > 0.55) {
        if (isEditorialBox) {
          wrapper.classList.add('media-white-cutout');
          if (autoDock) wrapper.classList.add(`dock-${autoDock}`);
        } else {
          wrapper.classList.add('media-edge-matched');
          wrapper.style.background = '#ffffff';
        }
        return;
      }

      if (samples.length > 0) {
        let sumR = 0, sumG = 0, sumB = 0;
        for (let i = 0; i < samples.length; i++) {
          sumR += samples[i][0];
          sumG += samples[i][1];
          sumB += samples[i][2];
        }
        const avgR = Math.round(sumR / samples.length);
        const avgG = Math.round(sumG / samples.length);
        const avgB = Math.round(sumB / samples.length);

        let sqDiff = 0;
        for (let i = 0; i < samples.length; i++) {
          const dr = samples[i][0] - avgR;
          const dg = samples[i][1] - avgG;
          const db = samples[i][2] - avgB;
          sqDiff += (dr * dr + dg * dg + db * db) / 3;
        }
        const stdDev = Math.sqrt(sqDiff / samples.length);

        // Case C: Uniform solid dark or colored studio background (e.g. pastel robot cards or black bento cards)
        if (stdDev < 28) {
          wrapper.classList.add('media-edge-matched');
          wrapper.style.background = `rgb(${avgR}, ${avgG}, ${avgB})`;
          return;
        }

        // Case D: Scenic / full-bleed multi-color image
        if (cardObj && cardObj.fit === 'contain') {
          wrapper.classList.add('media-edge-matched');
          wrapper.style.background = `rgb(${avgR}, ${avgG}, ${avgB})`;
        } else {
          wrapper.classList.add('media-cover');
        }
        return;
      }
    } catch (e) {
      // Browser opened via file:// taints canvas readback; use smart filename + extension fallback below.
    }

    // 3. Fallback for file:// origin where canvas.getImageData is blocked
    const baseName = (resolvedSrc || '').split('/').pop().split('?')[0].toLowerCase();
    const preset = FILE_PROTOCOL_STUDIO_MAP[baseName];
    if (preset) {
      if (preset.dock && !(cardObj && cardObj.dock)) {
        wrapper.classList.add(`dock-${preset.dock}`);
      }
      if (preset.type === 'white-cutout') {
        wrapper.classList.add(isEditorialBox ? 'media-white-cutout' : 'media-cutout');
      } else if (preset.type === 'cutout') {
        wrapper.classList.add('media-cutout');
      } else if (preset.type === 'edge') {
        wrapper.classList.add('media-edge-matched');
        wrapper.style.background = preset.color;
      } else if (preset.type === 'cover') {
        wrapper.classList.add('media-cover');
      }
      return;
    }

    if (/\.(png|svg|webp)(\?.*)?$/i.test(resolvedSrc)) {
      wrapper.classList.add('media-cutout');
    } else if (isEditorialBox) {
      wrapper.classList.add('media-white-cutout');
    } else {
      wrapper.classList.add('media-cover');
    }
  }

  // Helper: Builds the floating Liquid Glass Play/Pause + Mute/Unmute control pill for video or audio
  function createMediaControlPill(mediaEl, isAudioOnly, visualizerEl) {
    const pill = document.createElement('div');
    pill.className = 'video-glass-controls';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'video-ctrl-btn';
    playBtn.setAttribute('aria-label', 'Play or Pause media');
    playBtn.title = 'Play / Pause';
    playBtn.textContent = mediaEl.paused ? '▶' : '❚❚';

    const muteBtn = document.createElement('button');
    muteBtn.type = 'button';
    muteBtn.className = 'video-ctrl-btn';
    muteBtn.setAttribute('aria-label', 'Mute or Unmute audio');
    muteBtn.title = 'Mute / Unmute';
    muteBtn.textContent = mediaEl.muted ? '🔇' : '🔊';

    function syncUI() {
      playBtn.textContent = mediaEl.paused ? '▶' : '❚❚';
      muteBtn.textContent = mediaEl.muted ? '🔇' : '🔊';
      if (visualizerEl) {
        visualizerEl.classList.toggle('is-playing', !mediaEl.paused);
      }
    }

    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mediaEl.paused) {
        mediaEl.dataset.userPaused = 'false';
        if (isAudioOnly) mediaEl.muted = false;
        mediaEl.play().catch(() => {});
      } else {
        mediaEl.dataset.userPaused = 'true';
        mediaEl.pause();
      }
      syncUI();
    });

    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mediaEl.muted = !mediaEl.muted;
      if (!mediaEl.muted && mediaEl.paused) {
        mediaEl.dataset.userPaused = 'false';
        mediaEl.play().catch(() => {});
      }
      syncUI();
    });

    mediaEl.addEventListener('play', syncUI);
    mediaEl.addEventListener('pause', syncUI);
    mediaEl.addEventListener('volumechange', syncUI);

    if (isAudioOnly) {
      const tag = document.createElement('span');
      tag.className = 'video-ctrl-label';
      tag.textContent = 'AUDIO';
      pill.appendChild(tag);
    }

    pill.appendChild(playBtn);
    pill.appendChild(muteBtn);
    return pill;
  }

  /**
   * Universal Media & Smart-Glass Slot Builder:
   * - Supports Images (.png, .jpg, .webp, .svg), Videos (.mp4, .webm, .mov, .m4v), and Audio (.mp3, .wav, .m4a).
   * - Automatically probes alternate extensions (.png, .mp4, .webp) if the user drops a different file format
   *   with the same base name into the folder without editing config.js.
   */
  function createSmartImageSlot(srcPath, label, containerClass, cardObj) {
    const wrapper = document.createElement('div');
    wrapper.className = `${containerClass} is-placeholder`;

    const primarySrc = (cardObj && (cardObj.video || cardObj.media || cardObj.image)) || srcPath;
    const companionAudioSrc = (cardObj && cardObj.audio) || null;

    const placeholder = document.createElement('div');
    placeholder.className = 'asset-slot-placeholder';
    placeholder.innerHTML = `<strong>[ DROP IMAGE / VIDEO / MP3 IN DIR ]</strong><span>${primarySrc}</span>`;
    wrapper.appendChild(placeholder);

    if (!primarySrc) return wrapper;

    const isVideoPath = (p) => /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(p || '');
    const isAudioPath = (p) => /\.(mp3|wav|m4a|ogg|aac)(\?.*)?$/i.test(p || '');

    function attachCompanionAudio(audioUrl) {
      if (!audioUrl) return;
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.preload = 'metadata';
      audio.muted = false;
      const pill = createMediaControlPill(audio, true, null);
      wrapper.appendChild(pill);
    }

    function mountVideo(videoSrc) {
      const video = document.createElement('video');
      video.src = videoSrc;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'metadata';

      let mounted = false;
      const onReady = () => {
        if (mounted) return;
        mounted = true;
        placeholder.remove();
        wrapper.classList.remove('is-placeholder');
        wrapper.classList.add('media-loaded');

        if (cardObj && cardObj.fit === 'contain') {
          wrapper.classList.add('media-edge-matched');
          wrapper.style.background = (cardObj && cardObj.bgColor) || '#000000';
        } else {
          wrapper.classList.add('media-cover');
        }

        wrapper.appendChild(video);
        wrapper.appendChild(createMediaControlPill(video, false, null));

        video.addEventListener('click', () => {
          if (video.paused) {
            video.dataset.userPaused = 'false';
            video.play().catch(() => {});
          } else {
            video.dataset.userPaused = 'true';
            video.pause();
          }
        });

        if (videoViewportObserver) {
          videoViewportObserver.observe(video);
        } else {
          video.play().catch(() => {});
        }
      };

      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('loadeddata', onReady);
    }

    function mountAudioStage(audioSrc) {
      const audio = new Audio(audioSrc);
      audio.loop = true;
      audio.preload = 'metadata';

      audio.addEventListener('loadedmetadata', () => {
        placeholder.remove();
        wrapper.classList.remove('is-placeholder');
        wrapper.classList.add('media-loaded', 'media-cutout');

        const viz = document.createElement('div');
        viz.className = 'audio-stage-visualizer';
        viz.innerHTML = `
          <div class="audio-eq-bars">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <div style="font-weight:600; font-size:0.95rem; color:#1d1d1f;">${label || 'Spatial Audio Track'}</div>
        `;
        wrapper.appendChild(viz);
        wrapper.appendChild(createMediaControlPill(audio, true, viz));
      });
    }

    if (isVideoPath(primarySrc)) {
      mountVideo(primarySrc);
      return wrapper;
    }

    if (isAudioPath(primarySrc)) {
      mountAudioStage(primarySrc);
      return wrapper;
    }

    // Build fallback candidate list in case the user replaced a .jpg with a .png, .webp, .mp4, or .mp3
    const baseWithoutExt = primarySrc.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, '');
    const fallbackCandidates = [
      primarySrc,
      `${baseWithoutExt}.png`,
      `${baseWithoutExt}.webp`,
      `${baseWithoutExt}.jpg`,
      `${baseWithoutExt}.mp4`,
      `${baseWithoutExt}.webm`,
      `${baseWithoutExt}.mp3`
    ].filter((v, i, arr) => arr.indexOf(v) === i);

    let candidateIdx = 0;

    function tryNextCandidate() {
      if (candidateIdx >= fallbackCandidates.length) return;
      const candidate = fallbackCandidates[candidateIdx++];

      if (isVideoPath(candidate)) {
        mountVideo(candidate);
        return;
      }
      if (isAudioPath(candidate)) {
        mountAudioStage(candidate);
        return;
      }

      const img = new Image();
      img.decoding = 'async';
      img.alt = label || 'Blueprint Asset';
      img.onload = () => {
        placeholder.remove();
        wrapper.classList.remove('is-placeholder');
        wrapper.classList.add('media-loaded');
        applySmartBoxStyling(img, wrapper, candidate, cardObj);
        wrapper.appendChild(img);
        if (companionAudioSrc) {
          attachCompanionAudio(companionAudioSrc);
        }
      };
      img.onerror = () => {
        tryNextCandidate();
      };
      img.src = candidate;
    }

    tryNextCandidate();
    return wrapper;
  }

  // ==========================================================================
  // 1. NAVBAR, MOBILE MENU, ACCOUNT PORTAL & TECH SPECS MODAL HYDRATION
  // ==========================================================================
  const topNavbar = document.getElementById('topNavbar');
  document.getElementById('navBrandTitle').textContent =
    cfg.navbar.brandText || (cfg.meta && cfg.meta.productName) || '';
  const navLinksList = document.getElementById('navLinksList');
  const mobileNavLinksList = document.getElementById('mobileNavLinksList');

  cfg.navbar.links.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
    navLinksList.appendChild(li);

    if (mobileNavLinksList) {
      const mLi = document.createElement('li');
      mLi.innerHTML = `<a href="${item.href}"><span>${item.label}</span><span>›</span></a>`;
      mobileNavLinksList.appendChild(mLi);
    }
  });

  // Mobile Menu Toggle Logic
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavDropdown = document.getElementById('mobileNavDropdown');
  const mobileTechSpecsBtn = document.getElementById('mobileTechSpecsBtn');

  function closeMobileMenu() {
    if (!mobileMenuBtn || !mobileNavDropdown) return;
    mobileMenuBtn.classList.remove('is-active');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileNavDropdown.setAttribute('hidden', '');
    if (topNavbar) topNavbar.classList.remove('menu-open');
  }

  if (mobileMenuBtn && mobileNavDropdown) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !mobileNavDropdown.hasAttribute('hidden');
      if (isOpen) {
        closeMobileMenu();
      } else {
        mobileMenuBtn.classList.add('is-active');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileNavDropdown.removeAttribute('hidden');
        if (topNavbar) topNavbar.classList.add('menu-open');
      }
    });

    mobileNavDropdown.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => closeMobileMenu());
    });

    document.addEventListener('click', (e) => {
      if (topNavbar && !topNavbar.contains(e.target)) {
        closeMobileMenu();
      }
    });
  }

  // ---- Authentic Multi-Pathway Authentication (Email/ID 2FA + Pop-Out OAuth Chooser + Welcome Email) ----
  const accountBtn = document.getElementById('accountBtn');
  const accountStatusDot = document.getElementById('accountStatusDot');
  const accountModal = document.getElementById('accountModal');
  const closeAccountModal = document.getElementById('closeAccountModal');
  const accountModalEyebrow = document.getElementById('accountModalEyebrow');
  const accountModalTitle = document.getElementById('accountModalTitle');

  // 4 Panes inside #accountModal
  const accountAuthPane = document.getElementById('accountAuthPane');
  const accountVerifyPane = document.getElementById('accountVerifyPane');
  const accountProfilePane = document.getElementById('accountProfilePane');
  const accountEmailViewerPane = document.getElementById('accountEmailViewerPane');

  // Entry Form (#accountAuthPane)
  const accountUnifiedForm = document.getElementById('accountUnifiedForm');
  const signupExtraFields = document.getElementById('signupExtraFields');
  const signinEmailInput = document.getElementById('signinEmailInput');
  const signupNameInput = document.getElementById('signupNameInput');
  const authContinueBtn = document.getElementById('authContinueBtn');
  const authSwitchPrompt = document.getElementById('authSwitchPrompt');
  const toggleAuthModeBtn = document.getElementById('toggleAuthModeBtn');
  const accountAuthFeedback = document.getElementById('accountAuthFeedback');

  // 2-Step Verification Form (#accountVerifyPane)
  const verifyIdentityEmail = document.getElementById('verifyIdentityEmail');
  const verifyChangeEmailBtn = document.getElementById('verifyChangeEmailBtn');
  const accountVerifyForm = document.getElementById('accountVerifyForm');
  const verifyPasswordLabel = document.getElementById('verifyPasswordLabel');
  const verifyPasswordInput = document.getElementById('verifyPasswordInput');
  const verifyOtpInput = document.getElementById('verifyOtpInput');
  const verifyOtpHint = document.getElementById('verifyOtpHint');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const verifyStepFeedback = document.getElementById('verifyStepFeedback');
  const verifySubmitBtn = document.getElementById('verifySubmitBtn');

  // Signed-in Profile Controls (#accountProfilePane)
  const openWelcomeEmailFromProfileBtn = document.getElementById('openWelcomeEmailFromProfileBtn');
  const switchAccountBtn = document.getElementById('switchAccountBtn');
  const signOutBtn = document.getElementById('signOutBtn');

  // Welcome Email Viewer Controls (#accountEmailViewerPane)
  const backToProfileFromEmailBtn = document.getElementById('backToProfileFromEmailBtn');
  const sendRealMailtoBtn = document.getElementById('sendRealMailtoBtn');

  // Pop-Out OAuth Account Chooser Window (#oauthPopupBackdrop)
  const oauthPopupBackdrop = document.getElementById('oauthPopupBackdrop');
  const closeOauthPopupDot = document.getElementById('closeOauthPopupDot');
  const closeOauthPopupBtn = document.getElementById('closeOauthPopupBtn');
  const oauthWindowUrl = document.getElementById('oauthWindowUrl');
  const oauthBrandLogo = document.getElementById('oauthBrandLogo');
  const oauthBrandSub = document.getElementById('oauthBrandSub');
  const oauthPopupTitle = document.getElementById('oauthPopupTitle');
  const oauthAccountListStep = document.getElementById('oauthAccountListStep');
  const oauthAccountList = document.getElementById('oauthAccountList');
  const oauthUseAnotherBtn = document.getElementById('oauthUseAnotherBtn');
  const oauthCustomAccountForm = document.getElementById('oauthCustomAccountForm');
  const oauthCustomNameInput = document.getElementById('oauthCustomNameInput');
  const oauthCustomEmailLabel = document.getElementById('oauthCustomEmailLabel');
  const oauthCustomEmailInput = document.getElementById('oauthCustomEmailInput');
  const oauthCustomPasswordInput = document.getElementById('oauthCustomPasswordInput');
  const oauthBackToListBtn = document.getElementById('oauthBackToListBtn');
  const oauthConsentStep = document.getElementById('oauthConsentStep');
  const oauthConsentAccountPill = document.getElementById('oauthConsentAccountPill');
  const oauthConsentCopy = document.getElementById('oauthConsentCopy');
  const oauthCancelConsentBtn = document.getElementById('oauthCancelConsentBtn');
  const oauthConfirmConsentBtn = document.getElementById('oauthConfirmConsentBtn');

  // Incoming Email Notification Toast (#emailNotificationToast)
  const emailNotificationToast = document.getElementById('emailNotificationToast');
  const emailToastTitle = document.getElementById('emailToastTitle');
  const emailToastSummary = document.getElementById('emailToastSummary');
  const emailToastActionBtn = document.getElementById('emailToastActionBtn');
  const emailToastDismissBtn = document.getElementById('emailToastDismissBtn');

  const brandName = (cfg.brand && cfg.brand.name) || 'Apple';
  const accountLabel =
    cfg.navbar.accountButton.loggedOutText || cfg.navbar.accountButton.label || 'Account';
  document.getElementById('accountBtnLabel').textContent = cfg.navbar.accountButton.label;
  accountBtn.setAttribute('aria-label', accountLabel);
  accountBtn.setAttribute('title', accountLabel);

  let isSignupMode = false;
  let currentAccountSession = null;
  let pendingVerification = null; // { name, email, rawIdentifier, otpCode, isSignup }
  let activeOauthProvider = 'Google';
  let pendingOauthAccount = null;
  let toastTimeoutId = null;

  try {
    const saved = localStorage.getItem('blueprint_user_session');
    if (saved) currentAccountSession = JSON.parse(saved);
  } catch (e) {}

  function getSavedAccountsDirectory() {
    try {
      const raw = localStorage.getItem('blueprint_saved_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function rememberAccountInDirectory(acct) {
    if (!acct || !acct.email) return;
    try {
      const list = getSavedAccountsDirectory().filter(
        (a) => a.email.toLowerCase() !== acct.email.toLowerCase()
      );
      list.unshift({
        name: acct.name,
        email: acct.email,
        provider: acct.providerKey || 'Google',
        color: acct.color || '#2563eb'
      });
      localStorage.setItem('blueprint_saved_accounts', JSON.stringify(list.slice(0, 8)));
    } catch (e) {}
  }

  function formatInitials(nameStr) {
    return (nameStr || 'AP')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function generateAccountId(emailStr) {
    let hash = 0;
    const str = String(emailStr || 'user@apple.com').toLowerCase();
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 900000;
    }
    return `APL-${String(100000 + Math.abs(hash)).slice(0, 6)}`;
  }

  function setAuthMode(signup) {
    isSignupMode = Boolean(signup);
    if (signupExtraFields) signupExtraFields.toggleAttribute('hidden', !isSignupMode);
    if (authContinueBtn) authContinueBtn.textContent = isSignupMode ? 'Create Account' : 'Continue';
    if (authSwitchPrompt) {
      authSwitchPrompt.textContent = isSignupMode
        ? 'Already have an account?'
        : "Don't have an account?";
    }
    if (toggleAuthModeBtn) {
      toggleAuthModeBtn.textContent = isSignupMode ? 'Log in' : 'Sign up';
    }
    if (accountModalTitle && accountAuthPane && !accountAuthPane.hasAttribute('hidden')) {
      accountModalTitle.textContent = isSignupMode ? 'Create your account' : 'Log in to continue';
    }
    if (accountAuthFeedback) accountAuthFeedback.setAttribute('hidden', '');
  }

  function showAccountView(viewName) {
    // viewName: 'auth' | 'verify' | 'profile' | 'email'
    const target =
      viewName === 'verify'
        ? 'verify'
        : viewName === 'email'
        ? 'email'
        : viewName === 'auth'
        ? 'auth'
        : currentAccountSession
        ? 'profile'
        : 'auth';

    if (accountAuthPane) accountAuthPane.toggleAttribute('hidden', target !== 'auth');
    if (accountVerifyPane) accountVerifyPane.toggleAttribute('hidden', target !== 'verify');
    if (accountProfilePane) accountProfilePane.toggleAttribute('hidden', target !== 'profile');
    if (accountEmailViewerPane) accountEmailViewerPane.toggleAttribute('hidden', target !== 'email');

    if (accountModalEyebrow) {
      accountModalEyebrow.textContent =
        target === 'email'
          ? 'INBOX • WELCOME EMAIL'
          : target === 'verify'
          ? '2-STEP SECURITY VERIFICATION'
          : `${brandName.toUpperCase()} ACCOUNT`;
    }

    if (accountModalTitle) {
      if (target === 'verify') {
        accountModalTitle.textContent = isSignupMode
          ? 'Verify your new account'
          : 'Enter password & security code';
      } else if (target === 'profile') {
        accountModalTitle.textContent = 'Verified Account Profile';
      } else if (target === 'email') {
        accountModalTitle.textContent = `Welcome to ${brandName}`;
      } else {
        accountModalTitle.textContent = isSignupMode ? 'Create your account' : 'Log in to continue';
      }
    }
  }

  function hydrateWelcomeEmailViewer(session) {
    if (!session) return;
    const toEl = document.getElementById('welcomeEmailToAddr');
    const timeEl = document.getElementById('welcomeEmailTimestamp');
    const greetingEl = document.getElementById('welcomeEmailGreeting');
    const inlineAddrEl = document.getElementById('welcomeEmailInlineAddr');
    const acctIdEl = document.getElementById('welcomeEmailAcctId');
    const providerEl = document.getElementById('welcomeEmailProvider');

    const firstName = (session.name || 'Member').split(/\s+/)[0];
    if (toEl) toEl.textContent = `${session.name} <${session.email}>`;
    if (timeEl) timeEl.textContent = session.welcomeEmailSentAt || new Date().toLocaleString();
    if (greetingEl) greetingEl.textContent = `Hi ${firstName}, welcome to ${brandName}.`;
    if (inlineAddrEl) inlineAddrEl.textContent = session.email;
    if (acctIdEl) acctIdEl.textContent = session.accountId || generateAccountId(session.email);
    if (providerEl) providerEl.textContent = session.provider || 'Verified OAuth 2.0';
  }

  function syncSessionUI() {
    if (currentAccountSession) {
      if (accountStatusDot) accountStatusDot.removeAttribute('hidden');
      accountBtn.setAttribute(
        'title',
        `Signed in as ${currentAccountSession.name} (${currentAccountSession.email})`
      );
      const initials = formatInitials(currentAccountSession.name);
      const avatarEl = document.getElementById('accountAvatarInitials');
      const nameEl = document.getElementById('accountProfileName');
      const emailEl = document.getElementById('accountProfileEmail');
      const roleEl = document.getElementById('accountProfileRole');
      const idEl = document.getElementById('accountProfileId');

      if (avatarEl) avatarEl.textContent = initials;
      if (nameEl) nameEl.textContent = currentAccountSession.name;
      if (emailEl) emailEl.textContent = currentAccountSession.email;
      if (roleEl) roleEl.textContent = currentAccountSession.provider || 'Verified Account';
      if (idEl) {
        idEl.textContent =
          currentAccountSession.accountId || generateAccountId(currentAccountSession.email);
      }
      hydrateWelcomeEmailViewer(currentAccountSession);
    } else {
      if (accountStatusDot) accountStatusDot.setAttribute('hidden', '');
      accountBtn.setAttribute('title', accountLabel);
    }
  }

  function showEmailToast(options) {
    // options: { title, summary, actionLabel, onAction }
    if (!emailNotificationToast) return;
    if (toastTimeoutId) clearTimeout(toastTimeoutId);

    if (emailToastTitle) emailToastTitle.textContent = options.title || 'New Email Notification';
    if (emailToastSummary) emailToastSummary.textContent = options.summary || '';
    if (emailToastActionBtn) {
      emailToastActionBtn.textContent = options.actionLabel || 'Open Email';
      emailToastActionBtn.onclick = () => {
        emailNotificationToast.setAttribute('hidden', '');
        if (typeof options.onAction === 'function') options.onAction();
      };
    }
    emailNotificationToast.removeAttribute('hidden');
    toastTimeoutId = setTimeout(() => {
      emailNotificationToast.setAttribute('hidden', '');
    }, 14000);
  }

  if (emailToastDismissBtn) {
    emailToastDismissBtn.addEventListener('click', () => {
      if (emailNotificationToast) emailNotificationToast.setAttribute('hidden', '');
    });
  }

  function completeLogin(sessionObj) {
    const nowFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const enrichedSession = {
      name: sessionObj.name || 'Apple Member',
      email: sessionObj.email || 'member@gmail.com',
      provider: sessionObj.provider || 'Verified Account',
      providerKey: sessionObj.providerKey || 'Email',
      accountId: sessionObj.accountId || generateAccountId(sessionObj.email),
      welcomeEmailSentAt: `Today at ${nowFormatted}`
    };

    currentAccountSession = enrichedSession;
    rememberAccountInDirectory(enrichedSession);

    try {
      localStorage.setItem('blueprint_user_session', JSON.stringify(enrichedSession));
    } catch (e) {}

    syncSessionUI();
    showAccountView('profile');

    // Dispatch Automatic Welcome Email Notification Toast
    showEmailToast({
      title: `Welcome Email Sent to ${enrichedSession.email}`,
      summary: `Subject: "Welcome to ${brandName}, ${enrichedSession.name}!" — Your Account ID (${enrichedSession.accountId}) is now verified and active.`,
      actionLabel: 'Read Welcome Email',
      onAction: () => {
        accountModal.removeAttribute('hidden');
        hydrateWelcomeEmailViewer(enrichedSession);
        showAccountView('email');
      }
    });
  }

  syncSessionUI();

  window.openAccountModal = function openAccountModal(mode) {
    closeMobileMenu();
    accountModal.removeAttribute('hidden');
    if (mode === 'signup') {
      setAuthMode(true);
      showAccountView('auth');
    } else if (mode === 'email' && currentAccountSession) {
      hydrateWelcomeEmailViewer(currentAccountSession);
      showAccountView('email');
    } else {
      showAccountView(currentAccountSession ? 'profile' : 'auth');
    }
  };

  accountBtn.addEventListener('click', () => window.openAccountModal());
  closeAccountModal.addEventListener('click', () => accountModal.setAttribute('hidden', ''));
  accountModal.addEventListener('click', (e) => {
    if (e.target === accountModal) accountModal.setAttribute('hidden', '');
  });

  if (toggleAuthModeBtn) {
    toggleAuthModeBtn.addEventListener('click', () => setAuthMode(!isSignupMode));
  }

  if (switchAccountBtn) {
    switchAccountBtn.addEventListener('click', () => {
      setAuthMode(false);
      showAccountView('auth');
    });
  }

  if (openWelcomeEmailFromProfileBtn) {
    openWelcomeEmailFromProfileBtn.addEventListener('click', () => {
      hydrateWelcomeEmailViewer(currentAccountSession);
      showAccountView('email');
    });
  }

  if (backToProfileFromEmailBtn) {
    backToProfileFromEmailBtn.addEventListener('click', () => {
      showAccountView('profile');
    });
  }

  if (sendRealMailtoBtn) {
    sendRealMailtoBtn.addEventListener('click', () => {
      if (!currentAccountSession) return;
      const subj = encodeURIComponent(`Welcome to ${brandName} — Account ${currentAccountSession.accountId}`);
      const body = encodeURIComponent(
        `Hi ${currentAccountSession.name},\n\n` +
          `Welcome to ${brandName}! Your account (${currentAccountSession.email}) has been verified.\n\n` +
          `• Account ID: ${currentAccountSession.accountId}\n` +
          `• Authentication Method: ${currentAccountSession.provider}\n` +
          `• Status: Verified & Active\n\n` +
          `Thank you for exploring the ${brandName} Flagship Architecture.`
      );
      window.location.href = `mailto:${currentAccountSession.email}?subject=${subj}&body=${body}`;
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      currentAccountSession = null;
      try {
        localStorage.removeItem('blueprint_user_session');
      } catch (e) {}
      syncSessionUI();
      setAuthMode(false);
      showAccountView('auth');
    });
  }

  // ---- PATHWAY A: Email / Account ID -> 2-Step Password + 6-Digit Security Code Verification ----
  function dispatchVerificationCode(targetEmail, targetName) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    pendingVerification = {
      name: targetName,
      email: targetEmail,
      otpCode: code,
      isSignup: isSignupMode
    };

    if (verifyIdentityEmail) verifyIdentityEmail.textContent = targetEmail;
    if (verifyPasswordLabel) {
      verifyPasswordLabel.textContent = isSignupMode ? 'Create a Password' : 'Password';
    }
    if (verifyPasswordInput) {
      verifyPasswordInput.value = '';
      verifyPasswordInput.placeholder = isSignupMode
        ? 'Create a strong password (min. 6 characters)'
        : 'Enter your account password';
    }
    if (verifyOtpInput) verifyOtpInput.value = '';
    if (verifyStepFeedback) verifyStepFeedback.setAttribute('hidden', '');
    if (verifyOtpHint) {
      verifyOtpHint.innerHTML = `We sent a 6-digit verification code to <strong>${targetEmail}</strong>. Check the notification banner at the top-right or click <em>Auto-Fill Code</em>.`;
    }

    showAccountView('verify');

    // Pop up incoming verification code email toast with 1-click Auto-Fill
    showEmailToast({
      title: `Verification Code: ${code}`,
      summary: `To: ${targetEmail} — Use security code ${code} to verify your ${brandName} account.`,
      actionLabel: `Auto-Fill Code (${code})`,
      onAction: () => {
        if (verifyOtpInput) {
          verifyOtpInput.value = code;
          verifyOtpInput.focus();
        }
      }
    });
  }

  if (accountUnifiedForm) {
    accountUnifiedForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawId = (signinEmailInput && signinEmailInput.value.trim()) || '';
      if (!rawId) return;

      const resolvedEmail = rawId.includes('@')
        ? rawId
        : `${rawId.toLowerCase().replace(/\s+/g, '')}@apple.id`;

      const resolvedName =
        isSignupMode && signupNameInput && signupNameInput.value.trim()
          ? signupNameInput.value.trim()
          : rawId.includes('@')
          ? rawId
              .split('@')[0]
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : rawId;

      dispatchVerificationCode(resolvedEmail, resolvedName);
    });
  }

  if (verifyChangeEmailBtn) {
    verifyChangeEmailBtn.addEventListener('click', () => {
      showAccountView('auth');
    });
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', () => {
      if (!pendingVerification) return;
      dispatchVerificationCode(pendingVerification.email, pendingVerification.name);
    });
  }

  if (accountVerifyForm) {
    accountVerifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!pendingVerification) return;

      const enteredPwd = (verifyPasswordInput && verifyPasswordInput.value) || '';
      const enteredOtp = (verifyOtpInput && verifyOtpInput.value.trim()) || '';

      if (enteredPwd.length < 4) {
        if (verifyStepFeedback) {
          verifyStepFeedback.textContent = 'Please enter a valid password (at least 4 characters).';
          verifyStepFeedback.removeAttribute('hidden');
        }
        return;
      }

      if (enteredOtp !== pendingVerification.otpCode && enteredOtp.length !== 6) {
        if (verifyStepFeedback) {
          verifyStepFeedback.textContent = `Please enter the 6-digit security code (${pendingVerification.otpCode}).`;
          verifyStepFeedback.removeAttribute('hidden');
        }
        return;
      }

      completeLogin({
        name: pendingVerification.name,
        email: pendingVerification.email,
        providerKey: 'Email',
        provider: pendingVerification.isSignup
          ? 'Verified via Email Sign-Up (2FA)'
          : 'Signed in via Email / Account ID (2FA)'
      });
    });
  }

  // ---- PATHWAY B: Pop-Out OAuth Account Chooser Window (Google / Facebook / Apple / SSO) ----
  const OAUTH_PROVIDERS = {
    Google: {
      url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=apple-flagship&response_type=code&scope=openid%20email%20profile',
      sub: 'Sign in with Google',
      emailLabel: 'Gmail address or phone',
      emailPlaceholder: 'yourname@gmail.com',
      logoHtml: `<svg viewBox="0 0 24 24" width="28" height="28"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.46 0-.72-.06-1.41-.19-2.05H12z"/><path fill="#34A853" d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.71-4.2H2.88v2.64A9.99 9.99 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.29 13.75A6.02 6.02 0 0 1 5.97 12c0-.61.11-1.2.32-1.75V7.61H2.88A9.99 9.99 0 0 0 2 12c0 1.61.39 3.14 1.08 4.39l3.21-2.64z"/><path fill="#4285F4" d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 3.01 14.75 2 12 2A9.99 9.99 0 0 0 2.88 7.61l3.41 2.64c.81-2.41 3.06-4.2 5.71-4.2z"/></svg>`,
      defaultAccounts: [
        { name: 'Chen Jia Zhi', email: 'cjiazhi@gmail.com', color: '#2563eb' },
        { name: 'Alex Rivera (Personal)', email: 'alex.rivera@gmail.com', color: '#059669' }
      ]
    },
    Facebook: {
      url: 'https://www.facebook.com/v19.0/dialog/oauth?client_id=apple-flagship&redirect_uri=https%3A%2F%2Fapple.com%2Fauth',
      sub: 'Log in with Facebook',
      emailLabel: 'Facebook Email or Mobile Number',
      emailPlaceholder: 'yourname@facebook.com',
      logoHtml: `<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="11" fill="#1877F2"/><path fill="#ffffff" d="M15.12 15.5l.44-2.88h-2.76v-1.87c0-.79.39-1.56 1.63-1.56h1.26V6.74s-1.14-.2-2.24-.2c-2.28 0-3.77 1.38-3.77 3.89v2.19H7.14v2.88h2.54V22a10.1 10.1 0 0 0 3.12 0v-6.5h2.32z"/></svg>`,
      defaultAccounts: [
        { name: 'Chen Jia Zhi', email: 'cjiazhi@facebook.com', color: '#1877F2' },
        { name: 'Alex Rivera', email: 'alex.rivera@fb.com', color: '#4f46e5' }
      ]
    },
    Apple: {
      url: 'https://appleid.apple.com/auth/authorize?client_id=com.apple.flagship&response_type=code%20id_token',
      sub: 'Sign in with Apple Account',
      emailLabel: 'Apple ID (iCloud Email)',
      emailPlaceholder: 'yourname@icloud.com',
      logoHtml: `<svg viewBox="0 0 170 170" width="28" height="28" fill="#111827"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.13-1.9-14.34-6.08-3.69-3.03-7.61-7.82-11.77-14.37-6.16-9.64-11.17-20.71-15.02-33.21-3.86-12.51-5.78-23.95-5.78-34.34 0-12.83 3.19-23.22 9.56-31.15 6.38-7.93 14.32-12.01 23.82-12.23 4.69 0 9.89 1.38 15.6 4.12 5.7 2.75 9.39 4.19 11.07 4.31 1.23 0 5.15-1.62 11.75-4.86 6.6-3.24 12.19-4.63 16.77-4.19 12.41 1.01 21.75 5.87 28.01 14.59-11.07 6.71-16.49 16.1-16.27 28.17.22 9.39 3.69 17.22 10.4 23.48 4.81 4.47 10.51 7.27 17.11 8.39-1.38 4.35-2.99 8.83-4.82 13.45zM119.22 31.04c0 7.39-2.7 14.28-8.1 20.66-6.51 7.61-14.39 12.01-22.94 11.33-.11-.89-.17-1.84-.17-2.85 0-7.15 2.99-14.78 8.39-20.99 2.68-3.08 6.09-5.64 10.23-7.68 4.14-2.04 8.05-3.16 11.74-3.36.56 1.01.85 1.98.85 2.89z"/></svg>`,
      defaultAccounts: [
        { name: 'Chen Jia Zhi', email: 'cjiazhi@icloud.com', color: '#111827' },
        { name: 'Alex Rivera', email: 'alex.rivera@icloud.com', color: '#374151' }
      ]
    },
    SSO: {
      url: 'https://sso.apple.com/idp/profile/SAML2/Redirect/SSO?execution=e1s1',
      sub: 'Enterprise Account ID & Single Sign-On',
      emailLabel: 'Enterprise Email or Account ID',
      emailPlaceholder: 'architect@corp.apple.com',
      logoHtml: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
      defaultAccounts: [
        { name: 'Chen Jia Zhi (Enterprise SSO)', email: 'cjiazhi@enterprise.apple.com', color: '#0284c7' },
        { name: 'Lead Systems Architect', email: 'architect@HardwareLab.sso', color: '#7c3aed' }
      ]
    }
  };

  function showOauthStep(stepName) {
    // stepName: 'list' | 'custom' | 'consent'
    if (oauthAccountListStep) oauthAccountListStep.toggleAttribute('hidden', stepName !== 'list');
    if (oauthCustomAccountForm) oauthCustomAccountForm.toggleAttribute('hidden', stepName !== 'custom');
    if (oauthConsentStep) oauthConsentStep.toggleAttribute('hidden', stepName !== 'consent');

    if (oauthPopupTitle) {
      if (stepName === 'custom') {
        oauthPopupTitle.textContent = `Use another ${activeOauthProvider} account`;
      } else if (stepName === 'consent' && pendingOauthAccount) {
        oauthPopupTitle.textContent = `Continue as ${pendingOauthAccount.name.split(/\s+/)[0]}?`;
      } else {
        oauthPopupTitle.textContent = 'Choose an account';
      }
    }
  }

  function selectOauthAccountForConsent(acct) {
    pendingOauthAccount = acct;
    if (oauthConsentAccountPill) {
      oauthConsentAccountPill.innerHTML = `
        <div class="oauth-acct-avatar" style="background:${acct.color || '#2563eb'}">${formatInitials(acct.name)}</div>
        <div class="oauth-acct-meta">
          <strong>${acct.name}</strong>
          <span>${acct.email}</span>
        </div>
      `;
    }
    if (oauthConsentCopy) {
      oauthConsentCopy.innerHTML = `To continue, <strong>${activeOauthProvider}</strong> will share your verified name, email address (<strong>${acct.email}</strong>), and profile identifier with <strong>${brandName}</strong>, and send a confirmation email to your inbox.`;
    }
    showOauthStep('consent');
  }

  function openOauthChooserPopup(providerKey) {
    activeOauthProvider = OAUTH_PROVIDERS[providerKey] ? providerKey : 'Google';
    const pCfg = OAUTH_PROVIDERS[activeOauthProvider];

    if (oauthWindowUrl) oauthWindowUrl.textContent = pCfg.url;
    if (oauthBrandLogo) oauthBrandLogo.innerHTML = pCfg.logoHtml;
    if (oauthBrandSub) oauthBrandSub.textContent = pCfg.sub;
    if (oauthCustomEmailLabel) oauthCustomEmailLabel.textContent = pCfg.emailLabel;
    if (oauthCustomEmailInput) {
      oauthCustomEmailInput.value = '';
      oauthCustomEmailInput.placeholder = pCfg.emailPlaceholder;
    }
    if (oauthCustomNameInput) oauthCustomNameInput.value = '';
    if (oauthCustomPasswordInput) oauthCustomPasswordInput.value = '';

    // Combine any previously saved custom accounts with default accounts
    const saved = getSavedAccountsDirectory().filter((a) => a.provider === activeOauthProvider);
    const merged = [...saved];
    pCfg.defaultAccounts.forEach((defAcct) => {
      if (!merged.some((m) => m.email.toLowerCase() === defAcct.email.toLowerCase())) {
        merged.push(defAcct);
      }
    });

    if (oauthAccountList) {
      oauthAccountList.innerHTML = merged
        .map(
          (acct, idx) => `
          <button type="button" class="oauth-account-item" data-acct-idx="${idx}">
            <div class="oauth-acct-avatar" style="background:${acct.color || '#2563eb'}">${formatInitials(acct.name)}</div>
            <div class="oauth-acct-meta">
              <strong>${acct.name}</strong>
              <span>${acct.email}</span>
            </div>
            <span class="oauth-acct-arrow">→</span>
          </button>
        `
        )
        .join('');

      oauthAccountList.querySelectorAll('.oauth-account-item').forEach((itemBtn) => {
        itemBtn.addEventListener('click', () => {
          const idx = Number(itemBtn.getAttribute('data-acct-idx') || 0);
          selectOauthAccountForConsent(merged[idx]);
        });
      });
    }

    showOauthStep('list');
    if (oauthPopupBackdrop) oauthPopupBackdrop.removeAttribute('hidden');
  }

  function closeOauthChooserPopup() {
    if (oauthPopupBackdrop) oauthPopupBackdrop.setAttribute('hidden', '');
    pendingOauthAccount = null;
  }

  document.querySelectorAll('.auth-oauth-btn[data-oauth-provider]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-oauth-provider') || 'Google';
      openOauthChooserPopup(provider);
    });
  });

  if (closeOauthPopupBtn) closeOauthPopupBtn.addEventListener('click', closeOauthChooserPopup);
  if (closeOauthPopupDot) closeOauthPopupDot.addEventListener('click', closeOauthChooserPopup);
  if (oauthPopupBackdrop) {
    oauthPopupBackdrop.addEventListener('click', (e) => {
      if (e.target === oauthPopupBackdrop) closeOauthChooserPopup();
    });
  }

  if (oauthUseAnotherBtn) {
    oauthUseAnotherBtn.addEventListener('click', () => {
      showOauthStep('custom');
      if (oauthCustomNameInput) oauthCustomNameInput.focus();
    });
  }

  if (oauthBackToListBtn) {
    oauthBackToListBtn.addEventListener('click', () => showOauthStep('list'));
  }

  if (oauthCustomAccountForm) {
    oauthCustomAccountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const customName = (oauthCustomNameInput && oauthCustomNameInput.value.trim()) || 'Apple Member';
      const customEmail = (oauthCustomEmailInput && oauthCustomEmailInput.value.trim()) || 'member@gmail.com';
      selectOauthAccountForConsent({
        name: customName,
        email: customEmail,
        color: '#2563eb'
      });
    });
  }

  if (oauthCancelConsentBtn) {
    oauthCancelConsentBtn.addEventListener('click', () => showOauthStep('list'));
  }

  if (oauthConfirmConsentBtn) {
    oauthConfirmConsentBtn.addEventListener('click', () => {
      if (!pendingOauthAccount) return;
      const chosen = pendingOauthAccount;
      const prov = activeOauthProvider;
      closeOauthChooserPopup();
      completeLogin({
        name: chosen.name,
        email: chosen.email,
        providerKey: prov,
        provider: `Verified via ${prov} OAuth 2.0`,
        color: chosen.color
      });
    });
  }

  // ---- Interactive Tech Specs Comparison Modal (#techSpecsModal) ----
  const techSpecsModal = document.getElementById('techSpecsModal');
  const closeTechSpecsModal = document.getElementById('closeTechSpecsModal');
  const specsCategoryTabs = document.getElementById('specsCategoryTabs');
  const specsComparisonBody = document.getElementById('specsComparisonBody');
  const specsCfg = cfg.techSpecsModal || { categories: [] };

  if (document.getElementById('specsModalEyebrow') && specsCfg.eyebrow) {
    document.getElementById('specsModalEyebrow').textContent = specsCfg.eyebrow;
  }
  if (document.getElementById('specsModalTitle') && specsCfg.title) {
    document.getElementById('specsModalTitle').textContent = specsCfg.title;
  }

  function renderTechSpecsCategory(catId) {
    if (!specsComparisonBody || !Array.isArray(specsCfg.categories) || !specsCfg.categories.length) return;
    const cat =
      specsCfg.categories.find((c) => c.id === catId) || specsCfg.categories[0];

    if (specsCategoryTabs) {
      specsCategoryTabs.querySelectorAll('.specs-cat-btn').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-spec-cat') === cat.id);
      });
    }

    const modelsHtml = (cat.models || [])
      .map(
        (m) => `
        <div class="specs-model-card">
          <span class="specs-model-badge">${m.badge || ''}</span>
          <h4>${m.name || ''}</h4>
          <p>${m.summary || ''}</p>
        </div>
      `
      )
      .join('');

    const rowsHtml = (cat.specs || [])
      .map(
        (r) => `
        <div class="specs-row">
          <div class="specs-row-label">${r.label}</div>
          <div class="specs-row-val">${r.valA}</div>
          <div class="specs-row-val">${r.valB}</div>
        </div>
      `
      )
      .join('');

    specsComparisonBody.innerHTML = `
      <div class="specs-models-grid">${modelsHtml}</div>
      <div class="specs-table">${rowsHtml}</div>
    `;
  }

  if (specsCategoryTabs && Array.isArray(specsCfg.categories)) {
    specsCfg.categories.forEach((cat, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `specs-cat-btn ${idx === 0 ? 'active' : ''}`;
      btn.setAttribute('data-spec-cat', cat.id);
      btn.textContent = cat.label;
      btn.addEventListener('click', () => renderTechSpecsCategory(cat.id));
      specsCategoryTabs.appendChild(btn);
    });
    renderTechSpecsCategory(specsCfg.categories[0]?.id);
  }

  window.openTechSpecsModal = function openTechSpecsModal(catId) {
    closeMobileMenu();
    if (!techSpecsModal) return;
    if (catId) renderTechSpecsCategory(catId);
    techSpecsModal.removeAttribute('hidden');
  };

  if (closeTechSpecsModal && techSpecsModal) {
    closeTechSpecsModal.addEventListener('click', () => techSpecsModal.setAttribute('hidden', ''));
    techSpecsModal.addEventListener('click', (e) => {
      if (e.target === techSpecsModal) techSpecsModal.setAttribute('hidden', '');
    });
  }
  if (mobileTechSpecsBtn) {
    mobileTechSpecsBtn.addEventListener('click', () => window.openTechSpecsModal('iphone'));
  }

  // Global interceptor for #tech-specs[:cat] and #account[:mode] links anywhere on the page
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#tech-specs')) {
      e.preventDefault();
      const parts = href.split(':');
      window.openTechSpecsModal(parts[1] || 'iphone');
    } else if (href.startsWith('#account')) {
      e.preventDefault();
      const parts = href.split(':');
      window.openAccountModal(parts[1] || 'signin');
    }
  });

  // Close open modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (accountModal && !accountModal.hasAttribute('hidden')) accountModal.setAttribute('hidden', '');
      if (techSpecsModal && !techSpecsModal.hasAttribute('hidden')) techSpecsModal.setAttribute('hidden', '');
      closeMobileMenu();
    }
  });

  // ---- Brand logo: reuse the SAME resolved logo as the hero (js/logo-pipeline.js) ----
  function applyNavbarLogo(src) {
    if (!src) return;
    const brand = document.getElementById('navBrand');
    const existing = brand.querySelector('.apple-nav-icon');
    if (!existing) return;
    const img = document.createElement('img');
    img.className = 'apple-nav-icon';
    img.src = src;
    img.alt = `${cfg.navbar.brandText || 'Brand'} logo`;
    img.decoding = 'async';
    existing.replaceWith(img);
  }

  if (cfg.navbar.customLogoUrl) {
    applyNavbarLogo(cfg.navbar.customLogoUrl);
  } else {
    const piped = window.BlueprintLogo;
    if (piped && piped.ready && piped.src) {
      applyNavbarLogo(piped.src);
    } else if (window.BLUEPRINT_LOGO_SRC) {
      applyNavbarLogo(window.BLUEPRINT_LOGO_SRC);
    }
    window.addEventListener('blueprint-logo-ready', (e) => applyNavbarLogo(e.detail && e.detail.src));
  }

  // ==========================================================================
  // 2. POST-HERO BENTO GRID HYDRATION
  // ==========================================================================
  document.getElementById('bentoEyebrow').textContent = cfg.bentoSection.eyebrow;
  document.getElementById('bentoHeading').textContent = cfg.bentoSection.heading;
  document.getElementById('bentoSubheading').textContent = cfg.bentoSection.subheading;

  const bentoGrid = document.getElementById('bentoGridContainer');
  cfg.bentoSection.cards.forEach((card) => {
    const article = document.createElement('article');
    article.className = `bento-item-card ${card.span}`;

    const slot = createSmartImageSlot(card.image, card.title, 'asset-slot-frame', card);
    const meta = document.createElement('div');
    meta.innerHTML = `
      <div class="bento-meta-badge">${card.badge}</div>
      <h3 class="bento-card-title">${card.title}</h3>
      <p class="bento-card-desc">${card.description}</p>
    `;

    article.appendChild(slot);
    article.appendChild(meta);
    bentoGrid.appendChild(article);
  });

  // ==========================================================================
  // 3. THREE SCROLL-PINNED BLUR-TO-CLEAR SECTIONS + APPLEPIC.JPG FOLLOW-UPS
  // ==========================================================================
  const immersionRoot = document.getElementById('immersion-container');
  const activeImmersionTracks = [];

  cfg.immersionSections.forEach((sec, idx) => {
    // Part 3A: Pinned Fullscreen Blur-to-Clear Track
    const track = document.createElement('section');
    track.className = 'immersion-scroll-track';
    track.id = sec.id;

    // Pinned runway length is config-driven so the whole reveal stays short & brisk
    // (CSS keeps a fallback height for the no-config case).
    if (typeof tune.trackHeightVh === 'number') {
      track.style.height = `${tune.trackHeightVh}vh`;
    }

    const stickyViewport = document.createElement('div');
    stickyViewport.className = 'immersion-sticky-viewport';

    const bgLayer = document.createElement('div');
    bgLayer.className = `immersion-bg-layer placeholder-bg-${idx % 3}`;

    // Blurred full-bleed copy of the same image, sitting behind the uncropped (contain) image
    // so the letterbox area is a soft self-filled blur instead of a flat bar.
    const blurLayer = document.createElement('div');
    blurLayer.className = 'immersion-bg-blur';

    // Extra darkening for a heavier "start" state; its opacity is driven in
    // updateImmersionScroll() and fades out as the backdrop reaches full clarity.
    const vignette = document.createElement('div');
    vignette.className = 'immersion-vignette';

    // Attempt to load background image from ./assets/immersion/
    if (sec.backgroundImage) {
      const probe = new Image();
      probe.src = sec.backgroundImage;
      probe.onload = () => {
        const url = `url('${sec.backgroundImage}')`;
        // Drop the placeholder class so its `background` shorthand can't reset size/repeat
        // (that shorthand is what caused the image to tile at its natural size).
        bgLayer.classList.remove('placeholder-bg-0', 'placeholder-bg-1', 'placeholder-bg-2');
        bgLayer.style.backgroundImage = url;
        bgLayer.style.backgroundSize = 'contain';
        bgLayer.style.backgroundRepeat = 'no-repeat';
        bgLayer.style.backgroundPosition = 'center';

        blurLayer.style.backgroundImage = url;
        blurLayer.style.backgroundSize = 'cover';
        blurLayer.style.backgroundRepeat = 'no-repeat';
        blurLayer.style.backgroundPosition = 'center';
      };
    }

    const slotBadge = document.createElement('div');
    slotBadge.className = 'immersion-bg-slot-badge';
    slotBadge.textContent = `BG PIPELINE: ${sec.backgroundImage}`;

    const cornerIndicator = document.createElement('div');
    cornerIndicator.className = 'immersion-corner-btn';
    cornerIndicator.textContent = '❚❚';

    const headlineWrap = document.createElement('div');
    headlineWrap.className = 'immersion-headline-wrap';
    headlineWrap.innerHTML = `
      <div class="immersion-eyebrow">${sec.eyebrow}</div>
      <h2 class="immersion-headline">${sec.headline}</h2>
    `;

    stickyViewport.appendChild(blurLayer);
    stickyViewport.appendChild(bgLayer);
    stickyViewport.appendChild(vignette);
    stickyViewport.appendChild(slotBadge);
    stickyViewport.appendChild(cornerIndicator);
    stickyViewport.appendChild(headlineWrap);
    track.appendChild(stickyViewport);
    immersionRoot.appendChild(track);

    activeImmersionTracks.push({
      track,
      bgLayer,
      vignette,
      headlineWrap,
      slotBadge,
      srcPath: sec.backgroundImage
    });

    // Part 3B: Follow-Up Editorial Brief + Scrollable Bento Carousel (Matches ApplePic.jpg)
    const editorialSec = document.createElement('section');
    editorialSec.className = 'apple-editorial-followup';

    const topBrief = document.createElement('div');
    topBrief.className = 'editorial-top-brief';
    topBrief.innerHTML = `
      <p class="editorial-paragraph">${sec.editorial.brief}</p>
      <a href="${sec.editorial.linkHref}" class="editorial-learn-link">
        ${sec.editorial.linkText} <span>›</span>
      </a>
    `;

    const carouselTrack = document.createElement('div');
    carouselTrack.className = 'editorial-carousel-track';

    sec.editorial.carouselCards.forEach((cCard) => {
      const item = document.createElement('div');
      item.className = `editorial-carousel-item ${cCard.widthClass}`;

      const imgBox = createSmartImageSlot(cCard.image, cCard.leadBold, 'editorial-image-box', cCard);
      const caption = document.createElement('p');
      caption.className = 'editorial-caption-text';
      caption.innerHTML = `<strong>${cCard.leadBold}</strong> ${cCard.caption}`;

      item.appendChild(imgBox);
      item.appendChild(caption);
      carouselTrack.appendChild(item);
    });

    // Enable smooth mouse grab-to-scroll on laptop/desktop alongside touch & arrow buttons
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    carouselTrack.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDown = true;
      startX = e.pageX - carouselTrack.offsetLeft;
      scrollStart = carouselTrack.scrollLeft;
      carouselTrack.style.scrollSnapType = 'none';
      carouselTrack.style.cursor = 'grabbing';
    });
    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      carouselTrack.style.scrollSnapType = 'x mandatory';
      carouselTrack.style.cursor = '';
    };
    carouselTrack.addEventListener('mouseleave', endDrag);
    carouselTrack.addEventListener('mouseup', endDrag);
    carouselTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carouselTrack.offsetLeft;
      carouselTrack.scrollLeft = scrollStart - (x - startX) * 1.25;
    });

    const controls = document.createElement('div');
    controls.className = 'editorial-carousel-controls';
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-arrow-btn';
    prevBtn.textContent = '‹';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-arrow-btn';
    nextBtn.textContent = '›';

    prevBtn.addEventListener('click', () => {
      const step = Math.min(540, Math.round(window.innerWidth * 0.78));
      carouselTrack.scrollBy({ left: -step, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      const step = Math.min(540, Math.round(window.innerWidth * 0.78));
      carouselTrack.scrollBy({ left: step, behavior: 'smooth' });
    });

    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);

    editorialSec.appendChild(topBrief);
    editorialSec.appendChild(carouselTrack);
    editorialSec.appendChild(controls);
    immersionRoot.appendChild(editorialSec);
  });

  // ==========================================================================
  // EXACT SCROLL PHYSICS FOR BLUR-TO-CLEAR + INDEPENDENT HEADLINE UPWARD EXIT
  // ==========================================================================
  function updateImmersionScroll() {
    const vh = window.innerHeight;

    activeImmersionTracks.forEach((item) => {
      const rect = item.track.getBoundingClientRect();
      const scrollableDistance = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollableDistance);
      const progress = scrollableDistance > 0 ? scrolled / scrollableDistance : 0;

      /**
       * PHASE BREAKDOWN (Apple's "dim -> clear" reveal, kept SHORT):
       * - Progress 0 -> headlineHoldProgress:
       *   The headline HOLDS centered while the backdrop eases from a soft blur + heavy dim
       *   + dark vignette towards clarity.
       * - headlineHoldProgress -> focusEndProgress:
       *   The headline glides up and off the top edge while the backdrop finishes sharpening.
       * - After focusEndProgress:
       *   Only a brief crystal-clear hold remains before the section unpins and the page
       *   moves on — no long dead stretch after the headline is gone.
       *
       * All values are tunable in js/config.js -> immersionTuning.
       */
      const focusProgress = Math.min(progress / tune.focusEndProgress, 1);
      const blurPx = (1 - focusProgress) * (tune.initialBlurPx || 0);
      const brightness = tune.initialBrightness + focusProgress * (1 - tune.initialBrightness);

      // The headline holds still for a short slice of the runway, THEN glides up and off
      // the top of the viewport — so it "stays for a while, then moves on" instead of
      // drifting for the entire (previously very long) pin.
      const hold = typeof tune.headlineHoldProgress === 'number' ? tune.headlineHoldProgress : 0;
      const exitSpan = 1 - hold;
      const exitProgress = exitSpan > 0 ? Math.max(0, (progress - hold) / exitSpan) : 0;
      const headlineTranslateVh = -exitProgress * tune.headlineExitVh;

      item.bgLayer.style.filter = `blur(${blurPx.toFixed(1)}px) brightness(${brightness.toFixed(2)})`;
      item.headlineWrap.style.transform = `translate3d(0, ${headlineTranslateVh.toFixed(2)}vh, 0)`;
      if (item.vignette) {
        item.vignette.style.opacity = ((1 - focusProgress) * (tune.vignetteOpacity || 0)).toFixed(3);
      }
      item.slotBadge.textContent = `${item.srcPath} • Focus: ${Math.round(focusProgress * 100)}%`;
    });
  }

  window.addEventListener('scroll', updateImmersionScroll, { passive: true });
  updateImmersionScroll();

  // ==========================================================================
  // 4. VERTICALLY STACKED ACCORDION HYDRATION
  // ==========================================================================
  document.getElementById('faqEyebrow').textContent = cfg.accordionSection.eyebrow;
  document.getElementById('faqHeading').textContent = cfg.accordionSection.heading;
  document.getElementById('faqSubheading').textContent = cfg.accordionSection.subheading;

  const accordionStack = document.getElementById('accordionStack');
  cfg.accordionSection.items.forEach((faq, idx) => {
    const panel = document.createElement('div');
    panel.className = 'accordion-panel';

    const trigger = document.createElement('button');
    trigger.className = 'accordion-trigger';
    trigger.type = 'button';
    trigger.innerHTML = `
      <span>${faq.question}</span>
      <span class="accordion-icon">+</span>
    `;

    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.innerHTML = `<div class="accordion-content-inner">${faq.answer}</div>`;

    trigger.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      document.querySelectorAll('.accordion-panel').forEach((p) => {
        p.classList.remove('open');
        p.querySelector('.accordion-content').style.maxHeight = '0px';
      });
      if (!isOpen) {
        panel.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });

    panel.appendChild(trigger);
    panel.appendChild(content);
    accordionStack.appendChild(panel);
  });

  // All panels start closed; a panel only opens when the viewer clicks it.

  // ==========================================================================
  // 5. FOOTER HYDRATION
  // ==========================================================================
  document.getElementById('footerDisclaimer').textContent = cfg.footer.disclaimer;
  document.getElementById('footerCopyright').textContent = cfg.footer.copyright;

  const sitemapGrid = document.getElementById('footerSitemap');
  cfg.footer.columns.forEach((col) => {
    const div = document.createElement('div');
    div.className = 'footer-col';
    const ul = document.createElement('ul');
    col.links.forEach((lnk) => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${lnk.href}">${lnk.label}</a>`;
      ul.appendChild(li);
    });
    div.innerHTML = `<h4>${col.title}</h4>`;
    div.appendChild(ul);
    sitemapGrid.appendChild(div);
  });

  const legalWrap = document.getElementById('footerLegalLinks');
  cfg.footer.legalLinks.forEach((l) => {
    const a = document.createElement('a');
    a.href = l.href;
    a.textContent = l.label;
    legalWrap.appendChild(a);
  });

  const socialWrap = document.getElementById('footerSocialLinks');
  cfg.footer.socials.forEach((s) => {
    const a = document.createElement('a');
    a.href = s.href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.label;
    socialWrap.appendChild(a);
  });
})();