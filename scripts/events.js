midtermChoice.addEventListener("click", () => {
  oldTestament.style.display = "";
  newTestament.style.display = "none";
});

finalChoice.addEventListener("click", () => {
  oldTestament.style.display = "none";
  newTestament.style.display = "";
});

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
    quizPage.querySelectorAll(".wrongAnswer,.unsure"),
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
    quizPage.querySelectorAll(".wrongAnswer,.unsure"),
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

window.addEventListener("beforeprint", () => {
  const quiz = document.getElementById("quiz");
  if (!quiz && !quiz.classList.contains("submitted")) {
    return;
  }
  // Force explaining all questions
  for (question of quiz.getElementsByClassName("question")) {
    question.explain();
    // They show up aftering printing, because css also requires that
    // the question was answered incorrectly, or is marked unsure.
    // We only do this when printing to save firebase reads.
  }
});
