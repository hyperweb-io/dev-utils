import { execSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import { appstash, resolve as resolveAppstash } from "appstash";

import { CacheOptions } from "./types";
import { cloneRepo, normalizeGitUrl } from "./clone";

const DEFAULT_TOOL = "pgpm";

interface NormalizedCacheOptions {
  enabled: boolean;
  toolName: string;
  baseDir?: string;
}

export interface TemplateSource {
  templateDir: string;
  cacheUsed: boolean;
  cleanup: () => void;
}

interface PrepareTemplateArgs {
  templateUrl: string;
  branch?: string;
  cache: NormalizedCacheOptions;
}

export function normalizeCacheOptions(cache?: CacheOptions | false): NormalizedCacheOptions {
  if (cache === false) {
    return {
      enabled: false,
      toolName: DEFAULT_TOOL,
    };
  }

  const { enabled, toolName, baseDir } = cache ?? {};

  return {
    enabled: enabled !== false,
    toolName: toolName ?? DEFAULT_TOOL,
    baseDir,
  };
}

export async function prepareTemplateDirectory(args: PrepareTemplateArgs): Promise<TemplateSource> {
  const { templateUrl, branch, cache } = args;

  if (!cache.enabled) {
    const tempDir = await cloneRepo(templateUrl, { branch });
    return {
      templateDir: tempDir,
      cacheUsed: false,
      cleanup: () => cleanupDir(tempDir),
    };
  }

  const { cachePath } = ensureCachePath(templateUrl, branch, cache);

  if (fs.existsSync(cachePath)) {
    return {
      templateDir: cachePath,
      cacheUsed: true,
      cleanup: () => {},
    };
  }

  cloneInto(templateUrl, cachePath, branch);

  return {
    templateDir: cachePath,
    cacheUsed: false,
    cleanup: () => {},
  };
}

function ensureCachePath(
  templateUrl: string,
  branch: string | undefined,
  cache: NormalizedCacheOptions
): { cachePath: string } {
  const dirs = appstash(cache.toolName, {
    ensure: true,
    baseDir: cache.baseDir,
  });

  const reposDir = resolveAppstash(dirs, "cache", "repos");
  if (!fs.existsSync(reposDir)) {
    fs.mkdirSync(reposDir, { recursive: true });
  }

  const key = createCacheKey(templateUrl, branch);
  const cachePath = path.join(reposDir, key);

  return { cachePath };
}

function createCacheKey(templateUrl: string, branch?: string): string {
  const gitUrl = normalizeGitUrl(templateUrl);
  return crypto.createHash("md5").update(`${gitUrl}#${branch ?? "default"}`).digest("hex");
}

function cloneInto(templateUrl: string, destination: string, branch?: string): void {
  if (fs.existsSync(destination)) {
    fs.rmSync(destination, { recursive: true, force: true });
  }

  const gitUrl = normalizeGitUrl(templateUrl);
  const branchArgs = branch ? ` --branch ${branch} --single-branch` : "";
  const depthArgs = " --depth 1";

  execSync(`git clone${branchArgs}${depthArgs} ${gitUrl} ${destination}`, {
    stdio: "inherit",
  });

  const gitDir = path.join(destination, ".git");
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
}

function cleanupDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}


