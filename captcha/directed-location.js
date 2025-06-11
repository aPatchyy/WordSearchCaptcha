export class DirectedLocation {
    constructor(x, y, direction) {
        this.x = x
        this.y = y
        this.direction = direction
    }

    static from(otherLocation) {
        return new DirectedLocation(otherLocation.x, otherLocation.y, otherLocation.direction)
    }

    // error if otherLocation is null
    equals(otherLocation) {
        return this.x == otherLocation.x && 
            this.y == otherLocation.y &&
            this.direction == otherLocation.direction
    }

    
}