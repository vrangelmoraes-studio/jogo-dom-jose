# O Livro das Descobertas, do fogo à vacina

Jogo educativo para a **Feira de Ciências do Colégio Dom José** — 5º ano, Fundamental I.
Roda no navegador do celular, do tablet ou do computador. Sem loja de aplicativo,
sem instalar nada, sem conta, sem internet depois da primeira vez.

Duração: **15 a 20 minutos**. Personagem de uniforme do colégio, guiado pelo **Zezinho**,
a arara mascote.

---

## Como abrir no seu computador para testar

Abrir o `index.html` com dois cliques **funciona**, mas o modo offline não liga
(isso é regra do navegador, não defeito do jogo). Para testar igual vai ficar na feira,
abra o PowerShell **nesta pasta** e rode:

```powershell
python -X utf8 -m http.server 8777
```

Depois abra no navegador: <http://127.0.0.1:8777>
Para parar o servidor, aperte `Ctrl + C` na janela do PowerShell.

---

## O jogo está no ar

**https://vrangelmoraes-studio.github.io/jogo-dom-jose/**

É esse endereço que vai no QR code. Ele não muda.

### O QR code e o cartaz

Já estão prontos na pasta `qr-code/`:

| Arquivo | Para quê |
|---|---|
| `cartaz.pdf` | **O que você imprime.** A4, pronto, com logo, Zezinho, QR e o endereço escrito. |
| `cartaz.png` | O mesmo cartaz como imagem, para colar em slide ou mandar por WhatsApp. |
| `qrcode.svg` | Só o código, em vetor. É o que a gráfica prefere — não perde nitidez em nenhum tamanho. |
| `qrcode.png` | Só o código, como imagem. Serve para Word e PowerPoint. |
| `cartaz.html` | A fonte do cartaz, caso queira mudar um texto. |

Para refazer (se o endereço mudar, por exemplo): `python -X utf8 gerar_qrcode.py`

Duas coisas que fazem um QR não funcionar e que **erram calado** — o código parece
perfeito e a câmera simplesmente não engata. Estão resolvidas, mas anote caso mexa nele:

1. **Margem branca de 4 módulos** em volta. É o mínimo da especificação.
2. **`viewBox` no SVG.** Sem ele, mudar o tamanho pelo CSS não redimensiona: **recorta**.
   O primeiro cartaz saiu com o código cortado, parecendo inteiro a olho nu.

O código usa correção de erro **nível H**: continua legível com até 30% da área suja,
amassada ou coberta. Numa feira, o cartaz vai passar por muita mão.

---

## Em quais navegadores funciona

Testado rodando o jogo nos três motores que existem, e nos dois perfis de celular:

| Onde | Resultado |
|---|---|
| **Chromium** (Chrome, Edge, Samsung Internet, Opera) | tela, Phaser, som e toque — tudo |
| **WebKit** (Safari do iPhone e do iPad) | tela, Phaser e toque — tudo |
| **Firefox** | tela, Phaser e toque — tudo |
| **iPhone 13** (Safari, toque real) | tudo, com toque de dedo |
| **Galaxy S9+** (Chrome Android) | tudo |

Zero erro de JavaScript em todos.

**No iPhone, "Adicionar à tela inicial" só funciona pelo Safari** — o Chrome do iPhone não
instala site como aplicativo. Pelo QR code abre normalmente em qualquer um; só a instalação
com ícone próprio é exclusiva do Safari.

**O som só começa depois do primeiro toque na tela.** É regra de todo navegador de celular,
não é defeito: o jogo destrava o áudio quando a criança toca em JOGAR.

---

## Como colocar no ar para a feira (grátis)

O jogo é só um punhado de arquivos soltos — qualquer hospedagem de site estático serve.
O caminho mais rápido, sem precisar entender nada de servidor:

1. Entre em <https://app.netlify.com/drop>
2. **Arraste esta pasta inteira** para a área indicada na página.
3. Em poucos segundos aparece um endereço tipo `https://algo-aleatorio.netlify.app`.
4. Cole esse endereço em qualquer gerador de QR code (procure "gerar QR code" no Google).
5. Imprima o QR code grande no cartaz da feira. A criança aponta a câmera e joga.

Alternativa: GitHub Pages, se preferir versionar. O resultado é o mesmo.

**Importante:** a hospedagem precisa ser `https`. Só com `https` o navegador aceita
guardar o jogo no aparelho para funcionar sem internet.

### Instalar na tela inicial (opcional)

Uma vez aberto, o navegador oferece "Adicionar à tela inicial". Aí o jogo ganha ícone
próprio e abre em tela cheia, sem barra de endereço — parece um aplicativo de verdade.
Funciona em Android e em iPhone.

---

## O que tem dentro da pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página. É por aqui que tudo começa. |
| `style.css` | A aparência: cores do colégio, botões redondos, tamanho de letra. |
| `art.js` | **Todos os desenhos**, feitos em código. Zezinho, avatares, vaca, germes, medalha. |
| `game.js` | O jogo: fases, perguntas, textos, contagem de acertos. |
| `voz.js` | A voz do Zezinho, o texto que aparece junto com ela e a tranca da fala. |
| `som.js` | Toca os efeitos sonoros. Se um arquivo faltar, cai num bipe sintetizado. |
| `minijogos.js` | Os três minijogos em Phaser: coleta, fogo e defesa do corpo. |
| `vendor/phaser.min.js` | O motor de jogo (1,0 MB). Fica na pasta, não vem da internet. |
| `vozes/` | As 61 falas gravadas (2,1 MB) e `lista.json`, o índice com a duração de cada uma. |
| `sons/` | Os 12 efeitos sonoros (249 KB). |
| `gerar_vozes.py` | Regrava as vozes. Só é preciso rodar quando um texto mudar. |
| `gerar_sons.py` | Recria os efeitos sonoros. Só se quiser mudar algum som. |
| `manifest.json` | Nome e ícone quando instalado na tela inicial. |
| `sw.js` | O que faz o jogo abrir sem internet. |
| `icon-192.png`, `icon-512.png` | Ícone do aplicativo. |
| `escolher-voz.html`, `amostras-de-voz/` | Página para comparar vozes. Não faz parte do jogo. |

Não existe nenhuma imagem de personagem: **tudo é desenhado por código**, e a mesma arte
serve o HTML e o motor de jogo. Total: cerca de **3,6 MB** (1,0 do motor, 2,1 das vozes,
0,25 dos efeitos, o resto é o jogo). Depois da primeira vez, abre sem internet nenhuma.

---

## Por que só três telas usam o motor de jogo

O jogo tem 15 telas. **Três são de fato jogo** — coletar gravetos, acender o fogo e
defender o corpo — e essas rodam em **Phaser**, com sprite, partícula e tween de verdade.

As outras 12 são cartão de texto, lista de opções, o campo onde a criança digita o nome,
telas roláveis e o relatório do professor que precisa imprimir. Essas ficaram em HTML de
propósito: o Phaser desenha em canvas, e canvas é ruim justamente em digitação, quebra de
linha, rolagem e impressão. Cada ferramenta no que ela faz bem.

**Se o `vendor/phaser.min.js` sumir ou falhar, o jogo não quebra:** ele percebe e volta
sozinho para a versão em HTML dos três minijogos. Nenhuma tela depende do motor para
existir. É seguro contra o pior caso no dia da feira.

---

## A voz do Zezinho

Criança não lê caixa de diálogo — no primeiro teste elas saíam pulando o texto. Por isso
**tudo que o Zezinho fala é falado de verdade**, e o botão de avançar só destrava quando
a fala termina. Enquanto ele fala, o bico mexe e as palavras vão acendendo no ritmo da
voz, com uma barrinha mostrando quanto falta.

A voz é a **Francisca**, neural, gerada pelo `edge-tts` (Microsoft, grátis, sem cadastro),
com o tom um pouco mais agudo e acelerado para soar como uma arara. Fica igual em todo
aparelho: celular velho, tablet da escola, iPhone.

**São 61 falas, 6 minutos e 24 segundos de tranca no total** — num jogo que dura uns 20
minutos. Se na feira isso pesar, dá para liberar o botão na metade da fala; é uma linha
em `voz.js`.

O Zezinho **não fala o nome da criança**, porque o áudio é gravado antes de saber quem
vai jogar. O nome continua escrito na tela.

### Se você mudar algum texto

Cada arquivo de áudio é nomeado a partir do próprio texto. Mudou a frase, muda o nome,
o jogo não acha o arquivo e **cai sozinho na voz do navegador** — soa pior, mas nada
quebra e nada fica mudo. Para regravar:

```powershell
# numa janela
python -X utf8 -m http.server 8777
# noutra janela
python -X utf8 gerar_vozes.py
```

Ele joga o jogo inteiro sozinho, anota todas as falas (inclusive as que só aparecem
quando a criança erra), regrava e atualiza o índice. Para trocar a voz, mude `VOZ`,
`TOM` e `RITMO` no começo do arquivo.

Tem um botão de som no canto da tela: com o som desligado, a tranca passa a durar o
tempo de **leitura**, que é bem menor.

---

## Os efeitos sonoros

São 12 efeitos em `sons/*.wav` — coleta, página achada, acerto, erro, fricção, chama,
vento, germe estourando, vacina, vitória e medalha. Todos **sintetizados** por
`gerar_sons.py` aqui na máquina, não baixados de banco de som: num material que o colégio
vai distribuir, não vale a pena ter dúvida de licença. Somam 249 KB.

Uma regra de tom que atravessa todos: **o som de erro nunca é áspero.** O jogo inteiro é
não punitivo, e um "errou!" estridente contradiz isso em meio segundo. O erro é um par de
notas graves descendo, macias.

Se algum arquivo faltar, o efeito cai num bipe sintetizado na hora pelo navegador — o
jogo nunca fica sem resposta sonora.

---

## Sobre o texto do jogo

Todo o texto trata a criança por **você**, e os imperativos seguem essa forma
(*guarde*, *olhe*, *pense*, *segure*) — não *guarda*, *olha*, *pensa*. Misturar as duas
formas na mesma tela é o erro que mais salta aos olhos de um professor. Se for escrever
frase nova, siga a mesma forma.

A única exceção é a **fala dos personagens**: Bia, Téo e Nina falam como criança fala,
e ali o coloquial é proposital.

---

## Como mexer nos textos e nas perguntas

Tudo está no `game.js`, em português, e dá para editar em qualquer editor de texto.

- **Perguntas dos quizzes**: procure `fase1_quiz`, `fase2_quiz`, `fase3_quizFinal`.
  Em cada pergunta, a **primeira opção da lista é sempre a certa** — o jogo embaralha
  a ordem na tela sozinho. Não precisa marcar qual é a correta.
- **Curiosidades do final**: procure `CURIOSIDADES`, no fim do arquivo.
- **Falas do Zezinho**: procure `fala(` dentro de cada fase.
- **Nomes do botão "sortear nome"**: procure `NOMES_SORTEIO`.

> Ao mudar qualquer arquivo, **suba o número em `sw.js`** (`descobertas-v3` → `descobertas-v4`).
> Sem isso, quem já abriu o jogo continua vendo a versão antiga, porque o aparelho
> guardou a anterior. E se mexeu em texto falado, rode também o `gerar_vozes.py`.

---

## As três fases

| Fase | O que a criança **faz** | O que ela aprende fazendo |
|---|---|---|
| 1 — O Fogo | Junta gravetos, acende por fricção, escolhe onde usar o fogo | Lenha molhada não queima; o fogo cozinha, aquece e protege |
| 2 — A Vacina | Observa quem adoeceu na fazenda, monta a vacina, defende o corpo | Jenner descobriu observando; vacina é **treino antes**, não remédio depois |
| 3 — Os Micróbios | Ferve um frasco e deixa o outro como está, compara, convence colegas | Micróbio vem de fora e o calor mata — o mesmo calor do fogo da Fase 1 |

Espalhadas pelos cenários há **9 páginas perdidas do livro** (3 por fase). Cada uma
destrava uma curiosidade real no final. É o que faz a criança querer jogar de novo.

---

## Decisões de projeto (por que está assim, e não do jeito óbvio)

Estas escolhas foram feitas de propósito. Se alguém for mexer, vale saber o porquê antes.

1. **Só dois comandos: tocar e escolher.** O roteiro original tinha sete mecânicas
   diferentes para 20 minutos de jogo. Criança de 10 anos gasta quase um minuto
   entendendo cada controle novo — sete controles novos viram meia hora de tutorial.
   Com dois comandos, ela para de reaprender botão e presta atenção no conteúdo.

2. **A lição está na mecânica, nunca só no texto.** Criança pula diálogo. Todo.
   Isso foi **confirmado no teste com as crianças** — foi de lá que veio a voz e a tranca.
   Por isso a Fase 2 tem duas rodadas: na primeira, **sem vacina, tocar nos germes não
   funciona** — o corpo não reconhece o invasor. A frustração de 20 segundos ensina mais
   do que qualquer parágrafo explicando. Depois de vacinar, funciona.
   Se você apagar todo o texto do jogo, as lições ainda chegam.

3. **Não existe final de derrota.** A versão original tinha um segundo final,
   "Ainda Sonhando", para quem acertasse pouco. Numa sala de aula isso é público:
   quem tira o final ruim é apontado na frente da turma. Aqui **todo mundo** chega a
   Guardião do Conhecimento; o que varia é a medalha (bronze, prata, ouro) e quantas
   curiosidades foram destravadas. O incentivo a jogar de novo continua igual,
   sem criar perdedor.

4. **A persuasão é com colegas fictícios, não com a família.** O roteiro pedia que a
   criança convencesse a própria família a se vacinar. Isso põe a criança no meio de uma
   discussão de adulto, e a bronca de um pai insatisfeito sobra para o colégio, não para
   quem fez o jogo. Os três colegas (Bia, Téo e Nina) são personagens do jogo.
   O conteúdo científico está inteiro; o atrito desapareceu.
   As respostas certas **também não mentem** — a do Téo admite que a picada dói, e compara
   com o tamanho da dor que ela evita.

5. **Tela "quem está jogando".** Numa feira, muitas crianças usam o mesmo tablet.
   Sem essa tela, a segunda criança cairia dentro do jogo da primeira, porque o
   navegador guarda o progresso por aparelho, não por pessoa.

6. **Nada sai do aparelho.** Sem servidor, sem estatística, sem nuvem, sem formulário.
   O nome e o desempenho ficam no navegador daquele aparelho e só. O "modo professor" é
   uma tela para ler e imprimir, nada é enviado a lugar nenhum. Isso não é preguiça:
   é o que mantém dado de criança fora de qualquer discussão de privacidade.
   **Se algum dia quiser ver o resultado da turma toda, isso muda** — passa a ser
   tratamento de dado de menor de idade e exige autorização dos responsáveis.

---

## Modo professor

Na tela final, botão **"👩‍🏫 Professor"**. Mostra nome, acertos por etapa, pergunta por
pergunta, páginas encontradas e duração — com botão de imprimir, para o mural ou para
discussão em grupo. Traz também uma pergunta de fechamento para a turma.

---

## Pendências

- **Zezinho** está redesenhado em código a partir da imagem de referência do colégio.
  Se o colégio mandar a arte oficial em PNG com fundo transparente, dá para trocar —
  mas o desenho em código tem uma vantagem: ele muda de pose (`oi`, `feliz`, `pensa`,
  `aponta`) sem precisar de um arquivo novo para cada expressão.
- **Testar com criança de verdade** antes da feira. Cinco crianças, 20 minutos,
  ninguém ajudando. Isso revela em uma tarde o que ninguém adivinha na mesa.
  Preste atenção em uma coisa só: **onde ela travou sem entender o que fazer.**
- **Som** é feito por notas geradas na hora, sem arquivo. Não há trilha sonora.
  Se quiser música, é preciso um MP3 — e aí o jogo deixa de pesar poucos KB.

---

*Colégio Dom José · Feira de Ciências · 5º ano, Fundamental I*
