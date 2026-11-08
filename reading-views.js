const ReadingViews = (() => {
  let chosenYear='all', sort='newest';
  const dateYear=b=>/^\d{4}-\d{2}-\d{2}$/.test(b.date||'')?b.date.slice(0,4):'';
  const star=b=>Number(b.rating)>0?`<span class="stars" aria-label="${Number(b.rating)} 星">${'★'.repeat(Math.min(5,Number(b.rating)))}</span>`:'';
  function selectBooks(source=books) {
    const q=query.trim().toLocaleLowerCase();
    const base=source.filter(b=>(chosenYear==='all'||(chosenYear==='unknown'?!dateYear(b):dateYear(b)===chosenYear))&&[b.title,b.author,b.translator,b.isbn].filter(Boolean).join(' ').toLocaleLowerCase().includes(q));
    const list=base.filter(b=>filter==='all'||b.status===filter);
    list.sort((a,b)=>{
      if(sort==='title')return a.title.localeCompare(b.title,'zh-CN');
      if(sort==='rating')return (Number(b.rating)||0)-(Number(a.rating)||0)||(b.date||'').localeCompare(a.date||'')||a.title.localeCompare(b.title,'zh-CN');
      if(!a.date&&!b.date)return a.title.localeCompare(b.title,'zh-CN');
      if(!a.date)return 1;if(!b.date)return -1;
      return (sort==='oldest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date))||a.title.localeCompare(b.title,'zh-CN');
    });
    return {base,list};
  }
  function entry(b,i=0){return `<article class="shelf-entry">${cover(b,i)}<div class="shelf-info"><div class="shelf-title"><h2>${esc(b.title)}</h2><span class="tag">${statusName[b.status]}</span></div><p class="shelf-author">${esc(b.author||'作者未填写')}${b.translator?`<span> · ${esc(b.translator)} 译</span>`:''}</p><div class="shelf-meta">${star(b)}${b.date?`<time datetime="${esc(b.date)}">${esc(b.date.replaceAll('-','/'))}</time>`:''}</div>${b.edition?`<p class="edition-note">${esc(b.edition)}</p>`:''}${b.review?.trim()?`<p class="shelf-review">${esc(b.review.trim())}</p>`:''}<div class="shelf-actions">${douban(b)}<button class="quiet" data-edit="${esc(b.id)}">编辑 ↗</button></div></div></article>`;}
  function shelf() {
    const {base,list}=selectBooks(),years=[...new Set(books.map(dateYear).filter(Boolean))].sort().reverse();
    return heading('THE BOOKSHELF','我的书单','一本书，一段时光。把读过的世界，轻轻排在这里。')+`<div class="shelf-toolbar"><div class="shelf-tabs" role="group" aria-label="阅读状态">${[['all','全部'],['reading','在读'],['plan','计划读'],['read','已读']].map(([v,n])=>`<button data-filter="${v}" class="${filter===v?'selected':''}" aria-pressed="${filter===v}">${n} <small>${base.filter(b=>v==='all'||b.status===v).length}</small></button>`).join('')}</div><input id="search" aria-label="搜索书名、作者、译者或 ISBN" placeholder="搜索书名、作者、译者…" value="${esc(query)}"><div class="shelf-selects"><label>阅读年份<select id="shelf-year"><option value="all">全部年份</option>${years.map(y=>`<option value="${y}" ${chosenYear===y?'selected':''}>${y} 年</option>`).join('')}${books.some(b=>!dateYear(b))?`<option value="unknown" ${chosenYear==='unknown'?'selected':''}>日期未填写</option>`:''}</select></label><label>排序<select id="shelf-sort">${[['newest','阅读日期：从新到旧'],['oldest','阅读日期：从旧到新'],['rating','评分：从高到低'],['title','书名顺序']].map(([v,n])=>`<option value="${v}" ${sort===v?'selected':''}>${n}</option>`).join('')}</select></label></div></div><div class="shelf-results"><span>${chosenYear==='all'?'全部年份':chosenYear==='unknown'?'日期未填写':chosenYear+' 年'} · ${list.length} 本</span>${filter!=='all'||query||chosenYear!=='all'?'<button class="quiet" id="shelf-reset">重置筛选</button>':''}</div><div class="shelf-list">${list.map(entry).join('')||'<div class="empty">没有符合条件的书籍。试试其他年份，或重置筛选。</div>'}</div><p class="shelf-note">阅读年份取自记录中的日期；已读使用完成日期，日期未填写的记录可单独筛选。</p>`;
  }
  function bind(){if($('#shelf-year'))$('#shelf-year').onchange=e=>{chosenYear=e.target.value;render();};if($('#shelf-sort'))$('#shelf-sort').onchange=e=>{sort=e.target.value;render();};if($('#shelf-reset'))$('#shelf-reset').onclick=()=>{chosenYear='all';sort='newest';filter='all';query='';render();};}
  function annualData(){
    const done=books.filter(b=>b.status==='read'&&dateYear(b)===String(year)),previous=books.filter(b=>b.status==='read'&&dateYear(b)===String(year-1));
    const earlierAuthors=new Set(books.filter(b=>b.status==='read'&&dateYear(b)&&Number(dateYear(b))<year).map(b=>b.author?.trim()).filter(Boolean));
    const authors=new Set(done.map(b=>b.author?.trim()).filter(Boolean)),translators=new Set(done.map(b=>b.translator?.trim()).filter(Boolean));
    const rated=done.filter(b=>Number(b.rating)>0),max=Math.max(0,...rated.map(b=>Number(b.rating)));
    const favorites=rated.filter(b=>Number(b.rating)===max),chronological=[...done].sort((a,b)=>a.date.localeCompare(b.date));
    const newAuthors=[...authors].filter(a=>!earlierAuthors.has(a));
    return {done,previous,authors,translators,rated,favorites,chronological,newAuthors,average:rated.length?(rated.reduce((s,b)=>s+Number(b.rating),0)/rated.length).toFixed(1):'—'};
  }
  function annual(){
    const d=annualData(),{done,previous,authors,translators,rated,favorites,chronological,newAuthors}=d;
    const mini=b=>`<div class="annual-mini">${cover(b)}<div><h3>${esc(b.title)}</h3><p class="muted">${esc(b.author||'作者未填写')}</p>${star(b)}<p class="muted">${esc(b.date)}</p><button class="quiet" data-edit="${esc(b.id)}">打开记录 ↗</button></div></div>`;
    const sentiments=[...done].filter(b=>b.review?.trim()).sort((a,b)=>Number(b.rating)-Number(a.rating)||b.date.localeCompare(a.date));
    return heading('MY YEAR, IN BOOKS','这一年，读出了怎样的自己？','不只数读过多少本，也看看哪些作者、文字和相遇留了下来。')+yearSelect()+(!done.length?'<section class="panel empty">这一年还没有已读记录。把书标为「已读」并填写完成日期，年度故事就会从这里开始。</section>':`<div class="annual-overview"><section class="annual-lead"><p class="eyebrow">${year} · YOUR READING STORY</p><div class="annual-total">${done.length}<span>本书，成为今年的一部分</span></div><p>${previous.length?`比 ${year-1} 年${done.length>=previous.length?'多':'少'}读了 ${Math.abs(done.length-previous.length)} 本。`:`${year-1} 年暂无已读记录，从这一年写起。`}</p><p>与 ${authors.size} 位作者相遇，留下 ${sentiments.length} 篇感想。</p></section><div class="annual-numbers"><div><strong>${newAuthors.length}</strong><span>首次遇见的作者</span></div><div><strong>${translators.size}</strong><span>陪伴阅读的译者</span></div><div><strong>${d.average}</strong><span>平均评分 · ${rated.length} 本已评分</span></div></div></div><section class="panel"><div class="section-head"><h2>年度偏爱</h2><small>${favorites.length>1?'最高评分并列 · '+favorites.length+' 本':'按这一年的最高评分挑选'}</small></div>${favorites.length?`<div class="annual-favorites">${favorites.map(b=>mini(b)).join('')}</div>`:'<p class="muted">还没有评分。为读过的书评上星星，年度偏爱便会出现。</p>'}</section><div class="grid"><section class="panel"><div class="eyebrow">NEW VOICES</div><h2>今年初识的声音</h2><p class="annual-description">在已有阅读记录中，第一次读到他们。</p><div class="author-chips">${newAuthors.map(a=>`<span>${esc(a)}</span>`).join('')||'<p class="muted">今年读的都是熟悉的作者，也是一种重逢。</p>'}</div><p class="annual-footnote">按填写的作者姓名与更早年份的已读记录比较；一条作者字段视为一位。</p></section><section class="panel"><div class="eyebrow">THROUGH ANOTHER VOICE</div><h2>也记得文字的摆渡人</h2><p class="annual-description">把另一种语言带到你眼前的译者。</p><div class="author-chips">${[...translators].map(a=>`<span>${esc(a)}</span>`).join('')||'<p class="muted">暂未填写译者。下次记录一本译作时，也留下他们的名字。</p>'}</div></section></div><div class="grid"><section class="panel"><div class="eyebrow">THE FIRST CHAPTER</div><h2>这一年的开篇</h2>${mini(chronological[0])}</section><section class="panel"><div class="eyebrow">THE LATEST CHAPTER</div><h2>最近合上的一页</h2>${mini(chronological.at(-1))}</section></div>${sentiments.length?`<section class="panel annual-memory"><div class="eyebrow">WORDS I LEFT BEHIND</div><h2>留给这一年的一句回响</h2><blockquote>${esc(sentiments[0].review.trim())}</blockquote><p class="muted">你的《${esc(sentiments[0].title)}》阅读感想 · ${esc(sentiments[0].date)}</p></section>`:''}<p class="shelf-note">报告仅统计 ${year} 年完成的已读书籍；未填日期的书不计入。所有结果随你的记录更新。</p>`);
  }
  return {shelf,annual,bind,selectBooks,annualData};
})();
