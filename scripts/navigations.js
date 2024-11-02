function licenseLock() {
  if (localStorage.getItem("licenseException") == "true") {
    return;
  }
  licenseNotice.style.display = "block";
  for (input of form.querySelectorAll("input,select")) {
    input.disabled = true;
  }
  navbar.hide();
}

function licenseUnlock() {
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

    if (isCorrect) {
      ++correctAnswers;
    } else {
      question.classList.add("wrongAnswer");
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

  if (localStorage.getItem("explanationWarned") == null) {
    if (quizPage.getElementsByClassName("explanation").length > 0) {
      setTimeout(
        alert,
        500,
        "Unlike questions and answers which are from Learning Hub, the explanations (in blue) are written by your classmates.\n\nEveryone is welcome to contribute explanations. If you want to help, let me know and I'll give you commit right."
      );
      localStorage.setItem("explanationWarned", "true");
    }
  }
}

function toggleMarkQuestionUnsure(question) {
  if (question.classList.contains("unsure")) {
    question.classList.remove("unsure");
  } else {
    question.classList.add("unsure");
  }

  const unsureQuestions = quizPage.querySelectorAll(".wrongAnswer,.unsure");
  prevQuest.parentElement.style.display =
    nextQuest.parentElement.style.display =
      unsureQuestions.length > 0 ? "" : "none";
}

function _populateData() {
  let modulesList;
  if (midtermChoice.checked) {
    modulesList = modulesData.midterm;
  } else {
    modulesList = modulesData.final;
  }

  quizData = {};
  for (let i = 0; i < modulesList.length; i++) {
    if (moduleSelectBoxes[i].checked) {
      if (LHChoice.checked) {
        quizData = { ...quizData, ...modulesList[i].LH };
      }
      if (AIChoice.checked) {
        quizData = { ...quizData, ...modulesList[i].AI };
      }
    }
  }
  quizData = Object.entries(quizData);
  shuffle(quizData);
}

function editExplanation(explanation) {
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

  const originalValue = explanation.innerHTML;

  form.addEventListener("reset", (event) => {
    event.preventDefault();
    explanation.innerHTML = originalValue;
    form.replaceWith(explanation);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const explanationText = textarea.value.trim().replaceAll("\n", "<br>");
    if (explanationText) {
      explanation = document.createElement("p");
    } else {
      explanation = document.createElement("button");
    }
    explanation.className = "explanation";
    explanation.innerHTML = explanationText;
    form.replaceWith(explanation);
    submitExplanation(explanation).then(() => {
      if (!explanationText) {
        explanation.innerText = placeholderExplanation;
      }
    });
  });

  explanation.replaceWith(form);
}
