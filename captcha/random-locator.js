import { DIRECTION, shuffle, print } from "./util.js"
import { DirectedLocation } from "./directed-location.js"

export class RandomLocator {
    constructor(sizeX, sizeY = 0) {
        sizeY = sizeY === 0 ? sizeX : sizeY
        this.availableLocations = []
        for(let i=0; i<sizeX; i++) {
            for(let j=0; j<sizeY; j++) {
                Object.values(DIRECTION).forEach(direction => {
                    this.availableLocations.push(new DirectedLocation(i, j, direction))
                })
            }
        }
        this.availableLocations = shuffle(this.availableLocations)
    }
    
    get size() {
        return this.availableLocations.length
    }

    getLocationAt(index) {
        return this.availableLocations[index]
    }

    add(location) {
        this.availableLocations.push(location)
    }

    remove(locationToRemove) {
        this.availableLocations = 
            this.availableLocations.filter(location => !location.equals(locationToRemove))
        return locationToRemove
    }

    excluding(locationsToExclude) {
        return this.availableLocations.filter(location => {
            locationsToExclude.some(locationToExclude => locationToExclude.equals(location))
        })
    }
}