function hide(element) {
  element.style.display = "none";
  element.classList.remove("visible");
}

function unhide(element) {
  element.style.display = "";
  element.classList.add("visible");
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
  generateExamSelection();

  const defaultExam = Object.keys(modulesNames)[0];
  const exam = localStorage.getItem("exam") ?? defaultExam;
  if (document.getElementById(exam)) {
    document.getElementById(exam).click();
  } else {
    document.getElementById(defaultExam).click();
  }

  const questionsCount = localStorage.getItem("questions");
  if (questionsCount) {
    questionsCountChoice.value = questionsCount;
  }

  if (localStorage.getItem("learnedQuestionsExplained")) {
    unhide(learnedQuestionsSelection);
    const learnedQuestions = localStorage.getItem("learnedQuestions");
    includeLearnedQuestions.checked = learnedQuestions == "true";
  }
  if (localStorage.getItem("unansweredQuestionsExplained")) {
    unhide(discardUnansweredSelection);
    const ignore = localStorage.getItem("discardUnanswered");
    discardUnansweredQuestions.checked = ignore == "true";
  }
  if (localStorage.getItem("explanationWarned")) {
    unhide(explainSelection);
    const enabled = localStorage.getItem("explain") == "true";
    enableExplanations.checked = enabled;
    if (!enabled) return;
  }
  loadExplanationResources();
}

function getSelectedModules() {
  const checkedBoxes = [...document.querySelectorAll(".module-input:checked")];
  return checkedBoxes.map((box) => box.id);
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
    .querySelectorAll(".row.visible .timestamp")
    .forEach((td) => (td.innerText = humanize(td.getAttribute("value"))));
}

function tohomePage() {
  updateAttemptsTable();
  updateCoverage();
  updateOngoingLabels();
  navText.style.visibility = "hidden";
  saveProgress();
  hide(quizPage);
  unhide(homePage);
}

function toQuizPage() {
  navText.style.visibility = "visible";
  stopTimer();
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
    tohomePage();
    moduleSelection.style.animation = "blink 1s";
    return;
  }
  const questionsIds = getQuiz(modules, questionsCount);
  const quiz = generateQuiz(questionsIds, {
    buffered: questionsIds.length > 40,
  });
  document.getElementById("quiz").replaceWith(quiz);
  quiz.addEventListener("input", saveProgress);
  toQuizPage();
  startTimer();
  nextButton.disabled = true;
  // timeout so that these run after the page has loaded
  // 500 should be enough
  setTimeout(() => {
    recoverAttempt(quiz);
    nextButton.disabled = false;
    explainLearnedQuestions();
  }, 500);
  setTimeout(explainSavingProgress, 5 * 60 * 1000); // 5 minutes
}

function submit() {
  const quiz = document.getElementById("quiz");
  const questions = quiz.querySelectorAll(".question");
  const unansweredQuestions = quiz.querySelectorAll(".question:not(.answered)");

  if (unansweredQuestions.length > 0) {
    if (!confirm("There are unanswered questions. Submit anyway?")) {
      unansweredQuestions[0].scrollTo().blink();
      return;
    }
    setTimeout(explainUnansweredQuestions, 400);
  }

  unfinishedAttempts.delete(questions);
  unfinishedAttempts.save();

  if (discardUnansweredQuestions.checked) {
    unansweredQuestions.forEach((question) => question.remove());
  } else {
    quiz
      .querySelectorAll(".joke:not(.answered)")
      .forEach((question) => question.remove());
  }

  const score = grade(quiz);
  const answeredQuestions = quiz.querySelectorAll(".question");
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
    knowledge.update(quiz);
  }

  stopTimer();
  showResult(score, outOf);
  scrollTo(0, 0);
}

const questionsScroller = {
  current: null,
  getQuestions: function () {
    return quizPage.querySelectorAll(".question:is(.incorrect,.unsure)");
  },
  next: function () {
    const target = this.current
      ? this.current.next(":is(.incorrect,.unsure)")
      : nearestElement(this.getQuestions()).next();
    (target ?? this.current).scrollTo().blink();
  },
  previous: function () {
    const target = this.current
      ? this.current.previous(":is(.incorrect,.unsure)")
      : nearestElement(this.getQuestions()).previous();
    (target ?? this.current).scrollTo().blink();
  },
};
