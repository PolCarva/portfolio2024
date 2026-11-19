const duration = 4000;
const pose = (x, y, scale, angle = 0) => ({ x, y, scale, angle });
const start = pose(-10, -2, 1, -3);
const first = pose(12, -12, 0.94, 4);
const second = pose(-16, 13, 0.87, -4);
const center = pose(0, 0, 0.76);
const transform = (p) =>
  `translate(${p.x.toFixed(3)}%, ${p.y.toFixed(3)}%) scale(${p.scale.toFixed(3)}) rotate(${p.angle.toFixed(3)}deg)`;
const lerp = (a, b, t) => a + (b - a) * t;
function curve(a, b, c, d, progress) {
  // Cosine timing eases into each aim point, without a hard corner or sudden stop.
  const t = (1 - Math.cos(Math.PI * progress)) / 2;
  const u = 1 - t;
  return pose(
    u * u * u * a.x +
      3 * u * u * t * b.x +
      3 * u * t * t * c.x +
      t * t * t * d.x,
    u * u * u * a.y +
      3 * u * u * t * b.y +
      3 * u * t * t * c.y +
      t * t * t * d.y,
    lerp(a.scale, d.scale, t),
    lerp(a.angle, d.angle, t),
  );
}
const frames = [];
function flight(from, control1, control2, to, begin, length) {
  for (let i = frames.length ? 1 : 0; i <= 28; i++) {
    frames.push({
      transform: transform(curve(from, control1, control2, to, i / 28)),
      offset: (begin + (length * i) / 28) / duration,
    });
  }
}
flight(start, pose(-22, -23, 1), pose(23, -27, 1), first, 0, 950);
frames.push({ transform: transform(first), offset: 1250 / duration }); // First 300 ms aim hold.
flight(first, pose(23, 12, 1), pose(-30, -3, 1), second, 1250, 1050);
frames.push({ transform: transform(second), offset: 2600 / duration }); // Second 300 ms aim hold.
flight(second, pose(-8, 24, 1), pose(9, 5, 1), center, 2600, 900);
frames.push({
  transform: transform(pose(0, 0, 0.86)),
  offset: 3750 / duration,
});
frames.push({ transform: transform(pose(0, 0, 0.82)), offset: 1 });
export const videoAimMotion = {
  duration,
  target: frames,
  play: [
    { opacity: 0, transform: "scale(.7)", offset: 0 },
    { opacity: 0, transform: "scale(.7)", offset: 3500 / duration },
    { opacity: 1, transform: "scale(1.08)", offset: 3750 / duration },
    { opacity: 1, transform: "scale(1)", offset: 1 },
  ],
};
