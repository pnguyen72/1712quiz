let pastAttempts = [];
let disagreeNum = localStorage.getItem("disagree") ?? 0;
const disagreeTarget = 16; // how many times user must click "no" for to be granted the exception
let modulesSelectBoxes = [];
var quizTimer;
const placeholderExplanation = `No explanation available. <span id="placeholder-expansion">Why don't you add one?</span>`;

const storedPastAttempts = localStorage.getItem("pastAttempts");
if (storedPastAttempts) {
  pastAttempts = JSON.parse(storedPastAttempts);
}
