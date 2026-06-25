// --- Product Data Model (All deliverables are Shulker Boxes!) ---
const products = [
  // --- Other Server Items ---
  {
    id: 'other-giftcard',
    name: 'Shulker of Gift Cards ($25)',
    server: 'other',
    category: 'packs',
    price: 25.00,
    image: 'assets/logo_transparent.png',
    desc: 'Contains a physical voucher redeemable in-game for $25 of store credit on any server. Packed in a signature glowing purple shulker box.'
  },
  {
    id: 'other-cape',
    name: 'Shulker of Cape Vouchers',
    server: 'other',
    category: 'items',
    price: 3.49,
    image: 'assets/logo_transparent.png',
    desc: 'Delivers a custom cape texture voucher. Redeemable on our site to apply a glowing cape design visible to all OptiFine/Labymod users. Shipped in a shulker box.'
  },
  {
    id: 'other-nitro',
    name: 'Shulker of Nitro Codes',
    server: 'other',
    category: 'packs',
    price: 9.99,
    image: 'assets/logo_transparent.png',
    desc: 'Get a 1-month Discord Nitro subscription code voucher. The voucher is placed inside a custom shulker box delivered to your in-game mailbox.'
  },
  {
    id: 'other-lifesteal-kit',
    name: 'Shulker of Lifesteal Starter Kits',
    server: 'other',
    category: 'kits',
    price: 1.99,
    image: 'assets/logo_transparent.png',
    desc: 'Ideal for popular public Lifesteal servers. Contains a full set of Diamond Protection III gear, 3 hearts, and 16 golden apples, all packed in a red shulker box.'
  },
  {
    id: 'other-title',
    name: 'Shulker of Chat Tag Tokens',
    server: 'other',
    category: 'ranks',
    price: 2.99,
    image: 'assets/logo_transparent.png',
    desc: 'Voucher token that grants a customizable colored chat prefix (e.g., [GOD] or [RICH]) on Discord and supporting servers. Delivered inside a shulker box.'
  },

  // --- Donut SMP Items ---
  {
    id: 'donut-keys',
    name: 'Shulker of Donut Spawn Keys (5x)',
    server: 'donutsmp',
    category: 'packs',
    price: 4.99,
    image: 'assets/donutsmp_transparent.png',
    desc: 'Contains 5x Spawn Keys to open legendary crates at the Donut SMP spawn. Packed inside a cyan shulker box for fast delivery.'
  },
  {
    id: 'donut-netherite',
    name: 'Shulker of Netherite Blocks (10x)',
    server: 'donutsmp',
    category: 'items',
    price: 2.99,
    image: 'assets/donutsmp_transparent.png',
    desc: 'A full shulker box containing 10 blocks of pure Netherite, essential for crafting top-tier lifesteal armor and trading with players.'
  },
  {
    id: 'donut-emperor',
    name: 'Shulker of Emperor Rank Vouchers',
    server: 'donutsmp',
    category: 'ranks',
    price: 19.99,
    image: 'assets/donutsmp_transparent.png',
    desc: 'Voucher for the premium Emperor Rank on Donut SMP. Grants flying, custom kits (/kit emperor), colored name, and chat features. Shipped in a gold shulker box.'
  },
  {
    id: 'donut-godset',
    name: 'Shulker of God Armor Set',
    server: 'donutsmp',
    category: 'items',
    price: 9.99,
    image: 'assets/donutsmp_transparent.png',
    desc: 'Contains 1 full set of Netheirte Armor with Protection V, Unbreaking IV, Mending, and Thorns III. Placed safely inside a protective shulker box.'
  },
  {
    id: 'donut-hearts',
    name: 'Shulker of Lifesteal Hearts (10x)',
    server: 'donutsmp',
    category: 'items',
    price: 1.49,
    image: 'assets/donutsmp_transparent.png',
    desc: 'A shulker box loaded with 10 Lifesteal Hearts. Click them to permanently increase your max health. Essential for recovery after battles!'
  },

  // --- 2b2t Items ---
  {
    id: 'tbt-totems',
    name: 'Shulker of Totems (27x)',
    server: '2b2t',
    category: 'items',
    price: 5.99,
    image: 'assets/2b2t_transparent.png',
    desc: 'A purple shulker box completely packed with 27 Totems of Undying. Crucial for PVP survival and traveling through the dangerous anarchy spawn.'
  },
  {
    id: 'tbt-sharp32k',
    name: 'Shulker of 32k Hacked Swords',
    server: '2b2t',
    category: 'items',
    price: 8.99,
    image: 'assets/2b2t_transparent.png',
    desc: 'A legendary anarchy weapon: contains 2x Diamond Swords enchanted with Sharpness 32767. Delivered inside a secure obsidian-colored shulker box.'
  },
  {
    id: 'tbt-stash-coords',
    name: 'Shulker of Stash Coordinates',
    server: '2b2t',
    category: 'packs',
    price: 14.99,
    image: 'assets/2b2t_transparent.png',
    desc: 'Contains a written book with verified coordinates to a hidden dupe stash. The stash has 100+ chests with building materials, god gear, and crystals. Shipped in a shulker.'
  },
  {
    id: 'tbt-priqueue',
    name: 'Shulker of Pri-Queue Passes (1m)',
    server: '2b2t',
    category: 'ranks',
    price: 24.99,
    image: 'assets/2b2t_transparent.png',
    desc: 'Contains a redeemable priority queue code voucher for 1 month of fast queue bypass. Delivered inside a custom shulker box.'
  },
  {
    id: 'tbt-illegals',
    name: 'Shulker of Illegal Blocks',
    server: '2b2t',
    category: 'items',
    price: 12.99,
    image: 'assets/2b2t_transparent.png',
    desc: 'Contains vanilla-unobtainable blocks: Bedrock, Barrier blocks, End Portal Frames, and Mob Spawners. Safely stored in an illegal shulker box.'
  }
];

// --- Customer Reviews Data ---
const customerReviews = [
  {
    author: 'xX_GriefMaster_Xx',
    server: '2b2t',
    rating: 5,
    text: 'The 32k sword shulker box was delivered to my coords in spawn within 2 minutes. Legit hacked gear, PVP fights are too easy now.',
    avatar: 'G'
  },
  {
    author: 'DrDonutFan99',
    server: 'Donut SMP',
    rating: 5,
    text: 'Bought the Emperor Rank voucher. Safe trade drop at spawn. Highly recommend, automated system was super fast!',
    avatar: 'D'
  },
  {
    author: 'FitMC_Clone',
    server: '2b2t',
    rating: 5,
    text: 'Priority queue shulker delivered quickly. Saved me 8 hours of sitting in queue. Instant delivery is no joke.',
    avatar: 'F'
  },
  {
    author: 'LifestealSweat',
    server: 'Donut SMP',
    rating: 5,
    text: 'Got the Netherite Block and 10 Hearts pack. Restored my max hearts in minutes after getting caught in a trap. Fast bots.',
    avatar: 'L'
  },
  {
    author: 'MineCrafter_Builds',
    server: 'Other Servers',
    rating: 5,
    text: 'Used the custom capes voucher on my Lifesteal SMP account. Cape looks insane and glows in dark. A+ shop aesthetics.',
    avatar: 'M'
  },
  {
    author: 'Vanish_Anarchy',
    server: '2b2t',
    rating: 5,
    text: 'The dupe stash coords were 100% active. Cleared out tons of crystal kits and building blocks. Delivered inside a secure coordinate book.',
    avatar: 'V'
  }
];

// --- Helpers ---
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Application State ---
let cart = [];
let activeServer = '2b2t'; // default active server
let activeFilter = 'all';
let searchKeyword = '';

// --- DOM Elements ---
const bodyEl = document.body;
const mainHeader = document.getElementById('mainHeader');
const serverTabs = document.getElementById('serverTabs');
const tabButtons = document.querySelectorAll('.tab-btn');
const searchInput = document.getElementById('searchInput');
const filterPills = document.getElementById('filterPills');
const productsGrid = document.getElementById('productsGrid');
const appleRainLayer = document.getElementById('appleRainLayer');
const heroShulkerButton = document.getElementById('heroShulkerButton');
const goldenAppleAsset = 'assets/enchanted_golden_apple.gif';

// Cart Drawer elements
const cartTrigger = document.getElementById('cartTrigger');
const cartCount = document.getElementById('cartCount');
const cartDrawer = document.getElementById('cartDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const cartCloseBtn = document.getElementById('cartCloseBtn');
const cartDrawerItems = document.getElementById('cartDrawerItems');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

// Checkout Modal elements
const checkoutModal = document.getElementById('checkoutModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const usernameField = document.getElementById('usernameField');
const usernamePreview = document.getElementById('usernamePreview');
const avatarPreview = document.getElementById('avatarPreview');
const usernameText = document.getElementById('usernameText');
const accountStatus = document.getElementById('accountStatus');
const accountHint = document.getElementById('accountHint');
const emailField = document.getElementById('emailField');
const paymentAccountAvatar = document.getElementById('paymentAccountAvatar');
const paymentAccountName = document.getElementById('paymentAccountName');
const paymentMethods = document.querySelectorAll('.payment-method');
const summaryItemsContainer = document.getElementById('summaryItemsContainer');
const summaryDiscountValue = document.getElementById('summaryDiscountValue');
const summaryTotalValue = document.getElementById('summaryTotalValue');
const termsCheckbox = document.getElementById('termsCheckbox');
const checkoutSteps = document.getElementById('checkoutSteps');
const modalFooter = document.getElementById('modalFooter');
const modalBackBtn = document.getElementById('modalBackBtn');
const modalNextBtn = document.getElementById('modalNextBtn');

// Modal Screens
const screenDelivery = document.getElementById('screenDelivery');
const screenPayment = document.getElementById('screenPayment');
const statusProcessing = document.getElementById('statusProcessing');
const statusProcessingDesc = document.getElementById('statusProcessingDesc');
const deliveryProgressBar = document.getElementById('deliveryProgressBar');
const deliveryProgressLabel = document.getElementById('deliveryProgressLabel');
const deliveryProgressPercent = document.getElementById('deliveryProgressPercent');
const statusSuccess = document.getElementById('statusSuccess');
const successUsernameText = document.getElementById('successUsernameText');
const successOrderInfo = document.getElementById('successOrderInfo');
const successCloseBtn = document.getElementById('successCloseBtn');

let checkoutStep = 1; // 1: Delivery, 2: Payment, 3: Success
let selectedPaymentMethod = 'card';
let appleRainTimeout;
let shulkerColourCycleAnimation;
let usernameTimeout;
let accountCheckId = 0;
let processingInterval;
let orderCompleted = false;
let minecraftAccount = {
  username: '',
  status: 'idle',
  helmUrl: ''
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupEventListeners();
  syncCartCount();
  
  // Set initial live branding and logo coloring
  updateLiveLogos(activeServer);
  updateHeroBranding(activeServer);
});

// Header scroll effect
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    mainHeader.classList.add('scrolled');
  } else {
    mainHeader.classList.remove('scrolled');
  }
});

// --- Tab Click Logic ---
function handleTabClick(btn) {
  const server = btn.getAttribute('data-server');
  
  // Set active class
  tabButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  // Set active class on hero buttons
  const heroBtns = document.querySelectorAll('.hero-mode-btn');
  heroBtns.forEach(hb => {
    if (hb.getAttribute('data-server') === server) {
      hb.classList.add('active');
    } else {
      hb.classList.remove('active');
    }
  });
  
  // Update theme on body
  bodyEl.className = '';
  bodyEl.classList.add(`theme-${server}`);
  
  // Update State
  activeServer = server;
  
  // Update live shulker box colors and titles/logos
  updateLiveLogos(server);
  updateHeroBranding(server);
  
  // Render products
  renderProducts();
}

// --- Live Recolor and Hero Branding Script ---
function updateLiveLogos(server) {
  const headerLogo = document.getElementById('headerShulkerLogo');
  const heroLogo = document.getElementById('heroShulkerLogo');
  
  let filterVal = '';
  if (server === 'donutsmp') {
    filterVal = 'sepia(1) hue-rotate(162deg) saturate(3) brightness(0.8) contrast(1.0)';
  } else if (server === '2b2t') {
    filterVal = 'sepia(1) hue-rotate(-15deg) saturate(3.5) brightness(0.85) contrast(1.0)';
  } else {
    filterVal = 'sepia(1) hue-rotate(231deg) saturate(2.5) brightness(0.85) contrast(1.0)';
  }
  
  if (headerLogo) headerLogo.style.filter = filterVal;
  if (heroLogo) heroLogo.style.filter = filterVal + ' drop-shadow(0 0 40px var(--primary-glow))';
}

function updateHeroBranding(server) {
  const logoContainer = document.getElementById('heroServerLogoContainer');
  const heroTitle = document.getElementById('heroTitle');
  
  if (!logoContainer || !heroTitle) return;
  
  if (server === 'donutsmp') {
    logoContainer.innerHTML = '<img src="assets/donutsmp_transparent.png" alt="Donut SMP Logo" class="hero-server-logo">';
    heroTitle.innerHTML = 'The Ultimate Shop for <br><span>Donut SMP Items</span>';
  } else if (server === '2b2t') {
    logoContainer.innerHTML = '<img src="assets/2b2t_transparent.png" alt="2b2t Logo" class="hero-server-logo">';
    heroTitle.innerHTML = 'The Ultimate Shop for <br><span>2b2t Items &amp; Kits</span>';
  } else {
    logoContainer.innerHTML = ''; // Empty for Other (General) or show Shulker logo
    heroTitle.innerHTML = 'The Ultimate Shop for <br><span>Minecraft Deliveries</span>';
  }
}

function getMineSkinHelmUrl(username) {
  return `https://mineskin.eu/helm/${encodeURIComponent(username)}`;
}

function isValidMinecraftUsername(username) {
  return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

function setAccountCheckState(status, username = '', message = '', helmUrl = '') {
  minecraftAccount = { username, status, helmUrl };

  usernameField.classList.remove('is-valid', 'is-error');
  usernamePreview.classList.remove('is-checking', 'is-valid', 'is-error');
  accountStatus.classList.remove('is-checking', 'is-valid', 'is-error');
  accountHint.classList.remove('is-valid', 'is-error');

  if (status === 'idle') {
    usernamePreview.style.display = 'none';
    accountHint.textContent = 'Usernames are 3-16 characters: letters, numbers, and underscores.';
    return;
  }

  usernamePreview.style.display = 'flex';
  usernamePreview.classList.add(`is-${status}`);
  accountStatus.classList.add(`is-${status}`);
  usernameText.textContent = username || 'Minecraft account';
  accountStatus.textContent = message;

  if (status === 'valid') {
    usernameField.classList.add('is-valid');
    accountHint.classList.add('is-valid');
    accountHint.textContent = 'MineSkin helm confirmed.';
    avatarPreview.src = helmUrl;
  } else if (status === 'error') {
    usernameField.classList.add('is-error');
    accountHint.classList.add('is-error');
    accountHint.textContent = message;
  }
}

async function confirmMinecraftProfile(username) {
  if (!window.fetch || !window.AbortController) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
      cache: 'no-store',
      signal: controller.signal
    });

    if (response.status === 404 || response.status === 204) return false;
    if (!response.ok) return null;

    const profile = await response.json();
    return Boolean(profile && profile.id && profile.name);
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function loadMineSkinHelm(helmUrl) {
  return new Promise(resolve => {
    const testImage = new Image();
    const timeout = setTimeout(() => resolve(false), 7000);

    testImage.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    testImage.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    testImage.src = `${helmUrl}?check=${Date.now()}`;
  });
}

async function verifyMinecraftAccount(username, options = {}) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    accountCheckId++;
    setAccountCheckState('idle');
    return false;
  }

  if (!isValidMinecraftUsername(normalizedUsername)) {
    accountCheckId++;
    setAccountCheckState('error', normalizedUsername, 'Use 3-16 letters, numbers, or underscores.');
    return false;
  }

  if (!options.force && minecraftAccount.status === 'valid' && minecraftAccount.username === normalizedUsername) {
    return true;
  }

  const requestId = ++accountCheckId;
  const helmUrl = getMineSkinHelmUrl(normalizedUsername);
  setAccountCheckState('checking', normalizedUsername, 'Checking Minecraft profile...');

  const profileConfirmed = await confirmMinecraftProfile(normalizedUsername);
  if (requestId !== accountCheckId) return false;

  if (profileConfirmed === false) {
    setAccountCheckState('error', normalizedUsername, 'Minecraft account not found.');
    return false;
  }

  setAccountCheckState('checking', normalizedUsername, 'Loading MineSkin helm...');
  const helmConfirmed = await loadMineSkinHelm(helmUrl);
  if (requestId !== accountCheckId) return false;

  if (!helmConfirmed) {
    setAccountCheckState('error', normalizedUsername, 'MineSkin helm not found for that username.');
    return false;
  }

  setAccountCheckState('valid', normalizedUsername, 'MineSkin helm confirmed.', helmUrl);
  return true;
}

function setCheckoutButtonBusy(isBusy, label = 'Checking...') {
  modalNextBtn.disabled = isBusy;
  modalBackBtn.disabled = isBusy;
  if (isBusy) {
    modalNextBtn.dataset.originalText = modalNextBtn.textContent;
    modalNextBtn.textContent = label;
  } else if (modalNextBtn.dataset.originalText) {
    modalNextBtn.textContent = modalNextBtn.dataset.originalText;
    delete modalNextBtn.dataset.originalText;
  }
}

function resetDeliveryProgress() {
  if (deliveryProgressBar) deliveryProgressBar.style.width = '0%';
  if (deliveryProgressLabel) deliveryProgressLabel.textContent = 'Starting secure handoff';
  if (deliveryProgressPercent) deliveryProgressPercent.textContent = '0%';
}

function setDeliveryProgress(percent, label) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  if (deliveryProgressBar) deliveryProgressBar.style.width = `${clampedPercent}%`;
  if (deliveryProgressLabel) deliveryProgressLabel.textContent = label;
  if (deliveryProgressPercent) deliveryProgressPercent.textContent = `${clampedPercent}%`;
}

function syncPaymentAccountSummary() {
  const username = minecraftAccount.username || usernameField.value.trim() || 'Steve';
  const helmUrl = minecraftAccount.helmUrl || getMineSkinHelmUrl(username);
  if (paymentAccountAvatar) paymentAccountAvatar.src = helmUrl;
  if (paymentAccountName) paymentAccountName.textContent = username;
}

function clearProcessingTimers() {
  clearInterval(processingInterval);
  processingInterval = null;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function triggerShulkerColourCycle() {
  if (!heroShulkerButton) return;

  if (shulkerColourCycleAnimation) {
    shulkerColourCycleAnimation.cancel();
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = prefersReducedMotion ? 900 : 2600;
  const frames = [
    { filter: 'hue-rotate(0deg) saturate(1) brightness(1)' },
    { filter: 'hue-rotate(90deg) saturate(1.45) brightness(1.12)' },
    { filter: 'hue-rotate(180deg) saturate(1.75) brightness(1.18)' },
    { filter: 'hue-rotate(270deg) saturate(1.45) brightness(1.12)' },
    { filter: 'hue-rotate(360deg) saturate(1) brightness(1)' }
  ];

  if (typeof heroShulkerButton.animate === 'function') {
    const animation = heroShulkerButton.animate(frames, {
      duration,
      easing: 'linear'
    });
    shulkerColourCycleAnimation = animation;

    animation.onfinish = () => {
      if (shulkerColourCycleAnimation === animation) {
        heroShulkerButton.style.filter = '';
        shulkerColourCycleAnimation = null;
      }
    };
    animation.oncancel = () => {
      if (shulkerColourCycleAnimation === animation) {
        heroShulkerButton.style.filter = '';
        shulkerColourCycleAnimation = null;
      }
    };
    return;
  }

  let frameIndex = 0;
  const fallbackInterval = setInterval(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    heroShulkerButton.style.filter = frames[frameIndex].filter;
  }, 120);

  setTimeout(() => {
    clearInterval(fallbackInterval);
    heroShulkerButton.style.filter = '';
  }, duration);
}

function triggerGoldenAppleRain() {
  triggerShulkerColourCycle();

  if (!appleRainLayer) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmallScreen = window.innerWidth < 640;
  const appleCount = prefersReducedMotion ? 14 : (isSmallScreen ? 32 : 58);
  const sparkCount = prefersReducedMotion ? 6 : (isSmallScreen ? 12 : 24);
  const cleanupDelay = prefersReducedMotion ? 3400 : 5800;

  clearTimeout(appleRainTimeout);
  appleRainLayer.replaceChildren();
  appleRainLayer.classList.add('is-active');

  if (heroShulkerButton) {
    heroShulkerButton.classList.remove('is-pressed');
    void heroShulkerButton.offsetWidth;
    heroShulkerButton.classList.add('is-pressed');
    setTimeout(() => heroShulkerButton.classList.remove('is-pressed'), 460);
  }

  for (let i = 0; i < appleCount; i++) {
    const apple = document.createElement('img');
    const size = randomBetween(isSmallScreen ? 24 : 26, isSmallScreen ? 44 : 58);
    const sway = randomBetween(-140, 140);
    const scale = randomBetween(0.78, 1.24);
    const spin = randomBetween(-720, 720);

    apple.src = goldenAppleAsset;
    apple.alt = '';
    apple.className = 'apple-drop';
    apple.style.setProperty('--x', `${randomBetween(-5, 100).toFixed(2)}vw`);
    apple.style.setProperty('--size', `${size.toFixed(0)}px`);
    apple.style.setProperty('--delay', `${randomBetween(0, prefersReducedMotion ? 0.35 : 1.25).toFixed(2)}s`);
    apple.style.setProperty('--duration', `${randomBetween(prefersReducedMotion ? 2.1 : 3.2, prefersReducedMotion ? 3.0 : 4.8).toFixed(2)}s`);
    apple.style.setProperty('--sway', `${sway.toFixed(0)}px`);
    apple.style.setProperty('--sway-end', `${(-sway * randomBetween(0.2, 0.65)).toFixed(0)}px`);
    apple.style.setProperty('--scale', scale.toFixed(2));
    apple.style.setProperty('--scale-end', (scale * randomBetween(0.65, 0.95)).toFixed(2));
    apple.style.setProperty('--spin-mid', `${(spin * 0.55).toFixed(0)}deg`);
    apple.style.setProperty('--spin', `${spin.toFixed(0)}deg`);

    appleRainLayer.appendChild(apple);
  }

  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement('span');

    spark.className = 'apple-spark';
    spark.style.setProperty('--x', `${randomBetween(4, 96).toFixed(2)}vw`);
    spark.style.setProperty('--y', `${randomBetween(12, 82).toFixed(2)}vh`);
    spark.style.setProperty('--size', `${randomBetween(6, 16).toFixed(0)}px`);
    spark.style.setProperty('--drift', `${randomBetween(-60, 60).toFixed(0)}px`);
    spark.style.setProperty('--delay', `${randomBetween(0.15, prefersReducedMotion ? 1.1 : 2.4).toFixed(2)}s`);
    spark.style.setProperty('--duration', `${randomBetween(0.8, 1.8).toFixed(2)}s`);

    appleRainLayer.appendChild(spark);
  }

  appleRainTimeout = setTimeout(() => {
    appleRainLayer.classList.remove('is-active');
    appleRainLayer.replaceChildren();
  }, cleanupDelay);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Tab Switch Event
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => handleTabClick(btn));
  });

  // Nav server links / hero mode buttons click event
  const modeLinks = document.querySelectorAll('.nav-server-link, .hero-mode-btn');
  modeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const server = link.getAttribute('data-server');
      if (server) {
        const targetBtn = Array.from(tabButtons).find(btn => btn.getAttribute('data-server') === server);
        if (targetBtn) {
          handleTabClick(targetBtn);
        }
        const shopSection = document.getElementById('shop');
        if (shopSection) {
          shopSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  if (heroShulkerButton) {
    heroShulkerButton.addEventListener('click', triggerGoldenAppleRain);
  }

  // Search Input Event
  searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value.toLowerCase();
    renderProducts();
  });

  // Category Filter Pill Click
  filterPills.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-pill')) {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.getAttribute('data-filter');
      renderProducts();
    }
  });

  // Drawer Toggle Events
  cartTrigger.addEventListener('click', openCartDrawer);
  cartCloseBtn.addEventListener('click', closeCartDrawer);
  drawerOverlay.addEventListener('click', closeCartDrawer);

  // Checkout modal controls
  cartCheckoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    closeCartDrawer();
    openCheckoutModal();
  });
  modalCloseBtn.addEventListener('click', closeCheckoutModal);
  successCloseBtn.addEventListener('click', closeCheckoutModal);

  // Minecraft account confirmation through MineSkin (with debounce)
  usernameField.addEventListener('input', (e) => {
    clearTimeout(usernameTimeout);
    const username = e.target.value.trim();

    if (!username) {
      setAccountCheckState('idle');
      return;
    }

    if (!isValidMinecraftUsername(username)) {
      accountCheckId++;
      setAccountCheckState('error', username, 'Use 3-16 letters, numbers, or underscores.');
      return;
    }

    setAccountCheckState('checking', username, 'Checking MineSkin account...');
    usernameTimeout = setTimeout(() => {
      verifyMinecraftAccount(username);
    }, 450);
  });

  // Selectable Payment Methods
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.classList.remove('selected'));
      method.classList.add('selected');
      selectedPaymentMethod = method.getAttribute('data-method');
      updateOrderSummary();
    });
  });

  // Checkout Navigation Buttons
  modalNextBtn.addEventListener('click', handleCheckoutNext);
  modalBackBtn.addEventListener('click', handleCheckoutBack);
}

// --- Cart Logic ---
function openCartDrawer() {
  cartDrawer.classList.add('open');
  drawerOverlay.classList.add('open');
  renderCartItems();
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
}

function syncCartCount() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalCount;
  
  // Pulse animation on addition
  cartCount.classList.add('pulse');
  setTimeout(() => {
    cartCount.classList.remove('pulse');
  }, 600);
}

function addToCart(productId, qty) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) {
    cartItem.quantity += qty;
  } else {
    cart.push({ ...product, quantity: qty });
  }

  syncCartCount();
  renderProducts(); // Refresh quantities on grid
  openCartDrawer();
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }

  syncCartCount();
  renderCartItems();
  renderProducts(); // Update quantities on grid
}

function removeCartItem(productId) {
  cart = cart.filter(i => i.id !== productId);
  syncCartCount();
  renderCartItems();
  renderProducts();
}

function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// --- Checkout Modal Logic ---
function openCheckoutModal() {
  checkoutStep = 1;
  orderCompleted = false;
  clearProcessingTimers();
  resetDeliveryProgress();
  setCheckoutButtonBusy(false);
  updateModalStepUI();
  checkoutModal.classList.add('open');
}

function closeCheckoutModal() {
  checkoutModal.classList.remove('open');
  clearProcessingTimers();
  setCheckoutButtonBusy(false);

  // If order was complete, clear cart.
  if (orderCompleted) {
    cart = [];
    syncCartCount();
    renderProducts();
  }
}

function updateOrderSummary() {
  summaryItemsContainer.innerHTML = '';
  let subtotal = calculateSubtotal();
  
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.style.fontSize = '13px';
    row.style.color = 'var(--text-2)';
    row.innerHTML = `
      <span></span>
      <span></span>
    `;
    row.children[0].textContent = `${escapeHtml(item.name)} (x${item.quantity})`;
    row.children[1].textContent = `$${(item.price * item.quantity).toFixed(2)}`;
    summaryItemsContainer.appendChild(row);
  });

  let discount = 0;
  if (selectedPaymentMethod === 'crypto') {
    discount = subtotal * 0.05; // 5% discount
  }

  summaryDiscountValue.textContent = `-$${discount.toFixed(2)}`;
  summaryDiscountValue.style.color = discount > 0 ? '#34d399' : 'var(--text-3)';
  summaryTotalValue.textContent = `$${(subtotal - discount).toFixed(2)}`;
}

function updateModalStepUI() {
  // Reset screen visibility
  screenDelivery.style.display = 'none';
  screenPayment.style.display = 'none';
  statusProcessing.style.display = 'none';
  statusSuccess.style.display = 'none';
  checkoutSteps.style.display = 'flex';
  modalFooter.style.display = 'flex';

  // Step indicator classes
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');

  step1.className = 'step-indicator';
  step2.className = 'step-indicator';
  step3.className = 'step-indicator';

  if (checkoutStep === 1) {
    screenDelivery.style.display = 'block';
    step1.classList.add('active');
    modalBackBtn.style.visibility = 'hidden';
    modalNextBtn.textContent = 'Next';
    modalNextBtn.disabled = false;
    modalBackBtn.disabled = false;
  } else if (checkoutStep === 2) {
    screenPayment.style.display = 'block';
    step1.classList.add('completed');
    step2.classList.add('active');
    modalBackBtn.style.visibility = 'visible';
    modalNextBtn.textContent = 'Complete Order';
    modalNextBtn.disabled = false;
    modalBackBtn.disabled = false;
    syncPaymentAccountSummary();
    updateOrderSummary();
  }
}

async function handleCheckoutNext() {
  if (checkoutStep === 1) {
    // Validate delivery screen
    const username = usernameField.value.trim();
    const email = emailField.value.trim();
    
    if (!username) {
      alert('Please enter your Minecraft Username.');
      return;
    }
    if (!email || !email.includes('@')) {
      alert('Please enter a valid Email Address.');
      return;
    }

    if (!isValidMinecraftUsername(username)) {
      setAccountCheckState('error', username, 'Use 3-16 letters, numbers, or underscores.');
      alert('Please enter a valid Minecraft username.');
      return;
    }

    setCheckoutButtonBusy(true, 'Checking...');
    const accountConfirmed = await verifyMinecraftAccount(username, { force: true });
    setCheckoutButtonBusy(false);

    if (!accountConfirmed) {
      alert('We could not confirm that MineSkin helm image. Please check the username and try again.');
      return;
    }
    
    checkoutStep = 2;
    updateModalStepUI();
  } else if (checkoutStep === 2) {
    // Validate terms & conditions
    if (!termsCheckbox.checked) {
      alert('You must agree to the Terms of Service to complete the checkout.');
      return;
    }
    
    // Proceed to Step 3 (Processing)
    checkoutStep = 3;
    modalFooter.style.display = 'none';
    screenPayment.style.display = 'none';
    statusProcessing.style.display = 'flex';
    checkoutSteps.style.display = 'none';
    resetDeliveryProgress();
    
    runFakeProcessing();
  }
}

function handleCheckoutBack() {
  if (checkoutStep === 2) {
    checkoutStep = 1;
    updateModalStepUI();
  }
}

function runFakeProcessing() {
  const steps = [
    { text: 'Confirming payment authorization...', label: 'Payment secure', progress: 18 },
    { text: 'Locking delivery account...', label: 'Account confirmed', progress: 36 },
    { text: 'Generating secure coordinate drop...', label: 'Route generated', progress: 54 },
    { text: 'Packing items inside custom Shulker Boxes...', label: 'Packing items', progress: 76 },
    { text: 'Assigning delivery bot queue...', label: 'Bot queued', progress: 92 },
    { text: 'Delivery handoff ready.', label: 'Delivery ready', progress: 100 }
  ];

  let currentStep = 0;
  orderCompleted = false;
  clearProcessingTimers();
  statusProcessingDesc.textContent = steps[0].text;
  setDeliveryProgress(steps[0].progress, steps[0].label);

  processingInterval = setInterval(() => {
    currentStep++;
    if (currentStep < steps.length) {
      statusProcessingDesc.textContent = steps[currentStep].text;
      setDeliveryProgress(steps[currentStep].progress, steps[currentStep].label);
    } else {
      clearProcessingTimers();
      orderCompleted = true;
      // Transition to Success
      statusProcessing.style.display = 'none';
      statusSuccess.style.display = 'flex';
      
      // Update success username and Order details
      const username = usernameField.value.trim();
      successUsernameText.querySelector('.avatar-preview').src = minecraftAccount.helmUrl || getMineSkinHelmUrl(username);
      successUsernameText.querySelector('.username-text').textContent = username;
      
      const randOrder = 'SS-' + Math.floor(10000 + Math.random() * 90000) + '-' + Math.floor(100 + Math.random() * 899);
      successOrderInfo.textContent = `Order ID: ${randOrder}`;
    }
  }, 850);
}

// --- Rendering Functions ---

// 1. Render Products Grid
function renderProducts() {
  productsGrid.innerHTML = '';
  
  // Filter products by server tab, keyword, and sub-filter category
  const filtered = products.filter(p => {
    const matchesServer = p.server === activeServer;
    const matchesKeyword = p.name.toLowerCase().includes(searchKeyword) || p.desc.toLowerCase().includes(searchKeyword);
    const matchesFilter = activeFilter === 'all' || p.category === activeFilter;
    
    return matchesServer && matchesKeyword && matchesFilter;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-products">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <div class="no-products-title">No items found</div>
        <div class="no-products-desc">Try searching for another keyword or selecting a different category.</div>
      </div>
    `;
    return;
  }

  filtered.forEach(p => {
    const cartItem = cart.find(item => item.id === p.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;

    const card = document.createElement('div');
    card.className = 'product-card';
    const safeName = escapeHtml(p.name);
    const safeDesc = escapeHtml(p.desc);
    const safeId = escapeHtml(p.id).replace(/'/g, '&#39;');
    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="assets/placeholder.png" alt="${safeName}" class="product-img">
      </div>
      <div class="product-body">
        ${inCartQty > 0 ? `<div class="product-in-cart"><span class="product-in-cart-dot"></span>${inCartQty} in cart</div>` : ''}
        <h3 class="product-name">${safeName}</h3>
        <p class="product-desc">${safeDesc}</p>
        <div class="product-footer">
          <span class="product-price">$${p.price.toFixed(2)}</span>
          <div class="product-actions">
            <div class="qty-stepper" id="qty-sel-${safeId}">
              <button class="qty-btn" onclick="adjustGridQty('${safeId}', -1)">−</button>
              <span class="qty-val" id="qty-val-${safeId}">1</span>
              <button class="qty-btn" onclick="adjustGridQty('${safeId}', 1)">+</button>
            </div>
            <button class="btn btn-primary add-cart-btn" onclick="handleAddFromGrid('${safeId}')">Add</button>
          </div>
        </div>
      </div>
    `;
    productsGrid.appendChild(card);
  });
}

// Grid Quantity selectors
window.adjustGridQty = function(productId, delta) {
  const valEl = document.getElementById(`qty-val-${productId}`);
  if (valEl) {
    let val = parseInt(valEl.textContent);
    val = Math.max(1, val + delta);
    valEl.textContent = val;
  }
};

window.handleAddFromGrid = function(productId) {
  const valEl = document.getElementById(`qty-val-${productId}`);
  const qty = valEl ? parseInt(valEl.textContent) : 1;
  addToCart(productId, qty);
  // Reset quantity selector
  if (valEl) valEl.textContent = 1;
};

// 2. Render Drawer Cart Items
function renderCartItems() {
  cartDrawerItems.innerHTML = '';
  
  if (cart.length === 0) {
    cartDrawerItems.innerHTML = `
      <div class="cart-empty-state">
        <svg viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p>Your cart is empty.</p>
        <p style="font-size: 13px; margin-top: 8px;">Add some premium shulker boxes to get started!</p>
      </div>
    `;
    cartSubtotal.textContent = '$0.00';
    cartCheckoutBtn.disabled = true;
    return;
  }

  cartCheckoutBtn.disabled = false;
  
  cart.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    const safeName = escapeHtml(item.name);
    const safeId = escapeHtml(item.id).replace(/'/g, '&#39;');
    itemEl.innerHTML = `
      <div class="cart-item-img-box">
        <img src="assets/placeholder.png" alt="${safeName}" class="cart-item-img">
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-name">${safeName}</h4>
        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
      </div>
      <div class="cart-item-actions">
        <button class="cart-item-remove" onclick="removeCartItem('${safeId}')">Remove</button>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateCartQty('${safeId}', -1)">-</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQty('${safeId}', 1)">+</button>
        </div>
      </div>
    `;
    cartDrawerItems.appendChild(itemEl);
  });

  cartSubtotal.textContent = `$${calculateSubtotal().toFixed(2)}`;
}
