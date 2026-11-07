import { expect, test } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const cwd = fileURLToPath(new URL("..", import.meta.url));

test("the CLI prints help", async () => {
  const { stdout } = await run(process.execPath, ["--import", "tsx", "src/cli.ts", "--help"], { cwd });
  expect(stdout).toContain("--format");
});

test("invalid CLI quality returns a nonzero exit code", async () => {
  await expect(run(process.execPath, ["--import", "tsx", "src/cli.ts", "--quality", "101"], { cwd }))
    .rejects.toMatchObject({ code: 1 });
});
