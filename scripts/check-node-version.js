// Stops `npm run dev` on a Node.js version older than the minimum in
// package.json "engines", with plain instructions for updating.
// Heroku enforces "engines" itself, so this only matters for local runs.

const { engines } = require('../package.json')

const minVersion = engines.node.match(/\d+\.\d+\.\d+/)[0]
const [minMajor, minMinor, minPatch] = minVersion.split('.').map(Number)
const [major, minor, patch] = process.versions.node.split('.').map(Number)

const isSameMajor = major === minMajor
const isAtLeastMin = minor > minMinor || (minor === minMinor && patch >= minPatch)

if (!isSameMajor || !isAtLeastMin) {
  console.error(`
  This prototype needs Node.js ${minMajor} (version ${minVersion} or later).
  You have Node.js ${process.versions.node}.

  If you use nvm, run nvm use (or nvm install) in this folder.
  
  If you don't, follow these steps to update Node.js:
    1. Go to https://nodejs.org/en/download
    2. Choose version ${minMajor} and download the installer for your computer
    3. Open the downloaded file and follow the steps
    4. Close this terminal, open a new one and run npm run dev again

  See "Updating Node.js" in README.md for more help.
`)
  process.exit(1)
}
