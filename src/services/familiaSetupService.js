/**
 * ======================================================
 * JFC FLOW
 * Módulo: familiaSetupService
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Inferir e aplicar família/classe de setup automaticamente
 * nos produtos do Cadastro Mestre.
 * ======================================================
 */

import {
  carregarProdutosMestre,
  adicionarOuAtualizarProdutoMestre
} from "../repositories/cadastroMestreRepository.js";

const TERMOS_COMPOSTOS = [
  "ALFACE AMERICANA",
  "ALFACE CRESPA",
  "ALFACE LISA",
  "ALFACE ROXA",
  "COUVE FLOR",
  "BATATA BAROA",
  "BATATA DOCE",
  "TOMATE GRAPE",
  "TOMATE CEREJA",
  "PIMENTAO VERMELHO",
  "PIMENTAO AMARELO",
  "PIMENTAO VERDE",
  "PIMENTAO TRICOLOR",
  "VAGEM FRANCESA",
  "VAGEM MACARRAO",
  "VAGEM MANTEIGA",
  "ABOBORA MADURA",
  "ABOBORA JAPONESA",
  "CEBOLA ROXA",
  "CEBOLA BRANCA"
];

const PALAVRAS_IGNORADAS = [
  "PICADA",
  "PICADO",
  "CUBOS",
  "CUBO",
  "RALADA",
  "RALADO",
  "FATIADA",
  "FATIADO",
  "TIRAS",
  "RODELA",
  "RODELAS",
  "FLORETE",
  "FLORETES",
  "DESCASCADA",
  "DESCASCADO",
  "HIGIENIZADA",
  "HIGIENIZADO",
  "PROCESSADA",
  "PROCESSADO",
  "INTEIRA",
  "INTEIRO",
  "SELECIONADA",
  "SELECIONADO",
  "LAVADA",
  "LAVADO",
  "KG",
  "G",
  "GR",
  "UN",
  "UND",
  "CX",
  "C",
  "BAND",
  "BANDEJA",
  "PCT",
  "PACOTE",
  "SACO",
  "SACOLA",
  "JFC"
];

function texto(valor) {

  return String(valor ?? "")
    .trim();

}

function normalizarTexto(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:()[\]{}]/g, " ")
    .replace(/[\/\\_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

function removerPesosMedidas(textoNormalizado) {

  return textoNormalizado
    .replace(/\b\d+[,.]?\d*\s?X\s?\d+[,.]?\d*\s?(KG|G|GR|UN|UND)?\b/g, " ")
    .replace(/\b\d+[,.]?\d*\s?(KG|G|GR|UN|UND)\b/g, " ")
    .replace(/\b\d+[,.]?\d*\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

function obterNomeBaseProduto(produtoOuNome) {

  if (typeof produtoOuNome === "string") {
    return produtoOuNome;
  }

  return (
    produtoOuNome?.nomeOficial ||
    produtoOuNome?.descricaoCSV ||
    produtoOuNome?.descricao ||
    produtoOuNome?.descricaoTXT ||
    produtoOuNome?.produto ||
    ""
  );

}

const MAPA_TERMOS_FAMILIA = {
  ALF: "ALFACE",
  ALFACE: "ALFACE",
  AMERIC: "AMERICANA",
  AMERICANA: "AMERICANA",
  CRESPA: "CRESPA",
  ROXA: "ROXA",
  LISA: "LISA",
  ROMANA: "ROMANA",
  MIMOSA: "MIMOSA",
  BAT: "BATATA",
  BATATA: "BATATA",
  CEB: "CEBOLA",
  CEBOLA: "CEBOLA",
  CEN: "CENOURA",
  CENOURA: "CENOURA",
  BROC: "BROCOLIS",
  BROCOLIS: "BROCOLIS",
  BRÓCOLIS: "BROCOLIS",
  AGRIAO: "AGRIAO",
  AGRIÃO: "AGRIAO",
  RUCULA: "RUCULA",
  RÚCULA: "RUCULA",
  TOM: "TOMATE",
  TOMATE: "TOMATE",
  PIMENTAO: "PIMENTAO",
  PIMENTÃO: "PIMENTAO"
};

const PALAVRAS_IGNORADAS_FAMILIA = new Set([
  "SALADA",
  "MIX",
  "UN",
  "UND",
  "UNID",
  "UNIDADE",
  "CX",
  "CAIXA",
  "PCT",
  "PC",
  "POTE",
  "BANDEJA",
  "BDJ",
  "KG",
  "G",
  "GR",
  "ML",
  "LT",
  "L",
  "NS",
  "N",
  "PREZUNIC",
  "PREZUNIC",
  "PREZ",
  "CLIENTE",
  "IN",
  "NATURA",
  "SEM",
  "COM",
  "CASCA",
  "DESCASCADA",
  "DESCASCADO",
  "LAVADA",
  "LAVADO",
  "HIGIENIZADA",
  "HIGIENIZADO",
  "PICADAO",
  "PICADÃO",
  "FAT",
  "FATIADA",
  "FATIADO",
  "4PCT",
  "5PCTS",
  "12X",
  "10X",
  "20X"
]);

const QUALIFICADORES_RELEVANTES_FAMILIA = new Set([
  "ROXA",
  "ROXO",
  "VERDE",
  "VERMELHA",
  "VERMELHO",
  "AMARELA",
  "AMARELO",
  "TRICOLOR",
  "CRESPA",
  "LISA",
  "AMERICANA",
  "ROMANA",
  "MIMOSA",
  "FRISEE",
  "BABY",
  "MINI",
  "GRAPE",
  "CEREJA",
  "ITALIANO",
  "JAPONES",
  "JAPONESA",
  "MACARRAO",
  "MACARRÃO",
  "FRANCESA",
  "MANTEIGA",
  "PALITO",
  "CUBO",
  "RALADA",
  "RALADO",
  "PICADA",
  "PICADO",
  "RODELA",
  "FLORETE"
]);

function normalizarTextoFamilia(
  valor
) {

  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\d+[,.]?\d*\s*(KG|G|GR|ML|L|UN|UND|PCT|PCTS|CX)/g, " ")
    .replace(/\d+\s*X\s*\d*/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

function traduzirTokenFamilia(
  token
) {

  return MAPA_TERMOS_FAMILIA[token] || token;

}

function tokenEhIgnoradoFamilia(
  token
) {

  if (!token) {
    return true;
  }

  if (/^\d+$/.test(token)) {
    return true;
  }

  if (PALAVRAS_IGNORADAS_FAMILIA.has(token)) {
    return true;
  }

  return false;

}

function obterTextoProdutoParaFamilia(
  produtoOuNome
) {

  if (
    produtoOuNome &&
    typeof produtoOuNome === "object"
  ) {

    return (
      produtoOuNome.nomeOficial ??
      produtoOuNome.descricaoCSV ??
      produtoOuNome.nome ??
      produtoOuNome.produto ??
      produtoOuNome.descricaoTXT ??
      ""
    );

  }

  return produtoOuNome;

}

export function inferirFamiliaSetup(
  produtoOuNome
) {

  const texto =
    normalizarTextoFamilia(
      obterTextoProdutoParaFamilia(
        produtoOuNome
      )
    );

  const tokens =
    texto
      .split(" ")
      .map(traduzirTokenFamilia)
      .filter(token => {

        return !tokenEhIgnoradoFamilia(
          token
        );

      });

  const tokensUnicos = [];

  tokens.forEach(token => {

    if (!tokensUnicos.includes(token)) {
      tokensUnicos.push(token);
    }

  });

  if (tokensUnicos.length === 0) {
    return "SEM FAMILIA";
  }

  const familia = [];

  familia.push(
    tokensUnicos[0]
  );

  if (tokensUnicos[1]) {
    familia.push(
      tokensUnicos[1]
    );
  }

  if (
    tokensUnicos[2] &&
    QUALIFICADORES_RELEVANTES_FAMILIA.has(tokensUnicos[2])
  ) {

    familia.push(
      tokensUnicos[2]
    );

  }

  return familia.join(" ");

}

function familiaAtualProduto(produto) {

  return normalizarTexto(
    produto?.familiaSetup ||
    produto?.classeSetup ||
    ""
  );

}

function rotaTemFamilia(rota) {

  return Boolean(
    texto(rota?.familiaSetup) ||
    texto(rota?.classeSetup)
  );

}

function atualizarRotasComFamilia(
  rotasTecnicas,
  familia,
  sobrescrever
) {

  if (!Array.isArray(rotasTecnicas)) {
    return [];
  }

  return rotasTecnicas.map(rota => {

    if (
      !sobrescrever &&
      rotaTemFamilia(rota)
    ) {
      return rota;
    }

    return {
      ...rota,
      familiaSetup: familia,
      classeSetup: familia
    };

  });

}

export function atualizarFamiliasCadastroMestre(
  opcoes = {}
) {

  const sobrescrever =
    opcoes.sobrescrever === true;

  const produtos =
    carregarProdutosMestre();

  let alterados =
    0;

  let mantidos =
    0;

  const detalhes =
    [];

  produtos.forEach(produto => {

    const familiaExistente =
      familiaAtualProduto(produto);

    const familiaInferida =
      inferirFamiliaSetup(produto);

    const deveAplicarNoProduto =
      sobrescrever ||
      !familiaExistente;

    const familiaFinal =
      deveAplicarNoProduto
        ? familiaInferida
        : familiaExistente;

    const rotasAtualizadas =
      atualizarRotasComFamilia(
        produto.rotasTecnicas,
        familiaFinal,
        sobrescrever
      );

    const rotasTinhamMudanca =
      JSON.stringify(rotasAtualizadas) !==
      JSON.stringify(produto.rotasTecnicas || []);

    if (
      deveAplicarNoProduto ||
      rotasTinhamMudanca
    ) {

      const produtoAtualizado = {

        ...produto,

        familiaSetup:
          familiaFinal,

        classeSetup:
          familiaFinal,

        rotasTecnicas:
          rotasAtualizadas,

        origem: {
          ...(produto.origem || {}),
          familiaSetupAuto: true
        },

        familiaSetupOrigem:
          deveAplicarNoProduto
            ? "AUTO"
            : produto.familiaSetupOrigem || "MANUAL",

        atualizadoEm:
          new Date().toISOString()

      };

      adicionarOuAtualizarProdutoMestre(
        produtoAtualizado
      );

      alterados++;

      detalhes.push({
        codigo: produto.codigo,
        nome: produto.nomeOficial,
        familiaAnterior: familiaExistente || "",
        familiaNova: familiaFinal
      });

    } else {

      mantidos++;

    }

  });

  return {
    total: produtos.length,
    alterados,
    mantidos,
    detalhes
  };

}