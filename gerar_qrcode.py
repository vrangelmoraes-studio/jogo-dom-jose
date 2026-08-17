# -*- coding: utf-8 -*-
"""
gerar_qrcode.py — cria o QR code e o cartaz para imprimir na feira.

    python -X utf8 gerar_qrcode.py

Sai tudo na pasta qr-code/:
    qrcode.svg   — vetor, é o melhor para gráfica (não perde nitidez)
    qrcode.png   — imagem grande, serve para Word, PowerPoint e impressão caseira
    cartaz.html  — a página do cartaz (fonte, dá para editar)

Para virar cartaz.png é preciso um navegador; o comando está no fim do arquivo.

Correção de erro nível H: o código continua legível mesmo sujo, amassado ou
com um pedaço coberto. Numa feira, o cartaz vai ser tocado por muita mão.
"""
import io
import os

import segno

URL = 'https://vrangelmoraes-studio.github.io/jogo-dom-jose/'
AQUI = os.path.dirname(os.path.abspath(__file__))
PASTA = os.path.join(AQUI, 'qr-code')


def main():
    os.makedirs(PASTA, exist_ok=True)

    qr = segno.make(URL, error='h')
    print('QR gerado: versão %s, correção de erro %s' % (qr.version, qr.error))

    # ------------------------------------------------------------------
    # Duas regras que fazem um QR ler ou não ler, e que erram calado:
    #
    # 1) MARGEM BRANCA de 4 módulos. É o mínimo da especificação. Com menos,
    #    fica bonito no cartaz e o leitor não engata.
    # 2) viewBox no SVG. O segno gera o SVG com largura e altura fixas e SEM
    #    viewBox. Sem viewBox, mudar o tamanho pelo CSS não redimensiona:
    #    RECORTA. Foi assim que o primeiro cartaz saiu com o código cortado,
    #    parecendo inteiro a olho nu e ilegível para a câmera.
    # ------------------------------------------------------------------
    def svg_com_viewbox(escala):
        buf = io.BytesIO()
        qr.save(buf, kind='svg', scale=escala, border=4,
                dark='#16294A', light='#FFFFFF', xmldecl=False, svgns=True)
        txt = buf.getvalue().decode('utf-8')
        larg, alt = qr.symbol_size(scale=escala, border=4)
        return txt.replace('<svg ', '<svg viewBox="0 0 %d %d" ' % (larg, alt), 1), larg

    vetor, _ = svg_com_viewbox(10)
    with io.open(os.path.join(PASTA, 'qrcode.svg'), 'w', encoding='utf-8') as f:
        f.write(vetor)

    png = os.path.join(PASTA, 'qrcode.png')
    qr.save(png, scale=24, border=4, dark='#16294A', light='#FFFFFF')

    # No cartaz o QR sai no tamanho natural (escala inteira), sem o CSS
    # esticar nada: módulo com número redondo de pixels é módulo nítido.
    qr_svg, lado = svg_com_viewbox(8)

    cartaz = (CARTAZ.replace('<!--QR-->', qr_svg)
                    .replace('{URL}', URL)
                    .replace('{LADO}', str(lado)))
    with io.open(os.path.join(PASTA, 'cartaz.html'), 'w', encoding='utf-8') as f:
        f.write(cartaz)

    print('  lado do QR no cartaz: %d px' % lado)
    for nome in ('qrcode.svg', 'qrcode.png', 'cartaz.html'):
        cam = os.path.join(PASTA, nome)
        print('  %-14s %6.1f KB' % (nome, os.path.getsize(cam) / 1024))
    print('\nem qr-code/')


CARTAZ = r'''<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Cartaz — O Livro das Descobertas</title>
<style>
  @page { size: A4; margin: 0 }
  html, body { margin: 0; padding: 0; background: #fff }
  .folha {
    width: 794px; height: 1123px;      /* A4 a 96 dpi */
    margin: 0 auto; padding: 54px 56px;
    box-sizing: border-box;
    font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
    color: #16294A; text-align: center;
    display: flex; flex-direction: column; align-items: center;
    background: linear-gradient(180deg, #FFF6E5 0%, #FFE9C4 100%);
  }
  .logo { width: 300px; margin-bottom: 10px }
  h1 { font-size: 54px; margin: 6px 0 0; color: #F5921E; line-height: 1.05 }
  .sub { font-size: 25px; color: #1B9BF0; margin: 4px 0 14px; font-weight: bold }
  .zez { width: 150px; margin: 0 0 6px }
  .qr {
    background: #fff; padding: 18px; border-radius: 26px;
    box-shadow: 0 8px 0 rgba(22,41,74,.10);
    line-height: 0; margin-bottom: 12px;
  }
  .qr svg { width: {LADO}px; height: {LADO}px; display: block }
  .como { font-size: 24px; margin: 4px 0 6px; font-weight: bold }
  .passos { font-size: 19px; line-height: 1.6; color: #3B4A66; margin: 0 0 10px }
  .url {
    font-size: 15px; color: #5B6B85; word-break: break-all;
    background: #fff; border-radius: 12px; padding: 8px 14px;
  }
  .rodape { margin-top: auto; font-size: 15px; color: #7A6A4A }
</style></head>
<body><div class="folha">
  <div id="logo" class="logo"></div>
  <h1>O Livro das<br>Descobertas</h1>
  <div class="sub">do fogo à vacina</div>
  <div id="zez" class="zez"></div>

  <div class="qr"><!--QR--></div>

  <div class="como">Aponte a câmera do celular</div>
  <p class="passos">
    Abre direto no navegador.<br>
    Não precisa baixar nada, nem criar conta.
  </p>
  <div class="url">{URL}</div>

  <div class="rodape">Feira de Ciências · 5º ano · Colégio Dom José</div>
</div>
<script src="../art.js"></script>
<script>
  document.getElementById('logo').innerHTML = ART.logo('');
  document.getElementById('zez').innerHTML  = ART.zezinho('oi');
  document.querySelectorAll('#logo svg, #zez svg')
    .forEach(s => { s.style.width = '100%'; s.style.height = 'auto'; });
</script>
</body></html>
'''

if __name__ == '__main__':
    main()
