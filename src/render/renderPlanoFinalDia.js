/**
 * ======================================================
 * JFC FLOW
 * Módulo: renderPlanoFinalDia
 * Versão: 1.1.0
 *
 * Responsabilidade:
 * Renderizar o Plano Final do Dia com base no
 * planejamento já sequenciado.
 *
 * Agora o Plano Final usa a lógica operacional extraída
 * do sequenciador real da fábrica:
 *
 * - Zona Negra usa srcLinha
 * - Zona Branca usa dstLinha
 * - Zona Cinza usa dstLinha como espelho operacional
 *
 * Exemplo:
 * Produto com [N:L5→B/C:L6]
 *
 * Aparece como:
 * - L5 / Zona Negra
 * - L6 / Zona Branca
 * - L6 / Zona Cinza
 * ======================================================
 */

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

function texto(valor) {

  return String(valor ?? "")
    .trim();

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

function normalizarLinha(linha) {

  const valor =
    texto(linha)
      .toUpperCase();

  if (
    valor === "LT" ||
    valor.includes("TOMATE")
  ) {
    return "TOMATE";
  }

  const numeroLinha =
    valor.match(/(\d+)/);

  if (numeroLinha) {
    return `L${numeroLinha[1]}`;
  }

  return valor || "Sem linha";

}

function normalizarZonaOperacional(zona) {

  const valor =
    texto(zona)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  if (valor.includes("NEGRA")) {
    return "NEGRA";
  }

  if (valor.includes("BRANCA")) {
    return "BRANCA";
  }

  if (valor.includes("CINZA")) {
    return "CINZA";
  }

  return valor || "OUTRAS";

}

function obterNomeLinha(linha) {

  return normalizarLinha(
    linha?.linha ??
    linha?.nomeLinha ??
    linha?.nome ??
    linha?.id ??
    "Linha"
  );

}

function obterProdutosDaLinha(linha) {

  return Array.isArray(linha?.produtos)
    ? linha.produtos
    : Array.isArray(linha?.itens)
      ? linha.itens
      : [];

}

function obterCodigoProduto(produto) {

  return texto(
    produto?.codigo ??
    produto?.codigoProduto ??
    produto?.codProduto ??
    produto?.cod ??
    "-"
  );

}

function obterNomeProduto(produto) {

  return texto(
    produto?.nomeOficial ??
    produto?.descricaoCSV ??
    produto?.nomeProduto ??
    produto?.produtoVenda ??
    produto?.produto ??
    produto?.nome ??
    produto?.descricaoTXT ??
    produto?.descricao ??
    "-"
  );

}

function obterFamiliaProduto(produto) {

  return texto(
    produto?.familiaSetup ??
    produto?.classeSetup ??
    produto?.familia ??
    produto?.grupoSetup ??
    "-"
  );

}

function obterOrdemTXT(origem) {

  const valor =
    origem?.ordemLinhaTXT ??
    origem?.ordemTXT ??
    origem?.ordemTxt ??
    origem?.sequenciaTXT ??
    origem?.sequenciaTxt ??
    origem?.sequenciaPrincipal ??
    origem?.sequencia ??
    null;

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  return valor;

}

function obterOrdemFinal(produto, indice) {

  return numero(
    produto?.ordemProducao ??
    produto?.ordemPlanejada ??
    produto?.ordemFinal ??
    indice + 1
  );

}

function obterKgProduto(produto) {

  return numero(
    produto?.kgPlanejado ??
    produto?.demandaKg ??
    produto?.kgDia ??
    produto?.kgTotal ??
    produto?.demandaFinal ??
    produto?.demandaReferencia ??
    produto?.demanda ??
    0
  );

}

function obterTempoProducaoProduto(produto) {

  return numero(
    produto?.tempoProducaoPlanejadoMin ??
    produto?.tempoProducaoMin ??
    produto?.tempoPlanejadoMin ??
    produto?.tempoMin ??
    0
  );

}

function obterSetupProduto(produto) {

  return numero(
    produto?.setupAplicadoMin ??
    produto?.setupPlanejadoMin ??
    produto?.setupMin ??
    produto?.setupBaseMin ??
    produto?.setupTrocaMin ??
    0
  );

}

function obterTempoTotalProduto(produto) {

  const totalInformado =
    numero(
      produto?.tempoTotalPlanejadoMin ??
      produto?.tempoTotalMin ??
      0
    );

  if (totalInformado > 0) {
    return totalInformado;
  }

  return (
    obterTempoProducaoProduto(produto) +
    obterSetupProduto(produto)
  );

}

function obterTransferencia(origem = {}) {

  const transferencia =
    origem.transferencia || {};

  const linhaBase =
    normalizarLinha(
      origem.linha ??
      origem.linhaPlanejada ??
      origem.linhaPrincipal ??
      ""
    );

  const srcLinha =
    normalizarLinha(
      origem.srcLinha ??
      origem.linhaOrigemNegra ??
      origem.linhaOrigem ??
      transferencia.srcLinha ??
      transferencia.linhaOrigemNegra ??
      transferencia.linhaOrigem ??
      linhaBase
    );

  const dstLinha =
    normalizarLinha(
      origem.dstLinha ??
      origem.linhaDestinoBrancaCinza ??
      origem.linhaDestino ??
      transferencia.dstLinha ??
      transferencia.linhaDestinoBrancaCinza ??
      transferencia.linhaDestino ??
      linhaBase
    );

  const rotaCruzada =
    srcLinha &&
    dstLinha &&
    srcLinha !== dstLinha;

  return {
    raw:
      transferencia.raw ??
      origem.transferenciaRaw ??
      null,

    valido:
      Boolean(
        origem.transferenciaValida ??
        transferencia.valido ??
        false
      ),

    srcLinha,

    dstLinha,

    linhaOrigemNegra:
      srcLinha,

    linhaDestinoBrancaCinza:
      dstLinha,

    linhaOrigem:
      srcLinha,

    linhaDestino:
      dstLinha,

    rotaCruzada,

    zonaOrigem:
      origem.zonaOrigem ??
      transferencia.zonaOrigem ??
      "NEGRA",

    zonaDestino:
      origem.zonaDestino ??
      transferencia.zonaDestino ??
      "BRANCA_CINZA"
  };

}

function calcularTempoPorRota(produto, rota) {

  const demanda =
    obterKgProduto(
      produto
    );

  const unidadeBaseTXT =
    numero(
      rota?.unidadeDia
    );

  const tempoBaseTXTMin =
    numero(
      rota?.tempoProducaoMin
    );

  if (
    demanda > 0 &&
    unidadeBaseTXT > 0 &&
    tempoBaseTXTMin > 0
  ) {

    return Math.ceil(
      demanda * (tempoBaseTXTMin / unidadeBaseTXT)
    );

  }

  return obterTempoProducaoProduto(
    produto
  );

}

function obterRotasTecnicasProduto(produto) {

  if (
    Array.isArray(produto?.rotasTecnicasProduto) &&
    produto.rotasTecnicasProduto.length > 0
  ) {
    return produto.rotasTecnicasProduto;
  }

  if (
    Array.isArray(produto?.rotasOperacionais) &&
    produto.rotasOperacionais.length > 0
  ) {
    return produto.rotasOperacionais;
  }

  if (
    Array.isArray(produto?.rotasOriginais) &&
    produto.rotasOriginais.length > 0
  ) {
    return produto.rotasOriginais;
  }

  return [
    produto
  ];

}

function criarChaveItemZona(item) {

  return [
    item.linha,
    item.zonaOperacional,
    item.codigo,
    item.produto,
    item.ordemTXT,
    item.origemRota
  ].join("|");

}

function criarItemPlanoZona(
  produto,
  rota,
  indiceProduto,
  zonaForcada = null,
  opcoes = {}
) {

  const zonaOperacional =
    normalizarZonaOperacional(
      zonaForcada ??
      rota?.zonaOperacional ??
      rota?.zona ??
      produto?.zonaOperacional ??
      "OUTRAS"
    );

  const transferencia =
    obterTransferencia(
      {
        ...produto,
        ...rota
      }
    );

  const linhaOperacional =
    zonaOperacional === "NEGRA"
      ? transferencia.srcLinha
      : zonaOperacional === "BRANCA" || zonaOperacional === "CINZA"
        ? transferencia.dstLinha
        : normalizarLinha(
            rota?.linha ??
            produto?.linha ??
            produto?.linhaPlanejada ??
            produto?.linhaPrincipal ??
            transferencia.srcLinha
          );

  const ordemTXT =
    obterOrdemTXT(
      rota
    ) !== "-"
      ? obterOrdemTXT(
          rota
        )
      : obterOrdemTXT(
          produto
        );

  const setupMin =
    opcoes.espelho
      ? 0
      : numero(
          rota?.setupAplicadoMin ??
          rota?.setupMin ??
          rota?.setupBaseMin ??
          produto?.setupAplicadoMin ??
          produto?.setupMin ??
          produto?.setupBaseMin ??
          0
        );

  const producaoMin =
    opcoes.espelho
      ? 0
      : calcularTempoPorRota(
          produto,
          rota
        );

  const totalMin =
    opcoes.espelho
      ? 0
      : producaoMin + setupMin;

  return {
    linha:
      linhaOperacional,

    linhaPlanejada:
      normalizarLinha(
        produto?.linhaPlanejada ??
        produto?.linhaPrincipal ??
        produto?.linha ??
        linhaOperacional
      ),

    zonaOperacional,

    zonaDescricao:
      zonaOperacional === "NEGRA"
        ? "Zona Negra"
        : zonaOperacional === "BRANCA"
          ? "Zona Branca"
          : zonaOperacional === "CINZA"
            ? "Zona Cinza"
            : "Outras zonas",

    ordem:
      obterOrdemFinal(
        produto,
        indiceProduto
      ),

    ordemTXT,

    ordemZona:
      0,

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

    producaoMin,

    setupMin,

    totalMin,

    srcLinha:
      transferencia.srcLinha,

    dstLinha:
      transferencia.dstLinha,

    rotaCruzada:
      transferencia.rotaCruzada,

    transferenciaValida:
      transferencia.valido,

    transferenciaRaw:
      transferencia.raw,

    leadTimeMin:
      numero(
        rota?.leadTimeMin ??
        produto?.leadTimeMin ??
        10
      ),

    origemRota:
      texto(
        rota?.zona ??
        rota?.zonaOperacional ??
        produto?.zonaOperacional ??
        zonaOperacional
      ),

    espelho:
      Boolean(opcoes.espelho),

    geradoAutomaticamente:
      Boolean(opcoes.geradoAutomaticamente),

    observacao:
      opcoes.observacao || ""
  };

}

function ordenarProdutosPlano(a, b) {

  const ordemTXTA =
    numero(a.ordemTXT);

  const ordemTXTB =
    numero(b.ordemTXT);

  if (ordemTXTA !== ordemTXTB) {
    return ordemTXTA - ordemTXTB;
  }

  const ordemA =
    numero(a.ordem);

  const ordemB =
    numero(b.ordem);

  if (ordemA !== ordemB) {
    return ordemA - ordemB;
  }

  return String(a.produto || "")
    .localeCompare(
      String(b.produto || ""),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base"
      }
    );

}

function verificarOrdensTXTDuplicadas(produtosPlano) {

  const mapa = new Map();

  produtosPlano.forEach(item => {

    const ordem =
      String(item.ordemTXT ?? "").trim();

    if (
      !ordem ||
      ordem === "-"
    ) {
      return;
    }

    const zona =
      String(item.zonaOperacional || "SEM_ZONA").trim();

    /**
     * Agora a duplicidade precisa considerar a zona.
     * A mesma Ordem TXT pode aparecer na Zona Branca e na Zona Cinza
     * porque a Cinza é espelho operacional da Branca.
     */
    const chave =
      `${zona}|${ordem}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }

    mapa.get(chave).push(item);

  });

  return Array.from(mapa.entries())
    .filter(([, itens]) => {

      /**
       * Ignora duplicidade causada apenas por espelho automático.
       */
      const itensReais =
        itens.filter(item => !item.espelho);

      const produtosUnicos =
        new Set(
          itensReais.map(item => {
            return `${item.codigo}|${item.produto}`;
          })
        );

      return produtosUnicos.size > 1;

    })
    .map(([chave, itens]) => {

      const [zona, ordem] =
        chave.split("|");

      return {
        zona,
        ordem,
        total: itens.length,
        produtos: itens.map(item => item.produto)
      };

    });

}

function criarLinhaVazia(nomeLinha) {

  return {
    linha:
      nomeLinha,

    zonas: {
      NEGRA: [],
      BRANCA: [],
      CINZA: [],
      OUTRAS: []
    },

    resumo: {
      totalProdutosUnicos: 0,
      totalRegistrosOperacionais: 0,
      kgTotalUnico: 0,
      kgOperacional: 0,
      producaoMin: 0,
      setupMin: 0,
      totalMin: 0,
      rotasCruzadas: 0
    },

    ordensDuplicadas: []
  };

}

function adicionarItemNaLinha(
  mapaLinhas,
  item,
  chavesAdicionadas
) {

  const chave =
    criarChaveItemZona(
      item
    );

  if (chavesAdicionadas.has(chave)) {
    return;
  }

  chavesAdicionadas.add(chave);

  const nomeLinha =
    normalizarLinha(
      item.linha
    );

  if (!mapaLinhas.has(nomeLinha)) {
    mapaLinhas.set(
      nomeLinha,
      criarLinhaVazia(nomeLinha)
    );
  }

  const linhaPlano =
    mapaLinhas.get(nomeLinha);

  const zona =
    linhaPlano.zonas[item.zonaOperacional]
      ? item.zonaOperacional
      : "OUTRAS";

  linhaPlano.zonas[zona].push({
    ...item,
    linha: nomeLinha,
    zonaOperacional: zona
  });

}

function montarLinhasPlanoPorZona(planejamento) {

  const linhas =
    Array.isArray(planejamento?.linhas)
      ? planejamento.linhas
      : [];

  const mapaLinhas =
    new Map();

  const produtosUnicosGeral =
    new Map();

  const chavesAdicionadas =
    new Set();

  linhas.forEach(linha => {

    const produtos =
      obterProdutosDaLinha(
        linha
      );

    produtos.forEach((produto, indiceProduto) => {

      const codigoProduto =
        obterCodigoProduto(
          produto
        );

      const nomeProduto =
        obterNomeProduto(
          produto
        );

      const chaveProdutoUnico =
        `${codigoProduto}|${nomeProduto}`;

      if (!produtosUnicosGeral.has(chaveProdutoUnico)) {

        produtosUnicosGeral.set(
          chaveProdutoUnico,
          {
            codigo:
              codigoProduto,

            produto:
              nomeProduto,

            kg:
              obterKgProduto(
                produto
              )
          }
        );

      }

      const rotas =
        obterRotasTecnicasProduto(
          produto
        );

      let possuiNegra = false;
      let possuiBranca = false;
      let possuiCinza = false;

      let rotaReferenciaTransferencia =
        null;

      rotas.forEach(rota => {

        const zona =
          normalizarZonaOperacional(
            rota?.zonaOperacional ??
            rota?.zona ??
            produto?.zonaOperacional
          );

        if (zona === "NEGRA") {
          possuiNegra = true;
        }

        if (zona === "BRANCA") {
          possuiBranca = true;
        }

        if (zona === "CINZA") {
          possuiCinza = true;
        }

        const transferencia =
          obterTransferencia(
            {
              ...produto,
              ...rota
            }
          );

        if (
          transferencia.valido ||
          transferencia.rotaCruzada ||
          !rotaReferenciaTransferencia
        ) {
          rotaReferenciaTransferencia = rota;
        }

        const item =
          criarItemPlanoZona(
            produto,
            rota,
            indiceProduto,
            zona
          );

        adicionarItemNaLinha(
          mapaLinhas,
          item,
          chavesAdicionadas
        );

      });

      /**
       * Regra operacional herdada do sequenciador real:
       * Se existir transferência N:Lx → B/C:Ly, a Branca e a Cinza
       * pertencem à linha destino, mesmo quando o TXT não tiver
       * uma rota explícita para elas.
       */
      const transferenciaProduto =
        obterTransferencia(
          {
            ...produto,
            ...(rotaReferenciaTransferencia || {})
          }
        );

      if (
        transferenciaProduto.dstLinha &&
        (
          transferenciaProduto.valido ||
          transferenciaProduto.rotaCruzada
        )
      ) {

        if (!possuiNegra) {

          const itemNegra =
            criarItemPlanoZona(
              produto,
              rotaReferenciaTransferencia || produto,
              indiceProduto,
              "NEGRA",
              {
                geradoAutomaticamente: true,
                observacao: "Gerado pela rota operacional"
              }
            );

          adicionarItemNaLinha(
            mapaLinhas,
            itemNegra,
            chavesAdicionadas
          );

        }

        if (!possuiBranca) {

          const itemBranca =
            criarItemPlanoZona(
              produto,
              rotaReferenciaTransferencia || produto,
              indiceProduto,
              "BRANCA",
              {
                geradoAutomaticamente: true,
                observacao: "Gerado pela rota operacional"
              }
            );

          adicionarItemNaLinha(
            mapaLinhas,
            itemBranca,
            chavesAdicionadas
          );

        }

        if (!possuiCinza) {

          const itemCinza =
            criarItemPlanoZona(
              produto,
              rotaReferenciaTransferencia || produto,
              indiceProduto,
              "CINZA",
              {
                espelho: true,
                geradoAutomaticamente: true,
                observacao: "Espelho automático da Zona Branca"
              }
            );

          adicionarItemNaLinha(
            mapaLinhas,
            itemCinza,
            chavesAdicionadas
          );

        }

      }

    });

  });

  const linhasPlano =
    Array.from(mapaLinhas.values())
      .map(linhaPlano => {

        const todosItens =
          Object.values(linhaPlano.zonas)
            .flat();

        Object.keys(linhaPlano.zonas)
          .forEach(zona => {

            linhaPlano.zonas[zona] =
              linhaPlano.zonas[zona]
                .sort(ordenarProdutosPlano)
                .map((item, indice) => ({
                  ...item,
                  ordemZona:
                    indice + 1
                }));

          });

        const produtosUnicosLinha =
          new Map();

        todosItens.forEach(item => {

          const chaveProduto =
            `${item.codigo}|${item.produto}`;

          if (!produtosUnicosLinha.has(chaveProduto)) {
            produtosUnicosLinha.set(
              chaveProduto,
              item
            );
          }

        });

        linhaPlano.resumo = {
          totalProdutosUnicos:
            produtosUnicosLinha.size,

          totalRegistrosOperacionais:
            todosItens.length,

          kgTotalUnico:
            Array.from(produtosUnicosLinha.values())
              .reduce((soma, item) => soma + item.kg, 0),

          kgOperacional:
            todosItens.reduce((soma, item) => soma + item.kg, 0),

          producaoMin:
            todosItens.reduce((soma, item) => soma + item.producaoMin, 0),

          setupMin:
            todosItens.reduce((soma, item) => soma + item.setupMin, 0),

          totalMin:
            todosItens.reduce((soma, item) => soma + item.totalMin, 0),

          rotasCruzadas:
            todosItens.filter(item => item.rotaCruzada).length
        };

        linhaPlano.ordensDuplicadas =
          verificarOrdensTXTDuplicadas(
            todosItens
          );

        return linhaPlano;

      })
      .sort((a, b) => {

        if (a.linha === "TOMATE") {
          return 1;
        }

        if (b.linha === "TOMATE") {
          return -1;
        }

        const numA =
          Number(
            String(a.linha)
              .replace(/\D/g, "")
          );

        const numB =
          Number(
            String(b.linha)
              .replace(/\D/g, "")
          );

        if (
          !Number.isNaN(numA) &&
          !Number.isNaN(numB)
        ) {
          return numA - numB;
        }

        return String(a.linha)
          .localeCompare(
            String(b.linha),
            "pt-BR",
            {
              numeric: true,
              sensitivity: "base"
            }
          );

      });

  const kgTotalUnicoGeral =
    Array.from(produtosUnicosGeral.values())
      .reduce((soma, item) => soma + item.kg, 0);

  const resumoGeral =
    linhasPlano.reduce((acc, linha) => {

      acc.totalLinhas += 1;
      acc.totalRegistrosOperacionais += linha.resumo.totalRegistrosOperacionais;
      acc.producaoMin += linha.resumo.producaoMin;
      acc.setupMin += linha.resumo.setupMin;
      acc.totalMin += linha.resumo.totalMin;
      acc.rotasCruzadas += linha.resumo.rotasCruzadas;

      if (linha.ordensDuplicadas.length > 0) {
        acc.linhasComOrdemDuplicada += 1;
        acc.totalOrdensDuplicadas += linha.ordensDuplicadas.length;
      }

      return acc;

    }, {
      totalLinhas: 0,
      totalProdutosUnicos: produtosUnicosGeral.size,
      totalRegistrosOperacionais: 0,
      kgTotalUnico: kgTotalUnicoGeral,
      producaoMin: 0,
      setupMin: 0,
      totalMin: 0,
      rotasCruzadas: 0,
      linhasComOrdemDuplicada: 0,
      totalOrdensDuplicadas: 0
    });

  return {
    linhasPlano,
    resumoGeral
  };

}

function obterEstadoLinhasAbertas(container) {

  const estado = {};

  container
    .querySelectorAll("[data-plano-final-linha]")
    .forEach(elemento => {

      const linha =
        elemento.getAttribute(
          "data-plano-final-linha"
        );

      if (!linha) {
        return;
      }

      estado[linha] =
        elemento.open;

    });

  return estado;

}

function renderAvisoDuplicidade(linhaPlano) {

  if (
    !linhaPlano.ordensDuplicadas ||
    linhaPlano.ordensDuplicadas.length === 0
  ) {
    return "";
  }

  return `
    <div class="plano-final-alerta">
      <strong>Atenção:</strong>
      esta linha possui ${linhaPlano.ordensDuplicadas.length}
      ordem(ns) TXT repetida(s).
      Isso geralmente indica produtos diferentes vinculados à mesma referência técnica.
    </div>
  `;

}

function renderRotaProduto(item) {

  if (
    !item.transferenciaRaw &&
    !item.rotaCruzada
  ) {
    return "-";
  }

  if (item.transferenciaRaw) {
    return item.transferenciaRaw;
  }

  return `${item.srcLinha} → ${item.dstLinha}`;

}

function renderSeloItem(item) {

  const selos = [];

  if (item.rotaCruzada) {
    selos.push(
      `<span class="plano-final-mini-badge">Rota cruzada</span>`
    );
  }

  if (item.espelho) {
    selos.push(
      `<span class="plano-final-mini-badge">Espelho</span>`
    );
  }

  if (item.geradoAutomaticamente) {
    selos.push(
      `<span class="plano-final-mini-badge">Auto</span>`
    );
  }

  return selos.join(" ");

}

function renderProdutoPlano(item) {

  return `
    <tr>

      <td class="plano-final-col-ordem">
        ${escaparHTML(item.ordemZona)}
      </td>

      <td class="plano-final-col-ordem">
        ${escaparHTML(item.ordem)}
      </td>

      <td class="plano-final-col-ordem-txt">
        ${escaparHTML(item.ordemTXT)}
      </td>

      <td>
        ${escaparHTML(item.codigo)}
      </td>

      <td class="plano-final-produto">
        ${escaparHTML(item.produto)}
        <div class="plano-final-produto-selos">
          ${renderSeloItem(item)}
        </div>
      </td>

      <td>
        <span class="plano-final-familia">
          ${escaparHTML(item.familia)}
        </span>
      </td>

      <td class="plano-final-numero">
        ${formatarNumero(item.kg, 2)}
      </td>

      <td>
        ${formatarTempo(item.producaoMin)}
      </td>

      <td>
        ${formatarTempo(item.setupMin)}
      </td>

      <td>
        <strong>${formatarTempo(item.totalMin)}</strong>
      </td>

      <td>
        ${escaparHTML(renderRotaProduto(item))}
      </td>

    </tr>
  `;

}

function renderZonaPlano(nomeZona, produtos) {

  if (
    !Array.isArray(produtos) ||
    produtos.length === 0
  ) {
    return "";
  }

  const resumoZona =
    produtos.reduce((acc, item) => {

      acc.total += 1;
      acc.kg += item.kg;
      acc.producaoMin += item.producaoMin;
      acc.setupMin += item.setupMin;
      acc.totalMin += item.totalMin;

      return acc;

    }, {
      total: 0,
      kg: 0,
      producaoMin: 0,
      setupMin: 0,
      totalMin: 0
    });

  const tituloZona =
    nomeZona === "NEGRA"
      ? "Zona Negra"
      : nomeZona === "BRANCA"
        ? "Zona Branca"
        : nomeZona === "CINZA"
          ? "Zona Cinza"
          : "Outras zonas";

  return `
    <section class="plano-final-zona-card plano-final-zona-${escaparHTML(nomeZona.toLowerCase())}">

      <div class="plano-final-zona-header">

        <h4>${escaparHTML(tituloZona)}</h4>

        <div class="plano-final-zona-kpis">

          <span>
            <small>Registros</small>
            <strong>${resumoZona.total}</strong>
          </span>

          <span>
            <small>Kg</small>
            <strong>${formatarNumero(resumoZona.kg, 2)}</strong>
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
            <small>Total</small>
            <strong>${formatarTempo(resumoZona.totalMin)}</strong>
          </span>

        </div>

      </div>

      <div class="plano-final-table-wrapper">

        <table class="plano-final-table">

          <thead>
            <tr>
              <th>Ordem Zona</th>
              <th>Ordem Final</th>
              <th>Ordem TXT</th>
              <th>Código</th>
              <th>Produto</th>
              <th>Família</th>
              <th>Kg/Demanda</th>
              <th>Produção</th>
              <th>Setup</th>
              <th>Total</th>
              <th>Rota</th>
            </tr>
          </thead>

          <tbody>
            ${produtos.map(renderProdutoPlano).join("")}
          </tbody>

        </table>

      </div>

    </section>
  `;

}

function renderLinhaPlano(linhaPlano, aberto) {

  return `
    <details
      class="plano-final-linha-card"
      data-plano-final-linha="${escaparHTML(linhaPlano.linha)}"
      ${aberto ? "open" : ""}
    >

      <summary class="plano-final-linha-header">

        <div>
          <h3>${escaparHTML(linhaPlano.linha)}</h3>

          <p>
            Plano final por zona operacional da fábrica.
          </p>
        </div>

        <div class="plano-final-linha-kpis">

          <span>
            <small>Produtos únicos</small>
            <strong>${linhaPlano.resumo.totalProdutosUnicos}</strong>
          </span>

          <span>
            <small>Registros</small>
            <strong>${linhaPlano.resumo.totalRegistrosOperacionais}</strong>
          </span>

          <span>
            <small>Kg único</small>
            <strong>${formatarNumero(linhaPlano.resumo.kgTotalUnico, 2)}</strong>
          </span>

          <span>
            <small>Rotas cruzadas</small>
            <strong>${linhaPlano.resumo.rotasCruzadas}</strong>
          </span>

          <span>
            <small>Total operacional</small>
            <strong>${formatarTempo(linhaPlano.resumo.totalMin)}</strong>
          </span>

        </div>

      </summary>

      ${renderAvisoDuplicidade(linhaPlano)}

      <div class="plano-final-zonas-lista">

        ${renderZonaPlano("NEGRA", linhaPlano.zonas.NEGRA)}
        ${renderZonaPlano("BRANCA", linhaPlano.zonas.BRANCA)}
        ${renderZonaPlano("CINZA", linhaPlano.zonas.CINZA)}
        ${renderZonaPlano("OUTRAS", linhaPlano.zonas.OUTRAS)}

      </div>

    </details>
  `;

}

function salvarPlanoFinalGlobal(linhasPlano, resumoGeral) {

  window.jfcPlanoFinalDia = {
    linhasPorZona: linhasPlano,
    linhas: linhasPlano,
    resumo: resumoGeral,
    atualizadoEm: new Date().toISOString()
  };

}

export function renderPlanoFinalDia(planejamento) {

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

    window.jfcPlanoFinalDia = null;

    return;

  }

  const estadoLinhasAbertas =
    obterEstadoLinhasAbertas(
      container
    );

  const {
    linhasPlano,
    resumoGeral
  } =
    montarLinhasPlanoPorZona(
      planejamento
    );

  salvarPlanoFinalGlobal(
    linhasPlano,
    resumoGeral
  );

  const temEstadoAnterior =
    Object.keys(estadoLinhasAbertas).length > 0;

  container.innerHTML = `
    <section class="plano-final-card">

      <div class="plano-final-header">

        <div>
          <h2>Plano Final do Dia por Zona</h2>

          <p>
            Visão operacional baseada no sequenciador real:
            Zona Negra por linha de origem, Zona Branca e Zona Cinza por linha de destino.
          </p>
        </div>

        <div class="plano-final-header-actions">

          <span class="plano-final-badge">
            ${resumoGeral.totalLinhas} linhas
          </span>

          <span class="plano-final-badge">
            ${resumoGeral.totalProdutosUnicos} produtos únicos
          </span>

          <span class="plano-final-badge">
            ${resumoGeral.totalRegistrosOperacionais} registros operacionais
          </span>

          ${
            resumoGeral.rotasCruzadas > 0
              ? `
                <span class="plano-final-badge">
                  ${resumoGeral.rotasCruzadas} rotas cruzadas
                </span>
              `
              : ""
          }

          ${
            resumoGeral.totalOrdensDuplicadas > 0
              ? `
                <span class="plano-final-badge plano-final-badge-alerta">
                  ${resumoGeral.totalOrdensDuplicadas} ordens TXT duplicadas
                </span>
              `
              : ""
          }

        </div>

      </div>

      <div class="plano-final-kpis">

        <span>
          <small>Produtos únicos</small>
          <strong>${resumoGeral.totalProdutosUnicos}</strong>
        </span>

        <span>
          <small>Kg único</small>
          <strong>${formatarNumero(resumoGeral.kgTotalUnico, 2)}</strong>
        </span>

        <span>
          <small>Registros operacionais</small>
          <strong>${resumoGeral.totalRegistrosOperacionais}</strong>
        </span>

        <span>
          <small>Produção operacional</small>
          <strong>${formatarTempo(resumoGeral.producaoMin)}</strong>
        </span>

        <span>
          <small>Setup operacional</small>
          <strong>${formatarTempo(resumoGeral.setupMin)}</strong>
        </span>

        <span>
          <small>Tempo operacional</small>
          <strong>${formatarTempo(resumoGeral.totalMin)}</strong>
        </span>

      </div>

      <div class="plano-final-observacao">
        <strong>Observação:</strong>
        produtos podem aparecer em mais de uma zona.
        Por isso o painel mostra <strong>produtos únicos</strong> e também
        <strong>registros operacionais</strong>.
      </div>

      <div class="plano-final-linhas-lista">
        ${
          linhasPlano
            .map((linhaPlano, indice) => {

              const aberto =
                temEstadoAnterior
                  ? estadoLinhasAbertas[linhaPlano.linha] === true
                  : indice === 0;

              return renderLinhaPlano(
                linhaPlano,
                aberto
              );

            })
            .join("")
        }
      </div>

    </section>
  `;

}
