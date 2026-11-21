import { test } from "node:test";
import assert from "node:assert/strict";
import { Script, runInNewContext } from "node:vm";
import { programDocument } from "../shared/community-program.mjs";

test("the visible frame remains painted while the next worker frame is in flight", () => {
  const doc = programDocument({
    html: "",
    css: "",
    javascript: "function render(){}",
    layer: "foreground",
  });
  const start = doc.search(/function tick\(now\)\s*\{/),
    end = start + doc.slice(start).search(/try\s*\{\s*worker\s*=\s*new Worker/);
  let visible = true,
    width = 1280,
    height = 720;
  const surface = {
    get width() {
      return width;
    },
    set width(v) {
      width = v;
      visible = false;
    },
    get height() {
      return height;
    },
    set height(v) {
      height = v;
      visible = false;
    },
  };
  const context = {
    surface,
    stop: () => {},
    requestAnimationFrame: () => {},
    document: { hidden: false },
    matchMedia: () => ({ matches: false }),
    setTimeout: () => 1,
    performance: { now: () => 100 },
  };
  runInNewContext(
    `let stopped=false,pending=false,last=0,first=false,watchdog,started=0,requestedAt=0;const preview=false;let input={pointer:{x:200,y:300},scrollY:0};const dimensions=()=>({width:1280,height:720,scale:1});const worker={postMessage(){}};${doc.slice(start, end)};tick(100);`,
    context,
  );
  assert.equal(
    visible,
    true,
    "requesting a frame must not clear the last completed image",
  );
});

import { assessProgramQuality } from "../server/community/quality.mjs";
function reports() {
  return ["desktop", "mobile"].map((viewport) => ({
    viewport,
    status: "ready",
    frames: 40,
    errors: 0,
    presentationGaps: 0,
    samples: Array.from({ length: 40 }, (_, i) => ({
      t: i * 40,
      phase: i >= 25 && i < 33 ? "paused" : "moving",
      alpha: 100,
      ms: 4,
    })),
  }));
}
test("motion checks require desktop, mobile, movement, pause and stable presentation", () => {
  assert.equal(
    assessProgramQuality(reports(), "cursor de burbujas").passed,
    true,
  );
  assert.equal(
    assessProgramQuality(reports().slice(0, 1), "cursor").passed,
    false,
  );
  for (const failure of [
    "runtime",
    "presentation",
    "blank",
    "incomplete",
    "slow",
  ]) {
    const r = reports();
    if (failure === "runtime") r[0].errors = 1;
    if (failure === "presentation") r[0].presentationGaps = 2;
    if (failure === "blank")
      r[0].samples.forEach((s, i) => {
        if (i < 20 && i % 2) s.alpha = 0;
      });
    if (failure === "incomplete") r[0].samples = r[0].samples.slice(0, 8);
    if (failure === "slow")
      r[0].samples.forEach((s) => {
        s.ms = 180;
      });
    assert.equal(
      assessProgramQuality(r, "rastro de burbujas").passed,
      false,
      failure,
    );
  }
  const r = reports();
  r.forEach((x) =>
    x.samples.forEach((s) => {
      s.alpha = 0;
    }),
  );
  assert.equal(assessProgramQuality(r, "cursor de burbujas").passed, false);
  assert.equal(
    assessProgramQuality(r, "cursor de burbujas", { canvasExpected: false })
      .passed,
    true,
    "HTML effects are judged visually rather than required to paint a canvas",
  );
});

test("the isolated bootstrap remains valid JavaScript even when generated strings contain HTML delimiters", () => {
  const doc = programDocument({
    html: "</script><div>x</div>",
    css: "body{color:red}",
    javascript: 'function render(){const s="</script>";}',
    layer: "foreground",
  });
  const start =
    doc.indexOf('<script nonce="community-runtime">') +
    '<script nonce="community-runtime">'.length;
  assert.doesNotThrow(
    () => new Script(doc.slice(start, doc.lastIndexOf("</script>"))),
  );
});
