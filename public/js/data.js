const app = firebase.initializeApp({
  apiKey: "AIzaSyDV3TrfynzF0c_L-GYsG1Wd9NrIOjNvKJI",
  authDomain: "project-2830218475636260000.firebaseapp.com",
  projectId: "project-2830218475636260000",
  storageBucket: "project-2830218475636260000.firebasestorage.app",
  messagingSenderId: "85405487202",
  appId: "1:85405487202:web:208def2286c1f22c03c13b",
});
const db = firebase.firestore();

let modulesName;
function loadData() {
  return fetch("/modules")
    .then((res) => res.json())
    .then((data) => (modulesName = data));
}

function getQuiz() {
  let exam = midtermChoice.checked ? "0" : "1";
  let modules = "";
  for (const box of modulesSelectBoxes) {
    modules += box.checked ? "1" : "0";
  }
  let banks = (LHChoice.checked ? "1" : "0") + (AIChoice.checked ? "1" : "0");
  let count = questionsCountChoice.value;
  return fetch(
    `/quiz?` +
      `exam=${exam}&` +
      `modules=${modules}&` +
      `banks=${banks}&` +
      `count=${count}`
  ).then((res) => res.json());
}

function getAnswers(quiz) {
  const submission = [];
  for (const input of quiz.querySelectorAll(".choice-input")) {
    submission.push({
      questionId: input.id.split(".").slice(0, 3).join("."),
      choiceId: input.id.split(".")[3],
      checked: input.checked,
    });
  }

  return fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  }).then((res) => res.json());
}

function resolveQuiz(quiz) {
  const submission = [];
  for (const question of quiz.querySelectorAll(".question")) {
    if (question.getAttribute("correct") == "false") {
      submission.push({
        id: question.id,
        isKnown: false,
      });
    } else if (!question.hasAttribute("unsure")) {
      submission.push({
        id: question.id,
        isKnown: true,
      });
    }
  }
  fetch("/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
}

function explain(question) {
  if (!explainChoice.checked) return;

  const questionId = question.id;
  const doc = db.collection("explain").doc(questionId);
  doc.onSnapshot((snapshot) => {
    const explanation = question.querySelector(".explanation");
    if (explanation.tagName.toLowerCase() == "textarea") return;

    const explanationText = snapshot.data()?.explanation ?? "";
    const editing = snapshot.data()?.editing;

    if (editing == null) explanation.classList.remove("editing");
    else {
      const expiring = editing + 90000; // 90 seconds timeout
      const now = Date.now();
      if (expiring <= now) editSignal(questionId, false);
      else {
        explanation.classList.add("editing");
        setTimeout(() => editSignal(questionId, false), expiring - now);
      }
    }
    explanation.write(explanationText);
    giveExplanationDisclaimer(explanationText);
  });
}

function submitExplanation(questionId, questionText, explanationText) {
  const doc = db.collection("explain").doc(questionId);
  if (explanationText) {
    return doc.set({ question: questionText, explanation: explanationText });
  } else {
    return doc.delete();
  }
}

function editSignal(questionId, isEditing) {
  const doc = db.collection("explain").doc(questionId);
  if (isEditing) {
    doc.set({ editing: Date.now() }, { merge: true });
  } else {
    doc.update({ editing: firebase.firestore.FieldValue.delete() });
  }
}
