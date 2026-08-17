/* ==========================================================================
   minijogos.js — os três trechos que são DE FATO jogo, rodando em Phaser.

   POR QUE SÓ TRÊS: o jogo tem 15 telas, e 12 delas são cartão de texto,
   lista de opções, campo onde a criança digita o nome, tela rolável e o
   relatório do professor que precisa imprimir. Phaser desenha em canvas —
   é excelente em sprite, partícula e tween, e ruim em digitação, quebra de
   linha, rolagem e impressão. Então o motor cuida do que é jogo e o HTML
   cuida do que é interface. Cada um no que é bom.

   A ARTE É A MESMA: as figuras de art.js entram aqui como textura, via SVG
   em data URI. Nada foi redesenhado, e mexer no art.js muda os dois lados.

   Se o Phaser não carregar, game.js volta sozinho para a versão em HTML.
   Nenhuma tela depende deste arquivo para existir.
   ========================================================================== */

const MINIJOGOS = (() => {

  let atual = null;    // instância de Phaser viva (só existe uma por vez)

  /* SVG vira textura por data URI EM BASE64.
     Tem que ser base64: o carregador do Phaser vê "data:" e chama atob()
     direto. Com o texto escapado por porcentagem ele estoura em
     "string not correctly encoded" e a cena inteira nem chega a nascer. */
  function svgURI(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return 'data:image/svg+xml;base64,' + btoa(bin);
  }

  function destruir() {
    if (atual) {
      try { atual.destroy(true); } catch (e) { }
      atual = null;
    }
  }

  function abrir(el, cena) {
    destruir();
    atual = new Phaser.Game({
      type: Phaser.AUTO,
      parent: el,
      transparent: true,           // deixa o degradê do CSS aparecer atrás
      banner: false,
      audio: { noAudio: true },    // o som é do som.js, não do Phaser
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: el.clientWidth || 360,
        height: el.clientHeight || 420
      },
      scene: cena
    });
    return atual;
  }

  /* Bolinha branca usada como partícula. Sai de um Graphics, então não
     precisa de arquivo de imagem nenhum. */
  function fazerFaisca(cena) {
    if (cena.textures.exists('faisca')) return;
    const g = cena.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('faisca', 16, 16);
    g.destroy();
  }

  const L = c => c.scale.gameSize.width;
  const A = c => c.scale.gameSize.height;

  /* ======================================================================
     1. COLETA DE GRAVETOS
     A lição está na mecânica: o molhado não serve, e a criança descobre
     tocando. Aqui o Phaser acrescenta o que faltava — o graveto balança
     no lugar, some com faísca, e o molhado espirra água ao ser tocado.
     ====================================================================== */
  class CenaColeta extends Phaser.Scene {
    constructor(o) { super('coleta'); this.o = o; this.secos = 0; }

    preload() {
      this.load.svg('seco', svgURI(ART.gravetoSeco()), { width: 100, height: 44 });
      this.load.svg('molhado', svgURI(ART.gravetoMolhado()), { width: 100, height: 50 });
      this.load.svg('pagina', svgURI(ART.paginaPerdida()), { width: 46, height: 55 });
    }

    create() {
      fazerFaisca(this);
      const W = L(this), H = A(this);

      this.faiscas = this.add.particles(0, 0, 'faisca', {
        speed: { min: 50, max: 190 }, lifespan: 520, quantity: 14,
        scale: { start: .55, end: 0 }, tint: [0xFFC61E, 0xF5921E, 0xFFF3B0],
        emitting: false
      }).setDepth(20);

      this.gotas = this.add.particles(0, 0, 'faisca', {
        speed: { min: 40, max: 130 }, lifespan: 620, quantity: 10,
        gravityY: 320, scale: { start: .45, end: 0 },
        tint: [0x6FD3F5, 0x9BE3FA], emitting: false
      }).setDepth(20);

      // grade com tremida: espalha sem deixar um em cima do outro
      const tipos = Phaser.Utils.Array.Shuffle(
        Array(7).fill('seco').concat(Array(5).fill('molhado')));
      const cols = 3, linhas = Math.ceil(tipos.length / cols);

      tipos.forEach((tipo, i) => {
        const c = i % cols, l = Math.floor(i / cols);
        const x = W * (0.20 + c * 0.30) + Phaser.Math.Between(-16, 16);
        const y = H * (0.13 + l * (0.74 / (linhas - 1))) + Phaser.Math.Between(-12, 12);
        const s = this.add.image(x, y, tipo).setInteractive({ useHandCursor: true });
        s.setScale(Math.min(1, W / 420));
        s.setAngle(Phaser.Math.Between(-12, 12));

        // balanço parado: o cenário fica vivo sem pedir nada da criança
        this.tweens.add({
          targets: s, y: y - 4, duration: Phaser.Math.Between(1400, 2200),
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 900)
        });

        s.on('pointerdown', () => this.tocou(s, tipo));
      });

      for (let i = 0; i < (this.o.paginas || 0); i++) this.criarPagina();

      this.scale.on('resize', () => { });
    }

    criarPagina() {
      const W = L(this), H = A(this);
      const p = this.add.image(
        Phaser.Math.Between(W * .12, W * .88),
        Phaser.Math.Between(H * .12, H * .86), 'pagina')
        .setInteractive({ useHandCursor: true }).setDepth(10);
      this.tweens.add({
        targets: p, scale: 1.14, duration: 900, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });
      p.on('pointerdown', () => {
        this.faiscas.emitParticleAt(p.x, p.y, 18);
        this.tweens.add({
          targets: p, scale: 1.9, alpha: 0, duration: 340,
          onComplete: () => p.destroy()
        });
        p.disableInteractive();
        SOM.pagina();
        if (this.o.aoPagina) this.o.aoPagina();
      });
    }

    tocou(s, tipo) {
      if (!s.input || !s.input.enabled) return;

      if (tipo === 'molhado') {
        this.gotas.emitParticleAt(s.x, s.y + 10, 10);
        SOM.errado();
        this.tweens.add({
          targets: s, x: s.x + 8, duration: 55, yoyo: true, repeat: 3,
          ease: 'Sine.easeInOut'
        });
        if (this.o.aoMolhado) this.o.aoMolhado();
        return;
      }

      s.disableInteractive();
      this.secos++;
      this.faiscas.emitParticleAt(s.x, s.y, 14);
      SOM.coleta();
      this.tweens.add({
        targets: s, scale: s.scale * 1.7, alpha: 0, y: s.y - 26,
        duration: 340, ease: 'Back.easeIn',
        onComplete: () => s.destroy()
      });
      if (this.o.aoSeco) this.o.aoSeco(this.secos);
      if (this.secos >= this.o.precisa && this.o.aoCompletar) this.o.aoCompletar();
    }
  }

  /* ======================================================================
     2. ACENDER O FOGO
     Aqui o Phaser é só o DESENHO. A regra do jogo (quanto calor, quando o
     vento vem) continua em game.js, que já estava testada — não valia
     reescrever a lógica só para trocar o desenhista.
     ====================================================================== */
  class CenaFogo extends Phaser.Scene {
    constructor(o) {
      super('fogo');
      this.o = o;
      this.calor = 0;        // 0..100, escrito de fora
      this.ventando = false;
      this.pronto = false;
    }

    preload() {
      this.load.svg('pedra', svgURI(ART.pedraFogo()), { width: 120, height: 86 });
      this.load.svg('fogueira', svgURI(ART.chama(1)), { width: 150, height: 200 });
    }

    create() {
      fazerFaisca(this);
      const W = L(this), H = A(this);
      const cx = W / 2, cy = H * .62;

      this.pedra = this.add.image(cx, cy + 40, 'pedra').setScale(.9);

      this.chama = this.add.image(cx, cy, 'fogueira').setOrigin(.5, .78);
      this.chama.setScale(.001);

      this.brasa = this.add.particles(cx, cy, 'faisca', {
        speed: { min: 30, max: 110 }, angle: { min: 240, max: 300 },
        lifespan: 900, quantity: 3, frequency: 90,
        scale: { start: .35, end: 0 },
        tint: [0xFFC61E, 0xF5921E, 0xFF6B2C],
        emitting: false
      }).setDepth(5);

      this.fagulhas = this.add.particles(cx, cy + 30, 'faisca', {
        speed: { min: 90, max: 260 }, angle: { min: 200, max: 340 },
        lifespan: 460, quantity: 10, scale: { start: .5, end: 0 },
        tint: [0xFFF3B0, 0xFFC61E], emitting: false
      }).setDepth(6);

      this.rajada = this.add.particles(-20, H * .35, 'faisca', {
        speedX: { min: 220, max: 420 }, speedY: { min: -30, max: 30 },
        lifespan: 1100, quantity: 2, frequency: 60,
        scale: { start: .32, end: .05 }, alpha: { start: .55, end: 0 },
        tint: 0xDFF1FA, emitting: false
      }).setDepth(8);

      this.pronto = true;
    }

    update() {
      if (!this.pronto) return;
      const f = Phaser.Math.Clamp(this.calor / 100, 0, 1);

      // a chama cresce com o calor; some de vez quando ainda é só pedra
      const alvo = f < .22 ? .001 : .35 + f * .85;
      this.chama.setScale(Phaser.Math.Linear(this.chama.scaleX, alvo, .12));
      this.chama.setAlpha(f < .22 ? 0 : 1);

      // tremeluzir: nada de chama parada
      if (f >= .22) {
        this.chama.setScale(
          this.chama.scaleX * Phaser.Math.FloatBetween(.985, 1.015),
          this.chama.scaleY * Phaser.Math.FloatBetween(.98, 1.03));
      }

      if (this.brasa.emitting !== (f >= .22)) this.brasa.emitting = (f >= .22);
      this.pedra.setAlpha(f < .55 ? 1 : Math.max(0, 1 - (f - .55) * 2));
    }

    esfregou() {
      if (!this.pronto) return;
      this.fagulhas.emitParticleAt(this.pedra.x, this.pedra.y - 10, 8);
      this.tweens.add({
        targets: this.pedra, x: this.pedra.x + 5, duration: 45,
        yoyo: true, repeat: 1, ease: 'Sine.easeInOut'
      });
    }

    soprar(lig) {
      this.ventando = lig;
      if (!this.pronto) return;
      this.rajada.emitting = lig;
      // Mata o balanço anterior. Sem isto, duas rajadas seguidas empilham
      // dois tweens de ângulo e a chama entra em parafuso.
      this.tweens.killTweensOf(this.chama);
      if (lig) {
        this.tweens.add({
          targets: this.chama, angle: 16, duration: 260,
          yoyo: true, repeat: 4, ease: 'Sine.easeInOut'
        });
      } else {
        this.tweens.add({ targets: this.chama, angle: 0, duration: 200 });
      }
    }

    acendeu() {
      if (!this.pronto) return;
      this.fagulhas.emitParticleAt(this.chama.x, this.chama.y - 20, 45);
      this.cameras.main.shake(220, .006);
      this.cameras.main.flash(260, 255, 200, 90);
    }
  }

  /* ======================================================================
     3. DEFENDER O CORPO
     É o minijogo que mais ganha com o motor: germe entrando de qualquer
     borda, anticorpo orbitando, estouro com partícula. E é o mais
     importante do jogo — a rodada 1 SEM vacina precisa frustrar de
     propósito, porque é a frustração que ensina.
     ====================================================================== */
  class CenaDefesa extends Phaser.Scene {
    constructor(o) {
      super('defesa');
      this.o = o;
      // A rodada 2 monta uma CENA NOVA que ja comeca vacinada. Antes isto
      // era feito chamando vacinar() logo apos criar o jogo — mas ai a cena
      // ainda nao tinha rodado create(), o escudo nao existia, e estourava
      // "Cannot read properties of undefined".
      this.vacinado = !!o.jaVacinado;
      this.rodando = true;
      this.mortos = 0;
      this.chegaram = 0;
    }

    preload() {
      this.load.svg('escudo0', svgURI(ART.escudoCorpo(0)), { width: 110, height: 126 });
      this.load.svg('escudo1', svgURI(ART.escudoCorpo(1)), { width: 110, height: 126 });
      this.load.svg('anticorpo', svgURI(ART.anticorpo()), { width: 52, height: 52 });
      this.load.svg('pagina', svgURI(ART.paginaPerdida()), { width: 46, height: 55 });
      ['#7ED957', '#8A6BE0', '#F0524B'].forEach((c, i) =>
        this.load.svg('germe' + i, svgURI(ART.germe(c)), { width: 54, height: 54 }));
    }

    create() {
      fazerFaisca(this);
      const W = L(this), H = A(this);
      this.cx = W / 2; this.cy = H / 2;

      this.escudo = this.add.image(this.cx, this.cy,
        this.vacinado ? 'escudo1' : 'escudo0').setDepth(4);
      this.tweens.add({
        targets: this.escudo, scale: 1.05, duration: 1500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });

      this.estouro = this.add.particles(0, 0, 'faisca', {
        speed: { min: 70, max: 240 }, lifespan: 520, quantity: 16,
        scale: { start: .5, end: 0 }, tint: [0x7ED957, 0xFFFFFF, 0x4CC46A],
        emitting: false
      }).setDepth(20);

      this.brilho = this.add.particles(0, 0, 'faisca', {
        speed: { min: 40, max: 160 }, lifespan: 700, quantity: 20,
        scale: { start: .55, end: 0 }, tint: [0x1B9BF0, 0xFFFFFF, 0x5FB4F2],
        emitting: false
      }).setDepth(20);

      this.anticorpos = [];
      if (this.vacinado) this.criarAnticorpos();
      for (let i = 0; i < (this.o.paginas || 0); i++) this.criarPagina();

      this.timer = this.time.addEvent({
        delay: this.vacinado ? 900 : 1500, loop: true, callback: () => this.soltar()
      });
      this.soltar();
    }

    criarPagina() {
      const W = L(this), H = A(this);
      // longe do centro, senão a página fica escondida atrás do escudo
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const r = Math.min(W, H) * Phaser.Math.FloatBetween(.28, .40);
      const p = this.add.image(this.cx + Math.cos(ang) * r,
                               this.cy + Math.sin(ang) * r, 'pagina')
        .setInteractive({ useHandCursor: true }).setDepth(9);
      this.tweens.add({
        targets: p, scale: 1.14, duration: 900, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });
      p.on('pointerdown', () => {
        this.estouro.emitParticleAt(p.x, p.y, 14);
        p.disableInteractive();
        this.tweens.add({
          targets: p, scale: 1.9, alpha: 0, duration: 320,
          onComplete: () => p.destroy()
        });
        SOM.pagina();
        if (this.o.aoPagina) this.o.aoPagina();
      });
    }

    /* Três anticorpos orbitando: a defesa ficou PRONTA esperando. */
    criarAnticorpos() {
      for (let i = 0; i < 3; i++) {
        const a = this.add.image(this.cx, this.cy, 'anticorpo').setDepth(6);
        a.orbita = (Math.PI * 2 / 3) * i;
        this.anticorpos.push(a);
      }
    }

    vacinar() {
      this.vacinado = true;
      this.mortos = 0;
      this.chegaram = 0;
      // Guarda: se ainda nao rodou create(), so anota o estado. O create()
      // le this.vacinado e monta tudo ja do jeito certo.
      if (!this.escudo) return;
      this.escudo.setTexture('escudo1');
      this.brilho.emitParticleAt(this.cx, this.cy, 30);
      this.cameras.main.flash(320, 120, 190, 250);
      this.criarAnticorpos();
      this.timer.reset({ delay: 900, loop: true, callback: () => this.soltar() });
      this.soltar();
    }

    update(_, dt) {
      const r = Math.min(L(this), A(this)) * .22;
      this.anticorpos.forEach(a => {
        a.orbita += dt * 0.0013;
        a.x = this.cx + Math.cos(a.orbita) * r;
        a.y = this.cy + Math.sin(a.orbita) * r * .75;
        a.setAngle(Math.sin(a.orbita * 2) * 12);
      });
    }

    soltar() {
      if (!this.rodando) return;
      const W = L(this), H = A(this);
      const lado = Phaser.Math.Between(0, 3);
      const m = 40;
      const x = lado === 2 ? -m : lado === 3 ? W + m : Phaser.Math.Between(20, W - 20);
      const y = lado === 0 ? -m : lado === 1 ? H + m : Phaser.Math.Between(20, H - 20);

      const g = this.add.image(x, y, 'germe' + Phaser.Math.Between(0, 2))
        .setInteractive({ useHandCursor: true }).setDepth(8);
      this.tweens.add({
        targets: g, angle: 360, duration: 4000, repeat: -1, ease: 'Linear'
      });

      const viagem = this.tweens.add({
        targets: g, x: this.cx, y: this.cy, duration: 4400, ease: 'Linear',
        onComplete: () => this.chegou(g)
      });

      g.on('pointerdown', () => {
        if (!this.rodando) return;
        if (!this.vacinado) {
          // DE PROPÓSITO não morre: o corpo ainda não sabe quem é o invasor.
          // A frustração de 20 segundos ensina o que nenhum texto ensina.
          SOM.errado();
          this.tweens.add({
            targets: g, scaleX: 1.25, scaleY: .8, duration: 90,
            yoyo: true, repeat: 1
          });
          if (this.o.aoTocarSemVacina) this.o.aoTocarSemVacina();
          return;
        }
        viagem.stop();
        this.estouro.emitParticleAt(g.x, g.y, 16);
        g.destroy();
        SOM.germe();
        this.mortos++;
        if (this.o.aoMatar) this.o.aoMatar(this.mortos);
      });
    }

    chegou(g) {
      if (!g.active) return;
      g.destroy();
      this.chegaram++;
      this.cameras.main.shake(160, .008);
      this.tweens.add({
        targets: this.escudo, scaleX: .88, scaleY: 1.12,
        duration: 110, yoyo: true
      });
      if (this.o.aoChegar) this.o.aoChegar(this.chegaram, this.vacinado);
    }

    parar() {
      this.rodando = false;
      if (this.timer) this.timer.remove();
      this.tweens.killAll();
    }
  }

  /* ======================================================================
     API que o game.js usa
     ====================================================================== */
  return {
    disponivel: () => typeof Phaser !== 'undefined',
    destruir,

    /** A instância viva do Phaser. Existe para o teste automatizado poder
        achar os sprites e tocar neles — o canvas não tem "elemento" para
        clicar como o HTML tem. Não é usado pelo jogo em si. */
    instancia: () => atual,

    coleta(el, o) {
      const c = new CenaColeta(o);
      abrir(el, c);
      return { cena: c, destruir };
    },

    fogo(el, o) {
      const c = new CenaFogo(o || {});
      abrir(el, c);
      return {
        calor: v => { c.calor = v; },
        esfregou: () => c.esfregou(),
        soprar: lig => c.soprar(lig),
        acendeu: () => c.acendeu(),
        destruir
      };
    },

    defesa(el, o) {
      const c = new CenaDefesa(o);
      abrir(el, c);
      return {
        vacinar: () => c.vacinar(),
        parar: () => c.parar(),
        destruir
      };
    }
  };
})();
