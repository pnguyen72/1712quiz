function generateModuleSelection() {
  /*
    <ul id="modulesList">
      <li>
        <label> 
          <input type="checkbox"/>
          <span> Module #: ... </span>
        </label>
      </li>
    </ul>
  */
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
  /*
    <div id="quiz">
      <div id="Q#" class="question"> ... </div>
    </div>
  */

  div = document.createElement("div");
  div.id = "quiz";
  div.className = "unsubmitted";
  data.forEach((question, index) =>
    div.appendChild(generateQuestion(question, index))
  );
  return div;
}

function generateQuestion(question, qIndex) {
  /*
    <div id="Q#" class="question">
      <p class="questionText"> 
        <b> Question #. </b> ... 
      </p>

      <!-- if question includes image -->
      <figure> 
        <img src="...">
      <figure>
    
      <ul>
        <li class="correct/incorrect">
          <label for="Q#/#"> 
            <input type="radio/checkbox" name="Q#">
            <span> ... </span> 
          </label> 
        </li>
      </ul>

      <div class="explanation-container">
        <p class="explanation">...</p>
        <button>edit</button>
      </div>
    </div>
  */

  const [questionText, questionInfo] = question;
  const choices = Object.entries(questionInfo.choices);
  arrange(choices);
  const isMultiSelect = questionInfo.multi_select;

  const div = document.createElement("div");
  div.id = "Q" + (qIndex + 1);
  div.setAttribute("class", "question");

  const p = document.createElement("p");
  p.addEventListener("click", () => toggleMarkQuestionUnsure(div));
  p.title = "mark question as unsure";
  p.className = "questionText";

  const b = document.createElement("b");
  b.className = "questionTitle";
  b.appendChild(document.createTextNode(`Question ${qIndex + 1}.`));
  const questionBody = document.createElement("span");
  questionBody.className = "questionBody";
  questionBody.innerHTML = questionText;
  p.appendChild(b);
  p.innerHTML += " ";
  p.appendChild(questionBody);

  div.appendChild(p);

  if (
    questionText ==
    "COMP 1712 is your favorite class. (You must answer correctly AND honestly!)"
  ) {
    div.classList.add("joke");
  }

  if (questionInfo.img) {
    figure = document.createElement("figure");
    img = document.createElement("img");
    img.setAttribute("src", "./data/images/" + questionInfo.img);
    figure.appendChild(img);
    div.appendChild(figure);
  }

  const ul = document.createElement("ul");
  choices.forEach((choice) => {
    const [choiceText, isCorrect] = choice;

    const li = document.createElement("li");
    li.className = isCorrect ? "correct" : "incorrect";

    const label = document.createElement("label");

    const input = document.createElement("input");
    input.type = isMultiSelect ? "checkbox" : "radio";
    input.name = `Q${qIndex + 1}`;

    const span = document.createElement("span");
    span.innerHTML = choiceText;

    label.appendChild(input);
    label.appendChild(span);

    li.appendChild(label);

    ul.appendChild(li);
  });
  div.appendChild(ul);

  const container = document.createElement("div");
  container.className = "explanation-container";
  const explanation = document.createElement("p");
  explanation.className = "explanation";
  explanation.write = (value) => {
    if (value) {
      explanation.classList.remove("empty");
      explanation.innerHTML = value;
    } else {
      explanation.classList.add("empty");
      explanation.innerHTML = placeholderExplanation;
    }
    return value;
  };

  const editBtn = document.createElement("i");
  editBtn.className = "bx bx-edit";
  editBtn.title = "edit";
  if (matchMedia("not all and (hover: none)").matches) {
    editBtn.className += " bx-tada-hover";
  }
  editBtn.addEventListener("click", () => editExplanation(explanation));
  container.appendChild(explanation);
  container.appendChild(editBtn);
  div.appendChild(container);

  div.addEventListener("animationend", () => (div.style.animation = ""));
  div.scrollTo = () => {
    div.scrollIntoView(true);
    scrollBy(0, -0.75 * navbar.offsetHeight);
    if (resultPanel.style.display != "none") {
      scrollBy(0, -navbar.offsetHeight);
    }
    return div;
  };
  div.blink = () => (div.style.animation = "blink 1s");
  div.explain = () => {
    getExplanation(questionBody.innerHTML)
      .then(explanation.write)
      .then(giveExplanationDisclaimer);
  };
  return div;
}

function generateResultsTable() {
  /*
    <table id="result-table">
      <tr>
        <th> Attempt </th>
        <th> Result </th>
      </tr>
      <tr>
        <td> # </td>
        <td> ...% </td>
      </tr>
    </table>
    */
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
