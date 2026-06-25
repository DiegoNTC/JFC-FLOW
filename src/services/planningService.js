/**
 * ======================================================
 * JFC FLOW
 * Planning Service
 * ======================================================
 */

import { getByCodigo } from "../repositories/ProductRepository.js";

export function gerarPlanejamento(pedidos) {

    const planejamento = [];

    pedidos.forEach(pedido => {

        const produto =
            getByCodigo(pedido.codigo);

        if (!produto) {

            console.warn(
                `Produto não encontrado: ${pedido.codigo}`
            );

            return;
        }

        const tempoTotal =

            produto.tempoCaixa *

            pedido.demandaFinal;

        planejamento.push({

            codigo:
                produto.codigo,

            descricao:
                produto.descricao,

            linha:
                produto.linha,

            categoria:
                produto.categoria,

            demanda:
                pedido.demandaFinal,

            tempoUnitario:
                produto.tempoCaixa,

            tempoTotal

        });

    });

    return planejamento;

}