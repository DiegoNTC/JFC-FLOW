import { importarTXT } from "./txtImporter.js";

export function configurarImportacaoTXT(onImportado = null) {

  const input =
    document.getElementById("txtInput");

  if (!input) {

    console.error(
      "Input txtInput não encontrado."
    );

    return;

  }

  console.log(
    "Importação TXT configurada."
  );

  input.addEventListener("change", async (event) => {

    const arquivo =
      event.target.files[0];

    if (!arquivo) {

      console.warn(
        "Nenhum TXT selecionado."
      );

      return;

    }

    console.log(
      "Arquivo TXT selecionado:",
      arquivo.name
    );

    const conteudo =
      await arquivo.text();

    const baseTecnica =
      importarTXT(
        conteudo
      );

    console.log(
      "TXT IMPORTADO:",
      baseTecnica
    );

    console.log(
      "ESTATÍSTICAS TXT:",
      baseTecnica.estatisticas
    );

    console.table(
      baseTecnica.produtosTecnicos.slice(0, 20)
    );

    if (
      typeof onImportado === "function"
    ) {

      onImportado(
        baseTecnica
      );

    }

    alert(
      `TXT importado com sucesso: ${baseTecnica.estatisticas.totalProdutosTecnicos} produtos técnicos.`
    );

    input.value =
      "";

  });

}