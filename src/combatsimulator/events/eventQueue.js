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

    clearEventsForUnit(unit) {
        let clearedQueue = [];

        for (let i = 0; i < this.queue.length; i++) {
            let event = this.queue[i];

            if (event.source == unit || event.target == unit) {
                continue;
            }

            clearedQueue.push(event);
        }

        this.queue = clearedQueue;
    }
}

export default EventQueue;
