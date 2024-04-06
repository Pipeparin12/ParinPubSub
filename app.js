"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// implementations
function bindMethods(instance, methodNames) {
    methodNames.forEach(methodName => {
        if (typeof instance[methodName] === 'function') {
            instance[methodName] = instance[methodName].bind(instance);
        }
    });
}

class PublishSubscribeService {
    constructor() {
        this.subscribers = {};
        bindMethods(this, ['subscribe', 'unsubscribe', 'publish']);
    }

    subscribe(type, handler) {
        if (!this.subscribers[type]) {
            this.subscribers[type] = [];
        }
        this.subscribers[type].push(handler);
    }

    unsubscribe(type, handler) {
        if (!this.subscribers[type]) {
            return;
        }
        this.subscribers[type] = this.subscribers[type].filter(subscriber => subscriber !== handler);
    }

    publish(event) {
        const subscribers = this.subscribers[event.type()] || [];
        subscribers.forEach(subscriber => subscriber.handle(event));
    }
}


class MachineSaleEvent {
    constructor(_sold, _machineId) {
        this._sold = _sold;
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    getSoldQuantity() {
        return this._sold;
    }
    type() {
        return 'sale';
    }
}
class MachineRefillEvent {
    constructor(_refill, _machineId) {
        this._refill = _refill;
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    getRefillQuantity() {
        return this._refill;
    }
    type() {
        return 'refill';
    }
}
class LowStockWarningEvent {
    constructor(_machineId) {
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    type() {
        return 'lowStockWarning';
    }
}
class StockLevelOkEvent {
    constructor(_machineId) {
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    type() {
        return 'stockLevelOk';
    }
}
class MachineSaleSubscriber {
    constructor(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }

    handle(event) {
        console.log('Handling sale event:', event);

        const machineIndex = this.machines.findIndex(machine => machine.id === event.machineId());
        if (machineIndex !== -1) {
            const soldQty = event.getSoldQuantity();
            this.machines[machineIndex].stockLevel -= soldQty;
            // Check if stock level drops below 3 and no warning event has been fired yet
            if (this.machines[machineIndex].stockLevel < 3) {
                this.pubSubService.publish(new LowStockWarningEvent(this.machines[machineIndex].id));
                console.log('Published LowStockWarningEvent');
            }
        }
    }
}

class MachineRefillSubscriber {
    constructor(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }

    handle(event) {
        console.log('Handling refill event:', event);

        const machineIndex = this.machines.findIndex(machine => machine.id === event.machineId());
        if (machineIndex !== -1) {
            const previousStockLevel = this.machines[machineIndex].stockLevel;
            const refillQty = event.getRefillQuantity();
            this.machines[machineIndex].stockLevel += refillQty;
            // Check if stock level transitions from below 3 to 3 or above, and a warning event has been fired
            if (previousStockLevel < 3 && this.machines[machineIndex].stockLevel >= 3) {
                this.pubSubService.publish(new StockLevelOkEvent(this.machines[machineIndex].id));
                console.log('Published StockLevelOkEvent');
            }
        }
    }
}
class LowStockWarningSubscriber {
    constructor(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }
    handle(event) {
        if (event instanceof MachineSaleEvent) {
            const machineIndex = this.machines.findIndex(machine => machine.id === event.machineId());
            if (machineIndex !== -1 && this.machines[machineIndex].stockLevel < 3 && !this.machines[machineIndex].isLowStockWarningFired()) {
                this.machines[machineIndex].setLowStockWarningFired(true);
                this.pubSubService.publish(new LowStockWarningEvent(this.machines[machineIndex].id));
                console.log('Published LowStockWarningEvent');
            }
        }
    }
}
class StockLevelOkSubscriber {
    constructor(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }
    handle(event) {
        if (event instanceof MachineRefillEvent) {
            const machineIndex = this.machines.findIndex(machine => machine.id === event.machineId());
            if (machineIndex !== -1 && this.machines[machineIndex].stockLevel >= 3 && !this.machines[machineIndex].isStockLevelOkFired()) {
                this.machines[machineIndex].setStockLevelOkFired(true);
                this.pubSubService.publish(new StockLevelOkEvent(this.machines[machineIndex].id));
                console.log('Published StockLevelOkEvent');
            }
        }
    }
}
// objects
class Machine {
    constructor(id) {
        this.stockLevel = 10;
        this.lowStockWarningFired = false;
        this.stockLevelOkFired = false;
        this.id = id;
    }
    setLowStockWarningFired(value) {
        this.lowStockWarningFired = value;
    }
    isLowStockWarningFired() {
        return this.lowStockWarningFired;
    }
    setStockLevelOkFired(value) {
        this.stockLevelOkFired = value;
    }
    isStockLevelOkFired() {
        return this.stockLevelOkFired;
    }
}
// helpers
const randomMachine = () => {
    const random = Math.random() * 3;
    if (random < 1) {
        return '001';
    }
    else if (random < 2) {
        return '002';
    }
    return '003';
};
const eventGenerator = () => {
    const random = Math.random();
    if (random < 0.5) {
        const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
        const saleEvent = new MachineSaleEvent(saleQty, randomMachine());
        console.log('Generated sale event:', saleEvent);
        return saleEvent;
    } else {
        const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
        const refillEvent = new MachineRefillEvent(refillQty, randomMachine());
        console.log('Generated refill event:', refillEvent);
        return refillEvent;
    }
};

// program
(() => __awaiter(void 0, void 0, void 0, function* () {
    // create 3 machines with a quantity of 10 stock
    const machines = [new Machine('001'), new Machine('002'), new Machine('003')];
    // create the PubSub service
    const pubSubService = new PublishSubscribeService(); // implement and fix this
    // create a machine sale event subscriber. inject the machines (all subscribers should do this)
    const saleSubscriber = new MachineSaleSubscriber(machines, pubSubService);
    // subscribe the sale subscriber to 'sale' events
    pubSubService.subscribe('sale', saleSubscriber);
    // create a machine refill event subscriber. inject the machines and the pubSubService
    const refillSubscriber = new MachineRefillSubscriber(machines, pubSubService);
    // subscribe the refill subscriber to 'refill' events
    pubSubService.subscribe('refill', refillSubscriber);
    // create a low stock warning event subscriber. inject the machines and the pubSubService
    const lowStockWarningSubscriber = new LowStockWarningSubscriber(machines, pubSubService);
    // subscribe the low stock warning subscriber to 'low_stock_warning' events
    pubSubService.subscribe('low_stock_warning', lowStockWarningSubscriber);
    // create a stock level OK event subscriber. inject the machines and the pubSubService
    const stockLevelOkSubscriber = new StockLevelOkSubscriber(machines, pubSubService);
    // subscribe the stock level OK subscriber to 'stock_level_ok' events
    pubSubService.subscribe('stock_level_ok', stockLevelOkSubscriber);
    // create 5 random events
    const events = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => eventGenerator());
    machines.forEach(machine => {
        console.log(`Machine ${machine.id} stock level: ${machine.stockLevel}`);
    });
    // publish the events
    events.forEach(pubSubService.publish);
    machines.forEach(machine => {
        console.log(`After published event Machine ${machine.id} stock level: ${machine.stockLevel}`);
    });
}))();
