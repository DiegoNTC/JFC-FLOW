
optimizeBtn.addEventListener(
  "click",
  () => {

    linha1.sort((a, b) => {

      if (
        a.prioridade !==
        b.prioridade
      ) {

        return (
          a.prioridade -
          b.prioridade
        );

      }

      return a.categoria.localeCompare(
        b.categoria
      );

    });

    linha2.sort((a, b) => {

      if (
        a.prioridade !==
        b.prioridade
      ) {

        return (
          a.prioridade -
          b.prioridade
        );

      }

      return a.categoria.localeCompare(
        b.categoria
      );

    });

    atualizarTodasLinhas(
      renderConfigL1,
      renderConfigL2,
      linha1,
      linha2
    );

  }
);

balanceBtn.addEventListener(
  "click",
  () => {

    smartSequence(
      linha1,
      setupMatrix
    );

    smartSequence(
      linha2,
      setupMatrix
    );

    atualizarTodasLinhas(
      renderConfigL1,
      renderConfigL2,
      linha1,
      linha2
    );

  }
);