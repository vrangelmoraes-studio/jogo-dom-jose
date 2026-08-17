# -*- coding: utf-8 -*-
"""
gerar_vozes.py — grava a voz do Zezinho em arquivo.

COMO USAR (só é preciso quando algum texto do jogo mudar):

    1) numa janela:   python -X utf8 -m http.server 8777
    2) noutra janela: python -X utf8 gerar_vozes.py

O que ele faz, em ordem:
    - joga o jogo inteiro sozinho num navegador e anota TODA fala que aparece,
      inclusive as que só acontecem quando a criança erra;
    - manda cada fala para a voz neural da Microsoft (grátis, sem cadastro);
    - salva vozes/<chave>.mp3 e vozes/lista.json com a duração de cada uma.

A chave de cada arquivo é calculada a partir do próprio texto. Se você mudar
uma frase, ela ganha chave nova, o jogo não acha o MP3 e cai sozinho na voz do
navegador — sem quebrar nada. Aí é só rodar este script de novo.

Falas que não forem capturadas continuam funcionando na voz do navegador.
No fim, o script diz quantas ficaram de fora.
"""
import asyncio
import io
import json
import os
import re
import sys

VOZ    = 'pt-BR-FranciscaNeural'
TOM    = '+18Hz'    # arara: mais agudo
RITMO  = '+8%'      # e um tiquinho mais rápido
URL    = 'http://127.0.0.1:8777/index.html'
PASTA  = 'vozes'

AQUI = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------- chave
def normalizar(t):
    """Mesma normalização do voz.js: só letras e números, tudo minúsculo.
       Grosseira de propósito — acento, emoji, pontuação e HTML não podem
       criar diferença entre o que o Python gera e o que o jogo procura."""
    t = re.sub(r'<[^>]*>', ' ', t)
    t = ''.join(c if (c.isalpha() or c.isdigit()) else ' ' for c in t.lower())
    return re.sub(r'\s+', ' ', t).strip()


def para_voz(t):
    """Tira marcacao HTML e emoji: a voz nao pode ler "menor b maior" nem
       tentar pronunciar um desenho. A pontuacao FICA, porque e dela que sai
       a entonacao."""
    t = re.sub(r'<[^>]*>', ' ', t)
    t = re.sub(r'[🀀-🫿←-➿︀-️'
               r'⬀-⯿]', ' ', t)
    t = t.replace('&nbsp;', ' ').replace('&quot;', '"').replace('&amp;', 'e')
    return re.sub(r'\s+', ' ', t).strip()


def chave(t):
    """FNV-1a de 32 bits, igual ao do voz.js."""
    h = 0x811c9dc5
    for c in normalizar(t):
        h ^= ord(c)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, '08x')


# ------------------------------------------------- 1. capturar as falas
GRAVADOR = """
window.__falas = [];
window.addEventListener('DOMContentLoaded', () => {
  const tela = document.getElementById('tela'); if (!tela) return;
  const anota = n => {
    const els = [];
    if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute('data-falar')) els.push(n);
    if (n.querySelectorAll) els.push(...n.querySelectorAll('[data-falar]'));
    els.forEach(e => {
      const t = (e.getAttribute('data-falar') || e.textContent || '')
                  .replace(/\\s+/g, ' ').trim();
      if (t && !window.__falas.includes(t)) window.__falas.push(t);
    });
  };
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(
      n => { if (n.nodeType === 1) anota(n); })))
    .observe(tela, { childList: true, subtree: true });
});
"""


def capturar():
    """Joga o jogo inteiro sozinho, forcando de proposito os caminhos de erro,
       e devolve toda fala que apareceu na tela."""
    from playwright.sync_api import sync_playwright
    import time  # usado pelas esperas dos minijogos

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 420, 'height': 860})
        pg.add_init_script(GRAVADOR)
        pg.goto(URL, wait_until='load')
        pg.wait_for_timeout(500)
        # som desligado: a tranca fica curta e a captura anda depressa
        pg.evaluate("() => { try { localStorage.setItem('domjose_som','0'); } catch(e){} }")
        pg.reload(wait_until='load')
        pg.wait_for_timeout(500)
        pg.add_style_tag(content='*,*::before,*::after{animation:none !important}')

        def etapa(n):
            print('     . %s' % n, flush=True)

        def clique(sel, t=30000):
            pg.wait_for_selector(sel, timeout=t, state='visible')
            pg.click(sel, timeout=t)
            pg.wait_for_timeout(260)

        def tem(sel):
            return pg.query_selector(sel) is not None

        def alvos():
            """Sprites tocaveis da cena de Phaser, em coordenadas da pagina.
               Os minijogos rodam em canvas: nao ha elemento HTML para
               procurar com seletor."""
            return pg.evaluate("""() => {
                const g = typeof MINIJOGOS === 'undefined' ? null
                        : MINIJOGOS.instancia();
                if (!g) return [];
                const cena = g.scene.scenes.find(s => s.scene.isActive());
                if (!cena) return [];
                const cv = g.canvas.getBoundingClientRect();
                const ex = cv.width / g.scale.gameSize.width;
                const ey = cv.height / g.scale.gameSize.height;
                return cena.children.list
                  .filter(o => o.input && o.input.enabled && o.visible)
                  .map(o => ({ x: cv.left + o.x * ex, y: cv.top + o.y * ey,
                               tex: o.texture ? o.texture.key : '?' }));
            }""")

        def esperar_cena(minimo=1, limite=20000):
            fim = time.time() + limite / 1000.0
            while time.time() < fim:
                a = alvos()
                if len(a) >= minimo:
                    return a
                pg.wait_for_timeout(200)
            return alvos()

        def tocar_tipo(prefixo, voltas=1, espera=150):
            """Toca em sprites cujo nome comeca por X. Devolve quantos tocou."""
            n = 0
            for _ in range(voltas):
                achou = [a for a in alvos() if a['tex'].startswith(prefixo)]
                if not achou:
                    break
                pg.mouse.click(achou[0]['x'], achou[0]['y'])
                pg.wait_for_timeout(espera)
                n += 1
            return n

        def narrar(n):
            for _ in range(n):
                pg.wait_for_selector('#nrt', timeout=30000)
                pg.click('#nrt', timeout=30000)
                pg.wait_for_timeout(280)

        def quiz(n):
            for _ in range(n):
                pg.wait_for_selector('#ops .opcao:not([disabled])', timeout=30000)
                pg.eval_on_selector('#ops .opcao:not([disabled])', 'e => e.click()')
                pg.wait_for_selector('#explica .btn', timeout=30000)
                pg.click('#explica .btn', timeout=30000)
                pg.wait_for_timeout(300)

        def moer(sel_alvo, sel_saida, voltas=40, espera=200, um=False):
            """Fica tocando ate a tela oferecer o botao de sair.
               um=True toca em UM item por vez, sorteado. Serve para as telas
               em que a ordem importa: tocar em todos de uma vez faria o
               ultimo toque cair em cima do resultado do anterior."""
            for _ in range(voltas):
                if tem(sel_saida):
                    return
                pg.eval_on_selector_all(
                    sel_alvo,
                    'els => { if (!els.length) return;'
                    + ('  els[Math.floor(Math.random()*els.length)].click(); }' if um
                       else '  els.forEach(e => e.click()); }'))
                pg.wait_for_timeout(espera)

        etapa('abertura e nome')
        clique('#bComo'); clique('#bV')
        clique('#bJogar'); clique('#bOk')
        pg.fill('#campoNome', 'Sofia'); clique('#bIr')

        etapa('sala de leitura')
        narrar(5)

        # toca num graveto MOLHADO de proposito, para capturar o aviso
        etapa('fase 1: coleta')
        pg.wait_for_selector('#cena canvas', timeout=30000)
        esperar_cena(12)
        tocar_tipo('molhado', 1, 500)
        for _ in range(40):
            if tem('#bIr'):
                break
            if not tocar_tipo('seco', 1, 160):
                break
        tocar_tipo('pagina', 4, 160)
        clique('#bIr')

        # deixa o vento bater uma vez, para capturar o aviso do vento
        etapa('fase 1: acender')
        pg.wait_for_selector('#bAcao', timeout=30000)
        for i in range(160):
            if tem('#bIr'):
                break
            if i == 35:
                pg.wait_for_timeout(4500)
            pg.eval_on_selector('#bAcao', 'e => e.click()')
            pg.wait_for_timeout(105)
        clique('#bIr')

        etapa('fase 1: usos do fogo')
        moer('#lista .cartao', '#bIr', 10, 300)
        clique('#bIr')

        etapa('fase 1: quiz')
        quiz(3)

        etapa('fase 2: entrada')
        narrar(4)

        etapa('fase 2: observar a fazenda')
        moer('#grade .cartao', '#bIr', 14, 280)
        clique('#bIr')
        pg.wait_for_selector('#ops .opcao', timeout=30000)
        pg.eval_on_selector('#ops .opcao', 'e => e.click()')
        clique('#bIr')

        # erra a ordem de proposito, para capturar o aviso
        etapa('fase 2: ordem da vacina')
        pg.wait_for_selector('#ops .opcao', timeout=30000)
        pg.eval_on_selector_all('#ops .opcao', 'els => els[els.length-1].click()')
        pg.wait_for_timeout(700)
        moer('#ops .opcao:not([disabled])', '#bIr', 70, 220, um=True)
        clique('#bIr')

        # toca nos germes SEM vacina, para capturar "o corpo nao reconhece"
        etapa('fase 2: defender o corpo')
        pg.wait_for_selector('#cena canvas', timeout=30000)
        esperar_cena(1)
        fim_t = time.time() + 45
        while time.time() < fim_t and not tem('#bVac'):
            if not tocar_tipo('germe', 1, 200):
                pg.wait_for_timeout(200)
        clique('#bVac')
        fim_t = time.time() + 90
        while time.time() < fim_t and not tem('#bIr'):
            if not tocar_tipo('germe', 1, 120):
                pg.wait_for_timeout(200)
        tocar_tipo('pagina', 4, 160)
        clique('#bIr')
        quiz(3)

        etapa('fase 3: entrada')
        narrar(3)

        etapa('fase 3: laboratorio')
        clique('#fogB')
        clique('#bDias')
        pg.wait_for_selector('#bIr', timeout=30000)
        clique('#bIr')
        pg.wait_for_selector('#ops .opcao', timeout=30000)
        pg.eval_on_selector('#ops .opcao', 'e => e.click()')
        clique('#bIr')

        etapa('fase 3: ponte para o presente')
        narrar(3)

        etapa('fase 3: convencer os colegas')
        for _ in range(3):
            pg.wait_for_selector('#ops .opcao:not([disabled])', timeout=30000)
            pg.eval_on_selector('#ops .opcao:not([disabled])', 'e => e.click()')
            pg.wait_for_selector('#rodape .btn', timeout=30000)
            pg.click('#rodape .btn', timeout=30000)
            pg.wait_for_timeout(300)

        etapa('quiz final')
        quiz(5)
        pg.wait_for_selector('#bNovo', timeout=30000)
        pg.wait_for_timeout(800)

        falas = pg.evaluate('window.__falas || []')
        b.close()
    return falas


# As duas variações do final dependem de achar todas as páginas ou não;
# uma partida só passa por uma delas. As duas entram na mão.
EXTRAS = [
    'Você achou todas as páginas! O livro está completo. '
    'Olhe só o que estava escrito nelas.',
    'Ficaram páginas escondidas por aí. Cada uma guarda uma curiosidade de '
    'verdade. Vale jogar de novo para achar!',
]


# --------------------------------------------------- 2. gerar os áudios
async def gravar(falas):
    import edge_tts
    os.makedirs(os.path.join(AQUI, PASTA), exist_ok=True)
    lista, bytes_total = {}, 0

    for i, texto in enumerate(falas, 1):
        k = chave(texto)
        if k in lista:
            continue
        destino = os.path.join(AQUI, PASTA, k + '.mp3')

        falado = para_voz(texto)
        com = edge_tts.Communicate(falado, VOZ, pitch=TOM, rate=RITMO)
        audio, fim_ns = bytearray(), 0
        async for parte in com.stream():
            if parte['type'] == 'audio':
                audio.extend(parte['data'])
            # A versao instalada marca por FRASE; versoes antigas marcam por
            # palavra. Aceito os dois, senao a duracao vem zerada e a tranca
            # solta antes do audio acabar, cortando a fala no meio.
            elif parte['type'] in ('WordBoundary', 'SentenceBoundary'):
                fim_ns = max(fim_ns, parte['offset'] + parte['duration'])

        with open(destino, 'wb') as f:
            f.write(audio)
        # Rede de seguranca: sem marcacao de tempo, estimo pelo tamanho do
        # arquivo (o edge-tts entrega MP3 de 48 kbps).
        dur = (fim_ns / 1e7) if fim_ns else (len(audio) * 8 / 48000.0)
        dur = round(dur + 0.25, 2)
        lista[k] = dur
        bytes_total += len(audio)
        print('  %2d/%d  %5.1fs  %s  %s' % (i, len(falas), dur, k, texto[:52]))

    with io.open(os.path.join(AQUI, PASTA, 'lista.json'), 'w', encoding='utf-8') as f:
        json.dump(lista, f, ensure_ascii=False, indent=1, sort_keys=True)

    # Apaga audio de fala que nao existe mais. Sem isto, cada correcao de
    # texto deixaria um MP3 orfao para tras e a pasta so cresceria.
    orfaos = 0
    for arq in os.listdir(os.path.join(AQUI, PASTA)):
        if arq.endswith('.mp3') and arq[:-4] not in lista:
            os.remove(os.path.join(AQUI, PASTA, arq))
            orfaos += 1
    if orfaos:
        print('  (%d audio(s) antigo(s) apagado(s))' % orfaos)

    return lista, bytes_total


def main():
    guardadas = os.path.join(AQUI, PASTA, '_falas_capturadas.json')
    if '--rapido' in sys.argv and os.path.exists(guardadas):
        print('1) reaproveitando a captura anterior (--rapido)')
        falas = json.load(io.open(guardadas, encoding='utf-8'))
        print('   %d falas' % len(falas))
        print('2) gravando com a voz %s (tom %s, ritmo %s)...'
              % (VOZ, TOM, RITMO))
        lista, tam = asyncio.run(gravar(falas))
        print('PRONTO: %d audios, %.1f MB no total.'
              % (len(lista), tam / 1048576))
        return 0

    print('1) jogando o jogo para capturar as falas...')
    try:
        falas = capturar()
    except Exception as e:
        print('   NAO CONSEGUI JOGAR:', type(e).__name__, str(e)[:160])
        print('   O servidor esta rodando? python -X utf8 -m http.server 8777')
        return 1
    falas = [f for f in falas if len(normalizar(f)) > 3]
    for e in EXTRAS:
        if e not in falas:
            falas.append(e)
    print('   %d falas capturadas' % len(falas))
    os.makedirs(os.path.join(AQUI, PASTA), exist_ok=True)
    with io.open(guardadas, 'w', encoding='utf-8') as f:
        json.dump(falas, f, ensure_ascii=False, indent=1)

    print('2) gravando com a voz %s (tom %s, ritmo %s)...' % (VOZ, TOM, RITMO))
    lista, tam = asyncio.run(gravar(falas))
    print('\nPRONTO: %d audios, %.1f MB no total.' % (len(lista), tam / 1048576))
    print('Ficaram em %s/ com o indice em %s/lista.json' % (PASTA, PASTA))
    return 0


if __name__ == '__main__':
    sys.exit(main())
