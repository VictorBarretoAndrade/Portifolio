(function () {
  // ---------- Tema ----------
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  var theme = stored || (prefersLight ? 'light' : 'dark');

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn.textContent = t === 'light' ? '☾' : '☀';
    try { localStorage.setItem('theme', t); } catch (e) {}
  }
  applyTheme(theme);
  themeBtn.addEventListener('click', function () {
    theme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(theme);
  });

  // ---------- Idioma ----------
  var langBtn = document.getElementById('langBtn');
  var nodes = document.querySelectorAll('[data-pt][data-en]');
  var lang = null;
  try { lang = localStorage.getItem('lang'); } catch (e) {}
  lang = lang || 'pt';

  function applyLang(l) {
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = nodes[i].getAttribute(l === 'en' ? 'data-en' : 'data-pt');
    }
    root.lang = l === 'en' ? 'en' : 'pt-BR';
    langBtn.textContent = l === 'en' ? 'PT' : 'EN';
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  applyLang(lang);
  langBtn.addEventListener('click', function () {
    lang = lang === 'en' ? 'pt' : 'en';
    applyLang(lang);
  });
})();
