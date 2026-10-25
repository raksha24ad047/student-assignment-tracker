# StudyFlow — Student Assignment Tracker

A responsive assignment-planning dashboard built with HTML, CSS, vanilla JavaScript, Node.js, Express, and SQLite. The backend serves the frontend, so you do not need to open the HTML file separately or configure CORS.

## Features

- Create, edit, complete/reopen, and delete assignments
- Store assignments in a local SQLite database that is created automatically on first run
- Dashboard counts for total, in-progress, completed, and overdue assignments
- Completion percentage and progress bar
- Due-date labels for overdue, due today, due soon, and upcoming assignments
- Search by subject, title, and notes
- Filter by status and priority, with a one-click clear-filters action
- Low / Medium / High priority badges
- Optional notes for requirements and next steps
- Export all assignments to a spreadsheet-friendly CSV file
- Responsive layout for desktop, tablet, and mobile
- Form validation and clear error messages when the server is unavailable
- Automatic schema migration for databases made by the earlier project version

## Requirements

- Node.js 20 or newer (LTS recommended)
- npm

## Run it locally

1. Extract this ZIP file.
2. Open a terminal in the extracted `student-assignment-tracker-updated` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the app:

   ```bash
   npm start
   ```

5. Open **http://localhost:5000** in your browser.

Keep the terminal running while you use the app. Do **not** double-click `frontend/index.html`; use the localhost address so the frontend can talk to the API.

The database file `assignment_tracker.db` is created in the project root the first time the server starts. It is intentionally ignored by Git because it contains your personal assignment data.

## Troubleshooting

- **“Could not connect to the server”**: check that `npm start` is running and visit `http://localhost:5000`.
- **Port 5000 is already in use**: stop the other app using that port, or set another port before starting (PowerShell: `$env:PORT=5001; npm start`; macOS/Linux: `PORT=5001 npm start`). If you change the port, open the matching localhost address.
- **Dependency install fails**: install a current Node.js LTS release and run `npm install` again. `sqlite3` includes a native component and may need a supported prebuilt binary or local build tools on some systems.
- **Reset all saved assignments**: stop the server and delete `assignment_tracker.db`. This permanently deletes the local assignment data; the app creates a fresh database on the next start.

## Project structure

```text
student-assignment-tracker-updated/
├── backend/
│   └── server.js       # Express API, validation, SQLite schema and migration
├── frontend/
│   ├── index.html      # Accessible dashboard markup
│   ├── style.css       # Responsive styling
│   └── script.js       # UI rendering and API calls
├── .gitignore
├── package.json
└── README.md
```

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check server health |
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Create an assignment |
| PUT | `/api/assignments/:id` | Update assignment fields/status |
| DELETE | `/api/assignments/:id` | Delete an assignment |

## Technology stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript
- **Backend:** Node.js and Express
- **Database:** SQLite
- **Version control:** Git and GitHub

## Future enhancements

Possible next steps are user accounts and authentication, calendar view, browser reminders, file attachments, cloud deployment, and multi-device sync. Those require additional design/security work and are not included in this local single-user version.
