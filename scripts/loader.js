var db = null;
var converter = null;

function loadFirebase() {
  if (db || typeof firebaseConfig == "undefined") return;
  db = true;

  return Promise.all([
    fetch("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js")
      .then((res) => res.text())
      .then((firebaseSrc) => eval?.(firebaseSrc)),
    fetch(
      "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"
    ).then((res) => res.text()),
  ])
    .then(([_, firestoreSrc]) => eval?.(firestoreSrc))
    .then(() => {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore().collection("1712");
    });
}

function loadShowdown() {
  if (converter) return;
  converter = true;

  fetch("https://unpkg.com/showdown@2.1.0/dist/showdown.min.js")
    .then((res) => res.text())
    .then((src) => eval?.(src))
    .then(() => (converter = new showdown.Converter()));
}

function loadExplanationResources() {
  loadFirebase();
  loadShowdown();
}
