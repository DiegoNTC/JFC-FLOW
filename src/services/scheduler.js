import { setupMatrix } from "../data/setupMatrix.js";

// =========================
// TEMPO TOTAL DA LINHA
// =========================

export function calcularTempoLinha(linha) {

  let total = 0;

  linha.forEach((produto, index) => {

    let setup = 0;

    if (index > 0) {

      const anterior =
        linha[index - 1];

      setup =
        setupMatrix[
          anterior.categoria
        ][
          produto.categoria
        ];

    }

    total +=
      produto.tempo + setup;

  });

  return total;

}

// =========================
// SETUP ENTRE PRODUTOS
// =========================

export function calcularSetup(

  produtoAnterior,
  produtoAtual

) {

  if (!produtoAnterior)
    return 0;

  return (
    setupMatrix[
      produtoAnterior.categoria
    ][
      produtoAtual.categoria
    ] || 0
  );

}