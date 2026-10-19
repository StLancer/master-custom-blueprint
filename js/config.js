/**
 * APPLE BLUEPRINT 1.0 — MASTER CONFIGURATION FILE
 * Edit this file to customize the landing page for any product, company, or showcase.
 * All image paths point to ./assets/... If an image file is not yet placed in the folder,
 * the template automatically renders a sleek "Liquid Glass Asset Slot" placeholder.
 */

window.BLUEPRINT_CONFIG = {
  meta: {
    productName: "Apple Blueprint 1.0",
    companyName: "Apple Blueprint",
    version: "v1.0.0-open-source"
  },

  // 0. COSMIC THEME & COLOR ENGINE
  //    Developer-locked brand palette (kept in config.js rather than exposed as a public
  //    toggle so your company's signature brand color — e.g. Cosmic Crimson Red — stays cohesive).
  //    Available presets:
  //      - "sapphire" : DeepMind Argon Cosmic Blue & Icy Cyan
  //      - "crimson"  : Cosmic Red, Ruby & Warm Ember (Active)
  //      - "purple"   : Cosmic Amethyst, Deep Violet & Orchid Glow
  //      - "emerald"  : Cosmic Emerald, Bio-Teal & Mint Glow
  //      - "gold"     : Obsidian Solar Gold, Champagne & Warm Amber
  //      - "custom"   : Uses the hex colors defined in `custom` below
  theme: {
    preset: "crimson",
    custom: {
      voidBg: "#020614",        // Deepest background void color
      darkBg: "#070b16",        // Secondary dark section background
      primaryAccent: "#2575fc", // Primary rich accent (buttons, primary aurora core)
      glowAccent: "#60c5ff",    // Bright specular rim, badges, and highlight glow
      secondaryAccent: "#3b1d7a"// Secondary deep aurora shift
    }
  },

  // 1. TOP LIQUID GLASS NAVBAR
  navbar: {
    brandText: "Apple Blueprint 1.0",
    customLogoUrl: "",
    links: [
      { label: "Overview", href: "#hero" },
      { label: "Mission & Vision", href: "#bento-grid" },
      { label: "Spatial Immersion", href: "#immersion-container" },
      { label: "3D Hardware", href: "#hardware-disassembly" },
      { label: "Tech Specs", href: "#tech-specs:iphone" },
      { label: "FAQ", href: "#faq-accordion" }
    ],
    accountButton: {
      label: "Account",
      loggedOutText: "Blueprint ID & Showcase Settings",
      futureAuthEndpoint: "/api/auth/session"
    }
  },

  // 2. HERO SECTION (Cosmic Aurora + Break/Relink Constellation + 3D Glass Logo)
  hero: {
    eyebrow: "",
    title: "Apple",
    subtitle: "Think Different.",

    // ------------------------------------------------------------------------
    // LOGO PIPELINE — drop ANY image into ./assets/logo/ and it is auto-detected.
    //   Canonical name : center-logo.<ext>   (svg | png | webp | avif | jpg | jpeg | gif)
    //   Used for BOTH  : the navbar brand icon, favicon, AND the 3D hero centerpiece.
    // ------------------------------------------------------------------------
    logo: {
      dir: "./assets/logo/",
      baseName: "center-logo",
      extensions: ["svg", "png", "webp", "avif", "jpg", "jpeg", "gif"],
      fallbackBaseNames: ["logo", "custom-logo", "brand-logo", "hero-logo"],
      explicitPath: "",
      aspectFallback: 1,
      motion: {
        maxOffsetPx: 6,
        radiusFactor: 1.25,
        ease: 0.08
      }
    },

    layout: {
      logoScale: 0.38,
      textGapPx: 28,
      groupOffsetYh: 0
    },

    auroraPalette: [
      "#180d02ff",
      "#071c4e",
      "#1348a8",
      "#2575fc",
      "#3b1d7a"
    ],
    constellation: {
      particleCount: 170,
      linkDistance: 145,
      cursorBreakRadius: 165,
      lineMaxOpacity: 0.55,
      particleMaxOpacity: 0.99,
      particleRadius: 2.6,
      particleGlow: 8,
      minLinksPerParticle: 4,
      maxLinksPerParticle: 5,
      particleShape: "mixed"
    },
    // The 3 Hero CTA buttons link directly to the 3 Spatial Immersion showcases
    ctas: [
      { label: "Robotics", href: "#immersion-01", primary: true },
      { label: "Phone", href: "#immersion-02", primary: false },
      { label: "Compute", href: "#immersion-03", primary: false }
    ]
  },

  // 3. POST-HERO BENTO GRID (Company Mission, Vision, Core Philosophy & Strategic Goal)
  bentoSection: {
    eyebrow: "CORPORATE FOUNDATION",
    heading: "Built on vision. Driven by purpose.",
    subheading: "Uniting physical intelligence, precision industrial design, and exascale silicon under one cohesive engineering standard.",
    cards: [
      {
        span: "col-7",
        badge: "01 // OUR MISSION",
        title: "Empowering Human Potential",
        image: "./assets/bento/bento-1.jpg",
        boxStyle: "cover",
        description: "To engineer intuitive hardware and spatial intelligence that amplify human creativity, physical autonomy, and everyday capability without friction."
      },
      {
        span: "col-5",
        badge: "02 // OUR VISION",
        title: "A Seamlessly Connected Future",
        image: "./assets/bento/bento-2.jpg",
        boxStyle: "cover",
        description: "A world where autonomous robotics, personal flagship devices, and neural compute operate in quiet harmony around the people they serve."
      },
      {
        span: "col-5",
        badge: "03 // CORE PHILOSOPHY",
        title: "Precision at the Atomic Level",
        image: "./assets/bento/bento-3.jpg",
        boxStyle: "cover",
        description: "Every micron of Grade-5 titanium, optical nanocrystal coating, and refractive glass surface is crafted with uncompromising structural discipline."
      },
      {
        span: "col-7",
        badge: "04 // STRATEGIC GOAL",
        title: "Sustainable Exascale Innovation",
        image: "./assets/bento/bento-4.jpg",
        boxStyle: "cover",
        description: "Delivering generational leaps in neural performance-per-watt while pioneering carbon-neutral manufacturing and modular system longevity."
      }
    ]
  },

  // 4. THREE SCROLL-PINNED BLUR-TO-CLEAR IMMERSION SECTIONS + APPLEPIC.JPG FOLLOW-UP CAROUSELS
  immersionSections: [
    {
      id: "immersion-01",
      eyebrow: "01 // Autonomous Robotics",
      headline: "Intelligence built\nto move with you.",
      backgroundImage: "./assets/immersion/section-1-bg.jpg",
      editorial: {
        brief: "From expressive desktop companions to heavy-duty field units, next-generation robotics combines spatial perception with precision micro-actuators—adapting effortlessly to human environments.",
        linkText: "Compare Robotics Architecture & Specs",
        linkHref: "#tech-specs:robotics",
        carouselCards: [
          {
            widthClass: "wide",
            image: "./assets/editorial/sec1-card1.jpg",
            leadBold: "Bipedal Companion Units",
            caption: "pair an expressive OLED visor with low-latency neural vision, reading room depth and human gestures in real time."
          },
          {
            widthClass: "narrow",
            image: "./assets/editorial/sec1-card2.jpg",
            leadBold: "Heavy-Duty Utility Frames",
            caption: "deliver high-torque servo articulation and reinforced alloy armor for demanding industrial workflows."
          },
          {
            widthClass: "wide",
            image: "./assets/editorial/sec1-card3.jpg",
            leadBold: "Omni-Directional Gyro Drive",
            caption: "enables zero-radius 360° rolling locomotion while keeping the upper optical sensor turret horizon-locked."
          }
        ]
      }
    },
    {
      id: "immersion-02",
      eyebrow: "02 // iPhone Pro Design",
      headline: "Forged in titanium.\nFocused on pro optics.",
      backgroundImage: "./assets/immersion/section-2-bg.jpg",
      editorial: {
        brief: "Aerospace-grade titanium meets our most advanced camera plateau ever. Every contour is micro-blasted and precision-milled to house larger sensors, faster thermal dissipation, and all-day battery life.",
        linkText: "Compare iPhone 18 Pro Camera & Silicon Specs",
        linkHref: "#tech-specs:iphone",
        carouselCards: [
          {
            widthClass: "wide",
            image: "./assets/editorial/sec2-card1.jpg",
            leadBold: "Crimson Anodized Unibody",
            caption: "bonds a color-infused matte glass back to a Grade 5 titanium frame with ultra-narrow contoured bezels."
          },
          {
            widthClass: "narrow",
            image: "./assets/editorial/sec2-card2.jpg",
            dock: "left",
            leadBold: "Pro Triple-Camera Plateau",
            caption: "integrates a 48MP Fusion main camera, 5x Tetraprism telephoto, LiDAR scanner, and True Tone flash in a single milled enclosure."
          },
          {
            widthClass: "wide",
            image: "./assets/editorial/sec2-card3.jpg",
            leadBold: "Stealth Black Titanium",
            caption: "features a dual-ion exchange glass back and an internal vapor-chamber substructure for sustained peak performance."
          }
        ]
      }
    },
    {
      id: "immersion-03",
      eyebrow: "03 // NVIDIA AI Compute",
      headline: "Exascale silicon.\nBuilt for the AI era.",
      backgroundImage: "./assets/immersion/section-3-bg.jpg",
      editorial: {
        brief: "From hyperscale data centers to creator workstations, next-generation Tensor Core architectures push trillions of floating-point operations per second with breakthrough thermal efficiency.",
        linkText: "Compare NVIDIA Tensor Core Specifications",
        linkHref: "#tech-specs:compute",
        carouselCards: [
          {
            widthClass: "wide",
            image: "./assets/editorial/sec3-card1.jpg",
            leadBold: "NVIDIA A100 Tensor Core",
            caption: "delivers massive multi-instance GPU acceleration and high-bandwidth HBM2e memory for frontier AI training clusters."
          },
          {
            widthClass: "narrow",
            image: "./assets/editorial/sec3-card2.jpg",
            leadBold: "GeForce RTX 5090 Architecture",
            caption: "combines dual-axial flow-through cooling with fifth-generation Tensor Cores for real-time neural rendering."
          }
        ]
      }
    }
  ],

  // 4b. IMMERSION SCROLL TUNING
  immersionTuning: {
    trackHeightVh: 175,
    initialBlurPx: 10,
    initialBrightness: 0.7,
    vignetteOpacity: 0.55,
    headlineHoldProgress: 0.12,
    focusEndProgress: 0.7,
    headlineExitVh: 100
  },

  // 5. STANDALONE 3D PRODUCT ROLL SHOWCASE (iPhone 18 Pro • Colorways)
  //    See ./assets/disassembly/layers/Note.md for the image preparation guide.
  hardwareDisassembly: {
    eyebrow: "iPhone 18 Pro",
    headline: "Every angle forged with surgical precision.",

    // ------------------------------------------------------------------------
    // ANIMATION STYLE:
    // - "roll-360" : 3D orbital perspective roll across angles (Default)
    // - "flip-360" : 360° horizontal turntable spin
    // - "explode"  : Vertical multi-layer exploded teardown disassembly
    // ------------------------------------------------------------------------
    animationStyle: "roll-360",

    // Scroll runway on desktop (scroll rolls layer 1 -> last -> back to layer 1).
    // Touch devices skip the runway and roll the phone by swiping it instead.
    trackHeightVh: 300,

    // Product height relative to the stage (0.60 = smaller, 0.90 = larger)
    productScale: 0.84,

    // Pixels of horizontal drag needed to roll one layer
    dragPxPerLayer: 140,

    defaultColorway: "burgundy",

    // ------------------------------------------------------------------------
    // COLORWAYS — each has its own folder of ordered images (layer-1.png ... layer-N.png)
    // pin: { x, y } = position on the 1200x1600 image (0..1), or null for no message
    // ------------------------------------------------------------------------
    colorways: [
      {
        id: "burgundy",
        label: "Burgundy",
        swatch: "#7a1f34",
        glow: "#c2365a",
        folder: "./assets/disassembly/layers/iphone18pro/Burgundy/",
        layers: [
          { pin: { x: 0.50, y: 0.40, title: "Super Retina XDR display", detail: "6.9″ or 6.3″ • Always-On with ProMotion" } },
          { pin: { x: 0.50, y: 0.30, title: "Action button & titanium frame", detail: "Customisable controls • Precision-machined edge" } },
          { pin: { x: 0.36, y: 0.22, title: "48MP Pro Fusion camera system", detail: "Main • Ultra Wide • Telephoto — all 48MP" } },
          { pin: { x: 0.50, y: 0.40, title: "Camera Control", detail: "Variable aperture ƒ/1.48 – ƒ/4.0 (Fusion Main)" } }
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
          { pin: null },
          { pin: { x: 0.50, y: 0.30, title: "Action button & titanium frame", detail: "Customisable controls • Precision-machined edge" } },
          { pin: { x: 0.36, y: 0.22, title: "48MP Pro Fusion camera system", detail: "Main • Ultra Wide • Telephoto — all 48MP" } },
          { pin: { x: 0.50, y: 0.40, title: "Camera Control", detail: "Variable aperture ƒ/1.48 – ƒ/4.0 (Fusion Main)" } },
          { pin: null }
        ]
      }
    ],

    // Right-side overall specification card
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
  },

  // 5b. INTERACTIVE TECH SPECS COMPARISON MODAL DATA
  techSpecsModal: {
    eyebrow: "ENGINEERING SPECIFICATIONS",
    title: "Flagship Architecture Comparison",
    categories: [
      {
        id: "iphone",
        label: "02. iPhone 18 Pro",
        models: [
          {
            badge: "FLAGSHIP 6.3″",
            name: "iPhone 18 Pro",
            summary: "Crimson Anodized Grade-5 Titanium with A20 Pro 3nm silicon and 5x Tetraprism optical zoom."
          },
          {
            badge: "ULTRA FLAGSHIP 6.9″",
            name: "iPhone 18 Pro Max",
            summary: "Expansive 6.9-inch Super Retina XDR canvas with extended vapor-chamber cooling and 35-hour battery."
          }
        ],
        specs: [
          { label: "Finish & Chassis", valA: "Crimson Titanium, Stealth Black • Grade-5 Unibody", valB: "Crimson Titanium, Stealth Black • Extended Thermal Frame" },
          { label: "Display Matrix", valA: "6.3″ Tandem Micro-OLED • 1–120Hz ProMotion (2400 nits)", valB: "6.9″ Tandem Micro-OLED • 1–120Hz ProMotion (2600 nits)" },
          { label: "Silicon Engine", valA: "A20 Pro Chip • 6-Core GPU + 38-Core Neural Engine", valB: "A20 Pro Max Bin • Vapor-Chamber Sustained Boost" },
          { label: "Pro Camera Plateau", valA: "48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto", valB: "48MP Fusion + 48MP Ultra Wide + 48MP 5x Tetraprism" },
          { label: "Spatial Video & LiDAR", valA: "4K 120fps ProRes Log • Dual-Beam LiDAR Scanner", valB: "4K 120fps ProRes Log + External Thunderbolt 5 Capture" },
          { label: "Battery & MagSafe", valA: "Up to 29 hours video playback • 45W MagSafe Qi2", valB: "Up to 35 hours video playback • 45W MagSafe Qi2" }
        ]
      },
      {
        id: "robotics",
        label: "01. Autonomous Robotics",
        models: [
          {
            badge: "COMPANION SERIES",
            name: "Aether Bipedal Unit-01",
            summary: "Expressive OLED-visor desktop and domestic companion with real-time depth perception."
          },
          {
            badge: "INDUSTRIAL SERIES",
            name: "Titan Field Utility Frame",
            summary: "High-torque articulated autonomous unit engineered for logistics and hazardous field terrain."
          }
        ],
        specs: [
          { label: "Locomotion System", valA: "18-DOF Micro-Harmonic Bipedal + Gyro Stabilizer", valB: "32-DOF Electro-Hydraulic Actuators + Omni-Drive" },
          { label: "Spatial Perception", valA: "Dual RGB-D Neural Cameras + 360° Solid-State LiDAR", valB: "Quad Thermal-Optical Array + Millimeter-Wave Radar" },
          { label: "Onboard AI Compute", valA: "120 TOPS Low-Power Edge Neural Processor", valB: "800 TOPS Dual-Redundant Autonomous Compute Module" },
          { label: "Human Interaction", valA: "Curved 120Hz Expressive OLED Visor + Spatial Mic Array", valB: "Tactile Force-Feedback Manipulators + Fleet Telemetry" },
          { label: "Operating Endurance", valA: "14 Hours Continuous Active Companion Duty", valB: "24 Hours Heavy Payload Operation (Hot-Swap Cells)" }
        ]
      },
      {
        id: "compute",
        label: "03. NVIDIA AI Compute",
        models: [
          {
            badge: "DATA CENTER EXASCALE",
            name: "NVIDIA A100 / HGX Tensor Node",
            summary: "Multi-instance GPU accelerator built for frontier LLM training and scientific simulation."
          },
          {
            badge: "WORKSTATION FLAGSHIP",
            name: "GeForce RTX 5090 Founders",
            summary: "Dual-axial flow-through flagship GPU for real-time path tracing and local neural rendering."
          }
        ],
        specs: [
          { label: "GPU Architecture", valA: "NVIDIA Tensor Core Enterprise • 7nm / 4nm CoWoS", valB: "Blackwell GeForce Architecture • 5th-Gen Tensor Cores" },
          { label: "Memory Subsystem", valA: "80GB HBM2e • 2,039 GB/s Ultra-High Bandwidth", valB: "32GB GDDR7 • 512-bit Interface • 1,792 GB/s" },
          { label: "AI & Tensor Compute", valA: "624 TFLOPS FP16 / 1,248 TOPS INT8 Sparsity", valB: "3,352 AI TOPS FP4 • DLSS 4 Multi-Frame Generation" },
          { label: "Interconnect & I/O", valA: "600 GB/s NVLink Bridge + PCIe Gen 5", valB: "PCIe Gen 5 x16 • DisplayPort 2.1b UHBR20" },
          { label: "Thermal Solution", valA: "Passive High-Fin Server Heatsink / Direct Liquid", valB: "Dual-Axial Flow-Through Vapor Chamber Cooler" }
        ]
      }
    ]
  },

  // 6. VERTICALLY STACKED ACCORDION SECTION (Customizable Q&A / Specs)
  accordionSection: {
    eyebrow: "ARCHITECTURE & CUSTOMIZATION FAQ",
    heading: "Frequently Asked Questions",
    subheading: "Everything you need to know about customizing and deploying Apple Blueprint 1.0.",
    items: [
      {
        question: "How does the 3D Product Roll section work?",
        answer: "Open `js/config.js` under `hardwareDisassembly`. Each colour in `colorways` points to a folder of ordered images (`layer-1`, `layer-2`, …). On a laptop, scrolling rolls the product through every angle and back to the first one; you can also click and drag it. On phones and tablets, swipe the product to roll it. See `assets/disassembly/layers/Note.md` for the full image guide."
      },
      {
        question: "Why is the Cosmic Theme locked in config.js instead of a public color switcher?",
        answer: "For official company showcases whose logo and hardware share a signature brand identity (such as Cosmic Crimson Red), keeping `theme.preset` developer-configured in `js/config.js` preserves strict visual consistency. Developers can switch between `\"crimson\"`, `\"sapphire\"`, `\"purple\"`, `\"emerald\"`, `\"gold\"`, or `\"custom\"` in one line."
      },
      {
        question: "How do I change the central 3D Glass logo in the Hero, Navbar, and Favicon?",
        answer: "Drop your logo file into `./assets/logo/` and name it `center-logo` with any common extension (`.svg`, `.png`, `.webp`, `.jpg`). It is automatically detected and applied to the navbar brand icon, the 3D hero centerpiece, and the browser tab favicon with zero code edits."
      },
      {
        question: "How do the Account Settings and Interactive Tech Specs Modals work?",
        answer: "Clicking the Account icon in the navbar opens the Blueprint ID & Showcase Settings center, allowing visitors to sign in or customize 3D hardware motion and video autoplay preferences. Clicking any 'Compare Specs' link in the navbar or editorial sections opens the Interactive Tech Specs Comparison Drawer."
      },
      {
        question: "Can I mix transparent PNG cutouts, studio JPGs, and MP4 videos in the Editorial & Bento cards?",
        answer: "Yes. Every card slot automatically inspects the asset format and border pixels: transparent PNGs and white-backdrop studio shots sit cleanly inside dimmer-white (`#f5f5f7`) editorial boxes, edge-cropped hardware close-ups dock flush to the card wall, and `.mp4`/`.webm` videos mount with a Liquid Glass Play/Pause and Audio control pill."
      }
    ]
  },

  // 7. FOOTER (Sitemaps, Legal Disclaimers, Copyright, Social Links)
  footer: {
    disclaimer: "1. Apple Blueprint 1.0 is a flagship UI/UX master webpage template engineered for official company showcases and product lines. Specifications shown in the interactive comparison drawer represent reference flagship configurations.",
    columns: [
      {
        title: "Showcase & Foundation",
        links: [
          { label: "Cosmic Aurora Hero", href: "#hero" },
          { label: "Mission, Vision & Goal", href: "#bento-grid" },
          { label: "01. Autonomous Robotics", href: "#immersion-01" },
          { label: "02. iPhone Pro Design", href: "#immersion-02" },
          { label: "03. NVIDIA AI Compute", href: "#immersion-03" }
        ]
      },
      {
        title: "3D Hardware & Specs",
        links: [
          { label: "360° Product Flip & Roll", href: "#hardware-disassembly" },
          { label: "Compare iPhone 18 Pro Specs", href: "#tech-specs:iphone" },
          { label: "Compare Robotics Specs", href: "#tech-specs:robotics" },
          { label: "Compare NVIDIA Compute Specs", href: "#tech-specs:compute" }
        ]
      },
      {
        title: "Template Architecture",
        links: [
          { label: "Master Config (js/config.js)", href: "#faq-accordion" },
          { label: "Logo & Favicon Pipeline", href: "#faq-accordion" },
          { label: "Smart Media & Video Slots", href: "#immersion-02" },
          { label: "Documentation & FAQ", href: "#faq-accordion" }
        ]
      },
      {
        title: "Account & Preferences",
        links: [
          { label: "Sign In / Blueprint ID", href: "#account:signin" },
          { label: "Create Organization ID", href: "#account:signup" },
          { label: "3D Showcase Settings", href: "#account:settings" }
        ]
      }
    ],
    copyright: "Copyright © 2026 Apple Blueprint 1.0 Flagship Showcase Template. All rights reserved.",
    legalLinks: [
      { label: "Privacy Policy", href: "#footer" },
      { label: "Terms of Use", href: "#footer" },
      { label: "Technical Specifications", href: "#tech-specs:iphone" },
      { label: "Account Settings", href: "#account:settings" }
    ],
    socials: [
      { label: "GitHub", href: "https://github.com" },
      { label: "X / Twitter", href: "https://x.com" },
      { label: "LinkedIn", href: "https://linkedin.com" }
    ]
  }
};