if (!matchMedia("(hover: none)").matches) {
    document
        .querySelectorAll(".bx")
        .forEach((icon) => icon.classList.add("bx-tada-hover"));
}

async function updateLeaderboard() {
    await loadFirebase();
    if (!leaderboardDB) return;

    leaderboardDB
        .where("grade", ">=", 5)
        .orderBy("grade", "desc")
        .orderBy("speed", "desc")
        .onSnapshot((snapshot) => {
            attemptsTable
                .querySelectorAll(".row")
                .forEach((row) => row.remove());

            snapshot.forEach((data) => {
                const attempt = data.data();

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
                    open(
                        "/leaderboard.html?attempt=" +
                            attempt.user +
                            attempt.timestamp
                    )
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

loadModulesNames().then(initalizeSelections);
updateLeaderboard();
