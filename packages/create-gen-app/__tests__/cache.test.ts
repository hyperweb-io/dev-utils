import * as childProcess from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { createGen } from "../src";
import {
  TEST_BRANCH,
  TEST_REPO,
  TEST_TEMPLATE,
  buildAnswers,
  cleanupWorkspace,
  createTempWorkspace,
} from "../test-utils/integration-helpers";

jest.setTimeout(180_000);

describe("template caching (appstash)", () => {
  let tempBaseDir: string;
  const cacheTool = `pgpm-cache-${Date.now()}`;

  beforeEach(() => {
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-gen-cache-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true });
    }
  });

  it("reuses cached repositories across runs when cache is enabled", async () => {
    const cacheOptions = {
      toolName: cacheTool,
      baseDir: tempBaseDir,
      enabled: true,
    };

    const firstWorkspace = createTempWorkspace("cache-first");
    const firstAnswers = buildAnswers("cache-first");

    try {
      await createGen({
        templateUrl: TEST_REPO,
        fromBranch: TEST_BRANCH,
        fromPath: TEST_TEMPLATE,
        outputDir: firstWorkspace.outputDir,
        argv: firstAnswers,
        noTty: true,
        cache: cacheOptions,
      });
    } finally {
      cleanupWorkspace(firstWorkspace);
    }

    const repoCacheDir = path.join(tempBaseDir, `.${cacheTool}`, "cache", "repos");
    expect(fs.existsSync(repoCacheDir)).toBe(true);
    const cachedEntries = fs.readdirSync(repoCacheDir);
    expect(cachedEntries.length).toBeGreaterThan(0);

    const secondWorkspace = createTempWorkspace("cache-second");
    const secondAnswers = buildAnswers("cache-second");
    const execSpy = jest.spyOn(childProcess, "execSync");

    try {
      await createGen({
        templateUrl: TEST_REPO,
        fromBranch: TEST_BRANCH,
        fromPath: TEST_TEMPLATE,
        outputDir: secondWorkspace.outputDir,
        argv: secondAnswers,
        noTty: true,
        cache: cacheOptions,
      });

      const cloneCalls = execSpy.mock.calls.filter(([command]) => {
        return typeof command === "string" && command.includes("git clone");
      });

      expect(cloneCalls.length).toBe(0);
    } finally {
      execSpy.mockRestore();
      cleanupWorkspace(secondWorkspace);
    }
  });
});


