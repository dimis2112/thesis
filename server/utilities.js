
const gc = require('./gameConfig.json');



exports.randomPosition = function () {
  let x = Math.floor(Math.random() * (gc.gameWidth - gc.initialRadius - gc.initialRadius) + gc.initialRadius);
  let y = Math.floor(Math.random() * (gc.gameHeight - gc.initialRadius - gc.initialRadius) + gc.initialRadius);


  return { x, y };
}

exports.randomColor = function () {
  let hue = Math.floor(Math.random() * (360));

  return hue;

  //return `hsla(${hue},50%,50%,)`

}

exports.massToRadius = function (mass) {
  let radius = mass * 1;
  return radius;

}

exports.spawnFood = function () {
}

exports.getCellsOfTheRoom = function (room) {
  let array = [];

  if (Object.keys(room.players).length > 0) {
    Object.keys(room.players).forEach((player) => {
      if (player.game_object) {
        player.cells.forEach((cell) => {

          let obj = {
            x: cell.pos.x,
            y: cell.pos.y,
            radius: cell.radius
          }

          array.push(obj);
        })
      }


    })
  }

  //console.log("theseis ppp", array);
  return array;

}


exports.getDistance = function (p1, p22) {
  let p2 = {
    x: p22.pos.x,
    y: p22.pos.y,
    radius: p22.radius
  };
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - p1.radius - p2.radius;
};

exports.betterPosition = function (points, radius) {
  var bestCandidate, maxDistance = 0;
  var numberOfCandidates = 30;

  if (points.length === 0) {
    //console.log("egine to random pos");
    return exports.randomPosition();
  }

  // Generate the candidates
  for (var ci = 0; ci < numberOfCandidates; ci++) {
    var minDistance = Infinity;
    var candidate = exports.randomPosition();
    candidate.radius = radius;
    //console.log(candidate)

    for (var pi = 0; pi < points.length; pi++) {
      var distance = exports.getDistance(candidate, points[pi]);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    if (minDistance > maxDistance) {
      bestCandidate = candidate;
      maxDistance = minDistance;
    } else {
      //return exports.randomPosition();
    }
  }

  return bestCandidate;
};

let arr = [];
exports.makeid = function (length) {
  do {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  } while (arr.includes(result))
  arr.push(result);
  return result;
}

exports.massToVel = function (mass) {
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

exports.findValidDisplacement = function (cell1, cell2, dx, dy) {

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

