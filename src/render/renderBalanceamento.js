/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderBalanceamento
 * Versão: 1.1.0
 *
 * Responsabilidade:
 * Exibir sugestões, bloqueios e simulação recomendada
 * de balanceamento.
 * ======================================================
 */

function formatarTempo(valor) {

  const numero =
    Number(valor) || 0;

  const sinal =
    numero < 0 ? "-" : "";

  const absoluto =
    Math.abs(Math.round(numero));

  if (absoluto < 60) {
    return `${sinal}${absoluto} min`;
  }

  const horas =
    Math.floor(absoluto / 60);

  const minutos =
    absoluto % 60;

  if (minutos === 0) {
    return `${sinal}${horas}h`;
  }

  return `${sinal}${horas}h ${minutos}min`;

}

function formatarNumero(valor) {

  return (Number(valor) || 0).toLocaleString("pt-BR");

}

function renderTabelaPlanoRecomendado(simulacao) {

  const movimentos =
    simulacao?.movimentosSelecionados || [];

  if (movimentos.length === 0) {

    return `
      <div class="balanceamento-empty">
        Nenhum movimento recomendado foi encontrado para aplicação conjunta.
      </div>
    `;

  }

  const linhas =
    movimentos.map(item => {

      const impacto =
        item.impactoEstimado || {};

      return `
        <tr>
          <td>${item.codigo || "-"}</td>
          <td>${item.nomeOficial || "-"}</td>
          <td>${item.origem?.linha || "-"}</td>
          <td>${item.destino?.linha || "-"}</td>
          <td>${formatarTempo(impacto.tempoProdutoOrigemMin)}</td>
          <td>${formatarTempo(impacto.tempoProdutoDestinoMin)}</td>
          <td>${formatarTempo(impacto.variacaoTempoMin)}</td>
          <td>${formatarTempo(impacto.saldoOrigemDepois)}</td>
          <td>${formatarTempo(impacto.saldoDestinoDepois)}</td>
        </tr>
      `;

    }).join("");

  return `
    <div class="balanceamento-table-wrapper">
      <table class="balanceamento-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Produto</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Tempo origem</th>
            <th>Tempo destino</th>
            <th>Variação</th>
            <th>Saldo origem depois</th>
            <th>Saldo destino depois</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    </div>
  `;

}

function renderTabelaLinhasDepois(simulacao) {

  const linhasDepois =
    simulacao?.linhasDepois || [];

  if (linhasDepois.length === 0) {

    return `
      <div class="balanceamento-empty">
        Nenhum resumo de linhas foi gerado pela simulação.
      </div>
    `;

  }

  const linhas =
    linhasDepois.map(linha => `
      <tr>
        <td>${linha.linha}</td>
        <td>${formatarTempo(linha.capacidadeMin)}</td>
        <td>${formatarTempo(linha.tempoPlanejadoMin)}</td>
        <td>${formatarTempo(linha.saldoMin)}</td>
        <td>${linha.utilizacaoPercentual || 0}%</td>
        <td>${linha.statusTextoOriginal || "-"}</td>
        <td>${linha.statusTexto || "-"}</td>
      </tr>
    `).join("");

  return `
    <div class="balanceamento-table-wrapper">
      <table class="balanceamento-table">
        <thead>
          <tr>
            <th>Linha</th>
            <th>Capacidade</th>
            <th>Tempo depois</th>
            <th>Saldo depois</th>
            <th>Uso depois</th>
            <th>Status antes</th>
            <th>Status depois</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    </div>
  `;

}

function renderTabelaSugestoes(sugestoes) {

  if (!sugestoes || sugestoes.length === 0) {

    return `
      <div class="balanceamento-empty">
        Nenhuma sugestão de balanceamento encontrada.
      </div>
    `;

  }

  const linhas =
    sugestoes.map(sugestao => {

      const impacto =
        sugestao.impactoEstimado || {};

      return `
        <tr>
          <td>${sugestao.codigo || "-"}</td>
          <td>${sugestao.nomeOficial || "-"}</td>
          <td>${sugestao.origem?.linha || "-"}</td>
          <td>${sugestao.destino?.linha || "-"}</td>
          <td>${formatarTempo(impacto.tempoProdutoOrigemMin)}</td>
          <td>${formatarTempo(impacto.tempoProdutoDestinoMin)}</td>
          <td>${formatarTempo(impacto.variacaoTempoMin)}</td>
          <td>${formatarTempo(impacto.saldoOrigemDepois)}</td>
          <td>${formatarTempo(impacto.saldoDestinoDepois)}</td>
          <td>${sugestao.validacao?.linhasPermitidas?.join(", ") || "-"}</td>
        </tr>
      `;

    }).join("");

  return `
    <div class="balanceamento-table-wrapper">
      <table class="balanceamento-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Produto</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Tempo origem</th>
            <th>Tempo destino</th>
            <th>Variação</th>
            <th>Saldo origem depois</th>
            <th>Saldo destino depois</th>
            <th>Linhas permitidas</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    </div>
  `;

}

function renderTabelaBloqueios(bloqueios) {

  if (!bloqueios || bloqueios.length === 0) {

    return `
      <div class="balanceamento-empty">
        Nenhum movimento bloqueado encontrado.
      </div>
    `;

  }

  const linhas =
    bloqueios.map(bloqueio => `
      <tr>
        <td>${bloqueio.codigo || "-"}</td>
        <td>${bloqueio.nomeOficial || "-"}</td>
        <td>${bloqueio.origem || "-"}</td>
        <td>${bloqueio.destino || "-"}</td>
        <td>${formatarTempo(bloqueio.tempoProdutoOrigemMin)}</td>
        <td>${formatarTempo(bloqueio.tempoProdutoDestinoMin)}</td>
        <td>${formatarTempo(bloqueio.saldoDestinoMin)}</td>
        <td>${bloqueio.linhasPermitidas?.join(", ") || "-"}</td>
        <td>${bloqueio.motivoTexto || "-"}</td>
      </tr>
    `).join("");

  return `
    <div class="balanceamento-table-wrapper">
      <table class="balanceamento-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Produto</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Tempo origem</th>
            <th>Tempo destino</th>
            <th>Saldo destino</th>
            <th>Linhas permitidas</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
    </div>
  `;

}

export function renderBalanceamento(
  resultadoBalanceamento,
  simulacaoBalanceamento = null
) {

  const container =
    document.getElementById("balanceamentoContainer");

  if (!container) {
    console.warn("Container balanceamentoContainer não encontrado.");
    return;
  }

  if (!resultadoBalanceamento) {

    container.innerHTML = "";

    return;

  }

  const sugestoes =
    resultadoBalanceamento.sugestoes || [];

  const bloqueios =
    resultadoBalanceamento.bloqueios || [];

  const resumo =
    resultadoBalanceamento.resumo || {};

  const resumoSimulacao =
    simulacaoBalanceamento?.resumo || {};

  if (
    sugestoes.length === 0 &&
    bloqueios.length === 0
  ) {

    container.innerHTML = `
      <section class="balanceamento-box">
        <div class="balanceamento-header">
          <h2>Balanceamento</h2>
          <p>Nenhuma sugestão disponível no momento.</p>
        </div>
      </section>
    `;

    return;

  }

  container.innerHTML = `
    <section class="balanceamento-box">

      <div class="balanceamento-header">
        <h2>Balanceamento</h2>
        <p>
          Análise de redistribuição entre linhas considerando capacidade,
          saldo disponível, linhas permitidas e simulação conjunta dos movimentos.
        </p>
      </div>

      <div class="balanceamento-kpis">

        <div class="balanceamento-kpi">
          <span class="balanceamento-kpi-label">Sugestões possíveis</span>
          <strong class="balanceamento-kpi-value">${formatarNumero(sugestoes.length)}</strong>
        </div>

        <div class="balanceamento-kpi">
          <span class="balanceamento-kpi-label">Plano recomendado</span>
          <strong class="balanceamento-kpi-value">${formatarNumero(resumoSimulacao.movimentosSelecionados)}</strong>
        </div>

        <div class="balanceamento-kpi">
          <span class="balanceamento-kpi-label">Ignoradas na simulação</span>
          <strong class="balanceamento-kpi-value">${formatarNumero(resumoSimulacao.movimentosIgnorados)}</strong>
        </div>

        <div class="balanceamento-kpi">
          <span class="balanceamento-kpi-label">Bloqueios</span>
          <strong class="balanceamento-kpi-value">${formatarNumero(bloqueios.length)}</strong>
        </div>

      </div>

      <details class="balanceamento-collapse" open>
        <summary>
          Plano recomendado de balanceamento (${formatarNumero(resumoSimulacao.movimentosSelecionados)})
        </summary>

        <div class="balanceamento-collapse-content">
          ${renderTabelaPlanoRecomendado(simulacaoBalanceamento)}
        </div>
      </details>

      <details class="balanceamento-collapse">
        <summary>
          Resumo das linhas após simulação
        </summary>

        <div class="balanceamento-collapse-content">
          ${renderTabelaLinhasDepois(simulacaoBalanceamento)}
        </div>
      </details>

      <details class="balanceamento-collapse">
        <summary>
          Ver sugestões possíveis (${formatarNumero(resumo.sugestoesGeradas || sugestoes.length)})
        </summary>

        <div class="balanceamento-collapse-content">
          ${renderTabelaSugestoes(sugestoes)}
        </div>
      </details>

      <details class="balanceamento-collapse">
        <summary>
          Ver movimentos bloqueados (${formatarNumero(resumo.movimentosBloqueados || bloqueios.length)})
        </summary>

        <div class="balanceamento-collapse-content">
          ${renderTabelaBloqueios(bloqueios)}
        </div>
      </details>

    </section>
  `;

}