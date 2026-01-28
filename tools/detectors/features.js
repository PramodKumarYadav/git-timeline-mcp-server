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
  /\.vscode\//,
  /\.idea\//,
  /\.maintenance\//,
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

// Generic infrastructure/technical folders to skip (ONLY AT ROOT LEVEL)
const TECHNICAL_FOLDERS = [
  'src', 'app', 'public', 'assets', 'styles', 'css', 'constants', 'types',
  'interfaces', 'schemas', 'node_modules', 'dist', 'build', '.next', '.nuxt',
  'frontend', 'backend', 'client', 'server', 'tests', 'test', '__tests__'
];

// Folders that indicate technical layers (skip these, look deeper)
const SKIP_FOLDERS = [
  'utils', 'helpers', 'lib', 'common', 'shared', 'hooks', 'context', 'src'
];

// =============================================================================
// DYNAMIC ICON MAPPING
// =============================================================================

/**
 * Infer icon from folder/file name semantics (GENERIC categories)
 */
function inferIcon(name) {
  const lower = name.toLowerCase();
  
  // Generic high-level categories (not domain-specific)
  if (/auth|login|signup|signin|register|session|password|security/.test(lower)) return '🔐';
  if (/user|profile|account|customer|client|member/.test(lower)) return '👤';
  if (/admin|manage|role|permission/.test(lower)) return '👥';
  if (/dashboard|analytics|stats|metrics|chart|report/.test(lower)) return '📊';
  if (/payment|billing|invoice|checkout|transaction|order/.test(lower)) return '💳';
  if (/email|mail|notification|message|alert/.test(lower)) return '📧';
  if (/search|filter|query|find/.test(lower)) return '🔍';
  if (/upload|download|storage|file|media|document|import|export/.test(lower)) return '📁';
  if (/integration|webhook|api|external|third/.test(lower)) return '🔗';
  if (/job|cron|scheduler|queue|worker|task|background/.test(lower)) return '⏰';
  if (/rule|engine|policy|workflow|automation|process/.test(lower)) return '⚙️';
  if (/cache|performance|optimization/.test(lower)) return '⚡';
  if (/config|settings|preference/.test(lower)) return '🔧';
  if (/test|spec|mock/.test(lower)) return '🧪';
  if (/database|db|data|model|schema/.test(lower)) return '🗄️';
  
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

/**
 * Extract file names from changed files (for tags)
 * Returns base file names without extensions
 */
function extractFileNames(files) {
  return files
    .map(f => {
      const parts = f.split('/');
      const fileName = parts[parts.length - 1];
      // Remove extension
      return fileName.replace(/\.(js|ts|jsx|tsx|py|java|go|rb|php|cs|cpp|vue|svelte)$/i, '');
    })
    .filter(name => {
      // Filter out very generic names
      return !/^(index|main|app|config|constants|types)$/i.test(name);
    })
    .slice(0, 8); // Max 8 file names as tags
}

/**
 * Generate business-focused title from file names
 * Extracts actual business terms from files, not generic folder names
 * E.g., "tinkController" → "Tink Integration", "BankAccountManager + TransactionList" → "Bank Account & Transaction Management"
 */
function generateBusinessTitle(files) {
  // Extract meaningful business terms from file names
  const businessTerms = new Set();
  
  for (const file of files) {
    const parts = file.split('/');
    const fileName = parts[parts.length - 1]
      .replace(/\.(js|ts|jsx|tsx|py|java|go|rb|php|cs|cpp|vue|svelte)$/i, '')
      .replace(/\.(css|scss|sass|less)$/i, '');
    
    // Remove technical suffixes to get business term
    const businessTerm = fileName
      .replace(/(Controller|Service|Model|Route|Page|Component|View|Manager|Handler|Provider|Repository|Util|Helper|Test|Spec)$/i, '')
      .trim();
    
    // Skip very generic or empty terms
    if (businessTerm && businessTerm.length > 2 && !/^(index|main|app|base|config|types?)$/i.test(businessTerm)) {
      // Normalize the term
      const normalized = businessTerm
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      businessTerms.add(normalized);
    }
  }
  
  let terms = Array.from(businessTerms);
  
  if (terms.length === 0) return null;
  
  // Remove redundant terms (e.g., "Rule" if we have "Rule Templates")
  terms = terms.filter((term, index) => {
    return !terms.some((other, otherIndex) => 
      index !== otherIndex && other.includes(term) && other !== term
    );
  });
  
  // Pick top 2 most significant terms (longest/most specific)
  terms.sort((a, b) => b.length - a.length);
  terms = terms.slice(0, 2);
  
  if (terms.length === 1) {
    // Single term - use "Updated X" style
    return `Updated ${terms[0]}`;
  }
  
  // Two terms - use "X & Y" format
  return `${terms[0]} & ${terms[1]}`;
}

/**
 * Make title more descriptive by adding context
 * ALWAYS returns at least 2 words - no single-word titles
 */
function makeDescriptiveTitle(term) {
  const lower = term.toLowerCase();
  
  // Specific mappings for better titles
  if (/^rule$/i.test(term)) return 'Rule Management';
  if (/^auth$/i.test(term)) return 'Authentication System';
  if (/^transaction$/i.test(term)) return 'Transaction Processing';
  if (/^import$/i.test(term)) return 'Data Import';
  if (/^export$/i.test(term)) return 'Data Export';
  if (/^user$/i.test(term)) return 'User Management';
  if (/^profile$/i.test(term)) return 'User Profile';
  if (/^account$/i.test(term)) return 'Account Management';
  if (/^payment$/i.test(term)) return 'Payment Processing';
  if (/^order$/i.test(term)) return 'Order Management';
  if (/^product$/i.test(term)) return 'Product Catalog';
  if (/^invoice$/i.test(term)) return 'Invoice Management';
  if (/^report$/i.test(term)) return 'Report Generation';
  if (/^dashboard$/i.test(term)) return 'Dashboard Features';
  if (/^notification$/i.test(term)) return 'Notification System';
  if (/^email$/i.test(term)) return 'Email System';
  if (/^message$/i.test(term)) return 'Messaging System';
  if (/^search$/i.test(term)) return 'Search Functionality';
  if (/^filter$/i.test(term)) return 'Filter System';
  
  // Generic technical layer names - make them more descriptive
  if (/^controller(s)?$/i.test(term)) return 'Backend Controllers';
  if (/^service(s)?$/i.test(term)) return 'Service Layer';
  if (/^model(s)?$/i.test(term)) return 'Data Models';
  if (/^component(s)?$/i.test(term)) return 'UI Components';
  if (/^page(s)?$/i.test(term)) return 'Page Updates';
  if (/^route(s)?$/i.test(term)) return 'API Routes';
  if (/^middleware$/i.test(term)) return 'Middleware Layer';
  if (/^doc(s)?$/i.test(term)) return 'Documentation Updates';
  if (/^test(s)?$/i.test(term)) return 'Test Coverage';
  if (/^image(s)?$/i.test(term)) return 'Image Assets';
  if (/^style(s)?$/i.test(term)) return 'Style Updates';
  if (/^config$/i.test(term)) return 'Configuration Changes';
  
  // For compound terms (already 2+ words), keep as-is
  if (term.split(' ').length > 1) return term;
  
  // For any other single word, add generic context
  const capitalized = term.charAt(0).toUpperCase() + term.slice(1);
  return `${capitalized} Features`;
}

// =============================================================================
// DYNAMIC DOMAIN DETECTION
// =============================================================================

/**
 * Extract meaningful keywords from a file name
 * Removes common suffixes and splits into words
 */
function extractFileKeywords(fileName) {
  // Remove file extension and common suffixes
  const cleaned = fileName
    .replace(/\.(js|ts|jsx|tsx|py|java|go|rb|php|cs|cpp|c|h|swift)$/i, '')
    .replace(/(Controller|Service|Model|Route|Page|Component|View|Manager|Handler|Provider|Repository|Util|Helper|Test|Spec)$/i, '');
  
  // Split camelCase, PascalCase, snake_case, kebab-case
  const words = cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2); // Only meaningful words
  
  return words;
}

/**
 * Extract meaningful folder/feature names from file paths
 * GENERIC: Analyzes BOTH folders AND file names dynamically
 * Strategy: Collect terms from both sources, score by frequency and context
 */
function extractDomainCandidates(files) {
  const folderCandidates = new Map(); // folder name -> data
  const termFrequency = new Map(); // term -> {count, files}
  
  for (const file of files) {
    const parts = file.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];
    
    // Extract keywords from file name
    const fileKeywords = extractFileKeywords(fileName);
    fileKeywords.forEach(term => {
      if (!termFrequency.has(term)) {
        termFrequency.set(term, { count: 0, files: [] });
      }
      const entry = termFrequency.get(term);
      entry.count++;
      entry.files.push(file);
    });
    
    // Collect all potential folders (except filename)
    for (let i = 0; i < parts.length - 1; i++) {
      const segment = parts[i];
      const depth = i + 1;
      
      // Skip technical folders at root
      if (depth === 1 && TECHNICAL_FOLDERS.includes(segment.toLowerCase())) continue;
      
      // Skip never-meaningful folders
      if (SKIP_FOLDERS.includes(segment.toLowerCase())) continue;
      
      // Skip single-char or numeric-only names  
      if (segment.length <= 2 || /^[0-9]+$/.test(segment)) continue;
      
      // Skip CSS/config files as folders
      if (/\.(css|json|config)$/i.test(segment)) continue;
      
      // Normalize to title case
      const normalized = segment
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Calculate meaningfulness score
      const isDeeper = depth > 2;
      const isTechnical = /^(pages|components|controllers|services|models|routes|middleware|api|data)$/i.test(segment);
      
      // Score: deeper folders and non-technical get bonus
      let score = 10;
      if (isDeeper) score += 5;
      if (!isTechnical) score += 15; // Bigger bonus for domain folders
      
      if (!folderCandidates.has(normalized)) {
        folderCandidates.set(normalized, { count: 0, files: [], depth: 0, keywords: new Set(), score: 0 });
      }
      
      const entry = folderCandidates.get(normalized);
      entry.count++;
      entry.files.push(file);
      entry.depth += depth;
      entry.score += score;
      
      const words = normalized.toLowerCase().split(' ');
      words.forEach(w => entry.keywords.add(w));
    }
  }
  
  // Create feature names from most frequent file name terms
  const sortedTerms = Array.from(termFrequency.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .filter(([term, data]) => data.count >= 2); // Must appear in at least 2 files
  
  // Add top terms as feature candidates (higher score than technical folders)
  for (const [term, data] of sortedTerms.slice(0, 5)) {
    const normalized = term.charAt(0).toUpperCase() + term.slice(1);
    
    // Skip very generic terms
    if (/^(src|app|main|index|base|data)$/i.test(normalized)) continue;
    
    if (!folderCandidates.has(normalized)) {
      folderCandidates.set(normalized, { 
        count: 0, 
        files: [], 
        depth: 0, 
        keywords: new Set([term]), 
        score: 0 
      });
    }
    
    const entry = folderCandidates.get(normalized);
    entry.count += data.count;
    entry.files.push(...data.files); // Add actual files
    entry.score += data.count * 30; // Very high score for frequently mentioned file name terms
  }
  
  return folderCandidates;
}

/**
 * Score domains by importance (GENERIC: prioritizes meaningful terms)
 * Uses: accumulated score (from frequency and context) + file count + depth
 */
function scoreDomains(candidates) {
  const scored = [];
  
  for (const [name, data] of candidates) {
    const avgDepth = data.count > 0 ? data.depth / data.count : 0;
    
    // Final score = accumulated score + (file count * 5) + depth bonus
    const depthBonus = avgDepth > 2 ? Math.log2(avgDepth) * 2 : 0;
    const finalScore = data.score + (data.count * 5) + depthBonus;
    
    // Filter out very low scores (likely noise)
    if (finalScore < 15) continue;
    
    scored.push({ 
      name, 
      count: data.count,
      files: data.files.length > 0 ? data.files : [],
      avgDepth, 
      score: finalScore,
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
 * Generate feature phase info with improved titles, descriptions, and file-based tags
 * Can return MULTIPLE events for the same day if distinct features were touched
 */
export function generateFeaturePhaseInfo(domains, libraries = [], changedFiles = []) {
  const domainList = Array.from(domains.keys());
  
  // If no domains detected, return generic update
  if (domainList.length === 0) {
    const fileTags = extractFileNames(changedFiles);
    const folderTags = extractFolderTags(changedFiles);
    const tags = fileTags.length > 0 ? fileTags : folderTags;
    
    return [{
      title: 'Code Updates',
      icon: '✨',
      description: 'General code improvements and maintenance',
      tags: tags.length > 0 ? tags : ['core']
    }];
  }
  
  // If multiple domains (3+), create separate cards for top domains (max 3)
  if (domainList.length >= 3) {
    const events = [];
    
    for (let i = 0; i < Math.min(3, domainList.length); i++) {
      const domainName = domainList[i];
      const domainConfig = domains.get(domainName);
      const domainFiles = domainConfig.files || [];
      
      // Get file names for this specific domain
      const fileTags = extractFileNames(domainFiles);
      
      // Try to generate business title from actual files
      const businessTitle = generateBusinessTitle(domainFiles);
      const descriptiveTitle = businessTitle || makeDescriptiveTitle(domainName);
      
      // Generate specific description
      const description = generateSpecificDescription(domainName, domainFiles);
      
      events.push({
        title: descriptiveTitle,
        icon: domainConfig.icon,
        description,
        tags: fileTags.length > 0 ? fileTags : [domainName.toLowerCase()]
      });
    }
    
    return events;
  }
  
  // Single or dual domain - create one card
  const primary = domainList[0];
  const primaryConfig = domains.get(primary);
  
  // Collect all files across domains
  const allFiles = [];
  for (const domain of domains.values()) {
    allFiles.push(...(domain.files || []));
  }
  
  const fileTags = extractFileNames(allFiles);
  
  // Try to generate business title from actual files
  const businessTitle = generateBusinessTitle(allFiles);
  const descriptiveTitle = businessTitle || makeDescriptiveTitle(primary);
  
  // Generate description
  let description = '';
  if (domainList.length === 1) {
    description = generateSpecificDescription(primary, allFiles);
  } else {
    // Two domains
    const other = domainList[1];
    description = `Implemented ${primary.toLowerCase()} and ${other.toLowerCase()} features`;
  }
  
  return [{
    title: descriptiveTitle,
    icon: primaryConfig.icon,
    description,
    tags: fileTags.length > 0 ? fileTags : [primary.toLowerCase()]
  }];
}

/**
 * Generate specific description based on domain and files changed
 */
/**
 * Generate business-focused description from actual changes
 * Uses file names to create natural, business-context descriptions
 */
function generateSpecificDescription(domainName, files) {
  const fileCount = files.length;
  
  // Extract business terms from file names
  const businessTerms = [];
  for (const file of files) {
    const parts = file.split('/');
    const fileName = parts[parts.length - 1]
      .replace(/\.(js|ts|jsx|tsx|py|java|go|rb|php|cs|cpp|vue|svelte|css|scss|png|jpg|svg)$/i, '');
    
    const businessTerm = fileName
      .replace(/(Controller|Service|Model|Route|Page|Component|View|Manager|Handler|Provider|Repository|Util|Helper|Test|Spec)$/i, '')
      .trim();
    
    if (businessTerm && businessTerm.length > 2 && !/^(index|main|app|base|config|types?)$/i.test(businessTerm)) {
      // Normalize to readable format
      const normalized = businessTerm
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[-_]/g, ' ')
        .toLowerCase();
      businessTerms.push(normalized);
    }
  }
  
  // Get unique terms, sorted by length (more specific first)
  const uniqueTerms = [...new Set(businessTerms)].sort((a, b) => b.length - a.length);
  
  // Detect change types
  const hasImages = files.some(f => /\.(png|jpg|jpeg|svg|gif)$/i.test(f));
  const hasDocs = files.some(f => /\.(md|txt|pdf)$/i.test(f) || /docs?/i.test(f));
  const hasControllers = files.some(f => /controller/i.test(f));
  const hasServices = files.some(f => /service/i.test(f));
  const hasRoutes = files.some(f => /route/i.test(f));
  const hasModels = files.some(f => /model/i.test(f));
  const hasPages = files.some(f => /page/i.test(f));
  const hasComponents = files.some(f => /component/i.test(f));
  const hasTests = files.some(f => /test|spec/i.test(f));
  
  // Special cases
  if (hasImages && uniqueTerms.some(t => /deploy/i.test(t))) {
    return `Added deployment diagrams and configuration`;
  }
  
  if (hasImages) {
    const imageTerms = uniqueTerms.filter(t => t.length > 3).slice(0, 2);
    if (imageTerms.length > 0) {
      return `Added ${imageTerms.join(' and ')} assets`;
    }
    return `Added ${fileCount} image${fileCount > 1 ? 's' : ''}`;
  }
  
  if (hasDocs) {
    return `Updated documentation for ${uniqueTerms.slice(0, 2).join(' and ')}`;
  }
  
  // Build business-focused description
  if (uniqueTerms.length === 0) {
    return `Updated ${fileCount} file${fileCount > 1 ? 's' : ''}`;
  }
  
  // Determine action verb based on file types
  let action = 'Updated';
  if (hasRoutes && hasControllers) {
    action = 'Implemented';
  } else if (hasServices && hasModels) {
    action = 'Enhanced';
  } else if (hasPages || hasComponents) {
    action = 'Improved';
  }
  
  // Pick top 1-2 business terms
  const topTerms = uniqueTerms.slice(0, 2);
  
  // Add context based on what changed
  const contexts = [];
  if (hasControllers || hasServices || hasRoutes) contexts.push('functionality');
  if (hasPages || hasComponents) contexts.push('interface');
  if (hasModels) contexts.push('data handling');
  if (hasTests) contexts.push('testing');
  
  const context = contexts.length > 0 ? ` ${contexts[0]}` : '';
  
  if (topTerms.length === 1) {
    return `${action} ${topTerms[0]}${context}`;
  } else {
    return `${action} ${topTerms[0]} and ${topTerms[1]}${context}`;
  }
}
