#!/usr/bin/env node

import { analyzeFeatureTimeline, analyzeToolingTimeline } from './tools/git.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const timelineDir = path.join(process.cwd(), '.timeline');
mkdirSync(timelineDir, { recursive: true });

console.log('\n' + '='.repeat(70));
console.log('📊 Generating Feature & Tooling Timelines');
console.log('='.repeat(70) + '\n');

// Main async function
async function main() {
  // Generate Feature Timeline
  console.log('[1/3] Generating Feature Timeline...');
  const features = analyzeFeatureTimeline();
  console.log(`✓ Found ${features.events.length} feature phases`);
  features.events.forEach((event, i) => {
    console.log(`  ${i + 1}. ${event.icon} ${event.title} (${event.date})`);
  });
  console.log(`✓ Files: ${features.files.html}, ${features.files.markdown}\n`);

  // Generate Tooling Timeline (now async - fetches from npm)
  console.log('[2/3] Generating Tooling Timeline...');
  console.log('⏳ Fetching package information from npm registry...');
  const tooling = await analyzeToolingTimeline();
  console.log(`✓ Found ${tooling.events.length} tooling phases`);
  tooling.events.forEach((event, i) => {
    console.log(`  ${i + 1}. ${event.icon} ${event.title} (${event.date})`);
  });
  console.log(`✓ Files: ${tooling.files.html}, ${tooling.files.markdown}\n`);

  // Create index.html dashboard (no JSON needed)
  console.log('[3/3] Creating dashboard...');

  const featureRows = features.events.slice(0, 5).map(e => 
    `<tr><td><strong>${e.icon} ${e.title}</strong><br><small style="color:#999">${new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small></td><td>${e.description || ''}</td></tr>`
  ).join('');

  const toolingRows = tooling.events.slice(0, 5).map(e => 
    `<tr><td><strong>${e.icon} ${e.title}</strong><br><small style="color:#999">${new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small></td><td>${e.tags?.join(', ') || ''}</td></tr>`
  ).join('');

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timeline Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; display: flex; gap: 20px; }
    .sidebar {
      width: 280px; background: white; border-radius: 8px; padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2); height: fit-content; position: sticky; top: 20px;
    }
    .sidebar h3 { color: #667eea; margin: 0 0 25px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .stat-group { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    .stat-group:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .stat-label { font-size: 11px; color: #999; text-transform: uppercase; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #667eea; }
    .main { flex: 1; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    h1 { color: #667eea; margin: 0 0 5px 0; font-size: 32px; }
    .meta { color: #999; font-size: 13px; margin-bottom: 30px; }
    .links { display: flex; gap: 15px; margin-bottom: 30px; }
    .link-btn {
      padding: 12px 24px; background: #667eea; color: white; text-decoration: none;
      border-radius: 6px; font-weight: 600; transition: background 0.3s;
    }
    .link-btn:hover { background: #5568d3; }
    .section { margin-top: 40px; }
    .section:first-of-type { margin-top: 0; }
    .section-title { font-size: 20px; font-weight: 600; color: #667eea; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8f9fa; }
    th { padding: 12px; text-align: left; font-size: 13px; color: #666; text-transform: uppercase; }
    tbody tr { border-bottom: 1px solid #f0f0f0; transition: background 0.2s; }
    tbody tr:hover { background: #fafafa; }
    td { padding: 14px 12px; font-size: 13px; vertical-align: top; }
  </style>
</head>
<body>
  <div class="container">
    <aside class="sidebar">
      <h3>Timeline Stats</h3>
      <div class="stat-group">
        <div class="stat-label">Feature Phases</div>
        <div class="stat-value">${features.events.length}</div>
      </div>
      <div class="stat-group">
        <div class="stat-label">Tooling Phases</div>
        <div class="stat-value">${tooling.events.length}</div>
      </div>
    </aside>
    <div class="main">
      <h1>📊 Project Timeline</h1>
      <p class="meta">Generated: ${new Date().toLocaleString()}</p>
      <div class="links">
        <a href="FEATURE_TIMELINE.html" class="link-btn">📦 View Features</a>
        <a href="TOOLING_TIMELINE.html" class="link-btn">🔧 View Tooling</a>
      </div>
      
      <div class="section">
        <div class="section-title">📦 Feature Phases</div>
        <table>
          <thead><tr><th>Phase</th><th>Description</th></tr></thead>
          <tbody>${featureRows || '<tr><td colspan="2">No features detected</td></tr>'}</tbody>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">🔧 Tooling Phases</div>
        <table>
          <thead><tr><th>Phase</th><th>Tools</th></tr></thead>
          <tbody>${toolingRows || '<tr><td colspan="2">No tooling detected</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;

  writeFileSync(path.join(timelineDir, 'index.html'), indexHtml);
  console.log(`✓ Saved: index.html\n`);

  console.log('='.repeat(70));
  console.log('✓ Timeline generation complete!');
  console.log('='.repeat(70));
  console.log(`\n📁 Files in .timeline/:`);
  console.log(`   - index.html (dashboard)`);
  console.log(`   - FEATURE_TIMELINE.html`);
  console.log(`   - FEATURE_TIMELINE.md`);
  console.log(`   - TOOLING_TIMELINE.html`);
  console.log(`   - TOOLING_TIMELINE.md`);
}

// Run the main function
main().catch(err => {
  console.error('\n❌ Error generating timelines:', err.message);
  process.exit(1);
});
