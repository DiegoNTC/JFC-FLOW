/**
 * ======================================================
 * JFC FLOW
 * Módulo: geradorTimelineTurno
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Gerar uma timeline de turno a partir do Plano Final por Zona.
 *
 * Regra operacional inicial:
 * - Turno começa às 07:00.
 * - Zona Negra usa srcLinha.
 * - Zona Branca usa dstLinha.
 * - Zona Cinza espelha a Zona Branca.
 * - Branca só pode começar após leadTimeMin contado do início da Negra.
 *
 * Entrada recomendada:
 * - window.jfcPlanoFinalDia
 * ou
 * - objeto retornado pelo renderPlanoFinalDia em window.jfcPlanoFinalDia
 *
 * Saída:
 * {
 *   inicioTurnoMin,
 *   inicioTurnoTexto,
 *   linhas: [
 *     {
 *       linha,
 *       eventos,
 *       eventosPorZona,
 *       resumo
 *     }
 *   ],
 *   resumo,
 *   criadoEm
 * }
 * ======================================================
 */

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

function normalizarZona(zona) {

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

function converterHorarioParaMinutos(horario) {

  const textoHorario =
    texto(horario);

  const match =
    textoHorario.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return 7 * 60;
  }

  const horas =
    Number(match[1]);

  const minutos =
    Number(match[2]);

  return horas * 60 + minutos;

}

function formatarHora(minutosTotais) {

  const total =
    Math.max(
      0,
      Math.round(
        numero(minutosTotais)
      )
    );

  const horas =
    Math.floor(total / 60) % 24;

  const minutos =
    total % 60;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

}

function ordenarLinhas(a, b) {

  if (a === "TOMATE") {
    return 1;
  }

  if (b === "TOMATE") {
    return -1;
  }

  const numA =
    Number(
      String(a)
        .replace(/\D/g, "")
    );

  const numB =
    Number(
      String(b)
        .replace(/\D/g, "")
    );

  if (
    !Number.isNaN(numA) &&
    !Number.isNaN(numB)
  ) {
    return numA - numB;
  }

  return String(a)
    .localeCompare(
      String(b),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base"
      }
    );

}

function ordenarItensZona(a, b) {

  const ordemTXTA =
    numero(a.ordemTXT);

  const ordemTXTB =
    numero(b.ordemTXT);

  if (ordemTXTA !== ordemTXTB) {
    return ordemTXTA - ordemTXTB;
  }

  const ordemA =
    numero(a.ordemZona ?? a.ordem);

  const ordemB =
    numero(b.ordemZona ?? b.ordem);

  if (ordemA !== ordemB) {
    return ordemA - ordemB;
  }

  return texto(a.produto)
    .localeCompare(
      texto(b.produto),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base"
      }
    );

}

function chaveProduto(item) {

  return [
    texto(item.codigo),
    texto(item.produto),
    texto(item.ordemTXT)
  ].join("|");

}

function extrairLinhasPlano(planoFinalOuPlanejamento) {

  if (
    Array.isArray(planoFinalOuPlanejamento?.linhasPorZona)
  ) {
    return planoFinalOuPlanejamento.linhasPorZona;
  }

  if (
    Array.isArray(planoFinalOuPlanejamento?.linhas) &&
    planoFinalOuPlanejamento.linhas.some(linha => linha?.zonas)
  ) {
    return planoFinalOuPlanejamento.linhas;
  }

  return [];

}

function criarCursorKey(linha, zona) {

  return `${normalizarLinha(linha)}|${normalizarZona(zona)}`;

}

function obterCursor(cursores, linha, zona, inicioTurnoMin) {

  const chave =
    criarCursorKey(
      linha,
      zona
    );

  if (!cursores.has(chave)) {
    cursores.set(
      chave,
      inicioTurnoMin
    );
  }

  return cursores.get(chave);

}

function definirCursor(cursores, linha, zona, valor) {

  const chave =
    criarCursorKey(
      linha,
      zona
    );

  cursores.set(
    chave,
    valor
  );

}

function criarEvento({
  linha,
  zona,
  tipoEvento,
  inicioMin,
  fimMin,
  item,
  titulo,
  observacao = ""
}) {

  const duracaoMin =
    Math.max(
      0,
      numero(fimMin) - numero(inicioMin)
    );

  return {
    id: [
      linha,
      zona,
      tipoEvento,
      texto(item?.codigo),
      texto(item?.produto),
      texto(item?.ordemTXT),
      inicioMin,
      fimMin
    ].join("|"),

    linha:
      normalizarLinha(linha),

    zona:
      normalizarZona(zona),

    tipoEvento,

    titulo:
      titulo || tipoEvento,

    codigo:
      item?.codigo || "",

    produto:
      item?.produto || "",

    familia:
      item?.familia || "",

    ordemZona:
      item?.ordemZona ?? "",

    ordemFinal:
      item?.ordem ?? "",

    ordemTXT:
      item?.ordemTXT ?? "",

    kg:
      numero(item?.kg),

    inicioMin:
      Math.round(
        numero(inicioMin)
      ),

    fimMin:
      Math.round(
        numero(fimMin)
      ),

    duracaoMin,

    horaInicio:
      formatarHora(inicioMin),

    horaFim:
      formatarHora(fimMin),

    setupMin:
      numero(item?.setupMin),

    producaoMin:
      numero(item?.producaoMin),

    totalMin:
      numero(item?.totalMin),

    leadTimeMin:
      numero(item?.leadTimeMin ?? 10),

    srcLinha:
      normalizarLinha(
        item?.srcLinha ??
        item?.linha
      ),

    dstLinha:
      normalizarLinha(
        item?.dstLinha ??
        item?.linha
      ),

    rotaCruzada:
      Boolean(item?.rotaCruzada),

    transferenciaValida:
      Boolean(item?.transferenciaValida),

    transferenciaRaw:
      item?.transferenciaRaw ?? "",

    espelho:
      Boolean(item?.espelho),

    geradoAutomaticamente:
      Boolean(item?.geradoAutomaticamente),

    observacao:
      observacao || item?.observacao || ""
  };

}

function adicionarEvento(mapaEventosLinha, evento) {

  const linha =
    normalizarLinha(
      evento.linha
    );

  if (!mapaEventosLinha.has(linha)) {
    mapaEventosLinha.set(
      linha,
      []
    );
  }

  mapaEventosLinha
    .get(linha)
    .push(evento);

}

function gerarEventosZonaNegra({
  linhaPlano,
  cursores,
  mapaEventosLinha,
  mapaProdutoTempo,
  inicioTurnoMin
}) {

  const itens =
    [...(linhaPlano?.zonas?.NEGRA || [])]
      .sort(ordenarItensZona);

  itens.forEach(item => {

    const linha =
      normalizarLinha(
        item.srcLinha ||
        item.linha ||
        linhaPlano.linha
      );

    const zona =
      "NEGRA";

    let cursor =
      obterCursor(
        cursores,
        linha,
        zona,
        inicioTurnoMin
      );

    const setupMin =
      numero(item.setupMin);

    if (setupMin > 0) {

      const eventoSetup =
        criarEvento({
          linha,
          zona,
          tipoEvento: "SETUP",
          inicioMin: cursor,
          fimMin: cursor + setupMin,
          item,
          titulo: `Setup - ${item.familia || item.produto}`
        });

      adicionarEvento(
        mapaEventosLinha,
        eventoSetup
      );

      cursor += setupMin;

    }

    const inicioProducao =
      cursor;

    const fimProducao =
      cursor + numero(item.producaoMin);

    const eventoProducao =
      criarEvento({
        linha,
        zona,
        tipoEvento: "PRODUCAO",
        inicioMin: inicioProducao,
        fimMin: fimProducao,
        item,
        titulo: item.produto
      });

    adicionarEvento(
      mapaEventosLinha,
      eventoProducao
    );

    definirCursor(
      cursores,
      linha,
      zona,
      fimProducao
    );

    mapaProdutoTempo.set(
      chaveProduto(item),
      {
        ...(mapaProdutoTempo.get(chaveProduto(item)) || {}),

        inicioNegraMin:
          inicioProducao,

        fimNegraMin:
          fimProducao,

        itemNegra:
          item
      }
    );

  });

}

function gerarEventosZonaBranca({
  linhaPlano,
  cursores,
  mapaEventosLinha,
  mapaProdutoTempo,
  inicioTurnoMin,
  mostrarEsperas
}) {

  const itens =
    [...(linhaPlano?.zonas?.BRANCA || [])]
      .sort(ordenarItensZona);

  itens.forEach(item => {

    const linha =
      normalizarLinha(
        item.dstLinha ||
        item.linha ||
        linhaPlano.linha
      );

    const zona =
      "BRANCA";

    const chave =
      chaveProduto(item);

    const temposProduto =
      mapaProdutoTempo.get(chave) || {};

    const leadTimeMin =
      numero(item.leadTimeMin ?? 10);

    const inicioMinimoPorLead =
      temposProduto.inicioNegraMin !== undefined
        ? temposProduto.inicioNegraMin + leadTimeMin
        : inicioTurnoMin;

    let cursor =
      obterCursor(
        cursores,
        linha,
        zona,
        inicioTurnoMin
      );

    const inicioPermitido =
      Math.max(
        cursor,
        inicioMinimoPorLead
      );

    if (
      mostrarEsperas &&
      inicioPermitido > cursor
    ) {

      const eventoEspera =
        criarEvento({
          linha,
          zona,
          tipoEvento: "ESPERA",
          inicioMin: cursor,
          fimMin: inicioPermitido,
          item,
          titulo: "Espera de produto da Zona Negra",
          observacao: `Aguardando lead time de ${leadTimeMin} min`
        });

      adicionarEvento(
        mapaEventosLinha,
        eventoEspera
      );

    }

    cursor =
      inicioPermitido;

    const setupMin =
      numero(item.setupMin);

    if (setupMin > 0) {

      const eventoSetup =
        criarEvento({
          linha,
          zona,
          tipoEvento: "SETUP",
          inicioMin: cursor,
          fimMin: cursor + setupMin,
          item,
          titulo: `Setup - ${item.familia || item.produto}`
        });

      adicionarEvento(
        mapaEventosLinha,
        eventoSetup
      );

      cursor += setupMin;

    }

    const inicioProducao =
      cursor;

    const fimProducao =
      cursor + numero(item.producaoMin);

    const eventoProducao =
      criarEvento({
        linha,
        zona,
        tipoEvento: "PRODUCAO",
        inicioMin: inicioProducao,
        fimMin: fimProducao,
        item,
        titulo: item.produto
      });

    adicionarEvento(
      mapaEventosLinha,
      eventoProducao
    );

    definirCursor(
      cursores,
      linha,
      zona,
      fimProducao
    );

    mapaProdutoTempo.set(
      chave,
      {
        ...temposProduto,

        inicioBrancaMin:
          inicioProducao,

        fimBrancaMin:
          fimProducao,

        itemBranca:
          item
      }
    );

  });

}

function gerarEventosZonaCinza({
  linhaPlano,
  cursores,
  mapaEventosLinha,
  mapaProdutoTempo,
  inicioTurnoMin
}) {

  const itens =
    [...(linhaPlano?.zonas?.CINZA || [])]
      .sort(ordenarItensZona);

  itens.forEach(item => {

    const linha =
      normalizarLinha(
        item.dstLinha ||
        item.linha ||
        linhaPlano.linha
      );

    const zona =
      "CINZA";

    const chave =
      chaveProduto(item);

    const temposProduto =
      mapaProdutoTempo.get(chave) || {};

    const inicioEspelho =
      temposProduto.inicioBrancaMin ??
      (
        temposProduto.inicioNegraMin !== undefined
          ? temposProduto.inicioNegraMin + numero(item.leadTimeMin ?? 10)
          : inicioTurnoMin
      );

    const fimEspelho =
      temposProduto.fimBrancaMin ??
      inicioEspelho;

    const eventoEspelho =
      criarEvento({
        linha,
        zona,
        tipoEvento: "ESPELHO",
        inicioMin: inicioEspelho,
        fimMin: fimEspelho,
        item,
        titulo: item.produto,
        observacao: "Zona Cinza espelhada pela Zona Branca"
      });

    adicionarEvento(
      mapaEventosLinha,
      eventoEspelho
    );

    const cursorAtual =
      obterCursor(
        cursores,
        linha,
        zona,
        inicioTurnoMin
      );

    definirCursor(
      cursores,
      linha,
      zona,
      Math.max(
        cursorAtual,
        fimEspelho
      )
    );

    mapaProdutoTempo.set(
      chave,
      {
        ...temposProduto,

        inicioCinzaMin:
          inicioEspelho,

        fimCinzaMin:
          fimEspelho,

        itemCinza:
          item
      }
    );

  });

}

function gerarEventosOutrasZonas({
  linhaPlano,
  cursores,
  mapaEventosLinha,
  inicioTurnoMin
}) {

  const itens =
    [...(linhaPlano?.zonas?.OUTRAS || [])]
      .sort(ordenarItensZona);

  itens.forEach(item => {

    const linha =
      normalizarLinha(
        item.linha ||
        linhaPlano.linha
      );

    const zona =
      "OUTRAS";

    let cursor =
      obterCursor(
        cursores,
        linha,
        zona,
        inicioTurnoMin
      );

    const setupMin =
      numero(item.setupMin);

    if (setupMin > 0) {

      adicionarEvento(
        mapaEventosLinha,
        criarEvento({
          linha,
          zona,
          tipoEvento: "SETUP",
          inicioMin: cursor,
          fimMin: cursor + setupMin,
          item,
          titulo: `Setup - ${item.familia || item.produto}`
        })
      );

      cursor += setupMin;

    }

    const fimProducao =
      cursor + numero(item.producaoMin);

    adicionarEvento(
      mapaEventosLinha,
      criarEvento({
        linha,
        zona,
        tipoEvento: "PRODUCAO",
        inicioMin: cursor,
        fimMin: fimProducao,
        item,
        titulo: item.produto
      })
    );

    definirCursor(
      cursores,
      linha,
      zona,
      fimProducao
    );

  });

}

function calcularResumoLinha(eventos) {

  return eventos.reduce((acc, evento) => {

    acc.totalEventos += 1;

    if (evento.tipoEvento === "PRODUCAO") {
      acc.totalProducaoMin += evento.duracaoMin;
    }

    if (evento.tipoEvento === "SETUP") {
      acc.totalSetupMin += evento.duracaoMin;
    }

    if (evento.tipoEvento === "ESPERA") {
      acc.totalEsperaMin += evento.duracaoMin;
    }

    if (evento.tipoEvento === "ESPELHO") {
      acc.totalEspelhos += 1;
    }

    if (evento.rotaCruzada) {
      acc.totalRotasCruzadas += 1;
    }

    acc.inicioMin =
      Math.min(
        acc.inicioMin,
        evento.inicioMin
      );

    acc.fimMin =
      Math.max(
        acc.fimMin,
        evento.fimMin
      );

    return acc;

  }, {
    totalEventos: 0,
    totalProducaoMin: 0,
    totalSetupMin: 0,
    totalEsperaMin: 0,
    totalEspelhos: 0,
    totalRotasCruzadas: 0,
    inicioMin: Infinity,
    fimMin: 0
  });

}

function finalizarTimeline({
  mapaEventosLinha,
  inicioTurnoMin
}) {

  const linhas =
    Array.from(
      mapaEventosLinha.entries()
    )
      .map(([linha, eventos]) => {

        const eventosOrdenados =
          eventos
            .sort((a, b) => {

              if (a.inicioMin !== b.inicioMin) {
                return a.inicioMin - b.inicioMin;
              }

              const ordemZona = {
                NEGRA: 1,
                BRANCA: 2,
                CINZA: 3,
                OUTRAS: 4
              };

              return (
                numero(ordemZona[a.zona]) -
                numero(ordemZona[b.zona])
              );

            });

        const eventosPorZona = {
          NEGRA: [],
          BRANCA: [],
          CINZA: [],
          OUTRAS: []
        };

        eventosOrdenados.forEach(evento => {

          const zona =
            eventosPorZona[evento.zona]
              ? evento.zona
              : "OUTRAS";

          eventosPorZona[zona].push(evento);

        });

        const resumo =
          calcularResumoLinha(
            eventosOrdenados
          );

        return {
          linha,
          eventos: eventosOrdenados,
          eventosPorZona,
          resumo: {
            ...resumo,
            inicioTexto:
              resumo.inicioMin === Infinity
                ? formatarHora(inicioTurnoMin)
                : formatarHora(resumo.inicioMin),
            fimTexto:
              formatarHora(resumo.fimMin),
            tempoTotalMin:
              resumo.fimMin > 0
                ? resumo.fimMin - (
                    resumo.inicioMin === Infinity
                      ? inicioTurnoMin
                      : resumo.inicioMin
                  )
                : 0
          }
        };

      })
      .sort((a, b) => ordenarLinhas(a.linha, b.linha));

  const resumo =
    linhas.reduce((acc, linha) => {

      acc.totalLinhas += 1;
      acc.totalEventos += linha.resumo.totalEventos;
      acc.totalProducaoMin += linha.resumo.totalProducaoMin;
      acc.totalSetupMin += linha.resumo.totalSetupMin;
      acc.totalEsperaMin += linha.resumo.totalEsperaMin;
      acc.totalEspelhos += linha.resumo.totalEspelhos;
      acc.totalRotasCruzadas += linha.resumo.totalRotasCruzadas;

      acc.inicioMin =
        Math.min(
          acc.inicioMin,
          linha.resumo.inicioMin
        );

      acc.fimMin =
        Math.max(
          acc.fimMin,
          linha.resumo.fimMin
        );

      return acc;

    }, {
      totalLinhas: 0,
      totalEventos: 0,
      totalProducaoMin: 0,
      totalSetupMin: 0,
      totalEsperaMin: 0,
      totalEspelhos: 0,
      totalRotasCruzadas: 0,
      inicioMin: Infinity,
      fimMin: 0
    });

  return {
    inicioTurnoMin,
    inicioTurnoTexto:
      formatarHora(
        inicioTurnoMin
      ),

    linhas,

    resumo: {
      ...resumo,
      inicioTexto:
        resumo.inicioMin === Infinity
          ? formatarHora(inicioTurnoMin)
          : formatarHora(resumo.inicioMin),
      fimTexto:
        formatarHora(resumo.fimMin),
      tempoTotalMin:
        resumo.fimMin > 0
          ? resumo.fimMin - (
              resumo.inicioMin === Infinity
                ? inicioTurnoMin
                : resumo.inicioMin
            )
          : 0
    },

    criadoEm:
      new Date().toISOString()
  };

}

export function gerarTimelineTurno(
  planoFinalOuPlanejamento,
  opcoes = {}
) {

  const inicioTurnoMin =
    converterHorarioParaMinutos(
      opcoes.inicioTurno ||
      opcoes.horarioInicio ||
      "07:00"
    );

  const mostrarEsperas =
    opcoes.mostrarEsperas !== false;

  const linhasPlano =
    extrairLinhasPlano(
      planoFinalOuPlanejamento
    );

  const cursores =
    new Map();

  const mapaEventosLinha =
    new Map();

  const mapaProdutoTempo =
    new Map();

  linhasPlano.forEach(linhaPlano => {

    gerarEventosZonaNegra({
      linhaPlano,
      cursores,
      mapaEventosLinha,
      mapaProdutoTempo,
      inicioTurnoMin
    });

  });

  linhasPlano.forEach(linhaPlano => {

    gerarEventosZonaBranca({
      linhaPlano,
      cursores,
      mapaEventosLinha,
      mapaProdutoTempo,
      inicioTurnoMin,
      mostrarEsperas
    });

  });

  linhasPlano.forEach(linhaPlano => {

    gerarEventosZonaCinza({
      linhaPlano,
      cursores,
      mapaEventosLinha,
      mapaProdutoTempo,
      inicioTurnoMin
    });

  });

  linhasPlano.forEach(linhaPlano => {

    gerarEventosOutrasZonas({
      linhaPlano,
      cursores,
      mapaEventosLinha,
      inicioTurnoMin
    });

  });

  return finalizarTimeline({
    mapaEventosLinha,
    inicioTurnoMin
  });

}
