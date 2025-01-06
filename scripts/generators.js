function generateModuleSelection() {
  modulesSelectBoxes = [];

  let indexOffset;
  let selectedModulesNames;
  if (examSelection.querySelector("input:checked").id == "midterm") {
    indexOffset = 1;
    selectedModulesNames = modulesNames.midterm;
  } else {
    indexOffset = 1 + modulesNames.midterm.length;
    selectedModulesNames = modulesNames.final;
  }

  const modulesList = document.createElement("ul");
  modulesList.id = "modules-list";
  document.getElementById("modules-list").replaceWith(modulesList);

  selectedModulesNames.forEach((name, index) => {
    const module = document.createElement("li");
    const moduleLabel = document.createElement("label");
    const moduleSelectBox = document.createElement("input");
    const moduleTitle = document.createElement("span");
    const moduleCoverage = document.createElement("span");
    modulesSelectBoxes.push(moduleSelectBox);

    moduleTitle.innerHTML = `Module ${index + indexOffset}: ${name}`;
    moduleCoverage.className = "coverage";
    moduleSelectBox.id = `${String(index + indexOffset).padStart(2, "0")}`;
    moduleSelectBox.type = "checkbox";
    moduleSelectBox.addEventListener(
      "input",
      () => (document.getElementById("module-all").checked = false)
    );

    moduleLabel.appendChild(moduleSelectBox);
    moduleLabel.appendChild(moduleTitle);
    module.appendChild(moduleLabel);
    module.appendChild(moduleCoverage);
    modulesList.appendChild(module);
  });

  const module = document.createElement("li");
  const moduleLabel = document.createElement("label");
  const moduleSelectBox = document.createElement("input");
  const moduleTitle = document.createElement("span");
  const moduleCoverage = document.createElement("span");

  moduleTitle.innerText = "All of them!";
  moduleTitle.style.fontWeight = "bold";
  moduleCoverage.className = "coverage";
  moduleSelectBox.type = "checkbox";
  moduleSelectBox.id = "module-all";
  moduleSelectBox.addEventListener("click", () =>
    modulesSelectBoxes.forEach((box) => (box.checked = moduleSelectBox.checked))
  );

  moduleLabel.appendChild(moduleSelectBox);
  moduleLabel.appendChild(moduleTitle);
  module.appendChild(moduleLabel);
  module.appendChild(moduleCoverage);
  modulesList.appendChild(module);

  updateCoverage();
}

function generateQuiz(questionsIds) {
  const quiz = document.createElement("div");
  quiz.id = "quiz";
  quiz.setAttribute("explain", explainChoice.checked);
  quiz.setAttribute("submitted", false);
  let time = 0;
  questionsIds.forEach((id, index) => {
    const question = generateQuestion(id, index);
    quiz.appendChild(question);
    time += question.initialTime;
  });
  quiz.initialTime = time;
  return quiz;
}

function generatePastAttempt(attemptData) {
  unfinishedAttempts.set(attemptData);
  const questionsIds = Object.keys(attemptData);
  const quiz = generateQuiz(questionsIds);
  for (const input of quiz.querySelectorAll(".choice-input")) {
    input.disabled = true;
  }
  for (const learnedTag of quiz.querySelectorAll(".learned-tag")) {
    learnedTag.remove();
  }
  grade(quiz.querySelectorAll(".question"));
  quiz.setAttribute("submitted", true);
  unfinishedAttempts.delete(questionsIds);
  return quiz;
}

function recoverAttempt(quiz) {
  const recoverable = quiz.querySelectorAll(".question[recoverable");
  if (recoverable.length == 0) {
    return;
  }
  if (
    !confirm(
      "Do you want to recover your previous unsubmitted attempt?" +
        "\n(Selecting no will permanently delete it!)"
    )
  ) {
    unfinishedAttempts.delete([...recoverable].map((question) => question.id));
    return;
  }

  let time = 0;
  recoverable.forEach((question) => {
    const attemptData = unfinishedAttempts.get(question.id);
    question
      .querySelectorAll(".choice-input")
      .forEach((input) => (input.checked = attemptData[input.id]));
    time += attemptData.time;
    if (attemptData.unsure) {
      question.querySelector(".unsure-check").click();
    }
  });
  stopTimer();
  startTimer(time);
  quiz
    .querySelector(".question:not(:has(.choice-input:checked))")
    ?.blink()
    ?.previous()
    ?.scrollTo();
}

function generateQuestion(questionId, questionIndex) {
  const questionData = questionsData.get(questionId);
  const choices = Object.entries(questionData.choices);
  const attemptData = unfinishedAttempts.get(questionId);
  shuffleChoices(choices);

  // header
  const questionHeader = document.createElement("div");
  const questionTitleContainter = document.createElement("span");
  const questionTitle = document.createElement("b");
  const learnedTag = document.createElement("span");
  const unsureLabel = document.createElement("label");
  const unsureCheck = document.createElement("input");
  const imNotSure = document.createElement("span");
  const showExplanation = document.createElement("span");

  questionHeader.className = "question-header";
  questionTitle.className = "question-title";
  questionTitle.innerText = `Question ${questionIndex + 1}.`;
  learnedTag.className = "learned-tag";
  learnedTag.innerText = "already learned";
  unsureLabel.className = "unsure-label";
  unsureCheck.className = "unsure-check";
  unsureCheck.addEventListener("input", () => toggleUnsure(question));
  imNotSure.className = "im-not-sure";
  imNotSure.innerText = "I'm not sure";
  showExplanation.className = "show-explanation";
  showExplanation.innerText = "Show explanation";
  unsureCheck.type = "checkbox";

  unsureLabel.appendChild(unsureCheck);
  unsureLabel.appendChild(imNotSure);
  unsureLabel.appendChild(showExplanation);
  questionTitleContainter.appendChild(questionTitle);
  if (knowledge.hasLearned(questionId))
    questionTitleContainter.appendChild(learnedTag);
  questionHeader.appendChild(questionTitleContainter);
  questionHeader.appendChild(unsureLabel);

  // body
  const questionBody = document.createElement("p");
  questionBody.className = "question-body";
  questionBody.innerHTML = questionData.question;

  // image (if exists)
  let image;
  if (questionData.hasImage) {
    image = document.createElement("figure");
    const img = document.createElement("img");
    img.setAttribute("src", `./data/images/${questionId}.png`);
    image.appendChild(img);
  }
  const questionImage = image;

  // choices
  const questionChoices = document.createElement("ul");
  questionChoices.className = "question-choices";
  choices.forEach(([choiceId, choiceData]) => {
    const choice = document.createElement("li");
    const choiceLabel = document.createElement("label");
    const choiceInput = document.createElement("input");
    const choiceText = document.createElement("span");

    choice.className = choiceData.isCorrect ? "correct" : "incorrect";
    choiceInput.id = choiceId;
    choiceInput.className = "choice-input";
    choiceInput.type = questionData.multiSelect ? "checkbox" : "radio";
    choiceInput.name = questionId;

    choiceText.innerHTML = choiceData.choice;

    choiceLabel.appendChild(choiceInput);
    choiceLabel.appendChild(choiceText);
    choice.appendChild(choiceLabel);
    questionChoices.appendChild(choice);
  });

  // explanation
  const explanationContainer = document.createElement("div");
  const explanation = document.createElement("div");
  const editBtn = document.createElement("i");
  const editingIndicator = document.createElement("i");

  explanationContainer.className = "explanation-container";
  explanation.className = "explanation";
  explanation.write = (value) => {
    if (value) {
      explanation.classList.remove("empty");
      explanation.innerHTML = value;
    } else {
      explanation.classList.add("empty");
      explanation.innerHTML = placeholderExplanation;
    }
  };
  explanation.write(questionData.explanation);
  editBtn.className = "bx bx-edit";
  editBtn.title = "edit";
  if (matchMedia("not all and (hover: none)").matches) {
    editBtn.classList.add("bx-tada-hover");
  }
  editBtn.addEventListener("click", () => editExplanation(explanation));
  editingIndicator.className = "bx bx-loader bx-spin";
  editingIndicator.title = "someone is typing";

  explanationContainer.appendChild(explanation);
  explanationContainer.appendChild(editBtn);
  explanationContainer.appendChild(editingIndicator);

  // question
  const question = document.createElement("div");
  question.id = questionId;
  question.className = "question";
  if (attemptData) {
    question.setAttribute("recoverable", true);
  }
  question.addEventListener(
    "animationend",
    () => (question.style.animation = "")
  );
  // the selector is cursed because the question id starts with a number
  // it's too inconvenient to change that now
  const questionSelector = `#\\3${questionId[0]} ${questionId.slice(1)}`;
  question.next = function (selector = "") {
    return quizPage.querySelector(`${questionSelector} ~ .question${selector}`);
  };
  question.previous = function (selector = "") {
    if (!selector) {
      return quizPage.querySelector(`.question:has(+${question.selector})`);
    }
    const candidates = quizPage.querySelectorAll(
      `.question${selector}:has(~${questionSelector})`
    );
    return candidates[candidates.length - 1];
  };
  question.scrollTo = () => {
    question.scrollIntoView(true);
    scrollBy(0, -0.55 * navbar.offsetHeight);
    if (reviewPanel.style.display != "none") {
      scrollBy(0, -navbar.offsetHeight);
    }
    // scrolling sets questionsScroller.current = null
    // so we wait 400ms for the scroll to finish, avoiding the race condition
    setTimeout(() => (questionsScroller.current = question), 400);
    return question;
  };
  question.blink = () => {
    question.style.animation = "blink 1s";
    return question;
  };

  question.appendChild(questionHeader);
  question.appendChild(questionBody);
  if (questionData.hasImage) {
    question.appendChild(questionImage);
  }
  question.appendChild(questionChoices);
  question.appendChild(explanationContainer);
  return question;
}

function updateAttemptsTable() {
  const tableRows = attemptsTable.querySelectorAll(".row");

  if (tableRows.length >= pastAttempts.length) {
    if (tableRows.length > pastAttempts.length) {
      Array.from(tableRows)
        .slice(pastAttempts.length - tableRows.length)
        .forEach((row) => row.remove());
    }
    return;
  }

  pastAttempts
    .slice(tableRows.length - pastAttempts.length)
    .forEach((attempt) => {
      const score = attempt.score;
      const outOf = attempt.outOf;
      const accuracy = score / (outOf + Number.EPSILON);
      const roundedAccuracy = Math.round((accuracy + Number.EPSILON) * 100);
      const [H, S, L] = getColor(accuracy);

      const row = document.createElement("tr");
      const timestamp = document.createElement("td");
      const modules = document.createElement("td");
      const duration = document.createElement("td");
      const result = document.createElement("td");
      const resultScore = document.createElement("span");
      const resultPercentage = document.createElement("span");

      timestamp.className = "timestamp";
      timestamp.setAttribute("value", attempt.timestamp);
      timestamp.addEventListener("click", () => {
        document
          .getElementById("quiz")
          .replaceWith(generatePastAttempt(attempt.data));
        toQuizPage();
        showResult(score, outOf);
        navText.innerText = attempt.duration;
      });

      modules.className = "modules";
      modules.innerText = attempt.modules;

      duration.className = "duration";
      duration.innerText = attempt.duration;

      resultScore.className = "score";
      resultScore.innerText = `${score}/${outOf}`;

      resultPercentage.className = "percentage";
      resultPercentage.innerText = ` (${roundedAccuracy}%)`;

      result.className = "result";
      result.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
      if (darkModeToggle.checked) {
        result.style.color = L < 61 ? "#eee" : "#000";
      }
      result.appendChild(resultScore);
      result.appendChild(resultPercentage);

      row.className = "row";
      row.setAttribute("exam", attempt.exam);
      row.setAttribute("modules", attempt.modules);
      row.appendChild(timestamp);
      row.appendChild(modules);
      row.appendChild(duration);
      row.appendChild(result);
      attemptsTable.querySelector("tbody").appendChild(row);
    });
  refreshAttemptsTable();
}

function updateCoverage() {
  const modules = homePage.querySelector("#modules-list");
  if (!modules.querySelector("li")) return; // if module list hasn't been generated

  let coveredTotal = 0;
  let sizeTotal = 0;

  // stat for each module
  for (const module of modules.querySelectorAll("li:not(:last-child)")) {
    const moduleNum = module.querySelector("input").id;
    const moduleCoverage = module.querySelector(".coverage");

    const covered = knowledge.sizeOf(moduleNum);
    const size = Object.keys(questionsData[moduleNum]).length;
    coveredTotal += covered;
    sizeTotal += size;

    if (covered == 0 || size == 0) {
      hide(moduleCoverage);
      continue;
    }

    const coverage = covered / (size + Number.EPSILON);
    const roundedCoverage = Math.round((coverage + Number.EPSILON) * 100);
    const [H, S, L] = getColor(coverage);

    moduleCoverage.innerText = `${roundedCoverage}%`;
    moduleCoverage.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
    if (darkModeToggle.checked) {
      moduleCoverage.style.color = L < 61 ? "#eee" : "#000";
    } else {
      moduleCoverage.style.color = "";
    }
    unhide(moduleCoverage);
  }

  // stat for "All of them!"
  const moduleAllCoverage = modules.querySelector("li:last-child .coverage");

  if (modules.querySelector("li:not(:last-child) .coverage:not([visible])")) {
    hide(moduleAllCoverage);
    return;
  }

  const coverage = coveredTotal / (sizeTotal + Number.EPSILON);
  const roundedCoverage = Math.round((coverage + Number.EPSILON) * 100);
  const [H, S, L] = getColor(coverage);

  moduleAllCoverage.innerText = `${roundedCoverage}%`;
  moduleAllCoverage.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
  if (darkModeToggle.checked) {
    moduleAllCoverage.style.color = L < 61 ? "#eee" : "#000";
  } else {
    moduleAllCoverage.style.color = "";
  }
  unhide(moduleAllCoverage);

  if (roundedCoverage == 100) {
    licenseGrantException(
      "Congrats, you've learned 100% of the question bank! 🥳"
    );
  }
}
