/*var product = yourDesigner.getProduct();
console.log(product);
product[0].elements
title != "Base"*/
  
  /*yourDesigner.getProductDataURL(function(dataURL) {
    $.post("php/save_image.php", {
      base64_image : dataURL
    });
  });*/
var yourDesigner;

function saveYourDisign(){ 
  var product = yourDesigner.getProduct();
  //console.log(JSON.stringify(product));
  var elm = product[0].elements;
  console.log(elm);
  var base64_image_design = ''
  yourDesigner.getProductDataURL(function(dataURL) {
    base64_image_design = dataURL;
    /*console.log(base64_image_design);
    $('#output_dom').append('<img src="'+dataURL+'"><br>');
    for(var i=0; i<elm.length; i++){
      if(fram.type=="image" && title=="Base"){
        continue;
      }
      var fram = elm[i];
      var h='';
      if(fram.type=="image"){
        h='<img src="'+fram.source+'"><br>'
      } else {
        h='<font style="font-family: '+fram.parameters.fontFamily+';font-size:'+fram.parameters.fontSize+'">'+fram.source+'</font><br>'
      }
      $('#output_dom').append(h);
      
    }*/
  }); 
  
  
  
};

