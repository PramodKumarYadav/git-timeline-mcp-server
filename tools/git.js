import { execSync } from 'node:child_process';
import path from 'node:path';

function runGit(args, cwd) {
  try {
    return execSync(['git', ...args].join(' '), { cwd, encoding: 'utf8' });
  } catch (e) {
    throw new Error(e.stderr?.toString?.() || e.message);
  }
}

function ensureRepo(repoPath) {
  runGit(['rev-parse', '--is-inside-work-tree'], repoPath);
}

function listCommits(repoPath, maxCommits) {
  const fmt = '%H\x01%ad\x01%s';
  const out = runGit(['log', `--max-count=${maxCommits}`, '--date=iso', `--pretty=format:${fmt}`], repoPath);
  const commits = [];
  for (const line of out.split('\n')) {
    const parts = line.split('\x01');
    if (parts.length >= 3) commits.push({ hash: parts[0], date: parts[1], message: parts[2] });
  }
  return commits;
}

async function changedFiles(repoPath, hash) {
  const out = runGit(['show', '--name-only', '--pretty=format:', hash], repoPath);
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function packageJsonDiff(repoPath, hash) {
  try {
    const out = runGit(['show', hash, '--', 'package.json'], repoPath);
    return out.includes('diff --git') ? out : null;
  } catch {
    return null;
  }
}

function toDateIso(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr.slice(0, 10);
  }
}

const FEATURE_REGEXES = [
  /^(feat)(\(|:)/i,
  /\bfeature\b/i,
  /\badd(ed)?\b/i,
  /\bimplement(ed)?\b/i,
];
const EXCLUDE_TYPES = [/^(chore|docs|style|test|ci|build|refactor|perf)(\(|:)/i];

const TOOLING_PATTERNS = [
  { title: 'ESLint', files: [/^\.eslintrc(\..+)?$/, /^eslint\.config\.(js|cjs|ts|mjs)$/], deps: [/\beslint\b/] },
  { title: 'Prettier', files: [/^\.prettierrc(\..+)?$/, /^prettier\.config\.(js|cjs|ts|mjs)$/], deps: [/\bprettier\b/] },
  { title: 'TypeScript', files: [/^tsconfig\.json$/], deps: [/\btypescript\b/] },
  { title: 'Jest', files: [/^jest\.config\.(js|cjs|ts)$/], deps: [/\bjest\b/, /\bts-jest\b/] },
  { title: 'Vitest', files: [/^vitest\.config\.(js|ts)$/], deps: [/\bvitest\b/] },
  { title: 'Husky', files: [/^\.husky\//], deps: [/\bhusky\b/] },
  { title: 'Lint-Staged', files: [/^\.lintstagedrc(\..+)?$/], deps: [/\blint-staged\b/] },
  { title: 'Commitlint', files: [/^commitlint\.config\.(js|cjs|ts)$/], deps: [/\b@commitlint\//] },
  { title: 'Commitizen', files: [/^\.czrc$/], deps: [/\bcommitizen\b/] },
  { title: 'Semantic Release', files: [/^\.releaserc(\..+)?$/], deps: [/\bsemantic-release\b/] },
  { title: 'Docker', files: [/^Dockerfile$/, /^docker-compose\.ya?ml$/], deps: [] },
  { title: 'CI Workflow', files: [/^\.github\/workflows\/.+\.ya?ml$/], deps: [] },
  { title: 'Dependabot', files: [/^\.github\/dependabot\.ya?ml$/], deps: [] },
  { title: 'EditorConfig', files: [/^\.editorconfig$/], deps: [] },
  { title: 'Vite', files: [/^vite\.config\.(js|ts)$/], deps: [/\bvite\b/] },
  { title: 'Webpack', files: [/^webpack\.config\.(js|ts)$/], deps: [/\bwebpack\b/] },
  { title: 'Rollup', files: [/^rollup\.config\.(js|ts)$/], deps: [/\brollup\b/] },
];

export function toMermaidTimeline(title, events) {
  const lines = ['timeline', `  title ${title}`];
  const byDate = new Map();
  for (const e of events) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e.title);
    byDate.set(e.date, arr);
  }
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
  for (const d of sortedDates) {
    const items = byDate.get(d) || [];
    lines.push(`  ${d} : ${items.join(' : ')}`);
  }
  return lines.join('\n');
}

function getCommitDiff(repoPath, hash) {
  try {
    const out = runGit(['show', hash], repoPath);
    return out;
  } catch {
    return null;
  }
}

function countDiffStats(diff) {
  if (!diff) return { additions: 0, deletions: 0, filesChanged: 0 };
  let additions = 0;
  let deletions = 0;
  let filesChanged = 0;
  
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git')) filesChanged++;
    else if (line.startsWith('+') && !line.startsWith('+++')) additions++;
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }
  
  return { additions, deletions, filesChanged };
}

function isSourceFile(filePath) {
  // Exclude config, lock files, docs, tests, etc.
  const excluded = [
    /package(-lock)?\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /\.md$/,
    /\.lock$/,
    /\.config\.js$/,
    /tsconfig\.json$/,
    /\.gitignore$/,
    /\.eslintrc/,
    /\.prettierrc/,
    /\.env/,
  ];
  return !excluded.some(rx => rx.test(filePath));
}

function extractSourceFilesFromDiff(diff) {
  if (!diff) return [];
  const files = [];
  for (const line of diff.split('\n')) {
    const match = line.match(/^diff --git a\/(.*) b\//);
    if (match && isSourceFile(match[1])) {
      files.push(match[1]);
    }
  }
  return files;
}

export function analyzeFeatureTimeline({ repoPath = process.cwd(), maxCommits = 2000 } = {}) {
  repoPath = path.resolve(repoPath);
  ensureRepo(repoPath);
  const commits = listCommits(repoPath, maxCommits);
  const events = [];
  
  for (const c of commits) {
    const diff = getCommitDiff(repoPath, c.hash);
    const stats = countDiffStats(diff);
    const sourceFiles = extractSourceFilesFromDiff(diff);
    
    // Detect features: significant additions to source code (net positive code)
    // and meaningful number of files changed
    const netAdditions = stats.additions - stats.deletions;
    const isFeature = netAdditions > 10 && sourceFiles.length > 0;
    
    if (isFeature) {
      const fileList = sourceFiles.length > 3 ? `${sourceFiles.slice(0, 3).join(', ')}...` : sourceFiles.join(', ');
      events.push({
        date: toDateIso(c.date),
        title: `Feature: ${fileList.length > 50 ? fileList.substring(0, 50) + '...' : fileList}`,
        description: `${c.message}\n\nFiles: ${sourceFiles.join(', ')}\nAdditions: +${stats.additions}, Deletions: -${stats.deletions}`,
        commitHash: c.hash,
        tags: ['feature']
      });
    }
  }
  
  return { title: 'Feature Timeline', events, mermaid: toMermaidTimeline('Feature Timeline', events) };
}

function extractAddedDependencies(pkgDiff) {
  if (!pkgDiff) return [];
  const added = [];
  for (const line of pkgDiff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.push(line.substring(1)); // Remove the '+' prefix
    }
  }
  return added;
}

function findMatchingTooling(addedLines, toolingPatterns) {
  const detected = new Set();
  for (const tp of toolingPatterns) {
    if (tp.deps.length === 0) continue; // Skip tools with no dependency patterns
    for (const depRx of tp.deps) {
      if (addedLines.some(line => depRx.test(line))) {
        detected.add(tp.title);
        break;
      }
    }
  }
  return Array.from(detected);
}

export function analyzeToolingTimeline({ repoPath = process.cwd(), maxCommits = 2000 } = {}) {
  repoPath = path.resolve(repoPath);
  ensureRepo(repoPath);
  const commits = listCommits(repoPath, maxCommits);
  const events = [];
  for (const c of commits) {
    const pkgDiff = packageJsonDiff(repoPath, c.hash);
    if (!pkgDiff) continue; // Only process commits that modified package.json
    
    const addedLines = extractAddedDependencies(pkgDiff);
    if (addedLines.length === 0) continue;
    
    const tools = findMatchingTooling(addedLines, TOOLING_PATTERNS);
    for (const tool of tools) {
      events.push({ date: toDateIso(c.date), title: `${tool} introduced`, description: c.message, commitHash: c.hash, tags: ['tooling', tool] });
    }
  }
  return { title: 'Tooling Timeline', events, mermaid: toMermaidTimeline('Tooling Timeline', events) };
}
