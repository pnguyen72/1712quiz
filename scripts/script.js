const modules = []
for (let i = 0; i < 6; i++) {
    fetch(`./data/quiz-data${i + 1}.json`)
        .then((response) => response.json())
        .then((data) => modules[i] = data);
}

const navbar = document.getElementById("navbar");
const homePage = document.getElementById("home-page");
const quizPage = document.getElementById("quiz-page");
const resultPanel = document.getElementById("result-panel");
const pastResultsContainer = document.getElementById("past-results");
const nextButton = document.getElementById("next-btn");
const submitButton = document.getElementById("submit-btn");
const homeButon = document.getElementById("return-btn");
const form = document.getElementById("form");
const moduleSelection = document.getElementById("module-selection");
const questionNumChoice = document.getElementById("questionNumChoice");
const moduleAllSelectBox = document.getElementById("moduleAllSelectBox")
const moduleSelectBoxes = [
    document.getElementById("module1SelectBox"),
    document.getElementById("module2SelectBox"),
    document.getElementById("module3SelectBox"),
    document.getElementById("module4SelectBox"),
    document.getElementById("module5SelectBox"),
    document.getElementById("module6SelectBox"),
]

function hideElement(element) {
    element.style.display = "none";
}

function showElement(element) {
    element.style.display = "flex";
}

hideElement(quizPage);
hideElement(submitButton)
hideElement(resultPanel);

moduleSelection.addEventListener("animationend", () => moduleSelection.style.animation = "initial");

function selectAll() {
    moduleSelectBoxes.forEach(
        (element) => element.checked = moduleAllSelectBox.checked
    );
}

function selectOther() {
    moduleAllSelectBox.checked = false;
}

let quizData = [];
let pastResults = [];
let currentIndex = 0;

homeButon.addEventListener('click', (event) => {
    quizData = [];
    currentIndex = 0;

    quizPage.childNodes.forEach((element) => element.remove());
    resultPanel.childNodes.forEach((element) => element.remove());
    resultPanel.childNodes.forEach((element) => element.remove());
    pastResultsContainer.childNodes.forEach((element) => element.remove());
    if (pastResults.length > 0) {
        pastResultsContainer.appendChild(generateResultsTable());
    }
    if (submitButton.style.display == "none") {
        form.reset()
    }

    hideElement(submitButton);
    hideElement(quizPage);
    hideElement(resultPanel);
    showElement(nextButton);
    showElement(homePage);
});

nextButton.addEventListener("click", (event) => {
    const questionsNum = questionNumChoice.value;
    if (questionsNum == "ALL" || currentIndex + questionsNum >= quizData.length) {
        currentIndex = 0;

        var isChecked = false;
        quizData = {};
        for (let i = 0; i < 6; i++) {
            if (moduleSelectBoxes[i].checked) {
                isChecked = true;
                quizData = { ...quizData, ...modules[i] }
            }
        }
        quizData = Object.entries(quizData)
        shuffle(quizData);

        if (!isChecked) {
            moduleSelection.style.animation = "blink 1s";
            return;
        } else if (quizData.length == 0) {
            alert("Unable to fetch data.");
            return;
        }
    }

    let data = quizData
    if (questionsNum != "ALL") {
        data = quizData.slice(currentIndex, currentIndex + questionsNum);
        currentIndex += questionsNum;
    }

    quizPage.childNodes.forEach((element) => element.remove());
    resultPanel.childNodes.forEach((element) => element.remove());
    quizPage.appendChild(generateQuiz(data));
    scrollTo(0, 0);

    hideElement(nextButton);
    hideElement(homePage);
    hideElement(resultPanel);
    showElement(submitButton);
    showElement(quizPage);
});

submitButton.addEventListener("click", (event) => {
    let forceSubmit = false;

    const quiz = document.getElementById("quiz");
    const questions = quiz.getElementsByClassName("question");
    let correctAnswers = 0;
    for (let question of questions) {
        let isAnswered = forceSubmit;
        let isCorrect = true;
        for (let choice of question.getElementsByTagName("input")) {
            isAnswered = isAnswered || choice.checked || choice.type == "checkbox";
            if (!((choice.className == "correct") == choice.checked)) {
                isCorrect = false;
            }
        }
        if (!isAnswered) {
            question.style.animation = "blink 1s";
            question.scrollIntoView();
            scrollBy(0, -1.33 * navbar.offsetHeight);
            if (!confirm("There are unanswered question(s). Submit anyway?")) {
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

    p = document.createElement("p");
    const accuracy = 100 * correctAnswers / questions.length;
    pastResults.push(accuracy);
    resultText = `${correctAnswers}/${questions.length} (${accuracy.toFixed(1)}%)`;
    p.appendChild(document.createTextNode(resultText));
    resultPanel.appendChild(p);
    resultPanel.style.backgroundColor = getColor(accuracy);
    quiz.setAttribute("class", "submitted");
    scrollTo(0, 0);

    hideElement(submitButton);
    showElement(nextButton);
    showElement(resultPanel);
});



function populateData() {
    quizData = {};
    for (let i = 0; i < 6; i++) {
        if (moduleSelectBoxes[i].checked) {
            quizData = { ...quizData, ...modules[i] }
        }
    }
    quizData = Object.entries(quizData)
    shuffle(quizData);
}

function generateQuiz(data) {
    /*
    <div id="quiz">
      <h1> Attempt # <h1/>
      <div id="Q#" class="question"> ... <div/>
    <div/>
    */
    div = document.createElement("div")
    div.id = "quiz"

    heading = document.createElement("h1")
    heading.appendChild(document.createTextNode(`Attempt ${pastResults.length + 1}`));
    div.appendChild(heading);

    data.forEach((question, questionIndex) => {
        div.appendChild(generateQuestion(question, questionIndex))
    });
    return div;
}

function generateQuestion(question, questionIndex) {
    /*
    <div id="Q#" class="question">
      <p> 
        <b> Question #. <b/> ... 
      <p/>
      <ul>
        <li>
            <input type="radio/checkbox" id="Q#/#" class="correct/incorrect">
            <label for="Q#/#"> ... <label/> 
        <li/>
      <ul/>
    <div/>
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
        const choiceText = choice[0];
        const isCorrect = choice[1];

        const li = document.createElement("li");

        const input = document.createElement("input")
        input.type = isMultiSelect ? "checkbox" : "radio";
        input.name = "Q" + questionIndex;
        input.id = "Q" + questionIndex + "/" + choiceIndex;
        input.setAttribute("class", isCorrect ? "correct" : "incorrect");
        li.appendChild(input);

        const label = document.createElement("label");
        label.setAttribute("for", input.id);
        label.appendChild(document.createTextNode(choiceText));
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
        <th> Attempt <th/>
        <th> Result <th/>
      <tr/>
      <tr>
        <td> # <td/>
        <td> ...% <td/>
      <tr/>
    <table/>
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
            td.appendChild(document.createTextNode(`${accuracy.toFixed(1)}%`));
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
    const S = 80;
    const L = 40 + 3 / 10 * accuracy;
    return `hsla(${H}, ${S}%, ${L}%, ${A})`
}