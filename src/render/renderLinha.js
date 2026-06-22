import {
  renderCard
} from "./renderCards.js";

import {
  renderGantt
} from "./renderGantt.js";

import {
  PIXEL_POR_MINUTO,
  ALTURA_LINHA_GANTT
} from "../core/constants.js";

import {
  formatarHora
} from "../core/utils.js";

import {
  capacidadeMaxima,
  turnos
} from "../data/turnos.js";

import {
  calcularSetup
} from "../services/scheduler.js";

import {
  renderKpis
} from "./renderKpis.js";

import {
  renderScale
} from "./renderScale.js";



export function renderLinha(
  dropzone,
  linha,
  gantt,
  scale,
  kpi,
  clock,
  capacity,
  status,
  oee
) {

  dropzone.innerHTML = "";
  gantt.innerHTML = "";
  scale.innerHTML = "";

renderScale(scale);

  const timeline =
    document.createElement("div");

  timeline.className =
    "gantt-timeline";

  gantt.appendChild(
    timeline
  );

  let tempoTotal = 0;
  let setupTotal = 0;

  let horarioAtual =
    turnos[0].inicio;

 linha.forEach(
  (produto, index) => {

    const anterior =
      index > 0
        ? linha[index - 1]
        : null;

    const setup =
      calcularSetup(
        anterior,
        produto
      );

    const inicioSetup =
      horarioAtual;

    const inicioProduto =
      inicioSetup + setup;

    const fimProduto =
      inicioProduto +
      produto.tempo;

    horarioAtual =
      fimProduto;

    tempoTotal +=
      produto.tempo +
      setup;

    setupTotal +=
      setup;

    renderCard(
      dropzone,
      produto,
      setup,
      inicioProduto,
      fimProduto
    );

    renderGantt(
      timeline,
      produto,
      index,
      setup,
      inicioSetup,
      inicioProduto,
      fimProduto
    );

  }
);

  const linhasVisuais =
    Math.max(
      linha.length,
      1
    );

  timeline.style.height =
    `${linhasVisuais * ALTURA_LINHA_GANTT + 120}px`;

renderKpis(
  tempoTotal,
  setupTotal,
  capacidadeMaxima,
  turnos,
  kpi,
  clock,
  capacity,
  status,
  oee
);  

  let oeeValue = 100;

  if (setupTotal > 0) {


    oeeValue =
      (
        (
          tempoTotal -
          setupTotal
        ) /
        tempoTotal
      ) * 100;


  }

  oee.innerText =
    `${oeeValue.toFixed(1)}%`;

}

export function atualizarTodasLinhas(
  renderConfigL1,
  renderConfigL2,
  linha1,
  linha2
) {

  renderLinha(
    renderConfigL1.dropzone,
    linha1,
    renderConfigL1.gantt,
    renderConfigL1.scale,
    renderConfigL1.kpi,
    renderConfigL1.clock,
    renderConfigL1.capacity,
    renderConfigL1.status,
    renderConfigL1.oee
  );

  renderLinha(
    renderConfigL2.dropzone,
    linha2,
    renderConfigL2.gantt,
    renderConfigL2.scale,
    renderConfigL2.kpi,
    renderConfigL2.clock,
    renderConfigL2.capacity,
    renderConfigL2.status,
    renderConfigL2.oee
  );

}
