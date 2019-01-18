/*var product = yourDesigner.getProduct();
console.log(product);
product[0].elements
title != "Base"*/

/*yourDesigner.getProductDataURL(function(dataURL) {
  $.post("php/save_image.php", {
    base64_image : dataURL
  });
});*/ 
var svgList = []
function getRequest(formID, url, callback) {
    var formData = [];
    try{
      formData = $("#" + formID).serializeArray();
    } catch {}  
    // Ajax call
    $.get(url, $.param(formData), function(obj) {
        if (callback != null) {
            var callbackMethod = eval(callback);
            callbackMethod(obj, formID);
        } 
    });
};

function postRequest(formID, url, callback) {
    var formData = $("#" + formID).serializeArray();
    $("button").attr("disabled", true); 
    // Ajax call
    $.ajax({
        url : url,
        data : $.param(formData),
        dataType : 'json',
        method : 'POST',
        success : function(obj) { 
            if (callback != null) {
                var callbackMethod = eval(callback);
                callbackMethod(obj, formID);
            }
             
            $("button").attr("disabled", false);
        }
    });
}; 


var productDesignLayer = [],layer='';
function createUserDisgn(savingURL) {

  var product = yourDesigner.getProduct();
  productDesignLayer = product[0].elements;
  console.log(productDesignLayer)
  if (productDesignLayer.length < 2) {
    alert('No changes detected');
    return;
  }

  if (!confirm('Do you wish to save this design?'))
    return;
   
  $('#pls_wait_design_saving').show();
  layer=JSON.stringify(product);
  //$('#design_layer').val(JSON.stringify(product));
  yourDesigner.getProductDataURL(function(dataURL) {
    $('#design_print').val(dataURL);
    postRequest('create_product_design_form', '/CreateDesign', 'uploadDesignToBucket');
    
  });

};

function download(svgContent){
  var dl = document.createElement("a");
  document.body.appendChild(dl); // This line makes it work in Firefox.
  dl.setAttribute("href", svgContent);
  dl.setAttribute("download", "test.svg");
  dl.click();
}

function createDBEntryOnly(){
  postRequest('create_product_design_form', '/CreateDesign', 'uploadDesignToBucket');
}

function SaveAndOrderSVG(){

  var product = yourDesigner.getProduct();
  productDesignLayer = product[0].elements;
  console.log(productDesignLayer)
  if (productDesignLayer.length < 2) {
    alert('No changes detected');
    return;
  }
  if (!confirm('Do you wish to save this design?')){
    return;
  }
  try{
    svgList = yourDesigner.getViewsSVG()
    
  } catch {
    alert('Kindly add color to your text!')
    return
  }
  //download(svgList[0])
  $('#pls_wait_design_saving').show();
  postRequest('create_product_design_form', '/CreateDesign', 'svgUploadDesignToBucket');
}

function getSvgToBlob(svgData){
  //svgData = (new XMLSerializer()).serializeToString(svgData)
  var blob = new Blob([svgData], {
    type: 'image/svg+xml; charset=utf8'
  });
  return blob;
}

function svgUploadDesignToBucket(r){
  if(r.status=='ERROR'){
    alert('Session expired, Kindly login');
    $('#pls_wait_design_saving').hide();
    window.location='/'
    return;
  } 
  $('#design_key').val(r.data.design_key); 
  placeOrder=true; 
  var formData = new FormData(); 
  formData.append('counter', svgList.length);
  formData.append('product', $('#product_key').val());
  formData.append('design_key', r.data.design_key);
  for(let i in svgList){
    formData.append('svg'+i, getSvgToBlob(svgList[i]));
    $('#create_product_design_form').append($('<textarea name="svgresut">').val(svgList[0]))
  }
  

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/SVGBucketUploadDesign', true);

  xhr.onreadystatechange = function(r) {
      if (this.readyState == 4 && this.status == 200) {
          console.log(r)
          console.log(this)
          var r = JSON.parse(this.response); 
          $('#pls_wait_design_saving').hide();
     }
  }; 

  xhr.send(formData);
  $( "#create_product_design_form" ).submit();
  
}


function uploadDesignToBucket(r){
  if(r.status=='ERROR'){
    alert('Session expired, Kindly login');
    $('#pls_wait_design_saving').hide();
    window.location='/'
    return;
  }
  //r.data.id;
  $('#design_key').val(r.data.design_key);
  placeOrder=true; 
  var block = $('#design_print').val().split(";");
  // Get the content type of the image
  var contentType = block[0].split(":")[1];// In this case "image/gif"
  // get the real base64 content of the file
  var realData = block[1].split(",")[1];// In this case "R0lGODlhPQBEAPeoAJosM...."
  // Convert it to a blob to upload
  var blob = b64toBlob(realData, contentType);
  var formData = new FormData();
  formData.append('layer', layer);
  formData.append('design_print2', blob);
  formData.append('product', $('#product_key').val());
  formData.append('design_key', $('#design_key').val());

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/BucketUploadDesign', true);

  xhr.onreadystatechange = function(r) {
      if (this.readyState == 4 && this.status == 200) {
          console.log(r)
          console.log(this)
          var r = JSON.parse(this.response); 
          $('#pls_wait_design_saving').hide();
     }
  }; 

  xhr.send(formData);
  $( "#create_product_design_form" ).submit();
  
}


function createUserDisgnCallBack(r) {
  /*var h = 'Your design is ready<br>Design Id: ' + r.data.id
          + ' <br><button type="button" class="fpd-btn" onclick="backToProductAcitionDom()">Continue</button>';
  $('#pls_wait_design_saving').html(h);
  $('#selected_design_id').val(r.data.id);
  $('#design_id').val(r.data.id);
  $('#design_id_text').html(r.data.id);
  $('#design_paragraf').show();
  $('#create_desgin_btn').hide();*/
  $('#pls_wait_design_saving').hide();
  $('#design_key').val(r.data.design_key);
  
};

function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
  }

var blob = new Blob(byteArrays, {type: contentType});
return blob;
}

function getReadyDesingJsonCB(r){
  if(!r.data.contents){
    $('#msg_div').html('<h4>Please refresh your browser!</h4>')
    return;
  }
  $('#msg_div').html('<h4>Parsing Desiner Data!</h4>');
  var designJson = JSON.parse(r.data.contents);
  console.log(designJson);
  loadFPDJsonRecursive(designJson);
}

function loadFPDJsonRecursive(designJson){
  if(yourDesigner){
    $('#msg_div').html('<h4>Initializing Designer!</h4>');
    yourDesigner.loadProduct(designJson, true);
    $('#pls_wait_design_loadind').hide();
  } else {    
    $('#msg_div').html('<h4>Plaese wait rendring designer data!</h4>');
    setTimeout(loadFPDJsonRecursive(designJson), 500);
  }
}

function getSavedDesingJsonCB(r){
  if(!r.data.contents){
    $('#msg_div').html('<h4>Please refresh your browser!</h4>')
    return;
  }
  $('#msg_div').html('<h4>Parsing Desiner Data!</h4>');
  var designJson = JSON.parse(r.data.contents);
  console.log(designJson);
  loadFPDJsonRecursive(designJson);
  
}

