# 數學練習簿 (Math Worksheet Generator)

> Print-ready A4 maths worksheets for Hong Kong primary schools — 小一至小六 (P1–P6)，12 個學期、61 個課題、29 種題型。

**Live: <https://mathsexercise.we1co.me>**

A single-file, dependency-free worksheet generator. Pick a grade and a topic and it produces a
printable A4 worksheet of randomised questions — vertical (直式) or horizontal layout, optional
answers, live A4 preview.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📚 61 課題 × 12 學期 | 小一上至小六下，全部課題一鍵出題（見下方課程覆蓋表） |
| 🔢 29 種題型 | 四則、混合運算、位值、數線、奇偶、乘法表、因數／倍數／公因數公倍數、分數（真假帶／擴分約分／四則）、小數（加減乘除／四則）、百分數、四捨五入、平均數、概率、比例、方程、面積、體積與容量、圓面積、圓周、讀時鐘、時間計算、綜合練習 |
| 📐 直式／橫式 | 直式自動處理進位／退位對位（`va`/`vb` 數字對齊）；橫式單行題目 |
| 🧮 答案約至最簡 | 所有分數答案一律約簡（可整除直接出整數）；小數除法答案必定精確；圓形一律 π = 3.14 —— 同教科書計法一致 |
| 🖨️ A4 列印 | 專用 `@media print` CSS（格用 cm 尺寸、按 A4 闊度自動換行）＋ 📐 **A4 預覽**（794px 克隆 + 縮放）＋ 顯示／隱藏答案 |
| 👤 工作紙資料 | 標題／姓名／日期／分數欄位，可切換顯示 |
| 🎲 題數與排版 | 題數 1–60、每行 2–8 格、螢幕格大小與印刷格大小各自設定 |
| ⚡ 即時套用 | 任何選項一改即自動重新出題（250ms debounce），毋須再撳「產生」 |
| 📱 響應式 | 手機 / 平板 / 桌面；設定自動存 `localStorage` |
| 🧪 已驗算 | 9,600 條隨機樣本 × 22 類數學規則驗算，0 問題（見 [tools/](tools/README.md)） |

## 📚 Curriculum coverage

課題編排參考東華三院王余家潔紀念小學「[數學科推介學習](https://www.wyjjmps.edu.hk/CP/pG/346/151/412)」網站的課題建議，再按香港小學數學課程分佈安排。

| 年級 | 課題 |
|------|------|
| 一年級上 (p1u) | 10以內的數 · 單數和雙數 · 20以內的數 · 基本加減 |
| 一年級下 (p1l) | 100以內的數 · 加與減(一) |
| 二年級上 (p2u) | 三位數讀寫 · 加與減(二) · 9×9乘法表 · 乘法配對 |
| 二年級下 (p2l) | 四位數讀寫 · 加與減(三) · 基本除法 · 有餘數除法 |
| 三年級上 (p3u) | 五位數讀寫 · 加與減(四) · 兩位數乘一位數 · 除法 · 單元乘法 |
| 三年級下 (p3l) | 乘加混合 · 乘減混合 · 乘除混合 · 快速算術 · 分數基礎 |
| 四年級上 (p4u) | 兩位乘兩位 · 三位乘兩位 · 長除法 · 倍數 · 因數 · 公倍數 · 公因數 |
| 四年級下 (p4l) | 除加混合 · 除減混合 · 乘除混合 · 分數：真假帶 · 擴分約分 · 分數加減 · 小數基礎 |
| 五年級上 (p5u) | 多位數讀寫 · 四捨五入 · 分數加減 · 分數乘法 · 分數四則混合 |
| 五年級下 (p5l) | 小數加減 · 小數乘法 · 小數除法 · 分數除以整數 · 整數除以分數 · 分數除以分數 |
| 六年級上 (p6u) | 百分數 · 百分數加減 · 小數四則 · 分數四則 · 圓形面積 · 圓周 |
| 六年級下 (p6l) | 體積與容量 · 比例 · 簡單方程 · 概率 · 平均數 · 綜合練習 |

## 🖨️ Layout & print logic

- CSS variables `--cell`（螢幕 px）與 `--print-cell`（印刷 cm）同時驅動螢幕與列印尺寸
- `@media print` 隱藏所有控制項，並令 `--cell: var(--print-cell)` —— 格線跟 cm 尺寸，行數按 A4 闊度自動換行
- **A4 預覽**：將 `#worksheet` 以 794px（A4 @96dpi）克隆、套用印刷變數、縮放至 modal；克隆後剝走所有 `id`，避免全頁出現重複 id
- **答案模式**：`.show-ans` 以淺紅小字在格角顯示答案（可切換）
- **自動縮字**：題目過長時逐級縮小字級，確保不溢出格框（幾何探針實測 0 溢出）

## 🏗️ Architecture

單檔 `index.html`（~37 KB / 620 行），vanilla HTML + CSS + JS，**無 build step、無依賴**。

```
CURRICULUM   年級 → { name, topics[] }         // 課程表
TOPIC_GEN    課題 → 出題器（一個課題一行）      // 加課題只加一行
pickGen()    查表 + 未實作課題的安全 fallback
generate()   抽題 → 出題 → 渲染 → 存設定
render()     工作紙／每行／每格 HTML（直式／橫式分支）
reduceFrac() 分數約至最簡（d = 1 出整數）
```

出題器回傳統一物件：

```js
{ q: '1/4 + 1/2',        // 題目字串（clock 題用 SVG 時鐘）
  a: '3/4',              // 答案（字串或數字）
  op: 'fracadd',         // 題型，供渲染層決定排版（共 29 種）
  va, vb,                // 直式用：兩個運算數
  frac: { n, d, d1, d2 } // 分數視覺化用
}
```

**設計取捨（刻意保留）**：單檔 + 無 build step（部署 = copy 檔案）、`TOPIC_GEN` 用表而唔用 class 階層、
細小封閉 enum 用字串 —— 全部係為咗令「改一個課題／題型」維持喺一處改動。

## 🧪 Testing

零依賴 Node / Chromium 腳本，詳見 [tools/README.md](tools/README.md)。

```bash
# 出題 + 數學驗算：61 課題、每課題抽 150 條（共 9,600 條）、22 類規則
node tools/test_generators.js index.html        # exit code 1 = 有問題

# 瀏覽器功能套件（24 項）：版面、幾何溢出探針、直式、A4 預覽、localStorage…
python3 -m http.server 8895 &
# 注入 tools/browser_suite.js，再以 headless chromium --dump-dom 讀 <pre id="TESTOUT">
```

現況：**64/64 出題 OK、9,600 條樣本 0 問題、瀏覽器套件 24 項全綠**（含列印 @794px 與手機 500px：0 溢出）。

## 🚀 Deploy

Cloudflare Pages：

```bash
export CLOUDFLARE_API_TOKEN=$CF_WORKERS_TOKEN
export CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID
wrangler pages deploy . --project-name=mathsexercise-we1co --branch=main
```

本地開發：`python3 -m http.server 8895`，或直接用瀏覽器打開 `index.html`。

## 📜 License

MIT © 2026 [forumdata-collab](https://github.com/forumdata-collab).

課題編排參考東華三院王余家潔紀念小學「數學科推介學習」網站；本站為獨立、非官方教學輔助工具，
與上述學校及任何教育機構並無隸屬或合作關係。

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities · [CHANGELOG.md](CHANGELOG.md) for release history.
