# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Court Documents Generator** - A vanilla HTML/CSS/JavaScript web application for generating professional court documents including witness statements, position statements, skeleton arguments, and draft orders.

**Live Site:** https://court-documents-generator.pages.dev (deployed via Cloudflare Pages)

## Tech Stack

- **HTML5** - index.html (single page application)
- **CSS3** - style.css (custom styling)
- **Vanilla JavaScript** - app.js (main logic), auth.js (Firebase auth)
- **Firebase** - Authentication only (email/password)
- **Hosting** - Cloudflare Pages
- **External Libraries** (via CDN):
  - docx.js - Word document generation
  - jsPDF - PDF generation
  - FileSaver.js - File downloads

## Deployment

Push to `main` branch triggers automatic deployment to Cloudflare Pages.

```bash
git add -A && git commit -m "message" && git push origin main
```

## File Structure

```
court-documents-generator/
├── index.html          # Main HTML file
├── app.js              # Main application logic
├── auth.js             # Firebase authentication
├── firebase-config.js  # Firebase configuration
├── style.css           # Styling
└── CLAUDE.md           # This file
```

## Features

- **Document Types:** Witness Statement, Position Statement, Skeleton Argument, Draft Order
- **Save/Load:** Save work-in-progress to JSON, load later to continue
- **Export:** Download as Word (.docx) or PDF
- **Firebase Auth:** Email/password authentication required

## Related Apps

| App | URL | Repo |
|-----|-----|------|
| Court Bundle Builder | https://courtbundlebuilder.co.uk | court-bundle-builder |
| Legal Briefing Notes Generator | https://legal-briefing-notes-generator.pages.dev | legal-briefing-notes-generator |
| Court Documents Generator | https://court-documents-generator.pages.dev | This repo |
