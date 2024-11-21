const resultPanel = document.getElementById("result-panel");
const quizResultText = document.getElementById("quiz-result");
const [prevQuest, nextQuest] = resultPanel.getElementsByTagName("box-icon");
const navbar = document.getElementById("navbar");
const navText = navbar.querySelector("span");
const [homeButon, nextButton] = navbar.getElementsByTagName("box-icon");
navText.style.width = getComputedStyle(navText).width;
const homePage = document.getElementById("home-page");
const quizPage = document.getElementById("quiz-page");
const licenseNotice = document.getElementById("license-notice");
const licenseText = document.getElementById("license-text");
const licenceAgreeBtn = document.getElementById("license-agree-btn");
const licenseDisagreeBtn = document.getElementById("license-disagree-btn");
//prettier-ignore
const attemptsTableContainer = document.getElementById("attempts-table-container");
const attemptsTable = document.getElementById("attempts-table");
const form = document.getElementById("form");
const examSelection = document.getElementById("exam-selection");
const midtermChoice = document.getElementById("midterm");
const finalChoice = document.getElementById("final");
const moduleSelection = document.getElementById("module-selection");
//prettier-ignore
const questionBankSelection = document.getElementById("question-bank-selection");
const AIChoice = document.getElementById("AI");
const LHChoice = document.getElementById("LH");
const questionsCountChoice = document.getElementById("questions-count-choice");
//prettier-ignore
const explainSelection = document.getElementById("explain-selection");
const explainChoice = document.getElementById("explain");
