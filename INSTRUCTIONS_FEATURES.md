# Timeline Generation Instructions

This document defines the requirements and specifications for generating Feature timelines from git history.

---

## Feature Timeline Requirements

### Output Format

Each timeline card should contain:
- **Date**: Formatted as "January 14, 2026"
- **Tags**: Show actual file names (RuleController, RuleManager, etc.)
- **Title**: More descriptive (e.g., "Rule Management" instead of just "Rule")
  - Ensure all titles have 2 or more words (no single-word titles like "Routes", "Components").
  - Use a verb + noun style. Such as "Added Tink Integration". "Enabled Google sign in" etc.
  - Prefer Business-focused titles, extracted from actual file names. So say if a file is called TinkController prefer calling it "Added Tink Integration" over their technical counterparts say "Added Backend Controllers".
- **Description**: More informative based on actual changes.
  - Use similar logic as for title but with a little more details. 
  - Show count of files touched in brackets, as say (5 files)
- **Multiple cards per day**: Split into up to 3 cards when different areas are touched

### General instructions
- Group same-date cards horizontally instead of stacking them vertically
- Timeline shows date progression, not just individual features
- Center timeline with cards alternating left/right


### Data Sources

1. **Git commit diffs** - analyze actual file changes and content
2. **File paths and names** - derive domain intent from structure
3. **File content analysis** - look at actual code changes (function names, class names, imports)
4. **Source files only** - exclude config files, lock files, docs

### ⚠️ IMPORTANT: Ignore Commit Messages

**DO NOT rely on commit messages** to determine what features were introduced.

Commit messages can be:
- Vague ("fix bug", "update code")
- Misleading ("add feature X" when actually doing Y)
- Incomplete (doesn't mention all changes)
- Lying (says one thing, does another)

**ALWAYS derive feature detection from actual file changes:**
- File paths (e.g., `/auth/resetPassword.js` → Password Reset)
- Function/class names in the diff
- Import statements added
- Actual code patterns

### Grouping Rules

1. **Group by Date**: All features on the same day appear in ONE card
2. **Derive domain meaning** from file paths and actual code changes (NOT commit messages)

### Phase Title Naming Logic

Generate **domain-meaningful names** based on what was built, NOT technical layers. So look into the "actual changes" that were in the committed files. Use below sample only as an example. Do not hardcode these terms into our functions:

| Files/Keywords Detected (becomes tags) | Phase Name | Icon | Description |
|------------------------|------------|------|-------------|
| password + reset files | Password Reset Feature | 🔑 | Implemented password reset functionality |
| rule + engine files | Rule Engine Implementation | ⚙️ | Introduced business rule engine |
| payment + stripe files | Payment Integration | 💳 | Added payment processing capabilities |
| email + notification files | Email Notifications | 📧 | Implemented email notification system |
| search + filter files | Search & Filtering | 🔍 | Added search and filter functionality |
| dashboard + analytics files | Analytics Dashboard | 📊 | Built analytics and reporting dashboard |
| upload + storage files | File Upload System | 📁 | Implemented file upload functionality |
| auth + login + signup | User Authentication | 🔐 | Added user authentication system |
| profile + settings | User Profile Management | 👤 | Implemented user profile features |
| Multiple domains | [Primary Domain] & More | ✨ | Multiple feature additions |

### Key Principle: Domain over Technical

❌ **WRONG**: "Backend Development", "Frontend Development", "API & Database"
✅ **RIGHT**: "Password Reset Feature", "Rule Engine Implementation", "Payment Integration"

The phase name should answer: **"What business capability was added?"** not "What technical layer was changed?"

## HTML Output Specifications

### Visual Style
- Gradient background: #667eea to #764ba2
- Cards: White with rounded corners (12px), shadow
- Timeline: Vertical line in center, alternating left/right cards
- Tags: Library Badges with Crescent Moon Icon

### Responsive
- Max width: 1100px
- Cards: 48% width on desktop
- Mobile: Stack vertically

---

## Files Generated (only feature specific)

```
.timeline/
├── index.html              # Dashboard with links to both timelines
├── FEATURE_TIMELINE.html   # Feature timeline visualization
├── FEATURE_TIMELINE.md     # Markdown version
├── TOOLING_TIMELINE.html   # Tooling timeline visualization
└── TOOLING_TIMELINE.md     # Markdown version
```
---

