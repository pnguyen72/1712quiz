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

  highlightedQuestions = new Set();

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

  let answers = 0;
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
    if (isAnswered) {
      // unanswered questions don't count toward the score
      ++answers;
      if (isCorrect) {
        ++correctAnswers;
      } else {
        question.classList.add("incorrect");
        highlightedQuestions.add(question);
      }
    } else if (!forceSubmit) {
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
  highlightedQuestions = Array.from(highlightedQuestions).sort(
    (p, q) => p.id.slice(1) - q.id.slice(1)
  );

  const accuracy = correctAnswers / (answers + Number.EPSILON);
  pastResults.push(accuracy);
  const roundedNumber = Math.round((accuracy + Number.EPSILON) * 100);
  quizResultText.innerText = `${correctAnswers}/${answers} (${roundedNumber}%)`;
  const [H, S, L] = getColor(accuracy);
  resultPanel.style.backgroundColor = `hsl(${H}, ${S}%, ${L}%)`;
  resultPanel.unhide();
  prevQuest.parentElement.style.display =
    nextQuest.parentElement.style.display =
      highlightedQuestions.length > 0 ? "" : "none";

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

function toggleQuestionOfInterest(question) {
  if (document.getElementById("quiz").className == "submitted") {
    return;
  }

  if (question.style.backgroundColor != "yellow") {
    question.style.backgroundColor = "yellow";
    highlightedQuestions.add(question.parentElement.parentElement);
  } else {
    question.style.backgroundColor = "";
    highlightedQuestions.delete(question.parentElement.parentElement);
  }
}

function _populateData() {
  quizData = {};
  for (let i = 0; i < modulesData.length; i++) {
    if (moduleSelectBoxes[i].checked) {
      if (LHChoice.checked) {
        quizData = { ...quizData, ...modulesData[i]["LH"] };
      }
      if (AIChoice.checked) {
        quizData = { ...quizData, ...modulesData[i]["AI"] };
      }
    }
  }
  quizData = Object.entries(quizData);
  shuffle(quizData);
}
