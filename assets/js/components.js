import { config } from './config.js';

export async function loadComponent(name) {
  const mount = document.getElementById('site-' + name);
  try {
    const response = await fetch('components/' + name + '.html');
    if (!response.ok) throw new Error('Component response: ' + response.status);
    // These fragments are first-party static files. Notice data is rendered separately as text.
    const template = document.createElement('template');
    template.innerHTML = await response.text();
    if (!template.content.firstElementChild) throw new Error('Empty component');
    mount.replaceChildren(template.content);
    applyConfig(mount);
    return mount.firstElementChild;
  } catch (error) {
    console.error('Could not load the ' + name + ' component.', error);
    const message = document.createElement('p');
    message.className = 'wrap';
    message.textContent = {
      header: 'Navigation is temporarily unavailable. Event information appears below.',
      footer: 'Campus and quick links are temporarily unavailable.',
      notices: 'The notices panel is temporarily unavailable.'
    }[name];
    mount.replaceChildren(message);
    return null;
  }
}

export function applyConfig(root) {
  root.querySelectorAll('[data-event]').forEach(element => {
    const key = element.dataset.event;
    const value = config.event[key];
    if (element.id === 'hero-title' && value.endsWith(config.event.year)) {
      const year = document.createElement('span');
      year.textContent = config.event.year;
      element.replaceChildren(value.slice(0, -config.event.year.length), year);
    } else {
      element.textContent = value;
    }
  });

  root.querySelectorAll('[data-logo]').forEach(image => {
    const source = config.logo[image.dataset.logo];
    const fallback = image.closest('a')?.querySelector('.brand-fallback');
    if (source) {
      image.addEventListener('error', () => {
        image.hidden = true;
        if (fallback) fallback.hidden = false;
      }, { once: true });
      image.src = source;
      image.hidden = false;
    } else if (fallback) {
      fallback.hidden = false;
    }
  });

  root.querySelectorAll('[data-link]').forEach(link => {
    const key = link.dataset.link;
    const url = config.links[key];
    link.hidden = !url;
    if (url) link.href = url;
    if (key === 'maps') root.querySelector('[data-maps-pending]').hidden = Boolean(url);
  });

  root.querySelectorAll('[data-contact]').forEach(element => {
    const key = element.dataset.contact;
    const value = config.contact[key];
    if (key === 'email' && value) {
      const link = document.createElement('a');
      link.href = 'mailto:' + value;
      link.textContent = value;
      element.replaceChildren(link);
    } else {
      element.textContent = value || 'To Be Announced';
    }
  });

  const address = root.querySelector('[data-campus="address"]');
  const phone = root.querySelector('[data-campus="phone"]');
  const map = root.querySelector('[data-map-embed]');
  if (address) address.textContent = config.campus.address;
  if (phone) {
    phone.hidden = !config.campus.phone;
    phone.textContent = config.campus.phone;
    phone.href = 'tel:' + config.campus.phone.replace(/[^+\d]/g, '');
  }
  if (map && config.campus.mapEmbed) {
    map.src = config.campus.mapEmbed;
    map.hidden = false;
  }
}

export function initializeHeader(header) {
  const toggle = header.querySelector('.menu-toggle');
  const nav = header.querySelector('nav');
  const mobile = matchMedia('(max-width: 700px)');
  const links = [...nav.querySelectorAll('a[href^="#"]')];

  function closeMenu(restoreFocus) {
    header.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (header.classList.contains('is-open')) {
      closeMenu(false);
      return;
    }
    header.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  });

  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) closeMenu(true);
  });
  document.addEventListener('pointerdown', event => {
    if (!header.contains(event.target)) closeMenu(false);
  });
  header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) closeMenu(false);
  });
  mobile.addEventListener('change', () => closeMenu(false));

  for (const link of links) {
    link.addEventListener('click', () => {
      if (!mobile.matches) return;
      const section = document.getElementById(link.hash.slice(1));
      section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
      closeMenu(false);
    });
  }

  function updateActiveSection() {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
    const threshold = header.getBoundingClientRect().height + 38;
    const visible = links.filter(link => !link.hidden);
    const active = visible.findLast(link =>
      document.getElementById(link.hash.slice(1)).getBoundingClientRect().top <= threshold
    ) || visible[0];
    for (const link of links) {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  let frame = 0;
  function queueUpdate() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      updateActiveSection();
    });
  }

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
  new ResizeObserver(queueUpdate).observe(document.querySelector('main'));
  updateActiveSection();
}
