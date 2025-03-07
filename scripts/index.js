if (!matchMedia("(hover: none)").matches) {
    document
        .querySelectorAll(".bx")
        .forEach((icon) => icon.classList.add("bx-tada-hover"));
}
tohomePage();
loadStorage();
await loadModulesNames();
initalizeSelections();
licenseLock();
