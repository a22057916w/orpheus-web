/*
  This file mirrors app.js, but adds TypeScript types so you can see
  what the same browser code looks like in TS.
*/

type SpotifyImage = {
  url: string;
};

type SpotifyArtist = {
  name: string;
};

type SpotifyAlbum = {
  name: string;
  images?: SpotifyImage[];
};

type SpotifyTrack = {
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
};

type CurrentlyPlayingResponse = {
  item: SpotifyTrack | null;
  progress_ms?: number;
  is_playing: boolean;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type LyricLine = {
  startMs: number;
  text: string;
  translation: string;
};

function qs<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

const scopes: string[] = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state'
];

const lyrics: LyricLine[] = [
  { startMs: 0, text: 'Intro: 等待 Spotify 回報播放進度。', translation: 'This is a local test lyric line.' },
  { startMs: 10000, text: '第一句：如果這行亮起，代表時間同步邏輯可行。', translation: 'If this line is highlighted, sync works.' },
  { startMs: 20000, text: '第二句：之後可以換成真正的逐行歌詞。', translation: 'Later, replace this with real synced lyrics.' },
  { startMs: 30000, text: '第三句：翻譯也可以跟同一個時間軸顯示。', translation: 'Translations can share the same timeline.' },
  { startMs: 45000, text: '第四句：Phase 0 只驗證核心可行性。', translation: 'Phase 0 only proves the core idea.' }
];

const elements = {
  redirectUri: qs<HTMLElement>('#redirectUri'),
  clientId: qs<HTMLInputElement>('#clientId'),
  saveClientId: qs<HTMLButtonElement>('#saveClientId'),
  login: qs<HTMLButtonElement>('#login'),
  logout: qs<HTMLButtonElement>('#logout'),
  refresh: qs<HTMLButtonElement>('#refresh'),
  play: qs<HTMLButtonElement>('#play'),
  pause: qs<HTMLButtonElement>('#pause'),
  previous: qs<HTMLButtonElement>('#previous'),
  next: qs<HTMLButtonElement>('#next'),
  status: qs<HTMLElement>('#status'),
  artwork: qs<HTMLImageElement>('#artwork'),
  trackTitle: qs<HTMLElement>('#trackTitle'),
  trackMeta: qs<HTMLElement>('#trackMeta'),
  progressBar: qs<HTMLElement>('#progressBar'),
  progressText: qs<HTMLElement>('#progressText'),
  lyrics: qs<HTMLOListElement>('#lyrics')
};

const redirectUri = `${location.origin}${location.pathname}`;

let currentTrack: SpotifyTrack | null = null;
let currentProgressMs = 0;
let durationMs = 0;
let isPlaying = false;
let lastSyncAt = Date.now();

async function init(): Promise<void> {
  const code = new URLSearchParams(location.search).get('code');
  if (code) {
    await exchangeCodeForToken(code);
    history.replaceState({}, document.title, location.pathname);
  }

  if (getAccessToken()) {
    await refreshCurrentlyPlaying();
  }
}

async function login(): Promise<void> {
  const clientId = elements.clientId.value.trim();
  if (!clientId) {
    setStatus('請先輸入 Spotify Client ID。');
    return;
  }

  localStorage.setItem('spotify_client_id', clientId);

  const verifier = generateRandomString(64);
  const challenge = await sha256Base64Url(verifier);
  sessionStorage.setItem('spotify_code_verifier', verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: redirectUri
  });

  location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code: string): Promise<void> {
  const clientId = localStorage.getItem('spotify_client_id');
  const verifier = sessionStorage.getItem('spotify_code_verifier');

  if (!clientId || !verifier) {
    setStatus('缺少 Client ID 或 code verifier，請重新登入。');
    return;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const data = (await response.json()) as TokenResponse | unknown;
  if (!response.ok) {
    setStatus(`換 token 失敗：${JSON.stringify(data, null, 2)}`);
    return;
  }

  const tokenData = data as TokenResponse;
  const expiresAt = Date.now() + tokenData.expires_in * 1000;
  localStorage.setItem('spotify_access_token', tokenData.access_token);
  localStorage.setItem('spotify_refresh_token', tokenData.refresh_token ?? '');
  localStorage.setItem('spotify_expires_at', String(expiresAt));
  setStatus('登入成功，準備讀取目前播放。');
}

async function refreshCurrentlyPlaying(): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    setStatus('尚未登入，或 token 已過期。請重新登入。');
    return;
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 204) {
    setStatus('Spotify 目前沒有播放中的歌曲。請先在 Spotify 播一首歌。');
    return;
  }

  const data = (await response.json()) as CurrentlyPlayingResponse | unknown;
  if (!response.ok) {
    setStatus(`讀取失敗：${JSON.stringify(data, null, 2)}`);
    return;
  }

  const playingData = data as CurrentlyPlayingResponse;
  currentTrack = playingData.item;
  currentProgressMs = playingData.progress_ms ?? 0;
  durationMs = currentTrack?.duration_ms ?? 0;
  isPlaying = playingData.is_playing;
  lastSyncAt = Date.now();

  renderTrack();
  setStatus(JSON.stringify({
    isPlaying,
    progressMs: currentProgressMs,
    track: currentTrack?.name,
    artists: currentTrack?.artists?.map((artist) => artist.name)
  }, null, 2));
}

async function playerCommand(method: 'PUT' | 'POST', url: string): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    setStatus('尚未登入，或 token 已過期。請重新登入。');
    return;
  }

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 204) {
    setStatus('Spotify 已接受控制指令。');
    await refreshCurrentlyPlaying();
    return;
  }

  const text = await response.text();
  setStatus(`控制指令失敗：HTTP ${response.status}\n${text}`);
}

function getAccessToken(): string | null {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = Number(localStorage.getItem('spotify_expires_at') ?? 0);
  if (!token || Date.now() > expiresAt) {
    return null;
  }
  return token;
}

function logout(): void {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_expires_at');
  sessionStorage.removeItem('spotify_code_verifier');
  currentTrack = null;
  currentProgressMs = 0;
  durationMs = 0;
  isPlaying = false;
  renderTrack();
  setStatus('已清除登入資料。');
}

function tick(): void {
  if (isPlaying) {
    currentProgressMs += Date.now() - lastSyncAt;
    lastSyncAt = Date.now();
  } else {
    lastSyncAt = Date.now();
  }

  renderProgress();
  renderLyrics(currentProgressMs);
}

function renderTrack(): void {
  if (!currentTrack) {
    elements.trackTitle.textContent = '尚未讀取歌曲';
    elements.trackMeta.textContent = '登入後，先在 Spotify 任一裝置播放一首歌，再按讀取。';
    elements.artwork.removeAttribute('src');
    renderProgress();
    return;
  }

  elements.trackTitle.textContent = currentTrack.name;
  elements.trackMeta.textContent = `${currentTrack.artists.map((artist) => artist.name).join(', ')} · ${currentTrack.album.name}`;
  elements.artwork.src = currentTrack.album.images?.[0]?.url ?? '';
  renderProgress();
}

function renderProgress(): void {
  const percent = durationMs > 0 ? Math.min(100, (currentProgressMs / durationMs) * 100) : 0;
  elements.progressBar.style.width = `${percent}%`;
  elements.progressText.textContent = `${formatTime(currentProgressMs)} / ${formatTime(durationMs)}`;
}

function renderLyrics(progressMs: number): void {
  elements.lyrics.innerHTML = '';

  const activeIndex = lyrics.findIndex((line, index) => {
    const next = lyrics[index + 1];
    return progressMs >= line.startMs && (!next || progressMs < next.startMs);
  });

  lyrics.forEach((line, index) => {
    const item = document.createElement('li');
    if (index === activeIndex) item.classList.add('active');
    item.innerHTML = `<strong>${line.text}</strong><br><span>${line.translation}</span>`;
    elements.lyrics.appendChild(item);
  });
}

function setStatus(message: string): void {
  elements.status.textContent = message;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((value) => possible[value % possible.length]).join('');
}

async function sha256Base64Url(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function main(): Promise<void> {
  elements.redirectUri.textContent = redirectUri;
  elements.clientId.value = localStorage.getItem('spotify_client_id') ?? '';
  renderLyrics(0);

  elements.saveClientId.addEventListener('click', () => {
    localStorage.setItem('spotify_client_id', elements.clientId.value.trim());
    setStatus('Client ID 已儲存。');
  });

  elements.login.addEventListener('click', login);
  elements.logout.addEventListener('click', logout);
  elements.refresh.addEventListener('click', refreshCurrentlyPlaying);
  elements.play.addEventListener('click', () => playerCommand('PUT', 'https://api.spotify.com/v1/me/player/play'));
  elements.pause.addEventListener('click', () => playerCommand('PUT', 'https://api.spotify.com/v1/me/player/pause'));
  elements.previous.addEventListener('click', () => playerCommand('POST', 'https://api.spotify.com/v1/me/player/previous'));
  elements.next.addEventListener('click', () => playerCommand('POST', 'https://api.spotify.com/v1/me/player/next'));

  window.setInterval(tick, 500);
  await init();
}

void main();
