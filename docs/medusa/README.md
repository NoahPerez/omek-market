# Medusa Docs Snapshot

This folder stores a local snapshot of Medusa's AI-friendly documentation files.

Files:
- `llms.txt`: compact index of important documentation pages.
- `llms-full.txt`: full plain-text documentation snapshot.

Source URLs:
- `https://docs.medusajs.com/llms.txt`
- `https://docs.medusajs.com/llms-full.txt`

Refresh command:

```bash
mkdir -p docs/medusa
curl -fsSL "https://docs.medusajs.com/llms.txt" -o docs/medusa/llms.txt
curl -fsSL "https://docs.medusajs.com/llms-full.txt" -o docs/medusa/llms-full.txt
```
