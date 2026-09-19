
window.__TEST = async () => {
  const R=[]; const ok=(n,c,d)=>R.push({name:n,pass:!!c,detail:d===undefined?'':String(d)});
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const $=id=>document.getElementById(id);
  const fire=(el,t)=>el.dispatchEvent(new Event(t,{bubbles:true}));
  const set=(id,v)=>{const e=$(id);e.value=v;fire(e,'change')};
  const chk=(id,v)=>{const e=$(id);e.checked=v;fire(e,'change')};
  const errs=[]; window.addEventListener('error',e=>errs.push(String(e.message)));
  const qc=()=>[...document.querySelectorAll('.qcell')].filter(c=>!c.closest('#a4PreviewFrame'));
  const over=()=>qc().filter(c=>{const t=c.querySelector('.qtext')||c.querySelector('.vmath')||c;const cr=c.getBoundingClientRect(),tr=t.getBoundingClientRect();return tr.right>cr.right+1||tr.bottom>cr.bottom+1||t.scrollWidth>c.clientWidth+1}).length;
  const gen=async(o={})=>{Object.entries(o).forEach(([k,v])=>set(k,v)); document.querySelector('.btn-gen').click(); await wait(350)};

  ok('首次載入已有工作紙', qc().length>0, qc().length);
  await gen({optGrade:'p1u', optTopic:'10以內的數', optCount:'24', optPerRow:'6', optLayout:'h'});
  ok('24 格', qc().length===24, qc().length);
  ok('每格有題目+答案線', !!qc()[0].querySelector('.qtext') && !!qc()[0].querySelector('.ans-line'), '');
  ok('無溢出（幾何探針）', over()===0, over());
  const q1=qc()[0].querySelector('.qtext').textContent;
  document.querySelector('.btn-swap').click(); await wait(350);
  ok('換題後仍有 24 格', qc().length===24, qc().length);
  ok('換題後無溢出', over()===0, over());
  chk('optShowAns',true); await wait(250);
  ok('顯示答案 → .show-ans', qc().filter(c=>c.classList.contains('show-ans')).length===24, qc().filter(c=>c.classList.contains('show-ans')).length);
  chk('optShowAns',false); await wait(250);
  ok('隱藏答案', qc().filter(c=>c.classList.contains('show-ans')).length===0, '');
  await gen({optGrade:'p2u', optTopic:'9×9乘法表', optCount:'12', optLayout:'v'});
  const vm=qc().filter(c=>c.classList.contains('vmode'));
  ok('直式模式有直式格', vm.length>0, vm.length+'/'+qc().length);
  ok('直式無溢出', over()===0, over());
  await gen({optLayout:'h'});
  set('optGrade','p6l'); await wait(350);
  const t6=[...$('optTopic').options].map(o=>o.value);
  ok('轉年級課題更新（p6l）', t6.includes('概率')&&t6.includes('平均數'), t6.slice(0,6).join(','));
  set('optGrade','p4u'); await wait(350);
  ok('轉年級保留/更新課題（p4u）', [...$('optTopic').options].map(o=>o.value).includes('因數'), '');
  for (const [c,pr] of [['60','8'],['6','4'],['1','2']]) {
    await gen({optCount:c, optPerRow:pr});
    ok(`題數=${c} 每行=${pr} → ${qc().length} 格、無溢出`, qc().length>0 && over()===0, qc().length+' / over '+over());
  }
  await gen({optGrade:'p3u', optTopic:'除法', optCount:'18'});
  const saved=JSON.parse(localStorage.getItem('me_prefs')||'{}');
  ok('設定存 localStorage', saved.grade==='p3u'&&saved.topic==='除法'&&String(saved.count)==='18', JSON.stringify(saved).slice(0,110));
  openA4Preview(); await wait(500);
  ok('A4 預覽開 + 有內容', $('a4PreviewOverlay').classList.contains('show') && $('a4PreviewFrame').innerHTML.length>300,
     $('a4PreviewFrame').innerHTML.length);
  closeA4Preview(); await wait(250);
  ok('A4 預覽關', !$('a4PreviewOverlay').classList.contains('show'), '');
  $('optTitle').value='數學練習'; $('optName').value='陳小明'; $('optScore').value='＿＿/100';
  document.querySelector('.btn-gen').click(); await wait(350);
  ok('標題入 ws-title', $('wsTitle').textContent.includes('數學練習'), $('wsTitle').textContent);
  ok('姓名/分數入 meta', $('wsMeta').textContent.includes('陳小明')&&$('wsMeta').textContent.includes('100'), $('wsMeta').textContent.slice(0,50));

  // auto-regenerate：改選項唔撳掣都會更新
  $('optCount').value='12'; fire($('optCount'),'change'); await wait(700);
  ok('改題數自動重新產生（毋須撳掣）', qc().length===12, qc().length + ' 格 / topic=' + $('optTopic').value);
  $('optGrade').value='p6l'; fire($('optGrade'),'change'); await wait(700);
  ok('改年級自動重新產生', qc().length>0 && $('optTopic').options.length>10, qc().length + ' 格 / 課題數=' + $('optTopic').options.length);
  $('optPerRow').value='4'; fire($('optPerRow'),'change'); await wait(700);
  ok('改每行格數自動重新產生', document.querySelectorAll('.qrow').length>0, document.querySelectorAll('.qrow').length + ' 行');
  // 空課題（移除後 generate 應該出提示而唔係 alert）
  const sel=$('optTopic'); sel.innerHTML='<option value="">— 選擇課題 —</option>'; sel.value='';
  document.querySelector('.btn-gen').click(); await wait(300);
  ok('冇課題 → 版面提示（唔係 alert）', !!document.querySelector('.empty-hint'), !!document.querySelector('.empty-hint'));
  ok('全程無 JS error', errs.length===0, errs.slice(0,2).join(' | '));
  return R;
};
