/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderPlanejamentoSimulado
 * Versão: 1.0.1
 *
 * Responsabilidade:
 * Exibir o planejamento após aplicação simulada
 * do plano recomendado de balanceamento.
 *
 * Não salva nada.
 * Não altera Cadastro Mestre.
 * ======================================================
 */

function formatarNumero(valor) {

    return (Number(valor) || 0).toLocaleString("pt-BR");

}

function formatarTempo(valor) {

    const numero =
        Math.round(Number(valor) || 0);

    const sinal =
        numero < 0 ? "-" : "";

    const absoluto =
        Math.abs(numero);

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

function criarLinhaProduto(produto) {

    const balanceado =
        produto.balanceado === true;

    return `
    <tr class="${balanceado ? "simulado-produto-movido" : ""}">

      <td>${textoSeguro(produto.codigo)}</td>

      <td class="simulado-produto">
        ${textoSeguro(produto.nomeOficial)}

        ${balanceado
            ? `<span class="simulado-tag">Movido</span>`
            : ""
        }
      </td>

      <td>
        ${textoSeguro(
            produto.linhaOrigemAntesBalanceamento ||
            produto.linhaPlanejada
        )
        }
      </td>

      <td>${textoSeguro(produto.linhaPlanejada)}</td>

      <td>${formatarNumero(produto.demandaFinal)}</td>

      <td>${formatarTempo(produto.tempoTotalPlanejadoMin)}</td>

      <td>${textoSeguro(produto.statusCalculo)}</td>

    </tr>
  `;

}

function criarCardLinha(linha) {

    const capacidade =
        linha.capacidade || {};

    const statusClasse =
        classeStatus(capacidade.status);

    const produtos =
        linha.produtos || [];

    const produtosMovidos =
        produtos.filter(produto => produto.balanceado).length;

    return `
    <details class="simulado-line-card">

      <summary>
        <div class="simulado-line-summary">

          <strong>${textoSeguro(linha.linha)}</strong>

          <span>${formatarNumero(produtos.length)} produtos</span>

          <span>Movidos: ${formatarNumero(produtosMovidos)}</span>

          <span>Planejado: ${formatarTempo(capacidade.tempoPlanejadoMin)}</span>

          <span>Capacidade: ${formatarTempo(capacidade.capacidadeMin)}</span>

          <span>Saldo: ${formatarTempo(capacidade.saldoMin)}</span>

          <span>Uso: ${capacidade.utilizacaoPercentual || 0}%</span>

          <span class="real-status-badge ${statusClasse}">
            ${textoSeguro(capacidade.statusTexto)}
          </span>

        </div>
      </summary>

      <div class="simulado-table-wrapper">

        <table class="simulado-table">

          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Origem anterior</th>
              <th>Linha simulada</th>
              <th>Demanda</th>
              <th>Tempo total</th>
              <th>Status cálculo</th>
            </tr>
          </thead>

          <tbody>
            ${produtos.map(criarLinhaProduto).join("")}
          </tbody>

        </table>

      </div>

    </details>
  `;

}

function formatarVariacaoTempo(valor) {

    const numero =
        Number(valor) || 0;

    if (numero > 0) {
        return `+${formatarTempo(numero)}`;
    }

    return formatarTempo(numero);

}

function formatarVariacaoNumero(valor) {

    const numero =
        Number(valor) || 0;

    if (numero > 0) {
        return `+${numero}`;
    }

    return `${numero}`;

}

function criarClasseVariacao(
    valor,
    tipo = "menor_melhor"
) {

    const numero =
        Number(valor) || 0;

    if (numero === 0) {
        return "variacao-neutra";
    }

    if (tipo === "maior_melhor") {

        return numero > 0
            ? "variacao-boa"
            : "variacao-ruim";

    }

    return numero < 0
        ? "variacao-boa"
        : "variacao-ruim";

}

function renderComparativo(comparativo) {

    if (!comparativo) {
        return "";
    }

    const antes =
        comparativo.antes || {};

    const depois =
        comparativo.depois || {};

    const variacao =
        comparativo.variacao || {};

    return `
    <div class="simulado-comparativo">

      <h3>Comparativo Antes x Depois</h3>

      <div class="simulado-comparativo-grid">

        <div class="simulado-comparativo-card">
          <span>Linhas estouradas</span>

          <strong>
            ${formatarNumero(antes.linhasEstouradas)}
            →
            ${formatarNumero(depois.linhasEstouradas)}
          </strong>

          <small class="${criarClasseVariacao(variacao.linhasEstouradas, "menor_melhor")}">
            ${formatarVariacaoNumero(variacao.linhasEstouradas)}
          </small>
        </div>

        <div class="simulado-comparativo-card">
          <span>Linhas em atenção</span>

          <strong>
            ${formatarNumero(antes.linhasAtencao)}
            →
            ${formatarNumero(depois.linhasAtencao)}
          </strong>

          <small class="${criarClasseVariacao(variacao.linhasAtencao, "menor_melhor")}">
            ${formatarVariacaoNumero(variacao.linhasAtencao)}
          </small>
        </div>

        <div class="simulado-comparativo-card">
          <span>Saldo total</span>

          <strong>
            ${formatarTempo(antes.saldoTotalMin)}
            →
            ${formatarTempo(depois.saldoTotalMin)}
          </strong>

          <small class="${criarClasseVariacao(variacao.saldoTotalMin, "maior_melhor")}">
            ${formatarVariacaoTempo(variacao.saldoTotalMin)}
          </small>
        </div>

        <div class="simulado-comparativo-card">
          <span>Utilização geral</span>

          <strong>
            ${antes.utilizacaoGeralPercentual || 0}%
            →
            ${depois.utilizacaoGeralPercentual || 0}%
          </strong>

          <small class="${criarClasseVariacao(variacao.utilizacaoGeralPercentual, "menor_melhor")}">
            ${formatarVariacaoNumero(variacao.utilizacaoGeralPercentual)}%
          </small>
        </div>

      </div>

    </div>
  `;

}

function criarClasseMelhoraSaldo(valor) {

    const numero =
        Number(valor) || 0;

    if (numero === 0) {
        return "variacao-neutra";
    }

    return numero > 0
        ? "variacao-boa"
        : "variacao-ruim";

}

function criarTextoMovimentoLinha(linha) {

    const saiu =
        Number(linha.saiu) || 0;

    const entrou =
        Number(linha.entrou) || 0;

    if (saiu === 0 && entrou === 0) {
        return "Sem movimentação";
    }

    const partes = [];

    if (saiu > 0) {
        partes.push(`Saiu: ${saiu}`);
    }

    if (entrou > 0) {
        partes.push(`Entrou: ${entrou}`);
    }

    return partes.join(" | ");

}

function renderResumoLinhas(resumoLinhas) {

    if (
        !Array.isArray(resumoLinhas) ||
        resumoLinhas.length === 0
    ) {
        return "";
    }

    const linhasComMovimento =
        resumoLinhas.filter(linha => {

            return (
                Number(linha.saiu) > 0 ||
                Number(linha.entrou) > 0 ||
                Number(linha.variacaoSaldoMin) !== 0
            );

        });

    if (linhasComMovimento.length === 0) {
        return "";
    }

    return `
    <details class="simulado-collapse" open>

      <summary>
        Resumo das linhas impactadas
      </summary>

      <div class="simulado-resumo-linhas">

        ${linhasComMovimento.map(linha => `
          <div class="simulado-resumo-linha-card">

            <div class="simulado-resumo-linha-topo">

              <strong>${linha.linha}</strong>

              <span class="real-status-badge ${classeStatus(linha.statusDepois)}">
                ${linha.statusTextoAntes || "-"} → ${linha.statusTextoDepois || "-"}
              </span>

            </div>

            <div class="simulado-resumo-linha-info">

              <span>
                ${criarTextoMovimentoLinha(linha)}
              </span>

              <span>
                Produtos:
                ${formatarNumero(linha.produtosAntes)}
                →
                ${formatarNumero(linha.produtosDepois)}
              </span>

              <span>
                Tempo:
                ${formatarTempo(linha.tempoAntesMin)}
                →
                ${formatarTempo(linha.tempoDepoisMin)}
              </span>

              <span>
                Saldo:
                ${formatarTempo(linha.saldoAntesMin)}
                →
                ${formatarTempo(linha.saldoDepoisMin)}
              </span>

              <span class="${criarClasseMelhoraSaldo(linha.variacaoSaldoMin)} simulado-variacao-pill">
                Variação saldo:
                ${formatarVariacaoTempo(linha.variacaoSaldoMin)}
              </span>

            </div>

          </div>
        `).join("")}

      </div>

    </details>
  `;

}

export function renderPlanejamentoSimulado(
    resultadoSimulado
) {

    const container =
        document.getElementById("planejamentoSimuladoContainer");

    if (!container) {

        console.warn(
            "Container planejamentoSimuladoContainer não encontrado."
        );

        return;

    }

    if (
        !resultadoSimulado ||
        !resultadoSimulado.planejamentoSimulado
    ) {

        container.innerHTML = "";

        return;

    }

    const planejamento =
        resultadoSimulado.planejamentoSimulado;

    const resumo =
        planejamento.resumo || {};

    const capacidade =
        planejamento.capacidade || {};

    const movimentosAplicados =
        resultadoSimulado.movimentosAplicados || [];

    const movimentosComErro =
        resultadoSimulado.movimentosComErro || [];

    const comparativo =
        resultadoSimulado.comparativo || null;

    const resumoLinhas =
        resultadoSimulado.resumoLinhas || [];

    container.innerHTML = `
    <section class="simulado-dashboard">

      <div class="simulado-header">

        <div>
          <h2>Planejamento Simulado após Balanceamento</h2>

          <p>
            Cenário visual com os movimentos recomendados aplicados apenas em simulação.
            Nada foi salvo no Cadastro Mestre.
          </p>
        </div>

        <span class="simulado-badge">
          Simulação
        </span>

      </div>

      <div class="simulado-kpis">

        <div class="simulado-kpi">
          <span>Movimentos aplicados</span>
          <strong>${formatarNumero(movimentosAplicados.length)}</strong>
        </div>

        <div class="simulado-kpi">
          <span>Erros na simulação</span>
          <strong>${formatarNumero(movimentosComErro.length)}</strong>
        </div>

        <div class="simulado-kpi">
          <span>Linhas estouradas</span>
          <strong>${formatarNumero(capacidade.linhasEstouradas)}</strong>
        </div>

        <div class="simulado-kpi">
          <span>Utilização geral</span>
          <strong>${capacidade.utilizacaoGeralPercentual || 0}%</strong>
        </div>

        <div class="simulado-kpi">
          <span>Tempo planejado</span>
          <strong>${formatarTempo(capacidade.tempoPlanejadoTotalMin)}</strong>
        </div>

        <div class="simulado-kpi">
          <span>Saldo total</span>
          <strong>${formatarTempo(capacidade.saldoTotalMin)}</strong>
        </div>

        <div class="simulado-kpi">
          <span>Produtos</span>
          <strong>${formatarNumero(resumo.totalProdutos)}</strong>
        </div>

        <div class="simulado-kpi">
          <span>Demanda total</span>
          <strong>${formatarNumero(resumo.demandaTotal)}</strong>
        </div>

      </div>

      ${renderComparativo(comparativo)}

      ${renderResumoLinhas(resumoLinhas)}

      <details class="simulado-collapse" open>

        <summary>
          Ver linhas após balanceamento simulado
        </summary>

        <div class="simulado-lines-list">
          ${(planejamento.linhas || []).map(criarCardLinha).join("")}
        </div>

      </details>

    </section>
  `;

}