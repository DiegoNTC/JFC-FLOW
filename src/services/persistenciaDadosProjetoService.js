/**
 * ======================================================
 * JFC FLOW
 * Módulo: persistenciaDadosProjetoService
 *
 * Responsabilidade:
 * Carregar dados oficiais versionados em JSON dentro do
 * projeto/GitHub Pages e permitir exportar alterações locais.
 *
 * Fonte oficial esperada:
 * - data/cadastro_mestre.json
 * - data/familias_setup.json
 * - data/sequenciamento_manual_familias.json
 * - data/base_tecnica.json
 * - data/versao_dados.json
 * ======================================================
 */

import {
  carregarProdutosMestre,
  salvarProdutosMestre
} from "../repositories/cadastroMestreRepository.js";

import {
  carregarFamiliasSetup,
  salvarFamiliasSetup
} from "../repositories/familiaSetupRepository.js";

import {
  getBaseTXT,
  setBaseTXT
} from "../core/importState.js";

const STORAGE_PENDENTES =
  "jfc_flow_dados_json_alteracoes_pendentes";

const STORAGE_META =
  "jfc_flow_dados_json_meta";

const STORAGE_SEQUENCIA_MANUAL =
  "jfc_flow_sequencia_manual_familias_por_linha_v1";

const CAMINHO_VERSAO_PADRAO =
  "data/versao_dados.json";

const CAMINHO_CADASTRO_PADRAO =
  "data/cadastro_mestre.json";

const CAMINHO_FAMILIAS_PADRAO =
  "data/familias_setup.json";

const CAMINHO_SEQUENCIA_PADRAO =
  "data/sequenciamento_manual_familias.json";

const CAMINHO_BASE_TECNICA_PADRAO =
  "data/base_tecnica.json";

function storageDisponivel() {

  return typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined";

}

function lerStorageJSON(chave, padrao) {

  if (!storageDisponivel()) {
    return padrao;
  }

  try {

    const bruto =
      window.localStorage.getItem(chave);

    if (!bruto) {
      return padrao;
    }

    return JSON.parse(bruto);

  } catch (erro) {

    console.warn(
      `Não foi possível ler ${chave}:`,
      erro
    );

    return padrao;

  }

}

function salvarStorageJSON(chave, valor) {

  if (!storageDisponivel()) {
    return;
  }

  window.localStorage.setItem(
    chave,
    JSON.stringify(valor)
  );

}

function criarCacheBuster(versao) {

  return encodeURIComponent(
    versao || new Date().toISOString()
  );

}

async function buscarJSON(caminho, versao) {

  const url =
    `${caminho}?v=${criarCacheBuster(versao)}`;

  const resposta =
    await fetch(
      url,
      {
        cache: "no-store"
      }
    );

  if (!resposta.ok) {
    throw new Error(
      `Não foi possível carregar ${caminho}`
    );
  }

  return resposta.json();

}

async function carregarVersaoDados() {

  try {

    const versao =
      await buscarJSON(
        CAMINHO_VERSAO_PADRAO,
        Date.now()
      );

    return versao && typeof versao === "object"
      ? versao
      : {};

  } catch (erro) {

    console.warn(
      "Arquivo data/versao_dados.json não encontrado. Usando caminhos padrão.",
      erro
    );

    return {
      versao:
        "local-sem-versao",

      cadastroMestre:
        CAMINHO_CADASTRO_PADRAO,

      familiasSetup:
        CAMINHO_FAMILIAS_PADRAO,

      sequenciamentoManualFamilias:
        CAMINHO_SEQUENCIA_PADRAO,

      baseTecnica:
        CAMINHO_BASE_TECNICA_PADRAO,

      permitirSubstituirPorVazio:
        false
    };

  }

}

function extrairLista(payload, chaves = []) {

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  for (const chave of chaves) {

    if (Array.isArray(payload[chave])) {
      return payload[chave];
    }

  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];

}

function extrairObjeto(payload, chaves = []) {

  if (!payload || typeof payload !== "object") {
    return {};
  }

  for (const chave of chaves) {

    if (
      payload[chave] &&
      typeof payload[chave] === "object" &&
      !Array.isArray(payload[chave])
    ) {
      return payload[chave];
    }

  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  return payload;

}

function possuiAlteracoesPendentes() {

  const pendentes =
    lerStorageJSON(
      STORAGE_PENDENTES,
      {}
    );

  return Object.values(pendentes)
    .some(Boolean);

}

export function carregarAlteracoesPendentes() {

  return lerStorageJSON(
    STORAGE_PENDENTES,
    {}
  );

}

export function marcarAlteracaoLocal(tipo = "dados") {

  const pendentes =
    carregarAlteracoesPendentes();

  pendentes[tipo] = {
    alterado: true,
    atualizadoEm: new Date().toISOString()
  };

  salvarStorageJSON(
    STORAGE_PENDENTES,
    pendentes
  );

  atualizarStatusDadosProjeto();

}

export function limparMarcacaoAlteracoesLocais() {

  if (!storageDisponivel()) {
    return;
  }

  window.localStorage.removeItem(
    STORAGE_PENDENTES
  );

  atualizarStatusDadosProjeto();

}

function aplicarCadastroMestreJSON(lista, permitirVazio = false) {

  const cadastroAtual =
    carregarProdutosMestre();

  if (
    lista.length === 0 &&
    cadastroAtual.length > 0 &&
    !permitirVazio
  ) {
    return {
      aplicado: false,
      motivo: "JSON vazio ignorado para não apagar cadastro local.",
      total: cadastroAtual.length
    };
  }

  salvarProdutosMestre(
    lista
  );

  return {
    aplicado: true,
    total: lista.length
  };

}

function aplicarFamiliasSetupJSON(lista, permitirVazio = false) {

  const familiasAtuais =
    carregarFamiliasSetup();

  if (
    lista.length === 0 &&
    familiasAtuais.length > 0 &&
    !permitirVazio
  ) {
    return {
      aplicado: false,
      motivo: "JSON vazio ignorado para não apagar famílias locais.",
      total: familiasAtuais.length
    };
  }

  salvarFamiliasSetup(
    lista
  );

  return {
    aplicado: true,
    total: lista.length
  };

}

function carregarSequenciaManualAtual() {

  return lerStorageJSON(
    STORAGE_SEQUENCIA_MANUAL,
    {}
  );

}

function aplicarSequenciaManualJSON(objeto, permitirVazio = false) {

  const sequenciaAtual =
    carregarSequenciaManualAtual();

  const possuiDados =
    objeto &&
    typeof objeto === "object" &&
    Object.keys(objeto).length > 0;

  if (
    !possuiDados &&
    Object.keys(sequenciaAtual).length > 0 &&
    !permitirVazio
  ) {
    return {
      aplicado: false,
      motivo: "JSON vazio ignorado para não apagar sequência manual local.",
      total: Object.keys(sequenciaAtual).length
    };
  }

  salvarStorageJSON(
    STORAGE_SEQUENCIA_MANUAL,
    objeto || {}
  );

  return {
    aplicado: true,
    total: Object.keys(objeto || {}).length
  };

}

function montarBaseTecnicaComLista(base, lista) {

  if (!Array.isArray(lista)) {
    return null;
  }

  return {
    ...(base && typeof base === "object" && !Array.isArray(base)
      ? base
      : {}),
    produtosTecnicos: lista,
    estatisticas: {
      ...(base?.estatisticas || {}),
      totalProdutosTecnicos:
        base?.estatisticas?.totalProdutosTecnicos || lista.length
    }
  };

}

function extrairBaseTecnica(payload) {

  /**
   * Aceita vários formatos de JSON para evitar que a base
   * técnica exista no arquivo, mas não seja reconhecida pelo
   * sistema.
   *
   * Formatos aceitos:
   * - { baseTecnica: { produtosTecnicos: [...] } }
   * - { produtosTecnicos: [...] }
   * - { data: { produtosTecnicos: [...] } }
   * - { produtos: [...] }
   * - { itens: [...] }
   * - [ ...produtosTecnicos ]
   */

  if (Array.isArray(payload)) {
    return montarBaseTecnicaComLista(
      {},
      payload
    );
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const base =
    payload.baseTecnica ||
    payload.data ||
    payload;

  if (!base || typeof base !== "object") {
    return null;
  }

  const listaProdutos =
    base.produtosTecnicos ||
    base.produtos ||
    base.itens ||
    base.rotasTecnicas ||
    base.baseTecnica;

  const baseNormalizada =
    montarBaseTecnicaComLista(
      base,
      listaProdutos
    );

  if (baseNormalizada) {
    return baseNormalizada;
  }

  if (
    base.estatisticas &&
    Array.isArray(base.produtosTecnicos)
  ) {
    return base;
  }

  return null;

}

function aplicarBaseTecnicaJSON(baseTecnica, permitirVazio = false) {

  const baseAtual =
    getBaseTXT();

  const totalProdutos =
    Array.isArray(baseTecnica?.produtosTecnicos)
      ? baseTecnica.produtosTecnicos.length
      : 0;

  const totalAtual =
    Array.isArray(baseAtual?.produtosTecnicos)
      ? baseAtual.produtosTecnicos.length
      : 0;

  if (
    totalProdutos === 0 &&
    totalAtual > 0 &&
    !permitirVazio
  ) {
    return {
      aplicado: false,
      motivo: "JSON vazio ignorado para não apagar base técnica local.",
      total: totalAtual
    };
  }

  setBaseTXT(
    baseTecnica || {
      produtosTecnicos: [],
      estatisticas: {}
    }
  );

  return {
    aplicado: true,
    total: totalProdutos
  };

}

export async function inicializarDadosProjetoJSON(opcoes = {}) {

  const forcarGithub =
    opcoes.forcarGithub === true;

  const pendentesLocais =
    possuiAlteracoesPendentes();

  const pendentesDetalhe =
    carregarAlteracoesPendentes();

  const versaoDados =
    await carregarVersaoDados();

  const versao =
    versaoDados.versao || Date.now();

  /**
   * Antes, se existisse qualquer alteração local pendente,
   * o carregamento de todos os JSONs era interrompido. Isso
   * fazia a Base Técnica nativa não entrar no sistema quando
   * havia pendência no Cadastro Mestre ou nas Famílias.
   *
   * Agora preservamos apenas o tipo alterado localmente e
   * continuamos carregando os demais JSONs oficiais.
   */

  const permitirVazio =
    versaoDados.permitirSubstituirPorVazio === true;

  const caminhos = {
    cadastroMestre:
      versaoDados.cadastroMestre || CAMINHO_CADASTRO_PADRAO,

    familiasSetup:
      versaoDados.familiasSetup || CAMINHO_FAMILIAS_PADRAO,

    sequenciamentoManualFamilias:
      versaoDados.sequenciamentoManualFamilias || CAMINHO_SEQUENCIA_PADRAO,

    baseTecnica:
      versaoDados.baseTecnica || CAMINHO_BASE_TECNICA_PADRAO
  };

  const resultado = {
    aplicado: true,
    versao,
    caminhos,
    pendentesLocais,
    cadastroMestre: null,
    familiasSetup: null,
    sequenciamentoManualFamilias: null,
    baseTecnica: null
  };

  const preservarCadastroMestre =
    !forcarGithub && Boolean(pendentesDetalhe?.cadastroMestre);

  const preservarFamiliasSetup =
    !forcarGithub && Boolean(pendentesDetalhe?.familiasSetup);

  const preservarSequenciaManual =
    !forcarGithub && Boolean(pendentesDetalhe?.sequenciaManualFamilias);

  const preservarBaseTecnica =
    !forcarGithub && Boolean(pendentesDetalhe?.baseTecnica);

  if (preservarCadastroMestre) {

    resultado.cadastroMestre = {
      aplicado: false,
      preservadoLocal: true,
      motivo: "Cadastro Mestre local pendente foi preservado."
    };

  } else try {

    const cadastroPayload =
      await buscarJSON(
        caminhos.cadastroMestre,
        versao
      );

    const listaCadastro =
      extrairLista(
        cadastroPayload,
        [
          "produtosMestre",
          "produtos",
          "cadastroMestre",
          "itens"
        ]
      );

    resultado.cadastroMestre =
      aplicarCadastroMestreJSON(
        listaCadastro,
        permitirVazio
      );

  } catch (erro) {

    resultado.cadastroMestre = {
      aplicado: false,
      erro: erro.message
    };

    console.warn(
      "Cadastro Mestre JSON não aplicado:",
      erro
    );

  }

  if (preservarFamiliasSetup) {

    resultado.familiasSetup = {
      aplicado: false,
      preservadoLocal: true,
      motivo: "Famílias locais pendentes foram preservadas."
    };

  } else try {

    const familiasPayload =
      await buscarJSON(
        caminhos.familiasSetup,
        versao
      );

    const listaFamilias =
      extrairLista(
        familiasPayload,
        [
          "familiasSetup",
          "familias",
          "familiasCadastro"
        ]
      );

    resultado.familiasSetup =
      aplicarFamiliasSetupJSON(
        listaFamilias,
        permitirVazio
      );

  } catch (erro) {

    resultado.familiasSetup = {
      aplicado: false,
      erro: erro.message
    };

    console.warn(
      "Famílias JSON não aplicadas:",
      erro
    );

  }

  if (preservarSequenciaManual) {

    resultado.sequenciamentoManualFamilias = {
      aplicado: false,
      preservadoLocal: true,
      motivo: "Ordem manual local das famílias foi preservada."
    };

  } else try {

    const sequenciaPayload =
      await buscarJSON(
        caminhos.sequenciamentoManualFamilias,
        versao
      );

    const sequencia =
      extrairObjeto(
        sequenciaPayload,
        [
          "sequenciamentoManualFamilias",
          "sequenciasManuais",
          "sequencias"
        ]
      );

    resultado.sequenciamentoManualFamilias =
      aplicarSequenciaManualJSON(
        sequencia,
        permitirVazio
      );

  } catch (erro) {

    resultado.sequenciamentoManualFamilias = {
      aplicado: false,
      erro: erro.message
    };

    console.warn(
      "Sequência manual JSON não aplicada:",
      erro
    );

  }

  if (preservarBaseTecnica) {

    resultado.baseTecnica = {
      aplicado: false,
      preservadoLocal: true,
      motivo: "Base Técnica local pendente foi preservada.",
      total: Array.isArray(getBaseTXT()?.produtosTecnicos)
        ? getBaseTXT().produtosTecnicos.length
        : 0
    };

  } else try {

    const baseTecnicaPayload =
      await buscarJSON(
        caminhos.baseTecnica,
        versao
      );

    const baseTecnica =
      extrairBaseTecnica(
        baseTecnicaPayload
      );

    resultado.baseTecnica =
      aplicarBaseTecnicaJSON(
        baseTecnica,
        permitirVazio
      );

  } catch (erro) {

    resultado.baseTecnica = {
      aplicado: false,
      erro: erro.message
    };

    console.warn(
      "Base técnica JSON não aplicada:",
      erro
    );

  }

  salvarStorageJSON(
    STORAGE_META,
    {
      versao,
      caminhos,
      atualizadoEm: new Date().toISOString()
    }
  );

  if (forcarGithub) {
    limparMarcacaoAlteracoesLocais();
  }

  atualizarStatusDadosProjeto({
    versao,
    resultado
  });

  return resultado;

}



export async function garantirBaseTecnicaNativaCarregada(opcoes = {}) {

  /**
   * Esta função foi criada para o fluxo diário:
   * ao importar o CSV, o sistema força a leitura do
   * data/base_tecnica.json antes de sincronizar.
   *
   * Assim o usuário não precisa importar TXT todos os dias.
   * O TXT fica apenas para manutenção/atualização da base.
   */

  const forcarRecarregar =
    opcoes.forcarRecarregar === true;

  const baseAtual =
    getBaseTXT();

  const totalAtual =
    Array.isArray(baseAtual?.produtosTecnicos)
      ? baseAtual.produtosTecnicos.length
      : 0;

  if (
    totalAtual > 0 &&
    !forcarRecarregar
  ) {
    return {
      aplicado: false,
      jaCarregada: true,
      total: totalAtual,
      origem: "cache/memoria"
    };
  }

  const versaoDados =
    await carregarVersaoDados();

  const versao =
    versaoDados.versao || Date.now();

  const caminhoBaseTecnica =
    versaoDados.baseTecnica || CAMINHO_BASE_TECNICA_PADRAO;

  const permitirVazio =
    versaoDados.permitirSubstituirPorVazio === true;

  const baseTecnicaPayload =
    await buscarJSON(
      caminhoBaseTecnica,
      versao
    );

  const baseTecnica =
    extrairBaseTecnica(
      baseTecnicaPayload
    );

  const resultado =
    aplicarBaseTecnicaJSON(
      baseTecnica,
      permitirVazio
    );

  const total =
    Array.isArray(getBaseTXT()?.produtosTecnicos)
      ? getBaseTXT().produtosTecnicos.length
      : 0;

  salvarStorageJSON(
    STORAGE_META,
    {
      ...(lerStorageJSON(STORAGE_META, {}) || {}),
      versao,
      baseTecnica: caminhoBaseTecnica,
      baseTecnicaCarregadaEm: new Date().toISOString()
    }
  );

  atualizarStatusDadosProjeto({
    versao,
    resultado: {
      baseTecnica: resultado
    }
  });

  return {
    ...resultado,
    total,
    caminho: caminhoBaseTecnica,
    versao,
    origem: "json-projeto"
  };

}

function baixarArquivoJSON(nomeArquivo, conteudo) {

  const blob =
    new Blob(
      [JSON.stringify(conteudo, null, 2)],
      {
        type: "application/json;charset=utf-8"
      }
    );

  const link =
    document.createElement("a");

  link.href =
    URL.createObjectURL(blob);

  link.download =
    nomeArquivo;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 1000);

}

export function exportarCadastroMestreJSON() {

  const produtosMestre =
    carregarProdutosMestre();

  baixarArquivoJSON(
    "cadastro_mestre.json",
    {
      tipo: "cadastro_mestre",
      geradoEm: new Date().toISOString(),
      total: produtosMestre.length,
      produtosMestre
    }
  );

}

export function exportarFamiliasSetupJSON() {

  const familiasSetup =
    carregarFamiliasSetup();

  baixarArquivoJSON(
    "familias_setup.json",
    {
      tipo: "familias_setup",
      geradoEm: new Date().toISOString(),
      total: familiasSetup.length,
      familiasSetup
    }
  );

}

export function exportarSequenciamentoManualFamiliasJSON() {

  const sequenciamentoManualFamilias =
    carregarSequenciaManualAtual();

  baixarArquivoJSON(
    "sequenciamento_manual_familias.json",
    {
      tipo: "sequenciamento_manual_familias",
      geradoEm: new Date().toISOString(),
      totalLinhas: Object.keys(sequenciamentoManualFamilias).length,
      sequenciamentoManualFamilias
    }
  );

}

export function exportarBaseTecnicaJSON() {

  const baseTecnica =
    getBaseTXT() || {
      produtosTecnicos: [],
      estatisticas: {}
    };

  const total =
    Array.isArray(baseTecnica.produtosTecnicos)
      ? baseTecnica.produtosTecnicos.length
      : 0;

  baixarArquivoJSON(
    "base_tecnica.json",
    {
      tipo: "base_tecnica",
      geradoEm: new Date().toISOString(),
      total,
      baseTecnica
    }
  );

}

function textoTiposPendentes(pendentes) {

  const nomes = {
    cadastroMestre: "Cadastro Mestre",
    familiasSetup: "Famílias",
    sequenciaManualFamilias: "Ordem das famílias",
    baseTecnica: "Base técnica",
    dados: "Dados"
  };

  return Object.entries(pendentes || {})
    .filter(([, valor]) => Boolean(valor))
    .map(([chave]) => nomes[chave] || chave)
    .join(", ");

}

export function atualizarStatusDadosProjeto(info = {}) {

  const status =
    document.getElementById("dadosProjetoStatus");

  if (!status) {
    return;
  }

  const meta =
    lerStorageJSON(
      STORAGE_META,
      null
    );

  const pendentes =
    carregarAlteracoesPendentes();

  const temPendencias =
    Object.values(pendentes).some(Boolean);

  if (temPendencias) {

    status.className =
      "dados-projeto-status alerta";

    status.textContent =
      `Alterações locais pendentes: ${textoTiposPendentes(pendentes)}. Exporte os JSONs e suba no GitHub.`;

    return;

  }

  const versao =
    info.versao || meta?.versao || "sem versão";

  status.className =
    "dados-projeto-status ok";

  status.textContent =
    `Dados carregados do projeto/GitHub. Versão: ${versao}.`;

}

export function inicializarPainelDadosProjeto(opcoes = {}) {

  const onDadosRecarregados =
    typeof opcoes.onDadosRecarregados === "function"
      ? opcoes.onDadosRecarregados
      : () => {};

  document
    .getElementById("btnExportCadastroMestreJson")
    ?.addEventListener("click", () => {
      exportarCadastroMestreJSON();
    });

  document
    .getElementById("btnExportFamiliasSetupJson")
    ?.addEventListener("click", () => {
      exportarFamiliasSetupJSON();
    });

  document
    .getElementById("btnExportSequenciaFamiliasJson")
    ?.addEventListener("click", () => {
      exportarSequenciamentoManualFamiliasJSON();
    });

  document
    .getElementById("btnExportBaseTecnicaJson")
    ?.addEventListener("click", () => {
      exportarBaseTecnicaJSON();
    });

  document
    .getElementById("btnRecarregarDadosGithub")
    ?.addEventListener("click", async () => {

      if (
        possuiAlteracoesPendentes() &&
        !confirm("Existem alterações locais pendentes. Recarregar do GitHub vai descartar o rascunho local. Continuar?")
      ) {
        return;
      }

      await inicializarDadosProjetoJSON({
        forcarGithub: true
      });

      onDadosRecarregados();

      alert(
        "Dados recarregados dos JSONs do projeto."
      );

    });

  document
    .getElementById("btnDescartarAlteracoesLocais")
    ?.addEventListener("click", async () => {

      if (
        !confirm("Descartar alterações locais e voltar para os JSONs oficiais do projeto?")
      ) {
        return;
      }

      limparMarcacaoAlteracoesLocais();

      await inicializarDadosProjetoJSON({
        forcarGithub: true
      });

      onDadosRecarregados();

    });

  atualizarStatusDadosProjeto();

}
