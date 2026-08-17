// O Livro das Descobertas — recebe as partidas na planilha.
// Como instalar: veja o arquivo COMO-INSTALAR.md, nesta mesma pasta.
// Cole este arquivo INTEIRO no Apps Script (Ctrl+A e Ctrl+C aqui dentro).

var ABA = 'partidas';

var COLUNAS = ['quando', 'partida', 'evento', 'fase', 'acertos', 'total',
               'porcento', 'paginas', 'minutos', 'medalha', 'gabarito'];


function pegarAba() {
  var pl = SpreadsheetApp.getActiveSpreadsheet();
  var sh = pl.getSheetByName(ABA);
  if (!sh) {
    sh = pl.insertSheet(ABA);
    sh.appendRow(COLUNAS);
    sh.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}


function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// Recebe uma partida do jogo e escreve uma linha na planilha.
function doPost(e) {
  var trava = LockService.getScriptLock();
  try {
    // Numa feira varias criancas terminam ao mesmo tempo. Sem esta trava,
    // duas gravacoes simultaneas podem cair na mesma linha.
    trava.waitLock(20000);

    var d = JSON.parse(e.postData.contents);
    var sh = pegarAba();

    // Nao conta a mesma partida duas vezes. O jogo reenvia o que ficou
    // preso quando a rede caiu, entao repeticao e esperada.
    var ja = sh.getLastRow() > 1
      ? sh.getRange(2, 2, sh.getLastRow() - 1, 2).getValues()
      : [];
    for (var i = 0; i < ja.length; i++) {
      if (ja[i][0] === d.partida && ja[i][1] === d.evento) {
        return responder({ ok: true, repetida: true });
      }
    }

    sh.appendRow([
      d.quando || new Date().toISOString(),
      d.partida || '',
      d.evento || '',
      d.fase || 0,
      d.acertos || 0,
      d.total || 0,
      d.porcento || 0,
      d.paginas || 0,
      d.minutos || 0,
      d.medalha || '',
      // o apostrofo guarda como texto: sem ele, "0110" viraria o numero 110
      "'" + (d.gabarito || '')
    ]);
    return responder({ ok: true });

  } catch (err) {
    return responder({ ok: false, erro: String(err) });
  } finally {
    try { trava.releaseLock(); } catch (x) { }
  }
}


// Abrir este endereco no navegador mostra o resumo da turma.
function doGet() {
  var sh = pegarAba();
  if (sh.getLastRow() < 2) {
    return HtmlService.createHtmlOutput(pagina('Ainda ninguem jogou.', ''));
  }
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, COLUNAS.length).getValues();

  var comecaram = 0, terminaram = 0, somaPc = 0, somaMin = 0, somaPag = 0;
  var porPergunta = [];
  for (var i = 0; i < v.length; i++) {
    var ev = v[i][2];
    if (ev === 'comecou') { comecaram++; continue; }
    if (ev !== 'terminou') { continue; }
    terminaram++;
    somaPc += Number(v[i][6]) || 0;
    somaMin += Number(v[i][8]) || 0;
    somaPag += Number(v[i][7]) || 0;
    var g = String(v[i][10] || '').replace(/^'/, '');
    for (var j = 0; j < g.length; j++) {
      if (!porPergunta[j]) { porPergunta[j] = { certos: 0, total: 0 }; }
      porPergunta[j].total++;
      if (g.charAt(j) === '1') { porPergunta[j].certos++; }
    }
  }

  var n = Math.max(1, terminaram);
  var linhas =
      linha('Partidas comecadas', comecaram) +
      linha('Partidas terminadas', terminaram) +
      linha('Chegaram ao fim', comecaram ? Math.round(terminaram / comecaram * 100) + '%' : '-') +
      linha('Acerto medio', Math.round(somaPc / n) + '%') +
      linha('Paginas achadas (media)', (somaPag / n).toFixed(1) + ' de 9') +
      linha('Tempo medio', Math.round(somaMin / n) + ' min');

  var perg = '';
  for (var k = 0; k < porPergunta.length; k++) {
    var p = porPergunta[k];
    var pc = Math.round(p.certos / Math.max(1, p.total) * 100);
    perg += '<tr><td>Pergunta ' + (k + 1) + '</td><td><b>' + pc + '%</b>' +
            ' <span style="color:#888">(' + p.certos + ' de ' + p.total + ')</span></td></tr>';
  }
  return HtmlService.createHtmlOutput(pagina(linhas, perg));
}


function linha(rot, val) {
  return '<tr><td>' + rot + '</td><td><b>' + val + '</b></td></tr>';
}


function pagina(corpo, perguntas) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Resultados da feira</title><style>' +
    'body{font-family:Trebuchet MS,sans-serif;background:#FFF6E5;color:#16294A;' +
    'margin:0;padding:24px;max-width:560px}' +
    'h1{color:#F5921E;font-size:26px;margin:0 0 4px}' +
    'h2{font-size:18px;margin:26px 0 6px}' +
    'p.s{color:#5B6B85;margin:0 0 18px}' +
    'table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;' +
    'overflow:hidden;box-shadow:0 4px 0 rgba(22,41,74,.08)}' +
    'td{padding:11px 14px;border-bottom:1px solid #eee}' +
    'td:last-child{text-align:right}' +
    'small{color:#7A6A4A;display:block;margin-top:22px;line-height:1.5}' +
    '</style></head><body>' +
    '<h1>O Livro das Descobertas</h1>' +
    '<p class="s">Resultados da turma - Feira de Ciencias, Colegio Dom Jose</p>' +
    '<table>' + corpo + '</table>' +
    (perguntas ? '<h2>Acerto por pergunta</h2><table>' + perguntas + '</table>' : '') +
    '<small>Nenhum nome e coletado. Os numeros acima sao anonimos e nao ' +
    'permitem identificar quem jogou.</small>' +
    '</body></html>';
}
