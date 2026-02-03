#!/bin/bash
# Launch SmartSpender Sync UI
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")" && exec bun run src/index.tsx "$@"
