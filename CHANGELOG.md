# Changelog

## 2026-09-19 — v1.1（審計：功能 + 數學正確性 + 代碼氣味）

### Fixed（真 bug）
- **首次到訪（或清過 localStorage）會彈 `alert('請先選擇課題！')` 而唔出工作紙**：`onGradeChange()` 只放「— 選擇課題 —」佔位，從不預選課題 → init 嘅 `generate()` 即刻撞到空課題。已改為轉年級／重載時保留原本選擇，否則預選第一個課題；`generate()` 亦唔再用阻塞式 `alert()`，改為版面內提示（`.empty-hint`）。⚠️ 呢個 alert 會令無頭瀏覽器／自動化環境直接 hang（今次就係咁發現）。
- **6 組答案未約簡**：`genFracAdd`（2/3+1/3 出 `3/3`）、分數乘法、分數除以整數、整數除以分數、分數除以分數、概率（3/9）。新增 `gcdF()/reduceFrac()`，所有分數答案一律約至最簡（可整除時出整數）。
- **小數除法答案被四捨五入**：`(n/d).toFixed(1)` 令 `6.5 ÷ 2` 答 `3.3`（真值 3.25）→ 改為先揀 1 位小數嘅商，被除數 = 商 × 除數，答案必定精確。
- **圓形用 `Math.PI`**：部分半徑嘅四捨五入結果同教科書（π = 3.14）差 0.1（如 r=8 圓周 50.3 vs 50.2）→ 改用 3.14。

### Changed（代碼氣味）
- **Divergent Change / Long Method**：`pickGen()` 由 **85 行 if 鏈** 改為 `TOPIC_GEN` 表（課題 → 出題器，一行一個課題）＋ 4 行 `pickGen`；分數除法三兄弟抽成 `genFracDivide(topic)`。加課題只需加一行表項。
- **Dead Code**：刪 10 個從未被引用的舊 generator（`riNot`、`genSingleDigit`、`genOddEven`、`genNumberTrack`、`genBasicAdd`、`genBasicSub`、`genMulAdd`、`genMulSub`、`genMulDiv`、`genFracCompare`）—— 全部已被 `TOPIC_GEN` 嘅內聯版本取代。
- **無意義三元式**：`cell.dataset.ans=typeof q.a==='number'?q.a:q.a` → `cell.dataset.ans=q.a`。
- **A4 預覽克隆出重複 id**：`ws.cloneNode(true)` 會連 `#qArea` / `#worksheet` 一齊複製，令全頁出現重複 id → 克隆後剝走所有 `id`。
- **選項改完要再撳掣才生效** → 加 `bindAutoRegenerate()`（`change`/`input` + 250ms debounce），同 chineseword / engword 一致。

### Changed（頁腳）
- 頁腳改為「資料來源與聲明」區塊：課題編排參考**東華三院王余家潔紀念小學「數學科推介學習」**（wyjjmps.edu.hk）＋ 出題方式說明（π 取 3.14、分數約至最簡、除法精確）＋ 非官方聲明。標籤欄用 grid + `display:contents` 令跨行對齊。

### Notes（驗證）
- **數學驗算 9600 條樣本、22 類規則、0 問題**（每課題抽 150 條，驗算：四則、混合式優先次序、分數四則（含約簡）、小數精確、圓面積／圓周、百分數、四捨五入、平均數、方程、比例、體積、因數／倍數／公因數公倍數、讀寫題、時鐘合理性、年級範圍）。
- **重構等價性**：以「出題指紋」（400 樣本／課題、97 個（年級,課題）組合）比對重構前後 → 除刻意修正外完全一致。
- **瀏覽器功能套件 24 項**：首次載入、格數／每行、幾何溢出探針（0 溢出）、換題、顯示／隱藏答案、直式、年級課題聯動、極端題數（1／60）、localStorage、A4 預覽、標題姓名分數、auto-regenerate、空課題提示、無 JS error。
- **列印版面**：`@media print` 強制生效 @794px → 格 2.2cm（83px）、字級 var 正確、0 溢出。**手機**（500px 視窗）→ 格自動縮到 59px、0 溢出。
