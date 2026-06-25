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


# Regras de Negócio - JFC FLOW

## Estrutura Física da Fábrica

### Zona Negra

Responsável pelas operações de corte e preparação inicial dos produtos.

### Zona Branca

Responsável pelos processos de higienização e embalagem.

### Expedição

Responsável pela montagem de caixas, paletização e envio para logística.

---

## Identificação dos Produtos

* O código do produto é a chave principal do sistema.
* Todas as telas devem exibir:

  * Código
  * Descrição

Exemplo:

168 - ALFACE AMERICANA 48MM CX 4KG

---

## Base Técnica

A Base Técnica é armazenada em arquivo TXT.

Cada registro possui:

* Código
* Descrição
* Linha
* Tempo de Produção
* Sequência

A Base Técnica pode ser alterada pelos supervisores.

Todas as alterações devem possuir histórico.

---

## Pedidos

Origem:

CSV diário.

Regra de cálculo:

Se existir pedido:

Demanda Final = Pedido + Prioridade

Se não existir pedido:

Demanda Final = Prévia + Prioridade

---

## Categorias Consideradas

* institucional
* processados
* mcdonalds

Outras categorias devem ser ignoradas pelo sistema.

---

## Planejamento

O sistema deve calcular:

* Linha produtiva
* Tempo unitário
* Tempo total
* Capacidade utilizada
* Sequenciamento
* Balanceamento

---

## Histórico

Toda alteração da Base Técnica deve gerar histórico contendo:

* Data
* Usuário
* Campo alterado
* Valor anterior
* Valor novo
