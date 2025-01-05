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

  let alertText = "You don't have to switch set with JD.";
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
  hide(resultPanel);
  hide(quizPage);
  unhide(homePage);
}

function toQuizPage() {
  navText.style.visibility = "visible";
  stopTimer();
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
  const questionsIds = getQuiz(modules, questionsCount);
  const quiz = generateQuiz(questionsIds);
  document.getElementById("quiz").replaceWith(quiz);
  quiz.addEventListener("input", saveProgress);
  toQuizPage();
  startTimer(quiz.getAttribute("initialTime"));
  setTimeout(explainLearnedQuestions, 400); // so that it runs after the page has loaded, 400ms should be enough
}

function submit() {
  const quiz = document.getElementById("quiz");
  const questions = Array.from(quiz.querySelectorAll(".question"));

  if (!checkCompletion(questions)) return;

  const correctAnswers = grade(questions);
  for (const input of quiz.querySelectorAll(".choice-input"))
    input.disabled = true;
  quiz.setAttribute("submitted", true);
  scrollTo(0, 0);
  showResult(correctAnswers, questions.length);
  knowledge.update(quiz);
  stopTimer();
  updatePastAttempts(correctAnswers, questions);
  unfinishedAttempts.delete(questions.map((question) => question.id));
}

questionsSkipper = {
  _selector: ".question:is(.wrong-answer,.unsure)",
  _current: null,
  _scrollTo: function (target) {
    if (!target) {
      target = this._current;
    }
    target.scrollTo().blink();
    // target.scrollTo() will trigger the scroll event, which sets this._current = null
    // so we wait 500ms for the scroll to finish, avoiding the race condition
    setTimeout(() => (this._current = target), 500);
  },
  next: function () {
    let target;
    if (this._current == null) {
      // search where the target is based on current scroll position
      target = search(
        quizPage.querySelectorAll(this._selector),
        0,
        // no idea what 1.6 is, but it seems to work
        (e) => e.getBoundingClientRect().top - 1.6 * navbar.offsetHeight
      ).next();
    } else {
      const currentId = this._current.id;
      // the selector is cursed because the question ID starts with a number
      // it's too inconvenient to change that now
      const currentSelector = `#\\3${currentId[0]} ${currentId.slice(1)}`;
      target = quiz.querySelector(`${currentSelector} ~ ${this._selector}`);
    }
    this._scrollTo(target);
  },
  prev: function () {
    let target;
    if (this._current == null) {
      target = search(
        quizPage.querySelectorAll(this._selector),
        0,
        (e) => e.getBoundingClientRect().top - 1.5 * navbar.offsetHeight
      ).prev();
    } else {
      const currentId = this._current.id;
      const currentSelector = `#\\3${currentId[0]} ${currentId.slice(1)}`;
      const candidates = quiz.querySelectorAll(
        `${this._selector}:has(~ ${currentSelector})`
      );
      target = candidates[candidates.length - 1];
    }
    this._scrollTo(target);
  },
};

document.addEventListener("scroll", () => (questionsSkipper._current = null));
