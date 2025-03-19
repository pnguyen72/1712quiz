const urlParams = new URLSearchParams(window.location.search);
const filterByUser = urlParams.get("user");
const attemptID = urlParams.get("attempt");

async function submitToLeaderboard(attemptData) {
    await loadFirebase();
    if (!leaderboardDB) return;

    function betterThan(attempt1, attempt2) {
        const grade1 = attempt1.score / attempt1.outOf;
        const grade2 = attempt2.score / attempt2.outOf;

        if (grade1 != grade2) return grade1 > grade2;

        const speed1 = attempt1.speed;
        const speed2 = attempt2.speed;

        if (speed1 != speed2) return speed1 > speed2;

        const timestamp1 = attempt1.timestamp;
        const timestamp2 = attempt2.timestamp;

        return timestamp1 > timestamp2;
    }

    leaderboardDB
        .where("user", "==", attemptData.user)
        .where("modules", "==", attemptData.modules)
        .limit(1)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                // user + timestamp is just a convenient way to create a unique ID,
                // it's does not necessarily reflect the actual user or timestamp of the attempt
                const attemptID = `${attemptData.user}_${attemptData.timestamp}`;
                leaderboardDB.doc(attemptID).set(attemptData);
            } else {
                snapshot.forEach(
                    (doc) =>
                        betterThan(attemptData, doc.data()) &&
                        doc.ref.set(attemptData)
                );
            }
        });
}

async function updateLeaderboard() {
    await loadFirebase();
    if (!leaderboardDB) return;

    const exam = getSelectedExam();
    const modules = getSelectedModules();

    let query = leaderboardDB;
    if (modules.length > 0) {
        query = query.where(
            "modules",
            "==",
            modules.map((x) => parseInt(x)).join(", ")
        );
    } else {
        query = query.where("exam", "==", exam);
    }
    if (filterByUser) {
        query = query.where("user", "==", filterByUser);
    }
    query
        .orderBy("grade", "desc")
        .orderBy("outOf", "desc")
        .orderBy("speed", "desc")
        .limit(20)
        .onSnapshot((snapshot) => {
            attemptsTable
                .querySelectorAll(".row")
                .forEach((row) => row.remove());

            snapshot.forEach((doc) => {
                const attempt = doc.data();

                const score = attempt.score;
                const outOf = attempt.outOf;
                const accuracy = score / (outOf + Number.EPSILON);
                const roundedAccuracy = Math.round(
                    (accuracy + Number.EPSILON) * 100
                );
                const [H, S, L] = getColor(accuracy);

                const row = document.createElement("tr");
                const user = document.createElement("td");
                const timestamp = document.createElement("td");
                const modules = document.createElement("td");
                const duration = document.createElement("td");
                const result = document.createElement("td");
                const resultScore = document.createElement("span");
                const resultPercentage = document.createElement("span");

                user.className = "user";
                user.innerText = attempt.user;
                user.addEventListener("click", () =>
                    open("/leaderboard.html?user=" + attempt.user)
                );

                timestamp.className = "timestamp";
                timestamp.setAttribute("value", attempt.timestamp);
                timestamp.addEventListener("click", () =>
                    open("/leaderboard.html?attempt=" + doc.id)
                );

                modules.className = "modules";
                modules.innerText = attempt.modules;

                duration.className = "duration";
                duration.innerText = attempt.duration;

                resultScore.className = "score";
                resultScore.innerText = `${score}/${outOf}`;

                resultPercentage.className = "percentage";
                resultPercentage.innerText = ` (${roundedAccuracy}%)`;

                result.className = "result";
                result.style.backgroundColor = `hsla(${H}, ${S}%, ${L}%, ${0.75})`;
                if (darkModeToggle.checked) {
                    result.style.color = L < 61 ? "#eee" : "#000";
                }
                result.appendChild(resultScore);
                result.appendChild(resultPercentage);

                row.className = "row";
                row.setAttribute("exam", attempt.exam);
                row.setAttribute("modules", attempt.modules);
                row.appendChild(user);
                row.appendChild(timestamp);
                row.appendChild(modules);
                row.appendChild(duration);
                row.appendChild(result);
                attemptsTable.querySelector("tbody").appendChild(row);
            });

            refreshAttemptsTable();
        });
}

if (location.pathname == "/leaderboard.html") {
    if (!attemptID) {
        form.removeEventListener("input", refreshAttemptsTable);
        form.addEventListener("input", updateLeaderboard);
        loadModulesNames().then(initalizeSelections);
    } else {
        toQuizPage();
    }
}
