# FuelLog — React + TypeScript

Car fuel & service tracker. Converted from vanilla JS to React + TypeScript.

## Prerequisites
- Node.js (v18 or higher) — https://nodejs.org
- VS Code — https://code.visualstudio.com

## Getting Started

```bash
# 1. Open this folder in VS Code
code .

# 2. Open the terminal in VS Code (Ctrl+` or View > Terminal)

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

Your browser will open automatically at http://localhost:5173

**Login credentials:**
- Username: `Admin`
- Password: `727272`

## Project Structure

```
src/
├── App.tsx                   # Main app — all state lives here
├── main.tsx                  # React entry point
├── styles/global.css         # All CSS (themes, layout, components)
├── types/index.ts            # TypeScript interfaces
├── utils/
│   ├── storage.ts            # localStorage read/write
│   ├── units.ts              # IN/US unit system logic
│   ├── chartSetup.ts         # Chart.js registration
│   └── seedData.ts           # Baleno sample data
└── components/
    ├── Login.tsx             # Login page
    ├── Header.tsx            # Top bar with theme picker + logout
    ├── Nav.tsx               # Page navigation tabs
    ├── Toast.tsx             # Notification toasts
    ├── NewCarModal.tsx       # Add car modal
    ├── DeleteModal.tsx       # Confirm delete modal
    ├── Dashboard.tsx         # Stats + 4 charts
    ├── Entries.tsx           # Fuel log table + pagination
    ├── AddEntry.tsx          # Add/edit fuel entry form
    ├── Service.tsx           # Service form + history table
    ├── Reports.tsx           # Yearly reports + top stations
    └── Cars.tsx              # Car cards + set active
```

## Deploy to GitHub Pages

```bash
# One command does everything:
npm run deploy
```

This builds the app and pushes the output to the `gh-pages` branch automatically.

Then in your GitHub repo:
Settings → Pages → Source → `gh-pages` branch → Save

## Build for Production

```bash
npm run build
# Output goes to dist/ folder
```

## Phase 2 (Future)
- Replace localStorage with SQLite database
- Add Node.js backend API
- Proper user authentication
- Email reports feature
