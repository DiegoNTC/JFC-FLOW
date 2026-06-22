import {
  calcularTempoLinha
} from "../services/scheduler.js";

import {
  turnos
} from "../data/turnos.js";

import {
  draggedItem
} from "../core/state.js"

import {
  renderLinha
} from "../render/renderLinha.js";


export function configurarDropzone(
  linhaNome,
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

  dropzone.addEventListener(
    "dragover",
    (e) => {

      e.preventDefault();

    }
  );

  dropzone.addEventListener(
    "drop",
    () => {

      console.log("DROP EXECUTOU");
      console.log("draggedItem:", draggedItem);

      if (!draggedItem) return;

      if (
        draggedItem.linhaPermitida !==
        linhaNome
      ) {

        alert(
          `${draggedItem.nome} não pode entrar na ${linhaNome}`
        );

        return;

      }

      const tempoAtual =
        calcularTempoLinha(linha);

      const novoTempo =
        tempoAtual + draggedItem.tempo;

      if (
        turnos[0].inicio + novoTempo >
        turnos[1].fim
      ) {

        alert(
          `Capacidade da ${linhaNome} excedida`
        );

        return;

      }

      const novoItem = {
        ...draggedItem,
        id: crypto.randomUUID()
      };

      linha.push(novoItem);

      renderLinha(
        dropzone,
        linha,
        gantt,
        scale,
        kpi,
        clock,
        capacity,
        status,
        oee
      );

    }
  );

}

