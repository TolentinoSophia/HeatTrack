// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
    initSystem();
    initFaqAccordion();
    initMobileNavMenu();
    lucide.createIcons();
});

// Temporarily suppress tooltip/hover behavior (for touch interactions)
function suppressHoverTemporarily() {
    try {
        document.documentElement.classList.add('disable-hover');
        if (window._disableHoverTimer) clearTimeout(window._disableHoverTimer);
        window._disableHoverTimer = setTimeout(() => {
            document.documentElement.classList.remove('disable-hover');
            window._disableHoverTimer = null;
        }, 600);
    } catch (e) {
        // noop
    }
}

function initFaqAccordion() {
    document.querySelectorAll('.ht-faq__item').forEach((item) => {
        item.addEventListener('toggle', () => {
            if (item.open) lucide.createIcons();
        });
    });
}

// ============================================
// MOBILE NAVIGATION MENU
// ============================================
function initMobileNavMenu() {
    const menuBtn = document.getElementById('navMenuToggle');
    const nav = document.getElementById('mobileNav');
    
    if (!menuBtn || !nav) return;

    // Toggle menu on button click
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = nav.classList.toggle('is-open');
        menuBtn.classList.toggle('is-active', isOpen);
        menuBtn.setAttribute('aria-expanded', isOpen);
        // Close Settings and Alerts panels when hamburger menu opens
        if (isOpen) {
            const settingsPanel = document.getElementById('settingsPanel');
            const alertPanel = document.getElementById('alertPanel');
            const settingsBtn = document.getElementById('settingsBtn');
            const alertBtn = document.getElementById('alertBtn');
            animatePanelClose(settingsPanel);
            settingsBtn?.classList.remove('is-active');
            animatePanelClose(alertPanel);
            alertBtn?.classList.remove('is-active');
        }
    });

    // Suppress hover/tooltips briefly on touch interactions for hamburger
    menuBtn.addEventListener('touchstart', suppressHoverTemporarily, { passive: true });

    // Close menu when a nav link is clicked
    nav.querySelectorAll('.ht-nav__link').forEach((link) => {
        link.addEventListener('click', () => {
            nav.classList.remove('is-open');
            menuBtn.classList.remove('is-active');
            menuBtn.setAttribute('aria-expanded', 'false');
            // Close Settings and Alerts panels when closing hamburger menu
            const settingsPanel = document.getElementById('settingsPanel');
            const alertPanel = document.getElementById('alertPanel');
            const settingsBtn = document.getElementById('settingsBtn');
            const alertBtn = document.getElementById('alertBtn');
            animatePanelClose(settingsPanel);
            settingsBtn?.classList.remove('is-active');
            animatePanelClose(alertPanel);
            alertBtn?.classList.remove('is-active');
            // Remove tap-induced hover effect after interaction
            suppressHoverTemporarily();
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ht-topnav')) {
            nav.classList.remove('is-open');
            menuBtn.classList.remove('is-active');
            menuBtn.setAttribute('aria-expanded', 'false');
            // Close Settings and Alerts panels when clicking outside
            const settingsPanel = document.getElementById('settingsPanel');
            const alertPanel = document.getElementById('alertPanel');
            const settingsBtn = document.getElementById('settingsBtn');
            const alertBtn = document.getElementById('alertBtn');
            animatePanelClose(settingsPanel);
            settingsBtn?.classList.remove('is-active');
            animatePanelClose(alertPanel);
            alertBtn?.classList.remove('is-active');
            // Remove tap-induced hover effect after interaction
            suppressHoverTemporarily();
        }
    });

    // Close menu on window resize if screen is large enough
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            nav.classList.remove('is-open');
            menuBtn.classList.remove('is-active');
            menuBtn.setAttribute('aria-expanded', 'false');
            // Close Settings and Alerts panels on resize
            const settingsPanel = document.getElementById('settingsPanel');
            const alertPanel = document.getElementById('alertPanel');
            const settingsBtn = document.getElementById('settingsBtn');
            const alertBtn = document.getElementById('alertBtn');
            animatePanelClose(settingsPanel);
            settingsBtn?.classList.remove('is-active');
            animatePanelClose(alertPanel);
            alertBtn?.classList.remove('is-active');
            // Remove tap-induced hover effect after interaction
            suppressHoverTemporarily();
        }
        // Re-apply date picker max attribute on resize for mobile responsiveness
        setCustomRangeMaxDate();
    });

    // Re-apply date picker max attribute on device orientation change (mobile)
    window.addEventListener('orientationchange', () => {
        setCustomRangeMaxDate();
    });
}

function animatePanelOpen(panel) {
    if (!panel) return;
    if (panel.__pendingCloseListener) {
        panel.removeEventListener('transitionend', panel.__pendingCloseListener);
        panel.__pendingCloseListener = null;
    }
    panel.classList.remove('u-hidden');
    void panel.offsetWidth;
    panel.classList.add('is-open');
}

function animatePanelClose(panel) {
    if (!panel) return;
    panel.classList.remove('is-open');
    if (panel.__pendingCloseListener) {
        panel.removeEventListener('transitionend', panel.__pendingCloseListener);
        panel.__pendingCloseListener = null;
    }
    const finishClose = (event) => {
        if (event.propertyName === 'opacity') {
            panel.classList.add('u-hidden');
            panel.removeEventListener('transitionend', finishClose);
            panel.__pendingCloseListener = null;
        }
    };
    panel.__pendingCloseListener = finishClose;
    panel.addEventListener('transitionend', finishClose);
}


// ============================================
// STATE MANAGEMENT
// ============================================
let currentView = 'home';
const intervals = {
    clock: null,
    sensor: null,
    detection: null,
    annotations: null,
};

const state = {
    detections: [],
    sensorHistory: {
        temp: [],
        humidity: [],
        labels: []
    },
    currentPage: 1,
    pageSize: 10,
    alertCount: 0,
    alerts: [],
    alertsDisplayed: 0,
    alertsPageSize: 10,
    recommendationsDisplayed: 0,
    recommendationsPageSize: 8,
    cameraActive: true,
    aiActive: true,
    alertsEnabled: true,
    lastToastDetection: null,
    stats: {
        stressCount: 0,
        mildCount: 0,
        normalCount: 0,
        totalScans: 0,
        criticalCount: 0
    }
};

// Severity levels
const severityLevels = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

// Recommendations based on severity
const recommendations = {
    CRITICAL: [
        { action: 'Activate emergency cooling now (sprinklers + fans at 100%)', icon: 'droplets', type: 'urgent', category: 'Suggested Action', tip: 'Start cooling within 1–3 minutes while confirming affected birds on-site.' },
        { action: 'Move high-temperature ducks to shaded recovery pen within 3 minutes', icon: 'move', type: 'urgent', category: 'Suggested Action', tip: 'Prioritize ducks with the highest thermal readings and visible distress.' },
        { action: 'Start intensive rehydration: cool clean water at multiple access points', icon: 'glass-water', type: 'urgent', category: 'Prevention', tip: 'Ensure water is cool—not cold enough to shock—and reachable from every zone.' },
        { action: 'Apply misting cycles every 2-3 minutes until body temperature drops below 41.0°C', icon: 'cloud-rain', type: 'urgent', category: 'Environmental', tip: 'Pair misting with ventilation so humidity does not trap additional heat.' },
        { action: 'Escalate to veterinarian if severe signs persist for more than 10 minutes', icon: 'phone', type: 'urgent', category: 'Temperature', tip: 'Document body temperatures and intervention times for veterinary review.' },
    ],
    HIGH: [
        { action: 'Run cooling fans at high speed and open all airflow panels', icon: 'fan', type: 'warning', category: 'Environmental', tip: 'Target stagnant zones where humidity and temperature combine to reduce evaporative cooling.' },
        { action: 'Replace drinking water now and recheck trough temperature every 20 minutes', icon: 'glass-water', type: 'warning', category: 'Prevention', tip: 'Warm water discourages drinking—increasing dehydration risk during heat events.' },
        { action: 'Separate crowded groups in the hottest zone to reduce heat load', icon: 'minimize-2', type: 'warning', category: 'Suggested Action', tip: 'Reduce collective body heat and improve access to cooler resting areas.' },
        { action: 'Inspect at-risk ducks every 10 minutes for panting, wing spread, or lethargy', icon: 'eye', type: 'warning', category: 'Temperature', tip: 'Cross-check thermal hotspots with RGB behavior cues before escalating.' },
        { action: 'Pause stressful handling and feeding activity until ambient temperature improves', icon: 'pause-circle', type: 'warning', category: 'Prevention', tip: 'Minimize additional metabolic heat from movement and digestion.' },
    ],
    MODERATE: [
        { action: 'Shift feeding to early morning or late afternoon to avoid peak heat', icon: 'clock', type: 'caution', category: 'Prevention', tip: 'Digestion raises body temperature—schedule feeds outside the hottest hours.' },
        { action: 'Confirm all drinkers are clean, flowing, and reachable from every section', icon: 'glass-water', type: 'caution', category: 'Prevention', tip: 'Blocked or distant drinkers are a common hidden cause of heat stress.' },
        { action: 'Deploy temporary shade and reduce direct sun exposure in open areas', icon: 'tent', type: 'caution', category: 'Environmental', tip: 'Shade can lower effective temperature by several degrees in exposed pens.' },
        { action: 'Track temperature and humidity trends every 15 minutes for early escalation', icon: 'activity', type: 'caution', category: 'Environmental', tip: 'Rising humidity with stable temperature still increases heat index risk.' },
        { action: 'Pre-stage cooling equipment so response is immediate if readings rise', icon: 'shield', type: 'caution', category: 'Suggested Action', tip: 'Fans, hoses, and staff assignments should be ready before conditions worsen.' },
    ],
    LOW: [
        { action: 'Continue routine monitoring and keep automated alerts enabled', icon: 'check-circle', type: 'info', category: 'Suggested Action', tip: 'Consistent monitoring catches sudden weather spikes between scheduled checks.' },
        { action: 'Maintain baseline ventilation and verify fan operation once per shift', icon: 'wind', type: 'info', category: 'Environmental', tip: 'Confirm airflow direction moves hot air out rather than recirculating it.' },
        { action: 'Log sensor and behavior data for daily heat-risk trend review', icon: 'file-text', type: 'info', category: 'Temperature', tip: 'Compare today\'s readings with the same time yesterday for early pattern detection.' },
        { action: 'Perform preventive check of water supply and backup cooling systems', icon: 'settings', type: 'info', category: 'Prevention', tip: 'Test backup systems before they are needed during an emergency heat event.' },
    ]
};

const REC_TYPE_CLASS = {
    urgent: 'ht-rec-card ht-rec-card--urgent',
    warning: 'ht-rec-card ht-rec-card--warning',
    caution: 'ht-rec-card ht-rec-card--caution',
    info: 'ht-rec-card ht-rec-card--info',
};

// Map severity levels to recommendation card CSS classes for consistent UI color uniformity
const REC_SEVERITY_CLASS = {
    CRITICAL: 'ht-rec-card ht-rec-card--critical',
    HIGH: 'ht-rec-card ht-rec-card--high',
    MODERATE: 'ht-rec-card ht-rec-card--moderate',
    LOW: 'ht-rec-card ht-rec-card--low',
};

function getRecCategoryLabel(rec) {
    return rec.category || 'Suggested Action';
}

function getRecTip(rec) {
    if (rec.tip) return rec.tip;
    const tips = {
        CRITICAL: 'Treat as highest priority—confirm on-site and recheck within 3 minutes.',
        HIGH: 'Apply cooling steps now and reassess barn conditions within 10 minutes.',
        MODERATE: 'Preventive measures recommended—monitor trends every 15 minutes.',
        LOW: 'Conditions are stable—maintain routine checks and alert readiness.',
    };
    return tips[rec.severity] || tips.MODERATE;
}

// ============================================
// INITIALIZATION
// ============================================
function initSystem() {
    updateTime();
    intervals.clock = setInterval(updateTime, 1000);
    setCustomRangeMaxDate();

    // Update stats
    updateStats();
    updateSensorReadings();
    initCharts();
    if (isMonitorRoute()) {
        requestAnimationFrame(() => {
            if (typeof envChart !== 'undefined' && envChart) envChart.resize();
            if (typeof detectionChart !== 'undefined' && detectionChart) detectionChart.resize();
            if (typeof severityChart !== 'undefined' && severityChart) severityChart.resize();
        });
    }
    renderDetectionLogs();
    renderLiveDetections();
    renderRecommendations();
    renderAlerts();
    drawAnnotations();

    setAppDates();

    // Event listeners
    setupEventListeners();
    // Detect camera hardware and update the live view UI
    try {
        checkCameraDevices();
        // Observe the monitor containers for media (img/video) changes so we can
        // show "No Camera Connected" when no media is present and toggle the live badge.
        observeMonitorMediaChanges();
    } catch (e) {
        // Non-blocking
    }
}

// ============================================
// HASH ROUTER (Home, Live, Analytics, Insights)
// ============================================
const MONITOR_ROUTES = ['live', 'analytics', 'insights'];

function isMonitorRoute() {
    return MONITOR_ROUTES.includes(currentView);
}

function normalizeRoute(route) {
    if (route === 'dashboard') return 'live';
    if (MONITOR_ROUTES.includes(route) || route === 'home' || route === 'about') return route;
    return 'home';
}

const ABOUT_SECTION_HASHES = new Set([
    '#about-guide',
    '#about-features',
    '#about-rec',
    '#about-monitor',
    '#about-benefits',
    '#about-faq',
]);

const ABOUT_NAV_SECTIONS = [
    { id: 'about-guide', hash: '#about-guide' },
    { id: 'about-features', hash: '#about-features' },
    { id: 'about-rec', hash: '#about-rec' },
    { id: 'about-monitor', hash: '#about-monitor' },
    { id: 'about-benefits', hash: '#about-benefits' },
    { id: 'about-faq', hash: '#about-faq' },
];

let aboutNavScrollPending = false;

function getRouteFromHash() {
    const h = (location.hash || '').toLowerCase();
    if (h === '#live' || h === '#dashboard') return 'live';
    if (h === '#analytics') return 'analytics';
    if (h === '#insights') return 'insights';
    if (h === '#about' || ABOUT_SECTION_HASHES.has(h) || h.startsWith('#about-')) return 'about';
    if (h === '#home-guide') return 'home';
    if (h === '#home') return 'home';
    return 'home';
}

function getAboutAnchorId() {
    const h = (location.hash || '').toLowerCase();
    if (ABOUT_SECTION_HASHES.has(h) || (h.startsWith('#about-') && h !== '#about')) {
        return h.slice(1);
    }
    return null;
}

function getAboutNavOffset() {
    const topnav = document.querySelector('.ht-topnav');
    const aboutNav = document.querySelector('.ht-about-nav');
    return (topnav?.offsetHeight || 64) + (aboutNav?.offsetHeight || 52) + 20;
}

function setActiveAboutNavLink(hash) {
    const targetHash = (hash || '').toLowerCase();
    document.querySelectorAll('.ht-about-nav__link').forEach((link) => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        const isActive = href === targetHash;
        link.classList.toggle('ht-about-nav__link--active', isActive);
        link.setAttribute('aria-current', isActive ? 'location' : 'false');
        if (isActive) {
            link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        }
    });
}

function clearAboutNavActive() {
    document.querySelectorAll('.ht-about-nav__link').forEach((link) => {
        link.classList.remove('ht-about-nav__link--active');
        link.setAttribute('aria-current', 'false');
    });
}

function updateAboutNavActive() {
    if (currentView !== 'about') return;

    const scrollPos = window.scrollY + getAboutNavOffset();
    let activeHash = ABOUT_NAV_SECTIONS[0].hash;

    for (const section of ABOUT_NAV_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const sectionTop = el.getBoundingClientRect().top + window.scrollY;
        if (sectionTop <= scrollPos) {
            activeHash = section.hash;
        }
    }

    setActiveAboutNavLink(activeHash);
}

function onAboutPageScroll() {
    if (currentView !== 'about') return;
    if (aboutNavScrollPending) return;
    aboutNavScrollPending = true;
    requestAnimationFrame(() => {
        aboutNavScrollPending = false;
        updateAboutNavActive();
    });
}

function syncDashboardIntervals() {
    const want = isMonitorRoute();
    if (want) {
        if (!intervals.annotations) {
            intervals.annotations = setInterval(updateAnnotations, 3000);
        }
    } else {
        if (intervals.annotations) {
            clearInterval(intervals.annotations);
            intervals.annotations = null;
        }
    }
}

function setAppDates() {
    const s = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.querySelectorAll('[data-date-today]').forEach((el) => {
        el.textContent = s;
    });
}

function showView(route) {
    if (window.getSelection) {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            selection.removeAllRanges();
        }
    }
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    const previousView = currentView;
    currentView = normalizeRoute(route);
    if (previousView === 'live' && currentView !== 'live') {
        const normalCameraContainer = document.getElementById('normalCameraContainer');
        const thermalCameraContainer = document.getElementById('thermalCameraContainer');
        if (normalCameraContainer?.resetZoom) normalCameraContainer.resetZoom();
        if (thermalCameraContainer?.resetZoom) thermalCameraContainer.resetZoom();
    }

    document.documentElement.classList.remove('initial-dashboard');
    document.documentElement.removeAttribute('data-boot-route');

    const viewIds = {
        home: 'view-home',
        about: 'view-about',
        live: 'view-live',
        analytics: 'view-analytics',
        insights: 'view-insights',
    };
    Object.entries(viewIds).forEach(([name, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('u-hidden', name !== currentView);
    });

    document.querySelectorAll('[data-nav]').forEach((el) => {
        const isActive = el.getAttribute('data-nav') === currentView;
        el.classList.toggle('ht-nav__link--active', isActive);
        el.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    const titles = {
        home: 'HeatTrack — Home',
        about: 'HeatTrack — About',
        live: 'HeatTrack — Live',
        analytics: 'HeatTrack — Analytics',
        insights: 'HeatTrack — Insights',
    };
    document.title = titles[currentView] || titles.home;

    syncDashboardIntervals();

    if (currentView === 'live') {
        drawAnnotations();
    }

    setAppDates();

    const currentHash = (location.hash || '').toLowerCase();
    const routeHashes = ['#live', '#dashboard', '#analytics', '#insights', '#home', '#about'];
    const anchorId =
        currentView === 'about'
            ? getAboutAnchorId()
            : currentHash && !routeHashes.includes(currentHash)
              ? currentHash.slice(1)
              : null;

    if (currentView !== 'about') {
        clearAboutNavActive();
    }

    if (anchorId) {
        const target = document.getElementById(anchorId);
        if (target) {
            setActiveAboutNavLink('#' + anchorId);
            requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.setTimeout(updateAboutNavActive, 450);
            });
            lucide.createIcons();
            return;
        }
    }

    if (currentView === 'about') {
        requestAnimationFrame(updateAboutNavActive);
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (isMonitorRoute()) {
            if (typeof envChart !== 'undefined' && envChart) envChart.resize();
            if (typeof detectionChart !== 'undefined' && detectionChart) detectionChart.resize();
            if (typeof severityChart !== 'undefined' && severityChart) severityChart.resize();
        }
    });

    lucide.createIcons();
}

function initAboutNav() {
    document.querySelectorAll('.ht-about-nav__link').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = (link.getAttribute('href') || '').trim();
            if (!href.startsWith('#')) return;
            e.preventDefault();
            const hash = href.toLowerCase();
            setActiveAboutNavLink(hash);
            if ((location.hash || '').toLowerCase() !== hash) {
                location.hash = hash;
            } else {
                showView('about');
            }
        });
    });

    window.addEventListener('scroll', onAboutPageScroll, { passive: true });
}

function initRouter() {
    window.addEventListener('hashchange', () => showView(getRouteFromHash()));
    initAboutNav();
    showView(getRouteFromHash());
}

// ============================================
// TIME & UTILITIES
// ============================================
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const timeEl = document.getElementById('liveTime');
    if (timeEl) timeEl.textContent = timeStr;

    if (currentView !== 'live') return;

    const tsEls = ['normalTimestamp', 'thermalTimestamp'];
    tsEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    });

    const fpsEls = ['normalFps', 'thermalFps'];
    fpsEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '-- FPS';
    });
}

function formatTimestamp(date) {
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
}

function parseDateInput(value, endOfDay = false) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed > today) return null;

    if (endOfDay) {
        parsed.setHours(23, 59, 59, 999);
    } else {
        parsed.setHours(0, 0, 0, 0);
    }
    return parsed;
}

function getTodayInputValue() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
}

function formatDateToDisplay(isoDateString) {
    if (!isoDateString) return '';
    const [year, month, day] = isoDateString.split('-');
    return `${month}/${day}/${year}`;
}

function setCustomRangeMaxDate() {
    const maxValue = getTodayInputValue();
    const startInput = document.getElementById('logCustomStart');
    const endInput = document.getElementById('logCustomEnd');
    if (startInput) startInput.max = maxValue;
    if (endInput) endInput.max = maxValue;
}

function getLogDateBounds() {
    const rangeEl = document.getElementById('logDateRange');
    if (!rangeEl) return { start: null, end: null };
    const range = rangeEl.value;
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = null;

    if (range === 'all') {
        return { start: null, end: null };
    }

    if (range === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        return { start, end };
    }

    if (range === 'last7') {
        start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else if (range === 'last30') {
        start = new Date(end);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    } else if (range === 'custom') {
        const startVal = document.getElementById('logCustomStart')?.value;
        const endVal = document.getElementById('logCustomEnd')?.value;
        const parsedStart = parseDateInput(startVal);
        const parsedEnd = parseDateInput(endVal, true);
        if (parsedStart && parsedEnd) {
            start = parsedStart;
            return { start, end: parsedEnd };
        }
        if (parsedStart) {
            start = parsedStart;
            return { start, end };
        }
        if (parsedEnd) {
            return { start: new Date(0), end: parsedEnd };
        }
    }

    return { start, end };
}

function toggleCustomLogRangeInputs() {
    const showCustom = document.getElementById('logDateRange')?.value === 'custom';
    const customRange = document.getElementById('logCustomRange');
    if (customRange) {
        customRange.classList.toggle('u-hidden', !showCustom);
    }
}

async function toggleFullscreen(element) {
    if (!element || !document.fullscreenEnabled) return;
    if (element.classList.contains('camera-feed--offline') || !state.cameraActive) return;
    try {
        if (document.fullscreenElement === element) {
            await document.exitFullscreen();
        } else if (!document.fullscreenElement) {
            await element.requestFullscreen();
        }
    } catch (error) {
        console.error('Fullscreen toggle failed:', error);
    }
}

function syncCameraZoomCursor(container) {
    if (!container) return;
    const isFull = document.fullscreenElement === container;
    const isOffline = container.classList.contains('camera-feed--offline') || !state.cameraActive;
    container.classList.toggle('camera-feed--fullscreen', isFull);
    container.title = isFull
        ? 'Click to exit fullscreen'
        : isOffline
            ? 'Camera streams are off'
            : 'Click to expand fullscreen';
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function initWheelZoom(container) {
    if (!container) return;
    const layer = container.querySelector('.camera-zoom-layer');
    if (!layer) return;

    const zoom = {
        scale: 1,
        min: 1,
        max: 3.5,
        x: 0,
        y: 0,
        isPanning: false,
        panStartX: 0,
        panStartY: 0,
        originX: 0,
        originY: 0,
    };
    const drag = {
        downX: 0,
        downY: 0,
        moved: false,
        suppressClickUntil: 0,
    };
    let rafPending = false;

    function clampPan() {
        const rect = container.getBoundingClientRect();
        const w = rect.width || 0;
        const h = rect.height || 0;
        if (!w || !h) return;

        // With transform-origin: 0 0 and transform: translate(x,y) scale(s)
        // Keep the scaled layer covering the container:
        // x ∈ [w - w*s, 0], y ∈ [h - h*s, 0]
        const minX = w - w * zoom.scale;
        const minY = h - h * zoom.scale;
        zoom.x = clamp(zoom.x, minX, 0);
        zoom.y = clamp(zoom.y, minY, 0);
    }

    function applyNow() {
        clampPan();
        layer.style.transform = `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`;
        const zoomed = zoom.scale > 1.001;
        container.classList.toggle('camera-zooming', zoomed);
        container.classList.toggle('is-panning', zoom.isPanning);
    }

    function apply() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            applyNow();
        });
    }

    function reset() {
        zoom.scale = 1;
        zoom.x = 0;
        zoom.y = 0;
        zoom.isPanning = false;
        applyNow();
    }

    // Expose a reset helper so navigation can restore camera zoom.
    container.resetZoom = reset;

    function getPoint(e) {
        const rect = container.getBoundingClientRect();
        return {
            cx: e.clientX - rect.left,
            cy: e.clientY - rect.top
        };
    }

    container.addEventListener('dblclick', (e) => {
        e.preventDefault();
        reset();
    });

    // If user dragged (pan attempt), suppress the click that would toggle fullscreen
    container.addEventListener('click', (e) => {
        if (Date.now() < drag.suppressClickUntil) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);

    container.addEventListener('wheel', (e) => {
        // allow page scroll if not hovering the camera
        e.preventDefault();

        const { cx, cy } = getPoint(e);
        const oldScale = zoom.scale;
        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.12 : 1 / 1.12;
        const newScale = clamp(oldScale * zoomFactor, zoom.min, zoom.max);
        if (Math.abs(newScale - oldScale) < 0.0001) return;

        // Zoom towards cursor: keep (cx,cy) stable in screen space
        const scaleRatio = newScale / oldScale;
        zoom.x = cx - (cx - zoom.x) * scaleRatio;
        zoom.y = cy - (cy - zoom.y) * scaleRatio;
        zoom.scale = newScale;

        // If returning to 1x, snap to origin
        if (zoom.scale <= 1.001) {
            zoom.scale = 1;
            zoom.x = 0;
            zoom.y = 0;
        }

        apply();
    }, { passive: false });

    container.addEventListener('pointerdown', (e) => {
        drag.downX = e.clientX;
        drag.downY = e.clientY;
        drag.moved = false;

        if (zoom.scale <= 1.001) return;
        // Don't start panning when clicking on overlay controls
        if (e.target.closest('button, select, input, a, label')) return;
        zoom.isPanning = true;
        container.setPointerCapture(e.pointerId);
        zoom.panStartX = e.clientX;
        zoom.panStartY = e.clientY;
        zoom.originX = zoom.x;
        zoom.originY = zoom.y;
        applyNow();
    });

    container.addEventListener('pointermove', (e) => {
        const dx = e.clientX - drag.downX;
        const dy = e.clientY - drag.downY;
        if (!drag.moved && (dx * dx + dy * dy) > (6 * 6)) {
            drag.moved = true;
        }
        if (!zoom.isPanning) return;
        zoom.x = zoom.originX + (e.clientX - zoom.panStartX);
        zoom.y = zoom.originY + (e.clientY - zoom.panStartY);
        apply();
    });

    // If user dragged (even at 1x), suppress the click-to-fullscreen.
    container.addEventListener('pointerup', () => {
        if (drag.moved) drag.suppressClickUntil = Date.now() + 250;
    });

    function endPan(e) {
        if (!zoom.isPanning) return;
        zoom.isPanning = false;
        try {
            container.releasePointerCapture(e.pointerId);
        } catch (_) { /* ignore */ }
        apply();
    }

    container.addEventListener('pointerup', endPan);
    container.addEventListener('pointercancel', endPan);
    container.addEventListener('pointerleave', (e) => {
        // only end if pointer isn't captured
        if (!zoom.isPanning) return;
        endPan(e);
    });

    // If fullscreen changes, sizes change; re-clamp pan
    document.addEventListener('fullscreenchange', apply);
    window.addEventListener('resize', apply);

    applyNow();
}

function generateDetection(isHeatStress = false) {
    let status = 'NORMAL';
    let baseTemp = 39 + Math.random() * 1.5;
    let confidence = 0.85 + Math.random() * 0.14;
    let severity = 'LOW';

    if (isHeatStress) {
        status = 'HEAT STRESS';
        baseTemp = 41 + Math.random() * 3;
        confidence = 0.75 + Math.random() * 0.24;
        severity = baseTemp > 43 ? 'CRITICAL' : baseTemp > 42 ? 'HIGH' : 'MODERATE';
    } else {
        const isMild = Math.random() > 0.5;
        if (isMild) {
            status = 'MILD';
            baseTemp = 40.5 + Math.random() * 1.2;
            confidence = 0.78 + Math.random() * 0.12;
            severity = 'MODERATE';
        }
    }

    return {
        id: `DET-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date(),
        status,
        isHeatStress: status === 'HEAT STRESS',
        bodyTemp: parseFloat(baseTemp.toFixed(1)),
        confidence: parseFloat(confidence.toFixed(3)),
        duration: status === 'HEAT STRESS' ? `${Math.floor(Math.random() * 45) + 5}m` : '0m',
        severity
    };
}


function buildRecommendationFromDetection(detection) {
    const severity = detection?.severity || 'MODERATE';
    const recs = recommendations[severity] || recommendations.MODERATE;
    const base = recs[0] || { action: 'Review detection details and follow farm protocol.', icon: 'clipboard-list', type: 'info' };
    return {
        ...base,
        id: `toast-${detection.id}`,
        timestamp: formatTimestamp(detection.timestamp),
        severity,
        bodyTemp: detection.bodyTemp,
        confidence: Math.round((detection.confidence || 0) * 100),
        isHeatStress: detection.isHeatStress,
        detectionId: detection.id
    };
}

/** Single source of truth for KPI cards and Detection Snapshot modals. */
function getDetectionCounts(detections = state.detections) {
    let stress = 0;
    let mild = 0;
    let normal = 0;
    let critical = 0;

    for (const d of detections) {
        if (d.status === 'HEAT STRESS') {
            stress++;
        } else if (d.status === 'MILD') {
            mild++;
        } else if (d.status === 'NORMAL') {
            normal++;
        }
        if (d.severity === 'CRITICAL') {
            critical++;
        }
    }

    return {
        stress,
        mild,
        normal,
        critical,
        total: stress + mild + normal
    };
}

function applyDetectionCountsToStats(counts = getDetectionCounts()) {
    state.stats.stressCount = counts.stress;
    state.stats.mildCount = counts.mild;
    state.stats.normalCount = counts.normal;
    state.stats.criticalCount = counts.critical;

    const stressEl = document.getElementById('stressCount');
    const normalEl = document.getElementById('normalCount');
    const mildEl = document.getElementById('mildCount');
    const criticalEl = document.getElementById('criticalCount');
    if (stressEl) stressEl.textContent = counts.stress;
    if (normalEl) normalEl.textContent = counts.normal;
    if (mildEl) mildEl.textContent = counts.mild;
    if (criticalEl) criticalEl.textContent = counts.critical;
}

// ============================================
// SENSOR SIMULATION
// ============================================
function simulateSensorUpdate() {
    // No automatic fake sensor updates are used in production-ready mode.
    return;
}

function updateSensorReadings(temp, humidity) {
    const latestTemp = state.sensorHistory.temp.length > 0 ? state.sensorHistory.temp[state.sensorHistory.temp.length - 1] : null;
    const latestHumidity = state.sensorHistory.humidity.length > 0 ? state.sensorHistory.humidity[state.sensorHistory.humidity.length - 1] : null;
    temp = typeof temp === 'number' ? temp : latestTemp;
    humidity = typeof humidity === 'number' ? humidity : latestHumidity;

    // Temperature
    const tempEl = document.getElementById('tempValue');
    if (tempEl) tempEl.textContent = typeof temp === 'number' ? temp.toFixed(1) : '--';
    const tempPercent = typeof temp === 'number' ? Math.min(100, Math.max(0, ((temp - 20) / 30) * 100)) : 0;
    const tempBar = document.getElementById('tempBar');
    if (tempBar) tempBar.style.width = tempPercent + '%';

    // Humidity
    const humidEl = document.getElementById('humidValue');
    if (humidEl) humidEl.textContent = typeof humidity === 'number' ? humidity.toFixed(1) : '--';
    const humidPercent = typeof humidity === 'number' ? Math.min(100, Math.max(0, humidity)) : 0;
    const humidBar = document.getElementById('humidBar');
    if (humidBar) humidBar.style.width = humidPercent + '%';

    const tempTrendEl = document.getElementById('tempTrend');
    if (tempTrendEl) {
        let tempTrend = null;
        if (state.sensorHistory.temp.length >= 2) {
            const last = state.sensorHistory.temp[state.sensorHistory.temp.length - 1];
            const prev = state.sensorHistory.temp[state.sensorHistory.temp.length - 2];
            if (typeof last === 'number' && typeof prev === 'number') {
                tempTrend = last - prev;
            }
        }
        tempTrendEl.classList.toggle('ht-trend--up', tempTrend > 0);
        tempTrendEl.classList.toggle('ht-trend--down', tempTrend < 0);
        const tempTrendText = tempTrendEl.querySelector('span');
        if (tempTrendText) {
            tempTrendText.textContent = tempTrend === null ? '--' : `${tempTrend >= 0 ? '+' : ''}${tempTrend.toFixed(1)}`;
        }
    }

    const humidTrendEl = document.getElementById('humidTrend');
    if (humidTrendEl) {
        let humidTrend = null;
        if (state.sensorHistory.humidity.length >= 2) {
            const last = state.sensorHistory.humidity[state.sensorHistory.humidity.length - 1];
            const prev = state.sensorHistory.humidity[state.sensorHistory.humidity.length - 2];
            if (typeof last === 'number' && typeof prev === 'number') {
                humidTrend = last - prev;
            }
        }
        humidTrendEl.classList.toggle('ht-trend--up', humidTrend > 0);
        humidTrendEl.classList.toggle('ht-trend--down', humidTrend < 0);
        const humidTrendText = humidTrendEl.querySelector('span');
        if (humidTrendText) {
            humidTrendText.textContent = humidTrend === null ? '--' : `${humidTrend >= 0 ? '+' : ''}${humidTrend.toFixed(1)}`;
        }
    }
    // Update the DHT22 ACTIVE badge visibility after sensor refresh
    updateDHTBadge();
}

    // Show or hide the DHT22 "ACTIVE" badge based on whether sensor readings exist.
    function updateDHTBadge() {
        try {
            const tempEl = document.getElementById('tempValue');
            const panel = tempEl ? tempEl.closest('.ht-panel') : null;
            const badge = panel ? panel.querySelector('.ht-rec-indicator') : null;
            if (!badge) return;

            const hasTemp = state.sensorHistory.temp.length > 0 && typeof state.sensorHistory.temp[state.sensorHistory.temp.length - 1] === 'number';
            const hasHumid = state.sensorHistory.humidity.length > 0 && typeof state.sensorHistory.humidity[state.sensorHistory.humidity.length - 1] === 'number';
            const sensorPresent = hasTemp || hasHumid;

            // Always show the indicator, but toggle between ACTIVE and INACTIVE states
            const dot = badge.querySelector('.ht-live-dot');
            const label = badge.querySelector('.ht-mono-label');

            // Ensure badge is visible
            badge.style.display = '';

            if (sensorPresent) {
                if (dot) {
                    dot.classList.remove('ht-live-dot--inactive');
                    dot.classList.add('ht-live-dot--green');
                }
                if (label) {
                    label.classList.remove('ht-mono-label--inactive');
                    label.classList.add('ht-mono-label--green');
                    label.textContent = 'ACTIVE';
                }
            } else {
                if (dot) {
                    dot.classList.remove('ht-live-dot--green', 'ht-live-dot--thermal');
                    dot.classList.add('ht-live-dot--inactive');
                }
                if (label) {
                    label.classList.remove('ht-mono-label--green');
                    label.classList.add('ht-mono-label--inactive');
                    label.textContent = 'INACTIVE';
                }
            }
        } catch (e) {
            // Fail silently; badge is non-critical.
        }
    }

// ============================================
// DETECTION SIMULATION
// ============================================
function simulateDetection() {
    // No automatic fake detection events are used in production-ready mode.
    return;
}

function updateStats() {
    applyDetectionCountsToStats(getDetectionCounts());
}

// ============================================
// ANNOTATION DRAWING
// ============================================
function drawAnnotations() {
    updateAnnotations();
}

// Check for connected video input devices and update UI accordingly.
async function checkCameraDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        updateCameraUI(false);
        return;
    }
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        updateCameraUI(hasVideo);
    } catch (err) {
        console.warn('Camera device enumeration failed', err);
        updateCameraUI(false);
    }
}

function updateCameraUI(hasCamera) {
    state.cameraActive = !!hasCamera;
    const cameraToggle = document.getElementById('cameraToggle');
    if (cameraToggle) {
        cameraToggle.checked = !!hasCamera;
        cameraToggle.disabled = !hasCamera;
    }

    const containers = [
        document.getElementById('normalCameraContainer'),
        document.getElementById('thermalCameraContainer')
    ];

    containers.forEach(container => {
        if (!container) return;
        const notice = container.querySelector('.ht-camera__no-camera');
        if (notice) notice.remove();
        container.classList.remove('ht-camera--no-input');
        container.removeAttribute('data-offline-text');
    });

    updateSystemToggleStates();
}

function updateAnnotations() {
    if (currentView !== 'live') return;
    const normalContainer = document.getElementById('normalAnnotations');
    const thermalContainer = document.getElementById('thermalAnnotations');
    const normalStats = document.getElementById('normalDuckStats');
    const thermalStats = document.getElementById('thermalDuckStats');

    if (normalContainer) normalContainer.innerHTML = '';
    if (thermalContainer) thermalContainer.innerHTML = '';

    const counts = getDetectionCounts();
    const statsHtml = `
        <div>Ducks: ${counts.total}</div>
        <div>Normal: ${counts.normal}</div>
        <div>Mild: ${counts.mild}</div>
        <div>Heat Stress: ${counts.stress}</div>
    `;
    if (normalStats) normalStats.innerHTML = statsHtml;
    if (thermalStats) thermalStats.innerHTML = statsHtml;
}

// ============================================
// RENDERING FUNCTIONS
// ============================================
function renderDetectionLogs() {
    const tbody = document.getElementById('detectionLogBody');
    const statusFilter = document.getElementById('logFilter').value;
    const { start, end } = getLogDateBounds();

    let filtered = state.detections.slice();
    if (statusFilter === 'heatstress') filtered = filtered.filter(d => d.status === 'HEAT STRESS');
    if (statusFilter === 'mild') filtered = filtered.filter(d => d.status === 'MILD');
    if (statusFilter === 'normal') filtered = filtered.filter(d => d.status === 'NORMAL');

    if (start || end) {
        filtered = filtered.filter(d => {
            const ts = d.timestamp instanceof Date ? d.timestamp : new Date(d.timestamp);
            if (start && ts < start) return false;
            if (end && ts > end) return false;
            return true;
        });
    }

    const totalPages = Math.ceil(filtered.length / state.pageSize) || 1;
    state.currentPage = Math.min(state.currentPage, totalPages);
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const pageData = filtered.slice(startIndex, startIndex + state.pageSize);

    if (!pageData.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="ht-footnote" style="text-align:center; padding:1.5rem 0; font-size:15px; line-height:1.6;">No detections found. Live event data will populate here once available.</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageData.map(d => {
            const sevPill = d.severity === 'CRITICAL' ? 'ht-pill ht-pill--critical' :
                d.severity === 'HIGH' ? 'ht-pill ht-pill--high' :
                d.severity === 'MODERATE' ? 'ht-pill ht-pill--moderate' :
                'ht-pill ht-pill--low';

            const statusWrap = d.status === 'HEAT STRESS' ? 'ht-log-status ht-log-status--stress' : d.status === 'MILD' ? 'ht-log-status ht-log-status--warn' : 'ht-log-status ht-log-status--ok';
            const statusIcon = d.status === 'HEAT STRESS' ? 'alert-triangle' : d.status === 'MILD' ? 'sun' : 'check-circle';
            const flash = d.status === 'HEAT STRESS' ? ' ht-log-row--flash' : '';
            const tempClass = d.bodyTemp > 42 ? 'ht-log-temp--hi' : d.bodyTemp > 41 ? 'ht-log-temp--mid' : 'ht-log-temp--ok';

            // compute duck count for this timestamp + status within the currently filtered set
            const tsKey = (d.timestamp instanceof Date ? d.timestamp.getTime() : new Date(d.timestamp).getTime());
            const countAtTs = filtered.filter(x => {
                const xTs = (x.timestamp instanceof Date ? x.timestamp.getTime() : new Date(x.timestamp).getTime());
                return xTs === tsKey && x.status === d.status;
            }).length;
            const duckLabel = `${countAtTs} duck${countAtTs !== 1 ? 's' : ''}`;

            return `
                <tr class="ht-log-row-clickable${flash}" data-detection-id="${d.id}">
                    <td class="ht-log-cell--mono">${formatTimestamp(d.timestamp)}</td>
                    <td>
                        <div class="${statusWrap}">
                            <i data-lucide="${statusIcon}"></i>
                            <span>${d.status}</span>
                        </div>
                    </td>
                    <td class="ht-log-cell--mono ${tempClass}">${d.bodyTemp}°C</td>
                    <td class="ht-log-cell--mono ht-log-dur">${duckLabel}</td>
                    <td><span class="${sevPill}">${d.severity}</span></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('tr[data-detection-id]').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.getAttribute('data-detection-id');
                const detection = state.detections.find(item => item.id === id);
                if (!detection) return;
                const currentTemp = state.sensorHistory.temp[state.sensorHistory.temp.length - 1] ?? null;
                const rec = buildRecommendationFromDetection(detection);
                openRecommendationModal(rec, currentTemp);
            });
        });
    }

    document.getElementById('logCount').textContent = `Showing ${pageData.length} of ${filtered.length} records`;
    document.getElementById('pageInfo').textContent = `${state.currentPage}/${totalPages}`;
    lucide.createIcons();
}

function renderLiveDetections() {
    const container = document.getElementById('liveDetections');
    if (!container) return;
    const recent = state.detections.slice(0, 8);

    if (!recent.length) {
        container.innerHTML = `<div class="ht-panel__note">No live detections available yet. As live data arrives, this list will update automatically.</div>`;
        return;
    }

    container.innerHTML = recent.map(d => {
        const rowClass = d.status === 'HEAT STRESS' ? 'ht-live-item ht-live-item--stress' : d.status === 'MILD' ? 'ht-live-item ht-live-item--mild' : 'ht-live-item ht-live-item--ok';
        const icon = d.status === 'HEAT STRESS' ? 'alert-triangle' : d.status === 'MILD' ? 'sun' : 'shield-check';

        return `
            <div class="${rowClass}">
                <div class="ht-live-item__ico">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="ht-live-item__main">
                    <div class="ht-live-item__row">
                        <span class="ht-live-item__tag">${d.status}</span>
                    </div>
                    <div class="ht-live-item__meta">${d.bodyTemp}°C • ${Math.round(d.confidence * 100)}% conf</div>
                </div>
                <div class="ht-live-item__time">${formatRelativeTime(d.timestamp)}</div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function renderRecommendations() {
    const container = document.getElementById('recommendationsList');
    const activeRecs = [];

    const recentStress = state.detections.filter(d => d.isHeatStress).slice(0, 5);
    const currentTemp = state.sensorHistory.temp.length > 0 ? state.sensorHistory.temp[state.sensorHistory.temp.length - 1] : null;
    const tempAvailable = typeof currentTemp === 'number';

    if (!tempAvailable && !recentStress.length) {
        container.innerHTML = `
            <div class="ht-footnote" style="text-align:center; padding:1.5rem 0; font-size:15px; line-height:1.6;">
                No recommendations yet. Live sensor readings and detections are required to generate AI recommendations. This panel will update automatically once new data arrives.
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let envRecs = recommendations.LOW;
    if (tempAvailable) {
        if (currentTemp > 40) {
            envRecs = recommendations.CRITICAL;
        } else if (currentTemp > 37) {
            envRecs = recommendations.HIGH;
        } else if (currentTemp > 34) {
            envRecs = recommendations.MODERATE;
        }
    }

    envRecs.forEach(rec => {
        const now = Date.now();
        activeRecs.push({
            ...rec,
            id: `env-${rec.action}`,
            timestamp: formatTimestamp(new Date(now)),
            timestampMs: now,
            severity: tempAvailable
                ? currentTemp > 40 ? 'CRITICAL' : currentTemp > 37 ? 'HIGH' : currentTemp > 34 ? 'MODERATE' : 'LOW'
                : 'LOW',
            bodyTemp: currentTemp,
            confidence: null,
            isHeatStress: tempAvailable ? currentTemp > 34 : false
        });
    });

    recentStress.forEach(d => {
        const recs = recommendations[d.severity] || recommendations.MODERATE;
        activeRecs.push({
            ...recs[0],
            id: `duck-${d.id}`,
            timestamp: formatTimestamp(d.timestamp),
            timestampMs: d.timestamp instanceof Date ? d.timestamp.getTime() : Date.now(),
            severity: d.severity,
            bodyTemp: d.bodyTemp,
            confidence: Math.round(d.confidence * 100),
            isHeatStress: d.isHeatStress
        });
    });

    // Sort all active recommendations so latest items appear first
    activeRecs.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));

    // Ensure the latest recommendations are shown first and preserve older items when the user expands the list
    if (state.recommendationsDisplayed === 0 && activeRecs.length > 0) {
        state.recommendationsDisplayed = state.recommendationsPageSize;
    }
    const toShow = Math.min(state.recommendationsDisplayed, activeRecs.length);
    const displayRecs = activeRecs.slice(0, toShow);
    const hasMore = toShow < activeRecs.length;

    let html = displayRecs.map(r => {
        const cardClass = REC_SEVERITY_CLASS[r.severity] || REC_SEVERITY_CLASS.LOW;
        const category = getRecCategoryLabel(r);
        const tip = getRecTip(r);

        return `
            <button type="button" data-rec-id="${r.id}" class="${cardClass}" role="listitem">
                <div class="ht-rec-card__inner">
                    <div class="ht-rec-card__badge">
                        <i data-lucide="${r.icon}"></i>
                    </div>
                    <div class="ht-rec-card__content">
                        <div class="ht-rec-card__top">
                            <div class="ht-rec-card__action">${r.action}</div>
                            <span class="ht-rec-sev">${r.severity}</span>
                        </div>
                        <div class="ht-rec-card__meta">
                            <span class="ht-rec-card__category">${category}</span>
                        </div>
                        <p class="ht-rec-card__tip">${tip}</p>
                        <div class="ht-rec-card__time">${r.timestamp}</div>
                    </div>
                </div>
            </button>
        `;
    }).join('');

    // Add "Show More" button if there are more recommendations
    if (hasMore) {
        html += `
            <div style="padding: 0.75rem 0; text-align: center;">
                <button type="button" id="recShowMore" class="ht-btn ht-btn--ghost">
                    Show More Recommendations
                </button>
            </div>
        `;
    }

    container.innerHTML = html;

    container.querySelectorAll('[data-rec-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const recId = btn.getAttribute('data-rec-id');
            const selected = displayRecs.find(r => r.id === recId);
            if (selected) {
                openRecommendationModal(selected, currentTemp);
            }
        });
    });

    // Attach "Show More" handler
    const showMoreBtn = container.querySelector('#recShowMore');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            state.recommendationsDisplayed += state.recommendationsPageSize;
            renderRecommendations();
        });
    }

    lucide.createIcons();
}

function openRecommendationModal(rec, currentTemp) {
    const modal = document.getElementById('recommendationModal');
    const body = document.getElementById('recommendationModalBody');
    if (!modal || !body) return;

    const guidanceLines = getRecommendationGuidance(rec);
    const resultSummary = getRecommendationResultSummary(rec, currentTemp);
    const explanation = getRecommendationExplanation(rec, currentTemp);
    const preventionTips = getRecommendationPreventionTips(rec);
    const envInsights = getRecommendationEnvInsights(rec, currentTemp);
    const tempGuidance = getRecommendationTempGuidance(rec, currentTemp);
    const severityClass = rec.severity ? rec.severity.toLowerCase() : 'low';
    const heroClass = `ht-modal-hero ht-modal-hero--${severityClass}`;
    const resultHtml = resultSummary.map(item => `
        <div class="ht-modal-kv__item">
            <div class="ht-modal-kv__label">${item.label}</div>
            <div class="ht-modal-kv__val">${item.value}</div>
        </div>
    `).join('');
    const guidanceHtml = guidanceLines.map(line => `<li>${line}</li>`).join('');
    const preventionHtml = preventionTips.map(line => `<li>${line}</li>`).join('');
    const envHtml = envInsights.map(line => `<li>${line}</li>`).join('');
    const tempHtml = tempGuidance.map(line => `<li>${line}</li>`).join('');

    body.innerHTML = `
        <div class="${heroClass}">
            <div class="ht-modal-row">
                <div>
                    <div class="ht-modal-action">${rec.action}</div>
                    <div class="ht-modal-src">${getRecCategoryLabel(rec)}</div>
                </div>
                <span class="ht-modal-sev">${rec.severity}</span>
            </div>
            <p class="ht-modal-explanation">${explanation}</p>
        </div>

        <div class="ht-modal-detail-grid">
            <div class="ht-modal-detail-card ht-modal-detail-card--full">
                <div class="ht-modal-detail-card__head">
                    <i data-lucide="clipboard-list"></i>
                    <span>Detection Snapshot</span>
                </div>
                <div class="ht-modal-kv">${resultHtml}</div>
            </div>
            <div class="ht-modal-detail-card">
                <div class="ht-modal-detail-card__head">
                    <i data-lucide="zap"></i>
                    <span>Suggested Actions</span>
                </div>
                <ul class="ht-modal-list">${guidanceHtml}</ul>
            </div>
            <div class="ht-modal-detail-card">
                <div class="ht-modal-detail-card__head">
                    <i data-lucide="shield"></i>
                    <span>Heat Stress Prevention</span>
                </div>
                <ul class="ht-modal-list">${preventionHtml}</ul>
            </div>
            <div class="ht-modal-detail-card">
                <div class="ht-modal-detail-card__head">
                    <i data-lucide="cloud-sun"></i>
                    <span>Environmental Insights</span>
                </div>
                <ul class="ht-modal-list">${envHtml}</ul>
            </div>
            <div class="ht-modal-detail-card">
                <div class="ht-modal-detail-card__head">
                    <i data-lucide="thermometer"></i>
                    <span>Temperature Guidance</span>
                </div>
                <ul class="ht-modal-list">${tempHtml}</ul>
            </div>
        </div>

        <div class="ht-modal-callout">
            <h4><i data-lucide="info"></i> <span>Disclaimer</span></h4>
            <p>
                These results and recommendations are assistive only and may contain errors. Always confirm with direct on-site observation of the flock and follow your established farm protocol or veterinary guidance before taking critical action.
            </p>
        </div>
    `;

    const resetScrollPosition = () => {
        if (typeof body.scrollTo === 'function') {
            body.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } else {
            body.scrollTop = 0;
            body.scrollLeft = 0;
        }
        if (typeof modal.scrollTo === 'function') {
            modal.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } else {
            modal.scrollTop = 0;
        }
    };

    // Open modal first so layout/overflow values are stable, then reset scroll on mobile.
    modal.classList.add('is-open');
    if (window.innerWidth <= 767) {
        // Ensure modal body resets to top on mobile to avoid preserving previous scroll
        resetScrollPosition();
        requestAnimationFrame(resetScrollPosition);
    }
    lucide.createIcons();
}

function closeRecommendationModal() {
    const modal = document.getElementById('recommendationModal');
    if (!modal) return;
    modal.classList.remove('is-open');
}

function getRecommendationGuidance(rec) {
    const guidanceBySeverity = {
        CRITICAL: [
            'Start cooling right away and keep the hottest birds apart.',
            'Watch response for 1–3 minutes and be ready to escalate.',
            'Keep water available and avoid extra handling.'
        ],
        HIGH: [
            'Turn fans and shade on high, then recheck in 10 minutes.',
            'Reduce crowding and delay non-essential activity.',
            'Focus on the hottest zones first.'
        ],
        MODERATE: [
            'Use preventive cooling and monitor the trend.',
            'Check drinkers, vents, and shade coverage.',
            'Be ready to act if temperatures rise again.'
        ],
        LOW: [
            'Keep regular monitoring active.',
            'Verify water and airflow are working.',
            'Note any new heat spikes for the next check.'
        ]
    };

    return guidanceBySeverity[rec.severity] || guidanceBySeverity.MODERATE;
}

function getRecommendationExplanation(rec, currentTemp) {
    const temp = rec.bodyTemp || currentTemp;
    const confidence = rec.confidence ? `${rec.confidence}%` : 'high';
    if (rec.isHeatStress) {
        if (typeof temp === 'number') {
            return `Heat stress is likely at ${temp.toFixed(1)}°C. This recommendation is based on thermal data with ${confidence} confidence, so act quickly to lower heat load.`;
        }
        return `Heat stress is likely. This recommendation is based on available detection data and should be confirmed on-site.`;
    }

    if (typeof temp === 'number') {
        return `Current conditions are not critical, but the system recommends preventive cooling because temperatures are elevated around ${temp.toFixed(1)}°C.`;
    }
    return `The system is awaiting live sensor values. Maintain monitoring and confirm conditions with on-site observation.`;
}

function getRecommendationPreventionTips(rec) {
    const bySeverity = {
        CRITICAL: [
            'Open airflow and keep water available.',
            'Avoid unnecessary movement or handling.',
            'Keep the hottest animals separated from the group.'
        ],
        HIGH: [
            'Boost shade and fan output where it is hottest.',
            'Check that all birds can reach water easily.',
            'Delay extra handling until conditions calm.'
        ],
        MODERATE: [
            'Check vents, water, and shade before heat rises.',
            'Move cooling equipment closer if needed.',
            'Track the trend for any quick changes.'
        ],
        LOW: [
            'Keep normal checks active and log peak readings.',
            'Confirm fans and water are working properly.',
            'Stay ready for a quick response if heat rises.'
        ]
    };

    const base = bySeverity[rec.severity] || bySeverity.MODERATE;
    return rec.tip ? [rec.tip, base[0], base[1]] : base;
}

function getRecommendationEnvInsights(rec, currentTemp) {
    const humidValue = state.sensorHistory.humidity[state.sensorHistory.humidity.length - 1];
    const humidStr = typeof humidValue === 'number' ? `${humidValue.toFixed(0)}%` : 'unknown';
    const tempStr = typeof currentTemp === 'number' ? `${currentTemp.toFixed(1)}°C` : 'unknown';

    return [
        `Ambient ${tempStr}, humidity ${humidStr}.`,
        `Humidity affects evaporative cooling and heat stress risk.`,
        rec.severity === 'CRITICAL' || rec.severity === 'HIGH'
            ? 'Heat risk is high now — cool the space first.'
            : 'Conditions are moderate but should be watched closely.'
    ];
}

function getRecommendationTempGuidance(rec, currentTemp) {
    const bodyTemp = rec.bodyTemp != null ? rec.bodyTemp : currentTemp;
    const tempLabel = typeof bodyTemp === 'number' ? `${bodyTemp.toFixed(1)}°C` : 'unknown';
    const recheck = rec.severity === 'CRITICAL' ? '1–3 min' : rec.severity === 'HIGH' ? '10 min' : rec.severity === 'MODERATE' ? '15 min' : '30 min';

    return [
        `Temperature: ${tempLabel}.`,
        `Recheck in ${recheck}.`,
        rec.confidence
            ? `Confidence ${rec.confidence}% — confirm with a quick visual check.`
            : 'Verify with a quick visual or thermal check before acting.'
    ];
}

function getRecommendationResultSummary(rec, currentTemp) {
    const counts = getDetectionCounts();
    const recheckMap = { CRITICAL: 'Immediately', HIGH: 'Within 10 min', MODERATE: 'Within 15 min', LOW: 'Next 30 min' };
    const duckCount = (n) => `${n} duck${n !== 1 ? 's' : ''}`;
    const ambientTemp = typeof currentTemp === 'number' ? `${currentTemp.toFixed(1)}°C` : 'Unknown';
    const detectedTemp = rec.bodyTemp != null ? `${rec.bodyTemp}°C` : ambientTemp;

    return [
        { label: 'Detection Time', value: rec.timestamp },
        { label: 'Severity Level', value: rec.severity },
        { label: 'Detected Body Temp', value: detectedTemp },
        { label: 'Barn Ambient Temp', value: ambientTemp },
        { label: 'Heat Stress Detected', value: duckCount(counts.stress) },
        { label: 'Normal Ducks', value: duckCount(counts.normal) },
        { label: 'Mild Detections', value: duckCount(counts.mild) },
        { label: 'Critical Cases', value: duckCount(counts.critical) },
        { label: 'Recommended Recheck', value: recheckMap[rec.severity] || 'Within 15 min' }
    ];
}

function formatRelativeTime(date) {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// ALERTS SYSTEM
// ============================================
function showAlert(detection) {
    // Add viewed tracking to alert
    const alertWithViewed = {
        ...detection,
        viewed: false,
        viewedAt: null
    };
    state.alerts.unshift(alertWithViewed);
    if (state.alerts.length > 100) state.alerts.pop();
    state.alertCount = state.alerts.length;

    const badge = document.getElementById('alertBadge');
    badge.textContent = state.alertCount;
    badge.classList.remove('u-hidden');

    renderAlerts();
    lucide.createIcons();
}

function renderAlerts() {
    const alertList = document.getElementById('alertList');
    if (!alertList) return;

    // Ensure the latest alerts are shown first and preserve older alerts when the user expands the list
    if (state.alertsDisplayed === 0 && state.alerts.length > 0) {
        state.alertsDisplayed = state.alertsPageSize;
    }
    const toShow = Math.min(state.alertsDisplayed, state.alerts.length);
    const displayAlerts = state.alerts.slice(0, toShow);
    const hasMore = toShow < state.alerts.length;

    let html = '';
    if (displayAlerts.length === 0) {
        html = '<p class="ht-alert-panel__empty">No alerts yet</p>';
    } else {
        html = displayAlerts.map(a => {
            const viewedClass = a.viewed ? 'ht-alert-item--viewed' : 'ht-alert-item--unviewed';
            return `
                <button type="button" data-alert-id="${a.id}" class="ht-alert-item ${viewedClass}">
                    <div class="ht-alert-item__row">
                        <i data-lucide="alert-triangle"></i>
                        <div class="ht-alert-item__body">
                            <div class="ht-alert-item__title">Heat stress detected</div>
                            <div class="ht-alert-item__sub">${a.bodyTemp}°C • ${a.severity}</div>
                        </div>
                        <span class="ht-alert-item__time">${formatRelativeTime(a.timestamp)}</span>
                    </div>
                </button>
            `;
        }).join('');

        // Add "Show More" button if there are more alerts
        if (hasMore) {
            html += `
                <div style="padding: 0.75rem 0; text-align: center;">
                    <button type="button" id="alertShowMore" class="ht-btn ht-btn--ghost">
                        Show More Notifications
                    </button>
                </div>
            `;
        }
    }

    alertList.innerHTML = html;

    // Attach click handlers to mark alerts as viewed
    alertList.querySelectorAll('[data-alert-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const alertId = btn.dataset.alertId;
            markAlertAsViewed(alertId);
            const alert = state.alerts.find(a => a.id === alertId);
            if (alert) {
                openRecommendationModal(buildRecommendationFromDetection(alert), state.sensorHistory.temp[state.sensorHistory.temp.length - 1]);
            }
        });
    });

    // Attach "Show More" handler
    const showMoreBtn = alertList.querySelector('#alertShowMore');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            state.alertsDisplayed += state.alertsPageSize;
            renderAlerts();
        });
    }

    lucide.createIcons();
}

function markAlertAsViewed(alertId) {
    const alert = state.alerts.find(a => a.id === alertId);
    if (alert && !alert.viewed) {
        alert.viewed = true;
        alert.viewedAt = new Date();
        renderAlerts();
    }
}

function showToast(detection) {
    if (!state.alertsEnabled) return;

    const toast = document.getElementById('alertToast');
    const msg = document.getElementById('toastMessage');
    const time = document.getElementById('toastTime');

    state.lastToastDetection = detection;
    msg.textContent = `Heat stress detected. Body temp: ${detection.bodyTemp}°C, Severity: ${detection.severity}`;
    time.textContent = formatRelativeTime(detection.timestamp);

    toast.classList.add('is-visible');

    // Mark as viewed when user clicks the toast
    const toastCard = toast.querySelector('.ht-toast__card');
    if (toastCard) {
        toastCard.style.cursor = 'pointer';
    }

    setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 5000);
}

function updateSystemToggleStates() {
    const cameraToggle = document.getElementById('cameraToggle');
    const aiToggle = document.getElementById('aiToggle');
    const alertToggle = document.getElementById('alertToggle');
    const normalCameraContainer = document.getElementById('normalCameraContainer');
    const thermalCameraContainer = document.getElementById('thermalCameraContainer');

    if (!state.cameraActive) {
        state.aiActive = false;
        state.alertsEnabled = false;
    }
    if (!state.aiActive) {
        state.alertsEnabled = false;
    }

    if (cameraToggle) {
        cameraToggle.checked = state.cameraActive;
        cameraToggle.disabled = false;
    }
    if (aiToggle) {
        aiToggle.checked = state.aiActive;
        aiToggle.disabled = !state.cameraActive;
    }
    if (alertToggle) {
        alertToggle.checked = state.alertsEnabled;
        alertToggle.disabled = !state.cameraActive || !state.aiActive;
    }

    [normalCameraContainer, thermalCameraContainer].forEach((container) => {
        if (!container) return;
        container.classList.toggle('camera-feed--offline', !state.cameraActive);
        container.title = state.cameraActive ? 'Click to expand fullscreen' : 'Camera streams are off';
    });

    // Live badge state is managed by monitor media presence detection
    updateMonitorPresenceUI();

    if (!state.alertsEnabled) {
        document.getElementById('alertToast')?.classList.remove('is-visible');
    }
}

// ============================================
// CHARTS
// ============================================
let envChart, detectionChart, severityChart;
const detectionLegendState = {
    Normal: false,
    Mild: false,
    'Heat Stress': false,
};

const detectionStatusLabels = ['Normal', 'Mild', 'Heat Stress'];

function initCharts() {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        }
    };

    // Environmental Trend Chart
    const envCtx = document.getElementById('envChart').getContext('2d');
    envChart = new Chart(envCtx, {
        type: 'line',
        data: {
            labels: state.sensorHistory.labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: state.sensorHistory.temp,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                {
                    label: 'Humidity (%)',
                    data: state.sensorHistory.humidity,
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                // Heat Index dataset removed
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    display: false,
                },
                y: {
                    grid: {
                        color: 'rgba(226, 232, 240, 0.8)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10, family: 'JetBrains Mono' },
                        padding: 8,
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    titleColor: '#475569',
                    bodyColor: '#1e293b',
                    titleFont: { size: 10 },
                    bodyFont: { size: 11, family: 'JetBrains Mono' },
                    padding: 10,
                    cornerRadius: 8,
                }
            }
        }
    });

    // Detection Distribution Chart (Doughnut)
    const detCtx = document.getElementById('detectionChart').getContext('2d');
    detectionChart = new Chart(detCtx, {
        type: 'doughnut',
        data: {
            labels: detectionStatusLabels,
            datasets: [{
                data: [state.stats.normalCount || 0, state.stats.mildCount || 0, state.stats.stressCount || 0],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderColor: ['#16a34a', '#d97706', '#dc2626'],
                borderWidth: 2,
                hoverBorderWidth: 4,
                hoverBorderColor: ['#ffffff', '#ffffff', '#ffffff'],
            }]
        },
        options: {
            ...chartDefaults,
            animation: {
                duration: 500,
                easing: 'easeOutCubic',
                animateRotate: true,
                animateScale: true,
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    titleColor: '#475569',
                    bodyColor: '#1e293b',
                    bodyFont: { size: 11, family: 'JetBrains Mono' },
                    padding: 10,
                    cornerRadius: 8,
                }
            }
        }
    });

    renderDetectionLegend();

    // Severity Chart (Bar)
    const sevCtx = document.getElementById('severityChart').getContext('2d');
    const severityData = getSeverityData();
    severityChart = new Chart(sevCtx, {
        type: 'bar',
        data: {
            labels: ['Critical', 'High', 'Moderate', 'Low'],
            datasets: [{
                label: 'Detections',
                data: severityData,
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(249, 115, 22, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                ],
                borderColor: [
                    '#ef4444',
                    '#f97316',
                    '#eab308',
                    '#22c55e',
                ],
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.6,
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#475569',
                        font: {
                            size: 12,
                            family: 'DM Sans, system-ui, sans-serif',
                            style: 'normal',
                            weight: '400',
                        },
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(226, 232, 240, 0.8)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#475569',
                        font: {
                            size: 12,
                            family: 'DM Sans, system-ui, sans-serif',
                            style: 'normal',
                            weight: '400',
                        },
                        stepSize: 1,
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    titleColor: '#475569',
                    bodyColor: '#1e293b',
                    titleFont: { size: 10 },
                    bodyFont: { size: 11, family: 'JetBrains Mono' },
                    padding: 10,
                    bodySpacing: 4,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: (items) => {
                            const item = Array.isArray(items) ? items[0] : items;
                            return item?.label || '';
                        },
                        label: (context) => {
                            const value = context.parsed?.y ?? context.raw;
                            return `${value}`;
                        }
                    }
                }
            }
        }
    });
}

function getSeverityData() {
    return [
        state.detections.filter(d => d.severity === 'CRITICAL').length,
        state.detections.filter(d => d.severity === 'HIGH').length,
        state.detections.filter(d => d.severity === 'MODERATE').length,
        state.detections.filter(d => d.severity === 'LOW').length,
    ];
}

function updateEnvChart() {
    if (!envChart) return;
    envChart.data.labels = state.sensorHistory.labels;
    envChart.data.datasets[0].data = state.sensorHistory.temp;
    envChart.data.datasets[1].data = state.sensorHistory.humidity;
    envChart.update('none');
}

function getDetectionDistributionValues() {
    const counts = detectionStatusLabels.map(label => {
        const status = label.toUpperCase();
        return state.detections.filter(d => d.status === status).length;
    });

    return counts.map((count, idx) => detectionLegendState[detectionStatusLabels[idx]] ? 0 : count);
}

function renderDetectionLegend() {
    const legendDiv = document.getElementById('detectionLegend');
    if (!legendDiv || !detectionChart) return;
    const colors = detectionChart.data.datasets[0].backgroundColor;

    legendDiv.innerHTML = detectionStatusLabels.map((label, idx) => `
        <button type="button" class="ht-detection-legend-item${detectionLegendState[label] ? ' is-hidden' : ''}" data-detection-status="${label}">
            <span class="ht-detection-legend-swatch" style="background:${colors[idx]};"></span>
            <span>${label}</span>
        </button>
    `).join('');

    legendDiv.querySelectorAll('[data-detection-status]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const status = btn.getAttribute('data-detection-status');
            detectionLegendState[status] = !detectionLegendState[status];
            renderDetectionLegend();
            updateDetectionChart();
        });
    });
}

function updateDetectionChart() {
    if (!detectionChart) return;
    detectionChart.data.datasets[0].data = getDetectionDistributionValues();
    detectionChart.update();
    renderDetectionLegend();
}

function updateSeverityChart() {
    if (!severityChart) return;
    severityChart.data.datasets[0].data = getSeverityData();
    severityChart.update('none');
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const alertBtn = document.getElementById('alertBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    // Suppress hover/tooltips on touch for alert/settings
    alertBtn?.addEventListener('touchstart', suppressHoverTemporarily, { passive: true });
    settingsBtn?.addEventListener('touchstart', suppressHoverTemporarily, { passive: true });

    // Alert button
    alertBtn?.addEventListener('click', () => {
        const panel = document.getElementById('alertPanel');
        const settingsPanel = document.getElementById('settingsPanel');
        const settingsBtn = document.getElementById('settingsBtn');
        const menuBtn = document.getElementById('navMenuToggle');
        const nav = document.getElementById('mobileNav');
        const wasHidden = panel.classList.contains('u-hidden');

        if (wasHidden) {
            animatePanelOpen(panel);
            alertBtn.classList.add('is-active');
            animatePanelClose(settingsPanel);
            settingsBtn?.classList.remove('is-active');
            nav?.classList.remove('is-open');
            menuBtn?.classList.remove('is-active');
            menuBtn?.setAttribute('aria-expanded', 'false');
        } else {
            animatePanelClose(panel);
            alertBtn.classList.remove('is-active');
            suppressHoverTemporarily();
        }
    });

    // Settings button
    settingsBtn?.addEventListener('click', () => {
        const panel = document.getElementById('settingsPanel');
        const alertPanel = document.getElementById('alertPanel');
        const menuBtn = document.getElementById('navMenuToggle');
        const nav = document.getElementById('mobileNav');
        const wasHidden = panel.classList.contains('u-hidden');

        if (wasHidden) {
            animatePanelOpen(panel);
            settingsBtn.classList.add('is-active');
            animatePanelClose(alertPanel);
            alertBtn?.classList.remove('is-active');
            nav?.classList.remove('is-open');
            menuBtn?.classList.remove('is-active');
            menuBtn?.setAttribute('aria-expanded', 'false');
        } else {
            animatePanelClose(panel);
            settingsBtn.classList.remove('is-active');
            suppressHoverTemporarily();
        }
    });

    // Prevent clicks inside panels from bubbling and triggering outside-click close
    const alertPanel = document.getElementById('alertPanel');
    const settingsPanel = document.getElementById('settingsPanel');
    
    alertPanel?.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    settingsPanel?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Close panels on outside click (but not when clicking inside the panels)
    document.addEventListener('click', (e) => {
        const alertPanel = document.getElementById('alertPanel');
        const settingsPanel = document.getElementById('settingsPanel');
        if (!alertPanel || !settingsPanel || !alertBtn || !settingsBtn) return;
        if (!alertPanel.contains(e.target) && !alertBtn.contains(e.target)) {
            animatePanelClose(alertPanel);
            alertBtn.classList.remove('is-active');
            // Remove tap-induced hover effect after panel closes
            suppressHoverTemporarily();
        }
        if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
            animatePanelClose(settingsPanel);
            settingsBtn.classList.remove('is-active');
            // Remove tap-induced hover effect after panel closes
            suppressHoverTemporarily();
        }
    });

    // Clear alerts
    document.getElementById('clearAlerts').addEventListener('click', () => {
        state.alerts = [];
        state.alertCount = 0;
        document.getElementById('alertBadge').classList.add('u-hidden');
        document.getElementById('alertList').innerHTML = '<p class="ht-alert-panel__empty">No alerts yet</p>';
    });

    // Close toast
    document.getElementById('closeToast').addEventListener('click', () => {
        const toast = document.getElementById('alertToast');
        toast.classList.remove('is-visible');
    });

    // Click toast to open recommendation details and mark as viewed
    document.getElementById('alertToast').addEventListener('click', (e) => {
        if (e.target.closest('#closeToast')) return;
        const detection = state.lastToastDetection;
        if (!detection) return;
        // Mark as viewed if it has an id
        if (detection.id) {
            markAlertAsViewed(detection.id);
        }
        const currentTemp = state.sensorHistory.temp.length > 0 ? state.sensorHistory.temp[state.sensorHistory.temp.length - 1] : null;
        openRecommendationModal(buildRecommendationFromDetection(detection), currentTemp);
    });

    // Recommendation modal controls
    document.getElementById('closeRecommendationModal').addEventListener('click', closeRecommendationModal);
    document.getElementById('recommendationModalBackdrop').addEventListener('click', closeRecommendationModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRecommendationModal();
        }
    });

    // Log filter
    document.getElementById('logFilter').addEventListener('change', () => {
        const el = document.getElementById('logFilter');
        if (el) {
            el.classList.remove('is-active');
            el.blur();
        }
        state.currentPage = 1;
        renderDetectionLogs();
    });

    document.getElementById('logDateRange').addEventListener('change', () => {
        const el = document.getElementById('logDateRange');
        if (el) {
            el.classList.remove('is-active');
            el.blur();
        }
        state.currentPage = 1;
        toggleCustomLogRangeInputs();
        renderDetectionLogs();
    });

    const logCustomStartInput = document.getElementById('logCustomStart');
    const logCustomStartWrapper = logCustomStartInput?.closest('.ht-select');

    if (logCustomStartInput) {
        logCustomStartInput.addEventListener('focus', () => {
            logCustomStartWrapper?.classList.add('is-active');
        });

        logCustomStartInput.addEventListener('blur', () => {
            logCustomStartWrapper?.classList.remove('is-active');
        });

        logCustomStartInput.addEventListener('change', () => {
            const el = logCustomStartInput;
            if (el) {
                // Validate and prevent future dates in mobile mode
                if (el.value) {
                    const selectedDate = new Date(el.value);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    
                    if (selectedDate > today) {
                        // Reset to today if a future date was selected
                        el.value = getTodayInputValue();
                    }
                }
                // Format and display the selected date in mm/dd/yyyy format
                const formattedDate = formatDateToDisplay(el.value);
                el.setAttribute('data-has-value', el.value ? 'true' : 'false');
                el.setAttribute('data-display-date', formattedDate);
                const placeholder = el.nextElementSibling;
                if (placeholder && placeholder.classList.contains('ht-custom-range__placeholder')) {
                    placeholder.textContent = formattedDate || 'mm/dd/yyyy';
                }
                // Remove active state after selection
                logCustomStartWrapper?.classList.remove('is-active');
                el.blur();
            }
            state.currentPage = 1;
            renderDetectionLogs();
        });
    }

    const logCustomEndInput = document.getElementById('logCustomEnd');
    const logCustomEndWrapper = logCustomEndInput?.closest('.ht-select');

    if (logCustomEndInput) {
        logCustomEndInput.addEventListener('focus', () => {
            logCustomEndWrapper?.classList.add('is-active');
        });

        logCustomEndInput.addEventListener('blur', () => {
            logCustomEndWrapper?.classList.remove('is-active');
        });

        logCustomEndInput.addEventListener('change', () => {
            const el = logCustomEndInput;
            if (el) {
                // Validate and prevent future dates in mobile mode
                if (el.value) {
                    const selectedDate = new Date(el.value);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    
                    if (selectedDate > today) {
                        // Reset to today if a future date was selected
                        el.value = getTodayInputValue();
                    }
                }
                // Format and display the selected date in mm/dd/yyyy format
                const formattedDate = formatDateToDisplay(el.value);
                el.setAttribute('data-has-value', el.value ? 'true' : 'false');
                el.setAttribute('data-display-date', formattedDate);
                const placeholder = el.nextElementSibling;
                if (placeholder && placeholder.classList.contains('ht-custom-range__placeholder')) {
                    placeholder.textContent = formattedDate || 'mm/dd/yyyy';
                }
                // Remove active state after selection
                logCustomEndWrapper?.classList.remove('is-active');
                el.blur();
            }
            state.currentPage = 1;
            renderDetectionLogs();
        });
    }

    // Make date picker containers clickable to open the date picker without immediately closing it on mobile.
    const logCustomStartContainer = document.getElementById('logCustomStart')?.parentElement;
    if (logCustomStartContainer) {
        const startInput = document.getElementById('logCustomStart');
        let startPickerTouchTime = 0;
        const openStartPicker = (e) => {
            if (!startInput || e.target === startInput) return;
            const isTouchOpen = e.type === 'pointerdown' ? e.pointerType === 'touch' : e.type === 'touchstart';
            if (isTouchOpen) {
                e.preventDefault();
                e.stopPropagation();
                startPickerTouchTime = Date.now();
                if (typeof startInput.showPicker === 'function') {
                    window.setTimeout(() => startInput.showPicker(), 0);
                } else {
                    window.setTimeout(() => startInput.focus(), 0);
                }
                return;
            }
            if (e.type === 'click' && Date.now() - startPickerTouchTime < 700) {
                startPickerTouchTime = 0;
                return;
            }
            if (typeof startInput.showPicker === 'function') {
                startInput.showPicker();
            } else {
                startInput.focus();
            }
        };

        logCustomStartContainer.addEventListener('click', openStartPicker);
        logCustomStartContainer.addEventListener('pointerdown', openStartPicker, { passive: false });
        startInput.addEventListener('pointerdown', (e) => e.stopPropagation());
        startInput.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    }

    const logCustomEndContainer = document.getElementById('logCustomEnd')?.parentElement;
    if (logCustomEndContainer) {
        const endInput = document.getElementById('logCustomEnd');
        let endPickerTouchTime = 0;
        const openEndPicker = (e) => {
            if (!endInput || e.target === endInput) return;
            const isTouchOpen = e.type === 'pointerdown' ? e.pointerType === 'touch' : e.type === 'touchstart';
            if (isTouchOpen) {
                e.preventDefault();
                e.stopPropagation();
                endPickerTouchTime = Date.now();
                if (typeof endInput.showPicker === 'function') {
                    window.setTimeout(() => endInput.showPicker(), 0);
                } else {
                    window.setTimeout(() => endInput.focus(), 0);
                }
                return;
            }
            if (e.type === 'click' && Date.now() - endPickerTouchTime < 700) {
                endPickerTouchTime = 0;
                return;
            }
            if (typeof endInput.showPicker === 'function') {
                endInput.showPicker();
            } else {
                endInput.focus();
            }
        };

        logCustomEndContainer.addEventListener('click', openEndPicker);
        logCustomEndContainer.addEventListener('pointerdown', openEndPicker, { passive: false });
        endInput.addEventListener('pointerdown', (e) => e.stopPropagation());
        endInput.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
    }

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderDetectionLogs();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        state.currentPage++;
        renderDetectionLogs();
    });

    // Export logs: Generate Excel report matching specifications exactly
    document.getElementById('exportLogs').addEventListener('click', () => {
        const counts = getDetectionCounts();
        const now = new Date();

        function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

        // Build comprehensive styles
        let styleXml = '<Styles>';
        
        // Title - Row 2 (B2:I2) - with bottom border only (4pt)
        styleXml += '<Style ss:ID="sTitle"><Font ss:Bold="1" ss:Size="20" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#F4A15D" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="2.4" ss:Color="#FB923C" ss:Position="Bottom"/></Borders></Style>';
        
        // Spacer Row 3 (B3:I3)
        styleXml += '<Style ss:ID="sSpacer"><Font ss:FontName="Calibri" ss:Size="11"/></Style>';
        
        // Generated timestamp - Row 4 (B4:I4) - left aligned, vertically centered, bold with thin borders
        styleXml += '<Style ss:ID="sGenerated"><Font ss:Bold="1" ss:Size="10" ss:FontName="Calibri" ss:Color="#F3F3F3"/><Interior ss:Color="#FFA75F" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FB923C" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FB923C" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FB923C" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FB923C" ss:Position="Right"/></Borders></Style>';
        
        // Summary cards - Row 6 values (B6:C6, E6:F6, H6:I6)
        styleXml += '<Style ss:ID="sCardNormalVal"><Font ss:Bold="1" ss:Size="11" ss:FontName="Calibri" ss:Color="#274E13"/><Interior ss:Color="#70F09F" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
        styleXml += '<Style ss:ID="sCardMildVal"><Font ss:Bold="1" ss:Size="11" ss:FontName="Calibri" ss:Color="#783F04"/><Interior ss:Color="#F7BC5B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
        styleXml += '<Style ss:ID="sCardHeatstressVal"><Font ss:Bold="1" ss:Size="11" ss:FontName="Calibri" ss:Color="#CE2B1D"/><Interior ss:Color="#FF9494" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
        
        // Summary cards - Row 7 labels (B7:C7, E7:F7, H7:I7)
        styleXml += '<Style ss:ID="sCardNormalLbl"><Font ss:Bold="1" ss:Size="11" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#4ADE80" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
        styleXml += '<Style ss:ID="sCardMildLbl"><Font ss:Bold="1" ss:Size="11" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#F59E0B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
        styleXml += '<Style ss:ID="sCardHeatstressLbl"><Font ss:Bold="1" ss:Size="11" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#F87171" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>';
        
        // Spacing column style
        styleXml += '<Style ss:ID="sSpacingCol"><Font ss:FontName="Calibri" ss:Size="11"/></Style>';
        
        // Table header style - Row 9 with white borders
        styleXml += '<Style ss:ID="sHeader"><Font ss:Bold="1" ss:Size="11" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#FB923C" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        
        // Data row styles - alternating colors with white borders
        styleXml += '<Style ss:ID="sDataRow1Timestamp"><Font ss:Size="10" ss:FontName="Calibri"/><Interior ss:Color="#FFCBA2" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sDataRow2Timestamp"><Font ss:Size="10" ss:FontName="Calibri"/><Interior ss:Color="#FFDDC2" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        
        // Status conditional colors with white text and borders
        styleXml += '<Style ss:ID="sStatusNormal"><Font ss:Size="10" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#4ADE80" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sStatusMild"><Font ss:Size="10" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#F59E0B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sStatusHeatstress"><Font ss:Size="10" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#F87171" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        
        // Severity conditional colors with white text and borders
        styleXml += '<Style ss:ID="sSevLow"><Font ss:Size="10" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#4ADE80" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sSevModerate"><Font ss:Size="10" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#FACC15" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sSevHigh"><Font ss:Size="10" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#FB923C" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sSevCritical"><Font ss:Size="10" ss:FontName="Calibri" ss:Color="#FFFFFF"/><Interior ss:Color="#F87171" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        
        // Center-aligned data cells with alternating colors and white borders
        styleXml += '<Style ss:ID="sDataCenterRow1"><Font ss:Size="10" ss:FontName="Calibri"/><Interior ss:Color="#FFCBA2" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sDataCenterRow2"><Font ss:Size="10" ss:FontName="Calibri"/><Interior ss:Color="#FFDDC2" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        
        // Left-aligned recommendation cells with text wrapping and white borders
        styleXml += '<Style ss:ID="sRecRow1"><Font ss:Size="10" ss:FontName="Calibri"/><Interior ss:Color="#FFCBA2" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        styleXml += '<Style ss:ID="sRecRow2"><Font ss:Size="10" ss:FontName="Calibri"/><Interior ss:Color="#FFDDC2" ss:Pattern="Solid"/><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Top"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Bottom"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Left"/><Border ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFFFFF" ss:Position="Right"/></Borders></Style>';
        
        styleXml += '</Styles>';

        // Column widths: A=22, B=100, C=117, D=117, E=117, F=117, G=117, H=117, I=100
        let tableXml = '<Table>';
        const colWidths = [22, 100, 117, 117, 117, 117, 117, 117, 100];
        for (let i = 0; i < colWidths.length; i++) {
            tableXml += '<Column ss:Width="' + colWidths[i] + '"/>';
        }

        const normalCount = counts.normal || 0;
        const mildCount = counts.mild || 0;
        const heatstressCount = counts.stress || 0;

        // ROW 1: Empty row
        tableXml += '<Row ss:Height="15"><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/></Row>';

        // ROW 2: Title (B2:I2 merged) - 35px height
        tableXml += '<Row ss:Height="26"><Cell/><Cell ss:MergeAcross="7" ss:StyleID="sTitle"><Data ss:Type="String">HeatTrack Analytics Report</Data></Cell></Row>';

        // ROW 3: Spacer (B3:I3 merged)
        tableXml += '<Row ss:Height="15"><Cell/><Cell ss:MergeAcross="7" ss:StyleID="sSpacer"><Data ss:Type="String"></Data></Cell></Row>';

        // ROW 4: Generated timestamp (B4:I4 merged)
        const timestamp = now.toLocaleString('en-US', { 
            month: '2-digit', day: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit', 
            hour12: true 
        });
        tableXml += '<Row ss:Height="18"><Cell/><Cell ss:MergeAcross="7" ss:StyleID="sGenerated"><Data ss:Type="String">Generated: ' + esc(timestamp) + '</Data></Cell></Row>';

        // ROW 5: Spacer (B5:I5 merged)
        tableXml += '<Row ss:Height="15"><Cell/><Cell ss:MergeAcross="7" ss:StyleID="sSpacer"><Data ss:Type="String"></Data></Cell></Row>';

        // ROW 6: Summary values (B6:C6 Normal, D6:D7 vertical spacing, E6:F6 Mild, G6:G7 vertical spacing, H6:I6 Heatstress)
        tableXml += '<Row ss:Height="22">';
        tableXml += '<Cell/>';
        tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="sCardNormalVal"><Data ss:Type="Number">' + normalCount + '</Data></Cell>';
        tableXml += '<Cell ss:MergeDown="1" ss:StyleID="sSpacingCol"><Data ss:Type="String"></Data></Cell>';
        tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="sCardMildVal"><Data ss:Type="Number">' + mildCount + '</Data></Cell>';
        tableXml += '<Cell ss:MergeDown="1" ss:StyleID="sSpacingCol"><Data ss:Type="String"></Data></Cell>';
        tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="sCardHeatstressVal"><Data ss:Type="Number">' + heatstressCount + '</Data></Cell>';
        tableXml += '</Row>';

        // ROW 7: Summary labels (B7:C7 Normal, D7 merged from above, E7:F7 Mild, G7 merged from above, H7:I7 Heatstress)
        tableXml += '<Row ss:Height="22">';
        tableXml += '<Cell/>';
        tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="sCardNormalLbl"><Data ss:Type="String">Normal Ducks</Data></Cell>';
        tableXml += '<Cell ss:Index="5" ss:MergeAcross="1" ss:StyleID="sCardMildLbl"><Data ss:Type="String">Mild Ducks</Data></Cell>';
        tableXml += '<Cell ss:Index="8" ss:MergeAcross="1" ss:StyleID="sCardHeatstressLbl"><Data ss:Type="String">Heatstress Ducks</Data></Cell>';
        tableXml += '</Row>';

        // ROW 8: Spacer
        tableXml += '<Row ss:Height="15"><Cell/><Cell ss:MergeAcross="7" ss:StyleID="sSpacer"><Data ss:Type="String"></Data></Cell></Row>';

        // ROW 9: Table Header
        tableXml += '<Row ss:Height="24">';
        tableXml += '<Cell/>';
        tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Timestamp</Data></Cell>';
        tableXml += '<Cell ss:StyleID="sHeader"><Data ss:Type="String">Status</Data></Cell>';
        tableXml += '<Cell ss:StyleID="sHeader"><Data ss:Type="String">Body Temp (°C)</Data></Cell>';
        tableXml += '<Cell ss:StyleID="sHeader"><Data ss:Type="String">Duck Count</Data></Cell>';
        tableXml += '<Cell ss:StyleID="sHeader"><Data ss:Type="String">Severity</Data></Cell>';
        tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Top Recommendation</Data></Cell>';
        tableXml += '</Row>';

        // ROWS 10+: Data rows
        state.detections.forEach((d, idx) => {
            const isRow1 = (idx % 2 === 0);
            const timestampStyle = isRow1 ? 'sDataRow1Timestamp' : 'sDataRow2Timestamp';
            const centerStyle = isRow1 ? 'sDataCenterRow1' : 'sDataCenterRow2';
            const recStyle = isRow1 ? 'sRecRow1' : 'sRecRow2';
            
            // Determine status and style
            const statusText = d.isHeatStress ? 'Heatstress' : (d.severity === 'HIGH' || d.severity === 'MODERATE' ? 'Mild' : 'Normal');
            let statusStyle;
            if (d.isHeatStress) {
                statusStyle = 'sStatusHeatstress';
            } else if (d.severity === 'HIGH' || d.severity === 'MODERATE') {
                statusStyle = 'sStatusMild';
            } else {
                statusStyle = 'sStatusNormal';
            }
            
            // Determine severity style
            let sevStyle;
            if (d.severity === 'CRITICAL') {
                sevStyle = 'sSevCritical';
            } else if (d.severity === 'HIGH') {
                sevStyle = 'sSevHigh';
            } else if (d.severity === 'MODERATE') {
                sevStyle = 'sSevModerate';
            } else {
                sevStyle = 'sSevLow';
            }
            
            const rec = buildRecommendationFromDetection(d);
            const tempText = (d.bodyTemp != null) ? Number(d.bodyTemp).toFixed(1) : '';
            const recText = rec?.action || '';
            
            // Calculate appropriate row height for wrapped text
            const lineCount = Math.ceil(recText.length / 50) + 1;
            const rowHeight = Math.max(24, lineCount * 14);
            
            tableXml += '<Row ss:Height="' + rowHeight + '">';
            tableXml += '<Cell/>';
            tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="' + timestampStyle + '"><Data ss:Type="String">' + formatTimestamp(d.timestamp) + '</Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + statusStyle + '"><Data ss:Type="String">' + statusText + '</Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + centerStyle + '"><Data ss:Type="Number">' + tempText + '</Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + centerStyle + '"><Data ss:Type="Number">' + (d.count || 1) + '</Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + sevStyle + '"><Data ss:Type="String">' + esc(d.severity || 'LOW') + '</Data></Cell>';
            tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="' + recStyle + '"><Data ss:Type="String">' + esc(recText) + '</Data></Cell>';
            tableXml += '</Row>';
        });

        // Add empty rows for padding (up to 20 data rows if less)
        const totalDataRows = state.detections.length || 0;
        const rowsToPad = Math.max(0, 20 - totalDataRows);
        for (let i = 0; i < rowsToPad; i++) {
            const isRow1 = ((totalDataRows + i) % 2 === 0);
            const centerStyle = isRow1 ? 'sDataCenterRow1' : 'sDataCenterRow2';
            tableXml += '<Row ss:Height="24">';
            tableXml += '<Cell/>';
            tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="' + centerStyle + '"><Data ss:Type="String"></Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + centerStyle + '"><Data ss:Type="String"></Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + centerStyle + '"><Data ss:Type="String"></Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + centerStyle + '"><Data ss:Type="String"></Data></Cell>';
            tableXml += '<Cell ss:StyleID="' + centerStyle + '"><Data ss:Type="String"></Data></Cell>';
            tableXml += '<Cell ss:MergeAcross="1" ss:StyleID="' + centerStyle + '"><Data ss:Type="String"></Data></Cell>';
            tableXml += '</Row>';
        }

        tableXml += '</Table>';

        // Build final XML
        const xml = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' + styleXml + '<Worksheet ss:Name="HeatTrack Report">' + tableXml + '</Worksheet></Workbook>';

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'heattrack_report_' + now.toISOString().slice(0, 10) + '.xls';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Fullscreen camera expansion
    const normalCameraContainer = document.getElementById('normalCameraContainer');
    const thermalCameraContainer = document.getElementById('thermalCameraContainer');
    if (normalCameraContainer) {
        normalCameraContainer.addEventListener('click', () => {
            if (!state.cameraActive) return;
            toggleFullscreen(normalCameraContainer);
        });
        syncCameraZoomCursor(normalCameraContainer);
        initWheelZoom(normalCameraContainer);
    }
    if (thermalCameraContainer) {
        thermalCameraContainer.addEventListener('click', () => {
            if (!state.cameraActive) return;
            toggleFullscreen(thermalCameraContainer);
        });
        syncCameraZoomCursor(thermalCameraContainer);
        initWheelZoom(thermalCameraContainer);
    }
    document.addEventListener('fullscreenchange', () => {
        syncCameraZoomCursor(normalCameraContainer);
        syncCameraZoomCursor(thermalCameraContainer);
    });

    // System toggles
    document.getElementById('cameraToggle').addEventListener('change', (e) => {
        state.cameraActive = e.target.checked;
        if (!state.cameraActive) {
            state.aiActive = false;
            state.alertsEnabled = false;
        }
        updateSystemToggleStates();
        drawAnnotations();
    });

    document.getElementById('aiToggle').addEventListener('change', (e) => {
        state.aiActive = e.target.checked;
        if (!state.aiActive) {
            state.alertsEnabled = false;
        }
        updateSystemToggleStates();
        drawAnnotations();
    });

    document.getElementById('alertToggle').addEventListener('change', (e) => {
        state.alertsEnabled = e.target.checked;
        if (!state.alertsEnabled) {
            document.getElementById('alertToast')?.classList.remove('is-visible');
        }
    });

    updateSystemToggleStates();

    // Navigation links: ensure clicking a nav control always activates the view
    document.querySelectorAll('[data-nav]').forEach((navEl) => {
        navEl.addEventListener('click', (e) => {
            // Prevent default so we can control behavior consistently
            e.preventDefault();
            const target = navEl.getAttribute('data-nav');
            if (!target) return;

            // Show the view and scroll to top even if already on the same route
            showView(target);

            // Update the URL hash if it's different; avoid redundant hashchange
            const desiredHash = `#${target}`;
            if ((location.hash || '').toLowerCase() !== desiredHash.toLowerCase()) {
                location.hash = desiredHash;
            } else {
                // Force a smooth scroll to top for same-page clicks
                try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (_) {
                    window.scrollTo(0, 0);
                }
            }
        });
    });
}

// Determine whether a container has a visible media source (img or video)
function mediaPresentInContainer(container) {
    if (!container) return false;
    const video = container.querySelector('video');
    const img = container.querySelector('img');
    if (video) {
        // Consider video present if it has a srcObject, a currentSrc, or has loaded metadata
        if (video.srcObject) return true;
        if (video.currentSrc && video.currentSrc.trim() !== '') return true;
        if (video.readyState && video.readyState > 0) return true;
    }
    if (img) {
        // Consider image present if it has a non-empty src attribute
        if (img.src && img.src.trim() !== '') return true;
    }
    return false;
}

function getMonitorsHaveMedia() {
    const normalContainer = document.getElementById('normalCameraContainer');
    const thermalContainer = document.getElementById('thermalCameraContainer');
    const normalHas = mediaPresentInContainer(normalContainer);
    const thermalHas = mediaPresentInContainer(thermalContainer);
    return { normalHas, thermalHas, any: normalHas || thermalHas };
}

function updateMonitorPresenceUI() {
    const normalContainer = document.getElementById('normalCameraContainer');
    const thermalContainer = document.getElementById('thermalCameraContainer');
    const { normalHas, thermalHas, any } = getMonitorsHaveMedia();
    // Respect the user Camera Streams toggle — if streams are turned off, do not
    // show the "No Camera Connected" message. Instead show "Camera Streams Disabled".
    const cameraToggle = document.getElementById('cameraToggle');
    const streamsEnabled = cameraToggle ? cameraToggle.checked : true;

    [[normalContainer, normalHas], [thermalContainer, thermalHas]].forEach(([container, has]) => {
        if (!container) return;
        const notice = container.querySelector('.ht-camera__no-camera');
        if (notice) notice.remove();
        container.classList.remove('ht-camera--no-input');

        const hardwareAbsent = cameraToggle ? cameraToggle.disabled && !cameraToggle.checked : false;
        const shouldShowOffline = !streamsEnabled || !has;
        const offlineText = !streamsEnabled
            ? (hardwareAbsent ? 'No camera connected' : 'Camera streams disabled')
            : 'No camera connected';

        container.classList.toggle('camera-feed--offline', shouldShowOffline);
        if (shouldShowOffline) {
            container.dataset.offlineText = offlineText;
            stopMediaInContainer(container);
        } else {
            container.removeAttribute('data-offline-text');
        }
    });

    document.querySelectorAll('.ht-live-badge').forEach((badge, index) => {
        const monitorHasMedia = index === 0 ? normalHas : thermalHas;
        badge.classList.toggle('ht-live-badge--disabled', !(monitorHasMedia && streamsEnabled));
    });
}

function stopMediaInContainer(container) {
    if (!container) return;
    // Stop video elements
    const videos = container.querySelectorAll('video');
    videos.forEach((v) => {
        try {
            v.pause();
            if (v.srcObject && v.srcObject.getTracks) {
                v.srcObject.getTracks().forEach(t => t.stop());
            }
            v.srcObject = null;
            v.removeAttribute('src');
            v.load?.();
        } catch (e) {
            // ignore
        }
    });
    // Clear images
    const imgs = container.querySelectorAll('img');
    imgs.forEach((img) => {
        try {
            img.removeAttribute('src');
        } catch (e) {}
    });
}

function observeMonitorMediaChanges() {
    const normalContainer = document.getElementById('normalCameraContainer');
    const thermalContainer = document.getElementById('thermalCameraContainer');
    const obsConfig = { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcObject'] };
    const debounced = (() => {
        let t = null;
        return () => {
            clearTimeout(t);
            t = setTimeout(() => updateMonitorPresenceUI(), 150);
        };
    })();

    const observer = new MutationObserver(() => debounced());
    if (normalContainer) observer.observe(normalContainer, obsConfig);
    if (thermalContainer) observer.observe(thermalContainer, obsConfig);

    // Also run once to initialize
    updateMonitorPresenceUI();
}
