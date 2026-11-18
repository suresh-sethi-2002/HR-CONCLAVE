import { config } from './config.js';

const priorities = ['High', 'Normal', 'Low'];

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function safeLink(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value, document.baseURI);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function visibleNotices(input) {
  // India Standard Time has a fixed UTC+05:30 offset.
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  return input.filter(item =>
    item && ['id', 'title', 'description', 'category'].every(key =>
      typeof item[key] === 'string' && item[key].trim()
    ) && priorities.includes(item.priority) &&
    isDate(item.publishDate) && item.publishDate <= today &&
    (item.expiryDate == null || (isDate(item.expiryDate) && item.expiryDate >= today))
  // Preserve the feed order for notices with the same publish date.
  ).sort((first, second) => second.publishDate.localeCompare(first.publishDate));
}

export function initializeNotices(root, content) {
  const settings = config.notices;
  const toggle = root.querySelector('.notice-toggle');
  const minimize = root.querySelector('.notice-minimize');
  const panel = root.querySelector('.notice-panel');
  const bar = root.querySelector('.notice-bar');
  const preview = root.querySelector('.notice-preview > span');
  const playback = root.querySelector('.notice-playback');
  const status = root.querySelector('.notice-status');
  const list = root.querySelector('.notice-list');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pinned = false;
  let hovering = false;
  let hoverSuppressed = false;
  let lastSuccessful = null;
  let lastAttempt = 0;
  let pending = false;
  let lastRendered = '';
  let notices = [];
  let previewIndex = 0;
  let playing = !reducedMotion.matches;
  let rotationTimer;

  function scheduleRotation() {
    clearTimeout(rotationTimer);
    if (!playing || notices.length < 2 || !panel.hidden || hovering || document.hidden ||
        toggle === document.activeElement) return;

    rotationTimer = setTimeout(() => {
      previewIndex = (previewIndex + 1) % notices.length;
      preview.textContent = notices[previewIndex].title;
      if (!reducedMotion.matches) {
        preview.animate([
          { transform: 'translateY(100%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ], { duration: 300, easing: 'ease-out' });
      }
      scheduleRotation();
    }, 4500);
  }

  function updatePlayback() {
    const label = playing ? 'Pause notice rotation' : 'Play notice rotation';
    playback.setAttribute('aria-label', label);
    playback.title = label;
    playback.firstElementChild.textContent = playing ? '❚❚' : '▶';
    scheduleRotation();
  }

  function updateDisclosure() {
    const keepFocus = panel.contains(document.activeElement);
    const expanded = pinned || (!hoverSuppressed && (hovering || keepFocus));
    panel.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    scheduleRotation();
  }

  function close() {
    pinned = false;
    hoverSuppressed = true;
    if (panel.contains(document.activeElement)) toggle.focus();
    updateDisclosure();
  }

  root.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch' || !hover.matches) return;
    hovering = true;
    updateDisclosure();
  });
  root.addEventListener('pointerleave', () => {
    hovering = false;
    hoverSuppressed = false;
    updateDisclosure();
  });
  toggle.addEventListener('focus', scheduleRotation);
  root.addEventListener('focusout', () => queueMicrotask(updateDisclosure));
  playback.addEventListener('click', () => {
    playing = !playing;
    updatePlayback();
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) playing = false;
    updatePlayback();
  });
  updatePlayback();
  toggle.addEventListener('click', () => {
    if (pinned) {
      close();
      return;
    }
    pinned = true;
    hoverSuppressed = false;
    updateDisclosure();
    minimize.focus({ preventScroll: true });
  });
  minimize.addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden && !event.defaultPrevented && !document.querySelector('dialog[open]')) {
      close();
    }
  });
  new ResizeObserver(() => {
    const height = bar.offsetHeight;
    document.documentElement.style.setProperty('--notice-height', height + 'px');
  }).observe(bar);

  function render(items, failed = false) {
    const eligible = visibleNotices(items);
    status.textContent = failed
      ? (eligible.length ? 'The latest refresh failed. Showing the most recent available notices.' : 'Updates are temporarily unavailable.')
      : (eligible.length ? '' : 'No current announcements.');
    if (!eligible.length) {
      preview.textContent = failed ? 'Updates temporarily unavailable' : 'No current announcements';
    }
    const signature = JSON.stringify(eligible);
    if (signature === lastRendered) return;
    lastRendered = signature;
    notices = eligible;
    previewIndex = 0;
    if (notices.length) preview.textContent = notices[0].title;
    if (notices.length < 2 && document.activeElement === playback) toggle.focus();
    playback.hidden = notices.length < 2;
    scheduleRotation();
    if (list.contains(document.activeElement)) minimize.focus();
    list.replaceChildren(...notices.map(notice => {
      const item = document.createElement('li');
      const category = document.createElement('p');
      category.className = 'notice-category';
      category.textContent = notice.category;
      const title = document.createElement('h3');
      title.textContent = notice.title;
      const description = document.createElement('p');
      description.className = 'small';
      description.textContent = notice.description;
      item.append(category, title, description);
      const url = safeLink(notice.link);
      if (url) {
        const link = document.createElement('a');
        link.href = url.href;
        link.textContent = 'More information';
        link.setAttribute('aria-label', 'More information about ' + notice.title);
        if (url.origin !== location.origin) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        item.append(link);
      }
      return item;
    }));
  }

  async function refresh() {
    if (pending) return;
    pending = true;
    lastAttempt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), settings.timeoutMs);
    try {
      let items;
      if (settings.mode === 'demo') {
        items = (await content).notices;
      } else if (settings.mode === 'live' && settings.apiUrl) {
        const response = await fetch(settings.apiUrl, {
          method: 'GET', cache: 'no-store', credentials: 'omit',
          redirect: 'follow', signal: controller.signal
        });
        if (!response.ok) throw new Error('Notice response: ' + response.status);
        const result = await response.json();
        if (result?.ok !== true) throw new Error('Notice feed reported a failure.');
        items = result.notices;
      } else {
        throw new Error('Notice mode or API URL is missing.');
      }
      if (!Array.isArray(items)) throw new Error('Invalid notice feed format.');
      lastSuccessful = items;
      render(items);
    } catch (error) {
      console.warn('Could not refresh notices.', error);
      render(lastSuccessful || [], true);
    } finally {
      clearTimeout(timeout);
      pending = false;
    }
  }

  refresh();
  setInterval(() => {
    if (!document.hidden && Date.now() - lastAttempt >= settings.refreshMs) refresh();
  }, settings.refreshMs);
  document.addEventListener('visibilitychange', () => {
    scheduleRotation();
    if (!document.hidden && Date.now() - lastAttempt >= settings.refreshMs) refresh();
  });
}
