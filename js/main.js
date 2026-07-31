import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://mssnxedqpeozgmahqfuo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zc254ZWRxcGVvemdtYWhxZnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDQyNDcsImV4cCI6MjEwMTA4MDI0N30.vcrrLcbLMYDWptJUo5l_HdsRxx9eIQfusuUsXe83g00'
);

document.addEventListener('DOMContentLoaded', async () => {

  const WHATSAPP_PHONE = '5492215699380';

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Traer el menú desde Supabase y armar las tarjetas ---------- */
  function formatPrice(num) {
    return num.toLocaleString('es-AR');
  }

  function renderBurgerCard(item) {
    const variants = [...item.menu_item_variants].sort((a, b) => a.sort_order - b.sort_order);
    const defaultVariant = variants.find(v => v.is_default) || variants[0];
    const badgeHtml = item.badge
      ? `<span class="badge${item.badge_style === 'outline' ? ' badge-outline' : ''}">${item.badge}</span>`
      : '';
    const sizeSelectorHtml = variants.length > 1 ? `
          <div class="size-selector" role="group" aria-label="Elegir tamaño">
            ${variants.map(v => `<button type="button" class="size-btn${v.id === defaultVariant.id ? ' is-active' : ''}" data-price="${formatPrice(v.price)}">${v.variant_name}</button>`).join('')}
          </div>` : '';
    return `
      <article class="product-card reveal" data-name="${item.name}">
        <figure class="product-media">
          ${badgeHtml}
          <img src="${item.image_url}" alt="${item.name}" loading="lazy">
        </figure>
        <div class="product-info">
          <h3>${item.name}</h3>
          <p class="product-desc">${item.description || ''}</p>
          ${sizeSelectorHtml}
          <p class="product-price">$ <span class="price-value">${formatPrice(defaultVariant.price)}</span></p>
          <button type="button" class="btn btn-whatsapp" data-order-add data-name="${item.name}" data-variant="${defaultVariant.variant_name}" data-price="${formatPrice(defaultVariant.price)}">Agregar al pedido</button>
        </div>
      </article>`;
  }

  function renderSideItem(item) {
    const variant = item.menu_item_variants[0];
    return `
      <div class="side-item">
        <img src="${item.image_url}" alt="${item.name}" loading="lazy">
        <div>
          <div class="side-copy">
            <h4>${item.name}</h4>
            <span>$ ${formatPrice(variant.price)}</span>
          </div>
          <button type="button" class="side-add" data-order-add data-name="${item.name}" data-price="${formatPrice(variant.price)}" aria-label="Agregar ${item.name} al pedido">+</button>
        </div>
      </div>`;
  }

  function renderExtraLi(item) {
    const variant = item.menu_item_variants[0];
    return `<li>${item.name} <span class="extras-price-row"><span class="extras-price">$ ${formatPrice(variant.price)}</span><button type="button" class="extras-add" data-order-add data-name="${item.name}" data-price="${formatPrice(variant.price)}" aria-label="Agregar ${item.name} al pedido">+</button></span></li>`;
  }

  async function loadMenu() {
    const catalogGrid = document.getElementById('catalogGrid');
    const sidesGrid = document.getElementById('sidesGrid');
    const bebidasList = document.getElementById('bebidasList');
    const postresList = document.getElementById('postresList');

    const { data, error } = await supabase
      .from('menu_items')
      .select('*, menu_item_variants(*)')
      .eq('active', true)
      .order('sort_order');

    if (error || !data) {
      console.error('Error cargando el menú desde Supabase:', error);
      if (catalogGrid) catalogGrid.innerHTML = '<p class="section-note">No se pudo cargar el menú. Probá recargar la página.</p>';
      return;
    }

    const burgers = data.filter(i => i.category === 'burger');
    const sides = data.filter(i => i.category === 'side');
    const bebidas = data.filter(i => i.category === 'bebida');
    const postres = data.filter(i => i.category === 'postre');

    if (catalogGrid) catalogGrid.innerHTML = burgers.map(renderBurgerCard).join('');
    if (sidesGrid) sidesGrid.innerHTML = sides.map(renderSideItem).join('');
    if (bebidasList) bebidasList.innerHTML = bebidas.map(renderExtraLi).join('');
    if (postresList) postresList.innerHTML = postres.map(renderExtraLi).join('');
  }

  await loadMenu();

  /* ---------- Header: fondo sólido al scrollear ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  const closeMenu = () => {
    mainNav.classList.remove('is-open');
    menuToggle.classList.remove('is-active');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.classList.toggle('is-active', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- Toast ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
  }

  /* ---------- Selector de tamaño (Simple / Doble / Triple) ---------- */
  document.querySelectorAll('.product-card').forEach(card => {
    const sizeButtons = card.querySelectorAll('.size-btn');
    if (!sizeButtons.length) return;

    const priceValue = card.querySelector('.price-value');
    const orderBtn = card.querySelector('[data-order-add]');

    sizeButtons.forEach(sizeBtn => {
      sizeBtn.addEventListener('click', () => {
        sizeButtons.forEach(b => b.classList.remove('is-active'));
        sizeBtn.classList.add('is-active');

        const price = sizeBtn.dataset.price;
        const variant = sizeBtn.textContent.trim();

        if (priceValue) priceValue.textContent = price;
        if (orderBtn) {
          orderBtn.dataset.variant = variant;
          orderBtn.dataset.price = price;
        }
      });
    });
  });

  /* ---------- Estado abierto/cerrado en vivo ---------- */
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');

  function updateOpenStatus() {
    if (!statusPill || !statusText) return;
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const minutes = h * 60 + m;

    const shift1Start = 12 * 60, shift1End = 15 * 60;
    const shift2Start = 20 * 60, shift2End = 24 * 60;

    const isOpen = (minutes >= shift1Start && minutes < shift1End) ||
                   (minutes >= shift2Start && minutes < shift2End);

    statusPill.classList.toggle('is-open', isOpen);

    if (isOpen) {
      statusText.textContent = 'Abierto ahora';
    } else if (minutes < shift1Start) {
      statusText.textContent = 'Cerrado — abre hoy a las 12 hs';
    } else if (minutes < shift2Start) {
      statusText.textContent = 'Cerrado — abre hoy a las 20 hs';
    } else {
      statusText.textContent = 'Cerrado — abre mañana a las 12 hs';
    }
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);

  /* ---------- Scrollspy: resaltar sección activa en el menú ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const spySections = ['inicio', 'menu', 'acompanamientos', 'contacto']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && spySections.length) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    spySections.forEach(section => spyObserver.observe(section));
  }

  /* ---------- Aparición de secciones al hacer scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Sistema de pedidos ---------- */
  function parsePrice(str) {
    return parseInt(String(str).replace(/\./g, ''), 10) || 0;
  }
  function formatPrice(num) {
    return num.toLocaleString('es-AR');
  }

  let order = [];

  function addToOrder({ name, variant, price }) {
    const priceNum = parsePrice(price);
    const existing = order.find(item => item.name === name && item.variant === (variant || ''));
    if (existing) {
      existing.qty += 1;
    } else {
      order.push({ name, variant: variant || '', price: priceNum, qty: 1 });
    }
    renderOrder();
  }

  function changeQty(index, delta) {
    const item = order[index];
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) order.splice(index, 1);
    renderOrder();
  }

  function clearOrder() {
    order = [];
    renderOrder();
  }

  const orderItemsList = document.getElementById('orderItemsList');
  const orderSubtotal = document.getElementById('orderSubtotal');
  const orderBadge = document.getElementById('orderBadge');
  const orderCheckout = document.getElementById('orderCheckout');
  const orderClear = document.getElementById('orderClear');
  const orderName = document.getElementById('orderName');
  const orderPhone = document.getElementById('orderPhone');
  const orderDelivery = document.getElementById('orderDelivery');
  const orderTime = document.getElementById('orderTime');
  const orderPayment = document.getElementById('orderPayment');

  function renderOrder() {
    const totalQty = order.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = order.reduce((sum, i) => sum + i.qty * i.price, 0);

    if (orderBadge) {
      orderBadge.textContent = totalQty;
      orderBadge.hidden = totalQty === 0;
    }
    if (orderSubtotal) orderSubtotal.textContent = `$ ${formatPrice(subtotal)}`;
    if (orderCheckout) orderCheckout.disabled = order.length === 0;
    if (orderClear) orderClear.hidden = order.length === 0;

    if (!orderItemsList) return;

    if (order.length === 0) {
      orderItemsList.innerHTML = '<p class="order-empty">Todavía no agregaste nada. Elegí algo del menú para empezar tu pedido.</p>';
      return;
    }

    orderItemsList.innerHTML = order.map((item, index) => `
      <div class="order-item" data-index="${index}">
        <div class="order-item-info">
          <p class="order-item-name">${item.name}${item.variant ? ` <span class="order-item-variant">(${item.variant})</span>` : ''}</p>
          <p class="order-item-price">$ ${formatPrice(item.price * item.qty)}</p>
        </div>
        <div class="order-item-qty">
          <button type="button" class="qty-btn" data-action="dec" aria-label="Restar unidad">−</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" aria-label="Sumar unidad">+</button>
        </div>
      </div>
    `).join('');
  }

  orderItemsList?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const index = Number(btn.closest('.order-item')?.dataset.index);
    if (Number.isNaN(index)) return;
    if (btn.dataset.action === 'inc') changeQty(index, 1);
    if (btn.dataset.action === 'dec') changeQty(index, -1);
  });

  orderClear?.addEventListener('click', clearOrder);

  /* ---------- Agregar productos al pedido ---------- */
  document.querySelectorAll('[data-order-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      addToOrder({
        name: btn.dataset.name,
        variant: btn.dataset.variant,
        price: btn.dataset.price
      });
      showToast(`Agregado al pedido: ${btn.dataset.name} ✅`);
    });
  });

  /* ---------- Abrir / cerrar el panel de pedido ---------- */
  const orderToggle = document.getElementById('orderToggle');
  const orderClose = document.getElementById('orderClose');
  const orderOverlay = document.getElementById('orderOverlay');
  const orderDrawer = document.getElementById('orderDrawer');

  function openOrder() {
    orderDrawer.classList.add('is-open');
    orderOverlay.classList.add('is-open');
    orderDrawer.setAttribute('aria-hidden', 'false');
  }
  function closeOrder() {
    orderDrawer.classList.remove('is-open');
    orderOverlay.classList.remove('is-open');
    orderDrawer.setAttribute('aria-hidden', 'true');
  }

  orderToggle?.addEventListener('click', openOrder);
  orderClose?.addEventListener('click', closeOrder);
  orderOverlay?.addEventListener('click', closeOrder);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOrder();
  });

  // El botón "Hacer un pedido" del hero y de contacto llevan a #menu; si el pedido ya tiene items, abrimos el panel directo.
  document.querySelectorAll('a[href="#menu"].btn-flame').forEach(link => {
    link.addEventListener('click', (e) => {
      if (order.length > 0) {
        e.preventDefault();
        openOrder();
      }
    });
  });

  /* ---------- Armar y enviar el pedido por WhatsApp ---------- */
  function formatToday() {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const now = new Date();
    const dia = dias[now.getDay()];
    return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${now.getDate()} de ${meses[now.getMonth()]}`;
  }

  function buildOrderMessage() {
    const lines = order.map(item => {
      const variantPart = item.variant ? ` ${item.variant}` : '';
      return `• ${item.qty}x ${item.name}${variantPart} ($${formatPrice(item.price)} c/u)`;
    }).join('\n');
    const total = order.reduce((sum, i) => sum + i.qty * i.price, 0);
    const name = orderName?.value.trim() || 'Sin nombre';
    const phone = orderPhone?.value.trim() || 'Sin teléfono';
    const delivery = orderDelivery?.value || 'Retiro en el local';
    const time = orderTime?.value.trim() || 'Lo antes posible';
    const payment = orderPayment?.value || 'Efectivo';

    return `🍔 *NUEVO PEDIDO - BRODOG'S*\n———————————————\n👤 *${name}*\n📞 ${phone}\n📅 ${formatToday()}\n🕐 *${time}*\n📍 ${delivery}\n💳 ${payment}\n———————————————\n*PEDIDO:*\n${lines}\n———————————————\n💰 *Total: $${formatPrice(total)}*`;
  }

  orderCheckout?.addEventListener('click', () => {
    if (!order.length) return;
    if (!orderName?.value.trim() || !orderPhone?.value.trim()) {
      showToast('Completá tu nombre y teléfono antes de enviar ⚠️');
      return;
    }

    const total = order.reduce((sum, i) => sum + i.qty * i.price, 0);
    const message = buildOrderMessage();
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

    // window.open debe llamarse de forma síncrona en el click, si no el navegador lo bloquea como pop-up.
    window.open(url, '_blank', 'noopener');

    // Guardamos el pedido en Supabase para que aparezca en el panel de administración.
    // No bloqueamos el flujo de WhatsApp si esto falla (ej. sin internet momentáneo).
    supabase.from('orders').insert({
      customer_name: orderName.value.trim(),
      phone: orderPhone.value.trim(),
      delivery_method: orderDelivery?.value || 'Retiro en el local',
      time_preference: orderTime?.value.trim() || 'Lo antes posible',
      payment_method: orderPayment?.value || 'Efectivo',
      items: order,
      total: total
    }).then(({ error }) => {
      if (error) console.error('Error guardando el pedido en Supabase:', error);
    });

    clearOrder();
    closeOrder();
  });

  renderOrder();

});
