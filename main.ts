// Entry program for the make.fun "agent builds a game" post bounty.
//
// The whole job of this program is deliberately tiny: the gate wants the
// entry's POST.json (the file that names the X post carrying the video)
// reproduced in the output directory, byte for byte. So we locate the
// repository root, read POST.json from it, make sure the output directory
// exists, and write the same bytes there under the same name.
//
// Success is silent. Anything that goes wrong is reported on stderr and
// ends the process with exit code 1. No network, no clock, no randomness:
// the same input always produces the same output.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function fail(message: string): never {
  process.stderr.write(`main.ts: ${message}\n`);
  process.exit(1);
}

function main(): void {
  const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

  const sourcePath = join(botDir, "POST.json");
  let payload: Buffer;
  try {
    payload = readFileSync(sourcePath);
  } catch {
    fail(`cannot read ${sourcePath}`);
  }

  // Guard against a malformed entry file: POST.json must be a JSON object
  // whose "url" names the post, so check that before anything is copied.
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.toString("utf8"));
  } catch {
    fail(`${sourcePath} is not valid JSON`);
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { url?: unknown }).url !== "string"
  ) {
    fail(`${sourcePath} must be a JSON object with a string "url"`);
  }

  try {
    mkdirSync(outputDir, { recursive: true });
  } catch {
    fail(`cannot create output directory ${outputDir}`);
  }

  const targetPath = join(outputDir, "POST.json");
  try {
    writeFileSync(targetPath, payload);
  } catch {
    fail(`cannot write ${targetPath}`);
  }
}

main();
