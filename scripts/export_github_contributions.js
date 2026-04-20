#!/usr/bin/env node
/**
 * GitHub Contributions Exporter
 *
 * Finds all contributions made by a TARGET user within one of these scopes:
 *   1) a GitHub organization (--org),
 *   2) one or more specific repositories (--repo), or
 *   3) all public repositories owned by the target user (default when scope is omitted).
 *
 * Writes JSON output suitable for resume knowledge-base extraction.
 *
 * ZERO DEPENDENCIES — uses only built-in Node.js (v18+). No npm install needed.
 *
 * ─── SETUP ───────────────────────────────────────────────────────────────────
 *
 *   Two env vars are required:
 *
 *   GITHUB_TOKEN   Your personal access token. Must have 'repo' scope (or at
 *                  minimum read access to the org's private repos). This is
 *                  YOUR token — the person running the script.
 *
 *   GITHUB_TARGET  The GitHub username whose contributions you want to find.
 *                  This is the OTHER person — the one whose resume you're
 *                  building data for. Their token is NOT needed.
 *
 * ─── USAGE ───────────────────────────────────────────────────────────────────
 *
 *   Basic (scan whole org):
 *     GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=their-login node export_github_contributions.js --org <org_name>
 *
 *   Scan one specific repo (useful for personal/public repos):
 *     GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=their-login node export_github_contributions.js --repo owner/repo
 *
 *   Scan multiple specific repos:
 *     GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=their-login node export_github_contributions.js --repo owner/repo1 --repo owner/repo2
 *
 *   Scan all public repos owned by target user (default scope):
 *     GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=their-login node export_github_contributions.js
 *
 *   Test mode (stop after the first repo with contributions):
 *     GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=their-login node export_github_contributions.js --org <org_name> --test

 *   Incremental run from a date (ISO-8601):
 *     GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=their-login node export_github_contributions.js --org <org_name> --start-date 2025-01-01
 *
 *   Custom output file name:
 *     GITHUB_TOKEN=ghp_xxx GITHUB_TARGET=their-login node export_github_contributions.js --org <org_name> --output my_output
 *
 *   If no --org/--repo scope is provided, target-owned public repos are scanned.
 *
 * ─── OUTPUTS ─────────────────────────────────────────────────────────────────
 *
 *   <output>.json Full raw data for extraction
 *
 *   The file is written in the current working directory.
 *
 * ─── WHAT IT COLLECTS (per repo) ─────────────────────────────────────────────
 *
 *   • Repo metadata (only Description, languages, and basic info) IF target user has contributions in the repo
 *   • Stats about pull requests authored by the target user
 *   • PR reviews written by the target user (with inline comments)
 *   • Issues opened by the target user
 *   • Issue/PR comments written by the target user
 *   • Commit date and messages authored by the target user (up to 500 per repo)
 */

"use strict";

const fs   = require("fs");

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const GITHUB_API         = "https://api.github.com";
const PER_PAGE           = 100;
const RATE_PAUSE_MS      = 250;   // 250 ms between requests → well under 5000/hr
const MAX_COMMITS_PER_REPO = 500;

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function getFileExtension(filePath) {
  const normalizedPath = (filePath || "").toLowerCase();
  const lastSegment = normalizedPath.split("/").pop() || "";

  if (!lastSegment.includes(".")) {
    return "[no extension]";
  }

  return `.${lastSegment.split(".").pop()}`;
}

function isDocumentationFile(filePath) {
  const normalizedPath = (filePath || "").toLowerCase();
  const lastSegment = normalizedPath.split("/").pop() || "";

  return normalizedPath.includes("/docs/") ||
    normalizedPath.startsWith("docs/") ||
    normalizedPath.includes("/documentation/") ||
    normalizedPath.startsWith("documentation/") ||
    ["readme", "changelog", "contributing", "license", "authors", "notice"].some((prefix) => lastSegment.startsWith(prefix)) ||
    [".md", ".mdx", ".rst", ".adoc", ".txt"].includes(getFileExtension(filePath));
}

function isTestFile(filePath) {
  const normalizedPath = (filePath || "").toLowerCase();
  const lastSegment = normalizedPath.split("/").pop() || "";

  return normalizedPath.includes("/test/") ||
    normalizedPath.includes("/tests/") ||
    normalizedPath.includes("/spec/") ||
    normalizedPath.includes("__tests__") ||
    lastSegment.includes(".test.") ||
    lastSegment.includes(".spec.") ||
    lastSegment.startsWith("test_");
}

function isAutomationFile(filePath) {
  const normalizedPath = (filePath || "").toLowerCase();

  return normalizedPath.startsWith(".github/") ||
    normalizedPath.includes("/workflows/") ||
    normalizedPath.includes("/actions/") ||
    normalizedPath.includes("/ci/") ||
    normalizedPath.endsWith("dockerfile") ||
    normalizedPath.endsWith("docker-compose.yml") ||
    normalizedPath.endsWith("docker-compose.yaml") ||
    normalizedPath.endsWith("makefile") ||
    normalizedPath.endsWith("jenkinsfile");
}

function summarizePullRequestFiles(files) {
  const statusCounts = { added: 0, modified: 0, removed: 0, renamed: 0, changed: 0 };
  const extensionMap = new Map();
  let docsFiles = 0;
  let testFiles = 0;
  let automationFiles = 0;

  for (const file of files) {
    const status = file.status || "changed";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const extension = getFileExtension(file.filename);
    const current = extensionMap.get(extension) || { extension, files: 0, additions: 0, deletions: 0, changes: 0 };
    current.files += 1;
    current.additions += file.additions ?? 0;
    current.deletions += file.deletions ?? 0;
    current.changes += file.changes ?? 0;
    extensionMap.set(extension, current);

    if (isDocumentationFile(file.filename) || (file.previous_filename && isDocumentationFile(file.previous_filename))) {
      docsFiles += 1;
    }
    if (isTestFile(file.filename) || (file.previous_filename && isTestFile(file.previous_filename))) {
      testFiles += 1;
    }
    if (isAutomationFile(file.filename) || (file.previous_filename && isAutomationFile(file.previous_filename))) {
      automationFiles += 1;
    }
  }

  return {
    total_files: files.length,
    new_files: statusCounts.added,
    updated_files: statusCounts.modified + statusCounts.renamed + statusCounts.changed,
    deleted_files: statusCounts.removed,
    renamed_files: statusCounts.renamed,
    documentation_files: docsFiles,
    test_files: testFiles,
    automation_files: automationFiles,
    status_counts: statusCounts,
    extension_breakdown: Array.from(extensionMap.values())
      .sort((left, right) => right.files - left.files || right.changes - left.changes)
      .slice(0, 8),
  };
}

// ─────────────────────────────────────────────────────────────
// Argument parsing
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const argv   = process.argv.slice(2);
  let org      = null;
  let testMode = false;
  let output   = null;
  let startDate = null;
  const repoTargets = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--test") {
      testMode = true;
    } else if (argv[i] === "--org" && argv[i + 1]) {
      org = argv[++i];
    } else if (argv[i] === "--start-date" && argv[i + 1]) {
      startDate = argv[++i];
    } else if (argv[i] === "--output" && argv[i + 1]) {
      output = argv[++i];
    } else if (argv[i] === "--repo" && argv[i + 1]) {
      repoTargets.push(argv[++i]);
    }
  }

  return { org, testMode, output, repoTargets, startDate };
}

function parseStartDate(startDate) {
  if (!startDate) {
    return null;
  }

  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isOnOrAfter(dateValue, startDate) {
  if (!startDate) {
    return true;
  }
  if (!dateValue) {
    return false;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() >= startDate.getTime();
}

// ─────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseLinkHeader(linkHeader) {
  if (!linkHeader) {
    return {};
  }

  return linkHeader
    .split(",")
    .map((part) => part.trim())
    .reduce((links, part) => {
      const match = part.match(/^<([^>]+)>;\s*rel="([^"]+)"$/);
      if (match) {
        links[match[2]] = match[1];
      }
      return links;
    }, {});
}

async function githubRequest(token, url, params = {}) {
  const qs = new URLSearchParams({ per_page: String(PER_PAGE), ...params });
  const fullUrl = `${url}?${qs}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(RATE_PAUSE_MS);

    let res;
    try {
      res = await fetch(fullUrl, {
        headers: {
          Authorization:        `Bearer ${token}`,
          Accept:               "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent":         "contributions-exporter/1.0",
        },
      });
    } catch (err) {
      process.stderr.write(`  Network error: ${err.message}\n`);
      await sleep(2000 * (attempt + 1));
      continue;
    }

    if (res.status === 200) {
      return res;
    }
    if (res.status === 404 || res.status === 409) {
      return null;
    }
    if (res.status === 429 || res.status === 403) {
      const reset  = parseInt(res.headers.get("X-RateLimit-Reset") || "0", 10);
      const wait   = Math.max(reset - Math.floor(Date.now() / 1000), 5);
      process.stderr.write(`  Rate limited — waiting ${wait}s …\n`);
      await sleep(wait * 1000);
      continue;
    }
    if (res.status >= 500) {
      await sleep(5000 * (attempt + 1));
      continue;
    }
    return null;
  }
  return null;
}

async function githubFetch(token, url, params = {}) {
  const res = await githubRequest(token, url, params);
  if (!res) {
    return null;
  }
  return await res.json();
}

/** Fetch all pages of a list endpoint. */
async function paginate(token, url, params = {}, limit = null) {
  const results = [];
  let page = 1;

  while (true) {
    const data = await githubFetch(token, url, { ...params, page: String(page) });
    if (!data) break;

    const items = Array.isArray(data) ? data : (data.items ?? []);
    results.push(...items);

    if (limit && results.length >= limit) {
      results.length = limit;
      break;
    }
    if (items.length < PER_PAGE) break;
    page++;
  }

  return results;
}

// ─────────────────────────────────────────────────────────────
// Collectors
// ─────────────────────────────────────────────────────────────

async function getOrgRepos(token, org) {
  process.stderr.write(`  Listing repos in '${org}' …\n`);
  const repos = await paginate(token, `${GITHUB_API}/orgs/${org}/repos`, { type: "all", sort: "updated" });
  process.stderr.write(`  Found ${repos.length} repos.\n`);
  return repos;
}

async function getTargetUserPublicRepos(token, username) {
  process.stderr.write(`  Listing public repos owned by '${username}' …\n`);
  const repos = await paginate(token, `${GITHUB_API}/users/${username}/repos`, { type: "owner", sort: "updated" });
  const publicOwned = repos.filter((repo) => repo.owner?.login?.toLowerCase() === username.toLowerCase() && repo.private !== true);
  process.stderr.write(`  Found ${publicOwned.length} public repos owned by ${username}.\n`);
  return publicOwned;
}

function parseRepoTarget(value) {
  const trimmed = (value || "").trim().replace(/^https?:\/\/github.com\//i, "").replace(/\/$/, "");
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length !== 2) {
    return null;
  }

  return { owner: parts[0], repo: parts[1], full_name: `${parts[0]}/${parts[1]}` };
}

async function getRepoByFullName(token, fullName) {
  const parsed = parseRepoTarget(fullName);
  if (!parsed) {
    return null;
  }

  const repo = await githubFetch(token, `${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`);
  return repo || null;
}

async function getExplicitRepos(token, repoTargets) {
  const repos = [];

  for (const target of repoTargets) {
    const repo = await getRepoByFullName(token, target);
    if (!repo) {
      process.stderr.write(`  Skipping '${target}' (not found or not accessible).\n`);
      continue;
    }
    repos.push(repo);
  }

  return repos;
}

async function getRepoLanguages(token, owner, repo) {
  return await githubFetch(token, `${GITHUB_API}/repos/${owner}/${repo}/languages`) ?? {};
}

async function getPullRequestDetail(token, owner, repo, prNumber) {
  return await githubFetch(token, `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`);
}

async function getPullRequestFiles(token, owner, repo, prNumber) {
  return await paginate(token, `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`);
}

async function getEarliestCommit(token, owner, repo, params = {}) {
  const res = await githubRequest(token, `${GITHUB_API}/repos/${owner}/${repo}/commits`, {
    ...params,
    per_page: "1",
    page: "1",
  });
  if (!res) {
    return null;
  }

  const firstPageItems = await res.json();
  if (!Array.isArray(firstPageItems) || firstPageItems.length === 0) {
    return null;
  }

  const links = parseLinkHeader(res.headers.get("link"));
  if (!links.last) {
    return firstPageItems[0];
  }

  const lastUrl = new URL(links.last);
  const lastPage = lastUrl.searchParams.get("page") || "1";
  const lastPageItems = await githubFetch(token, `${GITHUB_API}/repos/${owner}/${repo}/commits`, {
    ...params,
    per_page: "1",
    page: lastPage,
  });

  if (!Array.isArray(lastPageItems) || lastPageItems.length === 0) {
    return firstPageItems[0];
  }

  return lastPageItems[0];
}

function buildFirstContributionFlag(commit, target, label) {
  if (!commit) {
    return {
      label,
      value: false,
      confidence: "none",
      reason: "No commits found for this repo window.",
      commit: null,
    };
  }

  const authorLogin = (commit.author_login ?? commit.author?.login ?? null)?.toLowerCase() ?? null;
  const authorName = commit.author_name ?? commit.commit?.author?.name ?? null;
  const commitDate = commit.date ?? commit.commit?.author?.date ?? null;
  const commitMessage = commit.message ?? (commit.commit?.message ?? "").split("\n")[0];
  const commitUrl = commit.url ?? commit.html_url ?? null;
  const matchesTarget = authorLogin === target.toLowerCase();
  const confidence = authorLogin ? "high" : "low";
  const reason = authorLogin
    ? (matchesTarget
      ? `Oldest commit in scope is attributed to ${target}.`
      : `Oldest commit in scope is attributed to ${commit.author_login ?? commit.author?.login}.`)
    : "Oldest commit exists, but GitHub did not map it to a user login.";

  return {
    label,
    value: matchesTarget,
    confidence,
    reason,
    commit: {
      sha: commit.sha?.slice(0, 10) ?? null,
      date: commitDate,
      message: commitMessage,
      author_login: commit.author_login ?? commit.author?.login ?? null,
      author_name: authorName,
      url: commitUrl,
    },
  };
}

async function buildRepoMetadata(token, repo) {
  const owner = repo.owner?.login;
  const name = repo.name;
  const languages = await getRepoLanguages(token, owner, name);
  const earliestCommit = await getEarliestCommit(token, owner, name);
  const earliestCommitAfterFork = repo.fork && repo.created_at
    ? await getEarliestCommit(token, owner, name, { since: repo.created_at })
    : null;
  const totalBytes = Object.values(languages).reduce((sum, value) => sum + value, 0);
  const languageBreakdown = Object.entries(languages)
    .sort((left, right) => right[1] - left[1])
    .map(([language, bytes]) => ({
      language,
      bytes,
      percent: totalBytes > 0 ? bytes / totalBytes : 0,
    }));

  return {
    full_name: repo.full_name ?? `${owner}/${name}`,
    description: repo.description ?? "",
    topics: repo.topics ?? [],
    primary_language: repo.language ?? null,
    language_breakdown: languageBreakdown,
    visibility: repo.visibility ?? (repo.private ? "private" : "public"),
    private: Boolean(repo.private),
    archived: Boolean(repo.archived),
    fork: Boolean(repo.fork),
    homepage: repo.homepage ?? "",
    earliest_commit: earliestCommit
      ? {
        sha: earliestCommit.sha?.slice(0, 10) ?? null,
        date: earliestCommit.commit?.author?.date ?? null,
        message: (earliestCommit.commit?.message ?? "").split("\n")[0],
        author_login: earliestCommit.author?.login ?? null,
        author_name: earliestCommit.commit?.author?.name ?? null,
        url: earliestCommit.html_url ?? null,
      }
      : null,
    earliest_commit_after_fork: earliestCommitAfterFork
      ? {
        sha: earliestCommitAfterFork.sha?.slice(0, 10) ?? null,
        date: earliestCommitAfterFork.commit?.author?.date ?? null,
        message: (earliestCommitAfterFork.commit?.message ?? "").split("\n")[0],
        author_login: earliestCommitAfterFork.author?.login ?? null,
        author_name: earliestCommitAfterFork.commit?.author?.name ?? null,
        url: earliestCommitAfterFork.html_url ?? null,
      }
      : null,
  };
}

async function collectAuthoredPRs(token, owner, repo, target, startDate = null) {
  const prs = await paginate(token, `${GITHUB_API}/repos/${owner}/${repo}/pulls`, { state: "all" });
  const mine = prs.filter((p) => {
    if (p.user?.login?.toLowerCase() !== target.toLowerCase()) {
      return false;
    }

    return isOnOrAfter(p.created_at, startDate) ||
      isOnOrAfter(p.merged_at, startDate) ||
      isOnOrAfter(p.updated_at, startDate);
  });

  const results = [];
  for (const pr of mine) {
    const [detail, files] = await Promise.all([
      getPullRequestDetail(token, owner, repo, pr.number),
      getPullRequestFiles(token, owner, repo, pr.number),
    ]);

    const prDetail = detail || pr;
    const prFiles = Array.isArray(files) ? files : [];

    results.push({
      number:        prDetail.number,
      title:         prDetail.title,
      body:          prDetail.body ?? "",
      state:         prDetail.state,
      merged:        prDetail.merged_at != null,
      created_at:    prDetail.created_at,
      merged_at:     prDetail.merged_at,
      url:           prDetail.html_url,
      labels:        (prDetail.labels ?? []).map((l) => l.name),
      additions:     prDetail.additions ?? null,
      deletions:     prDetail.deletions ?? null,
      changed_files: prDetail.changed_files ?? prFiles.length,
      file_summary:  summarizePullRequestFiles(prFiles),
    });
  }

  return results;
}

async function collectPRReviews(token, owner, repo, target, startDate = null) {
  const allPRs = await paginate(token, `${GITHUB_API}/repos/${owner}/${repo}/pulls`, { state: "all" });
  const results = [];

  for (const pr of allPRs) {
    if (!isOnOrAfter(pr.updated_at, startDate)) {
      continue;
    }

    const reviews = await paginate(token, `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pr.number}/reviews`);
    const myReviews = reviews.filter((r) => {
      if (r.user?.login?.toLowerCase() !== target.toLowerCase()) {
        return false;
      }
      return isOnOrAfter(r.submitted_at, startDate);
    });
    if (myReviews.length === 0) continue;

    // Fetch inline comments once per PR (shared across reviews)
    const allInline = await paginate(token, `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pr.number}/comments`);
    const myInline  = allInline
      .filter((c) => c.user?.login?.toLowerCase() === target.toLowerCase())
      .map((c) => ({ path: c.path, body: c.body ?? "", diff_hunk: c.diff_hunk ?? "" }));

    for (const rev of myReviews) {
      results.push({
        pr_number:       pr.number,
        pr_title:        pr.title,
        pr_url:          pr.html_url,
        review_state:    rev.state,
        review_body:     rev.body ?? "",
        submitted_at:    rev.submitted_at,
        inline_comments: myInline,
      });
    }
  }

  return results;
}

async function collectIssueComments(token, owner, repo, target, startDate = null) {
  const params = startDate ? { since: startDate.toISOString() } : {};
  const comments = await paginate(token, `${GITHUB_API}/repos/${owner}/${repo}/issues/comments`, params);
  return comments
    .filter((c) => c.user?.login?.toLowerCase() === target.toLowerCase() && isOnOrAfter(c.created_at, startDate))
    .map((c) => {
      const issueUrl = c.issue_url ?? "";
      const issueNum = issueUrl ? parseInt(issueUrl.split("/").pop(), 10) : null;
      return {
        issue_number: issueNum,
        body:         c.body ?? "",
        created_at:   c.created_at,
        url:          c.html_url,
      };
    });
}

async function collectAuthoredIssues(token, owner, repo, target, startDate = null) {
  const params = { state: "all", creator: target };
  if (startDate) {
    params.since = startDate.toISOString();
  }

  const issues = await paginate(token, `${GITHUB_API}/repos/${owner}/${repo}/issues`, params);

  return issues
    .filter((i) => !i.pull_request && i.user?.login?.toLowerCase() === target.toLowerCase() && isOnOrAfter(i.created_at, startDate))
    .map((i) => ({
      number:     i.number,
      title:      i.title,
      body:       i.body ?? "",
      state:      i.state,
      created_at: i.created_at,
      url:        i.html_url,
      labels:     (i.labels ?? []).map((l) => l.name),
    }));
}

async function collectCommits(token, owner, repo, target, startDate = null) {
  const params = { author: target };
  if (startDate) {
    params.since = startDate.toISOString();
  }

  const commits = await paginate(
    token,
    `${GITHUB_API}/repos/${owner}/${repo}/commits`,
    params,
    MAX_COMMITS_PER_REPO
  );

  return commits.map((c) => ({
    sha:       c.sha.slice(0, 10),
    message:   (c.commit?.message ?? "").split("\n")[0],
    date:      c.commit?.author?.date ?? null,
    url:       c.html_url,
    additions: c.stats?.additions ?? null,
    deletions: c.stats?.deletions ?? null,
  }));
}

// ─────────────────────────────────────────────────────────────
// Main collection loop
// ─────────────────────────────────────────────────────────────

async function collectRepoFull(token, repo, target, startDate = null) {
  const owner = repo.owner?.login;
  const repoName = repo.name;
  const full = `${owner}/${repoName}`;
  process.stderr.write(`    → ${full}\n`);

  const authoredPRs   = await collectAuthoredPRs(token, owner, repoName, target, startDate);
  const prReviews     = await collectPRReviews(token, owner, repoName, target, startDate);
  const issueComments = await collectIssueComments(token, owner, repoName, target, startDate);
  const authoredIssues = await collectAuthoredIssues(token, owner, repoName, target, startDate);
  const commits       = await collectCommits(token, owner, repoName, target, startDate);

  const total = authoredPRs.length + prReviews.length + issueComments.length +
    authoredIssues.length + commits.length;

  if (total > 0) {
    const repoMetadata = await buildRepoMetadata(token, repo);
    repoMetadata.target_is_first_contributor = buildFirstContributionFlag(
      repoMetadata.earliest_commit,
      target,
      "first_contributor"
    );
    repoMetadata.target_is_first_contributor_after_fork = buildFirstContributionFlag(
      repoMetadata.earliest_commit_after_fork,
      target,
      "first_contributor_after_fork"
    );
    process.stderr.write(
      `      PRs:${authoredPRs.length}  reviews:${prReviews.length}  ` +
      `issue_comments:${issueComments.length}  issues:${authoredIssues.length}  ` +
      `commits:${commits.length}\n`
    );

    return {
      repo:             full,
      repo_metadata:    repoMetadata,
      authored_prs:     authoredPRs,
      pr_reviews:       prReviews,
      issue_comments:   issueComments,
      authored_issues:  authoredIssues,
      commits,
      has_contributions: true,
    };
  }

  return {
    repo:             full,
    repo_metadata:    null,
    authored_prs:     authoredPRs,
    pr_reviews:       prReviews,
    issue_comments:   issueComments,
    authored_issues:  authoredIssues,
    commits,
    has_contributions: false,
  };
}

// ─────────────────────────────────────────────────────────────
// Markdown renderer
// ─────────────────────────────────────────────────────────────

function renderMarkdown(org, target, reposData, generatedAt) {
  const lines  = [];

  lines.push(`# GitHub Contributions Export`);
  lines.push(``);
  lines.push(`- **Organization:** ${org}`);
  lines.push(`- **Target user:** ${target}`);
  lines.push(`- **Generated:** ${generatedAt}`);
  lines.push(`- **Repos with contributions:** ${reposData.length}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  for (const r of reposData) {
    lines.push(`## ${r.repo}`);
    lines.push(``);

    if (r.repo_metadata) {
      const metadata = r.repo_metadata;
      lines.push(`- **Repo description:** ${metadata.description || "(none)"}`);
      lines.push(`- **Visibility:** ${metadata.visibility}  |  **Primary language:** ${metadata.primary_language || "unknown"}`);
      lines.push(`- **Repo traits:** archived=${metadata.archived ? "yes" : "no"}, fork=${metadata.fork ? "yes" : "no"}`);
      if (metadata.topics.length > 0) {
        lines.push(`- **Topics:** ${metadata.topics.join(", ")}`);
      }
      if (metadata.language_breakdown.length > 0) {
        lines.push(`- **Language breakdown:** ${metadata.language_breakdown.map((entry) => `${entry.language} ${formatPercent(entry.percent)}`).join(", ")}`);
      }
      if (metadata.target_is_first_contributor) {
        const first = metadata.target_is_first_contributor;
        lines.push(`- **First contributor signal:** ${first.value ? "yes" : "no"} (${first.confidence} confidence) - ${first.reason}`);
      }
      if (metadata.fork && metadata.target_is_first_contributor_after_fork) {
        const firstAfterFork = metadata.target_is_first_contributor_after_fork;
        lines.push(`- **First contributor after fork signal:** ${firstAfterFork.value ? "yes" : "no"} (${firstAfterFork.confidence} confidence) - ${firstAfterFork.reason}`);
      }
      if (metadata.homepage) {
        lines.push(`- **Homepage:** ${metadata.homepage}`);
      }
      lines.push(``);
    }

    if (r.commits.length > 0) {
      lines.push(`### Commits (${r.commits.length})`);
      lines.push(``);
      for (const c of r.commits) {
        const dateStr  = c.date ? c.date.slice(0, 10) : "unknown";
        const addDel   = c.additions != null ? ` (+${c.additions}/-${c.deletions})` : "";
        lines.push(`- \`${c.sha}\` [${dateStr}]${addDel}  `);
        lines.push(`  ${c.message}  `);
        lines.push(`  ${c.url}`);
      }
      lines.push(``);
    }

    if (r.authored_prs.length > 0) {
      lines.push(`### Authored Pull Requests (${r.authored_prs.length})`);
      lines.push(``);
      for (const pr of r.authored_prs) {
        const mergedStr = pr.merged ? "merged" : pr.state;
        const statsStr  = pr.changed_files != null
          ? ` | ${pr.changed_files} files +${pr.additions}/-${pr.deletions}` : "";
        const labelsStr = pr.labels.length > 0 ? ` [${pr.labels.join(", ")}]` : "";
        lines.push(`#### PR #${pr.number}: ${pr.title}${labelsStr}`);
        lines.push(`- **Status:** ${mergedStr}  |  **Opened:** ${(pr.created_at ?? "").slice(0, 10)}${statsStr}`);
        lines.push(`- **URL:** ${pr.url}`);
        if (pr.file_summary) {
          lines.push(`- **Change shape:** new=${pr.file_summary.new_files}, updated=${pr.file_summary.updated_files}, deleted=${pr.file_summary.deleted_files}, renamed=${pr.file_summary.renamed_files}`);
          lines.push(`- **Documentation/Test/Automation files:** docs=${pr.file_summary.documentation_files}, tests=${pr.file_summary.test_files}, automation=${pr.file_summary.automation_files}`);
          if (pr.file_summary.extension_breakdown.length > 0) {
            lines.push(`- **File types touched:** ${pr.file_summary.extension_breakdown.map((entry) => `${entry.extension} (${entry.files} files, +${entry.additions}/-${entry.deletions})`).join(", ")}`);
          }
        }
        if (pr.body.trim()) {
          lines.push(`- **Description:** ${pr.body.trim().slice(0, 600).replace(/\n/g, " ")}`);
        }
        lines.push(``);
      }
    }

    if (r.pr_reviews.length > 0) {
      lines.push(`### Pull Request Reviews (${r.pr_reviews.length})`);
      lines.push(``);
      for (const rev of r.pr_reviews) {
        const dateStr = (rev.submitted_at ?? "").slice(0, 10);
        lines.push(`#### Review on PR #${rev.pr_number}: ${rev.pr_title}`);
        lines.push(`- **Verdict:** ${rev.review_state}  |  **Date:** ${dateStr}`);
        lines.push(`- **PR URL:** ${rev.pr_url}`);
        if (rev.review_body.trim()) {
          lines.push(`- **Review summary:** ${rev.review_body.trim().slice(0, 400).replace(/\n/g, " ")}`);
        }
        if (rev.inline_comments.length > 0) {
          lines.push(`- **Inline comments:** ${rev.inline_comments.length}`);
          for (const ic of rev.inline_comments.slice(0, 5)) {
            lines.push(`  - \`${ic.path}\`: ${ic.body.trim().slice(0, 200).replace(/\n/g, " ")}`);
          }
        }
        lines.push(``);
      }
    }

    if (r.authored_issues.length > 0) {
      lines.push(`### Authored Issues (${r.authored_issues.length})`);
      lines.push(``);
      for (const issue of r.authored_issues) {
        const labelsStr = issue.labels.length > 0 ? ` [${issue.labels.join(", ")}]` : "";
        lines.push(`#### Issue #${issue.number}: ${issue.title}${labelsStr}`);
        lines.push(`- **State:** ${issue.state}  |  **Opened:** ${(issue.created_at ?? "").slice(0, 10)}`);
        lines.push(`- **URL:** ${issue.url}`);
        if (issue.body.trim()) {
          lines.push(`- **Description:** ${issue.body.trim().slice(0, 400).replace(/\n/g, " ")}`);
        }
        lines.push(``);
      }
    }

    if (r.issue_comments.length > 0) {
      lines.push(`### Issue/PR Comments (${r.issue_comments.length})`);
      lines.push(``);
      const shown = r.issue_comments.slice(0, 20);
      for (const c of shown) {
        const dateStr   = (c.created_at ?? "").slice(0, 10);
        const preview   = c.body.trim().slice(0, 300).replace(/\n/g, " ");
        lines.push(`- [#${c.issue_number} — ${dateStr}](${c.url}): ${preview}`);
      }
      if (r.issue_comments.length > 20) {
        lines.push(`- _(+ ${r.issue_comments.length - 20} more — see JSON for full data)_`);
      }
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const { org, testMode, output: outputArg, repoTargets, startDate } = parseArgs();

  const token  = (process.env.GITHUB_TOKEN  ?? "").trim();
  const target = (process.env.GITHUB_TARGET ?? "").trim();

  if (!token) {
    process.stderr.write(
      "ERROR: GITHUB_TOKEN is not set.\n" +
      "       Set it to YOUR personal access token (needs 'repo' scope).\n"
    );
    process.exit(1);
  }
  if (!target) {
    process.stderr.write(
      "ERROR: GITHUB_TARGET is not set.\n" +
      "       Set it to the GitHub username you are searching FOR.\n" +
      "       Example: GITHUB_TARGET=their-login\n"
    );
    process.exit(1);
  }
  const parsedStartDate = parseStartDate(startDate);
  if (startDate && !parsedStartDate) {
    process.stderr.write(
      "ERROR: --start-date must be a valid date or ISO-8601 timestamp.\n" +
      "       Example: --start-date 2025-01-01\n"
    );
    process.exit(1);
  }

  const outputBase = outputArg ?? (org ? `${org}_contributions` : (repoTargets.length > 0 ? "repo_contributions" : `${target}_public_contributions`));

  // Verify token
  process.stderr.write(`Verifying token …\n`);
  const me = await githubFetch(token, `${GITHUB_API}/user`);
  if (!me || !me.login) {
    process.stderr.write("ERROR: Could not authenticate. Check your GITHUB_TOKEN.\n");
    process.exit(1);
  }
  process.stderr.write(`Authenticated as: ${me.login} (that's you — the runner)\n`);
  process.stderr.write(`Searching for contributions by: ${target}\n\n`);
  if (parsedStartDate) {
    process.stderr.write(`Applying start date filter: ${parsedStartDate.toISOString()}\n\n`);
  }

  let reposToScan = [];
  let scopeLabel = "";

  if (repoTargets.length > 0) {
    process.stderr.write(`Scanning explicit repositories (${repoTargets.length})\n`);
    reposToScan = await getExplicitRepos(token, repoTargets);
    if (reposToScan.length === 0) {
      process.stderr.write(
        "ERROR: None of the requested repositories were accessible.\n" +
        "       Check names and token permissions.\n"
      );
      process.exit(1);
    }
    scopeLabel = "selected_repos";
  } else if (org) {
    process.stderr.write(`Scanning org: ${org}\n`);
    reposToScan = await getOrgRepos(token, org);
    if (!reposToScan || reposToScan.length === 0) {
      process.stderr.write(
        `ERROR: No repos found for org '${org}'.\n` +
        `       Check that your token has org read access.\n`
      );
      process.exit(1);
    }
    scopeLabel = org;
  } else {
    process.stderr.write(`No --org/--repo provided. Falling back to target-owned public repos.\n`);
    reposToScan = await getTargetUserPublicRepos(token, target);
    if (!reposToScan || reposToScan.length === 0) {
      process.stderr.write(
        `ERROR: No public repos found for target user '${target}'.\n` +
        "       Provide --org or --repo if you intended a different scope.\n"
      );
      process.exit(1);
    }
    scopeLabel = `${target}_public_repos`;
  }

  process.stderr.write(`\nCollecting contributions across ${reposToScan.length} repos …\n\n`);
  if (testMode) {
    process.stderr.write(`Test mode enabled: stopping after the first repo with contributions.\n\n`);
  }

  const reposData = [];
  for (const repo of reposToScan) {
    const data = await collectRepoFull(token, repo, target, parsedStartDate);
    if (data.has_contributions) {
      reposData.push(data);
      if (testMode) {
        break;
      }
    }
  }

  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  // JSON output
  const jsonPath = `${outputBase}.json`;
  const payload  = {
    org: org ?? null,
    scope: scopeLabel,
    selected_repositories: repoTargets,
    start_date: parsedStartDate ? parsedStartDate.toISOString() : null,
    target_user: target,
    generated_at: generatedAt,
    repos: reposData,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  process.stderr.write(`\n✓ JSON written → ${jsonPath}\n`);

  // Summary
  const active         = reposData.filter((r) => r.has_contributions);
  const totalPRs       = active.reduce((n, r) => n + r.authored_prs.length, 0);
  const totalReviews   = active.reduce((n, r) => n + r.pr_reviews.length, 0);
  const totalIssues    = active.reduce((n, r) => n + r.authored_issues.length, 0);
  const totalComments  = active.reduce((n, r) => n + r.issue_comments.length, 0);
  const totalCommits   = active.reduce((n, r) => n + r.commits.length, 0);

  process.stderr.write(`
─────────────────────────────────────────
Summary for ${target} in ${scopeLabel}:
  Repos with contributions : ${active.length}
  Authored PRs             : ${totalPRs}
  PR reviews given         : ${totalReviews}
  Issues opened            : ${totalIssues}
  Issue/PR comments        : ${totalComments}
  Commits                  : ${totalCommits}
─────────────────────────────────────────

Send this file to the resume-kit owner:
  ${jsonPath}
`);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
