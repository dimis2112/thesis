const canvas2 = document.querySelector("#backgroundCanvas");
const ctx = canvas2.getContext('2d');
canvas2.width = window.innerWidth;
canvas2.height = window.innerHeight;



canvas2.style.display = 'block';

let balls = [];
let background;

class Background {
    constructor(canvas, ctx) {
        this.x = -250
        this.y = -250;
        this.velocity = 1;
        this.step = 250;
        this.dx = 1;
        this.dy = 1;
        this.ctx = ctx;
        this.canvas = canvas

    }

    draw() {
        for (var x = this.x + this.dx; x < this.canvas.width + this.step; x += this.step) {
            for (var y = this.y + this.dy; y < this.canvas.height + this.step; y += this.step) {
                this.ctx.drawImage(img, 0, 0, 741, 733, x, y, this.step, this.step);
            }
        }
    }

    update() {
        this.draw();
        this.dx += 1;
        this.dy += 1;
        this.dx = (this.dx) % 250;
        this.dy = (this.dy) % 250;
    }

}

function drawBackground() {
    let step = 250;
    for (var x = -100; x < canvas2.width + 400; x += step) {
        for (var y = -100; y < canvas2.height + 400; y += step) {



            ctx.drawImage(img, 0, 0, 741, 733, x, y, step, step);

        }
    }
}

class Ball {
    constructor(x, y, radius, color, stroke, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.stroke = stroke;
        this.radius = radius;
        this.velocity = velocity;
    }

    draw() {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.stroke;
        ctx.fill();
        ctx.stroke();


        ctx.lineWidth = 3;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        // ctx.textBorder = '10';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold ' + this.radius / 2 + 'px cursive';
        ctx.strokeText('Jimmys.io', this.x, this.y);
        ctx.fillText('Jimmys.io', this.x, this.y);

    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;

    }
}
init_background();

function init_background() {
    balls = [];
    background = new Background(canvas2, ctx);
    animate();
    spawnBalls();
}

function spawnBalls() {
    setInterval(() => {
        let radius = Math.random() * (180 - 10) + 10;
        // let x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        // let y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;

        let x;
        let y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas2.width + radius;
            y = Math.random() * canvas2.height;
        } else {
            y = Math.random() < 0.5 ? 0 - radius : canvas2.height + radius;
            x = Math.random() * canvas2.width;
        }

        // let color = "green";
        let rand = Math.random() * 360

        let color = "hsl(" + rand + ", 40%, 40%)";
        let stroke = "hsl(" + rand + ", 50%, 30%)";
        let angle = Math.atan2(canvas2.height * Math.random() - y, canvas2.width * Math.random() - x);
        let velocity = {
            x: Math.cos(angle) * 1.2,
            y: Math.sin(angle) * 1.2,
        };
        if (balls.length <= 12) {
            balls.push(new Ball(x, y, radius, color, stroke, velocity));
        }
    }, 1000);

}

function animate() {
    animationId = requestAnimationFrame(animate);
    if (userStatus == "ui") {
        background.update();

        balls.forEach((ball, index) => {
            if (
                ball.x < 0 - ball.radius ||
                ball.x > canvas2.width + ball.radius ||
                ball.y < 0 - ball.radius ||
                ball.y > canvas2.height + ball.radius
            ) {
                setTimeout(() => {
                    balls.splice(index, 1);
                });
            }
            ball.update()
        })
    }



}