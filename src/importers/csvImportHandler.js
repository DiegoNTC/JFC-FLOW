import { parseCSV } from "./parseCSV.js";
import { renderPedidos } from "../render/renderPedidos.js";

export function configurarImportacaoCSV(onImportado = null) {

  const input = document.getElementById("csvInput");

  if (!input) {
    console.error("Input csvInput não encontrado.");
    return;
  }

  console.log("Importação CSV configurada.");

  input.addEventListener("change", async (event) => {

    const arquivo = event.target.files[0];

    if (!arquivo) {
      console.warn("Nenhum CSV selecionado.");
      return;
    }

    console.log("Arquivo CSV selecionado:", arquivo.name);

    const conteudo = await arquivo.text();

    const dados = parseCSV(conteudo);

    console.log("CSV IMPORTADO:", dados);
    console.table(dados.slice(0, 20));

    renderPedidos(dados);

    if (typeof onImportado === "function") {
      onImportado(dados);
    }

    alert(`CSV importado com sucesso: ${dados.length} registros.`);

    input.value = "";

  });

}