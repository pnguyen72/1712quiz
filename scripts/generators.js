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
  modulesData = [];
  moduleSelectBoxes = [];

  const ul = document.createElement("ul");
  ul.id = "modulesList";
  const promise = fetch("./data/modules.json")
    .then((response) => response.json())
    .then((modulesGroups) => {
      let indexOffset;
      if (midtermChoice.checked) {
        indexOffset = 1;
        modulesList = modulesGroups.midterm;
      } else {
        indexOffset = 1 + modulesGroups.midterm.length;
        modulesList = modulesGroups.final;
      }
      modulesList.forEach((moduleName, index) => {
        modulesData[index] = {};
        fetch(`./data/LH/module${index + indexOffset}.json`)
          .then((response) => response.json())
          .then((data) => (modulesData[index]["LH"] = data));
        fetch(`./data/AI/module${index + indexOffset}.json`)
          .then((response) => response.json())
          .then((data) => (modulesData[index]["AI"] = data));

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
        const title = `Module ${index + indexOffset}: ${moduleName}`;
        span.appendChild(document.createTextNode(title));

        label.appendChild(input);
        label.appendChild(span);

        li.append(label);
        ul.appendChild(li);
      });

      if (modulesList.length == 1) {
        moduleSelectBoxes[0].checked = true;
      } else if (modulesList.length >= 2) {
        const li = document.createElement("li");
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = "moduleALLSelect";
        input.addEventListener("click", () =>
          moduleSelectBoxes.forEach(
            (element) => (element.checked = input.checked)
          )
        );

        const span = document.createElement("span");
        span.style.fontWeight = "bold";
        span.appendChild(document.createTextNode("All of them!"));

        label.appendChild(input);
        label.appendChild(span);

        li.append(label);
        ul.appendChild(li);
      }
    });

  moduleSelection.append(ul);
  return promise;
}

function generateQuiz(data) {
  /*
    <div id="quiz">
      <div id="Q#" class="question"> ... </div>
    </div>
  */

  div = document.createElement("div");
  div.id = "quiz";
  data.forEach((question, index) =>
    div.appendChild(generateQuestion(question, index))
  );
  return div;
}

function generateQuestion(question, questionIndex) {
  /*
    <div id="Q#" class="question">
      <p> 
        <b> Question #. </b> ... 
      </p>

      // if question contains image
      <figure> 
        <img src="...">
      <figure>
    
      <ul>
        <li class="correct/incorrect">
          <label for="Q#/#"> 
            <input type="radio/checkbox" id="Q#/#">
            <span> .. </span> 
          </label> 
        </li>
      </ul>
    </div>
  */

  const [questionText, questionInfo] = question;
  const choices = Object.entries(questionInfo.choices);
  const isMultiSelect = questionInfo.select_all_that_apply;

  if (choices[0][0] != "True" && isNaN(choices[0][0])) {
    shuffle(choices);
  }

  const div = document.createElement("div");
  div.id = "Q" + (questionIndex + 1);
  div.setAttribute("class", "question");

  const p = document.createElement("p");

  const title = document.createElement("b");
  title.appendChild(
    document.createTextNode("Question " + (questionIndex + 1) + ".")
  );
  p.appendChild(title);
  p.appendChild(document.createTextNode(" " + questionText));
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
    img.setAttribute("src", "./data/resources/" + questionInfo.img);
    figure.appendChild(img);
    div.appendChild(figure);
  }

  const ul = document.createElement("ul");
  choices.forEach((choice) => {
    const [choiceText, choiceInfo] = choice;
    const isCorrect = choiceInfo.isCorrect;
    const reason = choiceInfo.reason;

    const li = document.createElement("li");
    li.className = isCorrect ? "correct" : "incorrect";

    const label = document.createElement("label");

    const help = document.createElement("span");
    help.className = "help";
    if (!reason) {
      help.style.visibility = "hidden";
    } else {
      let toggle = true;
      help.addEventListener("click", () => {
        if (toggle) {
          span.innerHTML = reason;
          span.style.fontStyle = "italic";
        } else {
          span.innerHTML = choiceText;
          span.style.fontStyle = "normal";
        }
        toggle = !toggle;
      });
    }
    help.appendChild(document.createTextNode("?"));

    const input = document.createElement("input");
    input.type = isMultiSelect ? "checkbox" : "radio";
    input.name = `Q${questionIndex + 1}`;

    const span = document.createElement("span");
    span.appendChild(document.createTextNode(choiceText));

    label.appendChild(help);
    label.appendChild(input);
    label.appendChild(span);

    li.appendChild(label);

    ul.appendChild(li);
  });
  div.appendChild(ul);
  div.addEventListener("animationend", () => (div.style.animation = ""));
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
      const roundedNumber = Math.round((accuracy + Number.EPSILON) * 100) / 100;
      td.appendChild(document.createTextNode(`${roundedNumber}%`));
      tr.appendChild(td);
    }
    tr.style.backgroundColor = getColor(accuracy, 0.75);
    table.appendChild(tr);
  });

  return table;
}
