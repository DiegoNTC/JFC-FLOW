import { parseCSV }
    from "./parseCSV.js";

import {
    renderPedidos
}
    from "../render/renderPedidos.js";

export function configurarImportacaoCSV() {

    const botao =
        document.getElementById(
            "importCsvBtn"
        );

    const input =
        document.getElementById(
            "csvInput"
        );

    botao.addEventListener(
        "click",
        () => {

            input.click();

        }
    );

    input.addEventListener(
        "change",
        async (event) => {

            const arquivo =
                event.target.files[0];

            if (!arquivo)
                return;

            const conteudo =
                await arquivo.text();

            console.log(
                "CSV carregado:"
            );

            const dados =
                parseCSV(conteudo);

            renderPedidos(
                dados
            );

        }
    );

}