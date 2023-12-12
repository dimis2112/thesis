const canvas = document.querySelector("#canvas");
const c = canvas.getContext('2d');
const UI_container = document.querySelector("#ui-container");
const game_container = document.querySelector("#gameContainer");
var img;
img = document.querySelector("#pattern");

// home ui
const home_ui_card = document.querySelector("#home-ui-card");
const press_to_play_btn = document.querySelector("#start-btn");
const create_room_button = document.querySelector("#create-room-button");
const join_room_button = document.querySelector("#join-room-button");
const style_your_cell_button = document.querySelector("#style-your-cell-button");

// create room ui
const your_room_card = document.querySelector("#your-room-card");
const close_your_room_btn = document.querySelector("#close-your-room-btn");
const create_my_room_btn = document.querySelector("#create-my-room-btn");
const start_room_game = document.querySelector("#start-room-game");
const cancel_my_room_game = document.querySelector("#cancel-my-room-btn");

//join room ui
const join_room_card = document.querySelector("#join-room-card");
const refresh_rooms_btn = document.querySelector("#refresh-rooms");
const join_room_home_button = document.querySelector("#join-room-home-button");

//style cell ui
const style_card_cell_name = document.querySelector("#cell-name");
const style_cell_card = document.querySelector("#style-cell-card");
const save_close_style_btn = document.querySelector("#save-and-close-style");
const colorPicker = new iro.ColorPicker('#color-picker', {
    layout: [
        {
            component: iro.ui.Wheel,
        },
    ]
});


// final scoreboard card
const finalScoreBoard = document.querySelector("#FinalScoreBoard");
const return_home_final_score = document.querySelector("#return-home-from-final-score");

// initialize cards
let cards = document.querySelectorAll(".card");

class Word {
    constructor(text, x, y, ticks) {
        this.text = text;
        this.pos = {
            x: x,
            y: y
        };
        this.ticks = ticks;
    }
}

window.onload = function () {
    initialize_cards();


    if (document.cookie && window.location.href.includes("invited")) {
        // console.log(document.cookie);
        // fetch the invitation data
        let cookie_str = getCookie("invitation_id");
        let link = window.location.origin + "/invited_player/" + "?invitation_id=" + cookie_str;
        // console.log(link);

        fetch(link)
            .then((response) => {
                // console.log(response);
                response.json().then(data => {
                    // console.log(data);

                    //  render invitation alert window 
                    //document.querySelector("#nickname_Required_invitation").style.display = 'none';
                    document.querySelector("#invitationModal").style.display = 'block';
                    document.querySelector("#admin_name").innerHTML = data.room_admin;
                    //  if they press play 
                    document.querySelector("#play_invitation").addEventListener('click', () => {

                        //  connect to the socket
                        socket = io(window.origin, {
                            transports: ["websocket"]
                        })
                        handleSocket(socket);

                        //  render the join_room screen
                        document.querySelector("#invitationModal").style.display = 'none';
                        home_ui_card.style.display = 'none';
                        join_room_card.style.display = 'block';
                        cardStatus = "join-room-card"


                        //  send join room event with the room id 
                        let packet = {
                            name: myPlayer.playerName,
                            hue: playerConfig.hue,
                            border_hue: playerConfig.border_hue

                        }
                        window.history.replaceState({}, null, window.origin);
                        console.log(data.room_id, packet, "AAAAAA");
                        socket.emit('join invitation', data.room_id, packet)
                    })

                    // document.querySelector("#invitation_return_home").setAttribute('href', window.origin);
                    document.querySelector("#invitation_return_home").addEventListener('click', () => {
                        //  close modal
                        document.querySelector("#invitationModal").style.display = 'none';

                        //  link to window.origin
                        window.location.href = window.origin;
                    })


                });
            })


    }


}

function getCookie(cname) {
    const cookies = Object.fromEntries(
        document.cookie.split(/; /).map(c => {
            const [key, v] = c.split('=', 2);
            return [key, decodeURIComponent(v)];
        }),
    );
    return cookies[cname] || '';
}

function initialize_cards() {
    press_to_play_btn.addEventListener("click", handle_press_to_play_btn);
    hide_cards();

    cards.forEach((card) => {
        if (card.id == "home-ui-card") {
            card.style.display = 'block'
        }
    })

    cards.forEach((card) => {
        if (card.id == "display-character") {
            card.style.display = 'block'
        }
    })
}

function hide_cards() {
    cards.forEach((card) => {
        card.style.display = 'none';
    })
}



var socket;
let userStatus = 'ui';
let cardStatus = 'home-card';


// window.addEventListener('mousemove', handleMouseMove);
// window.addEventListener('keydown', handleKeyDown);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ~~~~~~~~~~~~~~~~~ Button Handlers ~~~~~~~~~~~~~~~~~~~

press_to_play_btn.addEventListener("click", handle_press_to_play_btn);
return_home_final_score.addEventListener("click", handle_return_home_from_final_score);
create_my_room_btn.addEventListener("click", handle_create_my_room_btn);
start_room_game.addEventListener("click", handle_start_room_game);
cancel_my_room_game.addEventListener("click", handle_cancel_my_room_btn)
refresh_rooms_btn.addEventListener("click", handle_refresh_rooms_btn);

function handle_press_to_play_btn() {
    start_game();
}
function handle_return_home_from_final_score() {
    initialize_UI();
    initialize_cards();
}
function handle_create_my_room_btn() {
    //  send room data to server
    let roomName = document.querySelector("#room-name").value;
    let roomPassword = document.querySelector("#room-password").value;
    document.querySelector("#public-check").style.display = 'none';
    document.querySelector("#private-check").style.display = 'inline';


    let packet = {
        name: myPlayer.playerName,
        hue: playerConfig.hue,
        border_hue: playerConfig.border_hue
    }

    //  check if valid room name
    if (document.querySelector("#room-name").value.length < 1) {
        return;
    }


    // socket = io(window.location.href, {
    //     auth: {
    //         token: 'hi'
    //     }
    // })
    socket = io(window.location.href, {
        transports: ["websocket"]
    })
    // console.log("to kanw !!!", packet, roomName, roomPassword)
    socket.emit('createRoomGame', packet, roomName, roomPassword);
    handleSocket(socket);
}
function handle_start_room_game() {
    socket.emit('start room game');
}

function handle_cancel_my_room_btn() {
    // hide my-room-div
    document.querySelector("#my-room-div").style.display = 'none';

    // render create-room-card initial divs
    document.querySelector("#create-room-note-div").style.display = 'block'

    // reset inputs
    document.querySelector("#room-name").style.display = 'block';
    document.querySelector("#room-password").style.display = 'block';
    document.querySelector("#room-name-p").style.display = 'none';
    document.querySelector("#room-name-p").innerText = '';
    document.querySelector("#room-password-p").style.display = 'none';
    document.querySelector("#room-password-p").innerText = '';
    document.querySelector("#public-check").style.display = 'none';
    document.querySelector("#private-check").style.display = 'inline';

    // reset create-room-btn
    create_my_room_btn.addEventListener("click", handle_create_my_room_btn);
    create_my_room_btn.style.backgroundColor = 'hsl(157, 85%, 50%)';



    // socket disconect
    socket.disconnect();
}
function handle_refresh_rooms_btn() {
    get_available_rooms();
}

document.querySelector("#quick-game-btn").addEventListener("click", () => {

    socket.emit("quit");


})
document.querySelector("#public-div").addEventListener("click", () => {
    document.querySelector("#public-check").style.display = 'inline'
    document.querySelector("#private-check").style.display = 'none'
    let roomId = document.querySelector("#my-room-div").getAttribute('data-room-id');
    socket.emit('set-public', roomId, 'public');
})
document.querySelector("#private-div").addEventListener("click", () => {
    document.querySelector("#private-check").style.display = 'inline'
    document.querySelector("#public-check").style.display = 'none'
    let roomId = document.querySelector("#my-room-div").getAttribute('data-room-id');
    socket.emit('set-public', roomId, 'private');
})

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function start_game() {
    press_to_play_btn.removeEventListener('click', handle_press_to_play_btn);

    //  INITIALIZE SOME ANIMATION VARIABLES

    zoom = 1;
    myPlayer.totalMass = 40;
    myPlayer.totalRadius = 40;
    jumpingFoods = 0.1;

    // // console.log("TIMES TWN ANIMATION VARIABLES ", myPlayer.totalMass, myPlayer.totalRadius);
    c.save();

    // kai me afton ton tropo edw katw mporei na doylebei
    // socket = io("/", {
    //     transports: ["websocket"]
    // })

    socket = io(window.location.href, {
        transports: ["websocket"]
    })

    //socket = io();
    handleSocket(socket);
    let packet = {
        name: myPlayer.playerName,
        hue: playerConfig.hue,
        border_hue: playerConfig.border_hue
    }
    socket.emit('play', packet);
}

// function start_animation() {
//     setInterval(() => {


//         sendInputs();
//         calculateState();
//         renderState();


//     }, 1000 / 100)
// }
let lastTime = Date.now();
let now;
let dt = 0;

function animloop() {
    animationId = requestAnimationFrame(animloop);

    now = Date.now();

    if (now - lastTime > dt) {
        console.log(now - lastTime);
        lastTime = now;
        sendInputs();
        if (prediction_flag) {

            updatePosition();
        }
        if (interpollation_flag) {
            if (updates_received <= 0) {
                calculateState2();
            }
            else {
                calculateState();
            }
        } else {
            calculateState();
        }
        renderState();

        if (game_over) {
            cancelAnimationFrame(animationId);
            c.restore();
            ever_changing_value;
            updates_received = 2;
            return;
        }


    }

}

// function sendInputs() {

//     let input_packet = [];

//     // gather input events to a big packet
//     inputs.forEach((input) => {
//         if (input.triggered) {
//             if (input.data) {
//                 input_packet.push({
//                     name: input.name,
//                     data: input.data
//                 })
//             }
//             else {
//                 input_packet.push({
//                     name: input.name,
//                 })

//             }

//         }

//         input.triggered = false;

//     })

//     socket.emit("player input", input_packet);

// }


function sendInputs() {

    let input_packet = [];

    // gather input events to a big packet
    inputs.forEach((input) => {
        if (input.triggered) {
            if (input.data) {
                input_packet.push({
                    name: input.name,
                    data: input.data
                })
                local_target = input.data;
            }
            else {
                input_packet.push({
                    name: input.name,
                })
                if (input.name == 'split') {
                    if (prediction_flag) {
                        //split();
                    }
                }

            }

        }

        input.triggered = false;

    })

    socket.emit("player input", input_packet);

}
let local_target = { x: 0, y: 0 };
// na energopoeitai kati san local cells meta to split


function updatePosition() {

    console.log(myPlayer.cells);
    console.log("eginaaaaaaa");
    let cells = myPlayer.cells;
    let pos = playerConfig.visionCenter;
    let target = local_target;
    let gc = playerConfig;
    console.log(cells);
    for (let i = 0; i < cells.length; i++) {


        // if a Cell has catapult force , it moves unaffected from client's inputs
        if (cells[i].catapultForce.speed > 0) {
            let dx = cells[i].catapultForce.dx * cells[i].catapultForce.speed;
            let dy = cells[i].catapultForce.dy * cells[i].catapultForce.speed;



            //Out of Bounds
            if (cells[i].pos.x + dx < 0 + cells[i].radius * 0.5) {
                dx = 0 - cells[i].pos.x + cells[i].radius * 0.5;
            }
            if (cells[i].pos.x + dx > gc.worldWidth - cells[i].radius * 0.5) {
                dx = gc.worldWidth - cells[i].pos.x - cells[i].radius * 0.5;
            }
            if (cells[i].pos.y + dy < cells[i].radius * 0.5) {
                dy = 0 - cells[i].pos.y + cells[i].radius * 0.5
            }
            if (cells[i].pos.y + dy > gc.worldHeight - cells[i].radius * 0.5) {
                dy = gc.worldHeight - cells[i].pos.y - cells[i].radius * 0.5;
            }

            dx = Math.floor(dx);
            dy = Math.floor(dy);
            cells[i].pos.x += dx;
            cells[i].pos.y += dy;
            cells[i].catapultForce.speed -= cells[i].catapultForce.friction;

            if (cells[i].mergeCooldown > 0) {
                cells[i].mergeCooldown -= 1;
            }

            continue;


        }

        if (cells[i].mergeCooldown > 0) {
            cells[i].mergeCooldown -= 1;
        }

        let angle = Math.atan2(target.y + pos.y - cells[i].pos.y, target.x + pos.x - cells[i].pos.x);
        let vel = massToVel(cells[i].mass);
        // vel = 6;
        //console.log(vel, cells[i].mass);
        let dx = Math.cos(angle) * vel;
        let dy = Math.sin(angle) * vel;

        for (let j = 0; j < cells.length; j++) {
            if (i == j) {
                continue;
            }

            //Cells touch each other
            if (Math.hypot(cells[i].pos.x + dx - cells[j].pos.x, cells[i].pos.y + dy - cells[j].pos.y) < cells[i].radius + cells[j].radius && cells[i].catapultForce.speed <= 0 && cells[j].catapultForce.speed <= 0) {

                //The two cells are ready to merge
                if (cells[i].mergeCooldown == 0 && cells[j].mergeCooldown == 0) {
                    // if both cells have mergecooldown ==0 then they move without any bother

                }

                // The cells can't overlap because of merge cooldown is not 0 , so they just rub to each other 
                else {

                    let obj = findValidDisplacement(cells[i], cells[j], dx, dy);
                    dx = obj.dx;
                    dy = obj.dy;

                }


            }
        }


        // ean einai poly konta ston target tote metatopish ginetai mhden
        if (Math.hypot(cells[i].pos.x - (pos.x + target.x), cells[i].pos.y - (pos.y + target.y)) < 10) {
            dx = 0;
            dy = 0;
        }

        //Out of Bounds
        if (cells[i].pos.x + dx < cells[i].radius * 0.5) {
            dx = 0 - cells[i].pos.x + cells[i].radius * 0.5
            //dx = -50;
        }
        if (cells[i].pos.x + dx > gc.worldWidth - cells[i].radius * 0.5) {
            //  dx = gc.worldWidth - cells[i].pos.x - cells[i].radius * 0.5;
            dx = 0;
        }
        if (cells[i].pos.y + dy < cells[i].radius * 0.5) {
            dy = 0 - cells[i].pos.y + cells[i].radius * 0.5
            // dy = -50;
        }
        if (cells[i].pos.y + dy > gc.worldHeight - cells[i].radius * 0.5) {
            dy = gc.worldHeight - cells[i].pos.y - cells[i].radius * 0.5;
            // dy = 0;

        }

        dx = Math.floor(dx);
        dy = Math.floor(dy);
        cells[i].pos.x += dx;
        cells[i].pos.y += dy;


    }



    // set the vision center
    let sumX = 0;
    let sumY = 0;
    cells.forEach((cell) => {
        sumX += cell.pos.x;
        sumY += cell.pos.y;
    });
    sumX = sumX / cells.length;
    sumY = sumY / cells.length;

    sumX = Math.floor(sumX);
    sumY = Math.floor(sumY);

    pos.x = pos.x + 0.1 * (sumX - pos.x);
    pos.y = pos.y + 0.1 * (sumY - pos.y);



}

function massToVel(mass) {
    if (mass >= 260) {
        return 2.2 / 1.25
    } else if (mass <= 20) {
        return 6.5
    }
    else {
        let vel = -0.016944 * mass + 53 / 9;
        // na ftanei se ena elaxisto kai na mhn meiwnetai allo h taxythta 
        return vel / 1.25;
    }

}

function findValidDisplacement(cell1, cell2, dx, dy) {

    let dist;

    while (true) {
        // h logikh einai "an h telikh apostash einai megalyterh , prosthese 1"
        if (Math.hypot(cell1.pos.x + dx + 1 - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y) > Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y)) {
            dx += 1;
        }
        dist = Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y);

        if (dist > cell1.radius + cell2.radius) {
            break;
        }


        if (Math.hypot(cell1.pos.x + dx - 1 - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y) > Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y)) {
            dx += -1;
        }

        dist = Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y);

        if (dist > cell1.radius + cell2.radius) {
            break;
        }

        if (Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy + 1 - cell2.pos.y) > Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y)) {
            dy += 1;
        }

        dist = Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y);

        if (dist > cell1.radius + cell2.radius) {
            break;
        }

        if (Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - 1 - cell2.pos.y) > Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y)) {
            dy += -1;
        }


        dist = Math.hypot(cell1.pos.x + dx - cell2.pos.x, cell1.pos.y + dy - cell2.pos.y);

        if (dist > cell1.radius + cell2.radius) {
            break;
        }
    }

    Math.floor(dx);
    Math.floor(dy);

    return { dx, dy }

}

function split() {
    //kathe kyttaro pou h maza tou einia panw apo 20 tha kanei split
    let cells = myPlayer.cells;
    let pos = playerConfig.visionCenter;
    let target = local_target;
    let gc = playerConfig;
    let newCells = [];
    cells.forEach((cell) => {
        if (cell.mass >= 40) {
            //cell is splitable
            // cells.splice(cellIndex, 1);
            // osa cells exoun throw:true tha ektoksebontai

            // calculate angle
            let speed = 40;
            let angle = Math.atan2(target.y + pos.y - cell.pos.y, target.x + pos.x - cell.pos.x);
            let dx = Math.cos(angle);
            let dy = Math.sin(angle);
            let friction = 0.8;

            if (cell.virus) {
                newCells.push({
                    mass: cell.mass / 2,
                    radius: cell.mass / 2,
                    pos: { x: cell.pos.x, y: cell.pos.y },
                    throw: false,
                    catapultForce: {
                        speed: speed, dx: dx, dy: dy, friction: friction
                    },
                    mergeCooldown: 500,
                    //merged: false,
                    merge_able: false,
                    virus: false,
                    id: null

                });
                newCells.push({
                    mass: cell.mass / 2,
                    radius: cell.mass / 2,
                    pos: { x: cell.pos.x, y: cell.pos.y },
                    throw: false,
                    catapultForce: {
                        speed: 0, dx: 0, dy: 0, friction: 0
                    },
                    mergeCooldown: 500,
                    // merged: false,
                    merge_able: false,
                    virus: true,
                    id: cell.id
                });

            } else {
                newCells.push({
                    mass: cell.mass / 2,
                    radius: cell.mass / 2,
                    pos: { x: cell.pos.x, y: cell.pos.y },
                    throw: false,
                    catapultForce: {
                        speed: speed, dx: dx, dy: dy, friction: friction
                    },
                    mergeCooldown: 500,
                    //merged: false,
                    merge_able: false,
                    virus: false,
                    id: null

                });
                newCells.push({
                    mass: cell.mass / 2,
                    radius: cell.mass / 2,
                    pos: { x: cell.pos.x, y: cell.pos.y },
                    throw: false,
                    catapultForce: {
                        speed: 0, dx: 0, dy: 0, friction: 0
                    },
                    mergeCooldown: 500,
                    // merged: false,
                    merge_able: false,
                    virus: false,
                    id: cell.id
                });
            }




            // cells.splice(cellIndex, 1);
            // cellIndex -= 1;
        } else {
            newCells.push(cell);
        }

    });
    console.log(newCells);
    myPlayer.cells = [...newCells];

    // console.log(cells);
    // set new vision center  ~~ geometric median
    let sumX = 0;
    let sumY = 0;
    cells.forEach((cell) => {
        sumX += cell.pos.x;
        sumY += cell.pos.y;
    });
    sumX = sumX / cells.length;
    sumY = sumY / cells.length;

    pos.x = sumX;
    pos.y = sumY;

}

function clearState() {
    state.myFoods = [];
    state.myEnemies = [];
    state.myMasses = {};
    state.myViruses = [];
    state.myPlayer = {};
    state.playerConfig = {};
    state.score_words = [];

}

function calculateState() {
    state.myFoods = [...myFoods];
    state.myEnemies = [...myEnemies];
    state.myMasses = { ...myMasses };
    state.myViruses = [...myViruses];
    state.myPlayer = { ...myPlayer };
    state.playerConfig = { ...playerConfig }
    state.score_words = { ...score_words };

}

function calculateState2() {
    //  console.log("EKTYPWSA");
    let target_state_r = JSON.parse(JSON.stringify(target_state));
    let state_temp = JSON.parse(JSON.stringify(target_state));

    let time = Date.now();


    // do interpollation

    // let int_factor = (time - target_state_r.time) / (1000 / broadcast_ups);
    let int_factor = (time - target_state_r.time) / (target_state_r.time - current_state.time);
    // if (int_factor > 1) {
    //     int_factor = 1;
    // }

    console.log("EKTYPWSA", int_factor);


    // state_temp.playerConfig.visionCenter.x = current_state.playerConfig.visionCenter.x + 1 * (target_state_r.playerConfig.visionCenter.x - current_state.playerConfig.visionCenter.x);
    // state_temp.playerConfig.visionCenter.y = current_state.playerConfig.visionCenter.y + 1 * (target_state_r.playerConfig.visionCenter.y - current_state.playerConfig.visionCenter.y);

    state_temp.playerConfig.visionCenter.x = playerConfig.visionCenter.x;
    state_temp.playerConfig.visionCenter.y = playerConfig.visionCenter.y;





    lastCells.forEach((cell) => {
        for (i = 0; i < myPlayer.cells.length; i++) {
            if (cell.id == myPlayer.cells[i].id) {
                //  INTERPOLLATION 
                myPlayer.cells[i].radius = cell.radius + 0.2 * (myPlayer.cells[i].radius - cell.radius);
                // myPlayer.cells[i].pos.x = (myPlayer.cells[i].pos.x + 0.05 * (cell.pos.x - myPlayer.cells[i].pos.x));
                // myPlayer.cells[i].pos.y = (myPlayer.cells[i].pos.y + 0.05 * (cell.pos.y - myPlayer.cells[i].pos.y));
                //  myPlayer.cells[i].radius = (myPlayer.cells[i].radius + 0.0001 * (cell.radius - myPlayer.cells[i].radius));
            }
        }
    })
    state_temp.myPlayer = JSON.parse(JSON.stringify(myPlayer));
    lastCells = JSON.parse(JSON.stringify(myPlayer.cells));

    let enemy_cells = JSON.parse(JSON.stringify(target_state_r.myEnemies));
    let viruses = JSON.parse(JSON.stringify(target_state_r.myViruses));
    //  let myCells = JSON.parse(JSON.stringify(target_state_r.myPlayer.cells));

    let found = false;





    enemy_cells.forEach((cell_t) => {
        found = false;

        current_state.myEnemies.forEach((cell_c) => {

            if (cell_t.id == cell_c.id) {
                //  INTERPOLLATION 
                found = true;
                cell_t.radius = (cell_c.radius + int_factor * (cell_t.radius - cell_c.radius));
                cell_t.pos.x = (cell_c.pos.x + int_factor * (cell_t.pos.x - cell_c.pos.x));
                cell_t.pos.y = (cell_c.pos.y + int_factor * (cell_t.pos.y - cell_c.pos.y));
                console.log("interpollation pos", cell_t.pos.x);
            }
        })
        if (cell_t.pre_split_data != undefined && !found) {
            console.log("BRHKA PRE SPLIT AAAAAAA")
            cell_t.radius = (cell_t.pre_split_data.radius + int_factor * (cell_t.radius - cell_t.pre_split_data.radius));
            cell_t.pos.x = (cell_t.pre_split_data.x + int_factor * (cell_t.pos.x - cell_t.pre_split_data.x));
            cell_t.pos.y = (cell_t.pre_split_data.y + int_factor * (cell_t.pos.y - cell_t.pre_split_data.y));
        }


    })


    viruses.forEach((cell_t) => {
        //  INTERPOLLATION 
        current_state.myViruses.forEach((cell_c) => {
            if (cell_t.id == cell_c.id) {
                //  INTERPOLLATION 
                cell_t.pos.x = (cell_c.pos.x + int_factor * (cell_t.pos.x - cell_c.pos.x));
                cell_t.pos.y = (cell_c.pos.y + int_factor * (cell_t.pos.y - cell_c.pos.y));
            }
        })

    })

    state_temp.myEnemies = JSON.parse(JSON.stringify(enemy_cells));
    state_temp.myViruses = JSON.parse(JSON.stringify(viruses));
    // state_temp.myPlayer.cells = JSON.parse(JSON.stringify(myCells));

    state = JSON.parse(JSON.stringify(state_temp));


}

function renderState() {
    c.save();
    clearCanvas2();
    c.translate(canvas.width / 2, canvas.height / 2);

    //  CALCULATE ZOOM FACTOR ACCORDING TO HOW MUCH YOUR CELLS GREW
    newzoom = -0.0013875 * state.myPlayer.totalRadius + 1.0555;
    scaleFactor = scaleFactor + 0.1 * (newzoom - scaleFactor);
    c.scale(scaleFactor, scaleFactor);
    c.translate(-state.playerConfig.visionCenter.x, -state.playerConfig.visionCenter.y);
    //drawBackgroundGrid();
    drawBackgroundImage2();
    jumpingFoods += 0;
    drawFoods2();
    drawMasses();
    drawViruses();
    //drawEnemies2();
    drawEnemies3();

    drawPlayerWithPoints();
    drawWords();
    c.translate(state.playerConfig.visionCenter.x - canvas.width / 2, state.playerConfig.visionCenter.y - canvas.height / 2);


    c.restore();

}


//cards transition ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
create_room_button.addEventListener("click", () => {
    cardStatus = 'create-my-room-card';
    change_card(home_ui_card, your_room_card)
});
close_your_room_btn.addEventListener("click", () => {
    cardStatus = 'home-card';
    change_card(your_room_card, home_ui_card)
    initialize_UI()
});
join_room_button.addEventListener("click", () => {
    cardStatus = 'join-room-card';
    change_card(home_ui_card, join_room_card)
    refresh_rooms_btn.addEventListener("click", handle_refresh_rooms_btn);
    get_available_rooms();
});
join_room_home_button.addEventListener("click", () => {
    cardStatus = 'home-card';
    change_card(join_room_card, home_ui_card)
    initialize_UI()
});
style_your_cell_button.addEventListener("click", () => { change_card(home_ui_card, style_cell_card) });
save_close_style_btn.addEventListener("click", () => { change_card(style_cell_card, home_ui_card) });
let card_out;
let card_in;
function card_tansition() {
    card_out.removeEventListener("animationend", card_tansition);
    card_out.style.display = 'none';
    card_in.style.display = 'block';
    card_in.style.animation = 'slide-in 0.5s';
    card_out.style.animation = 'null'

}

function change_card(card_now, card_after) {
    card_now.style.animation = "slide-out 0.5s";
    card_out = card_now;
    card_in = card_after;
    card_now.addEventListener("animationend", card_tansition);
}

function initialize_UI() {
    // reset create-my-room-card
    document.querySelector("#room-name").value = '';
    document.querySelector("#room-password").value = '';
    document.querySelector("#my-room-div").style.display = 'none';
    create_my_room_btn.addEventListener("click", handle_create_my_room_btn);
    create_my_room_btn.style.backgroundColor = 'hsl(157, 85%, 50%)';
    document.querySelector("#room-name-p").style.display = 'none';
    document.querySelector("#room-password-p").style.display = 'none';
    document.querySelector("#room-name").style.display = 'block';
    document.querySelector("#room-password").style.display = 'block';
    document.querySelector("#create-room-note-div").style.display = 'block'

    // reset join-room-card
    document.querySelector("#rooms-container").style.display = 'block';
    refresh_rooms_btn.addEventListener("click", handle_refresh_rooms_btn);
    document.querySelector("#joined-a-room-div").style.display = 'none';




    // disconect from socket
    userStatus = 'ui';
    cardStatus = 'home-card';
    socket.disconnect();

}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



// Rest functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function get_available_rooms() {

    //  get available rooms
    socket = io(window.location.href, {
        transports: ["websocket"]
    })
    socket.emit('get_available_rooms');
    handleSocket(socket);
}
function renderRoom(room) {

    let room_div = document.querySelector("#room-div-prototype").cloneNode(true);
    // console.log(room_div);

    room_div.setAttribute('data-room-id', room.roomId);
    room_div.querySelector("#join-room-name-p").innerText = `Room: ` + room.roomName;
    room_div.querySelector("#join-room-host-p").innerText = `Host: ` + room.admin.playerName;
    room_div.querySelector("#people-joined-p").innerText = 'Currently joined ' + room.people_joined + '/5';
    room_div.querySelector("#join-this-room-btn").addEventListener("click", () => {
        //  join room
        let room_id = room_div.getAttribute('data-room-id');

        let packet = {
            name: myPlayer.playerName,
            hue: playerConfig.hue,
            border_hue: playerConfig.border_hue
        }

        socket.emit('join room', room_id, packet);

        document.querySelector("#refresh-rooms").removeEventListener("click", handle_refresh_rooms_btn);
    })

    room_div.style.display = 'block';


    document.querySelector("#rooms-container").appendChild(room_div);

}



style_card_cell_name.addEventListener("change", () => {
    // if (cardStatus == "create-my-room-card" || cardStatus == "join-room-card") {
    //     return;
    // }
    // else {
    //     // console.log("i did the else")
    // }
    // console.log(style_card_cell_name.value);
    if (style_card_cell_name.value.length < 12) {
        myPlayer.playerName = style_card_cell_name.value;
        display_cell_name = style_card_cell_name.value;
    }
    if (style_card_cell_name.value.length < 1) {
        myPlayer.playerName = "-";
        display_cell_name = "-";
    }
    if (socket) {
        let packet = {
            name: myPlayer.playerName,
            hue: playerConfig.hue,
            border_hue: playerConfig.border_hue
        }
        socket.emit("player style update", packet)
    }

})
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Graphicks

let ever_changing_value = 0.00;

function drawWords() {

    if (score_words.length == 0) {
        // console.log("EGINE AFTO");
        return;
    }
    score_words.forEach((word, i) => {



        // console.log(word);
        // text = 0 
        // x = 1 
        // y = 2 
        // ticks = 3

        let tick_factor = 100 - word.ticks;

        c.fillStyle = "hsl(157, 85%, 50%)";
        c.strokeStyle = 'black';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.globalAlpha = 1 - tick_factor / 100;
        c.font = 'bold ' + 40 + 'px cursive';
        c.lineWidth = 3;
        c.strokeText(word.text, word.pos.x, word.pos.y - tick_factor);
        c.lineWidth = 15;
        c.fillText(word.text, word.pos.x, word.pos.y - tick_factor);

        word.ticks--;

        if (word.ticks <= 0) {
            setTimeout(() => {
                //console.log("BGALAME MIA WORD");
                score_words.splice(i, 1);
            })


        }


    })


}

function drawPlayerWithPoints() {

    c.save();

    let myPlayer = state.myPlayer;
    let playerConfig = state.playerConfig;


    myPlayer.cells.forEach((cell) => {



        c.lineWidth = playerConfig.lineWidth;
        c.strokeStyle = `hsla(${playerConfig.border_hue},100%,40%)`;
        c.fillStyle = `hsla(${playerConfig.hue},100%,50%)`;
        // // console.log(cell.radius);


        var points = 20 + ~~(cell.mass / 5);
        var increase = Math.PI * 2 / points; //  xwrizei se mikra toksa ton kyklo kai meta sto xStore mazeyei ta shmeia panw sthn perimetro tou

        var xpoints = [];
        var ypoints = [];
        var cpx_points = [];
        var cpy_points = [];


        var spin = 0.0;

        if (cell.virus == true) {
            // console.log("BRHKA CELL ME VIRUS");
            for (let i = 0; i < points; i++) {
                let x = cell.pos.x + cell.radius * Math.cos(spin);
                let y = cell.pos.y + cell.radius * Math.sin(spin);

                let cpx = cell.pos.x + 1.5 * cell.radius * Math.cos(spin + increase / 2) + 0.1 * cell.radius * Math.cos(spin + increase / 2) * Math.cos(ever_changing_value);
                let cpy = cell.pos.y + 1.5 * cell.radius * Math.sin(spin + increase / 2) + 0.1 * cell.radius * Math.sin(spin + increase / 2) * Math.cos(ever_changing_value);


                ever_changing_value += 0.0005;



                if (x < 0) {
                    x = 0;
                }



                if (y < 0) {
                    y = 0;
                }


                if (x > playerConfig.worldWidth) {
                    x = playerConfig.worldWidth;
                }


                if (y > playerConfig.worldHeight) {
                    y = playerConfig.worldHeight;
                }


                spin += increase;
                xpoints[i] = x;
                ypoints[i] = y;
                cpx_points[i] = cpx;
                cpy_points[i] = cpy;
            }
            for (i = 0; i < points; ++i) {
                if (i === 0) {
                    c.beginPath();
                    c.moveTo(xpoints[i], ypoints[i]);
                } else if (i > 0 && i < points - 1) {
                    c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
                } else {
                    c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
                    c.quadraticCurveTo(cpx_points[i], cpy_points[i], xpoints[0], ypoints[0]);
                }

            }

        }
        else {

            for (let i = 0; i < points; i++) {
                let x = cell.pos.x + cell.radius * Math.cos(spin) + 0.1 * cell.radius * Math.cos(spin + Math.cos(ever_changing_value / 3));
                let y = cell.pos.y + cell.radius * Math.sin(spin) + 0.1 * cell.radius * Math.sin(spin + Math.cos(ever_changing_value / 3));

                let cpx = cell.pos.x + cell.radius * Math.cos(spin + increase / 2) + 0 * cell.radius * Math.cos(spin + increase / 2) * (Math.cos(ever_changing_value + spin));
                let cpy = cell.pos.y + cell.radius * Math.sin(spin + increase / 2) + 0 * cell.radius * Math.sin(spin + increase / 2) * (Math.cos(ever_changing_value + spin));


                ever_changing_value += 0.0005;



                if (x < 0) {
                    x = 0;
                }
                if (cpx < 0) {
                    cpx = 0;
                }


                if (y < 0) {
                    y = 0;
                }
                if (cpy < 0) {
                    cpy = 0;
                }

                if (x > playerConfig.worldWidth) {
                    x = playerConfig.worldWidth;
                }
                if (cpx > playerConfig.worldWidth) {
                    cpx = playerConfig.worldWidth;
                }

                if (y > playerConfig.worldHeight) {
                    y = playerConfig.worldHeight;
                }
                if (cpy > playerConfig.worldHeight) {
                    cpy = playerConfig.worldHeight;
                }

                spin += increase;
                xpoints[i] = x;
                ypoints[i] = y;
                cpx_points[i] = cpx;
                cpy_points[i] = cpy;
            }

            for (i = 0; i < points; ++i) {
                if (i === 0) {
                    c.beginPath();
                    c.moveTo(xpoints[i], ypoints[i]);
                } else if (i > 0 && i < points - 1) {
                    c.lineTo(xpoints[i], ypoints[i]);
                } else {
                    c.lineTo(xpoints[i], ypoints[i]);
                    c.lineTo(xpoints[0], ypoints[0]);
                }

            }

        }



        //  for (i = 0; i < points; ++i) {
        //      if (i === 0) {
        //          c.beginPath();
        //          c.moveTo(xpoints[i], ypoints[i]);
        //      } else if (i > 0 && i < points - 1) {
        //          c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
        //      } else {
        //          c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
        //          c.quadraticCurveTo(cpx_points[i], cpy_points[i], xpoints[0], ypoints[0]);
        //      }

        //  }

        c.shadowColor = `hsla(${playerConfig.hue},100%,50%)`;
        // c.shadowBlur = 80;
        c.shadowOffsetX = 0;
        c.shadowOffsetY = 0;


        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.fill();
        c.stroke();

        c.fillStyle = playerConfig.textColor;
        c.strokeStyle = 'black';
        //  c.textBorder = '10';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'bold ' + cell.radius / 2 + 'px cursive';
        c.lineWidth = 5;
        c.strokeText(myPlayer.playerName, cell.pos.x, cell.pos.y);
        c.lineWidth = playerConfig.lineWidth;
        c.fillText(myPlayer.playerName, cell.pos.x, cell.pos.y);

    })

    c.restore();

}

function drawEnemies2() {

    let myEnemies = state.myEnemies;

    myEnemies.forEach((enemy) => {

        enemy.cells.forEach((cell) => {
            c.lineWidth = playerConfig.lineWidth;

            c.strokeStyle = `hsla(${enemy.border_hue},100%,40%)`;
            c.fillStyle = `hsla(${enemy.hue},100%,50%)`;



            var points = 20 + ~~(cell.mass / 5);
            var increase = Math.PI * 2 / points; //  xwrizei se mikra toksa ton kyklo kai meta sto xStore mazeyei ta shmeia panw sthn perimetro tou

            var xpoints = [];
            var ypoints = [];
            var cpx_points = [];
            var cpy_points = [];


            var spin = 0.0;
            if (cell.virus == true) {
                // console.log("BRHKA CELL ME VIRUS");
                for (let i = 0; i < points; i++) {
                    let x = cell.pos.x + cell.radius * Math.cos(spin);
                    let y = cell.pos.y + cell.radius * Math.sin(spin);

                    let cpx = cell.pos.x + 1.5 * cell.radius * Math.cos(spin + increase / 2) + 0.1 * cell.radius * Math.cos(spin + increase / 2) * Math.cos(ever_changing_value);
                    let cpy = cell.pos.y + 1.5 * cell.radius * Math.sin(spin + increase / 2) + 0.1 * cell.radius * Math.sin(spin + increase / 2) * Math.cos(ever_changing_value);


                    ever_changing_value += 0.0005;



                    if (x < 0) {
                        x = 0;
                    }



                    if (y < 0) {
                        y = 0;
                    }


                    if (x > playerConfig.worldWidth) {
                        x = playerConfig.worldWidth;
                    }


                    if (y > playerConfig.worldHeight) {
                        y = playerConfig.worldHeight;
                    }


                    spin += increase;
                    xpoints[i] = x;
                    ypoints[i] = y;
                    cpx_points[i] = cpx;
                    cpy_points[i] = cpy;
                }
                for (i = 0; i < points; ++i) {
                    if (i === 0) {
                        c.beginPath();
                        c.moveTo(xpoints[i], ypoints[i]);
                    } else if (i > 0 && i < points - 1) {
                        c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
                    } else {
                        c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
                        c.quadraticCurveTo(cpx_points[i], cpy_points[i], xpoints[0], ypoints[0]);
                    }

                }

            }
            else {

                for (let i = 0; i < points; i++) {
                    let x = cell.pos.x + cell.radius * Math.cos(spin) + 0.1 * cell.radius * Math.cos(spin + Math.cos(ever_changing_value / 3));
                    let y = cell.pos.y + cell.radius * Math.sin(spin) + 0.1 * cell.radius * Math.sin(spin + Math.cos(ever_changing_value / 3));

                    let cpx = cell.pos.x + cell.radius * Math.cos(spin + increase / 2) + 0 * cell.radius * Math.cos(spin + increase / 2) * (Math.cos(ever_changing_value + spin));
                    let cpy = cell.pos.y + cell.radius * Math.sin(spin + increase / 2) + 0 * cell.radius * Math.sin(spin + increase / 2) * (Math.cos(ever_changing_value + spin));


                    ever_changing_value += 0.0005;



                    if (x < 0) {
                        x = 0;
                    }
                    if (cpx < 0) {
                        cpx = 0;
                    }


                    if (y < 0) {
                        y = 0;
                    }
                    if (cpy < 0) {
                        cpy = 0;
                    }

                    if (x > playerConfig.worldWidth) {
                        x = playerConfig.worldWidth;
                    }
                    if (cpx > playerConfig.worldWidth) {
                        cpx = playerConfig.worldWidth;
                    }

                    if (y > playerConfig.worldHeight) {
                        y = playerConfig.worldHeight;
                    }
                    if (cpy > playerConfig.worldHeight) {
                        cpy = playerConfig.worldHeight;
                    }

                    spin += increase;
                    xpoints[i] = x;
                    ypoints[i] = y;
                    cpx_points[i] = cpx;
                    cpy_points[i] = cpy;
                }

                for (i = 0; i < points; ++i) {
                    if (i === 0) {
                        c.beginPath();
                        c.moveTo(xpoints[i], ypoints[i]);
                    } else if (i > 0 && i < points - 1) {
                        c.lineTo(xpoints[i], ypoints[i]);
                    } else {
                        c.lineTo(xpoints[i], ypoints[i]);
                        c.lineTo(xpoints[0], ypoints[0]);
                    }

                }

            }




            c.lineJoin = 'round';
            c.lineCap = 'round';
            c.fill();
            c.stroke();


            //  c.beginPath();
            //  c.arc(canvas.width / 2 - playerConfig.visionCenter.x + cell.pos.x, canvas.height / 2 - playerConfig.visionCenter.y + cell.pos.y,
            //      cell.radius, 0, Math.PI * 2, false);
            //  c.fill();
            //  c.stroke();


            c.shadowColor = `hsla(${enemy.hue},100%,50%)`;
            // c.shadowBlur = 80;
            c.shadowOffsetX = 0;
            c.shadowOffsetY = 0;


            c.lineJoin = 'round';
            c.lineCap = 'round';
            c.fill();
            c.stroke();



            c.fillStyle = playerConfig.textColor;
            c.strokeStyle = 'black';
            //  c.textBorder = '10';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.font = 'bold ' + cell.radius / 2 + 'px cursive';
            c.lineWidth = 5;
            c.strokeText(enemy.name, cell.pos.x, cell.pos.y);
            c.fillText(enemy.name, cell.pos.x, cell.pos.y);

        })




    })

}

function drawEnemies3() {
    let myEnemies = state.myEnemies;



    myEnemies.forEach((cell) => {
        c.lineWidth = playerConfig.lineWidth;
        // console.log(myEnemy_players, cell.father);
        let enemy = myEnemy_players[cell.father];
        if (enemy == undefined) {
            enemy = {
                border_hue: "red",
                hue: "red"
            }
        }

        if (enemy.ghost) {
            console.log("BRHKA GHOST")
            c.globalAlpha = 0.2;

        }
        c.strokeStyle = `hsla(${enemy.border_hue},100%,40%)`;
        c.fillStyle = `hsla(${enemy.hue},100%,50%)`;





        var points = 20 + ~~(cell.radius / 5);
        var increase = Math.PI * 2 / points; //  xwrizei se mikra toksa ton kyklo kai meta sto xStore mazeyei ta shmeia panw sthn perimetro tou

        var xpoints = [];
        var ypoints = [];
        var cpx_points = [];
        var cpy_points = [];


        var spin = 0.0;
        if (cell.virus == true) {
            // console.log("BRHKA CELL ME VIRUS");
            for (let i = 0; i < points; i++) {
                let x = cell.pos.x + cell.radius * Math.cos(spin);
                let y = cell.pos.y + cell.radius * Math.sin(spin);

                let cpx = cell.pos.x + 1.5 * cell.radius * Math.cos(spin + increase / 2) + 0.1 * cell.radius * Math.cos(spin + increase / 2) * Math.cos(ever_changing_value);
                let cpy = cell.pos.y + 1.5 * cell.radius * Math.sin(spin + increase / 2) + 0.1 * cell.radius * Math.sin(spin + increase / 2) * Math.cos(ever_changing_value);


                ever_changing_value += 0.0005;



                if (x < 0) {
                    x = 0;
                }



                if (y < 0) {
                    y = 0;
                }


                if (x > playerConfig.worldWidth) {
                    x = playerConfig.worldWidth;
                }


                if (y > playerConfig.worldHeight) {
                    y = playerConfig.worldHeight;
                }


                spin += increase;
                xpoints[i] = x;
                ypoints[i] = y;
                cpx_points[i] = cpx;
                cpy_points[i] = cpy;
            }
            for (i = 0; i < points; ++i) {
                if (i === 0) {
                    c.beginPath();
                    c.moveTo(xpoints[i], ypoints[i]);
                } else if (i > 0 && i < points - 1) {
                    c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
                } else {
                    c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
                    c.quadraticCurveTo(cpx_points[i], cpy_points[i], xpoints[0], ypoints[0]);
                }

            }

        }
        else {

            for (let i = 0; i < points; i++) {
                let x = cell.pos.x + cell.radius * Math.cos(spin) + 0.1 * cell.radius * Math.cos(spin + Math.cos(ever_changing_value / 3));
                let y = cell.pos.y + cell.radius * Math.sin(spin) + 0.1 * cell.radius * Math.sin(spin + Math.cos(ever_changing_value / 3));

                let cpx = cell.pos.x + cell.radius * Math.cos(spin + increase / 2) + 0 * cell.radius * Math.cos(spin + increase / 2) * (Math.cos(ever_changing_value + spin));
                let cpy = cell.pos.y + cell.radius * Math.sin(spin + increase / 2) + 0 * cell.radius * Math.sin(spin + increase / 2) * (Math.cos(ever_changing_value + spin));


                ever_changing_value += 0.0005;



                if (x < 0) {
                    x = 0;
                }
                if (cpx < 0) {
                    cpx = 0;
                }


                if (y < 0) {
                    y = 0;
                }
                if (cpy < 0) {
                    cpy = 0;
                }

                if (x > playerConfig.worldWidth) {
                    x = playerConfig.worldWidth;
                }
                if (cpx > playerConfig.worldWidth) {
                    cpx = playerConfig.worldWidth;
                }

                if (y > playerConfig.worldHeight) {
                    y = playerConfig.worldHeight;
                }
                if (cpy > playerConfig.worldHeight) {
                    cpy = playerConfig.worldHeight;
                }

                spin += increase;
                xpoints[i] = x;
                ypoints[i] = y;
                cpx_points[i] = cpx;
                cpy_points[i] = cpy;
            }

            for (i = 0; i < points; ++i) {
                if (i === 0) {
                    c.beginPath();
                    c.moveTo(xpoints[i], ypoints[i]);
                } else if (i > 0 && i < points - 1) {
                    c.lineTo(xpoints[i], ypoints[i]);
                } else {
                    c.lineTo(xpoints[i], ypoints[i]);
                    c.lineTo(xpoints[0], ypoints[0]);
                }

            }

        }




        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.fill();
        c.stroke();


        //  c.beginPath();
        //  c.arc(canvas.width / 2 - playerConfig.visionCenter.x + cell.pos.x, canvas.height / 2 - playerConfig.visionCenter.y + cell.pos.y,
        //      cell.radius, 0, Math.PI * 2, false);
        //  c.fill();
        //  c.stroke();


        c.shadowColor = `hsla(${enemy.hue},100%,50%)`;
        // c.shadowBlur = 80;
        c.shadowOffsetX = 0;
        c.shadowOffsetY = 0;


        c.lineJoin = 'round';
        c.lineCap = 'round';
        c.fill();
        c.stroke();



        c.fillStyle = playerConfig.textColor;
        c.strokeStyle = 'black';
        //  c.textBorder = '10';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'bold ' + cell.radius / 2 + 'px cursive';
        c.lineWidth = 5;
        c.strokeText(enemy.name, cell.pos.x, cell.pos.y);
        c.fillText(enemy.name, cell.pos.x, cell.pos.y);


        if (enemy.ghost) {
            console.log("BRHKA GHOST")
            c.globalAlpha = 1;

        }

    })






}

function clearCanvas2() {
    c.clearRect(-2500, -2500, playerConfig.worldWidth + 2800, playerConfig.worldHeight + 2800);

}

function drawBackgroundGrid() {

    c.save();
    let worldWidth = playerConfig.worldWidth;
    let worldHeight = playerConfig.worldHeight;



    c.globalAlpha = 1;

    // c.fillStyle = "black";
    //c.fillRect(-2000, -2000, worldWidth + 4000, worldHeight + 4000);

    c.fillStyle = "red";
    c.strokeStyle = "red";
    c.lineWidth = 15;





    let draw_border = 2000;
    let step = (worldWidth + 4000) / 100;

    c.beginPath();
    for (var x = -2000; x < worldWidth + 2000; x += step) {
        c.moveTo(x, -2000);


        c.lineTo(x, worldHeight + 4000);

        c.stroke();


    }

    for (var y = -2000; y < worldHeight + 2000; y += step) {
        c.moveTo(y, -2000);


        c.lineTo(y, worldWidth + 4000);

        c.stroke();

    }
    c.closePath();
    c.fillStyle = 'hsl(157, 85%, 50%)';
    //  c.fillRect(playerConfig.visionCenter.x - draw_border, playerConfig.visionCenter.y - draw_border, 5000, 5000);

    c.globalAlpha = 1;

    //  Draws borders
    c.lineWidth = 40;


    c.strokeStyle = 'hsl(157, 85%, 50%)';
    c.shadowColor = `hsl(157,100%,50%)`;
    // c.shadowBlur = 40;


    c.moveTo(0, 0);
    c.beginPath();

    c.lineTo(worldWidth, 0);
    c.lineTo(worldWidth, worldHeight);
    c.lineTo(0, worldHeight);
    c.lineTo(0, 0);
    c.lineTo(worldWidth, 0);
    c.closePath();

    c.stroke();

    c.restore();

}

function drawBackgroundImage2() {

    c.save();
    let worldWidth = playerConfig.worldWidth;
    let worldHeight = playerConfig.worldHeight;



    c.globalAlpha = 1;


    let draw_border = 2000;

    let step = 500;


    for (var x = -2000; x < worldWidth + 2000; x += step) {
        for (var y = -2000; y < worldHeight + 2000; y += step) {

            if (x > playerConfig.visionCenter.x - draw_border && x < playerConfig.visionCenter.x + draw_border) {
                if (y > playerConfig.visionCenter.y - draw_border && y < playerConfig.visionCenter.y + draw_border) {
                    c.drawImage(img, 0, 0, 741, 733, x, y, step, step);
                }
            }

        }
    }

    c.fillStyle = 'hsl(157, 85%, 50%)';
    //  c.fillRect(playerConfig.visionCenter.x - draw_border, playerConfig.visionCenter.y - draw_border, 5000, 5000);

    c.globalAlpha = 1;

    //  Draws borders
    c.lineWidth = 40;


    c.strokeStyle = 'hsl(157, 85%, 50%)';
    c.shadowColor = `hsl(157,100%,50%)`;
    // c.shadowBlur = 40;


    c.moveTo(0, 0);
    c.beginPath();

    c.lineTo(worldWidth, 0);
    c.lineTo(worldWidth, worldHeight);
    c.lineTo(0, worldHeight);
    c.lineTo(0, 0);
    c.lineTo(worldWidth, 0);
    c.closePath();

    c.stroke();

    c.restore();

}

function drawFoods2() {


    let distance = 0;

    let myFoods = state.myFoods;

    // To draw only the close foods

    //  for (let i = 0; i < myFoods.length; i++) {
    //      distance = Math.hypot(myFoods[i].pos.y - playerConfig.visionCenter.y, myFoods[i].pos.x - playerConfig.visionCenter.x);
    //      if (distance > 1200) {
    //          myFoods.splice(i, 1);
    //          i += -1;
    //      }
    //  }

    c.save();

    // c.shadowBlur = 18;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;
    c.lineWidth = 4;

    myFoods.forEach((food) => {

        c.beginPath();
        let lightness = 60 + 5 * Math.sin(jumpingFoods);
        c.fillStyle = 'hsla(' + food.hue + ',100%,' + lightness + '%)';
        c.arc(food.pos.x + Math.sin(jumpingFoods) * Math.random() * 0.1 * food.radius / 2, + food.pos.y + Math.sin(jumpingFoods) * food.radius / 2, food.radius, 0, Math.PI * 2, false);

        c.shadowColor = 'hsla(' + food.hue + ',100%,' + lightness + '%)';


        c.fill();

    });

    c.restore();

}

function drawMasses() {

    c.save();

    let myMasses = state.myMasses;

    // c.shadowBlur = 18;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;
    c.lineWidth = 4;

    Object.keys(myMasses).forEach((id) => {
        let mass = myMasses[id];
        // console.log(mass);

        c.strokeStyle = `hsla(${mass.hue},100%,40%)`;
        c.fillStyle = `hsla(${mass.hue},70%,50%)`;

        c.beginPath();
        let lightness = 60 + 5 * Math.sin(jumpingFoods);
        // c.fillStyle = 'hsla(' + mass.hue + ',100%,' + lightness + '%)';
        c.arc(mass.pos.x + Math.sin(jumpingFoods) * Math.random() * 0.1 * mass.radius / 2, + mass.pos.y + Math.sin(jumpingFoods) * mass.radius / 2, mass.radius, 0, Math.PI * 2, false);

        c.shadowColor = 'hsla(' + mass.hue + ',100%,' + lightness + '%)';


        c.fill();
        c.stroke();

    });

    c.restore();

}

function drawViruses() {

    let myViruses = state.myViruses;

    c.fillStyle = "#25BE25";
    c.strokeStyle = "#107110";
    c.lineWidth = 8;

    myViruses.forEach((cell) => {


        c.lineWidth = playerConfig.lineWidth;
        //  c.strokeStyle = `hsla(${playerConfig.hue},100%,40%)`;
        //  c.fillStyle = `hsla(${playerConfig.hue},70%,50%)`;
        // // console.log(cell.radius);


        var points = 20;// 20 + ~~(cell.mass / 5);
        var increase = Math.PI * 2 / points; //  xwrizei se mikra toksa ton kyklo kai meta sto xStore mazeyei ta shmeia panw sthn perimetro tou

        var xpoints = [];
        var ypoints = [];
        var cpx_points = [];
        var cpy_points = [];


        var spin = 0.0;


        for (let i = 0; i < points; i++) {
            let x = cell.pos.x + cell.radius * Math.cos(spin);
            let y = cell.pos.y + cell.radius * Math.sin(spin);

            let cpx = cell.pos.x + 1.5 * cell.radius * Math.cos(spin + increase / 2) + 0.1 * cell.radius * Math.cos(spin + increase / 2) * Math.cos(ever_changing_value);
            let cpy = cell.pos.y + 1.5 * cell.radius * Math.sin(spin + increase / 2) + 0.1 * cell.radius * Math.sin(spin + increase / 2) * Math.cos(ever_changing_value);


            ever_changing_value += 0.0005;



            if (x < 0) {
                x = 0;
            }



            if (y < 0) {
                y = 0;
            }


            if (x > playerConfig.worldWidth) {
                x = playerConfig.worldWidth;
            }


            if (y > playerConfig.worldHeight) {
                y = playerConfig.worldHeight;
            }


            spin += increase;
            xpoints[i] = x;
            ypoints[i] = y;
            cpx_points[i] = cpx;
            cpy_points[i] = cpy;
        }

        for (i = 0; i < points; ++i) {
            if (i === 0) {
                c.beginPath();
                c.moveTo(xpoints[i], ypoints[i]);
            } else if (i > 0 && i < points - 1) {
                c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
            } else {
                c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
                c.quadraticCurveTo(cpx_points[i], cpy_points[i], xpoints[0], ypoints[0]);
            }

        }

        //  for (i = 0; i < points; ++i) {
        //      if (i === 0) {
        //          c.beginPath();
        //          c.moveTo(xpoints[i], ypoints[i]);
        //      } else if (i > 0 && i < points - 1) {
        //          c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
        //      } else {
        //          c.quadraticCurveTo(cpx_points[i - 1], cpy_points[i - 1], xpoints[i], ypoints[i]);
        //          c.quadraticCurveTo(cpx_points[i], cpy_points[i], xpoints[0], ypoints[0]);
        //      }

        //  }

        //  c.shadowColor = `hsla(${playerConfig.hue},70%,50%)`;
        //  // c.shadowBlur = 80;
        //  c.shadowOffsetX = 0;
        //  c.shadowOffsetY = 0;


        c.lineJoin = 'round';
        c.lineCap = 'round';

        c.stroke();
        c.fill();



        //  c.beginPath();
        //  c.arc(virus.pos.x, virus.pos.y, virus.radius, 0, Math.PI * 2, false);
        //  c.fill();
        //  c.stroke();



    })



}

let jumpingFoods = 0;
let zoom = 1;
let newzoom = 1;
let scaleFactor = 1;
let game_over = true;



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  Game Logic
let myPlayer = {
    cells: [],
    playerName: '',
    totalMass: 40,
    initialMass: 40,
    initialRadius: 40,
    totalRadius: 40,
    roomName: null
};

let myFoods = [];
let myEnemies = [];
let myEnemy_players = {};
let myViruses = [];
let myMasses = {};
let score_words = [];

let interpollation_flag = true;
let prediction_flag = true;
let broadcast_ups = 60;

let state = {
    myFoods: [],
    myEnemies: [],
    myViruses: [],
    myMasses: {},
    myPlayer: {},
    playerConfig: {},
    score_words: []
}

let current_state = {
    myFoods: [],
    myEnemies: [],
    myViruses: [],
    myMasses: [],
    myPlayer: {},
    playerConfig: {},
    score_words: []
}

let target_state = {
    myFoods: [],
    myEnemies: [],
    myViruses: [],
    myMasses: [],
    myPlayer: {},
    playerConfig: {},
    score_words: []
}


let old_state = {
    myEnemies: [],
    myViruses: [],
}

let new_state = {
    myEnemies: [],
    myViruses: [],
}
let updates_received = 2;

let playerConfig = {
    scale: 1,
    textColor: 'white',
    hue: null,
    border_hue: null,
    lineWidth: 10,
    worldWidth: null,
    radius: null,
    worldHeight: null,
    visionCenter: { x: null, y: null }, //  player position in Game world
    numOfBackgroundLines: null,
    startOfWorld: { x: null, y: null },
};

let foodConfig = {
    lineWidth: 5
};
let lastCells;
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let ping_array = [];
function showPing(ping) {

    // let ping = 0;
    // ping = curr - prev;
    // //  
    // ping_array.push(ping);

    // if (ping_array.length == 1000) {
    //     //  find mean value
    //     let mean = 0;
    //     for (let i = 0; i < ping_array.length; i++) {
    //         mean += ping_array[i];
    //     }
    //     mean = mean / ping_array.length;

    //     // find max ping
    //     let max = Math.max(...ping_array);

    //     // show them to user
    //     document.querySelector("#pingDiv").innerHTML = "Ping: " + ping;
    //     document.querySelector("#pingDiv").innerHTML += "<br>"
    //     document.querySelector("#pingDiv").innerHTML += `Spike: ` + max;
    //     // clear array
    //     ping_array = [];
    // }

    document.querySelector("#pingDiv").innerHTML = "Ping: " + ping;


}

function draw_first_frame() {
    calculateState();
    //renderState();
    c.save();
    clearCanvas2();
    c.translate(canvas.width / 2, canvas.height / 2);

    //  CALCULATE ZOOM FACTOR ACCORDING TO HOW MUCH YOUR CELLS GREW
    newzoom = -0.0013875 * state.myPlayer.totalRadius + 2.0555;
    scaleFactor = scaleFactor + 0.1 * (newzoom - scaleFactor);


    c.scale(scaleFactor, scaleFactor);
    c.translate(-state.playerConfig.visionCenter.x, -state.playerConfig.visionCenter.y);
    //drawBackgroundGrid();
    drawBackgroundImage2();
    jumpingFoods += 0;
    drawFoods2();
    drawMasses();
    drawViruses();
    drawEnemies2();
    //drawEnemies3();
    drawPlayerWithPoints();
    c.translate(state.playerConfig.visionCenter.x - canvas.width / 2, state.playerConfig.visionCenter.y - canvas.height / 2);


    c.restore();
}
function game_start_animation() {
    document.querySelector("#transition-to-game-div").style.display = 'flex';
    document.querySelector("#transition-to-game-div").style.justifyContent = 'center';
    document.querySelector("#transition-to-game-div").style.alignItems = 'center';

    document.querySelector("#div-3-2-1").style.display = "block";
    document.querySelector("#screen-info").style.display = "none";
    document.querySelector("#ghost-countdown").style.display = "none";
    let sec = 3;
    document.querySelector("#div-3-2-1").innerText = sec;
    let countDown_Interval = setInterval(() => {
        if (sec == 0) {


            clearInterval(countDown_Interval);

            socket.emit("ready to go");
            document.querySelector("#transition-to-game-div").style.display = 'none';
            return;
        }

        sec -= 1;
        if (sec == 0) {
            document.querySelector("#div-3-2-1").innerText = "GO!";
        }
        else {
            document.querySelector("#div-3-2-1").innerText = sec;

        }

    }, 1000)

}
function ghost_animation() {
    document.querySelector("#transition-to-game-div").style.display = 'flex';
    document.querySelector("#transition-to-game-div").style.justifyContent = 'center';
    document.querySelector("#transition-to-game-div").style.alignItems = 'center';
    let sec = 5;
    document.querySelector("#ghost-countdown").innerText = sec;
    document.querySelector("#screen-info").style.display = "block";
    document.querySelector("#div-3-2-1").style.display = "none";
    document.querySelector("#ghost-countdown").style.display = "block";

    let countDown_Interval = setInterval(() => {
        if (sec == 0) {

            clearInterval(countDown_Interval);

            // socket.emit("ready to un-ghost");
            //  document.querySelector("#transition-to-game-div").style.display = 'none';
            return;
        }

        sec -= 1;
        if (sec == 0) {
            document.querySelector("#ghost-countdown").innerText = "GO!";
        }
        else {
            document.querySelector("#ghost-countdown").innerText = sec;

        }

    }, 1000)

}

function create_current_state() {

}
let previous_packet_time = 0;
let current_packet_time = 0;
let updates;
// sockets
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function handleSocket(socket) {

    socket.on('init', (data) => {
        previous_packet_time = Date.now();

        //playerConfig.hue = display_hue;
        playerConfig.radius = data.radius;
        myPlayer.cells = data.cells;
        myPlayer.playerName = data.playerName;
        myPlayer.roomName = data.roomName;
        playerConfig.visionCenter = data.position;

        playerConfig.worldWidth = data.worldWidth;
        playerConfig.worldHeight = data.worldHeight;
        playerConfig.numOfBackgroundLines = data.numOfBackgroundLines;

        broadcast_ups = data.broadcast_ups;

        myFoods = data.foods;
        // console.log(data.foods);
        // console.log(data.enemies);
        myViruses = data.viruses;
        myEnemy_players = { ...data.enemies };
        myEnemies = [];
        // myMasses = data.masses
        // // console.log(myFoods);

        // create current state 
        updates_received = 2;
        create_current_state();

        //  HIDE UI AND REVEAL CANVAS AND GAME CONTAINER
        UI_container.style.display = 'none';

        // //  if you start game from join room screen
        // document.querySelector("#roomDiv").style.display = 'none';
        // joinRoomScreen.style.display = 'none';

        // // if you start game from create room screen
        // creatingRoomScreen.style.display = 'none';

        gameContainer.style.display = 'block';

        //START THE ANIMATION LOOP
        game_over = false;
        userStatus = "playing";
        start_target_interval();
        enable_game_events();
        //  draw_first_frame();
        animloop();

        // to start_animation() xreiazetai na prostheseis pragmata gia na kanei swsta to game-over
        // start_animation();
    });
    socket.on("init room game", (data) => {
        previous_packet_time = Date.now();

        playerConfig.radius = data.radius;
        myPlayer.cells = data.cells;
        myPlayer.playerName = data.playerName;
        myPlayer.roomName = data.roomName;
        playerConfig.visionCenter = data.position;

        playerConfig.worldWidth = data.worldWidth;
        playerConfig.worldHeight = data.worldHeight;
        playerConfig.numOfBackgroundLines = data.numOfBackgroundLines;

        broadcast_ups = data.broadcast_ups;

        //GET VIRUSES AND ENEMIES
        myFoods = data.foods;
        myViruses = data.viruses;
        myEnemy_players = { ...data.enemies };
        myEnemies = data.enemy_cells;


        // console.log("AFTOI OI ENEMIES HRTHAN ME TO INIT", data.enemies)

        //  HIDE UI AND REVEAL CANVAS AND GAME CONTAINER
        UI_container.style.display = 'none';
        gameContainer.style.display = 'block';

        // create_current_state();

        // DO THE START GAME ANIMATION
        updates_received = 2
        draw_first_frame();
        game_start_animation();

        //  START THE ANIMATION LOOP
        // game_over = false;
        // userStatus = "playing";
        // start_target_interval();
        // animloop();

    })

    socket.on("animate room game", () => {
        //  START THE ANIMATION LOOP
        game_over = false;
        userStatus = "playing";
        //  start_target_interval();
        //  clearState();
        enable_game_events();
        animloop();

    })

    socket.on('you are ghost', () => {
        // play the i am ghost screen 
        ghost_animation();

        // show text and count down till respawn
    })
    socket.on('he is ghost', (father_id) => {
        // find the enemy and set his alpha color
        myEnemy_players[father_id].ghost = true;

    })
    socket.on('you are not ghost', () => {
        document.querySelector("#transition-to-game-div").style.display = 'none';

    })
    socket.on('he is not ghost', (father_id) => {
        // find the enemy and set his alpha color
        myEnemy_players[father_id].ghost = false;

    })



    let packets_period = 10;
    let first_update = true;
    let count = packets_period;
    let current_update_time = 0;
    let previous_update_time = 0;
    let dt_store = 0;

    socket.on("u", (my_updates) => {
        if (first_update) {

            // start calculating time
            current_update_time = Date.now();
            previous_update_time = current_update_time;

        }
        if (!first_update) {
            count = count - 1;
            current_update_time = Date.now();
            let dt = current_update_time - previous_update_time;
            //// console.log(dt);
            dt_store += dt;

            previous_update_time = current_update_time;
        }
        if (count == 0) {
            // console.log(`last ${packets_period} packets latency`, dt_store / packets_period);
            showPing(dt_store / packets_period);
            dt_store = 0;
            count = packets_period;
        }

        first_update = false;
        updates = my_updates;


        let cells = [];
        let enemy_cells = [];
        let totalScore = 0;
        my_updates.forEach((array) => {
            switch (array[0]) {
                case 1: {
                    // vision center update 

                    //  INTERPOLATION FOR THE VALUE CHANGES OF VISION CENTER
                    let x = array[1];
                    let y = array[2];
                    if (!prediction_flag) {
                        playerConfig.visionCenter.x = playerConfig.visionCenter.x + 1 * (x - playerConfig.visionCenter.x);
                        playerConfig.visionCenter.y = playerConfig.visionCenter.y + 1 * (y - playerConfig.visionCenter.y);
                    }

                    //  playerConfig.visionCenter.x = visionCenter.x;
                    //  playerConfig.visionCenter.y = visionCenter.y;

                    // for target_state 
                    // target_state.playerConfig.visionCenter.x = x;
                    //  target_state.playerConfig.visionCenter.y = y;


                    break;
                }
                case 2: {
                    // my cells update 
                    cells.push({
                        id: array[1],
                        pos: {
                            x: array[2],
                            y: array[3]
                        },
                        radius: array[4],
                        mass: array[5],
                        virus: array[6] == 1 ? true : false,
                        mergeCooldown: array[7],
                        catapultForce: {
                            speed: (array.length > 8) ? array[8] : 0,
                            dx: (array.length > 8) ? array[9] : 0,
                            dy: (array.length > 8) ? array[10] : 0,
                            friction: (array.length > 8) ? array[10] : 0
                        }
                    })
                    break;
                }
                case 3: {
                    // enemy cells update 
                    enemy_cells.push({
                        father: array[1],
                        pos: {
                            x: array[2],
                            y: array[3]
                        },
                        radius: array[4],
                        virus: array[5] == 1 ? true : false,
                        id: array[6],
                    })
                    break;

                }
                case 4: {
                    // enemy palyers update 
                    // console.log(" AAAAAAAAAAAAAAAAAAAAAAAAA enemies map", array);
                    myEnemy_players[array[1]] = {
                        name: array[2],
                        hue: array[3],
                        border_hue: array[4],
                        ghost: false
                    }
                    break;
                }
                case 5: {
                    // foods eaten update 
                    // console.log("egina afto", array);
                    myFoods.forEach((food, index) => {
                        if (array[1] == food.id) {
                            // this food was eaten
                            myFoods.splice(index, 1);
                            // console.log("food removed ", myFoods.length);
                        }
                    })
                    break;
                }
                case 6: {
                    // foods born update 
                    // console.log(array);
                    myFoods.push(array[1]);
                    break;
                }
                case 7: {
                    // viruses update 
                    let id = array[1];
                    let status = array[2];

                    if (status == 0) {
                        //kill virus
                        myViruses.forEach((virus, index) => {
                            if (virus.id == id) {
                                myViruses.splice(index, 1);
                            }
                        })
                        // console.log("brhka ena skotwse virus");
                    }
                    if (status == 1) {
                        // update virus position and add 
                        let x = array[3];
                        let y = array[4];
                        let count = 0;
                        let found = false;
                        myViruses.forEach((virus, index) => {
                            if (virus.id == id) {
                                found = true;
                                // just update position
                                virus.pos.x = x;
                                virus.pos.y = y;

                            }
                        }
                        )
                        if (!found) {
                            // create new virus
                            myViruses.push({
                                id: id,
                                pos: {
                                    x: x,
                                    y: y
                                },
                                radius: 100
                            })
                        }


                    }
                    break;
                }
                case 8: {
                    // masses update 
                    let status = array[1];
                    let id = array[2];
                    // console.log("hrthe", array);
                    switch (status) {
                        case 0: {
                            // update mass position 
                            //  masses_updates.push([8, 0, mass.id, mass.pos.x, mass.pos.y]);
                            myMasses[id].pos.x = array[3];
                            myMasses[id].pos.y = array[4];

                            break;
                        }
                        case 1: {
                            // create new mass 
                            //  masses_updates.push([8, 1, mass.id, mass.hue, mass.radius, mass.pos.x, mass.pos.y])
                            myMasses[id] = {
                                hue: array[3],
                                radius: array[4],
                                pos: {
                                    x: array[5],
                                    y: array[6]
                                }
                            }

                            // console.log(myMasses);
                            break;
                        }
                        case 2: {
                            // delete mass 
                            // masses_updates.push([8, 2, mass.id]);

                            delete myMasses[id];
                            break;
                        }

                    }


                    break;
                }
                case 9: {
                    // pleon edw stelnei to total score 
                    totalScore = array[1];
                    break;
                }

                case 10: {

                    switch (array[1]) {
                        case 1: {
                            console.log("MOU HRTHE WORD", array);
                            let word = new Word("+1", array[2], array[3], 100)

                            score_words.push(word);
                            myFoods.forEach((food, index) => {
                                if (Math.abs(array[2] - food.pos.x) < 5 && Math.abs(array[3] - food.pos.y) < 5) {
                                    // this food was eaten
                                    myFoods.splice(index, 1);
                                    // console.log("ebgala to food");
                                    // word.text = "ebgala to food"
                                    // console.log("food removed ", myFoods.length);
                                }
                            })
                            //console.log(score_words);
                            break;
                        }
                        case 2: {
                            score_words.push(new Word("Cell +10", array[2], array[3], 100));

                            break;
                        }
                        case 3: {
                            score_words.push(new Word("Virus +20", array[2], array[3], 100));

                            break;
                        }
                        case 4: {
                            score_words.push(new Word("Max Mass Reached +50", array[2], array[3], 100));

                            break;
                        }


                    }
                    break;
                }

            }
        });

        myEnemies = enemy_cells;





        // set new state 


        let totalRadius = 0;
        let totalMass = 0;

        cells.forEach((cell) => {
            totalRadius += cell.radius;
            totalMass += cell.radius;
        })


        lastCells = JSON.parse(JSON.stringify(myPlayer.cells));
        myPlayer.cells = cells;





        // do interpollation

        lastCells.forEach((cell) => {
            for (i = 0; i < myPlayer.cells.length; i++) {
                if (cell.id == myPlayer.cells[i].id) {
                    //  RECONCILIATION 
                    //  myPlayer.cells[i].radius = (cell.radius + (0.25) * (myPlayer.cells[i].radius - cell.radius));
                    if (prediction_flag) {
                        myPlayer.cells[i].pos.x = (cell.pos.x + 0.1 * (myPlayer.cells[i].pos.x - cell.pos.x));
                        myPlayer.cells[i].pos.y = (cell.pos.y + 0.1 * (myPlayer.cells[i].pos.y - cell.pos.y));
                    }

                }
            }
        })


        myPlayer.cells.sort((a, b) => { a.radius - b.radius });
        myPlayer.cells.reverse();




        updates_received -= 1;

        // set old_state 


        if (updates_received == 1) {
            // set current state
            current_state.myEnemies = myEnemies;
            current_state.myFoods = myFoods;
            current_state.myViruses = myViruses;

            current_state.myPlayer = { ...myPlayer };
            current_state.myPlayer.cells = cells;
            current_state.playerConfig = { ...playerConfig };
            current_state.playerConfig.visionCenter.x = playerConfig.visionCenter.x;
            current_state.playerConfig.visionCenter.y = playerConfig.visionCenter.y;

            current_state.time = Date.now();


        }

        if (updates_received == 0) {
            // set target state 

            // target state 
            target_state.myEnemies = myEnemies;
            target_state.myFoods = myFoods;
            target_state.myViruses = myViruses;
            target_state.myPlayer = { ...myPlayer };
            target_state.myPlayer.cells = cells;
            target_state.playerConfig = { ...playerConfig };
            target_state.playerConfig.visionCenter.x = playerConfig.visionCenter.x;
            target_state.playerConfig.visionCenter.y = playerConfig.visionCenter.y;
            target_state.time = Date.now();
            console.log("ELABA", target_state.time);
        }

        if (updates_received < 0) {
            // set target state 
            current_state = JSON.parse(JSON.stringify(target_state));

            // target state 
            target_state.myEnemies = myEnemies;
            target_state.myFoods = myFoods;
            target_state.myViruses = myViruses;
            target_state.myPlayer = { ...myPlayer };
            target_state.myPlayer.cells = cells;
            target_state.playerConfig = { ...playerConfig };
            target_state.playerConfig.visionCenter.x = playerConfig.visionCenter.x;
            target_state.playerConfig.visionCenter.y = playerConfig.visionCenter.y;
            target_state.time = Date.now();
            console.log("ELABA", target_state.time);
        }

        // old state enemy_cells , viruses 

        // new state enemy_cells , viruses 




        myPlayer.totalRadius = totalRadius;
        myPlayer.totalMass = totalMass;


        document.querySelector('#TotalMass').innerHTML = "Total Mass :" + Math.round(totalMass * 100) / 100;
        document.querySelector('#FoodsEaten').innerHTML = "Total Score :" + totalScore;

        //  // console.log(totalMass);

        //  setStartOfWorld();
    })

    socket.on('playerUpdate', (package) => {
        current_packet_time = Date.now();

        showPing(previous_packet_time, current_packet_time);
        previous_packet_time = current_packet_time;


        let visionCenter = package.pos;
        let cells = package.cells;
        let foodsEaten = package.foodsEaten;



        if (package.foods_eaten.length >= 1) {
            // console.log(package.foods_eaten);

        }

        package.foods_eaten.forEach((id) => {
            myFoods.forEach((food, index) => {
                if (id == food.id) {
                    // this food was eaten
                    myFoods.splice(index, 1);
                    // console.log("food removed ", myFoods.length);
                }
            })
        })

        myFoods.push(...package.foods_born);

        package.virus_updates.forEach((update) => {
            let id = update[0];
            let status = update[1];

            if (status == 0) {
                //kill virus
                myViruses.forEach((virus, index) => {
                    if (virus.id == id) {
                        myViruses.splice(index, 1);
                    }
                })
                // console.log("brhka ena skotwse virus");
            }
            if (status == 1) {
                // update virus position and add 
                let x = update[2];
                let y = update[3];
                let count = 0;
                let found = false;
                myViruses.forEach((virus, index) => {
                    if (virus.id == id) {
                        found = true;
                        // just update position
                        virus.pos.x = x;
                        virus.pos.y = y;

                    }
                }
                )
                if (!found) {
                    // create new virus
                    myViruses.push({
                        id: id,
                        pos: {
                            x: x,
                            y: y
                        },
                        radius: 100
                    })
                }


            }
        })

        //myFoods = package.foods;
        //myViruses = package.viruses;

        package.enemy_players.forEach((enemy) => {
            myEnemy_players[enemy[1]] = {
                name: enemy[2],
                hue: enemy[3],
                border_hue: enemy[4]
            }
        })

        myEnemies = package.enemies;
        myMasses = package.masses;


        //  INTERPOLATION FOR THE VALUE CHANGES OF VISION CENTER

        playerConfig.visionCenter.x = playerConfig.visionCenter.x + 0.1 * (visionCenter.x - playerConfig.visionCenter.x);
        playerConfig.visionCenter.y = playerConfig.visionCenter.y + 0.1 * (visionCenter.y - playerConfig.visionCenter.y);
        //  playerConfig.visionCenter.x = visionCenter.x;
        //  playerConfig.visionCenter.y = visionCenter.y;

        let totalRadius = 0;
        let totalMass = 0;


        cells.forEach((cell) => {
            totalRadius += cell.radius;
            totalMass += cell.mass;
        })


        let lastCells = [...myPlayer.cells];
        myPlayer.cells = cells;




        // scaleFactor = (zoom + 0.27 * (newzoom - zoom)) / zoom;

        lastCells.forEach((cell) => {
            for (i = 0; i < myPlayer.cells.length; i++) {
                if (cell.id == myPlayer.cells[i].id) {
                    //  INTERPOLLATION 
                    myPlayer.cells[i].radius = (cell.radius + 0.05 * (myPlayer.cells[i].radius - cell.radius));
                    myPlayer.cells[i].pos.x = (cell.pos.x + 0.5 * (myPlayer.cells[i].pos.x - cell.pos.x));
                    myPlayer.cells[i].pos.y = (cell.pos.y + 0.5 * (myPlayer.cells[i].pos.y - cell.pos.y));
                    //  myPlayer.cells[i].radius = (myPlayer.cells[i].radius + 0.0001 * (cell.radius - myPlayer.cells[i].radius));
                }
            }
        })


        myPlayer.cells.sort((a, b) => { a.radius - b.radius });
        myPlayer.cells.reverse();


        myPlayer.totalRadius = totalRadius;
        myPlayer.totalMass = totalMass;


        document.querySelector('#TotalMass').innerHTML = "Total Mass :" + Math.round(totalMass * 100) / 100;
        document.querySelector('#FoodsEaten').innerHTML = "Foods Eaten :" + foodsEaten;

        //  // console.log(totalMass);

        //  setStartOfWorld();
    });

    socket.on('players joined', (players, roomData) => {
        console.log("AFTO FTANEI EDw");
        console.log(players, roomData);

        if (cardStatus == 'create-my-room-card') {
            // console.log("Egine afto")

            // reveal roomDiv
            document.querySelector("#my-room-div").style.display = 'block'
            document.querySelector("#create-room-note-div").style.display = 'none'
            document.querySelector("#my-room-div").setAttribute('data-room-id', roomData.roomId);


            // set inputs to unable to change
            document.querySelector("#room-name").style.display = 'none';
            document.querySelector("#room-password").style.display = 'none';
            document.querySelector("#room-name-p").style.display = 'block';
            document.querySelector("#room-name-p").innerText = roomData.roomName;
            document.querySelector("#room-password-p").style.display = 'block';
            document.querySelector("#room-password-p").innerText = document.querySelector("#room-password").value;

            // render players who joined
            let spans = document.querySelector("#players-joined-div").querySelectorAll(".player-span");

            for (let i = 0; i < spans.length; i++) {
                if (i + 1 <= players.length) {
                    spans[i].innerText = '';
                    spans[i].innerText = `${i + 1}) ${players[i]}`
                }
                else {
                    spans[i].innerText = '';
                    spans[i].innerText = `${i + 1})`;
                }
            }

            // add invitation link
            let link;
            // takes invitation id from server 
            socket.emit("get invitation");

            // merge invitation id with window.location 
            socket.on("invitation id", (id) => {
                // console.log("to id pou erxetai", id);
                // invitation_id = [...id];
                link = window.location + "invited/" + "?invitation_id=" + id;
                // document.querySelector("#link-p").innerText = "";
                // document.querySelector("#link-p").innerText = link;
                document.querySelector("#clipboard-btn").addEventListener('click', () => {
                    console.log("eginaa")
                    navigator.clipboard.writeText(link);
                })


            });

            // disable create-my-room-btn
            create_my_room_btn.removeEventListener("click", handle_create_my_room_btn);
            create_my_room_btn.style.backgroundColor = 'grey';
        }
        else if (cardStatus == 'join-room-card') {

            // hide available rooms and join with link
            document.querySelector("#rooms-container").style.display = 'none';
            //document.querySelector("#join-with-link-div").style.display = 'none';

            // reveal joined a room div
            document.querySelector("#joined-a-room-div").style.display = 'block';

            // render the data from server
            document.querySelector("#joined-a-room-div").querySelector("#joined-room-name-p").innerText = "Room : " + roomData.roomName;
            document.querySelector("#joined-a-room-div").querySelector("#joined-room-host-p").innerText = "Host : " + roomData.admin.playerName;

            let spans = document.querySelector("#joined-a-room-div").querySelectorAll(".player-span");

            for (let i = 0; i < spans.length; i++) {
                if (i + 1 <= players.length) {
                    spans[i].innerText = '';
                    spans[i].innerText = `${i + 1}) ${players[i]}`
                }
                else {
                    spans[i].innerText = '';
                    spans[i].innerText = `${i + 1})`;
                }
            }

            document.querySelector("#leave-the-joined-room").addEventListener("click", () => {
                // reset join-room-card
                document.querySelector("#rooms-container").style.display = 'block';
                //document.querySelector("#join-with-link-div").style.display = 'block';
                document.querySelector("#joined-a-room-div").style.display = 'none';

                socket.disconnect();
                document.querySelector("#refresh-rooms").addEventListener("click", handle_refresh_rooms_btn);

                get_available_rooms();
            })

        }

    })

    socket.on('Leaderboard', (data) => {
        // console.log(data);

        for (let i = 0; i < 10; i++) {
            let str = "#pos" + (i + 1);

            if (i <= data.length - 1) {
                document.querySelector(str).innerHTML = data[i].position + ". " + data[i].username;
                if (data[i].itsMe) {
                    document.querySelector(str).style.color = "green";
                }
                else {
                    document.querySelector(str).style.color = "black";
                }
            }
            else {
                document.querySelector(str).innerHTML = (i + 1) + ". ";
            }


        }

    })


    socket.on('available_rooms', (rooms) => {
        // console.log(rooms);
        // clear older rooms
        document.getElementById("rooms-container").innerHTML = "";

        available_rooms = rooms;
        available_rooms.forEach((room) => {
            renderRoom(room);

        });

    });

    socket.on('room not found', (msg) => {
        document.querySelector("#alert_p").innerHTML = msg;
        document.querySelector("#alertModal").style.display = 'block';

        document.querySelector("#alert_modal_button").addEventListener('click', () => {
            document.querySelector("#alertModal").style.display = 'none';
            refresh_rooms_btn.addEventListener("click", handle_refresh_rooms_btn);

            get_available_rooms();
        })
    })


    socket.on('countDown', (str) => {
        document.querySelector("#countDownTimer").style.display = 'block';
        // console.log("ERXOMAI");
        document.querySelector("#timer").innerHTML = str;

    })

    socket.on('room-game-over', (data) => {
        // console.log("ROOM GAME IS OVER");
        // console.log(data);

        document.querySelector("#board").style.display = 'none';
        document.querySelector("#roomGameResults").innerHTML = '';

        let div = document.createElement('div');
        div.setAttribute('id', 'room-game-results-div');

        data.forEach((object) => {
            let div2 = document.createElement('div');
            div.setAttribute('class', 'results-div');

            let span1 = document.createElement('span');
            span1.innerHTML = "Name: " + object.username;
            div2.appendChild(span1);
            div2.appendChild(document.createElement('br'));

            let span2 = document.createElement('span');
            span2.innerHTML = "Foods Eaten: " + object.foodsEaten;
            div2.appendChild(span2);
            div2.appendChild(document.createElement('br'));
            let span3 = document.createElement('span');
            span3.innerHTML = "Cells Eaten: " + object.cellsEaten;
            div2.appendChild(span3);
            div2.appendChild(document.createElement('br'));
            let span4 = document.createElement('span');
            span4.innerHTML = "Virus Eaten: " + object.virusEaten;
            div2.appendChild(span4);
            div2.appendChild(document.createElement('br'));
            let span5 = document.createElement('span');
            span5.innerHTML = "Total Score: " + object.totalScore;
            div2.appendChild(span5);


            div.appendChild(div2);
            div.appendChild(document.createElement('br'));
        })

        document.querySelector("#roomGameResults").appendChild(div);

        document.querySelector("#countDownTimer").style.display = 'none';

        gameContainer.style.display = 'none';
        game_over = true;
        ever_changing_value = 0;
        userStatus = "ui";
        UI_container.style.display = 'block';
        hide_cards();
        finalScoreBoard.style.display = 'block';
        clearState();
        disable_game_events();
        socket.disconnect();


    })


    socket.on('admin left', () => {
        //  show alert modal 
        document.querySelector("#adminLeftModal").style.display = 'block';
        document.querySelector("#return_from_admin_left").addEventListener('click', () => {
            //  retrun home
            //init_UI();
            document.querySelector("#adminLeftModal").style.display = 'none';

            // reset join-room-card
            refresh_rooms_btn.addEventListener("click", handle_refresh_rooms_btn);
            document.querySelector("#rooms-container").style.display = 'block';
            document.querySelector("#joined-a-room-div").style.display = 'none';

            get_available_rooms();
        })

    })

    socket.on('defeated', (score) => {
        // // console.log("FINAL SCORE ", score);
        document.querySelector("#roomGameResults").innerHTML = '';

        document.querySelector("#board").style.display = 'block';
        document.querySelector('#foodsEaten').innerHTML = "Foods Eaten : " + score.foodsEaten;
        document.querySelector('#cellsEaten').innerHTML = "Cells Eaten : " + score.cellsEaten;
        document.querySelector('#eliminations').innerHTML = "Eliminations : " + score.eliminations;
        document.querySelector('#highestMass').innerHTML = "Highest Mass Reached : " + score.highestMassReached;
        document.querySelector('#timeStayedAlive').innerHTML = "Time Stayed Alive : " + score.timeStayedAlive;
        document.querySelector('#highestPosition').innerHTML = "Highest Position : " + score.highestPosition;

        document.querySelector("#countDownTimer").style.display = 'none';

        game_over = true;
        ever_changing_value = 0;
        gameContainer.style.display = 'none';
        userStatus = "ui";
        UI_container.style.display = 'block';

        hide_cards();
        finalScoreBoard.style.display = 'block';

        disable_game_events();
        socket.disconnect();


    });

}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ canvas events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

window.addEventListener('resize', event => {
    event.preventDefault();
    // console.log("EGINE RESIZE");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

});

// disables zoom from control + wheel
document.addEventListener(
    "wheel",
    function touchHandler(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

// disables zoom from control + '+' or '-'
window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.which === 61 || e.which === 107 || e.which === 173 || e.which === 109 || e.which === 187 || e.which === 189)) {
        e.preventDefault();
    }
}, false);


let vision_offset = { x: 0, y: 0 }
let target = { x: 0, y: 0 }

let inputs = [
    {
        name: "sendTarget",
        triggered: false,
        data: null,
    },
    {
        name: "split",
        triggered: false
    },
    {
        name: "eject mass",
        triggered: false
    },
    {
        name: "eject virus",
        triggered: false
    }]

function enable_game_events() {

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

}
function disable_game_events() {

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('keydown', handleKeyDown);

}

function handleMouseMove(event) {
    //  // console.log("ΣΤΕΙΛΕ");
    local_target.x = event.clientX - canvas.width / 2;
    local_target.y = event.clientY - canvas.width / 2;

    target.x = event.clientX - canvas.width / 2;
    target.y = event.clientY - canvas.height / 2;

    inputs.forEach((input) => {
        if (input.name == "sendTarget") {
            input.data = target;
            input.triggered = true;
        }
    })
}
function start_target_interval() {
    setInterval(() => {
        socket.emit('sendTarget', target);
        vision_offset.x = 0.5 * target.x;
        vision_offset.y = 0.5 * target.y;
    }, 1000 / 60);
}


function handleKeyDown(event) {

    switch (event.keyCode) {
        case 32: {

            inputs.forEach((input) => {
                if (input.name == "split") {
                    input.triggered = true;
                }
            })
            socket.emit('split');
            break;
        }
        case 81: {
            inputs.forEach((input) => {
                if (input.name == "eject mass") {
                    input.triggered = true;
                }
            })
            socket.emit('eject mass');
            break;
        }
        case 87: {
            inputs.forEach((input) => {
                if (input.name == "eject virus") {
                    input.triggered = true;
                }
            })
            socket.emit('eject virus');
            break;
        }
    }

}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
