import { readFile, writeFile } from "node:fs/promises";
const names = ["react", "react-dom", "scheduler"];
const notices = await Promise.all(names.map(async name => {
  const license = await readFile(`node_modules/${name}/LICENSE`, "utf8");
  return `${name}\n${"=".repeat(name.length)}\n${license.trim()}\n`;
}));
await writeFile("public/THIRD_PARTY_LICENSES.txt", notices.join("\n"));
