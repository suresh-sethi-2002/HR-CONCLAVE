import { config } from './config.js';
import { applyConfig, initializeHeader, loadComponent } from './components.js';
import { initializeNotices } from './notices.js';

applyConfig(document.querySelector('main'));
const hero = document.getElementById('hero-photo');
const caption = document.getElementById('hero-caption');
const placeholder = document.getElementById('hero-placeholder');
function showHeroPlaceholder() {
  hero.hidden = true;
  caption.hidden = true;
  placeholder.hidden = false;
}
if (config.heroImage) {
  hero.addEventListener('error', showHeroPlaceholder, { once: true });
  hero.src = config.heroImage;
  hero.hidden = false;
  caption.textContent = config.heroCaption;
  caption.hidden = !config.heroCaption;
} else {
  showHeroPlaceholder();
}

function setImage(image, path, alt) {
  if (!path) return;
  image.src = path;
  if (alt) image.alt = alt;
  image.hidden = false;
}

function renderList(name, entries, prepare) {
  const template = document.getElementById(name + '-template');
  const items = entries.map(entry => {
    const card = template.content.firstElementChild.cloneNode(true);
    for (const field of card.querySelectorAll('[data-field]')) {
      const value = entry[field.dataset.field];
      field.textContent = value ?? '';
      if (value) field.hidden = false;
    }
    if (prepare) prepare(card, entry);
    return card;
  });
  document.getElementById(name + '-list').replaceChildren(...items);
}

const initialHash = location.hash;
const highlight = document.querySelector('[data-photo="archive"]');
setImage(highlight, config.highlightsPhoto);
if (!config.highlightsPhoto) highlight.closest('figure').hidden = true;
renderList('archive', config.editions, (card, edition) => {
  setImage(card.querySelector('img'), edition.photo, edition.alt);
  card.querySelector('a').href = edition.url;
});

const content = fetch(config.contentUrl).then(response => {
  if (!response.ok) throw new Error('Content response: ' + response.status);
  return response.json();
});
const header = loadComponent('header').then(component => {
  if (component) initializeHeader(component);
  return component;
});
loadComponent('footer');
loadComponent('notices').then(component => {
  if (component) initializeNotices(component, content);
});

Promise.all([content, header]).then(([data, headerComponent]) => {
  const speakers = [...data.speakers].sort((first, second) => first.order - second.order);
  const names = new Map(speakers.map(speaker => [speaker.id, speaker.name]));
  renderList('speaker', speakers.map(speaker => ({
    ...speaker,
    role: [speaker.designation, speaker.organization].filter(Boolean).join(' · ')
  })), (card, speaker) => {
    if (!speaker.photo) return;
    const image = card.querySelector('img');
    const placeholder = card.querySelector('.portrait-placeholder');
    image.addEventListener('error', () => {
      image.hidden = true;
      placeholder.hidden = false;
    }, { once: true });
    setImage(image, speaker.photo, speaker.name);
    placeholder.hidden = true;
  });

  renderList('panel', data.panels.map(panel => {
    const namesForPanel = (panel.panelists || []).map(id => names.get(id)).filter(Boolean);
    return {
      ...panel,
      details: [panel.time, panel.moderator && 'Moderator: ' + panel.moderator, namesForPanel.join(', ')]
        .filter(Boolean).join(' · ')
    };
  }));
  renderList('agenda', data.agenda);
  document.getElementById('agenda-status').hidden = true;
  document.querySelectorAll('[data-scroll-controls]').forEach(initializeScrollRow);

  if (config.galleryEnabled) {
    const photos = (data.gallery || []).filter(photo => photo.src && photo.alt);
    if (photos.length) {
      initializeGallery(photos);
      const link = headerComponent?.querySelector('a[href="#gallery"]');
      if (link) link.hidden = false;
    }
  }

  // Restore deep links after asynchronously rendered sections have taken their final positions.
  const target = document.getElementById(location.hash.slice(1));
  if (target && !target.hidden && location.hash === initialHash) target.scrollIntoView({ behavior: 'instant' });
}).catch(error => {
  console.error('Could not load event content.', error);
  for (const id of ['speaker-list', 'panel-list', 'agenda-status']) {
    const node = document.getElementById(id);
    node.textContent = 'This program information is temporarily unavailable.';
    node.hidden = false;
  }
});

function initializeScrollRow(controls) {
  const row = document.getElementById(controls.dataset.scrollControls);
  const previous = controls.querySelector('[data-direction="-1"]');
  const next = controls.querySelector('[data-direction="1"]');
  const playback = controls.querySelector('[data-autoplay]');
  const playbackIcon = playback.firstElementChild;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;
  let inView = false;
  let hovered = false;
  let timer;

  function updateControls() {
    const maxScroll = row.scrollWidth - row.clientWidth;
    controls.hidden = maxScroll < 2;
    previous.setAttribute('aria-disabled', String(row.scrollLeft < 2));
    next.setAttribute('aria-disabled', String(row.scrollLeft >= maxScroll - 2));
  }

  function move(direction) {
    const width = row.firstElementChild.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(row).columnGap);
    row.scrollBy({
      left: (width + gap) * direction,
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  }

  function scheduleAdvance() {
    clearTimeout(timer);
    if (!playing || !inView || document.hidden || hovered || row.matches(':focus-within') ||
        controls.hidden) return;
    timer = setTimeout(() => {
      if (next.getAttribute('aria-disabled') === 'true') {
        row.scrollTo({ left: 0, behavior: 'instant' });
      } else {
        move(1);
      }
      scheduleAdvance();
    }, 3500);
  }

  function updatePlayback() {
    const label = (playing ? 'Pause ' : 'Play ') + playback.dataset.autoplay + ' auto-scroll';
    playback.setAttribute('aria-label', label);
    playback.title = label;
    playbackIcon.textContent = playing ? '❚❚' : '▶';
    scheduleAdvance();
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    if (button === playback) {
      playing = !playing;
      updatePlayback();
      return;
    }
    move(Number(button.dataset.direction));
    scheduleAdvance();
  });
  row.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovered = true;
    scheduleAdvance();
  });
  row.addEventListener('pointerleave', () => {
    hovered = false;
    scheduleAdvance();
  });
  row.addEventListener('focusin', scheduleAdvance);
  row.addEventListener('focusout', () => queueMicrotask(scheduleAdvance));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) playing = false;
    updatePlayback();
  });
  document.addEventListener('visibilitychange', scheduleAdvance);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    scheduleAdvance();
  }, { threshold: .2 }).observe(row);

  function updateRow() {
    updateControls();
    scheduleAdvance();
  }
  row.addEventListener('scroll', updateRow, { passive: true });
  new ResizeObserver(updateRow).observe(row);
  updateControls();
  updatePlayback();
}

function initializeGallery(photos) {
  const gallery = document.getElementById('gallery');
  const dialog = document.getElementById('gallery-dialog');
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('figcaption');
  let index = 0;
  let trigger;

  function show(position) {
    index = (position + photos.length) % photos.length;
    const photo = photos[index];
    setImage(image, photo.src, photo.alt);
    caption.textContent = (photo.caption || photo.alt) + ' (' + (index + 1) + ' of ' + photos.length + ')';
  }

  const buttons = photos.map((photo, position) => {
    const button = document.createElement('button');
    const thumbnail = document.createElement('img');
    button.type = 'button';
    thumbnail.loading = 'lazy';
    thumbnail.decoding = 'async';
    setImage(thumbnail, photo.thumbnail || photo.src, photo.alt);
    button.append(thumbnail);
    button.addEventListener('click', () => {
      trigger = button;
      show(position);
      dialog.showModal();
      dialog.querySelector('[data-gallery-action="close"]').focus();
    });
    return button;
  });
  document.getElementById('gallery-list').replaceChildren(...buttons);
  gallery.hidden = false;

  dialog.querySelector('[data-gallery-action="previous"]').addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-gallery-action="next"]').addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-gallery-action="close"]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => trigger?.focus());
}
