function setupAIButton() {
  const fab = document.getElementById("ai-fab");
  const aiBox = document.getElementById("ai-box");

  if (!fab || !aiBox) return;

  fab.addEventListener("click", () => {
    aiBox.classList.toggle("hidden");
  });
}

fetch("../components/header.html")
  .then((res) => res.text())
  .then((data) => {
    const template = document.createElement("div");
    template.innerHTML = data;
    const content = template
      .querySelector("#header-template")
      .content.cloneNode(true);

    // Change the page title here
    const container = document.getElementById("header-container");
    const newTitle = container.dataset.pageTitle;
    const pageTitleElement = content.querySelector(".page-title");
    if (pageTitleElement) {
      pageTitleElement.textContent = newTitle;
    }

    document.getElementById("header-container").appendChild(content);
    setupAIButton();
  });

window.addEventListener("scroll", async () => {
  const scrollUpBtn = document.querySelector(".topbtn");
  let scrollTop = window.scrollY;
  let docHeight = document.documentElement.scrollHeight - window.innerHeight;
  let scrollPercent = (scrollTop / docHeight) * 100;

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
}

function closeRecitersPopup() {
  document.getElementById("reciters-popup").classList.add("hidden");
}

function saveReciter() {
  const select = document.getElementById("reciters-select");
  localStorage.setItem("reciter", select.value);
  closeRecitersPopup();
  window.location.reload()
}