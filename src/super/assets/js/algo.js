/* $.notify({
	// options
	message: 'Hello World' 
},{
	// settings
	type: 'danger'
});
 * 
 * 
 * 
 *  
 *  $.notify({
	// options
	icon: 'glyphicon glyphicon-warning-sign',
	title: 'Bootstrap notify',
	message: 'Turning standard Bootstrap alerts into "notify" like notifications',
	url: 'https://github.com/mouse0270/bootstrap-notify',
	target: '_blank'
},{
	// settings
	element: 'body',
	position: null,
	type: "info",
	allow_dismiss: true,
	newest_on_top: false,
	showProgressbar: false,
	placement: {
		from: "top",
		align: "right"
	},
	offset: 20,
	spacing: 10,
	z_index: 1031,
	delay: 5000,
	timer: 1000,
	url_target: '_blank',
	mouse_over: null,
	animate: {
		enter: 'animated fadeInDown',
		exit: 'animated fadeOutUp'
	},
	onShow: null,
	onShown: null,
	onClose: null,
	onClosed: null,
	icon_type: 'class',
	template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
		'<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
		'<span data-notify="icon"></span> ' +
		'<span data-notify="title">{1}</span> ' +
		'<span data-notify="message">{2}</span>' +
		'<div class="progress" data-notify="progressbar">' +
			'<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
		'</div>' +
		'<a href="{3}" target="{4}" data-notify="url"></a>' +
	'</div>' 
});
 * 
 * */



var mainApp={};
mainApp.config={'title':'', 'data':''}
mainApp.reqUrl=''
	
var loadingHtml='<div style="text-align: center; padding-top: 30vh; "> <i class="fa fa-spinner fa-spin fa-2x"></i><p>[TITLE] Loading...</p></div>'	
var retryHtml = '<div style="text-align: center; padding-top: 30vh; "><button type="button">Retry</button></div>'
	
var mainContentInner = $('#main-content-inner');

function showMSG(msg, msgType='info') {
  $.notify({
		// options
		message: msg 
	},{
		// settings
		type: msgType
  });	
}

function getWebPage(reqUrl, config) {
	mainApp.config=config;
	mainApp.reqUrl=reqUrl;
	$.ajax({
		url : reqUrl,
		method : 'GET',
		beforeSend : function(xhr) {
         var h = loadingHtml.replace('[TITLE]', config.title);
         mainContentInner.html(h);
		},
		success : function(obj) {
			mainContentInner.html(obj)
		},
		error : function(obj) {
			mainContentInner.html(retryHtml);
		},
	});
}

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
		messageConfirmation(obj);
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
			messageConfirmation(obj);
			$("button").attr("disabled", false);
		}
	});
};

function postFormWithFile(formID, url, callback) {
  $("button").attr("disabled", true); 
  var formData = new FormData($("#" + formID)[0]); 
  $.ajax({
      url: url,
      type: 'POST',
      data: formData,
      async: false,
      cache: false,
      contentType: false,
      processData: false,
      success: function (obj) {
        $("button").attr("disabled", false);
        if (callback != null ) {
          var callbackMethod = eval(callback);
          callbackMethod(obj, formID);
        }
        messageConfirmation(obj);
      },
      error: function(){
        $("button").attr("disabled", false); 
          alert("error in form submission");
      }
  });

};


function messageConfirmation(obj) {
  if(obj.message) {
	if (obj.status == 'SUCCESS') {
	  showMSG(obj.message, 'success') 
	} else if (obj.status == 'ERROR') {
      showMSG(obj.message, 'danger')	     
	} else if (obj.status == 'INFO') {
	  showMSG(obj.message, 'info')    
	} else if (obj.status == 'WARNING') {
	  showMSG(obj.message, 'warning') 
	}
  }
};

function log(e){
  console.log(e)
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
 
// if user resize the window, call the same function again
// to make sure the overlay fills the screen and dialogbox aligned to center    
$(window).resize(function () {
  //only do it if the dialog box is not hidden
  if (!$('.dialog-box').is(':hidden')) resizeDialog();       
});

function resizeDialog(){
//get the screen height and width  
  var maskHeight = $(document).height();  
  var maskWidth = $(window).width();
  
  // calculate the values for center alignment
  var dialogTop =  (maskHeight/3) - ($('.dialog-box').height());  
  var dialogLeft = (maskWidth/2) - ($('.dialog-box').width()/2); 
  
  // assign values to the overlay and dialog box
  $('.dialog-overlay').css({height:maskHeight, width:maskWidth})
  $('.dialog-box').css({top:dialogTop, left:dialogLeft}) 
};

function openDialog(dailogID){
  resizeDialog();
  $('.dialog-overlay').show();
  $(dailogID).show();
}

function closeDialog(dailogID) {
  $('.dialog-overlay, '+ dailogID).hide();
};

function showFormDom(){ 
  $('#bck-btn, #form-dom').show();
  $('#add_btn, #list-dom').hide();
};

function showListDom() {
  $('#bck-btn, #form-dom').hide();
  $('#add_btn, #list-dom').show();
	
};

