# CHANGELOG

## v0.5.0

Versão inicial

Funcionalidades:

- Drag & Drop
- Balanceamento
- Sequenciamento
- Gantt
- KPIs

---

## v0.6.0 (Em desenvolvimento)

Novidades previstas:

- Base Técnica dinâmica
- Importador TXT
- Product Repository
- Histórico da Base Técnica
---

## v0.6.2 - Cadastro Mestre operacional

Ajustes aplicados na continuidade do JFC FLOW:

- Cadastro Mestre agora possui campos operacionais para o PCP:
  - `linhaSequenciamento`;
  - `familiaSequenciamento`;
  - `usarLinhaCadastro`;
  - `linhasPermitidas`.
- Tela do Cadastro Mestre passou a exibir a lista de produtos cadastrados.
- Adicionados filtros por produto/código, linha, família e itens sem família/linha.
- Salvamento do cadastro mantém compatibilidade com `linhaPrincipal`, `familiaSetup` e `linhasAlternativas`.
- Produtos pendentes cadastrados manualmente já nascem com linha/família de sequenciamento.
- Rotas técnicas preservam os novos campos para uso no Planejamento Real e Sequenciamento.
