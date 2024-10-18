const navbar = document.getElementById("navbar");
const attempt = document.getElementById("attempt");
const homePage = document.getElementById("home-page");
const quizPage = document.getElementById("quiz-page");
const footer = document.getElementById("footer");
const license = document.getElementById("license");
const pastResultsContainer = document.getElementById("past-results");
const nextButton = document.getElementById("next-btn");
const submitButton = document.getElementById("submit-btn");
const homeButon = document.getElementById("return-btn");
const form = document.getElementById("form");
const moduleSelection = document.getElementById("module-selection");
const questionBankSelection = document.getElementById("questionBank-selection");
const AIChoice = document.getElementById("AI");
const LHChoice = document.getElementById("LH");
const questionNumChoice = document.getElementById("questionNumChoice");
const moduleSelectBoxes = []

function hideElement(element) {
    element.style.display = "none";
}

function showElement(element) {
    element.style.display = "flex";
}

function removeElementById(id) {
    if (document.contains(document.getElementById(id))) {
        document.getElementById(id).remove();
    }
}
hideElement(quizPage);
hideElement(submitButton);


const modules = []
let quizData = [];
let pastResults = [];
let attemptsCount = 0;
let formChanged = false;

moduleSelection.addEventListener("animationend", () => moduleSelection.style.animation = "initial");
form.addEventListener("input", () => formChanged = true);

generateModuleSelection();

homeButon.addEventListener('click', () => {
    removeElementById("quiz");
    removeElementById("result");
    removeElementById("result-table");
    if (pastResults.length > 0) {
        pastResultsContainer.appendChild(generateResultsTable());
    }
    if (homePage.style.display != "none") {
        form.reset()
        formChanged = false;
    }
    footer.style.backgroundColor = "initial";
    attempt.style.visibility = "hidden";
    hideElement(submitButton);
    hideElement(quizPage);
    showElement(license);
    showElement(nextButton);
    showElement(homePage);
});

nextButton.addEventListener("click", () => {
    attempt.innerText = `Attempt ${attemptsCount + 1}`;

    let questionsNum = questionNumChoice.value;
    if (questionsNum == "ALL") {
        questionsNum = 100000;
    }
    if (formChanged || quizData.length < questionsNum) {
        if (moduleSelectBoxes.every(box => !box.checked)) {
            moduleSelection.style.animation = "blink 1s";
            return;
        }
        if (!AIChoice.checked && !LHChoice.checked) {
            questionBankSelection.style.animation = "blink 1s";
            return;
        }
        populateData();
        formChanged = false;
    }
    let data = quizData.slice(0, questionsNum);

    removeElementById("quiz");
    removeElementById("result");
    quizPage.appendChild(generateQuiz(data));
    scrollTo(0, 0);

    footer.style.backgroundColor = "initial";
    attempt.style.visibility = "visible";
    hideElement(nextButton);
    hideElement(homePage);
    hideElement(license);
    showElement(submitButton);
    showElement(quizPage);
});

submitButton.addEventListener("click", () => {
    let forceSubmit = false;

    const quiz = document.getElementById("quiz");
    const questions = quiz.getElementsByClassName("question");
    let correctAnswers = 0;
    for (let question of questions) {
        let isAnswered = forceSubmit;
        let isCorrect = true;
        for (let choice of question.getElementsByTagName("li")) {
            input = choice.getElementsByTagName("input")[0];
            isAnswered = isAnswered || input.checked || input.type == "checkbox";
            if (!((choice.className == "correct") == input.checked)) {
                isCorrect = false;
            }
        }
        if (!isAnswered) {
            question.scrollIntoView();
            scrollBy(0, -1.33 * navbar.offsetHeight);
            if (!confirm("There are unanswered question(s). Submit anyway?")) {
                question.style.animation = "blink 1s";
                return;
            }
            forceSubmit = true;
        }
        if (isCorrect) {
            ++correctAnswers;
        } else {
            question.className += " incorrect"
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

    p = document.createElement("p");
    p.id = "result";
    const accuracy = 100 * correctAnswers / questions.length;
    pastResults.push(accuracy);
    const roundedNumber = Math.round((accuracy + Number.EPSILON) * 100) / 100;
    resultText = `${correctAnswers}/${questions.length} (${roundedNumber}%)`;
    p.appendChild(document.createTextNode(resultText));
    footer.appendChild(p);
    footer.style.backgroundColor = getColor(accuracy);
    quiz.setAttribute("class", "submitted");
    scrollTo(0, 0);

    ++attemptsCount;
    attempt.style.visibility = "visible";
    hideElement(submitButton);
    showElement(nextButton);
});



function populateData() {
    quizData = {}
    for (let i = 0; i < modules.length; i++) {
        if (moduleSelectBoxes[i].checked) {
            if (LHChoice.checked) {
                quizData = { ...quizData, ...modules[i]["LH"] }
            }
            if (AIChoice.checked) {
                quizData = { ...quizData, ...modules[i]["AI"] }
            }
        }
    }
    quizData = Object.entries(quizData)
    shuffle(quizData);
}

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
                modules[index] = {}
                fetch(`./data/module${index + 1}.json`)
                    .then((response) => response.json())
                    .then((data) => modules[index]["LH"] = data);
                fetch(`./data/module${index + 1}.ai.json`)
                    .then((response) => response.json())
                    .then((data) => modules[index]["AI"] = data);

                const li = document.createElement("li");
                const label = document.createElement("label");

                const input = document.createElement("input");
                input.type = "checkbox";
                input.addEventListener("click", () => document.getElementById("moduleALLSelect").checked = false);
                moduleSelectBoxes.push(input)

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
            input.id = "moduleALLSelect"
            input.addEventListener("click", () => moduleSelectBoxes.forEach(
                (element) => element.checked = input.checked
            ));

            const span = document.createElement("span");
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
    div = document.createElement("div")
    div.id = "quiz"
    data.forEach((question, questionIndex) => {
        div.appendChild(generateQuestion(question, questionIndex))
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
    const choices = Object.entries(question[1].choices)
    const isMultiSelect = question[1].multi_select;

    if (choices[0][0] != "True") {
        shuffle(choices);
    }

    const div = document.createElement("div");
    div.id = "Q" + questionIndex;
    div.setAttribute("class", "question");

    const p = document.createElement("p")

    const title = document.createElement("b");
    title.appendChild(document.createTextNode("Question " + (questionIndex + 1) + "."));
    p.appendChild(title);
    p.appendChild(document.createTextNode(" " + questionText));
    div.appendChild(p)

    const ul = document.createElement("ul");
    choices.forEach((choice, choiceIndex) => {
        const [choiceText, isCorrect] = choice;

        const li = document.createElement("li");
        li.className = isCorrect ? "correct" : "incorrect"

        const label = document.createElement("label");

        const input = document.createElement("input")
        input.type = isMultiSelect ? "checkbox" : "radio";
        input.name = `Q${questionIndex + 1}`;

        const span = document.createElement("span")
        span.appendChild(document.createTextNode(choiceText));

        label.appendChild(input);
        label.appendChild(span);

        li.appendChild(label);

        ul.appendChild(li);
    });
    div.appendChild(ul);
    div.addEventListener("animationend", () => div.style.animation = "initial");
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
        tr.appendChild(th)
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
        tr.style.backgroundColor = getColor(accuracy, 0.75)
        table.appendChild(tr);
    });

    return table;
}

function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        --currentIndex;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

function getColor(accuracy, A = 1) {
    const H = 4 / 3 * Math.max(accuracy - 25, 0);
    const S = 85;
    const L = 45 + 20 / 100 * 4 / 3 * (Math.min(accuracy + 25, 100) - 25);
    return `hsla(${H}, ${S}%, ${L}%, ${A})`;
}