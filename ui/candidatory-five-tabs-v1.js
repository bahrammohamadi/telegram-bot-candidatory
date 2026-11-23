/* Candidatory home and five-tab navigation — DOM-only progressive enhancement.
   Intended for the existing preview.mjs page after authenticated HTML loads.
   Never calls APIs, mutates data or changes authentication. */
(() => {
  'use strict';
  const dashboard = document.getElementById('dashboard');
  if (!dashboard || document.getElementById('candidatory-bottom-nav')) return;
  const modules = dashboard.querySelector('.modules');
  if (!modules) return;
  const tabs = [
    ['امروز', null],
    ['مسیر من', 'گزارش پیشرفت'],
    ['کارها', 'وظایف'],
    ['یادگیری', 'آموزش'],
    ['حساب', 'پرونده من']
  ];
  const nav = document.createElement('nav');
  nav.id = 'candidatory-bottom-nav';
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'ناوبری اصلی کاندیداتوری');
  const activate = (button) => {
    nav.querySelectorAll('button').forEach(b => {
      b.removeAttribute('aria-current');
      b.setAttribute('aria-pressed', String(b === button));
    });
    button.setAttribute('aria-current', 'page');
  };
  for (const [label, target] of tabs) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bottom-tab';
    button.textContent = label;
    button.addEventListener('click', () => {
      if (!target) {
        const open = dashboard.querySelectorAll('.panel:not([hidden])');
        for (const panel of open) if (panel !== dashboard) panel.hidden = true;
        modules.hidden = false;
        dashboard.scrollIntoView({ block: 'start', behavior: 'auto' });
        activate(button);
        return;
      }
      const moduleButton = [...modules.querySelectorAll('[data-module]')]
        .find(b => (b.dataset.module || '').includes(target) || (b.textContent || '').includes(target));
      if (!moduleButton) {
        const msg = document.getElementById('msg');
        if (msg) msg.textContent = 'این بخش هنوز در نسخه فعلی فعال نیست.';
        return;
      }
      moduleButton.click();
      activate(button);
    });
    nav.appendChild(button);
  }
  dashboard.classList.add('candidatory-ui');
  dashboard.appendChild(nav);
  nav.firstElementChild.setAttribute('aria-current', 'page');
  nav.firstElementChild.setAttribute('aria-pressed', 'true');
})();
