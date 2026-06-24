# Regras de Negócio

## Base Técnica

A Base Técnica é composta por um arquivo TXT contendo todos os produtos da empresa.

Cada produto possui:

- Código
- Descrição
- Linha
- Categoria
- Tempo por caixa
- Demais informações necessárias para o planejamento

---

# Pedidos

Os pedidos serão importados através de um arquivo CSV.

Cada pedido possui:

- Código
- Quantidade
- Unidade
- Cliente

---

# Prioridades

Quando existir prioridade:

Pedido Final = Pedido + Prioridade

---

# Tempo de Produção

O tempo informado na Base Técnica representa o tempo necessário para produzir 1 caixa.

Exemplo:

Tempo Base = 10 minutos

Pedido = 5 caixas

Tempo Total = 50 minutos

A relação é linear.

---

# Setup

Os tempos de setup são definidos através da Setup Matrix.

Sempre que houver mudança de categoria será aplicado o setup correspondente.

---

# Balanceamento

O sistema deverá distribuir automaticamente os produtos entre as linhas buscando:

- Menor tempo total
- Menor setup
- Melhor utilização da capacidade

---

# Alterações

Toda alteração realizada pelo usuário deverá ser registrada no histórico do sistema.