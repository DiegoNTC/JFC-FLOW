import {
    categoriasPermitidas
}
from "../core/categoriasPermitidas.js";

export function parseCSV(texto) {

    const linhas = texto
        .split("\n")
        .filter(l => l.trim());

    const resultado = [];

    for (let i = 1; i < linhas.length; i++) {

        const linha = linhas[i];

        const partes = linha.split(",");

        const codigo =
            partes[partes.length - 1]
                ?.trim();

        const categoria =
            partes[partes.length - 2]
                ?.trim();

        const producao =
            partes[partes.length - 3]
                ?.trim();

        const pedidos =
            partes[partes.length - 4]
                ?.trim();

        const prioridade =
            partes[partes.length - 5]
                ?.trim();

        const previa =
            partes[partes.length - 6]
                ?.trim();

        // FILTRO DE CATEGORIA
        if (
            !categoriasPermitidas.includes(
                (categoria || "")
                    .toLowerCase()
                    .trim()
            )
        ) {
            continue;
        }

        const data =
            partes[0]
                ?.trim();

        const produto = partes
            .slice(1, partes.length - 6)
            .join(",");

        resultado.push({

            data,

            produto,

            previa:
                Number(previa || 0),

            prioridade:
                Number(prioridade || 0),

            pedidos:
                Number(pedidos || 0),

            categoria,

            codigo

        });

    }

    return resultado;

}