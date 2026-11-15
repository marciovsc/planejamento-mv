/**
 * PROTEÇÃO DA NUVEM — Finanças MV
 *
 * Cole este bloco no FINAL do código do seu Google Apps Script.
 *
 * Antes de colar:
 *   1. Renomeie a sua função  doGet(e)   para  doGetOriginal(e)
 *   2. Renomeie a sua função  doPost(e)  para  doPostOriginal(e)
 *
 * A chave NÃO fica no código: ela fica em
 *   Configurações do projeto (engrenagem) → Propriedades do script → CHAVE_MV
 *
 * Sem a propriedade CHAVE_MV configurada, a planilha recusa TODOS os pedidos.
 */

function chaveValida_(e) {
  var esperada = PropertiesService.getScriptProperties().getProperty('CHAVE_MV');
  var recebida = (e && e.parameter && e.parameter.key) || '';
  if (!esperada) return false;
  return recebida === esperada;
}

function naoAutorizado_() {
  return ContentService
    .createTextOutput(JSON.stringify({ erro: 'nao_autorizado' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (!chaveValida_(e)) return naoAutorizado_();
  return doGetOriginal(e);
}

function doPost(e) {
  if (!chaveValida_(e)) return naoAutorizado_();
  return doPostOriginal(e);
}
