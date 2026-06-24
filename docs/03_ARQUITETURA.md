# Arquitetura do Projeto

## Estrutura

JFC FLOW

assets/
css/
docs/
importers/
memory/
repositories/
src/

---

## src/

actions/

Responsável pelas ações do usuário.

core/

Constantes, estado global e utilitários.

data/

Arquivos auxiliares do sistema.

dragdrop/

Movimentação dos SKUs.

gantt/

Renderização do Gantt.

render/

Renderização das telas.

services/

Regras de negócio e cálculos.

---

## importers/

Responsável pela leitura de arquivos TXT e CSV.

---

## repositories/

Responsável pelo acesso aos dados da Base Técnica.

---

## memory/

Responsável por armazenar snapshots e histórico da Base Técnica.

---

# Arquitetura

TXT

↓

Importer

↓

Repository

↓

Services

↓

Render

↓

Dashboard