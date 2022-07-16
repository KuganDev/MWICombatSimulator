class EventQueue {
    constructor() {
        // TODO: Replace with heap and check performance
        this.queue = [];
    }

    addEvent(event) {
        this.queue.push(event);
    }

    getNextEvent() {
        this.queue.sort((a, b) => a.time - b.time);

        return this.queue.shift();
    }

    clear() {
        this.queue = [];
    }
}

export default EventQueue;