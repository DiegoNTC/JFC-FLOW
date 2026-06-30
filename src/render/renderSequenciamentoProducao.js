/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderSequenciamentoProducao
 * Versão: 1.0.1
 *
 * Responsabilidade:
 * Exibir sequência de produção por linha,
 * agrupada por família/classe de setup.
 *
 * Também dispara evento para mover blocos.
 * ======================================================
 */

function numero(valor) {

  return Number(
    String(valor ?? "")
      .replace(",", ".")
  ) || 0;

}

function formatarNumero(
  valor,
  casas = 0
) {

  return numero(valor)
    .toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
      }
    );

}

function escaparHTML(valor) {

  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function formatarTempo(minutos) {

  const total =
    Math.round(
      numero(minutos)
    );

  const horas =
    Math.floor(total / 60);

  const mins =
    total % 60;

  if (horas <= 0) {
    return `${mins} min`;
  }

  return `${horas}h ${String(mins).padStart(2, "0")}min`;

}

function obterLinhasSequenciadas(
  planejamento
) {

  if (!planejamento) {
    return [];
  }

  if (Array.isArray(planejamento.linhasSequenciadas)) {
    return planejamento.linhasSequenciadas;
  }

  if (Array.isArray(planejamento.linhas)) {
    return planejamento.linhas;
  }

  if (
    planejamento.linhas &&
    typeof planejamento.linhas === "object"
  ) {
    return Object.values(
      planejamento.linhas
    );
  }

  if (Array.isArray(planejamento.planejamentoPorLinha)) {
    return planejamento.planejamentoPorLinha;
  }

  if (
    planejamento.planejamentoPorLinha &&
    typeof planejamento.planejamentoPorLinha === "object"
  ) {
    return Object.values(
      planejamento.planejamentoPorLinha
    );
  }

  return [];

}

function obterNomeLinha(
  linha
) {

  return (
    linha?.linha ||
    linha?.nomeLinha ||
    linha?.id ||
    linha?.codigo ||
    ""
  );

}

function renderProdutoBloco(
  produto
) {

  return `
    <tr>
      <td>${escaparHTML(produto.ordemProducao || produto.ordemPlanejada || "-")}</td>

      <td>${escaparHTML(produto.codigo || "-")}</td>

      <td class="seq-produto-nome">
        ${escaparHTML(produto.nomeOficial || produto.descricao || "-")}
      </td>

      <td>${formatarNumero(produto.kgPlanejado, 2)} kg</td>

      <td>${formatarTempo(produto.tempoProducaoPlanejadoMin)}</td>

      <td>${formatarTempo(produto.setupAplicadoMin)}</td>

      <td>${formatarTempo(produto.tempoTotalPlanejadoMin)}</td>
    </tr>
  `;

}

function renderBloco(
  bloco,
  linha
) {

  const produtos =
    bloco.produtos || [];

  const setupClasse =
    numero(bloco.setupEntradaMin) > 0
      ? "seq-setup-com"
      : "seq-setup-zero";

  const nomeLinha =
    obterNomeLinha(
      linha
    );

  return `
    <details class="seq-bloco" open>

      <summary class="seq-bloco-header">

        <div class="seq-bloco-title">

          <span class="seq-bloco-ordem">
            ${escaparHTML(bloco.ordem || "-")}
          </span>

          <div>
            <h4>${escaparHTML(bloco.familiaSetup || bloco.classeSetup || "SEM FAMÍLIA")}</h4>

            <p>
              ${formatarNumero(bloco.quantidadeProdutos || produtos.length)} produtos
            </p>
          </div>

        </div>

        <div class="seq-bloco-actions">

          <button
            type="button"
            class="seq-move-btn"
            data-mover-bloco="${escaparHTML(bloco.id)}"
            data-linha="${escaparHTML(nomeLinha)}"
            data-direcao="cima"
            title="Mover bloco para cima"
          >
            ↑
          </button>

          <button
            type="button"
            class="seq-move-btn"
            data-mover-bloco="${escaparHTML(bloco.id)}"
            data-linha="${escaparHTML(nomeLinha)}"
            data-direcao="baixo"
            title="Mover bloco para baixo"
          >
            ↓
          </button>

        </div>

        <div class="seq-bloco-kpis">

          <span>
            <small>Kg</small>
            <strong>${formatarNumero(bloco.kgTotal, 2)}</strong>
          </span>

          <span>
            <small>Produção</small>
            <strong>${formatarTempo(bloco.tempoProducaoMin)}</strong>
          </span>

          <span class="${setupClasse}">
            <small>Setup entrada</small>
            <strong>${formatarTempo(bloco.setupEntradaMin)}</strong>
          </span>

          <span>
            <small>Total</small>
            <strong>${formatarTempo(bloco.tempoTotalMin)}</strong>
          </span>

        </div>

      </summary>

      <div class="seq-produtos-wrapper">

        <table class="seq-produtos-table">

          <thead>
            <tr>
              <th>Ordem</th>
              <th>Código</th>
              <th>Produto</th>
              <th>Kg</th>
              <th>Produção</th>
              <th>Setup</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${produtos.map(renderProdutoBloco).join("")}
          </tbody>

        </table>

      </div>

    </details>
  `;

}

function renderLinha(
  linha,
  linhasAbertas = new Set()
) {

  const nomeLinha =
    obterNomeLinha(linha) || "Linha";

  const linhaAberta =
    linhasAbertas.has(nomeLinha);

  const atributoOpen =
    linhaAberta
      ? "open"
      : "";

  const resumo =
    linha.resumoSequenciamento || {};

  const blocos =
    linha.blocos || [];

  if (blocos.length === 0) {
    return "";
  }

  return `
    <details
      class="seq-linha-card"
      data-linha-sequenciamento="${escaparHTML(nomeLinha)}"
      ${atributoOpen}
    >

      <summary class="seq-linha-header">

        <div class="seq-linha-info">
          <h3>${escaparHTML(nomeLinha)}</h3>

          <p>
            Clique para minimizar ou expandir esta linha.
          </p>
        </div>

        <div class="seq-linha-kpis">

          <span>
            <small>Produtos</small>
            <strong>${formatarNumero(resumo.totalProdutos || 0)}</strong>
          </span>

          <span>
            <small>Blocos</small>
            <strong>${formatarNumero(resumo.totalBlocos || blocos.length)}</strong>
          </span>

          <span>
            <small>Kg total</small>
            <strong>${formatarNumero(resumo.kgTotal || 0, 2)}</strong>
          </span>

          <span>
            <small>Produção</small>
            <strong>${formatarTempo(resumo.tempoProducaoMin || 0)}</strong>
          </span>

          <span>
            <small>Setup</small>
            <strong>${formatarTempo(resumo.setupAplicadoMin || 0)}</strong>
          </span>

          <span>
            <small>Total</small>
            <strong>${formatarTempo(resumo.tempoTotalMin || 0)}</strong>
          </span>

        </div>

      </summary>

      <div class="seq-linha-conteudo">

        <div class="seq-blocos-lista">
          ${blocos.map(bloco => renderBloco(bloco, linha)).join("")}
        </div>

      </div>

    </details>
  `;

}

function ativarBotoesMoverBloco(
  container,
  opcoes
) {

  if (!container) {
    return;
  }

  container
    .querySelectorAll("[data-mover-bloco]")
    .forEach(botao => {

      botao.addEventListener("click", (event) => {

        event.preventDefault();
        event.stopPropagation();

        const linha =
          botao.dataset.linha;

        const blocoId =
          botao.dataset.moverBloco;

        const direcao =
          botao.dataset.direcao;

        if (typeof opcoes?.onMoverBloco === "function") {

          opcoes.onMoverBloco({
            linha,
            blocoId,
            direcao
          });

        }

      });

    });

}

export function renderSequenciamentoProducao(
  planejamento,
  opcoes = {}
) {

  const container =
    document.getElementById("sequenciamentoContainer");
  const linhasAbertas =
    new Set(
      Array.from(
        container?.querySelectorAll(".seq-linha-card[open]") || []
      ).map(elemento => {

        return elemento.dataset.linhaSequenciamento;

      }).filter(Boolean)
    );

  if (!container) {

    console.warn(
      "Container sequenciamentoContainer não encontrado."
    );

    return;

  }

  if (!planejamento) {

    container.innerHTML = "";

    return;

  }

  const linhas =
    obterLinhasSequenciadas(
      planejamento
    ).filter(linha => {

      return Array.isArray(linha.blocos) &&
        linha.blocos.length > 0;

    });

  if (linhas.length === 0) {

    container.innerHTML = `
      <section class="sequenciamento-card">
        <h2>Sequenciamento por Família</h2>

        <p class="sequenciamento-empty">
          Nenhuma sequência gerada ainda.
        </p>
      </section>
    `;

    return;

  }

  const resumoGeral =
    planejamento.resumoSequenciamento || {};

  container.innerHTML = `
    <section class="sequenciamento-card">

      <div class="sequenciamento-header">

        <div>
          <h2>Sequenciamento por Família</h2>

          <p>
            Ordem de produção calculada por linha, considerando família de setup.
            Primeiro item não conta setup; setup entra somente na troca de família.
          </p>
        </div>

        <span class="sequenciamento-badge">
          ${formatarNumero(linhas.length)} linhas
        </span>

      </div>

      <div class="sequenciamento-resumo">

        <span>
          <small>Total de produtos</small>
          <strong>${formatarNumero(resumoGeral.totalProdutos || 0)}</strong>
        </span>

        <span>
          <small>Total de blocos</small>
          <strong>${formatarNumero(resumoGeral.totalBlocos || 0)}</strong>
        </span>

        <span>
          <small>Kg total</small>
          <strong>${formatarNumero(resumoGeral.kgTotal || 0, 2)}</strong>
        </span>

        <span>
          <small>Tempo produção</small>
          <strong>${formatarTempo(resumoGeral.tempoProducaoMin || 0)}</strong>
        </span>

        <span>
          <small>Setup aplicado</small>
          <strong>${formatarTempo(resumoGeral.setupAplicadoMin || 0)}</strong>
        </span>

        <span>
          <small>Tempo total</small>
          <strong>${formatarTempo(resumoGeral.tempoTotalMin || 0)}</strong>
        </span>

      </div>

      <div class="seq-linhas-lista">
        ${linhas.map(linha => renderLinha(linha, linhasAbertas)).join("")}
      </div>

    </section>
  `;

  ativarBotoesMoverBloco(
    container,
    opcoes
  );

}