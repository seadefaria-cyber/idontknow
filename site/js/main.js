/* ── Scroll-Linked Phone Feed ───────────── */
(function() {
    var showcase = document.querySelector('.showcase');
    var feeds = document.querySelectorAll('.phone__feed');
    if (!showcase || feeds.length === 0) return;

    var ticking = false;

    function updateFeeds() {
        var rect = showcase.getBoundingClientRect();
        var sectionHeight = rect.height - window.innerHeight;
        var scrollProgress = Math.max(0, Math.min(1, -rect.top / sectionHeight));

        feeds.forEach(function(feed) {
            var speed = parseFloat(feed.dataset.speed) || 1;
            var videoCount = feed.children.length;
            var maxScroll = (videoCount - 1) * 100;
            var translate = scrollProgress * maxScroll * speed;
            feed.style.transform = 'translateY(-' + translate + '%)';
        });

        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateFeeds);
            ticking = true;
        }
    }, { passive: true });

    updateFeeds();
})();

/* ── Twitch Chat Simulation ─────────────── */
(function() {
    var chat = document.getElementById('twitch-chat');
    if (!chat) return;

    var colors = ['#66D3FA', '#90EE90', '#E8E847', '#F5A623', '#E74C3C', '#FF69B4', '#00CED1', '#FFD700'];
    var users = [
        'clipmaster99', 'viralking', 'seedbot3000', 'growthguru',
        'algohacker', 'trendchaser', 'reelsniper', 'cloutfarmer',
        'viewbot_real', 'fyp_wizard', 'shortsking', 'engagementpro',
        'contentfiend', 'platformjumper', 'niche_lord'
    ];
    var messages = [
        'this clip is insane',
        'how do they always find the best moments',
        'going viral rn',
        'the algorithm loves this',
        'every clip hits different',
        'seeding is an art fr',
        'content machine',
        'numbers dont lie',
        'another W',
        'the reach on this is crazy',
        'how is this organic lol',
        'fan pages going crazy',
        'this is how you grow',
        'multi platform distribution hits',
        'clipping game strong',
        'the captions make it',
        'watch time through the roof'
    ];

    function addMessage() {
        var msg = document.createElement('div');
        msg.className = 'twitch-chat__msg';
        var user = users[Math.floor(Math.random() * users.length)];
        var color = colors[Math.floor(Math.random() * colors.length)];
        var text = messages[Math.floor(Math.random() * messages.length)];
        msg.innerHTML = '<span class="twitch-chat__user" style="color:' + color + '">' + user + ':</span> ' + text;
        chat.appendChild(msg);

        if (chat.children.length > 20) {
            chat.removeChild(chat.firstChild);
        }
        chat.scrollTop = chat.scrollHeight;
    }

    setInterval(addMessage, 2200);
    addMessage();
})();

/* ── Floating Engagement Likes ───────────── */
(function() {
    var container = document.getElementById('engagement-likes');
    if (!container) return;

    function addHeart() {
        var el = document.createElement('span');
        el.className = 'engagement-likes__heart';
        var size = 18 + Math.floor(Math.random() * 14);
        var alpha = 0.25 + Math.random() * 0.35;
        el.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="rgba(102,211,250,' + alpha + ')"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        el.style.left = (Math.random() * 90) + '%';
        el.style.animationDuration = (2.8 + Math.random() * 1.5) + 's';
        container.appendChild(el);

        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 4000);
    }

    setInterval(addHeart, 800);
    addHeart();
})();

/* ── Scroll Fade — Hero Overlays ─────────── */
(function() {
    var chat = document.getElementById('twitch-chat');
    var likes = document.getElementById('engagement-likes');
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var ticking = false;

    function updateFade() {
        var rect = hero.getBoundingClientRect();
        var heroBottom = rect.bottom;
        var fadeStart = window.innerHeight * 0.6;
        var opacity = Math.max(0, Math.min(1, heroBottom / fadeStart));

        if (chat) chat.style.opacity = opacity * 0.35;
        if (likes) likes.style.opacity = opacity;
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateFade);
            ticking = true;
        }
    }, { passive: true });

    updateFade();
})();

/* ── Phone Status Bar — Live Time ────────── */
(function() {
    var timeEl = document.getElementById('status-time');
    if (!timeEl) return;

    function updateTime() {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        m = m < 10 ? '0' + m : m;
        timeEl.textContent = h + ':' + m + ' ' + ampm;
    }

    updateTime();
    setInterval(updateTime, 30000);
})();

/* ── Reveal Animations ───────────────────── */
var revealSelectors = [
    { sel: '.hero__headline', delay: 0 },
    { sel: '.hero__sub', delay: 1 },
    { sel: '.hero__desc', delay: 2 },
    { sel: '.hero__inner .btn', delay: 3 },
    { sel: '.showcase__eyebrow', delay: 0 },
    { sel: '.showcase__headline', delay: 1 },
    { sel: '.showcase__phone', stagger: true },
    { sel: '.showcase__total', delay: 0 },
    { sel: '.stats__item', stagger: true },
    { sel: '.services__eyebrow', delay: 0 },
    { sel: '.services__headline', delay: 1 },
    { sel: '.card', stagger: true },
    { sel: '.creative__eyebrow', delay: 0 },
    { sel: '.creative__headline', delay: 1 },
    { sel: '.creative__sub', delay: 2 },
    { sel: '.creative__item', stagger: true },
    { sel: '.process__headline', delay: 0 },
    { sel: '.process__sub', delay: 1 },
    { sel: '.process__step', stagger: true },
    { sel: '.about__headline', delay: 0 },
    { sel: '.about__text', stagger: true },
    { sel: '.contact__headline', delay: 0 },
    { sel: '.contact__sub', delay: 1 },
    { sel: '.contact__form', delay: 2 },
];

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    revealSelectors.forEach(function(item) {
        var els = document.querySelectorAll(item.sel);
        els.forEach(function(el, i) {
            el.classList.add('reveal');
            if (item.stagger) {
                el.classList.add('delay-' + Math.min(i + 1, 4));
            } else if (item.delay) {
                el.classList.add('delay-' + item.delay);
            }
        });
    });
}

/* ── Scroll Reveal Observer ──────────────── */
var reveals = document.querySelectorAll('.reveal');

if (reveals.length > 0) {
    var revealObserver = new IntersectionObserver(
        function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    reveals.forEach(function(el) { revealObserver.observe(el); });
}

/* ── Mobile Nav Toggle ───────────────────── */
var hamburger = document.getElementById('hamburger');
var navLinks = document.getElementById('nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

/* ── Smooth Scroll ───────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        var target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
