# 3D Product Roll & Colorway Showcase Guide

All settings for this section live in **`js/config.js` → `hardwareDisassembly`**.  
Image preparation guidelines (Canva dimensions, canvas sizing, transparency) live in **[`layers/Note.md`](layers/Note.md)**.

---

## 1. How It Works

The 3D Product Showcase module (`js/hardware-disassembly.js`) renders a high-performance, draggable, colorway-reactive product experience:

1. **Multi-Colorway Switching:**
   - Supports any number of color finishes (e.g. **Burgundy** and **Glacier**).
   - Each colorway points to its own subfolder containing sequential perspective angles (`layer-1.png` … `layer-N.png`).
   - Liquid iOS-style pills under the stage glow with each product's authentic color swatch.

2. **Looping Interaction (Desktop):**
   - Scrolling through the section rolls the product smoothly from **Layer 1 → Last Layer → back to Layer 1** before allowing the page to continue scrolling to the next section.
   - Desktop users can also **click and drag** horizontally on the canvas to inspect the device from any angle.

3. **Touch & Mobile / Tablet UX:**
   - On touch devices and screens `≤ 900px`, the scroll runway is removed so users are never trapped while scrolling the page.
   - Users swipe the phone directly:
     - **Swipe Left:** Roll forward (`1 → 2 → 3 …`)
     - **Swipe Right:** Roll backward (`1 → Last → …`) in an endless loop.
   - The overall specification card docks neatly below the stage.

4. **Angle-Specific Feature Callouts (`pins`):**
   - Specific angles can display an animated glass feature callout with a glowing leader line pointing to the exact component (e.g., Camera plateau, Action button, Super Retina XDR display).
   - Angles without a callout (such as 45° transition angles) simply set `pin: null` to keep the showcase clean.

---

## 2. Directory Structure

Place your processed product angles inside `assets/disassembly/layers/`:

```
assets/disassembly/layers/
└── iphone18pro/
    ├── Burgundy/
    │   ├── layer-1.png   # 0° Front Screen
    │   ├── layer-2.png   # 90° Left Side Profile
    │   ├── layer-3.png   # 180° Back Camera Plateau
    │   └── layer-4.png   # 270° Right Side Profile
    └── Glacier/
        ├── layer-1.png   # 0° Front Screen
        ├── layer-2.png   # 45° Front-Left Tilt (pin: null)
        ├── layer-3.png   # 90° Left Side Profile
        ├── layer-4.png   # 180° Back Camera Plateau
        ├── layer-5.png   # 270° Right Side Profile
        └── layer-6.png   # 315° Back-Right Tilt (pin: null)
```

---

## 3. Configuration Reference (`js/config.js`)

```js
hardwareDisassembly: {
  eyebrow: "iPhone 18 Pro",
  headline: "Every angle forged with surgical precision.",

  // 1. CHOOSE YOUR ANIMATION STYLE:
  // - "roll-360" : 3D orbital perspective roll across angles (Default)
  // - "flip-360" : 360° horizontal turntable spin
  // - "explode"  : Vertical multi-layer exploded teardown disassembly
  animationStyle: "roll-360",

  trackHeightVh: 300,        // Desktop scroll runway height
  productScale: 0.84,         // Scale factor on stage (0.60 = smaller, 0.90 = larger)
  dragPxPerLayer: 140,        // Pixels of drag required to advance one angle
  defaultColorway: "burgundy", // Initial active colorway

  colorways: [
    {
      id: "burgundy",
      label: "Burgundy",
      swatch: "#7a1f34",
      glow: "#c2365a",
      folder: "./assets/disassembly/layers/iphone18pro/Burgundy/",
      layers: [
        { pin: { x: 0.50, y: 0.40, title: "Super Retina XDR display", detail: "6.9″ or 6.3″ • Always-On with ProMotion" }, spreadFactor: -1.5 },
        { pin: { x: 0.50, y: 0.30, title: "Action button & titanium frame", detail: "Customisable controls • Precision-machined edge" }, spreadFactor: -0.5 },
        { pin: { x: 0.36, y: 0.22, title: "48MP Pro Fusion camera system", detail: "Main • Ultra Wide • Telephoto — all 48MP" }, spreadFactor: 0.5 },
        { pin: { x: 0.50, y: 0.40, title: "Camera Control", detail: "Variable aperture ƒ/1.48 – ƒ/4.0 (Fusion Main)" }, spreadFactor: 1.5 }
      ]
    },
    {
      id: "glacier",
      label: "Glacier",
      swatch: "#b9cde6",
      glow: "#8fb6e8",
      folder: "./assets/disassembly/layers/iphone18pro/Glacier/",
      layers: [
        { pin: { x: 0.50, y: 0.40, title: "Super Retina XDR display", detail: "6.9″ or 6.3″ • 18MP Center Stage front camera" } },
        { pin: null }, // 45° angle — no callout
        ...
      ]
    }
  ],

  specCard: {
    title: "iPhone 18 Pro",
    body: "Pro in every direction. Drag the phone to roll it, or pick a finish below.",
    specs: [
      { label: "Display", value: "6.9″ or 6.3″ Super Retina XDR" },
      { label: "Chip", value: "A20 Pro • 7-core GPU with Neural Accelerators" },
      { label: "Rear Camera", value: "48MP Pro Fusion: Main, Ultra Wide & Telephoto • ƒ/1.48–ƒ/4.0" },
      { label: "Front Camera", value: "18MP Center Stage • Ultra-stabilised video • Dual Capture" },
      { label: "Battery", value: "Up to 45 hours video playback" }
    ]
  }
}
```

---

## 4. Console Testing Helpers (Live Runtime Switching)

Open browser DevTools (`F12` → Console) and test your styles and colorways live:

```js
// Switch animation styles on the fly:
setHardwareAnimation('explode');   // Vertical multi-layer exploded teardown
setHardwareAnimation('roll-360');  // 3D orbital perspective roll
setHardwareAnimation('flip-360');  // 360° horizontal turntable spin

// Switch product finishes:
setProductColor('glacier');
setProductColor('burgundy');
```
