/**
 * ======================================================
 * JFC FLOW
 * Capacity Service
 * ======================================================
 */

export function analisarCapacidade(

    resumoLinhas,

    capacidadePorLinha

) {

    return resumoLinhas.map(

        linha => {

            const capacidade =

                capacidadePorLinha[linha.linha] || 0;

            const ocupacao =

                capacidade > 0

                    ? (linha.tempoTotal / capacidade) * 100

                    : 0;

            let status = "OK";

            if (ocupacao >= 100) {

                status = "CRITICO";

            }

            else if (ocupacao >= 85) {

                status = "ATENCAO";

            }

            return {

                ...linha,

                capacidade,

                ocupacao,

                status

            };

        }

    );

}