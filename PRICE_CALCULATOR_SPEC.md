# Price Calculator & Project DQE Feature - Specification

## Overview
Add a Price Calculator / DQE (Devis Quantitatif et Estimatif) module to the existing Arab Contractors app. This allows users to:
1. View all BOQ items for a project with unit prices
2. Calculate total cost for any item by entering a quantity
3. Import project data from JSON
4. Manually add/edit/delete items
5. Organize items by project (multi-project support)
6. Filter by series (category) and section

## Technical Context

### Existing Stack
- **Frontend**: React 18, React Router 6, Vite, vanilla CSS (NO Tailwind, NO shadcn)
- **Backend**: Express.js (v5), SQLite (better-sqlite3 or sqlite3), Node.js
- **Styling**: Custom CSS with CSS variables, dark mode support
- **Auth**: JWT-based, passcode login
- **UI Pattern**: Pages in `client/src/pages/`, components in `client/src/components/`
- **Existing pages**: Dashboard, Employees, Projects, Storage, Dalots, Calculator, Documents, Login

### CRITICAL: Styling Rules
- Use the SAME CSS patterns as existing pages (see `Dalots.css`, `Storage.css`)
- CSS variables: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--accent`, `--accent-hover`, `--border`
- Dark mode is default (dark green theme)
- NO new CSS frameworks. NO Tailwind. Match existing look.
- Mobile responsive with existing patterns
- FCFA currency with space thousands separator: `1 234 567 FCFA`

### Database
- SQLite via `server/database.js`
- Add new tables, DON'T modify existing ones
- Follow existing patterns for table creation

## New Database Tables

### `dqe_projects`
```sql
CREATE TABLE IF NOT EXISTS dqe_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contract_number TEXT,
    client TEXT,
    contractor TEXT DEFAULT 'Arab Contractors Cameroon LTD',
    total_ht REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### `dqe_sections`
```sql
CREATE TABLE IF NOT EXISTS dqe_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    length_km REAL,
    FOREIGN KEY (project_id) REFERENCES dqe_projects(id) ON DELETE CASCADE
);
```

### `dqe_items`
```sql
CREATE TABLE IF NOT EXISTS dqe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    designation TEXT NOT NULL,
    unite TEXT NOT NULL,
    prix_unitaire REAL NOT NULL DEFAULT 0,
    serie TEXT,
    serie_label TEXT,
    qty_s1 REAL DEFAULT 0,
    qty_s2 REAL DEFAULT 0,
    qty_s3 REAL DEFAULT 0,
    qty_total REAL DEFAULT 0,
    montant_s1 REAL DEFAULT 0,
    montant_s2 REAL DEFAULT 0,
    montant_s3 REAL DEFAULT 0,
    montant_total REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES dqe_projects(id) ON DELETE CASCADE
);
```

## API Routes (add to server/index.js)

### Projects
- `GET /api/dqe/projects` — List all DQE projects
- `POST /api/dqe/projects` — Create project
- `PUT /api/dqe/projects/:id` — Update project
- `DELETE /api/dqe/projects/:id` — Delete project + cascade items

### Items
- `GET /api/dqe/projects/:projectId/items` — Get items for a project (with filters: ?serie=xxx&section=S1&search=xxx)
- `POST /api/dqe/projects/:projectId/items` — Add single item
- `PUT /api/dqe/items/:id` — Update item
- `DELETE /api/dqe/items/:id` — Delete item

### Import
- `POST /api/dqe/projects/:projectId/import` — Import items from JSON (format matches `boucle_lekie_import.json`)
- `POST /api/dqe/import-full` — Import full project + items from JSON

### Calculator
- `POST /api/dqe/calculate` — Calculate cost: `{ itemId, quantity }` → returns `{ prix_unitaire, quantity, total }`

### Summary
- `GET /api/dqe/projects/:projectId/summary` — Get totals by serie, by section

## Frontend Pages

### 1. DQE Page (`/dqe`) — Project List
- Grid/list of DQE projects (cards showing name, contract, total HT)
- "Nouveau Projet" button
- "Importer Projet" button (accepts JSON file)
- Click project → goes to `/dqe/:projectId`

### 2. Project Detail (`/dqe/:projectId`) — Items & Calculator
- **Header**: Project name, contract number, total
- **Tabs or filter bar**:
  - Filter by série (dropdown with all series)
  - Filter by section (S1/S2/S3/All)
  - Search by designation
- **Items Table**:
  - Columns: Code | Désignation | Unité | P.U. (FCFA) | Qté | Montant (FCFA)
  - Each row shows the item with its price
  - **Inline calculator**: Click on quantity cell to edit → auto-calculates montant
  - Color-coded series (like existing dalot section colors)
- **Summary bar** at bottom: Total items, Total montant by section, Grand total
- **Actions**: Add item (modal), Edit item, Delete item, Export (JSON/CSV)

### 3. Price Calculator Widget (quick access)
- Simple form: Select project → Select item (searchable dropdown) → Enter quantity → Shows price breakdown
- Can be accessed from the sidebar/nav
- Shows: P.U. × Qty = Total (formatted FCFA)

## Navigation
- Add "DQE / Prix" to the sidebar navigation (between Dalots and Calculator or after Storage)
- Icon: use existing lucide-react icons (e.g., `Calculator`, `Receipt`, `DollarSign`)

## Import Data File
The file `boucle_lekie_import.json` is already prepared at the project root. Format:
```json
{
  "project": {
    "name": "Boucle de la Lékié",
    "contract": "N°310/M/MINTP/CIPM-TCRI/CCCM-TR/2022",
    "client": "MINTP",
    "contractor": "Arab Contractors Cameroon LTD",
    "total_ht": 26080000000,
    "sections": [
      {"id": "S1", "name": "Nkolbisson - Zamengoué", "length_km": 9}
    ]
  },
  "items": [
    {
      "code": "001",
      "designation": "Installation de l'Entreprise",
      "unite": "Ft",
      "prix_unitaire": 1392126751,
      "serie": "000",
      "serie_label": "000 - Installation de Chantier",
      "quantities": {"S1": 1, "S2": 0, "S3": 0, "total": 1},
      "montants": {"S1": 1392126751, "S2": 0, "S3": 0, "total": 1392126751}
    }
  ]
}
```

## Key UX Requirements
1. **ALL TEXT IN FRENCH** — buttons, labels, headers, messages, everything
2. **FCFA formatting**: `1 234 567 FCFA` (space thousands, no decimals for FCFA)
3. **Match existing dark theme** — same colors, same card styles, same button styles
4. **Mobile friendly** — table should scroll horizontally on mobile
5. **Fast search** — filter items as you type
6. **Import should be drag-and-drop or file picker**
7. **Confirmation dialogs** for delete actions

## What NOT to Do
- Do NOT modify existing pages/routes/tables
- Do NOT add Tailwind or shadcn
- Do NOT change the build system
- Do NOT restructure the project
- Keep the same patterns used everywhere else in the codebase
