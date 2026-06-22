
import {
  PIXEL_POR_MINUTO,
  ALTURA_LINHA_GANTT
} from "../core/constants.js";

import {
  formatarHora
} from "../core/utils.js";

export function renderGantt(
  timeline,
  produto,
  index,
  setup,
  inicioSetup,
  inicioProduto,
  fimProduto
) {

  const topLinha =
    index * ALTURA_LINHA_GANTT;

  const leftSetup =
    (inicioSetup - 480) *
    PIXEL_POR_MINUTO;

  const leftProduto =
    (inicioProduto - 480) *
    PIXEL_POR_MINUTO;

  const larguraSetup =
    Math.max(
      setup * PIXEL_POR_MINUTO,
      90
    );

  const larguraProduto =
    Math.max(
      produto.tempo *
      PIXEL_POR_MINUTO,
      240
    );

  if (setup > 0) {

    const setupBlock =
      document.createElement("div");

    setupBlock.classList.add(
      "gantt-block",
      "gantt-setup"
    );

    setupBlock.style.width =
      `${larguraSetup}px`;

    setupBlock.style.left =
      `${leftSetup}px`;

    setupBlock.style.top =
      `${topLinha}px`;

    setupBlock.style.height =
      `34px`;

    setupBlock.innerHTML = `

      <div class="gantt-setup-content">

        <span>SETUP</span>

        <small>${setup} min</small>

      </div>

    `;

    timeline.appendChild(
      setupBlock
    );

  }

  const productionBlock =
    document.createElement("div");

  productionBlock.classList.add(
    "gantt-block",
    "gantt-production"
  );

  productionBlock.style.width =
    `${larguraProduto}px`;

  productionBlock.style.left =
    `${leftProduto}px`;

  productionBlock.style.top =
    `${topLinha + 38}px`;

  productionBlock.style.height =
    `52px`;

  productionBlock.innerHTML = `

    <div class="gantt-content">

      <span class="gantt-title">
        ${produto.nome}
      </span>

      <span class="gantt-time">

        ${formatarHora(inicioProduto)}

        →

        ${formatarHora(fimProduto)}

      </span>

    </div>

  `;

  timeline.appendChild(
    productionBlock
  );

}