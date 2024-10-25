function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    --currentIndex;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

function getColor(accuracy, A = 1) {
  const H = (8 / 5) * Math.max(accuracy - 25, 0);
  const S = 80;
  const L = 45 + (((25 / 100) * 4) / 3) * (Math.min(accuracy + 25, 100) - 25);
  return `hsla(${H}, ${S}%, ${L}%, ${A})`;
}
