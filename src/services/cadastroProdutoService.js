/**
 * ======================================================
 * JFC FLOW
 * Módulo: cadastroProdutoService
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Montar e atualizar produtos do Cadastro Mestre
 * a partir de cadastro manual/edição.
 * ======================================================
 */

function numero(valor) {

  return Number(
    String(valor ?? "")
      .replace(",", ".")
  ) || 0;

}

function texto(valor) {

  return String(valor ?? "")
    .trim();

}

function normalizarCodigo(codigo) {

  return texto(codigo);

}

function normalizarClasseSetup(valor) {

  return texto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}

function calcularKgPorUnidade(
  kgDia,
  unidadeDia
) {

  const kg =
    numero(kgDia);

  const unidade =
    numero(unidadeDia);

  if (kg <= 0 || unidade <= 0) {
    return 0;
  }

  return kg / unidade;

}

function calcularTempoProducaoMin(
  kgDia,
  produtividadeKgHora
) {

  const kg =
    numero(kgDia);

  const produtividade =
    numero(produtividadeKgHora);

  if (kg <= 0 || produtividade <= 0) {
    return 0;
  }

  return (kg / produtividade) * 60;

}

function criarRotaManual(dados) {

  const unidadeDia =
    numero(dados.unidadeDia);

  const kgDia =
    numero(dados.kgDia);

  const produtividadeKgHora =
    numero(dados.produtividadeKgHora);

  const tempoProducaoMin =
    calcularTempoProducaoMin(
      kgDia,
      produtividadeKgHora
    );

  const kgPorUnidade =
    calcularKgPorUnidade(
      kgDia,
      unidadeDia
    );

  return {

    idTecnico:
      `MANUAL-${dados.codigo}-${dados.linhaPrincipal}`,

    codigo:
      dados.codigo,

    nomeOficial:
      dados.nomeOficial,

    descricao:
      dados.nomeOficial,

    descricaoCSV:
      dados.nomeOficial,

    descricaoTXT:
      dados.descricaoTXT,

    linha:
      dados.linhaPrincipal,

    zona:
      dados.zona,

    sequencia:
      dados.sequenciaTXT,

    sequenciaPrincipal:
      dados.sequenciaTXT,

    familiaSetup:
      dados.familiaSetup,

    classeSetup:
      dados.classeSetup,

    setupMin:
      dados.setupTrocaMin,

    setupBaseMin:
      dados.setupTrocaMin,

    setupTrocaMin:
      dados.setupTrocaMin,

    setupAplicadoMin:
      0,

    unidadeDia,

    kgDia,

    kgPorUnidade,

    produtividadeKgHora,

    tempoProducaoMin,

    origem: {
      manual: true
    }

  };

}

function atualizarRotasTecnicas(
  produtoAtual,
  dados
) {

  const rotasAtuais =
    Array.isArray(produtoAtual?.rotasTecnicas)
      ? produtoAtual.rotasTecnicas
      : [];

  const rotaManual =
    criarRotaManual(dados);

  if (rotasAtuais.length === 0) {
    return [rotaManual];
  }

  let encontrouLinhaPrincipal =
    false;

  const rotasAtualizadas =
    rotasAtuais.map(rota => {

      const mesmaLinha =
        rota.linha === dados.linhaPrincipal;

      if (mesmaLinha) {
        encontrouLinhaPrincipal = true;
      }

      return {

        ...rota,

        codigo:
          dados.codigo,

        nomeOficial:
          dados.nomeOficial,

        descricao:
          dados.nomeOficial,

        descricaoCSV:
          dados.nomeOficial,

        descricaoTXT:
          dados.descricaoTXT || rota.descricaoTXT,

        familiaSetup:
          dados.familiaSetup,

        classeSetup:
          dados.classeSetup,

        setupMin:
          dados.setupTrocaMin,

        setupBaseMin:
          dados.setupTrocaMin,

        setupTrocaMin:
          dados.setupTrocaMin,

        linha:
          mesmaLinha
            ? dados.linhaPrincipal
            : rota.linha,

        zona:
          mesmaLinha
            ? dados.zona
            : rota.zona,

        sequencia:
          mesmaLinha
            ? dados.sequenciaTXT
            : rota.sequencia,

        sequenciaPrincipal:
          mesmaLinha
            ? dados.sequenciaTXT
            : rota.sequenciaPrincipal,

        unidadeDia:
          mesmaLinha
            ? numero(dados.unidadeDia)
            : rota.unidadeDia,

        kgDia:
          mesmaLinha
            ? numero(dados.kgDia)
            : rota.kgDia,

        kgPorUnidade:
          mesmaLinha
            ? calcularKgPorUnidade(
                dados.kgDia,
                dados.unidadeDia
              )
            : rota.kgPorUnidade,

        produtividadeKgHora:
          mesmaLinha
            ? numero(dados.produtividadeKgHora)
            : rota.produtividadeKgHora,

        tempoProducaoMin:
          mesmaLinha
            ? calcularTempoProducaoMin(
                dados.kgDia,
                dados.produtividadeKgHora
              )
            : rota.tempoProducaoMin,

        origem: {
          ...(rota.origem || {}),
          manualEditado: true
        }

      };

    });

  if (!encontrouLinhaPrincipal) {
    rotasAtualizadas.push(rotaManual);
  }

  return rotasAtualizadas;

}

export function montarProdutoMestreCadastro(
  dadosFormulario,
  produtoAtual = null
) {

  const codigo =
    normalizarCodigo(
      dadosFormulario.codigo
    );

  const nomeOficial =
    texto(
      dadosFormulario.nomeOficial
    );

  const descricaoTXT =
    texto(
      dadosFormulario.descricaoTXT
    );

  const familiaSetup =
    normalizarClasseSetup(
      dadosFormulario.familiaSetup
    );

  const classeSetup =
    familiaSetup;

  const linhaPrincipal =
    texto(
      dadosFormulario.linhaPrincipal
    );

  const linhasAlternativas =
    Array.isArray(dadosFormulario.linhasAlternativas)
      ? dadosFormulario.linhasAlternativas
      : [];

  const dados = {

    codigo,

    nomeOficial,

    descricaoTXT,

    familiaSetup,

    classeSetup,

    setupTrocaMin:
      numero(dadosFormulario.setupTrocaMin),

    linhaPrincipal,

    linhasAlternativas,

    sequenciaTXT:
      numero(dadosFormulario.sequenciaTXT),

    zona:
      texto(dadosFormulario.zona),

    unidadeDia:
      numero(dadosFormulario.unidadeDia),

    kgDia:
      numero(dadosFormulario.kgDia),

    produtividadeKgHora:
      numero(dadosFormulario.produtividadeKgHora),

    ativo:
      dadosFormulario.ativo !== false

  };

  const rotasTecnicas =
    atualizarRotasTecnicas(
      produtoAtual,
      dados
    );

  return {

    ...(produtoAtual || {}),

    id:
      codigo,

    codigo,

    nomeOficial,

    descricao:
      nomeOficial,

    descricaoCSV:
      nomeOficial,

    descricaoTXT,

    familiaSetup,

    classeSetup,

    setupTrocaMin:
      dados.setupTrocaMin,

    linhaPrincipal,

    linhasAlternativas,

    sequenciaTXT:
      dados.sequenciaTXT,

    zona:
      dados.zona,

    unidadeDia:
      dados.unidadeDia,

    kgDia:
      dados.kgDia,

    kgPorUnidade:
      calcularKgPorUnidade(
        dados.kgDia,
        dados.unidadeDia
      ),

    produtividadeKgHora:
      dados.produtividadeKgHora,

    tempoProducaoMin:
      calcularTempoProducaoMin(
        dados.kgDia,
        dados.produtividadeKgHora
      ),

    rotasTecnicas,

    vinculoConfirmado:
      true,

    vinculoTipo:
      produtoAtual?.vinculoTipo || "MANUAL",

    scoreVinculo:
      produtoAtual?.scoreVinculo || 100,

    ativo:
      dados.ativo,

    origem: {
      ...(produtoAtual?.origem || {}),
      manual: true,
      cadastroMestre: true
    },

    atualizadoEm:
      new Date().toISOString(),

    criadoEm:
      produtoAtual?.criadoEm || new Date().toISOString()

  };

}