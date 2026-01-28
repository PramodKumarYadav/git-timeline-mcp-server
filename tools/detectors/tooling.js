/**
 * Tooling Detection - Based on INSTRUCTIONS_TOOLING.md
 * 
 * Key Principles:
 * - Phase Title: Short summary of what the libraries provide
 * - Description: 7-10 words elaborating on the title
 * - Tags: Only NEW libraries introduced (track shown libraries)
 * - First day = "Project Kickoff"
 * - Ignore commit messages completely
 */

// Track tools that have already been shown globally
const shownTools = new Set();

// =============================================================================
// PACKAGE NAME EXTRACTION
// =============================================================================

/**
 * Extract package names from package.json diff lines
 */
export function extractAddedDependencies(pkgDiff) {
  const packages = [];
  let inDepsSection = false;
  
  for (const line of pkgDiff.split('\n')) {
    // Check if we're entering a dependencies section
    if (/"(dependencies|devDependencies|peerDependencies)"/.test(line)) {
      inDepsSection = true;
      continue;
    }
    
    // Check if we're leaving dependencies section
    if (inDepsSection && (/^\s*[}\]]/.test(line) || /"(scripts|type|name|version|description)"/.test(line))) {
      inDepsSection = false;
      continue;
    }
    
    // Only process added lines within dependencies sections
    if (inDepsSection && line.startsWith('+') && !line.startsWith('+++')) {
      const match = line.match(/["']([^"']+)["']\s*:\s*["']/);
      if (match && match[1]) {
        const pkgName = match[1].trim();
        // Filter out package.json metadata fields
        if (!['scripts', 'type', 'name', 'version', 'description', 'main', 'module', 'exports', 'author', 'license', 'repository', 'bugs', 'homepage', 'keywords', 'private', 'workspaces'].includes(pkgName)) {
          packages.push(pkgName);
        }
      }
    }
  }
  
  return [...new Set(packages)];
}

/**
 * Detect tool names from config files
 */
export function extractToolsFromConfigFiles(changedFiles) {
  const tools = [];
  
  const configPatterns = [
    { pattern: /^\.github\/workflows\/.+\.ya?ml$/, name: 'GitHub Actions' },
    { pattern: /^Dockerfile$/, name: 'Docker' },
    { pattern: /^docker-compose\.ya?ml$/, name: 'Docker Compose' },
    { pattern: /^\.github\/dependabot\.ya?ml$/, name: 'Dependabot' },
    { pattern: /^\.editorconfig$/, name: 'EditorConfig' },
    { pattern: /^\.husky\//, name: 'Husky' },
    { pattern: /^tsconfig.*\.json$/, name: 'TypeScript' },
    { pattern: /^\.eslintrc/, name: 'ESLint' },
    { pattern: /^eslint\.config\./, name: 'ESLint' },
    { pattern: /^\.prettierrc/, name: 'Prettier' },
    { pattern: /^prettier\.config\./, name: 'Prettier' },
    { pattern: /^jest\.config\./, name: 'Jest' },
    { pattern: /^vitest\.config\./, name: 'Vitest' },
    { pattern: /^playwright\.config\./, name: 'Playwright' },
    { pattern: /^\.releaserc/, name: 'Semantic Release' },
    { pattern: /^commitlint\.config\./, name: 'Commitizen' },
    { pattern: /^\.czrc$/, name: 'Commitizen' },
    { pattern: /^railway\.json$/, name: 'Railway' },
    { pattern: /^railway\.toml$/, name: 'Railway' },
    { pattern: /^vercel\.json$/, name: 'Vercel' },
    { pattern: /^netlify\.toml$/, name: 'Netlify' },
  ];
  
  for (const file of changedFiles) {
    for (const { pattern, name } of configPatterns) {
      if (pattern.test(file)) {
        tools.push(name);
      }
    }
  }
  
  return [...new Set(tools)];
}

// =============================================================================
// LIBRARY CATEGORIZATION
// =============================================================================

/**
 * Categorize libraries by their primary purpose
 */
function categorizeLibraries(libraries) {
  const categories = {
    backend: [],
    frontend: [],
    database: [],
    auth: [],
    email: [],
    payment: [],
    validation: [],
    testing: [],
    build: [],
    linting: [],
    formatting: [],
    typescript: [],
    deployment: [],
    cicd: [],
    scheduler: [],
    fileStorage: [],
    monitoring: [],
    other: []
  };
  
  for (const lib of libraries) {
    const lower = lib.toLowerCase();
    
    // Backend frameworks
    if (/^(express|fastify|koa|hapi|nestjs|@nestjs)/.test(lower)) {
      categories.backend.push(lib);
    }
    // Frontend frameworks
    else if (/^(react|vue|angular|svelte|next|nuxt|@angular|solid-js)/.test(lower)) {
      categories.frontend.push(lib);
    }
    // Database
    else if (/mongoose|prisma|@prisma|^pg$|mysql|mongodb|sequelize|typeorm|knex/.test(lower)) {
      categories.database.push(lib);
    }
    // Authentication
    else if (/passport|jwt|jsonwebtoken|bcrypt|^auth|next-auth|@auth/.test(lower)) {
      categories.auth.push(lib);
    }
    // Email
    else if (/brevo|sendgrid|mailgun|nodemailer|@sendgrid|@getbrevo/.test(lower)) {
      categories.email.push(lib);
    }
    // Payment
    else if (/stripe|@stripe|payment|tink/.test(lower)) {
      categories.payment.push(lib);
    }
    // Validation
    else if (/^zod$|^yup$|^joi$|validator|class-validator/.test(lower)) {
      categories.validation.push(lib);
    }
    // Testing
    else if (/jest|vitest|mocha|chai|@testing-library|@playwright|cypress|supertest/.test(lower)) {
      categories.testing.push(lib);
    }
    // Build tools
    else if (/^vite$|webpack|rollup|esbuild|parcel|turbopack/.test(lower)) {
      categories.build.push(lib);
    }
    // Linting
    else if (/eslint|@eslint|tslint/.test(lower)) {
      categories.linting.push(lib);
    }
    // Formatting
    else if (/prettier|@prettier/.test(lower)) {
      categories.formatting.push(lib);
    }
    // TypeScript
    else if (/^typescript$|@types\//.test(lower)) {
      categories.typescript.push(lib);
    }
    // Deployment
    else if (/@railway|@vercel|@netlify/.test(lower)) {
      categories.deployment.push(lib);
    }
    // CI/CD
    else if (/github.*action|gitlab.*ci|circleci/.test(lower)) {
      categories.cicd.push(lib);
    }
    // Scheduler
    else if (/node-cron|cron|bull|agenda|bee-queue/.test(lower)) {
      categories.scheduler.push(lib);
    }
    // File Storage
    else if (/multer|aws-sdk|@aws-sdk\/client-s3|cloudinary/.test(lower)) {
      categories.fileStorage.push(lib);
    }
    // Monitoring
    else if (/sentry|@sentry|winston|pino|morgan/.test(lower)) {
      categories.monitoring.push(lib);
    }
    else {
      categories.other.push(lib);
    }
  }
  
  return categories;
}

// =============================================================================
// PHASE INFO GENERATION
// =============================================================================

/**
 * Generate phase title and description based on introduced libraries
 * Following INSTRUCTIONS_TOOLING.md requirements
 */
export async function generateToolingPhaseInfo(packageNames, configTools, changedFiles, isFirstDay = false) {
  try {
    // Filter to only NEW tools
    const newPackages = packageNames.filter(pkg => !shownTools.has(pkg));
    const newConfigTools = configTools.filter(tool => !shownTools.has(tool));
    
    // Mark as shown
    newPackages.forEach(pkg => shownTools.add(pkg));
    newConfigTools.forEach(tool => shownTools.add(tool));
    
    const allNewTools = [...newPackages, ...newConfigTools];
    
    // If no new tools, skip this date
    if (allNewTools.length === 0) {
      return {
        title: '',
        description: '',
        icon: '',
        tools: []
      };
    }
    
    // Categorize the libraries
    const categories = categorizeLibraries(allNewTools);
  
  // MULTI-CATEGORY DETECTION - Check ALL categories, show max 3 in title
  const activeCategories = [];
  if (categories.frontend.length > 0) activeCategories.push({ name: 'Frontend', icon: '🎨' });
  if (categories.backend.length > 0) activeCategories.push({ name: 'Backend', icon: '⚡' });
  if (categories.database.length > 0) activeCategories.push({ name: 'Database', icon: '🗄️' });
  if (categories.auth.length > 0) activeCategories.push({ name: 'Authentication', icon: '🔐' });
  if (categories.email.length > 0) activeCategories.push({ name: 'Email', icon: '📧' });
  if (categories.payment.length > 0) activeCategories.push({ name: 'Payment', icon: '💳' });
  if (categories.validation.length > 0) activeCategories.push({ name: 'Validation', icon: '✅' });
  if (categories.testing.length > 0) activeCategories.push({ name: 'Testing', icon: '🧪' });
  if (categories.build.length > 0) activeCategories.push({ name: 'Build', icon: '⚙️' });
  if (categories.linting.length > 0 || categories.formatting.length > 0) {
    activeCategories.push({ name: 'Linting', icon: '✨' });
  }
  if (categories.typescript.length > 0 || configTools.includes('TypeScript')) {
    activeCategories.push({ name: 'TypeScript', icon: '📘' });
  }
  if (categories.deployment.length > 0 || configTools.some(t => /Railway|Vercel|Netlify|Heroku/.test(t))) {
    activeCategories.push({ name: 'Deployment', icon: '🚀' });
  }
  if (categories.cicd.length > 0 || configTools.includes('GitHub Actions')) {
    activeCategories.push({ name: 'CI/CD', icon: '🔄' });
  }
  if (categories.scheduler.length > 0) activeCategories.push({ name: 'Scheduler', icon: '⏰' });
  if (categories.fileStorage.length > 0) activeCategories.push({ name: 'Storage', icon: '📁' });
  if (categories.monitoring.length > 0) activeCategories.push({ name: 'Monitoring', icon: '📊' });
  
  // Multi-category title (2+ categories, show max 3)
  if (activeCategories.length >= 2) {
    const categoryNames = activeCategories.slice(0, 3).map(c => c.name);
    const title = categoryNames.join(', ').replace(/, ([^,]*)$/, ' & $1') + ' Setup';
    const primaryIcon = activeCategories[0].icon;
    
    let description = '';
    if (categoryNames.length === 2) {
      description = `Configured ${categoryNames[0].toLowerCase()} and ${categoryNames[1].toLowerCase()} infrastructure`;
    } else if (categoryNames.length === 3) {
      description = `Set up ${categoryNames[0].toLowerCase()}, ${categoryNames[1].toLowerCase()} and ${categoryNames[2].toLowerCase()}`;
    }
    
    return {
      title,
      description,
      icon: primaryIcon,
      tools: allNewTools
    };
  }
  
  // EMAIL INTEGRATION
  if (categories.email.length > 0) {
    const emailLib = categories.email[0];
    return {
      title: 'Email Integration',
      description: `Added ${emailLib} for sending transactional emails`,
      icon: '📧',
      tools: allNewTools
    };
  }
  
  // AUTHENTICATION
  if (categories.auth.length > 0) {
    return {
      title: 'User Authentication',
      description: 'Implemented secure user authentication and authorization',
      icon: '🔐',
      tools: allNewTools
    };
  }
  
  // PAYMENT PROCESSING
  if (categories.payment.length > 0) {
    return {
      title: 'Payment Integration',
      description: 'Integrated payment processing for transactions',
      icon: '💳',
      tools: allNewTools
    };
  }
  
  // DATABASE INTEGRATION
  if (categories.database.length > 0) {
    const dbLib = categories.database[0];
    return {
      title: 'Database Integration',
      description: `Set up ${dbLib} for data persistence`,
      icon: '🗄️',
      tools: allNewTools
    };
  }
  
  // VALIDATION
  if (categories.validation.length > 0) {
    const valLib = categories.validation[0];
    return {
      title: 'Validation Layer',
      description: `Added ${valLib} for data validation`,
      icon: '✅',
      tools: allNewTools
    };
  }
  
  // TESTING INFRASTRUCTURE
  if (categories.testing.length > 0) {
    const testLib = categories.testing[0];
    const testType = /playwright|cypress/i.test(testLib) ? 'end-to-end' : 'unit';
    return {
      title: 'Testing Infrastructure',
      description: `Set up ${testLib} for ${testType} testing`,
      icon: '🧪',
      tools: allNewTools
    };
  }
  
  // TYPESCRIPT
  if (categories.typescript.length > 0 || configTools.includes('TypeScript')) {
    return {
      title: 'Type Safety',
      description: 'Added TypeScript for static type checking',
      icon: '📘',
      tools: allNewTools
    };
  }
  
  // CODE QUALITY (Linting + Formatting)
  if (categories.linting.length > 0 && categories.formatting.length > 0) {
    return {
      title: 'Code Quality Tools',
      description: 'Configured linting and formatting for consistent code',
      icon: '✨',
      tools: allNewTools
    };
  }
  
  // LINTING ONLY
  if (categories.linting.length > 0) {
    return {
      title: 'Code Linting',
      description: 'Added ESLint for code quality checks',
      icon: '✨',
      tools: allNewTools
    };
  }
  
  // FORMATTING ONLY
  if (categories.formatting.length > 0) {
    return {
      title: 'Code Formatting',
      description: 'Added Prettier for consistent code style',
      icon: '✨',
      tools: allNewTools
    };
  }
  
  // BUILD TOOLS
  if (categories.build.length > 0) {
    const buildTool = categories.build[0];
    return {
      title: 'Build Tooling',
      description: `Configured ${buildTool} for fast development builds`,
      icon: '⚙️',
      tools: allNewTools
    };
  }
  
  // DEPLOYMENT
  if (categories.deployment.length > 0 || configTools.some(t => /Railway|Vercel|Netlify|Heroku/.test(t))) {
    const platform = configTools.find(t => /Railway|Vercel|Netlify|Heroku/.test(t)) || 'cloud';
    return {
      title: 'Deployment Setup',
      description: `Configured ${platform} for production hosting`,
      icon: '🚢',
      tools: allNewTools
    };
  }
  
  // CI/CD
  if (categories.cicd.length > 0 || configTools.includes('GitHub Actions')) {
    return {
      title: 'CI/CD Pipeline',
      description: 'Automated testing and deployment workflows',
      icon: '🔄',
      tools: allNewTools
    };
  }
  
  // BACKGROUND JOBS
  if (categories.scheduler.length > 0) {
    const schedulerLib = categories.scheduler[0];
    return {
      title: 'Background Jobs',
      description: `Added ${schedulerLib} for scheduled tasks`,
      icon: '⏰',
      tools: allNewTools
    };
  }
  
  // FILE STORAGE
  if (categories.fileStorage.length > 0) {
    const storageLib = categories.fileStorage[0];
    return {
      title: 'File Storage',
      description: `Integrated ${storageLib} for file uploads`,
      icon: '📁',
      tools: allNewTools
    };
  }
  
  // MONITORING
  if (categories.monitoring.length > 0) {
    return {
      title: 'Monitoring & Logging',
      description: 'Added error tracking and application monitoring',
      icon: '📊',
      tools: allNewTools
    };
  }
  
  // BACKEND FRAMEWORK
  if (categories.backend.length > 0) {
    const framework = categories.backend[0];
    return {
      title: 'Backend Framework',
      description: `Set up ${framework} server for API`,
      icon: '⚡',
      tools: allNewTools
    };
  }
  
  // FRONTEND FRAMEWORK
  if (categories.frontend.length > 0) {
    const framework = categories.frontend[0];
    return {
      title: 'Frontend Framework',
      description: `Set up ${framework} for user interface`,
      icon: '🎨',
      tools: allNewTools
    };
  }
  
  // FALLBACK - Generic description
  const primaryLib = allNewTools[0];
  return {
    title: 'Dependencies Added',
    description: `Added ${allNewTools.length === 1 ? primaryLib : `${allNewTools.length} new libraries`}`,
    icon: '📦',
    tools: allNewTools
  };
  } catch (error) {
    console.error('[ERROR] generateToolingPhaseInfo failed:', error);
    // Return minimal valid object on error
    return {
      title: 'Dependencies Added',
      description: 'Added new development dependencies',
      icon: '📦',
      tools: packageNames.concat(configTools)
    };
  }
}

/**
 * Reset shown tools (for testing/re-runs)
 */
export function resetShownTools() {
  shownTools.clear();
}
