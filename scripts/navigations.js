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
  licenseNotice.style.display = "block";
  for (input of form.querySelectorAll("input,select")) {
    input.disabled = true;
  }
  hide(navbar);
}

function licenseUnlock() {
  sessionStorage.setItem("licenseAgreed", "true");
  licenseNotice.style.display = "";
  for (input of form.querySelectorAll("input,select")) {
    input.disabled = false;
  }
  unhide(navbar);
}

function licenseGrantException() {
  alert(
    "Alright, for you alone I'll make an exception:\n\n" +
      "You don't have to wear a Hawaiian shirt to the exam."
  );
  licenseUnlock();
  localStorage.setItem("licenseException", "true");
}

function tohomePage() {
  if (
    document.querySelector(".unsubmitted .choice-input:checked") &&
    !confirm("You will lose progress on the current attempt. Continue anyway?")
  ) {
    return;
  }
  if (pastAttempts.length > 0) {
    document
      .getElementById("attempts-table")
      .replaceWith(generateAttemptsTable());
  }
  navText.style.visibility = "hidden";
  hide(resultPanel);
  hide(quizPage);
  unhide(homePage);
}

function toQuizPage() {
  navText.style.visibility = "visible";
  hide(resultPanel);
  hide(homePage);
  unhide(quizPage);
  scrollTo(0, 0);
}

function nextQuiz() {
  let questionsNum = questionNumChoice.value;
  if (questionsNum == "ALL") {
    questionsNum = Number.MAX_VALUE;
  }
  const modules = getSelectedModules();
  if (modules.length == 0) {
    moduleSelection.style.animation = "blink 1s";
    return;
  }
  const banks = getSelectedBanks();
  if (banks.length == 0) {
    questionBankSelection.style.animation = "blink 1s";
    return;
  }
  const data = getQuestions(banks, modules, questionsNum);
  navText.innerText = `Attempt ${pastAttempts.length + 1}`;
  toQuizPage();
  document.getElementById("quiz").replaceWith(generateQuiz(data));
  scrollTo(0, 0);
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
      question.querySelector(".unsure-label").removeAttribute("title");
      question.querySelector(".unsure-text").innerText = "Show explanation";
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
  quiz.className = "submitted";
  scrollTo(0, 0);
  showResult(correctAnswers, questions.length);
  resolveQuestions(
    quiz.querySelectorAll(".question:not(.wrong-answer,.unsure")
  );

  // update past attemps
  pastAttempts.push({
    quiz: setupQuiz(quiz.cloneNode(true)),
    banks: getSelectedBanks().join(", "),
    modules: getSelectedModules()
      .map((x) => parseInt(x))
      .join(", "),
    score: correctAnswers,
    outOf: questions.length,
  });
}

function getSelectedModules() {
  return moduleSelectBoxes.filter((box) => box.checked).map((box) => box.id);
}

function getSelectedBanks() {
  return [LHChoice, AIChoice].filter((box) => box.checked).map((box) => box.id);
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

function giveExplanationDisclaimer(explanationText) {
  if (
    explanationText &&
    document.getElementById("quiz").classList.contains("submitted") &&
    !localStorage.getItem("explanationWarned")
  ) {
    alert(
      "Disclaimer:\n\n" +
        "Unlike questions and answers which are from Learning Hub, " +
        "the explanations (in blue) are written by your classmates, " +
        "thus could be inaccurate."
    );
    localStorage.setItem("explanationWarned", "true");
  }
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
      if (
        !localStorage.getItem("licenseException") &&
        textarea.value != originalTextareaValue
      ) {
        alert(
          "Thank you for your contribution.\n" +
            "You are exempt from the Hawaiian shirt rule."
        );
        localStorage.setItem("licenseException", "true");
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
