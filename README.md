# depmanager

A comprehensive CLI tool for managing project dependencies with full support for npm, yarn 1.x, and yarn 2+. No external accounts required - uses free, built-in tools for security auditing.

## Features

- ✅ **Multi-Package Manager Support**: Automatically detects and works with npm, yarn 1.x, and yarn 2+
- ✅ **Dependency Checking**: Check if dependencies are up to date
- ✅ **Dependency Updates**: Update dependencies to their latest versions
- ✅ **Security Auditing**: Check for known vulnerabilities (CVEs) using free tools
- ✅ **Workspace Support**: Full support for yarn workspaces and npm workspaces
- ✅ **System-wide Availability**: Install once, use anywhere
- ✅ **Smart Detection**: Automatically detects project type and package manager

## Installation

Install globally to make it available system-wide:

```bash
npm install -g .
```

## Usage

### Check Dependencies

Check if your dependencies are up to date:

```bash
depmanager check
```

### Update Dependencies

Update all dependencies to their latest versions:

```bash
depmanager update
```

After running this command, install the new versions using your package manager:
- npm: `npm install`
- yarn: `yarn install`

### Security Check

Check for known vulnerabilities (CVEs):

```bash
depmanager security
```

This uses free, built-in security audit tools:
- **npm projects**: Uses `npm audit`
- **yarn 1.x projects**: Uses `yarn audit` 
- **yarn 2+ projects**: Uses `yarn npm audit`

### Project Information

View detected package manager and project information:

```bash
depmanager info
```

## Package Manager Detection

The tool automatically detects your package manager:

1. **yarn**: If `yarn.lock` is present
   - Detects version (1.x vs 2+)
   - Uses appropriate audit commands
   - Supports workspaces

2. **npm**: If `package-lock.json` is present
   - Uses npm audit for security checks
   - Supports npm workspaces

3. **Default**: Falls back to npm if no lock files found

## Workspace Support

Fully supports monorepos and workspaces:

- **yarn workspaces**: Automatically detected and each workspace is audited separately
- **npm workspaces**: Supported for security checks
- **Root + Packages**: Audits both root project and individual workspace packages

## Security Features

### Free Security Auditing
- No external accounts required (no Snyk, etc.)
- Uses package manager's built-in audit tools
- Comprehensive vulnerability reporting

### Multi-Manager Support
- **npm**: Uses `npm audit --json` for detailed reports
- **yarn 1.x**: Uses `yarn audit` with fallback to npm audit
- **yarn 2+**: Uses `yarn npm audit` for compatibility

### Vulnerability Information
- Package name and version
- Severity levels (critical, high, moderate, low)
- Available fixes
- Links to vulnerability details
- Upgrade suggestions

## Requirements

- **Node.js**: 12.x or higher
- **Package Managers** (at least one):
  - npm 6.x or higher
  - yarn 1.x (Classic)
  - yarn 2+ (Berry)

## Examples

### Basic Usage
```bash
# Check dependencies in any JS/TS project
cd my-project
depmanager check

# Update dependencies
depmanager update

# Security audit
depmanager security
```

### Workspace Projects
```bash
# Works automatically with workspaces
cd my-monorepo
depmanager security
# → Checks root + all workspace packages
```

### Mixed Projects
The tool adapts to your project setup:
- Detects yarn vs npm automatically
- Handles different yarn versions
- Falls back gracefully if tools aren't available

## Troubleshooting

### Common Issues

1. **"No package.json found"**
   - Make sure you're in a JavaScript/TypeScript project directory
   - The project must have a `package.json` file

2. **Package manager not detected correctly**
   - Use `depmanager info` to see what was detected
   - Ensure lock files (`yarn.lock` or `package-lock.json`) are present

3. **Security audit fails**
   - The tool automatically falls back to npm audit if yarn audit fails
   - Temporary `package-lock.json` may be created for audit purposes

### Getting Help

Run any command with `--help`:
```bash
depmanager --help
depmanager check --help
```

## Development

### Testing

The project includes a comprehensive test suite:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- Package manager detection logic
- Workspace configuration parsing
- Version type determination
- Error handling scenarios

### Contributing

When contributing:
1. Add tests for new functionality
2. Ensure existing tests pass
3. Follow the existing code patterns
4. Update documentation as needed

## License

ISC

## Project Philosophy

This tool is designed to be simple, reliable, and free. It uses only built-in package manager tools to ensure maximum compatibility and zero external dependencies for security auditing.
