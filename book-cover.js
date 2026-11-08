const BookCover = (() => {
  let generation=0;
  const safe = value => typeof value==='string' && value.length<=180000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
  function html(b,i=0) {
    return safe(b.coverData)?`<div class="cover cover-photo"><img src="${b.coverData}" alt="${esc(b.title)}的封面" loading="lazy"></div>`:`<div class="cover c${i%3}" aria-hidden="true">${esc(b.title)}</div>`;
  }
  function paint() {
    const value=document.querySelector('[name="coverData"]').value;
    const preview=document.querySelector('#cover-preview');
    preview.replaceChildren();
    if(safe(value)){const img=document.createElement('img');img.src=value;img.alt='当前书籍封面';preview.appendChild(img);}
    else preview.textContent='暂无封面';
    document.querySelector('#cover-remove').hidden=!value;
  }
  function reset(b) {
    generation++;
    document.querySelector('[name="coverData"]').value=safe(b?.coverData)?b.coverData:'';
    document.querySelector('#cover-upload').value='';
    document.querySelector('#book-save').disabled=false;
    document.querySelector('#cover-feedback').textContent='支持 JPG、PNG、WebP，图片会自动缩小并保存在本浏览器。';
    paint();
  }
  async function compress(file) {
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('请选择 JPG、PNG 或 WebP 图片');
    if(file.size>12*1024*1024)throw Error('图片超过 12 MB，请选择较小的图片');
    const url=URL.createObjectURL(file);
    try {
      const img=new Image();img.src=url;await img.decode();
      if(!img.naturalWidth||!img.naturalHeight)throw Error('无法读取这张图片');
      const scale=Math.min(1,420/img.naturalWidth,600/img.naturalHeight);
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      let data=canvas.toDataURL('image/jpeg',.82);
      if(data.length>160000)data=canvas.toDataURL('image/jpeg',.6);
      if(!safe(data))throw Error('图片仍然过大，请选择更简单或更小的图片');
      return data;
    }finally{URL.revokeObjectURL(url);}
  }
  function install() {
    document.querySelector('#cover-upload').onchange=async e=>{
      const file=e.target.files[0];if(!file)return;const ticket=++generation;
      document.querySelector('#book-save').disabled=true;
      document.querySelector('#cover-feedback').textContent='正在准备封面…';
      try{const data=await compress(file);if(ticket!==generation)return;document.querySelector('[name="coverData"]').value=data;paint();document.querySelector('#cover-feedback').textContent='封面已准备好，点击「保存记录」后生效。';}
      catch(err){if(ticket===generation)document.querySelector('#cover-feedback').textContent=err.message||'图片无法读取，请换一张试试';}
      finally{if(ticket===generation)document.querySelector('#book-save').disabled=false;}
    };
    document.querySelector('#cover-remove').onclick=()=>{generation++;document.querySelector('[name="coverData"]').value='';document.querySelector('#cover-upload').value='';document.querySelector('#book-save').disabled=false;document.querySelector('#cover-feedback').textContent='保存后移除封面。';paint();};
    const search=document.querySelector('#version-search'),title=document.querySelector('[name="title"]'),isbn=document.querySelector('[name="isbn"]');
    const update=()=>{const q=isbn.value.trim()||title.value.trim();search.href='https://www.douban.com/search?cat=1001&q='+encodeURIComponent(q);};
    title.addEventListener('input',update);isbn.addEventListener('input',update);
    search.onclick=e=>{update();if(!title.value.trim()&&!isbn.value.trim()){e.preventDefault();toast('先填写书名或 ISBN，再去豆瓣选择版本');title.focus();}};
  }
  return {html,reset,install,safe,compress};
})();
