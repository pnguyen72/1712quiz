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

licenceAgreeBtn.addEventListener("click", () => {
  licenseNotice.style.display = "none";
  licenseUnlock();
});
licenseDisagreeBtn.addEventListener("click", () => {
  if (++disagreeNum < 4) {
    alert("You can't disagree, dummy!");
  } else {
    alert(
      "Alright, for you alone I'll make an exception,\n" +
        "you don't have to wear a Hawaiian shirt to the exam."
    );
    licenceAgreeBtn.click();
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
