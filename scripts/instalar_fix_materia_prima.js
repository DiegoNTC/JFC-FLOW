/**
 * Instalador do fix de Materia-Prima Consolidada - JFC FLOW
 *
 * Como usar:
 * 1. Extraia o ZIP na raiz do projeto JFC FLOW.
 * 2. Rode: node scripts/instalar_fix_materia_prima.js
 */

const fs = require("fs");
const path = require("path");

const projetoRoot = process.cwd();
const indexPath = path.join(projetoRoot, "index.html");

const SCRIPT_INTEGRADOR =
  '<script type="module" src="./src/services/integradorMateriaPrimaService.js"></script>';

function falhar(mensagem) {
  console.error(`\nERRO: ${mensagem}\n`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  falhar("index.html nao encontrado. Rode este script na raiz do projeto JFC FLOW.");
}

let indexHtml = fs.readFileSync(indexPath, "utf8");

if (indexHtml.includes("integradorMateriaPrimaService.js")) {
  console.log("O integrador de materia-prima ja esta no index.html. Nada para alterar.");
  process.exit(0);
}

const mainScriptRegex =
  /<script\s+type=["']module["']\s+src=["'](\.\/)?src\/main\.js["']\s*><\/script>/i;

const mainScriptMatch =
  indexHtml.match(mainScriptRegex);

if (!mainScriptMatch) {
  falhar("Nao encontrei o script ./src/main.js no index.html para inserir o integrador.");
}

const backupPath =
  `${indexPath}.backup_materia_prima_${new Date().toISOString().replace(/[:.]/g, "-")}`;

fs.writeFileSync(backupPath, indexHtml, "utf8");

indexHtml = indexHtml.replace(
  mainScriptRegex,
  `${mainScriptMatch[0]}\n  ${SCRIPT_INTEGRADOR}`
);

fs.writeFileSync(indexPath, indexHtml, "utf8");

console.log("\nFix instalado com sucesso!");
console.log("Arquivo alterado: index.html");
console.log(`Backup criado: ${path.basename(backupPath)}`);
console.log("\nAgora rode:");
console.log("git status");
console.log("git add index.html src/importers/xlsxMateriaPrimaImporter.js src/repositories/materiaPrimaRepository.js src/services/relatorioMateriaPrimaService.js src/services/geradorPdfMateriaPrimaService.js src/services/integradorMateriaPrimaService.js scripts/instalar_fix_materia_prima.js docs/CHANGELOG.md");
console.log('git commit -m "feat: adiciona relatorio consolidado de materia-prima"');
console.log("git push origin develop\n");
