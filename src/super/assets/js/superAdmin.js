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
  tr.push('</td></tr>');
  tr = tr.join('')
  $('#dummy_product_table_body').append(tr);
  $('#product_table_body').prepend(tr);
  $('#' + fID)[0].reset();
};

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
  var row = $("<tr></tr>");
  row.append(tds.eq(0).clone())
  .append(tds.eq(1).clone())
  .append(tds.eq(2).clone())
  .append(tds.eq(3).clone())
  .append(tds.eq(4).clone())
  .append(tds.eq(5).clone())
  .append(tds.eq(6).clone())
  .appendTo($('#assigned_product_frenchise'));
  $('#'+id).remove();
};

