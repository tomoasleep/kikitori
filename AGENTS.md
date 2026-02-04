# AGENTS.md

This file contains essential information for AI agents working in this repository.

## Project Overview

**kikitori** - A CLI tool for audio transcription using Whisper and Ollama.

## Build Commands

```bash
# Build the project
bun run build

# Run in development mode
bun run dev

# Start the built application
bun run start
```

## Testing

This project does not currently have automated tests configured. Manual testing is done via:

```bash
# Build and test locally
bun run build
./dist/index.js --help

# Test recording
./dist/index.js -d 5
```

## Code Style Guidelines

### TypeScript Configuration

- **Module System**: ESM (`"type": "module"` in package.json)
- **Target**: ESNext with NodeNext module resolution
- **Strict Mode**: Enabled
- **File Extensions**: Always use `.js` extensions in imports (e.g., `./recorder.js`)

### Imports

- Use ESM imports with `.js` extensions for local files
- Group imports: Node.js built-ins first, then third-party, then local
- Example:
  ```typescript
  import { spawn } from "child_process";
  import { readFile } from "fs/promises";
  import { Ollama } from 'ollama';
  import { recordAudio } from './recorder.js';
  ```

### Naming Conventions

- **Functions**: camelCase (e.g., `recordAudio`, `cleanupAudioFile`)
- **Variables**: camelCase
- **Interfaces**: PascalCase (e.g., `CliOptions`)
- **Constants**: Uppercase for true constants, camelCase otherwise
- **Files**: camelCase (e.g., `recorder.ts`, `ollama.ts`)

### Error Handling

- Always wrap async operations in try-catch blocks
- Use `instanceof Error` to check error types
- Provide user-friendly error messages for common failures
- Clean up resources in `finally` blocks

### Types

- Use explicit return types on exported functions
- Define interfaces for option objects
- Use default parameter values instead of optional parameters when possible

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Prefer `const` and `let` over `var`
- Add trailing commas in multi-line objects/arrays

### External Dependencies

- **whisper.cpp**: Must be installed separately
- **ollama**: Server must be running on `http://localhost:11434`
- **sox**: Required for audio recording

## CLI Behavior

- Recording starts with optional duration or until Enter/Ctrl+D
- Outputs transcription to stdout
- Uses stderr for status messages
- Exit code 1 on error

## File Structure

```
src/
  index.ts      # CLI entry point
  recorder.ts   # Audio recording logic
  whisper.ts    # Whisper transcription
  ollama.ts     # Ollama text refinement
dist/           # Compiled output (gitignored)
models/         # Whisper model files
examples/       # Example templates
```
