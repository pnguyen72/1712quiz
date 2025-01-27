var quizTimer;

function startTimer(initial = 0) {
  function display(time) {
    seconds = String(time % 60).padStart(2, "0");
    minutes = String(Math.floor(time / 60) % 60).padStart(2, "0");
    hours = Math.floor(time / 3600);
    if (hours > 0) {
      navText.innerText = `${hours}:${minutes}:${seconds}`;
    } else {
      navText.innerText = `${minutes}:${seconds}`;
    }
  }

  let time = Math.round(initial);
  display(time);
  quizTimer = {
    id: setInterval(() => display(++time), 1000),
    getTime: () => time,
  };
}

function stopTimer() {
  clearInterval(quizTimer?.id);
}

function explainLearnedQuestions() {
  if (
    !localStorage.getItem("learnedQuestionsExplained") &&
    document.querySelector("#quiz-page.visible .learned-tag")
  ) {
    alert(
      "You have exhausted the question bank. Therefore, " +
        "some questions in this quiz are those you've already learned." +
        "\n\nThere's an option to exclude learned questions from new quizzes in the home menu."
    );
    localStorage.setItem("learnedQuestionsExplained", true);
    unhide(learnedQuestionsSelection);
  }
}

function explainSavingProgress() {
  if (
    !localStorage.getItem("savingProgressExplained") &&
    document.querySelector(
      "#quiz-page.visible #quiz:not(.submitted) .question:not(.answered)"
    )
  ) {
    alert(
      "Did you know that your progress is saved automatically?\n" +
        "Feel free to close this window, take a break, and come back at any time."
    );
    localStorage.setItem("savingProgressExplained", true);
  }
}

function explainUnansweredQuestions() {
  if (
    !localStorage.getItem("unansweredQuestionsExplained") ||
    !quizPage.querySelector(".question")
  ) {
    alert(
      "By default, unanswered questions are discarded and don't count towards your grade." +
        "\n\nThere's an option to change this behavior in the home menu."
    );
    localStorage.setItem("unansweredQuestionsExplained", true);
    unhide(discardUnansweredSelection);
  }
}

function explainExplanations() {
  if (
    !localStorage.getItem("explanationWarned") &&
    document.querySelector("#quiz-page.visible #quiz.submitted")
  ) {
    alert(
      "Unlike questions and answers which are from Learning Hub, " +
        "explanations are written by your classmates, thus *could* be inaccurate." +
        "\n\nThere's an option to disable explanations in the home menu."
    );
    localStorage.setItem("explanationWarned", true);
    unhide(explainSelection);
  }
}

function checkCompletion(quiz) {
  function isAnswered(question, option = { strict: false }) {
    const definitelyYes =
      !question || question.querySelector(".choice-input:is(:checked)");
    if (definitelyYes) return true;

    if (!question.querySelector(".choice-input[type=checkbox]")) {
      option.strict = true;
    }
    if (option.strict) return false;
    const previous = question.previous();
    const next = question.next();
    return (
      isAnswered(previous, { strict: true }) &&
      isAnswered(next, { strict: true })
    );
  }

  const questions = quiz.querySelectorAll(".question");
  if (questions.length == 0) return false;
  for (const question of questions) {
    if (isAnswered(question)) {
      question.classList.add("answered");
    } else {
      question.classList.remove("answered");
    }
  }
  return true;
}

function grade(quiz) {
  let score = 0;
  quiz
    .querySelectorAll(".question")
    .forEach((question) => (score += isCorrect(question)));
  quiz
    .querySelectorAll(".choice-input")
    .forEach((input) => (input.disabled = true));
  quiz.classList.add("submitted");
  return score;
}

function isCorrect(question) {
  if (question.classList.contains("joke")) {
    // There are 3 kinds of joke questions:
    // 1, if all answers are incorrect,
    //    make whatever the user chose incorrect,
    //    and randomly make one of the other options correct
    if (!question.querySelector("li.correct,.choice-input[type=checkbox]")) {
      question
        .querySelector("li:has(input:checked)")
        .classList.remove("correct");
      sample(
        question.querySelectorAll("li:not(:has(input:checked))")
      ).classList.add("correct");
      explain(question);
      question.classList.add("incorrect");
      return false;
    }
    // 2, if all answers are correct,
    //    make whatever the user chose correct,
    //    and all other choices incorrect
    if (
      !question.querySelector("li:not(.correct), .choice-input[type=checkbox]")
    ) {
      question.querySelector("li:has(input:checked)").classList.add("correct");
      question
        .querySelectorAll("li:not(:has(input:checked))")
        .foreach((choice) => choice.classList.remove("correct"));
      return true;
    }
    // 3, still a joke, but mark it like a normal question.
  }

  for (const choice of question.querySelectorAll("li")) {
    const input = choice.querySelector("input");
    if ((choice.className == "correct") != input.checked) {
      explain(question);
      question.classList.add("incorrect");
      return false;
    }
  }
  return true;
}

function getAttemptData(questions) {
  if (questions.length == 0) return {};

  const time = quizTimer.getTime();
  const attemptData = {};
  for (const question of questions) {
    const questionData = {
      time: time / questions.length,
      unsure: question.querySelector(".unsure-check").checked,
    };
    for (const choice of question.querySelectorAll(".choice-input")) {
      questionData[choice.id] = choice.checked;
    }
    attemptData[question.id] = questionData;
  }
  return attemptData;
}

function saveProgress() {
  const quiz = document.querySelector(
    "#quiz-page.visible #quiz:not(.submitted)"
  );
  if (!quiz) return;
  checkCompletion(quiz);
  const selector = ".unsure,.answered";
  unfinishedAttempts.set(
    getAttemptData(quiz.querySelectorAll(`.question:is(${selector})`))
  );
  unfinishedAttempts.delete(
    quiz.querySelectorAll(`.question:not(${selector})`)
  );
  unfinishedAttempts.save();
}

function showResult(score, outOf) {
  const accuracy = score / (outOf + Number.EPSILON);
  const roundedAccuracy = Math.round((accuracy + Number.EPSILON) * 100);
  resultText.innerText = `${score}/${outOf} (${roundedAccuracy}%)`;
  if (outOf) {
    const [H, S, L] = getColor(accuracy);
    reviewPanel.style.backgroundColor = `hsl(${H}, ${S}%, ${L}%)`;
    reviewPanel.style.color = L < 60 ? "#eee" : "#000";
  }
  unhide(reviewPanel);

  const unsureQuestions = quizPage.querySelectorAll(".incorrect,.unsure");
  prevQuest.style.visibility = nextQuest.style.visibility =
    unsureQuestions.length > 0 ? "visible" : "hidden";
}

function toggleUnsure(question) {
  if (question.classList.contains("unsure")) {
    question.classList.remove("unsure");
  } else {
    question.classList.add("unsure");
    explain(question);
  }

  const unsureQuestions = quizPage.querySelectorAll(".incorrect,.unsure");
  if (unsureQuestions.length > 0) {
    unhide(reviewPanel);
    prevQuest.style.visibility = nextQuest.style.visibility = "visible";
  } else {
    if (quizPage.querySelector("#quiz:not(.submitted)")) {
      hide(reviewPanel);
    }
    prevQuest.style.visibility = nextQuest.style.visibility = "hidden";
  }
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
  initializeHeight(textarea);

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
    const explanationText = textarea.value.trim().replaceAll("\n", "<br>");
    submitExplanation(question, explanationText).then(() => {
      if (textarea.value != originalTextareaValue) {
        licenseGrantException("Thank you for your contribution.");
      }
    });
  }
}
