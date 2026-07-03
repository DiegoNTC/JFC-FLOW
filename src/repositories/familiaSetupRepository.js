const STORAGE_KEY =
  "jfc_flow_familias_setup_v1";

const STORAGE_KEY_OCULTAS =
  "jfc_flow_familias_setup_ocultas_v1";  

export function normalizarChaveFamilia(
  valor
) {

  return String(
    valor ?? ""
  )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

export function carregarChavesFamiliasOcultas() {

  try {

    const bruto =
      localStorage.getItem(
        STORAGE_KEY_OCULTAS
      );

    if (!bruto) {
      return [];
    }

    const dados =
      JSON.parse(
        bruto
      );

    if (!Array.isArray(dados)) {
      return [];
    }

    return Array.from(
      new Set(
        dados
          .map(chave => normalizarChaveFamilia(chave))
          .filter(Boolean)
      )
    );

  } catch (erro) {

    console.error(
      "Erro ao carregar famílias ocultas:",
      erro
    );

    return [];

  }

}

function salvarChavesFamiliasOcultas(
  chaves = []
) {

  const chavesNormalizadas =
    Array.from(
      new Set(
        chaves
          .map(chave => normalizarChaveFamilia(chave))
          .filter(Boolean)
      )
    );

  localStorage.setItem(
    STORAGE_KEY_OCULTAS,
    JSON.stringify(chavesNormalizadas)
  );

  return chavesNormalizadas;

}

export function familiaSetupEstaOculta(
  familiaOuChave
) {

  const chave =
    normalizarChaveFamilia(
      typeof familiaOuChave === "object"
        ? (
            familiaOuChave.chave ||
            familiaOuChave.familiaOriginal ||
            familiaOuChave.nomeFamilia ||
            familiaOuChave.nomeTXTReferencia
          )
        : familiaOuChave
    );

  if (!chave) {
    return false;
  }

  return carregarChavesFamiliasOcultas()
    .includes(chave);

}

export function ocultarFamiliaSetup(
  familiaOuChave
) {

  const chave =
    normalizarChaveFamilia(
      typeof familiaOuChave === "object"
        ? (
            familiaOuChave.chave ||
            familiaOuChave.familiaOriginal ||
            familiaOuChave.nomeFamilia ||
            familiaOuChave.nomeTXTReferencia
          )
        : familiaOuChave
    );

  if (!chave) {
    return null;
  }

  const chaves =
    carregarChavesFamiliasOcultas();

  if (!chaves.includes(chave)) {
    chaves.push(chave);
  }

  salvarChavesFamiliasOcultas(
    chaves
  );

  return chave;

}

export function restaurarFamiliaSetup(
  familiaOuChave
) {

  const chave =
    normalizarChaveFamilia(
      typeof familiaOuChave === "object"
        ? (
            familiaOuChave.chave ||
            familiaOuChave.familiaOriginal ||
            familiaOuChave.nomeFamilia ||
            familiaOuChave.nomeTXTReferencia
          )
        : familiaOuChave
    );

  if (!chave) {
    return [];
  }

  const chavesAtualizadas =
    carregarChavesFamiliasOcultas()
      .filter(chaveAtual => chaveAtual !== chave);

  return salvarChavesFamiliasOcultas(
    chavesAtualizadas
  );

}

export function restaurarTodasFamiliasOcultas() {

  localStorage.removeItem(
    STORAGE_KEY_OCULTAS
  );

  return [];

}

export function carregarFamiliasSetup() {

  try {

    const bruto =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!bruto) {
      return [];
    }

    const familias =
      JSON.parse(
        bruto
      );

    if (!Array.isArray(familias)) {
      return [];
    }

    return familias;

  } catch (erro) {

    console.error(
      "Erro ao carregar famílias de setup:",
      erro
    );

    return [];

  }

}

export function salvarFamiliasSetup(
  familias = []
) {

  const familiasNormalizadas =
    familias
      .filter(familia => {

        return normalizarChaveFamilia(
          familia.nomeFamilia ||
          familia.familiaOriginal ||
          familia.nomeTXTReferencia
        );

      })
      .map(familia => {

        const nomeBase =
          familia.nomeFamilia ||
          familia.familiaOriginal ||
          familia.nomeTXTReferencia;

        const chave =
          familia.chave ||
          normalizarChaveFamilia(
            nomeBase
          );

        return {
          chave,

          familiaOriginal:
            familia.familiaOriginal ||
            nomeBase,

          nomeFamilia:
            familia.nomeFamilia ||
            familia.familiaOriginal ||
            nomeBase,

          nomeTXTReferencia:
            familia.nomeTXTReferencia ||
            familia.familiaOriginal ||
            nomeBase,

          ordemTXT:
            familia.ordemTXT ?? null,

          setupTrocaMin:
            familia.setupTrocaMin ?? null,

          ativa:
            familia.ativa !== false,

          criadoEm:
            familia.criadoEm ||
            new Date().toISOString(),

          atualizadoEm:
            new Date().toISOString()
        };

      });

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(familiasNormalizadas)
  );

  return familiasNormalizadas;

}

export function buscarFamiliaSetupPorNome(
  nome
) {

  const chaveBusca =
    normalizarChaveFamilia(
      nome
    );

  if (!chaveBusca) {
    return null;
  }

  const familias =
    carregarFamiliasSetup();

  return familias.find(familia => {

    return (
      familia.chave === chaveBusca ||
      normalizarChaveFamilia(familia.nomeFamilia) === chaveBusca ||
      normalizarChaveFamilia(familia.familiaOriginal) === chaveBusca ||
      normalizarChaveFamilia(familia.nomeTXTReferencia) === chaveBusca
    );

  }) || null;

}

export function mesclarFamiliasSetup(
  familiasBase = []
) {

  const familiasSalvas =
    carregarFamiliasSetup();

  const mapaSalvas =
    new Map();

  familiasSalvas.forEach(familia => {

    const chave =
      familia.chave ||
      normalizarChaveFamilia(
        familia.nomeFamilia ||
        familia.familiaOriginal ||
        familia.nomeTXTReferencia
      );

    if (chave) {
      mapaSalvas.set(
        chave,
        familia
      );
    }

  });

  const mapaFinal =
    new Map();

  familiasBase.forEach(base => {

    const chave =
      base.chave ||
      normalizarChaveFamilia(
        base.familiaOriginal ||
        base.nomeFamilia ||
        base.nomeTXTReferencia
      );

    if (!chave) {
      return;
    }

    const salva =
      mapaSalvas.get(
        chave
      );

    mapaFinal.set(
      chave,
      {
        chave,

        familiaOriginal:
          salva?.familiaOriginal ||
          base.familiaOriginal ||
          base.nomeFamilia,

        nomeFamilia:
          salva?.nomeFamilia ||
          base.nomeFamilia ||
          base.familiaOriginal,

        nomeTXTReferencia:
          salva?.nomeTXTReferencia ||
          base.nomeTXTReferencia ||
          base.familiaOriginal,

        ordemTXT:
          salva?.ordemTXT ??
          base.ordemTXT ??
          null,

        setupTrocaMin:
          salva?.setupTrocaMin ??
          base.setupTrocaMin ??
          null,

        ativa:
          salva?.ativa !== false,

        criadoEm:
          salva?.criadoEm ||
          base.criadoEm ||
          new Date().toISOString(),

        atualizadoEm:
          new Date().toISOString()
      }
    );

  });

  familiasSalvas.forEach(salva => {

    const chave =
      salva.chave ||
      normalizarChaveFamilia(
        salva.nomeFamilia ||
        salva.familiaOriginal ||
        salva.nomeTXTReferencia
      );

    if (
      chave &&
      !mapaFinal.has(chave)
    ) {

      mapaFinal.set(
        chave,
        salva
      );

    }

  });

  const familias =
    Array.from(
      mapaFinal.values()
    ).sort((a, b) => {

      const ordemA =
        Number(a.ordemTXT ?? 999999);

      const ordemB =
        Number(b.ordemTXT ?? 999999);

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(a.nomeFamilia || "")
        .localeCompare(
          String(b.nomeFamilia || ""),
          "pt-BR"
        );

    });

  salvarFamiliasSetup(
    familias
  );

  return familias;

}