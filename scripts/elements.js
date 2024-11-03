const resultPanel = document.getElementById("result-panel");
const quizResultText = document.getElementById("quiz-result");
const [prevQuest, nextQuest] = resultPanel.getElementsByTagName("box-icon");
const navbar = document.getElementById("navbar");
const navText = navbar.getElementsByTagName("span")[0];
const [homeButon, nextButton] = navbar.getElementsByTagName("box-icon");
navText.style.width = getComputedStyle(navText).width;
const homePage = document.getElementById("home-page");
const quizPage = document.getElementById("quiz-page");
const licenseNotice = document.getElementById("license-notice");
const licenceAgreeBtn = document.getElementById("license-agree-btn");
const licenseDisagreeBtn = document.getElementById("license-disagree-btn");
const pastResultsContainer = document.getElementById("past-results");
const form = document.getElementById("form");
const moduleGroupSelection = document.getElementById("moduleGroup-selection");
const midtermChoice = document.getElementById("midterm");
const finalChoice = document.getElementById("final");
const moduleSelection = document.getElementById("module-selection");
const questionBankSelection = document.getElementById("questionBank-selection");
const AIChoice = document.getElementById("AI");
const LHChoice = document.getElementById("LH");
const questionNumChoice = document.getElementById("questionNumChoice");
const oldTestament = document.getElementById("old-testament");
const newTestament = document.getElementById("new-testament");

homePage.hide = () => (homePage.style.display = "none");
homePage.unhide = () => (homePage.style.display = "");

quizPage.hide = () => (quizPage.style.display = "none");
quizPage.unhide = () => (quizPage.style.display = "");

resultPanel.hide = () => {
  resultPanel.style.display = "none";
  _removeTopMargin();
};
resultPanel.unhide = () => {
  resultPanel.style.display = "";
  _addTopMargin();
};

navbar.hide = () => {
  navbar.style.display = "none";
  _removeBottomMargin();
};
navbar.unhide = () => {
  navbar.style.display = "";
  _addBottomMargin();
};

function removeElementById(id) {
  if (document.contains(document.getElementById(id))) {
    document.getElementById(id).remove();
  }
}

function _removeTopMargin() {
  const margin = parseFloat(getComputedStyle(homePage).marginLeft.slice(0, 2));
  homePage.style.marginTop = (2 / 3) * margin + "px";
  quizPage.style.marginTop = (2 / 3) * margin + "px";
}

function _addTopMargin() {
  const margin = parseFloat(getComputedStyle(homePage).marginLeft.slice(0, 2));
  const panelHeight = parseFloat(getComputedStyle(navbar).height.slice(0, -2));
  const newMargin = (2 / 3) * margin + panelHeight;
  homePage.style.marginTop = newMargin + "px";
  quizPage.style.marginTop = newMargin + "px";
}

function _removeBottomMargin() {
  const margin = parseFloat(getComputedStyle(homePage).marginLeft.slice(0, 2));
  homePage.style.marginBottom = (2 / 3) * margin + "px";
  quizPage.style.marginBottom = (2 / 3) * margin + "px";
}

function _addBottomMargin() {
  const margin = parseFloat(getComputedStyle(homePage).marginLeft.slice(0, 2));
  const panelHeight = parseFloat(getComputedStyle(navbar).height.slice(0, -2));
  const newMargin = (2 / 3) * margin + panelHeight;
  homePage.style.marginBottom = newMargin + "px";
  quizPage.style.marginBottom = newMargin + "px";
}
