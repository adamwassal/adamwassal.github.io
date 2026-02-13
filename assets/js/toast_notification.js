const NOTIFICATIONS_KEY = "notifications";
const NOTIFICATIONS_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
let notificationStyleRegistered = false;

function parseStoredNotifications() {
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((notif) => {
        if (!notif || typeof notif !== "object") return null;
        return {
          id: notif.id || Date.now() + Math.floor(Math.random() * 1000),
          message: notif.message || "",
          style: notif.style || "modern",
          link: notif.link || "",
          linkText: notif.linkText || "عرض",
          createdAt: notif.createdAt || Date.now(),
          read: Boolean(notif.read),
        };
      })
      .filter(
        (notif) =>
          Boolean(notif) &&
          Date.now() - Number(notif.createdAt || Date.now()) <=
            NOTIFICATIONS_MAX_AGE_MS,
      );
  } catch (error) {
    console.warn("Failed to parse notifications", error);
    return [];
  }
}

let allNotification = parseStoredNotifications();
let nextNotificationId = allNotification.reduce(
  (max, notif) => Math.max(max, Number(notif.id) || 0),
  0,
) + 1;

function saveNotifications() {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotification));
}

function safeUpdateUI() {
  const badge = document.querySelector(".notification-badge");
  const list = document.querySelector(".notifications ul");

  if (!badge || !list) {
    setTimeout(safeUpdateUI, 100);
    return;
  }

  updateBadge();
  renderNotificationsList();
}

safeUpdateUI();

function updateBadge() {
  const badge = document.querySelector(".notification-badge");
  if (!badge) return;
  const unreadCount = allNotification.filter((notif) => !notif.read).length;
  badge.textContent = unreadCount > 0 ? unreadCount : 0;
  badge.style.display = unreadCount > 0 ? "inline-flex" : "none";
}

function registerNotifyStyles() {
  if (notificationStyleRegistered) return;
  notificationStyleRegistered = true;

  $.notify.addStyle("modern", {
    html: `<div><div class="msg" data-notify-text="message"></div></div>`,
  });
  $.notify.addStyle("alkahf", {
    html: `<div>
            <div class="msg" data-notify-text="message"></div>
            <div data-notify-html="link"></div>
          </div>`,
  });
  $.notify.addStyle("pray", {
    html: `<div><div class="msg" data-notify-text="message"></div></div>`,
  });
}

function buildToastLink(link, linkText) {
  if (!link) return "";
  return `<a href="${link}" class="noti-link">${linkText || "عرض"}</a>`;
}

function formatTimeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function toastNotification(
  message,
  style = "modern",
  link = "",
  linkText = "",
  options = {},
) {
  registerNotifyStyles();
  const shouldAutoHide = Boolean(options.autoHide);
  const autoHideDelay = Number(options.autoHideDelay) || 4500;
  $.notify(
    { message, link: buildToastLink(link, linkText) },
    { style, globalPosition: "top right", autoHide: shouldAutoHide, autoHideDelay },
  );

  const exists = allNotification.some(
    (notif) =>
      notif.message === message &&
      notif.style === style &&
      notif.link === link &&
      Date.now() - notif.createdAt < 30 * 1000,
  );

  if (!exists) {
    allNotification.unshift({
      id: nextNotificationId++,
      message,
      style,
      link,
      linkText: linkText || "عرض",
      createdAt: Date.now(),
      read: false,
    });
    if (allNotification.length > 30) {
      allNotification = allNotification.slice(0, 30);
    }
    saveNotifications();
  }

  updateBadge();
  renderNotificationsList();
}

function markNotificationRead(id) {
  const notif = allNotification.find((item) => Number(item.id) === Number(id));
  if (!notif || notif.read) return;
  notif.read = true;
  saveNotifications();
  updateBadge();
  renderNotificationsList();
}

function removeNotification(id) {
  allNotification = allNotification.filter((item) => Number(item.id) !== Number(id));
  saveNotifications();
  updateBadge();
  renderNotificationsList();
}

function markAllNotificationsRead() {
  let changed = false;
  allNotification.forEach((notif) => {
    if (!notif.read) {
      notif.read = true;
      changed = true;
    }
  });
  if (changed) {
    saveNotifications();
    updateBadge();
    renderNotificationsList();
  }
}

function renderNotificationsList() {
  const list = document.querySelector(".notifications ul");
  if (!list) return;

  if (allNotification.length === 0) {
    list.innerHTML = "<li class='no-notifications'>لا توجد إشعارات</li>";
    return;
  }

  list.innerHTML = "";
  allNotification.forEach((notif) => {
    const item = document.createElement("li");
    item.className = `notification-item ${notif.read ? "" : "unread"}`.trim();
    item.innerHTML = `
      <div class="notification-content">
        <h3>${notif.message}</h3>
        <span class="notification-meta"><i class="fa fa-clock"></i>${formatTimeAgo(notif.createdAt)}</span>
        <div class="notification-item-actions">
          ${
            notif.link
              ? `<a href="${notif.link}" class="notification-link" onclick="markNotificationRead(${notif.id})">${notif.linkText || "عرض"}</a>`
              : `<button type="button" class="notification-link" onclick="markNotificationRead(${notif.id})">تمت القراءة</button>`
          }
          <button class="notification-dismiss" title="إزالة" onclick="removeNotification(${notif.id})"><i class="fa fa-xmark"></i></button>
        </div>
      </div>
    `;
    list.appendChild(item);
  });
}

function clearNotifications() {
  allNotification = [];
  localStorage.removeItem(NOTIFICATIONS_KEY);
  updateBadge();
  renderNotificationsList();
}

window.toastNotification = toastNotification;
window.clearNotifications = clearNotifications;
window.markNotificationRead = markNotificationRead;
window.removeNotification = removeNotification;
window.markAllNotificationsRead = markAllNotificationsRead;

document.addEventListener("DOMContentLoaded", () => {
  safeUpdateUI();
});
