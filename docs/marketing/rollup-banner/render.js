const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2], scale = +(process.argv[3]||1);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 850, height: 2000 }, deviceScaleFactor: scale });
  await p.goto('file://' + dir + '/banner.html'); await p.waitForTimeout(500);
  const over = await p.evaluate(() => { const c=document.querySelector('.contact').getBoundingClientRect(); const s=document.querySelector('.stack').getBoundingClientRect(); return {stackBottom:s.bottom, contactTop:c.top, fonts:getComputedStyle(document.body).fontFamily}; });
  console.log(JSON.stringify(over));
  await p.screenshot({ path: dir + `/preview@${scale}x.png` });
  if (process.argv[4]==='pdf') { await p.emulateMedia({media:'print'}); await p.addStyleTag({content:'html{zoom:3.77953}'}); await p.pdf({ path: dir + '/codevertex-rollup-850x2000mm.pdf', width: '850mm', height: '2000mm', printBackground: true }); }
  await b.close();
})();
