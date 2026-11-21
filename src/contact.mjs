const endpoint = "https://formspree.io/f/xpzedzvr";
export async function deliverContact(body, signal) {
  const response = await fetch(endpoint, {
    method: "POST",
    body,
    headers: { Accept: "application/json" },
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal,
  });
  if (!response.ok) throw new Error("Message delivery failed");
}
export function contactPayload(value) {
  if (!value || typeof value !== "object") throw new Error("Invalid contact");
  const form = new FormData();
  for (const [key, min, max] of [
    ["name", 1, 120],
    ["email", 3, 254],
    ["message", 10, 5000],
    ["_gotcha", 0, 120],
  ]) {
    const text = value[key] ?? "";
    if (typeof text !== "string" || text.length < min || text.length > max)
      throw new Error("Invalid contact");
    form.set(key, text);
  }
  return form;
}
