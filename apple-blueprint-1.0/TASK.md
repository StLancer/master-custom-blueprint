# TASK.md — Apple Blueprint 1.0

Project notes, engineering log, current status, and AI reference guide.  
**Last updated: 2026-10-20**

---

## 1. Project Overview & Quick Reference (For AI & Developers)

Apple Blueprint 1.0 is a zero-dependency, vanilla **HTML5 / CSS3 / ES6+ JavaScript** landing page and product showcase template. It requires no build step, no framework compilers (no React, Next.js, or Vite), and deploys immediately to static hosting (GitHub Pages, Vercel, Netlify).

### Architectural Core:
1. **Single Source of Truth (`js/config.js`):** All copy, navigation links, company branding, color theme presets, immersion carousels, 3D product colorways, and tech specs live in this file.
2. **Automated Logo Pipeline (`js/logo-pipeline.js`):** Auto-probes `assets/logo/center-logo.<ext>`, detects alpha transparency vs. opaque backgrounds, generates 3D glass caustics + specular rims, and synchronizes the Navbar logo, 3D Hero centerpiece, and browser Favicon simultaneously.
3. **Cosmic Theme & Particle Engine (`js/hero-aurora.js`):** Multi-ribbon additive aurora shader paired with a proximity-reactive 170-node Hooke's Law break-and-relink constellation particle graph.
4. **Spatial Immersion & Bento Carousels (`js/scroll-immersion.js`):** Pinned fullscreen blur-to-clear viewport transitions followed by Apple-style `#f5f5f7` dimmer-white Bento carousels supporting image cutouts, edge-docked close-ups, `.mp4` video loops with liquid controls, and `.mp3` spatial audio equalizers.
5. **3D Product Roll & Colorway Showcase (`js/hardware-disassembly.js`):** Multi-finish product showcase (iPhone 18 Pro Burgundy & Glacier) with liquid iOS color buttons, desktop scroll-looping (Layer 1 → Last → Layer 1), interactive drag/swipe mechanics, dynamic angle callout pins, and fluid mobile touch controls.

### Directory Structure:
```
apple-blueprint-1.0/
├── index.html                 # Semantic HTML5 shell with accessibility attributes
├── README.md                  # Newcomer-friendly introduction & deployment guide
├── TASK.md                    # <-- Comprehensive status tracker & AI engineering log
├── APPLE_WEB_ARCHITECTURE.md  # Deep dive: How Apple delivers web pages (Vanilla/Canvas/Edge)
├── css/
│   └── styles.css             # Liquid Glass optics, responsive layout, canvas bounds
├── js/
│   ├── config.js              # MASTER CONFIG — all copy, colors, links, images, product specs
│   ├── logo-pipeline.js       # Auto-detects custom logo, alpha sampling, tab favicon, theme sync
│   ├── hero-aurora.js         # Multiphase cosmic aurora ribbons + break/relink constellation
│   ├── scroll-immersion.js    # Sticky blur-to-clear stages, Bento carousels, modals, FAQ
│   └── hardware-disassembly.js# 3D product roll engine, colorway switcher, drag/swipe physics
└── assets/
    ├── logo/                  # Centerpiece & navbar logo (read TOKnow.md)
    ├── disassembly/layers/    # Multi-angle product images by color (read Note.md)
    ├── bento/                 # 4 corporate foundation images (bento-1.jpg .. bento-4.jpg)
    ├── immersion/             # Fullscreen backdrops (section-1-bg.jpg .. section-3-bg.jpg)
    └── editorial/             # Carousel cards (sec1-card1.jpg .. sec3-card2.jpg)
```

### Local Preview:
```bash
python -m http.server 8000
# Browse to: http://127.0.0.1:8000
```
*(Note: A local web server is recommended during development so the browser canvas can sample image alpha channels without `file://` security restrictions).*

---

## 2. Engineering Progress & Changelog

### 2.1 Engine files restored & wired
Recreated the modular runtime structure (`config.js`, `hero-aurora.js`, `scroll-immersion.js`, `hardware-disassembly.js`, `logo-pipeline.js`) and linked them into `index.html`.

### 2.2 Image cropping → "contain + self-fill"
Replaced aggressive `object-fit: cover` with responsive `contain` paired with a blurred backdrop fill (`.media-fill`, `createSmartImageSlot()`) to preserve full product outlines without clipping.

### 2.3 Immersion tiling fixed
Resolved image repeating issues on fullscreen stages by properly stripping placeholder classes and managing inline background properties.

### 2.4 Immersion reveal & dim tuning
Balanced the initial backdrop blur (`10px`), initial brightness (`0.70`), and dark vignette (`0.55`) across a streamlined `175vh` scroll runway.

### 2.5 Constellation particles & break/relink physics
Built a 170-node floating constellation graph. Nearby nodes link with fine lines (`maxOpacity: 0.55`); cursor proximity triggers radial repulsion and breaks links, which smoothly reconnect via Hooke's Law spring damping upon cursor exit.

### 2.6 – 2.11 Logo pipeline unified (`js/logo-pipeline.js`)
Probes `assets/logo/center-logo.<ext>` for `svg, png, webp, avif, jpg, jpeg, gif`. Samples alpha channels: transparent images receive a 3D glass treatment with specular rims; opaque images are mounted on a Liquid Glass plate. Re-points the browser tab favicon automatically.

### 2.12 – 2.14 Hero recomposition, proximity nudge & layout race fix
Hardened `hero-aurora.js` against layout races. Replaced continuous cursor-following with a subtle **proximity nudge** (stationary by default; shifts slightly toward the cursor when nearby).

### 2.15 Unified Cosmic Theme Engine
Built preset support in `js/config.js` (`"crimson"`, `"sapphire"`, `"purple"`, `"emerald"`, `"gold"`, `"custom"`). Synchronizes aurora stop arrays, glass logo caustics, and all `:root` CSS custom properties. Runtime switching exposed via `window.setBlueprintTheme('crimson')`.

### 2.16 Enhanced iOS Liquid Glass Navbar
Refined `.liquid-navbar` with an elliptical dense optical core (`rgba(var(--theme-deep-rgb), 0.68)`), `blur(48px) saturate(230%)`, a multi-stop perimeter Fresnel cushion, and a `1.25px` masked diagonal shimmer rim.

### 2.19 Apple Dimmer-White Editorial Boxes (`#f5f5f7`) & Smart Framing
Configured high-contrast `#ffffff` editorial sections containing `#f5f5f7` dimmer-white boxes with 5 smart image modes:
1. Transparent cutouts (`.media-cutout`).
2. White studio cutouts with `mix-blend-mode: multiply` (`.media-white-cutout`).
3. Edge-docked cutouts (`.dock-left`, `.dock-right`, `.dock-top`, `.dock-bottom`).
4. Solid-color studio photos with matched border RGB (`.media-edge-matched`).
5. Scenic photos/videos with edge-to-edge cover (`.media-cover`), supporting `.mp4` video loops with liquid controls and `.mp3` spatial audio equalizers.

### 2.20 Reload troubleshooting & scroll-jump fix
Fixed missing hero logos upon reloading from scrolled positions by eliminating viewport-coordinate dependencies in stage offset math. Disabled automatic smooth-scrolling during initial boot (`history.scrollRestoration = 'manual'`).

### 2.22 Authentic Multi-Pathway Authentication Modal
Overhauled `#accountModal` with a realistic pop-out OAuth account chooser (Google, Apple, Facebook, SSO), 2-step email verification with a simulated 6-digit OTP toast, and a built-in Welcome Email viewer.

### 2.23 Interactive Tech Specs Comparison Modal
Built `#techSpecsModal` with category tabs (iPhone 18 Pro, Autonomous Robotics, NVIDIA AI Compute) and side-by-side flagship hardware comparison tables.

### 2.24 Hero copy simplification & mobile first-sight balance
Streamlined Hero copy to Company Name (`Apple`) + Slogan (`Think Different.`) + 3 capsule CTA buttons (`Robotics`, `Phone`, `Compute`). Adjusted mobile height (`82svh`) so the Bento Grid peeks into initial view.

### 2.25 Mobile navbar dropdown & Bento copy
Added mobile hamburger button and collapsible liquid glass menu (`#mobileNavDropdown`). Updated Bento cards to Mission, Vision, Philosophy, and Strategic Goals.

### 2.26 ⭐ 3D Product Roll Showcase Overhaul — iPhone 18 Pro Colorways (`js/hardware-disassembly.js`, `js/config.js`, `css/styles.css`)
- **Multi-Colorway Architecture:** Supports distinct product finishes with independent angle counts (Burgundy with 4 angles, Glacier with 6 angles).
- **Liquid iOS Color Picker:** Two interactive pills under the stage (`Burgundy` and `Glacier`). The active button glows with its authentic product swatch, re-tints the radial backdrop glow, floor shadow, and overall spec card.
- **Continuous 360° Desktop Scroll Loop:** Paced desktop scrolling to scrub from `Layer 1 → Last Layer → Layer 1`, completing a full 360° revolution before unlocking downward page travel.
- **Desktop Cursor Dragging:** Added grab-and-drag cursor interaction (`dragPxPerLayer: 140`) with momentum easing so users can manually inspect any angle.
- **Dynamic Feature Pins:** Glass callout box (`.hw-pin-callout`) with a glowing leader line pointing to specific hardware components on active angles. Suppressed on transition angles (e.g., Glacier 45° shots have `pin: null`).
- **Liquid Glass Spec Card:** Displays verified iPhone 18 Pro specifications (6.9″/6.3″ Super Retina XDR, A20 Pro chip, 48MP Pro Fusion camera system, 18MP Center Stage front camera, 45-hour battery).

### 2.27 ⭐ Mobile & Tablet Touch Architecture & Zero Horizontal Overflow
- **Touch-Friendly Stacking:** On touch devices and screens `≤ 900px`, the scroll runway is removed (`trackHeightVh: 'auto'`). The phone rolls via natural horizontal swiping:
  - `Swipe Left` = advance angle (`1 → 2 → 3…`)
  - `Swipe Right` = reverse angle (`1 → Last…`)
- **Zero Horizontal Overflow:** Applied `overflow-x: clip` and `max-width: 100%` on `html` and `body`. Eliminates sideways page jitter, ensuring the fixed Liquid Glass Navbar (`#topNavbar`) and 3D stage remain centered across all mobile viewports (iPhone 16, Pixel, iPad).
- **One-Line Scaled Headline:** Headline font scales dynamically via `min(2.55rem, calc((96vw - 32px) / 24))`, preventing word-wrapping or text truncation on narrow screens.

### 2.28 ⭐ Accordion FAQ Polish & Q&A Modernization
- All accordion panels now default to closed upon load (`idx === 0 ? 'open' : ''` removed), expanding only when clicked.
- Updated FAQ item 1 to explain the colorway-based 3D Product Roll interaction.

### 2.29 ⭐ Clean Up & Documentation Overhaul
- Removed legacy unused hardware disassembly code (`_legacyHardwareDisassemblyUnused`) from `js/config.js`.
- Rewrote `assets/disassembly/layers/Note.md` with complete Canva 1200×1600 px standardization and transparency guidelines.
- Updated `assets/disassembly/README.md` to document the colorway structure and runtime console helpers (`setProductColor`, `setHardwareAnimation`).
- Rewrote root `README.md` as an open-source introduction with quick-start steps, customization workflows, and deployment instructions.

### 2.30 ⭐ 3D Animation Mode Engine — Roll, Flip, & Explode (`js/hardware-disassembly.js`)
- **Full Multi-Mode Architecture Restored & Enhanced:**
  - `"roll-360"` (Default): Continuous orbital 3D perspective turn across angles. Loops seamlessly (`Layer 1 → Last Layer → Layer 1`).
  - `"flip-360"`: Precision horizontal turntable spin around the center Y-axis with specular highlights and cosine scaling.
  - `"explode"`: Vertical exploded teardown disassembly with dynamic drop shadows, layer separation along Y-axis via `spreadFactor`, dashed laser alignment bus lines, and active pin tracking.
- **Configurable Mode:** Managed by `animationStyle: "roll-360"` in `js/config.js` under `hardwareDisassembly`.
- **Runtime Testing Console Helpers:** Exposed `window.setHardwareAnimation(style)` and `window.setProductColor(id)` for instant live preview in browser DevTools.

---

## 3. Current Status & Verification Matrix

| Component | Status | Verification Notes |
| :--- | :--- | :--- |
| **Hero Aurora & 3D Logo** | ✅ Verified | 5 light ribbons, proximity nudge, alpha rim, tab favicon synced. |
| **Bento Grid (Mission/Vision)** | ✅ Verified | 4 cards, cover styling, no letterboxing. |
| **Spatial Immersion (1-3)** | ✅ Verified | 3 pinned blur-to-clear stages with synchronized typography exits. |
| **Editorial Carousels** | ✅ Verified | All 8 cards populated with high-res photography, smart-fill backdrops, and modal triggers. |
| **3D Product Showcase** | ✅ Verified | 3 animation modes (`roll-360`, `flip-360`, `explode`), Burgundy (4) & Glacier (6), liquid color glow, drag/swipe loop. |
| **Tech Specs Modal** | ✅ Verified | 3 tabs (Robotics, iPhone 18 Pro, Compute), deep-linked from all CTAs. |
| **Authentication Flow** | ✅ Verified | OAuth chooser popup, 2FA OTP verification, Welcome Email viewer. |
| **Accordion FAQ** | ✅ Verified | All panels default closed, single-panel toggle behavior. |
| **Responsive Polish** | ✅ Verified | `overflow-x: clip` active, no horizontal jitter on mobile devices. |

---

## 4. Future Enhancements Roadmap

This roadmap organizes potential enhancements from **Necessary / Pre-Production Polish** to **Advanced Frontier Features** for future iterations:

### Tier 1: Necessary / Pre-Production Polish
1. **Automated Image Optimization & Modern Format Conversion:**
   - Convert all large background assets (`assets/immersion/`) to modern compressed `.webp` or `.avif` formats to reduce initial bundle transfer size below 5 MB.
   - Implement `srcset` on editorial carousel cards for responsive image resolution delivery across mobile and Retina displays.
2. **Comprehensive Accessibility (a11y) Keyboard Navigation:**
   - Add explicit keyboard focus rings (`:focus-visible`) and arrow-key handlers (`ArrowLeft` / `ArrowRight`) to the 3D Product Canvas so keyboard-only users can roll the product without a mouse.
   - Add `aria-live="polite"` telemetry announcements when switching colorways or advancing product roll perspectives.
3. **SEO & Social OpenGraph Metadata:**
   - Expand `index.html` `<head>` with OpenGraph (`og:image`, `og:title`, `og:description`), Twitter Card metadata, and `schema.org` Product structured JSON-LD.
4. **Vercel / GitHub Pages Cache Headers:**
   - Add a `vercel.json` configuration file with optimized `Cache-Control: public, max-age=31536000, immutable` headers for static assets in `assets/`.

### Tier 2: Intermediate / Feature Expansion
1. **Apple-Style Hybrid HD Video & Image Showcase (Immersion & Editorial):**
   - **Spatial Immersion Video Backdrops:** Upgrade or augment static images in `assets/immersion/` (`section-1-bg.jpg` .. `section-3-bg.jpg`) with ambient, looping `<video autoplay muted loop playsinline>` backdrops (MP4/WebM) featuring dynamic product lighting, cinematic micro-zooms, or cosmic fluid effects with automatic poster image fallbacks.
   - **Editorial Carousel Video Cards:** Support hybrid media cards combining high-res photography with auto-playing HD video loops (e.g. demonstrating Action Button haptics, Camera Control sliding, or titanium chassis reflections) with liquid glass play/pause and mute/unmute audio controls.
   - **Scroll-Tied Video Scrubbing:** Connect scroll progress to `video.currentTime` on pinned stages (Apple's signature interactive technique) for frame-accurate product reveals.
   - **Power & Performance Safeguards:** Implement `IntersectionObserver` to automatically pause videos when scrolled out of view, reducing CPU/GPU memory footprint and preserving battery on mobile devices.
2. **Real Backend Authentication API Integration:**
   - Connect the front-end OAuth pop-out window and OTP verification form in `#accountModal` to live authentication providers (Supabase Auth, Firebase, NextAuth, or Auth0).
3. **Client-Side State Persistence (`localStorage`):**
   - Save the user's selected product colorway (`burgundy` vs. `glacier`), volume/mute preferences for media cards, and sign-in status across page reloads.
4. **Multi-Product Showcase Switcher:**
   - Extend `hardwareDisassembly` in `js/config.js` to support multiple product categories (e.g. switching between iPhone 18 Pro, Vision Pro, and Apple Watch Ultra) within the same 3D stage.
5. **Web-Based Image Cropper & Asset Admin Panel:**
   - Build a lightweight local utility or in-browser inspector allowing users to preview and calibrate pin `x, y` coordinates visually rather than typing decimal values in `config.js`.

### Tier 3: Advanced / Frontier Tech
1. **WebGL / WebGPU 3D Mesh Loader (`.glb` / `.gltf`):**
   - Provide an optional Three.js / WebGPU renderer mode in `hardware-disassembly.js` that can load full 3D CAD/mesh assets with dynamic PBR lighting and shadows, while retaining the current lightweight 2.5D layer system as a fast mobile fallback.
2. **Device Orientation / Spatial Gyroscope Integration:**
   - On compatible mobile devices (via `DeviceMotionEvent` / `DeviceOrientationEvent`), allow visitors to physically tilt their handheld device to rotate the 3D product showcase in spatial real time.
3. **Multi-Language Internationalization (i18n):**
   - Implement a lightweight dictionary-based locale switcher in `js/config.js` supporting dynamic translation across English, Japanese, Chinese, German, and French without external dependencies.
4. **Ambient Light Sensor Adaptation:**
   - Utilize the Ambient Light Sensor API to subtly calibrate the darkness of the cosmic void and the intensity of the glass caustics based on the user's physical lighting environment.
