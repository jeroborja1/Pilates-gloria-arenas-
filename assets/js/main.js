(function () {
  // ---- Menú móvil (toque y teclado: Esc lo cierra y devuelve el foco al botón)
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
  }

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
  var reduceFaq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceFaq && typeof Element.prototype.animate === 'function') {
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
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var vh = window.innerHeight || document.documentElement.clientHeight;
  var pending = [];
  document.querySelectorAll('.card, .video, .quote, .step, .faq details, .service-list li, .checklist li, .section h2, .section__intro, .gallery figure, .split > *').forEach(function (el) {
    // Lo que ya está visible al cargar (hero, etc.) no se anima
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
