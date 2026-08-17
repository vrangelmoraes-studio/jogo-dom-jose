/* ==========================================================================
   art.js — toda a arte do jogo, desenhada em código (SVG).
   Nenhuma imagem para baixar: o jogo inteiro pesa poucos KB e abre offline.
   Estilo: PK XD — formas redondas, cabeça grande, olho grande com brilho,
   cor saturada, sem contorno duro.
   ========================================================================== */

const ART = (() => {

  /* ---------- pecinhas reaproveitadas ---------- */

  // Olho grande com brilho. É o que dá o "jeitinho" PK XD.
  // Olho grande, brilho duplo e uma sombrinha em cima: é o que separa
  // "boneco de papel" de "personagem". O segundo brilho é pequeno e do
  // lado oposto — sem ele o olho fica vidrado.
  const olho = (x, y, r = 7, dir = 0) => `
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.14}" fill="#fff"/>
    <ellipse cx="${x}" cy="${y - r * .55}" rx="${r * .92}" ry="${r * .42}"
      fill="#C9D3E0" opacity=".45"/>
    <circle cx="${x + dir}" cy="${y + r * .18}" r="${r * .60}" fill="#31313F"/>
    <circle cx="${x + dir}" cy="${y + r * .18}" r="${r * .34}" fill="#14141C"/>
    <circle cx="${x + dir - r * .24}" cy="${y - r * .28}" r="${r * .26}" fill="#fff"/>
    <circle cx="${x + dir + r * .26}" cy="${y + r * .42}" r="${r * .12}"
      fill="#fff" opacity=".8"/>`;

  const olhoFechado = (x, y, r = 7) =>
    `<path d="M${x - r} ${y} q ${r} ${r * .8} ${r * 2} 0" stroke="#2A2A38"
       stroke-width="${r * .38}" fill="none" stroke-linecap="round"/>`;

  const boca = (x, y, w = 12, tipo = 'sorriso') => {
    if (tipo === 'aberta')
      return `<ellipse cx="${x}" cy="${y + 2}" rx="${w * .5}" ry="${w * .45}" fill="#B4364A"/>
              <ellipse cx="${x}" cy="${y}" rx="${w * .5}" ry="${w * .2}" fill="#fff"/>`;
    if (tipo === 'oh')
      return `<ellipse cx="${x}" cy="${y}" rx="${w * .3}" ry="${w * .34}" fill="#B4364A"/>`;
    return `<path d="M${x - w / 2} ${y} q ${w / 2} ${w * .55} ${w} 0"
              stroke="#B4364A" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  };

  const bochecha = (x, y, r = 5) => {
    const g = uid('bo');
    return `<defs><radialGradient id="${g}">
        <stop offset="0" stop-color="#FF8B8B" stop-opacity=".55"/>
        <stop offset="1" stop-color="#FF8B8B" stop-opacity="0"/>
      </radialGradient></defs>
      <circle cx="${x}" cy="${y}" r="${r * 1.5}" fill="url(#${g})"/>`;
  };

  const svg = (vb, corpo, cls = '') =>
    `<svg viewBox="${vb}" class="${cls}" xmlns="http://www.w3.org/2000/svg"
       preserveAspectRatio="xMidYMid meet">${corpo}</svg>`;

  /* Cada degradê precisa de um id só dele. Se dois SVG na mesma página
     usarem o mesmo id, o segundo rouba o degradê do primeiro e a cor sai
     errada — costuma aparecer como "personagem sem sombra". */
  let _seq = 0;
  const uid = p => `${p}${++_seq}`;

  /** Degradê vertical simples: cor de cima, cor de baixo. */
  const degrade = (id, a, b) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient>`;

  /** Degradê redondo: dá volume de bola, é o que tira o ar de "chapado". */
  const bola = (id, a, b, cx = '35%', cy = '30%') => `
    <radialGradient id="${id}" cx="${cx}" cy="${cy}" r="75%">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </radialGradient>`;

  /** Brilho branco suave, por cima de tudo. */
  const lustro = (x, y, rx, ry, giro = -25, op = .30) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}"
       transform="rotate(${giro} ${x} ${y})"/>`;

  /* ======================================================================
     LOGO DO COLÉGIO DOM JOSÉ
     Emblema circular laranja (folha + água) + nome em azul.
     ====================================================================== */
  /* Emblema + nome do colégio.
     O emblema original tem muitas linhas finas. Numa tela de celular o logo
     sai com uns 200 px de largura, e ali aquelas linhas se juntavam e viravam
     um borrão. Esta versão tem menos traços e mais grossos: perde detalhe de
     perto, mas é a única que se lê no tamanho em que a criança vê. */
  const logo = (cls = '') => svg('0 0 300 92', `
    <g transform="translate(8,8)" fill="none" stroke="#F5921E"
       stroke-linecap="round" stroke-linejoin="round">
      <circle cx="38" cy="38" r="36" stroke-width="4"/>
      <circle cx="38" cy="38" r="28" stroke-width="2.6"/>
      <path d="M38 12 v52" stroke-width="2" opacity=".45"/>

      <!-- metade esquerda: broto saindo da terra -->
      <path d="M28 58 q0-14 3-22" stroke-width="3.4"/>
      <path d="M31 40 q9-9 4-16 q-10 5 -4 16z" stroke-width="2.8"/>
      <path d="M29 48 q-10-3 -11-11 q10 0 11 11z" stroke-width="2.8"/>

      <!-- metade direita: água em cima, terra embaixo -->
      <!-- comprimentos calculados para caber DENTRO do circulo interno:
           antes as linhas de baixo furavam a borda e sujavam o emblema -->
      <path d="M44 24 q4.5-5 9 0 t9 0" stroke-width="2.8"/>
      <path d="M44 33 q5-5 10 0 t9 0" stroke-width="2.8"/>
      <path d="M44 46 h19" stroke-width="2.8"/>
      <path d="M44 54 h15" stroke-width="2.8"/>
      <path d="M44 62 h8" stroke-width="2.8"/>
    </g>
    <text x="96" y="38" font-family="'Trebuchet MS',sans-serif" font-size="26"
          fill="#1B9BF0">Colégio</text>
    <text x="96" y="80" font-family="'Trebuchet MS',sans-serif" font-size="42"
          font-weight="bold" fill="#1B9BF0">Dom José</text>`, cls);

  // Versão miúda do emblema, para o bolso do uniforme.
  const emblemaMini = (x, y, s = 1) => `
    <g transform="translate(${x},${y}) scale(${s})">
      <circle cx="0" cy="0" r="5" fill="#fff" opacity=".92"/>
      <circle cx="0" cy="0" r="5" fill="none" stroke="#F5921E" stroke-width="1"/>
      <path d="M0 3 q-1-4 1-6" stroke="#F5921E" stroke-width=".9" fill="none"/>
    </g>`;

  /* ======================================================================
     ZEZINHO — a arara azul-e-amarela, mascote do colégio.
     poses: 'oi' | 'feliz' | 'pensa' | 'aponta' | 'dorme'
     ====================================================================== */
  // ATENÇÃO: `cls` SOMA à classe base, não substitui. Antes ela substituía,
  // e quem chamasse zezinho('oi','flutua') perdia a classe `zezinho` — que é
  // justamente a que faz o bico mexer. Resultado: nas telas de narrativa,
  // as falas mais longas do jogo, ele ficava de bico parado.
  const zezinho = (pose = 'oi', cls = '') => {
    const gCorpo = uid('zc'), gAsa = uid('za'), gAsa2 = uid('zb'),
          gCab = uid('zh'), gBico = uid('zi'), gCam = uid('zt'),
          gCauda = uid('zd');

    // ângulo das asas conforme a pose
    const angDir = pose === 'oi' ? -50 : pose === 'feliz' ? -32
                 : pose === 'aponta' ? -10 : 10;
    const angEsq = pose === 'feliz' ? 28 : 14;

    const olhos = pose === 'dorme'
      ? olhoFechado(51, 47, 7) + olhoFechado(73, 47, 7)
      : pose === 'pensa'
        ? olho(51, 47, 7.5, -1.8) + olho(73, 47, 7.5, -1.8)
        : olho(51, 47, 7.5, .9) + olho(73, 47, 7.5, .9);

    return svg('0 0 130 155', `
      <defs>
        ${bola(gCorpo, '#FFE28A', '#F0A800', '38%', '26%')}
        ${bola(gCab,   '#7FC6FF', '#1E6FBF', '34%', '22%')}
        ${degrade(gAsa,  '#5FB4F2', '#1B6BB8')}
        ${degrade(gAsa2, '#8FD0FA', '#2E8BE0')}
        ${degrade(gCauda,'#3F9BE8', '#14559B')}
        ${bola(gBico, '#6A6A78', '#2E2E38', '40%', '25%')}
        ${bola(gCam, '#FFB25C', '#DE7A0C', '35%', '20%')}
      </defs>

      <ellipse cx="66" cy="146" rx="26" ry="5" fill="#16294A" opacity=".16"/>

      <!-- cauda: penas longas e macias -->
      <g fill="url(#${gCauda})">
        <path d="M56 112 q-22 14 -30 32 q17 1 30-14 q4-10 0-18z"/>
        <path d="M60 114 q-15 20 -15 34 q14-3 22-20 q2-9 -7-14z" opacity=".85"/>
      </g>

      <!-- asa esquerda: gota, nasce dentro do corpo -->
      <g transform="rotate(${angEsq} 54 82)">
        <g class="zz-asa-esq">
          <path d="M56 68 q-30 10 -32 36 q18 10 34-10 q4-16 -2-26z" fill="url(#${gAsa})"/>
          <path d="M55 74 q-21 8 -23 27 q13 7 24-8 q3-11 -1-19z" fill="url(#${gAsa2})"/>
          ${lustro(44, 88, 5, 12, 20, .22)}
        </g>
      </g>

      <!-- corpo -->
      <ellipse cx="66" cy="92" rx="29" ry="33" fill="url(#${gCorpo})"/>
      ${lustro(52, 78, 8, 15, 18, .28)}

      <!-- camiseta laranja do colégio -->
      <path d="M66 74 q16 0 24 8 q3 4 2 10 l-2 20 q-24 9 -48 0 l-2-20
               q-1-6 2-10 q8-8 24-8z" fill="url(#${gCam})"/>
      <path d="M42 82 q10-8 24-8 q14 0 24 8 q-2 5 -4 6 q-8-6 -20-6
               q-12 0-20 6 q-2-1 -4-6z" fill="#fff" opacity=".22"/>
      ${emblemaMini(80, 92, 1.15)}

      <!-- pés -->
      <g fill="#7A6F5E">
        <path d="M58 121 q4-2 6 0 l-1 13 q-3 2 -6 0z"/>
        <path d="M74 121 q4-2 6 0 l-1 13 q-3 2 -6 0z"/>
        <ellipse cx="58" cy="136" rx="8" ry="3.6"/>
        <ellipse cx="77" cy="136" rx="8" ry="3.6"/>
      </g>

      <!-- asa direita: a que cumprimenta -->
      <g transform="rotate(${angDir} 80 78)">
        <g class="zz-asa">
          <path d="M76 66 q31 8 35 34 q-18 12 -36-9 q-4-16 1-25z" fill="url(#${gAsa})"/>
          <path d="M77 72 q23 7 26 26 q-14 9 -26-8 q-3-11 0-18z" fill="url(#${gAsa2})"/>
          ${lustro(92, 84, 5, 13, -22, .24)}
        </g>
      </g>

      <!-- cabeça -->
      <g class="zz-cabeca">
        <circle cx="62" cy="46" r="32" fill="url(#${gCab})"/>
        ${lustro(46, 28, 13, 8, -25, .30)}

        <!-- topete: três penas curvas -->
        <g fill="#2E8BE0">
          <path d="M57 15 q-1-14 7-15 q-1 8 -2 16z"/>
          <path d="M64 14 q5-14 13-13 q-6 6 -8 15z"/>
          <path d="M51 18 q-6-12 0-15 q0 8 4 14z"/>
        </g>

        <!-- máscara clara do rosto (marca da arara) -->
        <ellipse cx="62" cy="49" rx="22" ry="19" fill="#FFF6E4"/>
        <ellipse cx="62" cy="50" rx="18" ry="15.5" fill="#FFFCF3"/>
        <g stroke="#EADFC8" stroke-width=".8" opacity=".55" fill="none">
          <path d="M47 43 q15-3 30 0"/><path d="M45 50 q17-3 34 0"/>
          <path d="M48 57 q14-3 28 0"/>
        </g>

        ${olhos}
        ${bochecha(40, 60, 5.5)} ${bochecha(84, 60, 5.5)}

        <!-- bico: curvo e macio, com brilho -->
        <g class="zz-bico">
          <path d="M54 55 q8-4 16 0 q4 13 -8 21 q-12-8 -8-21z" fill="url(#${gBico})"/>
          <path d="M56 58 q6-3 12 0 q3 9 -6 15 q-9-6 -6-15z" fill="#5A5A66" opacity=".7"/>
          ${lustro(58, 61, 3, 5, -15, .35)}
          <ellipse cx="62" cy="59" rx="4.5" ry="1.8" fill="#1E1E26" opacity=".45"/>
        </g>
        ${pose === 'feliz' ? `<path d="M55 71 q7 6 14 0" stroke="#B4364A"
          stroke-width="2.6" fill="none" stroke-linecap="round"/>` : ''}
      </g>`, ('zezinho ' + cls).trim());
  };

  /* ======================================================================
     AVATAR DA CRIANÇA — uniforme real do Dom José:
     camiseta turquesa gola V com listra marinho no ombro,
     calça marinho com listra laranja na lateral.
     ====================================================================== */
  const TONS     = ['#F8D9BC', '#EFC09A', '#D2946A', '#9B6742', '#6B4530'];
  const TONS_ESC = ['#E4BE9C', '#D9A57E', '#B57950', '#7E5133', '#523320'];
  const TONS_CLR = ['#FFEBD9', '#FBD8BC', '#E7B490', '#B98460', '#8A5F42'];

  /* Cabelos: tom escuro e tom claro, para dar volume em vez de mancha. */
  const CABELOS = {
    castanho:  ['#5A3A22', '#7C5334'],
    preto:     ['#241A16', '#3E2E28'],
    escuro:    ['#3A2418', '#54382A'],
    ruivo:     ['#8A4A22', '#B06A33'],
    loiro:     ['#B98240', '#DCA85E']
  };

  /**
   * Criança do Colégio Dom José, de uniforme: camiseta turquesa com gola V
   * e listra marinho no ombro, calça marinho com listra laranja na lateral.
   *
   * O desenho é todo feito de curvas e degradês. A versão anterior usava
   * retângulos e cor chapada, e ficava dura — parecia recorte de papel.
   */
  const avatar = (genero = 'menina', tom = 1, cls = '', pose = 'parado', cabelo = null) => {
    const P   = TONS[tom]     || TONS[1];
    const PE  = TONS_ESC[tom] || TONS_ESC[1];
    const PC  = TONS_CLR[tom] || TONS_CLR[1];
    const [CAB, CABC] = CABELOS[cabelo] ||
      (tom >= 3 ? CABELOS.preto : tom === 2 ? CABELOS.escuro : CABELOS.castanho);

    const gPele  = uid('pl'), gCam = uid('cm'), gCal = uid('cl'),
          gCabe  = uid('cb'), gBra = uid('br');

    const defs = `<defs>
      ${bola(gPele, PC, PE, '38%', '28%')}
      ${bola(gCam, '#6FDCEC', '#1E93AA', '35%', '20%')}
      ${degrade(gCal, '#26406B', '#101E38')}
      ${bola(gCabe, CABC, CAB, '35%', '22%')}
      ${degrade(gBra, '#4FCADC', '#1E93AA')}
    </defs>`;

    // ---- cabelo: atrás da cabeça (volume) e na frente (franja) ----
    const cabeloAtras = genero === 'menina' ? `
      <path d="M50 6 q30 0 32 32 q2 26 -3 44 q-2 8 -9 6 q5-22 2-38
               q-9 10 -22 10 q-13 0 -22-10 q-3 16 2 38 q-7 2 -9-6
               q-5-18 -3-44 q2-32 32-32z" fill="url(#${gCabe})"/>
      <ellipse cx="26" cy="76" rx="8" ry="12" fill="url(#${gCabe})"/>
      <ellipse cx="74" cy="76" rx="8" ry="12" fill="url(#${gCabe})"/>`
      : '';   // menino: todo o cabelo vem na frente, veja `franja`

    const franja = genero === 'menina' ? `
      <path d="M22 36 q4-24 28-24 q24 0 28 24 q-6-12 -20-12 q-8 0 -12 6
               q-6-4 -12-2 q-8 3 -12 8z" fill="url(#${gCabe})"/>
      <circle cx="75" cy="30" r="6.5" fill="#F5921E"/>
      <circle cx="75" cy="30" r="6.5" fill="url(#${gCam})" opacity=".18"/>
      ${lustro(70, 26, 3, 1.6, -30, .5)}`
      : `
      <path d="M17 45 q0-41 33-41 q33 0 33 41 l-1 2
               q-4-16 -14-20 q-8 8 -17 8 q-9 0 -16-7 q-10 4 -14 19 l-1-2z"
            fill="url(#${gCabe})"/>
      <path d="M28 20 q10-9 22-8 q-12 3 -19 10z" fill="#fff" opacity=".16"/>`;

    const bracoDir = pose === 'oi'
      ? `<g transform="rotate(-54 74 80)">
           <path d="M68 74 q8-4 13 2 l3 28 q-7 6 -14 1z" fill="url(#${gBra})"/>
           <circle cx="79" cy="108" r="8.5" fill="url(#${gPele})"/></g>`
      : `<path d="M68 74 q8-4 13 2 l2 30 q-7 6 -14 1z" fill="url(#${gBra})"/>
         <circle cx="77" cy="110" r="8.5" fill="url(#${gPele})"/>`;

    return svg('0 0 100 190', `
      ${defs}
      <ellipse cx="50" cy="183" rx="27" ry="6" fill="#16294A" opacity=".16"/>

      <!-- pernas: capsulas com curva, nao retangulos -->
      <path d="M36 118 q7-4 13 0 l-1 46 q-6 4 -12 0z" fill="url(#${gCal})"/>
      <path d="M51 118 q7-4 13 0 l-1 46 q-6 4 -12 0z" fill="url(#${gCal})"/>
      <!-- listra laranja: na LATERAL de cada perna, como no uniforme real.
           Estava no meio da perna direita, parecendo costura central. -->
      <path d="M36.4 124 q3-2 4.6 0 l-.5 36 q-2 2 -3.6 0z" fill="#F5921E" opacity=".95"/>
      <path d="M59.2 124 q3-2 4.6 0 l-.5 36 q-2 2 -3.6 0z" fill="#F5921E" opacity=".95"/>

      <!-- tenis arredondados -->
      <path d="M32 162 q9-4 17 0 l1 9 q0 6 -7 6 h-6 q-6 0 -6-6z" fill="#FFFFFF"/>
      <path d="M51 162 q9-4 17 0 l1 9 q0 6 -6 6 h-6 q-7 0 -7-6z" fill="#F4F6F9"/>
      <path d="M31 172 q10 4 19 0 l0 4 q-10 4 -19 0z" fill="#C6CCD6"/>
      <path d="M50 172 q10 4 19 0 l0 4 q-10 4 -19 0z" fill="#C6CCD6"/>

      <!-- bracos -->
      <path d="M32 74 q-8-4 -13 2 l-2 30 q7 6 14 1z" fill="url(#${gBra})"/>
      <circle cx="23" cy="110" r="8.5" fill="url(#${gPele})"/>
      ${bracoDir}

      <!-- tronco: sino macio, ombro redondo -->
      <path d="M50 60 q16 0 24 10 q4 6 3 16 l-2 36 q-25 9 -50 0 l-2-36
               q-1-10 3-16 q8-10 24-10z" fill="url(#${gCam})"/>
      <path d="M26 70 q10-9 24-10 q14 1 24 10 q-3 7 -6 8 q-8-7 -18-7
               q-10 0-18 7 q-3-1 -6-8z" fill="#1B8A9E" opacity=".35"/>
      <!-- listra marinho no ombro -->
      <path d="M27 71 q7-7 15-9 l2 8 q-8 2 -14 8z" fill="#16294A" opacity=".92"/>
      <path d="M73 71 q-7-7 -15-9 l-2 8 q8 2 14 8z" fill="#16294A" opacity=".92"/>
      <!-- gola V -->
      <path d="M42 62 q8 14 8 16 q0-2 8-16 q-8-3 -16 0z" fill="#223C66"/>
      <path d="M43 63 q7 12 7 14 q0-2 7-14 q-7-2 -14 0z" fill="#2A4372"/>
      ${emblemaMini(65, 90, 1.2)}
      ${lustro(36, 82, 7, 15, 12, .18)}

      <!-- pescoco e cabeca -->
      <path d="M44 54 q6 5 12 0 l1 12 q-7 5 -14 0z" fill="${PE}"/>
      ${cabeloAtras}
      <ellipse cx="50" cy="39" rx="29" ry="30" fill="url(#${gPele})"/>
      <ellipse cx="24" cy="43" rx="6.5" ry="8" fill="${PE}"/>
      <ellipse cx="76" cy="43" rx="6.5" ry="8" fill="${PE}"/>
      ${franja}

      <!-- rosto -->
      ${olho(39, 42, 8, .8)} ${olho(61, 42, 8, .8)}
      <path d="M31 30 q8-5 15-1" stroke="${CAB}" stroke-width="3.2"
        fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M54 29 q7-4 15 1" stroke="${CAB}" stroke-width="3.2"
        fill="none" stroke-linecap="round" opacity=".85"/>
      ${bochecha(29, 52, 5)} ${bochecha(71, 52, 5)}
      <path d="M47 50 q3 3 6 0" stroke="${PE}" stroke-width="2.4"
        fill="none" stroke-linecap="round"/>
      <path d="M42 57 q8 8 16 0" stroke="#B4364A" stroke-width="2.8"
        fill="none" stroke-linecap="round"/>
      <path d="M45 60 q5 3 10 0" fill="#E8798C" opacity=".55"/>
      ${lustro(38, 22, 12, 6, -18, .22)}`, cls);
  };

  /* Colegas de classe do presente. São alunos do Dom José como o jogador —
     antes eram aldeões do século 18, o que não fazia sentido nenhum na
     sala de aula. O sexo do desenho acompanha o nome de cada um. */
  const COLEGAS = [
    { nome: 'Bia', genero: 'menina', tom: 3, cabelo: 'preto'    },
    { nome: 'Téo', genero: 'menino', tom: 1, cabelo: 'castanho' },
    { nome: 'Nina', genero: 'menina', tom: 0, cabelo: 'ruivo'   }
  ];

  const colega = (i = 0, cls = '') => {
    const c = COLEGAS[i % COLEGAS.length];
    return avatar(c.genero, c.tom, cls, 'parado', c.cabelo);
  };

  /* ======================================================================
     FASE 1 — PRÉ-HISTÓRIA
     ====================================================================== */

  const gravetoSeco = () => svg('0 0 60 26', `
    <path d="M4 16 q14-7 26-4 q13 3 26-1" stroke="#A9752F" stroke-width="7"
      fill="none" stroke-linecap="round"/>
    <path d="M4 15 q14-7 26-4 q13 3 26-1" stroke="#C79345" stroke-width="3.4"
      fill="none" stroke-linecap="round"/>
    <path d="M26 13 l-7-8" stroke="#A9752F" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M40 12 l6-7" stroke="#A9752F" stroke-width="4" stroke-linecap="round"/>`);

  const gravetoMolhado = () => svg('0 0 60 30', `
    <path d="M4 18 q14-7 26-4 q13 3 26-1" stroke="#4E3A22" stroke-width="7"
      fill="none" stroke-linecap="round"/>
    <path d="M4 17 q14-7 26-4 q13 3 26-1" stroke="#6B5233" stroke-width="3.4"
      fill="none" stroke-linecap="round"/>
    <path d="M26 15 l-7-8" stroke="#4E3A22" stroke-width="4.6" stroke-linecap="round"/>
    <!-- pingos: é o aviso visual de que está molhado -->
    <g fill="#6FD3F5">
      <path d="M16 22 q3 5 0 7 q-3-2 0-7z"/><path d="M33 24 q3 5 0 7 q-3-2 0-7z"/>
      <path d="M48 21 q3 5 0 7 q-3-2 0-7z"/>
    </g>
    <ellipse cx="30" cy="12" rx="20" ry="4" fill="#6FD3F5" opacity=".28"/>`);

  const chama = (t = 1) => svg('0 0 60 80', `
    <ellipse cx="30" cy="72" rx="24" ry="6" fill="#FF8A3D" opacity=".35"/>
    <g transform="translate(30,70) scale(${t}) translate(-30,-70)">
      <g class="lingua-fogo">
        <path d="M30 18 q16 20 14 32 q-2 16 -14 17 q-12-1 -14-17 q-2-12 14-32z" fill="#F5921E"/>
      </g>
      <g class="lingua-fogo lingua-fogo-2">
        <path d="M30 30 q11 15 9 24 q-1 11 -9 12 q-8-1 -9-12 q-2-9 9-24z" fill="#FFC61E"/>
      </g>
      <g class="lingua-fogo lingua-fogo-3">
        <path d="M30 44 q6 9 5 14 q-1 6 -5 7 q-4-1 -5-7 q-1-5 5-14z" fill="#FFF3B0"/>
      </g>
    </g>
    <g fill="#6B4A2A">
      <rect x="8" y="66" width="44" height="7" rx="3.5" transform="rotate(-7 30 70)"/>
      <rect x="8" y="66" width="44" height="7" rx="3.5" transform="rotate(9 30 70)"/>
    </g>`);

  const pedraFogo = () => svg('0 0 70 50', `
    <path d="M10 38 q-4-16 12-20 q18-5 26 6 q8 11 -4 18 q-18 8 -34-4z" fill="#8A8F99"/>
    <path d="M14 34 q-2-11 10-14 q13-4 19 4" fill="none" stroke="#AEB4BE" stroke-width="3"/>
    <g fill="#FFE066"><circle cx="52" cy="16" r="3"/><circle cx="60" cy="22" r="2.2"/>
      <circle cx="56" cy="9" r="1.8"/></g>`);

  const paginaPerdida = () => svg('0 0 40 48', `
    <g class="pagina-perdida">
      <path d="M6 4 h22 l6 6 v34 h-28z" fill="#FFF6DC"/>
      <path d="M28 4 l6 6 h-6z" fill="#E8D9A8"/>
      <g stroke="#C9A227" stroke-width="1.6" stroke-linecap="round" opacity=".8">
        <path d="M11 16 h16"/><path d="M11 22 h16"/><path d="M11 28 h12"/><path d="M11 34 h14"/>
      </g>
      <circle cx="20" cy="24" r="17" fill="#FFD65A" opacity=".18"/>
    </g>`);

  const tribo = (i = 0) => {
    const cores = ['#8D5A38', '#C98A5E', '#6B4530'];
    const P = cores[i % 3];
    return svg('0 0 70 110', `
      <ellipse cx="35" cy="106" rx="19" ry="4.5" fill="#3A2A1A" opacity=".25"/>
      <rect x="26" y="66" width="9" height="36" rx="4.5" fill="${P}"/>
      <rect x="36" y="66" width="9" height="36" rx="4.5" fill="${P}"/>
      <path d="M18 44 q17-7 34 0 l-4 26 q-13 5 -26 0z" fill="#9C6B3F"/>
      <path d="M18 44 q17-7 34 0 l-1 5 q-16-6 -32 0z" fill="#7A5230"/>
      <rect x="9" y="46" width="9" height="26" rx="4.5" fill="${P}"/>
      <rect x="52" y="46" width="9" height="26" rx="4.5" fill="${P}"/>
      <ellipse cx="35" cy="26" rx="19" ry="20" fill="${P}"/>
      <path d="M16 22 q0-18 19-18 q19 0 19 18 q-4-9 -19-8 q-15-1 -19 8z" fill="#2B1D12"/>
      <path d="M13 24 q-3 16 2 24 q5-3 4-10 q-3-8 -2-14z" fill="#2B1D12"/>
      ${olho(28, 27, 5.4, .6)} ${olho(42, 27, 5.4, .6)}
      ${boca(35, 37, 10)}`);
  };

  const carneCrua = () => svg('0 0 60 46', `
    <path d="M8 30 q-4-14 12-18 q20-5 30 6 q7 10 -6 16 q-18 8 -36-4z" fill="#F08C8C"/>
    <path d="M14 26 q0-9 11-11 q14-3 19 4" fill="none" stroke="#FFB3B3" stroke-width="3.4"/>
    <ellipse cx="30" cy="26" rx="8" ry="5" fill="#E06B6B"/>
    <g fill="#7ED957" opacity=".85">
      <circle cx="18" cy="36" r="2.4"/><circle cx="40" cy="37" r="2"/><circle cx="30" cy="39" r="1.8"/>
    </g>`);

  const carneAssada = () => svg('0 0 60 46', `
    <path d="M8 30 q-4-14 12-18 q20-5 30 6 q7 10 -6 16 q-18 8 -36-4z" fill="#A5673C"/>
    <path d="M14 26 q0-9 11-11 q14-3 19 4" fill="none" stroke="#C98A5E" stroke-width="3.4"/>
    <g stroke="#6B4020" stroke-width="2.4" stroke-linecap="round">
      <path d="M16 20 l6 10"/><path d="M28 17 l6 11"/><path d="M40 19 l5 9"/>
    </g>
    <g fill="#FFE9B0" opacity=".8"><circle cx="24" cy="9" r="2.2"/><circle cx="36" cy="7" r="1.8"/></g>`);

  const criancaFrio = (comFogo = false) => svg('0 0 60 90', `
    <ellipse cx="30" cy="86" rx="16" ry="4" fill="#3A2A1A" opacity=".25"/>
    <rect x="22" y="54" width="8" height="30" rx="4" fill="#C98A5E"/>
    <rect x="31" y="54" width="8" height="30" rx="4" fill="#C98A5E"/>
    <path d="M15 36 q15-6 30 0 l-3 22 q-12 4 -24 0z" fill="#9C6B3F"/>
    <ellipse cx="30" cy="21" rx="16" ry="17" fill="#C98A5E"/>
    <path d="M14 18 q0-15 16-15 q16 0 16 15 q-4-8 -16-7 q-12-1 -16 7z" fill="#2B1D12"/>
    ${comFogo ? olho(24, 22, 4.6, .5) + olho(36, 22, 4.6, .5) + boca(30, 31, 9)
      : olho(24, 22, 4.6) + olho(36, 22, 4.6) +
        `<path d="M25 31 q5-4 10 0" stroke="#B4364A" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}
    ${comFogo
      ? `<g fill="#FFC61E" opacity=".9"><circle cx="10" cy="40" r="3"/><circle cx="50" cy="44" r="2.4"/></g>`
      : `<g stroke="#6FD3F5" stroke-width="2.4" stroke-linecap="round" opacity=".9">
           <path d="M6 14 l4 4 M10 14 l-4 4"/><path d="M50 24 l4 4 M54 24 l-4 4"/>
           <path d="M4 30 l3 3 M7 30 l-3 3"/></g>`}`);

  const animalNoturno = (comFogo = false) => svg('0 0 80 60', `
    ${comFogo ? `
      <g opacity=".55">
        <path d="M62 40 q-14-10 -26-4 q4-12 18-12 q16 0 20 14 q-6 4 -12 2z" fill="#3A3A48"/>
        <path d="M14 44 q10 6 22 2" stroke="#3A3A48" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <text x="8" y="18" font-size="15" fill="#FFD65A" font-family="'Trebuchet MS'">fugiu!</text>`
      : `
      <ellipse cx="40" cy="34" rx="30" ry="20" fill="#1B1B26" opacity=".55"/>
      <g>${olho(30, 30, 6, 0)}${olho(52, 30, 6, 0)}</g>
      <g fill="#FFE066" opacity=".9">
        <circle cx="30" cy="30" r="3.2"/><circle cx="52" cy="30" r="3.2"/>
      </g>
      <g fill="#fff" opacity=".9">
        <path d="M22 44 l4 6 l4-6z"/><path d="M34 45 l4 6 l4-6z"/><path d="M46 44 l4 6 l4-6z"/>
      </g>`}`);

  /* ======================================================================
     FASE 2 — JENNER, A VACINA
     ====================================================================== */

  /* Retrato de época em estilo de desenho: casaco, colete, peruca branca.
     A silhueta é a mesma da criança (cabeça grande, corpo curto), para os
     dois viverem no mesmo mundo sem parecerem recortados de lugares
     diferentes. */
  const jenner = (cls = '') => {
    const gPele = uid('jp'), gCas = uid('jc'), gPer = uid('jw'), gCol = uid('jv');
    return svg('0 0 100 160', `
      <defs>
        ${bola(gPele, '#FFE6CC', '#D9A57E', '38%', '28%')}
        ${bola(gCas, '#7E68A8', '#3F3160', '35%', '20%')}
        ${bola(gPer, '#FFFFFF', '#D3D3DE', '35%', '20%')}
        ${degrade(gCol, '#FFF9EC', '#E2D6BE')}
      </defs>
      <ellipse cx="50" cy="154" rx="27" ry="5" fill="#16294A" opacity=".16"/>

      <!-- pernas e sapatos -->
      <path d="M36 106 q7-4 13 0 l-1 34 q-6 3 -12 0z" fill="#4A4258"/>
      <path d="M51 106 q7-4 13 0 l-1 34 q-6 3 -12 0z" fill="#403949"/>
      <path d="M31 140 q9-4 18 0 l1 6 q0 5 -6 5 h-8 q-5 0-5-5z" fill="#2A2634"/>
      <path d="M51 140 q9-4 18 0 l1 6 q0 5 -6 5 h-8 q-5 0-5-5z" fill="#2A2634"/>
      <g fill="#C9A227"><rect x="36" y="141" width="7" height="3" rx="1.5"/>
        <rect x="57" y="141" width="7" height="3" rx="1.5"/></g>

      <!-- braços -->
      <path d="M27 68 q-9-3 -13 5 l-3 27 q7 6 14 1z" fill="url(#${gCas})"/>
      <path d="M73 68 q9-3 13 5 l3 27 q-7 6 -14 1z" fill="url(#${gCas})"/>
      <circle cx="16" cy="103" r="8" fill="url(#${gPele})"/>
      <circle cx="84" cy="103" r="8" fill="url(#${gPele})"/>

      <!-- casaco -->
      <path d="M50 56 q18 0 26 11 q4 6 3 14 l-3 32 q-26 9 -52 0 l-3-32
               q-1-8 3-14 q8-11 26-11z" fill="url(#${gCas})"/>
      <!-- colete e babado -->
      <path d="M50 56 q9 1 14 4 l-4 54 q-10 3 -20 0 l-4-54 q5-3 14-4z"
        fill="url(#${gCol})"/>
      <path d="M50 55 q7 2 9 7 q-5 6 -9 6 q-4 0 -9-6 q2-5 9-7z" fill="#FFFCF5"/>
      <g fill="#C9A227">
        <circle cx="50" cy="78" r="2.2"/><circle cx="50" cy="90" r="2.2"/>
        <circle cx="50" cy="102" r="2.2"/>
      </g>
      ${lustro(34, 76, 6, 14, 14, .16)}

      <!-- cabeça -->
      <path d="M44 48 q6 5 12 0 l1 10 q-7 5 -14 0z" fill="#D9A57E"/>
      <ellipse cx="50" cy="34" rx="26" ry="27" fill="url(#${gPele})"/>
      <!-- peruca: touca fechada + cachos dos lados -->
      <path d="M22 38 q0-34 28-34 q28 0 28 34 l-2 3
               q-4-14 -12-18 q-6 7 -14 7 q-8 0-14-7 q-8 4 -12 18z"
        fill="url(#${gPer})"/>
      <ellipse cx="19" cy="44" rx="9" ry="10" fill="url(#${gPer})"/>
      <ellipse cx="81" cy="44" rx="9" ry="10" fill="url(#${gPer})"/>
      ${lustro(36, 18, 11, 6, -22, .55)}
      ${olho(40, 36, 7, .8)} ${olho(60, 36, 7, .8)}
      <path d="M32 26 q7-4 13-1" stroke="#BFBFCB" stroke-width="2.8"
        fill="none" stroke-linecap="round"/>
      <path d="M55 25 q7-3 13 1" stroke="#BFBFCB" stroke-width="2.8"
        fill="none" stroke-linecap="round"/>
      ${bochecha(31, 45, 4.5)} ${bochecha(69, 45, 4.5)}
      <path d="M47 43 q3 3 6 0" stroke="#D9A57E" stroke-width="2.2"
        fill="none" stroke-linecap="round"/>
      <path d="M43 50 q7 7 14 0" stroke="#B4364A" stroke-width="2.6"
        fill="none" stroke-linecap="round"/>`, cls);
  };

  const vaca = (cls = '') => {
    const gC = uid('vc'), gCab = uid('vh'), gFoc = uid('vf');
    return svg('0 0 150 110', `
      <defs>
        ${bola(gC, '#FFFFFF', '#D9D3C8', '38%', '25%')}
        ${bola(gCab, '#FFFFFF', '#DED8CC', '40%', '28%')}
        ${bola(gFoc, '#FFC9C4', '#E79A93', '40%', '25%')}
      </defs>
      <ellipse cx="80" cy="104" rx="46" ry="5" fill="#3A5A2A" opacity=".18"/>

      <!-- rabo -->
      <path d="M124 52 q16 4 14 22 q-1 8 -7 9 q4-8 1-14 q-3-8 -12-9z"
        fill="#C9C2B4"/>
      <ellipse cx="130" cy="84" rx="5" ry="7" fill="#8A8073"/>

      <!-- pernas curtas e roliças -->
      <g fill="#EDE7DC">
        <path d="M52 72 q7-3 12 0 l-1 24 q-5 3 -10 0z"/>
        <path d="M70 74 q7-3 12 0 l-1 22 q-5 3 -10 0z"/>
        <path d="M100 72 q7-3 12 0 l-1 24 q-5 3 -10 0z"/>
        <path d="M116 74 q7-3 12 0 l-1 22 q-5 3 -10 0z"/>
      </g>
      <g fill="#5C5348">
        <path d="M52 92 q6-2 12 0 l0 5 q-6 2 -12 0z"/>
        <path d="M70 92 q6-2 12 0 l0 5 q-6 2 -12 0z"/>
        <path d="M100 92 q6-2 12 0 l0 5 q-6 2 -12 0z"/>
        <path d="M116 92 q6-2 12 0 l0 5 q-6 2 -12 0z"/>
      </g>

      <!-- corpo -->
      <ellipse cx="88" cy="52" rx="44" ry="30" fill="url(#${gC})"/>
      ${lustro(70, 34, 16, 8, -18, .5)}
      <!-- manchas, sempre com borda curva -->
      <g fill="#4A4A56">
        <path d="M70 34 q13-7 20 3 q5 10 -6 14 q-14 4 -18-6 q-2-7 4-11z" opacity=".9"/>
        <path d="M104 58 q12-4 15 5 q2 8 -8 10 q-11 1 -12-7 q0-6 5-8z" opacity=".9"/>
        <ellipse cx="118" cy="38" rx="8" ry="6" opacity=".85"/>
      </g>

      <!-- úbere -->
      <ellipse cx="98" cy="78" rx="13" ry="8" fill="#F3C9C4"/>
      <g fill="#E0A9A2">
        <ellipse cx="93" cy="84" rx="2.4" ry="3.4"/>
        <ellipse cx="103" cy="84" rx="2.4" ry="3.4"/>
      </g>

      <!-- cabeça -->
      <g>
        <!-- orelhas -->
        <ellipse cx="16" cy="34" rx="11" ry="7" fill="#EDE7DC" transform="rotate(-24 16 34)"/>
        <ellipse cx="52" cy="26" rx="10" ry="6.5" fill="#EDE7DC" transform="rotate(18 52 26)"/>
        <!-- chifrinhos -->
        <path d="M24 16 q-3-8 3-10 q3 5 2 10z" fill="#D8CBB0"/>
        <path d="M44 14 q4-8 9-5 q-4 4 -5 9z" fill="#D8CBB0"/>
        <ellipse cx="35" cy="40" rx="27" ry="25" fill="url(#${gCab})"/>
        ${lustro(24, 26, 10, 6, -22, .55)}
        <!-- focinho -->
        <ellipse cx="34" cy="54" rx="18" ry="13" fill="url(#${gFoc})"/>
        <g fill="#C98A85">
          <ellipse cx="27" cy="51" rx="3" ry="4"/>
          <ellipse cx="41" cy="51" rx="3" ry="4"/>
        </g>
        <path d="M26 60 q8 5 16 0" stroke="#C98A85" stroke-width="2.4"
          fill="none" stroke-linecap="round"/>
        ${olho(24, 30, 6.5, .7)} ${olho(47, 28, 6.5, .7)}
        <path d="M17 21 q7-4 13-1" stroke="#8A8073" stroke-width="2.6"
          fill="none" stroke-linecap="round"/>
        <path d="M41 19 q7-3 13 1" stroke="#8A8073" stroke-width="2.6"
          fill="none" stroke-linecap="round"/>
      </g>`, cls);
  };

  // estado: 'ordenhadeira' (mão marcada, sadia) | 'sadio' | 'doente'
  const aldeao = (estado = 'sadio', i = 0) => {
    const vest = ['#8A6BE0', '#4CC46A', '#F0524B', '#1B9BF0', '#F5921E', '#29B6CE'][i % 6];
    const P = TONS[i % 3], PE = TONS_ESC[i % 3];
    const doente = estado === 'doente';
    return svg('0 0 70 120', `
      <ellipse cx="35" cy="116" rx="19" ry="4.5" fill="#16294A" opacity=".18"/>
      <rect x="26" y="76" width="9" height="34" rx="4.5" fill="#5C4A3A"/>
      <rect x="36" y="76" width="9" height="34" rx="4.5" fill="#6B5847"/>
      <path d="M17 50 q18-7 36 0 l-4 30 q-14 5 -28 0z" fill="${vest}"/>
      <path d="M17 50 q18-7 36 0 l-1 6 q-17-7 -34 0z" fill="#fff" opacity=".22"/>
      <rect x="8" y="52" width="10" height="28" rx="5" fill="${vest}"/>
      <rect x="52" y="52" width="10" height="28" rx="5" fill="${vest}"/>
      <circle cx="13" cy="82" r="7" fill="${P}"/>
      <circle cx="57" cy="82" r="7" fill="${P}"/>
      ${estado === 'ordenhadeira' ? `
        <!-- marca da varíola das vacas na mão: a pista do jogo -->
        <g fill="#E88A9A"><circle cx="11" cy="80" r="1.9"/><circle cx="15" cy="84" r="1.6"/>
          <circle cx="12" cy="86" r="1.4"/></g>
        <g fill="#E88A9A"><circle cx="56" cy="80" r="1.9"/><circle cx="59" cy="84" r="1.6"/></g>` : ''}
      <rect x="30" y="42" width="11" height="12" rx="5" fill="${PE}"/>
      <ellipse cx="35" cy="26" rx="19" ry="20" fill="${doente ? '#D9C4A8' : P}"/>
      <path d="M16 22 q0-18 19-18 q19 0 19 18 q-4-9 -19-8 q-15-1 -19 8z"
        fill="${['#3A2418', '#5A3A22', '#1E1512'][i % 3]}"/>
      ${estado === 'ordenhadeira'
        ? `<path d="M14 16 q21-14 42 0 l2-5 q-23-15 -46 0z" fill="#FFF6E5"/>` : ''}
      ${doente
        ? olhoFechado(28, 27, 5) + olhoFechado(42, 27, 5) +
          `<path d="M30 37 q5 4 10 0" stroke="#B4364A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
           <g fill="#D96A7A"><circle cx="24" cy="33" r="2.2"/><circle cx="46" cy="32" r="2"/>
             <circle cx="35" cy="20" r="1.9"/><circle cx="30" cy="14" r="1.7"/>
             <circle cx="42" cy="17" r="1.8"/><circle cx="26" cy="22" r="1.6"/></g>`
        : olho(28, 27, 5.4, .6) + olho(42, 27, 5.4, .6) + boca(35, 36, 10) +
          bochecha(22, 31, 4) + bochecha(48, 31, 4)}`);
  };

  const seringa = (cls = '') => svg('0 0 90 30', `
    <rect x="14" y="10" width="46" height="12" rx="3" fill="#E8F4FB"/>
    <rect x="14" y="10" width="30" height="12" rx="3" fill="#9BD9F2"/>
    <rect x="6" y="7" width="10" height="18" rx="3" fill="#C9CDD4"/>
    <rect x="0" y="12" width="8" height="8" rx="3" fill="#8A8F99"/>
    <rect x="58" y="13" width="14" height="6" rx="2" fill="#C9CDD4"/>
    <path d="M72 16 h16" stroke="#8A8F99" stroke-width="2.6" stroke-linecap="round"/>`, cls);

  const germe = (cor = '#7ED957', cara = 'mau') => svg('0 0 60 60', `
    <g class="corpo-germe">
      <circle cx="30" cy="30" r="19" fill="${cor}"/>
      <g class="cilios-germe" stroke="${cor}" stroke-width="4.5" stroke-linecap="round">
        <path d="M30 11 v-8"/><path d="M30 49 v8"/><path d="M11 30 h-8"/><path d="M49 30 h8"/>
        <path d="M17 17 l-6-6"/><path d="M43 17 l6-6"/><path d="M17 43 l-6 6"/><path d="M43 43 l6 6"/>
      </g>
      <circle cx="30" cy="30" r="19" fill="#fff" opacity=".12"/>
      ${cara === 'mau'
        ? olho(23, 27, 5, .5) + olho(37, 27, 5, .5) +
          `<path d="M23 39 q7-5 14 0" stroke="#2A4A20" stroke-width="2.4" fill="none" stroke-linecap="round"/>
           <path d="M17 20 l8 4" stroke="#2A4A20" stroke-width="2.4" stroke-linecap="round"/>
           <path d="M43 20 l-8 4" stroke="#2A4A20" stroke-width="2.4" stroke-linecap="round"/>`
        : olhoFechado(23, 29, 5) + olhoFechado(37, 29, 5) +
          `<path d="M24 40 q6 4 12 0" stroke="#2A4A20" stroke-width="2.4" fill="none" stroke-linecap="round"/>`}
    </g>`);

  const anticorpo = () => svg('0 0 54 54', `
    <g>
      <path d="M27 48 v-18" stroke="#1B9BF0" stroke-width="8" stroke-linecap="round"/>
      <path d="M27 30 l-13-16" stroke="#1B9BF0" stroke-width="8" stroke-linecap="round"/>
      <path d="M27 30 l13-16" stroke="#1B9BF0" stroke-width="8" stroke-linecap="round"/>
      <circle cx="14" cy="13" r="6.5" fill="#5FB4F2"/>
      <circle cx="40" cy="13" r="6.5" fill="#5FB4F2"/>
      ${olho(24, 36, 3.4, .3)} ${olho(31, 36, 3.4, .3)}
    </g>`);

  const escudoCorpo = (cheio = 0) => svg('0 0 80 92', `
    <path d="M40 4 l34 12 v34 q0 26 -34 38 q-34-12 -34-38 v-34z" fill="#0B6FB8" opacity=".25"/>
    <clipPath id="cs"><path d="M40 4 l34 12 v34 q0 26 -34 38 q-34-12 -34-38 v-34z"/></clipPath>
    <rect x="0" y="${92 - 92 * cheio}" width="80" height="92" fill="#1B9BF0" clip-path="url(#cs)"/>
    <path d="M40 4 l34 12 v34 q0 26 -34 38 q-34-12 -34-38 v-34z" fill="none"
      stroke="#fff" stroke-width="4" opacity=".9"/>`);

  /* ======================================================================
     FASE 3 — PASTEUR, O LABORATÓRIO
     ====================================================================== */

  const pasteur = (cls = '') => {
    const gPele = uid('pp'), gJal = uid('pj'), gCab = uid('pc');
    return svg('0 0 100 160', `
      <defs>
        ${bola(gPele, '#FFE0C2', '#CF9A72', '38%', '28%')}
        ${bola(gJal, '#FFFFFF', '#D6DBE4', '35%', '20%')}
        ${bola(gCab, '#C7CCD6', '#7E8590', '35%', '25%')}
      </defs>
      <ellipse cx="50" cy="154" rx="27" ry="5" fill="#16294A" opacity=".16"/>

      <path d="M36 106 q7-4 13 0 l-1 34 q-6 3 -12 0z" fill="#3C3A46"/>
      <path d="M51 106 q7-4 13 0 l-1 34 q-6 3 -12 0z" fill="#33313C"/>
      <path d="M31 140 q9-4 18 0 l1 6 q0 5 -6 5 h-8 q-5 0-5-5z" fill="#24222B"/>
      <path d="M51 140 q9-4 18 0 l1 6 q0 5 -6 5 h-8 q-5 0-5-5z" fill="#24222B"/>

      <path d="M27 68 q-9-3 -13 5 l-3 27 q7 6 14 1z" fill="url(#${gJal})"/>
      <path d="M73 68 q9-3 13 5 l3 27 q-7 6 -14 1z" fill="url(#${gJal})"/>
      <circle cx="16" cy="103" r="8" fill="url(#${gPele})"/>
      <circle cx="84" cy="103" r="8" fill="url(#${gPele})"/>

      <!-- jaleco -->
      <path d="M50 56 q18 0 26 11 q4 6 3 14 l-3 32 q-26 9 -52 0 l-3-32
               q-1-8 3-14 q8-11 26-11z" fill="url(#${gJal})"/>
      <path d="M50 58 v58" stroke="#C9CFDA" stroke-width="2"/>
      <path d="M50 56 q-10 1 -16 6 l8 12 q4-8 8-9 q4 1 8 9 l8-12
               q-6-5 -16-6z" fill="#39414F"/>
      <!-- bolso com lápis, detalhe de cientista -->
      <path d="M60 86 h13 v12 h-13z" fill="#EDF1F6"/>
      <path d="M65 82 v8" stroke="#F5921E" stroke-width="2.4" stroke-linecap="round"/>
      ${lustro(34, 76, 6, 14, 14, .18)}

      <path d="M44 48 q6 5 12 0 l1 10 q-7 5 -14 0z" fill="#CF9A72"/>
      <ellipse cx="50" cy="34" rx="26" ry="27" fill="url(#${gPele})"/>
      <!-- cabelo cheio, para trás -->
      <path d="M23 38 q0-33 27-33 q27 0 27 33 l-2 2
               q-4-13 -13-17 q-6 6 -12 6 q-6 0-12-6 q-9 4 -13 17z"
        fill="url(#${gCab})"/>
      ${lustro(37, 18, 10, 5, -22, .45)}
      ${olho(40, 34, 6.6, .7)} ${olho(60, 34, 6.6, .7)}
      <path d="M32 25 q7-4 13-1" stroke="#8A9099" stroke-width="2.8"
        fill="none" stroke-linecap="round"/>
      <path d="M55 24 q7-3 13 1" stroke="#8A9099" stroke-width="2.8"
        fill="none" stroke-linecap="round"/>
      <path d="M47 41 q3 3 6 0" stroke="#CF9A72" stroke-width="2.2"
        fill="none" stroke-linecap="round"/>
      <!-- barba: é assim que a criança reconhece o Pasteur do livro -->
      <path d="M27 40 q0 26 23 27 q23-1 23-27 q-3 15 -12 19
               q-5 3 -11 3 q-6 0-11-3 q-9-4 -12-19z" fill="url(#${gCab})"/>
      <path d="M40 47 q10 4 20 0 q-3 6 -10 6 q-7 0-10-6z" fill="#B4364A" opacity=".75"/>
      <path d="M38 41 q12-3 24 0" stroke="#9AA1AB" stroke-width="2.4"
        fill="none" stroke-linecap="round"/>`, cls);
  };

  // Frasco de caldo. fervido=true → o calor matou os micróbios.
  const frasco = (fervido = false, temGerme = false, rotulo = '') => svg('0 0 90 130', `
    <text x="45" y="12" text-anchor="middle" font-size="12" fill="#fff"
      font-family="'Trebuchet MS'">${rotulo}</text>
    <path d="M40 18 h10 v26 l18 30 q8 14 -3 22 q-20 8 -40 0 q-11-8 -3-22 l18-30z"
      fill="#DFF1FA" opacity=".55"/>
    <path d="M40 18 h10 v26 l18 30 q8 14 -3 22 q-20 8 -40 0 q-11-8 -3-22 l18-30z"
      fill="none" stroke="#EAF6FC" stroke-width="3"/>
    <path d="M27 78 q18-6 36 0 q7 12 -3 18 q-16 7 -30 0 q-10-6 -3-18z"
      fill="${fervido ? '#F5D9A8' : '#C9B48A'}"/>
    ${temGerme ? `
      <g fill="#7ED957">
        <circle class="bolha-caldo"   cx="38" cy="88" r="4"/>
        <circle class="bolha-caldo b2" cx="52" cy="92" r="3.4"/>
        <circle class="bolha-caldo b3" cx="45" cy="84" r="3"/>
        <circle class="bolha-caldo b4" cx="58" cy="86" r="2.6"/>
        <circle class="bolha-caldo b5" cx="32" cy="93" r="2.8"/>
      </g>` : ''}
    ${fervido ? `
      <g stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path class="vapor"    d="M38 30 q4-7 0-13"/>
        <path class="vapor v2" d="M46 26 q4-7 0-13"/>
        <path class="vapor v3" d="M54 30 q4-7 0-13"/>
      </g>` : ''}
    <rect x="36" y="14" width="18" height="7" rx="3" fill="#C9CDD4"/>`);

  const fogareiro = (aceso = false) => svg('0 0 70 40', `
    <rect x="10" y="26" width="50" height="10" rx="5" fill="#5C6270"/>
    <rect x="30" y="14" width="10" height="14" rx="4" fill="#8A8F99"/>
    ${aceso ? `
      <g>
        <path d="M35 4 q9 8 8 14 q-1 8 -8 8 q-7 0 -8-8 q-1-6 8-14z" fill="#F5921E"/>
        <path d="M35 10 q5 6 4 10 q-1 5 -4 5 q-3 0 -4-5 q-1-4 4-10z" fill="#FFD65A"/>
      </g>` : ''}`);

  /* ======================================================================
     CENÁRIO E OBJETOS DE APOIO
     ====================================================================== */

  const estante = () => svg('0 0 120 150', `
    <rect x="4" y="4" width="112" height="142" rx="8" fill="#8A5A34"/>
    <rect x="12" y="12" width="96" height="40" rx="4" fill="#6B4526"/>
    <rect x="12" y="58" width="96" height="40" rx="4" fill="#6B4526"/>
    <rect x="12" y="104" width="96" height="38" rx="4" fill="#6B4526"/>
    ${[['#F0524B', 16, 16], ['#1B9BF0', 30, 18], ['#4CC46A', 44, 15], ['#8A6BE0', 57, 19],
      ['#F5921E', 72, 16], ['#29B6CE', 86, 18]].map(([c, x, h]) =>
      `<rect x="${x}" y="${52 - h}" width="11" height="${h}" rx="2" fill="${c}"/>`).join('')}
    ${[['#FFC61E', 16, 18], ['#F0524B', 30, 15], ['#29B6CE', 44, 19], ['#4CC46A', 58, 16],
      ['#8A6BE0', 72, 18], ['#1B9BF0', 86, 15]].map(([c, x, h]) =>
      `<rect x="${x}" y="${98 - h}" width="11" height="${h}" rx="2" fill="${c}"/>`).join('')}
    ${[['#1B9BF0', 18, 17], ['#F5921E', 34, 19], ['#4CC46A', 52, 15], ['#F0524B', 70, 18]].map(([c, x, h]) =>
      `<rect x="${x}" y="${142 - h}" width="13" height="${h}" rx="2" fill="${c}"/>`).join('')}`);

  const livroAntigo = (aberto = false, brilha = false) => svg('0 0 130 90', `
    ${brilha ? `<ellipse cx="65" cy="50" rx="62" ry="42" fill="#FFD65A" opacity=".3"/>` : ''}
    ${aberto ? `
      <path d="M8 26 q57-14 57 0 q0-14 57 0 l-6 50 q-51-12 -51 2 q0-14 -51-2z" fill="#8A5A34"/>
      <path d="M12 28 q53-12 53 2 l0 44 q-47-11 -47 1z" fill="#FFF6DC"/>
      <path d="M118 28 q-53-12 -53 2 l0 44 q47-11 47 1z" fill="#FFF9EC"/>
      <g stroke="#C9A227" stroke-width="1.6" opacity=".7" stroke-linecap="round">
        <path d="M20 38 h34"/><path d="M20 45 h34"/><path d="M20 52 h28"/><path d="M20 59 h32"/>
        <path d="M76 38 h34"/><path d="M76 45 h30"/><path d="M76 52 h34"/><path d="M76 59 h26"/>
      </g>
      <path d="M65 28 v46" stroke="#C9A227" stroke-width="1.6" opacity=".5"/>`
      : `
      <rect x="18" y="10" width="94" height="70" rx="6" fill="#8A5A34"/>
      <rect x="18" y="10" width="10" height="70" rx="4" fill="#6B4526"/>
      <rect x="34" y="20" width="64" height="50" rx="4" fill="none" stroke="#C9A227" stroke-width="2.4"/>
      <circle cx="66" cy="45" r="13" fill="none" stroke="#C9A227" stroke-width="2.4"/>
      <path d="M66 34 v22 M55 45 h22" stroke="#C9A227" stroke-width="2"/>
      <g fill="#FFF6DC" opacity=".9"><rect x="110" y="14" width="4" height="62" rx="2"/></g>`}`);

  const medalha = (tipo = 'ouro') => {
    const c = tipo === 'ouro' ? ['#FFD65A', '#E8A400', '#FFF3B0']
      : tipo === 'prata' ? ['#DCE2EA', '#A8B2C0', '#F4F7FA']
        : ['#E0A272', '#B4753F', '#F2C9A4'];
    return svg('0 0 100 130', `
      <path d="M28 2 l18 54 h-26z" fill="#F0524B"/>
      <path d="M72 2 l-18 54 h26z" fill="#1B9BF0"/>
      <circle cx="50" cy="82" r="40" fill="${c[1]}"/>
      <circle cx="50" cy="80" r="35" fill="${c[0]}"/>
      <circle cx="50" cy="80" r="26" fill="${c[2]}" opacity=".55"/>
      <path d="M50 58 l7 15 l16 2 l-12 11 l3 16 l-14-8 l-14 8 l3-16 l-12-11 l16-2z" fill="${c[1]}"/>
      <ellipse cx="38" cy="64" rx="10" ry="6" fill="#fff" opacity=".4" transform="rotate(-30 38 64)"/>`);
  };

  const qrPlaceholder = () => svg('0 0 60 60', `
    <rect width="60" height="60" rx="6" fill="#fff"/>
    <g fill="#16294A">
      <rect x="6" y="6" width="14" height="14"/><rect x="40" y="6" width="14" height="14"/>
      <rect x="6" y="40" width="14" height="14"/>
      <rect x="10" y="10" width="6" height="6" fill="#fff"/>
      <rect x="44" y="10" width="6" height="6" fill="#fff"/>
      <rect x="10" y="44" width="6" height="6" fill="#fff"/>
      <rect x="26" y="8" width="4" height="4"/><rect x="26" y="16" width="4" height="4"/>
      <rect x="26" y="26" width="4" height="4"/><rect x="34" y="26" width="4" height="4"/>
      <rect x="42" y="26" width="4" height="4"/><rect x="26" y="34" width="4" height="4"/>
      <rect x="34" y="42" width="4" height="4"/><rect x="42" y="34" width="4" height="4"/>
      <rect x="48" y="42" width="4" height="4"/><rect x="34" y="50" width="4" height="4"/>
    </g>`);

  return {
    logo, zezinho, avatar, colega, COLEGAS, TONS,
    gravetoSeco, gravetoMolhado, chama, pedraFogo, paginaPerdida, tribo,
    carneCrua, carneAssada, criancaFrio, animalNoturno,
    jenner, vaca, aldeao, seringa, germe, anticorpo, escudoCorpo,
    pasteur, frasco, fogareiro,
    estante, livroAntigo, medalha, qrPlaceholder
  };
})();
