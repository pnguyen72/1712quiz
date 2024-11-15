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
  navbar.hide();
}

function licenseUnlock() {
  sessionStorage.setItem("licenseAgreed", "true");
  licenseNotice.style.display = "";
  for (input of form.querySelectorAll("input,select")) {
    input.disabled = false;
  }
  navbar.unhide();
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
  quizPage.style.display = "none";
  homePage.style.display = "";
  resultPanel.hide();
}

function toQuizPage() {
  navText.style.visibility = "visible";
  homePage.style.display = "none";
  quizPage.style.display = "";
  resultPanel.hide();
  scrollTo(0, 0);
}

function nextQuiz() {
  let questionsNum = questionNumChoice.value;
  if (questionsNum == "ALL") {
    questionsNum = Number.MAX_VALUE;
  }
  if (formChanged || quizData.length < questionsNum) {
    if (moduleSelectBoxes.every((box) => !box.checked)) {
      moduleSelection.style.animation = "blink 1s";
      return;
    }
    if (!AIChoice.checked && !LHChoice.checked) {
      questionBankSelection.style.animation = "blink 1s";
      return;
    }
    _populateData();
    formChanged = false;
  }

  let data = quizData.slice(0, questionsNum);
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
      question.classList.add("wrongAnswer");
      question.querySelector(".unsure-label").style.display = "none";
      question.explain();
    }
  }

  // post-grading errands
  for (let input of quiz.getElementsByClassName("choice-input")) {
    input.disabled = true;
  }
  if (questionNumChoice.value != "ALL") {
    quizData.splice(0, questionNumChoice.value);
  } else {
    quizData = [];
  }
  quiz.className = "submitted";
  scrollTo(0, 0);
  showResult(correctAnswers, questions.length);

  // update past attemps
  const modules = moduleSelectBoxes
    .filter((box) => box.checked)
    .map((box) => box.id.slice(6))
    .join(", ");
  const banks = [LHChoice, AIChoice]
    .filter((box) => box.checked)
    .map((box) => box.id)
    .join(", ");
  pastAttempts.push({
    quiz: setupQuiz(quiz.cloneNode(true)),
    modules: modules,
    banks: banks,
    score: correctAnswers,
    outOf: questions.length,
  });
}

function showResult(score, outOf) {
  const accuracy = score / (outOf + Number.EPSILON);
  const roundedAccuracy = Math.round((accuracy + Number.EPSILON) * 100);
  quizResultText.innerText = `${score}/${outOf} (${roundedAccuracy}%)`;
  const [H, S, L] = getColor(accuracy);
  resultPanel.style.backgroundColor = `hsl(${H}, ${S}%, ${L}%)`;
  resultPanel.unhide();

  const unsureQuestions = quizPage.querySelectorAll(".wrongAnswer,.unsure");
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
    question.explain();
  }

  const unsureQuestions = quizPage.querySelectorAll(".wrongAnswer,.unsure");
  prevQuest.parentElement.style.visibility =
    nextQuest.parentElement.style.visibility =
      unsureQuestions.length > 0 ? "visible" : "hidden";
}

function _populateData() {
  let offset = 1;
  let length = modulesName.midterm.length;
  if (finalChoice.checked) {
    offset += length;
    length = modulesName.final.length;
  }

  quizData = {};
  for (let i = 0; i < length; i++) {
    if (moduleSelectBoxes[i].checked) {
      if (LHChoice.checked) {
        quizData = { ...quizData, ...modulesData.LH[i + offset] };
      }
      if (AIChoice.checked) {
        quizData = { ...quizData, ...modulesData.AI[i + offset] };
      }
    }
  }
  quizData = Object.entries(quizData);
  shuffle(quizData);
}

function editExplanation(explanation) {
  const container = explanation.parentElement;
  const form = document.createElement("form");
  form.className = "explanation-container";

  const textarea = document.createElement("textarea");
  textarea.className = "explanation";
  textarea.value = explanation.innerHTML.replaceAll(/\s*<br>\s*/g, "\n");
  if (textarea.value == placeholderExplanation) {
    textarea.value = "";
  }
  const originalTextareaValue = textarea.value;

  const questionText =
    container.parentElement.querySelector(".question-body").innerHTML;
  editSignal(questionText, true);

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.innerText = "Submit";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "reset";
  cancelBtn.innerText = "Cancel";

  form.appendChild(textarea);
  form.appendChild(cancelBtn);
  form.appendChild(submitBtn);
  container.replaceWith(form);
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

    const explanationText = textarea.value.trim().replaceAll("\n", "<br>");
    submitExplanation(questionText, explanationText).then(() => {
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
