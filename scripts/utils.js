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

function getColor(accuracy) {
  accuracy *= 100;
  const H = (8 / 5) * Math.max(accuracy - 25, 0);
  const S = 80;
  const L = 45 + (((25 / 100) * 4) / 3) * (Math.min(accuracy + 25, 100) - 25);
  return [H, S, L];
}

function search(collection, item, map = (i) => i) {
  function binarySearch() {
    const mappedCollection = [...collection].map(map);

    let start = 0;
    let end = collection.length - 1;

    while (start <= end) {
      let mid = Math.floor((start + end) / 2);

      if (mappedCollection[mid] === item) {
        return { index: mid, exact: true };
      }

      if (item < mappedCollection[mid]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }
    return { index: start, exact: false };
  }

  const out = new Object();
  out.next = () => {
    const result = binarySearch();
    let index = result.index;
    if (result.exact) {
      ++index;
    }
    index = Math.max(Math.min(index, collection.length - 1), 0);
    return collection[index];
  };
  out.prev = () => {
    const result = binarySearch();
    let index = result.index - 1;
    index = Math.max(Math.min(index, collection.length - 1), 0);
    return collection[index];
  };
  return out;
}
