import { randomUUID } from "node:crypto";
import { validateScene } from "../../shared/community-scene.mjs";
export function sceneAt(state, revision) {
  return state.revision === revision
    ? state.scene
    : state.history.findLast((h) => h.revision === revision)?.scene;
}
export function canUndo(state, job) {
  return (
    job.status === "published" &&
    Boolean(sceneAt(state, job.base) && sceneAt(state, job.revision))
  );
}
const fingerprint = (node) => {
  const { id, ...data } = node;
  void id;
  return JSON.stringify(data);
};
function counts(nodes) {
  const result = new Map();
  for (const node of nodes) {
    const key = fingerprint(node);
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}
export function undoRequest(state, id) {
  const job = state.jobs[id];
  if (!job || !canUndo(state, job))
    throw Object.assign(new Error("undo_unavailable"), {
      status: 409,
      code: "undo_unavailable",
    });
  const result = inverseScene(state, job, state.scene);
  if (state.mode === "private" && state.publicSnapshot) {
    const snapshot = state.publicSnapshot;
    const applied = snapshot.appliedRequestIds;
    const revisions = [...state.history.map((h) => h.revision), state.revision];
    const targetIndex = revisions.indexOf(job.revision);
    const boundary = revisions.indexOf(snapshot.revision);
    const wasPublic = applied
      ? applied.includes(id)
      : targetIndex >= 0 && boundary >= targetIndex;
    if (wasPublic) {
      snapshot.scene = inverseScene(state, job, snapshot.scene).scene;
      snapshot.revision = randomUUID();
      snapshot.appliedRequestIds = (
        applied ||
        Object.values(state.jobs)
          .filter(
            (j) =>
              j.status === "published" &&
              revisions.indexOf(j.revision) >= 0 &&
              revisions.indexOf(j.revision) <= boundary,
          )
          .map((j) => j.id)
      ).filter((key) => key !== id);
    }
  }
  state.history.push({
    revision: state.revision,
    at: Date.now(),
    scene: state.scene,
  });
  state.history = state.history.slice(-100);
  state.scene = result.scene;
  state.revision = randomUUID();
  state.paused = true;
  job.status = "reverted";
  job.reason = "admin_reverted";
  job.revertedAt = Date.now();
  const { scene, ...report } = result;
  void scene;
  return report;
}
function inverseScene(state, job, currentScene) {
  const before = validateScene(sceneAt(state, job.base)),
    after = validateScene(sceneAt(state, job.revision)),
    current = validateScene(currentScene),
    next = structuredClone(current);
  const changed = [],
    skipped = [];
  for (const key of [
    "palette",
    "font",
    "layout",
    "spacing",
    "corners",
    "background",
    "drawing",
    "theme",
    "composition",
  ])
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      if (JSON.stringify(current[key]) === JSON.stringify(after[key])) {
        next[key] = before[key];
        changed.push(key);
      } else skipped.push(key);
    }
  const prior = counts(before.nodes),
    applied = counts(after.nodes),
    remove = new Map(),
    restore = new Map();
  for (const [key, n] of applied)
    if (n > (prior.get(key) || 0)) remove.set(key, n - (prior.get(key) || 0));
  for (const [key, n] of prior)
    if (n > (applied.get(key) || 0))
      restore.set(key, n - (applied.get(key) || 0));
  let removed = 0,
    restored = 0;
  next.nodes = current.nodes.filter((node) => {
    const key = fingerprint(node),
      n = remove.get(key) || 0;
    if (!n) return true;
    remove.set(key, n - 1);
    removed++;
    return false;
  });
  for (const node of before.nodes) {
    const key = fingerprint(node),
      n = restore.get(key) || 0;
    if (n) {
      next.nodes.push({ ...node, id: "restore-" + restored });
      restore.set(key, n - 1);
      restored++;
    }
  }
  // Reassign identifiers before validation, retaining all independent later geometry.
  next.nodes = next.nodes.map((n, i) => ({ ...n, id: "n" + i }));
  const validated = validateScene(next);
  return {
    scene: validated,
    changedFields: changed,
    skippedFields: skipped,
    removedNodes: removed,
    restoredNodes: restored,
    skippedNodes: [...remove.values()].reduce((n, v) => n + v, 0),
  };
}
