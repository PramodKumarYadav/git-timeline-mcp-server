/**
 * Git History Timeline Analyzer
 * 
 * Generates Feature and Tooling timelines from git history.
 * See INSTRUCTIONS.md for detailed specifications.
 * 
 * This is the main entry point that coordinates the modular components:
 * - utils/git-commands.js    - Git command utilities
 * - detectors/tooling.js     - Tooling detection from package.json
 * - detectors/features.js    - Feature detection from file paths
 * - generators/output.js     - HTML, Markdown, Dashboard generation
 */

import path from 'node:path';

// Git utilities
import {
  ensureRepo,
  listCommits,
  getCommitDiff,
  getFileDiff,
  toDateIso
} from './utils/git-commands.js';

// Tooling detection
import {
  extractAddedDependencies,
  extractToolsFromConfigFiles,
  generateToolingPhaseInfo
} from './detectors/tooling.js';

// Feature detection
import {
  isSourceFile,
  detectDomainFromFiles,
  generateFeaturePhaseInfo
} from './detectors/features.js';

// Output generators
import {
  toMermaidTimeline,
  generateTimelineHtml,
  generateTimelineMd,
  generateDashboard as generateDashboardHtml,
  ensureTimelineDir
} from './generators/output.js';

// =============================================================================
// TOOLING TIMELINE ANALYSIS
// =============================================================================

export async function analyzeToolingTimeline({ repoPath = process.cwd(), maxCommits = 2000 } = {}) {
  repoPath = path.resolve(repoPath);
  ensureRepo(repoPath);
  const commits = listCommits(repoPath, maxCommits);
  
  // Collect tools by date (one card per day)
  const toolsByDate = new Map();
  
  for (const c of commits) {
    const date = toDateIso(c.date);
    
    // Get package.json diff for this commit
    const pkgDiff = getFileDiff(repoPath, c.hash, 'package.json');
    const changedFiles = getCommitDiff(repoPath, c.hash).split('\n').filter(Boolean);
    
    // Extract package names from package.json (primary source)
    const packageNames = pkgDiff ? extractAddedDependencies(pkgDiff) : [];
    
    // Extract tools from config files (secondary source)
    const configTools = extractToolsFromConfigFiles(changedFiles);
    
    if (packageNames.length > 0 || configTools.length > 0) {
      const existing = toolsByDate.get(date) || { 
        packages: new Set(), 
        configTools: new Set(), 
        changedFiles: new Set(),
        commits: [] 
      };
      packageNames.forEach(p => existing.packages.add(p));
      configTools.forEach(t => existing.configTools.add(t));
      changedFiles.forEach(f => existing.changedFiles.add(f));
      existing.commits.push(c.hash);
      toolsByDate.set(date, existing);
    }
  }
  
  // Generate grouped events (with async phase info generation)
  const events = [];
  const sortedDates = Array.from(toolsByDate.keys()).sort((a, b) => a.localeCompare(b));
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const { packages, configTools, changedFiles } = toolsByDate.get(date);
    const packageList = Array.from(packages);
    const configList = Array.from(configTools);
    const filesList = Array.from(changedFiles);
    
    // Check if this is the first day (for "Project Kickoff" detection)
    const isFirstDay = (i === 0);
    
    // Dynamically generate phase info
    const phaseInfo = await generateToolingPhaseInfo(packageList, configList, filesList, isFirstDay);
    
    // Only add events that have new tools
    if (phaseInfo.tools.length > 0) {
      events.push({
        date,
        title: phaseInfo.title,
        icon: phaseInfo.icon,
        description: phaseInfo.description,
        tags: phaseInfo.tools
      });
    }
  }
  
  // Generate output files
  const timelineDir = ensureTimelineDir(repoPath);
  const mermaid = toMermaidTimeline('Tooling Timeline', events);
  const htmlPath = path.join(timelineDir, 'TOOLING_TIMELINE.html');
  const mdPath = path.join(timelineDir, 'TOOLING_TIMELINE.md');
  
  generateTimelineHtml(htmlPath, 'Tooling Timeline', events);
  generateTimelineMd(mdPath, 'Tooling Timeline', events);
  
  return { title: 'Tooling Timeline', events, mermaid, files: { html: htmlPath, markdown: mdPath } };
}

// =============================================================================
// FEATURE TIMELINE ANALYSIS
// =============================================================================

export function analyzeFeatureTimeline({ repoPath = process.cwd(), maxCommits = 2000 } = {}) {
  repoPath = path.resolve(repoPath);
  ensureRepo(repoPath);
  const commits = listCommits(repoPath, maxCommits);
  
  // Collect features by date (one card per day) with associated libraries
  const featuresByDate = new Map();
  
  for (const c of commits) {
    const date = toDateIso(c.date);
    const changedFiles = getCommitDiff(repoPath, c.hash).split('\n').filter(Boolean);
    
    // Get package.json diff to track libraries
    const pkgDiff = getFileDiff(repoPath, c.hash, 'package.json');
    const packageNames = pkgDiff ? extractAddedDependencies(pkgDiff) : [];
    const configTools = extractToolsFromConfigFiles(changedFiles);
    
    // Filter to source files only
    const sourceFiles = changedFiles.filter(isSourceFile);
    if (sourceFiles.length === 0 && packageNames.length === 0 && configTools.length === 0) continue;
    
    // Detect domains from file paths (NOT commit messages)
    const domains = detectDomainFromFiles(sourceFiles);
    
    if (domains.size > 0 || packageNames.length > 0 || configTools.length > 0) {
      const existing = featuresByDate.get(date) || { 
        domains: new Map(), 
        files: new Set(),
        libraries: new Set(),
        changedFiles: new Set()
      };
      
      // Merge domains
      for (const [domain, config] of domains) {
        if (!existing.domains.has(domain)) {
          existing.domains.set(domain, { ...config, files: [] });
        }
        existing.domains.get(domain).files.push(...config.files);
      }
      
      // Collect all files
      sourceFiles.forEach(f => existing.files.add(f));
      changedFiles.forEach(f => existing.changedFiles.add(f));
      
      // Collect libraries introduced on this date
      packageNames.forEach(p => existing.libraries.add(p));
      configTools.forEach(t => existing.libraries.add(t));
      
      featuresByDate.set(date, existing);
    }
  }
  
  // Generate grouped events
  const events = [];
  const sortedDates = Array.from(featuresByDate.keys()).sort((a, b) => a.localeCompare(b));
  
  for (const date of sortedDates) {
    const { domains, libraries, changedFiles } = featuresByDate.get(date);
    const libraryList = Array.from(libraries);
    const filesList = Array.from(changedFiles);
    
    // Generate phase info that considers both features and libraries
    const phaseInfo = generateFeaturePhaseInfo(domains, libraryList, filesList);
    
    events.push({
      date,
      title: phaseInfo.title,
      icon: phaseInfo.icon,
      description: phaseInfo.description,
      tags: libraryList // Use library names as tags, not domain names
    });
  }
  
  // Generate output files
  const timelineDir = ensureTimelineDir(repoPath);
  const mermaid = toMermaidTimeline('Feature Timeline', events);
  const htmlPath = path.join(timelineDir, 'FEATURE_TIMELINE.html');
  const mdPath = path.join(timelineDir, 'FEATURE_TIMELINE.md');
  
  generateTimelineHtml(htmlPath, 'Feature Timeline', events);
  generateTimelineMd(mdPath, 'Feature Timeline', events);
  
  return { title: 'Feature Timeline', events, mermaid, files: { html: htmlPath, markdown: mdPath } };
}

// =============================================================================
// DASHBOARD GENERATION
// =============================================================================

export function generateDashboard(repoPath, featureEvents, toolingEvents) {
  return generateDashboardHtml(repoPath, featureEvents, toolingEvents);
}

// =============================================================================
// COMBINED GENERATION
// =============================================================================

export async function generateAllTimelines({ repoPath = process.cwd(), maxCommits = 2000 } = {}) {
  const features = analyzeFeatureTimeline({ repoPath, maxCommits });
  const tooling = await analyzeToolingTimeline({ repoPath, maxCommits });
  const dashboardPath = generateDashboard(repoPath, features.events, tooling.events);
  
  return {
    features,
    tooling,
    dashboard: dashboardPath
  };
}

// Re-export for compatibility
export { toMermaidTimeline };
