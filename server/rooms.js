module.exports = {
  makeid, getRoomPlayers, getRoomData, roomGameResults, clearRooms, adminLeft, getRoomEnemies
}

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getRoomEnemies(room, player_id) {

  let enemies = {};

  Object.keys(room.players).forEach((id) => {
    if (id == player_id) {

    } else {
      enemies[room.players[id].father_id] = {
        name: room.players[id].name,
        hue: room.players[id].game_object.hue,
        border_hue: room.players[id].game_object.border_hue
      }
    }


  });

  console.log("BRHKA AFTOUS TOUS ENEMIES", enemies);
  return enemies;



}

function roomGameResults(room) {
  //console.log(room)

  let array = [];
  Object.keys(room.players).forEach((id) => {
    let player = room.players[id].game_object;
    let score = player.score;

    // tha ginetai sort symfwna me to total score 
    let object = {
      foodsEaten: score.foodsEaten,
      cellsEaten: score.cellsEaten,
      virusEaten: score.virusEaten,
      username: room.players[id].name,
      totalScore: player.getTotalScore(),


      eliminations: score.eliminations,
      finalMass: player.totalMass,
    };
    array.push(object);
  });

  array.sort((a, b) => { a.totalScore - b.totalScore });


  return array;
}


function getRoomPlayers(room) {

  let names = [];

  Object.keys(room.players).forEach((player) => {
    names.push(room.players[player].name);
  });

  return names;
}

function getRoomData(room) {

  let data = {
    roomName: room.roomName,
    admin: room.admin,
    mates: getRoomPlayers(room).length,
    roomId: room.roomId

  }

  return data;

}

function adminLeft(room, players, rooms) {
  // set roomId of every player to null 
  Object.keys(rooms[room].players).forEach((player) => {
    players[player].roomId = null;
  })

  // set the room.players to empty so clearRooms will delete the room
  rooms[room].players = {};

  // delete room
  //delete rooms[room];
}

function clearRooms(rooms) {
  Object.keys(rooms).forEach((room) => {
    if (room == 'liveWorld') {

    } else {
      if (Object.keys(rooms[room].players).length == 0) {
        // THE ROOM IS EMPTY SO WE DELETE IT

        delete rooms[room];


      }
    }
  })
}