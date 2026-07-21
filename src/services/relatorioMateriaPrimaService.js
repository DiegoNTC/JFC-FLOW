/**
 * ======================================================
 * JFC FLOW
 * Modulo: relatorioMateriaPrimaService
 * Versao: 1.1.0
 *
 * Responsabilidade:
 * Consolidar materia-prima por linha, materia-prima e produto.
 *
 * Regra principal:
 * Se a mesma materia-prima aparecer mais de uma vez na mesma linha,
 * o peso bruto sera somado no total da materia-prima.
 * Ex.: CRESPA 150 + CRESPA 250 = CRESPA 400.
 *
 * Correcao 1.1.0:
 * Quando o relatorio e gerado junto com a Ordem de Producao de uma linha,
 * a selecao passa a ser feita pelos produtos planejados na linha, e nao
 * somente pela coluna "linha" da planilha XLSX de materia-prima.
 *
 * Isso evita incluir materia-prima de produtos com rota cruzada, por exemplo:
 * produto produzido na L6, mas com destino/embalagem na L3.
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

function normalizarTexto(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

function normalizarCodigoProduto(valor) {

  return texto(valor)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

}

export function normalizarLinhaMateriaPrima(valor) {

  const linha =
    normalizarTexto(valor);

  if (!linha) {
    return "SEM LINHA";
  }

  if (
    linha === "TOMATE" ||
    linha === "LT" ||
    linha.includes("LINHA TOMATE")
  ) {
    return "TOMATE";
  }

  const numeroLinha =
    linha.match(/\d+/)?.[0];

  if (numeroLinha) {
    return `L${Number(numeroLinha)}`;
  }

  return linha.replace(/\s+/g, "");

}

function normalizarMateriaPrima(valor) {

  const chave =
    normalizarTexto(valor);

  /**
   * Correcao segura para erro de digitacao simples.
   * Nao faz sinonimia ampla para evitar misturar materias-primas diferentes.
   */
  if (chave === "CREPA") {
    return "CRESPA";
  }

  return chave;

}

function escolherNomeMateriaPrima(atual, novo, chave) {

  if (!atual) {
    return novo || chave;
  }

  if (
    normalizarMateriaPrima(atual) === chave &&
    normalizarMateriaPrima(novo) === chave
  ) {
    return atual;
  }

  return atual;

}

function construirConjuntoNormalizado(valores, normalizador) {

  if (!Array.isArray(valores)) {
    return new Set();
  }

  return new Set(
    valores
      .map(normalizador)
      .filter(Boolean)
  );

}

function criarFiltroProdutosPlanejados(opcoes = {}) {

  const codigos =
    construirConjuntoNormalizado(
      opcoes.codigosProdutosPermitidos,
      normalizarCodigoProduto
    );

  const nomes =
    construirConjuntoNormalizado(
      opcoes.nomesProdutosPermitidos,
      normalizarTexto
    );

  return {
    codigos,
    nomes,
    ativo:
      codigos.size > 0 || nomes.size > 0
  };

}

function linhaFoiSelecionada(linha, opcoes = {}) {

  const selecionadas =
    Array.isArray(opcoes.linhasSelecionadas)
      ? opcoes.linhasSelecionadas
      : opcoes.linhaSelecionada
        ? [opcoes.linhaSelecionada]
        : [];

  if (selecionadas.length === 0) {
    return true;
  }

  const linhaAtual =
    normalizarLinhaMateriaPrima(linha);

  return selecionadas
    .map(normalizarLinhaMateriaPrima)
    .some(linhaSelecionada => linhaSelecionada === linhaAtual);

}

function registroPertenceAoFiltroPlanejado(registro, filtroProdutosPlanejados) {

  if (!filtroProdutosPlanejados?.ativo) {
    return false;
  }

  const codigo =
    normalizarCodigoProduto(registro.codigoProduto);

  if (
    codigo &&
    filtroProdutosPlanejados.codigos.has(codigo)
  ) {
    return true;
  }

  const nome =
    normalizarTexto(registro.produtoVenda);

  if (
    nome &&
    filtroProdutosPlanejados.nomes.has(nome)
  ) {
    return true;
  }

  return false;

}

function registroFoiSelecionado(registro, opcoes = {}, filtroProdutosPlanejados) {

  /**
   * Quando o PDF esta sendo gerado para uma linha especifica e recebemos
   * os produtos que estao de fato planejados naquela linha, essa passa a
   * ser a fonte mais confiavel.
   *
   * A coluna "linha" da planilha de materia-prima pode representar destino,
   * embalagem ou espelho de rota cruzada. Por isso ela nao deve ser usada
   * sozinha para decidir o que entra no relatorio da Ordem de Producao.
   */
  if (filtroProdutosPlanejados?.ativo) {
    return registroPertenceAoFiltroPlanejado(
      registro,
      filtroProdutosPlanejados
    );
  }

  return linhaFoiSelecionada(
    registro.linha,
    opcoes
  );

}

function obterLinhaRelatorio(registro, opcoes = {}, filtroProdutosPlanejados) {

  if (
    filtroProdutosPlanejados?.ativo &&
    opcoes.linhaSelecionada
  ) {
    return normalizarLinhaMateriaPrima(
      opcoes.linhaSelecionada
    );
  }

  return normalizarLinhaMateriaPrima(
    registro.linha
  );

}

function ordenarLinhas(a, b) {

  const normalizarOrdem = valor => {

    const linha =
      normalizarLinhaMateriaPrima(valor);

    if (linha === "TOMATE") {
      return 999;
    }

    const numeroLinha =
      Number(linha.replace(/\D/g, ""));

    return Number.isFinite(numeroLinha)
      ? numeroLinha
      : 998;

  };

  return normalizarOrdem(a) - normalizarOrdem(b);

}

function criarLinhaRelatorio(nomeLinha) {

  return {
    linha: nomeLinha,
    materiaisMap: new Map(),
    detalhesMap: new Map(),
    totalPesoBruto: 0,
    totalPesoLiquido: 0
  };

}

function consolidarRegistroNaLinha(linhaRelatorio, registro) {

  const materiaPrima =
    texto(registro.materiaPrima) || "SEM MATERIA-PRIMA";

  const chaveMateria =
    normalizarMateriaPrima(materiaPrima) || "SEM MATERIA PRIMA";

  const codigoProduto =
    texto(registro.codigoProduto) || "SEM CODIGO";

  const produtoVenda =
    texto(registro.produtoVenda) || "SEM PRODUTO";

  const pesoBruto =
    Math.abs(numero(registro.pesoBruto));

  const pesoLiquido =
    Math.abs(numero(registro.pesoLiquido));

  if (!linhaRelatorio.materiaisMap.has(chaveMateria)) {

    linhaRelatorio.materiaisMap.set(
      chaveMateria,
      {
        chaveMateria,
        materiaPrima:
          chaveMateria === "CRESPA"
            ? "CRESPA"
            : materiaPrima,
        pesoBruto: 0,
        pesoLiquido: 0,
        produtosMap: new Map()
      }
    );

  }

  const material =
    linhaRelatorio.materiaisMap.get(
      chaveMateria
    );

  material.materiaPrima =
    escolherNomeMateriaPrima(
      material.materiaPrima,
      materiaPrima,
      chaveMateria
    );

  material.pesoBruto +=
    pesoBruto;

  material.pesoLiquido +=
    pesoLiquido;

  const chaveProduto =
    `${codigoProduto}__${produtoVenda}`;

  if (!material.produtosMap.has(chaveProduto)) {

    material.produtosMap.set(
      chaveProduto,
      {
        codigoProduto,
        produtoVenda,
        pesoBruto: 0,
        pesoLiquido: 0
      }
    );

  }

  const produtoMaterial =
    material.produtosMap.get(chaveProduto);

  produtoMaterial.pesoBruto +=
    pesoBruto;

  produtoMaterial.pesoLiquido +=
    pesoLiquido;

  const chaveDetalhe =
    `${codigoProduto}__${produtoVenda}__${chaveMateria}`;

  if (!linhaRelatorio.detalhesMap.has(chaveDetalhe)) {

    linhaRelatorio.detalhesMap.set(
      chaveDetalhe,
      {
        codigoProduto,
        produtoVenda,
        materiaPrima:
          material.materiaPrima,
        chaveMateria,
        pesoBruto: 0,
        pesoLiquido: 0
      }
    );

  }

  const detalhe =
    linhaRelatorio.detalhesMap.get(
      chaveDetalhe
    );

  detalhe.materiaPrima =
    material.materiaPrima;

  detalhe.pesoBruto +=
    pesoBruto;

  detalhe.pesoLiquido +=
    pesoLiquido;

  linhaRelatorio.totalPesoBruto +=
    pesoBruto;

  linhaRelatorio.totalPesoLiquido +=
    pesoLiquido;

}

function finalizarLinhaRelatorio(linhaRelatorio) {

  const materiais =
    Array.from(linhaRelatorio.materiaisMap.values())
      .map(material => ({
        chaveMateria:
          material.chaveMateria,
        materiaPrima:
          material.materiaPrima,
        pesoBruto:
          material.pesoBruto,
        pesoLiquido:
          material.pesoLiquido,
        totalProdutos:
          material.produtosMap.size,
        produtos:
          Array.from(material.produtosMap.values())
            .sort((a, b) =>
              texto(a.produtoVenda).localeCompare(
                texto(b.produtoVenda),
                "pt-BR"
              )
            )
      }))
      .sort((a, b) =>
        texto(a.materiaPrima).localeCompare(
          texto(b.materiaPrima),
          "pt-BR"
        )
      );

  const detalhesProduto =
    Array.from(linhaRelatorio.detalhesMap.values())
      .sort((a, b) => {

        const comparacaoProduto =
          texto(a.produtoVenda).localeCompare(
            texto(b.produtoVenda),
            "pt-BR"
          );

        if (comparacaoProduto !== 0) {
          return comparacaoProduto;
        }

        return texto(a.materiaPrima).localeCompare(
          texto(b.materiaPrima),
          "pt-BR"
        );

      });

  return {
    linha:
      linhaRelatorio.linha,
    materiais,
    detalhesProduto,
    totalPesoBruto:
      linhaRelatorio.totalPesoBruto,
    totalPesoLiquido:
      linhaRelatorio.totalPesoLiquido,
    totalMateriasPrimas:
      materiais.length,
    totalDetalhes:
      detalhesProduto.length
  };

}

export function consolidarMateriaPrimaPorLinha(baseMateriaPrima, opcoes = {}) {

  const registros =
    Array.isArray(baseMateriaPrima?.registros)
      ? baseMateriaPrima.registros
      : [];

  const mapaLinhas =
    new Map();

  const filtroProdutosPlanejados =
    criarFiltroProdutosPlanejados(opcoes);

  registros
    .filter(registro =>
      registroFoiSelecionado(
        registro,
        opcoes,
        filtroProdutosPlanejados
      )
    )
    .forEach(registro => {

      const linha =
        obterLinhaRelatorio(
          registro,
          opcoes,
          filtroProdutosPlanejados
        );

      if (!mapaLinhas.has(linha)) {

        mapaLinhas.set(
          linha,
          criarLinhaRelatorio(linha)
        );

      }

      consolidarRegistroNaLinha(
        mapaLinhas.get(linha),
        registro
      );

    });

  const linhas =
    Array.from(mapaLinhas.values())
      .map(finalizarLinhaRelatorio)
      .sort((a, b) =>
        ordenarLinhas(a.linha, b.linha)
      );

  const totalPesoBruto =
    linhas.reduce((soma, linha) => soma + linha.totalPesoBruto, 0);

  const totalPesoLiquido =
    linhas.reduce((soma, linha) => soma + linha.totalPesoLiquido, 0);

  const totalMateriasPrimas =
    linhas.reduce((soma, linha) => soma + linha.totalMateriasPrimas, 0);

  const totalDetalhes =
    linhas.reduce((soma, linha) => soma + linha.totalDetalhes, 0);

  return {
    arquivoOrigem:
      baseMateriaPrima?.arquivoOrigem || "planilha_materia_prima.xlsx",
    importadoEm:
      baseMateriaPrima?.importadoEm || null,
    linhas,
    filtroProdutosPlanejados: {
      ativo:
        filtroProdutosPlanejados.ativo,
      codigos:
        filtroProdutosPlanejados.codigos.size,
      nomes:
        filtroProdutosPlanejados.nomes.size
    },
    resumo: {
      totalLinhas:
        linhas.length,
      totalMateriasPrimas,
      totalDetalhes,
      totalPesoBruto,
      totalPesoLiquido
    }
  };

}
