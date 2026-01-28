/**
 * Git Command Utilities
 * Low-level git operations for timeline analysis
 */

import { execSync } from 'node:child_process';

export function runGit(args, cwd) {
  try {
    return execSync(['git', ...args].join(' '), { cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (e) {
    throw new Error(e.stderr?.toString?.() || e.message);
  }
}

export function ensureRepo(repoPath) {
  runGit(['rev-parse', '--is-inside-work-tree'], repoPath);
}

export function listCommits(repoPath, maxCommits) {
  const fmt = '%H\x01%ad\x01%s';
  const out = runGit(['log', `--max-count=${maxCommits}`, '--date=iso', `--pretty=format:${fmt}`], repoPath);
  const commits = [];
  for (const line of out.split('\n')) {
    const parts = line.split('\x01');
    if (parts.length >= 3) {
      commits.push({ hash: parts[0], date: parts[1], message: parts[2] });
    }
  }
  return commits;
}

export function getCommitDiff(repoPath, hash) {
  try {
    return runGit(['show', '--name-only', '--pretty=format:', hash], repoPath);
  } catch {
    return '';
  }
}

export function getCommitFullDiff(repoPath, hash) {
  try {
    return runGit(['show', hash], repoPath);
  } catch {
    return '';
  }
}

export function getFileDiff(repoPath, hash, filePath) {
  try {
    return runGit(['show', hash, '--', filePath], repoPath);
  } catch {
    return '';
  }
}

export function toDateIso(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr.slice(0, 10);
  }
}
