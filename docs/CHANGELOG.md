# CHANGELOG

## Remoção definitiva do Sequenciador Manual Legado

- Removida a sidebar antiga de SKUs fixos.
- Removida a tela `Sequenciamento Manual / Simulação`.
- Removidos os botões antigos `Otimizar Sequência` e `Balancear Linhas` da área manual.
- Removidas as dropzones antigas de L1/L2 e Gantt legado.
- Mantidos os módulos principais: CSV, TXT, Cadastro Mestre, Famílias, Planejamento Real, Sequenciamento por Família, Plano Final, Timeline, Balanceamento e PDF.
- Incluído CSS completo modularizado para evitar tela sem estilo após substituição.
- Mantido arquivo `06-sequenciamento-manual-gantt.css` vazio/de segurança para não quebrar imports antigos.

## Persistência por JSON no projeto

- Adicionado carregamento automático de `data/cadastro_mestre.json`.
- Adicionado carregamento automático de `data/familias_setup.json`.
- Adicionado carregamento automático de `data/sequenciamento_manual_familias.json`.
- Adicionado painel para exportar JSONs e recarregar os dados oficiais do GitHub.
- O `localStorage` passa a funcionar como rascunho/cache local, não como fonte oficial definitiva.

## Base técnica nativa em JSON

- Adicionado carregamento automático de `data/base_tecnica.json`.
- A importação diária passa a depender apenas do CSV quando a base técnica já estiver carregada do projeto.
- O botão de TXT continua disponível para manutenção/atualização da base técnica.
- Adicionado botão para exportar `base_tecnica.json` após importar um TXT novo.
- Ao subir CSV, o sistema tenta sincronizar automaticamente com a Base Técnica, Cadastro Mestre e Famílias já carregados dos JSONs.

## fix: garante carregamento da base técnica nativa

- Corrige bloqueio onde alterações locais pendentes no Cadastro Mestre/Famílias impediam o carregamento da Base Técnica via JSON.
- Adiciona cache local da Base Técnica para uso quando o JSON já foi carregado anteriormente.
- Torna a leitura de `data/base_tecnica.json` mais flexível, aceitando diferentes formatos de exportação.


## Fix - CSV carrega Base Técnica nativa antes de sincronizar

- Ajustado o fluxo do botão de importação de CSV.
- Ao importar o CSV, o sistema força a leitura de `data/base_tecnica.json`.
- Após carregar a Base Técnica do JSON, a sincronização automática é executada.
- O TXT passa a ser necessário apenas para manutenção da Base Técnica.
