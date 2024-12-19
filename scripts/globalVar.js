let pastAttempts = [];
let disagreeNum = 0;
let modulesSelectBoxes = [];
var quizTimer;
const placeholderExplanation = `No explanation available. <span id="placeholder-expansion">Why don't you add one?</span>`;

const storedPastAttempts = localStorage.getItem("pastAttempts");
if (storedPastAttempts) {
  pastAttempts = JSON.parse(storedPastAttempts);
}

const storedDisagreeNum = localStorage.getItem("disagree");
if (storedDisagreeNum) {
  disagreeNum = parseInt(storedDisagreeNum);
}
