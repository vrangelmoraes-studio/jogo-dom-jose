/* ==========================================================================
   som.js — efeitos sonoros do jogo.

   Os arquivos em sons/*.wav são gerados por gerar_sons.py, aqui na máquina.
   Nada vem de banco de sons da internet: assim não existe dúvida de licença
   num material que o colégio vai distribuir.

   Se um arquivo faltar, o efeito cai num bipe sintetizado na hora. Ou seja:
   o jogo nunca fica sem retorno sonoro, nem antes de gerar os WAV.

   O botão de som da tela controla ESTE módulo e a voz do Zezinho juntos —
   é um botão só, como a criança espera.
   ========================================================================== */

const SOM = (() => {

  const NOMES = ['toque', 'coleta', 'pagina', 'certo', 'errado', 'fogo',
                 'chama', 'vento', 'germe', 'vacina', 'vitoria', 'medalha'];

  // Volume por efeito. O 'toque' toca dezenas de vezes: tem que ser discreto.
  const VOLUME = {
    toque: .30, coleta: .55, pagina: .60, certo: .60, errado: .45,
    fogo: .40, chama: .65, vento: .45, germe: .50, vacina: .65,
    vitoria: .70, medalha: .75
  };

  const CHAVE_SOM = 'domjose_som';
  let ctx = null;
  const buffers = {};      // nome -> AudioBuffer já decodificado
  let carregando = false;

  const ligado = () => {
    try { return localStorage.getItem(CHAVE_SOM) !== '0'; } catch (e) { return true; }
  };

  const contexto = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  };

  /* ---------- carregar os arquivos ----------
     Só começa depois do primeiro toque na tela: antes disso o navegador
     de celular nem deixaria tocar, e baixar cedo demais competiria com o
     carregamento do jogo.                                                */
  function carregar() {
    if (carregando) return;
    carregando = true;
    const c = contexto();
    if (!c) return;
    NOMES.forEach(nome => {
      fetch('sons/' + nome + '.wav')
        .then(r => r.ok ? r.arrayBuffer() : Promise.reject())
        .then(b => c.decodeAudioData(b))
        .then(buf => { buffers[nome] = buf; })
        .catch(() => { /* sem arquivo: cai no bipe */ });
    });
  }

  /* ---------- bipe de emergência ----------
     Usado enquanto os arquivos não chegaram, ou se algum faltar.        */
  const BIPES = {
    toque:   [[520, .07, 'triangle']],
    coleta:  [[780, .07, 'triangle']],
    pagina:  [[1046, .18, 'sine'], [1568, .18, 'sine', .08]],
    certo:   [[660, .10, 'sine'], [880, .16, 'sine', .09]],
    errado:  [[300, .16, 'sine'], [240, .20, 'sine', .10]],
    fogo:    [[300, .12, 'sawtooth']],
    chama:   [[523, .30, 'sine'], [784, .28, 'sine', .07]],
    vento:   [[180, .35, 'sawtooth']],
    germe:   [[520, .09, 'square']],
    vacina:  [[440, .22, 'sine'], [880, .22, 'sine', .12]],
    vitoria: [[523, .18, 'sine'], [659, .18, 'sine', .11],
              [784, .18, 'sine', .22], [1047, .26, 'sine', .33]],
    medalha: [[523, .20, 'sine'], [659, .20, 'sine', .13],
              [784, .20, 'sine', .26], [1047, .34, 'sine', .39]]
  };

  function bipe(nome) {
    const c = contexto();
    if (!c) return;
    (BIPES[nome] || BIPES.toque).forEach(([f, dur, tipo, atraso]) => {
      try {
        const o = c.createOscillator(), g = c.createGain();
        o.type = tipo || 'sine';
        o.frequency.value = f;
        o.connect(g); g.connect(c.destination);
        const t = c.currentTime + (atraso || 0);
        const v = (VOLUME[nome] || .4) * .28;
        g.gain.setValueAtTime(v, t);
        g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        o.start(t); o.stop(t + dur);
      } catch (e) { }
    });
  }

  /* ---------- tocar ---------- */
  function tocar(nome) {
    if (!ligado()) return;
    const c = contexto();
    if (!c) return;
    // O navegador suspende o áudio até o primeiro toque de verdade.
    if (c.state === 'suspended') { try { c.resume(); } catch (e) { } }

    const buf = buffers[nome];
    if (!buf) { bipe(nome); return; }
    try {
      const f = c.createBufferSource(), g = c.createGain();
      f.buffer = buf;
      g.gain.value = VOLUME[nome] || .5;
      f.connect(g); g.connect(c.destination);
      f.start();
    } catch (e) { bipe(nome); }
  }

  /* Primeiro toque na tela: liga o áudio e busca os arquivos. */
  function liberar() {
    const c = contexto();
    if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { } }
    carregar();
  }

  // Nomes antigos mantidos para não quebrar as chamadas espalhadas no jogo.
  return {
    tocar, liberar,
    toque:   () => tocar('toque'),
    coleta:  () => tocar('coleta'),
    pagina:  () => tocar('pagina'),
    certo:   () => tocar('certo'),
    errado:  () => tocar('errado'),
    fogo:    () => tocar('fogo'),
    chama:   () => tocar('chama'),
    vento:   () => tocar('vento'),
    germe:   () => tocar('germe'),
    vacina:  () => tocar('vacina'),
    vitoria: () => tocar('vitoria'),
    medalha: () => tocar('medalha')
  };
})();
