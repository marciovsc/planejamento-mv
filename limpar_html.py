"""
limpar_html.py
Roda antes do deploy para limpar conteúdo hardcoded do browser.
Uso: python limpar_html.py index.html
"""
import re, sys, shutil
from datetime import datetime

if len(sys.argv) < 2:
    print("Uso: python limpar_html.py index.html")
    sys.exit(1)

arquivo = sys.argv[1]

# Backup automático
backup = arquivo.replace('.html', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html')
shutil.copy(arquivo, backup)
print(f"Backup criado: {backup}")

with open(arquivo, 'r', encoding='utf-8') as f:
    html = f.read()

linhas_antes = len(html.splitlines())

# 1. Limpa conteúdo hardcoded do tab-painel
html = re.sub(
    r'(<div id="tab-painel"[^>]*>)[\s\S]*?(<div id="tab-marcio")',
    r'\1\n  \2',
    html
)

# 2. Limpa tab-fixos
html = re.sub(
    r'(<div id="tab-fixos"[^>]*>)[\s\S]*?(<div id="tab-meses")',
    r'<div id="tab-fixos" class="page"></div>\n  \2',
    html
)

# 3. Garante que só tab-painel começa como active
html = re.sub(r'<div id="tab-(\w+)" class="page active">', r'<div id="tab-\1" class="page">', html)
html = html.replace('<div id="tab-painel" class="page">', '<div id="tab-painel" class="page active">')

# 4. Corrige Chart.js para CDN
html = html.replace(
    '<script src="./index_files/chart.umd.min.js.download"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>'
)

# 5. Remove label hardcoded do mês
html = re.sub(
    r'<span class="month-label" id="month-label">[^<]*</span>',
    '<span class="month-label" id="month-label"></span>',
    html
)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(html)

linhas_depois = len(html.splitlines())
print(f"Pronto! {linhas_antes} → {linhas_depois} linhas")
print("Arquivo pronto para deploy.")
  