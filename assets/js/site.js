/* Victor Gonçalves — portfolio site
   Theme toggle, language toggle, nav menu and highlight, reduced-motion video
   handling, and an accessible image lightbox. No dependencies.
   Loaded in <head> so the theme is set before first paint. */
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'vg-theme';
  var LANG_KEY = 'vg-lang';
  root.classList.add('js');

  function load(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }
  function media(query) {
    return window.matchMedia ? window.matchMedia(query) : null;
  }
  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }
  function onChange(mq, fn) {
    if (!mq) return;
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  // ---------- Theme: follows prefers-color-scheme until the visitor picks one ----------
  var lightMq = media('(prefers-color-scheme: light)');
  var storedTheme = load(THEME_KEY);
  var hasThemeChoice = storedTheme === 'light' || storedTheme === 'dark';

  function systemTheme() {
    return lightMq && lightMq.matches ? 'light' : 'dark';
  }
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    var btn = document.getElementById('themeBtn');
    if (btn) {
      var l = root.getAttribute('lang') === 'pt-BR' ? 'pt' : 'en';
      var label = btn.getAttribute('data-' + l + '-label-' + (theme === 'light' ? 'dark' : 'light'));
      if (label) {
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
      }
    }
  }
  setTheme(hasThemeChoice ? storedTheme : systemTheme());
  onChange(lightMq, function () {
    if (!hasThemeChoice) setTheme(systemTheme());
  });

  function initTheme() {
    var btn = document.getElementById('themeBtn');
    if (!btn) return;
    setTheme(root.getAttribute('data-theme'));
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      hasThemeChoice = true;
      save(THEME_KEY, next);
      setTheme(next);
    });
  }

  // ---------- Language: English by default, Portuguese through the toggle ----------
  // Each translatable element carries data-en and data-pt (innerHTML).
  // Attributes are translated through data-i18n-attr="alt aria-label" plus
  // data-en-alt / data-pt-alt, data-en-aria-label / data-pt-aria-label, etc.
  var lang = load(LANG_KEY) === 'pt' ? 'pt' : 'en';
  root.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en');

  function applyLang(l) {
    each(document.querySelectorAll('[data-en][data-pt]'), function (el) {
      var html = el.getAttribute('data-' + l);
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    each(document.querySelectorAll('[data-i18n-attr]'), function (el) {
      each(el.getAttribute('data-i18n-attr').split(/\s+/), function (attr) {
        var value = el.getAttribute('data-' + l + '-' + attr);
        if (value !== null) el.setAttribute(attr, value);
      });
    });
    root.setAttribute('lang', l === 'pt' ? 'pt-BR' : 'en');
    setTheme(root.getAttribute('data-theme'));
  }

  function initLang() {
    var btn = document.getElementById('langBtn');
    if (lang !== 'en') applyLang(lang);
    if (!btn) return;
    btn.addEventListener('click', function () {
      lang = lang === 'en' ? 'pt' : 'en';
      save(LANG_KEY, lang);
      applyLang(lang);
    });
  }

  // ---------- Nav: mobile menu and current-section highlight ----------
  function initNav() {
    var btn = document.getElementById('menuBtn');
    var links = document.getElementById('navLinks');
    if (!links) return;

    function setOpen(open) {
      if (!btn) return;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      links.classList.toggle('open', open);
    }
    if (btn) {
      btn.addEventListener('click', function () {
        setOpen(btn.getAttribute('aria-expanded') !== 'true');
      });
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          btn.focus();
        }
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.nav')) setOpen(false);
      });
    }

    // Sections map to nav links by id, or by data-nav="<id of the link target>".
    var byId = {};
    each(links.querySelectorAll('a[href^="#"]'), function (a) {
      byId[a.getAttribute('href').slice(1)] = a;
    });
    var tracked = Array.prototype.filter.call(
      document.querySelectorAll('main section[id]'),
      function (s) { return byId[s.id] || byId[s.getAttribute('data-nav')]; }
    );
    var current = null;
    var queued = false;

    function update() {
      queued = false;
      var line = window.innerHeight * 0.35;
      var active = null;
      // Document order: a nested section (e.g. #results) wins over its parent.
      each(tracked, function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) active = s;
      });
      var link = active ? (byId[active.id] || byId[active.getAttribute('data-nav')]) : null;
      if (link === current) return;
      if (current) current.removeAttribute('aria-current');
      if (link) link.setAttribute('aria-current', 'true');
      current = link;
    }
    function queue() {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  }

  // ---------- Video: no autoplay when reduced motion is requested ----------
  function initVideo() {
    var reduce = media('(prefers-reduced-motion: reduce)');
    var videos = document.querySelectorAll('video[autoplay], video[data-autoplay]');

    function apply() {
      if (!reduce || !reduce.matches) return;
      each(videos, function (v) {
        v.setAttribute('data-autoplay', '');
        v.removeAttribute('autoplay');
        v.autoplay = false;
        if (!v.paused) v.pause();
      });
    }
    apply();
    onChange(reduce, apply);
  }

  // ---------- Lightbox: Esc closes, focus is trapped, arrow keys navigate ----------
  function initLightbox() {
    var box = document.getElementById('lightbox');
    if (!box || typeof box.showModal !== 'function') return; // links still open the image

    var img = box.querySelector('.lb-figure img');
    var caption = box.querySelector('.lb-figure figcaption');
    var count = box.querySelector('.lb-count');
    var closeBtn = box.querySelector('[data-lb="close"]');
    var prevBtn = box.querySelector('[data-lb="prev"]');
    var nextBtn = box.querySelector('[data-lb="next"]');
    var items = [];
    var index = 0;
    var opener = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var link = items[index];
      var thumb = link.querySelector('img');
      var fig = link.closest('figure');
      var cap = fig ? fig.querySelector('figcaption') : null;
      img.src = link.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      caption.innerHTML = cap ? cap.innerHTML : '';
      count.textContent = (index + 1) + ' / ' + items.length;
      var single = items.length < 2;
      prevBtn.hidden = single;
      nextBtn.hidden = single;
    }

    function open(link) {
      var group = link.getAttribute('data-gallery');
      items = Array.prototype.slice.call(
        document.querySelectorAll('a[data-gallery="' + group + '"]')
      );
      opener = link;
      show(items.indexOf(link));
      box.showModal();
      closeBtn.focus();
    }

    each(document.querySelectorAll('a[data-gallery]'), function (link) {
      link.addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        open(link);
      });
    });

    closeBtn.addEventListener('click', function () { box.close(); });
    prevBtn.addEventListener('click', function () { show(index - 1); });
    nextBtn.addEventListener('click', function () { show(index + 1); });

    box.addEventListener('click', function (e) {
      // A click on the dark area around the image closes the viewer.
      if (e.target === box || e.target.classList.contains('lb-figure')) box.close();
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      else if (e.key === 'Tab') {
        var focusable = Array.prototype.filter.call(
          box.querySelectorAll('button'),
          function (b) { return !b.hidden && !b.disabled; }
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (focusable.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
      }
    });

    box.addEventListener('close', function () {
      img.removeAttribute('src');
      if (opener) opener.focus();
    });
  }

  function init() {
    initTheme();
    initLang();
    initNav();
    initVideo();
    initLightbox();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
