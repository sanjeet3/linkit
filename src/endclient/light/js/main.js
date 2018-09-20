function clientGetProd(key) {
  $('#product_list_caontainer').hide();
  $('#product_action_caontainer').show();
  $('#product_action_caontainer')
      .html(
          '<div style="text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Loading product</p></div>');

  getRequest('', '/GetProductDetails?key=' + key, 'clientGetProdCallBack');

};

function clientGetProdCallBack(r) {
  $('#product_action_caontainer').html(r);
};

function clientProductList() {
  $('#product_list_caontainer').show();
  $('#product_action_caontainer, #order_list_caontainer, #product_order_caontainer').hide();
}

function backToProductAcitionDom() {
  $('#product_design_caontainer').hide();
  $('#product_action_caontainer, .navbar, .footer').show();

}

function goToProductDesign(key) {
  $('#product_design_caontainer').show();
  $('#product_action_caontainer').hide();
  $('#product_design_caontainer')
      .html(
          '<div style="text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Loading product design creator</p></div>');
  yourDesigner = null;
  getRequest('', '/GetProductDesignor?key=' + key, 'goToProductDesignCallBack');
};

function goToProductDesignCallBack(r) {
  $('#product_design_caontainer').html(r);
};

function checkPrice(){
  $('#seller_list').show();
  $('#prd_info').hide();
}
function closeCheckPrice(){
  $('#seller_list').hide();
  $('#prd_info').show();
}

function selectSellerPrice(productKey, seller, price) { 
  $('#selected_seller_product').val(productKey);
  var h = '<b>Seller: </b>'
      + seller + '<br/> <b>Price per item: </b>' + price + ' KES';
  $('#selected_seller_price_info').html(h);
  
  $("#seller_price_list>li>a.active").removeClass("active");
  $('#' + productKey).addClass("active");
  closeCheckPrice();
  
}

function orderNow() {
  var qty = $('#user-priece-qty').val();
  var pk = $('#selected_seller_product').val();
  if (!qty) {
    alert('Please enter quantity!');
    return;
  }
  qty = parseInt(qty);
  if (qty < 1) {
    alert('Minmum quantity is 1!');
    return;
  }
  if (!pk) {
    alert('Please select seller!');
    return;
  }
  $('#selected_product_qty').val(qty);
  $('#selected_design_id').val($('#design_id').val());
  $('#order-stage-1').hide();
  $('#order-stage-2').show();
  $('#order-detail-stage1')
      .html(
          '<div style="width: 100%;text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Loading order details</p></div>');

 /* getRequest('product_order_form', '/OrderStageFirst',
      'orderNowCallBack');*/

};

function orderNowCallBack(r) {
  $('#order-detail-stage1').html(r);
}

