# TheManager

A minimalist project management tool built for **agentic coders** — developers who leverage AI coding assistants (Claude, Cursor, Windsurf, etc.) to build software.

## What is this?

TheManager is a local-first project management app that manages **Features** and **Bugs** as markdown files in your project's `feats/` and `bugs/` directories.

**Key Philosophy:** Your project, your data, your machine. No cloud, no account, no sync friction.

## For Agentic Coders

When AI agents work on features or fix bugs, they need context about:
- What features are being built and why?
- What bugs exist and their impact?
- What's the current status of work?

TheManager provides:
- **Structured Markdown Files** — Each feat/bug has sections for What & Why, Impact, Developer Notes, and Testing Notes
- **Status Tracking** — Move items through `new` → `inprogress` → `finished` states
- **Agentic Access via MCP** — AI coding assistants can read and write to your project management via the MCP protocol

```
Agent: "Create a new feat for user authentication"
TheManager: Creates feats/new/user-auth.md with structured template

Agent: "What features are in progress?"
TheManager: Lists all items with status=inprogress
```

## Project Structure

```
your-project/
├── feats/
│   ├── new/              # Newly proposed features
│   ├── inprogress/       # Features being worked on
│   └── finished/         # Completed features
├── bugs/
│   ├── new/              # Reported bugs
│   ├── inprogress/       # Bugs being fixed
│   └── finished/         # Resolved bugs
└── ...your code...
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/themanager.git
cd themanager

# Install dependencies
npm run install:all
```

### Development

```bash
# Start the app (frontend + backend)
npm run dev
```

The app will open at `http://localhost:5173`

### Production Build

```bash
npm run build
```

## Usage

### 1. Select Your Project
When you first open the app, enter the path to your project directory:
```
/Users/you/Dev/your-project
```

TheManager will create the `feats/` and `bugs/` directories with the proper structure.

### 2. Create Features & Bugs
- Click "+ New Feature" or "+ New Bug" from the dashboard
- Fill in the markdown content with structured sections
- Items start in `new/` status

### 3. Track Progress
Move items between statuses:
- **new** — Just created, not started
- **inprogress** — Being worked on
- **finished** — Completed

### 4. Agentic Access (Coming Soon)
Configure your AI coding assistant to access TheManager via MCP:
```json
{
  "mcpServers": {
    "themanager": {
      "command": "node",
      "args": ["/path/to/themanager/app/server/mcp.js"],
      "env": {
        "WORKSPACE_PATH": "~/Dev/your-project"
      }
    }
  }
}
```

## Feature File Structure

Each markdown file uses YAML frontmatter + structured body:

```markdown
---
id: feat-m1abc123
title: User authentication
status: new
created: 2026-03-26
updated: 2026-03-26
---

## What & Why
Describe what we're trying to do and why this matters.

## Impact
What happens if we do this? What changes?

## Developer Notes
Technical details, architecture decisions, gotchas.

## Testing Notes
How should this be tested? Edge cases to consider.
```

## Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Storage:** Local filesystem (markdown files)
- **MCP:** Model Context Protocol for agentic access

## License

MIT
