(function () {
  // Marca que hay JavaScript (las animaciones de entrada solo se activan con JS)
  document.documentElement.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Menú móvil (toque y teclado: Esc lo cierra y devuelve el foco al botón)
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  }

  // ---- Menú "Servicios": desplegable accesible (acordeón en móvil)
  var dd = document.querySelector('.nav__dd');
  var ddBtn = dd && dd.querySelector('.nav__dd-btn');
  var ddPanel = dd && dd.querySelector('.nav__dd-panel');
  function ddLinks() { return ddPanel ? Array.prototype.slice.call(ddPanel.querySelectorAll('a')) : []; }
  function setDd(open, focusFirst) {
    if (!ddBtn) return;
    ddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    ddPanel.hidden = !open;
    if (open && focusFirst) { var l = ddLinks(); if (l[0]) l[0].focus(); }
  }
  if (ddBtn && ddPanel) {
    ddBtn.addEventListener('click', function () { setDd(ddPanel.hidden); });
    ddBtn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setDd(true, true); }
    });
    ddPanel.addEventListener('keydown', function (e) {
      var l = ddLinks(), i = l.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); l[(i + 1) % l.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); l[(i - 1 + l.length) % l.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); l[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); l[l.length - 1].focus(); }
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setDd(false); });
    dd.addEventListener('focusout', function (e) { if (e.relatedTarget && !dd.contains(e.relatedTarget)) setDd(false); });
  }
  // Esc: cierra primero el desplegable y, si no hay, el menú móvil
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (ddPanel && !ddPanel.hidden) { setDd(false); ddBtn.focus(); return; }
    if (nav && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  // ---- Videos de YouTube con carga diferida: el iframe se crea solo al hacer clic
  document.querySelectorAll('.video__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.video + '?autoplay=1&rel=0';
      iframe.title = btn.dataset.title || 'Video de YouTube';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
    });
  });

  // ---- Medición: si existe window.gtag, envía el clic en WhatsApp con su ubicación (no instala analítica)
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('[data-track="whatsapp"]') : null;
    if (link && typeof window.gtag === 'function') {
      window.gtag('event', 'click_whatsapp', { location: link.getAttribute('data-location') || 'desconocida' });
    }
  });

  // ---- Botón flotante de WhatsApp: se oculta si hay otro botón de WhatsApp visible en pantalla
  var floatBtn = document.querySelector('.wa-float');
  var waButtons = document.querySelectorAll('.btn--wa:not(.nav__cta .btn)');
  if (floatBtn && waButtons.length && 'IntersectionObserver' in window) {
    var visibleWa = new Set();
    var waObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) visibleWa.add(e.target); else visibleWa.delete(e.target); });
      floatBtn.classList.toggle('is-hidden', visibleWa.size > 0);
    }, { threshold: 0.1 });
    waButtons.forEach(function (b) { waObserver.observe(b); });
  }

  // ---- Galería con lightbox accesible (<dialog>): Esc cierra y el foco vuelve a la foto
  var figures = document.querySelectorAll('#estudio .gallery figure');
  if (figures.length && typeof HTMLDialogElement === 'function') {
    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Foto ampliada');
    dlg.innerHTML = '<form method="dialog"><button class="lightbox__close" aria-label="Cerrar foto">&times;</button></form><img alt=""><p class="lightbox__cap"></p>';
    document.body.appendChild(dlg);
    var big = dlg.querySelector('img');
    var cap = dlg.querySelector('.lightbox__cap');
    var opener = null;
    figures.forEach(function (fig) {
      var img = fig.querySelector('img');
      if (!img) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gallery__open';
      b.setAttribute('aria-label', 'Ampliar foto: ' + img.alt);
      fig.insertBefore(b, img);
      b.appendChild(img);
      b.addEventListener('click', function () {
        opener = b;
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        cap.textContent = img.alt;
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  }

  // ---- Preguntas frecuentes: apertura y cierre animados (altura + opacidad), interrumpibles
  if (!reduce && typeof Element.prototype.animate === 'function') {
    var EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
    document.querySelectorAll('.faq details').forEach(function (d) {
      var summary = d.querySelector('summary');
      var body = d.querySelector('summary ~ *');
      var anim = null;
      function finish(open) {
        d.classList.remove('is-closing');
        d.open = open;
        d.style.height = '';
        d.style.overflow = '';
        anim = null;
      }
      function run(from, to, opening) {
        if (anim) anim.cancel();
        d.style.overflow = 'hidden';
        anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: opening ? 280 : 200, easing: EASE });
        if (body) body.animate({ opacity: opening ? [0, 1] : [1, 0] }, { duration: opening ? 280 : 160, easing: 'ease-out' });
        anim.onfinish = function () { finish(opening); };
        anim.oncancel = function () { anim = null; };
      }
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        var sh = summary.offsetHeight;
        var current = d.getBoundingClientRect().height;
        if (d.open && !d.classList.contains('is-closing')) {
          d.classList.add('is-closing');
          run(current, sh, false);
        } else {
          d.classList.remove('is-closing');
          d.open = true;
          run(anim ? current : sh, d.scrollHeight, true);
        }
      });
    });
  }

  // ---- Entrada al hacer scroll (decorativa). Sin JS o con movimiento reducido todo se ve completo.
  if (reduce) return;
  var vh = window.innerHeight || document.documentElement.clientHeight;
  var pending = [];
  document.querySelectorAll('.card, .video, .quote, .step, .faq details, .checklist li, .price-card, .section h2, .section__intro, .gallery figure, .split > *').forEach(function (el) {
    // Lo que ya está visible al cargar no se anima
    if (el.getBoundingClientRect().top < vh) return;
    var siblings = Array.prototype.filter.call(el.parentNode.children, function (n) { return n.tagName === el.tagName; });
    el.style.setProperty('--i', Math.min(siblings.indexOf(el), 5));
    el.classList.add('reveal');
    pending.push(el);
  });

  function show(el) {
    if (el.classList.contains('is-visible')) return;
    el.classList.add('is-visible');
    // Al terminar se retira la clase para que no interfiera con los efectos hover
    setTimeout(function () {
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--i');
    }, 1100);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px 20% 0px', threshold: 0 });
    pending.forEach(function (el) { io.observe(el); });
  } else {
    pending.forEach(show);
    return;
  }

  // Respaldo: nada puede quedar invisible si se baja muy rápido o el observer falla
  function flush() {
    var limit = (window.innerHeight || vh) * 1.2;
    pending.forEach(function (el) { if (el.getBoundingClientRect().top < limit) show(el); });
  }
  var timer;
  window.addEventListener('scroll', function () { clearTimeout(timer); timer = setTimeout(flush, 150); }, { passive: true });
  setTimeout(flush, 1500);
})();
