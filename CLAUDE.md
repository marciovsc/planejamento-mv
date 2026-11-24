# Finanças MV — manual do projeto

App pessoal de controle financeiro do Márcio. Também registra os gastos da Raíssa
feitos nos cartões do Márcio (ela não usa o app para as finanças dela). É um app web
de **um arquivo só** (`index.html`), instalável no celular (PWA), com os dados
sincronizados numa "nuvem" feita com Google Apps Script + Google Drive.

> Escreva para o usuário sempre em **português do Brasil**, em linguagem simples
> (ele não é programador). Explique o que mudou na prática, não o código.

---

## Onde fica cada parte do sistema

| O quê | Onde |
|---|---|
| Código e histórico de mudanças | GitHub: `marciovsc/planejamento-mv` (aba **Pull requests → Closed** mostra tudo o que foi feito) |
| Nuvem (código que salva os dados) | script.google.com, projeto **"Finanças MV — Nuvem"** (antes chamado "Projeto sem título"). Cópia de referência do código: `nuvem/protecao-apps-script.gs` |
| Dados | Google Drive, arquivo `planejamento-mv-dados.json` |
| Chave da nuvem | Apps Script → ⚙️ Configurações do projeto → Propriedades do script → `CHAVE_MV`. Guardar também num gerenciador de senhas. **Nunca** colocar a chave no código nem no repositório |
| App publicado | O link que o Márcio abre no celular (publicado a partir da `main`) |

---

## Regras de trabalho (combinadas com o Márcio)

1. **Nunca enviar direto para a `main`.** A `main` é o app que ele e a Raíssa usam todo dia.
2. Trabalhar no branch de trabalho da sessão, gravar (commit) e abrir um **pull request**
   para a `main`. O Márcio revisa e clica em **Merge** ele mesmo.
3. Depois do merge, recomeçar o branch de trabalho a partir da `main` atualizada.
4. **Testar antes de abrir o PR**: abrir o `index.html` no Playwright (Chromium já instalado),
   em tela de celular (390×844), passando pelas abas afetadas, e checar erros de JavaScript.
   - Bloquear `script.google.com` nos testes (ou simular a nuvem) para **nunca** gravar nos dados reais.
   - O CDN pode estar bloqueado: servir o Chart.js a partir de `index_files/chart.umd.min.js.download`.
5. Mostrar prints (antes/depois) quando a mudança for visual.
6. Mudanças que mexem com dados ou com a nuvem: explicar o risco e pedir confirmação antes.
7. Arquivos temporários (prints, scripts de teste) **não** vão para o repositório.

---

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | O app inteiro: HTML, CSS (no `<style>`) e JavaScript (no `<script>` final) |
| `relatorio-mv.html` | Relatório para imprimir/compartilhar; lê os mesmos dados da nuvem |
| `manifest.webmanifest`, `sw.js`, `icons/` | App instalável (PWA) e funcionamento offline |
| `nuvem/protecao-apps-script.gs` | Cópia do código implantado no Google Apps Script |
| `index_files/` | Cópia local do Chart.js (usada só nos testes) |
| `limpar_html.py` | Script antigo de limpeza de quando o HTML era salvo pelo navegador; hoje praticamente não é mais necessário |

---

## Como os dados funcionam

- Estado global `G` (salvo no `localStorage` com a chave `gastos_mv` e na nuvem):
  - `G.months[]`: um objeto por mês, com nome no formato `"Novembro 2026"`
  - `G.current`: índice do mês aberto no app
  - `G.cartoes[]`: cartões físicos `{banco:'nu'|'c6', digitos:'1234'}`
- Cada mês tem listas de lançamentos:
  - `mnu` / `mc6`: Márcio no Nubank / C6
  - `rnu` / `rc6`: Raíssa no Nubank / C6
  - `fix`: fixos do Márcio (podem ter `cartao`, `venc`, `pago`)
  - `entradas`: entradas do Márcio (salário com `recorrente:true`)
  - `conf`: marcações da aba Conferir (`'ok'` / `'div'`), sincronizadas na nuvem
- Item: `{desc, val, data:'dd/mm', cat, cartao, recorrente}`. Parcelas ficam na descrição: `"Loja 3-10"` = parcela 3 de 10.
- Ao lançar/editar: **parcelas** vão para os meses seguintes que já existem (`propagarParcelas`) e **recorrentes** também (`propagarRecorrente`, sem duplicar). Editar um recorrente leva nome, valor, categoria, cartão e data (mesmo dia, no mês de cada destino) para os meses seguintes (`propagarRecorrenteEdicao`); desmarcar "recorrente" ou excluir pergunta se remove dos meses seguintes. Fixos se comportam como recorrentes (todo fixo se repete; o `pago` de cada mês é mantido) e entradas recorrentes também. Toda propagação mostra `avisoPropagacao()` (aviso grande, separado do aviso da nuvem); se não há meses seguintes, avisa que será levado ao criar o próximo mês. Parcelas mantêm a data da compra original. Meses anteriores nunca são alterados. Ao criar um mês novo, `criarMesInteligente()` leva recorrentes, parcelas e fixos do mês anterior.
- **Mês de lançamento:** as compras de "Novembro" entram na fatura que **vence no mês seguinte**.
- Vencimentos: Nubank dia 9; C6 dia 5 até a fatura de Nov/2026 e **dia 15 a partir da fatura de Dez/2026**
  (`diaVencimento()`). Fechamento estimado em 7 dias antes do vencimento (`FECHA_ANTES`), passando para o próximo dia útil se cair em fim de semana ou feriado. Feriados municipais da cidade do Márcio ficam em `FERIADOS_LOCAIS` (hoje: 08/12). Confirmado: fatura C6 de Dez/2026 fecha 09/12 e vence 15/12.
- Formas de pagamento sem cartão físico (`FORMAS_VIRTUAIS`), sempre disponíveis:
  - `PIX_CREDITO` → Nubank (só existe no Nubank)
  - `BOLETO_CREDITO` → Nubank (código antigo, mantido)
  - `BOLETO_CREDITO_C6` → C6
  - Use `bancoDoCartao(cod)` para saber o banco de qualquer lançamento ou fixo. `null` = fora do cartão.
- Painel: **Gastos = Nubank MV + C6 MV + Fixos fora do cartão** (os fixos cobrados no cartão já estão dentro dos quadros dos bancos).

## Nuvem

- `CLOUD_URL` (Apps Script) com `GET` para ler e `POST` (texto JSON) para gravar.
- Toda chamada envia `?key=` com a chave salva no aparelho (`localStorage` `mv_chave_nuvem`).
- Sem chave válida a nuvem responde `{"erro":"nao_autorizado"}` e o app pede a chave, **sem sobrescrever nada**.
- A nuvem recusa gravar dados vazios ou sem meses (trava contra apagão).
- Para alterar o Apps Script: editar, salvar e **Implantar → Gerenciar implantações → editar → Nova versão**.
  Nunca "Nova implantação" (muda o link e o app perde a conexão).

## Funções principais (para orientar mudanças)

- Abas: `goTab(id)` / `renderTab(id)`. Abas do menu "Mais" em `MORE_TABS`.
- Painel: `renderPainel()`; gráfico "Próximos meses": `calcProjecao()`, `htmlProjecao()`, `drawProjecao()`
  (começa no **mês atual do calendário**; meses existentes usam dados reais, os demais são estimados).
- Busca global: `renderBusca()`, `buscaResultados()`.
- Importar fatura do C6 (aba `importar`, botão na Conferir): `impArquivo()` lê o `.csv` ou o `.zip` com senha do e-mail
  (ZipCrypto + `DecompressionStream`, tudo no aparelho, senha nunca salva); `processarFaturaCSV()` lê as colunas do C6
  (`Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;…;Valor (em R$)`, valor com ponto);
  nome do arquivo `Fatura_AAAA-MM-DD.csv` = vencimento, logo lançamentos do mês anterior. `calcularImportacao()` casa cada
  compra com `mc6`, `rc6` e fixos do C6, inclusive **compras divididas** (uma linha da fatura = Márcio + Raíssa somados).
  O cartão usado não decide quem pagou; para lançamentos novos a pessoa sugerida vem do nome no cartão e de
  `FINAL_PESSOA_PADRAO` (1507 → Márcio, 8861 → Raíssa), e dá para trocar ou dividir na lista. Valores negativos
  (pagamentos/estornos) não entram. Nada é gravado até tocar em "Marcar conferência" ou "Adicionar selecionados".
- Simulador "Posso comprar?": `simular()`, `renderCompra()`.
- Conferir: `renderConferencia()`, `loadConf()` / `saveConf()`.
- Tema claro/escuro: variáveis em `:root` e `:root[data-theme="light"]`; `aplicarTema()`, `setTema()`;
  preferência em `localStorage` `mv_tema` (`auto` | `light` | `dark`). Cartões coloridos usam a regra de
  "ilha" (`.hero`, `.fatura-card`, `[style*="--island"]`) para manter texto claro nos dois temas.
  Em código novo, use as variáveis de cor (`var(--text)`, `var(--surface)`…), nunca cores escuras fixas.
- Gráficos (Chart.js): ler cores com `cssVar('--...')` na hora de desenhar. Paleta das séries validada para
  contraste e daltonismo: fixos `#3987e5`, recorrentes `#d95926`, parcelas `#9085e9`, avulsos `#199e70`.
- Salvar: `save()` grava no aparelho e agenda o envio para a nuvem (1 s depois).
