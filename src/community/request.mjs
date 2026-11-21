export async function api(path, options = {}) {
  const r = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "unavailable");
  return d;
}

export async function follow(id) {
  for (let i = 0; i < 145; i++) {
    let d = await api("/api/community/changes/" + id);
    if (d.continueRequired) {
      try {
        d = await api("/api/community/changes/" + id, {
          method: "POST",
          body: JSON.stringify({ step: d.step }),
        });
      } catch (error) {
        if (
          ![
            "Failed to fetch",
            "NetworkError when attempting to fetch resource.",
            "unavailable",
            "technical",
          ].includes(error.message)
        )
          throw error;
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
    }
    if (d.status !== "processing") return d;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("timeout");
}
