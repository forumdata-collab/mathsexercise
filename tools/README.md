# tools — 測試與診斷

全部係零依賴 Node / Chromium 腳本，唔需要安裝任何 npm 套件。

## 1. 出題與數學驗算（主要回歸測試）

```bash
node tools/test_generators.js index.html
```

- ① 檢查 61 個課題（12 個年級）全部都出得到題目，並列出每題樣本
- ② 每課題隨機抽 150 條（共 **9,600 條**）用 **22 類規則驗算**答案：
  四則運算、混合式真優先次序、分數四則（含**約至最簡**）、小數精確值、
  圓面積／圓周（π = 3.14）、百分數、四捨五入、平均數、簡單方程、比例、
  體積、因數／倍數／公因數公倍數、三位數位值、時鐘合理性、年級數值範圍、
  負數、顯示題不驗約簡
- 有問題 → 印出課題、題目、答案、問題描述，並以 **exit code 1** 結束（可直接入 CI）

現況：**64/64 出題 OK、9,600 條樣本 0 問題**。

## 2. 瀏覽器功能套件（24 項）

`tools/browser_suite.js` 係注入式套件：將佢放入 `index.html` 嘅 `</body>` 之前，再用 headless chromium dump 讀 `<pre id="TESTOUT">`。

```bash
# 1) 起本地 server
python3 -m http.server 8895 &
# 2) 把 browser_suite.js 注入 index.html → _test.html（見下面 runner 片段）
# 3) dump 結果
chromium --headless=new --disable-gpu --no-sandbox \
  --user-data-dir=$HOME/.cache/cr_math \
  --window-size=1200,900 --virtual-time-budget=30000 \
  --dump-dom http://localhost:8895/_test.html
```

覆蓋：首次載入即出工作紙、格數／每行格數、**幾何溢出探針**（逐格比對題目墨水框 vs 格框）、換題、顯示／隱藏答案、直式模式、年級↔課題聯動、極端題數（1／60）、localStorage、A4 預覽、標題／姓名／分數、auto-regenerate、空課題提示、全程無 JS error。

⚠️ 三個實測坑：
1. **一定要排除 A4 預覽克隆**：`[...document.querySelectorAll('.qcell')].filter(c=>!c.closest('#a4PreviewFrame'))` —— 克隆會令格數多一倍（曾造成 2 個假 fail）。
2. `--user-data-dir` 每次唔同（或用 `$HOME`），殘留 chromium process 會令之後所有 dump 失敗。
3. 頁面**唔可以有阻塞式 `alert()`** —— headless 冇人撝得走，renderer 會直接 hang（dump 永遠 0 bytes）。

## 3. 幾何探針（CDP）

`tools/cdp_geom_probe.js` —— 用 Chrome DevTools Protocol 喺真瀏覽器量度每格題目墨水框／格框、直式對位、答案線位置，輸出 JSON 方便比對。

## 4. 列印與手機檢查

```bash
# 列印規則強制生效（@media print → @media all），A4 闊度 794px
# 手機：--window-size=500,900
```
實測：列印格 2.2cm（83px）、每行 6 格、**0 溢出**；手機 500px 格自動縮到 59px、0 溢出。
