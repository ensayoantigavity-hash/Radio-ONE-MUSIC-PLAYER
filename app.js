// public/app.js - Reemplaza por completo tu archivo actual
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const socket = io();
const isEscuchar = location.pathname === '/escuchar';

// ===================== PANTALLA PRINCIPAL / (EMISOR) =====================
if (!isEscuchar) {
  const audio = document.getElementById('audio');
  const input = document.getElementById('q');
  const btnBuscar = document.getElementById('btn-buscar');

  // Registra como DJ al conectar
  socket.emit('registrar-dj');

  // Web Audio -> MediaRecorder para emitir flujo real
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  const dest = ctx.createMediaStreamDestination();
  src.connect(dest);
  src.connect(ctx.destination);
  let recorder = null;

  function startEmitir(){
    if(ctx.state === 'suspended') ctx.resume();
    if(recorder && recorder.state === 'recording') return;
    recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 });
    recorder.ondataavailable = e => {
      if(e.data.size > 0) e.data.arrayBuffer().then(b => socket.emit('stream-desde-dj', b));
    };
    recorder.start(100); // chunk cada 100ms
  }
  function stopEmitir(){ try{ recorder?.stop(); }catch{} recorder=null; }

  // Cuando busque y reproduzca con éxito, captura y emite constante
  // Hook a tu play() existente - añade estas 2 líneas dentro de tu audio 'playing':
  audio.addEventListener('playing', () => {
    socket.emit('track-played', { id: window.currentId, title: window.currentTitle });
    startEmitir();
  });
  audio.addEventListener('pause', stopEmitir);
  audio.addEventListener('ended', stopEmitir);

  // Buscador sigue igual pero ya no necesita fallback, solo encola en el DJ
  // Tu doSearch() existente queda intacto
}

// ===================== PANTALLA OYENTES /escuchar (RECEPTOR) =====================
if (isEscuchar) {
  const audio = document.getElementById('audio') || new Audio();
  const btnPlay = document.getElementById('btn-play');
  const statusEl = document.getElementById('status');
  let stallTimer = null;

  function setStatus(m){ if(statusEl) statusEl.textContent = m; }

  function connectStream(){
    audio.src = '/radio/stream?_t=' + Date.now();
    audio.load();
    audio.play().catch(()=>{});
    setStatus('Sintonizando la estación...');
  }

  // Botón Play apunta directo a /radio/stream - NO busca en YouTube
  if(btnPlay){
    btnPlay.addEventListener('click', connectStream);
  }

  function scheduleReconnect(){
    clearTimeout(stallTimer);
    stallTimer = setTimeout(()=>{
      setStatus('Esperando al DJ... reconectando');
      try{ audio.pause(); }catch{}
      audio.removeAttribute('src'); audio.load();
      setTimeout(connectStream, 300);
    }, 3000); // cada 3s
  }

  audio.addEventListener('stalled', ()=>{ setStatus('Sintonizando...'); scheduleReconnect(); });
  audio.addEventListener('waiting', ()=>{ setStatus('Sintonizando...'); scheduleReconnect(); });
  audio.addEventListener('error', scheduleReconnect);
  audio.addEventListener('playing', ()=>{ clearTimeout(stallTimer); setStatus(''); });
  audio.addEventListener('canplay', ()=> clearTimeout(stallTimer));

  // Autoplay al entrar
  connectStream();
}
