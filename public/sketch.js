function setup() {
  createCanvas(windowWidth, windowHeight);
  console.log("client run")
}

function draw() {
  background(51);
  ellipse(mouseX, mouseY, 30, 30);
}