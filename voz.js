/* ==========================================================================
   voz.js — a voz do Zezinho, o texto que aparece junto com ela,
   e a tranca que impede pular a fala.

   POR QUE ISSO EXISTE: no teste com crianças, elas saíam pulando o texto.
   Criança não lê caixa de diálogo — mas ouve, porque o áudio toca enquanto
   ela olha o desenho. Então: tudo que o Zezinho fala é falado de verdade,
   e o botão de avançar só destrava quando a fala termina.

   A ARMADILHA QUE ESTE ARQUIVO DESARMA: a voz do navegador falha calada.
   Em vários aparelhos o evento "acabei de falar" simplesmente nunca chega
   (bug conhecido do Chrome com falas longas, e o iPhone corta a voz quando
   a tela apaga). Se a tranca esperasse SÓ esse evento, a criança ficaria
   presa para sempre no meio da feira, sem botão para tocar.
   Por isso toda fala tem DOIS destravadores: o evento e um cronômetro de
   segurança. Vale o que chegar primeiro. A tela nunca trava de vez.
   ========================================================================== */

const VOZ = (() => {

  const suportado = typeof speechSynthesis !== 'undefined'
                 && typeof SpeechSynthesisUtterance !== 'undefined';

  let vozPT = null;          // a voz em português que achamos no aparelho
  let ligado = true;         // botão de som
  let liberado = false;      // iPhone exige um toque antes de deixar falar
  let falandoAgora = null;   // {texto, encerrar}
  const fila = [];

  /* ---------- áudio gravado ----------
     A voz boa (neural, gravada antes) vive em vozes/<chave>.mp3.
     `lista.json` diz quais existem e quanto duram — assim o jogo não precisa
     sondar a rede nem esperar metadado para saber o tempo da tranca.
     Se o arquivo não existir para uma fala, ela cai na voz do navegador.
     Ou seja: o jogo nunca fica mudo, nem quando o texto muda e o áudio
     daquela fala ainda não foi gerado.                                    */
  let listaAudio = null;

  // UM único elemento de áudio, reaproveitado sempre. É o truque que faz
  // funcionar no iPhone: o elemento é "destravado" por um toque de verdade
  // e depois pode tocar sozinho. Criar um novo a cada fala não funcionaria.
  const tocador = new Audio();
  tocador.preload = 'auto';

  // 50 ms de silêncio, para destravar o áudio no primeiro toque.
  const SILENCIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAg'
                 + 'D4AAIA+AAABAAgAZGF0YQAAAAA=';

  /* Chave do arquivo de áudio. Precisa dar exatamente o mesmo resultado no
     Python que gera os MP3 — por isso a normalização é grosseira de
     propósito: só letras e números, tudo minúsculo. Assim acento, emoji,
     pontuação e HTML não conseguem criar diferença entre os dois lados. */
  function chaveAudio(txt) {
    const n = paraFalar(txt).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    let h = 0x811c9dc5;
    for (let i = 0; i < n.length; i++) {
      h ^= n.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  const CHAVE_SOM = 'domjose_som';
  try { ligado = localStorage.getItem(CHAVE_SOM) !== '0'; } catch (e) { }

  /* ---------- achar a melhor voz em português ---------- */
  function escolherVoz() {
    if (!suportado) return;
    const vs = speechSynthesis.getVoices() || [];
    vozPT = vs.find(v => /pt[-_]BR/i.test(v.lang) && /natural|neural|google/i.test(v.name))
         || vs.find(v => /pt[-_]BR/i.test(v.lang))
         || vs.find(v => /^pt/i.test(v.lang))
         || null;
  }
  if (suportado) {
    escolherVoz();
    // A lista de vozes chega depois em quase todo navegador.
    speechSynthesis.addEventListener('voiceschanged', escolherVoz);
  }

  /* ---------- limpar o texto antes de falar ----------
     A bolha tem HTML (<b>, <i>) e emoji. Nada disso se fala.          */
  function paraFalar(html) {
    return String(html)
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE00}-\u{FE0F}\u{2B00}-\u{2BFF}]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------- quanto tempo essa fala deve durar ----------
     Português falado a taxa 0,95 sai por volta de 12,5 letras por segundo.
     Serve para dois usos: revelar o texto no mesmo ritmo da voz, e calcular
     o cronômetro de segurança da tranca.                               */
  function duracaoEstimada(texto) {
    const base = (texto.length / 12.5) * 1000 + 700;
    return Math.min(22000, Math.max(1400, base));
  }
  // Sem som, o tempo é de LEITURA (mais rápido que fala), não de voz.
  function duracaoLeitura(texto) {
    return Math.min(12000, Math.max(1200, (texto.length / 22) * 1000 + 600));
  }

  /* ---------- primeiro toque libera o áudio ----------
     Navegador de celular não deixa som tocar sozinho: exige um toque de
     verdade antes. Este é o toque. Destravamos as DUAS vias — o tocador de
     MP3 e a voz do navegador — porque não dá para saber de antemão qual vai
     ser usada em cada fala.                                              */
  function liberar() {
    if (liberado) return;
    liberado = true;
    try {
      tocador.src = SILENCIO;
      const p = tocador.play();
      if (p && p.catch) p.catch(() => { });
    } catch (e) { }
    if (suportado) {
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        speechSynthesis.speak(u);
      } catch (e) { }
    }
  }

  /* ---------- revelar o texto palavra por palavra ----------
     Envolve cada palavra num <span> sem estragar o <b> e o <i> que já
     estão lá dentro, e acende os spans no ritmo da voz.                */
  function prepararPalavras(el) {
    if (el.dataset.revelado === '1') return [];
    const nos = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) nos.push(w.currentNode);
    nos.forEach(n => {
      if (!n.nodeValue.trim()) return;
      const frag = document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        const s = document.createElement('span');
        s.className = 'pal';
        s.textContent = t;
        frag.appendChild(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
    el.dataset.revelado = '1';
    return Array.from(el.querySelectorAll('.pal'));
  }

  /* ---------- a tranca ----------
     Desliga só os botões de AVANÇAR. O cenário continua vivo de propósito:
     travar o jogo inteiro faria a criança achar que o jogo bugou.        */
  function travar() {
    document.querySelectorAll('#tela .btn:not(.nao-trava)').forEach(b => {
      if (b.disabled) return;              // já estava desligado por outro motivo
      b.dataset.travadoPelaVoz = '1';
      b.disabled = true;
    });
    const n = document.getElementById('nrt');
    if (n) n.classList.add('travado');
    document.querySelectorAll('#tela .zezinho').forEach(z => z.classList.add('falando'));
  }

  function destravar() {
    document.querySelectorAll('#tela .btn[data-travado-pela-voz]').forEach(b => {
      b.disabled = false;
      delete b.dataset.travadoPelaVoz;
    });
    const n = document.getElementById('nrt');
    if (n) n.classList.remove('travado');
    document.querySelectorAll('#tela .zezinho').forEach(z => z.classList.remove('falando'));
  }

  /* ---------- barrinha de quanto falta ----------
     Esperar sem prazo à vista é o que faz criança largar o aparelho.
     Com a barra, ela vê que tem fim.                                    */
  function barra(el, ms) {
    let b = el.querySelector('.barra-fala');
    if (!b) {
      b = document.createElement('div');
      b.className = 'barra-fala';
      b.innerHTML = '<i></i>';
      el.appendChild(b);
    }
    const i = b.querySelector('i');
    i.style.transition = 'none';
    i.style.width = '0%';
    requestAnimationFrame(() => {
      i.style.transition = `width ${ms}ms linear`;
      i.style.width = '100%';
    });
    return b;
  }

  /* ---------- falar um elemento ----------
     Três modos, nesta ordem de preferência:
       'audio' — MP3 gravado com a voz neural. Duração exata, conhecida.
       'tts'   — voz do navegador. Duração estimada, e pode falhar calada.
       'mudo'  — som desligado. A espera vira tempo de LEITURA, bem menor.
     Um relógio só manda em tudo: texto, barrinha e tranca.               */
  function falarElemento(el, aoTerminar) {
    const texto = paraFalar(el.dataset.falar || el.innerHTML);
    if (!texto) { aoTerminar(); return; }

    const palavras = prepararPalavras(el);
    const chave    = chaveAudio(texto);
    const durAudio = listaAudio ? listaAudio[chave] : 0;

    const modo = !ligado || !liberado ? 'mudo'
               : durAudio             ? 'audio'
               : suportado            ? 'tts'
                                      : 'mudo';

    // Se a lista de áudios carregou mas esta fala não está nela, o texto
    // mudou e ninguém regravou: ela vai sair na voz do navegador, que soa
    // diferente das outras. O aviso permite achar isso sem ouvir tudo.
    if (modo === 'tts' && listaAudio) {
      console.info('[voz] sem áudio gravado:', chave, '·', texto.slice(0, 70));
    }

    let alvoMs = modo === 'audio' ? durAudio * 1000 + 250
               : modo === 'tts'   ? duracaoEstimada(texto)
                                  : duracaoLeitura(texto);

    let comecou   = modo !== 'tts';   // só o TTS precisa provar que engatou
    let terminou  = false;
    let semVoz    = modo === 'mudo';
    let encerrado = false;
    const t0 = Date.now();
    let ultimoSinal = t0;

    travar();
    el.classList.add('falando-agora');
    barra(el, alvoMs);

    const encerrar = () => {
      if (encerrado) return;
      encerrado = true;
      clearInterval(relogio);
      palavras.forEach(p => p.classList.add('on'));   // nenhuma palavra fica escondida
      el.classList.remove('falando-agora');
      el.classList.add('ja-falado');
      const b = el.querySelector('.barra-fala');
      if (b) b.remove();
      falandoAgora = null;
      aoTerminar();
    };

    const relogio = setInterval(() => {
      const t = Date.now() - t0;

      // A voz do navegador não engatou em 0,7 s? Este aparelho não tem voz em
      // português, ou o navegador recusou. A espera vira tempo de LEITURA —
      // senão a criança encara silêncio olhando um botão apagado.
      if (!comecou && t > 700) {
        semVoz = comecou = true;
        alvoMs = Math.max(duracaoLeitura(texto), t + 400);
        barra(el, alvoMs - t);
      }

      const ate = Math.min(palavras.length, Math.ceil(t / alvoMs * palavras.length));
      for (let i = 0; i < ate; i++) palavras[i].classList.add('on');

      if (t < alvoMs) return;

      // Com MP3 a duração é exata: passou do tempo, acabou.
      // Com a voz do navegador é estimativa, então espera ela — mas SÓ
      // enquanto der sinal de vida. speechSynthesis.speaking mente: quando a
      // voz falha ele fica presa em "estou falando" para sempre.
      const vivo = Date.now() - ultimoSinal < 1500;
      const aindaFalando = modo === 'tts' && !semVoz && !terminou
                        && speechSynthesis.speaking && vivo;

      // CRONÔMETRO DE SEGURANÇA — o último recurso, se tudo o mais falhar.
      const estourou = t > alvoMs * 2 + 3000;

      if (!aindaFalando || estourou) encerrar();
    }, 80);

    falandoAgora = { texto, encerrar };

    if (modo === 'audio') {
      try {
        tocador.pause();
        tocador.currentTime = 0;
        tocador.src = 'vozes/' + chave + '.mp3';
        tocador.onended = () => { terminou = true; };
        const p = tocador.play();
        // Se o navegador recusar tocar, o relógio ainda solta a tela na hora.
        if (p && p.catch) p.catch(() => { });
      } catch (e) { }
      return;
    }

    if (modo !== 'tts') return;

    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      if (vozPT) u.voice = vozPT;
      u.lang   = (vozPT && vozPT.lang) || 'pt-BR';
      u.rate   = 0.95;
      u.pitch  = 1.2;    // um tiquinho agudo: é uma arara, não um locutor
      u.volume = 1;
      u.onstart    = () => { comecou = true; ultimoSinal = Date.now(); };
      u.onboundary = () => { ultimoSinal = Date.now(); };   // andou uma palavra
      u.onend      = () => { terminou = true; };
      u.onerror    = () => { terminou = semVoz = comecou = true; };
      speechSynthesis.speak(u);
    } catch (e) {
      semVoz = comecou = true;   // voz indisponível não pode travar o jogo
    }
  }

  /* ---------- fila ----------
     Às vezes duas falas aparecem quase juntas (o cartão de instrução e um
     comentário do Zezinho). Falam em ordem, nunca por cima uma da outra.  */
  let processando = false;
  function processar() {
    if (processando) return;
    const el = fila.shift();
    if (!el) { destravar(); return; }
    if (!el.isConnected) { processar(); return; }
    processando = true;
    falarElemento(el, () => { processando = false; processar(); });
  }

  function enfileirar(el) {
    fila.push(el);
    processar();
  }

  /* ---------- calar tudo (troca de tela) ---------- */
  function calar() {
    fila.length = 0;
    processando = false;
    if (falandoAgora) falandoAgora.encerrar();
    try { tocador.pause(); tocador.onended = null; } catch (e) { }
    if (suportado) { try { speechSynthesis.cancel(); } catch (e) { } }
    destravar();
  }

  /* ---------- repetir a última fala ---------- */
  function repetir(el) {
    if (!el) return;
    el.querySelectorAll('.pal').forEach(p => p.classList.remove('on'));
    el.classList.remove('ja-falado');
    calar();
    enfileirar(el);
  }

  /* ---------- observador: pega toda fala nova sozinho ----------
     Assim nenhuma tela precisa "lembrar" de mandar falar. Qualquer coisa
     marcada com data-falar entra na fila quando aparece na tela.         */
  let ultimoTexto = '';
  function varrer(raiz) {
    const alvos = [];
    if (raiz.nodeType === 1 && raiz.hasAttribute && raiz.hasAttribute('data-falar')) alvos.push(raiz);
    if (raiz.querySelectorAll) alvos.push(...raiz.querySelectorAll('[data-falar]'));
    alvos.forEach(el => {
      if (el.dataset.enfileirado === '1') return;
      const t = paraFalar(el.dataset.falar || el.innerHTML);
      if (!t) return;
      // Telas que se redesenham (a dos usos do fogo, o laboratório) repetiriam
      // a mesma instrução a cada redesenho. Uma vez basta.
      if (t === ultimoTexto) { el.dataset.enfileirado = '1'; marcarLidas(el); return; }
      ultimoTexto = t;
      el.dataset.enfileirado = '1';
      enfileirar(el);
    });
  }
  // Instrução repetida: mostra o texto inteiro na hora, sem revelar devagar.
  function marcarLidas(el) {
    prepararPalavras(el).forEach(p => p.classList.add('on'));
    el.classList.add('ja-falado');
  }

  function iniciar() {
    const tela = document.getElementById('tela');
    if (!tela) return;

    // Carrega a lista de áudios gravados. Se não vier (arquivo ausente,
    // aberto direto do disco, rede fora), o jogo simplesmente usa a voz do
    // navegador em tudo — funciona igual, só soa pior.
    fetch('vozes/lista.json')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j && typeof j === 'object') listaAudio = j; })
      .catch(() => { });
    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) varrer(n); }));
      // O botão "Continuar" do quiz nasce DEPOIS da fala começar. Sem esta
      // linha ele escapava da tranca e a criança pulava a explicação — que
      // é exatamente o problema que a voz veio resolver.
      if (processando) travar();
    }).observe(tela, { childList: true, subtree: true });
    varrer(tela);

    // Repetir a fala tocando na bolha — criança que não pegou de primeira.
    tela.addEventListener('click', e => {
      const el = e.target.closest('[data-falar].ja-falado');
      if (el) repetir(el);
    });
  }

  return {
    iniciar, liberar, calar, enfileirar, repetir,
    get ligado() { return ligado; },
    alternarSom() {
      ligado = !ligado;
      try { localStorage.setItem(CHAVE_SOM, ligado ? '1' : '0'); } catch (e) { }
      if (!ligado) calar();
      return ligado;
    },
    get disponivel() { return suportado; }
  };
})();
