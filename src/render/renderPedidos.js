/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderPedidos
 * Versão: 1.1.0
 *
 * Responsabilidade:
 * Exibir os produtos importados do CSV de forma compacta.
 *
 * Regra:
 * Código e nome oficial vêm do CSV.
 * ======================================================
 */

function formatarNumero(valor) {

  const numero = Number(valor) || 0;

  return numero.toLocaleString("pt-BR");

}

function calcularResumo(pedidos) {

  const totalProdutos = pedidos.length;

  const totalDemanda = pedidos.reduce((soma, item) => {

    return soma + (Number(item.demandaFinal) || 0);

  }, 0);

  const totalPedidos = pedidos.reduce((soma, item) => {

    return soma + (Number(item.pedidos) || 0);

  }, 0);

  const totalPrioridade = pedidos.reduce((soma, item) => {

    return soma + (Number(item.prioridade) || 0);

  }, 0);

  return {
    totalProdutos,
    totalDemanda,
    totalPedidos,
    totalPrioridade
  };

}

function criarLinhaPedido(item) {

  return `
    <tr>
      <td>${item.codigo || ""}</td>
      <td class="pedido-produto">${item.produto || ""}</td>
      <td>${formatarNumero(item.previa)}</td>
      <td>${formatarNumero(item.pedidos)}</td>
      <td>${formatarNumero(item.prioridade)}</td>
      <td><strong>${formatarNumero(item.demandaFinal)}</strong></td>
      <td>${item.categoria || ""}</td>
    </tr>
  `;

}

export function renderPedidos(pedidos) {

  const container =
    document.getElementById("pedidoContainer");

  if (!container) {
    console.warn("Container pedidoContainer não encontrado.");
    return;
  }

  if (!Array.isArray(pedidos) || pedidos.length === 0) {

    container.innerHTML = `
      <section class="pedido-dashboard">
        <h2>Pedido importado</h2>
        <p>Nenhum produto encontrado no CSV.</p>
      </section>
    `;

    return;

  }

  const resumo = calcularResumo(pedidos);

  container.innerHTML = `
    <section class="pedido-dashboard">

      <div class="pedido-header">

        <div>
          <h2>Pedido importado do CSV</h2>
          <p>Códigos e nomes oficiais conforme arquivo de pedidos.</p>
        </div>

        <span class="pedido-badge">
          ${formatarNumero(resumo.totalProdutos)} produtos
        </span>

      </div>

      <div class="pedido-kpis">

        <div class="pedido-kpi">
          <span>Produtos</span>
          <strong>${formatarNumero(resumo.totalProdutos)}</strong>
        </div>

        <div class="pedido-kpi">
          <span>Pedido</span>
          <strong>${formatarNumero(resumo.totalPedidos)}</strong>
        </div>

        <div class="pedido-kpi">
          <span>Prioridade</span>
          <strong>${formatarNumero(resumo.totalPrioridade)}</strong>
        </div>

        <div class="pedido-kpi">
          <span>Demanda final</span>
          <strong>${formatarNumero(resumo.totalDemanda)}</strong>
        </div>

      </div>

      <details class="pedido-detalhes">

        <summary>
          Ver produtos do CSV
        </summary>

        <div class="pedido-table-wrapper">

          <table class="pedido-table">

            <thead>
              <tr>
                <th>Código</th>
                <th>Nome oficial</th>
                <th>Prévia</th>
                <th>Pedido</th>
                <th>Prioridade</th>
                <th>Demanda final</th>
                <th>Categoria</th>
              </tr>
            </thead>

            <tbody>
              ${pedidos.map(criarLinhaPedido).join("")}
            </tbody>

          </table>

        </div>

      </details>

    </section>
  `;

}