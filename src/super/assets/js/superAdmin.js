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
  var tr = [ '<tr><td>' ];
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
  tr.push('</td><td></td></tr>');
  tr = tr.join('')
  $('#dummy_product_table_body').append(tr);
  $('#product_table_body').prepend(tr);
  $('#' + fID)[0].reset();
};

function saveCategory(){
  
  if (!$('#new_category').val()) {
    showMSG('Please enter category', 'warning');
    return;
  }
  postRequest('add_new_category_form', '/superadmin/SaveProductCategory', 'saveCategoryCallBack')
}

function saveCategoryCallBack(obj, fID) {
  $('#add_new_category_spin').hide();
  $('#' + fID)[0].reset();
  closeDialog('#addCategoryDailog');
  category
  $('#category').append($('<option>', {
    value: obj.data.name
  }).text(obj.data.name));
}

function saveUOM(){
  
  if (!$('#new_uom').val()) {
    showMSG('Please enter UOM', 'warning');
    return;
  }
  postRequest('add_new_uom_form', '/superadmin/SaveProductUOM', 'saveProductUOMCallBack')
}
function saveProductUOMCallBack(obj, fID) {
  $('#save_product_spin').hide();
  $('#' + fID)[0].reset(); 
  closeDialog('#addUOMDailog')
  $('#uom').append($('<option>', {
    value: obj.data.name
  }).text(obj.data.name));
}

function showFrenchiseFormDom(){
  $('#list-dom, #add_btn').hide();
  $('#form-dom, #bck-btn').show();
};
function showFrechiseListDom(){
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
  postRequest('frenchise_form', '/superadmin/CreateFrenchise', 'saveFrenchiseCallBack')
};

function saveFrenchiseCallBack(obj, fID) {
  $('#save_spin').hide();
  $('#dummy_dom').show();
  var tr = [ '<tr><td>' ];
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
  tr.push('</td><td></td></tr>');
  tr = tr.join('')
  $('#dummy_table_body').append(tr);
  $('#table_body').prepend(tr);
  $('#' + fID)[0].reset();
};


function addProductToFrenchise(id){ 
  log(id);
  tds = $('#'+id).children();
  $('#selected_frenchise_text').html(tds.eq(0).html());
  $('#add-product-frenchise, #bck-btn').show();
  $('#list-dom, #add_btn').hide();
  
};

function assignProductToFrechise(id){
  var tds = $('#'+id).children(); 
  var reatilPrice = tds.eq(6).children()[0].value;
  if(!reatilPrice) {
    showMSG('Please enter price', 'warning');
    return;
  }
  $('#'+id).remove();
  btnH = ['<td>  <button type="button" class="btn btn-info btn-minier" onclick="editFrncProduct('];
  btnH.push("'");
  btnH.push(id);
  btnH.push("'");
  btnH.push(')">Edit</button><button type="button" class="btn btn-info btn-minier" onclick="editDoneFrncProduct(');
  btnH.push("'");
  btnH.push(id);
  btnH.push("'");
  btnH.push(')" style="display: none;">Done</button><button type="button" class="btn btn-danger btn-minier ml-5" onclick="removeFrncProduct(');
  btnH.push("'");
  btnH.push(id);
  btnH.push("'");
  btnH.push(')">Remove</button></td>'); 
  
  var row = $("<tr id='"+id+"'></tr>");
  row.append(tds.eq(0).clone())
  .append(tds.eq(1).clone())
  .append(tds.eq(2).clone())
  .append(tds.eq(3).clone())
  .append(tds.eq(4).clone())
  .append(tds.eq(5).clone())
  .append('<td>'+reatilPrice+'</td>')
  .append(btnH.join(''))
  .appendTo($('#assigned_product_frenchise'));
  
};

function editFrncProduct(id){
  var tds = $('#'+id).children();
  var editTD = tds.eq(7);
  $(editTD.children()[0]).hide()
  $(editTD.children()[1]).show()
  price = tds.eq(6).html();
  input = '<input type="number" min="0.0" name="price" step=".50" value="'+ price +'" class="input-retail-price">';
  tds.eq(6).html(input)
};

function editDoneFrncProduct(id){
  var tds = $('#'+id).children();
  var reatilPrice = tds.eq(6).children()[0].value;
  if(!reatilPrice) {
    showMSG('Please enter price', 'warning');
    return;
  }
  tds.eq(6).html(reatilPrice);
  var editTD = tds.eq(7);
  $(editTD.children()[0]).show()
  $(editTD.children()[1]).hide()
  
};

function removeFrncProduct(id){
  if(confirm('Remove this product from frenchise')){
    $('#'+id).remove();
  }
};

function searchOrder(){
  var tr=[];
  dt1=$('#start').val();
  dt2=$('#end').val();
  dt=[dt1,dt2]
  if(!dt1 || !dt2){
    showMSG('Please enter daterage', 'warning');
    return;
  }
  frnc=['Blueline Gifts', 'Purpink Gifts & Florist'];
  prod=['Coffe Mug', 'School Bag', 'Water Bottle'];
  add=['Eastleigh Second Ave, Nairobi, Kenya',

'Shariff Guest House, Eastleigh Second Ave, Nairobi City, Kenya',

'Off 2nd Avenue, Eastleigh, Tenth St, Nairobi, Kenya',

'Next To Sky Blue Lodge, Eastleigh Second Avenue, Nairobi, Kenya ']
  for(var i=0; i<5; i++){
    tr.push('<tr><td>');
    tr.push('ORD'+getRandomInt(15648));
    tr.push('</td><td>');
    tr.push(getRandomInt(558899))
    tr.push('</td><td>');
    tr.push(dt[getRandomInt(2)])
    tr.push('</td><td>');
    tr.push(prod[getRandomInt(3)])
    tr.push('</td><td>');
    tr.push(getRandomInt(24))
    tr.push('</td><td>');
    tr.push(frnc[getRandomInt(2)])
    tr.push('</td><td>');
    tr.push(add[getRandomInt(4)])
    tr.push('</td></tr>');
    
  }
  $('#table_body').html(tr.join(''));
}


function imgSetupProduct(id){
  var tds = $('#'+id).children();
  code = tds.eq(0).html();
  name = tds.eq(1).html();
  $('#prod_code').html(code);
  $('#prod_name').html(name);
  $('#image-setup').show();
  $('#list-dom, #add_btn').hide();
  
};

function backImgSetupProduct(){
  $('#image-setup').hide();
  $('#list-dom, #add_btn').show();
  
}

function addImgTOProductList(t, src){ 
  if(t=='2D'){
    h='<li><img alt="150x150" src="'+src+'"></li>';
    $('#product_img_list').append(h);  
  } else {
    i=$('#product_3d_img_list').children().length;
    id='pannellum_'+i;
    $('#product_3d_img_list').append('<div id="'+id+'" class="panorama"></div>');
    setTimeout(function(){ pannellum.viewer(id, {
      "type" : "equirectangular",
      /*"panorama" : "/super/assets/images/alma.jpg",*/
      "panorama" : src,
      "autoLoad": true,
    })}, 400);
    
    
  }
}

function uploadImage() {
  t=$('#pictype').val();
  fileObj=$('#imgage_file')[0];
  if (fileObj.files && fileObj.files[0]) { 
    //addImgTOProductList(t, fileObj.files[0].mozFullPath); 
    var reader = new FileReader();

    reader.onload = function(e) {
      src = e.target.result;
      addImgTOProductList(t, src)
    }

    reader.readAsDataURL(fileObj.files[0]);
  
  }
  
  
  
};
