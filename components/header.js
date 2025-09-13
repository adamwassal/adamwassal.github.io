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

