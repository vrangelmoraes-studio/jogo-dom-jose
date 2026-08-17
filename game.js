/* ==========================================================================
   O Livro das Descobertas, do fogo à vacina
   Jogo educativo — Colégio Dom José, 5º ano (Fund. I)
   Feira de ciências. Roda no navegador, funciona offline, nada sai do aparelho.

   PRINCÍPIOS DE DESIGN (decididos de propósito, não por acaso):
   1. Dois verbos só: TOCAR e ESCOLHER. Criança não reaprende controle a cada fase.
   2. A lição mora na mecânica, não no texto. Criança pula texto — então o que
      ela precisa aprender ela precisa FAZER.
   3. Nunca punitivo: não existe final de derrota. Todos chegam a Guardião;
      o que varia é a medalha e quantas curiosidades foram destravadas.
   4. Nada sai do aparelho: sem servidor, sem análise de dado, sem nuvem.
      Nome de criança e desempenho ficam no navegador e só.
   ========================================================================== */

/* O som mora em som.js (efeitos gerados por gerar_sons.py).
   A voz do Zezinho mora em voz.js. Os dois respondem ao mesmo botao de som. */

/* ========================= estado da partida ============================= */
const S = {
  nome: '', genero: 'menina', tom: 1,
  fase: 0,                 // 0 = ainda na abertura
  paginas: 0,
  PAGINAS_TOTAL: 9,
  acertos: 0, total: 0,
  registro: [],            // {fase, pergunta, acertou} — alimenta o modo professor
  inicio: Date.now()
};

const CHAVE = 'domjose_descobertas_v1';

function salvar() {
  try {
    const l = carregarTodos().filter(s => s.nome !== S.nome);
    l.unshift({
      nome: S.nome, genero: S.genero, tom: S.tom, fase: S.fase,
      paginas: S.paginas, acertos: S.acertos, total: S.total,
      registro: S.registro, inicio: S.inicio, ts: Date.now()
    });
    localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, 6)));
  } catch (e) { /* navegador sem espaço: joga sem salvar, não travar */ }
}
function carregarTodos() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { return []; }
}
function retomar(s) { Object.assign(S, s); }

/* ========================= utilidades de tela ============================ */
const tela = () => document.getElementById('tela');

function pinta(fundo, html) {
  const t = tela();
  // Uma tela nova = um contexto de fala novo. Sem isto, a voz da tela
  // anterior continuaria tocando por cima da nova.
  // typeof, e nao window.VOZ: `const` no topo de um script cria uma
  // ligacao global mas NAO uma propriedade de window. Com window.VOZ a
  // guarda era sempre falsa e a voz da tela anterior nunca era calada.
  if (typeof VOZ !== 'undefined') VOZ.calar();
  t.className = 'tela ativa ' + fundo;
  t.innerHTML = html;
}

/** Troca de tela deslizando: a de fora sai pela esquerda, a de dentro
    entra pela direita. Dá sensação de avanço, não de recarregar página. */
function go(fn) {
  const t = tela();
  // Sair da tela derruba o minijogo que estiver rodando. Sem isto o Phaser
  // continuaria desenhando (e comendo bateria) atras da tela seguinte.
  // Mesma armadilha do window.VOZ acima: com window.MINIJOGOS a guarda
  // nunca era verdadeira, o Phaser da tela anterior seguia vivo e o
  // navegador ia derrubando contextos WebGL antigos por excesso.
  if (typeof MINIJOGOS !== 'undefined') MINIJOGOS.destruir();
  t.classList.add('saindo');
  setTimeout(() => {
    fn();                                  // pinta() reescreve as classes
    const t2 = tela();
    t2.classList.add('entrando');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => t2.classList.remove('entrando')));
    window.scrollTo(0, 0);
  }, 200);
}

const q  = sel => tela().querySelector(sel);
const qq = sel => Array.from(tela().querySelectorAll(sel));

/** Bolha de fala do Zezinho. É onde ele comenta, nunca onde ensina o essencial. */
/** Escapa aspas para o texto caber dentro de um atributo HTML. */
const attr = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                           .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Bolha de fala do Zezinho.
 * `dizer` existe porque o áudio é gravado ANTES de saber quem vai jogar:
 * a bolha pode mostrar "Oi, Sofia!", mas o que vira arquivo de som é a
 * versão fixa, sem nome e sem contagem. O nome continua escrito na tela.
 */
function fala(texto, pose = 'oi', dizer = null, espelhada = false) {
  return `<div class="fala ${espelhada ? 'espelhada' : ''}">
    ${ART.zezinho(pose, 'flutua')}
    <div class="bolha" data-falar="${dizer ? attr(dizer) : ''}">${texto}</div>
  </div>`;
}

/**
 * Troca a fala do rodapé calando a anterior.
 * Em telas onde os avisos se sucedem depressa — o vento da fogueira é o
 * caso — sem isto a voz antiga continua tocando, a nova entra na fila e a
 * criança ouve o comentário errado na hora errada.
 */
function falarRodape(html) {
  if (typeof VOZ !== 'undefined') VOZ.calar();
  const r = q('#rodape');
  if (r) r.innerHTML = html;
}

function topo(txtFase) {
  return `<div class="topo">
    <span class="chip">${txtFase}</span>
    <span class="chip chip-paginas">📄 ${S.paginas}/${S.PAGINAS_TOTAL}</span>
  </div>`;
}

function confete(n = 34) {
  const cores = ['#F5921E', '#1B9BF0', '#FFC61E', '#4CC46A', '#F0524B', '#29B6CE'];
  const p = document.getElementById('palco');
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confete';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = cores[i % cores.length];
    c.style.animationDuration = (1.5 + Math.random() * 1.4) + 's';
    c.style.animationDelay = (Math.random() * .5) + 's';
    p.appendChild(c);
    setTimeout(() => c.remove(), 3600);
  }
}

/** "+1" que sobe do ponto tocado. Recompensa imediata, custa nada. */
function ganho(alvo, txt) {
  const p = document.getElementById('palco');
  const r = alvo.getBoundingClientRect(), rp = p.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'ganho';
  d.textContent = txt;
  d.style.left = (r.left - rp.left + r.width / 2 - 12) + 'px';
  d.style.top  = (r.top  - rp.top) + 'px';
  p.appendChild(d);
  setTimeout(() => d.remove(), 950);
}

const embaralhar = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

/** Posições espalhadas numa grade com tremida — evita item em cima de item. */
function posicoes(n, colunas = 3) {
  const linhas = Math.ceil(n / colunas), out = [];
  for (let i = 0; i < n; i++) {
    const c = i % colunas, l = Math.floor(i / colunas);
    out.push({
      // Limites apertados de proposito: `left` e a borda ESQUERDA do item,
      // entao espalhar ate 90% joga metade do graveto fora da cena.
      left: 5 + c * (63 / (colunas - 1 || 1)) + (Math.random() * 7 - 3.5),
      top:  7 + l * (66 / (linhas - 1 || 1)) + (Math.random() * 7 - 3.5)
    });
  }
  return embaralhar(out);
}

/* Contabiliza uma página achada. Vale para as duas versões da cena —
   a do Phaser e a de reserva em HTML.                                     */
const PAG_FASE = { f1: 0, f2: 0, f3: 0 };

function pegouPagina(faseKey) {
  PAG_FASE[faseKey] = (PAG_FASE[faseKey] || 0) + 1;
  S.paginas = Math.min(S.PAGINAS_TOTAL, S.paginas + 1);
  const chip = q('.chip-paginas');
  if (chip) {
    chip.textContent = `📄 ${S.paginas}/${S.PAGINAS_TOTAL}`;
    // pulo do contador: a criança precisa VER que o número mudou, senão
    // ela não liga o toque na página ao progresso.
    chip.classList.remove('chip-pop');
    void chip.offsetWidth;                 // reinicia a animação
    chip.classList.add('chip-pop');
  }
}

/* Quantas páginas ainda faltam achar nesta fase. */
const paginasQueFaltam = faseKey => 3 - (PAG_FASE[faseKey] || 0);

/* Versão de RESERVA: espalha as páginas em HTML puro. Só entra em ação se
   o Phaser não carregar. */
function soltarPaginas(cena, faseKey, aoPegar) {
  for (let i = 0; i < paginasQueFaltam(faseKey); i++) {
    const d = document.createElement('div');
    d.className = 'alvo';
    d.style.width = '34px';
    d.style.left = (6 + Math.random() * 70) + '%';
    d.style.top  = (8 + Math.random() * 68) + '%';
    d.style.zIndex = 5;
    d.innerHTML = ART.paginaPerdida();
    d.onclick = () => {
      if (d.classList.contains('coletado')) return;
      d.classList.add('coletado');
      pegouPagina(faseKey);
      SOM.pagina();
      ganho(d, '📄');
      if (aoPegar) aoPegar();
    };
    cena.appendChild(d);
  }
}

/* ========================= narrativa genérica ===========================
   Passos: {fundo, arte, texto, pose}. Toca para avançar.
   Serve para sala de leitura, transições e a ponte para o presente.        */
function narrativa(passos, depois) {
  let i = 0;
  const desenha = () => {
    const p = passos[i];
    pinta(p.fundo, `
      <div class="narrativa" id="nrt">
        <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:0">
          ${p.arte || ''}
        </div>
        <div class="cartao" style="margin-top:10px">
          <p data-falar="${p.dizer ? attr(p.dizer) : ''}">${p.texto}</p>
        </div>
        <div class="toque-continuar">toque para continuar ▸</div>
      </div>`);
    q('#nrt').onclick = () => {
      SOM.toque();
      i++;
      // `depois` já cuida da própria transição — chamar direto evita
      // encadear dois fades e deixar a tela parada mais tempo que o preciso.
      if (i < passos.length) go(desenha); else depois();
    };
  };
  go(desenha);
}

/* ========================= quiz genérico ================================
   Uma pergunta por tela. Resposta errada não tira ponto de vida nem
   bloqueia: mostra qual era a certa e explica. O quiz confirma o que a
   criança já viveu na mecânica — não é onde ela aprende pela primeira vez. */
function quiz(titulo, perguntas, faseTxt, depois) {
  let i = 0;
  const desenha = () => {
    const p = perguntas[i];
    const ops = embaralhar(p.opcoes.map((t, k) => ({ t, certa: k === 0 })));
    pinta('fundo-livro', `
      ${topo(faseTxt)}
      <div class="cartao" style="margin-bottom:12px">
        <div class="rotulo">${titulo} · ${i + 1} de ${perguntas.length}</div>
        <h3 style="margin-top:6px">${p.q}</h3>
      </div>
      <div class="rolavel">
        <div class="opcoes" id="ops">
          ${ops.map((o, k) => `<button class="opcao" data-k="${k}">${o.t}</button>`).join('')}
        </div>
        <div id="explica" style="margin-top:12px"></div>
      </div>`);

    qq('#ops .opcao').forEach(b => b.onclick = () => {
      const k = +b.dataset.k, certa = ops[k].certa;
      qq('#ops .opcao').forEach((x, j) => {
        x.disabled = true;
        if (ops[j].certa) x.classList.add('certa');
      });
      if (certa) {
        b.innerHTML += '<span class="marca">✅</span>';
        S.acertos++; SOM.certo();
      } else {
        b.classList.add('errada');
        b.innerHTML += '<span class="marca">🤔</span>';
        SOM.errado();
      }
      S.total++;
      S.registro.push({ fase: faseTxt, pergunta: p.q, acertou: certa });

      q('#explica').innerHTML = fala(
        (certa ? '<b>Isso!</b> ' : '<b>Quase!</b> ') + p.porque,
        certa ? 'feliz' : 'pensa', p.porque);

      const btn = document.createElement('button');
      btn.className = 'btn btn-laranja btn-g';
      btn.style.marginTop = '12px';
      btn.textContent = i + 1 < perguntas.length ? 'Próxima ▸' : 'Continuar ▸';
      btn.onclick = () => { i++; if (i < perguntas.length) go(desenha); else depois(); };
      q('#explica').appendChild(btn);
      q('#explica').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };
  go(desenha);
}

/* ======================================================================== */
/* ============================ 0. ABERTURA =============================== */
/* ======================================================================== */
function telaAbertura() {
  pinta('fundo-festa', `
    <div class="faixa-logo">${ART.logo('logo-topo')}</div>
    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:6px; min-height:0">
      <h1 class="titulo-jogo">O Livro das<br>Descobertas</h1>
      <p class="subtitulo-jogo">do fogo à vacina</p>
      <div style="display:flex; justify-content:center; margin:4px 0">
        <div style="width:150px">${ART.zezinho('oi', 'flutua')}</div>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; gap:11px">
      <button class="btn btn-verde btn-g pulsa" id="bJogar">▶  JOGAR</button>
      <button class="btn btn-marinho btn-p" id="bComo">Como jogar?</button>
    </div>
    <p style="text-align:center; font-size:11.5px; color:#7A4A10; margin-top:10px">
      Feira de Ciências · 5º ano · Colégio Dom José
    </p>`);

  q('#bJogar').onclick = () => { SOM.toque(); go(carregarTodos().length ? telaJogadores : telaPersonagem); };
  q('#bComo').onclick  = () => { SOM.toque(); go(telaComoJogar); };
}

function telaComoJogar() {
  const quadro = (n, t, arte) => `
    <div class="cartao" style="display:flex; gap:12px; align-items:center; margin-bottom:11px">
      <div style="flex:0 0 60px; text-align:center">${arte}</div>
      <div><b style="color:var(--laranja-esc)">${n}.</b> ${t}</div>
    </div>`;
  pinta('fundo-escola', `
    <h2 style="text-align:center; margin-bottom:12px">Como jogar</h2>
    <div class="rolavel">
      ${quadro(1, 'Você só precisa <b>tocar</b> nas coisas e <b>escolher</b> respostas. Nada de botão difícil.',
        `<div style="font-size:34px">👆</div>`)}
      ${quadro(2, 'Procure as <b>páginas perdidas</b> escondidas no cenário. Elas brilham. São 9 no total.',
        `<div style="width:34px; margin:auto">${ART.paginaPerdida()}</div>`)}
      ${quadro(3, 'Errar não tira nada. O Zezinho explica e você segue.',
        `<div style="width:52px; margin:auto">${ART.zezinho('pensa')}</div>`)}
      ${quadro(4, 'No fim você recebe uma <b>medalha</b> e curiosidades de verdade sobre ciência.',
        `<div style="width:44px; margin:auto">${ART.medalha('ouro')}</div>`)}
    </div>
    <button class="btn btn-laranja btn-g" id="bV" style="margin-top:10px">Entendi! ▸</button>`);
  q('#bV').onclick = () => { SOM.toque(); go(telaAbertura); };
}

/* ---- quem está jogando? ------------------------------------------------
   Isso existe por um motivo prático: na feira, muitas crianças usam o MESMO
   aparelho. Sem essa tela, a segunda criança cai no jogo da primeira.      */
function telaJogadores() {
  const l = carregarTodos();
  const nomeFase = f => ['Começando', 'Fase 1 — Fogo', 'Fase 2 — Vacina', 'Fase 3 — Pasteur', 'Terminou'][Math.min(f, 4)];
  pinta('fundo-escola', `
    <h2 style="text-align:center">Quem está jogando?</h2>
    <p style="text-align:center; color:var(--texto-claro); margin:8px 0 14px">
      Se esta é a sua primeira vez, toque em <b>Novo jogo</b>.
    </p>
    <button class="btn btn-verde btn-g" id="bNovo">✨  NOVO JOGO</button>
    <div class="rotulo" style="margin:18px 0 8px">Continuar de antes</div>
    <div class="rolavel" id="lista">
      ${l.map((s, i) => `
        <button class="opcao" data-i="${i}">
          <b>${s.nome}</b><br>
          <span style="font-size:14px; color:var(--texto-claro)">
            ${nomeFase(s.fase)} · 📄 ${s.paginas}/${S.PAGINAS_TOTAL} · ✅ ${s.acertos}/${s.total || 0}
          </span>
        </button>`).join('')}
    </div>
    <button class="btn btn-marinho btn-p" id="bLimpa" style="margin-top:10px">Apagar os jogos salvos</button>`);

  q('#bNovo').onclick = () => { SOM.toque(); go(telaPersonagem); };
  qq('#lista .opcao').forEach(b => b.onclick = () => {
    SOM.toque();
    retomar(l[+b.dataset.i]);
    go([telaSalaLeitura, fase1_coleta, fase2_observar, fase3_lab, telaFinal][Math.min(S.fase, 4)] || telaSalaLeitura);
  });
  q('#bLimpa').onclick = () => {
    if (confirm('Apagar todos os jogos salvos neste aparelho?')) {
      localStorage.removeItem(CHAVE); go(telaAbertura);
    }
  };
}

/* ======================================================================== */
/* ====================== 1. PERSONAGEM E NOME ============================ */
/* ======================================================================== */
function telaPersonagem() {
  const desenha = () => {
    pinta('fundo-escola', `
      <h2 style="text-align:center">Escolha seu personagem</h2>
      <p style="text-align:center; color:var(--texto-claro); margin:6px 0 14px; font-size:14.5px">
        Os dois estão com o uniforme do Dom José.
      </p>
      <div class="escolha-avatar">
        <div class="card-avatar ${S.genero === 'menina' ? 'sel' : ''}" data-g="menina">
          ${ART.avatar('menina', S.tom, 'flutua')}<div>Menina</div></div>
        <div class="card-avatar ${S.genero === 'menino' ? 'sel' : ''}" data-g="menino">
          ${ART.avatar('menino', S.tom, 'flutua2')}<div>Menino</div></div>
      </div>
      <div class="rotulo" style="text-align:center; margin:18px 0 8px">Tom de pele</div>
      <div class="tons" style="margin-bottom:auto">
        ${ART.TONS.map((c, i) => `<div class="tom ${S.tom === i ? 'sel' : ''}"
          data-t="${i}" style="background:${c}"></div>`).join('')}
      </div>
      <button class="btn btn-laranja btn-g" id="bOk" style="margin-top:auto">Pronto ▸</button>`);

    qq('.card-avatar').forEach(c => c.onclick = () => { SOM.toque(); S.genero = c.dataset.g; desenha(); });
    qq('.tom').forEach(t => t.onclick = () => { SOM.toque(); S.tom = +t.dataset.t; desenha(); });
    q('#bOk').onclick = () => { SOM.toque(); go(telaNome); };
  };
  desenha();
}

/* O sorteio segue o personagem escolhido: quem escolheu a menina não
   recebe "Pedro". Parece detalhe, mas a criança percebe na hora. */
const NOMES_SORTEIO = {
  menina: ['Ana', 'Alice', 'Clara', 'Elisa', 'Helena', 'Júlia', 'Laura',
           'Maya', 'Olívia', 'Sofia', 'Valentina'],
  menino: ['Bento', 'Davi', 'Gael', 'Heitor', 'Ícaro', 'Lucas', 'Miguel',
           'Noah', 'Pedro', 'Théo', 'Vitor']
};

// Lista curta de palavrão comum. Não é muralha — é para não aparecer bobagem na tela.
const BLOQUEADAS = ['merda', 'bosta', 'caralho', 'porra', 'buceta', 'puta', 'putao', 'cu',
  'cacete', 'foda', 'fdp', 'viado', 'baitola', 'idiota', 'burro', 'otario', 'imbecil',
  'arrombado', 'corno', 'piroca', 'penis', 'vagina', 'xoxota', 'boquete', 'punheta',
  'desgraca', 'peste', 'lixo', 'macaco', 'preto', 'gordo', 'nazi', 'hitler'];

function validarNome(v) {
  const n = v.trim();
  if (n.length < 2)  return 'Escreva pelo menos 2 letras.';
  if (n.length > 15) return 'Nome muito comprido — até 15 letras.';
  if (!/^[A-Za-zÀ-ÿ]+$/.test(n)) return 'Só letras, sem espaço e sem número.';
  if (/(.)\1{2,}/.test(n)) return 'Hmm, esse nome não parece certo! Tenta de novo 😊';
  // tira acento antes de comparar, senão "idiôta" passaria pela lista.
  // O intervalo vai escrito em \u para não depender de o arquivo manter
  // caracteres invisíveis intactos ao ser copiado ou editado.
  const sem = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (BLOQUEADAS.some(p => sem.includes(p))) return 'Vamos usar um nome de verdade 😉';
  return null;
}

const capitalizar = n => n.trim().charAt(0).toUpperCase() + n.trim().slice(1).toLowerCase();

function telaNome() {
  pinta('fundo-escola', `
    <h2 style="text-align:center">Qual é o seu nome?</h2>
    <p style="text-align:center; color:var(--texto-claro); margin:6px 0 16px; font-size:14.5px">
      Só o primeiro nome. Ele fica guardado <b>apenas neste aparelho</b>.
    </p>
    <div style="display:flex; justify-content:center; margin-bottom:14px">
      <div style="width:110px">${ART.avatar(S.genero, S.tom, 'flutua', 'oi')}</div>
    </div>
    <input class="campo" id="campoNome" maxlength="15" autocomplete="off"
           autocapitalize="words" spellcheck="false" placeholder="seu nome">
    <div class="aviso" id="aviso"></div>
    <button class="btn btn-turquesa btn-p" id="bSort" style="margin:2px auto 0">🎲 Sortear um nome</button>
    <button class="btn btn-laranja btn-g" id="bIr" style="margin-top:auto">Começar a aventura ▸</button>`);

  const campo = q('#campoNome'), aviso = q('#aviso');
  const tentar = () => {
    const erro = validarNome(campo.value);
    if (erro) { aviso.textContent = erro; campo.classList.add('tremer'); SOM.errado();
      setTimeout(() => campo.classList.remove('tremer'), 420); return; }
    S.nome = capitalizar(campo.value);
    S.inicio = Date.now();
    SOM.certo();
    go(telaSalaLeitura);
  };
  q('#bIr').onclick = tentar;
  campo.onkeydown = e => { if (e.key === 'Enter') tentar(); };
  campo.oninput = () => aviso.textContent = '';
  q('#bSort').onclick = () => {
    SOM.toque();
    const lista = NOMES_SORTEIO[S.genero] || NOMES_SORTEIO.menina;
    campo.value = lista[Math.floor(Math.random() * lista.length)];
    aviso.textContent = '';
  };
  setTimeout(() => campo.focus(), 300);
}

/* ======================================================================== */
/* ==================== 2. SALA DE LEITURA (INTRO) ======================== */
/* ======================================================================== */
function telaSalaLeitura() {
  const eu = tam => `<div style="width:${tam}px">${ART.avatar(S.genero, S.tom, 'flutua')}</div>`;
  narrativa([
    { fundo: 'fundo-escola',
      arte: `<div style="display:flex; align-items:flex-end; gap:6px">
               <div style="width:120px">${ART.estante()}</div>${eu(96)}</div>`,
      texto: `Toca o sino do recreio. Todo mundo corre para o pátio…
              menos <b>${S.nome}</b>, que entra na sala de leitura.`,
      dizer: 'Toca o sino do recreio. Todo mundo corre para o pátio… '
           + 'menos você, que entra na sala de leitura.' },
    { fundo: 'fundo-escola',
      arte: `<div style="width:170px">${ART.livroAntigo(false, true)}</div>`,
      texto: `Numa prateleira alta há um livro velho:
              <b>O Livro das Descobertas</b>. ${S.nome} abre.`,
      dizer: 'Numa prateleira alta há um livro velho: O Livro das Descobertas. '
           + 'Você abre.' },
    { fundo: 'fundo-livro',
      arte: `<div style="width:220px">${ART.livroAntigo(true, true)}</div>`,
      texto: `O livro conta as invenções que mudaram tudo. Mas alguém arrancou
              <b>9 páginas</b>. Lendo, lendo… os olhos vão pesando.` },
    { fundo: 'fundo-livro',
      arte: `<div style="display:flex; align-items:center; gap:4px">
               <div style="width:150px">${ART.zezinho('oi', 'flutua')}</div></div>`,
      texto: `— Oi, <b>${S.nome}</b>! Sou o <b>Zezinho</b>, guardião deste livro.
              Sem as páginas perdidas, a história fica incompleta!`,
      dizer: 'Oi! Sou o Zezinho, guardião deste livro. '
           + 'Sem as páginas perdidas, a história fica incompleta!' },
    { fundo: 'fundo-livro',
      arte: `<div style="width:150px">${ART.zezinho('aponta', 'flutua')}</div>`,
      texto: `— Vamos buscar juntos? São <b>três épocas</b>.
              <b>Procure as páginas brilhando</b> em cada lugar!` }
  ], () => { S.fase = 1; salvar(); go(fase1_coleta); });
}

/* ======================================================================== */
/* ================== FASE 1 — PRÉ-HISTÓRIA: O FOGO ======================= */
/* ======================================================================== */

/* --- 1A. Coleta: lenha seca x lenha molhada -----------------------------
   A lição está na mecânica: molhada não serve. A criança descobre tocando,
   não lendo. Quem desenha é o Phaser (minijogos.js); se ele não carregar,
   a versão em HTML no fim da função assume e o jogo segue igual.         */
function fase1_coleta() {
  const PRECISA = 6;
  let secos = 0;
  pinta('fundo-pre', `
    ${topo('Fase 1 · O Fogo')}
    <div class="cartao cartao-creme" style="margin-bottom:10px" data-falar>
      <b>Junte ${PRECISA} gravetos SECOS.</b> Cuidado: os molhados não pegam fogo.
    </div>
    <div class="cena cena-borda" id="cena"
         style="background:linear-gradient(180deg,#7A5C46 0%,#A67C52 60%,#C99A66 100%)"></div>
    <div style="margin-top:10px">
      <div class="barra"><i id="bar"></i></div>
      <p style="text-align:center; margin-top:6px; font-size:15px" id="cont">
        0 de ${PRECISA} gravetos secos
      </p>
    </div>
    <!-- min-height: reserva o espaco da fala. Sem isso, a bolha do Zezinho
         encolhe a cena no meio da brincadeira e os gravetos de baixo saem
         da area onde da para tocar. -->
    <div id="rodape" style="margin-top:8px; min-height:86px"></div>`);

  const cena = q('#cena');

  const contar = n => {
    secos = n;
    q('#bar').style.width = (secos / PRECISA * 100) + '%';
    q('#cont').textContent = `${secos} de ${PRECISA} gravetos secos`;
  };

  const avisarMolhado = () => {
    falarRodape(fala(
      `Esse está <b>molhado</b>! A água rouba o calor da chama.
       Procure os claros e sequinhos.`, 'pensa'));
  };

  const concluir = () => {
    SOM.vitoria();
    q('#rodape').innerHTML = fala(
      `<b>Isso!</b> Lenha seca é a que pega fogo. Agora vem a parte difícil: <b>acender</b>.`,
      'feliz')
      + `<button class="btn btn-laranja btn-g" id="bIr" style="margin-top:10px">Vamos acender ▸</button>`;
    q('#bIr').onclick = () => { MINIJOGOS.destruir(); go(fase1_acender); };
  };

  if (MINIJOGOS.disponivel()) {
    MINIJOGOS.coleta(cena, {
      precisa: PRECISA,
      paginas: paginasQueFaltam('f1'),
      aoSeco: contar,
      aoMolhado: avisarMolhado,
      aoPagina: () => pegouPagina('f1'),
      aoCompletar: concluir
    });
    return;
  }

  // ---- reserva em HTML, caso o Phaser não esteja disponível ----
  const itens = embaralhar([...Array(7).fill('seco'), ...Array(5).fill('molhado')]);
  const pos = posicoes(itens.length, 3);
  itens.forEach((tipo, i) => {
    const d = document.createElement('div');
    d.className = 'alvo';
    d.style.width = '76px';
    d.style.left = pos[i].left + '%';
    d.style.top = pos[i].top + '%';
    d.innerHTML = tipo === 'seco' ? ART.gravetoSeco() : ART.gravetoMolhado();
    d.onclick = () => {
      if (d.classList.contains('coletado') || secos >= PRECISA) return;
      if (tipo === 'seco') {
        d.classList.add('coletado');
        SOM.coleta(); ganho(d, '+1');
        contar(secos + 1);
        if (secos >= PRECISA) concluir();
      } else {
        d.classList.add('tremer');
        setTimeout(() => d.classList.remove('tremer'), 420);
        SOM.errado();
        avisarMolhado();
      }
    };
    cena.appendChild(d);
  });
  soltarPaginas(cena, 'f1');
}

/* --- 1B. Acender: fricção + vento ---------------------------------------
   Um botão só. Normalmente ESFREGAR; quando o vento vem, o MESMO botão
   vira PROTEGER. Sem precisão de tempo (janela de 2 s) — funciona em
   celular velho e em tablet de escola igual.

   AQUI O PHASER É SÓ O DESENHISTA. A regra (quanto calor, quando venta)
   continua neste arquivo, onde já estava testada. Trocar o desenho não é
   motivo para reescrever a lógica.                                       */
function fase1_acender() {
  let calor = 0, vento = false, fim = false, timerVento, loop;

  pinta('fundo-pre', `
    ${topo('Fase 1 · O Fogo')}
    <div class="cartao cartao-creme" style="margin-bottom:10px" data-falar>
      <b>Esfregue as pedras</b> para esquentar. Quando o <b>vento</b> vier, proteja a chama!
    </div>
    <div class="cena cena-borda" id="cena"
         style="background:linear-gradient(180deg,#4A3B6B 0%,#8A5C42 100%)">
      <div id="fog" style="position:absolute; left:50%; top:50%;
           transform:translate(-50%,-50%); width:110px"></div>
      <div id="aviso" style="position:absolute; top:10px; left:0; right:0; text-align:center;
           font-size:20px; color:#fff; font-weight:bold; text-shadow:0 2px 6px #000;
           z-index:9; pointer-events:none"></div>
    </div>
    <div style="margin-top:10px">
      <div class="barra"><i id="bar"></i></div>
      <p style="text-align:center; margin-top:6px; font-size:15px" id="pct">calor: 0%</p>
    </div>
    <button class="btn btn-laranja btn-g nao-trava" id="bAcao" style="margin-top:6px">👐  ESFREGAR</button>
    <div id="rodape" style="margin-top:8px"></div>`);

  const cena = q('#cena'), fog = q('#fog'), bar = q('#bar'),
        pct = q('#pct'), bAcao = q('#bAcao'), aviso = q('#aviso');

  const usaPhaser = MINIJOGOS.disponivel();
  let pintor = null;
  if (usaPhaser) {
    fog.style.display = 'none';
    pintor = MINIJOGOS.fogo(cena, {});
  }

  const pinta_ = () => {
    bar.style.width = calor + '%';
    pct.textContent = 'calor: ' + Math.round(calor) + '%';
    if (pintor) { pintor.calor(calor); return; }
    fog.innerHTML = calor < 25 ? ART.pedraFogo() : ART.chama(Math.min(1, .45 + calor / 140));
    fog.style.width = calor < 25 ? '90px' : (70 + calor * .55) + 'px';
  };
  pinta_();

  const chamarVento = () => {
    if (fim) return;
    vento = true;
    aviso.textContent = '💨  VENTO!  proteja!';
    bAcao.textContent = '🖐  PROTEGER';
    bAcao.className = 'btn btn-turquesa btn-g nao-trava';
    SOM.vento();
    if (pintor) pintor.soprar(true);
    // Janela generosa: 2 segundos. Se perder, perde calor mas nunca "morre".
    timerVento = setTimeout(() => {
      if (fim || !vento) return;
      vento = false;
      aviso.textContent = '';
      bAcao.textContent = '👐  ESFREGAR';
      bAcao.className = 'btn btn-laranja btn-g nao-trava';
      if (pintor) pintor.soprar(false);
      calor = Math.max(0, calor - 14);
      SOM.errado();
      pinta_();
      falarRodape(fala('O vento levou parte do calor! Fique de olho no aviso 💨', 'pensa'));
    }, 2000);
  };

  bAcao.onclick = () => {
    if (fim) return;
    if (vento) {
      clearTimeout(timerVento);
      vento = false;
      aviso.textContent = '';
      bAcao.textContent = '👐  ESFREGAR';
      bAcao.className = 'btn btn-laranja btn-g nao-trava';
      if (pintor) pintor.soprar(false);
      SOM.certo();
      falarRodape(fala('Protegeu! Sem ar batendo, a chama se firma. 🔥', 'feliz'));
      return;
    }
    calor = Math.min(100, calor + 7);
    SOM.fogo();
    if (pintor) pintor.esfregou();
    pinta_();
    if (calor >= 100) {
      fim = true;
      clearInterval(loop); clearTimeout(timerVento);
      bAcao.disabled = true;
      aviso.textContent = '';
      if (pintor) pintor.acendeu();
      SOM.chama();
      setTimeout(() => { SOM.vitoria(); confete(); }, 260);
      falarRodape(fala(
        `<b>FOGO!</b> Levou muito tempo para a humanidade conseguir isso.
         Agora a pergunta de verdade: <b>para que serve?</b>`, 'feliz')
        + `<button class="btn btn-verde btn-g" id="bIr" style="margin-top:10px">Descobrir ▸</button>`);
      q('#bIr').onclick = () => { MINIJOGOS.destruir(); go(fase1_ondeUsar); };
    }
  };

  // Vento a cada 4–7 s, e só depois de 20% — não atrapalha o começo.
  loop = setInterval(() => {
    if (fim || vento || calor < 20) return;
    if (Math.random() < .45) chamarVento();
  }, 2300);
}

/* --- 1C. Onde usar o fogo? ----------------------------------------------
   Este é o coração pedagógico da fase, e é MECÂNICA, não texto: a criança
   decide onde aplicar o fogo e vê o resultado mudar na tela.               */
function fase1_ondeUsar() {
  const casos = [
    { id: 'carne', titulo: 'A carne está crua',
      antes: ART.carneCrua(), depois: ART.carneAssada(),
      licao: 'Cozinhar <b>amolece</b> o alimento e <b>mata micróbios</b>. A tribo passou a tirar mais energia da mesma comida — e a adoecer menos.' },
    { id: 'frio', titulo: 'A criança está com frio',
      antes: ART.criancaFrio(false), depois: ART.criancaFrio(true),
      licao: 'O fogo <b>aquece</b>. Com ele, a humanidade conseguiu viver em lugares frios onde antes não dava.' },
    { id: 'animal', titulo: 'Um animal ronda de noite',
      antes: ART.animalNoturno(false), depois: ART.animalNoturno(true),
      licao: 'Quase todo animal <b>tem medo do fogo</b>. A fogueira virou a primeira porta trancada da história.' }
  ];
  let resolvidos = 0;

  const desenha = (feitos = {}) => {
    pinta('fundo-pre', `
      ${topo('Fase 1 · O Fogo')}
      <div class="cartao cartao-creme" style="margin-bottom:10px" data-falar>
        <b>Toque em cada problema</b> para usar o fogo nele. Veja o que acontece.
      </div>
      <div class="rolavel" id="lista">
        ${casos.map(c => `
          <div class="cartao ${feitos[c.id] ? '' : 'pulsa'}" data-id="${c.id}"
               style="margin-bottom:11px; cursor:${feitos[c.id] ? 'default' : 'pointer'};
                      ${feitos[c.id] ? 'background:#E4F8E9' : ''}">
            <div style="display:flex; align-items:center; gap:12px">
              <div style="flex:0 0 74px">${feitos[c.id] ? c.depois : c.antes}</div>
              <div>
                <b>${c.titulo}</b> ${feitos[c.id] ? '✅' : ''}
                <div style="font-size:14.5px; margin-top:5px; color:var(--texto-claro)">
                  ${feitos[c.id] ? c.licao : 'toque para usar o fogo 🔥'}
                </div>
              </div>
            </div>
          </div>`).join('')}
      </div>
      <div id="rodape"></div>`);

    qq('#lista .cartao').forEach(el => el.onclick = () => {
      const id = el.dataset.id;
      if (feitos[id]) return;
      feitos[id] = true; resolvidos++;
      SOM.certo();
      const novo = { ...feitos };
      desenha(novo);
      if (resolvidos >= casos.length) {
        SOM.vitoria();
        q('#rodape').innerHTML = fala(
          `Viu? O fogo mudou <b>o que se come, onde se mora e quem manda na noite</b>.
           Guarde uma coisa: <b>calor mata micróbio</b>. Isso volta na Fase 3!`, 'feliz')
          + `<button class="btn btn-laranja btn-g" id="bIr" style="margin-top:10px">Responder o quiz ▸</button>`;
        q('#bIr').onclick = () => go(fase1_quiz);
      }
    });
  };
  desenha();
}

function fase1_quiz() {
  quiz('Quiz do Fogo', [
    { q: 'Por que a lenha molhada quase não pega fogo?',
      opcoes: ['A água precisa virar vapor primeiro, e isso rouba o calor da chama',
               'Porque a lenha molhada é mais velha que a seca',
               'Porque a água é mais pesada que a madeira'],
      porque: 'Toda a energia da chama vai primeiro para secar a água. Só depois a madeira consegue queimar.' },
    { q: 'O que cozinhar mudou na vida da nossa espécie?',
      opcoes: ['Amoleceu o alimento e matou micróbios: mais energia e menos doenças',
               'Deixou a comida mais bonita no prato',
               'Fez a comida durar para sempre'],
      porque: 'Comida cozida é mais fácil de digerir. Sobra energia para o corpo — e para o cérebro.' },
    { q: 'Além de cozinhar, para que a tribo usava o fogo?',
      opcoes: ['Para aquecer no frio e afastar animais à noite',
               'Só para enxergar melhor durante o dia',
               'Para deixar a caverna colorida'],
      porque: 'Aquecer, proteger e cozinhar. Três usos, uma invenção.' }
  ], 'Fase 1 · O Fogo', () => { S.fase = 2; salvar(); go(fase2_intro); });
}

/* ======================================================================== */
/* =================== FASE 2 — SÉCULO 18: A VACINA ======================= */
/* ======================================================================== */
function fase2_intro() {
  narrativa([
    { fundo: 'fundo-livro',
      arte: `<div style="width:150px">${ART.zezinho('aponta', 'flutua')}</div>`,
      texto: `— Boa, <b>${S.nome}</b>! Você já achou ${S.paginas} página${S.paginas === 1 ? '' : 's'} até agora.
              Agora segure firme: vamos pular <b>uns 300 mil anos</b> para a frente!`,
      dizer: 'Boa! Agora segure firme: vamos pular uns 300 mil anos para a frente!' },
    { fundo: 'fundo-fazenda',
      arte: `<div style="display:flex; align-items:flex-end; gap:8px">
               <div style="width:140px">${ART.vaca()}</div>
               <div style="width:80px">${ART.jenner()}</div></div>`,
      texto: `<b>Inglaterra, 1796.</b> Uma doença chamada <b>varíola</b> assusta o mundo:
              dá febre, enche a pele de feridas e mata muita gente.` },
    { fundo: 'fundo-fazenda',
      arte: `<div style="width:100px">${ART.jenner()}</div>`,
      texto: `Este é o médico <b>Edward Jenner</b>. Sem remédio, sem microscópio.
              Ele tem uma coisa só: <b>olho de observador</b>.` },
    { fundo: 'fundo-fazenda',
      arte: `<div style="width:150px">${ART.zezinho('pensa', 'flutua')}</div>`,
      texto: `— <b>${S.nome}</b>, o Jenner precisa da sua ajuda. Vamos fazer o que todo
              cientista faz primeiro: <b>observar</b> e procurar um padrão.`,
      dizer: 'O Jenner precisa da sua ajuda. Vamos fazer o que todo cientista '
           + 'faz primeiro: observar e procurar um padrão.' }
  ], () => go(fase2_observar));
}

/* --- 2A. Observar as pessoas da fazenda ---------------------------------
   Método científico como MECÂNICA: a criança toca em cada pessoa, vê quem
   adoeceu e descobre o padrão sozinha. Ninguém conta a resposta antes.     */
function fase2_observar() {
  // ordenhadeira → pegou a varíola das VACAS (fraca) → não pegou a humana
  const gente = embaralhar([
    { orden: true,  nome: 'Mary, ordenhadeira',    doente: false },
    { orden: true,  nome: 'Sarah, ordenhadeira',   doente: false },
    { orden: true,  nome: 'Nell, ordenhadeira',    doente: false },
    { orden: false, nome: 'John, padeiro',         doente: true  },
    { orden: false, nome: 'Thomas, ferreiro',      doente: true  },
    { orden: false, nome: 'Emma, costureira',      doente: true  }
  ]);
  let vistos = 0;

  const desenha = (abertos = {}) => {
    pinta('fundo-fazenda', `
      ${topo('Fase 2 · A Vacina')}
      <div class="cartao cartao-creme" style="margin-bottom:10px" data-falar>
        <b>Toque em cada pessoa da fazenda.</b> Quem pegou varíola? Procure o padrão.
      </div>
      <div class="rolavel">
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px" id="grade">
          ${gente.map((p, i) => `
            <div class="cartao" data-i="${i}" style="padding:8px 5px; text-align:center;
                 cursor:pointer; ${abertos[i] ? (p.doente ? 'background:#FDE7E6' : 'background:#E4F8E9') : ''}">
              <div style="height:96px">${ART.aldeao(abertos[i] && p.doente ? 'doente'
                : p.orden ? 'ordenhadeira' : 'sadio', i)}</div>
              <div style="font-size:11.5px; line-height:1.25; margin-top:4px">
                <b>${p.nome.split(',')[0]}</b><br>
                <span style="color:var(--texto-claro)">${p.nome.split(',')[1]}</span>
              </div>
              <div style="font-size:12.5px; font-weight:bold; margin-top:4px; min-height:16px;
                   color:${p.doente ? 'var(--vermelho-esc)' : 'var(--verde-esc)'}">
                ${abertos[i] ? (p.doente ? 'pegou varíola' : 'nunca pegou') : '❔'}
              </div>
            </div>`).join('')}
        </div>
      </div>
      <p style="text-align:center; font-size:14px; margin-top:8px" id="cont">
        ${vistos} de ${gente.length} pessoas observadas
      </p>
      <div id="rodape"></div>`);

    qq('#grade .cartao').forEach(c => c.onclick = () => {
      const i = +c.dataset.i;
      if (abertos[i]) return;
      abertos[i] = true; vistos++;
      SOM.toque();
      desenha({ ...abertos });
      if (vistos >= gente.length) {
        SOM.certo();
        q('#rodape').innerHTML = fala(
          `Olhe as <b>mãos</b> das três que nunca adoeceram: elas têm marquinhas.
           Elas pegaram a <b>varíola das vacas</b>, que é fraquinha.`, 'pensa')
          + `<button class="btn btn-laranja btn-g" id="bIr" style="margin-top:10px">Contar ao Jenner ▸</button>`;
        q('#bIr').onclick = () => go(fase2_conclusao);
      }
    });
  };
  desenha();
}

function fase2_conclusao() {
  const ops = embaralhar([
    { t: 'Quem pega a varíola das vacas, mais fraca, fica protegido da varíola humana', certa: true },
    { t: 'Quem trabalha com vaca fica mais forte e não adoece de nada', certa: false },
    { t: 'Foi coincidência: essas três pessoas deram sorte', certa: false }
  ]);
  pinta('fundo-fazenda', `
    ${topo('Fase 2 · A Vacina')}
    <div style="display:flex; align-items:flex-end; gap:8px; margin-bottom:10px">
      <div style="width:74px">${ART.jenner()}</div>
      <div class="cartao" style="flex:1" data-falar="Jenner: e então? O que você concluiu?">
        <b>Jenner:</b> — E então, ${S.nome}? O que você concluiu?
      </div>
    </div>
    <div class="opcoes" id="ops">
      ${ops.map((o, k) => `<button class="opcao" data-k="${k}">${o.t}</button>`).join('')}
    </div>
    <div id="rodape" style="margin-top:12px"></div>`);

  qq('#ops .opcao').forEach(b => b.onclick = () => {
    const certa = ops[+b.dataset.k].certa;
    qq('#ops .opcao').forEach((x, j) => { x.disabled = true; if (ops[j].certa) x.classList.add('certa'); });
    if (!certa) b.classList.add('errada');
    S.total++; if (certa) S.acertos++;
    S.registro.push({ fase: 'Fase 2 · A Vacina', pergunta: 'Conclusão da observação', acertou: certa });
    certa ? SOM.certo() : SOM.errado();
    q('#rodape').innerHTML = fala(
      `${certa ? '<b>Exatamente!</b>' : '<b>Olhe de novo:</b>'} a varíola das vacas é fraquinha.
       O corpo treina com ela e reconhece a forte.
       Daí o nome <b>vacina</b>: <i>vacca</i> é vaca em latim.`, certa ? 'feliz' : 'pensa',
      'A varíola das vacas é fraquinha. O corpo treina com ela e reconhece a forte. '
      + 'Daí o nome vacina: vacca é vaca em latim.')
      + `<button class="btn btn-laranja btn-g" id="bIr" style="margin-top:10px">Montar a vacina ▸</button>`;
    q('#bIr').onclick = () => go(fase2_ordem);
  });
}

/* --- 2B. Montar a vacina na ordem certa -------------------------------- */
function fase2_ordem() {
  const passos = [
    'Observar que quem ordenha vaca não pega a varíola humana',
    'Recolher uma amostra da varíola das vacas, que é fraca',
    'Colocar essa amostra na pele de uma pessoa saudável',
    'O corpo treina a defesa e fica protegido da varíola humana'
  ];
  let proximo = 0;
  const ordem = embaralhar(passos.map((t, i) => ({ t, i })));

  const desenha = (feitos = []) => {
    pinta('fundo-fazenda', `
      ${topo('Fase 2 · A Vacina')}
      <div class="cartao cartao-creme" style="margin-bottom:10px" data-falar>
        <b>Toque na ordem certa</b>, do primeiro passo ao último.
      </div>
      <div class="rolavel">
        <div class="opcoes" id="ops">
          ${ordem.map((o, k) => `
            <button class="opcao ${feitos.includes(o.i) ? 'certa' : ''}" data-k="${k}"
              ${feitos.includes(o.i) ? 'disabled' : ''}>
              ${feitos.includes(o.i) ? `<b>${feitos.indexOf(o.i) + 1}º</b> · ` : ''}${o.t}
            </button>`).join('')}
        </div>
      </div>
      <div style="display:flex; justify-content:center; margin-top:8px">
        <div style="width:130px">${ART.seringa()}</div>
      </div>
      <div id="rodape"></div>`);

    qq('#ops .opcao').forEach(b => b.onclick = () => {
      const o = ordem[+b.dataset.k];
      if (o.i === proximo) {
        proximo++; SOM.coleta(); ganho(b, '✔');
        const novo = [...feitos, o.i];
        desenha(novo);
        if (proximo >= passos.length) {
          SOM.vitoria();
          q('#rodape').innerHTML = fala(
            `<b>Pronto!</b> Em 1796, Jenner fez isso em um menino de 8 anos, o James Phipps.
             Deu certo. Agora vamos ver <b>por dentro do corpo</b> o que a vacina faz.`, 'feliz')
            + `<button class="btn btn-verde btn-g" id="bIr" style="margin-top:10px">Entrar no corpo ▸</button>`;
          q('#bIr').onclick = () => go(fase2_defesa);
        }
      } else {
        b.classList.add('tremer'); SOM.errado();
        setTimeout(() => b.classList.remove('tremer'), 420);
        // Só avisa se o botão de continuar ainda NÃO nasceu. Sem esta guarda,
        // um toque errado logo depois do último passo apagava o rodapé — e
        // levava o "Continuar" junto, deixando a criança sem saída na tela.
        if (proximo < passos.length)
          q('#rodape').innerHTML =
            fala('Esse passo vem depois. Pense: o que o Jenner fez <b>primeiro</b>?', 'pensa');
      }
    });
  };
  desenha();
}

/* --- 2C. Defender o corpo ----------------------------------------------
   A LIÇÃO ESTÁ NA MECÂNICA, e é a mais importante do jogo:
   Rodada 1 (sem vacina): a criança toca nos germes e NADA acontece —
     o corpo não sabe quem é o invasor. A frustração é o ensinamento.
   Rodada 2 (com vacina): as defesas já estão prontas e agora funciona.
   Ninguém precisa LER que "vacina treina antes". A criança sentiu.       */
function fase2_defesa() {
  const PRECISA = 8;
  let rodada = 1, vivo = null;

  const cabecalho = () => `
    ${topo('Fase 2 · A Vacina')}
    <div class="cartao cartao-creme" style="margin-bottom:8px" data-falar>
      <b>${rodada === 1 ? 'Rodada 1 — o corpo AINDA NÃO tomou vacina.'
                        : 'Rodada 2 — agora sim: as defesas estão treinadas!'}</b><br>
      <span style="font-size:14.5px">${rodada === 1
        ? 'Toque nos germes para tentar impedir que cheguem ao corpo.'
        : `Toque nos germes! Faltam <span id="faltam">${PRECISA}</span>.`}</span>
    </div>
    <div class="cena cena-borda" id="cena" style="background:transparent"></div>
    <div id="rodape" style="margin-top:8px; min-height:86px"></div>`;

  const perder = () => {
    if (vivo) vivo.parar();
    SOM.errado();
    q('#rodape').innerHTML = fala(
      `Não deu, né? <b>E não é culpa sua.</b> Sem vacina, o corpo leva dias
       para descobrir o invasor — e nesse tempo a pessoa adoece.`, 'pensa')
      + `<button class="btn btn-verde btn-g pulsa" id="bVac" style="margin-top:10px">
           💉  TOMAR A VACINA</button>`;
    q('#bVac').onclick = () => {
      SOM.vacina();
      rodada = 2;
      if (vivo) vivo.parar();
      pinta('fundo-corpo', cabecalho());
      montar(true);
      q('#rodape').innerHTML = fala(
        `Sentiu a diferença? A vacina mostrou o invasor <b>antes</b> de ele
         chegar. Agora as defesas já estavam prontas esperando. Agora é com você!`, 'feliz');
    };
  };

  const vencer = () => {
    if (vivo) vivo.parar();
    SOM.vitoria(); confete();
    q('#rodape').innerHTML = fala(
      `<b>Defendido!</b> Guarde isso: vacina <b>não</b> é remédio de doente.
       É <b>treino antecipado</b> da defesa do corpo.`, 'feliz',
      'Defendido! Guarde isso: vacina não é remédio de doente. '
      + 'É treino antecipado da defesa do corpo.')
      + `<button class="btn btn-laranja btn-g" id="bIr" style="margin-top:10px">Responder o quiz ▸</button>`;
    q('#bIr').onclick = () => { MINIJOGOS.destruir(); go(fase2_quiz); };
  };

  function montar(jaVacinado) {
    const cena = q('#cena');
    if (!MINIJOGOS.disponivel()) { montarHTML(cena, jaVacinado); return; }
    vivo = MINIJOGOS.defesa(cena, {
      jaVacinado: !!jaVacinado,
      paginas: paginasQueFaltam('f2'),
      aoPagina: () => pegouPagina('f2'),
      aoTocarSemVacina: () => {
        falarRodape(fala(
          `O corpo <b>não reconhece</b> esse invasor! Ele nunca viu isso antes,
           então não sabe qual defesa usar.`, 'pensa'));
      },
      aoMatar: n => {
        const f = q('#faltam');
        if (f) f.textContent = Math.max(0, PRECISA - n);
        if (n >= PRECISA) vencer();
      },
      aoChegar: (n, vacinado) => { if (!vacinado && n >= 3) perder(); }
    });
  }

  /* ---- reserva em HTML, se o Phaser não carregar ---- */
  function montarHTML(cena, jaVacinado) {
    let mortos = 0, chegaram = 0, vacinado = !!jaVacinado, rodando = true;
    cena.innerHTML = `
      <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
                  width:96px; pointer-events:none" id="alvoCorpo">
        ${ART.escudoCorpo(vacinado ? 1 : 0)}</div>`;
    const soltar = () => {
      if (!rodando || !cena.isConnected) return;
      const d = document.createElement('div');
      d.className = 'alvo';
      d.style.width = '44px'; d.style.zIndex = 8;
      const lado = Math.floor(Math.random() * 4), r = Math.random() * 76 + 8;
      d.style.left = lado === 2 ? '-14%' : lado === 3 ? '104%' : r + '%';
      d.style.top  = lado === 0 ? '-14%' : lado === 1 ? '104%' : r + '%';
      d.innerHTML = ART.germe(['#7ED957', '#8A6BE0', '#F0524B'][Math.floor(Math.random() * 3)]);
      cena.appendChild(d);
      requestAnimationFrame(() => {
        d.style.transition = 'left 4.4s linear, top 4.4s linear';
        d.style.left = 'calc(50% - 22px)'; d.style.top = 'calc(50% - 22px)';
      });
      d.onclick = () => {
        if (!rodando) return;
        if (!vacinado) {
          d.classList.add('tremer'); SOM.errado();
          setTimeout(() => d.classList.remove('tremer'), 420);
          const rp = q('#rodape');
          if (rp) rp.innerHTML = fala(
            `O corpo <b>não reconhece</b> esse invasor! Ele nunca viu isso antes,
             então não sabe qual defesa usar.`, 'pensa');
          return;
        }
        d.remove(); mortos++; SOM.germe();
        const f = q('#faltam');
        if (f) f.textContent = Math.max(0, PRECISA - mortos);
        if (mortos >= PRECISA) { rodando = false; clearInterval(t); vencer(); }
      };
      setTimeout(() => {
        if (!d.isConnected || !rodando) return;
        d.remove(); chegaram++;
        if (!vacinado && chegaram >= 3) { rodando = false; clearInterval(t); perder(); }
      }, 4500);
    };
    const t = setInterval(soltar, vacinado ? 900 : 1500);
    soltar();
    soltarPaginas(cena, 'f2');
    vivo = { parar: () => { rodando = false; clearInterval(t); },
             vacinar: () => { vacinado = true; } };
  }

  pinta('fundo-corpo', cabecalho());
  montar(false);
}

function fase2_quiz() {
  quiz('Quiz da Vacina', [
    { q: 'O que Jenner percebeu observando quem ordenhava vacas?',
      opcoes: ['Quem pegava a varíola das vacas, mais fraca, não pegava a varíola humana',
               'Que quem trabalha com vaca fica mais forte',
               'Que a vaca nunca fica doente'],
      porque: 'Ele não descobriu por sorte: descobriu <b>observando um padrão</b> e depois testando.' },
    { q: 'Como a vacina protege a gente?',
      opcoes: ['Mostra ao corpo uma versão inofensiva do invasor, e o corpo treina a defesa antes',
               'Mata todos os germes que existem no mundo',
               'Deixa a pele grossa para o germe não entrar'],
      porque: 'É treino, não escudo. O corpo guarda a “ficha” do invasor e reage rápido na hora certa.' },
    { q: 'Por que tomar vacina ANTES de ficar doente?',
      opcoes: ['Porque o corpo leva dias treinando; se esperar a doença, pode ser tarde',
               'Porque a vacina estraga se guardar muito tempo',
               'Porque depois de doente a vacina dói mais'],
      porque: 'Você viveu isso na rodada 1: sem treino prévio, o invasor chega antes da defesa.' }
  ], 'Fase 2 · A Vacina', () => { S.fase = 3; salvar(); go(fase3_intro); });
}

/* ======================================================================== */
/* ============= FASE 3 — PASTEUR, OS MICRÓBIOS E O PRESENTE ============== */
/* ======================================================================== */
function fase3_intro() {
  narrativa([
    { fundo: 'fundo-lab',
      arte: `<div style="width:150px">${ART.zezinho('aponta', 'flutua')}</div>`,
      texto: `— Falta uma peça, <b>${S.nome}</b>. O Jenner fez a vacina funcionar,
              mas <b>ninguém sabia por quê</b>. Ninguém sabia que existiam micróbios!`,
      dizer: 'Falta uma peça. O Jenner fez a vacina funcionar, mas ninguém sabia '
           + 'por quê. Ninguém sabia que existiam micróbios!' },
    { fundo: 'fundo-lab',
      arte: `<div style="width:110px">${ART.pasteur()}</div>`,
      texto: `<b>França, uns 60 anos depois.</b> Este é <b>Louis Pasteur</b>.
              Na época, muita gente achava que os bichinhos <b>nasciam sozinhos</b> na comida estragada.` },
    { fundo: 'fundo-lab',
      arte: `<div style="display:flex; gap:14px; align-items:flex-end">
               <div style="width:80px">${ART.frasco(false, false, 'A')}</div>
               <div style="width:80px">${ART.frasco(false, false, 'B')}</div></div>`,
      texto: `Pasteur montou <b>dois frascos iguais</b> de caldo.
              Ciência é assim: <b>mude uma coisa só e compare</b>.` }
  ], () => go(fase3_lab));
}

/* --- 3A. O experimento de Pasteur --------------------------------------
   Grupo de controle como mecânica. Para uma feira de CIÊNCIAS, isso é o
   momento mais valioso do jogo: a criança executa um experimento honesto. */
function fase3_lab() {
  let fervido = false, passou = false;

  const desenha = () => {
    pinta('fundo-lab', `
      ${topo('Fase 3 · Os Micróbios')}
      <div class="cartao cartao-creme" style="margin-bottom:10px" data-falar>
        ${!fervido ? '<b>Passo 1:</b> ferva <b>só o frasco B</b>. O A fica do jeito que está — ele é a comparação.'
          : !passou ? '<b>Passo 2:</b> agora espere. Toque em “passar 3 dias”.'
            : '<b>Compare os dois frascos.</b> O que mudou entre eles?'}
      </div>
      <div class="cena cena-borda" id="cena" style="background:linear-gradient(180deg,#4E6A99,#8FA9C9)">
        <div style="position:absolute; inset:0; display:flex; align-items:center;
                    justify-content:center; gap:26px">
          <div style="text-align:center">
            <div style="width:84px">${ART.frasco(false, passou, 'A · não fervido')}</div>
            <div style="width:66px; margin:0 auto">${ART.fogareiro(false)}</div>
          </div>
          <div style="text-align:center">
            <div style="width:84px">${ART.frasco(fervido, false, 'B · fervido')}</div>
            <div style="width:66px; margin:0 auto; cursor:pointer" id="fogB">
              ${ART.fogareiro(fervido)}
            </div>
          </div>
        </div>
      </div>
      <div id="rodape" style="margin-top:10px">
        ${!fervido
          ? fala('Toque no <b>fogareiro embaixo do frasco B</b> para ferver. 🔥', 'aponta')
          : !passou
            ? `<button class="btn btn-turquesa btn-g" id="bDias">⏳  passar 3 dias</button>`
            : ''}
      </div>`);

    if (!fervido) {
      q('#fogB').onclick = () => {
        fervido = true; SOM.fogo(); desenha();
      };
    } else if (!passou) {
      q('#bDias').onclick = () => {
        passou = true; SOM.toque(); desenha();
        setTimeout(() => {
          q('#rodape').innerHTML = fala(
            `O frasco <b>A</b>, não fervido, encheu de micróbios. O <b>B</b> está limpo.
             Se os micróbios nascessem sozinhos, os dois estariam iguais.`, 'feliz')
            + `<button class="btn btn-laranja btn-g" id="bIr" style="margin-top:10px">O que isso prova? ▸</button>`;
          q('#bIr').onclick = () => go(fase3_conclusao);
        }, 700);
      };
    }
    soltarPaginas(q('#cena'), 'f3');
  };
  desenha();
}

function fase3_conclusao() {
  const ops = embaralhar([
    { t: 'Micróbios vêm de fora, e o calor consegue matá-los', certa: true },
    { t: 'O caldo cria vida sozinho, do nada', certa: false },
    { t: 'Caldo fervido é mais gostoso que caldo cru', certa: false }
  ]);
  pinta('fundo-lab', `
    ${topo('Fase 3 · Os Micróbios')}
    <div style="display:flex; align-items:flex-end; gap:8px; margin-bottom:10px">
      <div style="width:74px">${ART.pasteur()}</div>
      <div class="cartao" style="flex:1" data-falar="Pasteur: e então? O que o experimento prova?">
        <b>Pasteur:</b> — E então, ${S.nome}? O que o experimento prova?
      </div>
    </div>
    <div class="opcoes" id="ops">
      ${ops.map((o, k) => `<button class="opcao" data-k="${k}">${o.t}</button>`).join('')}
    </div>
    <div id="rodape" style="margin-top:12px"></div>`);

  qq('#ops .opcao').forEach(b => b.onclick = () => {
    const certa = ops[+b.dataset.k].certa;
    qq('#ops .opcao').forEach((x, j) => { x.disabled = true; if (ops[j].certa) x.classList.add('certa'); });
    if (!certa) b.classList.add('errada');
    S.total++; if (certa) S.acertos++;
    S.registro.push({ fase: 'Fase 3 · Os Micróbios', pergunta: 'Conclusão do experimento', acertou: certa });
    certa ? SOM.certo() : SOM.errado();
    q('#rodape').innerHTML = fala(
      `${certa ? '<b>É isso!</b>' : '<b>Repare nos dois frascos:</b>'}
       E agora a parte bonita: <b>lembra do fogo da tribo?</b> Cozinhar já matava
       micróbios <b>sem ninguém saber</b>, 300 mil anos antes.`, certa ? 'feliz' : 'pensa',
      'E agora a parte bonita: lembra do fogo da tribo? Cozinhar já matava micróbios '
      + 'sem ninguém saber, 300 mil anos antes.')
      + `<button class="btn btn-verde btn-g" id="bIr" style="margin-top:10px">Voltar para hoje ▸</button>`;
    q('#bIr').onclick = () => go(fase3_ponte);
  });
}

/* --- 3B. Ponte para o presente ------------------------------------------ */
function fase3_ponte() {
  narrativa([
    { fundo: 'fundo-lab',
      arte: `<div style="width:150px">${ART.zezinho('oi', 'flutua')}</div>`,
      texto: `— Sua última missão, <b>${S.nome}</b>: levar isso para o <b>presente</b>.
              Segure firme!`,
      dizer: 'Sua última missão: levar isso para o presente. Segure firme!' },
    { fundo: 'fundo-sala',
      arte: `<div style="display:flex; align-items:flex-end; gap:8px">
               <div style="width:100px">${ART.avatar(S.genero, S.tom, 'flutua')}</div>
               <div style="width:110px">${ART.estante()}</div></div>`,
      texto: `De repente <b>${S.nome}</b> está de volta à sala do Colégio Dom José —
              mas ainda dentro do sonho. Três colegas estão conversando…`,
      dizer: 'De repente você está de volta à sala do Colégio Dom José, mas ainda '
           + 'dentro do sonho. Três colegas estão conversando.' },
    { fundo: 'fundo-sala',
      arte: `<div style="display:flex; align-items:flex-end; gap:4px">
               <div style="width:72px">${ART.colega(0, 'flutua')}</div>
               <div style="width:72px">${ART.colega(1, 'flutua2')}</div>
               <div style="width:72px">${ART.colega(2, 'flutua')}</div></div>`,
      texto: `…e eles estão com <b>dúvidas sobre a vacina</b>. Use o que você viu nas três épocas.
              Responda com <b>a verdade</b>, não com o que soa bonito.` }
  ], () => go(fase3_persuasao));
}

/* --- 3C. Convencer os colegas -------------------------------------------
   São colegas FICTÍCIOS, de propósito. A versão original pedia para a
   criança convencer a própria família — isso põe a criança no meio de uma
   discussão de adulto e a bronca sobraria para o colégio, não para o jogo.
   O conteúdo científico continua inteiro; o atrito desaparece.             */
function fase3_persuasao() {
  const colegas = [
    { nome: 'Bia', i: 0, fala: '— Eu nunca fico doente! Pra que eu ia tomar vacina?',
      ops: [
        { t: 'A vacina treina a defesa ANTES. Se esperar ficar doente, o treino chega tarde.', certa: true },
        { t: 'É verdade, quem é forte não precisa tomar.', certa: false },
        { t: 'Tome porque a professora mandou.', certa: false }
      ],
      resp: 'Nunca ter ficado doente não é proteção — é sorte. E sorte não treina defesa.' },
    { nome: 'Téo', i: 1, fala: '— Mas a picada dói! Não vou tomar.',
      ops: [
        { t: 'Dói um segundo. A doença que ela evita dói dias — a varíola chegava a matar.', certa: true },
        { t: 'Não dói nada, é invenção sua.', certa: false },
        { t: 'Então não tome, tanto faz.', certa: false }
      ],
      resp: 'Repare: a resposta certa <b>não mentiu</b> dizendo que não dói. Ela comparou os tamanhos da dor.' },
    { nome: 'Nina', i: 2, fala: '— Ouvi dizer que vacina é coisa nova, inventada às pressas.',
      ops: [
        { t: 'A primeira foi em 1796, com Jenner. São mais de 200 anos de teste e melhora.', certa: true },
        { t: 'Também acho estranho, melhor não tomar.', certa: false },
        { t: 'Quem falou isso para você não entende nada.', certa: false }
      ],
      resp: 'Data e fato resolvem a dúvida. Ofender quem duvida só fecha a conversa.' }
  ];
  let i = 0, convencidos = 0;

  const desenha = () => {
    const c = colegas[i];
    const ops = embaralhar(c.ops);
    pinta('fundo-sala', `
      ${topo('Fase 3 · Os Micróbios')}
      <div style="display:flex; align-items:flex-end; gap:8px; margin-bottom:10px">
        <div style="width:76px">${ART.colega(c.i)}</div>
        <div class="cartao" style="flex:1" data-falar>
          <div class="rotulo">${c.nome} · colega ${i + 1} de 3</div>
          <p style="margin-top:5px"><b>${c.fala}</b></p>
        </div>
      </div>
      <div class="rolavel">
        <div class="opcoes" id="ops">
          ${ops.map((o, k) => `<button class="opcao" data-k="${k}">${o.t}</button>`).join('')}
        </div>
        <div id="rodape" style="margin-top:12px"></div>
      </div>`);

    qq('#ops .opcao').forEach(b => b.onclick = () => {
      const certa = ops[+b.dataset.k].certa;
      qq('#ops .opcao').forEach((x, j) => { x.disabled = true; if (ops[j].certa) x.classList.add('certa'); });
      if (!certa) b.classList.add('errada');
      S.total++; if (certa) { S.acertos++; convencidos++; }
      S.registro.push({ fase: 'Fase 3 · Convencer', pergunta: c.nome, acertou: certa });
      certa ? SOM.certo() : SOM.errado();
      q('#rodape').innerHTML = fala(
        `${certa ? `<b>${c.nome} entendeu!</b> ` : '<b>Hmm.</b> '}${c.resp}`,
        certa ? 'feliz' : 'pensa', c.resp)
        + `<button class="btn btn-laranja btn-g" id="bIr" style="margin-top:10px">
             ${i < colegas.length - 1 ? 'Próximo colega ▸' : 'Quiz final ▸'}</button>`;
      q('#bIr').onclick = () => { i++; if (i < colegas.length) go(desenha); else go(fase3_quizFinal); };
    });
  };
  desenha();
}

function fase3_quizFinal() {
  quiz('Quiz Final', [
    { q: 'O experimento de Pasteur com os dois frascos mostrou que…',
      opcoes: ['Micróbios vêm de fora, e o calor consegue matá-los',
               'O caldo cria vida sozinho, do nada',
               'Frascos de vidro protegem contra doenças'],
      porque: 'Dois frascos iguais, uma diferença só: o calor. Foi o calor que explicou o resultado.' },
    { q: 'O que o fogo da pré-história e a fervura de Pasteur têm em comum?',
      opcoes: ['Os dois usam calor, e o calor mata micróbios',
               'Os dois fazem fumaça',
               'Os dois servem para iluminar'],
      porque: 'A tribo já matava micróbios cozinhando — 300 mil anos antes de alguém saber que micróbios existiam.' },
    { q: 'Por que a caderneta de vacinação tem data marcada de reforço?',
      opcoes: ['Porque o corpo precisa relembrar o treino de tempo em tempo',
               'Porque a vacina só funciona em dia de sol',
               'Porque o posto de saúde fecha nos outros dias'],
      porque: 'Algumas defesas enfraquecem com o tempo. O reforço é revisão para o corpo.' },
    { q: 'Quem se vacina também protege quem está por perto. Por quê?',
      opcoes: ['Se a pessoa não adoece, ela não passa a doença adiante',
               'Porque a vacina espalha um perfume protetor no ar',
               'Porque a pessoa fica mais forte e carrega os outros'],
      porque: 'Quanto mais gente vacinada, menos caminho a doença tem para andar. Isso protege até os bebês pequenos, que ainda não podem tomar todas as vacinas.' },
    { q: 'Qual é a ordem certa na história da ciência?',
      opcoes: ['Fogo → vacina de Jenner → micróbios de Pasteur',
               'Vacina → fogo → micróbios',
               'Micróbios → fogo → vacina'],
      porque: 'Curioso, né? A vacina veio ANTES de alguém entender o micróbio. Funcionou primeiro, foi explicada depois.' }
  ], 'Quiz Final', () => { S.fase = 4; salvar(); go(telaFinal); });
}

/* ======================================================================== */
/* ============================ FINAL ===================================== */
/* ======================================================================== */
const CURIOSIDADES = [
  ['O fogo é mais velho que a escrita', 'Nossa espécie já usava fogo há pelo menos <b>300 mil anos</b> — e há indícios de que seja bem mais antigo. A escrita tem só uns 5 mil anos.'],
  ['Cozinhar ajudou o cérebro a crescer', 'Comida cozida solta mais energia. Sobrou combustível para um cérebro grande e caro de manter.'],
  ['“Vacina” vem de vaca', 'A palavra nasce de <i>vacca</i>, vaca em latim, por causa da varíola bovina que Jenner usou.'],
  ['O primeiro vacinado tinha 8 anos', 'Em 1796, Jenner testou no menino <b>James Phipps</b>. Deu certo.'],
  ['A varíola não existe mais', 'É a única doença humana já <b>erradicada do planeta</b>. Foi declarada extinta em <b>1980</b>, graças à vacina.'],
  ['Pasteur inventou a pasteurização', 'Aquecer o leite o suficiente para matar os micróbios sem estragar o sabor. O nome do processo é o nome dele.'],
  ['Pasteur também venceu a raiva', 'Em <b>1885</b>, ele fez a vacina contra a raiva funcionar em um menino mordido por um cão doente.'],
  ['A maioria dos micróbios é do bem', 'Na sua mão há mais micróbios do que estrelas que você vê no céu. Quase todos são inofensivos — e muitos ajudam a digerir comida.'],
  ['O Brasil vacina de graça', 'O SUS oferece cerca de <b>20 vacinas</b> na caderneta, de graça. É um dos maiores programas de vacinação do mundo.']
];

function telaFinal() {
  const pc = S.total ? S.acertos / S.total : 0;
  const tipo = pc >= .85 ? 'ouro' : pc >= .6 ? 'prata' : 'bronze';
  const min = Math.max(1, Math.round((Date.now() - S.inicio) / 60000));
  salvar();
  SOM.vitoria(); confete(60);

  pinta('fundo-festa', `
    <div class="rolavel">
      <h2 style="text-align:center; color:#fff; text-shadow:0 3px 0 var(--laranja-esc)">
        🏅 Guardião do Conhecimento
      </h2>
      <div style="width:130px; margin:6px auto">${ART.medalha(tipo)}</div>
      <p style="text-align:center; color:#fff; font-weight:bold; font-size:19px;
                text-shadow:0 2px 5px rgba(0,0,0,.3)">
        Medalha de ${tipo} para ${S.nome}!
      </p>

      <div class="cartao" style="margin:14px 0">
        <div class="linha-resumo"><span>Respostas certas</span><b>${S.acertos} de ${S.total}</b></div>
        <div class="linha-resumo"><span>Páginas do livro recuperadas</span>
          <b>${S.paginas} de ${S.PAGINAS_TOTAL}</b></div>
        <div class="linha-resumo"><span>Épocas visitadas</span><b>3 de 3</b></div>
        <div class="linha-resumo"><span>Tempo de aventura</span><b>${min} min</b></div>
      </div>

      ${fala(S.paginas >= S.PAGINAS_TOTAL
        ? `<b>Você achou TODAS as páginas!</b> O livro está completo. Olhe só o que estava escrito nelas 👇`
        : `Faltaram <b>${S.PAGINAS_TOTAL - S.paginas} páginas</b> escondidas por aí.
           Cada uma guarda uma curiosidade de verdade — vale jogar de novo para achar!`, 'feliz',
        S.paginas >= S.PAGINAS_TOTAL
          ? 'Você achou todas as páginas! O livro está completo. Olhe só o que estava escrito nelas.'
          : 'Ficaram páginas escondidas por aí. Cada uma guarda uma curiosidade de '
            + 'verdade. Vale jogar de novo para achar!')}

      <h3 style="margin:16px 0 8px; color:#fff; text-shadow:0 2px 4px rgba(0,0,0,.3)">
        📄 Páginas recuperadas (${S.paginas})
      </h3>
      ${S.paginas === 0
        ? `<div class="carta-sabia">Nenhuma página ainda. Elas ficam <b>brilhando</b> no cenário — procure!</div>`
        : CURIOSIDADES.slice(0, S.paginas).map(([t, d]) =>
            `<div class="carta-sabia"><b>${t}</b><br>${d}</div>`).join('')}

      <div class="cartao" style="margin-top:14px; background:var(--marinho); color:#fff">
        <b>O sino toca.</b> ${S.nome} acorda na sala de leitura, com o livro no colo.
        Lá fora o recreio acabou — mas agora tem história para contar.
        <div style="display:flex; justify-content:flex-end; margin-top:6px">
          <div style="width:74px">${ART.zezinho('oi', 'flutua')}</div>
        </div>
        <i>— Até a próxima descoberta, ${S.nome}! Leia sempre. — Zezinho</i>
      </div>
    </div>

    <div style="display:flex; gap:9px; margin-top:12px" class="nao-imprime">
      <button class="btn btn-verde" id="bNovo" style="flex:1">🔁 Jogar de novo</button>
      <button class="btn btn-marinho btn-p" id="bProf">👩‍🏫 Professor</button>
    </div>`);

  q('#bNovo').onclick = () => {
    SOM.toque();
    Object.assign(S, { fase: 0, paginas: 0, acertos: 0, total: 0, registro: [], inicio: Date.now() });
    go(telaAbertura);
  };
  q('#bProf').onclick = () => { SOM.toque(); go(telaProfessor); };
}

/* --- modo professor -----------------------------------------------------
   Só leitura, só neste aparelho, e imprimível. Nada é enviado para
   nenhum lugar — é o que mantém dado de criança fora de qualquer risco.   */
function telaProfessor() {
  const porFase = {};
  S.registro.forEach(r => {
    porFase[r.fase] = porFase[r.fase] || { certos: 0, total: 0 };
    porFase[r.fase].total++;
    if (r.acertou) porFase[r.fase].certos++;
  });
  const min = Math.max(1, Math.round((Date.now() - S.inicio) / 60000));

  pinta('fundo-sala', `
    <div class="rolavel">
      <div class="faixa-logo" style="margin-bottom:6px">${ART.logo('logo-topo')}</div>
      <h3 style="text-align:center">Resumo do jogador</h3>
      <div class="cartao" style="margin:12px 0">
        <div class="linha-resumo"><span>Nome</span><b>${S.nome}</b></div>
        <div class="linha-resumo"><span>Acertos</span>
          <b>${S.acertos} de ${S.total} (${S.total ? Math.round(S.acertos / S.total * 100) : 0}%)</b></div>
        <div class="linha-resumo"><span>Páginas encontradas</span>
          <b>${S.paginas} de ${S.PAGINAS_TOTAL}</b></div>
        <div class="linha-resumo"><span>Duração</span><b>${min} min</b></div>
        <div class="linha-resumo"><span>Data</span>
          <b>${new Date().toLocaleDateString('pt-BR')}</b></div>
      </div>

      <h3>Por etapa</h3>
      <table class="tabela-prof">
        <tr><th>Etapa</th><th>Acertos</th></tr>
        ${Object.entries(porFase).map(([f, v]) =>
          `<tr><td>${f}</td><td><b>${v.certos}/${v.total}</b></td></tr>`).join('')}
      </table>

      <h3 style="margin-top:16px">Pergunta por pergunta</h3>
      <table class="tabela-prof">
        ${S.registro.map(r =>
          `<tr><td>${r.pergunta}</td><td>${r.acertou ? '✅' : '🤔'}</td></tr>`).join('')}
      </table>

      <div class="cartao cartao-creme" style="margin-top:14px; font-size:14px">
        <b>Para discussão em grupo:</b> qual descoberta mudou mais a vida das pessoas — o fogo,
        a vacina ou a descoberta dos micróbios? Por quê? E o que Jenner e Pasteur fizeram
        <b>de igual</b>, mesmo separados por 60 anos? (Resposta: os dois <b>observaram, testaram
        e compararam</b> antes de concluir.)
      </div>
      <p style="font-size:12.5px; color:var(--texto-claro); margin-top:12px">
        Este resumo existe só neste aparelho e nunca é enviado para a internet.
        Ao apagar os dados do navegador, ele desaparece.
      </p>
    </div>
    <div style="display:flex; gap:9px; margin-top:10px" class="nao-imprime">
      <button class="btn btn-turquesa" id="bImp" style="flex:1">🖨 Imprimir</button>
      <button class="btn btn-marinho btn-p" id="bVolta">◂ Voltar</button>
    </div>`);

  q('#bImp').onclick = () => window.print();
  q('#bVolta').onclick = () => { SOM.toque(); go(telaFinal); };
}

/* ========================= som ligado/desligado ========================= */
function montarBotaoSom() {
  const b = document.getElementById('bSom');
  if (!b) return;
  const pintar = () => {
    b.textContent = VOZ.ligado ? '🔊' : '🔇';
    b.classList.toggle('mudo', !VOZ.ligado);
    b.title = VOZ.ligado ? 'Desligar a voz do Zezinho' : 'Ligar a voz do Zezinho';
  };
  pintar();
  b.onclick = e => { e.stopPropagation(); VOZ.alternarSom(); pintar(); };
}

/* ========================= partida ====================================== */
window.addEventListener('DOMContentLoaded', () => {
  VOZ.iniciar();
  montarBotaoSom();
  // O iPhone só deixa falar depois de um toque de verdade na tela.
  // Este é o toque: o primeiro que a criança der, em qualquer lugar.
  const liberar = () => { VOZ.liberar(); SOM.liberar(); };
  document.addEventListener('pointerdown', liberar, { once: true, capture: true });
  document.addEventListener('touchstart',  liberar, { once: true, capture: true });

  telaAbertura();
});
