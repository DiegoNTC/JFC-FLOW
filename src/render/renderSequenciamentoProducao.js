/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderSequenciamentoProducao
 *
 * Responsabilidade:
 * Renderizar o Sequenciamento por Família.
 * - Linhas começam minimizadas.
 * - Linha aberta permanece aberta após mover bloco.
 * - Exibe Ordem TXT para conferência.
 * ======================================================
 */

function texto(valor) {

  return String(valor ?? "").trim();

}

function numero(valor) {

  const convertido =
    Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;

}

function escaparHTML(valor) {

  return texto(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

function formatarNumero(valor, casas = 0) {

  return numero(valor).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas
    }
  );

}

function formatarTempo(minutos) {

  const total =
    Math.round(numero(minutos));

  if (total <= 0) {
    return "0 min";
  }

  const horas =
    Math.floor(total / 60);

  const mins =
    total % 60;

  if (horas > 0 && mins > 0) {
    return `${horas}h ${mins}min`;
  }

  if (horas > 0) {
    return `${horas}h`;
  }

  return `${mins} min`;

}

function obterNomeLinha(linha = {}) {

  return texto(
    linha.linha ??
    linha.nomeLinha ??
    linha.nome ??
    linha.id
  );

}

function obterCodigoProduto(produto = {}) {

  return texto(
    produto.codigo ??
    produto.codigoProduto ??
    produto.codProduto ??
    "-"
  );

}

function obterNomeProduto(produto = {}) {

  return texto(
    produto.nomeOficial ??
    produto.nomeProduto ??
    produto.produtoVenda ??
    produto.produto ??
    produto.descricaoCSV ??
    produto.descricaoTXT ??
    produto.nome ??
    "-"
  );

}

function obterOrdemTXT(produto = {}) {

  return produto.ordemTXT ??
    produto.ordemTxt ??
    produto.sequenciaTXT ??
    produto.sequenciaTxt ??
    produto.sequencia ??
    "-";

}

function obterLinhasAbertas(container) {

  return new Set(
    Array.from(
      container?.querySelectorAll(".seq-linha-card[open]") || []
    )
      .map(elemento => elemento.dataset.linhaSequenciamento)
      .filter(Boolean)
  );

}

function renderResumoGeral(resumo = {}) {

  return `
    <div class="sequenciamento-resumo">
      <span>
        <small>Linhas</small>
        <strong>${formatarNumero(resumo.totalLinhas || 0)}</strong>
      </span>

      <span>
        <small>Produtos</small>
        <strong>${formatarNumero(resumo.totalProdutos || 0)}</strong>
      </span>

      <span>
        <small>Famílias</small>
        <strong>${formatarNumero(resumo.totalBlocos || 0)}</strong>
      </span>

      <span>
        <small>Kg total</small>
        <strong>${formatarNumero(resumo.kgTotal || 0, 2)}</strong>
      </span>

      <span>
        <small>Setup</small>
        <strong>${formatarTempo(resumo.setupAplicadoMin || 0)}</strong>
      </span>

      <span>
        <small>Tempo total</small>
        <strong>${formatarTempo(resumo.tempoTotalMin || 0)}</strong>
      </span>
    </div>
  `;

}

function renderProduto(produto) {

  return `
    <tr>
      <td>${formatarNumero(produto.ordemProducao || produto.ordemPlanejada || 0)}</td>
      <td>${escaparHTML(obterOrdemTXT(produto))}</td>
      <td>${escaparHTML(obterCodigoProduto(produto))}</td>
      <td class="seq-produto-nome">${escaparHTML(obterNomeProduto(produto))}</td>
      <td>${formatarNumero(produto.kgPlanejado || produto.kgTotal || produto.demandaKg || 0, 2)}</td>
      <td>${formatarTempo(produto.tempoProducaoPlanejadoMin || produto.tempoPlanejadoMin || 0)}</td>
      <td>${formatarTempo(produto.setupAplicadoMin || 0)}</td>
      <td>${formatarTempo(produto.tempoTotalPlanejadoMin || 0)}</td>
    </tr>
  `;

}

function renderTabelaProdutos(produtos = []) {

  return `
    <div class="seq-produtos-wrapper">
      <table class="seq-produtos-table">
        <thead>
          <tr>
            <th>Ordem atual</th>
            <th>Ordem TXT</th>
            <th>Código</th>
            <th>Produto</th>
            <th>Kg</th>
            <th>Produção</th>
            <th>Setup</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          ${produtos.map(renderProduto).join("")}
        </tbody>
      </table>
    </div>
  `;

}

function renderBloco(bloco, linha) {

  const linhaNome =
    obterNomeLinha(linha);

  const blocoId =
    bloco.id || bloco.blocoId;

  const setupClasse =
    numero(bloco.setupAplicadoMin) > 0
      ? "seq-setup-com"
      : "seq-setup-zero";

  const faixaTXT =
    bloco.ordemTXTInicial && bloco.ordemTXTFinal
      ? bloco.ordemTXTInicial === bloco.ordemTXTFinal
        ? bloco.ordemTXTInicial
        : `${bloco.ordemTXTInicial} - ${bloco.ordemTXTFinal}`
      : "-";

  return `
    <details class="seq-bloco" open>
      <summary class="seq-bloco-header">
        <div class="seq-bloco-title">
          <span class="seq-bloco-ordem">${formatarNumero(bloco.ordemBloco || 0)}</span>

          <div>
            <h4>${escaparHTML(bloco.familiaSetup || "SEM FAMÍLIA")}</h4>
            <p>${formatarNumero(bloco.totalProdutos || bloco.produtos?.length || 0)} produtos | Ordem TXT: ${escaparHTML(faixaTXT)}</p>
          </div>
        </div>

        <div class="seq-bloco-actions">
          <button
            type="button"
            class="seq-move-btn"
            data-mover-bloco="${escaparHTML(blocoId)}"
            data-linha="${escaparHTML(linhaNome)}"
            data-direcao="up"
            title="Subir família"
          >↑</button>

          <button
            type="button"
            class="seq-move-btn"
            data-mover-bloco="${escaparHTML(blocoId)}"
            data-linha="${escaparHTML(linhaNome)}"
            data-direcao="down"
            title="Descer família"
          >↓</button>
        </div>

        <div class="seq-bloco-kpis">
          <span>
            <small>Kg</small>
            <strong>${formatarNumero(bloco.kgTotal || 0, 2)}</strong>
          </span>

          <span>
            <small>Produção</small>
            <strong>${formatarTempo(bloco.tempoProducaoMin || 0)}</strong>
          </span>

          <span class="${setupClasse}">
            <small>Setup</small>
            <strong>${formatarTempo(bloco.setupAplicadoMin || 0)}</strong>
          </span>

          <span>
            <small>Total</small>
            <strong>${formatarTempo(bloco.tempoTotalMin || 0)}</strong>
          </span>
        </div>
      </summary>

      ${renderTabelaProdutos(bloco.produtos || [])}
    </details>
  `;

}

function renderLinha(linha, linhasAbertas = new Set()) {

  const resumo =
    linha.resumoSequenciamento || {};

  const blocos =
    linha.blocos || [];

  if (blocos.length === 0) {
    return "";
  }

  const nomeLinha =
    obterNomeLinha(linha) || "Linha";

  const atributoOpen =
    linhasAbertas.has(nomeLinha)
      ? "open"
      : "";

  return `
    <details
      class="seq-linha-card"
      data-linha-sequenciamento="${escaparHTML(nomeLinha)}"
      ${atributoOpen}
    >
      <summary class="seq-linha-header">
        <div class="seq-linha-info">
          <h3>${escaparHTML(nomeLinha)}</h3>
          <p>Clique para expandir ou minimizar esta linha.</p>
        </div>

        <div class="seq-linha-kpis">
          <span>
            <small>Produtos</small>
            <strong>${formatarNumero(resumo.totalProdutos || 0)}</strong>
          </span>

          <span>
            <small>Famílias</small>
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

function ativarBotoesMoverBloco(container, opcoes) {

  container
    .querySelectorAll("[data-mover-bloco]")
    .forEach(botao => {

      botao.addEventListener("mousedown", (event) => {

        event.preventDefault();
        event.stopPropagation();

      });

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

  if (!container) {

    console.warn(
      "Container sequenciamentoContainer não encontrado."
    );

    return;

  }

  const linhasAbertas =
    obterLinhasAbertas(container);

  if (!planejamento) {

    container.innerHTML = "";
    return;

  }

  const linhas =
    planejamento.linhas || [];

  const linhasComBlocos =
    linhas.filter(linha => {

      return (linha.blocos || []).length > 0;

    });

  if (linhasComBlocos.length === 0) {

    container.innerHTML = "";
    return;

  }

  container.innerHTML = `
    <section class="sequenciamento-card">
      <div class="sequenciamento-header">
        <div>
          <h2>Sequenciamento por Família</h2>
          <p>
            A ordem inicial considera a sequência do TXT. Depois, o PCP pode ajustar movendo famílias com as setas.
          </p>
        </div>

        <span class="sequenciamento-badge">Famílias + Ordem TXT</span>
      </div>

      ${renderResumoGeral(planejamento.resumoSequenciamento || {})}

      <div class="seq-linhas-lista">
        ${linhasComBlocos.map(linha => renderLinha(linha, linhasAbertas)).join("")}
      </div>
    </section>
  `;

  ativarBotoesMoverBloco(
    container,
    opcoes
  );

}
