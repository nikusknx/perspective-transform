
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
let perspectiveTransform;
let filename;

let corners = [xOrigin, yOrigin, 
  xOrigin+imaWidth, yOrigin, 
  xOrigin, yOrigin+imaHeight, 
  xOrigin+imaWidth, yOrigin+imaHeight];
const originCorners = [...corners];

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

// http://mitgux.com/send-canvas-to-server-as-file-using-ajax
// Convert dataURL to Blob object
function dataURLtoBlob(dataURL) {
	// Decode the dataURL    
	var binary = atob(dataURL.split(',')[1]);
	// Create 8-bit unsigned array
	var array = [];
	for (var i = 0; i < binary.length; i++) {
		array.push(binary.charCodeAt(i));
	}
	// Return our Blob object
	return new Blob([new Uint8Array(array)], { type: 'image/png' });
}

//save the box element in canvas and write it in a png file
function capture(){
  const link = document.createElement('a');
  link.download = filename+'_tr.png';
  link.href = document.getElementById('resultCanvas').toDataURL()
  link.click();
}

//open a panel to select one image 
function selectFile(input) {
  filename = input.files[0].name.replace(/\.[^/.]+$/, "");
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
  //we resize canvas
  const resCanvas = document.getElementById("resultCanvas");
  const resContext = resCanvas.getContext('2d');
  const result = document.getElementById("result");
  const source = document.getElementById("source");
  result.style.width = source.style.width;
  result.style.height = source.style.height;
  result.style.top = source.style.top;
  resCanvas.width = imaWidth;
  resCanvas.height = imaHeight;

  //get the pixel info of source
  const srcCanvas = document.getElementById("sourceCanvas");
  const srcContext = srcCanvas.getContext('2d');
  const srcImageData = srcContext.getImageData(0, 0, imaWidth, imaHeight);

  const imageData = resContext.createImageData(imaWidth ,imaHeight);

  setMatrixForCurrentRectangles();
  for (let i=0; i < srcImageData.data.length; i+=4){
    const pixelIndex = i/4;
    //we compute the x and y position of the current pixel
    const x = pixelIndex%imaWidth;// rowIndex - rowIndex*imaWidth
    const y = Math.trunc(pixelIndex/imaWidth);
    const res = perspectiveTransform.transform(x,y);
    const xRes = Math.trunc(res[0]);
    const yRes = Math.trunc(res[1]);
    const resIndex = Math.trunc((xRes + yRes * imaWidth) * 4);

    imageData.data[i + 0] = srcImageData.data[resIndex + 0];
    imageData.data[i + 1] = srcImageData.data[resIndex + 1];
    imageData.data[i + 2] = srcImageData.data[resIndex + 2];
    imageData.data[i + 3] = srcImageData.data[resIndex + 3];
  }
  resContext.putImageData(imageData, 0, 0);
}

//compute matrix from distorted corner points
function setMatrixForCurrentRectangles(){
  //we correct rectangle with the offset
	let source = [];
  let dest = [];
  for (i=0; i<originCorners.length; i+=2){
    source[i]=originCorners[i]-xOrigin;
    source[i+1]=originCorners[i+1]-yOrigin;
    dest[i]=corners[i]-xOrigin;
    dest[i+1]=corners[i+1]-yOrigin;
  }
	perspectiveTransform = PerspT(source, dest);
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