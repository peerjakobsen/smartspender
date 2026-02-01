# File and Command Naming

## Context

Consistent naming makes the plugin predictable and easy to extend. These conventions apply to all files, directories, commands, and identifiers in SmartSpender.

## File Naming

### General Rules
- Use lowercase with hyphens for all filenames: `export-format.md`, `subscription-detection.md`
- Never use spaces, underscores, or camelCase in filenames
- Use `.md` extension for all skill, command, and adapter files
- Use `.json` for configuration files only

### Templates
- Prefix template files with underscore: `_template.md`
- Templates live alongside the files they template (e.g., `banks/_template.md`)

### Bank Adapters
- Bank directory names use the bank's common lowercase name: `nykredit`, `danske-bank`, `nordea`
- Standard files within each bank directory:
  - `BANK.md` -- uppercase, the primary adapter file
  - `export-format.md` -- CSV/export parsing rules
  - `quirks.md` -- known issues and workarounds

### Subscription Files
- Use the service's common lowercase name: `netflix.md`, `spotify.md`, `fitness-world.md`
- Hyphenate multi-word names: `fitness-world.md`, `tv2-play.md`

## Command Naming

### Slash Commands
- Format: `/smartspender:<verb>` or `/smartspender:<noun>`
- Use short, single-word names when possible: `sync`, `analyze`, `overview`
- Use hyphens for multi-word commands: `add-account`
- Commands should be verbs (actions) or nouns (views): `sync`, `cancel`, `overview`, `report`

### Command Arguments
- Arguments follow the command after a space: `/smartspender:sync nykredit`
- Use lowercase for argument values: `nykredit`, not `Nykredit`
- Document all valid argument values in the command file

## Identifiers

### Bank IDs
- Lowercase, hyphenated: `nykredit`, `danske-bank`, `jyske-bank`
- Must match the directory name under `banks/`

### Category Names
- Use Danish names as primary: `Dagligvarer`, `Abonnementer`, `Bolig`
- PascalCase for category names (matching the categorization system in PRODUCT_SPEC.md)

### Sheet Names
- Title case, human-readable: `Transactions`, `Monthly Summary`, `Action Log`
- Match exactly what appears in the Google Sheets spreadsheet

### Settings Keys
- snake_case: `default_currency`, `preferred_language`, `categorization_confidence_threshold`
