moduleSelection.addEventListener(
  "animationend",
  () => (moduleSelection.style.animation = "")
);

questionBankSelection.addEventListener(
  "animationend",
  () => (questionBankSelection.style.animation = "")
);

form.addEventListener("input", () => {
  formChanged = true;
  newQuizNeeded = true;
});

moduleGroupSelection.addEventListener("input", generateModuleSelection);

licenceAgreeBtn.addEventListener("click", licenseUnlock);
licenseDisagreeBtn.addEventListener("click", () => {
  if (++disagreeNum < 4) {
    alert("You can't disagree, dummy!");
  } else {
    licenseGrantException();
  }
});

homeButon.addEventListener("click", returnHome);

nextButton.addEventListener("click", () => {
  if (quizPage.style.display == "none") {
    return nextQuiz();
  }
  const quiz = document.getElementById("quiz");
  if (quiz.className == "submitted") {
    return nextQuiz();
  }

  submit();
});

prevQuest.addEventListener("click", () =>
  search(
    highlightedQuestions,
    document.documentElement.scrollTop,
    (element) =>
      element.getBoundingClientRect().top -
      document.body.getBoundingClientRect().top
  )
    .prev()
    .scrollTo()
    .blink()
);
nextQuest.addEventListener("click", () =>
  search(
    highlightedQuestions,
    document.documentElement.scrollTop,
    (element) =>
      element.getBoundingClientRect().top -
      document.body.getBoundingClientRect().top -
      0.38 * navbar.offsetHeight
  )
    .next()
    .scrollTo()
    .blink()
);
