function shuffle(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isNumber(object) {
  return !isNaN(object);
}

function shuffleChoices(choices) {
  if (["True", "Yes"].includes(choices[0][1].choice)) {
    return;
  }
  if (choices.every((choiceData) => isNumber(choiceData[1].choice))) {
    return;
  }
  shuffle(choices);
}

function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getColor(accuracy) {
  accuracy *= 100;
  const H = (5 / 4) * Math.max(accuracy - 20, 0);
  const S = 80;
  const L = 50 + (1 / 3) * (Math.min(accuracy + 40, 100) - 40);
  return [H, S, L];
}

function nearestElement(collection) {
  const margin = 32;
  const position = (e) => e.getBoundingClientRect().top - margin;
  const elements = Array.from(collection);

  return {
    next: function () {
      const elementsAhead = elements.filter(
        (e) => position(e) > navbar.offsetHeight + 1
      );
      if (elementsAhead.length > 0) {
        return elementsAhead[0];
      }
      return elements[elements.length - 1];
    },

    previous: function () {
      const elementsBehind = elements.filter((e) => position(e) < 0);
      if (elementsBehind.length > 0) {
        return elementsBehind[elementsBehind.length - 1];
      }
      return elements[0];
    },
  };
}

function initializeHeight(textarea) {
  const tempDiv = document.createElement("div");
  tempDiv.style.fontSize = getComputedStyle(textarea).fontSize;
  tempDiv.style.fontFamily = getComputedStyle(textarea).fontFamily;
  tempDiv.style.display = "inline-block";
  tempDiv.style.width = getComputedStyle(textarea).width;
  tempDiv.style.position = "absolute";
  tempDiv.style.top = 0;
  tempDiv.style.left = 0;
  tempDiv.innerText = textarea.value;
  document.body.appendChild(tempDiv);

  const targetHeight = getComputedStyle(tempDiv).height;
  textarea.style.height = `max(4rem, calc(${targetHeight} + 4.4px))`; // no idea what 4.4px is, but it works
  tempDiv.remove();

  const form = textarea.parentElement;
  const textHeight = textarea.offsetHeight;
  const btnHeight = form.querySelector("button").offsetHeight;
  form.style.height = `calc(4px + ${btnHeight}px + ${textHeight}px)`;
}

function humanize(timestamp) {
  const thatDate = new Date(parseInt(timestamp));
  const thisDate = new Date();
  const diff = Math.floor((thisDate.getTime() - timestamp) / 1000);

  if (diff < 7200) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes != 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3660);
    return `${hours} hour${hours != 1 ? "s" : ""} ago`;
  }

  const year = thatDate.getFullYear();
  const month = MONTHS[thatDate.getMonth()];
  const date = thatDate.getDate();
  const hours = String(thatDate.getHours()).padStart(2, "0");
  const minutes = String(thatDate.getMinutes()).padStart(2, "0");

  if (year == thisDate.getFullYear()) {
    return `${month} ${date}, ${hours}:${minutes}`;
  }
  return `${year} ${month} ${date}, ${hours}:${minutes}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
