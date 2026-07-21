/**
 * ======================================================
 * JFC FLOW
 * Modulo: xlsxMateriaPrimaImporter
 * Versao: 1.0.0
 *
 * Responsabilidade:
 * Ler a planilha XLSX de consumo de materia-prima por produto.
 *
 * Colunas esperadas, com tolerancia de acento/espaco/underscore:
 * materia prima, produto venda, codigo produto, linha,
 * peso_bruto, peso liquido.
 * ======================================================
 */

const SHEETJS_URL =
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

function texto(valor) {

  return String(valor ?? "").trim();

}

function normalizarHeader(valor) {

  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

}

function normalizarTextoComparacao(valor) {

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
    .replace(/\s+/g, "")
    .trim();

}

function normalizarLinha(valor) {

  const original =
    normalizarTextoComparacao(valor);

  if (!original) {
    return "SEM LINHA";
  }

  if (
    original === "TOMATE" ||
    original === "LT" ||
    original.includes("LINHA TOMATE")
  ) {
    return "TOMATE";
  }

  const numeroLinha =
    original.match(/\d+/)?.[0];

  if (numeroLinha) {
    return `L${Number(numeroLinha)}`;
  }

  return original
    .replace(/\s+/g, "")
    .trim();

}

function numero(valor) {

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  const textoNumero =
    texto(valor);

  let normalizado =
    textoNumero;

  if (textoNumero.includes(",")) {
    normalizado =
      textoNumero
        .replace(/\./g, "")
        .replace(",", ".");
  }

  const convertido =
    Number(
      normalizado
        .replace(/[^0-9.-]/g, "")
    );

  return Number.isFinite(convertido)
    ? convertido
    : 0;

}

function carregarScript(src) {

  return new Promise((resolve, reject) => {

    const existente =
      document.querySelector(`script[src="${src}"]`);

    if (existente) {

      if (existente.dataset.carregado === "true") {
        resolve();
        return;
      }

      existente.addEventListener("load", () => resolve(), { once: true });
      existente.addEventListener("error", () => reject(new Error(`Erro ao carregar ${src}`)), { once: true });
      return;

    }

    const script =
      document.createElement("script");

    script.src = src;
    script.async = true;

    script.addEventListener("load", () => {
      script.dataset.carregado = "true";
      resolve();
    }, { once: true });

    script.addEventListener("error", () => {
      reject(
        new Error(
          `Nao foi possivel carregar a biblioteca XLSX: ${src}`
        )
      );
    }, { once: true });

    document.head.appendChild(script);

  });

}

async function garantirBibliotecaXLSX() {

  if (!window.XLSX) {
    await carregarScript(SHEETJS_URL);
  }

  if (!window.XLSX) {
    throw new Error("Biblioteca XLSX nao carregada.");
  }

}

function localizarColuna(cabecalhosNormalizados, candidatos) {

  const candidatosNormalizados =
    candidatos.map(normalizarHeader);

  return cabecalhosNormalizados.findIndex(cabecalho =>
    candidatosNormalizados.includes(cabecalho)
  );

}

function validarColunaObrigatoria(nome, indice) {

  if (indice < 0) {
    throw new Error(
      `Coluna obrigatoria nao encontrada na planilha de materia-prima: ${nome}`
    );
  }

}

function montarRegistrosMateriaPrima(linhas = []) {

  const cabecalho =
    linhas[0] || [];

  const cabecalhosNormalizados =
    cabecalho.map(normalizarHeader);

  const colMateriaPrima =
    localizarColuna(
      cabecalhosNormalizados,
      [
        "materia prima",
        "matéria prima",
        "materia_prima",
        "matprima",
        "mp"
      ]
    );

  const colProdutoVenda =
    localizarColuna(
      cabecalhosNormalizados,
      [
        "produto venda",
        "produto_venda",
        "produto",
        "descricao produto",
        "descrição produto"
      ]
    );

  const colCodigoProduto =
    localizarColuna(
      cabecalhosNormalizados,
      [
        "codigo produto",
        "código produto",
        "codigo_produto",
        "cod produto",
        "cod_produto",
        "codigo",
        "código"
      ]
    );

  const colLinha =
    localizarColuna(
      cabecalhosNormalizados,
      [
        "linha",
        "linha producao",
        "linha produção",
        "linha_producao"
      ]
    );

  const colPesoBruto =
    localizarColuna(
      cabecalhosNormalizados,
      [
        "peso_bruto",
        "peso bruto",
        "pesobruto",
        "bruto"
      ]
    );

  const colPesoLiquido =
    localizarColuna(
      cabecalhosNormalizados,
      [
        "peso liquido",
        "peso líquido",
        "peso_liquido",
        "pesoliquido",
        "liquido",
        "líquido"
      ]
    );

  validarColunaObrigatoria("materia prima", colMateriaPrima);
  validarColunaObrigatoria("produto venda", colProdutoVenda);
  validarColunaObrigatoria("codigo produto", colCodigoProduto);
  validarColunaObrigatoria("linha", colLinha);
  validarColunaObrigatoria("peso_bruto", colPesoBruto);

  const registros =
    linhas
      .slice(1)
      .map((linha, indice) => {

        const materiaPrima =
          texto(linha[colMateriaPrima]);

        const produtoVenda =
          texto(linha[colProdutoVenda]);

        const codigoProduto =
          normalizarCodigoProduto(linha[colCodigoProduto]);

        const linhaOriginal =
          texto(linha[colLinha]);

        const pesoBruto =
          Math.abs(
            numero(linha[colPesoBruto])
          );

        const pesoLiquido =
          Math.abs(
            numero(
              colPesoLiquido >= 0
                ? linha[colPesoLiquido]
                : 0
            )
          );

        const linhaNormalizada =
          normalizarLinha(linhaOriginal);

        return {
          linhaPlanilha: indice + 2,
          materiaPrima,
          produtoVenda,
          codigoProduto,
          linhaOriginal,
          linha: linhaNormalizada,
          pesoBruto,
          pesoLiquido,
          chaveMateriaPrima:
            normalizarTextoComparacao(materiaPrima),
          chaveProduto:
            codigoProduto || normalizarTextoComparacao(produtoVenda)
        };

      })
      .filter(registro =>
        registro.materiaPrima &&
        registro.produtoVenda &&
        registro.linha &&
        (
          registro.pesoBruto > 0 ||
          registro.pesoLiquido > 0
        )
      );

  return registros;

}

function calcularEstatisticas(registros = []) {

  const linhas =
    new Set();

  const materiasPrimas =
    new Set();

  const produtos =
    new Set();

  let pesoBrutoTotal = 0;
  let pesoLiquidoTotal = 0;

  registros.forEach(registro => {

    linhas.add(registro.linha);
    materiasPrimas.add(registro.chaveMateriaPrima || registro.materiaPrima);
    produtos.add(registro.chaveProduto || registro.produtoVenda);

    pesoBrutoTotal +=
      Number(registro.pesoBruto) || 0;

    pesoLiquidoTotal +=
      Number(registro.pesoLiquido) || 0;

  });

  return {
    totalRegistros:
      registros.length,
    totalLinhas:
      linhas.size,
    totalMateriasPrimas:
      materiasPrimas.size,
    totalProdutos:
      produtos.size,
    pesoBrutoTotal,
    pesoLiquidoTotal,
    linhas:
      Array.from(linhas).sort()
  };

}

export async function importarXLSXMateriaPrima(arquivo) {

  if (!arquivo) {
    throw new Error("Arquivo de materia-prima nao informado.");
  }

  await garantirBibliotecaXLSX();

  const buffer =
    await arquivo.arrayBuffer();

  const workbook =
    window.XLSX.read(
      buffer,
      {
        type: "array"
      }
    );

  const nomeAba =
    workbook.SheetNames.includes("Data")
      ? "Data"
      : workbook.SheetNames[0];

  const sheet =
    workbook.Sheets[nomeAba];

  if (!sheet) {
    throw new Error("Nenhuma aba encontrada na planilha de materia-prima.");
  }

  const linhas =
    window.XLSX.utils.sheet_to_json(
      sheet,
      {
        header: 1,
        defval: "",
        raw: false
      }
    );

  if (!linhas || linhas.length < 2) {
    throw new Error("A planilha de materia-prima esta vazia ou sem dados.");
  }

  const registros =
    montarRegistrosMateriaPrima(
      linhas
    );

  if (registros.length === 0) {
    throw new Error(
      "Nenhum registro valido de materia-prima foi encontrado. Verifique peso_bruto, linha, codigo produto e materia prima."
    );
  }

  return {
    arquivoOrigem:
      arquivo.name || "planilha_materia_prima.xlsx",
    abaOrigem:
      nomeAba,
    importadoEm:
      new Date().toISOString(),
    registros,
    estatisticas:
      calcularEstatisticas(registros)
  };

}

export function configurarImportacaoMateriaPrima(callback) {

  const input =
    document.getElementById("materiaPrimaInput");

  if (!input) {
    console.warn(
      "Input materiaPrimaInput nao encontrado. O integrador cria esse input automaticamente."
    );
    return;
  }

  if (input.dataset.jfcMateriaPrimaConfigurado === "true") {
    return;
  }

  input.dataset.jfcMateriaPrimaConfigurado =
    "true";

  input.addEventListener("change", async event => {

    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    try {

      const baseMateriaPrima =
        await importarXLSXMateriaPrima(
          arquivo
        );

      callback?.(
        baseMateriaPrima
      );

    } catch (erro) {

      console.error(
        "Erro ao importar planilha de materia-prima:",
        erro
      );

      alert(
        erro?.message || "Nao foi possivel importar a planilha de materia-prima."
      );

    } finally {

      input.value = "";

    }

  });

}
