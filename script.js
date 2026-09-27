const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('#site-nav');
const navMenus = Array.from(document.querySelectorAll('.nav-menu'));
const navAnchors = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
const revealItems = Array.from(document.querySelectorAll('.reveal'));
const year = document.querySelector('#year');
const progressBar = document.querySelector('.scroll-progress span');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Lambda-style label scramble: a short glyph burst resolves left to right. */
const scrambleControls = Array.from(document.querySelectorAll('[data-scramble-control]'));
const scrambleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}+-_*';
const scrambleRuns = new WeakMap();
const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');
let scrambleRunId = 0;

function getScrambleTarget(control) {
  return control?.querySelector('[data-scramble-target]') || null;
}

function setFinalScrambleText(control) {
  const target = getScrambleTarget(control);
  if (!target) return;

  const finalText = target.textContent.trim();
  target.dataset.scrambleText = finalText;
  target.setAttribute('aria-hidden', 'true');

  if (!control.hasAttribute('aria-label')) {
    control.setAttribute('aria-label', finalText);
  }

  window.requestAnimationFrame(() => {
    const width = target.getBoundingClientRect().width;
    if (width > 0) target.style.setProperty('--scramble-width', `${Math.ceil(width)}px`);
  });
}

scrambleControls.forEach((control) => {
  setFinalScrambleText(control);

  // Reuse the existing label animation for navigation and document buttons.
  control.addEventListener('pointerenter', (event) => {
    if (hoverCapable.matches && event.pointerType !== 'touch') scrambleLabel(control);
  });
  control.addEventListener('focus', () => {
    if (control.matches(':focus-visible')) scrambleLabel(control);
  });
});

function scrambleCharacterFor(character, frame, index) {
  const code = character.codePointAt(0) || 0;
  const glyphIndex = Math.abs((frame + 1) * 17 + index * 31 + code * 7) % scrambleCharacters.length;
  const glyph = scrambleCharacters[glyphIndex];

  if (/[a-z]/.test(character) && /[A-Z]/.test(glyph)) return glyph.toLowerCase();
  return glyph;
}

function settleScramble(control) {
  const target = getScrambleTarget(control);
  if (!target) return;

  const activeRun = scrambleRuns.get(target);
  if (activeRun?.delayTimer) window.clearTimeout(activeRun.delayTimer);
  if (activeRun?.rafId) window.cancelAnimationFrame(activeRun.rafId);

  target.textContent = target.dataset.scrambleText || target.textContent;
  target.classList.remove('is-scrambling');
  control.classList.remove('is-label-scrambling');
  scrambleRuns.delete(target);
}

function scrambleLabel(control, options = {}) {
  const { force = false, delay = 0 } = options;
  const target = getScrambleTarget(control);
  if (!target) return;

  const finalText = target.dataset.scrambleText || target.textContent.trim();
  if (!finalText) return;

  if (reducedMotion) {
    target.textContent = finalText;
    return;
  }

  const now = performance.now();
  const lastRun = Number(control.dataset.lastScramble || 0);
  if (!force && delay === 0 && now - lastRun < 300) return;

  const previousRun = scrambleRuns.get(target);
  if (previousRun?.delayTimer) window.clearTimeout(previousRun.delayTimer);
  if (previousRun?.rafId) window.cancelAnimationFrame(previousRun.rafId);

  if (delay > 0) {
    const delayTimer = window.setTimeout(() => scrambleLabel(control, { force: true }), delay);
    scrambleRuns.set(target, { delayTimer, rafId: 0 });
    return;
  }

  control.dataset.lastScramble = String(now);
  const runId = String(++scrambleRunId);
  const characters = Array.from(finalText);
  const scrambleableIndexes = characters
    .map((character, index) => (/[A-Za-z0-9]/.test(character) ? index : -1))
    .filter((index) => index >= 0);
  const orderByIndex = new Map(scrambleableIndexes.map((index, order) => [index, order]));
  const duration = Math.min(720, Math.max(430, 310 + scrambleableIndexes.length * 21));
  const holdDuration = 72;
  const startTime = performance.now();
  let rafId = 0;

  target.dataset.scrambleRun = runId;
  target.classList.add('is-scrambling');
  control.classList.add('is-label-scrambling');

  function renderFrame(timestamp) {
    if (target.dataset.scrambleRun !== runId) return;

    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(1, Math.max(0, (elapsed - holdDuration) / (duration - holdDuration)));
    const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
    const resolvedCount = Math.floor(easedProgress * (scrambleableIndexes.length + 1));
    const glyphFrame = Math.floor(elapsed / 38);

    target.textContent = characters.map((character, index) => {
      const order = orderByIndex.get(index);
      if (order === undefined || order < resolvedCount) return character;
      return scrambleCharacterFor(character, glyphFrame, index);
    }).join('');

    if (elapsed < duration) {
      rafId = window.requestAnimationFrame(renderFrame);
      scrambleRuns.set(target, { delayTimer: 0, rafId });
      return;
    }

    target.textContent = finalText;
    target.classList.remove('is-scrambling');
    control.classList.remove('is-label-scrambling');
    scrambleRuns.delete(target);
  }

  rafId = window.requestAnimationFrame(renderFrame);
  scrambleRuns.set(target, { delayTimer: 0, rafId });
}

function scrambleMenuItems(menu, force = false) {
  const items = Array.from(menu.querySelectorAll('.nav-panel > [data-scramble-control]'));
  items.forEach((item, index) => {
    scrambleLabel(item, { force, delay: index * 58 });
  });
}

function closeSubmenus(exceptMenu = null) {
  navMenus.forEach((menu) => {
    if (menu === exceptMenu) return;
    menu.classList.remove('open');
    const button = menu.querySelector('.nav-menu-button');
    if (button) button.setAttribute('aria-expanded', 'false');
    menu.querySelectorAll('.nav-panel > [data-scramble-control]').forEach(settleScramble);
  });
}

function closeNavigation() {
  if (!siteNav || !navToggle) return;
  siteNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open navigation');
  closeSubmenus();
}

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (!open) closeSubmenus();
  });
}

navMenus.forEach((menu) => {
  const button = menu.querySelector('.nav-menu-button');
  if (!button) return;

  button.addEventListener('pointerenter', () => {
    if (!hoverCapable.matches || window.innerWidth <= 980) return;

    window.requestAnimationFrame(() => scrambleMenuItems(menu, true));
  });

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !menu.classList.contains('open');

    closeSubmenus(menu);
    menu.classList.toggle('open', willOpen);
    button.setAttribute('aria-expanded', String(willOpen));

    if (!willOpen) menu.querySelectorAll('.nav-panel > [data-scramble-control]').forEach(settleScramble);
  });
});

document.querySelectorAll('.site-nav a[href$=".pdf"]').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 980) closeNavigation();
    else closeSubmenus();
  });
});

navAnchors.forEach((link) => {
  link.addEventListener('click', () => {
    const parentMenu = link.closest('.nav-menu');
    if (parentMenu) {
      parentMenu.classList.add('suppress-hover');
      window.setTimeout(() => parentMenu.classList.remove('suppress-hover'), 360);
    }

    if (window.innerWidth <= 980) closeNavigation();
    else closeSubmenus();
    link.blur();
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-menu')) closeSubmenus();
  if (siteNav?.classList.contains('open') && !event.target.closest('.site-header')) {
    closeNavigation();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  closeSubmenus();
  if (window.innerWidth <= 980) closeNavigation();
});

function updatePageState() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)) : 0;

  if (header) header.classList.toggle('scrolled', scrollTop > 6);
  if (progressBar) progressBar.style.setProperty('--scroll-progress', `${percent}%`);
}

window.addEventListener('scroll', updatePageState, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 980 && siteNav?.classList.contains('open')) {
    closeNavigation();
  }
  updatePageState();
});
updatePageState();

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -32px 0px'
  });

  revealItems.forEach((item) => revealObserver.observe(item));
}

const observedSections = navAnchors
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && observedSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const activeHash = `#${visible.target.id}`;

    navAnchors.forEach((link) => {
      const active = link.getAttribute('href') === activeHash;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    navMenus.forEach((menu) => {
      const containsActive = Boolean(menu.querySelector(`a[href="${activeHash}"]`));
      menu.classList.toggle('active', containsActive);
    });
  }, {
    threshold: [0.08, 0.2, 0.4],
    rootMargin: '-20% 0px -62% 0px'
  });

  observedSections.forEach((section) => sectionObserver.observe(section));
}

if (year) year.textContent = new Date().getFullYear();
