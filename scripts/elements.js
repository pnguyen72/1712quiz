const navbar = document.getElementById("navbar");
const navText = navbar.getElementsByTagName("span")[0];
navText.style.width = getComputedStyle(navText).width;
const homePage = document.getElementById("home-page");
const quizPage = document.getElementById("quiz-page");
const licenseNotice = document.getElementById("license-notice");
const licenceAgreeBtn = document.getElementById("license-agree-btn");
const licenseDisagreeBtn = document.getElementById("license-disagree-btn");
const pastResultsContainer = document.getElementById("past-results");
const nextButton = document.getElementById("next-btn");
const homeButon = document.getElementById("return-btn");
const form = document.getElementById("form");
const moduleGroupSelection = document.getElementById("moduleGroup-selection");
const midtermChoice = document.getElementById("midterm");
const moduleSelection = document.getElementById("module-selection");
const questionBankSelection = document.getElementById("questionBank-selection");
const AIChoice = document.getElementById("AI");
const LHChoice = document.getElementById("LH");
const questionNumChoice = document.getElementById("questionNumChoice");

homePage.hide = () => (homePage.style.display = "none");
homePage.unhide = () => (homePage.style.display = "");

quizPage.hide = () => (quizPage.style.display = "none");
quizPage.unhide = () => (quizPage.style.display = "");

navbar.hide = () => {
  navbar.style.display = "none";
  _removeBottomMargin();
};
navbar.unhide = () => {
  navbar.style.display = "";
  _addBottomMargin();
};
navbar.setColor = (color) => {
  navText.style.color = color;
  homeButon.setAttribute("color", color);
  nextButton.setAttribute("color", color);
};

function removeElementById(id) {
  if (document.contains(document.getElementById(id))) {
    document.getElementById(id).remove();
  }
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
