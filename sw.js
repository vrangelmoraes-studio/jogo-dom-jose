/* Service worker: guarda o jogo no aparelho na primeira visita.
   Depois disso ele abre sem internet — importante porque wi-fi de escola
   costuma cair justo na hora da apresentação.

   Ao mudar qualquer arquivo do jogo, SOBE O NÚMERO do CACHE abaixo.
   Sem isso o aparelho continua servindo a versão velha. */
const CACHE = 'descobertas-v8';

const ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './art.js',
  './som.js',
  './estatistica.js',
  './voz.js',
  './minijogos.js',
  './game.js',
  './vendor/phaser.min.js',
  './sons/toque.wav', './sons/coleta.wav', './sons/pagina.wav',
  './sons/certo.wav', './sons/errado.wav', './sons/fogo.wav',
  './sons/chama.wav', './sons/vento.wav', './sons/germe.wav',
  './sons/vacina.wav', './sons/vitoria.wav', './sons/medalha.wav',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(ARQUIVOS);
      // Guarda tambem a voz gravada do Zezinho. Sem isto o jogo abriria
      // offline mas mudo, porque cada MP3 so entraria no cache depois de
      // tocar uma vez — e na feira o wi-fi cai justo na hora errada.
      try {
        const r = await fetch('./vozes/lista.json');
        if (r.ok) {
          const lista = await r.json();
          const urls = Object.keys(lista).map(k => './vozes/' + k + '.mp3');
          urls.push('./vozes/lista.json');
          // .catch por arquivo: um MP3 que falte nao pode derrubar a instalacao
          await Promise.all(urls.map(u => c.add(u).catch(() => {})));
        }
      } catch (err) { }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Rede primeiro (para pegar correção nova), cache como rede de segurança.
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
