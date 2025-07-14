function showa(faqElement) {
  const answerr = faqElement.querySelector(".a");
  const isAlreadyShown = answerr.classList.contains("show");

  // Hide all answers
  document.querySelectorAll(".a").forEach((answer) => {
    answer.classList.remove("show");
  });

  // If it was not already shown, then show it
  if (!isAlreadyShown) {
    answerr.classList.add("show");
  }
}

// Function to convert 24-hour time to 12-hour time with AM/PM
function convertToAmPm(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  const amPm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12; // Convert 0 or 24 to 12
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${amPm}`;
}

// Function to calculate time difference in HH:MM:SS
function calculateTimeDifference(currentTime, targetTime) {
  const current = new Date();
  const [targetHours, targetMinutes] = targetTime.split(":").map(Number);

  // Set target time on today's date
  const target = new Date(current);
  target.setHours(targetHours, targetMinutes, 0, 0);

  // If target time has already passed today, use tomorrow's date
  if (target < current) {
    target.setDate(target.getDate() + 1);
  }

  // Calculate the difference in milliseconds
  const diff = target - current;

  // Convert milliseconds to hours, minutes, and seconds
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

// Function to display the countdown with the prayer name
// Function to highlight the next prayer element
function highlightNextPrayer(nextPrayerName) {
  // Remove "next-prayer" class from all prayer elements
  document
    .querySelectorAll(".prayer-time")
    .forEach((el) => el.classList.remove("next-prayer"));

  // Add "next-prayer" class to the next prayer element
  const nextPrayerElement = document.querySelector(
    `[data-prayer="${nextPrayerName}"]`
  );
  if (nextPrayerElement) {
    nextPrayerElement.classList.add("next-prayer");
  }
}

const countdownElement = document.getElementById("countdown");
// Update the countdown function to include highlighting
function updateCountdown(nextPrayerName, nextPrayerTime) {
  const { hours, minutes, seconds } = calculateTimeDifference(
    new Date(),
    nextPrayerTime
  );

  countdownElement.innerHTML = ` تبقى على صلاة <span class="pray-name-time">${nextPrayerName}</span>: <span class="hours">${hours}</span> ساعة <span class="mins">${minutes}</span> دقيقة <span class="secs">${seconds}</span> ثانية`;

  // Highlight the next prayer
  highlightNextPrayer(nextPrayerName);
}
// Get today's date in DD-MM-YYYY format
const today = new Date();
const day = String(today.getDate()).padStart(2, "0");
const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-based
const year = today.getFullYear();
const formattedDate = `${day}-${month}-${year}`;

// Fetch prayer timings and set up everything
fetch(
  `https://api.aladhan.com/v1/timingsByAddress/${formattedDate}?address=cairo-egypt,UAE&method=5`
)
  .then((response) => {
    if (!response.ok) {
      countdownElement.innerHTML = ` تحقق من إتصلاك بالإنترنت أو حاول مرة أخرى لاحقًا`;
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    console.log(data); // Debugging: check the response data
    const times = data.data.timings;

    // Update the DOM elements with the converted times
    document.getElementById("alfajr").innerHTML = convertToAmPm(times["Fajr"]);
    document.getElementById("alduhr").innerHTML = convertToAmPm(times["Dhuhr"]);
    document.getElementById("alasr").innerHTML = convertToAmPm(times["Asr"]);
    document.getElementById("almaghreb").innerHTML = convertToAmPm(
      times["Maghrib"]
    );
    document.getElementById("alisha").innerHTML = convertToAmPm(times["Isha"]);

    // Map prayer times with their names
    const prayerTimes = [
      { name: "الفجر", time: times["Fajr"] },
      { name: "الظهر", time: times["Dhuhr"] },
      { name: "العصر", time: times["Asr"] },
      { name: "المغرب", time: times["Maghrib"] },
      { name: "العشاء", time: times["Isha"] },
    ];

    // Update the countdown every second
    setInterval(() => {
      const currentTime = new Date();
      let nextPrayer = null;

      // Find the next prayer
      for (let prayer of prayerTimes) {
        const [hours, minutes] = prayer.time.split(":").map(Number);
        const prayerDate = new Date(currentTime);
        prayerDate.setHours(hours, minutes, 0, 0);

        if (prayerDate > currentTime) {
          nextPrayer = prayer;
          break;
        }
      }

      // If no prayer is left today, the next prayer is tomorrow's Fajr
      if (!nextPrayer) {
        nextPrayer = prayerTimes[0]; // Fajr for the next day
      }

      updateCountdown(nextPrayer.name, nextPrayer.time);
    }, 1000);
  })
  .catch((error) => {
    console.log("error")
     countdownElement.innerHTML = ` تحقق من إتصلاك بالإنترنت أو حاول مرة أخرى لاحقًا`;
  });
  
