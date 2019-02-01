var searchTableMsg = '<tr class="text-center"><td colspan="20"><i class="fa fa-spinner fa-spin" ></i> Searching...</td></tr>'

function setEventListForProductPage(r){
  var Earr = r.data.event_list;
  
  for(var i=0; i<Earr.length; i++){
    var obj = Earr[i];
    $('#event').append($('<option>', {
      value : obj.key
    }).text(obj.title));
  }
}  
  
function saveProduct() {
  if (!$('#name').val()) {
    showMSG('Please enter name of product', 'warning');
    return;
  }
  if (!$('#price').val() || $('#price').val() == '0.0') {
    showMSG('Please enter price of product', 'warning');
    return;
  }
  if (!$('#category').val()) {
    showMSG('Please enter category of product', 'warning');
    return;
  }

  $('#save_product_spin').show();
  postRequest('product_form', '/superadmin/SaveProduct', 'saveProductCallBack')
};

function saveProductCallBack(obj, fID) {
  $('#save_product_spin').hide();
  $('#dummy_dom').show();
  var tr = [ "<tr id='" + obj.data.key + "'><td> " ];
  tr.push(obj.data.code);
  tr.push('</td><td>');
  tr.push(obj.data.name);
  tr.push('</td><td>');
  tr.push(obj.data.category);
  tr.push('</td><td>');
  tr.push(obj.data.uom);
  tr.push('</td><td>');
  tr.push(obj.data.price);
  tr.push('</td><td>');
  tr.push(obj.data.size);
  tr.push('</td><td>');
  tr.push(obj.data.description);
  var dummytr = tr.join('');
  $('#dummy_product_table_body').append(dummytr + '</td></tr>');
  tr
      .push('</td><td><div class="widget-toolbar no-border"> <button class="btn btn-xs bigger btn-yellow dropdown-toggle" data-toggle="dropdown"');
  tr
      .push(' aria-expanded="false"><i class="ace-icon fa fa-cog"></i></button><ul ');
  tr
      .push(' class="dropdown-menu dropdown-yellow dropdown-menu-right dropdown-caret dropdown-close">');
  tr.push('<li><a href="javascript:imgSetupProduct(');
  tr.push("'");
  tr.push(obj.data.key);
  tr.push("'");
  tr.push(')">Setup Images</a></li><li><a href="javascript:getProductEdit(');
  tr.push("'");
  tr.push(obj.data.key);
  tr.push("'");
  tr.push(')">Edit</a></li></ul> </div></td> </tr>');
  $('#product_table_body').prepend(tr.join(''));
  $('#' + fID)[0].reset();
};

function saveProductCategory() {

  if (!$('#new_category').val()) {
    showMSG('Please enter category', 'warning');
    return;
  }
  postRequest('add_new_category_form', '/superadmin/SaveProductCategory',
      'saveCategoryCallBack')
}

function saveCategoryCallBack(obj, fID) {
  $('#add_new_category_spin').hide();
  $('#' + fID)[0].reset();
  closeDialog('#addCategoryDailog');
  category
  $('#category').append($('<option>', {
    value : obj.data.key
  }).text(obj.data.name));
}

function saveUOM() {

  if (!$('#new_uom').val()) {
    showMSG('Please enter UOM', 'warning');
    return;
  }
  postRequest('add_new_uom_form', '/superadmin/SaveProductUOM',
      'saveProductUOMCallBack')
}
function saveProductUOMCallBack(obj, fID) {
  $('#save_product_spin').hide();
  $('#' + fID)[0].reset();
  closeDialog('#addUOMDailog')
  $('#uom').append($('<option>', {
    value : obj.data.key
  }).text(obj.data.name));
}

function showFrenchiseFormDom() {
  $('#list-dom, #add_btn').hide();
  $('#form-dom, #bck-btn').show();
};
function showFrechiseListDom() {
  $('#list-dom, #add_btn').show();
  $('#form-dom, #add-product-frenchise, #bck-btn').hide();
};

function saveFrenchise() {
  name = $('#name').val();
  email = $('#email').val();
  geo = $('#geo').val();

  if (!name) {
    showMSG('Please enter name', 'warning');
    return;
  }
  if (!email) {
    showMSG('Please enter email', 'warning');
    return;
  }
  $('#save_spin').show();
  postRequest('frenchise_form', '/superadmin/CreateSeller',
      'saveFrenchiseCallBack')
};

function saveFrenchiseCallBack(obj, fID) {
  $('#save_spin').hide();
  $('#dummy_dom').show();
  var tr = [ '<tr id="' ];
  tr.push(obj.data.key);
  tr.push('"><td>');
  tr.push(obj.data.name);
  tr.push('</td><td>');
  tr.push(obj.data.person);
  tr.push('</td><td>');
  tr.push(obj.data.email);
  tr.push('</td><td>');
  tr.push(obj.data.telephone);
  tr.push('</td><td>');
  tr.push(obj.data.mobile);
  tr.push('</td><td>');
  tr.push(obj.data.geo);
  tr.push('</td><td>');
  tr.push(obj.data.address);
  tr
      .push('</td><td><div class="widget-toolbar no-border"><button class="btn btn-xs bigger btn-yellow dropdown-toggle" data-toggle="dropdown" aria-expanded="false">');
  tr
      .push('<i class="ace-icon fa fa-cog"></i></button> <ul class="dropdown-menu dropdown-yellow dropdown-menu-right dropdown-caret dropdown-close">');
  tr.push('<li><a href="javascript:addProductToSeller(');
  tr.push("'");
  tr.push(obj.data.key);
  tr.push("'");
  tr.push(')">Add Products</a></li><li><a href="#">Edit Account</a></li>');
  tr
      .push('<li class="divider"></li> <li><a href="#">Suspend Account</a></li></ul></div></td></tr>');
  tr = tr.join('');
  $('#dummy_table_body').append(tr);
  $('#table_body').prepend(tr);
  $('#' + fID)[0].reset();
};

function addProductToSeller(id) {
  $('#assigned_product_frenchise').html('');
  $('#seller_key').val(id);
  tds = $('#' + id).children();
  $('#selected_frenchise_text').html(tds.eq(0).html());
  $('#add-product-frenchise, #bck-btn, .master-product').show();
  $('#list-dom, #add_btn, #form-dom').hide();
  $('#msg_text').html('Fetching seller products please wait...');
  openDialog('#assign-product-to-seller');
  getRequest('', '/superadmin/GetSellerProduct?key=' + id,
      'getSellerProductListCallBack')

};

function getSellerProductListCallBack(obj) {
  var product_list = obj.data.product_list;
  for (var i = 0; i < product_list.length; i++) {
    var d = product_list[i];
    btnH = [ '<td>  <button type="button" class="mr-5 mt-5 btn btn-info btn-minier" onclick="editFrncProduct(' ];
    btnH.push("'");
    btnH.push(d.key);
    btnH.push("'");
    btnH
        .push(')">Edit</button><button type="button" class="mr-5 mt-5 btn btn-info btn-minier" onclick="editDoneFrncProduct(');
    btnH.push("'");
    btnH.push(d.key);
    btnH.push("'");
    btnH
        .push(')" style="display: none;">Done</button><button type="button" class="btn btn-danger btn-minier mt-5" onclick="removeFrncProduct(');
    btnH.push("'");
    btnH.push(d.key);
    btnH.push("'");
    btnH.push(')">Remove</button></td>');

    var row = $("<tr id='" + d.key + "'></tr>");
    row.append("<td>" + d.code + "</td>").append("<td>" + d.name + "</td>")
        .append("<td>" + d.category + "</td>").append("<td>" + d.uom + "</td>")
        .append("<td>" + d.size + "</td>").append(
            "<td>" + d.description + "</td>").append(
            "<td>" + d.master_price + "</td>").append(
            "<td>" + d.retail_price + "</td>").append(btnH.join('')).appendTo(
            $('#assigned_product_frenchise'));
    $('#' + d.product_key).hide();
  }
  closeDialog('#assign-product-to-seller');
};

function assignProductToSeller(id) {
  var tds = $('#' + id).children();
  var reatilPrice = tds.eq(6).children()[0].value;
  if (!reatilPrice) {
    showMSG('Please enter price', 'warning');
    return;
  }
  $('#msg_text').html('Assign product to seller please wait...');
  openDialog('#assign-product-to-seller');
  var seller_key = $('#seller_key').val();
  var reqUrl = "/superadmin/AssignProductToSeller?product_key=" + id
      + "&seller_key=" + seller_key + "&reatilPrice=" + reatilPrice;
  getRequest('', reqUrl, 'assignProductToSellerCallBack');
};

function assignProductToSellerCallBack(obj, Fid) {
  var d = obj.data;
  btnH = [ '<td>  <button type="button" class="mr-5 mt-5 btn btn-info btn-minier" onclick="editFrncProduct(' ];
  btnH.push("'");
  btnH.push(d.key);
  btnH.push("'");
  btnH
      .push(')">Edit</button><button type="button" class="mr-5 mt-5 btn btn-info btn-minier" onclick="editDoneFrncProduct(');
  btnH.push("'");
  btnH.push(d.key);
  btnH.push("'");
  btnH
      .push(')" style="display: none;">Done</button><button type="mt-5 button" class="btn btn-danger btn-minier ml-5" onclick="removeFrncProduct(');
  btnH.push("'");
  btnH.push(d.key);
  btnH.push("'");
  btnH.push(')">Remove</button></td>');

  var row = $("<tr id='" + d.key + "'></tr>");
  row.append("<td>" + d.code + "</td>").append("<td>" + d.name + "</td>")
      .append("<td>" + d.category + "</td>").append("<td>" + d.uom + "</td>")
      .append("<td>" + d.size + "</td>").append(
          "<td>" + d.description + "</td>").append(
          "<td>" + d.master_price + "</td>").append(
          "<td>" + d.retail_price + "</td>").append(btnH.join('')).appendTo(
          $('#assigned_product_frenchise'));
  $('#' + d.product_key).remove();
  closeDialog('#assign-product-to-seller');
};

function editFrncProduct(id) {
  var tds = $('#' + id).children();
  var editTD = tds.eq(8);
  $(editTD.children()[0]).hide()
  $(editTD.children()[1]).show()
  price = tds.eq(7).html();
  input = '<input type="number" min="0.0" name="price" step=".50" value="'
      + price + '" class="input-retail-price">';
  tds.eq(7).html(input)
};

function editDoneFrncProduct(id) {
  var tds = $('#' + id).children();
  var reatilPrice = tds.eq(7).children()[0].value;
  if (!reatilPrice) {
    showMSG('Please enter price', 'warning');
    return;
  }
  tds.eq(7).html(reatilPrice);
  var editTD = tds.eq(8);
  $(editTD.children()[0]).show()
  $(editTD.children()[1]).hide()

};

function removeFrncProduct(id) {
  if (confirm('Remove this product from frenchise')) {
    $('#' + id).remove();
  }
};

function searchOrder() {
  var tr = [];
  dt1 = $('#start').val();
  dt2 = $('#end').val();
  dt = [ dt1, dt2 ]
  if (!dt1 || !dt2) {
    showMSG('Please enter daterage', 'warning');
    return;
  }
  $('#table_body').html(searchTableMsg);
  postRequest('super-admin-order--search-form', '/superadmin/OrderSearch',
      'searchOrderCallBack');
};

function searchOrderCallBack(r) {
  $('#table_body').html(r.data.html);
}

function imgSetupProduct(id) {
  $('#upload_product_pic_form')[0].reset();
  $('#product_key_upload_img').val(id);
  $('#product_key_upload_design').val(id);
  $('#product_key_input').val(id);
  var tds = $('#' + id).children();
  code = tds.eq(0).html();
  name = tds.eq(1).html();
  $('#prod_code').html(code);
  $('#prod_name').html(name);
  $('#image-setup').show();
  $('#list-dom, #add_btn, #upload_product_bg_form').hide();
  $('#product_img_list')
      .html(
          '<li class="text-center"><i class="fa fa-spinner fa-spin fa-2x"></i> Loading Pics...</li>');
  $('#product_design_img_list')
      .html(
          '<li class="text-center"><i class="fa fa-spinner fa-spin fa-2x"></i> Loading Design...</li>');
  getRequest('', '/superadmin/GetProductPics?key=' + id,
      'getProductImageCallBack')
};

function backImgSetupProduct() {
  $('#image-setup').hide();
  $('#list-dom, #add_btn').show();

}

function addImgTOProductList(t, src) {
  if (t == '2D') {
    h = '<li><img alt="150x150" src="' + src + '"></li>';
    $('#product_img_list').append(h);
    var p_key = $('#product_key_upload_img').val();
    if (p_key.length > 30) {
      console.log('uploading pic');
    }

  } else {
    i = $('#product_3d_img_list').children().length;
    id = 'pannellum_' + i;
    $('#product_3d_img_list').append(
        '<div id="' + id + '" class="panorama"></div>');
    setTimeout(function() {
      pannellum.viewer(id, {
        "type" : "equirectangular",
        /* "panorama" : "/super/assets/images/alma.jpg", */
        "panorama" : src,
        "autoLoad" : true,
      })
    }, 400);

  }
}

function uploadProductImage() {
  t = $('#pictype').val();
  fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) {
    $('#save_product_pic_spin').show();
    postFormWithFile("upload_product_pic_form",
        '/superadmin/UploadProductPicture', 'uploadProductImageCallBack');
  }
};

function uploadProductImageCallBack(r) {
  $('#save_product_pic_spin').hide();
  if (r.status == 'SUCCESS') {
    var h = '<li><img alt="150x150" src="' + r.data.serving_url + '"></li>'
    $('#product_img_list').append(h);
  }
};

function uploadProductDesign() {
  t = $('#pictype').val();
  fileObj = $('#design_file')[0];
  if (fileObj.files && fileObj.files[0]) {
    $('#save_product_design_spin').show();
    postFormWithFile("upload_product_design_form",
        '/superadmin/UploadProductDesign', 'uploadProductDisignCallBack');
  }
};

function uploadProductDisignCallBack(r) {
  $('#save_product_design_spin').hide();
  if (r.status == 'SUCCESS') {
    var h = '<li><img alt="150x150" src="' + r.data.serving_url
        + '"><div class="tags"><span class="label label-warning arrowed-in">'
        + r.data.title + '</span></div></li>'
    $('#product_design_img_list').append(h);
  }
};

function getProductImageCallBack(r) {
  var arr = r.data.img_list;
  if (arr.length == 0) {
    $('#product_img_list').html(
        '<li class="text-center">No Pics Available</li>');
  } else {
    var h = [];
    for (var i = 0; i < arr.length; i++) {
      h.push('<li id="'+ r.data.key+'_'+i);
      h.push('"><span class="btn btn-danger btn-minier cursor" onclick="deleteProductImg(');
      h.push("'");
      h.push(r.data.key);
      h.push("'");
      h.push(',');
      h.push("'");
      h.push(i);
      h.push("'");
      h.push(')">Delete</span><img alt="150x150" src="');
      h.push(arr[i]);
      h.push('"></li>');
    }

    $('#product_img_list').html(h.join(''));
  }


};

function deleteDesign(k){
  if(confirm('Delete this design?')){
    getRequest('', '/superadmin/DeleteDesign?k='+k, 'deleteDesignCallBack'); 
  }
};

function deleteDesignCallBack(r){
 if(r.status=='SUCCESS') $('#'+r.data.k).remove();
};


function editDesignSize(k, scaleX, scaleY, top, left) {
  openDialog('#editDesignSizeDailog');
 
  $('#design_key').val(k);
  $('#design_scallex').val(scaleX);
  $('#design_scalley').val(scaleY);
  $('#design_top').val(top);
  $('#design_left').val(left);
  
};

function editDesignSizePost(){
  $("#editDesignSize_spin").show();
  postRequest('editDesignSize_form','/superadmin/UpdateDesignSize','editDesignSizeCallBack');
};

function editDesignSizeCallBack(r){
  $("#editDesignSize_spin").hide();
  closeDialog('#editDesignSizeDailog');
};

function uploadProductBackground() { 
  fileObj = $('#bg_file')[0];
  if (fileObj.files && fileObj.files[0]) {
    $('#save_product_bg_spin').show();
    postFormWithFile("upload_product_bg_form",
        '/superadmin/UploadProductBG', 'uploadProductBackgroundCallBack');
  }
};

function uploadProductBackgroundCallBack(r) {
  $('#save_product_bg_spin').hide();
  if (r.status == 'SUCCESS') {
    $('#product_bg_img').html('<img alt="150x150" src="'+r.data.bg_uri+'">');
    $('#upload_product_bg_form').hide();
  }
};

function deleteImg(key){
  getRequest('', '/superadmin/DeleteProductBG?key='+key, 'deleteImgCB');
}

function deleteImgCB(r){
  $('#product_bg_img').html('No background image available');
  $('#upload_product_bg_form').show();
}

function saveOrderStage() {
  $('#save_spin').show();
  postRequest('action_form', '/superadmin/OrderStage', 'saveOrderStageCallBack');
};

function saveOrderStageCallBack(r) {
  $('#save_spin').hide();
  $('#tbla_footer').show();
  var h = [ '<tr><td><input type="number" min="1" name="index" value="' ];
  h.push(r.data.i);
  h.push(' title="');
  h.push(r.data.code);
  h.push('" class="order_stage_input" "></td><td>');
  h.push(r.data.code);
  h.push('</td></tr>');

  $('#order_stage_tbody').append(h.join(''));
};

function updateOrderStage() {
  var tbl = {}, stageCount = 0;

  /* $('#order_stage_tbody').html();
  $('#order_stage_tbody tr').map(function() {
    var x = $(this).find('td').map(function() {
      // return $(this).html();
      if (this.children.length)
        return this.children[0].value
      return this.innerText
    }).get()

    tbl[x[0]] = x[1];
    stageCount += 1;
  })*/

  var inputs = $(".order_stage_input"); 

  for(var i = 0; i < inputs.length; i++){
    var a = $(inputs[i]);  
    tbl[a[0].value] = a[0].title;
  }
  console.log(tbl);
  
  if ('' in tbl) {
    showMSG('index missing', 'warning');
    return;
  }

  if (inputs.length != Object.keys(tbl).length) {
    showMSG('index duplicate', 'warning');
    return;
  }

  $('#stage_order').val(JSON.stringify(tbl));
  postRequest('update_form', '/superadmin/OrderStageUpdate', null)
};

function downloadPic(elm) {
  var img = $(elm).siblings()[0];
  var src = img.src;
  src = src.split(';');
  src = src[0].split('/');
  src = src[1];
  var url = img.src.replace(/^data:image\/[^;]+/,
      'data:application/octet-stream');
  /* window.open('ilename=image.'+src+';'+url); */
  var hiddenElement = document.createElement('a');
  hiddenElement.href = url;
  hiddenElement.target = '_blank';
  hiddenElement.download = 'image.' + src;
  hiddenElement.click();
}

var orderApi = {};
var loadingPrintHtml = '<div class="text-center mt-20"><i class="fa fa-spinner fa-spin" ></i><br/>Loading order production print...</div>'

orderApi.backFromProductionPrint = function() {
  $('#main-container').show();
  $('#print-content').hide();

}

orderApi.gotoProductionPrint = function(key) {
  // openDialog('#productionPrintDailog');
  // $('#order-print-content').html(loadingPrintHtml);
  $('#main-container').hide();
  $('#print-content').show();
  $('#print-inner-content').html(loadingPrintHtml);

  getRequest('', '/superadmin/GerOrderProductPrint?key=' + key,
      'orderApi.renderProductionPrint');
};

orderApi.renderProductionPrint = function(r) {
  $('#print-inner-content').html(r.data.html);
  $('.tobehide').show();
};
orderApi.backToList = function() {
  $('#list-dom').show();
  $('#view-dom, #back_btn').hide();

}

orderApi.gotoViewMode = function(key) {
  $('#list-dom').hide();
  $('#view-dom, #back_btn').show();
  $('#view-dom')
      .html(
          '<div class="text-center mt-20"><i class="fa fa-spinner fa-spin" ></i><br/>Loading order details...</div>');
  getRequest('', '/superadmin/GerOrderDetails?key=' + key,
      'orderApi.gotoViewModeCallBack');
};

orderApi.gotoViewModeCallBack = function(r) {
  $('#view-dom').html(r.data.html);
}

orderApi.gotoEditStatus = function(key) {
  $('#order_key_stage').val(key);
  openDialog('#editOrderStatusDailog');
  var date = new Date(), hour = date.getHours(), min = date.getMinutes();
  hour = (hour < 10 ? "0" : "") + hour;

  var displayTime = hour + ":" + min;
  $('#status_time').val(displayTime);

};
orderApi.editOrderStatus = function() {

  /*if (!$('#status_date').val()) {
    showMSG('Date missing', 'warning');
    return;
  }

  if (!$('#status_time').val()) {
    showMSG('Time missing', 'warning');
    return;
  }*/

  postRequest('update_order_stage_form', '/superadmin/EditOrderStage',
      'orderApi.editOrderStatusCallBack');
}

orderApi.editOrderStatusCallBack = function(r) {
  var row = $('#' + r.data.key);
  row.find("td:eq(1)").text(r.data.stage);

};

function printFromHtml(data) {
  var mywindow = window.open('', 'my div', 'height=842,width=595');
  mywindow.document.write('<html><head><title>Invoice</title>');
  mywindow.document.write('<style>');
  mywindow.document.write(' a {text-decoration: none !important;}');
  mywindow.document
      .write(' .invoice-list {margin-bottom: 30px;} .col-lg-4 {width: 48%;}');
  mywindow.document
      .write(' .col-lg-12 {width: 100%;} .col-lg-4,.col-sm-4, .col-lg-12 {position: relative;min-height: 1px;padding-right: 15px;padding-left: 15px;} .pull-right {float: right!important;} .invoice-block {text-align: right;} ul {padding-left: 0;}');
  mywindow.document
      .write(' ul, ol {margin-top: 0;margin-bottom: 10px;} * {-webkit-box-sizing: border-box;-moz-box-sizing: border-box;box-sizing: border-box;}');
  mywindow.document
      .write(' table.table {clear: both;margin-bottom: 6px !important;max-width: none !important;} .table, th, td {border: 1px solid #000;}');
  mywindow.document
      .write(' .table {width: 100%;max-width: 100%;margin-bottom: 20px;} table {background-color: transparent;} table {border-spacing: 0;border-collapse: collapse;}');
  mywindow.document.write('</style>');
  mywindow.document.write('</head><body><div class="col-lg-12">');
  mywindow.document.write(data);
  mywindow.document.write('</div></body></html>');
  mywindow.document.close(); // necessary for IE >= 10
  mywindow.focus(); // necessary for IE >= 10
  mywindow.print();
  mywindow.close();
  return true;
}

function printWindow(selector, title) {
  var divContents = $(selector).html();
  var $cssLink = $('link');
  var printWindow = window.open('', '', 'height=' + window.outerHeight * 0.6
      + ', width=' + window.outerWidth * 0.6);
  printWindow.document.write('<html><head><h2><b><title>' + title
      + '</title></b></h2>');
  for (var i = 0; i < $cssLink.length; i++) {
    printWindow.document.write($cssLink[i].outerHTML);
  }
  printWindow.document.write('</head><body >');
  printWindow.document.write(divContents);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.onload = function() {
    printWindow.focus();
    setTimeout(function() {
      printWindow.print();
      printWindow.close();
    }, 100);
  }
}


var ThemesUploader = function(title, key) {
  this.title = title;
  this.key=key;
};

ThemesUploader.prototype.img1 = function() {
  var collum = 'img1';param = 'skyline';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img2 = function() {
  var collum='img2';param ='landmarks';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img3 = function() {
  var collum='img3';param='road1';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img4 = function() {
  var collum='img4'; param = 'road2';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img5 = function() {
  var collum='img5';param = 'taxi1';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img6 = function() {
  var collum = 'img6';param = 'local_train';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img7 = function() {
  var collum = 'img7'; param = 'bus1';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img8 = function() {
  var collum = 'img8'; param = 'bus2';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img9 = function() {
  var collum = 'img9'; param = 'car1';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};
ThemesUploader.prototype.img10 = function() {
  var collum = 'img10'; param = 'car2';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
  
};
ThemesUploader.prototype.img11 = function() {
  var collum = 'img11'; param = 'cycle';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
  
};
ThemesUploader.prototype.img12 = function() {
  var collum = 'img12'; param = 'truck';
  var url = '/superadmin/ThemesPicsUploading?collum='+collum+'&param='+param+'&key='+this.key;
  postFormWithFile('themes_form', url, null)
};

function liveTheme(r){
  showMSG('Theme is live', 'success'); 
}
 
function uploadEvent() {
 var t = $('#title').val();
 if(!t){
   showMSG('Title missing', 'warning');
   return;
 }
 var from_age = $('#from_age').val();
 var to_age = $('#to_age').val();
 var all_age = $('#all_age')[0].checked;
 if(!all_age){
   if(!from_age || !to_age){
     showMSG('Age missing', 'warning');
     return;
   }
 }
 
 if(from_age && to_age){
   from_age = parseInt(from_age)
   to_age = parseInt(to_age)
   if(to_age<from_age){
     showMSG('Age selection invalid', 'warning');
     return;
   }
 }
 
  fileObj = $('#pic')[0];
  if (fileObj.files && fileObj.files[0]) {
    $('#action_spin').show();
    postFormWithFile("events_form",
        '/superadmin/Events', 'uploadEventCallBack');
  } else {
    showMSG('Picture missing', 'warning');
    return;
  }
};

function uploadEventCallBack(r) {
  $('#action_spin').hide();
  if(r.status!='SUCCESS') return;
  var d = r.data;
  var r = ['<tr><td></td><td>'];
  r.push(d.title);
  r.push('</td><td>');
  r.push(d.description);
  r.push('</td><td></td><td><img src="');
  r.push(d.img_url);
  r.push('"></td></tr>');
  
  $('#t_body').append(r.join(''));
}

function showEventPic(input) {

  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function(e) {
      $('#event_pic_pre').html('<img src="'+ e.target.result +'">');
    }

    reader.readAsDataURL(input.files[0]);
  } else {
    $('#event_pic_pre').html('No image selected')
  }
}
 
function setEventSequence(){
  var selected = {};
  var count = 0;
  var err = true;
  $('input.sequence:checkbox:checked').each(function (a) {
    var id = this.name;
    
    console.log(this.name);
    selected[id] = parseInt($('#'+id).val());
    err = false;
    count += 1
  });

  if(err){
    showMSG('No event selected', 'warning'); return;
  }
  var msg = count +' events are selected for show in default to website. Are you sure?'
  if(!confirm(msg)){return}
  
  $('#seq_data').val(JSON.stringify(selected));
  
  postRequest('update_event_sequence', '/superadmin/EventSequenceSet', null);

};


function uploadPic() { 
  fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) {
    $('#save_product_pic_spin').show();
    postFormWithFile("upload_test", '/superadmin/UploadTest', 'TC');
  }
};

function TC(r){
  $('#save_product_pic_spin').hide();
  $('#test').append('<p>'+r.data.serving_url);
}

function showCatForm(){
  $('#add_cat_btn, #add_sub_cat_btn, #list-dom').hide();
  $('#bck-btn, #category-form-dom').show();
}

function showSubCatForm(){
  $('#add_cat_btn, #add_sub_cat_btn, #list-dom').hide();
  $('#bck-btn, #sub-category-form-dom').show();
}

function hideFormsDom(){
  $('#add_cat_btn, #add_sub_cat_btn, #list-dom').show();
  $('#bck-btn, #category-form-dom, #sub-category-form-dom, #upload-dom').hide();
  
}

function setDesignImgae(key, title){
  $('#add_cat_btn, #add_sub_cat_btn, #list-dom').hide();
  $('#bck-btn, #upload-dom').show();
  $('#design_title').html(title);
  $('#design_key').val(key);
}

function saveCategory(){
  var title = $('#title').val();
  if(!title){
    showMSG('Title', 'warning'); return;
  }
  
  
  postRequest('category_form', '/superadmin/DesignCategorySave', 'saveCategoryCB');
}

function saveCategoryCB(r, fid){
  tr = ['<tr><td>'];
  tr.push(r.data.title);
  tr.push('</td><td></td><td><button type="button" class="btn btn-info btn-minier" onclick="setDesignImgae(');
  tr.push("'");
  tr.push(r.data.key);
  tr.push("'");
  tr.push(', ');
  tr.push("'");
  tr.push(r.data.title);
  tr.push("'");
  tr.push(')">Set Images</button> </td></tr>');
  
  $('#category_table').prepend(tr.join(''));
  $('#selected_category').append($('<option>', {
    value : r.data.key
  }).text(r.data.title));
}

function saveSubCategory(){
  var title = $('#sub_title').val();
  var selected_category = $('#selected_category').val();
  if(!title){
    showMSG('Title', 'warning'); return;
  }
  if(!selected_category){
    showMSG('No category selected', 'warning'); return;
  }
  
  
  postRequest('sub_category_form', '/superadmin/DesignSubCategorySave', 'saveSubCategoryCB');
  
}


function saveSubCategoryCB(r, fid){
  tr = ['<tr><td>'];
  tr.push(r.data.title);
  tr.push('</td><td>');
  tr.push(r.data.category)
  tr.push('</td><td></td><td><button type="button" class="btn btn-info btn-minier" onclick="setDesignImgae(');
  tr.push("'");
  tr.push(r.data.key);
  tr.push("'");
  tr.push(', ');
  tr.push("'");
  tr.push(r.data.title);
  tr.push("'");
  tr.push(')">Set Images</button> </td></tr>');
  $('#sub_category_table').prepend(tr.join(''));
  
}

function UploadDesignImage() { 
  fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0] && $('#imgage_title').val()) { 
    postFormWithFile("upload_form", '/superadmin/UploadDesignImage', 'TC');
  }
};

function saveThemesCallBack(r){    
  var d = r.data;
  tr = ['<tr><td>'];
  tr.push(d.title);
  tr.push('</td><td>False</td><td><button class="btn btn-xs bigger btn-success" type="button" onclick="showTheme(');
  tr.push("'");
  tr.push(d.title);
  tr.push("'");
  tr.push(',');
  tr.push("'");
  tr.push(d.key);
  tr.push("'");
  tr.push(')">Show</button></td></tr>');
  $('#table_body').prepend(tr.join(''));
};

function showTheme(title, key){
  $('#selected_theme').val(key);
  var tr=['<h2>'+title+'</h2><hr><h4>skyline</h4>'];
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/skyline.png"><br><h4>landmarks</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/landmarks.png"><br><h4>local_train</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/local_train.png"><br><h4>bus1</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/bus1.png"><br><h4>bus2</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/bus2.png"><br><h4>car1</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/car1.png"><br><h4>car2</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/car2.png"><br><h4>cycle</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/cycle.png"><br><h4>taxi1</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/taxi1.png"><br><h4>truck</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/truck.png"><br><h4>road1</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/road1.png"><br><h4>road2</h4>');
  tr.push('<img src="/img/');
  tr.push(title);
  tr.push('/road2.png">'); 
  $('#theme_prev').html(tr.join(''));
  
  $('#form-dom, #bck-btn').show();
  $('#add_btn, #list-dom').hide();
  
}

function makeThemeLive(){
  getRequest('theme_live_form','/superadmin/SetupThemesLive', 'liveTheme')
}

function backUserList(){
  $('#list-dom, #add_btn, #role_btn').show();
  $('#bck-btn, #create-user-account-dom, #update-role-rights-dom').hide();
  
}

function gotoRoles(){
  $('#bck-btn, #update-role-rights-dom').show();
  $('#role_btn, #add_btn, #list-dom').hide();
  $('#update-role-rights_form')[0].reset();
}

function gotoUserCreate(){
  $('#bck-btn, #create-user-account-dom').show();
  $('#role_btn, #add_btn, #list-dom').hide();
  $('#create_user_account_form')[0].reset();
}

function createUserAccount(){

  var title = $('#user_name').val();
  var email = $('#email').val();
  if(!title){
    showMSG('Name', 'warning'); return;
  }
   
  if(!email){
    showMSG('Email', 'warning'); return;
  }
  $('#save_spin').show();
  postRequest('create_user_account_form', '/superadmin/UserAccount', 'createUserAccountCallBack');  
  
};

function createUserAccountCallBack(r){
  $('#save_spin').hide();
  
};

function updateRoleAccess(){
  r = $('#role_select').val();
  if(!r){
    showMSG('Select Role', 'warning'); return;
  }
  
  postRequest('update-role-rights_form', '/superadmin/UpdateRoleSettings?role='+r, null);  
}

function getRoleSettings(elm){ 
  $('#update-role-rights_form')[0].reset();
  if(!elm.value){ return;} 
  openDialog('#rolesettings');
  getRequest('', '/superadmin/GetRoleSettings?role='+elm.value, 'getRoleSettingsCallBack');
}
function getRoleSettingsCallBack(r){
  console.log(r.data.acl)
  l = r.data.acl.length-1; 
  closeDialog('#rolesettings');
  $('#selected input:checkbox').each(function(i) {
    if("1"==r.data.acl[l-i]){
      $(this).attr('checked', true);
    } else {
      $(this).attr('checked', false);
    }  
  });
  
}

function gotoRenameOrderSatus(index, status){
  openDialog('#editOrderStatusDailog');
  $('#order_index').val(index);
  $('#order_status').val(status);
}

function renameOrderStatus(){
  if(!$('#order_status').val()){ return;}
  postRequest('update_order_stage_form', '/superadmin/RenameOrderStatus', 'renameOrderStatusCB');
}

function renameOrderStatusCB(r){
  
  if(r.status=='SUCCESS'){
    var tr = ['<td>'];
    tr.push('<input type="number" min="1" name="index" value="');
    tr.push(r.data.index+1);
    tr.push('"></td><td>');
    tr.push(r.data.order_status);
    tr.push(' <button class="btn btn-xs bigger btn-yellow pull-right" type="button" onclick="gotoRenameOrderSatus(');
    tr.push(r.data.index);
    tr.push(',');
    tr.push("'");
    tr.push(r.data.order_status);
    tr.push("'");
    tr.push(');"><i class="ace-icon fa fa-pencil-square-o"></i></button></td>');
    $('#'+r.data.index).html(tr.join(''));  
    closeDialog('#editOrderStatusDailog');
    $('#tbla_footer').html('');
  }
  
}

function GetActionDom(reqUrl, title){
  
  $.ajax({
    url : reqUrl,
    method : 'GET',
    beforeSend : function(xhr) {
      var h = loadingHtml.replace('[TITLE]', title);
      $('#action_dom').html(h);
      $('#action_dom').show();
      $('#setup_main_menu').hide();
    },
    success : function(obj) {
      $('#action_dom').html(obj)
    },
    error : function(obj) {
      $('#action_dom').html(retryHtml);
    },
});
  
  
};

function backToDesignerSetup(){

  $('#action_dom').hide();
  $('#setup_main_menu').show();
  
}

function saveFrameCategory(){
  var title = $('#title').val();
  if(!title){
    showMSG('Title', 'warning'); return;
  }
  
  
  postRequest('category_form', '/superadmin/FrameCategorySave', 'saveBGCategoryCB');
}

function saveBGCategory(){
  var title = $('#title').val();
  if(!title){
    showMSG('Title', 'warning'); return;
  }
  
  
  postRequest('category_form', '/superadmin/BGCategorySave', 'saveBGCategoryCB');
}

function saveBGCategoryCB(r, fid){
  tr = ['<tr><td>'];
  tr.push(r.data.title);
  tr.push('</td><td></td><td><button type="button" class="btn btn-info btn-minier" onclick="setDesignImgae(');
  tr.push("'");
  tr.push(r.data.key);
  tr.push("'");
  tr.push(', ');
  tr.push("'");
  tr.push(r.data.title);
  tr.push("'");
  tr.push(')">Set Images</button> </td></tr>');
  
  $('#category_table').prepend(tr.join(''));
  $('#selected_category').append($('<option>', {
    value : r.data.key
  }).text(r.data.title));
}

function saveFrameSubCategory(){
  var title = $('#sub_title').val();
  var selected_category = $('#selected_category').val();
  if(!title){
    showMSG('Title', 'warning'); return;
  }
  if(!selected_category){
    showMSG('No category selected', 'warning'); return;
  }
  
  
  postRequest('sub_category_form', '/superadmin/FrameSubCategorySave', 'saveBGSubCategoryCB');
  
}

function saveBGSubCategory(){
  var title = $('#sub_title').val();
  var selected_category = $('#selected_category').val();
  if(!title){
    showMSG('Title', 'warning'); return;
  }
  if(!selected_category){
    showMSG('No category selected', 'warning'); return;
  }
  
  
  postRequest('sub_category_form', '/superadmin/BGSubCategorySave', 'saveBGSubCategoryCB');
  
}


function saveBGSubCategoryCB(r, fid){
  tr = ['<tr><td>'];
  tr.push(r.data.title);
  tr.push('</td><td>');
  tr.push(r.data.category)
  tr.push('</td><td></td><td><button type="button" class="btn btn-info btn-minier" onclick="setDesignImgae(');
  tr.push("'");
  tr.push(r.data.key);
  tr.push("'");
  tr.push(', ');
  tr.push("'");
  tr.push(r.data.title);
  tr.push("'");
  tr.push(')">Set Images</button> </td></tr>');
  $('#sub_category_table').prepend(tr.join(''));
  
}

function UploadBGImage() { 
  fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0] && $('#imgage_title').val()) { 
    postFormWithFile("upload_form", '/superadmin/UploadBGImage', 'TC');
  }
};

function UploadFrameImage() { 
  fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0] && $('#imgage_title').val()) { 
    postFormWithFile("upload_form", '/superadmin/UploadFrameImage', 'TC');
  }
};

function UploadPattern() { 
  fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) { 
    postFormWithFile("text_pattern_form", '/superadmin/UploadPattern', 'UploadPatternCB');
  }
};

function UploadPatternCB(r){
  if(r.status=='SUCCESS'){
    $('#pattern_row').prepend('<tr><td><img width="60px" src="'+r.data.serving_url+'" height="60px"></td></tr>');
  }
};

function UploadMasks() { 
  fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) { 
    postFormWithFile("masks_form", '/superadmin/UploadMasks', 'UploadMasksCB');
  }
};

function UploadMasksCB(r){
  if(r.status=='SUCCESS'){
    $('#pattern_row').prepend('<td><img width="90px" src="'+r.data.serving_url+'" height="90px"></td>');
  }
};

function halfMargin(a, id){
  $(id).val(a/2);
}

function UploadProductCanvas(){

  var p = $('#selected_product').val();
  if(!p){
    showMSG('No Product selected', 'warning'); return;
  }
  
  fileObj = $('#canvas_imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) { 
    postFormWithFile("product_canvas_form", '/superadmin/UploadProductCanvas?p='+p, 'UploadProductCanvasCB');
  }
}

function UploadProductCanvasCB(r){
  var dom = $('#preview_dom');
  if(r.data.img_url){
    $('#product_canvas_form').hide();
    dom.append('<h5>Canvas</h5><img src="'+r.data.img_url+'"><br>');
  }
}
function UploadProductPreviewCB(r){
  var dom = $('#preview_dom');
  if(r.data.preview_url){
    $('#product_preview_form').hide();
    dom.append('<h5>Preview</h5><img src="'+r.data.preview_url+'"><br>');
  }
}
function UploadProductPreview(){
  var p = $('#selected_product').val();
  if(!p){
    showMSG('No Product selected', 'warning'); return;
  }
  
  fileObj = $('#preview_imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) { 
    postFormWithFile("product_preview_form", '/superadmin/UploadProductPreview?p='+p, 'UploadProductPreviewCB');
  }
}

function getProductCanvasPrev(elm){
  if(!elm.value){  $('#preview_dom').html('');return; }  
  $('#preview_dom').html('<i class="fa fa-spinner fa-spin" ></i> Loading product canvas and preveiw...');
  
  getRequest('', '/superadmin/GetProductCanvasPrev?k='+elm.value, 'getProductCanvasPrevCB');
};
function getProductCanvasPrevCB(r){
  var dom = $('#preview_dom');
  dom.html('');
  if(r.data.img_url){
    $('#product_canvas_form').hide();
    var h =['<div id="canvas_img_dom"><h5>Canvas</h5><p class="cursor" onclick="editCanvasMargin('];
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(',');
    h.push(r.data.top);
    h.push(',');
    h.push(r.data.left);
    h.push(',');
    h.push(r.data.stage_height);
    h.push(',');
    h.push(r.data.stage_width);
    h.push(')">Change Canvas Margin Top-Left and Height</p><br><img height="100px" src="');
    h.push(r.data.img_url);
    h.push('"><button type="button" class="btn btn-danger btn-minier"onclick="deleteCanvasImg(');
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(',');
    h.push("'");
    h.push(r.data.bucket_key);
    h.push("'");
    h.push(')">Delete</button><br></div>');
    dom.append(h.join(''));
  } else{
    $('#product_canvas_form').show();
  }
  if(r.data.preview_url){
    $('#product_preview_form').hide();
    
    var h =['<div id="canvas_prev_dom"><h5>Preview</h5><p class="cursor" onclick="editPreviewMargin('];
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(',');
    h.push(r.data.preview_top);
    h.push(',');
    h.push(r.data.preview_left);
    h.push(',');
    h.push(r.data.preview_width);
    h.push(')">Change Preview Margin Top-Left</p><br><img height="100px" src="');
    h.push(r.data.preview_url);
    h.push('"><button type="button" class="btn btn-danger btn-minier"onclick="deleteCanvasPrevImg(');
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(',');
    h.push("'");
    h.push(r.data.preview_key);
    h.push("'");
    h.push(')">Delete</button><br></div>');
    dom.append(h.join(''));
  } else{
    $('#product_preview_form').show();
  }
  
};

function getDesignOFCategory(elm){
  
  $('#selected input:checkbox').each(function(i) {
      $(this).attr('checked', false);
  });
  if(!elm.value) {return;}
  $('#selected').hide();
  getRequest('', '/superadmin/GetMappingCustomDesign?cat='+elm.value, 'getDesignOFCategoryCB');  
};

function getDesignOFCategoryCB(r){
  $('#selected').show();
  for(i in r.data.mapping_list){
    $('#'+r.data.mapping_list[i]).prop('checked', true);
  }
};

function getFramesForCategory(elm){
  
  $('#selected input:checkbox').each(function(i) {
      $(this).attr('checked', false);
  });
  if(!elm.value) {return;}
  
  $('#selected').hide();
  getRequest('', '/superadmin/GetMappingFrame?cat='+elm.value, 'getBGOFCategoryCB');
};

function getBGOFCategory(elm){
  
  $('#selected input:checkbox').each(function(i) {
      $(this).attr('checked', false);
  });
  if(!elm.value) {return;}
  
  $('#selected').hide();
  getRequest('', '/superadmin/GetMappingBackground?cat='+elm.value, 'getBGOFCategoryCB');
};

function getBGOFCategoryCB(r){
  for(i in r.data.mapping_list){
    $('#'+r.data.mapping_list[i]).prop('checked', true);
  }
  $('#selected').show();
};

function saveDesignMappingCategory(){
  var cat = $('#selected_category').val();
  if(!cat){
    showMSG('No Category selected', 'warning'); return;
  }
  $('#mapping_form')[0].reset();
  $('#category_hidden').val(cat);
  var designArr=[];
  $('#selected input:checkbox:checked').each(function(i) {
    designArr.push(this.id);
  });
  
  $('#data_hidden').val(JSON.stringify(designArr));
  
  postRequest('mapping_form', '/superadmin/MappingCustomDesign', null);
};


function saveBGMappingCategory(){
  var cat = $('#selected_category').val();
  if(!cat){
    showMSG('No Category selected', 'warning'); return;
  }
  $('#mapping_form')[0].reset();
  $('#category_hidden').val(cat);
  var designArr=[];
  $('#selected input:checkbox:checked').each(function(i) {
    designArr.push(this.id);
  });
  
  $('#data_hidden').val(JSON.stringify(designArr));
  
  postRequest('mapping_form', '/superadmin/MappingBackground', null);
};

function saveFrameMappingCategory(){
  var cat = $('#selected_category').val();
  if(!cat){
    showMSG('No Category selected', 'warning'); return;
  }
  $('#mapping_form')[0].reset();
  $('#category_hidden').val(cat);
  var designArr=[];
  $('#selected input:checkbox:checked').each(function(i) {
    designArr.push(this.id);
  });
  
  $('#data_hidden').val(JSON.stringify(designArr));
  
  postRequest('mapping_form', '/superadmin/MappingFrame', null);
};

function editCanvasMargin(k , t, l, stage_height, stage_width){
  openDialog('#changeCanvasMargin');
  $('#product_key').val(k);
  $('#edit_top').val(t);
  $('#edit_left').val(l);
  $('#stage_height').val(stage_height);
  $('#stage_width').val(stage_width);
  
}

function updateCanvasMargin(){
  postRequest('update_canvas_margin_form', '/superadmin/ChangeCanvasMargin', 'updateCanvasMarginCB');
}
function updateCanvasMarginCB(r){
  closeDialog('#changeCanvasMargin');
}

function editPreviewMargin(k , t, l, w){
  openDialog('#changePreviewMargin');
  $('#preview_key').val(k);
  $('#edit_preview_top').val(t);
  $('#edit_preview_left').val(l);
  $('#edit_preview_width').val(w);
}

function updatePreviewMargin(){
  postRequest('update_Preview_margin_form', '/superadmin/ChangePreviewMargin', 'updatePreviewMarginCB');
}
function updatePreviewMarginCB(r){
  closeDialog('#changePreviewMargin');
}

function seeDesignerDemo(){
  var k = $('#selected_product').val();
  if(!k){
    showMSG('No product selected', 'warning'); return;
  }
  
  window.open('/DesinerDemo?product='+k);
  
}

function liveProducts(){
  var selected = [];
  $('#product_live input:checkbox:checked').each(function (a) {
    selected.push( this.name );
  });  

  $('#selected_product').val(JSON.stringify(selected));
  
  postRequest('product_live_form', '/superadmin/ProductLiveSetting', null);
}

function  liveProductSettingCB(r){
  showMSG('Setting updated', 'info'); return;
}
function getLiveProductCB(r){
  $('#product_key').val(r.data.k)
  $('#promo_text').val(r.data.promo_text)
  $('#sequence_number').val(r.data.promo_sequence) 
  if(r.data.promo_img){
    $('#imgage_file_prev').show();
    $('#imgage_file_dom').hide();
    var h = ['<button type="button" class="btn btn-danger btn-minier"onclick="deletePromoImg('];
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(',');
    h.push("'");
    h.push(r.data.promo_buckt_key);
    h.push("'");
    h.push(')" class="cursor">Delete Promo Image</button><br><img src="');
    h.push(r.data.promo_img);
    h.push('">'); 
    $('#imgage_file_prev').html(h.join(''));
  } else{
    $('#imgage_file_prev').html('');
    $('#imgage_file_dom').show();
  }
  if(r.data.promo_product_bg_img){
    $('#bg_prev').show();
    $('#bg_file_dom').hide();
    var h = ['<button type="button" class="btn btn-danger btn-minier"onclick="deletePromoBGImg('];
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(',');
    h.push("'");
    h.push(r.data.promo_product_bg_key);
    h.push("'");
    h.push(')" class="cursor">Delete Background Picture</button><br><img src="');
    h.push(r.data.promo_product_bg_img);
    h.push('">'); 
    $('#bg_prev').html(h.join(''));
  } else{
    $('#bg_prev').html('');
    $('#bg_file_dom').show();
  }
};

function deletePromoImg(k, bk){
  var uri = '/DeleteBucketFile?k='+k+'&bucket_key='+bk+'&selection=PRODUCTPROMO'
  getRequest('',uri, 'deletePromoImgCB');
};

function deletePromoImgCB(r){
  if(r.status=='SUCCESS'){
    $('#imgage_file_prev').html('');
    $('#imgage_file_dom').show();
  }  
};

function deletePromoBGImg(k, bk){
  var uri = '/DeleteBucketFile?k='+k+'&bucket_key='+bk+'&selection=PRODUCTPROMOBG'
  getRequest('',uri, 'deletePromoBGImgCB');
};

function deletePromoBGImgCB(r){
  if(r.status=='SUCCESS'){
    $('#bg_prev').html('');
    $('#bg_file_dom').show();
  }  
};

function deleteCanvasImg(k,bk){
  var uri = '/DeleteBucketFile?k='+k+'&bucket_key='+bk+'&selection=CANVASIMG'
  getRequest('',uri, 'deleteCanvasImgCB');
}
function deleteCanvasPrevImg(k,bk){
  var uri = '/DeleteBucketFile?k='+k+'&bucket_key='+bk+'&selection=CANVASPREV'
  getRequest('',uri, 'deleteCanvasPrevImgCB');
}
function deleteCanvasImgCB(r) {
  if(r.status=='SUCCESS'){
    $('#product_canvas_form').show();
    $('#canvas_img_dom').remove();
  }
};

function deleteCanvasPrevImgCB(r) {
  if(r.status=='SUCCESS'){
    $('#product_preview_form').show();
    $('#canvas_prev_dom').remove();
  }
};

function createNewProductForm(){
  showFormDom(); 
  $('#product_form')[0].reset();
}

function getProductEdit(k){
  showFormDom();
  $('#loading_product_to_edit').show();
  $('#product_form')[0].reset();
  $('#product_form').hide();
  getRequest('', '/superadmin/EditProducts?k='+k, 'getProductEditCB');
};

function getProductEditCB(r){
  var d = r.data;
  $('#loading_product_to_edit').hide();
  $('#product_form').show();
  $('#product_key').val(d.product_key);
  $('#code').val(d.code);
  $('#name').val(d.name);
  $('#size').val(d.size);
  $('#price').val(d.price);
  $('#description').val(d.description);
  $('#category').val(d.category);
  $('#uom').val(d.uom);
  $('#custom_lable').val(d.custom_lable);
  
  //selecting multiselect
  opts = $('#event > option');
  for (index = 0; index < opts.length; index++) {
    opt = opts[index];
    if (d.event_urlsafe.indexOf(opt.value) >= 0) {
      $(opt).prop('selected', true);
    } else {
      $(opt).prop('selected', false);
    }
  }   
  if(d.status){
    $('#stauts').val('true')
  } else{
    $('#stauts').val('');
  }
  
  $('#loading_product_to_edit, #save_btn').hide();
  $('#product_form, #edit_btn').show();
};

function editProduct() {
  if (!$('#name').val()) {
    showMSG('Please enter name of product', 'warning');
    return;
  }
  if (!$('#price').val() || $('#price').val() == '0.0') {
    showMSG('Please enter price of product', 'warning');
    return;
  }
  if (!$('#category').val()) {
    showMSG('Please enter category of product', 'warning');
    return;
  }

  $('#edit_product_spin').show();
  postRequest('product_form', '/superadmin/EditProducts', 'editProductCB')
};

function editProductCB(obj) {
  $('#edit_product_spin').hide(); 
  var tr = [ "<td>" ];
  tr.push(obj.data.code);
  tr.push('</td><td>');
  tr.push(obj.data.name);
  tr.push('</td><td>');
  tr.push(obj.data.category);
  tr.push('</td><td>');
  tr.push(obj.data.uom);
  tr.push('</td><td>');
  tr.push(obj.data.price);
  tr.push('</td><td>');
  tr.push(obj.data.size);
  tr.push('</td><td>');
  tr.push(obj.data.description);
  tr.push('</td><td><div class="widget-toolbar no-border"> <button class="btn btn-xs bigger btn-yellow dropdown-toggle" data-toggle="dropdown"');
  tr.push(' aria-expanded="false"><i class="ace-icon fa fa-cog"></i></button><ul ');
  tr.push(' class="dropdown-menu dropdown-yellow dropdown-menu-right dropdown-caret dropdown-close">');
  tr.push('<li><a href="javascript:imgSetupProduct(');
  tr.push("'");
  tr.push(obj.data.key);
  tr.push("'");
  tr.push(')">Setup Images</a></li><li><a href="javascript:getProductEdit(');
  tr.push("'");
  tr.push(obj.data.key);
  tr.push("'");
  tr.push(')">Edit</a></li></ul> </div></td> </tr>');
  $('#'+obj.data.key).html(tr.join(''));
  if(obj.data.status){
    $('#'+obj.data.key).removeClass('False');
  } else {
    $('#'+obj.data.key).addClass('False');
  }
  
}

function deleteDesignerImg(k,bk, bp){
  var uri = '/DeleteBucketFile?k='+k+'&bucket_key='+bk+'&selection=DESINGERUPLOAD&bucket_path='+bp;
  getRequest('',uri, 'deleteDesignerImgCB');
}
function deleteDesignerImgCB(r) {
  if(r.status=="SUCCESS"){
    $('#img_box_'+r.data.i).remove();
  }
}

function showDesignerImgae(k){
  openDialog('#designerImagesDailog');
  $('#result_dom').html('<h4>Please wait...');
  getRequest('','/superadmin/GetDesignerImgaes?k='+k,'showDesignerImgaeCB');
}
function showDesignerImgaeCB(r){
  var h = [];
  for(var i=0; i<r.data.img_url.length; i++){
    h.push('<div class="design-img-box" id="img_box_');
    h.push(i);
    h.push('"> <img src="');
    h.push(r.data.img_url[i]);
    h.push('"><br><button class="btn btn-danger btn-minier" onclick="deleteDesignerImg(');
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(',');
    h.push("'");
    h.push(r.data.bucket_key[i]);
    h.push("'");
    h.push(',');
    h.push("'");
    h.push(r.data.bucket_path[i]);
    h.push("'");
    h.push(')">Delete</button> </div>');
    
  }
  
  $('#result_dom').html(h.join(''));
}

function deleteCategory(k, entity){
  postRequest('','/superadmin/DeleteCategory?k='+k+'&entity='+entity,'deleteCategoryCB')
}

function deleteSubCategory(k){
  postRequest('','/superadmin/DeleteSUBCategory?k='+k,'deleteCategoryCB')
}
function deleteCategoryCB(r){
  if(r.status=="SUCCESS"){
    $('#'+r.data.k).remove();
  }
}

function getDesignerModule(k){
  $('#update_designer_module_btn').hide();
  if(!k){
    return;
  }  
  getRequest('design_module_access_form', '/superadmin/DesignerModuleSetup', 'getDesignerModuleCB');
  
}

function getDesignerModuleCB(r){
  $('#module_selection input:checkbox').each(function(i) {
    if(r.data.designer_module.indexOf(this.name) > -1){
      $(this).attr('checked', true);
    } else {
      $(this).attr('checked', false);
    } 
  });
  $('#update_designer_module_btn').show();
}

function setDesignerModule(){
  if(!$('#modules_selected_product').val()){
    return;
  }
  
  postRequest('design_module_access_form', '/superadmin/DesignerModuleSetup', null);
};

function AllowDesignerOffLogin(){
  var allow = '';
  if($('#AllowDesignerOffLogin').is(":checked")){
    allow='Yes'
  }  
  getRequest('', '/superadmin/DesignerLoginAccess?allow='+allow, null)
};

function uploadMailImage() {
  var fileObj = $('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) { 
    postFormWithFile("upload_form",
        '/superadmin/MailTemplates', 'uploadMailImageCB');
  }
};

function uploadMailImageCB(r){
  if(r.data.serving_url){
    var h = '<div class="col-lg-12"><img alt="" src="'+
    r.data.serving_url +'" style="width: 100%;" onclick="setUrlToEmailTemp(this.src)"></div>'
    $('#mail_uploads').prepend(h);
  }
};

function setUrlToEmailTemp(url){
  $('#url_val').val(url);
  showMSG('Image selected', 'info');
};


function tagChanges(v){ 
  if (v=='img_lg'||v=='img_sm'){
    $('#url_dom').show();
    $('#text_dom').hide();
    $('#fc_dom').hide();
    $('#fs_dom').hide();
  } else if(v=='link'){
    $('#url_dom').show();
    $('#fc_dom').show();
    $('#text_dom').show();
    $('#fs_dom').show();
  }else {
    $('#url_dom').hide();
    $('#fc_dom').show();
    $('#text_dom').show();
    $('#fs_dom').show();
  } 
};

function insertToTemplate() {
  var type = $('#choose_tag').val(), link = $('#url_val').val(), text = $(
      '#para_val').val(), fs = $('#font_size').val(), fc = $('#font_color')
      .val(), bold=$('#font_weight')[0].checked;

  var h = [];
  if((type=='img_lg'||type=='img_sm') && !link){
    return;
  }
  if(type=='link' && !link){
    return;
  }
  if(type=='h'){
    h.push('<div class="drag-vertical">');
    h.push('<span data-tag="h" data-color="'+fc+'" class="pull-left" style="width: 98%;color: '+fc+';font-size: 28px;">');
    h.push(text);
    h.push('</span>');
  } else if(type=='subh'){ 
    h.push('<div class="drag-vertical">');
    h.push('<span data-tag="subh" data-color="'+fc+'" class="pull-left" style="width: 98%;color:'+fc+';font-size: 18px;" >');
    h.push(text);
    h.push('</span>');
  }else if(type=='para'){
    h.push('<div class="drag-vertical">');
    h.push('<span data-tag="para" class="pull-left" style="width: 98%;color:'+fc+';font-size: '+fs+'px;"  data-color="'+fc+'" data-bold="'+bold+'">');
    h.push(text);
    h.push('</span>');
  }else if(type=='custom'){
    h.push('<div class="drag-vertical">');
    h.push('<span data-tag="custom" class="pull-left" style="width: 98%;color:'+fc+';font-size: '+fs+'px;" data-color="'+fc+'" data-bold="'+bold+'">');
    h.push(text);
    h.push('</span>'); 
  }else if(type=='link'){
    h.push('<div class="drag-vertical">');
    h.push('<a data-tag="link" data-color="'+fc+'" data-font="'+fs+'" data-link="'+link+'" class="pull-left" style="width: 98%;color: '+fc+'; text-decoration: none; background-color: transparent;" >');
    h.push(text);
    h.push('</a>');
  }else if(type=='img_lg'){
    h.push('<div class="drag-vertical">');
    h.push('<img data-tag="img_lg" style="width:100%" src="'); 
    h.push(link);  
    h.push('" data-url="'); 
    h.push(link);
    h.push('">'); 
  }else if(type=='img_sm'){
    h.push('<div class="drag-vertical pull-left" style="width:30%;margin-left: 2%;">');
    h.push('<img data-tag="img_sm" style="width:100%;" src="'); 
    h.push(link); 
    h.push('" data-url="'); 
    h.push(link); 
    h.push('">'); 
  }
  h.push('<i class="ace-icon fa fa-times class="pull-right"></i></div>');
  $('#output_dom').append(h.join(''));
      
      
  //$( ".drag-vertical" ).draggable({ axis: "y" });  
  $("i.fa-times").on('click', function(e) {
    $(this).closest('div.drag-vertical').remove();
  });

  $('#save_email_template_btn').hide();
};

function previewTemplate() {
  var dom = $('#output_dom').find('.drag-vertical');
  if(dom.length==0) return;

  var bg = $('#bg_img').val(),
  hdr = $('#header_img').val(),
  pt = $('#padding_top').val(),
  pb = $('#padding_bottom').val();
  if(!hdr){
    alert('Header Image missing');
    return
  }
  if(!bg){
    alert('Content Backgroung Image missing');
    return
  }
  var template = '';
  for(var i=0; i<dom.length; i++){
    var elem = dom[i].children[0];
    console.log(elem.dataset);
    if(elem.dataset.tag=='h'){
      var fc='color: '+elem.dataset.color+';',
      h1 = H1.replace('[COLOR]',fc);
      template=template+h1+elem.innerText+H2+oneLine;
    } else if (elem.dataset.tag=='link'){ 
      l1 = link1.replace('[LINK]', elem.dataset.link);
      l1 = l1.replace('[LINK]', elem.dataset.link);
      l1 = l1.replace('[FONTSIZE]', elem.dataset.font);
      l1 = l1.replace('[COLOR]', elem.dataset.color);
      l1 = l1.replace('[TEXT]', elem.innerText);
      template=template+l1+oneLine;
    } else if (elem.dataset.tag=='img_lg'){
      template=template+imgLG+elem.dataset.url+imgLG2+oneLine;
    } else if (elem.dataset.tag=='custom'){
      var fcs='color: '+elem.dataset.color+';font-size: '+elem.style.fontSize+';text-align:center;';
      if(elem.dataset.bold){
        fcs = fcs+'font-weight:bold;'
      }
      var h = TEXTHTML.replace('[FONTSIZECOLOR]', fcs);
      template=template+h+elem.innerText+TEXTHTML2+oneLine;
    } else if (elem.dataset.tag=='subh'){
      var fsc='color: '+elem.dataset.color+';font-size: 18px;text-align:center;'
      var h = TEXTHTML.replace('[FONTSIZECOLOR]', fsc);
      template=template+h+elem.innerText+TEXTHTML2+oneLine;
      
    } else if (elem.dataset.tag=='para'){
      var fcs='color: '+elem.dataset.color+';font-size: '+elem.style.fontSize+';';
      if(elem.dataset.bold){
        fcs = fcs+'font-weight:bold;'
      }
      var h = TEXTHTML.replace('[FONTSIZECOLOR]', fcs);
      template=template+h+elem.innerText+TEXTHTML2+oneLine;
    }
  }
  var a1 = ['<div style="background: url(']
  a1.push("'")
  a1.push(bg)
  a1.push("'")
  a1.push(') 0 0 no-repeat / cover; width: 600px;padding-top:'+pt+'px;padding-bottom:'+pb+'px;">');
  var template_upper = $('#template_upper').html();
  template_upper = template_upper.replace('[HEADERIMG]', hdr);
  template_upper = template_upper.replace('[CONTENTREPLACE]', a1.join('')+template+'</div>');
  var newWindow = window.open();
  newWindow.document.write(template_upper)
  $('#template_html').val(template_upper);
  $('#codeline_html').val($('#output_dom').html());
  $('#input_padding_bottom').val($('#padding_bottom').val());
  $('#input_padding_top').val($('#padding_top').val());
  $('#input_bg_img').val($('#bg_img').val());
  $('#input_header_img').val($('#header_img').val());
  $('#input_subject').val($('#subject').val());
  
  $('#save_email_template_btn').show();
};

function saveTemplate(){
  postRequest('save_mail_template_form', '/superadmin/GetMailTemplates', 'saveTemplateCB');
}

function saveTemplateCB(r){
  $('#template_key').val(r.data.key);
}
function getMailTemplate(t){
  $('#output_dom').html('');
  $('#insrt_email_template_btn, #prev_email_template_btn, #save_email_template_btn').hide();
  if(!t) return;
  $('#output_dom').html('Please wait template loading...');
  getRequest('', '/superadmin/GetMailTemplates?t='+t, 'getMailTemplateCB')
}

function getMailTemplateCB(r){
  $('#output_dom').html('');
  $('#template_type').val(r.data.template_type);
  $('#insrt_email_template_btn').show();
  $('#prev_email_template_btn').show();
  $('#bg_img').val(r.data.bg_img);
  $('#header_img').val(r.data.header_img);
  $('#padding_top').val(r.data.padding_top);
  $('#padding_bottom').val(r.data.padding_bottom);
  $('#subject').val(r.data.subject);
  $('#input_subject').val(r.data.subject);
  if(r.data.key){
    $('#template_key').val(r.data.key);
    $('#template_html').val(r.data.template);
    $('#codeline_html').val(r.data.codeline_html);
    $('#output_dom').html(r.data.codeline_html);
  } else {
    $('#template_key').val('');
    $('#template_html').val('');
    $('#codeline_html').val('');
  }
  $("i.fa-times").on('click', function(e) {
    $(this).closest('div.drag-vertical').remove();
  });
  
}

function saveReadyDesign() {
  postRequest('ready_design_setup_form', '/superadmin/ReadyDesingSetup', null);
} 

function activeSuperAdminUser(k){
    getRequest('', '/superadmin/ManageUserStatus?k='+k+'&status=true', 'deactiveSuperAdminUserCB');
}

function deactiveSuperAdminUser(k){
  if(confirm('Suspend user account?')){
    getRequest('', '/superadmin/ManageUserStatus?k='+k, 'deactiveSuperAdminUserCB')
  }
}

function deactiveSuperAdminUserCB(r){
  if(r.data.status){
    h = ['<button class="btn btn-danger btn-minier pull-right" type="button" onclick="deactiveSuperAdminUser('];
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(')">Suspend</button>');
  } else{
    h = ['<button class="btn btn-success btn-minier pull-right" type="button" onclick="activeSuperAdminUser('];
    h.push("'");
    h.push(r.data.k);
    h.push("'");
    h.push(')">Activate</button>'); 
  }
  $('#'+r.data.k+'_status').html(h.join(''));
  
}

function deleteProductImg(k,i){
  if(confirm('Delete product image?')){
    getRequest('','/superadmin/DeleteProductIMG?k='+k+'&i='+i,'deleteProductImgCB')
  }
}
function deleteProductImgCB(r){
  $('#'+r.data.k+'_'+r.data.i).remove();
}

function searchProduct(){
  $('#search_product_spin').show();
  getRequest('product-search-form', '/superadmin/SearchProducts', 'searchProductCallBack');
}

function searchProductCallBack(r) {
  $('#product_search_result_dom').html(r);
  $('#search_product_spin').hide();
  $('#product_dynamic_table').DataTable();
}

function showCAtUOMEdit(k,n){
  $('#edit_cat_uom_key').val(k);
  $('#e_name').val(n);
  
  openDialog('#editCatUOMDailog');
}

function editNameCATUOM(){
  $('#edit_cat_uom_spin').show();
  postRequest('edit_cat_uom_form', '/superadmin/EditProductsCATUOM',
  'editNameCATUOMCB')  
}
function editNameCATUOMCB(r){
  $('#edit_cat_uom_spin').hide();
  closeDialog('#editCatUOMDailog');
  $('#'+r.data.k).remove();
}

function showRenameDesignModuleCat(k, n) {
  $('#rename_design_cat_key').val(k);
  $('#e_name').val(n);
  openDialog('#renameEnitity');
};

function renameDesignModuleCat() {
  if(!$('#e_name')) return;
  $('#renm_design_module_cat_name_spin').show();
  postRequest('rename_design_module_cat_form', '/superadmin/CatSubCatRename', 'renameDesignModuleCatCB')
  
};

function renameDesignModuleCatCB(r) {
  $('#renm_design_module_cat_name_spin').hide();
  closeDialog('#renameEnitity');
  $('#'+r.data.k).find("td:eq(0)").html(r.data.name);
};


function getProductTutorial(k, p){
  $('#productTutorialDailog_header').html(p);
  $('#product_tutorial_loading').show();
  $('#productTutorialDailog_form').hide();
  openDialog('#productTutorialDailog');
  getRequest('', '/superadmin/ProductTutorialObj?k='+k, 'getProductTutorialCB');
};

function getProductTutorialCB(r){
  $('#productTutorial_key').val(r.data.k);
  $('#video_link').val(r.data.video_link); 
  $('#video_prev').html(r.data.video_link);
  if(r.data.pdf_bucket_path){
    $('#pdf_input_file_dom').hide();
    var h = ['<div class="col-sm-12 text-center"><i class="fa fa-file-pdf-o fa-3x cursor" onclick="downloadBucketFile('];
    h.push("'")  
    h.push(r.data.pdf_bucket_path)  
    h.push("'")  
    h.push(')"> Download pdf</i><br><button type="button" class="btn btn-danger btn-minier mt-10" onclick="deleteTutorialPdf(')
    h.push("'")
    h.push(r.data.k)
    h.push("'")
    h.push(',')
    h.push("'")
    h.push(r.data.pdf_bucket_key)
    h.push("'")
    h.push(')">Delete</button></div>')
    $('#pdf_preview_dom').show().html(h.join(''));
    
  } else {
    $('#pdf_input_file_dom').show();
    $('#pdf_preview_dom').hide().html('');
  }
  $('#product_tutorial_loading').hide();
  $('#productTutorialDailog_form').show();
};

function uploadProductTutorialCB(r){
  closeDialog('#productTutorialDailog'); 
}

function showEmbededdVedio(video_link){
  $('#video_prev').html(video_link);
}

function downloadBucketFile(file_path){
  var a = document.createElement('A');
  a.href = '/DownloadFile?bucket_path='+file_path; 
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a); 
}

function deleteTutorialPdf(k, bk){
  var uri = '/DeleteBucketFile?k='+k+'&bucket_key='+bk+'&selection=TUTORIAL_PDF';
  getRequest('',uri, 'deleteTutorialPdfCB');

}


function deleteTutorialPdfCB(k,bk){
  $('#pdf_input_file_dom').show();
  $('#pdf_preview_dom').hide().html('');
}

function uploadStrips(i){
  fileObj = $('#strip_file_'+i)[0];
  if (fileObj.files && fileObj.files[0]) {
    postFormWithFile('stripe_upload_form_'+i, '/superadmin/ManageStripImg', 'uploadStripsCB')
  }
}

function uploadStripsCB(r){
  h = '<img height="100px" src="'+r.data.url+'"><br><button class="btn btn-danger btn-minier" type="button"'+
  'onclick="deleteStript('+r.data.index+')" >Delete</button>'
  
  $('#stripe_prev_'+r.data.index).html(h);
  $('#stripe_upload_form_'+r.data.index).hide();
}

function deleteStript(i){
  getRequest('', '/superadmin/ManageStripImg?index='+i, 'deleteStriptCB');
}

function deleteStriptCB(r){
  $('#stripe_prev_'+r.data.index).html('');
  $('#stripe_upload_form_'+r.data.index).show();
}

function copyText(id){
  var copyText = document.getElementById(id);
  var textArea = document.createElement("textarea");
  textArea.value = copyText.textContent;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("Copy");
  textArea.remove();
  showMSG('Image url copied', 'info');
}


function gotoCreateEvent(){
  showFormDom()
  $('#events_form').show();
  $('#edit_events_form').hide();
}

function editEvent(k){
  showFormDom();
  $('#events_form').hide();
  $('#edit_events_form').show();
  getRequest('', '/superadmin/GetEvent?k='+k, 'editEventCB');
}

function editEventCB(r){
  $('#loading_evnt').hide();
  $('#event_key').val(r.data.k);
  if(r.data.status){
    $('#stauts').val('true')
  } else{
    $('#stauts').val('');
  }
  $('#edit_event_end_date').val(r.data.end_date);
  $('#edit_event_start_date').val(r.data.start_date);
  $('#edit_event_date').val(r.data.date);
  $('#edit_title').val(r.data.title);
   
}
function updateEvent(){
  postRequest('edit_events_form', '/superadmin/EditEvent', 'updateEventCB');
}
function updateEventCB(r){
  showListDom();
  $('#tr_'+r.data.k).toggleClass('False True');
}

function searchClientLog(){
  var dt = $('#seleted_date').val(); 
  if (!dt) {
    showMSG('Please select date', 'warning');
    return;
  }
  $('#client_logs').html(searchTableMsg);
  getRequest('', '/superadmin/ClientLogsSearch?dt='+dt,
      'searchClientLogCB');
}

function searchClientLogCB(r){
  $('#client_logs').html(r.data.html);
}

var customLblData=[];
function customLabelDailog(){
  openDialog('#addCustomLblDailog');
  $('#add_custom_lble_form')[0].reset();
  customLblData=[];
}

function resetLBLOpt(){
  $('#opt_list').val('');
}
function addOptList(){
  var v = $('#new_opt').val();
  if(!v) return;
  var a = $('#opt_list').val();
  if(!a){
    a=v;
  } else{
    a=a+','+v;
  }
  $('#opt_list').val(a);
  $('#new_opt').val('');
}
function appendLabel(){
  var l = $('#new_label').val(),
  a = $('#opt_list').val();
  if(!l||!a) return;
  
  var t = $('#lable_type').val();
  customLblData.push({'title': l,'type': t, 'val': a.split(',')});
  $('#opt_list').val('');
} 
function addCustomLableProduct(){
  if(customLblData.length==0){
    return;
  }
  $('#custom_lable').val(JSON.stringify(customLblData));

  closeDialog('#addCustomLblDailog');
}
