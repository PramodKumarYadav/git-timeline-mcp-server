/**
 * Output Generators
 * Generate HTML, Markdown, Mermaid, and Dashboard files
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

// =============================================================================
// MERMAID GENERATION
// =============================================================================

export function toMermaidTimeline(title, events) {
  const lines = ['timeline', `  title ${title}`];
  
  for (const e of events) {
    lines.push(`  ${e.date} : ${e.title}`);
  }
  
  return lines.join('\n');
}

// =============================================================================
// HTML TIMELINE GENERATION
// =============================================================================

export function generateTimelineHtml(filepath, title, events) {
  const projectName = 'Project';
  const headerIcon = title.includes('Feature') ? '📅' : '🔧';
  
  // Group events by date
  const eventsByDate = new Map();
  for (const event of events) {
    if (!eventsByDate.has(event.date)) {
      eventsByDate.set(event.date, []);
    }
    eventsByDate.get(event.date).push(event);
  }
  
  const sortedDates = Array.from(eventsByDate.keys()).sort((a, b) => a.localeCompare(b));
  
  // Generate timeline items grouped by date
  const timelineItems = sortedDates.map((date) => {
    const dateEvents = eventsByDate.get(date);
    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
    
    // Create cards for all events on this date
    const cardsHtml = dateEvents.map(event => {
      const tags = event.tags || [];
      const description = event.description || '';
      const icon = event.icon || '✨';
      
      const tagsHtml = tags.length > 0 
        ? '<div class="tags">' + tags.map(tag => '<span class="tag">' + tag + '</span>').join('') + '</div>'
        : '';
      
      const descHtml = description ? '<div class="card-description">' + description + '</div>' : '';
      
      return `
        <div class="card">
          <div class="card-header">
            <span class="emoji">${icon}</span>
            <div class="card-title">${event.title}</div>
          </div>
          ${descHtml}
          ${tagsHtml}
        </div>`;
    }).join('');
    
    return `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="date-header">${formattedDate}</div>
        <div class="cards-row">
          ${cardsHtml}
        </div>
      </div>
    </div>`;
  }).join('');
  
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
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      bottom: 0;
      width: 4px;
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 50px;
      display: flex;
      justify-content: flex-start;
      padding-left: 0;
      padding-right: 50%;
    }
    .timeline-item:nth-child(even) {
      justify-content: flex-end;
      padding-left: 50%;
      padding-right: 0;
    }
    .timeline-dot {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 8px;
      width: 18px;
      height: 18px;
      background: white;
      border: 4px solid #667eea;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(255,255,255,0.2);
      z-index: 1;
    }
    .timeline-content {
      max-width: 550px;
      width: 100%;
    }
    .date-header {
      font-size: 15px;
      font-weight: 700;
      color: white;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .cards-row {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      transition: transform 0.3s, box-shadow 0.3s;
      width: 100%;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.2);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f0f0;
    }
    .card-header .emoji {
      font-size: 24px;
    }
    .card-title {
      font-size: 18px;
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
      background: #e8e8ff;
      color: #4a4a9e;
      padding: 6px 12px 6px 10px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .tag::before {
      content: '🌙';
      font-size: 14px;
    }
    @media (max-width: 768px) {
      .timeline::before {
        left: 20px;
      }
      .timeline-item {
        width: calc(100% - 40px);
        margin-left: 40px !important;
        padding-left: 20px !important;
        padding-right: 0 !important;
      }
      .timeline-dot {
        left: -28px !important;
        right: auto !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>
      <span>${headerIcon}</span>
      <span>${projectName} - ${title}</span>
    </h1>
  </div>
  
  <div class="timeline">
    ${timelineItems}
  </div>
</body>
</html>`;
  
  writeFileSync(filepath, html, 'utf8');
}

// =============================================================================
// MARKDOWN GENERATION
// =============================================================================

export function generateTimelineMd(filepath, title, events) {
  let content = `# ${title}\n\n`;
  content += `Generated: ${new Date().toISOString()}\n\n`;
  content += `Total phases: **${events.length}**\n\n`;
  content += `---\n\n`;
  
  for (const e of events) {
    const formattedDate = new Date(e.date).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
    
    content += `## ${e.icon} ${e.title}\n\n`;
    content += `**${formattedDate}**\n\n`;
    
    if (e.description) {
      content += `${e.description}\n\n`;
    }
    
    if (e.tags?.length) {
      content += `**Tags:** ${e.tags.map(t => `\`${t}\``).join(' ')}\n\n`;
    }
    
    content += `---\n\n`;
  }
  
  writeFileSync(filepath, content, 'utf8');
}

// =============================================================================
// DASHBOARD GENERATION
// =============================================================================

export function generateDashboard(repoPath, featureEvents = [], toolingEvents = []) {
  const timelineDir = path.join(repoPath, '.timeline');
  mkdirSync(timelineDir, { recursive: true });
  
  // Ensure arrays are defined and valid
  const safeFeatureEvents = Array.isArray(featureEvents) ? featureEvents : [];
  const safeToolingEvents = Array.isArray(toolingEvents) ? toolingEvents : [];
  
  const featureRows = safeFeatureEvents.slice(0, 8).map(e => {
    const formattedDate = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `<tr>
      <td><strong>${e.icon} ${e.title}</strong><br><small style="color:#999">${formattedDate}</small></td>
      <td>${e.description || ''}</td>
    </tr>`;
  }).join('');

  const toolingRows = safeToolingEvents.slice(0, 8).map(e => {
    const formattedDate = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `<tr>
      <td><strong>${e.icon} ${e.title}</strong><br><small style="color:#999">${formattedDate}</small></td>
      <td>${e.tags?.join(', ') || ''}</td>
    </tr>`;
  }).join('');

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
        <div class="stat-value">${featureEvents.length}</div>
      </div>
      <div class="stat-group">
        <div class="stat-label">Tooling Phases</div>
        <div class="stat-value">${toolingEvents.length}</div>
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

  const indexPath = path.join(timelineDir, 'index.html');
  writeFileSync(indexPath, indexHtml, 'utf8');
  return indexPath;
}

// =============================================================================
// HELPER - Ensure timeline directory exists
// =============================================================================

export function ensureTimelineDir(repoPath) {
  const timelineDir = path.join(repoPath, '.timeline');
  mkdirSync(timelineDir, { recursive: true });
  return timelineDir;
}
