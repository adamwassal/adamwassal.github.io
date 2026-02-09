document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const hijriDate = `${day}-${month}-${year}`;

  // نجلب التاريخ الهجري
  fetch(`https://api.aladhan.com/v1/gToH/${hijriDate}`)
    .then((response) => response.json())
    .then((data) => {
      const hijri = data.data.hijri;
      const display = ` ${hijri.weekday.ar} ${hijri.day} ${hijri.month.ar} ${hijri.year}`;
      const hijiryDiv = document.getElementById("hijiry");
      if (hijiryDiv) hijiryDiv.innerHTML = display;

      // نخزن اسم اليوم علشان نعرف لو جمعة
      window.isFriday = hijri.weekday.ar === "الجمعة";
    })
    .catch((error) => {
      console.error("Fetch Error:", error);
    });
});

function convertToAmPm(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  const amPm = hours >= 12 ? "مساءً" : "صباحًا";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${amPm}`;
}

function calculateTimeDifference(targetTime) {
  const current = new Date();
  const [targetHours, targetMinutes] = targetTime.split(":").map(Number);
  let target = new Date(current);
  target.setHours(targetHours, targetMinutes, 0, 0);
  if (target < current) target.setDate(target.getDate() + 1);

  const diff = target - current;
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function highlightNextPrayer(nextPrayerName) {
  document
    .querySelectorAll(".pray")
    .forEach((el) => el.classList.remove("next-prayer"));
  const nextPrayerElement = document.querySelector(
    `[data-prayer="${nextPrayerName}"]`,
  );
  if (nextPrayerElement) nextPrayerElement.classList.add("next-prayer");
}

function maybeShowBrowserNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

let azanAudio = null;
function playAzan(prayerName) {
  const mode = localStorage.getItem("azanMode") || "short";
  if (mode === "off") return;

  const src =
    mode === "full"
      ? "../assets/audio/azan-full.mp3"
      : "../assets/audio/azan-short.mp3";

  if (azanAudio) {
    azanAudio.pause();
    azanAudio.currentTime = 0;
  }
  azanAudio = new Audio(src);
  azanAudio.play().catch(() => {
    // Autoplay might be blocked; rely on toast/browser notification only.
  });
}

const countdownElement = document.getElementById("countdown");
let timerInterval;
let notifiedPrayers = new Set(); // لتفادي تكرار التنبيه

function updateCountdown(nextPrayerName, nextPrayerTime, image) {
  const { hours, minutes, seconds } = calculateTimeDifference(nextPrayerTime);
  countdownElement.style.background = `url(${image})`;
  countdownElement.style.backgroundRepeat = "no-repeat";
  countdownElement.style.backgroundSize = "cover";
  countdownElement.innerHTML = ` تبقى على <span class="pray-name-time">${nextPrayerName}</span><br> <span class="hours">${hours >= 10 ? hours : "0" + hours}</span>:<span class="mins">${minutes >= 10 ? minutes : "0" + minutes}</span>:<span class="secs">${seconds >= 10 ? seconds : "0" + seconds}</span>`;
  highlightNextPrayer(nextPrayerName);
}

function showLoading() {
  const loadingHTML = `
    <div class="loading">
      <span></span><span></span><span></span>
    </div>`;
  document.querySelectorAll(".time").forEach((el) => {
    el.innerHTML = loadingHTML;
  });
}

function fetchPrayerTimesByCoords(lat, lon) {
  if (!countdownElement || document.querySelectorAll(".time").length === 0) {
    return;
  }
  showLoading();

  fetch(
    `https://api.aladhan.com/v1/timings/${Math.floor(
      Date.now() / 1000,
    )}?latitude=${lat}&longitude=${lon}&method=5`,
  )
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      const times = data.data.timings;

      const alfajr = document.getElementById("alfajr");
      const alduhr = document.getElementById("alduhr");
      const alasr = document.getElementById("alasr");
      const almaghreb = document.getElementById("almaghreb");
      const alisha = document.getElementById("alisha");
      if (alfajr) alfajr.innerHTML = convertToAmPm(times.Fajr);
      if (alduhr) alduhr.innerHTML = convertToAmPm(times.Dhuhr);
      if (alasr) alasr.innerHTML = convertToAmPm(times.Asr);
      if (almaghreb) almaghreb.innerHTML = convertToAmPm(times.Maghrib);
      if (alisha) alisha.innerHTML = convertToAmPm(times.Isha);

      const prayerTimes = [
        {
          name: "الفجر",
          key: "Fajr",
          time: times.Fajr,
          image: "../assets/images/fajr.png",
        },
        {
          name: "الظهر",
          key: "Dhuhr",
          time: times.Dhuhr,
          image: "../assets/images/duhr.png",
        },
        {
          name: "العصر",
          key: "Asr",
          time: times.Asr,
          image: "../assets/images/asr.png",
        },
        {
          name: "المغرب",
          key: "Maghrib",
          time: times.Maghrib,
          image: "../assets/images/maghrib.png",
        },
        {
          name: "العشاء",
          key: "Isha",
          time: times.Isha,
          image: ".../assets/images/isha.png",
        },
      ];

      notifiedPrayers.clear();
      if (timerInterval) clearInterval(timerInterval);

      timerInterval = setInterval(() => {
        const currentTime = new Date();
        let nextPrayer = null;

        for (let prayer of prayerTimes) {
          const [hours, minutes] = prayer.time.split(":").map(Number);
          const prayerDate = new Date(currentTime);
          prayerDate.setHours(hours, minutes, 0, 0);

          // تنبيه وقت الصلاة
          if (
            currentTime.getHours() === hours &&
            currentTime.getMinutes() === minutes &&
            !notifiedPrayers.has(prayer.key)
          ) {
            toastNotification(`حان الآن موعد صلاة ${prayer.name}`, "pray");
            maybeShowBrowserNotification(
              "حان الآن موعد الصلاة",
              `حان وقت صلاة ${prayer.name}`,
            );
            playAzan(prayer.name);
            notifiedPrayers.add(prayer.key);
          }

          if (prayerDate > currentTime) {
            nextPrayer = prayer;
            break;
          }
        }

        if (!nextPrayer) nextPrayer = prayerTimes[0];
        updateCountdown(nextPrayer.name, nextPrayer.time, nextPrayer.image);

        // تنبيه سورة الكهف لو جمعة وقبل المغرب
        if (window.isFriday) {
          const [mh, mm] = times.Maghrib.split(":").map(Number);
          const maghribDate = new Date(currentTime);
          maghribDate.setHours(mh, mm, 0, 0);

          if (currentTime < maghribDate && !window.kahfNotified) {
            toastNotification(
              `لا تنسى قراءة سورة الكهف اليوم`,
              "alkahf",
              "pages/surah.html?number=18",
              "سورة الكهف",
            );
            window.kahfNotified = true;
          }
        }
      }, 1000);
    })
    .catch(() => {
      countdownElement.innerHTML = ` تحقق من إتصالك بالإنترنت أو حاول مرة أخرى لاحقًا`;
    });
}

function detectLocationAndFetch() {
  if (!countdownElement || document.querySelectorAll(".time").length === 0) {
    return;
  }
  if (navigator.geolocation) {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchPrayerTimesByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (error) => {
        console.error("Location error:", error);
        // fallback للقاهرة
        fetchPrayerTimesByCoords(30.0444, 31.2357);
      },
    );
  } else {
    // fallback للقاهرة
    fetchPrayerTimesByCoords(30.0444, 31.2357);
  }
}

// تشغيل في أي صفحة
detectLocationAndFetch();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const animation = el.dataset.animate;

        el.classList.add("animate__animated", animation);
        el.style.opacity = 1;

        observer.unobserve(el); // يشغّل الأنيميشن مرة واحدة فقط
      }
    });
  },
  {
    threshold: 0.2,
  },
);

document.querySelectorAll(".animate-on-scroll").forEach((el) => {
  observer.observe(el);
});
