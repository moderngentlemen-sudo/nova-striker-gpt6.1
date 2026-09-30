# Nova Striker development

The user requires cloud development. On 2026-09-30, after initially selecting GitHub Codespaces plus GitHub Actions, Jason authorized foregoing Codespaces for now and continuing in this ChatGPT Work cloud conversation. Edits, builds, and tests may run in the conversation's remote cloud workspace. Do not run development on Jason's computer. The existing Codespace remains available if he chooses to resume it; do not create a duplicate.

Preserve the current repository implementation. Check the remote main commit before beginning a pass and before publishing it. Use the connected GitHub tools when direct Git transport is unavailable, preserving the actual upstream parent and untouched files. Keep GitHub Actions for cloud validation and browser publishing.

Use node --test for gameplay changes and npm run build to verify the standalone bundle. GitHub Actions tests and deploys main to GitHub Pages. Browser inspection validates the hosted presentation; it does not establish physical controller performance or human co-op quality.

The original brief is a flexible baseline. Temporary artwork and tuning are experimental. Check with the user before adopting meaningful creative departures, giving their benefit and tradeoff. Nova and Echo retain their distinct identities; campaign ranks remain unassigned.
