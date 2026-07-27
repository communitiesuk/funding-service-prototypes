# funding-service-prototypes
Service to allow applications for funding

## Run in GitHub Codespaces

1. On the repo page on github.com: **Code → Codespaces → Create codespace on main**.
2. Wait for setup to finish — `npm install` runs automatically and the prototype
   kit then starts in dev (hot-reloading) mode. The prototype serves on port
   3014 (set in `app/config.json`); find its URL in the **Ports** panel.
3. To let others in the org view the prototype: in the **Ports** panel,
   right-click port 3014 → **Port Visibility → Org**. Anyone in the
   organisation who is signed in to GitHub can then open the forwarded URL.
   Leave it off **Public**.

If the server ever stops, run `npm run dev` in the terminal (or reload the
window — it restarts automatically on attach).

Note: pressing `.` on the repo opens github.dev, which is an editor only — it
has no terminal or compute, so the prototype cannot run there. Use a codespace
(which also works entirely in the browser).
