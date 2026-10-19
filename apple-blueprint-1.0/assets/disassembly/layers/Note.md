# 3D Product Roll Showcase — Image Guide

This guide shows how to turn your product photos into the draggable 3D roll in the
**3D Hardware** section (`#hardware-disassembly`).

---

## 1. Folder structure

Each product gets its own folder. Inside it, make **one subfolder per colour**:

```
assets/disassembly/layers/
└── iphone18pro/
    ├── Burgundy/   layer-1.png … layer-4.png   (4 angles)
    └── Glacier/    layer-1.png … layer-6.png   (6 angles)
```

Colours can have different numbers of angles (anything from 2 up works; 4–6 looks best).

---

## 2. Prepare the images (Canva)

1. **Canvas size:** in Canva, create a custom design at **1200 × 1600 px** (portrait 3:4).
   Use exactly this size for **every** image of **every** colour.
2. **Placement:** put the phone in the centre. Make it fill about **85% of the height**
   and leave equal empty space above and below (about 7% each).
   - Keep the phone the **same height** in every angle. Side views will be narrow, and that's fine.
   - Line the top and bottom of the phone up in the same place on every image (use Canva's guides).
3. **Background:** remove it if you can (Canva Pro → *Edit photo → BG Remover*).
   - Export as **PNG** and tick **Transparent background**.
   - If you can't make it transparent, a **plain pure-white** background also works.
     The page removes white edges by itself, but only when you run it from a local server (see section 6).
4. **File size:** try to keep each file under ~800 KB (compress with tinypng.com if needed).

---

## 3. Name the files in roll order

Name the files `layer-1.png`, `layer-2.png`, … in the order the phone should turn
when someone **drags it to the left**:

| File | Example (6 angles, Glacier) |
| :--- | :--- |
| `layer-1.png` | Front (screen) — **always the starting view** |
| `layer-2.png` | 45° front-side |
| `layer-3.png` | Side profile |
| `layer-4.png` | Back (camera) |
| `layer-5.png` | Other side profile |
| `layer-6.png` | 45° back-to-front |

The angles loop: after the last layer comes `layer-1` again.

---

## 4. Register the colour in `js/config.js`

Go to `hardwareDisassembly.colorways` and add one entry for each colour folder.
You need **one item in `layers` for each image**, in the same order:

```js
{
  id: "glacier",
  label: "Glacier",                 // text on the colour button
  swatch: "#b9cde6",                // dot colour on the button
  glow: "#8fb6e8",                  // button glow + studio light + headline glow
  folder: "./assets/disassembly/layers/iphone18pro/Glacier/",
  layers: [
    { pin: { x: 0.50, y: 0.40, title: "Super Retina XDR display", detail: "6.9″ or 6.3″" } },
    { pin: null },                  // 45° shot → no info message
    ...
  ]
}
```

- **`pin`** is the feature message shown for that angle. `x`/`y` give the spot on the
  1200×1600 image as a fraction (0 = left/top, 1 = right/bottom). For example, the camera
  sits near `x: 0.36, y: 0.22` on a back view.
- Use `pin: null` for angles that shouldn't show a message, such as 45° shots.
- **`animationStyle`**: Choose between 3 physical presentation modes:
  - `"roll-360"` (Default): Continuous orbital 3D perspective turn across angles.
  - `"flip-360"`: Turntable spin around center Y-axis.
  - `"explode"`: Vertical multi-layer exploded teardown with drop-shadows and laser alignment buses.
- `defaultColorway` sets which colour loads first (e.g. `"burgundy"`).
- `specCard` is the overall specification card on the right.
- `productScale` sets how big the phone looks. `dragPxPerLayer` sets how far you drag to turn one angle.

---

## 5. How visitors use it

| Device | Interaction |
| :--- | :--- |
| **Laptop / desktop** | Scrolling turns the phone layer 1 → last → layer 1, then the page moves to the next section. They can also **click-and-drag** the phone. |
| **Phone / tablet** | No auto-roll while scrolling. They **swipe the phone**: swipe left = next angle (1→2→3…), swipe right = previous (1→last→…). It loops forever. |
| **Colour buttons** | Swap the whole image set. The active button glows in that colour. |

---

## 6. Testing

- Open the site through a local server (for example VS Code **Live Server**, or `npx serve`),
  **not** by double-clicking `index.html`. Over `file://` the browser won't let the page
  remove white backgrounds.
- **Console Helpers (Live Runtime Testing):** Press `F12` and test options instantly:
  - `setProductColor('glacier')` or `setProductColor('burgundy')`
  - `setHardwareAnimation('explode')`
  - `setHardwareAnimation('roll-360')`
  - `setHardwareAnimation('flip-360')`

### Checklist
- [ ] All images are 1200 × 1600 px
- [ ] Phone is centred and the same height in every image
- [ ] Background is transparent (or pure white)
- [ ] Files are named `layer-1.png … layer-N.png` in drag-left order
- [ ] The `layers` array in `config.js` has the same number of items as there are images