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
    const newTitle = container.dataset.pageTitle; // 👈 put your new title here
    const pageTitleElement = content.querySelector(".page-title");
    if (pageTitleElement) {
      pageTitleElement.textContent = newTitle;
    }

    document.getElementById("header-container").appendChild(content);
  });

window.addEventListener("scroll", async () => {
  const scrollUpBtn = document.querySelector(".topbtn");
  let scrollTop = window.scrollY;
  let docHeight = document.documentElement.scrollHeight - window.innerHeight;
  let scrollPercent = (scrollTop / docHeight) * 100;

  console.log(scrollUpBtn);
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
      "%, transparent 0)"
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
(function () {
  const savedTheme = localStorage.getItem("theme");
  const button = document.querySelector(".togglemode");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    button.innerHTML = "<i class='fa fa-sun'></i>";
  } else {
    button.innerHTML = "<i class='fa fa-moon'></i>";
  }
})();
