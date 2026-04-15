# Spotify Spike Reading Guide

這份文件是 `spikes/spotify-oauth-currently-playing` 的導讀。

目標不是背語法，而是理解三個檔案如何一起讓網頁動起來：

- `index.html`：頁面的結構
- `styles.css`：頁面的外觀
- `app.js`：頁面的行為

你可以先讀這份文件，再回去看三個原始檔。

## 1. 瀏覽器如何執行這個頁面

當你打開：

```text
http://127.0.0.1:5173/
```

瀏覽器大致會照這個順序工作：

1. 向本機 server 要 `index.html`。
2. 從上到下解析 HTML。
3. 看到 `<link rel="stylesheet" href="styles.css" />`，去下載 CSS。
4. 建立 DOM，也就是 HTML 元素樹。
5. 套用 CSS，決定每個元素的顏色、大小、位置。
6. 讀到 HTML 最後的 `<script src="app.js"></script>`。
7. 下載並執行 JavaScript。
8. JavaScript 找到 HTML 裡的元素，綁定按鈕事件，更新畫面。

簡化成一條線：

```text
index.html -> styles.css -> app.js -> 使用者互動 -> app.js 更新 HTML
```

## 2. 三個檔案各自負責什麼

### index.html：結構

HTML 負責說明頁面上有哪些東西。

例如：

```html
<button id="login">登入 Spotify</button>
```

這只代表頁面上有一顆按鈕。它本身還不知道點下去要做什麼。

HTML 裡最重要的是兩種屬性：

- `id`：通常給 JavaScript 找元素用。
- `class`：通常給 CSS 套樣式用。

例如：

```html
<section class="panel">
  <code id="redirectUri"></code>
</section>
```

意思是：

- `.panel` 讓 CSS 把這個區塊畫成卡片樣式。
- `#redirectUri` 讓 JavaScript 找到這個位置，填入 Redirect URI。

### styles.css：外觀

CSS 負責讓 HTML 看起來像一個介面。

例如：

```css
.panel {
  border: 1px solid rgba(238, 242, 239, 0.18);
  border-radius: 8px;
  padding: 20px;
}
```

意思是：所有 `class="panel"` 的元素，都有邊框、圓角和內距。

CSS 的基本概念是：

```text
selector {
  property: value;
}
```

例如：

```css
button {
  background: #66d19e;
}
```

- `button` 是 selector，選到所有 `<button>`。
- `background` 是 property。
- `#66d19e` 是 value。

### app.js：行為

JavaScript 負責讓頁面動起來。

例如：

```js
elements.login.addEventListener('click', login);
```

意思是：當使用者點登入按鈕，就執行 `login()` 函式。

JavaScript 在這個 spike 裡負責：

- 讀取 Client ID。
- 導向 Spotify 登入頁。
- 從 Spotify callback 取得 code。
- 換取 access token。
- 呼叫 Spotify Web API。
- 把目前播放歌曲顯示到畫面上。
- 根據播放進度高亮假歌詞。

## 3. HTML、CSS、JS 如何互動

可以用這個例子理解。

HTML 裡有：

```html
<h2 id="trackTitle">尚未讀取歌曲</h2>
```

CSS 可以控制它的外觀，例如字體大小、顏色、間距。

JavaScript 可以改它的內容：

```js
elements.trackTitle.textContent = currentTrack.name;
```

所以三者分工是：

```text
HTML：這裡有一個歌名位置
CSS：這個歌名位置長什麼樣子
JS：現在要顯示哪一首歌的名字
```

再看進度條。

HTML：

```html
<div class="progress">
  <div id="progressBar"></div>
</div>
```

CSS：

```css
.progress {
  height: 10px;
  background: #2d3832;
}

#progressBar {
  width: 0%;
  height: 100%;
  background: #66d19e;
}
```

JavaScript：

```js
elements.progressBar.style.width = `${percent}%`;
```

意思是：

```text
HTML 建立進度條容器
CSS 把它畫成一條橫條
JS 根據播放進度改變內層寬度
```

## 4. 這個 spike 的完整執行流程

### 第一次打開頁面

瀏覽器載入 HTML、CSS、JS 後，`app.js` 會立刻執行這些事：

```js
const redirectUri = `${location.origin}${location.pathname}`;
elements.redirectUri.textContent = redirectUri;
elements.clientId.value = localStorage.getItem('spotify_client_id') ?? '';
renderLyrics(0);
window.setInterval(tick, 500);
init();
```

翻成白話：

1. 算出目前頁面的 Redirect URI。
2. 把 Redirect URI 顯示在頁面上。
3. 如果之前存過 Client ID，就自動填回 input。
4. 先畫出假歌詞。
5. 每 0.5 秒執行一次 `tick()`。
6. 執行 `init()` 檢查現在是不是 Spotify callback 回來的狀態。

### 按下「登入 Spotify」

按鈕事件：

```js
elements.login.addEventListener('click', login);
```

使用者按下後，會執行：

```js
login()
```

`login()` 做的事：

1. 讀取 input 裡的 Client ID。
2. 建立 PKCE verifier。
3. 把 verifier 雜湊成 challenge。
4. 組出 Spotify 授權網址。
5. 用 `location.href` 把瀏覽器導向 Spotify。

重點概念：

```text
前端不能放 client secret，所以用 PKCE。
PKCE 用 verifier + challenge 來證明這次換 token 的人，就是剛剛發起登入的人。
```

### Spotify 登入完成後

Spotify 會把瀏覽器導回：

```text
http://127.0.0.1:5173/?code=...
```

頁面重新載入後，`init()` 會抓到網址上的 code：

```js
const code = new URLSearchParams(location.search).get('code');
```

如果有 code，就執行：

```js
await exchangeCodeForToken(code);
```

`exchangeCodeForToken()` 會向 Spotify token endpoint 發 request，把 code 換成 access token。

### 讀取目前播放

按下「讀取目前播放」後，會執行：

```js
refreshCurrentlyPlaying()
```

它會呼叫 Spotify API：

```text
GET https://api.spotify.com/v1/me/player/currently-playing
```

如果成功，Spotify 會回傳目前播放資訊，例如：

- 歌曲名稱
- 歌手
- 專輯
- 封面
- 是否正在播放
- 目前播放進度 `progress_ms`

接著程式把資料放進 state：

```js
currentTrack = data.item;
currentProgressMs = data.progress_ms ?? 0;
durationMs = currentTrack?.duration_ms ?? 0;
isPlaying = data.is_playing;
```

再呼叫：

```js
renderTrack();
```

畫面就會更新。

## 5. 假歌詞同步怎麼運作

假歌詞長這樣：

```js
const lyrics = [
  { startMs: 0, text: 'Intro...' },
  { startMs: 10000, text: '第一句...' },
  { startMs: 20000, text: '第二句...' }
];
```

每一句都有 `startMs`，代表這句從歌曲第幾毫秒開始。

同步邏輯在 `renderLyrics(progressMs)`：

```js
const activeIndex = lyrics.findIndex((line, index) => {
  const next = lyrics[index + 1];
  return progressMs >= line.startMs && (!next || progressMs < next.startMs);
});
```

意思是：找出目前時間落在哪一句歌詞的區間。

例如：

```text
progressMs = 15000
第一句 startMs = 10000
第二句 startMs = 20000
```

15000 介於 10000 和 20000 之間，所以第一句亮起。

亮起的方式是加 class：

```js
if (index === activeIndex) item.classList.add('active');
```

CSS 看到 `.active` 後套用樣式：

```css
#lyrics li.active {
  color: #ffffff;
  font-weight: 800;
}
```

所以歌詞同步其實是：

```text
播放時間 -> 找出目前歌詞行 -> 加上 active class -> CSS 讓它變亮
```

## 6. 為什麼需要 tick()

Spotify API 不會每一毫秒推送播放進度給我們。

所以我們做法是：

1. 先從 Spotify 拿一次準確的 `progress_ms`。
2. 如果歌曲正在播放，就用本機時間估算進度繼續往前走。
3. 定期重畫進度條和歌詞。

程式：

```js
function tick() {
  if (isPlaying) {
    currentProgressMs += Date.now() - lastSyncAt;
    lastSyncAt = Date.now();
  } else {
    lastSyncAt = Date.now();
  }

  renderProgress();
  renderLyrics(currentProgressMs);
}
```

`Date.now()` 會回傳目前時間的毫秒數。

如果兩次 `Date.now()` 差了 500ms，就代表時間過了 0.5 秒，所以播放進度也加 500ms。

這不是完美同步，但對 Phase 0 已經足夠。正式版之後可以定期重新向 Spotify 校正。

## 7. 重要 JavaScript 語法導讀

### const 和 let

```js
const scopes = [...];
let currentProgressMs = 0;
```

- `const`：變數不能重新指定。
- `let`：變數可以改變。

通常先用 `const`，真的需要改變時才用 `let`。

### function

```js
function setStatus(message) {
  elements.status.textContent = message;
}
```

函式是可重複使用的一段程式。

### async / await

```js
async function refreshCurrentlyPlaying() {
  const response = await fetch(url);
}
```

網路請求需要時間。`await` 會等結果回來再繼續執行。

### object

```js
const elements = {
  login: document.querySelector('#login'),
  status: document.querySelector('#status')
};
```

object 是 key-value 的集合。這裡用來把 DOM 元素集中管理。

### array

```js
const scopes = ['user-read-currently-playing', 'user-read-playback-state'];
```

array 是有順序的列表。

### template string

```js
`${minutes}:${seconds}`
```

用反引號建立字串，可以把變數塞進 `${}`。

### optional chaining

```js
currentTrack?.duration_ms
```

如果 `currentTrack` 是 `null` 或 `undefined`，不會報錯，而是回傳 `undefined`。

### nullish coalescing

```js
data.progress_ms ?? 0
```

如果左邊是 `null` 或 `undefined`，就使用右邊的預設值。

## 8. 重要瀏覽器 API 導讀

### document.querySelector

```js
document.querySelector('#login')
```

從 HTML 裡找元素。

### addEventListener

```js
element.addEventListener('click', handler)
```

監聽使用者事件，例如點擊。

### fetch

```js
fetch('https://api.spotify.com/...')
```

發 HTTP request。

### localStorage

```js
localStorage.setItem('spotify_client_id', clientId)
localStorage.getItem('spotify_client_id')
```

把資料存在瀏覽器裡，重新整理後還在。

### sessionStorage

```js
sessionStorage.setItem('spotify_code_verifier', verifier)
```

跟 localStorage 類似，但通常只保留在目前分頁 session。

### location

```js
location.href = 'https://accounts.spotify.com/...'
```

控制目前網址。這裡用來跳轉到 Spotify 登入頁。

### URLSearchParams

```js
new URLSearchParams(location.search).get('code')
```

解析網址 query string，例如 `?code=abc`。

### crypto

```js
crypto.getRandomValues(...)
crypto.subtle.digest('SHA-256', data)
```

瀏覽器提供的加密 API。這裡用在 OAuth PKCE。

## 9. 建議閱讀順序

第一次讀，不要從第 1 行一路硬啃到最後。建議照這樣看：

1. `index.html`：先看頁面有哪些區塊。
2. `styles.css`：只看 `.shell`、`.panel`、`.player`、`.actions`、`#lyrics li.active`。
3. `app.js`：先看最上面的 `scopes`、`lyrics`、`elements`。
4. 看 event listener：理解按鈕按下去會呼叫哪個 function。
5. 看 `login()`：理解登入流程。
6. 看 `exchangeCodeForToken()`：理解 code 如何換 token。
7. 看 `refreshCurrentlyPlaying()`：理解怎麼拿 Spotify 現在播放。
8. 看 `renderTrack()`、`renderProgress()`、`renderLyrics()`：理解資料怎麼變成畫面。
9. 最後看 `tick()`：理解同步歌詞為什麼會動。

## 10. 這個 spike 學完後你應該理解什麼

你不需要一次記住所有語法。

但你應該能說出：

- HTML 負責頁面結構。
- CSS 負責視覺樣式。
- JavaScript 負責互動和資料。
- `id` 常被 JS 用來找元素。
- `class` 常被 CSS 用來套樣式。
- 按鈕會透過 `addEventListener` 綁定行為。
- `fetch` 可以呼叫 API。
- OAuth 登入會先跳去 Spotify，再帶著 `code` 回來。
- `code` 可以換成 `access_token`。
- `access_token` 可以授權呼叫 Spotify API。
- 歌詞同步的核心是用 `progress_ms` 找目前應該亮哪一句。

這就是 Orpheus Web Phase 0 最重要的基本功。
