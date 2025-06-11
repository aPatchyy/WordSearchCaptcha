export class DirectedLocation {
    constructor(x, y, direction) {
        this.x = x
        this.y = y
        this.direction = direction
    }

    equals(otherLocation) {
        return this.x == otherLocation.x && 
            this.x == otherLocation.x &&
            this.direction == otherLocation.direction
    }
}