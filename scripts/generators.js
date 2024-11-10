function generateModuleSelection() {
  removeElementById("modulesList");
  moduleSelectBoxes = [];

  let indexOffset;
  let modulesList;
  if (midtermChoice.checked) {
    indexOffset = 1;
    modulesList = modulesName.midterm;
  } else {
    indexOffset = 1 + modulesName.midterm.length;
    modulesList = modulesName.final;
  }

  const ul = document.createElement("ul");
  ul.id = "modulesList";

  modulesList.forEach((name, index) => {
    const li = document.createElement("li");
    const label = document.createElement("label");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.addEventListener(
      "click",
      () => (document.getElementById("moduleALLSelect").checked = false)
    );
    moduleSelectBoxes.push(input);

    const span = document.createElement("span");
    const title = `Module ${index + indexOffset}: ${name}`;
    span.appendChild(document.createTextNode(title));

    label.appendChild(input);
    label.appendChild(span);

    li.append(label);
    ul.appendChild(li);
  });

  if (modulesList.length < 2) {
    moduleSelectBoxes[0].checked = true;
  } else {
    const li = document.createElement("li");
    const label = document.createElement("label");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = "moduleALLSelect";
    input.addEventListener("click", () =>
      moduleSelectBoxes.forEach((element) => (element.checked = input.checked))
    );

    const span = document.createElement("span");
    span.style.fontWeight = "bold";
    span.appendChild(document.createTextNode("All of them!"));

    label.appendChild(input);
    label.appendChild(span);

    li.append(label);
    ul.appendChild(li);
  }

  moduleSelection.append(ul);
}

function generateQuiz(data) {
  div = document.createElement("div");
  div.id = "quiz";
  div.className = "unsubmitted";
  data.forEach((question, index) =>
    div.appendChild(generateQuestion(question, index))
  );
  return div;
}

function generateQuestion(questionData, questionIndex) {
  const [questionText, questionInfo] = questionData;
  const choices = Object.entries(questionInfo.choices);
  arrange(choices);
  const isMultiSelect = questionInfo.multi_select;

  const question = document.createElement("div");
  question.id = "Q" + (questionIndex + 1);
  question.className = "question";

  const questionHeader = document.createElement("div");
  const questionTitle = document.createElement("b");
  const unsureLabel = document.createElement("label");
  const unsureCheck = document.createElement("input");
  const unsureText = document.createElement("span");

  questionHeader.className = "question-header";
  questionTitle.className = "question-title";
  questionTitle.innerText = `Question ${questionIndex + 1}.`;
  unsureLabel.className = "unsure-label";
  unsureLabel.title = "Mark question as unsure to review later";
  unsureCheck.className = "unsure-check";
  unsureText.className = "unsure-text";
  unsureText.innerText = "I'm not sure";
  unsureCheck.type = "checkbox";
  unsureCheck.addEventListener("input", () =>
    toggleMarkQuestionUnsure(question)
  );

  unsureLabel.appendChild(unsureCheck);
  unsureLabel.appendChild(unsureText);
  questionHeader.appendChild(questionTitle);
  questionHeader.appendChild(unsureLabel);
  question.appendChild(questionHeader);

  const questionBody = document.createElement("p");
  questionBody.className = "question-body";
  questionBody.innerHTML = questionText;
  question.appendChild(questionBody);

  if (
    questionText ==
    "COMP 1712 is your favorite class. (You must answer correctly AND honestly!)"
  ) {
    question.classList.add("joke");
  }

  if (questionInfo.img) {
    figure = document.createElement("figure");
    img = document.createElement("img");
    img.setAttribute("src", "./data/images/" + questionInfo.img);
    figure.appendChild(img);
    question.appendChild(figure);
  }

  const questionChoices = document.createElement("ul");
  questionChoices.className = "question-choices";
  choices.forEach((choice) => {
    const [choiceText, isCorrect] = choice;

    const li = document.createElement("li");
    li.className = isCorrect ? "correct" : "incorrect";

    const label = document.createElement("label");

    const choiceInput = document.createElement("input");
    choiceInput.className = "choice-input";
    choiceInput.type = isMultiSelect ? "checkbox" : "radio";
    choiceInput.name = `Q${questionIndex + 1}`;

    const span = document.createElement("span");
    span.innerHTML = choiceText;

    label.appendChild(choiceInput);
    label.appendChild(span);

    li.appendChild(label);

    questionChoices.appendChild(li);
  });
  question.appendChild(questionChoices);

  const container = document.createElement("div");
  container.className = "explanation-container";
  const explanation = document.createElement("div");
  // mark explanation empty by default,
  // because it takes a while for firebase to respond with an explanation,
  // it looks nicer this way
  explanation.className = "explanation empty";
  explanation.write = (value) => {
    if (value) {
      explanation.classList.remove("empty");
      explanation.innerHTML = value;
    } else {
      explanation.classList.add("empty");
      explanation.innerHTML = placeholderExplanation;
    }
  };

  const editBtn = document.createElement("i");
  editBtn.className = "bx bx-edit";
  editBtn.title = "edit";
  if (matchMedia("not all and (hover: none)").matches) {
    editBtn.className += " bx-tada-hover";
  }
  editBtn.addEventListener("click", () => editExplanation(explanation));
  const editingIndicator = document.createElement("i");
  editingIndicator.className = "bx bx-loader bx-spin";
  editingIndicator.title = "someone is typing";
  editingIndicator.style.animation = "spin 2s infinite linear";
  container.appendChild(explanation);
  container.appendChild(editBtn);
  container.appendChild(editingIndicator);
  question.appendChild(container);

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
  question.explain = () => getExplanation(questionBody.innerHTML);
  return question;
}

function generateResultsTable() {
  const table = document.createElement("table");
  table.id = "result-table";

  let tr = document.createElement("tr");
  {
    let th = document.createElement("th");
    th.appendChild(document.createTextNode("Attempt"));
    tr.appendChild(th);
  }
  {
    let th = document.createElement("th");
    th.appendChild(document.createTextNode("Result"));
    tr.appendChild(th);
  }
  table.appendChild(tr);

  pastResults.forEach((accuracy, attemptNum) => {
    let tr = document.createElement("tr");
    {
      let td = document.createElement("td");
      td.appendChild(document.createTextNode(attemptNum + 1));
      tr.appendChild(td);
    }
    {
      let td = document.createElement("td");
      const roundedNumber = Math.round((accuracy + Number.EPSILON) * 100);
      td.appendChild(document.createTextNode(`${roundedNumber}%`));
      tr.appendChild(td);
    }
    const [H, S, L] = getColor(accuracy);
    tr.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
    table.appendChild(tr);
  });

  return table;
}
