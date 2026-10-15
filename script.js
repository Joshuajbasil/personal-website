'use strict';

// Mobile navigation: supports touch, keyboard, Escape, and outside clicks.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});

// Update copyright automatically.
document.querySelectorAll('.year').forEach(element => {
  element.textContent = new Date().getFullYear();
});

// Parallax uses transforms, updates once per frame, and only moves decoration.
// Positive data-speed moves with the scroll; negative moves against it.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Give lower sections their own decorative layers at different scroll speeds.
document.querySelectorAll('#about, #skills, #experience, #projects').forEach((section, index) => {
  const decoration = document.createElement('div');
  decoration.className = 'scroll-decoration parallax';
  decoration.dataset.speed = index % 2 ? '-0.12' : '0.16';
  decoration.setAttribute('aria-hidden', 'true');
  section.prepend(decoration);
});
const heroPattern = document.querySelector('.hero-pattern');
heroPattern.classList.add('parallax');
heroPattern.dataset.speed = '0.22';
const layers = [...document.querySelectorAll('[data-speed]')];
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...navigation.querySelectorAll('a')];
let framePending = false;
function updateScroll() {
  framePending = false;
  const viewportHeight = window.innerHeight;
  layers.forEach(layer => {
    if (reducedMotion.matches) {
      layer.style.removeProperty('transform');
      return;
    }
    const bounds = layer.parentElement.getBoundingClientRect();
    if (bounds.bottom >= 0 && bounds.top <= viewportHeight) {
      // Relative to each section so the lower-page decoration never flies away.
      const offset = Math.max(-180, Math.min(180, -bounds.top * Number(layer.dataset.speed)));
      layer.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
  });
  // Mark the most recently reached section. At the bottom, select Contact.
  const threshold = document.querySelector('.header').offsetHeight + 100;
  let current = 'home';
  sections.forEach(section => {
    if (section.getBoundingClientRect().top <= threshold) current = section.id;
  });
  if (window.scrollY + viewportHeight >= document.documentElement.scrollHeight - 4) current = 'contact';
  navLinks.forEach(link => {
    if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function requestUpdate() {
  if (!framePending) {
    framePending = true;
    window.requestAnimationFrame(updateScroll);
  }
}
window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 700) closeMenu();
  requestUpdate();
});
reducedMotion.addEventListener('change', requestUpdate);
updateScroll();

// Reveal content once as it enters the viewport. Content remains visible if JS
// or IntersectionObserver is unavailable, or reduced motion is requested.
const revealTargets = [...document.querySelectorAll(
  '.section-label, .section-heading, .about-intro, .about-copy, .skill-group, .experience-row, .project-card, .contact-content > :not(.section-label)'
)];
let revealObserver;
function showReveal(element) {
  element.classList.add('is-revealed');
  if (revealObserver) revealObserver.unobserve(element);
}
function setupReveals() {
  if (revealObserver) revealObserver.disconnect();
  revealTargets.forEach(element => element.classList.remove('scroll-reveal', 'is-revealed'));
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) showReveal(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach(element => {
    // Keep restored scroll positions and initial viewport content visible.
    if (element.getBoundingClientRect().top < window.innerHeight - 40) return;
    const siblings = [...element.parentElement.children].filter(child => revealTargets.includes(child));
    const index = siblings.indexOf(element);
    element.style.setProperty('--reveal-delay', `${Math.min(index, 2) * 85}ms`);
    const side = element.matches('.about-intro, .experience-row') ? '-32px'
      : element.matches('.about-copy, .project-card') ? '32px' : '0px';
    element.style.setProperty('--reveal-x', side);
    element.classList.add('scroll-reveal');
    revealObserver.observe(element);
  });
}
document.addEventListener('focusin', event => {
  const target = event.target.closest('.scroll-reveal');
  if (target) showReveal(target);
});
reducedMotion.addEventListener('change', setupReveals);
setupReveals();

// A soft mouse spotlight, with updates limited to one per animation frame.
const mousePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const cursorGlow = document.createElement('div');
cursorGlow.className = 'cursor-glow';
cursorGlow.setAttribute('aria-hidden', 'true');
document.body.appendChild(cursorGlow);
let cursorFrame = null;
let cursorX = 0;
let cursorY = 0;
function hideCursorGlow() {
  cursorGlow.classList.remove('is-visible');
  if (cursorFrame !== null) {
    window.cancelAnimationFrame(cursorFrame);
    cursorFrame = null;
  }
}
window.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !mousePointer.matches || reducedMotion.matches) {
    hideCursorGlow();
    return;
  }
  cursorX = event.clientX;
  cursorY = event.clientY;
  if (cursorFrame === null) {
    cursorFrame = window.requestAnimationFrame(() => {
      cursorGlow.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      cursorGlow.classList.add('is-visible');
      cursorFrame = null;
    });
  }
}, { passive: true });
document.documentElement.addEventListener('pointerleave', hideCursorGlow);
window.addEventListener('blur', hideCursorGlow);
document.addEventListener('visibilitychange', hideCursorGlow);
mousePointer.addEventListener('change', hideCursorGlow);
reducedMotion.addEventListener('change', hideCursorGlow);

// Use the service's normal POST flow so verification and activation can appear.
const contactForm = document.querySelector('#contact-form');
contactForm.addEventListener('submit', event => {
  const status = document.querySelector('#contact-status');
  for (const name of ['name', 'email', 'subject', 'message']) {
    const input = contactForm.elements.namedItem(name);
    input.value = input.value.trim();
  }
  if (!contactForm.reportValidity()) {
    event.preventDefault();
    return;
  }
  contactForm.elements.namedItem('_subject').value = `Portfolio: ${contactForm.elements.namedItem('subject').value}`;
  // Set explicit absolute URLs at submission time as well as in the HTML.
  contactForm.elements.namedItem('_next').value = 'https://joshuajbasil.github.io/personal-website/thanks.html';
  contactForm.elements.namedItem('_url').value = 'https://joshuajbasil.github.io/personal-website/';
  status.textContent = 'Continuing to email verification…';
  // Let the browser submit the form. Do not replace this with a cross-origin
  // fetch: verification and activation are handled on FormSubmit's page.
});
