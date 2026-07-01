function escaparHTML(
  valor
) {

  return String(
    valor ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function numero(
  valor
) {

  return Number(valor) || 0;

}

function formatarNumero(
  valor,
  casas = 2
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

function formatarTempo(
  minutos
) {

  const total =
    Math.round(
      numero(minutos)
    );

  if (total <= 0) {
    return "0 min";
  }

  const horas =
    Math.floor(
      total / 60
    );

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

function obterNomeLinha(
  linha
) {

  return String(
    linha?.linha ??
    linha?.nomeLinha ??
    linha?.id ??
    "Linha"
  );

}

function obterProdutosDaLinha(
  linha
) {

  return Array.isArray(linha?.produtos)
    ? linha.produtos
    : Array.isArray(linha?.itens)
      ? linha.itens
      : [];

}

function obterCodigoProduto(
  produto
) {

  return String(
    produto.codigo ??
    produto.codigoProduto ??
    produto.codProduto ??
    "-"
  );

}

function obterNomeProduto(
  produto
) {

  return String(
    produto.nomeOficial ??
    produto.descricaoCSV ??
    produto.nome ??
    produto.produto ??
    produto.descricaoTXT ??
    "-"
  );

}

function obterFamiliaProduto(
  produto
) {

  return String(
    produto.familiaSetup ??
    produto.classeSetup ??
    produto.familia ??
    produto.grupoSetup ??
    "-"
  );

}

function obterOrdemTXT(
  produto
) {

  return (
    produto.ordemTXT ??
    produto.ordemTxt ??
    produto.sequenciaTXT ??
    produto.sequenciaTxt ??
    produto.sequenciaPrincipal ??
    "-"
  );

}

function obterKgProduto(
  produto
) {

  return numero(
    produto.kgPlanejado ??
    produto.demandaFinal ??
    produto.demandaReferencia ??
    produto.demanda ??
    0
  );

}

function montarLinhasPlano(
  planejamento
) {

  const linhas =
    Array.isArray(planejamento?.linhas)
      ? planejamento.linhas
      : [];

  return linhas.map(linha => {

    const produtos =
      obterProdutosDaLinha(
        linha
      );

    const nomeLinha =
      obterNomeLinha(
        linha
      );

    const produtosPlano =
      produtos.map((produto, indice) => {

        return {
          linha:
            nomeLinha,

          ordem:
            produto.ordemProducao ??
            produto.ordemPlanejada ??
            indice + 1,

          ordemTXT:
            obterOrdemTXT(
              produto
            ),

          codigo:
            obterCodigoProduto(
              produto
            ),

          produto:
            obterNomeProduto(
              produto
            ),

          familia:
            obterFamiliaProduto(
              produto
            ),

          kg:
            obterKgProduto(
              produto
            ),

          producaoMin:
            numero(
              produto.tempoProducaoPlanejadoMin ??
              produto.tempoProducaoMin ??
              0
            ),

          setupMin:
            numero(
              produto.setupAplicadoMin ??
              produto.setupMin ??
              produto.setupBaseMin ??
              0
            ),

          totalMin:
            numero(
              produto.tempoTotalPlanejadoMin ??
              0
            )
        };

      });

    const resumo =
      produtosPlano.reduce((acc, item) => {

        acc.totalProdutos += 1;
        acc.kgTotal += item.kg;
        acc.producaoMin += item.producaoMin;
        acc.setupMin += item.setupMin;
        acc.totalMin += item.totalMin;

        return acc;

      }, {
        totalProdutos: 0,
        kgTotal: 0,
        producaoMin: 0,
        setupMin: 0,
        totalMin: 0
      });

    return {
      linha:
        nomeLinha,

      produtos:
        produtosPlano,

      resumo
    };

  });

}

function calcularResumoGeral(
  linhasPlano
) {

  return linhasPlano.reduce((acc, linha) => {

    acc.totalLinhas += 1;
    acc.totalProdutos += linha.resumo.totalProdutos;
    acc.kgTotal += linha.resumo.kgTotal;
    acc.producaoMin += linha.resumo.producaoMin;
    acc.setupMin += linha.resumo.setupMin;
    acc.totalMin += linha.resumo.totalMin;

    return acc;

  }, {
    totalLinhas: 0,
    totalProdutos: 0,
    kgTotal: 0,
    producaoMin: 0,
    setupMin: 0,
    totalMin: 0
  });

}

function renderProdutoPlano(
  item
) {

  return `
    <tr>

      <td>${escaparHTML(item.ordem)}</td>

      <td>${escaparHTML(item.ordemTXT)}</td>

      <td>${escaparHTML(item.codigo)}</td>

      <td class="plano-final-produto">
        ${escaparHTML(item.produto)}
      </td>

      <td>
        <span class="plano-final-familia">
          ${escaparHTML(item.familia)}
        </span>
      </td>

      <td>${formatarNumero(item.kg, 2)}</td>

      <td>${formatarTempo(item.producaoMin)}</td>

      <td>${formatarTempo(item.setupMin)}</td>

      <td>
        <strong>${formatarTempo(item.totalMin)}</strong>
      </td>

    </tr>
  `;

}

function renderLinhaPlano(
  linhaPlano
) {

  return `
    <details class="plano-final-linha-card">

      <summary class="plano-final-linha-header">

        <div>
          <h3>${escaparHTML(linhaPlano.linha)}</h3>

          <p>
            Plano final sequenciado para esta linha.
          </p>
        </div>

        <div class="plano-final-linha-kpis">

          <span>
            <small>Produtos</small>
            <strong>${linhaPlano.resumo.totalProdutos}</strong>
          </span>

          <span>
            <small>Kg</small>
            <strong>${formatarNumero(linhaPlano.resumo.kgTotal, 2)}</strong>
          </span>

          <span>
            <small>Produção</small>
            <strong>${formatarTempo(linhaPlano.resumo.producaoMin)}</strong>
          </span>

          <span>
            <small>Setup</small>
            <strong>${formatarTempo(linhaPlano.resumo.setupMin)}</strong>
          </span>

          <span>
            <small>Total</small>
            <strong>${formatarTempo(linhaPlano.resumo.totalMin)}</strong>
          </span>

        </div>

      </summary>

      <div class="plano-final-table-wrapper">

        <table class="plano-final-table">

          <thead>
            <tr>
              <th>Ordem</th>
              <th>Ordem TXT</th>
              <th>Código</th>
              <th>Produto</th>
              <th>Família</th>
              <th>Kg</th>
              <th>Produção</th>
              <th>Setup</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${linhaPlano.produtos.map(renderProdutoPlano).join("")}
          </tbody>

        </table>

      </div>

    </details>
  `;

}

export function renderPlanoFinalDia(
  planejamento
) {

  const container =
    document.getElementById(
      "planoFinalContainer"
    );

  if (!container) {

    console.warn(
      "Container planoFinalContainer não encontrado."
    );

    return;

  }

  if (
    !planejamento ||
    !Array.isArray(planejamento.linhas) ||
    planejamento.linhas.length === 0
  ) {

    container.innerHTML = "";

    return;

  }

  const linhasPlano =
    montarLinhasPlano(
      planejamento
    );

  const resumoGeral =
    calcularResumoGeral(
      linhasPlano
    );

  container.innerHTML = `
    <section class="plano-final-card">

      <div class="plano-final-header">

        <div>
          <h2>Plano Final do Dia</h2>

          <p>
            Ordem final de produção por linha, considerando família, ordem do TXT,
            ajustes manuais e setup recalculado.
          </p>
        </div>

        <span class="plano-final-badge">
          ${resumoGeral.totalLinhas} linhas
        </span>

      </div>

      <div class="plano-final-kpis">

        <span>
          <small>Produtos</small>
          <strong>${resumoGeral.totalProdutos}</strong>
        </span>

        <span>
          <small>Kg total</small>
          <strong>${formatarNumero(resumoGeral.kgTotal, 2)}</strong>
        </span>

        <span>
          <small>Produção</small>
          <strong>${formatarTempo(resumoGeral.producaoMin)}</strong>
        </span>

        <span>
          <small>Setup</small>
          <strong>${formatarTempo(resumoGeral.setupMin)}</strong>
        </span>

        <span>
          <small>Tempo total</small>
          <strong>${formatarTempo(resumoGeral.totalMin)}</strong>
        </span>

      </div>

      <div class="plano-final-linhas-lista">
        ${linhasPlano.map(renderLinhaPlano).join("")}
      </div>

    </section>
  `;

}