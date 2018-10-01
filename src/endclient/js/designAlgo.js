/*var product = yourDesigner.getProduct();
console.log(product);
product[0].elements
title != "Base"*/

/*yourDesigner.getProductDataURL(function(dataURL) {
  $.post("php/save_image.php", {
    base64_image : dataURL
  });
});*/ 
function customizePluginSettings(){

  console.log(yourDesigner)
  if(yourDesigner.products.length){
    if(yourDesigner.products[0].products.length){
      for(var i=0; i<yourDesigner.products[0].products[0].length; i ++){
        console.log(yourDesigner.products[0].products[0][i].options);
        yourDesigner.products[0].products[0][i].options.editorMode=false;
        yourDesigner.products[0].products[0][i].options.editorBoxParameters=[]
        yourDesigner.products[0].products[0][i].options.cornerIconColor="#fff"
          
      }
    }
    
    
  }
}
function getYourDisignDetails() {
  var product = yourDesigner.getProduct();
  // console.log(JSON.stringify(product));
  var elm = product[0].elements;
  console.log(elm);
  var base64_image_design = ''
  yourDesigner.getProductDataURL(function(dataURL) {
    base64_image_design = dataURL;
    /*
     * console.log(base64_image_design); $('#output_dom').append('<img
     * src="'+dataURL+'"><br>'); for(var i=0; i<elm.length; i++){
     * if(fram.type=="image" && title=="Base"){ continue; } var fram = elm[i];
     * var h=''; if(fram.type=="image"){ h='<img src="'+fram.source+'"><br>' }
     * else { h='<font style="font-family:
     * '+fram.parameters.fontFamily+';font-size:'+fram.parameters.fontSize+'">'+fram.source+'</font><br>' }
     * $('#output_dom').append(h);
     *  }
     */
  });

};

var productDesignLayer = [];
function createUserDisgn() {
  if (!confirm('Do you wish to save this design?'))
    return;

  var product = yourDesigner.getProduct();
  productDesignLayer = product[0].elements;
  console.log(productDesignLayer)
  if (productDesignLayer.length < 2) {
    alert('No changes detected');
    return;
  }

  $('#create_product_design_form').hide();
  $('#pls_wait_design_saving').show();
  $('#design_layer').val(JSON.stringify(productDesignLayer));
  yourDesigner.getProductDataURL(function(dataURL) {
    $('#design_print').val(dataURL);

    postRequest('create_product_design_form', '/CreateDesign',
        'createUserDisgnCallBack');
  });

};

function createUserDisgnCallBack(r) {
  var h = 'Your design is ready<br>Design Id: ' + r.data.id
          + ' <br><button type="button" class="fpd-btn" onclick="backToProductAcitionDom()">Continue</button>';
  $('#pls_wait_design_saving').html(h);
  $('#selected_design_id').val(r.data.id);
  $('#design_id').val(r.data.id);
  $('#design_id_text').html(r.data.id);
  $('#design_paragraf').show();
  $('#create_desgin_btn').hide();
};

