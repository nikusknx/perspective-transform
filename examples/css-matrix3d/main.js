//import html2canvas from 'html2canvas';
//import html2canvas from './node_modules/html2canvas/dist/html2canvas.js';
//const { html2canvas } = require('./node_modules/html2canvas/dist/html2canvas.js');

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

function capture(){
  console.log("save");
  html2canvas(document.getElementById("box")).then(function(canvas) {
    document.getElementById("container").appendChild(canvas);
  });
}

function handleFile(files) {
  var imageType = /^image\//;
  let preview =document.getElementById("box")
  console.log("files= ",files)
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (!imageType.test(file.type)) {
      alert("veuillez sélectionner une image");
    }else{
      if(i == 0){
        preview.innerHTML = '';
      }
      var img = document.createElement("img");
      img.classList.add("obj");
      img.file = file;
      preview.appendChild(img); 
      var reader = new FileReader();
      reader.onload = ( function(aImg) { 
        return function(e) { 
          aImg.src = e.target.result; 
        }; 
      })(img);
      reader.readAsDataURL(file);
    }
  }
}

//Corners:
//  X0;Y0----X1;Y1
//    |        |
//    |        |
//  X2;Y2----X3;Y3

corners = [100, 100, 300, 100, 100, 300, 300, 300];
function update() {
  var box = document.getElementById("box");
  transform2d(box, corners[0], corners[1], corners[2], corners[3],
                   corners[4], corners[5], corners[6], corners[7]);
  for (var i = 0; i != 8; i += 2) {
    var elt = document.getElementById("marker" + i);
    elt.style.left = corners[i] + "px";
    elt.style.top = corners[i + 1] + "px";
  }
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