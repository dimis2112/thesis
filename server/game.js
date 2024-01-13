const util = require('./utilities.js');
const gc = require('./gameConfig.json');
const server = require('./server.js');

class Player {
  constructor(array) {
    this.name
    this.bot = false;
    this.pos = (gc.betterPosition) ? util.betterPosition(array, gc.initialRadius) : util.randomPosition();// { x: 100, y: 100 } 
    this.hue = null;
    this.border_hue = null;
    this.totalMass = 0;
    this.target = {
      x: null,
      y: null
    }
    this.cells = [
      {
        mass: gc.initialMass,
        radius: gc.initialRadius,
        pos: this.pos,
        throw: null,
        catapultForce: {
          speed: 0, dx: 0, dy: 0, friction: 0
        },
        mergeCooldown: 0,
        merged: false,
        merge_able: true,
        virus: false,
        id: util.makeid(6)


      }
    ];
    this.score = {
      foodsEaten: 0,
      cellsEaten: 0,
      virusEaten: 0,
      score_reductions: [],
      score_increases: [],


      eliminations: 0,
      highestMassReached: gc.initialMass,
      timeStayedAlive: 0,
      highestPosition: 100
    }
    this.totalScore = 0;
    this.foodsEaten = 0;
    this.socket = null;
    this.roomName = null;
    this.ghost = false;
    this.start
    this.maxMassReachedTicks = gc.maxMassReachedTicks;
    this.maxMassReachedTimes = 0;

    this.score_words = [];

    // this.foods_eaten= [];
    // foods_born: [],
    // virus_updates: [],
    // masses_updates: []

  }

  getTotalScore() {
    let totalScore = 0;

    totalScore += this.score.foodsEaten * gc.scoreFromFood;
    totalScore += this.score.virusEaten * gc.scoreFromVirus;
    totalScore += this.score.cellsEaten * gc.scoreFromCell;
    totalScore += this.maxMassReachedTimes * gc.scoreFromMaxMass;

    this.score.score_increases.forEach((value) => {
      totalScore += value;
    })

    this.score.score_reductions.forEach((value) => {
      totalScore -= value;
    })

    this.totalScore = totalScore;
    return totalScore;


  }
  updateMass() {
    this.totalMass = 0;
    this.cells.forEach((cell) => {
      cell.mass = cell.radius;
      this.totalMass += cell.mass
    });
    this.totalMass = Math.floor(this.totalMass);
    if (this.totalMass >= this.score.highestMassReached) {
      // this.score.highestMassReached = this.totalMass;
    }
    if (this.totalMass >= 300) {
      this.totalMass = 300;

    }

    if (this.cells.length == 1 && (this.cells[0].radius >= 300 || this.cells[0].mass >= 300)) {
      this.cells[0].radius = 300;
      this.cells[0].mass = 300;
    }
  }

  updatePosition() {

    // console.log(cell);
    for (let i = 0; i < this.cells.length; i++) {


      // if a Cell has catapult force , it moves unaffected from client's inputs
      if (this.cells[i].catapultForce.speed > 0) {
        let dx = this.cells[i].catapultForce.dx * this.cells[i].catapultForce.speed;
        let dy = this.cells[i].catapultForce.dy * this.cells[i].catapultForce.speed;



        //Out of Bounds
        if (this.cells[i].pos.x + dx < 0 + this.cells[i].radius * 0.5) {
          dx = 0 - this.cells[i].pos.x + this.cells[i].radius * 0.5;
        }
        if (this.cells[i].pos.x + dx > gc.gameWidth - this.cells[i].radius * 0.5) {
          dx = gc.gameWidth - this.cells[i].pos.x - this.cells[i].radius * 0.5;
        }
        if (this.cells[i].pos.y + dy < this.cells[i].radius * 0.5) {
          dy = 0 - this.cells[i].pos.y + this.cells[i].radius * 0.5
        }
        if (this.cells[i].pos.y + dy > gc.gameHeight - this.cells[i].radius * 0.5) {
          dy = gc.gameHeight - this.cells[i].pos.y - this.cells[i].radius * 0.5;
        }

        dx = Math.floor(dx);
        dy = Math.floor(dy);
        this.cells[i].pos.x += dx;
        this.cells[i].pos.y += dy;

        this.cells[i].pos.x = Math.floor(this.cells[i].pos.x);
        this.cells[i].pos.y = Math.floor(this.cells[i].pos.y);

        this.cells[i].catapultForce.speed -= this.cells[i].catapultForce.friction;

        if (this.cells[i].mergeCooldown > 0) {
          this.cells[i].mergeCooldown -= 1;
        }

        continue;


      }

      if (this.cells[i].mergeCooldown > 0) {
        this.cells[i].mergeCooldown -= 1;
      }

      let angle = Math.atan2(this.target.y + this.pos.y - this.cells[i].pos.y, this.target.x + this.pos.x - this.cells[i].pos.x);
      let vel = util.massToVel(this.cells[i].mass);
      //console.log(vel, this.cells[i].mass);
      let dx = Math.cos(angle) * vel;
      let dy = Math.sin(angle) * vel;

      for (let j = 0; j < this.cells.length; j++) {
        if (i == j) {
          continue;
        }

        //Cells touch each other
        if (Math.hypot(this.cells[i].pos.x + dx - this.cells[j].pos.x, this.cells[i].pos.y + dy - this.cells[j].pos.y) < this.cells[i].radius + this.cells[j].radius && this.cells[i].catapultForce.speed <= 0 && this.cells[j].catapultForce.speed <= 0) {

          //The two cells are ready to merge
          if (this.cells[i].mergeCooldown == 0 && this.cells[j].mergeCooldown == 0) {
            // if both cells have mergecooldown ==0 then they move without any bother

          }

          // The cells can't overlap because of merge cooldown is not 0 , so they just rub to each other 
          else {

            let obj = util.findValidDisplacement(this.cells[i], this.cells[j], dx, dy);
            dx = obj.dx;
            dy = obj.dy;

          }


        }
      }


      // ean einai poly konta ston target tote metatopish ginetai mhden
      if (Math.hypot(this.cells[i].pos.x - (this.pos.x + this.target.x), this.cells[i].pos.y - (this.pos.y + this.target.y)) < 10) {
        dx = 0;
        dy = 0;
      }

      //Out of Bounds
      if (this.cells[i].pos.x + dx < this.cells[i].radius * 0.5) {
        dx = 0 - this.cells[i].pos.x + this.cells[i].radius * 0.5
      }
      if (this.cells[i].pos.x + dx > gc.gameWidth - this.cells[i].radius * 0.5) {
        dx = gc.gameWidth - this.cells[i].pos.x - this.cells[i].radius * 0.5;
      }
      if (this.cells[i].pos.y + dy < this.cells[i].radius * 0.5) {
        dy = 0 - this.cells[i].pos.y + this.cells[i].radius * 0.5
      }
      if (this.cells[i].pos.y + dy > gc.gameHeight - this.cells[i].radius * 0.5) {
        dy = gc.gameHeight - this.cells[i].pos.y - this.cells[i].radius * 0.5;
      }

      dx = Math.floor(dx);
      dy = Math.floor(dy);
      this.cells[i].pos.x += dx;
      this.cells[i].pos.y += dy;

      this.cells[i].pos.x = Math.floor(this.cells[i].pos.x);
      this.cells[i].pos.y = Math.floor(this.cells[i].pos.y);


    }



    // set the vision center
    let sumX = 0;
    let sumY = 0;
    this.cells.forEach((cell) => {
      sumX += cell.pos.x;
      sumY += cell.pos.y;
    });
    sumX = sumX / this.cells.length;
    sumY = sumY / this.cells.length;

    sumX = Math.floor(sumX);
    sumY = Math.floor(sumY);

    this.pos.x = sumX;
    this.pos.y = sumY;


  }

  split() {
    //kathe kyttaro pou h maza tou einia panw apo 20 tha kanei split
    let newCells = [];
    this.cells.forEach((cell) => {
      if (cell.mass >= 40) {
        //cell is splitable
        // this.cells.splice(cellIndex, 1);
        // osa cells exoun throw:true tha ektoksebontai

        // calculate angle
        let speed = 30;
        let angle = Math.atan2(this.target.y + this.pos.y - cell.pos.y, this.target.x + this.pos.x - cell.pos.x);
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        let friction = 0.6;

        if (cell.virus) {
          newCells.push({
            mass: Math.floor(cell.mass / 2),
            radius: util.massToRadius(cell.mass / 2),
            pos: { x: cell.pos.x, y: cell.pos.y },
            throw: false,
            catapultForce: {
              speed: speed, dx: dx, dy: dy, friction: friction
            },
            pre_split_data: {
              x: cell.pos.x,
              y: cell.pos.y,
              radius: util.massToRadius(cell.mass / 2)
            },
            mergeCooldown: gc.mergeCooldown,
            //merged: false,
            merge_able: false,
            virus: false,
            id: util.makeid(6)

          });
          newCells.push({
            mass: Math.floor(cell.mass / 2),
            radius: util.massToRadius(cell.mass / 2),
            pos: { x: cell.pos.x, y: cell.pos.y },
            throw: false,
            catapultForce: {
              speed: 0, dx: 0, dy: 0, friction: 0
            },
            mergeCooldown: gc.mergeCooldown,
            // merged: false,
            merge_able: false,
            virus: true,
            id: cell.id
          });

        } else {
          newCells.push({
            mass: Math.floor(cell.mass / 2),
            radius: util.massToRadius(cell.mass / 2),
            pos: { x: cell.pos.x, y: cell.pos.y },
            throw: false,
            catapultForce: {
              speed: speed, dx: dx, dy: dy, friction: friction
            },
            pre_split_data: {
              x: cell.pos.x,
              y: cell.pos.y,
              radius: util.massToRadius(cell.mass / 2)
            },
            mergeCooldown: gc.mergeCooldown,
            //merged: false,
            merge_able: false,
            virus: false,
            id: util.makeid(6)

          });
          newCells.push({
            mass: Math.floor(cell.mass / 2),
            radius: util.massToRadius(cell.mass / 2),
            pos: { x: cell.pos.x, y: cell.pos.y },
            throw: false,
            catapultForce: {
              speed: 0, dx: 0, dy: 0, friction: 0
            },
            mergeCooldown: gc.mergeCooldown,
            // merged: false,
            merge_able: false,
            virus: false,
            id: cell.id
          });
        }




        // this.cells.splice(cellIndex, 1);
        // cellIndex -= 1;
      } else {
        newCells.push(cell);
      }

    });

    this.cells = newCells;

    // console.log(this.cells);
    // set new vision center  ~~ geometric median
    let sumX = 0;
    let sumY = 0;
    this.cells.forEach((cell) => {
      sumX += cell.pos.x;
      sumY += cell.pos.y;
    });
    sumX = sumX / this.cells.length;
    sumY = sumY / this.cells.length;

    this.pos.x = Math.floor(sumX);
    this.pos.y = Math.floor(sumY);

  }

  virusSplit(cell) {
    // we shrink the cell that ate the virus
    cell.radius /= 4;
    cell.mass /= 4;

    let speed = 20;
    let angle = Math.PI / 4;
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    let friction = 0.8;

    cell.catapultForce = {
      speed: speed, dx: dx, dy: dy, friction: friction
    }
    cell.mergeCooldown = 500;
    cell.merge_able = false;
    cell.virus = false;

    // we create 3 new cells

    // 2 without virus and i 1 with virus
    for (let i = 0; i < 3; i++) {
      angle += Math.PI / 2;
      if (i == 2) {
        let newCell = {
          mass: cell.mass,
          radius: util.massToRadius(cell.mass),
          pos: { x: cell.pos.x, y: cell.pos.y },
          throw: false,
          catapultForce: {
            speed: speed, dx: Math.cos(angle), dy: Math.sin(angle), friction: 0.8
          },
          pre_split_data: {
            x: cell.pos.x,
            y: cell.pos.y,
            radius: util.massToRadius(cell.mass / 2)
          },
          mergeCooldown: 500,
          merge_able: false,
          virus: true,
          id: util.makeid(6)
        }
        this.cells.push(newCell);
      }
      else {
        let newCell = {
          mass: cell.mass,
          radius: util.massToRadius(cell.mass),
          pos: { x: cell.pos.x, y: cell.pos.y },
          throw: false,
          catapultForce: {
            speed: speed, dx: Math.cos(angle), dy: Math.sin(angle), friction: 0.8
          },
          pre_split_data: {
            x: cell.pos.x,
            y: cell.pos.y,
            radius: util.massToRadius(cell.mass / 2)
          },
          mergeCooldown: 500,
          merge_able: false,
          virus: false,
          id: util.makeid(6)
        }
        this.cells.push(newCell);
      }


    }


    // set new vision center  ~~ geometric median
    let sumX = 0;
    let sumY = 0;
    this.cells.forEach((cell) => {
      sumX += cell.pos.x;
      sumY += cell.pos.y;
    });
    sumX = sumX / this.cells.length;
    sumY = sumY / this.cells.length;

    this.pos.x = Math.floor(sumX);
    this.pos.y = Math.floor(sumY);

  }

  eject_mass(array) {
    this.cells.forEach((cell) => {
      if (cell.radius > 30) {
        cell.radius -= gc.ejectedMassRadius;
        cell.mass -= gc.ejectedMassRadius;

        let speed = 40;
        let angle = Math.atan2(this.target.y + this.pos.y - cell.pos.y, this.target.x + this.pos.x - cell.pos.x);
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        let friction = 0.8;
        let catapultForce = {
          speed: speed, dx: dx, dy: dy, friction: friction
        };

        let mass = new Mass({ ...{ x: cell.pos.x + cell.radius * 1.2 * dx, y: cell.pos.y + cell.radius * 1.2 * dy } }, this.hue, catapultForce);
        array.push(mass);
      }
    })

  }

  eject_virus(array, father_id) {
    this.cells.forEach((cell) => {
      if (cell.virus) {

        let speed = 30;
        let angle = Math.atan2(this.target.y + this.pos.y - cell.pos.y, this.target.x + this.pos.x - cell.pos.x);
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        let friction = 0.6;
        let catapultForce = {
          speed: speed, dx: dx, dy: dy, friction: friction
        };

        //let mass = new Mass({ ...{ x: cell.pos.x + cell.radius * 1.2 * dx, y: cell.pos.y + cell.radius * 1.2 * dy } }, this.hue, catapultForce);

        let virus = new Virus(array);
        virus.pos = { ...cell.pos };
        virus.catapultForce = catapultForce;
        virus.fatherId = father_id;
        console.log(virus);
        array.push(virus);

        cell.virus = false;
      }
    })
  }

}

class Mass {
  constructor(pos, hue, catapultForce) {

    this.hue = hue;
    this.id = util.makeid(5);
    this.radius = gc.ejectedMassRadius;
    this.mass = gc.ejectedMassRadius;
    this.pos = pos;
    this.catapultForce = catapultForce;
    this.new_born = true;
  }

  update() {
    let dx = this.catapultForce.dx * this.catapultForce.speed;
    let dy = this.catapultForce.dy * this.catapultForce.speed;



    if (this.catapultForce.speed > 0) {
      this.catapultForce.speed -= this.catapultForce.friction;
      //console.log(this.catapultForce.speed);
    }

    if (this.catapultForce.speed < 0)
      this.catapultForce.speed = 0;

    //Out of Bounds
    if (this.pos.x + dx < this.radius * 0.5) {
      dx = 0 - this.pos.x + this.radius * 0.5
    }
    if (this.pos.x + dx > gc.gameWidth - this.radius * 0.5) {
      dx = gc.gameWidth - this.pos.x - this.radius * 0.5;
    }
    if (this.pos.y + dy < this.radius * 0.5) {
      dy = 0 - this.pos.y + this.radius * 0.5
    }
    if (this.pos.y + dy > gc.gameHeight - this.radius * 0.5) {
      dy = gc.gameHeight - this.pos.y - this.radius * 0.5;
    }

    this.pos.x += dx;
    this.pos.y += dy;

    this.pos.x = Math.floor(this.pos.x);
    this.pos.y = Math.floor(this.pos.y);

  }
}

class Food {
  constructor(arrayOfFoods) {

    this.id = util.makeid(6);
    this.hue = util.randomColor();
    this.radius = Math.floor(Math.random() * (10 - 5) + 5);
    this.mass = 1 //this.radius //Math.random() * (5 - 3) + 3;
    this.pos = (gc.betterPosition) ? util.betterPosition(arrayOfFoods, this.radius) : util.randomPosition();// util.randomPosition();
  }

}

class Virus {
  constructor(arrayOfViruses) {

    this.id = util.makeid(2);
    this.radius = gc.virusRadius;
    this.pos = (gc.betterPosition) ? util.betterPosition(arrayOfViruses, this.radius) : util.randomPosition(); // util.randomPosition();
    this.catapultForce = null;
    this.fatherId = null;
  }

  update() {
    let dx = this.catapultForce.dx * this.catapultForce.speed;
    let dy = this.catapultForce.dy * this.catapultForce.speed;


    if (this.catapultForce.speed > 0) {
      this.catapultForce.speed -= this.catapultForce.friction;
      //console.log(this.catapultForce.speed);
    }

    if (this.catapultForce.speed < 0)
      this.catapultForce.speed = 0;

    //Out of Bounds
    if (this.pos.x + dx < this.radius * 0.5) {
      dx = 0 - this.pos.x + this.radius * 0.5
    }
    if (this.pos.x + dx > gc.gameWidth - this.radius * 0.5) {
      dx = gc.gameWidth - this.pos.x - this.radius * 0.5;
    }
    if (this.pos.y + dy < this.radius * 0.5) {
      dy = 0 - this.pos.y + this.radius * 0.5
    }
    if (this.pos.y + dy > gc.gameHeight - this.radius * 0.5) {
      dy = gc.gameHeight - this.pos.y - this.radius * 0.5;
    }

    this.pos.x += dx;
    this.pos.y += dy;

    this.pos.x = Math.floor(this.pos.x);
    this.pos.y = Math.floor(this.pos.y);

  }
}


function load_bot_rooms(rooms, num) {

  for (let i = 0; i < num; i++) {
    let room_name = "bot-room-" + i;

    rooms[room_name] = {
      bot_room: true,
      roomName: room_name,
      players: create_bots(5, room_name),
      foods: createFoods(),
      active: true,
      freeToJoin: false,
      roomId: room_name,
      // viruses: createViruses(),
      viruses: [],
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
  }

}

function create_bots(num, room_name) {

  let players = {};

  for (let i = 0; i < num; i++) {

    let player_id = room_name + "-bot-" + i;
    let player_name = "bot-" + i;
    let bot = new Player([]);

    bot.bot = true;
    bot.name = player_name;
    bot.pos = { x: 300 + 500 * i, y: 1500 }
    bot.cells[0].pos = { x: 300 + 400 * i, y: 1500 };
    bot.hue = util.randomColor();
    bot.border_hue = util.randomColor();
    bot.input_ticks = 100;
    bot.direction = 1;


    players[player_id] = {
      bot: true,
      game_object: bot,
      socket: null,
      name: player_name,
      hue: util.randomColor(),
      border_hue: util.randomColor(),
      roomId: room_name,
      roomName: room_name,
      ready_to_go: true,
      father_id: util.makeid(3),
      i_am_new_ticks: 0

    }
  }


  return players;
  // prepei na epistrefei ena {} prosoxh !! 
}

function generate_inputs(bot) {

  if (bot.game_object.cells.length == 0)
    return;


  let target = { x: bot.game_object.cells[0].pos.x, y: bot.game_object.direction * 5000 }
  // console.log("poops", target);
  bot.game_object.target = target;
  //updateTarget(target, bot.game_object);

  bot.game_object.input_ticks -= 1;
  if (bot.game_object.input_ticks == 0) {

    bot.game_object.direction *= -1;
    bot.game_object.input_ticks = 200;
  }

}

function regenerateViruses(viruses) {
  let newViruses = viruses;
  while (newViruses.length < gc.numOfViruses) {
    newViruses.push(new Virus(newViruses));
  }

  return newViruses;
}


function regenerateFoods(foods, foods_born) {

  let newFoods = foods;

  while (newFoods.length < gc.numOfFoods) {
    let new_food = new Food(newFoods);
    foods_born.push(new_food);
    newFoods.push(new_food);
  }

  return newFoods;


}

function updateTarget(target, player) {
  player.target.x = target.x;
  player.target.y = target.y;

}

function createFoods() {
  let arrayOfFoods = [];
  for (let i = 0; i < gc.numOfFoods; i++) {
    let newFood = new Food(arrayOfFoods);
    arrayOfFoods.push(newFood);
  }

  return arrayOfFoods;

}

function createViruses() {
  let arrayOfViruses = [];
  for (let i = 0; i < gc.numOfViruses; i++) {
    let newVirus = new Virus(arrayOfViruses);
    arrayOfViruses.push(newVirus);
  }

  return arrayOfViruses;
}

function newPlayer(array) {

  return (new Player(array));

}

module.exports = { newPlayer, createViruses, createFoods, updateTarget, regenerateFoods, regenerateViruses, generate_inputs, load_bot_rooms, create_bots }