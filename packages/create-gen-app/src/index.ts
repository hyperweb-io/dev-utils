import * as fs from "fs";
import * as path from "path";

import { normalizeCacheOptions, prepareTemplateDirectory } from "./cache";
import { extractVariables } from "./extract";
import { promptUser } from "./prompt";
import { replaceVariables } from "./replace";
import { CreateGenOptions } from "./types";

export * from "./cache";
export * from "./clone";
export * from "./extract";
export * from "./prompt";
export * from "./replace";
export * from "./types";

/**
 * Create a new project from a template repository
 * @param options - Options for creating the project
 * @returns Path to the generated project
 */
export async function createGen(options: CreateGenOptions): Promise<string> {
  const {
    templateUrl,
    outputDir,
    argv = {},
    noTty = false,
    fromBranch,
    fromPath,
    cache,
  } = options;

  const cacheConfig = normalizeCacheOptions(cache);

  console.log(`Preparing template from ${templateUrl}...`);
  const templateSource = await prepareTemplateDirectory({
    templateUrl,
    branch: fromBranch,
    cache: cacheConfig,
  });

  if (cacheConfig.enabled) {
    console.log(
      templateSource.cacheUsed
        ? "Using cached repository"
        : "Caching repository for future runs..."
    );
  } else {
    console.log("Cloning repository without cache...");
  }

  const normalizedPath = fromPath ? path.normalize(fromPath) : ".";
  const templateRoot =
    normalizedPath && normalizedPath !== "."
      ? path.join(templateSource.templateDir, normalizedPath)
      : templateSource.templateDir;

  try {
    if (!fs.existsSync(templateRoot)) {
      throw new Error(
        `Template path "${fromPath}" does not exist in repository ${templateUrl}.`
      );
    }
    console.log("Extracting template variables...");
    const extractedVariables = await extractVariables(templateRoot);

    console.log(`Found ${extractedVariables.fileReplacers.length} file replacers`);
    console.log(`Found ${extractedVariables.contentReplacers.length} content replacers`);
    if (extractedVariables.projectQuestions) {
      console.log(`Found ${extractedVariables.projectQuestions.questions.length} project questions`);
    }

    console.log("Prompting for variable values...");
    const answers = await promptUser(extractedVariables, argv, noTty);

    console.log(`Generating project in ${outputDir}...`);
    await replaceVariables(templateRoot, outputDir, extractedVariables, answers);

    console.log("Project created successfully!");

    return outputDir;
  } finally {
    templateSource.cleanup();
  }
}
