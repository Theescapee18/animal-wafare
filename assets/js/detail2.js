// 猫咪详情页 v2：档案 + 全部照片 + 灯箱
// 相对 v1 的差异：样式改由 style2.css 控制，返回链接指向 index2.html
// v1 已有的能力（去 inline style、缩略图 + 原图灯箱、键盘操作、照片序号）全部保留
(function () {
  const cats = window.CATS_DATA || [];
  const id = new URLSearchParams(location.search).get('id');
  const cat = cats.find(c => c.id === id) || cats[0];
  const root = document.getElementById('detailRoot');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCount = document.getElementById('lightboxCount');

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const thumb = p => String(p).replace('assets/images/cats/', 'assets/images/cats/thumbs/');

  if (!cat) {
    root.innerHTML = '<div class="empty"><div class="icon">😿</div>未找到该猫咪</div>';
    return;
  }

  document.title = cat.name + ' - 农大猫猫档案';

  const memorial = /去世|喵星|虐杀|车祸/.test((cat.health || '') + (cat.name || '') + (cat.adoptable || ''));

  const fields = [
    ['年龄', cat.age], ['性别', cat.gender], ['品种', cat.breed],
    ['疫苗', cat.vaccine], ['驱虫', cat.deworm], ['绝育', cat.neutered],
    ['可领养', cat.adoptable], ['健康状况', cat.health],
  ].filter(([, v]) => v && v !== '-')
   .map(([k, v]) => `<div class="info-item"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`)
   .join('');

  // 每张照片套一层 figure，右下角标序号
  const total = (cat.images || []).length;
  const gallery = total
    ? `<h3 class="gallery-title">照片（${total}）</h3>
       <div class="gallery">${cat.images.map((p, i) =>
          `<figure class="ph">
             <img src="./${esc(thumb(p))}" data-full="./${esc(p)}" data-idx="${i}" loading="lazy" decoding="async"
                  alt="${esc(cat.name)} 的第 ${i + 1} 张照片" tabindex="0" role="button">
             <figcaption class="ph-no">${i + 1}</figcaption>
           </figure>`
        ).join('')}</div>`
    : '<p class="gallery-empty">该猫咪暂无照片记录</p>';

  root.innerHTML = `
    <a class="back" href="index2.html">← 返回列表</a>
    <div class="detail-head">
      <h1>${esc(cat.name)}</h1>
      <span class="gender">${cat.gender === '母' ? '♀' : cat.gender === '公' ? '♂' : ''}</span>
      ${memorial ? '<span class="ribbon memorial static">🕯️ 怀念</span>' : ''}
    </div>
    <div class="detail-card">
      ${cat.personality ? `<div class="personality">💬 ${esc(cat.personality)}</div>` : ''}
      <div class="info-grid">${fields || '<div class="info-item"><div class="k">状态</div><div class="v">信息待补充</div></div>'}</div>
      ${gallery}
    </div>`;

  // 灯箱：打开原图而不是缩略图，保证清晰度；底部显示第几张 / 共几张
  function openLightbox(img) {
    lightboxImg.src = img.dataset.full || img.src;
    lightboxImg.alt = img.alt || '';
    const idx = Number(img.dataset.idx);
    lightboxCount.textContent = Number.isFinite(idx) ? (idx + 1) + ' / ' + total : '';
    lightbox.classList.add('show');
    lightboxImg.focus();
  }

  root.addEventListener('click', e => {
    const img = e.target.closest('.gallery img');
    if (img) openLightbox(img);
  });

  root.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const img = e.target.closest('.gallery img');
    if (!img) return;
    e.preventDefault();
    openLightbox(img);
  });

  lightbox.addEventListener('click', () => lightbox.classList.remove('show'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('show'); });
})();
