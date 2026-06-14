/* ===== Navigation ===== */
const menuBtn = document.getElementById('menuBtn');
const siteNav = document.getElementById('siteNav');

menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('is-open');
  siteNav.classList.toggle('is-open');
});

siteNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuBtn.classList.remove('is-open');
    siteNav.classList.remove('is-open');
  });
});

/* ===== Page 1: Gravity Playground (GSAP) ===== */
window.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.codrops_mwg');
  if (!root || typeof gsap === 'undefined') return;

  const mediaData = [];
  root.querySelectorAll('.medias img').forEach(img => {
    mediaData.push({
      src: img.getAttribute('src'),
      shape: img.dataset.shape || 'circle'
    });
  });

  let incr = 0;
  let oldIncrX = 0;
  let oldIncrY = 0;
  let firstMove = true;
  let indexImg = 0;

  const isCoarsePointer = window.matchMedia('(hover: none)').matches;
  const resetDist = window.innerWidth / (isCoarsePointer ? 5 : 7);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const clampX = gsap.utils.clamp(0, W);
  const clampY = gsap.utils.clamp(0, H);

  function applyMove(clientX, clientY) {
    const valX = clampX(clientX);
    const valY = clampY(clientY);

    if (firstMove) {
      firstMove = false;
      oldIncrX = valX;
      oldIncrY = valY;
      return;
    }

    incr += Math.abs(valX - oldIncrX) + Math.abs(valY - oldIncrY);

    if (incr > resetDist) {
      incr = 0;
      createMedia(valX, valY - root.getBoundingClientRect().top, valX - oldIncrX, valY - oldIncrY);
    }

    oldIncrX = valX;
    oldIncrY = valY;
  }

  function handleMouseMove(e) {
    applyMove(e.clientX, e.clientY);
  }

  function handleTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    applyMove(e.touches[0].clientX, e.touches[0].clientY);
  }

  root.addEventListener('mousemove', handleMouseMove);
  root.addEventListener('touchstart', handleTouchMove, { passive: true });
  root.addEventListener('touchmove', handleTouchMove, { passive: true });

  function createMedia(x, y, deltaX, deltaY) {
    const viewH = window.innerHeight;
    if (y > viewH - 180) return;

    const data = mediaData[indexImg];
    const image = document.createElement('img');
    image.setAttribute('src', data.src);
    image.className = `falling-card falling-card--${data.shape}`;
    image.alt = '';
    root.appendChild(image);

    const tl = gsap.timeline({
      onComplete: () => {
        root.removeChild(image);
        tl.kill();
      }
    });

    tl.fromTo(image, {
      xPercent: -50 + (Math.random() - 0.5) * 80,
      yPercent: -50 + (Math.random() - 0.5) * 10,
      scaleX: 1.3,
      scaleY: 1.3,
      rotation: (Math.random() - 0.5) * 20
    }, {
      scaleX: 1,
      scaleY: 1,
      ease: 'elastic.out(2, 0.6)',
      duration: 0.4
    });

    tl.fromTo(image, { x }, {
      x: '+=' + deltaX * 2,
      rotation: 0,
      ease: 'power1.in',
      duration: 0.4
    }, '<');

    tl.fromTo(image, { y }, {
      y: '+=' + (viewH - y),
      scale: 0.9,
      yPercent: -95,
      ease: 'back.in(1.1)',
      duration: 0.4
    }, '<');

    tl.to(image, {
      x: '+=' + deltaX * 1.6,
      rotation: (Math.random() - 0.5) * 40,
      ease: 'power1.in',
      duration: 0.3
    });

    tl.to(image, {
      yPercent: 150,
      ease: 'back.in(' + (1.5 + (1 - y / viewH)) + ')',
      duration: 0.3
    }, '<');

    indexImg = (indexImg + 1) % mediaData.length;
  }
});

/* ===== Page 2: 3D Ring Card Carousel ===== */
(function () {
  const ring = document.getElementById('carouselRing');
  const cards = Array.from(ring.querySelectorAll('.video-card'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const total = cards.length;
  const angleStep = 360 / total;

  let current = 0;

  function getRadius() {
    return window.innerWidth < 768 ? 220 : 380;
  }

  function normalizeDiff(i) {
    let diff = i - current;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  }

  function updateCarousel() {
    const radius = getRadius();
    
    // ⭐ 修复核心：大圆环保持居中，不进行 rotateY 旋转，避免子元素基准坐标乱掉
    ring.style.transform = `translate(-50%, -50%)`;

    cards.forEach((card, i) => {
      const diff = normalizeDiff(i);
      const angleDeg = diff * angleStep;
      const angleRad = (angleDeg * Math.PI) / 180;
      
      // 依据当前卡片与激活卡片的角度差，动态计算完美的 3D 空间坐标
      const translateX = Math.sin(angleRad) * radius;
      const translateZ = Math.cos(angleRad) * radius;
      const depth = Math.cos(angleRad);
      
      const isActive = diff === 0;
      card.classList.toggle('is-active', isActive);

      const scale = isActive ? 1.1 : 0.58 + 0.32 * Math.max(0, depth);
      const opacity = depth < -0.45 ? 0 : isActive ? 1 : 0.18 + 0.62 * Math.max(0, depth);
      const blur = isActive ? 0 : Math.max(0, (1 - depth) * 4);

      card.style.opacity = String(opacity);
      card.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';
      card.style.pointerEvents = Math.abs(diff) <= 2 && depth > -0.35 ? 'auto' : 'none';
      card.style.zIndex = String(Math.round((depth + 1) * 50));

      const w = card.offsetWidth || card.getBoundingClientRect().width;
      const h = card.offsetHeight || w * 9 / 16;

      card.style.marginLeft = `${-w / 2}px`;
      card.style.marginTop = `${-h / 2}px`;
      
      // ⭐ 通过控制每个卡片自身的旋转和弧度平移，确保当前项永远正对屏幕且处于中心点
      card.style.transform =
        `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${angleDeg}deg) scale(${scale})`;
    });
  }

  function goTo(index) {
    current = (index + total) % total;
    updateCarousel();
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('a')) {
        if (i !== current) goTo(i);
      }
    });
  });

  window.addEventListener('resize', updateCarousel);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        updateCarousel();
      }
    });
  }, { threshold: 0.4 });

  observer.observe(document.getElementById('works'));
  requestAnimationFrame(() => {
    requestAnimationFrame(updateCarousel);
  });
})();
