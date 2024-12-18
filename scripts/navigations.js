function hide(element) {
  element.style.display = "none";
  element.removeAttribute("visible");
}

function unhide(element) {
  element.style.display = "";
  element.setAttribute("visible", true);
}

function licenseLock() {
  if (
    sessionStorage.getItem("licenseAgreed") == "true" ||
    localStorage.getItem("licenseException") == "true"
  ) {
    return;
  }
  unhide(licenseNotice);
  for (input of form.querySelectorAll("input,select")) {
    input.disabled = true;
  }
  hide(navbar);
}

function licenseUnlock() {
  sessionStorage.setItem("licenseAgreed", true);
  hide(licenseNotice);
  for (input of form.querySelectorAll("input,select")) {
    input.disabled = false;
  }
  document.getElementById("main").style.display = "block";
  unhide(navbar);
}

function licenseGrantException(prompt) {
  if (localStorage.getItem("licenseException")) return;

  let alertText = "You don't have to wear a Hawaiian shirt to the exam.";
  if (prompt) alertText = `${prompt}\n${alertText}`;

  alert(alertText);
  licenseUnlock();
  localStorage.setItem("licenseException", true);
}

function initalizeSelections() {
  const exam = localStorage.getItem("exam") ?? "midterm";
  document.getElementById(exam).click();

  const questionsCount = localStorage.getItem("questions");
  if (questionsCount) {
    questionsCountChoice.value = questionsCount;
  }

  if (localStorage.getItem("learnedQuestionsExplained")) {
    unhide(learnedQuestionsSelection);
    const learnedQuestions = localStorage.getItem("learnedQuestions");
    if (learnedQuestions) {
      learnedQuestionsChoice.checked = learnedQuestions == "true";
    }
  }

  if (localStorage.getItem("explanationWarned")) {
    unhide(explainSelection);
    const explain = localStorage.getItem("explain");
    if (explain) {
      explainChoice.checked = explain == "true";
    }
  }
}

function getSelectedModules() {
  return modulesSelectBoxes.filter((box) => box.checked).map((box) => box.id);
}

function filterAttemptsTable() {
  const modules = getSelectedModules()
    .map((x) => parseInt(x))
    .join(", ");

  const rows = attemptsTable.querySelectorAll(".row");
  const modulesColumns = attemptsTable.querySelectorAll(".modules");

  rows.forEach(unhide);

  if (modules.length > 0) {
    rows.forEach((row) => row.getAttribute("modules") != modules && hide(row));
    modulesColumns.forEach(hide);
  } else {
    modulesColumns.forEach(unhide);
  }
}

function tohomePage() {
  if (
    document.querySelector(
      "#quiz-page[visible] #quiz[submitted=false] .choice-input:checked"
    ) &&
    !confirm("You will lose progress on the current attempt. Continue anyway?")
  ) {
    return;
  }
  updateAttemptsTable();
  updateCoverage();
  navText.style.visibility = "hidden";
  hide(resultPanel);
  hide(quizPage);
  unhide(homePage);
}

function toQuizPage() {
  navText.style.visibility = "visible";
  clearInterval(quizTimer);
  hide(resultPanel);
  hide(homePage);
  unhide(quizPage);
  scrollTo(0, 0);
}

function nextQuiz() {
  const questionsCount = questionsCountChoice.value;
  const modules = getSelectedModules();
  if (modules.length == 0) {
    moduleSelection.style.animation = "blink 1s";
    return;
  }
  navText.innerText = `Attempt ${pastAttempts.length + 1}`;
  const quizData = getQuiz(modules, questionsCount);
  document.getElementById("quiz").replaceWith(generateQuiz(quizData));
  toQuizPage();
  quizTimer = startTimer();
  setTimeout(explainLearnedQuestions, 400); // after the page loads, 400ms should be enough
}

function submit() {
  const quiz = document.getElementById("quiz");
  const questions = quiz.querySelectorAll(".question");

  if (!checkCompletion(questions)) return;

  const correctAnswers = grade(questions);
  for (const input of quiz.querySelectorAll(".choice-input"))
    input.disabled = true;
  quiz.setAttribute("submitted", true);
  scrollTo(0, 0);
  showResult(correctAnswers, questions.length);
  learnQuiz(quiz);
  clearInterval(quizTimer);
  updatePastAttempts(correctAnswers, questions);
}
