var sprite = function(element, direction, factor) {
  this.element = element;
  this.direction = direction;
  this.factor = factor;
  var left = this.element.css("left");

  if ("auto" == left) {
    this.position = $(document).width() - this.element.width()
        - parseFloat(this.element.css("right"));
  } else {
    this.position = parseFloat(this.element.css("left"));
  }
};

sprite.prototype.render = function(diff) {
  if (this.position < 0 - 500) {
    this.position = $(document).width();
  } else if (this.position > $(document).width()) {
    this.position = -500;
  } else {
    this.position += (diff / this.factor) * this.direction;
  }

  this.element.css("left", this.position + "px");
}

// Initial position of elements
var skyline_initial_pos = 367;
var buildings_inital_pos = -625;
var road_initial_pos = 0;
var train_initial_pos = 0;

// To calculate amount scrolled.
var scroll_diff = 0;
var old_scroll_pos = 0;
var curr_scroll_pos = 0;

var browser_width = jQuery(document).width();

var sprites = [ new sprite(jQuery(".animation-container .bus1"), 1, 3),
  new sprite(jQuery(".animation-container .truck"), 1, 3.5), 
    new sprite(jQuery(".animation-container .car1"), 1, 1.4),
    new sprite(jQuery(".animation-container .cycle"), 1, 5),
    new sprite(jQuery(".animation-container .taxi1"), -1, 2.2),
    new sprite(jQuery(".animation-container .bus2"), -1, 1.8),
    new sprite(jQuery(".animation-container .truck2"), -1, 3.5),
    new sprite(jQuery(".animation-container .car2"), -1, 0.8) ];

jQuery(window).scroll(
    function() {

      curr_scroll_pos = jQuery(window).scrollTop();

      if (curr_scroll_pos < jQuery(document).height()) {

        // Code to find scrolled amount
        scroll_diff = Math.abs(old_scroll_pos - curr_scroll_pos);
        old_scroll_pos = curr_scroll_pos;

        // Animation code
        jQuery(".animation-container").css(
            "background-position",
            function() {
              return "left " + (skyline_initial_pos - curr_scroll_pos / 10)
                  + "px bottom 248px";
            });

        jQuery(".animation-container .road1").css(
            "background-position",
            function() {
              return "left " + (road_initial_pos - curr_scroll_pos / 6)
                  + "px bottom";
            });

        jQuery(".animation-container .road2").css(
            "background-position",
            function() {
              return "left " + (road_initial_pos - curr_scroll_pos / 6)
                  + "px bottom";
            });

        jQuery(".animation-container .buildings").css(
            "background-position",
            function() {
              return "left " + (buildings_inital_pos - curr_scroll_pos / 6)
                  + "px bottom";
            });

        jQuery(".animation-container .train").css(
            "background-position",
            function() {
              return "left " + (train_initial_pos - curr_scroll_pos / 6)
                  + "px bottom";
            });

        sprites.forEach(function(value, key) {
          value.render(scroll_diff);
        });
      }
    });
// SLIDER

function menuClick(elm) {
  $("#navbar-list>ul>li>a.active").removeClass("active");
  $(elm).addClass("active");
}

function viewProductDetails(key) {
  $('#product-list-dom').hide();
  $('#product-detail-dom').show();
  $('#product-detail-dom')
      .html(
          '<div style="text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Loading product</p></div>');

  getRequest('', '/GetProductDetails?key=' + key, 'viewProductDetailsCallBack');

};

function viewProductDetailsCallBack(r) {
  $('#product-detail-dom').html(r);
};

function backToProductList() {
  $('#product_list_caontainer').show();
  $('#product_order_caontainer').hide();
};

function changeProductViewImg(elm) {
  $(".product-images-list>img").removeClass('active');
  $("#" + elm.id).addClass('active');
  $('#product-view-img').attr('src', elm.src);
};

function checkPriceForProduct() {
  $('#prd-main-action').hide();
  $('#prd-seller-selection-dom').show();
}

function backCheckPriceForProduct() {
  $('#prd-main-action').show();
  $('#prd-seller-selection-dom').hide();
}

function selectProductSeller(productKey, seller, price) {
  $('.order-act, #prd-main-action').show();
  $('.select-seller, #prd-seller-selection-dom').hide();
  $('#selected_seller_product').val(productKey);
  var h = '<div class="prd-inf-title">Order</div><div class="prd-inf-val text-blue">Seller: '
      + seller + '<br/> Price per item: ' + price + ' KES</div>'
  $('#selected_seller_price_info').html(h);
}

function resetProductSeller() {
  $('.order-act').hide();
  $('.select-seller').show();
  $('#selected_seller_product').val('');
  $('#selected_seller_price_info').html('');

}

function orderProductStage1() {
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
    alert('Seller not available!');
    return;
  }
  $('#selected_product_qty').val(qty);
  $('#selected_design_id').val($('#design_id').val());
  $('#order-stage-1').hide();
  $('#order-stage-2').show();
  $('#order-detail-stage1')
      .html(
          '<div style="width: 100%;text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Loading order details</p></div>');

  getRequest('product_order_form', '/OrderStageFirst',
      'orderProductStageFirstCallBack');

};

function orderProductStageFirstCallBack(r) {
  $('#order-detail-stage1').html(r);
}

function backFromOrderStageFirst() {
  $('#order-stage-1').show();
  $('#order-stage-2, #order-payment-stage, #order-suucess').hide();
  $('#order-detail-stage1').html('');

};

function setOrderProdutQty(elm) {
  $('#selected_product_qty').val(elm.value);
};

function DirectOrder(){
  var qty = $('#user-priece-qty').val();
  var pk = $('#selected_seller_product').val();
  if (!qty) {
    alert('Quantity missing!');
    return;
  }
  qty = parseInt(qty);
  if (qty < 1) {
    alert('Minmum quantity is 1!');
    return;
  }
  if (!pk) {
    alert('Seller missing!');
    return;
  }
  
  
  $('#product_action_caontainer').hide();
  $('#product_order_caontainer').show();
  $('#product_order_caontainer')
      .html(
          '<div style="text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Please wait...</p></div>');

  postRequest('product_order_form', '/PlaceOrder', 'DirectOrderCallback');
};

function DirectOrderCallback(r){
  $('#product_order_caontainer').html(r.data.html);
}

function backToProductAction(){
  $('#product_action_caontainer').show();
  $('#product_order_caontainer').hide();
}

function orderPaymentStart() {

  var qty = $('#user-priece-qty').val();
  var pk = $('#selected_seller_product').val();
  if (!qty) {
    alert('Quantity missing!');
    return;
  }
  qty = parseInt(qty);
  if (qty < 1) {
    alert('Minmum quantity is 1!');
    return;
  }
  if (!pk) {
    alert('Seller missing!');
    return;
  }

  $('#order-stage-2').hide();
  $('#order-payment-stage').show();

};

function orderMakePayment() {
  var client_name = $('#client_name').val();
  var client_mobile = $('#client_mobile').val();
  var client_email = $('#client_email').val();
  var card_number = $('#card_number').val();
  var name_on_card = $('#name_on_card').val();
  var cvv_number = $('#cvv_number').val();
  var qty = $('#user-priece-qty').val();
  var pk = $('#selected_seller_product').val();
  var design_id = $('#selected_design_id').val();
  if (!qty) {
    alert('Quantity missing!');
    return;
  }

  if (!pk) {
    alert('Seller missing!');
    return;
  }

  if (!client_name) {
    alert('Please enter your name');
    return;
  }
  if (!client_email) {
    alert('Please enter your email');
    return;
  }
  if (!card_number) {
    alert('Please enter debit card number');
    return;
  }
  if (card_number.length < 16) {
    alert('Debit card number incomplete');
    return;
  }
  if (!name_on_card) {
    alert('Please enter name on your card');
    return;
  }
  if (!cvv_number) {
    alert('Please enter cvv number');
    return;
  }

  var h = '<div style="width: 100%;text-align: center;padding-bottom: 150px; padding-top: 150px;">\
    <i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Plaese Wait Payment proccessing</p>\
    <br><p>Do not refresh or press back button untill payment success</p></div>';

  $('#order-payment-stage').hide();
  $('#order-suucess').show();
  $('#order-suucess-details').html(h);
  var reqURL = '/PlaceOrder?qty=' + qty + '&product=' + pk+ '&design_id='+design_id;
  postRequest('order-payment-form', reqURL, 'orderMakePaymentCallBack');
};

function orderMakePaymentCallBack(r) {

  $('#order-suucess-details').html(r.data.html);
  $("button").attr("disabled", false);

}

function scrollTop(){
  window.scrollTo(0, 0);
}

function showLoginDom() {
  $('#login_form').show();
  $('#registration_form, #registeration_msg_dom, #registration_dom').hide();
  $(".signin-grid").animate({backgroundColor: "red"});
  scrollTop();
}

function showRegisterDom() {
  $('#registration_form, #registration_dom').show();
  $('#login_form, #registeration_msg_dom').hide();
  scrollTop();
}

function register() {
  var name = $('#name').val(), user_email = $('#user_email').val(), password = $(
      '#password').val(), confirmpassword = $('#confirm-password').val();
  // var term_condition= $('term_condition').val();
  if (!name) {
    alert('Enter your name');
    return;
  }

  if (!user_email || user_email.length < 5) {
    alert('Enter valid email address');
    return;
  }

  if (!password || password.length < 5) {
    alert('Password minimun 5 character long.');
    return;
  }

  if (password != confirmpassword) {
    alert('Password not matched');
    return;
  }

  if (!$('#term_condition')[0].checked) {
    alert('You are not accept terms and conditions');
    return;
  }
 
  var formData = $("#registration_form").serializeArray();
  $("button").attr("disabled", true); 
  $.ajax({
    type: "POST",
    url: '/Register',
    data: formData,
    success: registerCallBack,
    dataType:  'json',
  });
  
  
}

function registerCallBack(r) {
  $("button").attr("disabled", false); 
  if (r.status == 'SUCCESS') {
    $('#email_text').html(r.data.email);
    $('#registeration_msg_dom').show();
    $('#registration_form').hide();
  } else {
    $("#registraition_error").html(r.data.error)
  }
};

function viewProduct(k){
  window.location.href = '/Product?key='+k;
}

function searchEvent(){
  $('#event_list').html('<div class="events-search col-lg-12"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Searching Events</p></div>');
  getRequest('event_search_form','/SearchEvent', 'searchEventCallBack');
}

function searchEventCallBack(r){
  $('#event_list').html(r);
}

function getMyOrders(){
  $('#order_list_caontainer').show();
  $('#product_list_caontainer, #product_action_caontainer, #product_design_caontainer, #product_order_caontainer').hide();
  $('#order_list_caontainer').html(
  '<div style="width: 100%;text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Loading order list</p></div>');

  getRequest('', '/GetMyOrders', 'getMyOrdersCallBack');
};
function getMyOrdersCallBack(r){
  $('#order_list_caontainer').html(r);
};


function showOrderList(){
  $('#order_list_dom').show();
  $('#order_detail_dom').hide();
};
function getOrderDetails(k){
  $('#order_list_dom').hide();
  $('#order_detail_dom').show();
  $('#order_detail_dom').html('<div style="width: 100%;text-align: center;padding-bottom: 150px; padding-top: 150px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><p>Loading order details</p></div>');
  getRequest('', '/GetMyOrderDetails?k='+k, 'getOrderDetailsCallBack');
};
function getOrderDetailsCallBack(r){
  $('#order_detail_dom').html(r);
};
function showHistory(status){
  $('#history_details>p').hide();
  $('.'+status).show();
};


function showImageModel(imageurl){
   $('#modal-content').html('<img style="max-width:100%;" src="' + imageurl+'">');
   $('#modal-background').fadeIn();
   $('#product_action_caontainer').hide();
   $('#modal-background').click(function(){
     closeModal();
   });

};

function closeModal(){
$('#modal-background').fadeOut();
$('#product_action_caontainer').show();
}

function downloadFile(file_path){
  var a = document.createElement('A');
  a.href = '/DownloadFile?bucket_path='+file_path; 
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a); 
}

function playYouTube(h, e){
  $(e).remove();
  $('#vedio_output').html(h);
}
function youtubeModal(h){ 
  $('#tutorialModal').show();
}
function youtubeModalHide(){ 
  $('#tutorialModal').hide();
}
 
function deleteDesign(k){
  $('#'+k).remove();
  url = '/BucketDeleteDesign?key='+k;
  getRequest('', url, null);
}

