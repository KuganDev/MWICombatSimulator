let button = document.querySelector("#button1");
let input = document.querySelector("#input1");

let worker = new Worker("src/worker.js");

button.onclick = function() {
    worker.postMessage(input.value);
}

worker.onmessage = function(event) {
    window.alert(event.data);
}