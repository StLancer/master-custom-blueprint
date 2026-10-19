Your Pinterest logo — the pipeline handles it, with 3 things to know
Save it as assets/logo/center-logo.<ext> and keep exactly one. Extension priority is svg → png → webp → avif → jpg → jpeg → gif. Both the navbar icon and the hero pick it up automatically — no code edits.
Transparent vs. opaque changes the look, not the code. The pipeline samples the alpha channel:
Transparent PNG/SVG → the 3D glass treatment + a specular rim traced from the logo's own edge. Best result.
Opaque (a Pinterest JPG, or a PNG with a background) → framed in a Liquid Glass plate (rounded app-icon look). Clean and intentional, but it will show the image's own background inside the plate.
If you want the cut-out look, run the Pinterest image through a background remover and save as a transparent PNG.

Aspect ratio only affects the shape. The hero draws it at a fixed height and derives the width, so a portrait 2:3 Pinterest image renders tall and narrow — never distorted, just visually smaller. Raise logoScale if you want it bigger.