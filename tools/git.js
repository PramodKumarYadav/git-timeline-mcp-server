import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
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
  
  const timelineDir = path.join(repoPath, '.timeline');
  mkdirSync(timelineDir, { recursive: true });
  const mermaid = toMermaidTimeline('Feature Timeline', events);
  
  // Generate HTML file
  const htmlPath = path.join(timelineDir, 'FEATURE_TIMELINE.html');
  generateHtmlFile(htmlPath, 'Feature Timeline', events, mermaid);
  
  // Generate Markdown file
  const mdPath = path.join(timelineDir, 'FEATURE_TIMELINE.md');
  generateMarkdownFile(mdPath, 'Feature Timeline', events);
  
  return { title: 'Feature Timeline', events, mermaid, files: { html: htmlPath, markdown: mdPath } };
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

function generateHtmlFile(filepath, title, events, mermaidText) {
  const projectName = 'Project';
  const typeIcon = title.includes('Feature') ? '📅' : '🔧';
  const itemIcon = title.includes('Feature') ? '🚀' : '✨';
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 60px;
    }
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .timeline {
      max-width: 1100px;
      margin: 0 auto;
      position: relative;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 100%;
      background: rgba(255,255,255,0.3);
    }
    .timeline-item {
      position: relative;
      margin-bottom: 50px;
      width: 48%;
    }
    .timeline-item:nth-child(odd) {
      margin-left: 0;
      padding-right: 30px;
    }
    .timeline-item:nth-child(even) {
      margin-left: 52%;
      padding-left: 30px;
    }
    .timeline-dot {
      position: absolute;
      top: 20px;
      width: 16px;
      height: 16px;
      background: white;
      border: 4px solid #667eea;
      border-radius: 50%;
      z-index: 1;
    }
    .timeline-item:nth-child(odd) .timeline-dot {
      right: -8px;
    }
    .timeline-item:nth-child(even) .timeline-dot {
      left: -8px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.2);
    }
    .card-date {
      font-size: 15px;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 12px;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .card-header .emoji {
      font-size: 20px;
    }
    .card-title {
      font-size: 19px;
      font-weight: 700;
      color: #333;
    }
    .card-description {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tag {
      background: #f0f0f0;
      color: #555;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>
      <span>${typeIcon}</span>
      <span>${projectName} - ${title}</span>
    </h1>
  </div>
  
  <div class="timeline">
    ${events.map((event, i) => {
      const cleanTitle = event.title.replace(/^(Feature: |Tooling: )/, '');
      const tags = event.tags || [];
      const description = event.description ? event.description.split('\n')[0] : '';
      
      return `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="card">
        <div class="card-date">${new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div class="card-header">
          <span class="emoji">${itemIcon}</span>
          <div class="card-title">${cleanTitle}</div>
        </div>
        ${description ? `<div class="card-description">${description}</div>` : ''}
        ${tags.length > 0 ? `
        <div class="tags">
          ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    `;
    }).join('')}
  </div>
</body>
</html>`;
  
  writeFileSync(filepath, html, 'utf8');
}

function generateMarkdownFile(filepath, title, events) {
  let content = `# ${title}\n\n`;
  content += `Generated: ${new Date().toISOString()}\n\n`;
  content += `Total events: **${events.length}**\n\n`;
  content += `## Timeline\n\n`;
  
  const byDate = new Map();
  for (const e of events) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }
  
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
  
  for (const d of sortedDates) {
    const dayEvents = byDate.get(d) || [];
    content += `### ${d}\n\n`;
    for (const e of dayEvents) {
      content += `**${e.title}**\n`;
      if (e.description) {
        content += `- ${e.description.split('\n')[0]}\n`;
      }
      if (e.commitHash) {
        content += `- Commit: \`${e.commitHash}\`\n`;
      }
      if (e.tags?.length) {
        content += `- Tags: ${e.tags.map(t => `\`${t}\``).join(', ')}\n`;
      }
      content += '\n';
    }
  }
  
  writeFileSync(filepath, content, 'utf8');
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
  
  const timelineDir = path.join(repoPath, '.timeline');
  mkdirSync(timelineDir, { recursive: true });
  const mermaid = toMermaidTimeline('Tooling Timeline', events);
  
  // Generate HTML file
  const htmlPath = path.join(timelineDir, 'TOOLING_TIMELINE.html');
  generateHtmlFile(htmlPath, 'Tooling Timeline', events, mermaid);
  
  // Generate Markdown file
  const mdPath = path.join(timelineDir, 'TOOLING_TIMELINE.md');
  generateMarkdownFile(mdPath, 'Tooling Timeline', events);
  
  return { title: 'Tooling Timeline', events, mermaid, files: { html: htmlPath, markdown: mdPath } };
}
