// 猫咪列表页 v2：渲染卡片 / 表格、搜索与筛选、随机抽一只
// 相对 v1 的差异：
//   1. 随机按钮优先在「非怀念」的猫里抽，避免一上来就抽到已去世的档案
//   2. 详情页跳转目标改为 cat-detail2.html
// v1 已有的能力（缩略图、图为主卡片、流光占位、键盘聚焦）全部保留
(function () {
  const cats = window.CATS_DATA || [];
  const gridEl = document.getElementById('grid');
  const tableWrapEl = document.getElementById('tableWrap');
  const searchEl = document.getElementById('searchInput');
  const chipsEl = document.getElementById('chips');
  const viewToggleEl = document.getElementById('viewToggle');
  const randomBtn = document.getElementById('randomBtn');
  const statTotal = document.getElementById('statTotal');
  const statAdopt = document.getElementById('statAdopt');
  const statPhoto = document.getElementById('statPhoto');

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // 原图路径 -> 缩略图路径
  const thumb = p => String(p).replace('assets/images/cats/', 'assets/images/cats/thumbs/');

  const isMemorial = c => /去世|喵星|虐杀|车祸/.test((c.health || '') + (c.name || '') + (c.adoptable || ''));
  const isAdoptable = c => c.adoptable === '是' && !isMemorial(c);

  // 顶部统计
  statTotal.textContent = cats.length;
  statAdopt.textContent = cats.filter(isAdoptable).length;
  statPhoto.textContent = cats.reduce((n, c) => n + (c.images ? c.images.length : 0), 0);

  let filter = 'all';
  let view = 'grid';

  function currentList() {
    const kw = (searchEl.value || '').trim().toLowerCase();
    return cats.filter(c => {
      if (filter === 'adopt' && !isAdoptable(c)) return false;
      if (filter === 'memorial' && !isMemorial(c)) return false;
      if (filter === 'photo' && !(c.images && c.images.length)) return false;
      if (kw) {
        const hay = [c.name, c.personality, c.breed, c.age, c.health, c.adoptable].join(' ').toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }

  function statusTag(label, val) {
    if (!val || val === '-') return '';
    let cls = '';
    if (val === '是') cls = ' yes';
    else if (val === '否') cls = ' no';
    else if (/口炎|去世|喵星|车祸|传腹|出走|未知|不确定/.test(val)) cls = ' warn';
    return `<span class="tag${cls}">${label}: ${esc(val)}</span>`;
  }

  function ribbon(c) {
    if (isMemorial(c)) return '<span class="ribbon memorial">怀念</span>';
    if (isAdoptable(c)) return '<span class="ribbon">可领养</span>';
    if (c.adoptable === '有主人') return '<span class="ribbon no">有主人</span>';
    return '';
  }

  // 图片加载完成后撤掉占位流光
  function bindCoverLoading(scope) {
    scope.querySelectorAll('.cover').forEach(cover => {
      const img = cover.querySelector('img');
      if (!img) { cover.classList.add('loaded'); return; }
      if (img.complete) { cover.classList.add('loaded'); return; }
      img.addEventListener('load', () => cover.classList.add('loaded'), { once: true });
      img.addEventListener('error', () => cover.classList.add('loaded'), { once: true });
    });
  }

  function renderGrid(list, animate) {
    if (!list.length) {
      gridEl.innerHTML = '<div class="empty"><div class="icon">🐱</div>没有找到匹配的猫咪</div>';
      return;
    }
    gridEl.innerHTML = list.map((c, idx) => {
      const cover = c.images && c.images.length
        ? `<img src="./${esc(thumb(c.images[0]))}" alt="${esc(c.name)}" loading="lazy" decoding="async">`
        : '<div class="no-photo">🐾</div>';
      const meta = [c.age ? esc(c.age) : '', esc(c.breed)].filter(x => x && x !== '-').join(' · ');
      const gender = c.gender === '母' ? '♀' : c.gender === '公' ? '♂' : '';
      const tags = [
        statusTag('疫苗', c.vaccine), statusTag('绝育', c.neutered),
        statusTag('健康', c.health), statusTag('领养', c.adoptable),
      ].join('');
      return `<div class="card${animate ? ' animate' : ''}" style="${animate ? '--i:' + Math.min(idx, 16) : ''}" data-id="${esc(c.id)}" tabindex="0" role="button" aria-label="${esc(c.name)} 的档案">
        <div class="cover">
          ${cover}
          ${ribbon(c)}
          <div class="cover-title"><span class="name">${esc(c.name)}</span><span class="gender">${gender}</span></div>
        </div>
        <div class="body">
          <div class="meta">${meta}</div>
          <div class="desc">${esc(c.personality)}</div>
          <div class="tags">${tags}</div>
        </div>
      </div>`;
    }).join('');
    bindCoverLoading(gridEl);
  }

  function renderTable(list) {
    if (!list.length) {
      tableWrapEl.innerHTML = '<div class="empty"><div class="icon">🐱</div>没有找到匹配的猫咪</div>';
      return;
    }
    const rows = list.map(c => {
      const imgs = (c.images || []).slice(0, 3)
        .map(p => `<img class="thumb" src="./${esc(thumb(p))}" loading="lazy" decoding="async" alt="">`).join('');
      return `<tr data-id="${esc(c.id)}" tabindex="0" role="button" aria-label="查看 ${esc(c.name)} 的档案">
        <td><b>${esc(c.name)}</b></td><td>${esc(c.personality)}</td><td>${esc(c.age)}</td>
        <td>${esc(c.gender)}</td><td>${esc(c.breed)}</td><td>${esc(c.vaccine)}</td>
        <td>${esc(c.deworm)}</td><td>${esc(c.neutered)}</td><td>${esc(c.adoptable)}</td>
        <td>${esc(c.health)}</td><td>${imgs || '-'}</td></tr>`;
    }).join('');
    tableWrapEl.innerHTML = `<table class="md-table">
      <thead><tr><th>名字</th><th>性格</th><th>年龄</th><th>性别</th><th>品种</th><th>疫苗</th><th>驱虫</th><th>绝育</th><th>领养</th><th>健康</th><th>照片</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
  }

  function render(animate) {
    const list = currentList();
    if (view === 'grid') { gridEl.style.display = ''; tableWrapEl.style.display = 'none'; renderGrid(list, animate); }
    else { gridEl.style.display = 'none'; tableWrapEl.style.display = ''; renderTable(list); }
  }

  // 事件
  // 搜索边打边筛，不做逐字入场动画，避免闪烁
  searchEl.addEventListener('input', () => render(false));
  chipsEl.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chipsEl.querySelectorAll('.chip').forEach(x => {
      x.classList.remove('active');
      x.setAttribute('aria-pressed', 'false');
    });
    chip.classList.add('active');
    chip.setAttribute('aria-pressed', 'true');
    filter = chip.dataset.filter;
    render(true);
  });
  viewToggleEl.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    viewToggleEl.querySelectorAll('button').forEach(x => {
      x.classList.remove('active');
      x.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    view = btn.dataset.view;
    render(true);
  });

  function openDetail(id) {
    location.href = 'cat-detail2.html?id=' + id;
  }

  document.body.addEventListener('click', e => {
    const el = e.target.closest('[data-id]');
    if (el) openDetail(el.dataset.id);
  });

  // 键盘：Tab 聚焦卡片/行，Enter 或空格进入详情
  document.body.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-id]');
    if (!el) return;
    e.preventDefault();
    openDetail(el.dataset.id);
  });

  // 随机抽一只猫：滚到那张卡片并脉冲高亮，不打断当前浏览
  let resetTimer = null;
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      // 表格视图下先切回卡片，否则没有卡片可高亮
      if (view === 'table') {
        view = 'grid';
        viewToggleEl.querySelectorAll('button').forEach(x => {
          const on = x.dataset.view === 'grid';
          x.classList.toggle('active', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        render(false);
      }

      const list = currentList();
      if (!list.length) return;
      // 优先在「非怀念」的猫里抽，避免一打开随机就抽到已去世的档案，情绪上很突兀
      const alive = list.filter(c => !isMemorial(c));
      const pool = alive.length ? alive : list;
      const pick = pool[Math.floor(Math.random() * pool.length)];

      // 用 dataset 比较而不是拼选择器，避免 id 中的特殊字符破坏 CSS 选择器
      const card = Array.prototype.find.call(gridEl.children, el => el.dataset.id === pick.id);
      if (!card) return;

      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('animate');
      void card.offsetWidth; // 强制重排，让动画可以重复触发
      card.classList.add('flash');
      setTimeout(() => card.classList.remove('flash'), 2600);

      randomBtn.textContent = '🎲 ' + pick.name;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { randomBtn.textContent = '🎲 随机'; }, 2600);
    });
  }

  render(true);
})();
