const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const header = document.querySelector('.site-header');
const yearEl = document.querySelector('#year');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

window.addEventListener('scroll', () => {
  if (!header) return;
  if (window.scrollY > 8) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

const collapsibleSections = document.querySelectorAll('.collapsible-section');

function openSection(section) {
  const button = section.querySelector('.section-toggle');
  const content = section.querySelector('.section-content');
  if (!button || !content) return;

  section.classList.add('is-open');
  button.setAttribute('aria-expanded', 'true');

  if (content.style.maxHeight === 'none') {
    return;
  }

  const targetHeight = content.scrollHeight;
  content.style.maxHeight = `${targetHeight}px`;

  const onTransitionEnd = (event) => {
    if (event.propertyName !== 'max-height') return;
    if (section.classList.contains('is-open')) {
      content.style.maxHeight = 'none';
    }
    content.removeEventListener('transitionend', onTransitionEnd);
  };

  content.addEventListener('transitionend', onTransitionEnd);
}

function closeSection(section) {
  const button = section.querySelector('.section-toggle');
  const content = section.querySelector('.section-content');
  if (!button || !content) return;

  if (content.style.maxHeight === 'none') {
    content.style.maxHeight = `${content.scrollHeight}px`;
    content.offsetHeight;
  }

  section.classList.remove('is-open');
  button.setAttribute('aria-expanded', 'false');
  content.style.maxHeight = '0px';
}

collapsibleSections.forEach((section) => {
  const button = section.querySelector('.section-toggle');
  const content = section.querySelector('.section-content');
  if (!button || !content) return;

  const isInitiallyOpen = section.classList.contains('is-open');
  button.setAttribute('aria-expanded', String(isInitiallyOpen));
  content.style.maxHeight = isInitiallyOpen ? 'none' : '0px';

  button.addEventListener('click', () => {
    if (section.classList.contains('is-open')) {
      closeSection(section);
    } else {
      openSection(section);
    }
  });
});

document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const targetId = link.getAttribute('href');
    if (!targetId) return;
    const targetSection = document.querySelector(targetId);
    if (!targetSection || !targetSection.classList.contains('collapsible-section')) return;
    if (!targetSection.classList.contains('is-open')) {
      openSection(targetSection);
    }
  });
});

if (window.location.hash) {
  const hashTarget = document.querySelector(window.location.hash);
  if (hashTarget && hashTarget.classList.contains('collapsible-section')) {
    openSection(hashTarget);
  }
}

window.addEventListener('resize', () => {
  collapsibleSections.forEach((section) => {
    if (!section.classList.contains('is-open')) return;
    const content = section.querySelector('.section-content');
    if (!content) return;

    if (content.style.maxHeight !== 'none') {
      content.style.maxHeight = `${content.scrollHeight}px`;
    }
  });
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -24px 0px'
  });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
