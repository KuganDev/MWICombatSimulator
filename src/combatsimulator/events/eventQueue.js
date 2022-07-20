import Heap from "heap-js";

class EventQueue {
    constructor() {
        this.minHeap = new Heap((a, b) => a.time - b.time);
    }

    addEvent(event) {
        this.minHeap.push(event);
    }

    getNextEvent() {
        return this.minHeap.pop();
    }

    clear() {
        this.minHeap = new Heap((a, b) => a.time - b.time);
    }

    clearEventsForUnit(unit) {
        let heapEvents = this.minHeap.toArray();

        for (const event of heapEvents) {
            if (event.source == unit || event.target == unit) {
                this.minHeap.remove(event);
            }
        }
    }
}

export default EventQueue;
