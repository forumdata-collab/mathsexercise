# 數學練習簿 (Math Exercise Generator)

Deployed at **https://mathsexercise.we1co.me**

Interactive math worksheet generator for primary school (小三或以下). Generates print-ready A4 worksheets.

## Features

- **四則運算** — 加法、減法、乘法、除法、混合四則
- **直式／橫式** — vertical (進位/退位 layout) or horizontal question format
- **時間推理** — 讀時鐘 (SVG clock faces) + 時間計算 (start time + interval = end time)
- **5 個難度** — 10 以內 → 四則混合 (小一至小四+)
- **列印工作紙** — A4 print CSS (cm-sized cells), 📐 A4 預覽 modal, 顯示/隱藏答案
- **練習紙資料** — 標題 / 姓名 / 日期欄位
- 設定自動保存到 localStorage

## Layout & Print Logic (borrowed from chineseword.we1co.me)

- CSS vars `--cell` (screen px) + `--print-cell` (print cm) drive both screen and print sizing
- `@media print`: hides controls, sets `--cell: var(--print-cell)` — grid cells follow cm size, rows wrap from A4 width
- A4 預覽: clones #worksheet at 794px (A4 @96dpi), applies print vars, scales to fit modal
- 答案模式: `.show-ans` reveals answer as small red text in the corner

## Tech

Single-file vanilla HTML/CSS/JS — no build step, no dependencies. Deploy via Cloudflare Pages.

## Deploy

```bash
export CLOUDFLARE_API_TOKEN=$CF_WORKERS_TOKEN
export CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID
wrangler pages deploy . --project-name=mathsexercise-we1co --branch=main
```