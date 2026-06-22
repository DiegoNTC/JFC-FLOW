import {
  atualizarTodasLinhas
} from "../render/renderLinha.js";

export function optimizeLinha(

  optimizeBtn,
  linha1,
  linha2,
  renderConfigL1,
  renderConfigL2

) {

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

}