export const protectedVisualSelector =
  ".portfolio h1,.portfolio h2,.portfolio h3,.portfolio h4,.portfolio p,.portfolio a,.portfolio button,.portfolio input,.portfolio textarea,.portfolio label,.portfolio img,.site-header,.community-bar,.community-panel,.community-floating-tools";
export function exclusionPath(rects, width, height) {
  const regions = rects
    .filter(
      (r) =>
        r.width > 0 &&
        r.height > 0 &&
        r.bottom > 0 &&
        r.top < height &&
        r.right > 0 &&
        r.left < width,
    )
    .slice(0, 300)
    .map((r) => ({
      x: Math.max(0, r.left - 5),
      y: Math.max(0, r.top - 5),
      right: Math.min(width, r.right + 5),
      bottom: Math.min(height, r.bottom + 5),
    }));
  for (let i = 0; i < regions.length; i++)
    for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i],
        b = regions[j];
      if (
        a.x <= b.right &&
        a.right >= b.x &&
        a.y <= b.bottom &&
        a.bottom >= b.y
      ) {
        regions[i] = {
          x: Math.min(a.x, b.x),
          y: Math.min(a.y, b.y),
          right: Math.max(a.right, b.right),
          bottom: Math.max(a.bottom, b.bottom),
        };
        regions.splice(j, 1);
        i = -1;
        break;
      }
    }
  const rect = (x, y, r, b) => `M${x} ${y}H${r}V${b}H${x}Z`;
  return `path(evenodd, "${rect(0, 0, width, height)}${regions.map((r) => rect(r.x, r.y, r.right, r.bottom)).join("")}")`;
}
