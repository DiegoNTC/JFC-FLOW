/**
 * ======================================================
 * JFC FLOW
 * Módulo: aplicadorBalanceamentoSimulado
 * Versão: 1.0.0
 *
 * Responsabilidade:
 * Aplicar visualmente uma simulação de balanceamento,
 * sem alterar Cadastro Mestre e sem salvar nada.
 *
 * Entrada:
 * - planejamentoComCapacidade
 * - simulacaoBalanceamento
 *
 * Saída:
 * - planejamentoSimulado com produtos movidos
 * ======================================================
 */

function numero(valor) {

    return Number(valor) || 0;

}

function clonarPlanejamento(
    planejamentoComCapacidade
) {

    return JSON.parse(
        JSON.stringify(
            planejamentoComCapacidade
        )
    );

}

function encontrarLinha(
    planejamento,
    nomeLinha
) {

    return planejamento.linhas.find(linha => {

        return linha.linha === nomeLinha;

    });

}

function removerProdutoDaOrigem(
    linhaOrigem,
    codigoProduto
) {

    const produtos =
        linhaOrigem.produtos || [];

    const index =
        produtos.findIndex(produto => {

            return produto.codigo === codigoProduto;

        });

    if (index === -1) {
        return null;
    }

    const produtoRemovido =
        produtos.splice(index, 1)[0];

    return produtoRemovido;

}

function prepararProdutoParaDestino(
    produto,
    movimento
) {

    const impacto =
        movimento.impactoEstimado || {};

    return {

        ...produto,

        linhaPlanejada:
            movimento.destino?.linha,

        linhaOrigemAntesBalanceamento:
            movimento.origem?.linha,

        balanceado:
            true,

        tempoProducaoPlanejadoMin:
            numero(impacto.tempoProdutoDestinoMin),

        tempoTotalPlanejadoMin:
            numero(impacto.tempoProdutoDestinoMin),

        statusCalculo:
            "BALANCEADO_SIMULADO"

    };

}

function adicionarProdutoNoDestino(
    linhaDestino,
    produto
) {

    if (!Array.isArray(linhaDestino.produtos)) {
        linhaDestino.produtos = [];
    }

    linhaDestino.produtos.push(
        produto
    );

    linhaDestino.produtos.sort((a, b) => {

        return numero(a.sequenciaPrincipal) -
            numero(b.sequenciaPrincipal);

    });

}

function recalcularResumoLinha(
    linha
) {

    const produtos =
        linha.produtos || [];

    const totalProdutos =
        produtos.length;

    const demandaTotal =
        produtos.reduce((soma, produto) => {

            return soma + numero(produto.demandaFinal);

        }, 0);

    const tempoTotalMin =
        produtos.reduce((soma, produto) => {

            return soma + numero(produto.tempoTotalPlanejadoMin);

        }, 0);

    const setupTotalMin =
        produtos.reduce((soma, produto) => {

            return soma + numero(produto.setupMin);

        }, 0);

    linha.resumo = {

        totalProdutos,

        demandaTotal,

        tempoTotalMin,

        setupTotalMin

    };

}

function classificarStatus(
    utilizacaoPercentual,
    tempoPlanejadoMin
) {

    if (tempoPlanejadoMin <= 0) {
        return "SEM_CARGA";
    }

    if (utilizacaoPercentual < 70) {
        return "OCIOSA";
    }

    if (utilizacaoPercentual <= 100) {
        return "OK";
    }

    if (utilizacaoPercentual <= 110) {
        return "ATENCAO";
    }

    return "ESTOURADA";

}

function traduzirStatus(status) {

    const mapa = {

        SEM_CARGA: "Sem carga",

        OCIOSA: "Ociosa",

        OK: "OK",

        ATENCAO: "Atenção",

        ESTOURADA: "Estourada"

    };

    return mapa[status] || status;

}

function recalcularCapacidadeLinha(
    linha
) {

    const capacidadeMin =
        numero(linha.capacidade?.capacidadeMin);

    const tempoPlanejadoMin =
        numero(linha.resumo?.tempoTotalMin);

    const setupTotalMin =
        numero(linha.resumo?.setupTotalMin);

    const saldoMin =
        capacidadeMin - tempoPlanejadoMin;

    const utilizacaoPercentual =
        capacidadeMin > 0
            ? Math.round(
                (tempoPlanejadoMin / capacidadeMin) * 100
            )
            : 0;

    const status =
        classificarStatus(
            utilizacaoPercentual,
            tempoPlanejadoMin
        );

    linha.capacidade = {

        ...(linha.capacidade || {}),

        capacidadeMin,

        tempoPlanejadoMin,

        setupTotalMin,

        saldoMin,

        utilizacaoPercentual,

        status,

        statusTexto:
            traduzirStatus(status)

    };

}

function recalcularPlanejamento(
    planejamento
) {

    planejamento.linhas.forEach(linha => {

        recalcularResumoLinha(linha);

        recalcularCapacidadeLinha(linha);

    });

    const resumo = {

        totalLinhas: planejamento.linhas.length,

        totalProdutos: 0,

        demandaTotal: 0,

        tempoTotalMin: 0,

        setupTotalMin: 0

    };

    const capacidade = {

        capacidadeTotalMin: 0,

        tempoPlanejadoTotalMin: 0,

        setupTotalMin: 0,

        saldoTotalMin: 0,

        utilizacaoGeralPercentual: 0,

        linhasOK: 0,

        linhasOciosas: 0,

        linhasAtencao: 0,

        linhasEstouradas: 0,

        linhasSemCarga: 0

    };

    planejamento.linhas.forEach(linha => {

        resumo.totalProdutos +=
            numero(linha.resumo?.totalProdutos);

        resumo.demandaTotal +=
            numero(linha.resumo?.demandaTotal);

        resumo.tempoTotalMin +=
            numero(linha.resumo?.tempoTotalMin);

        resumo.setupTotalMin +=
            numero(linha.resumo?.setupTotalMin);

        capacidade.capacidadeTotalMin +=
            numero(linha.capacidade?.capacidadeMin);

        capacidade.tempoPlanejadoTotalMin +=
            numero(linha.capacidade?.tempoPlanejadoMin);

        capacidade.setupTotalMin +=
            numero(linha.capacidade?.setupTotalMin);

        if (linha.capacidade?.status === "OK") {
            capacidade.linhasOK += 1;
        }

        if (linha.capacidade?.status === "OCIOSA") {
            capacidade.linhasOciosas += 1;
        }

        if (linha.capacidade?.status === "ATENCAO") {
            capacidade.linhasAtencao += 1;
        }

        if (linha.capacidade?.status === "ESTOURADA") {
            capacidade.linhasEstouradas += 1;
        }

        if (linha.capacidade?.status === "SEM_CARGA") {
            capacidade.linhasSemCarga += 1;
        }

    });

    capacidade.saldoTotalMin =
        capacidade.capacidadeTotalMin -
        capacidade.tempoPlanejadoTotalMin;

    capacidade.utilizacaoGeralPercentual =
        capacidade.capacidadeTotalMin > 0
            ? Math.round(
                (
                    capacidade.tempoPlanejadoTotalMin /
                    capacidade.capacidadeTotalMin
                ) * 100
            )
            : 0;

    planejamento.resumo =
        resumo;

    planejamento.capacidade =
        capacidade;

}

function mapearLinhasPorNome(planejamento) {

    const mapa =
        new Map();

    (planejamento.linhas || []).forEach(linha => {

        mapa.set(
            linha.linha,
            linha
        );

    });

    return mapa;

}

function criarResumoLinhasSimuladas(
    planejamentoAntes,
    planejamentoDepois,
    movimentosAplicados
) {

    const mapaAntes =
        mapearLinhasPorNome(
            planejamentoAntes
        );

    const mapaDepois =
        mapearLinhasPorNome(
            planejamentoDepois
        );

    const movimentosPorLinha =
        new Map();

    (movimentosAplicados || []).forEach(movimento => {

        const origem =
            movimento.origem?.linha;

        const destino =
            movimento.destino?.linha;

        if (origem) {

            if (!movimentosPorLinha.has(origem)) {

                movimentosPorLinha.set(
                    origem,
                    {
                        saiu: 0,
                        entrou: 0
                    }
                );

            }

            movimentosPorLinha.get(origem).saiu += 1;

        }

        if (destino) {

            if (!movimentosPorLinha.has(destino)) {

                movimentosPorLinha.set(
                    destino,
                    {
                        saiu: 0,
                        entrou: 0
                    }
                );

            }

            movimentosPorLinha.get(destino).entrou += 1;

        }

    });

    const nomesLinhas =
        new Set([
            ...mapaAntes.keys(),
            ...mapaDepois.keys()
        ]);

    return Array.from(nomesLinhas)
        .map(nomeLinha => {

            const antes =
                mapaAntes.get(nomeLinha) || {};

            const depois =
                mapaDepois.get(nomeLinha) || {};

            const mov =
                movimentosPorLinha.get(nomeLinha) || {
                    saiu: 0,
                    entrou: 0
                };

            const saldoAntes =
                numero(antes.capacidade?.saldoMin);

            const saldoDepois =
                numero(depois.capacidade?.saldoMin);

            const tempoAntes =
                numero(antes.capacidade?.tempoPlanejadoMin);

            const tempoDepois =
                numero(depois.capacidade?.tempoPlanejadoMin);

            return {

                linha:
                    nomeLinha,

                produtosAntes:
                    numero(antes.resumo?.totalProdutos),

                produtosDepois:
                    numero(depois.resumo?.totalProdutos),

                saiu:
                    mov.saiu,

                entrou:
                    mov.entrou,

                saldoAntesMin:
                    saldoAntes,

                saldoDepoisMin:
                    saldoDepois,

                variacaoSaldoMin:
                    saldoDepois - saldoAntes,

                tempoAntesMin:
                    tempoAntes,

                tempoDepoisMin:
                    tempoDepois,

                variacaoTempoMin:
                    tempoDepois - tempoAntes,

                statusAntes:
                    antes.capacidade?.status || "",

                statusDepois:
                    depois.capacidade?.status || "",

                statusTextoAntes:
                    antes.capacidade?.statusTexto || "",

                statusTextoDepois:
                    depois.capacidade?.statusTexto || ""

            };

        })
        .sort((a, b) => {

            const impactoA =
                Math.abs(a.variacaoSaldoMin) +
                a.saiu +
                a.entrou;

            const impactoB =
                Math.abs(b.variacaoSaldoMin) +
                b.saiu +
                b.entrou;

            return impactoB - impactoA;

        });

}

export function aplicarBalanceamentoSimulado(
    planejamentoComCapacidade,
    simulacaoBalanceamento
) {

    const planejamentoSimulado =
        clonarPlanejamento(
            planejamentoComCapacidade
        );

    const movimentos =
        simulacaoBalanceamento?.movimentosSelecionados || [];

    const movimentosAplicados = [];

    const movimentosComErro = [];

    movimentos.forEach(movimento => {

        const linhaOrigem =
            encontrarLinha(
                planejamentoSimulado,
                movimento.origem?.linha
            );

        const linhaDestino =
            encontrarLinha(
                planejamentoSimulado,
                movimento.destino?.linha
            );

        if (!linhaOrigem || !linhaDestino) {

            movimentosComErro.push({

                movimento,

                motivo:
                    "Linha origem ou destino não encontrada no planejamento."

            });

            return;

        }

        const produtoRemovido =
            removerProdutoDaOrigem(
                linhaOrigem,
                movimento.codigo
            );

        if (!produtoRemovido) {

            movimentosComErro.push({

                movimento,

                motivo:
                    "Produto não encontrado na linha de origem."

            });

            return;

        }

        const produtoDestino =
            prepararProdutoParaDestino(
                produtoRemovido,
                movimento
            );

        adicionarProdutoNoDestino(
            linhaDestino,
            produtoDestino
        );

        movimentosAplicados.push(
            movimento
        );

    });

    recalcularPlanejamento(
        planejamentoSimulado
    );

    const comparativo =
        calcularComparativo(
            planejamentoComCapacidade,
            planejamentoSimulado
        );

    const resumoLinhas =
        criarResumoLinhasSimuladas(
            planejamentoComCapacidade,
            planejamentoSimulado,
            movimentosAplicados
        );

    return {

        planejamentoOriginal:
            planejamentoComCapacidade,

        planejamentoSimulado,

        movimentosAplicados,

        movimentosComErro,

        comparativo,

        resumoLinhas,

        resumo: {

            movimentosAplicados:
                movimentosAplicados.length,

            movimentosComErro:
                movimentosComErro.length

        }

    };

}

function extrairResumoComparativo(planejamento) {

    return {

        linhasEstouradas:
            numero(planejamento.capacidade?.linhasEstouradas),

        linhasAtencao:
            numero(planejamento.capacidade?.linhasAtencao),

        linhasOK:
            numero(planejamento.capacidade?.linhasOK),

        linhasOciosas:
            numero(planejamento.capacidade?.linhasOciosas),

        saldoTotalMin:
            numero(planejamento.capacidade?.saldoTotalMin),

        tempoPlanejadoTotalMin:
            numero(planejamento.capacidade?.tempoPlanejadoTotalMin),

        utilizacaoGeralPercentual:
            numero(planejamento.capacidade?.utilizacaoGeralPercentual)

    };

}

function calcularVariacao(
    antes,
    depois
) {

    return {

        linhasEstouradas:
            depois.linhasEstouradas - antes.linhasEstouradas,

        linhasAtencao:
            depois.linhasAtencao - antes.linhasAtencao,

        linhasOK:
            depois.linhasOK - antes.linhasOK,

        linhasOciosas:
            depois.linhasOciosas - antes.linhasOciosas,

        saldoTotalMin:
            depois.saldoTotalMin - antes.saldoTotalMin,

        tempoPlanejadoTotalMin:
            depois.tempoPlanejadoTotalMin - antes.tempoPlanejadoTotalMin,

        utilizacaoGeralPercentual:
            depois.utilizacaoGeralPercentual - antes.utilizacaoGeralPercentual

    };

}

function calcularComparativo(
    planejamentoAntes,
    planejamentoDepois
) {

    const antes =
        extrairResumoComparativo(
            planejamentoAntes
        );

    const depois =
        extrairResumoComparativo(
            planejamentoDepois
        );

    const variacao =
        calcularVariacao(
            antes,
            depois
        );

    return {

        antes,

        depois,

        variacao,

        melhorou: {

            linhasEstouradas:
                depois.linhasEstouradas < antes.linhasEstouradas,

            linhasAtencao:
                depois.linhasAtencao < antes.linhasAtencao,

            saldoTotal:
                depois.saldoTotalMin > antes.saldoTotalMin,

            utilizacao:
                depois.utilizacaoGeralPercentual <= antes.utilizacaoGeralPercentual

        }

    };

}