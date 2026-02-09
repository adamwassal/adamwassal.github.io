// Load saved notifications from localStorage
let allNotification = JSON.parse(localStorage.getItem("notifications")) || [];

// Save to localStorage
function saveNotifications() {
  localStorage.setItem("notifications", JSON.stringify(allNotification));
}

function safeUpdateUI() {
  const badge = document.querySelector(".notification-badge");
  const list = document.querySelector(".notifications ul");

  if (!badge || !list) {
    // جرّب تاني بعد 100ms
    setTimeout(safeUpdateUI, 100);
    return;
  }

  updateBadge();
  renderNotificationsList();
}

// استخدمها بدل استدعاء التحديثات مباشرة
safeUpdateUI();

// Update the badge count
function updateBadge() {
  const badge = document.querySelector(".notification-badge");
  if (!badge) return;
  if (allNotification.length > 0) {
    badge.textContent = allNotification.length;
  }
  else {
    badge.textContent = 0
  }
}

// Show toast notification
function toastNotification(
  message,
  style = "modern",
  link = "",
  linkText = ""
) {
  // Custom styles for notify.js
  $.notify.addStyle("modern", {
    html: `<div><div class="msg" data-notify-text="message"></div></div>`,
  });
  $.notify.addStyle("alkahf", {
    html: `<div>
             <div class="msg" data-notify-text="message"></div>
             ${link ? `<a href="${link}" class="noti-link">${linkText}</a>` : ""}
           </div>`,
  });
  $.notify.addStyle("pray", {
    html: `<div><div class="msg" data-notify-text="message"></div></div>`,
  });


  // Show toast
  $.notify(
    { message },
    { style, globalPosition: "top right", autoHide: false }
  );

  // Remove oldest if more than 5
  if (allNotification.length >= 5) {
    allNotification.shift();
  }

  // Check for duplicates
  const exists = allNotification.some(
    (notif) =>
      notif.message === message &&
      notif.style === style &&
      notif.link === link &&
      notif.linkText === linkText
  );

  if (!exists) {
    allNotification.push({ message, style, link, linkText });
    saveNotifications();
  }

  // Update UI
  updateBadge();
  renderNotificationsList();
}

// Render the notifications list
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
    item.className = "notification-item";
    item.innerHTML = `
      <div class="notification-content">
        <h3>${notif.message}</h3>
        ${
          notif.link
            ? `<a href="${notif.link}" class="notification-link">${notif.linkText}</a>`
            : ""
        }
      </div>
    `;
    list.appendChild(item);
  });
}

// Clear all notifications
function clearNotifications() {
  allNotification = [];
  localStorage.setItem("notifications", "");

  saveNotifications();
  updateBadge();
  renderNotificationsList();
}

document.addEventListener("DOMContentLoaded", () => {
  safeUpdateUI();
});
