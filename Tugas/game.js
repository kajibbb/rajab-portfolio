const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", ()=>{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ===== SOUND (tanpa file) =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function jumpBeep(){
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.frequency.value = 500;
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function hitBeep(){
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.frequency.value = 120;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

// ===== PLAYER =====
let player = {
    x:100,
    y:canvas.height-140,
    w:70,
    h:70,
    vy:0,
    gravity:0.7,
    jump:-16,
    onGround:true
};

let speed = 6;
let score = 0;
let gameOver = false;
let time = 0;

let obstacles = [];
let clouds = [{x:300,y:100},{x:800,y:150},{x:1300,y:80}];
let trees = [{x:500},{x:900},{x:1400}];

// CONTROL
document.addEventListener("keydown", e=>{
    if(e.code==="Space"){
        if(gameOver){
            restartGame();
        }else if(player.onGround){
            player.vy = player.jump;
            player.onGround=false;
            jumpBeep();
        }
    }
});

function restartGame(){
    obstacles=[];
    score=0;
    speed=6;
    gameOver=false;
}

// SPAWN
function spawnObstacle(){
    obstacles.push({
        x:canvas.width+Math.random()*300,
        y:canvas.height-90,
        w:30,
        h:60
    });
}

// UPDATE
function update(){
if(gameOver) return;

time++;
if(time%120===0) spawnObstacle();

player.vy+=player.gravity;
player.y+=player.vy;

if(player.y>=canvas.height-140){
    player.y=canvas.height-140;
    player.vy=0;
    player.onGround=true;
}

speed += 0.002;

obstacles.forEach(o=>{
    o.x-=speed;

    if(o.x+o.w<0) score++;

    if(player.x<o.x+o.w &&
       player.x+player.w>o.x &&
       player.y<o.y+o.h &&
       player.y+player.h>o.y){
        gameOver=true;
        hitBeep();
    }
});

clouds.forEach(c=>{
    c.x-=1;
    if(c.x<-100)c.x=canvas.width+200;
});

trees.forEach(t=>{
    t.x-=speed;
    if(t.x<-50)t.x=canvas.width+200;
});
}

// ===== DRAW DINO (pixel) =====
function drawDino(x,y){
    ctx.fillStyle="#2ecc71";
    ctx.fillRect(x,y,50,40); // badan
    ctx.fillRect(x+40,y-20,20,20); // kepala
    ctx.fillRect(x+10,y+40,10,20); // kaki
    ctx.fillRect(x+30,y+40,10,20);
    ctx.fillRect(x-10,y+10,15,10); // ekor
    ctx.fillStyle="#000";
    ctx.fillRect(x+50,y-10,5,5); // mata
}

// DRAW
function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

// day night
let sky = Math.sin(time*0.002)*50+150;
ctx.fillStyle=`rgb(${sky},${sky+50},255)`;
ctx.fillRect(0,0,canvas.width,canvas.height);

// ground
ctx.fillStyle="#333";
ctx.fillRect(0,canvas.height-60,canvas.width,60);

// clouds
ctx.fillStyle="#fff";
clouds.forEach(c=>{
    ctx.beginPath();
    ctx.arc(c.x,c.y,40,0,Math.PI*2);
    ctx.fill();
});

// trees
trees.forEach(t=>{
    ctx.fillStyle="#5b3a1a";
    ctx.fillRect(t.x,canvas.height-100,20,40);
    ctx.fillStyle="green";
    ctx.beginPath();
    ctx.arc(t.x+10,canvas.height-110,35,0,Math.PI*2);
    ctx.fill();
});

// dino
drawDino(player.x,player.y);

// obstacles
ctx.fillStyle="red";
obstacles.forEach(o=>{
    ctx.fillRect(o.x,o.y,o.w,o.h);
});

// score
ctx.fillStyle="#000";
ctx.font="30px Arial";
ctx.fillText("Score: "+score,30,50);

if(gameOver){
    ctx.font="60px Arial";
    ctx.fillText("GAME OVER",canvas.width/2-200,canvas.height/2);
    ctx.font="30px Arial";
    ctx.fillText("Press SPACE to restart",canvas.width/2-170,canvas.height/2+50);
}
}

// LOOP
function loop(){
update();
draw();
requestAnimationFrame(loop);
}
loop();