const root = document.querySelector(":root");
const navbar = document.getElementById("navbar");
const attempt = document.getElementById("attempt");
const homePage = document.getElementById("home-page");
const quizPage = document.getElementById("quiz-page");
const licensePanel = document.getElementById("license-panel");
const resultPanel = document.getElementById("result-panel");
const pastResultsContainer = document.getElementById("past-results");
const nextButton = document.getElementById("next-btn");
const homeButon = document.getElementById("return-btn");
const form = document.getElementById("form");
const moduleSelection = document.getElementById("module-selection");
const questionBankSelection = document.getElementById("questionBank-selection");
const AIChoice = document.getElementById("AI");
const LHChoice = document.getElementById("LH");
const questionNumChoice = document.getElementById("questionNumChoice");
const moduleSelectBoxes = [];

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

licensePanel.hide = () => {
  licensePanel.style.display = "none";
  _removeBottomMargin();
};
licensePanel.unhide = () => {
  licensePanel.style.display = "";
  _addBottomMargin();
};

function removeElementById(id) {
  if (document.contains(document.getElementById(id))) {
    document.getElementById(id).remove();
  }
}

function _removeTopMargin() {
  homePage.style.marginTop = "1rem";
  quizPage.style.marginTop = "1rem";
}

function _addTopMargin() {
  const margin = parseFloat(getComputedStyle(root).fontSize.slice(0, 2));
  const panelHeight = parseFloat(
    getComputedStyle(resultPanel).height.slice(0, -2)
  );
  const newMargin = margin + panelHeight;
  homePage.style.marginTop = newMargin + "px";
  quizPage.style.marginTop = newMargin + "px";
}

function _removeBottomMargin() {
  const margin = parseFloat(getComputedStyle(root).fontSize.slice(0, 2));
  const panelHeight = parseFloat(
    getComputedStyle(licensePanel).height.slice(0, -2)
  );
  const newMargin = margin + panelHeight;
  homePage.style.marginBottom = newMargin + "px";
  quizPage.style.marginBottom = newMargin + "px";
}

function _addBottomMargin() {
  const margin = parseFloat(getComputedStyle(root).fontSize.slice(0, 2));
  const panelHeight = parseFloat(
    getComputedStyle(licensePanel).height.slice(0, -2)
  );
  const newMargin = margin + panelHeight * 2;
  homePage.style.marginBottom = newMargin + "px";
  quizPage.style.marginBottom = newMargin + "px";
}
