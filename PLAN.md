# Orpheus Web PLAN

## 專案目標

Orpheus Web 是 Orpheus 的網頁模式。它和現有的 Discord Bot 版本屬於同一個產品概念，但這個專案會專注在「瀏覽器中的音樂播放器與同步歌詞體驗」。

第一階段目標是建立一個可以控制 Spotify 播放、顯示同步歌詞、並支援歌詞翻譯的網頁應用程式。使用者可以在聽歌的同時看到目前播放到哪一句歌詞，也可以選擇不同語言的翻譯版本，例如日文原文搭配中文翻譯一起顯示。

整體體驗可以參考 Musixmatch：播放音樂時，歌詞會跟著時間軸同步，高亮目前句子，讓使用者更容易跟唱、理解內容，或學習外語。

完成 Spotify 版本後，再評估是否加入 YouTube 播放功能，例如輸入 YouTube 網址、搜尋歌曲、播放影片或音訊，並同步顯示歌詞。

## 學習目標

這個專案也是一個全端網頁開發的學習專案。希望透過實作逐步熟悉現代 Web 開發常見技術：

1. TypeScript / JavaScript
2. React / Next.js / Node.js
3. FastAPI / PostgreSQL
4. Docker / Kubernetes / CI/CD

我上次接觸網頁和 SQL 已經是 7、8 年前，所以開發過程要以「能理解、能自己動手」為優先。請用淺顯易懂的方式帶我做，包含：

- 為什麼要使用某個技術
- 這個技術解決什麼問題
- 它的基本原理是什麼
- 常見語法和使用習慣
- 常見設計模式與最佳實踐
- 每一步實作背後的取捨

請不要直接把所有程式都一次寫好。比較理想的方式是先解釋概念、拆小步驟，讓我自己動手寫；必要時再給我範例、修正方向或 code review。

## 產品模式

目前 Orpheus 會先分成兩個 repo：

- `orpheus`：Discord Bot 模式，使用 Python，音樂播放在 Discord voice channel。
- `orpheus-web`：Web 模式，使用瀏覽器播放或控制音樂，並提供同步歌詞體驗。

短期內先保持兩個 repo，不急著做 monorepo。等未來真的出現重複邏輯，例如播放佇列、歌詞資料結構、播放狀態模型、playlist 格式，再考慮整理成 monorepo 或抽出 shared package。

## 核心功能範圍

### MVP：Spotify 同步歌詞播放器

第一版先專注在 Spotify 與歌詞同步：

- 使用 Spotify 帳號登入。
- 讀取目前播放中的歌曲資訊。
- 控制 Spotify 播放：播放、暫停、上一首、下一首。
- 顯示目前歌曲資訊：歌名、歌手、專輯、封面。
- 顯示同步歌詞。
- 根據播放進度高亮目前歌詞。
- 顯示翻譯歌詞，例如原文 + 中文。
- 讓使用者選擇翻譯語言版本。

### 第二階段：更完整的播放器體驗

- 搜尋歌曲。
- 顯示 Spotify playlist。
- 顯示播放佇列。
- 調整音量。
- 歌詞行點擊後跳到對應時間。
- 歌詞延遲校正。
- 鍵盤快捷鍵。
- RWD 手機版介面。

### 第三階段：歌詞與翻譯管理

- 儲存手動校正過的歌詞時間軸。
- 儲存使用者偏好的翻譯語言。
- 建立自己的歌詞資料庫。
- 讓使用者手動新增或編輯歌詞。
- 匯入 / 匯出歌詞資料。

### 第四階段：YouTube 可行性研究

Spotify 版本穩定後，再評估 YouTube：

- 輸入 YouTube 網址播放。
- 搜尋歌曲並找到對應影片。
- 同步顯示歌詞。
- 評估瀏覽器播放、API 限制、授權和資料來源問題。

YouTube 不放在 MVP，避免一開始同時碰到太多平台限制。

## 技術方向

### 前端

建議先使用：

- TypeScript
- React
- Next.js
- CSS Modules 或 Tailwind CSS

Next.js 適合這個專案，因為之後可能需要登入流程、API route、server-side token handling、資料庫整合和部署。React 則負責播放器 UI、歌詞列表、狀態互動和元件化。

### 後端

早期可以先使用 Next.js API routes 或 route handlers，等需求變複雜後再評估 FastAPI。

可能的後端職責：

- Spotify OAuth 登入流程。
- 保存 access token / refresh token。
- 代理 Spotify API request。
- 管理歌詞資料。
- 管理翻譯資料。
- 保存使用者偏好。

FastAPI 可以放在第二階段或第三階段再引入。這樣可以先學好前端和基本全端流程，不會一開始就被太多服務拆散注意力。

### 資料庫

第一版可以先不接 PostgreSQL。

建議演進路線：

1. 前端 local state。
2. LocalStorage 保存簡單偏好。
3. 後端 API 保存使用者資料。
4. PostgreSQL 保存歌詞、翻譯、偏好、播放紀錄。

PostgreSQL 適合放在需要「持久化、多使用者、可查詢」資料時再加入。

### 部署與 DevOps

Docker、Kubernetes、CI/CD 都是學習目標，但不應該一開始就壓進 MVP。

建議順序：

1. 本機開發可以跑。
2. GitHub repo 整理好。
3. 加入基本 lint / format。
4. 部署到 Vercel 或類似平台。
5. 加入 CI。
6. 需要後端服務時再 Docker 化。
7. 真的有多服務部署需求時再學 Kubernetes。

## 重要技術限制與風險

### Spotify

Spotify Web Playback SDK 可以在瀏覽器中建立 Spotify Connect 播放裝置，並播放 Spotify 內容，但它需要 Spotify Premium 帳號。Spotify Web API 可以取得音樂 metadata 和控制播放，但播放控制相關 API 也常依賴使用者帳號權限和裝置狀態。

此外，Spotify 平台政策對串流應用有一些限制，例如不能任意改造 Spotify 內容，也要注意同步內容與商業使用限制。實作前需要先做最小可行測試，確認登入、播放控制、取得目前歌曲、同步播放進度這幾件事都可行。

### 不使用 Spotify Client ID 的替代路線

如果目標只是「讀到這台電腦現在 Spotify 正在播什麼」，有些桌面程式確實可以不走 Spotify OAuth，也不需要 Spotify Client ID。它們通常不是直接呼叫 Spotify Web API，而是讀取作業系統提供的「媒體工作階段 / 現在播放資訊」。

以 Windows 為例，桌面程式可以透過系統層的媒體控制介面讀到目前播放中的 app、歌曲標題、藝人、專輯封面與基本播放狀態。這也是一些動態桌布、桌面小工具、OBS 外掛或 Discord Rich Presence 工具能顯示 Spotify 曲目的常見做法。

但這條路有明確限制：

- 它比較適合桌面應用程式，不適合純瀏覽器網頁。
- 通常只能讀到「本機目前播放資訊」，不一定能可靠控制 Spotify。
- 能拿到的資料品質取決於作業系統與 Spotify 桌面版是否正確暴露媒體資訊。
- 這種方式偏向單機整合，不適合未來部署成公開網站服務。

所以這個專案其實有兩條不同產品方向：

- Web 路線：使用 Spotify OAuth / Web API / Web Playback SDK，適合做真正的網頁產品。
- Desktop 路線：讀取本機系統媒體資訊，不一定需要 Spotify Client ID，但比較像個人桌面工具。

如果 Orpheus Web 仍然以「瀏覽器中的播放器與同步歌詞」為主，那 Spotify Client ID 幾乎還是必要的。若之後想做「本機 now playing overlay / wallpaper / 桌面歌詞工具」，可以另外開一條 desktop spike 研究。

### 歌詞來源

歌詞和翻譯會牽涉授權與資料來源問題。Musixmatch 是參考產品，但不代表可以直接使用它的資料。需要研究可用 API、授權條款、免費額度、同步歌詞格式，以及翻譯資料來源。

MVP 可以先用測試資料或手動建立幾首歌的歌詞 JSON，先把同步歌詞 UI 和播放進度邏輯做出來，再接正式歌詞來源。

### YouTube

YouTube 播放與音訊取得限制較多，也可能牽涉平台政策。不要在 MVP 同時處理 Spotify 和 YouTube。先讓 Spotify + lyrics 的核心體驗成立，再決定 YouTube 要怎麼做。

## 建議專案結構

初期保持簡單：

```text
orpheus-web/
  src/
    app/
      page.tsx
      layout.tsx
    components/
      player/
      lyrics/
      spotify/
    lib/
      spotify/
      lyrics/
      player/
    types/
  public/
  PLAN.md
  README.md
  package.json
```

等專案長大後再考慮：

```text
orpheus-web/
  apps/
    web/
  packages/
    core/
    ui/
```

## 初步資料模型

### Track

```ts
type Track = {
  id: string;
  title: string;
  artists: string[];
  album?: string;
  artworkUrl?: string;
  durationMs: number;
  spotifyUri?: string;
};
```

### LyricLine

```ts
type LyricLine = {
  id: string;
  startMs: number;
  endMs?: number;
  text: string;
  translations?: Record<string, string>;
};
```

### PlayerState

```ts
type PlayerState = {
  track: Track | null;
  isPlaying: boolean;
  progressMs: number;
  volumePercent: number;
  deviceId?: string;
};
```

## 開發里程碑

### Phase 0：技術驗證

目標：確認 Spotify + 歌詞同步這條路可行。

任務：

- 建立 Next.js 專案。
- 建立 Spotify Developer app。
- 完成 OAuth 登入。
- 取得目前播放歌曲。
- 顯示歌曲 metadata。
- 驗證是否能取得播放進度。
- 用假歌詞資料做同步高亮。
- 補做一個 desktop spike，評估是否能直接讀取本機系統的 now playing 資訊。

完成標準：登入 Spotify 後，頁面可以顯示目前歌曲，並用播放進度同步歌詞。

### Phase 1：播放器 UI

目標：做出 Orpheus Web 的基本使用體驗。

任務：

- 設計播放器主畫面。
- 顯示封面、歌名、歌手。
- 實作播放 / 暫停 / 上一首 / 下一首。
- 顯示進度條。
- 顯示同步歌詞區。
- 顯示翻譯歌詞。
- 加入 loading / error / empty states。

完成標準：它看起來並用起來像一個真正的歌詞播放器，而不是 API 測試頁。

### Phase 2：歌詞資料

目標：讓歌詞來源從假資料走向可維護資料。

任務：

- 定義歌詞 JSON 格式。
- 支援手動新增歌詞。
- 支援翻譯版本。
- 研究 lyrics API。
- 評估 PostgreSQL 儲存歌詞與翻譯。

完成標準：同一首歌可以穩定載入原文與翻譯，並跟著播放時間同步。

### Phase 3：帳號與資料保存

目標：讓使用者偏好可以保存。

任務：

- 保存偏好翻譯語言。
- 保存歌詞延遲校正。
- 保存最近播放或常用歌曲。
- 引入 PostgreSQL。
- 設計基本資料表。

完成標準：使用者重新開啟網站後，仍能保留基本偏好。

### Phase 4：部署與工程化

目標：讓專案可以穩定開發和部署。

任務：

- 加入 lint / format。
- 加入基本測試。
- 建立 `.env.example`。
- 部署到 Vercel。
- 加入 GitHub Actions。
- 視需求加入 Docker。

完成標準：專案可以被乾淨地安裝、執行、檢查和部署。

## 開放問題

目前沒有阻塞開發的問題，但有幾個需要在早期確認：

- Spotify Premium 是否是可接受的前提？
- MVP 是否先使用手動建立的測試歌詞？
- 翻譯歌詞要先手動維護，還是研究第三方 API？
- UI 風格要偏沉浸式播放器，還是偏學習工具？
- 是否要一開始就使用 Next.js，還是先用 Vite + React 快速驗證？

## 下一步建議

先做 Phase 0，不急著接資料庫、Docker 或 Kubernetes。

第一個真正的開發目標應該是：

1. 建立 Next.js + TypeScript 專案。
2. 完成 Spotify OAuth。
3. 取得目前播放歌曲。
4. 用假歌詞資料同步顯示目前播放位置。

這樣可以最快驗證 Orpheus Web 的核心價值：聽歌時看到同步歌詞與翻譯。

## 協作原則

如果遇到不確定的產品方向、技術限制或架構選擇，請先討論再決定。

如果是明確的小步驟，可以直接帶著做，但要保留學習節奏：先解釋，再實作，再回顧。
