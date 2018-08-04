var searchTableMsg = '<tr class="text-center"><td colspan="20"><i class="fa fa-spinner fa-spin" ></i> Searching...</td></tr>'

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
  tr.push(')">Setup Images</a></li> </ul> </div></td> </tr>');
  $('#product_table_body').prepend(tr.join(''));
  $('#' + fID)[0].reset();
};

function saveCategory() {

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
  var design = r.data.design_list;
  if (arr.length == 0) {
    $('#product_img_list').html(
        '<li class="text-center">No Pics Available</li>');
  } else {
    var h = [];
    for (var i = 0; i < arr.length; i++) {
      h.push('<li><img alt="150x150" src="' + arr[i] + '"></li>');
    }

    $('#product_img_list').html(h.join(''));
  }

  if (design.length == 0) {
    $('#product_design_img_list').html(
        '<li class="text-center">No Design Available</li>');
  } else {
    var h = [];
    for (var i = 0; i < design.length; i++) {
      var d = design[i];
      h.push('<li><img alt="150x150" src="' + d.image_url
          + '"><div class="tags"><span class="label label-warning arrowed-in">'
          + d.title + '</span></div></li>');
    }

    $('#product_design_img_list').html(h.join(''));
  }
  
  if(r.data.bg_uri){
    var h = [ '<a href="javascript:deleteImg(' ] 
    h.push("'")
    h.push(r.data.key)
    h.push("'")
    h.push(')">Delete</a>') 
    $('#product_bg_img').html('<img alt="150x150" src="' + r.data.bg_uri + '">');
    $('#product_bg_img').append(h.join(''));
  } else {
    $('#product_bg_img').html('No background image available');
    $('#upload_product_bg_form').show();
  }

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
  h.push('"></td><td>');
  h.push(r.data.code);
  h.push('</td></tr>');

  $('#order_stage_tbody').append(h.join(''));
};

function updateOrderStage() {
  var tbl = {}, stageCount = 0;

  $('#order_stage_tbody').html();
  $('#order_stage_tbody tr').map(function() {
    var x = $(this).find('td').map(function() {
      // return $(this).html();
      if (this.children.length)
        return this.children[0].value
      return this.innerText
    }).get()

    tbl[x[0]] = x[1];
    stageCount += 1;
  })

  if ('' in tbl) {
    showMSG('index missing', 'warning');
    return;
  }

  if (stageCount != Object.keys(tbl).length) {
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

  if (!$('#status_date').val()) {
    showMSG('Date missing', 'warning');
    return;
  }

  if (!$('#status_time').val()) {
    showMSG('Time missing', 'warning');
    return;
  }

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

function saveThemes(){ 
  var title = $('#title').val();
  if(!title){
    showMSG('Title missing', 'warning');
    return;    
  }
  $('#save_product_spin').show();
  
  postRequest('themes_form', '/superadmin/Themes', 'saveThemesCallBack');
  
};

function saveThemesCallBack(r){   
  var skyline = $('#skyline')[0],
  landmarks = $('#landmarks')[0],
  road1 = $('#road1')[0],
  road2 = $('#road2')[0],
  taxi1 = $('#taxi1')[0],
  local_train = $('#local_train')[0],
  bus1 = $('#bus1')[0],
  bus2 = $('#bus2')[0],
  car1 = $('#car1')[0],
  car2 = $('#car2')[0],
  cycle = $('#cycle')[0],
  truck = $('#truck')[0];
  

  var themesUploader = new ThemesUploader(r.data.title, r.data.key);
  
  if (skyline.files && skyline.files[0]) { 
    themesUploader.img1();
  }
  
  if (landmarks.files && landmarks.files[0]) { 
    themesUploader.img2();
  }
  
  if (road1.files && road1.files[0]) { 
    themesUploader.img3();
  }
  
  if (road2.files && road2.files[0]) { 
    themesUploader.img4();
  }
  
  if (taxi1.files && taxi1.files[0]) { 
    themesUploader.img5();
  }
  
  if (local_train.files && local_train.files[0]) { 
    themesUploader.img6();
  }
  
  if (bus1.files && bus1.files[0]) { 
    themesUploader.img7();
  }
  
  if (bus2.files && bus2.files[0]) { 
    themesUploader.img8();
  }
  
  if (car1.files && car1.files[0]) { 
    themesUploader.img9();
  }
  
  if (car2.files && car2.files[0]) { 
    themesUploader.img10();
  }
  
  if (cycle.files && cycle.files[0]) { 
    themesUploader.img11();
  }
  
  if (truck.files && truck.files[0]) { 
    themesUploader.img12();
  } 

  $('#save_product_spin').hide();
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
