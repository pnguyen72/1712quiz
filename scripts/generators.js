function generateModuleSelection() {
  /*
    <ul>
      <li>
        <label> 
          <input type="checkbox"/>
          <span> Module #: ... </span>
        </label>
      </li>
    </ul>
  */

  const ul = document.createElement("ul");
  fetch("./data/modules.json")
    .then((response) => response.json())
    .then((moduleList) => {
      moduleList.forEach((moduleName, index) => {
        modules[index] = {};
        fetch(`./data/LH/module${index + 1}.json`)
          .then((response) => response.json())
          .then((data) => (modules[index]["LH"] = data));
        fetch(`./data/AI/module${index + 1}.json`)
          .then((response) => response.json())
          .then((data) => (modules[index]["AI"] = data));

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
        const title = `Module ${index + 1}: ${moduleName}`;
        span.appendChild(document.createTextNode(title));

        label.appendChild(input);
        label.appendChild(span);

        li.append(label);
        ul.appendChild(li);
      });

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
    });
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
  data.forEach((question, questionIndex) => {
    div.appendChild(generateQuestion(question, questionIndex));
  });
  return div;
}

function generateQuestion(question, questionIndex) {
  /*
    <div id="Q#" class="question">
      <p> 
        <b> Question #. </b> ... 
      </p>
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

  const questionText = question[0];
  const choices = Object.entries(question[1].choices);
  const isMultiSelect = question[1].select_all_that_apply;

  if (choices[0][0] != "True") {
    shuffle(choices);
  }

  const div = document.createElement("div");
  div.id = "Q" + questionIndex;
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

  const ul = document.createElement("ul");
  choices.forEach((choice, choiceIndex) => {
    const [choiceText, isCorrect] = choice;

    const li = document.createElement("li");
    li.className = isCorrect ? "correct" : "incorrect";

    const label = document.createElement("label");

    const input = document.createElement("input");
    input.type = isMultiSelect ? "checkbox" : "radio";
    input.name = `Q${questionIndex + 1}`;

    const span = document.createElement("span");
    span.appendChild(document.createTextNode(choiceText));

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
