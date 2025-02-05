if (!matchMedia("(hover: none)").matches) {
  document
    .querySelectorAll(".bx")
    .forEach((icon) => icon.classList.add("bx-tada-hover"));
}
tohomePage();
await loadModulesNames();
initalizeSelections();
licenseLock();
await loadQuestions();
updateCoverage();
updateOngoingLabels();
