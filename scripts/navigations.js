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

function returnHome() {
  removeElementById("result-table");
  if (pastResults.length > 0) {
    pastResultsContainer.appendChild(generateResultsTable());
  }
  navText.style.visibility = "hidden";
  navbar.style.backgroundColor = "";
  resultPanel.hide();
  quizPage.hide();
  homePage.unhide();
}

function nextQuiz() {
  navText.innerText = `Attempt ${attemptsCount + 1}`;

  let questionsNum = questionNumChoice.value;
  if (questionsNum == "ALL") {
    questionsNum = 100000;
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

  navText.style.visibility = "visible";
  navbar.style.backgroundColor = "";
  resultPanel.hide();
  homePage.hide();
  quizPage.unhide();

  if (newQuizNeeded) {
    scrollTo(0, 0);
    removeElementById("quiz");
    quizPage.appendChild(generateQuiz(data));
    newQuizNeeded = false;
  } else {
    const quiz = document.getElementById("quiz");
    for (let question of quiz.getElementsByClassName("question")) {
      let isAnswered = false;
      for (let choice of question.getElementsByTagName("input")) {
        isAnswered = isAnswered || choice.checked;
      }
      if (!isAnswered) {
        question.scrollTo();
        break;
      }
    }
  }
}

function submit() {
  const quiz = document.getElementById("quiz");
  const questions = quiz.getElementsByClassName("question");

  let forceSubmit = false;
  for (let question of questions) {
    let isAnswered = false;
    for (let choice of question.getElementsByTagName("li")) {
      const input = choice.getElementsByTagName("input")[0];
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

  let correctAnswers = 0;
  for (let question of questions) {
    let isCorrect = true;
    for (let choice of question.getElementsByTagName("li")) {
      const input = choice.getElementsByTagName("input")[0];
      if (question.classList.contains("joke")) {
        if (input.checked) {
          isCorrect = false;
          choice.className = "incorrect";
        } else {
          choice.className = "correct";
        }
      } else if ((choice.className == "correct") != input.checked) {
        isCorrect = false;
        break;
      }
    }
    if (isCorrect) {
      ++correctAnswers;
      question
        .getElementsByClassName("unsure-label")[0]
        .removeAttribute("title");
      //prettier-ignore
      question
        .getElementsByClassName("unsure-text")[0]
        .innerText = "Show explanation";
    } else {
      question.classList.remove("unsure");
      question.classList.add("wrongAnswer");
      question.getElementsByClassName("unsure-label")[0].remove();
      question.explain();
    }
  }

  for (let input of quiz.getElementsByClassName("choice-input")) {
    input.disabled = true;
  }
  if (questionNumChoice.value != "ALL") {
    quizData.splice(0, questionNumChoice.value);
  } else {
    quizData = [];
  }

  newQuizNeeded = true;
  quiz.className = "submitted";
  scrollTo(0, 0);
  ++attemptsCount;

  const accuracy = correctAnswers / questions.length;
  pastResults.push(accuracy);
  const roundedNumber = Math.round((accuracy + Number.EPSILON) * 100);
  quizResultText.innerText = `${correctAnswers}/${questions.length} (${roundedNumber}%)`;
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

function toggleMarkQuestionUnsure(question) {
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

  // prettier-ignore
  const questionText =
    container.parentElement
      .getElementsByClassName("question-body")[0]
      .innerHTML;
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
    textarea.style.height = `max(3rem, ${textarea.scrollHeight + "px"})`;
    form.style.height = `calc(2rem + ${textarea.style.height}`;
  });

  form.addEventListener("reset", (event) => {
    event.preventDefault();
    editSignal(questionText, false);
    form.replaceWith(container);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.replaceWith(container);

    const explanationText = textarea.value.trim().replaceAll("\n", "<br>");
    if (explanationText == explanation.innerHTML) {
      editSignal(questionText, false);
      return;
    }
    submitExplanation(questionText, explanationText).then(() => {
      if (!localStorage.getItem("licenseException")) {
        alert(
          "Thank you for your contribution.\n" +
            "You are exempt from the Hawaiian shirt rule."
        );
        localStorage.setItem("licenseException", "true");
      }
    });
  });
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
  textarea.style.height = `max(3rem, calc(${targetHeight} + 4.4px))`;
  textarea.parentElement.style.height = `calc(2rem + ${textarea.style.height}`;
  tempDiv.remove();
}
