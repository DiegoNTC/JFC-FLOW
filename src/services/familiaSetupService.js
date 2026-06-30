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

export function inferirFamiliaSetup(
  produtoOuNome
) {

  const nomeOriginal =
    obterNomeBaseProduto(
      produtoOuNome
    );

  let nome =
    normalizarTexto(
      nomeOriginal
    );

  nome =
    removerPesosMedidas(
      nome
    );

  if (!nome) {
    return "SEM_FAMILIA";
  }

  const termosOrdenados =
    TERMOS_COMPOSTOS
      .slice()
      .sort((a, b) => b.length - a.length);

  for (const termo of termosOrdenados) {

    if (nome.includes(termo)) {
      return termo;
    }

  }

  const palavras =
    nome
      .split(/\s+/)
      .filter(palavra => {

        if (!palavra) {
          return false;
        }

        if (PALAVRAS_IGNORADAS.includes(palavra)) {
          return false;
        }

        if (/^\d/.test(palavra)) {
          return false;
        }

        return true;

      });

  return palavras[0] || "SEM_FAMILIA";

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