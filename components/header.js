function setupAIButton() {
  const fab = document.getElementById("ai-fab");
  const aiBox = document.getElementById("ai-box");

  if (!fab || !aiBox) return;

  fab.addEventListener("click", () => {
    aiBox.classList.toggle("hidden");
  });
}

const appPages = [
  { key: "home", title: "الرئيسية", icon: "fa-home", path: "index.html", shortcut: "Alt + 1" },
  { key: "quran", title: "المصحف", icon: "fa-quran", path: "pages/quran.html", shortcut: "Alt + 2" },
  { key: "athkar", title: "الأذكار", icon: "fa-pray", path: "pages/alathker.html", shortcut: "Alt + 3" },
  { key: "prayer", title: "مواقيت الصلاة", icon: "fa-clock", path: "pages/time_prays.html", shortcut: "Alt + 4" },
  { key: "radio", title: "الراديو", icon: "fa-radio", path: "pages/radio.html", shortcut: "Alt + 5" },
  { key: "ai", title: "المساعد الذكي", icon: "fa-robot", path: "pages/ai.html", shortcut: "Alt + 6" },
];

const FONT_SCALE_KEY = "uiFontScale";
const REDUCED_MOTION_KEY = "reducedMotion";
const PAGE_SCROLL_KEY = "pageScrollPositions";
const quickAccessState = {
  items: [],
  activeIndex: -1,
};
let deferredInstallPrompt = null;

function getRelativePrefix() {
  return window.location.pathname.includes("/pages/") ? ".." : ".";
}

function resolveAppPath(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getRelativePrefix()}/${path}`;
}

function isCurrentPage(path) {
  const normalizedPath = path.replace(/^\.\//, "").replace(/^\//, "");
  const pagePath = window.location.pathname.replace(/^\//, "");
  return pagePath.endsWith(normalizedPath);
}

function fetchHeaderTemplate() {
  const attempts = [
    "../components/header.html",
    "./components/header.html",
    "components/header.html",
  ];

  return attempts.reduce((promise, url) => {
    return promise.catch(() =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.text();
      }),
    );
  }, Promise.reject(new Error("init")));
}

function getFontScale() {
  const raw = Number(localStorage.getItem(FONT_SCALE_KEY) || 100);
  if (Number.isNaN(raw)) return 100;
  return Math.max(90, Math.min(120, raw));
}

function isReducedMotionEnabled() {
  return localStorage.getItem(REDUCED_MOTION_KEY) === "true";
}

function applyUserPreferences() {
  document.documentElement.style.fontSize = `${getFontScale()}%`;
  if (isReducedMotionEnabled()) {
    document.documentElement.setAttribute("data-reduced-motion", "true");
  } else {
    document.documentElement.removeAttribute("data-reduced-motion");
  }
}

applyUserPreferences();

function setupPWAEnhancements() {
  const existingManifest = document.querySelector('link[rel="manifest"]');
  if (!existingManifest) {
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = resolveAppPath("manifest.webmanifest");
    document.head.appendChild(manifestLink);
  }

  if (!document.querySelector('meta[name="theme-color"]')) {
    const metaTheme = document.createElement("meta");
    metaTheme.name = "theme-color";
    metaTheme.content = "#05244d";
    document.head.appendChild(metaTheme);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(resolveAppPath("service-worker.js")).catch(() => {});
    });
  }
}

setupPWAEnhancements();

function setupPageResume() {
  const pageKey = window.location.pathname;
  let positions = {};
  try {
    positions = JSON.parse(localStorage.getItem(PAGE_SCROLL_KEY) || "{}");
  } catch (error) {
    positions = {};
  }

  const saved = positions[pageKey];
  if (
    saved &&
    typeof saved.y === "number" &&
    saved.y > 120 &&
    Date.now() - saved.at < 1000 * 60 * 60 * 24 &&
    !window.location.hash
  ) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo({ top: saved.y, behavior: "auto" });
      }, 120);
    });
  }

  let saveTimeout = null;
  const savePosition = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      let latest = {};
      try {
        latest = JSON.parse(localStorage.getItem(PAGE_SCROLL_KEY) || "{}");
      } catch (error) {
        latest = {};
      }
      latest[pageKey] = { y: window.scrollY, at: Date.now() };
      localStorage.setItem(PAGE_SCROLL_KEY, JSON.stringify(latest));
    }, 150);
  };

  window.addEventListener("scroll", savePosition, { passive: true });
  window.addEventListener("beforeunload", savePosition);
}

setupPageResume();

function buildQuickCommands() {
  const fontScale = getFontScale();
  const reducedMotion = isReducedMotionEnabled();
  const themeLabel =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "تفعيل الوضع الفاتح"
      : "تفعيل الوضع الداكن";

  return [
    {
      type: "action",
      key: "toggle-theme",
      title: themeLabel,
      icon: "fa-circle-half-stroke",
      shortcut: "Shift + T",
      keywords: "وضع ثيم مظلم فاتح",
    },
    {
      type: "action",
      key: "toggle-motion",
      title: reducedMotion ? "تفعيل الحركة" : "تقليل الحركة",
      icon: "fa-person-walking",
      shortcut: "Shift + M",
      keywords: "حركة مؤثرات animation",
    },
    {
      type: "action",
      key: "font-scale",
      title: `حجم الواجهة (${fontScale}%)`,
      icon: "fa-text-height",
      shortcut: "Shift + F",
      keywords: "خط حجم تكبير تصغير",
    },
    {
      type: "action",
      key: "open-reciters",
      title: "إعدادات القارئ والأذان",
      icon: "fa-gear",
      shortcut: "",
      keywords: "قارئ اعدادات أذان",
    },
    {
      type: "action",
      key: "open-ai",
      title: "فتح المساعد الذكي",
      icon: "fa-robot",
      shortcut: "",
      keywords: "مساعد ذكاء اصطناعي",
    },
    {
      type: "action",
      key: "scroll-top",
      title: "الرجوع لأعلى الصفحة",
      icon: "fa-arrow-up",
      shortcut: "",
      keywords: "اعلى أعلى",
    },
    {
      type: "action",
      key: "clear-notifications",
      title: "مسح الإشعارات",
      icon: "fa-trash",
      shortcut: "",
      keywords: "تنبيهات",
    },
    {
      type: "action",
      key: "install-app",
      title: "تثبيت التطبيق",
      icon: "fa-download",
      shortcut: "Shift + I",
      keywords: "install pwa",
    },
    {
      type: "action",
      key: "reset-page-position",
      title: "الرجوع لبداية الصفحة",
      icon: "fa-angles-up",
      shortcut: "",
      keywords: "scroll reset",
    },
  ];
}

function normalizeArabic(value) {
  return String(value || "").toLowerCase().trim();
}

function renderQuickAccessList(items) {
  const list = document.getElementById("quick-access-list");
  if (!list) return;

  quickAccessState.items = items;
  quickAccessState.activeIndex = items.length > 0 ? 0 : -1;

  if (items.length === 0) {
    list.innerHTML = `<p class="quick-section-label">لا توجد نتائج مطابقة.</p>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item, index) => `
      <button type="button" class="quick-access-item ${item.type === "action" ? "command-item" : ""} ${index === 0 ? "active" : ""}" data-quick-index="${index}">
        <span class="quick-title"><i class="fa ${item.icon}"></i> ${item.title}</span>
        <span class="quick-key">${item.shortcut || (item.type === "action" ? "تنفيذ" : "انتقال")}</span>
      </button>
    `,
    )
    .join("");
}

function getRecentPages() {
  try {
    const recent = JSON.parse(localStorage.getItem("recentPages") || "[]");
    return Array.isArray(recent) ? recent : [];
  } catch (error) {
    return [];
  }
}

function renderQuickAccess() {
  const recent = getRecentPages();
  const input = document.getElementById("quick-access-input");
  if (!input) return;
  const pageItems = [...recent, ...appPages.filter((item) => !recent.some((r) => r.key === item.key))].map((item) => ({
    ...item,
    type: "page",
    keywords: `${item.title} ${item.key}`,
  }));

  const runFilter = () => {
    const query = normalizeArabic(input.value);
    const baseItems = [...pageItems, ...buildQuickCommands()];
    if (!query) {
      renderQuickAccessList(baseItems);
      return;
    }
    const filtered = baseItems.filter((item) =>
      normalizeArabic(`${item.title} ${item.keywords || ""}`).includes(query),
    );
    renderQuickAccessList(filtered);
  };

  input.value = "";
  input.oninput = runFilter;
  runFilter();
}

function recordCurrentPage() {
  const headerContainer = document.getElementById("header-container");
  const pageTitle = headerContainer?.dataset.pageTitle || document.title || "صفحة";
  const current = appPages.find((item) => isCurrentPage(item.path));
  if (!current) return;

  const item = { ...current, title: pageTitle };
  const recent = getRecentPages().filter((entry) => entry.key !== item.key);
  recent.unshift(item);
  localStorage.setItem("recentPages", JSON.stringify(recent.slice(0, 3)));
}

function closeNotificationsPanel() {
  const notificationsList = document.querySelector(".notifications");
  if (notificationsList) notificationsList.classList.add("hidden");
}

function toggleNotificationsPanel() {
  const notificationsList = document.querySelector(".notifications");
  if (!notificationsList) return;
  notificationsList.classList.toggle("hidden");
  if (!notificationsList.classList.contains("hidden") && typeof markAllNotificationsRead === "function") {
    markAllNotificationsRead();
  }
}

function setQuickAccessActive(index) {
  const list = document.getElementById("quick-access-list");
  if (!list) return;
  const items = Array.from(list.querySelectorAll(".quick-access-item"));
  if (items.length === 0) return;
  const clamped = Math.max(0, Math.min(index, items.length - 1));
  quickAccessState.activeIndex = clamped;
  items.forEach((item, idx) => item.classList.toggle("active", idx === clamped));
  items[clamped].scrollIntoView({ block: "nearest" });
}

function cycleFontScale() {
  const steps = [90, 100, 110, 120];
  const current = getFontScale();
  const index = steps.indexOf(current);
  const next = index === -1 ? 100 : steps[(index + 1) % steps.length];
  localStorage.setItem(FONT_SCALE_KEY, String(next));
  applyUserPreferences();
  return next;
}

function toggleReducedMotion() {
  const enabled = !isReducedMotionEnabled();
  localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
  applyUserPreferences();
  return enabled;
}

function runQuickAction(item, closeModal) {
  if (!item) return;
  if (item.type === "page" && item.path) {
    window.location.href = resolveAppPath(item.path);
    return;
  }
  if (item.type !== "action") return;

  if (item.key === "toggle-theme") {
    toggleTheme();
  }
  if (item.key === "toggle-motion") {
    const enabled = toggleReducedMotion();
    if (typeof toastNotification === "function") {
      toastNotification(
        enabled ? "تم تفعيل تقليل الحركة" : "تم تفعيل الحركة",
        "modern",
        "",
        "",
        { autoHide: true, autoHideDelay: 2300 },
      );
    }
  }
  if (item.key === "font-scale") {
    const size = cycleFontScale();
    if (typeof toastNotification === "function") {
      toastNotification(`تم ضبط حجم الواجهة إلى ${size}%`, "modern", "", "", {
        autoHide: true,
        autoHideDelay: 2300,
      });
    }
  }
  if (item.key === "open-reciters" && typeof openRecitersPopup === "function") {
    openRecitersPopup();
  }
  if (item.key === "open-ai") {
    const fab = document.getElementById("ai-fab");
    if (fab) fab.click();
  }
  if (item.key === "scroll-top") {
    window.scrollTo({ top: 0, behavior: isReducedMotionEnabled() ? "auto" : "smooth" });
  }
  if (item.key === "clear-notifications" && typeof clearNotifications === "function") {
    clearNotifications();
  }
  if (item.key === "install-app") {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.finally(() => {
        deferredInstallPrompt = null;
      });
    } else if (typeof toastNotification === "function") {
      toastNotification("خيار التثبيت غير متاح الآن على هذا المتصفح", "modern", "", "", {
        autoHide: true,
        autoHideDelay: 2600,
      });
    }
  }
  if (item.key === "reset-page-position") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const pageKey = window.location.pathname;
      const positions = JSON.parse(localStorage.getItem(PAGE_SCROLL_KEY) || "{}");
      if (positions[pageKey]) {
        delete positions[pageKey];
        localStorage.setItem(PAGE_SCROLL_KEY, JSON.stringify(positions));
      }
    } catch (error) {}
  }

  closeModal();
}

function setupQuickAccess() {
  const modal = document.getElementById("quick-access-modal");
  const openBtn = document.querySelector(".quick-access-toggle");
  const closeBtn = document.querySelector(".quick-access-close");
  const input = document.getElementById("quick-access-input");
  const list = document.getElementById("quick-access-list");

  if (!modal || !openBtn || !closeBtn || !input || !list) return;

  const openModal = () => {
    modal.classList.remove("hidden");
    renderQuickAccess();
    setTimeout(() => input.focus(), 20);
  };

  const closeModal = () => modal.classList.add("hidden");

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  list.addEventListener("click", (event) => {
    const itemEl = event.target.closest("[data-quick-index]");
    if (!itemEl) return;
    const index = Number(itemEl.dataset.quickIndex);
    const item = quickAccessState.items[index];
    runQuickAction(item, closeModal);
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openModal();
      return;
    }

    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      openModal();
      return;
    }

    if (event.key === "Escape") {
      closeModal();
      closeNotificationsPanel();
      return;
    }

    const isOpen = !modal.classList.contains("hidden");
    if (isOpen && event.key === "ArrowDown") {
      event.preventDefault();
      setQuickAccessActive(quickAccessState.activeIndex + 1);
      return;
    }

    if (isOpen && event.key === "ArrowUp") {
      event.preventDefault();
      setQuickAccessActive(quickAccessState.activeIndex - 1);
      return;
    }

    if (isOpen && event.key === "Enter") {
      const item = quickAccessState.items[quickAccessState.activeIndex];
      if (item) {
        event.preventDefault();
        runQuickAction(item, closeModal);
      }
      return;
    }

    if (event.shiftKey && event.key.toLowerCase() === "t" && !isTyping) {
      event.preventDefault();
      toggleTheme();
      return;
    }

    if (event.shiftKey && event.key.toLowerCase() === "m" && !isTyping) {
      event.preventDefault();
      toggleReducedMotion();
      return;
    }

    if (event.shiftKey && event.key.toLowerCase() === "f" && !isTyping) {
      event.preventDefault();
      cycleFontScale();
      return;
    }

    if (event.shiftKey && event.key.toLowerCase() === "i" && !isTyping) {
      event.preventDefault();
      runQuickAction({ type: "action", key: "install-app" }, () => {});
      return;
    }

    if (event.altKey && /^[1-7]$/.test(event.key) && !isTyping) {
      const page = appPages[Number(event.key) - 1];
      if (page) window.location.href = resolveAppPath(page.path);
    }
  });
}

function setupConnectivityStatus() {
  const statusEl = document.getElementById("network-status");
  if (!statusEl) return;

  const update = (isOnline) => {
    statusEl.classList.toggle("online", isOnline);
    statusEl.classList.toggle("offline", !isOnline);
    statusEl.title = isOnline ? "متصل بالإنترنت" : "غير متصل بالإنترنت";
  };

  update(navigator.onLine);

  window.addEventListener("online", () => {
    update(true);
    if (typeof toastNotification === "function") {
      toastNotification("تم استعادة الاتصال بالإنترنت", "modern", "", "", {
        autoHide: true,
        autoHideDelay: 2300,
      });
    }
  });

  window.addEventListener("offline", () => {
    update(false);
    if (typeof toastNotification === "function") {
      toastNotification("لا يوجد اتصال بالإنترنت الآن", "modern", "", "", {
        autoHide: true,
        autoHideDelay: 2600,
      });
    }
  });
}

function setupHeaderRoutes() {
  const logo = document.querySelector("[data-asset-logo]");
  if (logo) logo.src = resolveAppPath("assets/images/logo.png");

  document.querySelectorAll("[data-nav], [data-footer-nav]").forEach((link) => {
    const key = link.dataset.nav;
    const footerKey = link.dataset.footerNav;
    const targetKey = key || footerKey;
    const target = appPages.find((item) => item.key === targetKey);
    if (!target) return;
    link.href = resolveAppPath(target.path);
    if (isCurrentPage(target.path)) link.classList.add("active");
  });

  const footerYear = document.getElementById("footer-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
}

function setupHeaderInteractions() {
  const notificationToggle = document.querySelector(".notification-toggle");
  if (notificationToggle) {
    notificationToggle.addEventListener("click", toggleNotificationsPanel);
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    const notifications = document.querySelector(".notifications");
    if (!notifications) return;

    if (
      !notifications.contains(target) &&
      !target.closest(".notification-toggle")
    ) {
      notifications.classList.add("hidden");
    }
  });
}

fetchHeaderTemplate()
  .then((data) => {
    const template = document.createElement("div");
    template.innerHTML = data;
    const content = template.querySelector("#header-template").content.cloneNode(true);
    const container = document.getElementById("header-container");
    if (!container) return;

    container.appendChild(content);
    setupHeaderRoutes();
    setupAIButton();
    setupHeaderInteractions();
    setupQuickAccess();
    setupConnectivityStatus();
    recordCurrentPage();
  })
  .catch((error) => {
    console.error("Header load failed:", error);
  });

window.addEventListener("scroll", async () => {
  const scrollUpBtn = document.querySelector(".topbtn");
  if (!scrollUpBtn) return;
  let scrollTop = window.scrollY;
  let docHeight = document.documentElement.scrollHeight - window.innerHeight;
  let scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (scrollTop > 0) {
    scrollUpBtn.classList.add("show");
    scrollUpBtn.classList.remove("hidden");
  } else {
    scrollUpBtn.classList.add("hidden");
    scrollUpBtn.classList.remove("show");
  }

  scrollUpBtn.style.setProperty("--scroll", scrollPercent + "%");
  scrollUpBtn.style.setProperty("--scroll-angle", scrollPercent * 3.6 + "deg");

  scrollUpBtn.style.setProperty(
    "background",
    "conic-gradient(var(--color-secondary) " +
      scrollPercent +
      "%, transparent 0)",
  );
});

function toggleTheme() {
  const html = document.documentElement;
  const button = document.querySelector(".togglemode");
  if (!button) return;

  if (html.getAttribute("data-theme") === "dark") {
    html.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    button.innerHTML = "<i class='fa fa-moon'></i>";
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    button.innerHTML = "<i class='fa fa-sun'></i>";
  }
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async function () {
  await delay(100);
  const savedTheme = localStorage.getItem("theme");
  const button = document.querySelector(".togglemode");
  if (!button) return;
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    button.innerHTML = "<i class='fa fa-sun'></i>";
  } else {
    button.innerHTML = "<i class='fa fa-moon'></i>";
  }
})();

function formatResponse(text) {
  // 1️⃣ Markdown links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">رابط</a>`;
  });

  // 2️⃣ روابط مباشرة (بس لو مش جوه HTML)
  text = text.replace(
    /(^|[\s>])((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s<]*)/g,
    (match, prefix, url) => {
      if (url.startsWith("<")) return match;

      let fixedUrl = url.startsWith("http") ? url : "https://" + url;
      return `${prefix}<a href="${fixedUrl}" target="_blank" rel="noopener noreferrer">رابط</a>`;
    },
  );

  // bold
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // italic
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // القوائم
  let firstListIndex = text.search(/^(\d+\.|- )/m);
  let intro = "";
  if (firstListIndex > 0) {
    intro = "<p>" + text.slice(0, firstListIndex).trim() + "</p>";
    text = text.slice(firstListIndex).trim();
  }

  text = text.replace(/^(\d+)\.\s+(.*)$/gm, "<li>$2</li>");
  if (text.includes("<li>") && !text.startsWith("<ol>")) {
    text = "<ol>" + text + "</ol>";
  }

  return intro + text;
}

async function askGemini() {
  const answerDiv = document.getElementById("answer");
  const question = document.getElementById("question").value.trim();
  const questionInput = document.getElementById("question");
  if (!question) {
    answerDiv.innerText = "من فضلك اكتب سؤالًا.";
    return;
  }

  answerDiv.innerText = "⏳ جاري التفكير...";

  try {
    const res = await fetch("https://riyadaljannah.adamwassal2.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      throw new Error("HTTP Error: " + res.status);
    }

    const data = await res.json();
    questionInput.value = "";

    // استخراج الرد من الـ Worker الجديد
    const rawText = data["reply"] || "❌ لم يتم الحصول على رد.";

    
    answerDiv.innerHTML = formatResponse(rawText);
    if(rawText == "تغيير الوضع") {
      toggleTheme()
    }
  } catch (err) {
    answerDiv.innerText = "❌ حدث خطأ في الاتصال";
    console.error(err);
  }
}


let ricitationers = [];

async function loadReciters() {
  const res = await fetch(
    "https://api.alquran.cloud/v1/edition/format/audio"
  );
  const data = await res.json();

  // نفلتر التلاوة آية آية
  ricitationers = data.data.filter(
    r => r.type === "versebyverse"
  );

  const select = document.getElementById("reciters-select");
  select.innerHTML = "";

  ricitationers.forEach(reciter => {
    const option = document.createElement("option");
    option.value = reciter.identifier;
    option.textContent = reciter.name;
    select.appendChild(option);
  });

  // لو في قارئ محفوظ
  const saved = localStorage.getItem("reciter");
  if (saved) select.value = saved;
}

function openRecitersPopup() {
  document.getElementById("reciters-popup").classList.remove("hidden");
  loadReciters();
  initAzanSettings();
}

function closeRecitersPopup() {
  document.getElementById("reciters-popup").classList.add("hidden");
}

function saveReciter() {
  const select = document.getElementById("reciters-select");
  localStorage.setItem("reciter", select.value);
  const azanMode = document.querySelector('input[name="azanMode"]:checked');
  if (azanMode) localStorage.setItem("azanMode", azanMode.value);
  closeRecitersPopup();
  window.location.reload()
}

function initAzanSettings() {
  const saved = localStorage.getItem("azanMode") || "short";
  const input = document.querySelector(`input[name="azanMode"][value="${saved}"]`);
  if (input) input.checked = true;
}
