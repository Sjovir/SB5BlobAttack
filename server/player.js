var exports = module.exports = {};

exports.Player = class Player {
    constructor (name, x, y, speed, angleSpeed, angle, size, color, framerate) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.angleSpeed = angleSpeed;
        this.angle = angle;
        this.size = size;
        this.color = color;
        this.framerate = framerate;
        this.direction = DIRECTION.FORWARD;
        this.positions = [];
        this.alive = true;
        this.active = getRandomActivationTime(this.framerate);
        
        // Save current position
        this.positions.push(new Point(this.x, this.y));
    }

    update () {
        // Rotate Blob
        if (this.direction == DIRECTION.LEFT)
            this.angle += this.angleSpeed;
        else if (this.direction == DIRECTION.RIGHT)
            this.angle -= this.angleSpeed;

        // Move Blob
        this.x += this.speed * Math.sin(this.angle * Math.PI / 180);
        this.y += this.speed * Math.cos(this.angle * Math.PI / 180);
        
        // console.log(this.active);
        
        // Save current position
        // if (this.active > 0) {
            this.positions.push(new Point(this.x, this.y)); 
            this.active--
        // }

        // Check line activation
        // if (this.active <= 0) {
        //     setInterval(getRandomActivationTime.bind(this.framerate), 1000);
        // }
    }

    changeDirection (keyPressed, direction) {
        if (keyPressed && this.direction === DIRECTION[direction])
            return;
        
        // console.log(this.direction);
        
        if (keyPressed) {
            if (this.direction === DIRECTION.FORWARD)
                this.direction = DIRECTION[direction];
            else if (this.direction !== DIRECTION[direction])
                this.direction = DIRECTION.FORWARD;
        } else {
            if (this.direction === DIRECTION.FORWARD)
                if (DIRECTION[direction] === DIRECTION.LEFT)
                    this.direction = DIRECTION.RIGHT;
                else
                    this.direction = DIRECTION.LEFT;
            else
                this.direction = DIRECTION.FORWARD;
        }
    }

}

let getRandomActivationTime = (framerate) => {
    let time = ( Math.random() * 5 + 5 ) * framerate;
    // console.log(time);
    
    return time;
}

exports.Point = Point = class Point {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }
}

exports.COLOR = COLOR = {
    RED: 'RED',
    BLUE: 'BLUE',
    GREEN: 'GREEN',
    YELLOW: 'YELLOW',
    PURPLE: 'PURPLE',
    ORANGE: 'ORANGE'
}

exports.DIRECTION = DIRECTION = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    FORWARD: "FORWARD"
}