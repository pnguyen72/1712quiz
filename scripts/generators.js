function generateModuleSelection() {
  modulesSelectBoxes = [];

  let indexOffset;
  let modulesData;
  if (midtermChoice.checked) {
    indexOffset = 1;
    modulesData = modulesName.midterm;
  } else {
    indexOffset = 1 + modulesName.midterm.length;
    modulesData = modulesName.final;
  }

  const modulesList = document.createElement("ul");
  modulesList.id = "modules-list";
  document.getElementById("modules-list").replaceWith(modulesList);

  modulesData.forEach((name, index) => {
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

function generateQuiz(quizData) {
  const quiz = document.createElement("div");
  quiz.id = "quiz";
  quiz.setAttribute("submitted", false);
  quizData.forEach(([id, data], index) =>
    quiz.appendChild(generateQuestion(id, data, index))
  );
  return setupQuiz(quiz);
}

function generateAttempt(attemptData) {
  const quiz = document.createElement("div");
  quiz.id = "quiz";
  quiz.setAttribute("submitted", true);
  Object.entries(attemptData).forEach(([questionId, choices], index) => {
    const questionData = getQuestion(questionId);
    const question = generateQuestion(questionId, questionData, index);
    quiz.appendChild(question);
    Object.entries(choices).forEach(([choiceId, isChecked]) => {
      const input = question.querySelector(`#${choiceId}`);
      input.checked = isChecked;
      input.disabled = true;
    });
  });
  setupQuiz(quiz);
  for (const learnedTag of quiz.querySelectorAll(".learned-tag")) {
    learnedTag.remove();
  }
  for (const input of quiz.querySelectorAll(".choice-input"))
    input.disabled = true;
  grade(quiz.querySelectorAll(".question"));
  return quiz;
}

function generateQuestion(questionId, questionData, questionIndex) {
  const module = questionId.split("_")[0];
  const questionText = questionData.question;
  const hasImage = questionData.hasImage;
  const isMultiSelect = questionData.multiSelect;
  const choices = Object.entries(questionData.choices);
  shuffleChoices(choices);

  const question = document.createElement("div");
  question.id = questionId;
  question.className = "question";

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
  imNotSure.className = "im-not-sure";
  imNotSure.innerText = "I'm not sure";
  showExplanation.className = "show-explanation";
  showExplanation.innerText = "Show explanation";
  unsureCheck.type = "checkbox";

  unsureLabel.appendChild(unsureCheck);
  unsureLabel.appendChild(imNotSure);
  unsureLabel.appendChild(showExplanation);
  questionTitleContainter.appendChild(questionTitle);
  if (modulesData[module].isLearned(questionId))
    questionTitleContainter.appendChild(learnedTag);
  questionHeader.appendChild(questionTitleContainter);
  questionHeader.appendChild(unsureLabel);
  question.appendChild(questionHeader);

  // body
  const questionBody = document.createElement("p");
  questionBody.className = "question-body";
  questionBody.innerHTML = questionText;
  question.appendChild(questionBody);

  // figure
  if (hasImage) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.setAttribute("src", `./data/images/${questionId}.png`);
    figure.appendChild(image);
    question.appendChild(figure);
  }

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
    choiceInput.type = isMultiSelect ? "checkbox" : "radio";
    choiceInput.name = questionId;
    choiceText.innerHTML = choiceData.choice;

    choiceLabel.appendChild(choiceInput);
    choiceLabel.appendChild(choiceText);
    choice.appendChild(choiceLabel);
    questionChoices.appendChild(choice);
  });
  question.appendChild(questionChoices);

  // explanation
  const explanationContainer = document.createElement("div");
  const explanation = document.createElement("div");
  const editBtn = document.createElement("i");
  const editingIndicator = document.createElement("i");

  explanationContainer.className = "explanation-container";
  explanation.className = "explanation empty";
  editBtn.className = "bx bx-edit";
  editBtn.title = "edit";
  editingIndicator.className = "bx bx-loader bx-spin";
  editingIndicator.title = "someone is typing";

  explanationContainer.appendChild(explanation);
  explanationContainer.appendChild(editBtn);
  explanationContainer.appendChild(editingIndicator);
  question.appendChild(explanationContainer);

  return question;
}

function setupQuiz(quiz) {
  quiz.setAttribute("explain", explainChoice.checked);
  for (const question of quiz.getElementsByClassName("question")) {
    question.addEventListener(
      "animationend",
      () => (question.style.animation = "")
    );
    question.scrollTo = () => {
      question.scrollIntoView(true);
      scrollBy(0, -0.55 * navbar.offsetHeight);
      if (resultPanel.style.display != "none") {
        scrollBy(0, -navbar.offsetHeight);
      }
      return question;
    };
    question.blink = () => (question.style.animation = "blink 1s");

    const unsureCheck = question.querySelector(".unsure-check");
    unsureCheck.addEventListener("input", () => toggleUnsure(question));

    const explanation = question.querySelector(".explanation");
    explanation.write = (value) => {
      if (value) {
        explanation.classList.remove("empty");
        explanation.innerHTML = value;
      } else {
        explanation.classList.add("empty");
        explanation.innerHTML = placeholderExplanation;
      }
    };
    const editBtn = question.querySelector(".bx-edit");
    if (matchMedia("not all and (hover: none)").matches) {
      editBtn.classList.add("bx-tada-hover");
    }
    editBtn.addEventListener("click", () => editExplanation(explanation));
  }
  return quiz;
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
    .forEach((attempt, index) => {
      const score = attempt.score;
      const outOf = attempt.outOf;
      const accuracy = score / (outOf + Number.EPSILON);
      const roundedAccuracy = Math.round((accuracy + Number.EPSILON) * 100);
      const [H, S, L] = getColor(accuracy);

      const row = document.createElement("tr");
      const attemptNum = document.createElement("td");
      const modules = document.createElement("td");
      const result = document.createElement("td");

      attemptNum.className = "attempt";
      attemptNum.innerText = tableRows.length + index + 1;
      attemptNum.addEventListener("click", () => {
        toQuizPage();
        document
          .getElementById("quiz")
          .replaceWith(generateAttempt(attempt.data));
        showResult(score, outOf);
        navText.innerText = `Attempt ${attemptNum.innerText}`;
      });

      modules.className = "modules";
      modules.innerText = attempt.modules;

      result.className = "result";
      result.innerText = `${score}/${outOf} (${roundedAccuracy}%)`;
      result.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
      if (darkModeToggle.checked) {
        result.style.color = L < 61 ? "#eee" : "#000";
      }

      row.className = "row";
      row.setAttribute("modules", attempt.modules);
      row.appendChild(attemptNum);
      row.appendChild(modules);
      row.appendChild(result);
      attemptsTable.querySelector("tbody").appendChild(row);
    });
  filterAttemptsTable();
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

    const questions = modulesData[moduleNum];
    const covered = questions.covered.size;
    const size = questions.size;
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
    licenseGrantException("You've reached 100% coverage. Great job! 🥳");
  }
}
