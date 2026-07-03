/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderPlanejamentoReal
 * Versão: 1.2.1
 *
 * Responsabilidade:
 * Exibir o planejamento real já calculado com capacidade.
 * ======================================================
 */

function formatarNumero(valor) {

  const numero = Number(valor) || 0;

  return numero.toLocaleString("pt-BR");

}

function formatarKg(valor) {

  const numero = Number(valor) || 0;

  return numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

}

function formatarTempo(minutos) {

  const total = Math.round(Number(minutos) || 0);

  const sinal = total < 0 ? "-" : "";

  const absoluto = Math.abs(total);

  if (absoluto < 60) {
    return `${sinal}${absoluto} min`;
  }

  const horas = Math.floor(absoluto / 60);

  const restoMin = absoluto % 60;

  if (restoMin === 0) {
    return `${sinal}${horas}h`;
  }

  return `${sinal}${horas}h ${restoMin}min`;

}

function classeStatus(status) {

  const mapa = {

    OK: "status-ok",

    OCIOSA: "status-ociosa",

    ATENCAO: "status-atencao",

    ESTOURADA: "status-estourada",

    SEM_CARGA: "status-sem-carga"

  };

  return mapa[status] || "";

}

function textoSeguro(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {

    return "-";

  }

  return String(valor);

}

function criarTabelaLinha(linhaPlanejada) {

  const linha =
    linhaPlanejada.linha;

  const produtos =
    linhaPlanejada.produtos || [];

  const capacidade =
    linhaPlanejada.capacidade || {};

  const statusClasse =
    classeStatus(
      capacidade.status
    );

  const linhasProdutos =
    produtos
      .map(produto => `
        <tr>
          <td>${textoSeguro(produto.codigo)}</td>

          <td class="real-produto">
            ${textoSeguro(produto.nomeOficial)}
          </td>

          <td>${textoSeguro(produto.zonasTexto)}</td>

          <td>${textoSeguro(produto.sequenciaPrincipal)}</td>

          <td>${formatarNumero(produto.quantidadeCSV ?? produto.demandaFinal)}</td>

          <td>${formatarKg(produto.kgPorUnidadeTXT)} kg</td>

          <td>${formatarKg(produto.kgPlanejado)} kg</td>

          <td>${formatarTempo(produto.tempoProducaoPlanejadoMin)}</td>

          <td>${formatarTempo(produto.setupMin)}</td>

          <td>${formatarTempo(produto.tempoTotalPlanejadoMin)}</td>

          <td>${textoSeguro(produto.statusCalculo)}</td>
        </tr>
      `)
      .join("");

  return `
    <details class="real-line-card">

      <summary>
        <div class="real-line-summary">

          <strong>${textoSeguro(linha)}</strong>

          <span>${formatarNumero(produtos.length)} produtos</span>

          <span>
            Planejado: ${formatarTempo(capacidade.tempoPlanejadoMin)}
          </span>

          <span>
            Capacidade: ${formatarTempo(capacidade.capacidadeMin)}
          </span>

          <span>
            Saldo: ${formatarTempo(capacidade.saldoMin)}
          </span>

          <span>
            Uso: ${capacidade.utilizacaoPercentual || 0}%
          </span>

          <span class="real-status-badge ${statusClasse}">
            ${textoSeguro(capacidade.statusTexto)}
          </span>

          <button
            type="button"
            class="real-balance-line-btn"
            data-linha-balancear="${textoSeguro(linha)}"
          >
            🎯 Balancear esta linha
          </button>

        </div>
      </summary>

      <div class="real-table-wrapper">

        <table class="real-table">

          <thead>
            <tr>
              <th>Código</th>
              <th>Nome oficial</th>
              <th>Zonas</th>
              <th>Seq.</th>
              <th>Qtd. CSV</th>
              <th>Kg/un TXT</th>
              <th>Kg planejado</th>
              <th>Tempo produção</th>
              <th>Setup</th>
              <th>Tempo total</th>
              <th>Cálculo</th>
            </tr>
          </thead>

          <tbody>
            ${linhasProdutos}
          </tbody>

        </table>

      </div>

    </details>
  `;

}

function ativarBotoesBalanceamentoPorLinha(
  container
) {

  if (!container) {
    return;
  }

  container
    .querySelectorAll("[data-linha-balancear]")
    .forEach(botao => {

      botao.addEventListener("click", (event) => {

        event.preventDefault();

        event.stopPropagation();

        const linha =
          botao.dataset.linhaBalancear;

        if (!linha) {

          console.warn(
            "Linha não encontrada no botão de balanceamento."
          );

          return;

        }

        window.dispatchEvent(
          new CustomEvent(
            "jfc:balancear-linha",
            {
              detail: {
                linha
              }
            }
          )
        );

      });

    });

}

export function renderPlanejamentoReal(
  planejamentoComCapacidade
) {

  const container =
    document.getElementById("planejamentoRealContainer");

  if (!container) {

    console.warn(
      "Container planejamentoRealContainer não encontrado."
    );

    return;

  }

  if (
    !planejamentoComCapacidade ||
    !Array.isArray(planejamentoComCapacidade.linhas) ||
    planejamentoComCapacidade.linhas.length === 0
  ) {

    container.innerHTML = "";

    return;

  }

  const linhas =
    planejamentoComCapacidade.linhas;

  const resumo =
    planejamentoComCapacidade.resumo || {};

  const capacidade =
    planejamentoComCapacidade.capacidade || {};

  container.innerHTML = `
    <section class="real-dashboard">

      <div class="real-header">

        <div>
          <h2>Planejamento Real com Capacidade</h2>

          <p>
            Cálculo baseado na demanda final do CSV, tempos técnicos do TXT
            e capacidade disponível por linha.
          </p>
        </div>

        <span class="real-badge">
          Motor de Planejamento
        </span>

      </div>

      <div class="real-kpis">

        <div class="real-kpi">
          <span>Linhas usadas</span>
          <strong>${formatarNumero(resumo.totalLinhas)}</strong>
        </div>

        <div class="real-kpi">
          <span>Produtos planejados</span>
          <strong>${formatarNumero(resumo.totalProdutos)}</strong>
        </div>

        <div class="real-kpi">
          <span>Qtd. CSV total</span>
          <strong>${formatarNumero(resumo.quantidadeTotalCSV ?? resumo.demandaTotal)}</strong>
        </div>

        <div class="real-kpi">
          <span>Kg planejado</span>
          <strong>${formatarKg(resumo.kgTotalPlanejado ?? resumo.kgTotal)} kg</strong>
        </div>

        <div class="real-kpi">
          <span>Utilização geral</span>
          <strong>${capacidade.utilizacaoGeralPercentual || 0}%</strong>
        </div>

        <div class="real-kpi">
          <span>Capacidade total</span>
          <strong>${formatarTempo(capacidade.capacidadeTotalMin)}</strong>
        </div>

        <div class="real-kpi">
          <span>Tempo planejado</span>
          <strong>${formatarTempo(capacidade.tempoPlanejadoTotalMin)}</strong>
        </div>

        <div class="real-kpi">
          <span>Saldo total</span>
          <strong>${formatarTempo(capacidade.saldoTotalMin)}</strong>
        </div>

        <div class="real-kpi">
          <span>Linhas estouradas</span>
          <strong>${formatarNumero(capacidade.linhasEstouradas)}</strong>
        </div>

      </div>

      <div class="real-lines-list">
        ${linhas.map(criarTabelaLinha).join("")}
      </div>

    </section>
  `;

  ativarBotoesBalanceamentoPorLinha(
    container
  );

}