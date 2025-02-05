let disagreeNum = localStorage.getItem("disagree") ?? 0;
const disagreeTarget = 8; // how many times user must click "no" for to be granted the exception
const placeholderExplanation = `No explanation available.
<span id="placeholder-expansion">Why don't you add one?</span>`;
