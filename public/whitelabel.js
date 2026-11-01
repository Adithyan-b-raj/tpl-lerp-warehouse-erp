/**
 * BMAD White-Label URL Personalizer Engine (whitelabel.js)
 * Adheres to: whitelabel-and-showroom-contract.md
 * Supports query params: ?brand=&tagline=&primary=&dark=&bg=&wa=&logo=&reset_wl=1
 * Persists across Customer (/) and Admin (/admin.html) views via sessionStorage + link propagation.
 */
(function () {
  var STORAGE_KEY = 'bmad_wl_config_lerp_v1';
  var DEFAULT_BRAND = 'NEXUS SUPPLY ERP';
  var DEFAULT_WA = '919847011223';

  function sanitizeHex(val) {
    if (!val) return '';
    var clean = String(val).trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) {
      return '#' + clean;
    }
    return '';
  }

  function sanitizePhone(val) {
    if (!val) return '';
    return String(val).replace(/[^0-9]/g, '');
  }

  function loadConfig() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('reset_wl') === '1') {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
      return {};
    }

    var stored = {};
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) || {};
    } catch (e) {}

    var updated = Object.assign({}, stored);
    if (params.has('brand')) updated.brand = params.get('brand').trim();
    if (params.has('tagline')) updated.tagline = params.get('tagline').trim();
    if (params.has('primary')) updated.primary = sanitizeHex(params.get('primary'));
    if (params.has('dark')) updated.dark = sanitizeHex(params.get('dark'));
    if (params.has('bg')) updated.bg = sanitizeHex(params.get('bg'));
    if (params.has('wa')) updated.wa = sanitizePhone(params.get('wa'));
    if (params.has('logo')) updated.logo = params.get('logo').trim();

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    return updated;
  }

  var config = loadConfig();
  window.__WL_CONFIG = config;

  function applyCssVariables(cfg) {
    var root = document.documentElement;
    if (!root) return;
    if (cfg.primary) {
      root.style.setProperty('--color-primary', cfg.primary);
      root.style.setProperty('--brand-primary', cfg.primary);
    }
    if (cfg.dark) {
      root.style.setProperty('--color-dark', cfg.dark);
      root.style.setProperty('--brand-dark', cfg.dark);
      root.style.setProperty('--color-navy', cfg.dark);
    }
    if (cfg.bg) {
      root.style.setProperty('--bg-main', cfg.bg);
      root.style.setProperty('--bg-canvas', cfg.bg);
      root.style.setProperty('--bg-sand', cfg.bg);
    }
  }

  function applyDomOverrides() {
    var cfg = window.__WL_CONFIG || {};
    applyCssVariables(cfg);

    var currentBrand = cfg.brand || DEFAULT_BRAND;

    // Apply Brand to all markers
    if (cfg.brand) {
      var isAdmin = window.location.pathname.indexOf('admin') !== -1;
      document.title = cfg.brand + (isAdmin ? ' — Enterprise Ops Console' : ' — Multi-Branch Inventory ERP');

      document.querySelectorAll('[data-wl-brand]').forEach(function (el) {
        el.textContent = cfg.brand;
      });

      document.querySelectorAll('.brand-logo').forEach(function (el) {
        if (cfg.logo && /^https?:\/\//i.test(cfg.logo)) {
          while (el.firstChild) el.removeChild(el.firstChild);
          var img = document.createElement('img');
          img.src = cfg.logo;
          img.alt = cfg.brand;
          img.style.maxHeight = '28px';
          img.style.width = 'auto';
          img.style.display = 'block';
          el.appendChild(img);
        } else {
          el.textContent = cfg.brand;
        }
      });
    }

    if (cfg.tagline) {
      document.querySelectorAll('[data-wl-tagline]').forEach(function (el) {
        el.textContent = cfg.tagline;
      });
    }

    // Apply WhatsApp number & message
    var activeWa = cfg.wa || DEFAULT_WA;
    var waBtn = document.getElementById('floatingWaBtn');
    if (waBtn) {
      waBtn.href = 'https://wa.me/' + activeWa + '?text=' + encodeURIComponent('Hello ' + currentBrand + ' Logistics Desk, I would like to inquire about industrial inventory and dealer trade terms.');
    }
    var drawerWa = document.getElementById('drawerWaText');
    if (drawerWa) {
      var formatted = activeWa.length === 12
        ? '+' + activeWa.slice(0, 2) + ' ' + activeWa.slice(2, 7) + ' ' + activeWa.slice(7)
        : '+' + activeWa;
      drawerWa.textContent = 'WhatsApp Trade Desk: ' + formatted;
    }
    document.querySelectorAll('#adminWaInput, input[data-wl-wa]').forEach(function (inp) {
      inp.value = activeWa;
    });

    // Propagate query params across internal links (index.html <-> admin.html)
    var qs = new URLSearchParams();
    ['brand', 'tagline', 'primary', 'dark', 'bg', 'wa', 'logo'].forEach(function (k) {
      if (cfg[k]) qs.set(k, cfg[k]);
    });
    var qsStr = qs.toString();
    if (qsStr) {
      document.querySelectorAll('a[href^="admin.html"], a[href^="index.html"], a[href^="/admin.html"], a[href^="/index.html"]').forEach(function (a) {
        var href = a.getAttribute('href');
        var parts = href.split('?');
        a.setAttribute('href', parts[0] + '?' + qsStr);
      });
    }
  }

  window.applyWhiteLabel = applyDomOverrides;

  // Apply CSS variables immediately before body paint
  applyCssVariables(config);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDomOverrides);
  } else {
    applyDomOverrides();
  }
  window.addEventListener('load', applyDomOverrides);
  setTimeout(applyDomOverrides, 400);
})();
