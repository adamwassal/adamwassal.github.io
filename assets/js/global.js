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
  const amPm = hours >= 12 ? "PM" : "AM";
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
    `[data-prayer="${nextPrayerName}"]`
  );
  if (nextPrayerElement) nextPrayerElement.classList.add("next-prayer");
}

const countdownElement = document.getElementById("countdown");
let timerInterval;
let notifiedPrayers = new Set(); // لتفادي تكرار التنبيه

function updateCountdown(nextPrayerName, nextPrayerTime) {
  const { hours, minutes, seconds } = calculateTimeDifference(nextPrayerTime);
  countdownElement.innerHTML = ` تبقى على <span class="pray-name-time">${nextPrayerName}</span>: <span class="hours">${hours}</span> ساعة <span class="mins">${minutes}</span> دقيقة <span class="secs">${seconds}</span> ثانية`;
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
  showLoading();

  fetch(
    `https://api.aladhan.com/v1/timings/${Math.floor(
      Date.now() / 1000
    )}?latitude=${lat}&longitude=${lon}&method=5`
  )
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      const times = data.data.timings;

      document.getElementById("alfajr").innerHTML = convertToAmPm(times.Fajr);
      document.getElementById("alduhr").innerHTML = convertToAmPm(times.Dhuhr);
      document.getElementById("alasr").innerHTML = convertToAmPm(times.Asr);
      document.getElementById("almaghreb").innerHTML = convertToAmPm(
        times.Maghrib
      );
      document.getElementById("alisha").innerHTML = convertToAmPm(times.Isha);

      const prayerTimes = [
        { name: "الفجر", key: "Fajr", time: times.Fajr },
        { name: "الظهر", key: "Dhuhr", time: times.Dhuhr },
        { name: "العصر", key: "Asr", time: times.Asr },
        { name: "المغرب", key: "Maghrib", time: times.Maghrib },
        { name: "العشاء", key: "Isha", time: times.Isha },
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
            notifiedPrayers.add(prayer.key);
          }

          if (prayerDate > currentTime) {
            nextPrayer = prayer;
            break;
          }
        }

        if (!nextPrayer) nextPrayer = prayerTimes[0];
        updateCountdown(nextPrayer.name, nextPrayer.time);

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
              "سورة الكهف"
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
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchPrayerTimesByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (error) => {
        console.error("Location error:", error);
        // fallback للقاهرة
        fetchPrayerTimesByCoords(30.0444, 31.2357);
      }
    );
  } else {
    // fallback للقاهرة
    fetchPrayerTimesByCoords(30.0444, 31.2357);
  }
}

// تشغيل في أي صفحة
detectLocationAndFetch();
