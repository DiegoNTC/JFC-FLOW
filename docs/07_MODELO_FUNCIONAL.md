# JFC FLOW

# Modelo Funcional

Versão: 1.0

---

# Objetivo

O JFC FLOW é uma plataforma de Planejamento e Sequenciamento de Produção desenvolvida para centralizar toda a programação operacional da fábrica.

O sistema será responsável por transformar informações de pedidos em uma programação otimizada para o chão de fábrica.

---

# Fluxo Geral

Base Técnica (TXT)

↓

Importador

↓

Product Repository

↓

Pedido CSV

↓

Consolidação

↓

Planejamento

↓

Balanceamento

↓

Sequenciamento

↓

Dashboard

↓

Produção

---

# Base Técnica

A Base Técnica é a memória operacional da empresa.

Cada registro contém:

Código

Descrição

Linha

Categoria

Tempo por Caixa

Status

---

# Pedido

O pedido é importado através de um arquivo CSV.

Cada pedido possui:

Código

Quantidade

Cliente

Prioridade

---

# Consolidação

Caso existam pedidos repetidos:

Os pedidos serão agrupados pelo código do produto.

---

# Prioridade

Caso exista prioridade:

Pedido Final = Pedido + Prioridade

---

# Tempo

O tempo informado na Base Técnica representa a produção de 1 caixa.

Exemplo:

Tempo Base = 10 minutos

Pedido = 5 caixas

Tempo Total = 50 minutos

A relação é linear.

---

# Planejamento

O planejamento será responsável por:

Calcular tempo

Calcular carga

Distribuir linhas

Gerar sequência

---

# Balanceamento

Objetivos:

Reduzir diferenças entre linhas

Reduzir setup

Melhor utilizar capacidade

---

# Sequenciamento

O sequenciamento será baseado em:

Prioridade

Categoria

Setup

Capacidade

Tempo

---

# Dashboard

O Dashboard deverá apresentar:

Pedidos do dia

Tempo total

Capacidade

Setup

Status

Alertas

Gantt Geral

---

# Histórico

Toda alteração deverá ser registrada.

Mudanças da Base Técnica serão armazenadas por data.

Exemplo:

TXT

↓

Snapshot

↓

Histórico

↓

Nova Base Técnica

---

# Visão de Longo Prazo

O JFC FLOW será a plataforma oficial de Planejamento Operacional da empresa.

Permitindo:

Integração ERP

Integração API

Business Intelligence

Dashboard em Tempo Real

Simulação de Cenários

Histórico Operacional

Indicadores Gerenciais