const literaryMap = (() => {
  let region = 'world', selected = '', scope = 'all';
  const palette = ['#eeeee3','#d6e1c5','#b4c69e','#8da77c','#607f60','#345643'];
  const countries = WORLD_COUNTRIES.features;
  const byCode = new Map(countries.map(f=>[f.properties.code,f]));
  const name = code => byCode.get(code)?.properties.name || '待补充';
  const color = n => palette[n===0?0:n===1?1:n<=4?2:n<=9?3:n<=19?4:5];
  const demoCountries = {'d1':'JPN','d2':'CHN','d3':'USA','d4':'COL'};
  function country(b) { return b.country || (isDemo ? demoCountries[b.id] || '' : ''); }
  function data() {
    const records = books.filter(b=>scope==='all'||b.status===scope);
    const groups = new Map();
    records.forEach(b=>{const code=country(b);if(byCode.has(code)){if(!groups.has(code))groups.set(code,[]);groups.get(code).push(b);}});
    return {records,groups,rank:[...groups].sort((a,b)=>b[1].length-a[1].length||name(a[0]).localeCompare(name(b[0]),'zh-CN'))};
  }
  function renderMap(groups) {
    let projection;
    if(region==='world') projection=d3.geoNaturalEarth1().fitExtent([[16,20],[984,590]],{type:'FeatureCollection',features:countries.filter(f=>f.properties.code!=='ATA')});
    else projection=d3.geoMercator().center(region==='europe'?[15,52]:[119,35]).scale(region==='europe'?760:620).translate([500,300]).clipExtent([[0,0],[1000,610]]);
    const path=d3.geoPath(projection);
    const shapes=countries.filter(f=>f.properties.code!=='ATA').map(f=>{
      const code=f.properties.code,n=groups.get(code)?.length||0, title=`${f.properties.name} · ${n} 本`;
      return `<path d="${path(f)||''}" fill="${color(n)}" class="atlas-country ${selected===code?'is-selected':''}" data-country="${code}" tabindex="${n?0:-1}" role="button" aria-label="${esc(title)}" aria-pressed="${selected===code}"><title>${esc(title)}${n?' · 点击查看作者与书目':''}</title></path>`;
    }).join('');
    // Avoid overlapping country labels; small European countries remain available in the ranking.
    const occupied=[];
    const labels=[...groups].sort((a,b)=>b[1].length-a[1].length).map(([code,list])=>{
      const f=byCode.get(code), xy=projection(f.properties.label), text=`${name(code)} ${list.length}`;
      if(!xy||xy[0]<30||xy[0]>970||xy[1]<18||xy[1]>585)return '';
      const box=[xy[0]-text.length*5,xy[1]-10,xy[0]+text.length*5,xy[1]+10];
      if(occupied.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))return '';
      occupied.push(box);
      return `<text class="atlas-label" x="${xy[0]}" y="${xy[1]}" text-anchor="middle">${esc(text)}</text>`;
    }).join('');
    return `<svg class="atlas-svg" viewBox="0 0 1000 610" aria-label="按作者所属国家或地区统计的阅读分布地图"><defs><clipPath id="atlas-clip"><rect width="1000" height="610"/></clipPath></defs><g clip-path="url(#atlas-clip)">${shapes}${labels}</g></svg>`;
  }
  function render() {
    const {records,groups,rank}=data(), matched=[...groups.values()].flat().length, pending=records.length-matched;
    const list=selected==='pending'?records.filter(b=>!byCode.has(country(b))):(groups.get(selected)||[]);
    return heading('A LITERARY ATLAS','书页抵达的地方','从一位作者到一片土地，让阅读在世界上留下自己的颜色。')+
      `<div class="atlas-controls"><span>按作者所属国家／地区统计</span><div role="group" aria-label="统计阅读状态">${[['all','全部书籍'],['read','已读'],['reading','在读'],['plan','计划读']].map(([v,t])=>`<button class="${scope===v?'selected':''}" data-map-scope="${v}" aria-pressed="${scope===v}">${t}</button>`).join('')}</div></div>
      <section class="atlas-stats" aria-label="地图统计"><div><strong>${groups.size}</strong><span>个国家／地区标记</span></div><div><strong>${matched}<em> / ${records.length}</em></strong><span>本已填写国家信息</span></div><button data-country="pending" class="${selected==='pending'?'chosen':''}"><strong>${pending}</strong><span>本待补充，暂不落点 ↗</span></button></section>
      <div class="atlas-layout"><section class="atlas-frame"><div class="atlas-top"><span>点击着色区域，查看作者与书目</span><div class="atlas-tabs" role="group" aria-label="地图视角">${[['world','世界'],['europe','欧洲'],['eastasia','东亚']].map(([v,t])=>`<button data-region="${v}" class="${region===v?'selected':''}" aria-pressed="${region===v}">${t}</button>`).join('')}</div></div>${renderMap(groups)}<div class="atlas-legend">${['无标记','1本','2–4','5–9','10–19','20+'].map((t,i)=>`<span><i style="background:${palette[i]}"></i>${t}</span>`).join('')}</div></section>
      <section class="atlas-ranking"><h2>书页抵达的地方</h2><p>以书为单位，收藏阅读的广度</p><div class="rank-list">${rank.map(([code,items],i)=>`<button data-country="${code}" class="rank-row ${selected===code?'chosen':''}" aria-pressed="${selected===code}"><span class="rank-no">${String(i+1).padStart(2,'0')}</span><span class="rank-name">${esc(name(code))}</span><span class="rank-track"><i style="width:${items.length/rank[0][1].length*100}%"></i></span><span class="rank-count">${items.length}</span></button>`).join('')||'<div class="empty">补充作者所属国家后，<br>你的阅读足迹会在这里生长。</div>'}</div></section></div>
      <div class="atlas-source"><span>同一本书仅计入一个主要国家／地区；故事发生地另行保留。地图颜色随记录自动更新。</span><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">地图数据：Natural Earth ↗</a></div>
      <section class="atlas-detail" aria-live="polite"><div class="section-head"><div><div class="eyebrow">${selected==='pending'?'TO BE DISCOVERED':'BOOKS & WRITERS'}</div><h2>${selected?selected==='pending'?'等待补上的文学坐标':esc(name(selected))+' · '+list.length+' 本':'从地图上，打开一段阅读'}</h2></div>${selected?'<button class="quiet" data-country="">收起详情 ✕</button>':''}</div>${!selected?'<p class="muted">选择一个着色国家或右侧排行，查看相关作者、书籍和感想。未填写的旧记录会留在「待补充」中。</p>':list.length?`<div class="atlas-books">${list.map((b,i)=>`<article class="atlas-book">${cover(b,i)}<div><span class="tag">${statusName[b.status]}</span><h3>${esc(b.title)}</h3><p class="muted">${esc(b.author||'作者未填写')}${selected!=='pending'?' · '+esc(name(country(b))):''}</p>${b.place?`<p class="muted">故事／联想地点：${esc(b.place)}</p>`:''}${b.review?`<p class="atlas-excerpt">${esc(b.review)}</p>`:''}<div class="atlas-book-actions">${douban(b)}<button class="quiet" data-edit="${esc(b.id)}">${selected==='pending'?'补充国家':'编辑记录'} ↗</button></div></div></article>`).join('')}</div>`:'<p class="muted">当前筛选下没有关联书籍。</p>'}</section>`;
  }
  function bind() {
    document.querySelectorAll('[data-country]').forEach(el=>{
      const activate=()=>{selected=el.dataset.country;window.render();};el.onclick=activate;
      if(el.tagName.toLowerCase()==='path')el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};
    });
    document.querySelectorAll('[data-region]').forEach(el=>el.onclick=()=>{region=el.dataset.region;window.render();});
    document.querySelectorAll('[data-map-scope]').forEach(el=>el.onclick=()=>{scope=el.dataset.mapScope;selected='';window.render();});
  }
  function setupEditor(){
    const select=document.querySelector('[name="country"]');
    select.innerHTML='<option value="">待补充，暂不落点</option>'+countries.filter(f=>f.properties.code!=='ATA').sort((a,b)=>a.properties.name.localeCompare(b.properties.name,'zh-CN')).map(f=>`<option value="${f.properties.code}">${esc(f.properties.name)}</option>`).join('');
  }
  return {render,bind,setupEditor,country};
})();
