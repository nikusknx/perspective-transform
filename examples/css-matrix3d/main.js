//import html2canvas from 'html2canvas';
//import html2canvas from './node_modules/html2canvas/dist/html2canvas.js';
//const { html2canvas } = require('./node_modules/html2canvas/dist/html2canvas.js');

//Corners:
//  X0;Y0----X1;Y1
//    |        |
//    |        |
//  X2;Y2----X3;Y3
const xOrigin = 150;
const yOrigin = 200;
const imaWidth = 512;
const imaHeight = 512;
const handleSize = 10;
let perspectiveTran;

let corners = [xOrigin, yOrigin, 
  xOrigin+imaWidth, yOrigin, 
  xOrigin, yOrigin+imaHeight, 
  xOrigin+imaWidth, yOrigin+imaHeight];
const originCorners = corners;

//transform box 
function transform2d(elt, x1, y1, x2, y2, x3, y3, x4, y4) {
  var w = elt.offsetWidth, h = elt.offsetHeight;
  var transform = PerspT([0, 0, w, 0, 0, h, w, h], [x1, y1, x2, y2, x3, y3, x4, y4]);
  var t = transform.coeffs;
  t = [t[0], t[3], 0, t[6],
       t[1], t[4], 0, t[7],
       0   , 0   , 1, 0   ,
       t[2], t[5], 0, t[8]];
  t = "matrix3d(" + t.join(", ") + ")";
  elt.style["-webkit-transform"] = t;
  elt.style["-moz-transform"] = t;
  elt.style["-o-transform"] = t;
  elt.style.transform = t;
}

//save the box element in canvas and write it in a png file
function capture(){
  html2canvas(document.getElementById("box")).then(function(canvas) {
    let resultBox = document.getElementById("result");
    resultBox.innerHTML = '';
    resultBox.appendChild(canvas);
  });
}

//open a panel to select one image 
function selectFile(input) {
  var imageType = /^image\//;

  const source = document.getElementById("source");
  source.style.width = imaWidth + "px";
  source.style.height = imaHeight + "px";
  source.style.left = xOrigin + "px";
  source.style.top = yOrigin + "px";

  const canvas = document.getElementById("sourceCanvas");
  canvas.width = imaWidth;
  canvas.height = imaHeight;
  const context = canvas.getContext('2d');
  
  context.clearRect(0, 0, canvas.width, canvas.height);
  let imgSrc = '';
  if (input.value !== '') {
    imgSrc = window.URL.createObjectURL(input.files[0]);
  }
  const img = new Image();
  img.onload = function() {
    // const hRatio = canvas.width / img.width;
    // const vRatio = canvas.height / img.height;
    // const ratio  = Math.min ( hRatio, vRatio );
    context.drawImage(img, 0, 0, img.width, img.height, 0,0, imaWidth, imaHeight);//img.width*ratio, img.height*ratio);
  }
  img.src = imgSrc;
}

function update() {
  var box = document.getElementById("box");
  transform2d(box, corners[0], corners[1], corners[2], corners[3],
                   corners[4], corners[5], corners[6], corners[7]);
  for (var i = 0; i != 8; i += 2) {
    var elt = document.getElementById("marker" + i);
    elt.style.left = (corners[i]-handleSize) + "px";
    elt.style.top = corners[i + 1]-handleSize + "px";
  }
}

//transform source to dest by matrix calculation from distorted corner points
function transform(){
  const resCanvas = document.getElementById("resultCanvas");
  const resContext = resCanvas.getContext('2d');
  const result = document.getElementById("result");
  const source = document.getElementById("source");
  result.style.width = source.style.width;
  result.style.height = source.style.height;
  result.style.top = source.style.top;
  resCanvas.width = imaWidth;
  resCanvas.height = imaHeight;

  const srcCanvas = document.getElementById("sourceCanvas");
  const srcContext = srcCanvas.getContext('2d');
  const srcImageData = srcContext.getImageData(0, 0, imaWidth, imaHeight);
  // console.log("srcImageData = ",srcImageData);

  const imageData = resContext.createImageData(imaWidth ,imaHeight);

  setMatrixForCurrentRectangles();
  for (let i=0; i < srcImageData.data.length; i+=4){
    // resContext.fillStyle = "rgba("+255+","+0+","+0+","+(255/255)+")";
    // resContext.fillRect( 0, 0, imaWidth, imaHeight );
    let x = i/imaWidth
    applyTransform(x,y)
    imageData.data[i + 0] = srcImageData.data[i + 0]
    imageData.data[i + 1] = srcImageData.data[i + 1]
    imageData.data[i + 2] = srcImageData.data[i + 2]
    imageData.data[i + 3] = srcImageData.data[i + 3]
  }
  // console.log("resultImageData= ",imageData);
  resContext.putImageData(imageData, 0, 0);
}

//compute matrix from distorted corner points
function setMatrixForCurrentRectangles(){
	// var index;//, rect1Id, rect2Id;
	var source = [];
	// for(var i = 0; i < 8; i++){
	// 	if(i % 2 == 0){
	// 		index = 'x' + i/2;
	// 	}
	// 	else{
	// 		index = 'y' + (i-1)/2;
	// 	}
	// 	coordinates[i] = Number( $('#rect1' + index).val() );
	// 	rect2[i] = Number( $('#rect0' + index).val() );
	// }
	perspectiveTran = PerspT(originCorners, corners);
	// for(var i = 0; i < perspectiveTran.coeffs.length; i++){
	// 	$('#transMat' + i).html(perspectiveTran.coeffs[i]);
	// 	$('#transMatInv' + i).html(perspectiveTran.coeffsInv[i]);
	// }
}

function applyTransform(x,y){
	// var x = $('#pointX').val();
	// var y = $('#pointY').val();
	const res = perspectiveTran.transform(x,y);
  console.log("res=",res);
	//$('#transResult').html('(' + roundToThousandths(res[0]) + ', ' + roundToThousandths(res[1]) + ')');
}

function move(evnt) {
  if (currentcorner < 0) return;
  corners[currentcorner] = evnt.pageX;
  corners[currentcorner + 1] = evnt.pageY;
  update();
}

currentcorner = -1;
window.addEventListener('load', function() {
  document.documentElement.style.margin="0px";
  document.documentElement.style.padding="0px";
  document.body.style.margin="0px";
  document.body.style.padding="0px";
  update();
});

window.addEventListener('mousedown', function(evnt) {
  var x = evnt.pageX, y = evnt.pageY, dx, dy;
  var best = 400; // 20px grab radius
  currentcorner = -1;
  for (var i = 0; i != 8; i += 2) {
    dx = x - corners[i];
    dy = y - corners[i + 1];
    if (best > dx*dx + dy*dy) {
      best = dx*dx + dy*dy;
      currentcorner = i;
    }
  }
  move(evnt);
});

window.addEventListener('mouseup', function(evnt) {
  currentcorner = -1;
})

window.addEventListener('mousemove', move);