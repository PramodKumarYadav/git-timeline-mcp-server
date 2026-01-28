/**
 * Feature Detection - Based on INSTRUCTIONS_FEATURES.md
 * 
 * Key Principles:
 * - Phase Title: Pick ONE most prominent domain (few words)
 * - Sub Description: 7-10 words elaborating, can mention other changes
 * - Tags: Parent folder names of changed files
 * - Derive from file paths and names, NOT commit messages
 * - Domain over Technical: "What business capability?" not "What layer?"
 * - DYNAMIC: No hardcoded domains - derive from actual file structure
 */

// =============================================================================
// EXCLUDED FILES - Non-feature files
// =============================================================================

const EXCLUDED_FILES = [
  /package(-lock)?\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.md$/,
  /\.lock$/,
  /\.config\.(js|ts|mjs|cjs)$/,
  /tsconfig.*\.json$/,
  /\.gitignore$/,
  /\.eslintrc/,
  /\.prettierrc/,
  /\.env/,
  /\.editorconfig$/,
  /\.github\//,
  /\.husky\//,
  /railway\.(json|toml)$/,
  /vercel\.json$/,
  /netlify\.toml$/,
  /node_modules\//,
  /dist\//,
  /build\//,
  /\.next\//,
  /\.nuxt\//,
  /\.test\.(js|ts|jsx|tsx)$/,
  /\.spec\.(js|ts|jsx|tsx)$/,
  /__tests__\//,
];

// Generic infrastructure/technical folders to skip
const TECHNICAL_FOLDERS = [
  'src', 'app', 'pages', 'components', 'lib', 'utils', 'helpers', 
  'public', 'assets', 'styles', 'css', 'constants', 'types',
  'interfaces', 'models', 'schemas', 'routes', 'controllers',
  'middleware', 'config', 'services', 'api', 'hooks', 'context'
];

// =============================================================================
// DYNAMIC ICON MAPPING
// =============================================================================

/**
 * Infer icon from folder/file name semantics
 */
function inferIcon(name) {
  const lower = name.toLowerCase();
  
  // Common semantic patterns
  if (/payment|billing|invoice|checkout|subscription|stripe/.test(lower)) return '💳';
  if (/auth|login|signup|signin|register|session/.test(lower)) return '🔐';
  if (/password|reset|forgot/.test(lower)) return '🔑';
  if (/email|mail|notification|smtp/.test(lower)) return '📧';
  if (/profile|account|settings|user/.test(lower)) return '👤';
  if (/dashboard|analytics|stats|metrics|chart/.test(lower)) return '📊';
  if (/search|filter|query|find/.test(lower)) return '🔍';
  if (/upload|storage|file|media|image/.test(lower)) return '📁';
  if (/report|export|pdf|csv/.test(lower)) return '📄';
  if (/admin|role|permission|management/.test(lower)) return '👥';
  if (/rule|engine|policy|workflow/.test(lower)) return '⚙️';
  if (/integration|webhook|callback|external/.test(lower)) return '🔗';
  if (/cache|redis/.test(lower)) return '⚡';
  if (/job|cron|scheduler|queue|worker/.test(lower)) return '⏰';
  if (/migration|seed|import/.test(lower)) return '📦';
  if (/order|cart|product|catalog/.test(lower)) return '🛒';
  if (/chat|message|conversation/.test(lower)) return '💬';
  if (/booking|reservation|appointment/.test(lower)) return '📅';
  if (/inventory|stock|warehouse/.test(lower)) return '📦';
  if (/customer|client/.test(lower)) return '👤';
  
  // Default
  return '✨';
}

// =============================================================================
// FILE ANALYSIS
// =============================================================================

/**
 * Check if file should be analyzed for features
 */
export function isSourceFile(filePath) {
  return !EXCLUDED_FILES.some(rx => rx.test(filePath));
}

/**
 * Extract parent folder name from file path (for tags)
 */
function extractFolderTags(files) {
  const folders = new Set();
  
  for (const file of files) {
    // Get parent folder(s)
    const parts = file.split('/');
    
    // Skip if file is in root
    if (parts.length <= 1) continue;
    
    // Get meaningful folder names (skip src, app, pages, components if they're root-level)
    for (let i = 0; i < parts.length - 1; i++) {
      const folder = parts[i];
      
      // Skip common non-meaningful folders
      if (['src', 'app', 'pages', 'components', 'lib', 'utils', 'helpers', 'public', 'assets'].includes(folder.toLowerCase())) {
        continue;
      }
      
      // Add meaningful folder names
      if (folder && folder.length > 1) {
        folders.add(folder);
      }
    }
  }
  
  return Array.from(folders);
}

// =============================================================================
// DYNAMIC DOMAIN DETECTION
// =============================================================================

/**
 * Extract meaningful folder/feature names from file paths
 * Skips technical/infrastructure folders
 */
function extractDomainCandidates(files) {
  const candidates = new Map(); // name -> {count, files, depth}
  
  for (const file of files) {
    const parts = file.split('/').filter(Boolean);
    
    // Analyze each segment for domain signals
    for (let i = 0; i < parts.length - 1; i++) { // Exclude filename
      const segment = parts[i];
      const depth = i + 1;
      
      // Skip technical folders
      if (TECHNICAL_FOLDERS.includes(segment.toLowerCase())) continue;
      
      // Skip single-char or very generic names
      if (segment.length <= 2 || /^[0-9]+$/.test(segment)) continue;
      
      // Normalize: snake_case, kebab-case, camelCase -> Title Case
      const normalized = segment
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      if (!candidates.has(normalized)) {
        candidates.set(normalized, { count: 0, files: [], depth: 0 });
      }
      
      const entry = candidates.get(normalized);
      entry.count++;
      entry.files.push(file);
      entry.depth += depth; // Accumulate depth
    }
  }
  
  return candidates;
}

/**
 * Score domains by importance (file count + depth heuristics)
 * Deeper, more-changed folders = more important
 */
function scoreDomains(candidates) {
  const scored = [];
  
  for (const [name, data] of candidates) {
    const avgDepth = data.depth / data.count;
    
    // Score = file count (primary) + depth bonus (secondary)
    // Deeper folders (avgDepth > 2) get bonus
    const depthBonus = avgDepth > 2 ? Math.log2(avgDepth) * 2 : 0;
    const score = data.count * 10 + depthBonus;
    
    scored.push({ 
      name, 
      count: data.count,
      files: data.files, 
      avgDepth, 
      score,
      icon: inferIcon(name)
    });
  }
  
  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Detect domains from file paths (dynamic, no hardcoded patterns)
 */
export function detectDomainFromFiles(files) {
  const sourceFiles = files.filter(f => isSourceFile(f));
  
  if (sourceFiles.length === 0) {
    return new Map();
  }
  
  // Extract domain candidates from folder structure
  const candidates = extractDomainCandidates(sourceFiles);
  
  if (candidates.size === 0) {
    // Fallback: create generic domain from file changes
    const fallback = new Map();
    fallback.set('Code Updates', {
      icon: '✨',
      files: sourceFiles
    });
    return fallback;
  }
  
  // Score and convert to map
  const scored = scoreDomains(candidates);
  const domainMap = new Map();
  
  for (const domain of scored) {
    domainMap.set(domain.name, {
      icon: domain.icon,
      files: domain.files
    });
  }
  
  return domainMap;
}

// =============================================================================
// PHASE INFO GENERATION
// =============================================================================

/**
 * Generate feature phase info
 * - Title: ONE most prominent domain (highest scored)
 * - Description: 7-10 words, can mention other domains
 * - Tags: Folder names from changed files
 */
export function generateFeaturePhaseInfo(domains, libraries = [], changedFiles = []) {
  const domainList = Array.from(domains.keys());
  
  // If no domains detected, return generic update
  if (domainList.length === 0) {
    const tags = extractFolderTags(changedFiles);
    
    return {
      title: 'Code Updates',
      icon: '✨',
      description: 'General code improvements and maintenance',
      tags: tags.length > 0 ? tags : ['core']
    };
  }
  
  // PRIMARY domain for title (first = highest scored from detectDomainFromFiles)
  const primary = domainList[0];
  const primaryConfig = domains.get(primary);
  
  // TAGS from folder names
  const allFiles = [];
  for (const domain of domains.values()) {
    allFiles.push(...domain.files);
  }
  const tags = extractFolderTags(allFiles);
  
  // DESCRIPTION: Elaborate on primary, mention others
  let description = '';
  
  // Single domain
  if (domainList.length === 1) {
    description = generateSingleDomainDescription(primary, libraries);
  }
  // Multiple domains - mention primary and hint at others
  else {
    const otherDomains = domainList.slice(1);
    description = generateMultiDomainDescription(primary, otherDomains, libraries);
  }
  
  return {
    title: primary,
    icon: primaryConfig.icon,
    description,
    tags: tags.length > 0 ? tags : libraries.slice(0, 3)
  };
}

/**
 * Generate description for single domain (dynamic, generic)
 *//**
 * Generate description for single domain (dynamic, generic)
 */
function generateSingleDomainDescription(domain, libraries) {
  // Generic template based on domain name
  let desc = `Implemented ${domain.toLowerCase()} functionality and features`;
  
  // Add library mention if available
  if (libraries.length > 0) {
    const lib = libraries[0];
    desc = `Added ${lib} for ${domain.toLowerCase()}`;
  }
  
  return desc;
}

/**
 * Generate description for multiple domains (primary + others)
 */
function generateMultiDomainDescription(primary, others, libraries) {
  const otherCount = others.length;
  
  // Generic: mention primary and hint at others
  let desc = '';
  
  if (otherCount === 1) {
    desc = `Implemented ${primary.toLowerCase()} and ${others[0].toLowerCase()} features`;
  } else if (otherCount === 2) {
    desc = `Added ${primary.toLowerCase()}, ${others[0].toLowerCase()}, and ${others[1].toLowerCase()}`;
  } else {
    desc = `Implemented ${primary.toLowerCase()} and ${otherCount} other features`;
  }
  
  return desc;
}
