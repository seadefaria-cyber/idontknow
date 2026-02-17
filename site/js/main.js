/* ── Add Reveal Classes via JS ────────────── */
/* Applied via JS so content is visible if JS fails */
const revealSelectors = [
    { sel: '.hero__eyebrow', delay: 0 },
    { sel: '.hero__headline', delay: 1 },
    { sel: '.hero__sub', delay: 2 },
    { sel: '.hero__ctas', delay: 3 },
    { sel: '.showcase__eyebrow', delay: 0 },
    { sel: '.showcase__headline', delay: 1 },
    { sel: '.showcase__phone', stagger: true },
    { sel: '.showcase__total', delay: 0 },
    { sel: '.stats__item', stagger: true },
    { sel: '.services__headline', delay: 0 },
    { sel: '.card', stagger: true },
    { sel: '.process__headline', delay: 0 },
    { sel: '.process__sub', delay: 1 },
    { sel: '.process__step', stagger: true },
    { sel: '.philosophy__headline', delay: 0 },
    { sel: '.philosophy__text', stagger: true },
    { sel: '.contact__headline', delay: 0 },
    { sel: '.contact__sub', delay: 1 },
    { sel: '.contact__form', delay: 2 },
];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    revealSelectors.forEach(({ sel, delay, stagger }) => {
        const els = document.querySelectorAll(sel);
        els.forEach((el, i) => {
            el.classList.add('reveal');
            if (stagger) {
                el.classList.add(`delay-${Math.min(i + 1, 4)}`);
            } else if (delay) {
                el.classList.add(`delay-${delay}`);
            }
        });
    });
}

/* ── Scroll Reveal ────────────────────────── */
const reveals = document.querySelectorAll('.reveal');

if (reveals.length > 0) {
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    reveals.forEach(el => revealObserver.observe(el));
}

/* ── Mobile Nav Toggle ───────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

/* ── Smooth Scroll ───────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
