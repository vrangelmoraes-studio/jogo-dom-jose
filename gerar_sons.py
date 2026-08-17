# -*- coding: utf-8 -*-
"""
gerar_sons.py — cria os efeitos sonoros do jogo em sons/*.wav

Os sons são SINTETIZADOS aqui, não baixados: assim não existe dúvida de
licença, nada precisa de internet e cada arquivo sai com poucos KB.

Rode só quando quiser mudar algum efeito:

    python -X utf8 gerar_sons.py

Regra de tom que vale para todos: som de ERRO nunca é áspero. O jogo inteiro
é não punitivo, e um "errou!" estridente contradiz isso na hora.
"""
import math
import os
import struct
import wave

import numpy as np

TAXA = 22050                      # 22 kHz basta para efeito curto e pesa metade
AQUI = os.path.dirname(os.path.abspath(__file__))
PASTA = os.path.join(AQUI, 'sons')


# ----------------------------------------------------------- ferramentas
def t(dur):
    return np.linspace(0, dur, int(TAXA * dur), endpoint=False)


def seno(freq, dur, fase=0.0):
    return np.sin(2 * np.pi * freq * t(dur) + fase)


def varredura(f0, f1, dur, tipo='lin'):
    """Tom que desliza de f0 para f1."""
    x = t(dur)
    if tipo == 'exp' and f0 > 0 and f1 > 0:
        f = f0 * (f1 / f0) ** (x / max(dur, 1e-6))
    else:
        f = np.linspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / TAXA)


def ruido(dur):
    return np.random.uniform(-1, 1, int(TAXA * dur))


def passa_baixa(x, corte):
    """Filtro de um polo. Tira o brilho e deixa o som mais macio."""
    a = math.exp(-2 * math.pi * corte / TAXA)
    y = np.zeros_like(x)
    ant = 0.0
    for i, v in enumerate(x):
        ant = (1 - a) * v + a * ant
        y[i] = ant
    return y


def env(x, ataque=0.005, queda=None, curva=3.0):
    """Envelope: sobe rápido, cai suave. Sem isto todo som vira 'clique'."""
    n = len(x)
    e = np.ones(n)
    na = max(1, int(TAXA * ataque))
    e[:na] = np.linspace(0, 1, na)
    if queda is None:
        e[na:] = np.linspace(1, 0, n - na) ** curva
    else:
        nq = min(n - na, max(1, int(TAXA * queda)))
        e[na:na + nq] = np.linspace(1, 0, nq) ** curva
        e[na + nq:] = 0
    return x * e


def juntar(*partes):
    """Soma sons de tamanhos diferentes, alinhados pelo começo."""
    n = max(len(p) for p in partes)
    saida = np.zeros(n)
    for p in partes:
        saida[:len(p)] += p
    return saida


def emenda(*partes):
    return np.concatenate(partes)


def atraso(x, seg):
    return np.concatenate([np.zeros(int(TAXA * seg)), x])


def salvar(nome, x, volume=0.62):
    pico = np.max(np.abs(x)) or 1.0
    x = (x / pico) * volume
    # 3 ms de rampa nas pontas: evita o "toc" de corte seco
    r = int(TAXA * 0.003)
    if len(x) > 2 * r:
        x[:r] *= np.linspace(0, 1, r)
        x[-r:] *= np.linspace(1, 0, r)
    dados = (x * 32767).astype('<i2')
    cam = os.path.join(PASTA, nome + '.wav')
    with wave.open(cam, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(TAXA)
        w.writeframes(dados.tobytes())
    return os.path.getsize(cam)


# ------------------------------------------------------------- os sons
def sons():
    s = {}

    # toque de botão: curtinho e discreto, toca dezenas de vezes
    s['toque'] = env(juntar(seno(1300, .05), .3 * seno(2600, .04)), .001, curva=4)

    # pegar graveto / avançar passo: dois blips subindo
    s['coleta'] = juntar(env(seno(880, .09), .002, curva=4),
                         atraso(env(seno(1320, .10), .002, curva=4), .05))

    # achar página perdida: sino com brilho
    s['pagina'] = juntar(
        env(seno(1046, .45), .002, curva=2.5),
        .55 * atraso(env(seno(1568, .40), .002, curva=2.5), .06),
        .35 * atraso(env(seno(2093, .38), .002, curva=2.5), .12),
        .18 * env(passa_baixa(ruido(.30), 5000), .002, curva=3))

    # acerto: tríade maior subindo
    s['certo'] = juntar(env(seno(659, .30), .003, curva=2.5),
                        .8 * atraso(env(seno(831, .30), .003, curva=2.5), .07),
                        .7 * atraso(env(seno(988, .38), .003, curva=2.2), .14))

    # erro: DOIS tons descendo, macios. Nunca áspero — o jogo não pune.
    s['errado'] = juntar(env(passa_baixa(seno(330, .22), 1200), .006, curva=2),
                         .7 * atraso(env(passa_baixa(seno(262, .30), 1000), .006, curva=2), .10))

    # esfregar pedra: ruído filtrado, curto e seco
    s['fogo'] = env(passa_baixa(ruido(.16), 1800) * (1 + .4 * seno(60, .16)),
                    .004, curva=2.2)

    # fogo pegou: sopro subindo + acorde quente
    s['chama'] = juntar(
        env(passa_baixa(ruido(.55) * np.linspace(.2, 1, int(TAXA * .55)), 2600), .02, curva=1.6),
        .45 * env(varredura(180, 520, .5, 'exp'), .02, curva=2),
        .30 * atraso(env(seno(523, .45), .01, curva=2), .06),
        .22 * atraso(env(seno(784, .42), .01, curva=2), .10))

    # rajada de vento: ruído grave que incha e some
    v = ruido(.7)
    inch = np.sin(np.linspace(0, math.pi, len(v))) ** 1.5
    s['vento'] = passa_baixa(v * inch, 700)

    # germe estourando: estalo curto descendo
    s['germe'] = juntar(env(varredura(900, 220, .14, 'exp'), .001, curva=3.5),
                        .5 * env(passa_baixa(ruido(.09), 3500), .001, curva=4))

    # tomar vacina: brilho subindo, sensação de "ficou forte"
    s['vacina'] = juntar(env(varredura(440, 1320, .5, 'exp'), .01, curva=2),
                         .4 * atraso(env(seno(1760, .3), .004, curva=2.5), .22),
                         .25 * env(passa_baixa(ruido(.35), 6000), .01, curva=2.6))

    # vitória de etapa: quatro notas subindo
    notas = [523, 659, 784, 1047]
    s['vitoria'] = juntar(*[
        (.9 - i * .08) * atraso(env(seno(f, .42 if i == 3 else .22), .004, curva=2.2), i * .11)
        for i, f in enumerate(notas)])

    # medalha do final: fanfarra um pouco maior
    s['medalha'] = juntar(*[
        (.9 - i * .06) * atraso(env(seno(f, .7 if i == 4 else .26), .005, curva=2), i * .13)
        for i, f in enumerate([523, 659, 784, 1047, 1319])],
        .3 * atraso(env(seno(1568, .8), .01, curva=1.8), .52))

    return s


def main():
    os.makedirs(PASTA, exist_ok=True)
    np.random.seed(7)          # mesmo ruído toda vez: som não muda sem querer
    total = 0
    for nome, onda in sorted(sons().items()):
        n = salvar(nome, onda)
        total += n
        print('  %-9s %5.2f s  %5d bytes' % (nome, len(onda) / TAXA, n))
    print('\n%d efeitos, %.0f KB no total, em sons/' % (len(sons()), total / 1024))


if __name__ == '__main__':
    main()
