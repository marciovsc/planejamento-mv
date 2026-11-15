/**
 * Código do Google Apps Script que guarda os dados do Finanças MV no Google Drive.
 * Este é o código completo implantado (substitui tudo no editor).
 *
 * A chave NÃO fica no código: ela fica em
 *   Configurações do projeto (engrenagem) → Propriedades do script → CHAVE_MV
 * Sem a propriedade CHAVE_MV configurada, a planilha recusa TODOS os pedidos.
 */
const FILENAME = 'planejamento-mv-dados.json';

// ---- PROTEÇÃO ----
function chaveValida_(e) {
  const esperada = PropertiesService.getScriptProperties().getProperty('CHAVE_MV');
  const recebida = (e && e.parameter && e.parameter.key) || '';
  if (!esperada) return false; // sem chave configurada, recusa tudo
  return recebida === esperada;
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- LER DADOS ----
function doGet(e) {
  if (!chaveValida_(e)) return resposta_({ erro: 'nao_autorizado' });
  try {
    const files = DriveApp.getFilesByName(FILENAME);
    if (files.hasNext()) {
      const content = files.next().getBlob().getDataAsString();
      return ContentService.createTextOutput(content)
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput('{}')
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return resposta_({ error: err.message });
  }
}

// ---- SALVAR DADOS ----
function doPost(e) {
  if (!chaveValida_(e)) return resposta_({ erro: 'nao_autorizado' });
  try {
    const data = e.postData.contents;

    // Trava contra apagão: só aceita dados válidos com pelo menos um mês
    let parsed;
    try { parsed = JSON.parse(data); } catch (x) { return resposta_({ error: 'dados_invalidos' }); }
    if (!parsed || !Array.isArray(parsed.months) || parsed.months.length === 0) {
      return resposta_({ error: 'dados_vazios_recusados' });
    }

    const files = DriveApp.getFilesByName(FILENAME);
    if (files.hasNext()) {
      files.next().setContent(data);
    } else {
      DriveApp.createFile(FILENAME, data, MimeType.PLAIN_TEXT);
    }
    return resposta_({ ok: true });
  } catch (err) {
    return resposta_({ error: err.message });
  }
}
