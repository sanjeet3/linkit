function testPreview(a){
  console.log(a);
}

var preveiwMug = function(designDataUrl, leftView){
  var canvas = document.getElementById("prev-canvas");
  var ctx = canvas.getContext("2d");

  var productImg = new Image();
  productImg.onload = function () {
      var iw = productImg.width;
      var ih = productImg.height;
      console.log("height");

      canvas.width = iw;
      canvas.height = ih;

      ctx.drawImage(productImg, 0, 0, productImg.width, productImg.height,
                    0, 0, iw, ih);
 
  };
  productImg.src = "https://d2z4fd79oscvvx.cloudfront.net/0018872_inspirational_teacher_mug.jpeg";

  var img = new Image();
  img.onload = start;
  img.src = designDataUrl;
  //img.src = "http://blog.foreigners.cz/wp-content/uploads/2015/05/Make-new-friends.jpg";
  //var pointer = 0;
  
  
  function start() {
    // center view
    var iw = img.width;
    var ih = img.height;
    
    var xOffset = 125,    
        yOffset = 122; // design margin: xOffset =>left, yOffset => top
    
    var a = 122.0;  // cylinder cover Xoffset, width
    var b = 30.0;  // cylinder cover Yoffset, height
    
    var scaleFactor = iw / (4*a);  
    var acrop=iw*0.5;
    // draw vertical slices
    for (var X = 0; X < iw; X+=1) {
      var y = b/a * Math.sqrt(a*a - (X-a)*(X-a)); // ellipsis equation
      ctx.drawImage(img, X * scaleFactor, 0, acrop, ih, X + xOffset, y + yOffset, 1, ih - 605 + y/2);
    }
}
  
  
  
}


function preveiwWaterBottle(background_url, src){
  var h =['<div style="float: left;width: 350px;height: 928px;overflow: hidden; background: url('];
  h.push(background_url);
  h.push(');background-size: cover;"><div style="width: 98.5%;height: 98%;overflow: hidden;padding: 3px;"><img class="" style="margin-top: 95%;height: 58%;max-width: initial;" src="');
  h.push(src); 
  h.push('"></div></div>'); 
  h.push('<div style="float: left;margin-left:50px;width: 350px;height: 928px;overflow: hidden;background: url(');
  h.push(background_url);
  h.push(');background-size: cover;"><div style="text-indent:-169px;width: 98.5%;height: 98%;overflow: hidden;padding: 3px;"><img class="" style="margin-top: 95%;height: 58%;max-width: initial;" src="');
  h.push(src); 
  h.push('"></div></div>'); 
  h.push('<div style="float: left;margin-left:50px;width: 350px;height: 928px;overflow: hidden;background: url(');
  h.push(background_url);
  h.push(');background-size: cover;"><div style="text-indent:-76%;width: 98.5%;height: 98%;overflow: hidden;padding: 3px;"><img class="" style="margin-top: 95%;height: 58%;max-width: initial;" src="');
  h.push(src); 
  h.push('"></div></div>'); 
  //h.push();  
  return h.join('');
}
