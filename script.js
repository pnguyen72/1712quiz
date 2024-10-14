const modules = {}
for (let i = 0; i < 6; i++) {
    fetch(`./data/quiz-data${i + 1}.json`)
        .then((response) => response.json())
        .then((json) => modules[i] = json);
}

const welcomePage = document.getElementById("welcome-page");
const quizPage = document.getElementById("quiz-page");
const quizSelectionForm = document.getElementById("quiz-selection");
const selectAllBox = document.getElementById("moduleALL")
const moduleSelectBox = [
    document.getElementById("module1"),
    document.getElementById("module2"),
    document.getElementById("module3"),
    document.getElementById("module4"),
    document.getElementById("module5"),
    document.getElementById("module6"),
]

function hideElement(element) {
    element.style.display = "none";
}

function showElement(element) {
    element.style.display = "initial";
}

hideElement(quizPage);

function selectAll() {
    moduleSelectBox.forEach((element) => element.checked = selectAllBox.checked);
}

function selectOther() {
    selectAllBox.checked = false;
}

let quiz = {};

function startQuiz() {
    hideElement(welcomePage);
    showElement(quizPage);
    for (let i = 0; i < 6; i++) {
        if (moduleSelectBox[i].checked) {
            quiz = { ...quiz, ...modules[i] }
        }
    }
    quiz = Object.entries(quiz)
    console.log(quiz)
}

function returnHome() {
    hideElement(quizPage);
    showElement(welcomePage);
    quizSelectionForm.reset();
    quiz = {};
}