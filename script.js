/**
 * NATURE PORTFOLIO - PRESENTATION CONTROLLER
 * Slide Deck Navigation, Ambient Nature Audio, Particle Canvas & Profile Customizer
 */

(function () {
  'use strict';

  // --- State & DOM References ---
  const TOTAL_SLIDES = 4;
  let currentSlide = 0;
  let isAnimating = false;

  const slides = document.querySelectorAll('.slide');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const currentNumEl = document.querySelector('.current-num');
  const totalNumEl = document.querySelector('.total-num');
  const progressSegments = document.querySelectorAll('.progress-segment');
  const slideJumpBtns = document.querySelectorAll('.slide-jump-btn');

  // --- Slide Navigation System ---
  function updateSlideUI(index) {
    // Update active class on slides
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev-slide');
      if (i === index) {
        slide.classList.add('active');
        // Reset scroll position on active slide
        slide.scrollTop = 0;
      } else if (i < index) {
        slide.classList.add('prev-slide');
      }
    });

    // Update Counter (01 / 04 format)
    if (currentNumEl) {
      currentNumEl.textContent = String(index + 1).padStart(2, '0');
    }
    if (totalNumEl) {
      totalNumEl.textContent = String(TOTAL_SLIDES).padStart(2, '0');
    }

    // Update Progress Segments
    progressSegments.forEach((seg, i) => {
      seg.classList.toggle('active', i === index);
    });

    // Update Pill Buttons
    slideJumpBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    // Update Next/Prev Button states
    if (btnPrev) {
      btnPrev.disabled = (index === 0);
    }
    if (btnNext) {
      btnNext.disabled = (index === TOTAL_SLIDES - 1);
    }

    // Trigger any active slide animations
    const activeSlide = slides[index];
    if (activeSlide) {
      const staggerItems = activeSlide.querySelectorAll('.stagger-item');
      staggerItems.forEach((el) => {
        el.style.animation = 'none';
        void el.offsetHeight; // trigger reflow
        el.style.animation = '';
      });
    }
  }

  function goToSlide(targetIndex) {
    if (targetIndex < 0 || targetIndex >= TOTAL_SLIDES || targetIndex === currentSlide || isAnimating) {
      return;
    }
    isAnimating = true;
    currentSlide = targetIndex;
    updateSlideUI(currentSlide);
    setTimeout(() => {
      isAnimating = false;
    }, 700);
  }

  function nextSlide() {
    if (currentSlide < TOTAL_SLIDES - 1) {
      goToSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }

  // Bind Buttons
  if (btnNext) btnNext.addEventListener('click', nextSlide);
  if (btnPrev) btnPrev.addEventListener('click', prevSlide);

  // Bind Progress Segments & Header Pills
  progressSegments.forEach((seg) => {
    seg.addEventListener('click', () => {
      const idx = parseInt(seg.getAttribute('data-slide-index'), 10);
      if (!isNaN(idx)) goToSlide(idx);
    });
  });

  slideJumpBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-slide-index'), 10);
      if (!isNaN(idx)) goToSlide(idx);
    });
  });

  // Dedicated Action Buttons inside slides
  document.querySelectorAll('[data-action="next-slide"]').forEach((btn) => {
    btn.addEventListener('click', nextSlide);
  });

  document.querySelectorAll('[data-action="goto-slide"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.getAttribute('data-target-slide'), 10);
      if (!isNaN(target)) goToSlide(target);
    });
  });

  // --- Keyboard Navigation ---
  window.addEventListener('keydown', (e) => {
    // Ignore keys if an input or textarea is active
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(TOTAL_SLIDES - 1);
    } else if (e.key.toLowerCase() === 'e') {
      toggleEditorDrawer();
    }
  });

  // --- Wheel / Trackpad Scroll Navigation (Debounced) ---
  let wheelThrottleTimer = null;
  window.addEventListener('wheel', (e) => {
    if (document.querySelector('.editor-modal-backdrop.open')) return;
    // Allow scroll inside active slide if content overflows
    const activeSlide = slides[currentSlide];
    const isScrollable = activeSlide.scrollHeight > activeSlide.clientHeight;
    
    // If inside scrollable content, let natural scroll happen unless reached bottom/top
    if (isScrollable) {
      const atTop = activeSlide.scrollTop <= 5 && e.deltaY < 0;
      const atBottom = (activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 5) && e.deltaY > 0;
      if (!atTop && !atBottom) return;
    }

    if (wheelThrottleTimer) return;
    if (Math.abs(e.deltaY) > 35) {
      if (e.deltaY > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      wheelThrottleTimer = setTimeout(() => {
        wheelThrottleTimer = null;
      }, 900);
    }
  }, { passive: true });

  // --- Touch Swipe Navigation (Mobile & Tablet) ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTarget = null;

  window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTarget = e.target;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (document.querySelector('.editor-modal-backdrop.open')) return;
    
    // If the user is swiping the horizontal cards carousel on Slide 3, let them swipe cards
    if (touchStartTarget && touchStartTarget.closest('.cards-carousel-container')) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Detect horizontal swipe with minimum threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, { passive: true });


  // --- Ambient Nature Audio Generator (Web Audio API - 100% Offline & Reliable) ---
  let audioCtx = null;
  let isAudioPlaying = false;
  let windGain = null;
  let birdsTimer = null;
  const audioToggleBtn = document.getElementById('toggle-sound-btn');

  function initNatureAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // White/Pink noise buffer for wind breeze
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.11;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Lowpass filter for deep rustling leaves
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, audioCtx.currentTime);

      // Low Frequency Oscillator (LFO) for wind breathing effect
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.18, audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(160, audioCtx.currentTime);
      lfo.connect(filter.frequency);

      windGain = audioCtx.createGain();
      windGain.gain.setValueAtTime(0.001, audioCtx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(windGain);
      windGain.connect(audioCtx.destination);

      whiteNoise.start();
      lfo.start();

      // Gentle random bird chirp synth
      startBirdChirps();
    } catch (err) {
      console.warn('Web Audio not supported or restricted:', err);
    }
  }

  function chirpSound() {
    if (!audioCtx || !isAudioPlaying) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';

      const baseFreq = 2200 + Math.random() * 800;
      const now = audioCtx.currentTime;

      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.12);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.025, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  function startBirdChirps() {
    if (birdsTimer) clearInterval(birdsTimer);
    birdsTimer = setInterval(() => {
      if (isAudioPlaying && Math.random() > 0.45) {
        chirpSound();
        // Occasionally double-chirp
        if (Math.random() > 0.6) {
          setTimeout(chirpSound, 160);
        }
      }
    }, 3800);
  }

  function toggleAudio() {
    if (!audioCtx) {
      initNatureAudio();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isAudioPlaying = !isAudioPlaying;

    if (windGain) {
      const now = audioCtx.currentTime;
      if (isAudioPlaying) {
        windGain.gain.linearRampToValueAtTime(0.4, now + 1.5);
      } else {
        windGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      }
    }

    if (audioToggleBtn) {
      audioToggleBtn.classList.toggle('active', isAudioPlaying);
      const icon = audioToggleBtn.querySelector('.audio-label');
      if (icon) {
        icon.textContent = isAudioPlaying ? 'Suara: On' : 'Suara Alam';
      }
    }

    showToast(isAudioPlaying ? '🍃 Suara alam hutan aktif' : '🔇 Suara alam dinonaktifkan');
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', toggleAudio);
  }


  // --- Floating Leaves Particle Canvas ---
  const canvas = document.getElementById('leaf-canvas');
  let ctx = canvas ? canvas.getContext('2d') : null;
  let leaves = [];
  let isLeavesActive = true;
  let animationFrameId = null;

  const LEAF_COLORS = [
    '#93AF8B', // sage
    '#74956C', // forest sage
    '#B2C9AA', // soft leaf
    '#C8AD8D', // dry sand leaf
    '#DEB158'  // golden autumn leaf
  ];

  class Leaf {
    constructor(w, h) {
      this.reset(w, h, true);
    }

    reset(w, h, initial = false) {
      this.x = Math.random() * w;
      this.y = initial ? Math.random() * h : -30;
      this.size = 12 + Math.random() * 16;
      this.speedY = 0.6 + Math.random() * 1.2;
      this.speedX = -0.5 + Math.random() * 1.0;
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.03;
      this.swaySpeed = 0.02 + Math.random() * 0.02;
      this.swayAngle = Math.random() * Math.PI * 2;
      this.color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
      this.opacity = 0.35 + Math.random() * 0.45;
    }

    update(w, h) {
      this.y += this.speedY;
      this.swayAngle += this.swaySpeed;
      this.x += Math.sin(this.swayAngle) * 0.8 + this.speedX;
      this.angle += this.angularSpeed;

      if (this.y > h + 30 || this.x < -40 || this.x > w + 40) {
        this.reset(w, h);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      // Draw stylized organic leaf shape
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.quadraticCurveTo(this.size / 2, 0, 0, this.size / 2);
      ctx.quadraticCurveTo(-this.size / 2, 0, 0, -this.size / 2);
      ctx.fill();

      // Stem line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(0, this.size / 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initLeaves() {
    if (!canvas || !ctx) return;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const count = window.innerWidth < 768 ? 16 : 32;
    leaves = Array.from({ length: count }, () => new Leaf(canvas.width, canvas.height));
    animateLeaves();
  }

  function animateLeaves() {
    if (!ctx || !isLeavesActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const leaf of leaves) {
      leaf.update(canvas.width, canvas.height);
      leaf.draw(ctx);
    }
    animationFrameId = requestAnimationFrame(animateLeaves);
  }

  const toggleLeavesBtn = document.getElementById('toggle-leaves-btn');
  if (toggleLeavesBtn) {
    toggleLeavesBtn.addEventListener('click', () => {
      isLeavesActive = !isLeavesActive;
      toggleLeavesBtn.classList.toggle('active', isLeavesActive);
      if (isLeavesActive) {
        animateLeaves();
        showToast('🍃 Guguran daun diaktifkan');
      } else {
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationFrameId);
        showToast('Daun dijeda');
      }
    });
  }


  // --- Slide 4 "Send Leaf of Appreciation" Interaction ---
  const sendLeafBtn = document.getElementById('btn-send-leaf');
  const leafCounterBadge = document.getElementById('leaf-counter-badge');
  let leafCounter = parseInt(localStorage.getItem('nature_leaf_count') || '128', 10);

  if (leafCounterBadge) {
    leafCounterBadge.textContent = leafCounter;
  }

  if (sendLeafBtn) {
    sendLeafBtn.addEventListener('click', (e) => {
      leafCounter++;
      localStorage.setItem('nature_leaf_count', leafCounter);
      if (leafCounterBadge) leafCounterBadge.textContent = leafCounter;

      // Burst temporary falling leaves from the button
      const rect = sendLeafBtn.getBoundingClientRect();
      createLeafBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

      showToast('🌿 Terima kasih atas apresiasi hangatmu!');
    });
  }

  function createLeafBurst(originX, originY) {
    for (let i = 0; i < 12; i++) {
      const burstEl = document.createElement('div');
      burstEl.textContent = '🍃';
      burstEl.style.position = 'fixed';
      burstEl.style.left = `${originX}px`;
      burstEl.style.top = `${originY}px`;
      burstEl.style.fontSize = `${18 + Math.random() * 16}px`;
      burstEl.style.pointerEvents = 'none';
      burstEl.style.zIndex = '999';
      burstEl.style.transition = 'all 1.2s cubic-bezier(0.1, 0.8, 0.3, 1)';

      document.body.appendChild(burstEl);

      const angle = (Math.random() * Math.PI * 2);
      const distance = 80 + Math.random() * 120;
      const targetX = originX + Math.cos(angle) * distance;
      const targetY = originY + Math.sin(angle) * distance - 50;

      requestAnimationFrame(() => {
        burstEl.style.transform = `translate(${targetX - originX}px, ${targetY - originY}px) rotate(${Math.random() * 360}deg)`;
        burstEl.style.opacity = '0';
      });

      setTimeout(() => burstEl.remove(), 1200);
    }
  }


  // --- Quick Profile Customizer (Drawer Modal) ---
  // Makes it effortlessly simple for the user to change their name, class, bio, and photo!
  const editorModal = document.getElementById('editor-modal');
  const openEditorBtn = document.getElementById('open-editor-btn');
  const closeEditorBtn = document.getElementById('close-editor-btn');
  const profileForm = document.getElementById('profile-customizer-form');
  const resetProfileBtn = document.getElementById('btn-reset-profile');

  // Fields to customize
  const inputName = document.getElementById('input-name');
  const inputClass = document.getElementById('input-class');
  const inputLocation = document.getElementById('input-location');
  const inputBio = document.getElementById('input-bio');
  const inputPhoto = document.getElementById('input-photo');
  const photoPreviewThumb = document.getElementById('photo-preview-thumb');

  // Target elements in Slide 1
  const targetNameEls = document.querySelectorAll('.user-name-text');
  const targetClassEls = document.querySelectorAll('.user-class-text');
  const targetLocationEls = document.querySelectorAll('.user-location-text');
  const targetBioEl = document.querySelector('.user-bio-text');
  const targetPhotoEl = document.getElementById('profile-photo-img');

  const DEFAULT_PROFILE = {
    name: 'Satria Kiyoshi Suprapto',
    className: 'X TKJ 3',
    location: 'Malang, Jawa Timur',
    bio: 'Selamat datang di ruang portofolio digital saya. Saya seorang pembelajar dan penikmat keteduhan alam, yang percaya bahwa setiap langkah kecil dalam belajar sama seperti benih yang bertumbuh menjadi pohon yang kokoh dan berbuah manis.',
    photoUrl: 'assets/foto-profil.jpg'
  };

  function loadSavedProfile() {
    const saved = localStorage.getItem('nature_portfolio_profile');
    let profile = DEFAULT_PROFILE;
    if (saved) {
      try {
        profile = JSON.parse(saved);
        // If stored profile was the old default, upgrade to new values
        if (profile.name === 'Satria Kiyoshi') {
          profile.name = DEFAULT_PROFILE.name;
        }
        if (profile.className === 'XII MIPA 2') {
          profile.className = DEFAULT_PROFILE.className;
        }
        if (!profile.location || profile.location.includes('Bandung')) {
          profile.location = DEFAULT_PROFILE.location;
        }
        if (!profile.photoUrl || profile.photoUrl.includes('images.unsplash.com/photo-1534528741775-53994a69daeb')) {
          profile.photoUrl = DEFAULT_PROFILE.photoUrl;
        }
      } catch (err) {
        profile = DEFAULT_PROFILE;
      }
    }
    applyProfileToDOM(profile);
    populateForm(profile);
  }

  function applyProfileToDOM(data) {
    targetNameEls.forEach((el) => { el.textContent = data.name; });
    targetClassEls.forEach((el) => { el.textContent = data.className; });
    targetLocationEls.forEach((el) => { el.textContent = data.location || DEFAULT_PROFILE.location; });
    if (targetBioEl) targetBioEl.textContent = data.bio;
    if (targetPhotoEl) targetPhotoEl.src = data.photoUrl;
    if (photoPreviewThumb) photoPreviewThumb.src = data.photoUrl;
  }

  function populateForm(data) {
    if (inputName) inputName.value = data.name;
    if (inputClass) inputClass.value = data.className;
    if (inputLocation) inputLocation.value = data.location || DEFAULT_PROFILE.location;
    if (inputBio) inputBio.value = data.bio;
  }

  function toggleEditorDrawer() {
    if (!editorModal) return;
    editorModal.classList.toggle('open');
  }

  if (openEditorBtn) openEditorBtn.addEventListener('click', toggleEditorDrawer);
  if (closeEditorBtn) closeEditorBtn.addEventListener('click', toggleEditorDrawer);

  if (editorModal) {
    editorModal.addEventListener('click', (e) => {
      if (e.target === editorModal) toggleEditorDrawer();
    });
  }

  // Handle local image file upload preview
  if (inputPhoto) {
    inputPhoto.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          const resultUrl = evt.target.result;
          if (photoPreviewThumb) photoPreviewThumb.src = resultUrl;
          if (targetPhotoEl) targetPhotoEl.src = resultUrl;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Save profile changes
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedProfile = {
        name: inputName.value.trim() || DEFAULT_PROFILE.name,
        className: inputClass.value.trim() || DEFAULT_PROFILE.className,
        location: (inputLocation ? inputLocation.value.trim() : '') || DEFAULT_PROFILE.location,
        bio: inputBio.value.trim() || DEFAULT_PROFILE.bio,
        photoUrl: photoPreviewThumb.src || DEFAULT_PROFILE.photoUrl
      };

      localStorage.setItem('nature_portfolio_profile', JSON.stringify(updatedProfile));
      applyProfileToDOM(updatedProfile);
      toggleEditorDrawer();
      showToast('✨ Profil berhasil diperbarui!');
    });
  }

  // Reset to default
  if (resetProfileBtn) {
    resetProfileBtn.addEventListener('click', () => {
      localStorage.removeItem('nature_portfolio_profile');
      applyProfileToDOM(DEFAULT_PROFILE);
      populateForm(DEFAULT_PROFILE);
      showToast('🔄 Profil dikembalikan ke default');
    });
  }


  // --- Toast Notification Helper ---
  const toastEl = document.getElementById('nature-toast');
  let toastTimeout = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.querySelector('.toast-msg').textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  }

  // Copy contact actions
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`📋 Disalin: ${textToCopy}`);
        }).catch(() => {
          showToast(`Kontak: ${textToCopy}`);
        });
      } else {
        showToast(`Kontak: ${textToCopy}`);
      }
    });
  });


  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', () => {
    updateSlideUI(0);
    initLeaves();
    loadSavedProfile();
  });

})();
