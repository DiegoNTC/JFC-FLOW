function escaparHTML(valor) {

  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function numero(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  return Number(
    String(valor)
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "")
  ) || 0;

}

function formatarNumero(valor, casas = 2) {

  return numero(valor)
    .toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
      }
    );

}

function formatarTempo(minutos) {

  const total =
    Math.round(
      numero(minutos)
    );

  if (total <= 0) {
    return "0 min";
  }

  const horas =
    Math.floor(total / 60);

  const mins =
    total % 60;

  if (horas <= 0) {
    return `${mins} min`;
  }

  if (mins <= 0) {
    return `${horas}h`;
  }

  return `${horas}h ${mins}min`;

}

function obterEstadoLinhasAbertas(container) {

  const estado = {};

  container
    .querySelectorAll("[data-timeline-linha]")
    .forEach(elemento => {

      const linha =
        elemento.getAttribute(
          "data-timeline-linha"
        );

      if (!linha) {
        return;
      }

      estado[linha] =
        elemento.open;

    });

  return estado;

}

function obterTituloZona(zona) {

  if (zona === "NEGRA") {
    return "Zona Negra";
  }

  if (zona === "BRANCA") {
    return "Zona Branca";
  }

  if (zona === "CINZA") {
    return "Zona Cinza";
  }

  return "Outras zonas";

}

function obterClasseEvento(tipoEvento) {

  const tipo =
    String(tipoEvento || "")
      .toLowerCase();

  return `timeline-evento-${tipo}`;

}

function renderBadgeEvento(evento) {

  const badges = [];

  if (evento.rotaCruzada) {
    badges.push(
      `<span class="timeline-mini-badge">Rota cruzada</span>`
    );
  }

  if (evento.espelho) {
    badges.push(
      `<span class="timeline-mini-badge">Espelho</span>`
    );
  }

  if (evento.transferenciaValida) {
    badges.push(
      `<span class="timeline-mini-badge">Transferência</span>`
    );
  }

  return badges.join("");

}

function renderEvento(evento) {

  return `
    <tr class="${escaparHTML(obterClasseEvento(evento.tipoEvento))}">

      <td>
        <strong>${escaparHTML(evento.horaInicio)}</strong>
        <span>→</span>
        <strong>${escaparHTML(evento.horaFim)}</strong>
      </td>

      <td>
        <span class="timeline-tipo-evento">
          ${escaparHTML(evento.tipoEvento)}
        </span>
      </td>

      <td>
        ${escaparHTML(evento.zona)}
      </td>

      <td class="timeline-produto">
        ${escaparHTML(evento.produto || evento.titulo)}

        <div class="timeline-evento-badges">
          ${renderBadgeEvento(evento)}
        </div>

        ${
          evento.observacao
            ? `
              <small class="timeline-observacao">
                ${escaparHTML(evento.observacao)}
              </small>
            `
            : ""
        }
      </td>

      <td>
        ${escaparHTML(evento.codigo || "-")}
      </td>

      <td>
        ${escaparHTML(evento.familia || "-")}
      </td>

      <td>
        ${formatarNumero(evento.kg, 2)}
      </td>

      <td>
        ${formatarTempo(evento.duracaoMin)}
      </td>

      <td>
        ${escaparHTML(evento.srcLinha || "-")}
        →
        ${escaparHTML(evento.dstLinha || "-")}
      </td>

    </tr>
  `;

}

function renderZonaTimeline(zona, eventos) {

  if (
    !Array.isArray(eventos) ||
    eventos.length === 0
  ) {
    return "";
  }

  const resumoZona =
    eventos.reduce((acc, evento) => {

      acc.totalEventos += 1;

      if (evento.tipoEvento === "PRODUCAO") {
        acc.producaoMin += evento.duracaoMin;
      }

      if (evento.tipoEvento === "SETUP") {
        acc.setupMin += evento.duracaoMin;
      }

      if (evento.tipoEvento === "ESPERA") {
        acc.esperaMin += evento.duracaoMin;
      }

      if (evento.tipoEvento === "ESPELHO") {
        acc.espelhos += 1;
      }

      return acc;

    }, {
      totalEventos: 0,
      producaoMin: 0,
      setupMin: 0,
      esperaMin: 0,
      espelhos: 0
    });

  return `
    <section class="timeline-zona-card">

      <div class="timeline-zona-header">

        <h4>${escaparHTML(obterTituloZona(zona))}</h4>

        <div class="timeline-zona-kpis">

          <span>
            <small>Eventos</small>
            <strong>${resumoZona.totalEventos}</strong>
          </span>

          <span>
            <small>Produção</small>
            <strong>${formatarTempo(resumoZona.producaoMin)}</strong>
          </span>

          <span>
            <small>Setup</small>
            <strong>${formatarTempo(resumoZona.setupMin)}</strong>
          </span>

          <span>
            <small>Espera</small>
            <strong>${formatarTempo(resumoZona.esperaMin)}</strong>
          </span>

          <span>
            <small>Espelhos</small>
            <strong>${resumoZona.espelhos}</strong>
          </span>

        </div>

      </div>

      <div class="timeline-table-wrapper">

        <table class="timeline-table">

          <thead>
            <tr>
              <th>Horário</th>
              <th>Evento</th>
              <th>Zona</th>
              <th>Produto</th>
              <th>Código</th>
              <th>Família</th>
              <th>Kg</th>
              <th>Duração</th>
              <th>Rota</th>
            </tr>
          </thead>

          <tbody>
            ${eventos.map(renderEvento).join("")}
          </tbody>

        </table>

      </div>

    </section>
  `;

}

function renderLinhaTimeline(linhaTimeline, aberto) {

  const resumo =
    linhaTimeline.resumo || {};

  return `
    <details
      class="timeline-linha-card"
      data-timeline-linha="${escaparHTML(linhaTimeline.linha)}"
      ${aberto ? "open" : ""}
    >

      <summary class="timeline-linha-header">

        <div>
          <h3>${escaparHTML(linhaTimeline.linha)}</h3>

          <p>
            ${escaparHTML(resumo.inicioTexto || "-")}
            até
            ${escaparHTML(resumo.fimTexto || "-")}
          </p>
        </div>

        <div class="timeline-linha-kpis">

          <span>
            <small>Eventos</small>
            <strong>${numero(resumo.totalEventos)}</strong>
          </span>

          <span>
            <small>Produção</small>
            <strong>${formatarTempo(resumo.totalProducaoMin)}</strong>
          </span>

          <span>
            <small>Setup</small>
            <strong>${formatarTempo(resumo.totalSetupMin)}</strong>
          </span>

          <span>
            <small>Espera</small>
            <strong>${formatarTempo(resumo.totalEsperaMin)}</strong>
          </span>

          <span>
            <small>Tempo total</small>
            <strong>${formatarTempo(resumo.tempoTotalMin)}</strong>
          </span>

        </div>

      </summary>

      <div class="timeline-zonas-lista">

        ${renderZonaTimeline("NEGRA", linhaTimeline.eventosPorZona?.NEGRA || [])}
        ${renderZonaTimeline("BRANCA", linhaTimeline.eventosPorZona?.BRANCA || [])}
        ${renderZonaTimeline("CINZA", linhaTimeline.eventosPorZona?.CINZA || [])}
        ${renderZonaTimeline("OUTRAS", linhaTimeline.eventosPorZona?.OUTRAS || [])}

      </div>

    </details>
  `;

}

export function renderTimelineTurno(timeline) {

  const container =
    document.getElementById(
      "timelineTurnoContainer"
    );

  if (!container) {

    console.warn(
      "Container timelineTurnoContainer não encontrado."
    );

    return;

  }

  if (
    !timeline ||
    !Array.isArray(timeline.linhas) ||
    timeline.linhas.length === 0
  ) {

    container.innerHTML = "";

    window.jfcTimelineTurno = null;

    return;

  }

  const estadoLinhasAbertas =
    obterEstadoLinhasAbertas(
      container
    );

  const temEstadoAnterior =
    Object.keys(estadoLinhasAbertas).length > 0;

  window.jfcTimelineTurno =
    timeline;

  const resumo =
    timeline.resumo || {};

  container.innerHTML = `
    <section class="timeline-turno-card">

      <div class="timeline-turno-header">

        <div>
          <h2>Timeline de Turno</h2>

          <p>
            Sequência por horário considerando início às
            <strong>${escaparHTML(timeline.inicioTurnoTexto || "07:00")}</strong>,
            Zona Negra, Zona Branca, Zona Cinza, lead time e esperas.
          </p>
        </div>

        <div class="timeline-header-actions">

          <span class="timeline-badge">
            ${numero(resumo.totalLinhas)} linhas
          </span>

          <span class="timeline-badge">
            ${numero(resumo.totalEventos)} eventos
          </span>

          <span class="timeline-badge">
            Fim ${escaparHTML(resumo.fimTexto || "-")}
          </span>

        </div>

      </div>

      <div class="timeline-kpis">

        <span>
          <small>Produção</small>
          <strong>${formatarTempo(resumo.totalProducaoMin)}</strong>
        </span>

        <span>
          <small>Setup</small>
          <strong>${formatarTempo(resumo.totalSetupMin)}</strong>
        </span>

        <span>
          <small>Espera</small>
          <strong>${formatarTempo(resumo.totalEsperaMin)}</strong>
        </span>

        <span>
          <small>Espelhos</small>
          <strong>${numero(resumo.totalEspelhos)}</strong>
        </span>

        <span>
          <small>Rotas cruzadas</small>
          <strong>${numero(resumo.totalRotasCruzadas)}</strong>
        </span>

        <span>
          <small>Tempo geral</small>
          <strong>${formatarTempo(resumo.tempoTotalMin)}</strong>
        </span>

      </div>

      <div class="timeline-observacao-card">
        <strong>Regra aplicada:</strong>
        Zona Negra inicia no começo do turno.
        Zona Branca inicia após o lead time do produto.
        Zona Cinza espelha a Zona Branca.
      </div>

      <div class="timeline-linhas-lista">
        ${
          timeline.linhas
            .map((linhaTimeline, indice) => {

              const aberto =
                temEstadoAnterior
                  ? estadoLinhasAbertas[linhaTimeline.linha] === true
                  : indice === 0;

              return renderLinhaTimeline(
                linhaTimeline,
                aberto
              );

            })
            .join("")
        }
      </div>

    </section>
  `;

}