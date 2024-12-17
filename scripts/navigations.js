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

function startTimer() {
  navText.innerText = "00:00";
  let time = 0;
  return setInterval(function () {
    ++time;
    seconds = String(time % 60).padStart(2, "0");
    minutes = String(Math.floor(time / 60) % 60).padStart(2, "0");
    hours = Math.floor(time / 3600);
    if (hours > 0) {
      navText.innerText = `${hours}:${minutes}:${seconds}`;
    } else {
      navText.innerText = `${minutes}:${seconds}`;
    }
  }, 1000);
}

function explainLearnedQuestions() {
  if (
    !localStorage.getItem("learnedQuestionsExplained") &&
    document.querySelector("#quiz-page[visible] .learned-tag")
  ) {
    alert(
      "You have exhausted the question bank. Therefore, " +
        "some questions in this quiz are those you've already learned.\n\n" +
        "There's an option to exclude already-learned questions in the home menu."
    );
    localStorage.setItem("learnedQuestionsExplained", true);
    unhide(learnedQuestionsSelection);
  }
}

function giveExplanationsWarning() {
  if (
    !localStorage.getItem("explanationWarned") &&
    document.querySelector("#quiz-page[visible] #quiz[submitted=true]")
  ) {
    alert(
      "Warning:\n\n" +
        "Unlike questions and answers which are from Learning Hub, " +
        "explanations are written by your classmates, " +
        "thus *could* be inaccurate.\n\n" +
        "There's an option to disable explanations in the home menu."
    );
    localStorage.setItem("explanationWarned", true);
    unhide(explainSelection);
  }
}

function submit() {
  const quiz = document.getElementById("quiz");
  const questions = quiz.getElementsByClassName("question");

  // check if all questions are answered
  let forceSubmit = false;
  for (let question of questions) {
    let isAnswered = false;
    for (let choice of question.getElementsByTagName("li")) {
      const input = choice.querySelector("input");
      isAnswered = isAnswered || input.checked || input.type == "checkbox";
      if (isAnswered) break;
    }
    if (!isAnswered && !forceSubmit) {
      question.scrollTo();
      if (confirm("There are unanswered question(s). Submit anyway?"))
        forceSubmit = true;
      else {
        question.blink();
        return;
      }
    }
  }

  // grade
  let correctAnswers = 0;
  for (let question of questions) {
    let isCorrect = true;

    for (let choice of question.getElementsByTagName("li")) {
      const input = choice.querySelector("input");
      if ((choice.className == "correct") != input.checked) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      ++correctAnswers;
    } else {
      question.classList.remove("unsure");
      question.classList.add("wrong-answer");
      hide(question.querySelector(".unsure-label"));
      explain(question);
    }
  }

  // post-grading errands
  for (let input of quiz.getElementsByClassName("choice-input")) {
    input.disabled = true;
  }
  quiz.setAttribute("submitted", true);
  scrollTo(0, 0);
  showResult(correctAnswers, questions.length);
  learnQuiz(quiz);
  clearInterval(quizTimer);

  // update past attemps
  pastAttempts.push({
    quiz: quiz.outerHTML,
    modules: getSelectedModules()
      .map((x) => parseInt(x))
      .join(", "),
    score: correctAnswers,
    outOf: questions.length,
  });
  localStorage.setItem("pastAttempts", JSON.stringify(pastAttempts));
}

function getSelectedModules() {
  return modulesSelectBoxes.filter((box) => box.checked).map((box) => box.id);
}

function showResult(score, outOf) {
  const accuracy = score / (outOf + Number.EPSILON);
  const roundedAccuracy = Math.round((accuracy + Number.EPSILON) * 100);
  quizResultText.innerText = `${score}/${outOf} (${roundedAccuracy}%)`;
  const [H, S, L] = getColor(accuracy);
  resultPanel.style.backgroundColor = `hsl(${H}, ${S}%, ${L}%)`;
  unhide(resultPanel);

  const unsureQuestions = quizPage.querySelectorAll(".wrong-answer,.unsure");
  prevQuest.parentElement.style.visibility =
    nextQuest.parentElement.style.visibility =
      unsureQuestions.length > 0 ? "visible" : "hidden";
}

function toggleUnsure(question) {
  if (question.classList.contains("unsure")) {
    question.classList.remove("unsure");
  } else {
    question.classList.add("unsure");
    explain(question);
  }

  const unsureQuestions = quizPage.querySelectorAll(".wrong-answer,.unsure");
  prevQuest.parentElement.style.visibility =
    nextQuest.parentElement.style.visibility =
      unsureQuestions.length > 0 ? "visible" : "hidden";
}

function editExplanation(explanation) {
  const container = explanation.parentElement;
  const question = container.parentElement;
  editSignal(question.id, true);

  const form = document.createElement("form");
  const textarea = document.createElement("textarea");
  form.className = "explanation-container";
  textarea.className = "explanation";
  textarea.value = explanation.innerHTML.replaceAll(/\s*<br>\s*/g, "\n");
  if (textarea.value == placeholderExplanation) textarea.value = "";
  const originalTextareaValue = textarea.value;

  const submitBtn = document.createElement("button");
  const cancelBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.innerText = "Submit";
  cancelBtn.type = "reset";
  cancelBtn.innerText = "Cancel";

  form.appendChild(textarea);
  form.appendChild(cancelBtn);
  form.appendChild(submitBtn);
  container.replaceWith(form);
  textarea.focus();
  _initializeHeight(textarea);

  textarea.addEventListener("input", () => {
    textarea.style.height = 0;
    textarea.style.height = `max(4rem, ${textarea.scrollHeight + "px"})`;
    form.style.height = `calc(2.3rem + ${textarea.style.height})`;
  });

  form.addEventListener("reset", (event) => {
    event.preventDefault();
    textarea.value = originalTextareaValue;
    submit();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });

  function submit() {
    form.replaceWith(container);

    const questionText = question.querySelector(".question-body").innerHTML;
    const explanationText = textarea.value.trim().replaceAll("\n", "<br>");
    submitExplanation(question.id, questionText, explanationText).then(() => {
      if (textarea.value != originalTextareaValue) {
        licenseGrantException("Thank you for your contribution.");
      }
    });
  }
}

function _initializeHeight(textarea) {
  const tempDiv = document.createElement("div");
  tempDiv.style.fontSize = getComputedStyle(textarea).fontSize;
  tempDiv.style.fontFamily = getComputedStyle(textarea).fontFamily;
  tempDiv.style.display = "inline-block";
  tempDiv.style.width = getComputedStyle(textarea).width;
  tempDiv.style.position = "absolute";
  tempDiv.style.top = 0;
  tempDiv.style.left = 0;
  tempDiv.innerText = textarea.value;
  document.body.appendChild(tempDiv);

  const targetHeight = getComputedStyle(tempDiv).height;
  textarea.style.height = `max(4rem, calc(${targetHeight} + 4.4px))`; // no idea what 4.4px is
  tempDiv.remove();

  const form = textarea.parentElement;
  const textHeight = textarea.offsetHeight;
  const btnHeight = form.querySelector("button").offsetHeight;
  form.style.height = `calc(4px + ${btnHeight}px + ${textHeight}px)`;
}
