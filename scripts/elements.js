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
const pastResultsContainer = document.getElementById("past-results");
const form = document.getElementById("form");
const examSelection = document.getElementById("exam-selection");
const midtermChoice = document.getElementById("midterm");
const finalChoice = document.getElementById("final");
const moduleSelection = document.getElementById("module-selection");
//prettier-ignore
const questionBankSelection = document.getElementById("question-bank-selection");
const AIChoice = document.getElementById("AI");
const LHChoice = document.getElementById("LH");
const questionNumChoice = document.getElementById("questions-num-choice");

homePage.hide = () => (homePage.style.display = "none");
homePage.unhide = () => (homePage.style.display = "");

quizPage.hide = () => (quizPage.style.display = "none");
quizPage.unhide = () => (quizPage.style.display = "");

resultPanel.hide = () => {
  resultPanel.style.display = "none";
  resultPanel.removeAttribute("visible");
};
resultPanel.unhide = () => {
  resultPanel.style.display = "";
  resultPanel.setAttribute("visible", "");
};

navbar.hide = () => {
  navbar.style.display = "none";
  navbar.removeAttribute("visible");
};
navbar.unhide = () => {
  navbar.style.display = "";
  navbar.setAttribute("visible", "");
};

function removeElementById(id) {
  if (document.contains(document.getElementById(id))) {
    document.getElementById(id).remove();
  }
}
