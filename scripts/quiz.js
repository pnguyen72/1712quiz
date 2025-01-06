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

function checkCompletion(questions) {
  if (questions.length == 0) return false;

  let forceSubmit = false;
  for (const question of questions) {
    const answered = question.querySelector(
      ".choice-input:is(:checked,[type=checkbox])"
    );
    if (!answered && !forceSubmit) {
      if (!confirm("There are unanswered question(s). Submit anyway?")) {
        question.scrollTo().blink();
        return false;
      }
      forceSubmit = true;
    }
    question.setAttribute("answered", answered != null);
  }
  return true;
}

function grade(quiz) {
  let score = 0;
  for (const question of quiz.querySelectorAll(".question")) {
    if (question.getAttribute("answered") == "false") {
      explain(question);
      continue;
    }
    let isCorrect = true;
    for (const choice of question.querySelectorAll("li")) {
      const input = choice.querySelector("input");
      if ((choice.className == "correct") != input.checked) {
        isCorrect = false;
        break;
      }
    }
    if (isCorrect) {
      ++score;
    } else {
      question.classList.remove("unsure");
      question.classList.add("wrong-answer");
      hide(question.querySelector(".unsure-label"));
      explain(question);
    }
  }
  for (const input of quiz.querySelectorAll(".choice-input"))
    input.disabled = true;
  quiz.setAttribute("submitted", true);
  return score;
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
  unfinishedAttempts.set(
    getAttemptData(
      document.querySelectorAll(
        "#quiz-page[visible] " +
          "#quiz[submitted=false] " +
          ".question:has(:is(.choice-input,.unsure-check):checked)"
      )
    )
  );
}

function showResult(score, outOf) {
  const accuracy = score / (outOf + Number.EPSILON);
  const roundedAccuracy = Math.round((accuracy + Number.EPSILON) * 100);
  resultText.innerText = `${score}/${outOf} (${roundedAccuracy}%)`;
  const [H, S, L] = getColor(accuracy);
  reviewPanel.style.backgroundColor = `hsl(${H}, ${S}%, ${L}%)`;
  reviewPanel.style.color = L < 60 ? "#eee" : "#000";
  unhide(reviewPanel);

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
  if (unsureQuestions.length > 0) {
    unhide(reviewPanel);
    prevQuest.parentElement.style.visibility =
      nextQuest.parentElement.style.visibility = "visible";
  } else {
    if (quizPage.querySelector("#quiz[submitted=false]")) {
      hide(reviewPanel);
    }
    prevQuest.parentElement.style.visibility =
      nextQuest.parentElement.style.visibility = "hidden";
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

    const questionText = question.querySelector(".question-body").innerHTML;
    const explanationText = textarea.value.trim().replaceAll("\n", "<br>");
    submitExplanation(question.id, questionText, explanationText).then(() => {
      if (textarea.value != originalTextareaValue) {
        licenseGrantException("Thank you for your contribution.");
      }
    });
  }
}
