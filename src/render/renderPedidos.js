export function renderPedidos(
    pedidos
) {

    const container =
        document.getElementById(
            "pedidoContainer"
        );

    container.innerHTML = "";

    const tabela =
        document.createElement("table");

    tabela.style.width = "100%";
    tabela.style.marginTop = "20px";

    tabela.innerHTML = `

        <thead>

            <tr>

                <th>Código</th>

                <th>Produto</th>

                <th>Demanda</th>

            </tr>

        </thead>

        <tbody>

        ${pedidos.map(

            item => `

                <tr>

                    <td>${item.codigo}</td>

                    <td>${item.produto}</td>

                    <td>

                        ${
                            item.pedidos > 0

                            ? item.pedidos + item.prioridade

                            : item.previa + item.prioridade
                        }

                    </td>

                </tr>

            `

        ).join("")}

        </tbody>

    `;

    container.appendChild(
        tabela
    );

}