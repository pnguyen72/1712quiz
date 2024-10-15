const modules = []
for (let i = 0; i < 6; i++) {
    fetch(`./data/quiz-data${i + 1}.json`)
        .then((response) => response.json())
        .then((data) => modules[i] = data);
}

const welcomePage = document.getElementById("welcome-page");
const quizPage = document.getElementById("quiz-page");
const nextButton = document.getElementById("next-btn");
const submitButton = document.getElementById("submit-btn");
const homeButon = document.getElementById("return-btn");
const quizSelectionForm = document.getElementById("quiz-selection");
const questionNum = document.getElementById("questionNum");
const moduleAllSelectBox = document.getElementById("moduleAllSelectBox")
const moduleSelectBox = [
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
    element.style.display = "initial";
}

hideElement(quizPage);
hideElement(submitButton)

function selectAll() {
    moduleSelectBox.forEach((element) => element.checked = moduleAllSelectBox.checked);
}

function selectOther() {
    moduleAllSelectBox.checked = false;
}

let quizData = {};


homeButon.addEventListener('click', (event) => {
    showElement(nextButton);
    hideElement(quizPage);
    showElement(welcomePage);

    quizSelectionForm.reset();
    quizData = {};
    document.getElementById("quiz").remove();
});

nextButton.addEventListener("click", (event) => {
    for (let i = 0; i < 6; i++) {
        if (moduleSelectBox[i].checked) {
            quizData = { ...quizData, ...modules[i] }
        }
    }
    quizData = Object.entries(quizData)

    if (quizData.length == 0) return;

    hideElement(nextButton);
    hideElement(welcomePage);
    showElement(quizPage);

    shuffle(quizData)
    quizPage.appendChild(generateQuiz());
});

function shuffle(array) {
    if (array[0][0] == "True") return;

    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        --currentIndex;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}


function generateQuiz() {
    const number = questionNum.value
    if (number == "ALL") {
        sample = quizData
    } else {
        sample = quizData.slice(0, number);
    }

    div = document.createElement("div")
    div.id = "quiz"
    sample.forEach((question, questionIndex) => {
        div.appendChild(generateQuestion(question, questionIndex))
    });
    return div;
}

function generateQuestion(question, questionIndex) {
    const questionText = question[0];
    const choices = Object.entries(question[1].choices)
    const isMultiSelect = question[1].multi_select;

    const div = document.createElement("div");
    div.id = "question";

    const p = document.createElement("p")

    const title = document.createElement("b");
    title.appendChild(document.createTextNode("Question " + (questionIndex + 1) + ". "));
    p.appendChild(title);
    p.appendChild(document.createTextNode(questionText));
    div.appendChild(p)

    choices.forEach((choice, choiceIndex) => {
        const choiceText = choice[0];
        const isCorrect = choice[1];

        const input = document.createElement("input")
        input.type = isMultiSelect ? "checkbox" : "radio";
        input.name = "Q" + questionIndex;
        input.id = input.name + "/" + choiceIndex;
        input.setAttribute("class", isCorrect ? "correct" : "incorrect");
        div.appendChild(input);

        const label = document.createElement("label");
        label.setAttribute("for", input.id);
        label.setAttribute("class", isCorrect ? "correct" : "incorrect");
        label.appendChild(document.createTextNode(choiceText));
        div.appendChild(label);

        div.appendChild(document.createElement("br"));
        div.appendChild(document.createElement("br"));
    });

    return div;
}