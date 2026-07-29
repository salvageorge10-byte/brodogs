document.addEventListener('DOMContentLoaded', () => {

  const IG_USERNAME = 'brodogs.cb';
  const IG_DM_URL = `https://ig.me/m/${IG_USERNAME}`;

  document.getElementById('year').textContent = new Date().getFullYear();

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

  /* ---------- Copiar mensaje y abrir Instagram DM ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch (err) { /* noop */ }
    document.body.removeChild(textarea);
    return Promise.resolve();
  }

  function orderViaInstagram({ name, variant, price }) {
    let message = `¡Hola Brodog's! Quiero pedir la ${name}`;
    if (variant) message += ` (${variant})`;
    if (price) message += ` - $${price}`;
    message += '.';

    // window.open debe llamarse de forma síncrona en el click, si no el navegador lo bloquea como pop-up.
    window.open(IG_DM_URL, '_blank', 'noopener');
    copyText(message).then(() => {
      showToast('Mensaje copiado. Pegalo en el chat de Instagram 📋');
    });
  }

  document.querySelectorAll('[data-ig-order]').forEach(btn => {
    btn.addEventListener('click', () => {
      orderViaInstagram({
        name: btn.dataset.name,
        variant: btn.dataset.variant,
        price: btn.dataset.price
      });
    });
  });

  /* ---------- Selector de tamaño (Simple / Doble / Triple) ---------- */
  document.querySelectorAll('.product-card').forEach(card => {
    const sizeButtons = card.querySelectorAll('.size-btn');
    if (!sizeButtons.length) return;

    const priceValue = card.querySelector('.price-value');
    const orderBtn = card.querySelector('[data-ig-order]');

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

});
