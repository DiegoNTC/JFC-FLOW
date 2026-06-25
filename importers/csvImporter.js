/**
 * ======================================================
 * JFC FLOW
 * CSV IMPORTER
 * Versão 1.0
 * ======================================================
 */

export function importarCSV(conteudoCSV) {

    const linhas = conteudoCSV
        .split("\n")
        .filter(linha => linha.trim() !== "");

    const cabecalho = linhas[0]
        .split(",");

    const pedidos = [];

    for (let i = 1; i < linhas.length; i++) {

        const colunas = linhas[i]
            .split(",");

        const registro = {};

        cabecalho.forEach((campo, index) => {

            registro[campo.trim()] =
                colunas[index]?.trim();

        });

        const previa =
            Number(registro["Previa"] || 0);

        const prioridade =
            Number(
                registro["Pedidos Prioritarios"] || 0
            );

        const pedido =
            Number(registro["Pedidos"] || 0);

        const demandaFinal =
            pedido > 0
                ? pedido + prioridade
                : previa + prioridade;

        pedidos.push({

            codigo:
                registro["Código"],

            descricao:
                registro["Produto"],

            categoria:
                registro["Categoria"],

            previa,

            prioridade,

            pedido,

            demandaFinal

        });

    }

    return pedidos;

}