function generateModuleSelection() {
  modulesSelectBoxes = [];

  let indexOffset;
  let modulesData;
  if (midtermChoice.checked) {
    modulesData = Object.entries(modulesName.midterm);
  } else {
    modulesData = Object.entries(modulesName.final);
  }

  const modulesList = document.createElement("ul");
  modulesList.id = "modules-list";
  document.getElementById("modules-list").replaceWith(modulesList);

  modulesData.forEach(([index, name]) => {
    const module = document.createElement("li");
    const moduleLabel = document.createElement("label");
    const moduleSelectBox = document.createElement("input");
    const moduleTitle = document.createElement("span");
    const moduleCoverage = document.createElement("span");
    modulesSelectBoxes.push(moduleSelectBox);

    moduleTitle.innerHTML = `Module ${index}: ${name}`;
    moduleCoverage.className = "coverage";
    moduleSelectBox.id = `${String(index).padStart(2, "0")}`;
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

  if (modulesData.length < 2) {
    modulesSelectBoxes[0].checked = true;
  } else {
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
      modulesSelectBoxes.forEach(
        (box) => (box.checked = moduleSelectBox.checked)
      )
    );

    moduleLabel.appendChild(moduleSelectBox);
    moduleLabel.appendChild(moduleTitle);
    module.appendChild(moduleLabel);
    module.appendChild(moduleCoverage);
    modulesList.appendChild(module);
  }

  updateCoverage();
}

function generateQuiz(quizData) {
  const quiz = document.createElement("div");
  quiz.id = "quiz";
  quiz.setAttribute("submitted", false);
  quizData.forEach((data) => generateQuestion(quiz, data));
  return setupQuiz(quiz);
}

function generateQuestion(quiz, data) {
  const questionId = data.id;
  const questionText = data.question;
  const bank = data.bank;
  const hasImage = data.hasImage;
  const isKnown = data.isKnown;

  const existingQuestion = quiz.querySelector(
    `#${questionId.replaceAll(".", "\\.")}`
  );
  if (existingQuestion) {
    generateChoice(existingQuestion, data);
    return;
  }

  const question = document.createElement("div");
  question.id = questionId;
  question.className = "question";

  const tags = [];
  if (isKnown) {
    tags.push(`
      <span class="known-tag">
        <span class="txt">already learned</span>
        <i class='bx bxs-graduation'></i>
      </span>`);
    question.setAttribute("known", true);
  }
  if (bank == "AI") {
    tags.push(`
      <span class="AI-tag">
        <span class="txt">AI-generated</span>
        <i class='bx bxs-bot AI-tag'></i>
      </span>`);
    question.setAttribute("AI", true);
  }

  // header
  const questionHeader = document.createElement("div");
  const questionTitleContainter = document.createElement("span");
  const questionTitle = document.createElement("b");
  const questionTags = document.createElement("span");
  const unsureLabel = document.createElement("label");
  const unsureCheck = document.createElement("input");
  const imNotSure = document.createElement("span");
  const showExplanation = document.createElement("span");

  questionHeader.className = "question-header";
  questionTitle.className = "question-title";
  questionTitle.innerText = `Question ${
    quiz.querySelectorAll(".question").length + 1
  }.`;
  questionTags.className = "question-tags";
  questionTags.innerHTML = tags.join(`<span class="txt delimiter"> | </span>`);
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
  questionTitleContainter.appendChild(questionTags);
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
    image.setAttribute("src", `/img/${questionId}.png`);
    figure.appendChild(image);
    question.appendChild(figure);
  }

  // choices
  const questionChoices = document.createElement("ul");
  questionChoices.className = "question-choices";
  question.appendChild(questionChoices);
  generateChoice(question, data);

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
  quiz.appendChild(question);
}

function generateChoice(question, data) {
  const questionChoices = question.querySelector(".question-choices");
  const choice = document.createElement("li");
  const choiceLabel = document.createElement("label");
  const choiceInput = document.createElement("input");
  const choiceText = document.createElement("span");

  choiceInput.id = data.choiceId;
  choiceInput.className = "choice-input";
  choiceInput.type = data.multiSelect ? "checkbox" : "radio";
  choiceInput.name = question.id;
  choiceText.innerHTML = data.choice;

  choiceLabel.appendChild(choiceInput);
  choiceLabel.appendChild(choiceText);
  choice.appendChild(choiceLabel);
  questionChoices.appendChild(choice);
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

function generateAnswers(quiz) {
  return getAnswers(quiz)
    .then((res) => {
      for (const choice of res) {
        if (choice.isCorrect) {
          document
            .getElementById(choice.choiceId)
            .setAttribute("correct", true);
        }
      }
    })
    .then(() => {
      const questions = quiz.querySelectorAll(".question");
      let correctAnswers = 0;
      for (const question of questions) {
        let correctAnswer = true;

        for (let choice of question.getElementsByTagName("li")) {
          const input = choice.querySelector("input");
          if (input.hasAttribute("correct") != input.checked) {
            correctAnswer = false;
            break;
          }
        }

        question.setAttribute("correct", correctAnswer);
        if (correctAnswer) {
          ++correctAnswers;
          if (question.hasAttribute("unsure")) explain(question);
        } else {
          question.removeAttribute("unsure"); // not logically necessary, but makes css more convenient
          hide(question.querySelector(".unsure-label"));
          explain(question);
        }
      }
      return correctAnswers;
    });
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
      const banks = document.createElement("td");
      const modules = document.createElement("td");
      const result = document.createElement("td");

      attemptNum.className = "attempt";
      attemptNum.innerText = tableRows.length + index + 1;
      attemptNum.addEventListener("click", () => {
        toQuizPage();
        document.getElementById("quiz").outerHTML = attempt.quiz;
        setupQuiz(document.getElementById("quiz"));
        showResult(score, outOf);
        navText.innerText = `Attempt ${attemptNum.innerText}`;
        for (question of quizPage.querySelectorAll(
          ".question[correct=false], .question[unsure]"
        )) {
          explain(question);
        }
      });

      banks.className = "banks";
      banks.innerText = attempt.banks;

      modules.className = "modules";
      modules.innerText = attempt.modules;

      result.className = "result";
      result.innerText = `${score}/${outOf} (${roundedAccuracy}%)`;
      result.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
      if (darkModeToggle.checked) {
        result.style.color = L < 61 ? "#eee" : "#000";
      }

      row.className = "row";
      row.appendChild(attemptNum);
      row.appendChild(banks);
      row.appendChild(modules);
      row.appendChild(result);
      attemptsTable.querySelector("tbody").appendChild(row);
    });
}

function updateCoverage() {
  const modules = homePage.querySelector("#modules-list");
  if (!modules.querySelector("li")) {
    return; // if module list hasn't been generated
  }

  const banks = localStorage.getItem("banks") ?? "LH";
  const LH = banks.includes("LH");
  const AI = banks.includes("AI");
  const BANKS = (LH ? "1" : "0") + (AI ? "1" : "0");

  let knownTotal = 0;
  let totalTotal = 0;

  // stat for each module
  const promises = [];
  for (const module of modules.querySelectorAll("li:not(:last-child)")) {
    const MODULE = parseInt(module.querySelector("input").id);
    promises.push(
      fetch(`/coverage?module=${MODULE}&banks=${BANKS}&`)
        .then((res) => res.json())
        .then((questions) => {
          knownTotal += questions.known;
          totalTotal += questions.total;

          const moduleCoverage = module.querySelector(".coverage");
          if (questions.known == 0 || questions.total == 0) {
            hide(moduleCoverage);
            return;
          }

          const coverage = questions.known / (questions.total + Number.EPSILON);
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
        })
    );
  }

  // stat for "All of them!"
  Promise.all(promises).then(() => {
    const moduleAllCoverage = modules.querySelector("li:last-child .coverage");

    if (modules.querySelector("li:not(:last-child) .coverage:not([visible])")) {
      hide(moduleAllCoverage);
      return;
    }

    const coverage = knownTotal / (totalTotal + Number.EPSILON);
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
  });
}
