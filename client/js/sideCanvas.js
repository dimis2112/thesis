// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// display character card
let display_canvas = document.querySelector("#display-chararcter-canvas");
let con = display_canvas.getContext('2d');
display_canvas.height = display_canvas.width;

let random_color_btn = document.querySelector("#random-color-btn");
let random_name_btn = document.querySelector("#random-name-btn");


let display_hue = Math.floor(Math.random() * (360));
playerConfig.hue = display_hue;
playerConfig.border_hue = display_hue;
let y = 0;
myPlayer.playerName = generateName();
let display_cell_name = myPlayer.playerName;
let display_radius = 60;
//let background_2 = new Background(dispaly_canvas, con);

let disp_x = -400
let disp_y = 0;
let disp_step = 400;
let disp_dx = 1;
let disp_dy = 1;

function animateFunction() {
    //animate stuff
    window.requestAnimationFrame(animateFunction);
    //background_2.update();
    con.clearRect(-100, -100, 1000, 1000);

    con.drawImage(img, 0, 0, 741, 733, disp_x + disp_dx, disp_y, disp_step, disp_step);
    con.drawImage(img, 0, 0, 741, 733, disp_x + disp_dx + disp_step, disp_y, disp_step, disp_step);
    disp_dx += 1;
    disp_dy += 1;
    disp_dx = (disp_dx) % 400;
    disp_dy = (disp_dy) % 400;

    con.beginPath();
    con.lineWidth = 18;
    con.arc(display_canvas.width / 2, display_canvas.height / 2 + display_radius / 5 * Math.sin(y), display_radius, 0, 2 * Math.PI);
    con.fillStyle = `hsla(${playerConfig.hue},100%,50%)`;
    con.strokeStyle = `hsla(${playerConfig.border_hue},100%,40%)`;
    con.stroke();
    con.fill();

    con.fillStyle = "white";
    con.strokeStyle = "black";
    con.font = "24px Cursive";
    con.textAlign = 'center';
    con.lineWidth = 3;
    con.strokeText(display_cell_name, display_canvas.width / 2, display_canvas.height / 2 + 10 + display_radius / 5 * Math.sin(y));
    con.fillText(display_cell_name, display_canvas.width / 2, display_canvas.height / 2 + 10 + display_radius / 5 * Math.sin(y));
    y += 0.03;
}
window.requestAnimationFrame(animateFunction);


colorPicker.on('color:change', (color) => {
    // if (cardStatus == "create-my-room-card" || cardStatus == "join-room-card") {
    //     return;
    // }
    // else {
    //     console.log("i did the else")
    // }
    if (document.querySelector("#fill-color").checked) {
        playerConfig.hue = color.hsl.h;
    }
    if (document.querySelector("#border-color").checked) {
        playerConfig.border_hue = color.hsl.h;
    }
})

random_color_btn.addEventListener('click', () => {
    // if (cardStatus == "create-my-room-card" || cardStatus == "join-room-card") {
    //     return;
    // }
    // else {
    //     console.log("i did the else")
    // }
    let hue = Math.floor(Math.random() * (360));
    display_hue = hue;
    playerConfig.hue = hue;
    playerConfig.border_hue = hue;

    if (socket) {
        let packet = {
            name: myPlayer.playerName,
            hue: playerConfig.hue,
            border_hue: playerConfig.border_hue
        }
        socket.emit("player style update", packet)
    }
})

random_name_btn.addEventListener('click', () => {
    // if (cardStatus == "create-my-room-card" || cardStatus == "join-room-card") {
    //     return;
    // }
    // else {
    //     console.log("i did the else")
    // }
    myPlayer.playerName = generateName();
    display_cell_name = myPlayer.playerName;

    if (socket) {
        let packet = {
            name: myPlayer.playerName,
            hue: playerConfig.hue,
            border_hue: playerConfig.border_hue
        }
        socket.emit("player style update", packet)
    }
})

function generateColor() {
    return Math.floor(Math.random() * (360));
}

function generateName() {
    const n1 = ["Small", "Fresh", "Big", "Tall", "Nerd", "Rusty", "Short", "Fast", "Smart", "Gekky", "Huge", "Shy", "Sad", "Happy"];
    const n2 = ["Bob", "Tom", "Nina", "Lola", "Ross", "Bill", "Susan", "Eddy", "Takis", "John", "Cell", "Jena", "Jenny", "Mary"]
    return n1[parseInt(Math.random() * n1.length)] + '-' + n2[parseInt(Math.random() * n2.length)];
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~