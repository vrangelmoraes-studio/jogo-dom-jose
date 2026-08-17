/* ==========================================================================
   estatistica.js — manda para uma planilha os números de cada partida.

   O QUE SAI DAQUI, exatamente:
     evento (começou / terminou), fase alcançada, acertos, total de perguntas,
     páginas achadas, minutos de jogo, medalha e o gabarito da partida
     (um "1" ou "0" por pergunta, na ordem).

   O QUE NUNCA SAI:
     o nome da criança, o personagem escolhido, o tom de pele, e qualquer
     coisa que permita saber quem jogou. Isso é decisão de projeto, não
     descuido: número anônimo fica fora da LGPD; nome de criança de 10 anos
     exigiria autorização por escrito dos pais, e a conta cairia no colégio.

   REGRAS DE OURO DESTE ARQUIVO:
     1. Nada aqui pode travar o jogo. Toda chamada é protegida, e se a rede
        falhar a criança não vê nada de diferente.
     2. Sem endereço configurado, o arquivo simplesmente não faz nada.
     3. Se o envio falhar (wi-fi da escola caindo), o número fica guardado
        no aparelho e vai junto na próxima vez que o jogo abrir. Numa feira
        isso é a diferença entre contar 40 partidas e contar 12.
   ========================================================================== */

const ESTATISTICA = (() => {

  /* ---------------------------------------------------------------------
     COLE AQUI o endereço do aplicativo da planilha (Apps Script).
     Vazio = não envia nada, e o jogo funciona igual.
     --------------------------------------------------------------------- */
  const URL_ENVIO = '';

  const CHAVE_FILA = 'domjose_envios_pendentes';
  const LIMITE_FILA = 40;      // não deixa a fila crescer sem fim

  const ligado = () => typeof URL_ENVIO === 'string' && URL_ENVIO.indexOf('http') === 0;

  const lerFila = () => {
    try { return JSON.parse(localStorage.getItem(CHAVE_FILA)) || []; }
    catch (e) { return []; }
  };
  const gravarFila = f => {
    try { localStorage.setItem(CHAVE_FILA, JSON.stringify(f.slice(-LIMITE_FILA))); }
    catch (e) { /* aparelho sem espaço: perde o número, não o jogo */ }
  };

  /* Identificador da PARTIDA, não da criança: sorteado a cada jogo novo e
     nunca guardado. Serve só para a planilha não contar duas vezes a mesma
     partida se o envio for repetido. Não dá para ligar a ninguém. */
  let partida = null;
  const novaPartida = () => {
    partida = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    return partida;
  };

  async function despachar(item) {
    // text/plain de propósito: evita a checagem prévia do navegador
    // (preflight), que o Apps Script não responde.
    const r = await fetch(URL_ENVIO, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(item)
    });
    if (!r.ok) throw new Error('resposta ' + r.status);
    return true;
  }

  /** Tenta esvaziar a fila. O que falhar continua guardado para depois. */
  async function escoar() {
    if (!ligado()) return;
    const fila = lerFila();
    if (!fila.length) return;
    const sobraram = [];
    for (const item of fila) {
      try { await despachar(item); }
      catch (e) { sobraram.push(item); }
    }
    gravarFila(sobraram);
  }

  /** Enfileira um registro e tenta mandar na hora. */
  function registrar(evento, S) {
    if (!ligado()) return;
    try {
      const pc = S.total ? Math.round(S.acertos / S.total * 100) : 0;
      const item = {
        partida: partida || novaPartida(),
        evento,                                   // 'comecou' ou 'terminou'
        quando: new Date().toISOString(),
        fase: S.fase,
        acertos: S.acertos,
        total: S.total,
        porcento: pc,
        paginas: S.paginas,
        minutos: Math.max(1, Math.round((Date.now() - S.inicio) / 60000)),
        medalha: evento === 'terminou'
          ? (pc >= 85 ? 'ouro' : pc >= 60 ? 'prata' : 'bronze') : '',
        // gabarito da partida: 1 acertou, 0 errou, na ordem das perguntas.
        // É o que mostra QUAL pergunta a turma mais errou.
        gabarito: (S.registro || []).map(r => (r.acertou ? 1 : 0)).join('')
      };
      const fila = lerFila();
      fila.push(item);
      gravarFila(fila);
      escoar();
    } catch (e) { /* estatística nunca pode derrubar o jogo */ }
  }

  return {
    ligado,
    novaPartida,
    comecou:  S => registrar('comecou', S),
    terminou: S => registrar('terminou', S),
    /* Ao abrir o jogo, tenta mandar o que ficou preso de partidas
       anteriores — a criança pode ter jogado com a rede caindo. */
    escoarPendentes: () => { try { escoar(); } catch (e) { } },
    pendentes: () => lerFila().length
  };
})();
