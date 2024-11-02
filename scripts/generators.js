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
    modulesList = modulesData.midterm;
  } else {
    indexOffset = 1 + modulesData.midterm.length;
    modulesList = modulesData.final;
  }

  const ul = document.createElement("ul");
  ul.id = "modulesList";

  modulesList.forEach((moduleData, index) => {
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
    const title = `Module ${index + indexOffset}: ${moduleData.name}`;
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

      <!-- if explanation is available -->
      <p class="explanation">...</p>
    </div>
  */

  const [questionText, questionInfo] = question;
  const choices = Object.entries(questionInfo.choices);
  const isMultiSelect = questionInfo.multi_select;

  if (choices[0][0] != "True" && isNaN(choices[0][0])) {
    shuffle(choices);
  }

  const div = document.createElement("div");
  div.id = "Q" + (qIndex + 1);
  div.setAttribute("class", "question");

  const abbr = document.createElement("abbr");
  abbr.addEventListener("click", () => toggleMarkQuestionUnsure(div));
  abbr.title = "mark question as unsure";
  abbr.className = "questionText";

  const b = document.createElement("b");
  b.className = "questionTitle";
  b.appendChild(document.createTextNode(`Question ${qIndex + 1}.`));
  const span = document.createElement("span");
  span.className = "questionBody";
  span.innerText = questionText;
  abbr.appendChild(b);
  abbr.innerHTML += " ";
  abbr.appendChild(span);

  div.appendChild(abbr);

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

  let explanation;
  if (questionInfo.explanation) {
    explanation = document.createElement("p");
    explanation.innerHTML = questionInfo.explanation;
  } else {
    explanation = document.createElement("button");
    explanation.innerText = placeholderExplanation;
  }
  explanation.className = "explanation";

  explanation.addEventListener("click", () => editExplanation(explanation));
  div.appendChild(explanation);

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
