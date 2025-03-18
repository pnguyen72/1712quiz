var db = null;
var userDB = null;
var leaderboardDB = null;
var converter = null;

var firebaseLoading = Promise.resolve();
function loadFirebase() {
    if (db || typeof firebaseConfig == "undefined") return firebaseLoading;
    db = true;

    firebaseLoading = Promise.all([
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
            let firestore = firebase.firestore();
            db = firestore.collection("1712");
            userDB = firestore.collection("users");
            leaderboardDB = firestore.collection("1712-leaderboard");
        });
    return firebaseLoading;
}

var showdownLoading = Promise.resolve();
function loadShowdown() {
    if (converter) return showdownLoading;
    converter = true;

    showdownLoading = fetch(
        "https://unpkg.com/showdown@2.1.0/dist/showdown.min.js"
    )
        .then((res) => res.text())
        .then((src) => eval?.(src))
        .then(() => (converter = new showdown.Converter()));
    return showdownLoading;
}

function loadResources() {
    return Promise.all([loadFirebase(), loadShowdown()]);
}
