const CountrySearch = (()=>{
  const countries=WORLD_COUNTRIES.features.filter(f=>f.properties.code!=='ATA').map(f=>f.properties).sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
  const aliases={USA:'美国 美 美利坚 us united states',GBR:'英国 英 uk united kingdom',CHN:'中国 中 china',JPN:'日本 日 japan',FRA:'法国 法 france',DEU:'德国 德 germany',RUS:'俄罗斯 俄 russia',KOR:'韩国 韩 korea',COL:'哥伦比亚 colombia'};
  function options(query='',selected=''){
    const q=query.trim().toLowerCase();
    const matches=countries.filter(c=>!q||(c.name+' '+c.code+' '+(aliases[c.code]||'')).toLowerCase().includes(q));
    const select=document.querySelector('[name="country"]');
    select.innerHTML=`<option value="">${matches.length?'暂不选择':'没有匹配项，请换个关键词'}</option>`+matches.map(c=>`<option value="${c.code}" ${c.code===selected?'selected':''}>${esc(c.name)}</option>`).join('');
    const exact=countries.find(c=>c.name===query.trim()||c.code.toLowerCase()===q);
    if(exact&&matches.some(c=>c.code===exact.code))select.value=exact.code;
    $('#country-search-info').textContent=q?`找到 ${matches.length} 个国家／地区，请从列表选择。`:'可直接使用下拉列表，或先输入名称筛选。';
  }
  function reset(value=''){$('#country-search').value='';options('',value);document.querySelector('[name="country"]').value=value;}
  function install(){$('#country-search').oninput=e=>options(e.target.value,document.querySelector('[name="country"]').value);reset();}
  function validate(){if($('#country-search').value.trim()&&!document.querySelector('[name="country"]').value){toast('请在筛选后的列表中选择国家／地区，或清空搜索');document.querySelector('[name="country"]').focus();return false;}return true;}
  return {install,reset,validate};
})();
