//State of the Menu
let state = 0;

//State of pause Menu
let pause = -1;

//how many frames it takes to move a space invader
let MOVE_INTERVAL = 23;

//Scaling of the images
const scale = 4.2;

//how many frames between invader's shots
const SHOT_PAUSE = 300;

//how long the player is invincible after hit
const PLAYER_INVINCIBLE = 100;

//sound paths
let hitSoundPath = 'hitsound.wav';
let shootSoundPath = 'shootsound.wav';
// let gameOverSoundPath = ;

let invaders = [];
let bullets = [];
let invaderBullets = [];
let player;

let invaderImg, invader2Img, invaderFont, spaceshipImg, bulletImg;

let frameCount1 = 0;

let invaderSpeed = 1;

let playerLives, score, win, streak;

playerLives = 2;
score = streak = 0;

//load any external files
function preload() {
	invaderImg = loadImage("invader.png");
	invader2Img = loadImage("invader2.png");
	spaceshipImg = loadImage("spaceship.png");
	bulletImg = loadImage("bullet.png");
	invaderFont = loadFont("Retro Gaming.ttf");

	// sounds
	soundFormats('wav', 'mp3');
  hitsound = loadSound(hitSoundPath);
	shootsound = loadSound(shootSoundPath);
}

function setup() {
	createCanvas(800, 800);
	noSmooth();
	textFont(invaderFont);


	createInvaders()

	//create player
	player = new Player(width / 2, height - spaceshipImg.height * scale, spaceshipImg.width * scale, spaceshipImg.height * scale, spaceshipImg);

	win = false;
}

function draw() {
	//console.log("X: " + mouseX + "\nY: " + mouseY);

	//This case State chooses what sub-Menu scene to display
	if(state == 0){
		menu();
	}
	else if(state == 1){
		game();
	}
	else if(state == 2) {
		howToPlay()
	}
	else if(state == 3){
		leave();
	}
	else if(state == 4){
		credits();
	}

}

//Creates the invaders object
function createInvaders(){
	let invWidth = scale * invaderImg.width,
		  invHeight = scale * invaderImg.height;

	let x = -(scale * 5 + invWidth) + scale, y = scale, yidx = 0;

	for (let i = 0; i < 50; ++i) {
		x += scale * 5 + invWidth;
		if (x >= width - invWidth * 3) {
			y += scale * 5 + invHeight;
			yidx++;
			x = scale;
		}
		invaders.push(new Invader(x, y, invWidth, invHeight, (yidx % 2 == 0) ? invaderImg : invader2Img));
	}
}

//This is the main code for the game mechanics
function game(){

	if(pause == 1){
		console.log(MOVE_INTERVAL);
		textAlign(CENTER);
		fill("White");
		textSize(42);
		text("Paused", 400, 400);
		return;
	}

	frameCount1++;
	streak = max(streak - 0.02, 0);

	//Contolling the players movement
  if(mouseIsPressed) {
    move();
  }
	if (keyIsDown(LEFT_ARROW)) {
		player.move(-scale);
	} else if (keyIsDown(RIGHT_ARROW)) {
		player.move(scale);
	}
	player.update(frameCount1);

//Update each bullet for player hit and update bullet
	for (let bullet of invaderBullets) {
		bullet.update(frameCount1);
		if (!player.invincible && player.intersects(bullet)) {
			bullet.deadMarked = true;
			loseLife();
			// hit sound for when player is hit by invader
			hitsound.setVolume(0.30);
		  hitsound.play();
		}
	}

//Check Invader list for interscetion and update score if true
	for (let invader of invaders) {
		invader.update(frameCount1);
		bullets.forEach(bullet => {
			if (bullet.intersects(invader)) {
				streak = .1;
				score = score + (10 * streak);
				streak += 1;
				if (invader.img === invader2Img) score += 10;
				MOVE_INTERVAL = MOVE_INTERVAL - (MOVE_INTERVAL * .02);
				bullet.deadMarked = true;
				invader.deadMarked = true;
			}
		});
	}

	//reupdate bullet list
	for (let bullet of bullets) {
		bullet.update(frameCount1);
	}

	//Move invaders down if hit wall
	if (invaders.some(invader => invader.right() >= width || invader.left() <= 0))
		invaders.forEach(invader => {
			invader.pos.add(p5.Vector.mult(invader.vel, -1));
			invader.pos.y += scale * 5;
			invader.vel.x = -invader.vel.x;
		});

	//deletion of bullets and invaders
	bullets = bullets.filter(bullet => !bullet.deadMarked && bullet.lower() >= 0);
	invaderBullets = invaderBullets.filter(bullet => !bullet.deadMarked && bullet.upper() <= height);
	invaders = invaders.filter(invader => !invader.deadMarked);


	//If no invaders are left set win to true
	if (invaders.length == 0) {
		win = true;
	}

	//draw
	background(0);

	for (let invader of invaders) {
		invader.draw();
	}
	for (let bullet of bullets) {
		bullet.draw();
	}
	for (let bullet of invaderBullets) {
		bullet.draw();
	}
	player.draw();

	noStroke();
	fill(255);
	textSize(28);
	textAlign(LEFT, TOP);
	text(`Lives ${playerLives}\nStreak ${round(streak*10)/10}`, 0, 0);
	textAlign(RIGHT, TOP);
	text(`${score}\nHi ${hs()}`, width, 0);


	if (win) {
		//score logic and storing highscore in cookie
		score += playerLives;
		if (score > hs()) {
			setHs(score);
		}

		textAlign(CENTER);
		text(`${score}\nHi ${hs()}`, width, 0);
		textSize(42);
		text("Next Round", 400, 400);

		console.log(MOVE_INTERVAL);

		//give a 3 sec pause to restart game
		setTimeout(function(){ restart(); }, 3000);

	}

	//if player loses display score and reset game to main menu
	if (playerLives < 0){
		textAlign(CENTER);
		text(`${score}\nHi ${hs()}`, width, 0);
		textSize(42);
		text("Game Over\nScore: " + score, 400, 400);

		console.log(MOVE_INTERVAL);

		//give a 3 sec pause to goto main menu
		setTimeout(function(){
			score = 0;
			MOVE_INTERVAL = 23;
			playerLives = 2;
			frameCount1 = 0;
			invaders = [];
			bullets = [];
			invaderBullets = [];
			state = 0;
			setup();
			draw();

		 }, 3000);
	}
}


function mouseClicked() {
	//This is when the start button is clicked
  if (state == 0) {
    if (mouseX <= 490 && mouseX >= 315 && mouseY <= 270 && mouseY >= 208) {
      state = 1;
    }
  }
	//This is when the how to play button is clicked
  if (state == 0) {
    if (mouseX <= 565 && mouseX >= 238 && mouseY <= 370 && mouseY >= 310) {
      state = 2;
    }
  }
	//This is when the exit button is clicked
	if (state == 0) {
    if (mouseX <= 475 && mouseX >= 325 && mouseY <= 470 && mouseY >= 410) {
      state = 3;
    }
  }
	//This is when the Credits button is clicked
	if (state == 0) {
    if (mouseX <= 785 && mouseX >= 590 && mouseY <= 785 && mouseY >= 760) {
      state = 4;
    }
  }
	//This when the return button on the credits page is clicked
	if (state ==  2){
		if (mouseX <= 502 && mouseX >= 292 && mouseY <= 720 && mouseY >= 660) {
      state = 0;
    }
	}
	//This when the return button on the credits page is clicked
	if (state ==  4){
		if (mouseX <= 502 && mouseX >= 292 && mouseY <= 720 && mouseY >= 660) {
      state = 0;
    }
	}
}


//Landing Screen Setup
function menu(){
	background(0);
	textSize(42);
	textAlign(CENTER);
	fill((frameCount) % 360, 40, 100);
	text("CISC3140's Space Invaders", 400, 100);
	textSize(38);
	text("Start", 400, 250);
	text("How to Play", 400, 350);
	text("Exit", 400, 450);
	fill(255);
	text("Credits", 690, 785);

	noFill();
	colorMode(HSB);
	stroke((frameCount) % 360, 40, 100);
	rectMode(CENTER);
	rect(400,237, 175, 60);
	rect(400,337, 325, 60);
	rect(400,437, 150, 60);

}

//Creates the how to play Scene
function howToPlay(){
	background(0);
	textSize(42);
	textAlign(CENTER);
	fill("White");
	text("How To Play!", 400, 100);
	textSize(20);
	text("To move the ship use the Left and Right arrow keys\n\nTo shoot a projectile press the Spacebar\n\nTo pause the game press the key 'E'\n\n", 400, 200);
	textSize(42);
	text("Return", 400, 700);

	noFill();
	stroke("White");
	rectMode(CENTER);
	rect(397, 688, 210, 60);


}

//Creates the Exit buttons Scene
function leave(){
	background(0);
	textSize(42);
	textAlign(CENTER);
	fill("Red");
	text("We don't want you\n to play anyways", 400, 300);
}

//Creates the credit buttons scene
function credits(){
	background(0);
	textSize(42);
	textAlign(CENTER);
	fill("White");
	text("Credits:", 400, 100);
	textSize(24);
	text("Bryan Indelicato", 200, 150);
	textSize(42);
	text("Return", 400, 700);

	noFill();
	stroke("White");
	rectMode(CENTER);
	rect(397, 688, 210, 60);

}

function keyPressed() {
	//if spacebar is pressed
	if (keyCode === 32) {
		player.shoot();
		if (player.canShoot == true) {
			shootsound.setVolume(0.20);
			shootsound.play();
		}
	}


	if (key === 'r') {
		loseLife();
	}

	if (key === 'e'){
		pause = pause * -1;
	}
}

function move() {
	if (mouseY < height/2) {
		player.shoot();
	} else if(mouseX > width/2) {
		player.move(scale);
	} else if(mouseX < width/2) {
		player.move(-scale);
	}
}

function mousePressed() {
	return false;
}

function mouseDragged() {
	return false;
}

//Create bullet
function createBullet(x, y) {
	bulletPrefab = new Sprite(x, y, bulletImg.width * scale, bulletImg.height * scale, bulletImg);
	bulletPrefab.vel = createVector(0, -scale * 2);
	bulletPrefab.deadMarked = false;
	bulletPrefab.update = function updateBullet(frameCount) {
		this.pos.add(this.vel);
	}
	return bulletPrefab;
}

//Take away a life
function loseLife() {
	playerLives--;
	//make player invincible
	player.invincible = true;

}

//restarts game and reset all aliens and bullets
function restart() {
	frameCount1 = 0;
	invaders = [];
	bullets = [];
	invaderBullets = [];

	setup();
	redraw();

}


//returns high score read from browser cookie. That's not a bad cookie!
const hs = () => document.cookie.replace(/(?:(?:^|.*;\s*)highscore\s*\=\s*([^;]*).*$)|^.*$/, '$1');
const setHs = val => document.cookie = `highscore=${val}`;

const sign = n => n > 0 ? 1 : n === 0 ? 0 : -1;
