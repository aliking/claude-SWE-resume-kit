#!/usr/bin/env node
"use strict";

const fs = require("fs");

function parseArgs(argv) {
  let inputPath = null;
  let overlapDays = 7;
  let quiet = false;

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input" && argv[i + 1]) {
      inputPath = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--overlap-days" && argv[i + 1]) {
      overlapDays = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i] === "--quiet") {
      quiet = true;
    }
  }

  return { inputPath, overlapDays, quiet };
}

function parseGeneratedAt(raw) {
  if (!raw) {
    return null;
  }

  if (typeof raw !== "string") {
    return null;
  }

  // Handles exporter format: "YYYY-MM-DD HH:MM UTC"
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+UTC$/);
  if (match) {
    const parsed = new Date(`${match[1]}T${match[2]}:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function main() {
  const { inputPath, overlapDays, quiet } = parseArgs(process.argv.slice(2));

  if (!inputPath) {
    process.stderr.write(
      "ERROR: --input <export_json_path> is required.\n" +
      "Example: node scripts/derive_export_start_date.js --input knowledge_base/sources/supporting_docs/animoto_contributions.json\n"
    );
    process.exit(1);
  }

  if (!Number.isFinite(overlapDays) || overlapDays < 0) {
    process.stderr.write("ERROR: --overlap-days must be a non-negative number.\n");
    process.exit(1);
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    process.stderr.write(`ERROR: Failed to read JSON from ${inputPath}: ${error.message}\n`);
    process.exit(1);
  }

  const generatedAt = parseGeneratedAt(parsedJson.generated_at);
  if (!generatedAt) {
    process.stderr.write(
      "ERROR: Could not parse generated_at from export JSON.\n" +
      "       Ensure the file was produced by scripts/export_github_contributions.js.\n"
    );
    process.exit(1);
  }

  const overlapMs = overlapDays * 24 * 60 * 60 * 1000;
  const recommendedStart = new Date(generatedAt.getTime() - overlapMs).toISOString();

  if (quiet) {
    process.stdout.write(`${recommendedStart}\n`);
    return;
  }

  process.stdout.write(
    `Input file: ${inputPath}\n` +
    `Previous export generated_at: ${generatedAt.toISOString()}\n` +
    `Overlap days: ${overlapDays}\n` +
    `Recommended --start-date: ${recommendedStart}\n\n` +
    "Example:\n" +
    `GITHUB_TOKEN=<token> GITHUB_TARGET=<target_login> node scripts/export_github_contributions.js --org <org_name> --start-date ${recommendedStart}\n`
  );
}

main();
