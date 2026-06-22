import {
  atualizarTodasLinhas
} from "../render/renderLinha.js";

import {
  calcularTempoLinha
} from "../services/scheduler.js";

export function balanceLinha(

  balanceBtn,

  linha1,
  linha2,

  renderConfigL1,
  renderConfigL2

) {

  balanceBtn.addEventListener(

    "click",

    () => {

      const tempoL1 =
        calcularTempoLinha(linha1);

      const tempoL2 =
        calcularTempoLinha(linha2);

      if (
        linha1.length === 0 ||
        linha2.length === 0
      ) {

        return;

      }

      if (tempoL1 > tempoL2) {

        const item =
          linha1.pop();

        linha2.push(item);

      }

      else {

        const item =
          linha2.pop();

        linha1.push(item);

      }

      atualizarTodasLinhas(

        renderConfigL1,
        renderConfigL2,

        linha1,
        linha2

      );

    }

  );

}