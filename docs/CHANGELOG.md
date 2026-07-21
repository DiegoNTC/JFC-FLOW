# CHANGELOG - Matéria-Prima Consolidada

## feat: adiciona relatório consolidado de matéria-prima

- Adicionada importação de planilha XLSX de matéria-prima.
- Colunas lidas:
  - materia prima
  - produto venda
  - codigo produto
  - linha
  - peso_bruto
  - peso liquido
- Adicionado repositório local para manter a base importada no navegador.
- Adicionado relatório consolidado por linha e matéria-prima.
- Adicionado detalhamento por produto dentro do PDF.
- Ao gerar o PDF da Ordem de Produção por linha, o sistema também gera o PDF consolidado de matéria-prima da mesma linha.
- Regra aplicada: pesos negativos da planilha viram consumo positivo no relatório.
- Regra aplicada: mesma matéria-prima dentro da mesma linha é somada em um único total.
