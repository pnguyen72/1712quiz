if (!matchMedia("(hover: none)").matches) {
    document
        .querySelectorAll(".bx")
        .forEach((icon) => icon.classList.add("bx-tada-hover"));
}
loadStorage();
updateAttemptsTable();
loadModulesNames().then(initalizeSelections).then(licenseLock);
