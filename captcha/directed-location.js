export class DirectedLocation {
    constructor(column, row, direction) {
        this.column = column
        this.row = row
        this.direction = direction
    }

    static from(otherLocation) {
        return new DirectedLocation(otherLocation.column, otherLocation.row, otherLocation.direction)
    }

    equals(otherLocation) {
        return this.column === otherLocation.column &&
            this.row === otherLocation.row &&
            this.direction === otherLocation.direction
    }
}