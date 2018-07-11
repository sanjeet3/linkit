var sprite = function(element, direction, factor) { 
    this.element = element;
    this.direction = direction;
    this.factor = factor;
    var left = this.element.css("left");

    if ("auto" == left) {
        this.position = $(document).width() - this.element.width() - parseFloat(this.element.css("right"));
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

//Initial position of elements
var skyline_initial_pos = 367;
var buildings_inital_pos = -625;
var road_initial_pos = 0;
var train_initial_pos = 0;

//To calculate amount scrolled.
var scroll_diff = 0;
var old_scroll_pos = 0;
var curr_scroll_pos = 0;

var browser_width = jQuery(document).width();

var sprites = [new sprite(jQuery(".animation-container .bus1"), 1, 3),
    new sprite(jQuery(".animation-container .truck"), 1, 3.5),
    new sprite(jQuery(".animation-container .car1"), 1, 1.4),
    new sprite(jQuery(".animation-container .cycle"), 1, 5),
    new sprite(jQuery(".animation-container .taxi1"), -1, 2.2),
    new sprite(jQuery(".animation-container .bus2"), -1, 1.8),
    new sprite(jQuery(".animation-container .car2"), -1, 0.8)];

jQuery(window).scroll( function() {
    
    curr_scroll_pos = jQuery(window).scrollTop();
    
    if (curr_scroll_pos < jQuery(document).height()) {
    
    //Code to find scrolled amount
    scroll_diff = Math.abs(old_scroll_pos - curr_scroll_pos);
    old_scroll_pos = curr_scroll_pos;
    
    //Animation code
    jQuery(".animation-container").css("background-position" , function() {
    return "left " + (skyline_initial_pos - curr_scroll_pos / 10) + "px bottom 248px";
    });
    
    jQuery(".animation-container .road1").css("background-position" , function() {
    return "left " + (road_initial_pos - curr_scroll_pos / 6) + "px bottom";
    });
    
    jQuery(".animation-container .road2").css("background-position" , function() {
    return "left " + (road_initial_pos - curr_scroll_pos / 6) + "px bottom";
    });
    
    jQuery(".animation-container .buildings").css("background-position" , function() {
    return "left " + (buildings_inital_pos - curr_scroll_pos / 6) + "px bottom";
    });
    
    jQuery(".animation-container .train").css("background-position" , function() {
    return "left " + (train_initial_pos - curr_scroll_pos / 6) + "px bottom";
    });
    
    sprites.forEach( function (value, key) {
    value.render(scroll_diff);  
    });
    }
});
//SLIDER
