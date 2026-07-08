## v0.6.9 - Correção de linha operacional no sequenciamento

- Corrigida regressão onde `linhaSequenciamento` do Cadastro Mestre só era respeitada quando `usarLinhaCadastro` estava marcado.
- O Planejamento Real agora preserva a linha técnica do TXT em campos próprios, mas usa a linha operacional do Cadastro Mestre para sequenciamento.
- O Sequenciamento por Família passa a priorizar `linhaSequenciamentoCadastro` / `linhaCadastroOperacional` antes de qualquer linha técnica.
- Produtos cadastrados corretamente na L3 devem aparecer no bloco da L3 quando estiverem no CSV do dia.
