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
  if (homePage.style.display != "none") {
    form.reset();
    generateModuleSelection();
    formChanged = false;
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
  let forceSubmit = false;

  const quiz = document.getElementById("quiz");
  const questions = quiz.getElementsByClassName("question");

  let correctAnswers = 0;
  for (let question of questions) {
    let isCorrect = true;
    let isAnswered = false;

    for (let choice of question.getElementsByTagName("li")) {
      const input = choice.getElementsByTagName("input")[0];
      isAnswered = isAnswered || input.checked || input.type == "checkbox";
      if (question.classList.contains("joke")) {
        if (input.checked) {
          isCorrect = false;
          choice.className = "incorrect";
        } else {
          choice.className = "correct";
        }
      } else if (!((choice.className == "correct") == input.checked)) {
        isCorrect = false;
      }
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

    if (isCorrect) {
      ++correctAnswers;
      question
        .getElementsByClassName("questionText")[0]
        .setAttribute("title", "Show/hide explanation");
    } else {
      question.classList.add("wrongAnswer");
      question
        .getElementsByClassName("questionText")[0]
        .removeAttribute("title");
      question.explain();
    }
  }

  for (let input of quiz.getElementsByTagName("input")) {
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
  prevQuest.parentElement.style.display =
    nextQuest.parentElement.style.display =
      unsureQuestions.length > 0 ? "" : "none";
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
  prevQuest.parentElement.style.display =
    nextQuest.parentElement.style.display =
      unsureQuestions.length > 0 ? "" : "none";
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

  const textarea = document.createElement("textarea");
  textarea.className = "explanation";
  textarea.value = explanation.innerHTML.replaceAll(/\s*<br>\s*/g, "\n");
  if (textarea.value == placeholderExplanation) {
    textarea.value = "";
  }

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.innerText = "Submit";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "reset";
  cancelBtn.innerText = "Cancel";

  form.appendChild(textarea);
  form.appendChild(cancelBtn);
  form.appendChild(submitBtn);

  form.addEventListener("reset", (event) => {
    event.preventDefault();
    form.replaceWith(container);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const questionText =
      form.parentElement.getElementsByClassName("questionBody")[0].innerHTML;
    const explanationText = textarea.value.trim().replaceAll("\n", "<br>");
    explanation.write(explanationText);
    form.replaceWith(container);

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

  container.replaceWith(form);
}
