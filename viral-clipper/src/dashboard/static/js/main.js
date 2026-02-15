/* ── Mobile Nav Toggle ───────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

/* ── Smooth Scroll for anchor links ──────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

/* ── Contact Form AJAX ───────────────────── */
const form = document.getElementById('contact-form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'SENDING...';
        btn.disabled = true;

        try {
            const res = await fetch('/contact', {
                method: 'POST',
                body: data,
            });

            if (res.ok) {
                const html = await res.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newContact = doc.getElementById('contact');
                const oldContact = document.getElementById('contact');
                if (newContact && oldContact) {
                    oldContact.replaceWith(newContact);
                }
            }
        } catch {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}
