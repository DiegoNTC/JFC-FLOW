export function smartSequence(linha, setupMatrix) {

  if (linha.length <= 1) return;

  const pendentes = [...linha];

  const resultado = [];

  // começa pela maior prioridade
  pendentes.sort(
    (a, b) => a.prioridade - b.prioridade
  );

  resultado.push(
    pendentes.shift()
  );

  while (pendentes.length > 0) {

    const atual =
      resultado[resultado.length - 1];

    let melhorIndice = 0;
    let melhorCusto = Infinity;

    pendentes.forEach(
      (produto, indice) => {

        const setup =
          setupMatrix[
            atual.categoria
          ][
            produto.categoria
          ];

        const custo =
          setup + produto.tempo;

        if (custo < melhorCusto) {

          melhorCusto = custo;
          melhorIndice = indice;

        }

      }
    );

    resultado.push(
      pendentes.splice(
        melhorIndice,
        1
      )[0]
    );

  }

  linha.length = 0;

  linha.push(...resultado);

}