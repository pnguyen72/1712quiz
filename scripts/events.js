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
