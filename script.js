// 工具：简易选择器
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// 导航折叠
(() => {
  const nav = $('.site-nav');
  const btn = $('.nav-toggle');
  if (!nav || !btn) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  // 点击链接后关闭
  $$('#nav-list a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
})();

// 平滑滚动（考虑头部高度）
(() => {
  const header = $('.site-header');
  const offset = () => (header ? header.offsetHeight - 1 : 0);
  $$('.site-nav a, .back-to-top, .hero-cta a').forEach(link => {
    if (!link.hash) return;
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - offset();
      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', id);
    });
  });
})();

// 时间线：可视区动画
(() => {
  const items = $$('.tl-item');
  if (!items.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.2 });
  items.forEach(el => io.observe(el));
})();

// 标签切换（工艺技法）
(() => {
  const tabs = $$('.tab');
  const panels = $$('.tabpanel');
  if (!tabs.length) return;
  function activate(tab) {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    const target = $(tab.dataset.target);
    panels.forEach(p => p.hidden = p !== target);
    tab.focus();
  }
  tabs.forEach(t => t.addEventListener('click', () => activate(t)));
  // 键盘左右切换
  tabs.forEach((t, i) => t.addEventListener('keydown', e => {
    const idx = i + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0);
    if (idx !== i && tabs[idx]) { e.preventDefault(); activate(tabs[idx]); }
  }));
})();

// 图集灯箱
(() => {
  const gallery = $('[data-lightbox="gallery"]');
  const lightbox = $('.lightbox');
  const img = $('.lightbox-img');
  const closeBtn = $('.lightbox-close');
  if (!gallery || !lightbox || !img || !closeBtn) return;
  function open(src, alt) {
    img.src = src; img.alt = alt || '预览图';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
  }
  function close() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    img.removeAttribute('src');
  }
  gallery.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    const src = a.getAttribute('href');
    const alt = $('img', a)?.alt || '预览图';
    open(src, alt);
  });
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// 主题切换
(() => {
  const btn = $('.theme-toggle');
  if (!btn) return;
  const key = 'lp-theme';
  const setTheme = t => {
    document.documentElement.setAttribute('data-theme', t);
    btn.setAttribute('aria-pressed', String(t === 'dark'));
  };
  const saved = localStorage.getItem(key);
  if (saved) setTheme(saved);
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    setTheme(next); localStorage.setItem(key, next);
  });
})();

