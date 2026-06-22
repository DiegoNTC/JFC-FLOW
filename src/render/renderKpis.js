

import { formatarHora } from "../core/utils.js";

export function renderKpis(
  tempoTotal,
  setupTotal,
  capacidadeMaxima,
  turnos,
  kpi,
  clock,
  capacity,
  status,
  oee
) {

  kpi.innerText =
    `${tempoTotal} min`;

  const horarioFinal =
    turnos[0].inicio +
    tempoTotal;

  let turnoFinal = "T1";

  if (
    horarioFinal >
    turnos[0].fim
  ) {

    turnoFinal = "T2";

  }

  clock.innerHTML = `
    <strong>
      ${formatarHora(turnos[0].inicio)}
    </strong>

    →

    <strong>
      ${formatarHora(horarioFinal)}
    </strong>

    <span class="turno-badge">
      ${turnoFinal}
    </span>
  `;

  const saldo =
    capacidadeMaxima -
    tempoTotal;

  capacity.innerText =
    `Saldo: ${saldo} min`;

  const ocupacao =
    (
      tempoTotal /
      capacidadeMaxima
    ) * 100;

  const statusBox =
    status.closest(".kpi-box");

  statusBox.classList.remove(
    "status-normal",
    "status-warning",
    "status-danger"
  );

  if (ocupacao <= 70) {

    status.innerText =
      "NORMAL";

    statusBox.classList.add(
      "status-normal"
    );

  }

  else if (ocupacao <= 90) {

    status.innerText =
      "ATENÇÃO";

    statusBox.classList.add(
      "status-warning"
    );

  }

  else {

    status.innerText =
      "CRÍTICO";

    statusBox.classList.add(
      "status-danger"
    );

  }

    
}