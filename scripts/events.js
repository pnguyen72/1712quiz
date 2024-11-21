licenseText.addEventListener(
  "animationend",
  () => (licenseText.style.animation = "")
);

moduleSelection.addEventListener(
  "animationend",
  () => (moduleSelection.style.animation = "")
);

questionBankSelection.addEventListener(
  "animationend",
  () => (questionBankSelection.style.animation = "")
);

form.addEventListener("click", () => {
  if (licenseNotice.style.display) {
    licenseText.style.animation = "blink 1s";
  }
});

examSelection.addEventListener("input", generateModuleSelection);
moduleSelection.addEventListener("input", () => {
  const modules = getSelectedModules();
  if (modules.length > 0) {
    localStorage.setItem("modules", modules.join(" "));
  }

  for (const bank of ["LH", "AI"]) {
    const choice = document.getElementById(bank);
    const size = sum(modules.map((module) => modulesData[bank][module].size));
    choice.disabled = size == 0;
    choice.checked = size > 0 && localStorage.getItem("banks")?.includes(bank);
  }
  updateCoverage();
});
questionBankSelection.addEventListener("input", () => {
  const banks = getSelectedBanks();
  if (banks.length > 0) {
    localStorage.setItem("banks", banks.join(" "));
  }
  updateCoverage();
});
questionsCountChoice.addEventListener("input", () => {
  localStorage.setItem("questions", questionsCountChoice.value);
});
explainChoice.addEventListener("input", () => {
  localStorage.setItem("explain", explainChoice.checked);
});

licenceAgreeBtn.addEventListener("click", licenseUnlock);
licenseDisagreeBtn.addEventListener("click", () => {
  if (++disagreeNum < 4) {
    alert("You can't disagree, dummy!");
  } else {
    licenseGrantException();
  }
});

homeButon.addEventListener("click", tohomePage);
nextButton.addEventListener("click", () => {
  if (document.querySelector("#quiz-page[visible] #quiz[submitted=false]")) {
    submit();
  } else nextQuiz();
});

prevQuest.addEventListener("click", () =>
  search(
    quizPage.querySelectorAll(".wrong-answer,.unsure"),
    0,
    (element) => element.getBoundingClientRect().top - 1.5 * navbar.offsetHeight
  )
    .prev()
    .scrollTo()
    .blink()
);
nextQuest.addEventListener("click", () =>
  search(
    quizPage.querySelectorAll(".wrong-answer,.unsure"),
    0,
    (element) => element.getBoundingClientRect().top - 1.6 * navbar.offsetHeight
  )
    .next()
    .scrollTo()
    .blink()
);

window.addEventListener("beforeprint", () => {
  const quiz = document.querySelector(
    "#quiz-page[visible] #quiz[submitted=true][explain=true]"
  );
  if (!quiz) return;
  // Normally, to save firebase reads,
  // only questions that were answered incorrectly or marked unsure are explained.
  // This forces explaining all questions.
  for (question of quiz.getElementsByClassName("question")) {
    explain(question);
    // No need to hide the explanation after printing; it's already hidden by css.
  }
});
