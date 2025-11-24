import { execSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { appstash, resolve } from 'appstash';
import { replaceVariables, extractVariables } from 'create-gen-app';

export interface CachedTemplateOptions {
  templateUrl: string;
  outputDir: string;
  answers: Record<string, any>;
  cacheTool?: string;
}

export interface CachedTemplateResult {
  outputDir: string;
  cacheUsed: boolean;
  cachePath?: string;
}

/**
 * Get cached repository from appstash cache directory
 * @param templateUrl - Repository URL
 * @param cacheTool - Tool name for appstash (default: 'mymodule')
 * @returns Cached repository path or null if not found
 */
export function getCachedRepo(templateUrl: string, cacheTool: string = 'mymodule'): string | null {
  const dirs = appstash(cacheTool, { ensure: true });
  const repoHash = crypto.createHash('md5').update(templateUrl).digest('hex');
  const cachePath = resolve(dirs, 'cache', 'repos', repoHash);

  if (fs.existsSync(cachePath)) {
    return cachePath;
  }

  return null;
}

/**
 * Clone repository to cache
 * @param templateUrl - Repository URL
 * @param cacheTool - Tool name for appstash (default: 'mymodule')
 * @returns Path to cached repository
 */
export function cloneToCache(templateUrl: string, cacheTool: string = 'mymodule'): string {
  const dirs = appstash(cacheTool, { ensure: true });
  const repoHash = crypto.createHash('md5').update(templateUrl).digest('hex');
  const cachePath = resolve(dirs, 'cache', 'repos', repoHash);

  if (!fs.existsSync(path.dirname(cachePath))) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  }

  const gitUrl = normalizeGitUrl(templateUrl);

  execSync(`git clone ${gitUrl} ${cachePath}`, {
    stdio: 'inherit'
  });

  const gitDir = path.join(cachePath, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  return cachePath;
}

/**
 * Normalize a URL to a git-cloneable format
 * @param url - Input URL
 * @returns Normalized git URL
 */
function normalizeGitUrl(url: string): string {
  if (url.startsWith('git@') || url.startsWith('https://') || url.startsWith('http://')) {
    return url;
  }

  if (/^[\w-]+\/[\w-]+$/.test(url)) {
    return `https://github.com/${url}.git`;
  }

  return url;
}

/**
 * Create project from cached template
 * @param options - Options for creating from cached template
 * @returns Result with output directory and cache information
 */
export async function createFromCachedTemplate(options: CachedTemplateOptions): Promise<CachedTemplateResult> {
  const { templateUrl, outputDir, answers, cacheTool = 'mymodule' } = options;

  let templateDir: string;
  let cacheUsed = false;
  let cachePath: string | undefined;

  const cachedRepo = getCachedRepo(templateUrl, cacheTool);

  if (cachedRepo) {
    console.log(`Using cached template from ${cachedRepo}`);
    templateDir = cachedRepo;
    cacheUsed = true;
    cachePath = cachedRepo;
  } else {
    console.log(`Cloning template to cache from ${templateUrl}`);
    templateDir = cloneToCache(templateUrl, cacheTool);
    cachePath = templateDir;
  }

  const extractedVariables = await extractVariables(templateDir);

  await replaceVariables(templateDir, outputDir, extractedVariables, answers);

  return {
    outputDir,
    cacheUsed,
    cachePath
  };
}
