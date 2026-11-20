import { Script } from "node:vm";
export function validateProgram(program) {
  if (!program) return;
  if (
    program.html.length + program.css.length + program.javascript.length >
    24000
  )
    throw new Error("Program source too large");
  // Parse only. Generated JavaScript is NEVER evaluated in Node or the API process.
  new Script(
    `(()=>{${program.javascript}\n;return typeof render==='function'?render:null;})`,
  );
}
