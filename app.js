(() => {
  const $ = (s) => document.querySelector(s);

  const searchInput = $('#searchInput');
  const searchResults = $('#searchResults');
  const waveformSvg = $('#waveformSvg');
  const trackTitle = $('#trackTitle');
  const statusText = $('#statusText');
  const likeBtn = $('#likeBtn');
  const prevBtn = $('#prevBtn');
  const playBtn = $('#playBtn');
  const playIcon = $('#playIcon');
  const nextBtn = $('#nextBtn');
  const repeatBtn = $('#repeatBtn');
  const shuffleBtn = $('#shuffleBtn');
  const autoDjBtn = $('#autoDjBtn');
  const progressContainer = $('#progressContainer');
  const progressBarFill = $('#progressBarFill');
  const volumeSlider = $('#volumeSlider');
  const volumeFill = $('#volumeFill');
  const toastEl = $('#toast');
  const overlay = $('#startOverlay');

  const PLAY_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  const PAUSE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const showToast = (m) => { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(showToast._t); showToast._t = setTimeout(() => toastEl.classList.remove('show'), 3400); };
  const normPlain = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); const m = Math.floor(s / 60), r = s % 60; return m + ':' + String(r).padStart(2, '0'); };
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const randomFrom = (a) => a[Math.floor(Math.random() * a.length)];

  const REGIONAL_RE = /(ranchera|rancheras|ranchero|rancheros|norte[nñ]a|norteno|norteño|banda|corrido|corridos|mariachi|mariachis|grupero|grupera|gruperos|regional mexican|música popular|musica popular|música típica|musica tipica|tambora|pisteado|duranguense|pasito duranguense)/i;

  // ---- Catálogo de PLAYLISTS PÚBLICAS (modo sin key) ----
  const CATALOG = [
    { id: 'PL6R5uqk1vks-CB4PBzMA8RqxjrGz3ZRZK', name: 'Pop Hits 2024', tags: ['pop', 'hits', '2024', 'moderno', 'actual', 'top'] },
    { id: 'PLpmhym1EiQzcv0AIZcxuXwWfdKoHTxCDo', name: 'TOP 100 Songs 2024 (Billboard)', tags: ['pop', 'hits', '2024', 'top', 'billboard'] },
    { id: 'PLo6DdCBn-Bw7-Ew6Tpwq2IIru0HEB2tCJ', name: 'TOP 100 Hot 100 2024', tags: ['pop', 'hits', '2024', 'top'] },
    { id: 'PLEBX04z4REEZJ0HT6D7rNSI3rNmMN_BMj', name: '80s & 90s Hits', tags: ['80', '90', 'ochenta', 'noventa', 'retro', 'clasico', 'pop', 'oldschool'] },
    { id: 'PLYprZm_QUbGWWnS0eTU1t_C7EnQ6inDEb', name: 'Rock 80s & 90s', tags: ['rock', '80', '90', 'guitarra', 'ochenta', 'noventa'] },
    { id: 'PLh4FH2WMC8dGolyJOvdD4j-QtiYKkGdl9', name: 'Classic Rock 60s-90s', tags: ['rock', 'clasico', 'classic', 'guitarra', '60', '70', '80', '90'] },
    { id: 'PL_lu88CYCO4996cafpusioyDKWrmUUEwz', name: "Rock's Greatest Hits 80s", tags: ['rock', '80', 'ochenta', 'clasico'] },
    { id: 'PLDyMXoYglQpKFYAvSFL0ef67W5GGZXeP3', name: 'Top 100 Classic Rock 70s-90s', tags: ['rock', 'clasico', '70', '80', '90', 'classic'] },
    { id: 'PLGBuKfnErZlCIo5_NyCN8Z-FcdLtLKBAn', name: '90s Rock Hits', tags: ['rock', '90', 'noventa', 'grunge', 'alternative'] },
    { id: 'PLMXOI0fHliCcv5mZWrtJU3cq00_HDIZ7b', name: 'Latin Reggaeton LoFi Chill', tags: ['latin', 'latino', 'reggaeton', 'lofi', 'chill', 'relax'] },
  ];
  const byId = (id) => CATALOG.find((c) => c.id === id);

  // ---- Detección de género/época para armar radio similar (modo con key) ----
  const GENRE_MAP = {
    pop: ['pop exitos', 'pop clasico', 'pop moderno', 'pop en espanol', 'pop latino exitos'],
    rock: ['rock clasico', 'rock de los 80', 'rock de los 90', 'rock en espanol', 'pop rock 90'],
    'rock en espanol': ['rock en espanol exitos', 'rock clasico', 'pop rock'],
    salsa: ['salsa clasica', 'salsa de los 80', 'salsa romantica'],
    bachata: ['bachata romantica', 'bachata clasica', 'bachata de los 90'],
    merengue: ['merengue clasico', 'merengue de los 90'],
    cumbia: ['cumbia clasica', 'cumbia de los 90', 'cumbia sonidera'],
    reggaeton: ['reggaeton clasico', 'reggaeton vieja escuela', 'reggaeton romantico'],
    'hip hop': ['hip hop clasico', 'rap de los 90', 'hip hop vieja escuela'],
    rap: ['rap clasico', 'rap en espanol', 'rap de los 90'],
    dance: ['dance music mix', 'dance de los 90', 'eurodance'],
    lofi: ['lofi hip hop', 'lofi beats', 'lofi relajante'],
    kpop: ['kpop hits', 'kpop mix', 'kpop baladas'],
    electronica: ['electronica mix', 'electronica de los 90'],
    house: ['house music mix', 'classic house', 'deep house'],
    techno: ['techno mix', 'techno de los 90'],
    metal: ['heavy metal clasico', 'metal de los 80', 'metal de los 90'],
    punk: ['punk clasico', 'punk rock', 'punk de los 80'],
    indie: ['indie rock', 'indie pop', 'indie en espanol'],
    jazz: ['jazz clasico', 'smooth jazz', 'jazz instrumental'],
    blues: ['blues clasico', 'blues guitarra'],
    clasica: ['musica clasica', 'piano clasico', 'sinfonias'],
    soul: ['soul music classic', 'soul baladas', 'motown classic'],
    funk: ['funk clasico', 'funk soul'],
    disco: ['disco clasico', 'disco de los 80'],
    country: ['country clasico', 'country de los 90'],
    tango: ['tango clasico', 'tango instrumental'],
    flamenco: ['flamenco clasico', 'flamenco guitarra'],
    reggae: ['reggae clasico', 'reggae roots', 'reggae en espanol'],
    ska: ['ska clasico', 'ska de los 90'],
    grunge: ['grunge de los 90', 'grunge clasico'],
    balada: ['baladas clasicas', 'baladas romanticas', 'baladas de los 80'],
    romantica: ['romanticas clasicas', 'baladas romanticas', 'romanticas de los 90'],
    cristiana: ['musica cristiana', 'adoracion', 'alabanzas'],
    infantil: ['canciones infantiles', 'musica para ninos'],
  };
  const DECADE_PAIRS = [['80', 'ochenta'], ['90', 'noventa'], ['70', 'setenta'], ['2000', 'dos mil'], ['60', 'sesenta']];
  const escapeRe = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  function buildRelatedSeeds(raw) {
    const q = normPlain(raw);
    const seeds = new Set();
    seeds.add(q); seeds.add(q + ' lo mas sonado'); seeds.add(q + ' exitos'); seeds.add(q + ' clasicos');
    seeds.add('canciones como ' + q); seeds.add(q + ' mix');
    let genre = null;
    for (const g of Object.keys(GENRE_MAP)) { if (new RegExp('\\b' + escapeRe(g) + '(s|es)?\\b').test(q)) { genre = g; break; } }
    const decades = [];
    for (const [num, word] of DECADE_PAIRS) { if (new RegExp('\\b' + num + '\\b|\\b' + word + '\\b').test(q)) decades.push(num); }
    if (genre && GENRE_MAP[genre]) { GENRE_MAP[genre].forEach((s) => seeds.add(s)); for (const d of decades) { seeds.add(`${genre} de los ${d}`); seeds.add(`${genre} ${d}s exitos`); } }
    else { for (const d of decades) { seeds.add(`${q} de los ${d}`); seeds.add(`${q} ${d}s hits`); } }
    seeds.add(q + ' pop'); seeds.add('pop exitos similares a ' + q);
    const arr = Array.from(seeds);
    return [q, ...shuffle(arr.filter((s) => s !== q))].slice(0, 14);
  }

  // ---------- estado ----------
  let player = null, ready = false;
  let radioMode = 'catalog'; // 'catalog' (playlists) | 'song' (búsqueda por nombre vía YouTube)
  let autoDjOn = false, lastPlayedId = null, anchorTags = [], cycle = [], cycleIdx = 0;
  let radioIds = [], songSeeds = [], songSeedCursor = 1;
  let repeatMode = 0, shuffleOn = false, skipCount = 0, loadToken = 0, beatBpm = 120, beatOff = 0;

  // ---------- YouTube IFrame ----------
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('yt-mount', {
      height: '1', width: '1',
      playerVars: { controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3 },
      events: {
        onReady: () => { ready = true; statusText.textContent = 'Toca para iniciar la radio'; },
        onStateChange: onState,
        onError: () => { if (autoDjOn) { showToast('No disponible, siguiendo…'); if (radioMode === 'song') songRadioNext(); else loadNextSeed(); } },
      },
    });
  };
  (function loadYT() {
    if (window.YT && window.YT.Player) return window.onYouTubeIframeAPIReady();
    const t = document.createElement('script'); t.src = 'https://www.youtube.com/iframe_api'; t.onerror = () => statusText.textContent = 'No se pudo cargar YouTube (revisa tu conexión)'; document.head.appendChild(t);
  })();

  // ---------- Búsqueda web de música vía YouTube (sin API key) ----------
  // YouTube mató la búsqueda por texto en el IFrame (2020), y la API oficial pide key.
  // Para no usar key ni servidor propio, leemos los resultados de búsqueda de YouTube
  // a través de un proxy CORS público y extraemos los videoIds.
  const PROXIES = [
    (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    (u) => 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(u),
  ];
  async function fetchText(url) {
    let lastErr;
    for (const p of PROXIES) {
      try { const r = await fetch(p(url)); if (!r.ok) throw new Error('HTTP ' + r.status); const t = await r.text(); if (t && t.length > 500) return t; }
      catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('proxy no disponible');
  }
  async function scrapeYouTube(q, max) {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
    const html = await fetchText(url);
    const ids = []; const re = /"videoId":"([a-zA-Z0-9_-]{11})"/g; let m;
    while ((m = re.exec(html)) && ids.length < max + 6) { const id = m[1]; if (!ids.includes(id)) ids.push(id); }
    return ids.slice(0, max);
  }

  // ---------- radio por playlists (sin key) ----------
  function buildCycle(startId) {
    const order = []; const visited = new Set();
    let cur = startId || randomFrom(CATALOG).id;
    while (order.length < CATALOG.length) {
      order.push(cur); visited.add(cur);
      const cands = CATALOG.filter((c) => !visited.has(c.id));
      if (!cands.length) break;
      const bt = (byId(cur) || {}).tags || [];
      let best = [], bestS = -1;
      for (const c of cands) { const s = c.tags.filter((t) => bt.includes(t)).length; if (s > bestS) { bestS = s; best = [c]; } else if (s === bestS) best.push(c); }
      cur = randomFrom(bestS > 0 ? best : cands).id;
    }
    cycle = order; cycleIdx = 0;
  }
  function loadNextSeed() {
    if (!autoDjOn) return;
    if (!cycle.length || cycleIdx >= cycle.length) buildCycle(cycleIdx >= cycle.length ? null : lastPlayedId);
    const id = cycle[cycleIdx++]; lastPlayedId = id;
    const c = byId(id); anchorTags = c ? c.tags : [];
    statusText.textContent = '🤖 ' + (c ? c.name : 'Radio') + '  ·  ' + cycleIdx + '/' + cycle.length;
    player.loadPlaylist({ list: id, listType: 'playlist' });
    rebuildQueue();
  }
  function playPlaylist(id) {
    radioMode = 'catalog'; autoDjOn = true; autoDjBtn.classList.add('on'); hideOverlay();
    progressContainer.classList.add('locked');
    buildCycle(id); loadNextSeed();
    const c = byId(id); showToast('▶ ' + (c ? c.name : 'Playlist') + '  ·  Auto-DJ');
  }
  function startAutoDj() {
    radioMode = 'catalog'; autoDjOn = true; autoDjBtn.classList.add('on'); hideOverlay();
    progressContainer.classList.add('locked');
    buildCycle(null); loadNextSeed();
    showToast('🤖 Radio infinita · pop, rock, 80-90, latin…');
  }
  function stopAutoDj() { autoDjOn = false; autoDjBtn.classList.remove('on'); progressContainer.classList.remove('locked'); showToast('🤖 Radio pausada (barra habilitada)'); }

  // ---------- radio por canción (con key) ----------
  async function startSongRadio(q) {
    radioMode = 'song'; autoDjOn = true; autoDjBtn.classList.add('on'); hideOverlay();
    progressContainer.classList.add('locked');
    statusText.textContent = '🔎 Buscando: ' + q;
    try {
      const ids = await scrapeYouTube(q, 1);
      if (!ids.length) throw new Error('sin resultados');
      const songId = ids[0];
      songSeeds = buildRelatedSeeds(q); songSeedCursor = 1;
      const rel = await fetchRelatedBatch();
      radioIds = [songId, ...rel];
      statusText.textContent = '🎵 ' + q;
      player.loadPlaylist({ list: radioIds, listType: 'playlist' });
      rebuildQueue(); showToast('▶ ' + q + '  ·  radio similar');
    } catch (e) {
      const hits = matchCatalog(q);
      if (hits.length) { playPlaylist(hits[0].id); showToast('⚠ Búsqueda web caída; usando playlist de estilo'); }
      else showToast('No se pudo buscar (proxy no disponible). Prueba un estilo o pega un link.');
    }
  }
  async function fetchRelatedBatch() {
    const term = songSeeds[songSeedCursor % songSeeds.length]; songSeedCursor++;
    try { const ids = await scrapeYouTube(term, 12); return shuffle(ids); } catch (e) { return []; }
  }
  async function songRadioNext() {
    for (let k = 0; k < 5; k++) { const ids = await fetchRelatedBatch(); if (ids.length) { radioIds = ids; player.loadPlaylist({ list: radioIds, listType: 'playlist' }); rebuildQueue(); return; } }
    showToast('Sin más resultados (¿cuota de API?)');
  }

  // ---------- cola / títulos ----------
  function rebuildQueue() {
    const my = ++loadToken; let tries = 0;
    const tick = () => {
      if (my !== loadToken) return;
      let ids = []; try { ids = player.getPlaylist() || []; } catch (e) {}
      if (!ids.length && tries++ < 8) { setTimeout(tick, 400); return; }
      renderQueue(ids); updateNow();
    };
    setTimeout(tick, 600);
  }
  function resolveTitle(id, li) {
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((j) => { const t = li.querySelector('.si-title'), a = li.querySelector('.si-artist'); if (t) t.textContent = j.title || 'Pista'; if (a) a.textContent = j.author_name || ''; })
      .catch(() => {});
  }
  function renderQueue(ids) {
    searchResults.innerHTML = '';
    if (!ids.length) { searchResults.innerHTML = '<div class="search-item" style="cursor:default;color:#999">Cargando lista…</div>'; return; }
    ids.forEach((id, i) => {
      const li = document.createElement('div'); li.className = 'search-item'; li.dataset.index = i;
      li.innerHTML = `<span class="si-idx">▶</span><span style="min-width:0"><span class="si-title">Pista ${i + 1}</span> <span class="si-artist"></span></span>`;
      li.addEventListener('click', () => { try { player.playVideoAt(i); } catch (e) {} });
      searchResults.appendChild(li); resolveTitle(id, li);
    });
    highlightActive();
  }
  function highlightActive() {
    let idx = -1; try { idx = player.getPlaylistIndex(); } catch (e) {}
    [...searchResults.children].forEach((el) => el.classList.toggle('active', Number(el.dataset.index) === idx));
  }
  function updateNow() { let d; try { d = player.getVideoData(); } catch (e) {} if (d && d.video_id) { trackTitle.textContent = d.title || 'Reproduciendo…'; setBeatFor(d.video_id); } }

  // ---------- onda "rítmica" (simulada por canción) ----------
  const WAVE_N = 48; let waveLines = [], waveOn = false, waveRaf = 0;
  function setBeatFor(videoId) {
    let h = 0; for (let i = 0; i < videoId.length; i++) h = (h * 31 + videoId.charCodeAt(i)) >>> 0;
    beatBpm = 92 + (h % 60); beatOff = (h % 100) / 100;
  }
  function buildWave() {
    let s = ''; for (let i = 0; i < WAVE_N; i++) { const x = ((i + 0.5) * 400 / WAVE_N).toFixed(1); s += `<line x1="${x}" y1="50" x2="${x}" y2="50" data-x="${x}"></line>`; }
    waveformSvg.innerHTML = s; waveLines = [...waveformSvg.querySelectorAll('line')];
  }
  function waveFrame() {
    const t = performance.now() / 1000;
    for (let i = 0; i < waveLines.length; i++) {
      let amp;
      if (waveOn) {
        const beatPhase = ((t * beatBpm / 60) + beatOff * i * 0.02) % 1;
        const kick = Math.pow(1 - beatPhase, 4);
        const sub = Math.sin(t * 2.1 + i * 0.4) * 0.5 + 0.5;
        const spark = Math.abs(Math.sin(t * 9 + i * 0.9)) * 0.5;
        const level = 0.18 + 0.32 * sub + 0.30 * spark + 0.55 * kick * (0.6 + 0.4 * Math.sin(i * 0.8));
        amp = 5 + 36 * Math.min(1, level);
      } else amp = 2;
      const h = 4 + amp; const x = waveLines[i].getAttribute('data-x');
      waveLines[i].setAttribute('y1', (50 - h).toFixed(1)); waveLines[i].setAttribute('y2', (50 + h).toFixed(1));
    }
    waveRaf = requestAnimationFrame(waveFrame);
  }
  function startWave() { if (!waveOn) { waveOn = true; if (!waveRaf) waveRaf = requestAnimationFrame(waveFrame); } }
  function stopWave() { waveOn = false; }

  // ---------- eventos del reproductor ----------
  function onState(e) {
    const S = YT.PlayerState;
    if (e.data === S.PLAYING) { playIcon.innerHTML = PAUSE_SVG; startWave(); highlightActive(); updateNow(); maybeSkipRegional(); }
    else if (e.data === S.PAUSED) { playIcon.innerHTML = PLAY_SVG; stopWave(); }
    else if (e.data === S.ENDED) { playIcon.innerHTML = PLAY_SVG; stopWave(); onEnded(); }
  }
  function maybeSkipRegional() {
    if (!player) return;
    let d; try { d = player.getVideoData(); } catch (e) { return; }
    const text = ((d.title || '') + ' ' + (d.author || '')).toLowerCase();
    if (REGIONAL_RE.test(text)) { skipCount++; if (skipCount <= 60) { showToast('↪ Saltando regional: ' + (d.title || '')); try { player.nextVideo(); } catch (e) {} return; } } else skipCount = 0;
  }
  function onEnded() {
    if (repeatMode === 2) { try { player.seekTo(0); player.playVideo(); } catch (e) {} return; }
    if (autoDjOn) {
      if (radioMode === 'song') { songRadioNext(); return; }
      loadNextSeed(); return;
    }
    if (repeatMode === 1) { let pl = [], idx = -1; try { pl = player.getPlaylist() || []; idx = player.getPlaylistIndex(); } catch (e) {} if (idx >= pl.length - 1) try { player.playVideoAt(0); } catch (e) {} }
  }

  // ---------- controles ----------
  playBtn.addEventListener('click', () => { if (!player) return; if (player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo(); else player.playVideo(); });
  nextBtn.addEventListener('click', () => { try { player.nextVideo(); } catch (e) {} });
  prevBtn.addEventListener('click', () => { try { player.previousVideo(); } catch (e) {} });
  autoDjBtn.addEventListener('click', () => { if (autoDjOn) stopAutoDj(); else startAutoDj(); });
  shuffleBtn.addEventListener('click', () => { shuffleOn = !shuffleOn; shuffleBtn.classList.toggle('on', shuffleOn); showToast(shuffleOn ? '🔀 Aleatorio: activado' : '🔀 Aleatorio: desactivado'); });
  repeatBtn.addEventListener('click', () => { repeatMode = (repeatMode + 1) % 3; repeatBtn.classList.toggle('on', true); repeatBtn.title = repeatMode === 2 ? 'Repetir esta canción' : repeatMode === 1 ? 'Repetir la lista' : 'Repetir: desactivado'; if (repeatMode === 0) repeatBtn.classList.remove('on'); });
  likeBtn.addEventListener('click', () => likeBtn.classList.toggle('active'));

  function setProgress(p) { progressBarFill.style.width = (p * 100).toFixed(1) + '%'; }
  progressContainer.addEventListener('click', (e) => {
    if (autoDjOn) { showToast('🤖 Auto-DJ activo: reproducción continua (sin adelantar)'); return; }
    const r = progressContainer.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setProgress(p); if (player && player.getDuration) { const d = player.getDuration(); if (d > 0) player.seekTo(p * d, true); }
  });
  volumeSlider.addEventListener('click', (e) => {
    const r = volumeSlider.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    volumeFill.style.width = (p * 100).toFixed(0) + '%'; if (player && player.setVolume) player.setVolume(Math.round(p * 100));
  });
  const curTimeEl = $('#curTime'), durTimeEl = $('#durTime');
  setInterval(() => {
    if (!player || !player.getDuration) return;
    const d = player.getDuration(), c = player.getCurrentTime ? player.getCurrentTime() : 0;
    if (d > 0) setProgress(c / d);
    if (curTimeEl) curTimeEl.textContent = fmt(c);
    if (durTimeEl) durTimeEl.textContent = fmt(d);
  }, 500);

  // ---------- buscador ----------
  function extractPlaylistId(raw) {
    const s = (raw || '').trim();
    if (!s) return null;
    const m = s.match(/[?&]list=([^&]+)/i); if (m) return m[1];
    if (/^PL[0-9A-Za-z_-]{10,}$/.test(s) || /^RD[0-9A-Za-z_-]{10,}$/.test(s) || /^UU[0-9A-Za-z_-]{10,}$/.test(s)) return s;
    return null;
  }
  function matchCatalog(q) {
    const nq = normPlain(q);
    return CATALOG.filter((c) => normPlain(c.name).includes(nq) || c.tags.some((t) => nq.includes(normPlain(t)) || normPlain(t).includes(nq)));
  }
  function doSearch(raw) {
    if (!raw) return;
    if (!player || !ready) { showToast('Espera a que YouTube cargue…'); return; }
    const pid = extractPlaylistId(raw);
    if (pid) { radioMode = 'catalog'; searchResults.classList.remove('show'); playPlaylist(pid); return; }
    searchResults.classList.remove('show');
    startSongRadio(raw.trim());
  }
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const v = searchInput.value.trim(); if (v) doSearch(v); } });
  searchInput.addEventListener('blur', () => setTimeout(() => searchResults.classList.remove('show'), 250));
  searchInput.addEventListener('focus', () => { if (searchResults.children.length) searchResults.classList.add('show'); });

  // ---------- overlay de inicio ----------
  function hideOverlay() { if (overlay) overlay.classList.add('hidden'); }
  if (overlay) overlay.addEventListener('click', () => { if (!ready) { showToast('Cargando YouTube…'); return; } startAutoDj(); });

  // ---------- init ----------
  buildWave(); waveRaf = requestAnimationFrame(waveFrame);
  statusText.textContent = 'cargando YouTube…';
})();
