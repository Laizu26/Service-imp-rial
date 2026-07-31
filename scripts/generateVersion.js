// Génère un identifiant de version à chaque build de production.
// Écrit :
//   - public/version.json  → consulté par le client en cours d'exécution (poll périodique)
//   - .env.production.local → REACT_APP_BUILD_VERSION, embarqué dans le bundle JS au build
// Le client compare sa propre version embarquée à celle de version.json pour détecter
// qu'une nouvelle version a été déployée.

const fs = require("fs");
const path = require("path");

const version = Date.now().toString();

const versionJsonPath = path.join(__dirname, "..", "public", "version.json");
fs.writeFileSync(versionJsonPath, JSON.stringify({ version }));

const envPath = path.join(__dirname, "..", ".env.production.local");
fs.writeFileSync(envPath, `REACT_APP_BUILD_VERSION=${version}\n`);

console.log(`[generateVersion] Version de build générée : ${version}`);
