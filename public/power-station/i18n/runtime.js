/**
 * Isolated i18n for tenant static pages under /pages/.
 * Completely separate from web/src/i18n — delete this whole folder
 * (static-i18n/) plus the script tags that load it when retiring the tenant UI.
 *
 * Language switches apply in-place (no location.reload).
 * Parent postMessage uses app codes (zhCN / zhTW / en / …); those must map
 * onto the zh|en packs shipped here.
 */
(function (global) {
  var STORAGE_KEY = 'static-pages-lang';
  var packs = Object.create(null);
  var currentPack = null;
  var currentLang = null;
  var dict = Object.create(null);
  var ready = false;
  var applying = false;

  function normalizeLang(raw) {
    if (!raw || typeof raw !== 'string') return null;
    // Parent i18next uses zhCN / zhTW (no hyphen); browsers use zh-CN.
    var v = raw.trim().toLowerCase().replace(/_/g, '-');
    if (v === 'zh' || v.indexOf('zh') === 0) return 'zh';
    if (v === 'en' || v.indexOf('en') === 0) return 'en';
    // Static pages only ship zh/en; other parent locales fall back to English.
    if (
      v === 'fr' ||
      v.indexOf('fr-') === 0 ||
      v === 'ru' ||
      v.indexOf('ru-') === 0 ||
      v === 'ja' ||
      v.indexOf('ja-') === 0 ||
      v === 'vi' ||
      v.indexOf('vi-') === 0
    ) {
      return 'en';
    }
    return null;
  }

  function detectLang() {
    try {
      var params = new URLSearchParams(global.location.search);
      var fromQuery = normalizeLang(params.get('lang'));
      if (fromQuery) return fromQuery;
    } catch (e) {}
    try {
      var stored = normalizeLang(localStorage.getItem(STORAGE_KEY));
      if (stored) return stored;
    } catch (e) {}
    try {
      var nav = normalizeLang(navigator.language || (navigator.languages && navigator.languages[0]));
      if (nav) return nav;
    } catch (e) {}
    return 'zh';
  }

  function interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{\{(\w+)\}\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : '';
    });
  }

  function t(key, vars) {
    if (!key) return '';
    var val = dict[key];
    if (val == null) val = key;
    return interpolate(val, vars);
  }

  function applyNode(el) {
    var key = el.getAttribute('data-i18n');
    if (key) {
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        el.setAttribute(attr, t(key));
      } else {
        el.textContent = t(key);
      }
    }
    var htmlKey = el.getAttribute('data-i18n-html');
    if (htmlKey) el.innerHTML = t(htmlKey);
    var ph = el.getAttribute('data-i18n-placeholder');
    if (ph) el.setAttribute('placeholder', t(ph));
    var titleKey = el.getAttribute('data-i18n-title');
    if (titleKey) el.setAttribute('title', t(titleKey));
  }

  function applyDom(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll(
      '[data-i18n],[data-i18n-html],[data-i18n-placeholder],[data-i18n-title]'
    );
    for (var i = 0; i < nodes.length; i++) applyNode(nodes[i]);
    var titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) document.title = t(titleEl.getAttribute('data-i18n'));
  }

  function persistLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    try {
      var url = new URL(global.location.href);
      url.searchParams.set('lang', lang);
      global.history.replaceState(null, '', url.toString());
    } catch (e) {}
  }

  function ensureSwitcherDelegation(host) {
    if (host._i18nDelegated) return;
    host._i18nDelegated = true;
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lang]');
      if (!btn || !host.contains(btn)) return;
      e.preventDefault();
      var code = normalizeLang(btn.getAttribute('data-lang'));
      if (!code) return;
      useLang(code, { persist: true, source: 'user' });
    });
  }

  function paintSwitcher() {
    var host = document.getElementById('static-i18n-switcher');
    if (!host) return;
    ensureSwitcherDelegation(host);
    var html = '<div style="display:inline-flex;gap:4px;align-items:center;font-size:12px;">';
    ;['zh', 'en'].forEach(function (code) {
      var active = code === currentLang;
      html +=
        '<button type="button" data-lang="' +
        code +
        '" style="padding:2px 8px;border-radius:6px;border:1px solid ' +
        (active ? 'rgba(59,130,246,0.7)' : 'rgba(148,163,184,0.35)') +
        ';background:' +
        (active ? 'rgba(37,99,235,0.35)' : 'transparent') +
        ';color:inherit;cursor:pointer;">' +
        (code === 'zh' ? '中文' : 'EN') +
        '</button>';
    });
    html += '</div>';
    host.innerHTML = html;
    host.className = ((host.className || '') + ' static-i18n-switcher').replace(/\s+/g, ' ').trim();
  }

  function useLang(lang, opts) {
    opts = opts || {};
    var next = normalizeLang(lang) || 'zh';
    var source = opts.source || 'system';

    if (applying) return false;
    if (next === currentLang && Object.keys(dict).length > 0) {
      paintSwitcher();
      return false;
    }

    applying = true;
    try {
      currentLang = next;
      var packDict = packs[currentPack] && packs[currentPack][next];
      dict = packDict || (packs[currentPack] && packs[currentPack].zh) || Object.create(null);
      if (document.documentElement) {
        document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
      }
      if (opts.persist !== false) persistLang(next);
      if (ready) {
        applyDom(document);
        paintSwitcher();
      }
      try {
        global.dispatchEvent(
          new CustomEvent('static-i18n:change', {
            detail: { lang: next, pack: currentPack, source: source },
          })
        );
      } catch (e) {}
      return true;
    } finally {
      applying = false;
    }
  }

  function register(pack, lang, messages) {
    if (!packs[pack]) packs[pack] = Object.create(null);
    packs[pack][normalizeLang(lang) || lang] = messages || {};
  }

  function activate(pack, opts) {
    opts = opts || {};
    currentPack = pack;
    ready = true;
    global.t = t;
    var lang = opts.lang || detectLang();
    useLang(lang, { persist: !opts.skipPersist, source: 'system' });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        applyDom(document);
        paintSwitcher();
      });
    } else {
      applyDom(document);
      paintSwitcher();
    }
  }

  if (global.addEventListener) {
    global.addEventListener('message', function (event) {
      if (!event.data || typeof event.data !== 'object') return;
      if (!event.data.lang) return;
      var mapped = normalizeLang(event.data.lang);
      if (!mapped || !currentPack) return;
      useLang(mapped, { persist: true, source: 'parent' });
    });
  }

  global.PagesI18n = {
    register: register,
    activate: activate,
    t: t,
    applyDom: applyDom,
    setLang: function (lang) {
      return useLang(lang, { persist: true, source: 'user' });
    },
    getLang: function () {
      return currentLang || 'zh';
    },
    getPack: function () {
      return currentPack;
    },
    remountSwitcher: paintSwitcher,
    STORAGE_KEY: STORAGE_KEY,
  };
})(typeof window !== 'undefined' ? window : this);
