/**
 * ======================================================
 * JFC FLOW
 * Resumo por Linha
 * ======================================================
 */

export function gerarResumoLinhas(
    planejamento
) {

    const resumo = {};

    planejamento.forEach(item => {

        const linha =
            item.linha;

        if (!resumo[linha]) {

            resumo[linha] = {

                linha,

                produtos: 0,

                tempoTotal: 0

            };

        }

        resumo[linha].produtos++;

        resumo[linha].tempoTotal +=
            item.tempoTotal;

    });

    return Object.values(resumo);

}