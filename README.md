# funding-service-prototypes
Service to allow applications for funding

## Run locally

You need Node.js 24 (version 24.22.1 or later). Earlier versions have a security vulnerability, so the prototype will not start on them.

To check which version you have, open a terminal and run:

```sh
node -v
```

If it shows `v24.22.1` or a later `v24` version, you're ready to go. Otherwise, follow the steps in [Updating Node.js](#updating-nodejs) first.

Then, in a terminal in this folder, run:

```sh
npm install
npm run dev
```

### Updating Node.js

If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm install` in this folder instead. It installs the version listed in `.nvmrc` and switches to it, but only in that terminal. In a new terminal, run `nvm use` in this folder first, or run `nvm alias default 24` once to use version 24 everywhere.

If you install node directly, follow these steps:

1. Go to [nodejs.org/en/download](https://nodejs.org/en/download).
2. Choose **version 24** and download the installer for your computer (macOS or Windows).
3. Open the downloaded file and follow the steps. It replaces your current version.
4. Close your terminal, open a new one and run `node -v`. It should show `v24.22.1` or a later `v24` version.
5. In this folder, run `npm install` and then `npm run dev`.

Use version 24 even if a newer version is offered. Version 24 is the one the live prototype uses.

### If you see a Node.js version error

If `npm install` shows an error mentioning `EBADENGINE` or `engine`, or `npm run dev` says "This prototype needs Node.js 24", your Node.js version is too old. Follow the steps in [Updating Node.js](#updating-nodejs).

### For maintainers: changing the Node.js version

The Node.js version is set in four places, which must use the same major version (the GitHub check `node-version-sync` fails if they don't):

- `engines.node` in `package.json`, which Heroku uses to choose the version it deploys, and which the local version check reads
- `.nvmrc`, for nvm users. Keep it the same as the minimum in `engines`
- `Dockerfile` (PullPreview)
- `.devcontainer/devcontainer.json` (Codespaces)

When a Node.js security fix comes out, raise the minimum version in `engines` and `.nvmrc`, and the version numbers in this README. Everyone on an older version is then asked to update.

Moving to a new major version (for example 26) should be its own change: update all four places and the version numbers in this README, then check the prototype still runs locally and on a PullPreview before merging.

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
