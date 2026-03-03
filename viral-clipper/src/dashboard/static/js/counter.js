/* ── The Number — count up animation ──────── */
function animateCounter(el) {
    const target = parseInt(el.dataset.display || el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2500;
    const start = performance.now();

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        el.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('[data-target]');

if (counters.length > 0) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.3 }
    );

    counters.forEach(counter => observer.observe(counter));
}
