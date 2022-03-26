// Support TLS-specific URLs, when appropriate.
if (window.location.protocol == "https:") {
  var ws_scheme = "wss://";
} else {
  var ws_scheme = "ws://"
};

class Circle {
  constructor(x, y, diameter, color) {
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.color = color;
  }

  next() {
    this.diameter += 1;
  }

  display() {
    if (this.diameter < 400) {
      noFill();
      strokeWeight(5);
      stroke(this.color);
      // stroke(color(128, 128, 128));
      // console.log(this.color);
      ellipse(this.x, this.y, this.diameter, this.diameter);
    }
  }
}

const allCapsAlpha = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]; 
const allLowerAlpha = [..."abcdefghijklmnopqrstuvwxyz"]; 
const allUniqueChars = [..."~!@#$%^&*()_+-=[]\{}|;:'\",./<>?"];
const allNumbers = [..."0123456789"];

const base = [...allCapsAlpha, ...allNumbers, ...allLowerAlpha, ...allUniqueChars];

const generator = (base, len) => {
   return [...Array(len)]
     .map(i => base[Math.random()*base.length|0])
     .join('');
};

var id = generator(allLowerAlpha, 10);

var users = {};
var obj = [];

var inbox = new ReconnectingWebSocket(ws_scheme + location.host + "/receive");
var outbox = new ReconnectingWebSocket(ws_scheme + location.host + "/submit");

inbox.onmessage = function(message) {
  // console.log("->:" + message.data);
  data = JSON.parse(message.data);
  if (data.handle === "mouse") {
    users[data.from] = {x: data.x, y: data.y}
  }
  if (data.handle === "click") {
    obj.push(new Circle(data.x, data.y, 10, color(random(255), height, height)));
  }
};

inbox.onclose = function(){
    console.log('inbox closed');
    this.inbox = new WebSocket(inbox.url);
};

outbox.onclose = function(){
    console.log('outbox closed');
    this.outbox = new WebSocket(outbox.url);
};

// $("#input-form").on("submit", function(event) {
//   event.preventDefault();
//   var handle = $("#input-handle")[0].value;
//   var text   = $("#input-text")[0].value;
//   outbox.send(JSON.stringify({ handle: handle, text: text }));
//   $("#input-text")[0].value = "";
// });

// sound
let loopBeat;
let bassSynth, cymbalSynth;
let counter;


// image
const barWidth = 20;
let lastBar = -1;

function setup() {
  // image
  createCanvas(window.innerWidth, window.innerHeight);
  colorMode(HSB, height, height, height);
  noStroke();
  background(0);
  // noCursor();

  // sound
  counter = 0;

  bassSynth = new Tone.MembraneSynth().toDestination();
  cymbalSynth = new Tone.MetalSynth({
    "frequency": 250,
    "envelope": {
      "attack": 0.001,
      "decay": 0.1,
      "release": 0.01,
    },
    "harmonicity": 3.1,
    "modulationIndex": 16,
    "resonance": 4000,
    "octaves": 0.5,
  }).toDestination();

  loopBeat = new Tone.Loop(song, "16n");

  Tone.Transport.bpm.value = 140;
  Tone.Transport.start();
  loopBeat.start(0);

  setInterval(() => {
    if (outbox.readyState == 1) outbox.send(JSON.stringify({ from: id, handle: "mouse", x: mouseX, y: mouseY }));
  }, 500);
}

function song(time) {
  if (counter % 4 === 0) {
    bassSynth.triggerAttackRelease("c1", "8n", time, 1);
  }

  if (counter % 4 !== 1) {
    if (counter === 3 || counter === 12) {
        cymbalSynth.envelope.decay = 0.5;
    } else {
        cymbalSynth.envelope.decay = 0.01;
    }
    cymbalSynth.triggerAttackRelease("c1", "32n", time, 0.3);
  }
  counter = (counter + 1) % 16;
  // console.log(counter);
}

// image
function draw() {
  fill(mouseX, height, height);
  textSize(32);
  text(getURL(), window.innerWidth / 2 - window.innerWidth / 4 , window.innerHeight / 2);

  noStroke();
  let whichBar = mouseX / barWidth;
  if (whichBar !== lastBar) {
    let barX = whichBar * barWidth;
    fill(mouseY, height, height);
    rect(barX, 0, barWidth, height);
    lastBar = whichBar;
  }

  for (const u in users) {
    fill(mouseX, height, height);
    ellipse(users[u].x, users[u].y, 80, 80);
  }
  ellipse(mouseX, mouseY, 80, 80);

  for (const i in obj) {
    obj[i].next();
    obj[i].display();
    // console.log(obj[i].color);
  }
}

function mouseClicked() {
  if (outbox.readyState == 1) outbox.send(JSON.stringify({ handle: "click", x: mouseX, y: mouseY }));
}