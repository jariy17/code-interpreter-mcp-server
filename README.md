# tjariy-code-interpreter-mcp-server

An MCP (Model Context Protocol) server that provides secure code execution capabilities using AWS Bedrock AgentCore's CodeInterpreter.

## Features

- Execute Python, JavaScript, and TypeScript code in a secure sandbox
- Run shell commands
- File operations (read, write, list, remove)
- Session management (auto-managed by default)

## Prerequisites

- Node.js 20+
- AWS credentials configured (via environment variables, AWS profile, or IAM role)
- Access to AWS Bedrock AgentCore CodeInterpreter service

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the AWS region via environment variable (default: `us-west-2`):

```bash
export AWS_REGION=us-west-2
```

AWS credentials can be configured via:
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- AWS credentials file (`~/.aws/credentials`)
- IAM role (when running on AWS infrastructure)

## Usage

### Running the Server

```bash
# Production
npm start

# Development
npm run dev
```

### Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```jsonc
{
  "mcpServers": {
    "code-interpreter": {
      "command": "npx",
      "args": ["-y", "tjariy-code-interpreter-mcp-server"],
      "env": {
        // Optional: defaults to "us-west-2"
        "AWS_REGION": "us-west-2",
        // Optional: defaults to "default" profile, or uses IAM role if on AWS
        "AWS_PROFILE": "your-profile"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `execute_code` | Execute Python/JavaScript/TypeScript code in sandbox |
| `execute_command` | Run shell commands |
| `read_files` | Read file contents from sandbox |
| `write_files` | Write files to sandbox |
| `list_files` | List directory contents |
| `remove_files` | Delete files |
| `start_session` | Create a new interpreter session |
| `stop_session` | Terminate current session |
| `get_session` | Get session information |
| `list_sessions` | List all sessions |

## Examples

Once configured with Claude Desktop, you can ask Claude to:

- "Run this Python code: `print('Hello, World!')`"
- "Create a file called test.py with a fibonacci function"
- "List all files in the current directory"
- "Execute a shell command to check the Python version"

## License

MIT
