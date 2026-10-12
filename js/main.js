/* =========================================================
   Медоносы и опылители — интерактив
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth <= 800;

  /* ---------- 1. Разбивка заголовка на буквы ---------- */
  let d = 0;
  $$('.split').forEach(el => {
    const txt = el.textContent;
    el.innerHTML = '';
    [...txt].forEach(c => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? '\u00A0' : c;
      s.style.setProperty('--d', d++);
      el.appendChild(s);
    });
  });

  /* ---------- 2. Карточки медоносов ---------- */
  const track = $('#plantsTrack');
  track.innerHTML = PLANTS.map((p, i) => `
    <button class="card" data-id="${p.id}" aria-label="${p.name}: подробнее">
      <div class="card__img">
        <img src="${p.img}" alt="${p.name}" loading="lazy" width="900" height="1200">
        <span class="card__num">${String(i + 1).padStart(2, '0')} / ${String(PLANTS.length).padStart(2, '0')}</span>
        <span class="card__fact">${p.fact}</span>
      </div>
      <div class="card__info">
        <div>
          <span class="card__name">${p.short}</span>
          <span class="card__kind">${p.kind}</span>
        </div>
        <span class="card__arrow" aria-hidden="true">→</span>
      </div>
    </button>`).join('');

  /* ---------- 3. Матрица селекции ---------- */
  const chips = $('#chips');
  const matrix = $('#matrix');
  let activeTrait = null;

  chips.innerHTML = Object.entries(TRAITS).map(([k, v]) => {
    const n = PLANTS.filter(p => p.traits.includes(k)).length;
    return `<button class="chip" data-trait="${k}" aria-pressed="false">${v}<small>${n}</small></button>`;
  }).join('');

  matrix.innerHTML = PLANTS.map(p => `
    <li class="row" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.name}: подробнее">
      <div class="row__thumb"><img src="${p.img}" alt="" loading="lazy"></div>
      <div class="row__name">${p.short}</div>
      <div class="row__tags">${p.traits.map(t => `<span data-t="${t}">${TRAITS[t]}</span>`).join('')}</div>
      <span class="row__go" aria-hidden="true">→</span>
    </li>`).join('');

  chips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const t = chip.dataset.trait;
    activeTrait = activeTrait === t ? null : t;
    $$('.chip', chips).forEach(c => {
      const on = c.dataset.trait === activeTrait;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on);
    });
    $$('.row', matrix).forEach(r => {
      const p = PLANTS.find(x => x.id === r.dataset.id);
      r.classList.toggle('dim', !!activeTrait && !p.traits.includes(activeTrait));
      $$('span[data-t]', r).forEach(s => s.classList.toggle('hit', s.dataset.t === activeTrait));
    });
  });

  /* ---------- 4. Панель с подробностями ---------- */
  const drawer = $('#drawer');
  let current = 0;

  function fillDrawer(i) {
    const p = PLANTS[i];
    current = i;
    $('#drawerImg').src = p.img;
    $('#drawerImg').alt = p.name;
    $('#drawerKind').textContent = `${String(i + 1).padStart(2, '0')} · ${p.kind}`;
    $('#drawerTitle').textContent = p.name;
    $('#drawerLatin').textContent = p.latin;
    $('#drawerText').innerHTML = p.text.map(t =>
      typeof t === 'string'
        ? `<p>${t}</p>`
        : `<dl>${t.dl.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`
    ).join('');
    $('#drawerList').innerHTML = p.directions.map(x => `<li>${x}</li>`).join('');
    $('.drawer__body').scrollTop = 0;
  }

  function openDrawer(id) {
    fillDrawer(PLANTS.findIndex(p => p.id === id));
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('.drawer__close').focus(), 50);
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function step(dir) {
    const body = $('.drawer__body');
    const img = $('#drawerImg');
    body.style.opacity = 0; img.style.opacity = 0;
    setTimeout(() => {
      fillDrawer((current + dir + PLANTS.length) % PLANTS.length);
      body.style.opacity = 1; img.style.opacity = 1;
    }, 250);
  }
  $('.drawer__body').style.transition = 'opacity .25s';

  document.addEventListener('click', e => {
    const card = e.target.closest('.card, .row');
    if (card && !dragMoved) openDrawer(card.dataset.id);
    if (e.target.closest('[data-close]')) closeDrawer();
  });
  matrix.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('row')) { e.preventDefault(); openDrawer(e.target.dataset.id); }
  });
  $('#drawerPrev').addEventListener('click', () => step(-1));
  $('#drawerNext').addEventListener('click', () => step(1));
  document.addEventListener('keydown', e => {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  /* ---------- 5. Слова манифеста ---------- */
  const mText = $('[data-words]');
  mText.innerHTML = mText.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', mText);

  /* ---------- 6. Появление элементов ---------- */
  $$('.record, .pollinators__intro, .records .h2, .selection .h2, .chips, .plants__head, .meadow__quote').forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: .25 });
  $$('.reveal, .pol').forEach(el => io.observe(el));

  /* ---------- 7. Счётчики ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const end = parseFloat(el.dataset.count);
    const dec = +el.dataset.decimals || 0;
    const plain = 'plain' in el.dataset;
    const fmt = v => {
      const s = v.toFixed(dec).replace('.', ',');
      return plain ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    };
    if (reduced) { el.textContent = fmt(end); return; }
    const start = plain ? end - 30 : 0;
    const t0 = performance.now(), dur = 1800;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(start + (end - start) * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- 8. Горизонтальная прокрутка медоносов ---------- */
  const plants = $('#plants');
  const sticky = $('.plants__sticky');
  const bar = $('#plantsBar');
  let travel = 0;

  function sizePlants() {
    if (isMobile()) { plants.style.height = ''; travel = 0; return; }
    travel = Math.max(0, track.scrollWidth - innerWidth);
    plants.style.height = (innerHeight + travel) + 'px';
  }

  // перетаскивание ленты мышью на мобильной ленте не нужно; флаг для кликов
  let dragMoved = false;

  /* ---------- 9. Пчела за курсором ---------- */
  const bee = $('.cursor-bee');
  let mx = innerWidth / 2, my = innerHeight / 2, bx = mx, by = my, facing = 1, tilt = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    bee.classList.add('on');
  });
  document.addEventListener('mouseleave', () => bee.classList.remove('on'));

  /* ---------- 10. Шапка, меню, прогресс ---------- */
  const header = $('.header');
  const prog = $('.progress span');
  let lastY = scrollY;

  $('.burger').addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    $('.burger').setAttribute('aria-expanded', open);
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  const sections = ['plants', 'records', 'selection', 'pollinators'].map(id => document.getElementById(id));
  const navLinks = $$('.nav a');

  /* ---------- 11. Главный цикл анимации ---------- */
  const heroBee = $('[data-parallax]');
  const meadowImg = $('.meadow__img');
  const pols = $$('.pol');

  function frame() {
    const y = scrollY, vh = innerHeight;

    // прогресс
    prog.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - vh)})`;

    // шапка
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;

    // активный пункт меню
    let act = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * .4) act = i; });
    navLinks.forEach((a, i) => a.classList.toggle('active', i === act));

    if (!reduced) {
      // параллакс пчелы в hero
      const px = (mx / innerWidth - .5) * 30, py = (my / innerHeight - .5) * 30;
      heroBee.style.transform = `translate(${px}px, ${py + y * .35}px)`;

      // горизонтальная лента
      if (travel) {
        const r = plants.getBoundingClientRect();
        const k = Math.min(1, Math.max(0, -r.top / travel));
        track.style.transform = `translateX(${-k * travel}px)`;
        bar.style.transform = `scaleX(${k})`;
        // лёгкий наклон карточек
        $$('.card', track).forEach((c, i) => {
          const cr = c.getBoundingClientRect();
          const off = (cr.left + cr.width / 2 - innerWidth / 2) / innerWidth;
          c.style.transform = `translateY(${Math.abs(off) * 40}px) rotate(${off * 3}deg)`;
        });
      }

      // стопка опылителей: предыдущие карточки уменьшаются
      if (!isMobile()) {
        pols.forEach((p, i) => {
          const next = pols[i + 1];
          if (!next) return;
          const nr = next.getBoundingClientRect();
          const k = Math.min(1, Math.max(0, 1 - (nr.top - 120) / (vh * .8)));
          p.style.transform = `scale(${1 - k * .06})`;
          p.style.filter = `brightness(${1 - k * .12})`;
        });
      }

      // луг
      const mr = meadowImg.parentElement.getBoundingClientRect();
      if (mr.top < vh && mr.bottom > 0) {
        const k = (mr.top + mr.height / 2 - vh / 2) / vh;
        meadowImg.style.transform = `translateY(${k * -8}%) scale(1.05)`;
      }

      // пчела-курсор
      const dx = mx - bx, dy = my - by;
      bx += dx * .08; by += dy * .08;
      if (dx < -3) facing = -1; else if (dx > 3) facing = 1;
      tilt += (Math.max(-30, Math.min(30, dy * .25)) * facing - tilt) * .1;
      const wob = Math.sin(performance.now() / 180) * 4;
      bee.style.transform = `translate(${bx + 18}px, ${by + 14 + wob}px) rotate(${tilt}deg) scaleX(${facing})`;
    }

    // манифест — слова загораются по мере прокрутки
    const tr = mText.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (vh * .85 - tr.top) / (tr.height + vh * .35)));
    const lit = Math.floor(k * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < lit));

    requestAnimationFrame(frame);
  }

  addEventListener('resize', sizePlants);
  addEventListener('load', sizePlants);
  sizePlants();
  requestAnimationFrame(frame);
})();
