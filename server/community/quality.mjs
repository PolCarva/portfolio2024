export function assessProgramQuality(
  reports,
  prompt = "",
  { canvasExpected = true } = {},
) {
  if (!Array.isArray(reports) || reports.length !== 2)
    return { passed: false, issues: ["missing_desktop_or_mobile_probe"] };
  const issues = [];
  const continuous =
    /cursor|puntero|mouse|burbuj|bubble|rastro|trail|part[ií]cul|smooth|suav/i.test(
      prompt,
    ) &&
    (!/parpade|blink|flash|flicker|estrob/i.test(prompt) ||
      /arregl|correg|fix|remove|sin |evit|stop|no /i.test(prompt));
  for (const report of reports) {
    const prefix = report.viewport;
    if (report.status !== "ready" || report.errors)
      issues.push(prefix + ":runtime_error");
    if (report.presentationGaps)
      issues.push(prefix + ":canvas_cleared_while_waiting");
    const samples = report.samples || [],
      moving = samples.filter((s) => s.phase === "moving"),
      paused = samples.filter((s) => s.phase === "paused");
    if (samples.length < 20 || moving.length < 8 || paused.length < 2)
      issues.push(prefix + ":incomplete_motion_test");
    const times = samples.map((s) => s.ms).sort((a, b) => a - b),
      p95 = times[Math.floor(times.length * 0.95)] || 0;
    if (p95 > 150) issues.push(prefix + ":slow_frames");
    if (
      continuous &&
      canvasExpected &&
      moving.filter((s) => s.alpha > 10).length < 5
    )
      issues.push(prefix + ":no_visible_pointer_effect");
    let gaps = 0;
    for (let i = 1; i < samples.length - 1; i++)
      if (
        samples[i - 1].phase === "moving" &&
        samples[i].phase === "moving" &&
        samples[i + 1].phase === "moving" &&
        samples[i - 1].alpha > 10 &&
        samples[i].alpha === 0 &&
        samples[i + 1].alpha > 10
      )
        gaps++;
    if (continuous && gaps >= 3)
      issues.push(prefix + ":intermittent_blank_frames");
  }
  return {
    passed: issues.length === 0,
    issues,
    reports: reports.map((r) => {
      const samples = r.samples || [],
        times = samples.map((s) => s.ms).sort((a, b) => a - b);
      return {
        viewport: r.viewport,
        frames: r.frames,
        errors: r.errors,
        presentationGaps: r.presentationGaps,
        movingFrames: samples.filter((s) => s.phase === "moving").length,
        pausedFrames: samples.filter((s) => s.phase === "paused").length,
        visibleFrames: samples.filter((s) => s.alpha > 10).length,
        p95FrameMs: times[Math.floor(times.length * 0.95)] || 0,
      };
    }),
  };
}
