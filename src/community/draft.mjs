import { brushColors } from "../../shared/community-catalog.mjs";
function validateStrokes(strokes) {
  if (!Array.isArray(strokes) || !strokes.length || strokes.length > 12)
    throw Error("invalid draft");
  return strokes.map((s) => {
    if (
      !s ||
      !Object.hasOwn(brushColors, s.color) ||
      !Number.isInteger(s.width) ||
      s.width < 1 ||
      s.width > 12 ||
      !Array.isArray(s.points) ||
      s.points.length < 2 ||
      s.points.length > 64
    )
      throw Error("invalid draft");
    return {
      points: s.points.map((p) => {
        if (
          !p ||
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          p.x < 0 ||
          p.x > 100 ||
          p.y < 0 ||
          p.y > 100
        )
          throw Error("invalid point");
        return { x: p.x, y: p.y };
      }),
      color: s.color,
      width: s.width,
    };
  });
}
const key = (zone) => "community-drawing-draft-v1:" + zone;
let embeddedStorage;
export function setDraftStorage(storage) {
  embeddedStorage = storage;
}
export const fingerprint = (draft) =>
  JSON.stringify({ zone: draft.zone, strokes: validateStrokes(draft.strokes) });
export function loadDraft(zone, storage) {
  try {
    storage ||= embeddedStorage || globalThis.localStorage;
    const value = JSON.parse(storage.getItem(key(zone)));
    if (Date.now() - value.at > 30 * 86400000) {
      storage.removeItem(key(zone));
      return [];
    }
    return validateStrokes(value.strokes);
  } catch {
    return [];
  }
}
export function saveDraft(zone, strokes, storage) {
  try {
    storage ||= embeddedStorage || globalThis.localStorage;
    if (!strokes.length) {
      storage.removeItem(key(zone));
      return;
    }
    storage.setItem(
      key(zone),
      JSON.stringify({ at: Date.now(), strokes: validateStrokes(strokes) }),
    );
  } catch {
    /* Drawing remains visible if storage is unavailable. */
  }
}
