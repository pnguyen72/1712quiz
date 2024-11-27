// if hover is available
if (matchMedia("not all and (hover: none)").matches) {
  for (const icon of document.querySelectorAll("box-icon")) {
    icon.setAttribute("animation", "tada-hover");
  }
  for (const icon of document.querySelectorAll(".bx")) {
    icon.classList.add("bx-tada-hover");
  }
}
tohomePage();
loadData().then(initalizeSelections).then(licenseLock);
