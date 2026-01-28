# Timeline Generation Instructions

This document defines the requirements and specifications for generating Feature timelines from git history.

---

## Feature Timeline Requirements

### Output Format

Each timeline card should contain:
- **Date**: Formatted as "January 14, 2026"
- **Phase Title**: Meaningful category-based name.
  - A very short summary of what the change contains (few words). 
  - If there are more than one category of changes, just pick one most prominant one.
- **Icon**: Emoji representing the feature area
- **Sub Description**: Summary of changes (not raw messages). 
  - A little longer (7 to 10 words ) to elaborate a bit on the phase title. You may here talk about more changes that are not listed in title. 
- **Tags**: Individual features "newly" introduced on that day in a pill-shaped badges.

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

Generate **domain-meaningful names** based on what was built, NOT technical layers. You can confidentaly derive it from "file names that are changed". Use below sample only as an example. Do not hardcode these terms into our functions:

| Files/Keywords Detected | Phase Name | Icon | Description |
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

### Tags and sub description (Domain Feature Detection)

You can get the "Tag" name from the parent folder i.e. changed and you can get the "sub description" from the actual content that is changed in that file. In below example, based on what is changed (second column), a sub descriptoin can be created (first column). The tags would simply be the parent folder name. 

```
Password Reset:       /password/, /reset/, "password reset", "forgot password"
User Authentication:  /auth/, /login/, /signup/, /session/, "login", "signup", "authentication"
User Profile:         /profile/, /account/, /settings/, "profile", "account settings"
Email Notifications:  /email/, /mail/, /notification/, "email", "notification", "send mail"
Rule Engine:          /rule/, /engine/, /policy/, "rule engine", "business rules"
Payment Integration:  /payment/, /stripe/, /billing/, /invoice/, "payment", "checkout", "billing"
File Upload:          /upload/, /storage/, /s3/, "file upload", "image upload"
Search:               /search/, /filter/, /query/, "search", "filter"
Dashboard:            /dashboard/, /analytics/, /stats/, "dashboard", "analytics"
Reporting:            /report/, /export/, "report", "export"
User Management:      /user/, /admin/, /role/, "user management", "admin panel", "roles"
API Integration:      /integration/, /webhook/, /api/, "integrate", "webhook", "third-party"
Caching:              /cache/, /redis/, "caching", "redis"
Scheduled Jobs:       /cron/, /job/, /scheduler/, "scheduled", "cron job", "background job"
Data Migration:       /migration/, /seed/, "migration", "data import"
```

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

