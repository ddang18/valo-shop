/* ---------- Data ---------- */
const PRODUCTS = [
  // Аккаунты
  {id:'acc-eu-a', name:'Аккаунт EU — Tier A с наборами скинов', price:6490, category:'Аккаунты', pop:5, tags:['EU','Скины','Под привязку'], img:'assets/card-acc.svg', desc:'Под привязку к почте покупателя. Подбор по предпочтениям по скинам. Демонстрация.'},
  {id:'acc-tr-b', name:'Аккаунт TR — Tier B (стартовый)', price:2490, category:'Аккаунты', pop:3, tags:['TR','Недорого'], img:'assets/card-acc.svg', desc:'Базовые скины, активный сезон. Демонстрация.'},
  {id:'acc-na-prem', name:'Аккаунт NA — Premium', price:9490, category:'Аккаунты', pop:4, tags:['NA','Премиум','Отбор'], img:'assets/card-acc.svg', desc:'Расширенная коллекция, высокий уровень. Демо.'},

  // Буст
  {id:'boost-gold', name:'Буст до Gold', price:1790, category:'Буст', pop:4, tags:['Соло'], img:'assets/card-boost.svg', desc:'Ориентировочная цена. Итог зависит от стартового ранга.'},
  {id:'boost-plat', name:'Буст до Platinum', price:2790, category:'Буст', pop:5, tags:['Соло'], img:'assets/card-boost.svg', desc:'Ориентировочная цена.'},
  {id:'plac-10', name:'Калибровка 10 игр', price:1590, category:'Буст', pop:3, tags:['Калибровка'], img:'assets/card-boost.svg', desc:'Аккуратная игра без токсичности. Демо.'},

  // Коучинг
  {id:'coach-1h', name:'Коучинг 1 час (Immortal+)', price:990, category:'Коучинг', pop:4, tags:['Разбор','Навыки'], img:'assets/card-coach.svg', desc:'Индивидуальная сессия: кроссхэйр, позиции, тайминги.'},
  {id:'coach-pack', name:'Коучинг 4 часа (пакет)', price:3490, category:'Коучинг', pop:3, tags:['Экономия'], img:'assets/card-coach.svg', desc:'Серия занятий с домашними заданиями.'},

  // Наборы
  {id:'bundle-start', name:'Набор Старта: калибровка + коуч 1ч', price:2290, category:'Наборы', pop:2, tags:['Пакет'], img:'assets/card-bundle.svg', desc:'Эконом-комбо «заход в сезон».'},
  {id:'bundle-pro', name:'Набор PRO: буст до Platinum + коуч', price:4790, category:'Наборы', pop:2, tags:['Пакет'], img:'assets/card-bundle.svg', desc:'Для уверенного апа ранга.'},
];

/* ---------- State ---------- */
const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));
const state = {
  filter: 'all',
  search: '',
  sort: 'pop',
  cart: loadCart(),
  theme: localStorage.getItem('theme') || 'auto',
};

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Year
  $('#year').textContent = new Date().getFullYear();
  // Theme
  applyTheme(state.theme);
  $('#themeToggle').addEventListener('click', toggleTheme);

  // Nav toggle
  const navToggle = $('.nav-toggle');
  const navItems = $('#nav-items');
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navItems.classList.toggle('show');
  });

  // Filters
  $$('#search .chip').forEach(ch => ch.addEventListener('click', onChip));
  $('#searchInput').addEventListener('input', (e)=>{state.search=e.target.value.trim(); render();});
  $('#sortSelect').addEventListener('change', (e)=>{state.sort=e.target.value; render();});

  // Products
  render();

  // Cart
  $('#cartBtn').addEventListener('click', toggleCart);
  $('#cartClose').addEventListener('click', toggleCart);
  $('#clearCart').addEventListener('click', () => { state.cart=[]; saveCart(); updateCartUI(); });
  $('#checkoutBtn').addEventListener('click', openCheckout);

  // Boost calc
  populateRanks();
  $('#boostForm').addEventListener('input', updateBoostPrice);
  $('#boostForm').addEventListener('submit', addBoostToCart);
  updateBoostPrice();

  // Contact form
  $('#contactForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = $('#cname').value.trim();
    const contact = $('#ccontact').value.trim();
    const msg = $('#cmsg').value.trim();
    const body = encodeURIComponent(`Имя: ${name}\nКонтакт: ${contact}\nСообщение: ${msg}`);
    window.open(`mailto:order@example.com?subject=Вопрос VALO.SHOP&body=${body}`, '_blank');
  });
});

/* ---------- Rendering ---------- */
function render(){
  const grid = $('#productGrid');
  grid.innerHTML = '';

  let items = PRODUCTS.slice();
  if (state.filter !== 'all') items = items.filter(p => p.category === state.filter);
  if (state.search) {
    const q = state.search.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || (p.tags||[]).some(t=>t.toLowerCase().includes(q)));
  }
  items.sort((a,b)=>{
    switch(state.sort){
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name': return a.name.localeCompare(b.name, 'ru');
      default: return (b.pop||0) - (a.pop||0);
    }
  });

  for (const p of items){
    grid.appendChild(card(p));
  }
  updateCartUI();
}

function card(p){
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <div class="thumb"><img src="${p.img}" alt=""></div>
    <div class="row"><h3>${p.name}</h3><span class="price">${fmt(p.price)}</span></div>
    <p class="subtle small">${p.desc||''}</p>
    <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join(' ')}</div>
    <div class="actions">
      <button class="btn primary" data-add="${p.id}">В корзину</button>
      <button class="btn" data-more="${p.id}">Подробнее</button>
    </div>`;

  el.querySelector('[data-add]').addEventListener('click', ()=> addToCart({id:p.id, name:p.name, price:p.price, img:p.img, qty:1}));
  el.querySelector('[data-more]').addEventListener('click', ()=>{
    alert(`${p.name}\n\nОписание:\n${p.desc}\n\nТеги: ${(p.tags||[]).join(', ')}`);
  });
  return el;
}

/* ---------- Cart ---------- */
function loadCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]'); }catch{ return []; } }
function saveCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }
function cartCount(){ return state.cart.reduce((s,i)=>s+(i.qty||1),0); }
function cartTotal(){ return state.cart.reduce((s,i)=>s+(i.price*i.qty),0); }
function updateCartUI(){
  $('#cartCount').textContent = cartCount();
  $('#cartTotal').textContent = fmt(cartTotal());
  const list = $('#cartItems');
  list.innerHTML = '';
  if (!state.cart.length){
    list.innerHTML = '<p class="subtle">Корзина пуста.</p>';
  } else {
    for (const item of state.cart){
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="ci-thumb"><img src="${item.img}" alt="" width="40" height="40"></div>
        <div>
          <div style="font-weight:600">${item.name}</div>
          <div class="subtle small">${item.meta||''}</div>
          <div class="small" style="margin-top:4px">
            <button class="chip" data-minus="${item.id}">−</button>
            <span>× ${item.qty}</span>
            <button class="chip" data-plus="${item.id}">+</button>
          </div>
        </div>
        <div style="text-align:right">
          <div><strong>${fmt(item.price*item.qty)}</strong></div>
          <button class="small subtle" data-remove="${item.id}">Удалить</button>
        </div>`;
      row.querySelector('[data-minus]').addEventListener('click', ()=>{ item.qty=Math.max(1,item.qty-1); saveCart(); updateCartUI(); });
      row.querySelector('[data-plus]').addEventListener('click', ()=>{ item.qty+=1; saveCart(); updateCartUI(); });
      row.querySelector('[data-remove]').addEventListener('click', ()=>{ state.cart = state.cart.filter(i=>i.id!==item.id); saveCart(); updateCartUI(); });
      list.appendChild(row);
    }
  }
}

function toggleCart(){
  const drawer = $('#cartDrawer');
  const btn = $('#cartBtn');
  const open = drawer.hasAttribute('hidden');
  drawer.toggleAttribute('hidden');
  btn.setAttribute('aria-expanded', String(open));
}

/* ---------- Boost Calculator ---------- */
const DIVISIONS = ['I','II','III'];
const RANKS = [
  'Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant'
];
function populateRanks(){
  const from = $('#rankFrom'), to = $('#rankTo');
  const opts = [];
  let valIndex = 0;
  for (let r=0; r<RANKS.length; r++){
    const rank = RANKS[r];
    const maxDiv = (rank==='Immortal' || rank==='Radiant') ? 1 : 3;
    for (let d=0; d<maxDiv; d++){
      const label = maxDiv===1 ? rank : `${rank} ${DIVISIONS[d]}`;
      opts.push({label, value: valIndex++});
    }
  }
  for (const o of opts){
    const o1 = document.createElement('option'); o1.value=o.value; o1.textContent=o.label; from.appendChild(o1);
    const o2 = document.createElement('option'); o2.value=o.value; o2.textContent=o.label; to.appendChild(o2.cloneNode(true));
  }
  from.selectedIndex = 3; // Bronze II примерно
  to.selectedIndex = 9;   // Gold I примерно
}

function stepsBetween(a, b){ return Math.max(0, b - a); }

function calcBoostPrice(){
  const from = parseInt($('#rankFrom').value,10);
  const to = parseInt($('#rankTo').value,10);
  if (to <= from) return 0;
  let steps = stepsBetween(from, to);
  // Базовая цена за дивизион — 190 ₽, возрастает каждые 6 шагов на 15%
  let price = 0, base = 190;
  for (let i=0;i<steps;i++){
    const tier = Math.floor(i/6);
    const per = base * Math.pow(1.15, tier);
    price += per;
  }
  if ($('#duo').value === 'duo') price *= 1.25;
  return Math.round(price/10)*10; // округление до десятков
}

function updateBoostPrice(){
  const price = calcBoostPrice();
  $('#boostPrice').textContent = fmt(price);
}

function addBoostToCart(e){
  e.preventDefault();
  const price = calcBoostPrice();
  if (!price) return;
  const fromTxt = $('#rankFrom').selectedOptions[0].textContent;
  const toTxt = $('#rankTo').selectedOptions[0].textContent;
  const meta = `С ${fromTxt} до ${toTxt}, ${$('#servers').value}, ${$('#duo').value==='duo'?'дуо':'соло'}`;
  addToCart({id:`boost-${Date.now()}`, name:`Буст: ${fromTxt} → ${toTxt}`, price, img:'assets/card-boost.svg', qty:1, meta});
}

/* ---------- Add to cart ---------- */
function addToCart(item){
  const existing = state.cart.find(i=>i.id===item.id && i.meta===item.meta);
  if (existing){ existing.qty += item.qty||1; }
  else { state.cart.push({ ...item, qty: item.qty||1 }); }
  saveCart();
  updateCartUI();
  if ($('#cartDrawer').hasAttribute('hidden')) toggleCart();
}

/* ---------- Checkout ---------- */
function openCheckout(){
  if (!state.cart.length){ alert('Корзина пуста'); return; }
  const modal = $('#checkoutModal');
  const form = $('#checkoutForm');
  const preview = $('#orderPreview');
  const name = $('#custName');
  const contact = $('#custContact');

  const order = {
    items: state.cart.map(i=>({name:i.name, qty:i.qty, price:i.price, subtotal:i.price*i.qty, meta:i.meta||''})),
    total: cartTotal(),
    time: new Date().toLocaleString(),
  };
  preview.value = 'Заказ VALO.SHOP (демо)\n\n' + order.items.map(it=>`• ${it.name}${it.meta?` (${it.meta})`:''} × ${it.qty} = ${fmt(it.subtotal)}`).join('\n')
    + `\n\nИтого: ${fmt(order.total)}\nВремя: ${order.time}\n\nКонтакты: (заполните ниже)`;

  const body = encodeURIComponent(preview.value + `\nИмя: ${name.value}\nКонтакт: ${contact.value}\nКомментарий: ${$('#orderNote').value}`);
  $('#mailtoBtn').href = `mailto:order@example.com?subject=Заказ VALO.SHOP&body=${body}`;

  $('#copyBtn').addEventListener('click', (e)=>{
    e.preventDefault();
    navigator.clipboard.writeText(preview.value + `\nИмя: ${name.value}\nКонтакт: ${contact.value}\nКомментарий: ${$('#orderNote').value}`);
    alert('Скопировано в буфер обмена.');
  }, {once:true});

  if (typeof modal.showModal === 'function'){ modal.showModal(); }
  else { alert('Ваш браузер не поддерживает модальные окна <dialog>.'); }
}

/* ---------- Helpers ---------- */
function fmt(n){ return new Intl.NumberFormat('ru-RU', {style:'currency', currency:'RUB', maximumFractionDigits:0}).format(n); }

function onChip(e){
  $$('#search .chip').forEach(ch => ch.classList.remove('is-active'));
  e.currentTarget.classList.add('is-active');
  state.filter = e.currentTarget.dataset.filter;
  render();
}

function applyTheme(mode){
  const html = document.documentElement;
  if (mode==='auto'){ html.removeAttribute('data-theme'); }
  else { html.setAttribute('data-theme', mode); }
}
function toggleTheme(){
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : (current === 'light' ? 'auto' : 'dark');
  localStorage.setItem('theme', next);
  applyTheme(next);
}
