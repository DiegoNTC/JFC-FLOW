/**
 * ======================================================
 * JFC FLOW
 * Pedido Consolidator
 * ======================================================
 */

export function consolidarPedidos(listaPedidos) {

    const mapa = new Map();

    listaPedidos.forEach(pedido => {

        const codigo = pedido.codigo;

        if (!mapa.has(codigo)) {

            mapa.set(codigo, {

                ...pedido

            });

        }

        else {

            const existente =
                mapa.get(codigo);

            existente.previa +=
                pedido.previa;

            existente.prioridade +=
                pedido.prioridade;

            existente.pedido +=
                pedido.pedido;

            existente.demandaFinal +=
                pedido.demandaFinal;

        }

    });

    return Array.from(
        mapa.values()
    );

}