/* ── Scroll-Linked Phone Feed + Dissolution ─ */
(function() {
    var showcase = document.querySelector('.showcase');
    var feeds = document.querySelectorAll('.phone__feed');
    var phonesContainer = document.querySelector('.showcase__phones');
    var totalContainer = document.querySelector('.showcase__total');
    if (!showcase || feeds.length === 0) return;

    var ticking = false;
    var dissolved = false;

    function updateFeeds() {
        var rect = showcase.getBoundingClientRect();
        var sectionHeight = rect.height - window.innerHeight;
        var scrollProgress = Math.max(0, Math.min(1, -rect.top / sectionHeight));

        feeds.forEach(function(feed) {
            var speed = parseFloat(feed.dataset.speed) || 1;
            var videoCount = feed.children.length;
            var maxScroll = (videoCount - 1) * 100;
            var translate = Math.min(scrollProgress * maxScroll * speed, maxScroll);
            feed.style.transform = 'translateY(-' + translate + '%)';
        });

        /* Phone dissolution — when scroll reaches 85%, phones dissolve and stat takes over */
        if (phonesContainer && totalContainer) {
            if (scrollProgress > 0.85 && !dissolved) {
                dissolved = true;
                phonesContainer.classList.add('dissolve');
                totalContainer.classList.add('takeover');
            } else if (scrollProgress <= 0.85 && dissolved) {
                dissolved = false;
                phonesContainer.classList.remove('dissolve');
                totalContainer.classList.remove('takeover');
            }
        }

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


/* ── Live Stats Ticker — numbers keep climbing ── */
(function() {
    var statsNumbers = document.querySelectorAll('.stats__number');
    if (statsNumbers.length === 0) return;

    /* Wait for the initial count-up animation to finish (about 3s), then start ticking */
    setTimeout(function() {
        setInterval(function() {
            statsNumbers.forEach(function(el) {
                var text = el.textContent.replace(/,/g, '');
                var current = parseInt(text.replace(/[^0-9]/g, ''), 10);
                var suffix = el.dataset.suffix || '';
                if (current > 100) {
                    current += Math.floor(Math.random() * 3) + 1;
                    el.textContent = current.toLocaleString() + suffix;
                }
            });
        }, 2500);
    }, 5000);
})();

/* ── Card Engagement Burst — likes fly out on hover (process + stats only) ── */
(function() {
    var cards = document.querySelectorAll('.process__step, .stats__item');

    cards.forEach(function(card) {
        card.addEventListener('mouseenter', function() {
            for (var i = 0; i < 3; i++) {
                var heart = document.createElement('span');
                heart.className = 'card-burst';
                heart.innerHTML = ['❤️', '🔥', '💯', '🚀', '⚡'][Math.floor(Math.random() * 5)];
                heart.style.left = (20 + Math.random() * 60) + '%';
                heart.style.animationDelay = (i * 0.1) + 's';
                card.appendChild(heart);
                setTimeout(function() {
                    if (heart.parentNode) heart.parentNode.removeChild(heart);
                }, 1200);
            }
        });
    });
})();

/* ── Client Logo Hover Hearts ────────────── */
(function() {
    var items = document.querySelectorAll('.clients__item');

    items.forEach(function(item) {
        item.addEventListener('mouseenter', function() {
            for (var i = 0; i < 3; i++) {
                (function(index) {
                    setTimeout(function() {
                        var heart = document.createElement('span');
                        heart.className = 'clients__heart';
                        var size = 10 + Math.floor(Math.random() * 6);
                        heart.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="rgba(102,211,250,0.5)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
                        heart.style.left = (10 + Math.random() * 80) + '%';
                        item.appendChild(heart);
                        setTimeout(function() {
                            if (heart.parentNode) heart.parentNode.removeChild(heart);
                        }, 2000);
                    }, index * 200);
                })(i);
            }
        });
    });
})();

/* ── Hero Word Animations — CLIP / SEED / GROW ── */
(function() {
    var clipWord = document.querySelector('.hero__word--clip');
    var seedWord = document.querySelector('.hero__word--seed');
    var growWord = document.querySelector('.hero__word--grow');
    if (!clipWord || !seedWord || !growWord) return;

    /* ── CLIP — scissors slash + split ── */
    function animateClip() {
        if (clipWord.classList.contains('animating')) return;
        clipWord.classList.add('animating');

        /* Hide original text, show split halves */
        clipWord.style.color = 'transparent';

        var topHalf = document.createElement('span');
        topHalf.className = 'hero__clip-half hero__clip-half--top';
        topHalf.textContent = 'CLIP.';

        var bottomHalf = document.createElement('span');
        bottomHalf.className = 'hero__clip-half hero__clip-half--bottom';
        bottomHalf.textContent = 'CLIP.';

        var slash = document.createElement('span');
        slash.className = 'hero__clip-slash';

        var line = document.createElement('span');
        line.className = 'hero__clip-line';

        clipWord.appendChild(topHalf);
        clipWord.appendChild(bottomHalf);
        clipWord.appendChild(slash);
        clipWord.appendChild(line);

        /* Start slash */
        requestAnimationFrame(function() {
            slash.classList.add('animate');
            line.classList.add('animate');
        });

        /* Sparks at the cut line */
        setTimeout(function() {
            for (var i = 0; i < 8; i++) {
                var spark = document.createElement('span');
                spark.className = 'hero__clip-spark';
                spark.style.left = (25 + Math.random() * 50) + '%';
                spark.style.top = (45 + Math.random() * 10) + '%';
                spark.style.setProperty('--dx', ((Math.random() - 0.5) * 80) + 'px');
                spark.style.setProperty('--dy', ((Math.random() - 0.5) * 50) + 'px');
                clipWord.appendChild(spark);
                (function(s) {
                    setTimeout(function() {
                        if (s.parentNode) s.parentNode.removeChild(s);
                    }, 800);
                })(spark);
            }
        }, 200);

        /* Split the halves apart */
        setTimeout(function() {
            topHalf.classList.add('split');
            bottomHalf.classList.add('split');
        }, 280);

        /* Rejoin */
        setTimeout(function() {
            topHalf.classList.remove('split');
            bottomHalf.classList.remove('split');
        }, 700);

        /* Clean up */
        setTimeout(function() {
            clipWord.style.color = '';
            [slash, line, topHalf, bottomHalf].forEach(function(el) {
                if (el.parentNode) el.parentNode.removeChild(el);
            });
            clipWord.classList.remove('animating');
        }, 1100);
    }

    /* ── SEED — bury + sprout ── */
    function animateSeed() {
        if (seedWord.classList.contains('animating')) return;
        seedWord.classList.add('animating');
        seedWord.classList.add('active');

        /* Dirt particles falling */
        for (var i = 0; i < 14; i++) {
            (function(idx) {
                var dot = document.createElement('span');
                dot.className = 'hero__seed-particle';
                dot.style.left = (Math.random() * 100) + '%';
                dot.style.animationDelay = (Math.random() * 0.3) + 's';
                dot.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
                seedWord.appendChild(dot);
                setTimeout(function() {
                    if (dot.parentNode) dot.parentNode.removeChild(dot);
                }, 1200);
            })(i);
        }

        /* Sprout grows from top */
        setTimeout(function() {
            var sprout = document.createElement('span');
            sprout.className = 'hero__sprout';
            sprout.innerHTML = '<span class="hero__sprout-stem"></span>' +
                '<span class="hero__sprout-leaf hero__sprout-leaf--left"></span>' +
                '<span class="hero__sprout-leaf hero__sprout-leaf--right"></span>';
            seedWord.appendChild(sprout);

            /* Fade out sprout */
            setTimeout(function() {
                sprout.style.opacity = '0';
                sprout.style.transition = 'opacity 0.5s';
                setTimeout(function() {
                    if (sprout.parentNode) sprout.parentNode.removeChild(sprout);
                }, 500);
            }, 2000);
        }, 500);

        /* Un-bury */
        setTimeout(function() {
            seedWord.classList.remove('active');
        }, 900);

        setTimeout(function() {
            seedWord.classList.remove('animating');
        }, 3200);
    }

    /* ── GROW — hearts + scale up ── */
    function animateGrow() {
        if (growWord.classList.contains('animating')) return;
        growWord.classList.add('animating');
        growWord.classList.add('active');

        for (var i = 0; i < 12; i++) {
            (function(idx) {
                setTimeout(function() {
                    var heart = document.createElement('span');
                    heart.className = 'hero__grow-heart';
                    var size = 14 + Math.floor(Math.random() * 16);
                    var colors = ['rgba(252,204,10,0.8)', 'rgba(252,204,10,0.5)', 'rgba(255,255,255,0.4)', 'rgba(238,53,46,0.5)', 'rgba(0,57,166,0.5)'];
                    var color = colors[Math.floor(Math.random() * colors.length)];
                    heart.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + color + '"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
                    heart.style.left = (5 + Math.random() * 90) + '%';
                    heart.style.animationDuration = (1.5 + Math.random() * 1) + 's';
                    growWord.appendChild(heart);
                    setTimeout(function() {
                        if (heart.parentNode) heart.parentNode.removeChild(heart);
                    }, 3000);
                }, idx * 100);
            })(i);
        }

        /* Scale back down */
        setTimeout(function() {
            growWord.classList.remove('active');
        }, 2200);

        setTimeout(function() {
            growWord.classList.remove('animating');
        }, 3500);
    }

    /* Hover triggers */
    clipWord.addEventListener('mouseenter', animateClip);
    seedWord.addEventListener('mouseenter', animateSeed);
    growWord.addEventListener('mouseenter', animateGrow);

    /* Auto-play sequence on page load */
    var hero = document.querySelector('.hero');
    if (hero) {
        var heroWordObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    setTimeout(animateClip, 1000);
                    setTimeout(animateSeed, 2400);
                    setTimeout(animateGrow, 3800);
                    heroWordObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        heroWordObserver.observe(hero);
    }
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
    { sel: '.process__stop', stagger: true },
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
