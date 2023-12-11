var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const game = require('./game.js')
const gc = require('./gameConfig.json');
const util = require('./utilities.js');
const roomsJs = require('./rooms.js');
const { Server } = require('http');

const port = process.env.PORT || 3000;

// {
//   setHeaders: function (res, path, stat) {
//     res.set('Set-Cookie', "myCookie=cookieValue;Path=/")
//   }
// }


app.use(express.static(__dirname + '/../client'));

app.use("/invited", (req, res, next) => {
    // console.log("EGINE TO REQUEST", req.query);
    if (req.query.invitation_id) {
        console.log("STELNW cookie");
        res.cookie("invitation_id", req.query.invitation_id, {
            maxAge: 5000
        });
    }

    next();
});

app.get("/invited_player", (req, res) => {
    console.log("ti stelnei to invited player", req.query);
    console.log(invitations);
    console.log(invitations[req.query.invitation_id]);
    res.send(invitations[req.query.invitation_id]);

})

app.use('/invited', express.static(__dirname + '/../client'));


let extra_size = [];

for (let i = 0; i < 5000; i++) {
    extra_size.push('a');
}
let invitations = {};

let players = {};

let rooms = {
    liveWorld: {
        roomName: "liveWorld",
        //players: game.create_bots(1, "liveWorld"),
        players: {},
        foods: game.createFoods(),
        active: true,
        freeToJoin: null,
        roomId: null,
        viruses: game.createViruses(),
        state: "playing",
        admin: {
            playerName: "QQQQQQQQQQQQ",
            admin_id: "QQQQQQQQQqQ"
        },
        masses: [],

        foods_eaten: [],
        foods_born: [],
        virus_updates: [],
        masses_updates: []



    }
};



if (process.env.PORT == 3001) {
    game.load_bot_rooms(rooms, 200);
}

// konta sto 380 einai to orio , gia parapanw de ksekinaei kan
// game.load_bot_rooms(rooms, 50);

io.on('connection', function (client) {

    //on connection
    console.log("Somebody connected!", client.id);

    // create entry on players object 
    players[client.id] = {
        bot: false,
        game_object: null,
        socket: client,
        name: null,
        hue: null,
        border_hue: null,
        roomId: null,
        roomName: null,
        ready_to_go: false,
        father_id: util.makeid(3),
        i_am_new_ticks: 3,
        my_updates: [],
        my_update_ticks: 0,

        // foods_eaten: [],
        // foods_born: [],
        // virus_updates: [],
        // masses_updates: []
    }



    client.on("player style update", (packet) => {

        // set the new style to the player
        players[client.id].name = packet.name;
        players[client.id].hue = packet.hue;
        players[client.id].border_hue = packet.border_hue;

        // if he joined a room update the room
        if (players[client.id].roomId) {
            let players_joined = roomsJs.getRoomPlayers(rooms[players[client.id].roomId]);
            let roomData = roomsJs.getRoomData(rooms[players[client.id].roomId]);

            io.to(players[client.id].roomId).emit('players joined', players_joined, roomData);
        }



    })

    client.on('play', (packet) => {

        let arrayOfCells = util.getCellsOfTheRoom(rooms['liveWorld']);
        let arrayOfViruses = rooms['liveWorld'].viruses;
        let newPlayer = game.newPlayer([...arrayOfCells, ...arrayOfViruses]);

        players[client.id].game_object = newPlayer;
        //players[client.id] = {};
        //players[client.id].socket = client;
        // console.log('players', players);
        // console.log(newPlayer);
        //console.log(players);

        client.join("liveWorld");
        players[client.id].name = packet.name;
        players[client.id].game_object.name = packet.name;
        players[client.id].game_object.hue = packet.hue;
        players[client.id].game_object.border_hue = packet.border_hue;
        players[client.id].roomName = 'liveWorld';
        players[client.id].roomId = 'liveWorld';


        rooms.liveWorld.players[client.id] = players[client.id];



        let enemy_players = { ...roomsJs.getRoomEnemies(rooms.liveWorld, client.id) };
        let package = {
            // INITIALIZATION PACKAGE
            radius: newPlayer.cells[0].radius,
            // cells: [{
            //     radius: newPlayer.cells[0].radius,
            //     mass: newPlayer.cells[0].mass,
            //     pos: newPlayer.cells[0].pos,
            //     id: newPlayer.cells[0].id

            // }],
            cells: newPlayer.cells,
            playerName: rooms.liveWorld.players[client.id].name,
            position: newPlayer.pos,
            worldWidth: gc.gameWidth,
            worldHeight: gc.gameHeight,
            numOfBackgroundLines: gc.numOfBackgroundLines,
            roomName: rooms.liveWorld.players[client.id].roomName,
            masses: rooms.liveWorld.masses,
            viruses: rooms.liveWorld.viruses,
            foods: rooms.liveWorld.foods,
            enemies: enemy_players,
            broadcast_ups: gc.broadcast_ups
        }

        client.emit('init', package);
    });


    client.on('createRoomGame', (packet, roomName, roomPassword) => {
        console.log("mou hrthe room")

        //add name to players
        players[client.id].name = packet.name;
        players[client.id].hue = packet.hue;
        players[client.id].border_hue = packet.border_hue;
        // create id - socket_room_name 
        let roomId = util.makeid(6);

        // creates entry to the rooms object
        rooms[roomId] = {};
        rooms[roomId].roomName = roomName;
        rooms[roomId].players = {};
        rooms[roomId].players[client.id] = players[client.id];
        rooms[roomId].active = false;
        rooms[roomId].freeToJoin = false;
        rooms[roomId].admin = {
            playerName: packet.name,
            admin_id: client.id
        }
        rooms[roomId].roomId = roomId;
        rooms[roomId].state = "creation";

        rooms[roomId].foods_eaten = [];
        rooms[roomId].foods_born = [];
        rooms[roomId].virus_updates = [];
        rooms[roomId].masses_updates = [];




        // foods_eaten: [],
        // foods_born: [],
        // virus_updates: [],
        // masses_updates: []



        // joins socket.io room
        client.join(rooms[roomId].roomId);

        players[client.id].roomName = roomName;
        players[client.id].roomId = rooms[roomId].roomId;

        // send back to the client who joined the room
        let players_joined = roomsJs.getRoomPlayers(rooms[roomId]);

        let roomData = roomsJs.getRoomData(rooms[roomId]);
        roomData['roomId'] = roomId;
        client.emit('players joined', players_joined, roomData);
        console.log("New room was created ", rooms[roomId]);

    });


    client.on('get_available_rooms', () => {
        let available_rooms = [];
        console.log("EFTASA");

        Object.keys(rooms).forEach((roomId) => {

            if (rooms[roomId].freeToJoin == true) {
                console.log(rooms[roomId].roomName);
                available_rooms.push(
                    {
                        roomName: rooms[roomId].roomName,
                        admin: rooms[roomId].admin,
                        people_joined: roomsJs.getRoomPlayers(rooms[roomId]).length,
                        roomId: rooms[roomId].roomId

                    }
                )
            }
        });

        client.emit('available_rooms', available_rooms);

    })

    client.on('join invitation', (roomId, packet) => {
        console.log("TI FTANEI APO TO join room", roomId, packet);
        try { rooms[roomId].players }
        catch (err) {
            // the room doesnt exist anymore 
            client.emit('room not found', "This room doesnt exist anymore, try join another room");
            return;
        }

        if (Object.keys(rooms[roomId].players).length >= 5) {
            client.emit('room not found', "This room is full!");
            return;
        }

        //add name
        players[client.id].name = packet.name;
        players[client.id].hue = packet.hue;
        players[client.id].border_hue = packet.border_hue;


        //add player to the room
        rooms[roomId].players[client.id] = players[client.id];
        players[client.id].roomId = rooms[roomId].roomId;
        players[client.id].roomName = rooms[roomId].roomName;
        client.join(roomId);
        console.log(rooms[roomId]);

        //broadcast data for prepare-room-phase
        let players_joined = roomsJs.getRoomPlayers(rooms[roomId]);
        let roomData = roomsJs.getRoomData(rooms[roomId]);

        io.to(roomId).emit('players joined', players_joined, roomData);



    })

    client.on('join room', (roomId, packet) => {
        //console.log("TI FTANEI APO TO join room", roomId, clientName);
        try { rooms[roomId].players }
        catch (err) {
            // the room doesnt exist anymore 
            client.emit('room not found', "This room doesnt exist anymore, try join another room");
            return;
        }

        if (Object.keys(rooms[roomId].players).length >= 5) {
            client.emit('room not found', "This room is full!");
            return;
        }

        //add name
        players[client.id].name = packet.name;
        players[client.id].hue = packet.hue;
        players[client.id].border_hue = packet.border_hue;


        //add player to the room
        rooms[roomId].players[client.id] = players[client.id];
        players[client.id].roomId = rooms[roomId].roomId;
        players[client.id].roomName = rooms[roomId].roomName;
        client.join(roomId);
        console.log(rooms[roomId]);

        //broadcast data for prepare-room-phase
        let players_joined = roomsJs.getRoomPlayers(rooms[roomId]);
        let roomData = roomsJs.getRoomData(rooms[roomId]);

        io.to(roomId).emit('players joined', players_joined, roomData);

    })

    client.on('start room game', () => {


        // give each player a game object 
        let room = rooms[players[client.id].roomId];
        rooms[players[client.id].roomId].freeToJoin = false;
        room.foods = game.createFoods();
        room.viruses = game.createViruses();
        room.masses = [];

        // create game_object for each player of the room
        let arrayOfCells = [];
        Object.keys(room.players).forEach((id) => {
            //let arrayOfCells = util.getCellsOfTheRoom(room);
            let arrayOfViruses = room.viruses
            let newPlayer = game.newPlayer([...arrayOfCells, ...arrayOfViruses]);

            newPlayer.hue = players[id].hue;
            newPlayer.border_hue = players[id].border_hue;
            players[id].game_object = newPlayer;
            arrayOfCells.push({
                pos: {
                    x: players[id].game_object.pos.x,
                    y: players[id].game_object.pos.y
                },
                radius: players[id].game_object.cells[0].radius
            })

        });



        Object.keys(room.players).forEach((id) => {

            // find the enemies with room function


            //send back to clients init packages
            let package = {
                // initialization package
                start: {
                    x: -players[id].game_object.pos.x,
                    y: -players[id].game_object.pos.y
                },
                radius: players[id].game_object.cells[0].radius,
                cells: players[id].game_object.cells,
                playerName: players[id].name,
                position: players[id].game_object.pos,
                worldWidth: gc.gameWidth,
                worldHeight: gc.gameHeight,
                numOfBackgroundLines: gc.numOfBackgroundLines,
                roomName: room.roomName,
                viruses: room.viruses,
                enemies: roomsJs.getRoomEnemies(room, client.id),
                foods: room.foods,
                broadcast_ups: gc.broadcast_ups,
                enemy_cells: []
            }

            package.viruses = room.viruses;
            package.foods = room.foods;

            let enemies = [];


            if (Object.keys(room.players).length > 1) {
                //gather every player's enemies

                Object.keys(room.players).forEach((id2) => {
                    if (id2 == id) {

                    } else {
                        let pack = {
                            name: players[id2].name,
                            cells: players[id2].game_object.cells,
                            hue: players[id2].game_object.hue,
                            border_hue: players[id2].game_object.border_hue
                        }
                        enemies.push(pack);
                    }
                })


            }
            package.enemy_cells = [...enemies];
            console.log("enemies", enemies);

            players[id].socket.emit('init room game', package);

        });
        // we need to set null the admin of the room so the server wont break if admin leaves during count-down
        rooms[players[client.id].roomId].admin = {};
        rooms[players[client.id].roomId].active = true;
        rooms[players[client.id].roomId].state = "playing";

    })

    client.on("ready to go", () => {

        players[client.id].ready_to_go = true;

        // check if all players of the room are ready to go
        let room = rooms[players[client.id].roomId];
        let all_ready_to_go = true;

        // if all clients leave before the count down ends then this code gives error , so we add the if to prevet this
        Object.keys(room.players).forEach((id) => {
            if (!players[id].ready_to_go) {
                all_ready_to_go = false;
            }
        });


        if (all_ready_to_go) {
            io.to(room.roomId).emit('animate room game');

            // when the room game starts running we set to null the admin so even if the admin leave , the admin-left event wont fire
            rooms[players[client.id].roomId].admin = {};

            room.countDown = gc.roomGameDuration;

            let countDownInterval = setInterval(() => {
                let thisRoom = room;
                let str = '';
                let minutes = Math.floor(thisRoom.countDown / 60);
                let seconds = thisRoom.countDown % 60


                str = '0' + minutes + ':' + ((seconds < 10) ? '0' : '') + seconds;
                io.to(thisRoom.roomId).emit('countDown', str);
                thisRoom.countDown -= 1;

                if (thisRoom.countDown == -1 && rooms[thisRoom.roomId]) {
                    // if every player of room pressed quit , the room is deleted from memory with clear rooms function so there is no reason to send events and this 
                    // code will also cause errors

                    // we use adminLeft so we can un-link the roomId from players
                    Object.keys(rooms[thisRoom.roomId].players).forEach((player) => {
                        players[player].roomId = null;
                    })


                    io.to(thisRoom.roomId).emit('room-game-over', roomsJs.roomGameResults(thisRoom));

                    clearInterval(countDownInterval);

                    // delete room
                    delete rooms[thisRoom.roomId];
                }
            }, 1000);

            room.active = true;
            room.state = "playing";


        }


    })

    client.on("get invitation", () => {
        // creates invitation id 
        let invitation_id = util.makeid(9);

        //creates entry to the invitations object 
        invitations[invitation_id] = {
            invitation_id: invitation_id,
            room_admin: players[client.id].name,
            room_name: players[client.id].roomName,
            room_id: players[client.id].roomId

        }



        // sends back to the client-room admin the id for the link
        client.emit('invitation id', invitation_id);
    })

    client.on("set-public", (roomId, status) => {


        if (status == 'public') {
            rooms[roomId].freeToJoin = true;
        }
        else if (status == 'private') {
            rooms[roomId].freeToJoin = false;
        }

    })

    client.on('sendTarget', (target) => {

        // game.updateTarget(target, players[client.id].game_object);
    });



    client.on('split', () => {

    });

    client.on('eject mass', () => {

    })

    client.on("quit", () => {

        if (players[client.id].game_object != null)
            client.emit("defeated", players[client.id].game_object.score);


    })

    client.on("player input", (input_data) => {
        if (players[client.id].game_object == null) {
            return;
        }
        input_data.forEach((input) => {
            if (input.name == "sendTarget") {
                let target = input.data;
                game.updateTarget(target, players[client.id].game_object);
            }
            else if (input.name == "split") {

                if (players[client.id].game_object.cells.length >= 8) {

                } else {
                    players[client.id].game_object.split();
                }
            }
            else if (input.name == "eject mass") {
                // players[client.id].game_object.eject_mass(rooms[players[client.id].roomId].masses);
            }
            else if (input.name == "eject virus") {
                players[client.id].game_object.eject_virus(rooms[players[client.id].roomId].viruses, client.id);
            }
        })
    })



    client.on('disconnect', () => {


        // everytime this event handler is called , a player is leaving the game so we make the appropriate actions

        if (players[client.id].roomId) {

            let roomId2 = players[client.id].roomId;
            let clientId = client.id;

            setTimeout(() => {

                delete rooms[roomId2].players[client.id];
                delete players[client.id];

                if (rooms[roomId2].state = "creation") {

                    if (rooms[roomId2].admin.admin_id == clientId) {
                        console.log("TO ROOM DIAGRAFTHKE");

                        roomsJs.adminLeft(roomId2, players, rooms);
                        io.to(roomId2).emit('admin left');

                    } else {
                        // the player just joined the room , he was not the admin
                        io.to(roomId2).emit('players joined', roomsJs.getRoomPlayers(rooms[roomId2]), roomsJs.getRoomData(rooms[roomId2]));
                    }

                }
                roomsJs.clearRooms(rooms);
                console.log("exoun meinei 111 " + Object.keys(players).length);
                console.log("ta rooms pou yparxoun 111 ", Object.keys(rooms));
            }, 0);

        } else {
            // player left before playing in any room so we just delete him from players

            setTimeout(() => {
                let id = client.id;
                delete players[id];
                // if a room is left with no players we delete it , except  if it was the liveworld
                roomsJs.clearRooms(rooms);
                console.log("exoun meinei 222 " + Object.keys(players).length);
                console.log("ta rooms pou yparxoun 222 ", Object.keys(rooms));

            }, 0);

        }


    });



});


setInterval(() => {


    Object.keys(rooms).forEach((roomId) => {

        if (rooms[roomId].active == true) {

            let players = { ...rooms[roomId].players };
            let foods = rooms[roomId].foods;
            let viruses = rooms[roomId].viruses;
            let masses = rooms[roomId].masses;


            // let foods_eaten = [];
            // let foods_born = [];
            // let virus_updates = [];
            // let masses_updates = [];

            let foods_eaten = rooms[roomId].foods_eaten;
            let foods_born = rooms[roomId].foods_born;
            let virus_updates = rooms[roomId].virus_updates;
            let masses_updates = rooms[roomId].masses_updates;

            // update position for each player

            // Object.keys(players).forEach((id) => {
            //     players[id].game_object.updatePosition();
            // })

            // check each cell collision with other entities
            Object.keys(players).forEach((id) => {


                let score_words = [];
                // if player is a bot then call generate inputs 
                if (players[id].bot) {
                    //console.log("eimai bot")
                    game.generate_inputs(players[id]);
                }
                if (players[id].game_object.ghost) {

                    if (Date.now() > players[id].game_object.ghost_start + 5000) {
                        players[id].game_object.ghost = false;
                        players[id].socket.emit('you are not ghost');
                        io.to(roomId).emit('he is not ghost', players[id].father_id);
                    }

                }


                players[id].game_object.updateMass();

                players[id].game_object.updatePosition();


                // check for food collissions 
                players[id].game_object.cells.forEach((cell) => {
                    foods.forEach((food, foodIndex) => {
                        if (Math.hypot(cell.pos.x - food.pos.x, cell.pos.y - food.pos.y) < cell.radius) {
                            //On Collision with food

                            foods_eaten.push(foods[foodIndex].id);
                            score_words.push([10, 1, food.pos.x, food.pos.y]);
                            foods.splice(foodIndex, 1);



                            // cell.radius = Math.sqrt(sum / Math.PI) + 0.0005 * Math.sqrt(sum / Math.PI); //util.massToRadius(cell.mass);

                            if (players[id].game_object.totalMass < gc.maxTotalMass) {
                                let res = gc.maxTotalMass - players[id].game_object;

                                let increase = food.mass //food.radius * 0.2;

                                if (increase >= res) {
                                    cell.radius += res;
                                }
                                else {
                                    cell.radius += increase;
                                }
                            }
                            //cell.radius += food.radius * 0.2;

                            //cell.mass = cell.radius;
                            players[id].game_object.foodsEaten += 1;
                            players[id].game_object.score.foodsEaten += 1;
                            //console.log(cell.radius, food.radius);

                            // if (players[id].bot && cell.radius >= 120) {
                            //     cell.radius = 120;
                            //     cell.mass = 120;
                            // }

                        }
                    })
                });

                //check for virus collissions
                players[id].game_object.cells.forEach((cell) => {
                    viruses.forEach((virus, virusIndex) => {
                        if (Math.hypot(cell.pos.x - virus.pos.x, cell.pos.y - virus.pos.y) < cell.radius) {
                            //On Collision with virus check if the virus has effect on the cell
                            if (cell.radius > virus.radius + 20) {
                                //console.log(id, virus.fatherId, virus)
                                if (virus.catapultForce && virus.catapultForce.speed > 0 && virus.fatherId == id) {
                                    //check if virus is on catapult and if it is its father cell and if so , do nothing
                                } else {
                                    //remove eaten virus
                                    virus_updates.push([virus.id, 0])
                                    score_words.push([10, 3, virus.pos.x, virus.pos.y])
                                    viruses.splice(virusIndex, 1);

                                    // do the virus-split on the cell
                                    players[id].game_object.virusSplit(cell)

                                    players[id].game_object.score.virusEaten += 1;

                                }


                            }



                        }
                    })
                });



                //check for masses collisions 
                // players[id].game_object.cells.forEach((cell) => {
                //     masses.forEach((mass, massIndex) => {

                //         if (Math.hypot(cell.pos.x - mass.pos.x, cell.pos.y - mass.pos.y) < cell.radius) {
                //             //On Collision with mass
                //             masses.splice(massIndex, 1);
                //             masses_updates.push([8, 2, mass.id]);
                //             let sum = Math.PI * cell.radius * cell.radius + 2 * Math.PI * mass.radius * mass.radius;

                //             cell.radius = Math.sqrt(sum / Math.PI) + 0.0005 * Math.sqrt(sum / Math.PI); //util.massToRadius(cell.mass);
                //             cell.mass = cell.radius;
                //         }
                //     })
                // })



                //check for players collisions
                for (let i = 0; i < Object.keys(players).length; i++) {
                    let id2 = Object.keys(players)[i];
                    // an yparxei sygkroush metaksy twn kyttarwn toy paikth na ginetai continue

                    // for the interaction between the cells of the same player
                    if (id == id2) {

                        // if only one cell just continue
                        if (players[id].game_object.cells.length == 1) {

                        }
                        else {

                            for (let j = 0; j < players[id2].game_object.cells.length; j++) {
                                for (k = 0; k < players[id].game_object.cells.length; k++) {

                                    if (j < 0 || j > players[id2].game_object.cells.length - 1) {
                                        continue;
                                    }
                                    // If the 2 itterators look at the same cell do nothing
                                    if (k === j || k >= players[id2].game_object.cells.length || j >= players[id].game_object.cells.length || j < 0 || k < 0) {
                                        continue;
                                    }
                                    else {

                                        let distance = Math.hypot(players[id].game_object.cells[k].pos.x - players[id2].game_object.cells[j].pos.x,
                                            players[id].game_object.cells[k].pos.y - players[id2].game_object.cells[j].pos.y);

                                        if (distance < players[id].game_object.cells[k].radius || distance < players[id2].game_object.cells[j].radius && players[id].game_object.cells[k].mergeCooldown == 0 && players[id2].game_object.cells[j].mergeCooldown == 0) {
                                            // ginetai overlap metaksy kyttarwn
                                            if (players[id].game_object.cells[k].mass >= players[id2].game_object.cells[j].mass && players[id].game_object.cells[k].mergeCooldown <= 0 && players[id2].game_object.cells[j].mergeCooldown <= 0) {
                                                // to megalytero kyttaro trwei to mikrotero
                                                players[id].game_object.cells[k].mass += players[id2].game_object.cells[j].mass;
                                                players[id].game_object.cells[k].radius += players[id].game_object.cells[j].radius;

                                                // an ena apo ta dyo eixe virus tote kai to enwmeno tha exei virus
                                                if (players[id].game_object.cells[k].virus || players[id].game_object.cells[j].virus) {
                                                    players[id].game_object.cells[k].virus = true;
                                                }


                                                // afairoume to fagomeno kyttaro apo to array
                                                players[id2].game_object.cells.splice(j, 1);
                                                j -= 1;

                                            }
                                        }
                                    }
                                }

                            }

                        }

                    }

                    // for the interaction between the cells of different players
                    else {

                        for (let j = 0; j < players[id2].game_object.cells.length; j++) {
                            for (k = 0; k < players[id].game_object.cells.length; k++) {

                                if (players[id2].game_object.ghost || players[id].game_object.ghost) {
                                    continue;
                                }

                                if (j < 0 || j > players[id2].game_object.cells.length - 1) {
                                    continue;
                                }

                                let distance = Math.hypot(players[id].game_object.cells[k].pos.x - players[id2].game_object.cells[j].pos.x,
                                    players[id].game_object.cells[k].pos.y - players[id2].game_object.cells[j].pos.y);

                                if (distance < players[id].game_object.cells[k].radius || distance < players[id2].game_object.cells[j].radius) {
                                    // ginetai overlap metaksy kyttarwn
                                    if (players[id].game_object.cells[k].mass > players[id2].game_object.cells[j].mass) {
                                        // to megalytero kyttaro trwei to mikrotero

                                        // elegxoume thn synolikh maza na menei katw apo gc.maxTotalMass
                                        if (players[id].game_object.totalMass < gc.maxTotalMass) {
                                            let res = gc.maxTotalMass - players[id].game_object.totalMass;

                                            let increase = players[id2].game_object.cells[j].radius;

                                            if (increase >= res) {
                                                players[id].game_object.cells[k].radius += res;
                                            }
                                            else {
                                                players[id].game_object.cells[k].radius += increase;
                                            }
                                        }
                                        // an to fagomeno kyttaro eixe virus tote kane to virus split
                                        if (players[id2].game_object.cells[j].virus) {

                                            // do the virus-split on the cell
                                            players[id].game_object.virusSplit(players[id].game_object.cells[k])
                                        }


                                        score_words.push([10, 2, players[id2].game_object.cells[j].pos.x, players[id2].game_object.cells[j].pos.y])

                                        if (players[id].bot && players[id].game_object.cells[k].radius >= 120) {
                                            players[id].game_object.cells[k].radius = 120;
                                            players[id].game_object.cells[k].mass = 120;
                                        }

                                        players[id].game_object.score.cellsEaten += 1;

                                        // afairoume to fagomeno kyttaro apo to array

                                        if (players[id2].game_object.cells.length > 1) {


                                            players[id2].game_object.cells.splice(j, 1);
                                            j -= 1;


                                        }

                                        else {

                                            players[id].game_object.score.eliminations += 1;

                                            if (players[id2].roomId == 'liveWorld') {



                                                players[id2].game_object.cells.splice(j, 1);
                                                j -= 1;

                                                if (!players[id2].bot && !players[id2].game_object.bot) {
                                                    // an den einai bot , steile defeated kanonika.
                                                    if (players[id2].game_object != null)
                                                        players[id2].socket.emit('defeated', players[id2].game_object.score);
                                                    // console.log("ESTEILA DEFEATED STON " + players[id2].name);
                                                }


                                            } else {
                                                // respawn player to the room
                                                players[id2].game_object.cells[j].radius = gc.initialRadius;


                                                // make the player ghost

                                                players[id2].game_object.ghost = true;
                                                players[id2].game_object.ghost_start = Date.now();
                                                players[id2].socket.emit('you are ghost');
                                                io.to(roomId).emit('he is ghost', players[id2].father_id);




                                                // set countdown timer for un-ghost 


                                                // players[id2].game_object.ghost = false;
                                                // players[id2].socket.emit('you are not ghost');
                                                // io.to(roomId).emit('he is not ghost', players[id2].father_id);


                                            }

                                        }




                                    }

                                }
                            }
                        }
                    }



                }
                // update total mass 
                players[id].game_object.updateMass();

                if (players[id].game_object.totalMass >= 300) {
                    players[id].game_object.maxMassReachedTicks -= 1;

                    if (players[id].game_object.maxMassReachedTicks <= 0) {
                        // steile to score word 
                        score_words.push([10, 4, players[id].game_object.pos.x, players[id].game_object.pos.y]);

                        // aykshse to times kata 1 
                        players[id].game_object.maxMassReachedTimes += 1;

                        // ta ticks ginontai ksana 500 
                        players[id].game_object.maxMassReachedTicks = gc.maxMassReachedTicks;
                    }
                }
                score_words.forEach((word) => {
                    players[id].game_object.score_words.push([...word]);
                })

                //console.log(players[id].game_object.score_words.length);

                //players[id].game_object.score_words = score_words;

            })

            // update entities controlled by server

            if (foods.length < gc.numOfFoods) {
                // REGENERATE FOODS 
                foods = game.regenerateFoods(foods, foods_born);

            }


            //update masses
            rooms[roomId].masses.forEach((mass) => {
                if (mass.catapultForce) {
                    mass.update();
                    if (mass.new_born) {
                        masses_updates.push([8, 1, mass.id, mass.hue, mass.radius, mass.pos.x, mass.pos.y])
                        mass.new_born = false;

                    }
                    masses_updates.push([8, 0, mass.id, mass.pos.x, mass.pos.y]);
                }
            })

            //update viruses
            rooms[roomId].viruses.forEach((virus) => {
                if (virus.catapultForce) {

                    virus.update();
                    virus_updates.push([virus.id, 1, virus.pos.x, virus.pos.y])
                }


            })


            // send update



            // Object.keys(players).forEach((id) => {

            //     //if player is a bot just idle for a time duration and dont use sockets
            //     if (players[id].bot) {
            //         //console.log("einai bot")
            //         players[id].game_object.updateMass();
            //         //idle 
            //     }

            //     let package2 = [];

            //     // find "you"
            //     players[id].game_object.updateMass();

            //     let cellsUpdated = [];
            //     let cellsUpdated2 = [];

            //     package2.push([1, players[id].game_object.pos.x, players[id].game_object.pos.y]);

            //     if (players[id].game_object.score_words.length >= 1) {
            //         for (i = 0; i < players[id].game_object.score_words.length; i++) {
            //             //console.log(score_words, "STELNW LEKSEIS")
            //             //  package2.push(players[id].game_object.score_words[i]);
            //         }
            //         console.log(players[id].game_object.score_words.length);
            //         //players[id].game_object.score_words = [];
            //     }


            //     players[id].game_object.cells.forEach((cell) => {
            //         cellsUpdated.push(
            //             {
            //                 radius: cell.radius,
            //                 mass: cell.mass,
            //                 pos: cell.pos,
            //                 id: cell.id,
            //                 virus: cell.virus

            //             })

            //         package2.push([2, cell.id, cell.pos.x, cell.pos.y, cell.radius, cell.mass, cell.virus ? 1 : 0]);

            //     })



            //     // find enemies 

            //     let enemies = [];
            //     let enemy_players = []
            //     let ghosts = [];


            //     if (Object.keys(players).length > 1) {
            //         //gather every player's enemies


            //         Object.keys(players).forEach((id2) => {
            //             if (id2 == id) {

            //             } else {
            //                 if (players[id2].i_am_new_ticks > 0) {
            //                     enemy_players.push([4, players[id2].father_id, players[id2].name, players[id2].hue, players[id2].border_hue]);
            //                     package2.push([4, players[id2].father_id, players[id2].name, players[id2].game_object.hue, players[id2].game_object.border_hue]);
            //                     //players[id2].i_am_new_ticks -= 1;
            //                 }



            //                 let pack = {
            //                     name: players[id2].name,
            //                     cells: players[id2].game_object.cells,
            //                     hue: players[id2].game_object.hue,
            //                     border_hue: players[id2].game_object.border_hue,

            //                 }
            //                 enemies.push(pack);

            //                 players[id2].game_object.cells.forEach((cell) => {
            //                     // we will only send info about enemy cells position only if the two players are close
            //                     if (Math.abs(players[id].game_object.pos.x - cell.pos.x) < gc.gameWidth / 2 && Math.abs(players[id].game_object.pos.y - cell.pos.y) < gc.gameHeight / 2)
            //                         package2.push([3, players[id2].father_id, cell.pos.x, cell.pos.y, cell.radius, cell.virus ? 1 : 0, cell.id])
            //                 })
            //             }
            //         })

            //         if (players[id].i_am_new_ticks > 0) {
            //             let i = 0;
            //             let enemy_players = roomsJs.getRoomEnemies(rooms[roomId], id)
            //             Object.keys(enemy_players).forEach((id3) => {

            //                 package2.push([4, id, enemy_players[id3].name, enemy_players[id3].hue, enemy_players[id3].border_hue]);
            //                 i++;
            //             })
            //             // console.log(`mphke o ${players[id].name} esteila ${i} paiktes`);
            //             players[id].i_am_new_ticks -= 1;
            //         }


            //     }

            //     foods_eaten.forEach((food) => {
            //         package2.push([5].concat(food))
            //     });

            //     foods_born.forEach((food) => {
            //         package2.push([6, food])
            //     })

            //     virus_updates.forEach((virus) => {
            //         package2.push([7].concat(virus))
            //     })

            //     masses_updates.forEach((array) => {
            //         package2.push(array);
            //     })

            //     package2.push([9, players[id].game_object.getTotalScore()]);



            //     //   players[id].my_updates = [...package2];

            //     let package = {
            //         pos: players[id].game_object.pos,
            //         cells: cellsUpdated,
            //         foodsEaten: players[id].game_object.foodsEaten,
            //         enemies: enemies,
            //         enemy_players: enemy_players,
            //         foods_eaten: foods_eaten,
            //         foods_born: foods_born,
            //         virus_updates: virus_updates,
            //         masses: rooms[roomId].masses
            //     }

            //     // send update
            //     if (!players[id].bot) {


            //         players[id].my_updates.push([...package2]);
            //         // players[id].socket.emit('u', package2);
            //     }

            // })
        }

    })


}, 1000 / gc.gameWorld_ups)
// arxika to eixa 100 gw-ups kai broadcast-ups

setInterval(() => {

    Object.keys(rooms).forEach((roomId) => {

        if (rooms[roomId].active == true) {

            let foods_eaten = [...rooms[roomId].foods_eaten];
            let foods_born = [...rooms[roomId].foods_born];
            let virus_updates = [...rooms[roomId].virus_updates];
            let masses_updates = [...rooms[roomId].masses_updates];

            rooms[roomId].foods_eaten = [];
            rooms[roomId].foods_born = [];
            rooms[roomId].virus_updates = [];
            rooms[roomId].masses_updates = [];

            let players = { ...rooms[roomId].players };

            Object.keys(players).forEach((id) => {

                //if player is a bot just idle for a time duration and dont use sockets
                if (players[id].bot) {
                    //console.log("einai bot")
                    players[id].game_object.updateMass();
                    //idle 
                }

                let package2 = [];

                // find "you"
                players[id].game_object.updateMass();

                let cellsUpdated = [];
                let cellsUpdated2 = [];

                package2.push([1, players[id].game_object.pos.x, players[id].game_object.pos.y]);




                players[id].game_object.cells.forEach((cell) => {
                    cellsUpdated.push(
                        {
                            radius: cell.radius,
                            mass: cell.mass,
                            pos: cell.pos,
                            id: cell.id,
                            virus: cell.virus

                        })

                    package2.push([2, cell.id, cell.pos.x, cell.pos.y, cell.radius, cell.mass, cell.virus ? 1 : 0, cell.mergeCooldown]);
                    if (cell.catapultForce.speed > 0) {
                        package2[package2.length - 1].push(cell.catapultForce.speed, cell.catapultForce.dx, cell.catapultForce.dy, cell.catapultForce.friction);
                    }

                })



                // find enemies 

                let enemies = [];
                let enemy_players = []
                let ghosts = [];


                if (Object.keys(players).length > 1) {
                    //gather every player's enemies


                    Object.keys(players).forEach((id2) => {
                        if (id2 == id) {

                        } else {
                            if (players[id2].i_am_new_ticks > 0) {
                                enemy_players.push([4, players[id2].father_id, players[id2].name, players[id2].hue, players[id2].border_hue]);
                                package2.push([4, players[id2].father_id, players[id2].name, players[id2].game_object.hue, players[id2].game_object.border_hue]);
                                //players[id2].i_am_new_ticks -= 1;
                            }



                            let pack = {
                                name: players[id2].name,
                                cells: players[id2].game_object.cells,
                                hue: players[id2].game_object.hue,
                                border_hue: players[id2].game_object.border_hue,

                            }
                            enemies.push(pack);

                            players[id2].game_object.cells.forEach((cell) => {
                                // we will only send info about enemy cells position only if the two players are close
                                if (Math.abs(players[id].game_object.pos.x - cell.pos.x) < gc.gameWidth / 2 && Math.abs(players[id].game_object.pos.y - cell.pos.y) < gc.gameHeight / 2)
                                    package2.push([3, players[id2].father_id, cell.pos.x, cell.pos.y, cell.radius, cell.virus ? 1 : 0, cell.id])
                                // if (cell.pre_split_data != undefined) {
                                //     package2[package2.length - 1].push(cell.pre_split_data.x, cell.pre_split_data.y, cell.pre_split_data.radius);
                                // }
                            })
                        }
                    })

                    if (players[id].i_am_new_ticks > 0) {
                        let i = 0;
                        let enemy_players = roomsJs.getRoomEnemies(rooms[roomId], id)
                        Object.keys(enemy_players).forEach((id3) => {

                            package2.push([4, id, enemy_players[id3].name, enemy_players[id3].hue, enemy_players[id3].border_hue]);
                            i++;
                        })
                        // console.log(`mphke o ${players[id].name} esteila ${i} paiktes`);
                        players[id].i_am_new_ticks -= 1;
                    }


                }
                foods_born.forEach((food) => {
                    package2.push([6, food])
                })
                foods_eaten.forEach((food) => {
                    package2.push([5].concat(food))
                });



                virus_updates.forEach((virus) => {
                    package2.push([7].concat(virus))
                })

                masses_updates.forEach((array) => {
                    package2.push(array);
                })

                package2.push([9, players[id].game_object.getTotalScore()]);


                if (players[id].game_object.score_words.length >= 1) {
                    for (i = 0; i < players[id].game_object.score_words.length; i++) {
                        //console.log(score_words, "STELNW LEKSEIS")
                        package2.push(players[id].game_object.score_words[i]);
                    }
                    //console.log(players[id].game_object.score_words.length);
                    players[id].game_object.score_words = [];
                }
                //   players[id].my_updates = [...package2];

                let package = {
                    pos: players[id].game_object.pos,
                    cells: cellsUpdated,
                    foodsEaten: players[id].game_object.foodsEaten,
                    enemies: enemies,
                    enemy_players: enemy_players,
                    foods_eaten: foods_eaten,
                    foods_born: foods_born,
                    virus_updates: virus_updates,
                    masses: rooms[roomId].masses
                }

                // send update
                if (!players[id].bot) {


                    //  players[id].my_updates.push([...package2]);
                    //  package2.push(extra_size);
                    players[id].socket.emit('u', package2);
                }

            })




        }
    })

}, 1000 / gc.broadcast_ups)

// SEND LEADERBOARDS DATA
setInterval(() => {
    Object.keys(rooms).forEach((roomId) => {
        let players = rooms[roomId].players;
        let array = [];

        //order players by mass
        Object.keys(players).forEach((id) => {
            // console.log(players[id]);
            if (players[id].game_object != null) {

                let object = {
                    username: players[id].name,
                    mass: players[id].game_object.totalMass,
                    id: id,
                    itsMe: false,
                    position: null
                }

                array.push(object)
            }
        })


        array.sort((a, b) => { return a.mass - b.mass });
        //find self position
        array.reverse();



        Object.keys(players).forEach((id) => {

            // if player is a bot dont send leaderboards
            if (players[id].bot) {

                //idle 
                // console.log(players[id].game_object);

                return;
            }

            let my_position;
            let array2 = [...array];

            for (i = 0; i < array2.length; i++) {
                if (array2[i].id == id) {
                    my_position = i + 1;
                    array2[i].itsMe = true;
                } else {
                    array2[i].itsMe = false;
                }
                array2[i].position = i + 1;
                // delete array2[i].id;
            }

            array2.slice(0, 9);
            if (my_position > 10) {
                array2.push({
                    username: players[id].name,
                    mass: players[id].game_object.totalMass,
                    position: my_position,
                    itsMe: true
                });
            }

            players[id].socket.emit('Leaderboard', array2);
        })


    })

}, 2000);


Server.exports
http.listen(port, function () {
    console.log("Server is listening on port " + port);
});