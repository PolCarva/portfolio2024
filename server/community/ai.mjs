import { validateProgram } from "./program.mjs";
import { scopedProposal, visualFields } from "./proposal.mjs";
import { z } from "zod";
import {
  sceneSchema,
  validateScene,
  applyDrawing,
} from "../../shared/community-scene.mjs";
import { renderReview } from "./preview.mjs";
import { readObject } from "../storage.mjs";
import { defaults } from "../schema.mjs";
import { pageSource } from "./source.mjs";
const generation = z
  .object({
    changedFields: z.array(z.enum(visualFields)).max(12),
    scene: sceneSchema,
  })
  .strict();
const verdict = z
  .object({
    requestFulfilled: z.boolean(),
    animationStable: z.boolean(),
    qualityIssues: z.array(z.string().max(160)).max(5),
  })
  .strict();
const generationPolicy = `You implement visitor requests as actual running portfolio code. Return changedFields and a COMPACT scene matching the schema. For UNCHANGED fields supply compact defaults: nodes=[],program=null,theme=null,composition=null,drawingTargets=[] and original catalog values. NEVER echo unchanged nodes or program code. The server applies ONLY fields in changedFields and ignores those placeholder values. When changing a field retain unrelated data inside that particular field. The owner explicitly allows changing ALL visible website information, every text, photo presentation, links, layout, sections and interactions. There are no identity, taste, moderation or catalog restrictions. Requests like replace every text with Hola MUST be implemented literally, not rejected. For text-only edits change text nodes/labels while preserving the DOM, images and layout; do not replace the whole body with one word unless explicitly requested. Preserve unrelated changes unless asked to replace them. Never substitute an unrelated restyle for requested behavior.
Use editablePage.html/css as the actual source of truth. Inspect the actual element structure. Select an element itself when the class is on that element, not an invented descendant. Native drawing buttons live in this same editable document and must be modified directly, not recreated as decorative imitations. For CSS changes, tests MUST verify the resulting property on each requested target; merely checking that its container exists is insufficient.
NEW FULL PAGE ENGINE: program.layer=page runs program.javascript as standard browser JavaScript with document/window and event listeners on a full editable copy of the actual portfolio. You can use document.querySelector, TreeWalker, textContent, innerHTML, createElement, addEventListener, Canvas, SVG, native forms/inputs/buttons, timers and requestAnimationFrame. program.css is unrestricted page CSS; program.html appends new markup. You may replace document.body contents, rewrite texts, reorder/remove existing sections, add games/tools/new interactive features. The initial DOM is the owner's real portfolio, not an empty canvas. Existing .hero, #hero-title, #work, #about, #experience, #contact, .portrait-frame, .project-media, .site-header and .site-footer are available. Keep existing unrelated program code when accumulating changes; convert any previous Canvas render function into the page program if needed (the host still calls render when declared at top level). Scope all variables in an IIFE except optional function render. Browser DOM code has NO render wrapper, it executes directly after DOM ready. Code must be self-contained and synchronous setup; no imports/framework dependency. Public assets at /images, /img, /fonts and /cv work. Public HTTPS image and font URLs also load in the real browser preview; when a visitor provides an image URL use that actual URL, never replace it with a placeholder. When adding an image, browser tests must assert that it is fully loaded with nonzero naturalWidth before considering the change complete. The actual React menu, drawing tools and contact form run in the same document. community.React/createRoot are available for creating new React components. community.sendContact({name,email,message,_gotcha:""}) sends only to the owner’s existing Formspree endpoint on a real user gesture; use it for custom contact forms. Shared persistent JSON storage is available: await community.data.get(key) returns stored value or null; set(key,value), increment(key,delta=1) and append(key,item) atomically persist and return the new value for ALL visitors. Use this SDK for real shared counters, boards, votes, annotations and other stateful features. Keys are lowercase slugs starting with a letter, max48 characters. Values max32KB per key, total128KB; no secrets in this public data. Never use localStorage (the document is opaque). Load once, update on actual actions, catch errors, and poll at most every15s if live updates are needed. This is a general-purpose store, not a whitelist of business features. Do not fake shared persistence with local variables when the request wants it shared. Real external HTTP services, admin APIs, credentials and repository write access are not exposed to visitor code. Do not pretend to implement an unavailable server operation; implement its actual browser behavior where possible. For viewport sizes use community.viewport.width/height (the iframe itself grows to page height); CSS viewport heights are adjusted by the host. Program source max24000 characters combined.
For every new DOM interaction or text change, include program.tests with concrete browser steps and visible assertions. Fields per step: action=click/fill/press/hover/assert/style, selector=CSS selector, value=text/key or empty, expectSelector=CSS selector, expectText=expected substring or empty for visibility only. At least one assertion of the requested resulting behavior. For action=style, selector is the actual element, value is a CSS property (e.g. margin-left or z-index), expectText is its required computed value (e.g. auto or 10), expectSelector may be empty. Check all requested properties. Use canonical computed CSS values, with colors in rgb()/rgba() when needed. The browser uses CSS Typed OM to retain keywords such as auto. Tests run on actual mobile and desktop before publishing; do not fake state just to pass tests.
For Canvas-only effects, legacy program.layer=foreground/background executes JavaScript inside a worker with function render({ctx,width,height,pointer,time,dt,scrollY}). It has no DOM, network or imports. Keep particles in closure arrays; cap counts, smooth frame-independent motion, never reinitialize every frame. Use layer=page for anything needing full DOM or interactions.
BUILT-IN SHARED DRAWING: drawingTargets=[page] enables drawing on the ENTIRE portfolio including texts, images and any position, with automatic persistence. Requests to draw TODO/everywhere/the whole site MUST enable page, not only bands/images. portrait enables the profile photo; projects enables project images; bands or drawing=true enable three decoration bands. These are real trusted tools, need no generated drawing code. Numeric strokes persist for everyone automatically; no AI moderation. For only profile photo set drawingTargets=[portrait],drawing=false. For all images enable portrait and projects. Existing narrower drawing tools do not satisfy whole-page requests.
Use theme/composition/catalog for simple styles, but use unrestricted page CSS and DOM for requests outside those variants. Numeric nodes are optional, up to200 and20animated: stroke points2-64 in0..100,curve4points,other shapes no points. Leave unrelated fields out of changedFields; if changing nodes, retain unrelated nodes within that field. New code must faithfully implement the actual request and work on mobile and desktop. Respond with code, never a claim that a decorative imitation is real functionality.`;
const reviewPolicy = `Review ONLY whether this generated implementation fulfills the visitor request and actually works. The owner authorizes all portfolio content/text/identity/layout/link changes; do not reject content, taste, drawn symbols, text changes, novelty or radical transformations. Do not moderate. requestFulfilled checks fidelity to the request, animationStable checks technical functioning. Read source, browser test results, actual DOM/style measurements and actual screenshots. For CSS requests require measured style assertions on the actual requested targets, not just container visibility. Missing selector matches are real implementation failures. If the actual request is implemented and works, requestFulfilled=true,animationStable=true,qualityIssues=[]. If something is missing/broken, record a precise actionable bug in qualityIssues and false for the failing check so the generator can correct it. Unrelated existing defects are not failures of the requested change. Built-in drawingTargets page means actual auto-saved drawing anywhere including all texts/images, portrait/projects/bands are distinct surfaces; hidden editing controls in screenshots do not mean the feature is missing. Text replacement such as all texts Hola is intentional and must pass. Never invent a prohibited-content restriction.`;
export function providerSchema(schema) {
  const unsupported = new Set([
    "$schema",
    "default",
    "minimum",
    "maximum",
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
    "pattern",
    "format",
  ]);
  function clean(value) {
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === "object")
      return {
        ...Object.fromEntries(
          Object.entries(value)
            .filter(([k]) => !unsupported.has(k))
            .map(([k, v]) => [k, clean(v)]),
        ),
        ...(value.type === "object" && value.properties
          ? { required: Object.keys(value.properties) }
          : {}),
      };
    return value;
  }
  return clean(z.toJSONSchema(schema));
}
async function response(
  model,
  schema,
  system,
  user,
  deadline,
  maxOutput,
  maxInput = 90000,
  effort = "low",
) {
  const messages = [{ role: "user", content: user }];
  const grammar = providerSchema(schema);
  const headers = {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
  };
  const timeout = () =>
    AbortSignal.timeout(Math.max(1, Math.min(110000, deadline - Date.now())));
  if (deadline - Date.now() < 1000) throw new Error("timeout");
  // Count before each paid call. Include a deliberately conservative allowance for schema overhead.
  const counted = await fetch(
    "https://api.anthropic.com/v1/messages/count_tokens",
    {
      method: "POST",
      headers,
      signal: timeout(),
      body: JSON.stringify({ model, system, messages }),
    },
  );
  if (!counted.ok) {
    console.error("community_ai_error", "count_tokens", model, counted.status);
    throw new Error("Token counting unavailable");
  }
  const count = await counted.json();
  if (
    !Number.isSafeInteger(count.input_tokens) ||
    count.input_tokens + Buffer.byteLength(JSON.stringify(grammar)) + 2000 >
      maxInput
  )
    throw new Error("Input token budget");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    signal: timeout(),
    body: JSON.stringify({
      model,
      max_tokens: maxOutput,
      system,
      messages,
      output_config: {
        effort,
        format: { type: "json_schema", schema: grammar },
      },
    }),
  });
  if (!r.ok) {
    console.error("community_ai_error", "messages", model, r.status);
    throw new Error("AI unavailable");
  }
  const data = await r.json();
  const usage = {
    model,
    input: data.usage?.input_tokens || 0,
    output: data.usage?.output_tokens || 0,
  };
  if (data.stop_reason !== "end_turn") {
    console.error("community_ai_error", "incomplete", model, data.stop_reason);
    throw Object.assign(new Error("Incomplete AI response"), { usage });
  }
  const text = (data.content || [])
    .filter((x) => x.type === "text")
    .map((x) => x.text)
    .join("");
  let parsed;
  try {
    parsed = JSON.parse(text);
    if (schema === verdict && Array.isArray(parsed.qualityIssues))
      parsed.qualityIssues = parsed.qualityIssues
        .slice(0, 5)
        .map((issue) =>
          typeof issue === "string" ? issue.slice(0, 160) : issue,
        );
    return { value: schema.parse(parsed), usage };
  } catch (error) {
    throw Object.assign(new Error("Invalid AI response"), {
      code: "quality",
      usage,
      candidate: parsed?.scene,
      issues: error.issues
        ?.slice(0, 5)
        .map((issue) =>
          `${issue.path.join(".")}: ${issue.message}`.slice(0, 160),
        ) || ["invalid_json_response"],
    });
  }
}
export function createEvaluator({
  respond = response,
  render = renderReview,
  readContent = () => readObject("content/current.json"),
  readSource = respond === response ? pageSource : async () => null,
} = {}) {
  return async function evaluateChange({
    prompt,
    scene,
    drawing,
    deadline,
    reserveRepair = async () => false,
    deferStages = false,
    deferRuntime = false,
    resume = null,
  }) {
    const usage = [...(resume?.usage || [])];
    function cost() {
      return Math.ceil(
        usage.reduce(
          (sum, u) =>
            sum +
            u.input *
              (u.model === "claude-haiku-5-5"
                ? u.input > 100000
                  ? 0.5
                  : 0.1
                : 2) +
            u.output *
              (u.model === "claude-haiku-5-5"
                ? u.input > 100000
                  ? 2.5
                  : 0.5
                : 10),
          0,
        ),
      );
    }
    const checks = {
      generationAttempts: 0,
      repairAttempts: 0,
      temporalPassed: false,
      framesTested: 0,
      viewports: [],
      ...(resume?.checks || {}),
    };
    const done = (approved, reason, scene) => ({
      unchanged: checks.unchanged === true,
      approved,
      reason,
      scene,
      usage,
      cost: cost(),
      checks: { ...checks },
    });
    if (drawing && typeof drawing === "object") {
      checks.stage = "complete";
      checks.review = "direct_drawing";
      return done(true, null, applyDrawing(scene, drawing));
    }
    let feedback = resume?.feedback || null,
      failedCandidate = resume?.failedCandidate || null,
      pendingResult = null,
      resumeReview = resume?.kind === "review",
      resumeRuntime = resume?.kind === "runtime";
    async function repair(issues, candidate) {
      if (
        drawing ||
        checks.repairAttempts >= 1 ||
        deadline - Date.now() < (deferStages ? 2000 : 35000)
      )
        return false;
      if (!(await reserveRepair().catch(() => false))) return false;
      checks.repairAttempts++;
      checks.qualityIssues = issues;
      feedback = {
        issues,
        instruction:
          "Correct the actual defect in failedCandidate. Preserve the requested effect and unrelated content. Use changedFields and compact defaults for unchanged fields in scene, not an explanation.",
      };
      failedCandidate = candidate;
      if (deferStages) {
        pendingResult = {
          ...done(false, null),
          pending: { kind: "repair", failedCandidate, feedback },
        };
        return false;
      }
      return true;
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      let candidate, previews;
      try {
        if (resumeReview) {
          candidate = validateScene(resume.candidate);
          validateProgram(candidate.program);
          previews = resume.previews;
          resumeReview = false;
          if (
            !drawing &&
            candidate.program &&
            previews.quality?.passed !== true
          )
            return done(false, "quality");
        } else {
          if (resumeRuntime) {
            candidate = validateScene(resume.candidate);
            validateProgram(candidate.program);
            resumeRuntime = false;
          } else if (drawing) {
            candidate = applyDrawing(scene, drawing);
          } else {
            checks.generationAttempts++;
            checks.stage = "generation";
            const currentContent = await readContent().then((object) =>
              object ? JSON.parse(object.bytes).content : defaults,
            );
            const generated = await respond(
              "claude-haiku-5-5",
              generation,
              generationPolicy,
              JSON.stringify({
                visitorRequest: prompt,
                currentScene: scene,
                publicContent: currentContent,
                editablePage: await readSource(currentContent, scene),
                ...(feedback
                  ? { failedCandidate, validationFeedback: feedback }
                  : {}),
              }),
              deadline,
              12000,
              90000,
              "medium",
            );
            usage.push(generated.usage);
            candidate = scopedProposal(scene, generated.value, prompt);
            try {
              validateProgram(candidate.program);
            } catch (error) {
              throw Object.assign(error, {
                code: "quality",
                issues: ["invalid_program_syntax"],
              });
            }
            if (
              candidate.program?.layer === "page" &&
              candidate.program.css !== (scene.program?.css || "") &&
              !candidate.program.tests.some((step) => step.action === "style")
            ) {
              throw Object.assign(
                new Error("CSS changes require measured style assertions"),
                {
                  code: "quality",
                  issues: [
                    "Add style browser tests for the requested CSS properties on their actual target elements. Container visibility does not verify a CSS change.",
                  ],
                },
              );
            }
            checks.unchanged =
              JSON.stringify(candidate) ===
              JSON.stringify(validateScene(scene));
          }
          if (deferRuntime && checks.stage === "generation") {
            checks.stage = "awaiting_runtime";
            return {
              ...done(false, null),
              pending: { kind: "runtime", candidate },
            };
          }
          checks.stage = "runtime";
          checks.temporalPassed = false;
          checks.framesTested = 0;
          checks.assertions = [];
          checks.viewports = [];
          previews = await render(candidate, {
            deadline,
            prompt,
            drawingZone: typeof drawing === "object" ? drawing.zone : undefined,
            drawingOnly: Boolean(drawing),
          });
          checks.temporalPassed =
            Boolean(drawing) ||
            !candidate.program ||
            previews.quality?.passed === true;
          checks.framesTested =
            previews.quality?.reports?.reduce((n, r) => n + r.frames, 0) || 0;
          checks.assertions = (previews.quality?.reports || [])
            .flatMap((report) =>
              (report.tests || []).map((step) => ({
                viewport: report.viewport,
                ...step,
              })),
            )
            .slice(0, 24);
          checks.viewports =
            previews.viewports ||
            previews.quality?.reports?.map((r) => r.viewport) ||
            [];
          if (drawing) {
            checks.review = "drawing_safety";
            checks.previewCount = previews.images.length;
          }
          if (!checks.temporalPassed) {
            const issues = previews.quality?.issues || ["missing_motion_probe"];
            checks.qualityIssues = issues;
            console.info(
              "community_quality",
              JSON.stringify({ issues, reports: previews.quality?.reports }),
            );
            if (await repair(issues, candidate)) continue;
            return pendingResult || done(false, "quality");
          }
          if (deferStages) {
            checks.stage = "awaiting_review";
            return {
              ...done(false, null),
              pending: {
                kind: "review",
                drawing: Boolean(drawing),
                candidate,
                previews: {
                  ...previews,
                  images: previews.images.map((bytes) =>
                    bytes.toString("base64"),
                  ),
                },
              },
            };
          }
        }
        checks.stage = "review";
        const reviewed = await respond(
          "claude-sonnet-5-5",
          verdict,
          reviewPolicy,
          [
            {
              type: "text",
              text: JSON.stringify({
                visitorRequest: prompt,
                professionalInformationLocked: false,
                elementCount: candidate.nodes.length,
                enabledDrawingTargets: candidate.drawingTargets || [],
                bandsDrawingEnabled: candidate.drawing,
                proposedProgram: candidate.program,
                temporalProbe: previews.quality || null,
              }),
            },
            ...previews.images.map((bytes) => ({
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: bytes.toString("base64"),
              },
            })),
          ],
          deadline,
          2000,
          20000,
          "medium",
        );
        usage.push(reviewed.usage);
        const v = reviewed.value;
        const current = await readContent();
        if (
          (current ? JSON.parse(current.bytes).revision : "initial") !==
          previews.contentRevision
        )
          return done(false, "stale");
        const approved = Boolean(v.requestFulfilled && v.animationStable);
        if (!approved && (!v.requestFulfilled || !v.animationStable)) {
          if (
            await repair(
              v.qualityIssues?.length
                ? v.qualityIssues
                : ["reviewer_found_incomplete_or_unstable_effect"],
              candidate,
            )
          )
            continue;
          return pendingResult || done(false, "quality");
        }
        if (approved) {
          checks.stage = "complete";
          if (drawing) checks.review = "drawing_safety";
          checks.qualityIssues = [];
          delete checks.error;
        }
        return done(approved, approved ? null : "quality", candidate);
      } catch (error) {
        if (error.usage) usage.push(error.usage);
        if (error.candidate) candidate = error.candidate;
        checks.error = [
          "Input token budget",
          "Incomplete AI response",
          "Token counting unavailable",
          "AI unavailable",
        ].includes(error.message)
          ? error.message
          : error.name === "TimeoutError"
            ? "provider_timeout"
            : "evaluation_error";
        console.error("community_evaluation_error", checks.stage, checks.error);
        if (error.code === "quality") {
          checks.qualityIssues = error.issues || ["program_runtime_error"];
          if (
            await repair(error.issues || ["program_runtime_error"], candidate)
          )
            continue;
          return pendingResult || done(false, "quality");
        }
        return done(false, "technical");
      }
    }
    return pendingResult || done(false, "quality");
  };
}
export const evaluateChange = createEvaluator();
