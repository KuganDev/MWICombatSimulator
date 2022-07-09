import { Test } from "./test"

onmessage = function (event) {
    let test = new Test();
    this.postMessage(test.value);
};
