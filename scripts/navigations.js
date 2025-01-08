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

function refreshAttemptsTable() {
  const selectedExam = examSelection.querySelector("input:checked")?.id;
  const selectedModules = getSelectedModules()
    .map((x) => parseInt(x))
    .join(", ");

  const rows = attemptsTable.querySelectorAll(".row");
  const modulesColumns = attemptsTable.querySelectorAll(".modules");

  rows.forEach((row) => {
    if (row.getAttribute("exam") != selectedExam) {
      hide(row);
    } else {
      unhide(row);
    }
  });

  if (selectedModules.length > 0) {
    rows.forEach((row) => {
      if (row.getAttribute("modules") != selectedModules) {
        hide(row);
      }
    });
    modulesColumns.forEach(hide);
  } else {
    modulesColumns.forEach(unhide);
  }

  attemptsTable
    .querySelectorAll(".row[visible=true] .timestamp")
    .forEach((td) => (td.innerText = humanize(td.getAttribute("value"))));
}

function tohomePage() {
  updateAttemptsTable();
  updateCoverage();
  navText.style.visibility = "hidden";
  saveProgress();
  hide(reviewPanel);
  hide(quizPage);
  unhide(homePage);
}

function toQuizPage() {
  navText.style.visibility = "visible";
  stopTimer();
  hide(reviewPanel);
  reviewPanel.style.backgroundColor = "";
  reviewPanel.style.color = "";
  resultText.innerText = "Review";
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
  const questionsIds = getQuiz(modules, questionsCount);
  const quiz = generateQuiz(questionsIds);
  document.getElementById("quiz").replaceWith(quiz);
  quiz.addEventListener("input", saveProgress);
  toQuizPage();
  startTimer();
  nextButton.disabled = true;
  // timeout so that these run after the page has loaded
  // 300ms should be enough
  setTimeout(() => {
    recoverAttempt(quiz);
    nextButton.disabled = false;
  }, 300);
  setTimeout(explainLearnedQuestions, 400);
}

function submit() {
  const quiz = document.getElementById("quiz");
  if (!checkCompletion(quiz)) return;

  const score = grade(quiz);
  const answeredQuestions = quiz.querySelectorAll(".question[answered=true]");
  const outOf = answeredQuestions.length;
  if (outOf) {
    pastAttempts.push({
      timestamp: Date.now(),
      exam: examSelection.querySelector("input:checked").id,
      modules: getSelectedModules()
        .map((x) => parseInt(x))
        .join(", "),
      duration: navText.innerText,
      score: score,
      outOf: outOf,
      data: getAttemptData(answeredQuestions),
    });
    localStorage.setItem("attempts", JSON.stringify(pastAttempts));
    showResult(score, outOf);
  }
  scrollTo(0, 0);
  knowledge.update(quiz);
  stopTimer();
  unfinishedAttempts.delete(quiz.querySelectorAll(".question"));
  unfinishedAttempts.save();
}

const questionsScroller = {
  current: null,
  next: function () {
    const target = this.current
      ? this.current.next(":is(.wrong-answer,.unsure)")
      : search(
          quizPage.querySelectorAll(".question:is(.wrong-answer,.unsure)"),
          0,
          // no idea what 1.6 is, but it works
          (e) => e.getBoundingClientRect().top - 1.6 * navbar.offsetHeight
        ).previous();
    (target ?? this.current).scrollTo().blink();
  },
  previous: function () {
    const target = this.current
      ? this.current.previous(":is(.wrong-answer,.unsure)")
      : search(
          quizPage.querySelectorAll(".question:is(.wrong-answer,.unsure)"),
          0,
          // no idea what 1.5 is, but it works
          (e) => e.getBoundingClientRect().top - 1.5 * navbar.offsetHeight
        ).previous();
    (target ?? this.current).scrollTo().blink();
  },
};
