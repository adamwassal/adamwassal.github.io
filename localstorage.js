const storage = localStorage;
var marks = document.querySelectorAll(".mark");

function mark(surah, ayah, element) {
  if (storage.getItem("surah") !== surah || storage.getItem("ayah") !== ayah) {
    console.log(marks);

    document
      .querySelectorAll(".mark")
      .forEach((mark) => mark.classList.remove("marked"));

    storage.setItem("surah", surah);
    storage.setItem("ayah", ayah);
    element.classList.add("marked");
    document.getElementById("gomark").href = `#${ayah}`;
  } else {
    storage.clear();
    element.classList.remove("marked");
    document.getElementById("gomark").style.visibility = "hidden";
  }
}

