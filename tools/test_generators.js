// Verify EVERY CURRICULUM (grade, topic) pair returns a valid question with a real answer.
// Reusable after any generator / CURRICULUM / pickGen edit. Run: node test_generators.js
// (adjust the src path if you copy this next to index.html)
const fs = require('fs');
const SRC = process.argv[2] || '/home/ubuntu/mathsexercise/index.html';

global.document = {
  getElementById: () => ({ value: '', checked: true, selectedIndex: 0, options: [], innerHTML: '', textContent: '', classList: { add: () => {}, remove: () => {}, contains: () => false } }),
  querySelector: () => null, querySelectorAll: () => [],
  createElement: () => ({ className: '', style: {}, innerHTML: '', appendChild: () => {}, textContent: '' }),
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.alert = () => {};

let js = fs.readFileSync(SRC, 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
js = js.replace(/'use strict';\s*/, ''); // strict-mode eval keeps declarations out of global scope
const initIdx = js.lastIndexOf('/* ===== init ===== */');
if (initIdx > 0) js = js.slice(0, initIdx);
// ⚠️ const/let 宣告唔會走出 eval scope（即使剝咗 'use strict'）→ 一定要將要測嘅
// 物件喺同一段 eval 內傳出嚟，唔可以靠 eval 之後直接讀 CURRICULUM。
// ⚠️ const/let 唔會走出 eval scope；而 function 宣告（pickGen）會漏到 module scope，
// 所以用唔撞名嘅 binding 接住，唔可以再 declare 同名 const。
const __api = eval(js + '\n;({CURRICULUM, pickGen})');
const CUR = __api.CURRICULUM, PICK = __api.pickGen;

const tests = [];
for (const g of Object.keys(CUR)) {
  for (const t of CUR[g].topics) tests.push([g, t]);
}
// time topics are appended per-grade in the UI; add once
['讀時鐘', '時間計算', '數線'].forEach(t => tests.push(['p2u', t]));


/* ===== 2. 數學驗算：每題抽 40 次，驗算答案 ===== */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
function checkMath(grade, topic, q) {
  const probs = [];
  const ans = q.a, qs = String(q.q || '');
  // (1) 分數答案必須最簡
  // 「顯示題」（題目本身就係答案，例如「2/4」叫人讀出分數）唔需要約簡 —— 用題目=答案判斷
  const isDisplayTask = qs.trim() === String(ans).trim();
  if (!isDisplayTask && typeof ans === 'string' && /^\d+\/\d+$/.test(ans)) {
    const [n, d] = ans.split('/').map(Number);
    if (d === 0) probs.push('分母為 0');
    else if (gcd(n, d) !== 1) probs.push(`分數未約簡：${ans}`);
  }
  const num = typeof ans === 'number' ? ans : (typeof ans === 'string' && /^-?[\d.]+$/.test(ans) ? +ans : null);
  // (2) 除法必須精確（整數除法／小數除法）
  let m = qs.match(/^([\d.]+)\s*÷\s*([\d.]+)$/);
  if (m && num !== null) {
    const exact = (+m[1]) / (+m[2]);
    if (Math.abs(exact - num) > 1e-9) probs.push(`除法唔精確：${m[1]}÷${m[2]}=${exact} 但答 ${ans}`);
  }
  // (3) 二元四則驗算
  m = qs.match(/^(\d+(?:\.\d+)?)\s*([+−×])\s*(\d+(?:\.\d+)?)$/);
  if (m && num !== null) {
    const a = +m[1], op = m[2], b = +m[3];
    const exp = op === '+' ? a + b : op === '−' ? a - b : a * b;
    if (Math.abs(exp - num) > 1e-9) probs.push(`算錯：${m[0]} = ${exp} 但答 ${ans}`);
  }
  // (4) 混合式：A op1 B op2 C（× 優先）
  m = qs.match(/^(\d+)\s*([+−])\s*(\d+)\s*([+−×])\s*(\d+)$/);
  if (m && num !== null) {
    const A = +m[1], o1 = m[2], B = +m[3], o2 = m[4], C = +m[5];
    const exp = o2 === '×' ? (o1 === '+' ? A + B * C : A - B * C) : (o1 === '+' ? A + B : A - B) + (o2 === '+' ? C : -C);
    if (Math.abs(exp - num) > 1e-9) probs.push(`優先次序算錯：${m[0]} = ${exp} 但答 ${ans}`);
  }
  // (5) 分數加減：值要對
  m = qs.match(/^(\d+)\/(\d+)\s*\+\s*(\d+)\/(\d+)$/);
  if (m && typeof ans === 'string') {
    const [, n1, d1, n2, d2] = m.map(Number);
    const exp = n1 / d1 + n2 / d2;
    const got = ans.includes('/') ? (() => { const [a, b] = ans.split('/').map(Number); return a / b; })() : +ans;
    if (Math.abs(exp - got) > 1e-9) probs.push(`分數加減錯：${m[0]} = ${exp} 但答 ${ans}`);
  }
  // (6) 分數乘法
  m = qs.match(/^(\d+)\/(\d+)\s*×\s*(\d+)\/(\d+)$/);
  if (m && typeof ans === 'string') {
    const [, n1, d1, n2, d2] = m.map(Number);
    const exp = (n1 * n2) / (d1 * d2);
    const got = ans.includes('/') ? (() => { const [a, b] = ans.split('/').map(Number); return a / b; })() : +ans;
    if (Math.abs(exp - got) > 1e-9) probs.push(`分數乘法錯：${m[0]} = ${exp} 但答 ${ans}`);
  }
  // (7) 分數除法
  m = qs.match(/^(\d+)\/(\d+)\s*÷\s*(\d+)(?:\/(\d+))?$/);
  if (m && (typeof ans === 'string' || num !== null)) {
    const n1 = +m[1], d1 = +m[2], n2 = +m[3], d2 = m[4] ? +m[4] : 1;
    const exp = (n1 / d1) / (n2 / d2);
    const got = typeof ans === 'string' && ans.includes('/') ? (() => { const [a, b] = ans.split('/').map(Number); return a / b; })() : +ans;
    if (Math.abs(exp - got) > 1e-9) probs.push(`分數除法錯：${m[0]} = ${exp} 但答 ${ans}`);
  }
  // (8) 整數除以分數
  m = qs.match(/^(\d+)\s*÷\s*(\d+)\/(\d+)$/);
  if (m) {
    const k = +m[1], n = +m[2], d = +m[3];
    const exp = k / (n / d);
    const got = typeof ans === 'string' && ans.includes('/') ? (() => { const [a, b] = ans.split('/').map(Number); return a / b; })() : +ans;
    if (Math.abs(exp - got) > 1e-9) probs.push(`整數÷分數錯：${m[0]} = ${exp} 但答 ${ans}`);
  }
  // (9) 圓形面積／圓周（π = 3.14，跟教科書）
  m = qs.match(/半徑\s*(\d+)\s*cm\s*的圓形面積/);
  if (m) { const r = +m[1], exp = +(3.14 * r * r).toFixed(1); if (Math.abs(exp - (+ans)) > 0.05) probs.push(`圓面積錯：r=${r} 應 ${exp} 答 ${ans}`); }
  m = qs.match(/半徑\s*(\d+)\s*cm\s*的圓周/);
  if (m) { const r = +m[1], exp = +(2 * 3.14 * r).toFixed(1); if (Math.abs(exp - (+ans)) > 0.05) probs.push(`圓周錯：r=${r} 應 ${exp} 答 ${ans}`); }
  // (10) 百分數
  m = qs.match(/^(\d+)\s*的\s*(\d+)%$/);
  if (m && num !== null) { const exp = +m[1] * +m[2] / 100; if (Math.abs(exp - num) > 1e-9) probs.push(`百分數錯：${m[0]} = ${exp} 但答 ${ans}`); }
  // (11) 四捨五入到十位
  m = qs.match(/^(\d+)\s*四捨五入到十位/);
  if (m && num !== null) { const n = +m[1], exp = Math.round(n / 10) * 10; if (exp !== num) probs.push(`四捨五入錯：${n} → 應 ${exp} 答 ${ans}`); }
  // (12) 平均數
  m = qs.match(/^求平均數：([\d、]+)$/);
  if (m && num !== null) {
    const nums = m[1].split('、').map(Number);
    const exp = nums.reduce((a, b) => a + b, 0) / nums.length;
    if (Math.abs(exp - num) > 1e-9) probs.push(`平均數錯：${m[1]} → 應 ${exp} 答 ${ans}`);
  }
  // (13) 簡單方程
  m = qs.match(/^(\d+)x\s*=\s*(\d+)$/);
  if (m && num !== null) { const exp = +m[2] / +m[1]; if (Math.abs(exp - num) > 1e-9) probs.push(`方程錯：${m[0]} → x=${exp} 但答 ${ans}`); }
  // (14) 年級範圍檢查（小一至小六唔應該出超範圍數值）
  const RANGE = { '10以內的數': 10, '20以內的數': 20, '100以內的數': 100, '基本加減': 18,
                  '加與減(一)': 100, '加與減(二)': 999, '加與減(三)': 9999, '加與減(四)': 9999 };
  if (RANGE[topic] && num !== null) {
    const cap = RANGE[topic];
    const nums = (qs.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (nums.some(n => n > cap) || num > cap || num < 0) probs.push(`超出課題範圍（≤${cap}）：${qs} → ${ans}`);
  }
  // (15) 減法／除減結果唔應該負數
  if (num !== null && num < 0 && /[−]|減/.test(qs)) probs.push(`負數答案：${qs} → ${ans}`);
  // (16) 時鐘／時間合理性
  const tm = qs.match(/^(\d{1,2}):(\d{2})$/);
  if (tm) { const h = +tm[1], mi = +tm[2]; if (h < 1 || h > 12 || mi < 0 || mi > 59) probs.push(`時間唔合理：${qs}`); }
  const am = String(ans).match(/^(\d{1,2}):(\d{2})$/);
  if (am) { const h = +am[1], mi = +am[2]; if (h < 0 || h > 23 || mi < 0 || mi > 59) probs.push(`答案時間唔合理：${ans}`); }
  // (17) 讀寫題答案要同題目數字一致
  let mm = qs.match(/^(\d+)\s*的(?:百位|千位|萬位)[、十位個位]*是？$/);
  if (mm) { const digits = String(ans).replace(/[^\d]/g, ''); if (digits !== String(mm[1])) probs.push(`讀寫題答案唔對：${qs} → ${ans}`); }
  // (18) 因數／倍數／公因數公倍數
  mm = qs.match(/^(\d+)\s*的因數是？$/);
  if (mm) { const n = +mm[1]; const list = String(ans).split('、').map(Number); if (list.some(x => n % x !== 0)) probs.push(`因數錯：${qs}`); if (!list.includes(n) || !list.includes(1)) probs.push(`因數唔完整：${qs}`); }
  mm = qs.match(/^(\d+)\s*的倍數表（第(\d+)個）$/);
  if (mm) { const n = +mm[1], k = +mm[2]; if (num !== n * k) probs.push(`倍數錯：${qs} → 應 ${n * k}`); }
  mm = qs.match(/^(\d+)\s*和\s*(\d+)\s*的最小公倍數$/);
  if (mm && num !== null) { const a = +mm[1], b = +mm[2]; const g = gcd(a, b); if (num !== a * b / g) probs.push(`最小公倍數錯：${qs} → 應 ${a * b / g}`); }
  mm = qs.match(/^(\d+)\s*和\s*(\d+)\s*的最大公因數$/);
  if (mm && num !== null) { const a = +mm[1], b = +mm[2]; if (num !== gcd(a, b)) probs.push(`最大公因數錯：${qs} → 應 ${gcd(a, b)}`); }
  // (19) 擴分約分：d/(d·m) = 1/m
  mm = qs.match(/^(\d+)\/(\d+)\s*=\s*\?\/(\d+)$/);
  if (mm && num !== null) { const [, n, d, m] = mm.map(Number); const exp = (n * m) / d; if (Math.abs(exp - num) > 1e-9) probs.push(`擴分約分錯：${qs} → 應 ${exp}`); }
  // (20) 方程
  mm = qs.match(/^([\d.]+)x\s*=\s*([\d.]+)$/);
  if (mm && num !== null) { const exp = +mm[2] / +mm[1]; if (Math.abs(exp - num) > 1e-9) probs.push(`方程錯：${qs} → 應 ${exp}`); }
  // (21) 比例
  mm = qs.match(/A : B = (\d+) : (\d+)，A = (\d+)，B = \?/);
  if (mm && num !== null) { const [a1, b1, av] = [+mm[1], +mm[2], +mm[3]]; if (Math.abs(av * b1 / a1 - num) > 1e-9) probs.push(`比例錯：${qs} → 應 ${av * b1 / a1}`); }
  // (22) 體積／周界等
  mm = qs.match(/^長方體 (\d+)×(\d+)×(\d+) cm³ 體積/);
  if (mm && num !== null) { const exp = +mm[1] * +mm[2] * +mm[3]; if (exp !== num) probs.push(`體積錯：${qs} → 應 ${exp}`); }
  return probs;
}

let samples = 0, bad = 0;
const report = [];
for (const [grade, topic] of tests) {
  for (let i = 0; i < 150; i++) {
    let q;
    try { const { gen } = PICK(topic, grade); q = typeof gen === 'function' ? gen() : gen.gen(); } catch (e) { continue; }
    if (!q) continue;
    samples++;
    const probs = checkMath(grade, topic, q);
    if (probs.length) { bad++; report.push(`❌ ${grade} ${topic}: ${q.q} → ${JSON.stringify(q.a)}  [${probs.join('; ')}]`); }
  }
}
console.log(`\n===== 數學驗算：${samples} 條樣本，問題 ${bad} =====`);
[...new Set(report)].slice(0, 25).forEach(r => console.log(r));
const mathBad = bad;

let fail = 0;
for (const [grade, topic] of tests) {
  try {
    const { gen } = PICK(topic, grade);
    const q = typeof gen === 'function' ? gen() : gen.gen();
    if (!q || q.q === undefined || q.a === undefined || q.a === null) {
      console.log(`❌ ${grade} ${topic}: missing q/a`); fail++; continue;
    }
    if (String(q.a).trim() === '' || (typeof q.a === 'number' && !isFinite(q.a))) {
      console.log(`❌ ${grade} ${topic}: bad answer ${JSON.stringify(q.a)}`); fail++; continue;
    }
    console.log(`✅ ${grade} ${topic}: "${String(q.q).slice(0, 30)}" → ${JSON.stringify(q.a)}`);
  } catch (e) {
    console.log(`❌ ${grade} ${topic}: ${e.message.slice(0, 60)}`); fail++;
  }
}
console.log(`\n${tests.length - fail}/${tests.length} OK, ${fail} failed`);
process.exit((fail || (typeof mathBad !== 'undefined' && mathBad)) ? 1 : 0);
