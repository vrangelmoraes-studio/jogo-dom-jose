# Como ligar a planilha que recebe os resultados

Leva uns 3 minutos. Você não precisa entender nada do código — só colar.

O jogo, sozinho, não guarda nada em lugar nenhum. Como as crianças jogam no
próprio celular, o resultado morre no aparelho delas. Esta planilha é o caderno
onde os números vão parar; o código é só o porteiro que escreve a linha.

---

## 1. Crie a planilha

Abra o navegador e digite **`sheets.new`**. Nasce uma planilha em branco.
Dê um nome no alto, por exemplo *Feira de Ciências*.

## 2. Abra o editor

No menu de cima: **Extensões → Apps Script**.

Abre uma aba nova com cara de programa. É normal.

> **Atenção:** precisa ser por aqui, de dentro da planilha. Se você abrir o
> Apps Script sozinho, ele não sabe em qual planilha escrever.

## 3. Cole o código — este é o passo que costuma dar errado

Na aba do Apps Script, clique dentro da área de código, aperte **Ctrl+A**
(seleciona tudo) e depois **Delete**. A área tem que ficar **completamente
vazia**.

Agora copie o código. A forma mais segura é pelo GitHub, que tem um botão de
copiar e não deixa faltar pedaço:

**https://github.com/vrangelmoraes-studio/jogo-dom-jose/blob/main/planilha/codigo-para-colar.gs**

Nessa página, procure o ícone de **copiar** no canto superior direito do
código. Ele copia o arquivo inteiro, exato.

Volte ao Apps Script e cole com **Ctrl+V**.

Confira uma coisa só: **a linha 1 tem que começar com duas barras**, assim:

```
// O Livro das Descobertas — recebe as partidas na planilha.
```

Se a linha 1 começar com qualquer outra coisa, a colagem veio incompleta.
Apague tudo e cole de novo.

## 4. Salve — antes de qualquer outra coisa

Aperte **Ctrl+S**, ou clique no ícone de disquete.

No alto da tela, o aviso *"Mudanças não salvas"* tem que sumir. **Enquanto ele
estiver lá, o passo seguinte vai falhar.**

## 5. Publique

Botão **Implantar** (canto superior direito) → **Nova implantação**.

Na janelinha que abrir:

- clique no ícone de **engrenagem** e escolha **Aplicativo da Web**;
- **Executar como:** Eu;
- **Quem pode acessar:** **Qualquer pessoa**;
- **Implantar**.

## 6. Autorize

O Google vai pedir permissão e mostrar um aviso de que o app **não foi
verificado**. Isso assusta, mas não é problema: significa apenas que o Google
nunca analisou esse programa — que é seu, e escreve na sua planilha.

Clique em **Avançado** (bem embaixo) e depois em **Acessar (não seguro)**.

## 7. Copie o endereço

No fim aparece um endereço comprido terminado em **`/exec`**.

**Copie e mande para mim.** Eu ligo o jogo nele e faço uma partida de teste
para confirmar que a linha aparece na planilha.

---

## Se der errado

| O que apareceu | O que é |
|---|---|
| `SyntaxError` / traço vermelho | A colagem veio incompleta. Volte ao passo 3. |
| "Ocorreu um erro. Feche a caixa de diálogo" | Quase sempre é o código com erro **ou o arquivo não salvo**. Passos 3 e 4. |
| "Este app não foi verificado" | Não é erro. Passo 6. |
| "Erro 403" / "administrador bloqueou" | A conta é gerenciada por empresa ou colégio. Refaça tudo numa conta pessoal `@gmail.com`. |
| "Você não tem permissão" | O Apps Script foi aberto solto. Volte ao passo 2. |

Se tiver **mais de uma conta do Google logada** no navegador, é fácil a
planilha nascer numa conta e a autorização acontecer em outra. O jeito mais
rápido de descartar isso é fazer tudo numa **janela anônima**, logado em uma
conta só.

---

## O que vai ser guardado

Uma linha por partida, com: quando, um código sorteado da partida, se foi
começo ou fim, fase alcançada, acertos, total de perguntas, percentual,
páginas achadas, minutos, medalha e o gabarito (um `1` ou `0` por pergunta).

**Nome da criança não sai do aparelho dela.** Nem personagem, nem tom de pele,
nem nada que permita saber quem jogou.

Depois de pronto, abrir aquele mesmo endereço `/exec` no navegador mostra o
resumo da turma: quantos jogaram, quantos chegaram ao fim, acerto médio, tempo
médio e qual pergunta a turma mais errou.
