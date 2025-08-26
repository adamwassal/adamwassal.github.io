const notifToggle = document.getElementById("notifToggle");
const modeToggle = document.getElementById("modeToggle");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toastMsg");

// تحميل الإعدادات من localStorage عند فتح الصفحة
window.addEventListener("DOMContentLoaded", () => {
  const notifSaved = localStorage.getItem("notificationsEnabled");
  notifToggle.checked = notifSaved === "true";

  const modeSaved = localStorage.getItem("dayModeEnabled");
  modeToggle.checked = modeSaved === "true";

  // تطبيق الوضع الليلي/النهاري بناءً على الإعداد المحفوظ
  applyMode(modeToggle.checked);
});

// دالة لتطبيق الوضع (نهاري أو ليلي)
function applyMode(isDay) {
  const root = document.documentElement;

  if (isDay) {
    // ألوان الوضع النهاري (فاتح)
    root.style.setProperty("--content-bg-color", "#f5f7fa"); // خلفية المحتوى
    root.style.setProperty("--header-bg-color", "#ecf0f1");
    root.style.setProperty("--page-bg-color", "#ffffff"); // خلفية الصفحة
    root.style.setProperty("--text-color", "#666"); // نص غامق
    root.style.setProperty("--secondary-text-color", "#555555");
    root.style.setProperty("--highlight-color", "#e67e22"); // برتقالي
    root.style.setProperty("--light-bg-color", "#eeeeee");
    root.style.setProperty("--hover-color", "#d35400");
    root.style.setProperty("--alt-bg-color", "#dddddd");

    document.body.style.backgroundColor =
      getComputedStyle(root).getPropertyValue("--page-bg-color");
    document.body.style.color =
      getComputedStyle(root).getPropertyValue("--text-color");
  } else {
    // ألوان الوضع الليلي (غامق) - إعادة إلى القيم الافتراضية في :root
    root.style.setProperty("--content-bg-color", "#1976d2");
    root.style.setProperty("--header-bg-color", "#0d1b4c");
    root.style.setProperty("--page-bg-color", "#1e2a78");
    root.style.setProperty("--text-color", "#ffffff");
    root.style.setProperty("--secondary-text-color", "#222222");
    root.style.setProperty("--highlight-color", "#ffd700");
    root.style.setProperty("--light-bg-color", "#fdf6e3");
    root.style.setProperty("--hover-color", "#e69b00");
    root.style.setProperty("--alt-bg-color", "#eef5ff");

    //     :root {
    //   --content-bg-color: #1976d2;
    //   --header-bg-color: #0d1b4c;
    //   --page-bg-color: #1e2a78;
    //   --text-color: #ffffff;
    //   --secondary-text-color: #222222;
    //   --highlight-color: #ffd700;
    //   --light-bg-color: #fdf6e3;
    //   --hover-color: #e69b00;
    //   --alt-bg-color: #eef5ff;
    // }

    document.body.style.backgroundColor =
      getComputedStyle(root).getPropertyValue("--page-bg-color");
    document.body.style.color =
      getComputedStyle(root).getPropertyValue("--text-color");
  }
}

saveBtn.addEventListener("click", () => {
  const notifEnabled = notifToggle.checked;
  const dayModeEnabled = modeToggle.checked;

  // حفظ حالة التفعيل في localStorage
  localStorage.setItem("notificationsEnabled", notifEnabled);
  localStorage.setItem("dayModeEnabled", dayModeEnabled);

  // تطبيق الوضع مباشرة بعد الحفظ
  applyMode(dayModeEnabled);

  if (notifEnabled) {
    // طلب إذن الإشعارات من المتصفح
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          notifToggle.checked = false;
          localStorage.setItem("notificationsEnabled", false);
          alert("يرجى السماح بالإشعارات من المتصفح لتفعيل الخاصية.");
        }
      });
    }
  }

  // اظهار رسالة تأكيد مؤقتة
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
});
