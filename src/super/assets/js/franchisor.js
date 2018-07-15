var searchTableMsg = '<tr class="text-center"><td colspan="20"><i class="fa fa-spinner fa-spin" ></i> Searching...</td></tr>'
  
function searchMyOrder(){
  var tr=[];
  dt1=$('#start').val();
  dt2=$('#end').val();
  dt=[dt1,dt2]
  if(!dt1 || !dt2){
    showMSG('Please enter daterage', 'warning');
    return;
  } 
  $('#table_body').html(searchTableMsg);
  postRequest('seller-search-order-form',
              '/Seller/OrderSearch',
              'searchOrderCallBack');
};
  
function searchOrderCallBack(r){
  $('#table_body').html(r.data.html);
}

function addProductToFrechise(id){
  var tds = $('#'+id).children(); 
  var reatilPrice = tds.eq(7).children()[0].value;
  if(!reatilPrice) {
    showMSG('Please enter retail price', 'warning');
    return;
  }
  
  var row = $("<tr></tr>");
  row.append(tds.eq(0).clone())
  .append(tds.eq(1).clone())
  .append(tds.eq(2).clone())
  .append(tds.eq(3).clone())
  .append(tds.eq(4).clone())
  .append(tds.eq(5).clone())
  .append(tds.eq(6).clone())
  .append('<td>'+reatilPrice+'</td>')
  .appendTo($('#frenchise_product'));
  $('#'+id).remove();
}

function editSellerProduct(key) {
  var reatilPrice = $('#rp_'+key).val();
  if(!reatilPrice) {
    showMSG('Please enter retail price', 'warning');
    return;
  }
  
  $("#rp_"+key).prop('disabled', true);
  $("#btn_"+key).prop('disabled', true);
  $("#req_"+key).show();
  
  getRequest('', '/Seller/EditProductRetailPrice?key='+key+'&retailPrice='+reatilPrice, 'editSellerProductCallBack');
};

function editSellerProductCallBack(obj) {
  $("#rp_"+obj.data.key).prop('disabled', false);
  $("#btn_"+obj.data.key).prop('disabled', false);
  $("#req_"+obj.data.key).hide();
};

