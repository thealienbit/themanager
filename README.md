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

### Option 1: Install via npm (Recommended)

```bash
# Install globally
npm install -g @themanager/mcp

# Verify installation
themanager --help
```

### Option 2: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/yourusername/themanager.git
cd themanager

# Install dependencies
npm install -g

# Link for development
npm link
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

### 4. Agentic Access via MCP
Configure your AI coding assistant to access TheManager via MCP. When the MCP server starts, it also serves the web UI at **http://localhost:3001** for convenient access.

**Note:** When the MCP server is running via an AI assistant, you can access the web UI at the same time.

#### OpenCode
Add to your `opencode.jsonc`:
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "themanager": {
      "type": "local",
      "command": ["themanager", "/path/to/your/project"],
      "enabled": true
    }
  }
}
```

Or add directly via CLI:
```bash
opencode mcp add themanager -- themanager /path/to/your/project
```

**Note:** Add the mcp configuration at project level for better user experience. Add feats/ and bugs/ directories into .gitignore.

#### Claude Desktop
Add to `~/.claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "themanager": {
      "command": "themanager",
      "args": ["/path/to/your/project"]
    }
  }
}
```

#### Cursor
Add to Cursor settings (`settings.json`):
```json
{
  "mcpServers": {
    "themanager": {
      "command": "themanager",
      "args": ["/path/to/your/project"]
    }
  }
}
```

#### Available MCP Tools
| Tool | Description |
|------|-------------|
| `list_items` | List all feats or bugs, optionally filtered by status |
| `get_item` | Get a single item with full content |
| `create_item` | Create a new feat or bug |
| `update_item` | Update title or body content |
| `move_item` | Move item to new status (new/inprogress/finished) |
| `delete_item` | Delete an item |
| `search_items` | Search by title or content |

#### Example Agent Conversations
```
Agent: "What features are in progress?"
Tool: list_items({ type: "feats", status: "inprogress" })

Agent: "File a bug for the login timeout"
Tool: create_item({ type: "bugs", title: "Login timeout after 5 minutes" })

Agent: "Mark auth feature as finished"
Tool: move_item({ type: "feats", id: "feat-abc123", status: "finished" })
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
