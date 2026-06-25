import { importarCSV } from "../../importers/csvImporter.js";

import { consolidarPedidos } from "../services/pedidoConsolidator.js";

import { gerarPlanejamento } from "../services/planningService.js";

export function processarPedidos(
    conteudoCSV
) {

    const pedidos =
        importarCSV(conteudoCSV);

    const consolidados =
        consolidarPedidos(pedidos);

    const planejamento =
        gerarPlanejamento(
            consolidados
        );

    return planejamento;

}