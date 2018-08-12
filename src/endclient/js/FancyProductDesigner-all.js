(function (global){

	"use strict";

	var fabric=global.fabric||(global.fabric={}),
			extend=fabric.util.object.extend,
			clone=fabric.util.object.clone;

	if(fabric.CurvedText){
		fabric.warn('fabric.CurvedText is already defined');
		return;
	}
	var stateProperties=fabric.Text.prototype.stateProperties.concat();
	stateProperties.push(
			'radius',
			'spacing',
			'reverse',
			'effect',
			'range',
			'largeFont',
			'smallFont'
			);
	var _dimensionAffectingProps=fabric.Text.prototype._dimensionAffectingProps;
	_dimensionAffectingProps['radius']=true;
	_dimensionAffectingProps['spacing']=true;
	_dimensionAffectingProps['reverse']=true;
	_dimensionAffectingProps['fill']=true;
	_dimensionAffectingProps['effect']=true;
	_dimensionAffectingProps['width']=true;
	_dimensionAffectingProps['height']=true;
	_dimensionAffectingProps['range']=true;
	_dimensionAffectingProps['fontSize']=true;
	_dimensionAffectingProps['shadow']=true;
	_dimensionAffectingProps['largeFont']=true;
	_dimensionAffectingProps['smallFont']=true;


	var delegatedProperties=fabric.Group.prototype.delegatedProperties;
	delegatedProperties['backgroundColor']=true;
	delegatedProperties['textBackgroundColor']=true;
	delegatedProperties['textDecoration']=true;
	delegatedProperties['stroke']=true;
	delegatedProperties['strokeWidth']=true;
	delegatedProperties['shadow']=true;
	delegatedProperties['fontWeight']=true;
	delegatedProperties['fontStyle']=true;
	delegatedProperties['strokeWidth']=true;
	delegatedProperties['textAlign']=true;

	/**
	 * Group class
	 * @class fabric.CurvedText
	 * @extends fabric.Text
	 * @mixes fabric.Collection
	 */
	fabric.CurvedText=fabric.util.createClass(fabric.Text, fabric.Collection, /** @lends fabric.CurvedText.prototype */ {
		/**
		 * Type of an object
		 * @type String
		 * @default
		 */
		type: 'curvedText',
		/**
		 * The radius of the curved Text
		 * @type Number
		 * @default 50
		 */
		radius: 50,
		/**
		 * Special Effects, Thanks to fahadnabbasi
		 * https://github.com/EffEPi/fabric.curvedText/issues/9
		 */
		range: 5,
		smallFont: 10,
		largeFont: 30,
		effect: 'curved',
		/**
		 * Spacing between the letters
		 * @type fabricNumber
		 * @default 20
		 */
		spacing: 20,
//		letters: null,

		/**
		 * Reversing the radius (position of the original point)
		 * @type Boolean
		 * @default false
		 */
		reverse: false,
		/**
		 * List of properties to consider when checking if state of an object is changed ({@link fabric.Object#hasStateChanged})
		 * as well as for history (undo/redo) purposes
		 * @type Array
		 */
		stateProperties: stateProperties,
		/**
		 * Properties that are delegated to group objects when reading/writing
		 * @param {Object} delegatedProperties
		 */
		delegatedProperties: delegatedProperties,
		/**
		 * Properties which when set cause object to change dimensions
		 * @type Object
		 * @private
		 */
		_dimensionAffectingProps: _dimensionAffectingProps,
		/**
		 *
		 * Rendering, is we are rendering and another rendering call is passed, then stop rendering the old and
		 * rendering the new (trying to speed things up)
		 */
		_isRendering: 0,
		/**
		 * Added complexity
		 */
		complexity: function (){
			this.callSuper('complexity');
		},
		initialize: function (text, options){
			options||(options={});
			this.letters=new fabric.Group([], {
				selectable: false,
				padding: 0
			});
			this.__skipDimension=true;
			this.setOptions(options);
			this.__skipDimension=false;
//			this.callSuper('initialize', options);
			this.setText(text);
		},
		setText: function (text){
			if(this.letters){
				while(text.length!==0&&this.letters.size()>=text.length){
					this.letters.remove(this.letters.item(this.letters.size()-1));
				}
				for(var i=0; i<text.length; i++){
					//I need to pass the options from the main options
					if(this.letters.item(i)===undefined){
						this.letters.add(new fabric.Text(text[i]));
					}else{
						this.letters.item(i).setText(text[i]);
					}
				}
			}
			this.callSuper('setText', text);
		},
		_initDimensions: function (ctx){
			// from fabric.Text.prototype._initDimensions
			// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
			if(this.__skipDimension){
				return;
			}
			if(!ctx){
				ctx=fabric.util.createCanvasElement().getContext('2d');
				this._setTextStyles(ctx);
			}
			this._textLines=this.text.split(this._reNewline);
			this._clearCache();
			var currentTextAlign=this.textAlign;
			this.textAlign='left';
			this.width=this._getTextWidth(ctx);
			this.textAlign=currentTextAlign;
			this.height=this._getTextHeight(ctx);
			// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
			this._render(ctx);
		},
		_render: function (ctx){
			var renderingCode=fabric.util.getRandomInt(100, 999);
			this._isRendering=renderingCode;
			if(this.letters){
				var curAngle=0,
						curAngleRotation=0,
						angleRadians=0,
						align=0,
						textWidth=0,
						space=parseInt(this.spacing),
						fixedLetterAngle=0;

				//get text width
				if(this.effect==='curved'){
					for(var i=0, len=this.text.length; i<len; i++){
						textWidth+=this.letters.item(i).width+space;
					}
					textWidth-=space;
				}else if(this.effect==='arc'){
					fixedLetterAngle=((this.letters.item(0).fontSize+space)/this.radius)/(Math.PI/180);
					textWidth=((this.text.length+1)*(this.letters.item(0).fontSize+space));
				}
				// Text align
				if(this.get('textAlign')==='right'){
					curAngle=90-(((textWidth/2)/this.radius)/(Math.PI/180));
				}else if(this.get('textAlign')==='left'){
					curAngle=-90-(((textWidth/2)/this.radius)/(Math.PI/180));
				}else{
					curAngle=-(((textWidth/2)/this.radius)/(Math.PI/180));
				}
				if(this.reverse)
					curAngle=-curAngle;

				var width=0,
						multiplier=this.reverse?-1:1,
						thisLetterAngle=0,
						lastLetterAngle=0;

				for(var i=0, len=this.text.length; i<len; i++){
					if(renderingCode!==this._isRendering)
						return;

					for(var key in this.delegatedProperties){
						this.letters.item(i).set(key, this.get(key));
					}

					this.letters.item(i).set('left', (width));
					this.letters.item(i).set('top', (0));
					this.letters.item(i).setAngle(0);
					this.letters.item(i).set('padding', 0);

					if(this.effect==='curved'){
						thisLetterAngle=((this.letters.item(i).width+space)/this.radius)/(Math.PI/180);
						curAngleRotation=multiplier*((multiplier*curAngle)+lastLetterAngle+(thisLetterAngle/4));	//4 is better than 2 for some reason
						curAngle=multiplier*((multiplier*curAngle)+lastLetterAngle);
						angleRadians=curAngle*(Math.PI/180);
						lastLetterAngle=thisLetterAngle;

						this.letters.item(i).setAngle(curAngleRotation);
						this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
						this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);

					}else if(this.effect==='arc'){//arc
						curAngle=multiplier*((multiplier*curAngle)+fixedLetterAngle);
						angleRadians=curAngle*(Math.PI/180);

						this.letters.item(i).set('top', multiplier*-1*(Math.cos(angleRadians)*this.radius));
						this.letters.item(i).set('left', multiplier*(Math.sin(angleRadians)*this.radius));
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
					}else if(this.effect==='STRAIGHT'){//STRAIGHT
						//var newfont=(i*5)+15;
						//this.letters.item(i).set('fontSize',(newfont));
						this.letters.item(i).set('left', (width));
						this.letters.item(i).set('top', (0));
						this.letters.item(i).setAngle(0);
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('selectable', false);
					}else if(this.effect==='smallToLarge'){//smallToLarge
						var small=parseInt(this.smallFont);
						var large=parseInt(this.largeFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);

						//var newfont=(i*this.smallFont)+15;

						this.letters.item(i).set('fontSize', (newfont));

						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						//this.letters.item(i).set('padding', 0);
						/*this.letters.item(i).set({
						 borderColor: 'red',
						 cornerColor: 'green',
						 cornerSize: 6,
						 transparentCorners: false
						 });*/
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						this.letters.item(i).set('top', -1*this.letters.item(i).get('fontSize')+i);
						//this.letters.width=width;
						//this.letters.height=this.letters.item(i).get('height');

					}else if(this.effect==='largeToSmallTop'){//largeToSmallTop
						var small=parseInt(this.largeFont);
						var large=parseInt(this.smallFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);
						//var newfont=((this.text.length-i)*this.smallFont)+12;
						this.letters.item(i).set('fontSize', (newfont));
						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')+(i/this.text.length);

					}else if(this.effect==='largeToSmallBottom'){
						var small=parseInt(this.largeFont);
						var large=parseInt(this.smallFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length);
						var newfont=small+(i*step);
						//var newfont=((this.text.length-i)*this.smallFont)+12;
						this.letters.item(i).set('fontSize', (newfont));
						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set({
							borderColor: 'red',
							cornerColor: 'green',
							cornerSize: 6,
							transparentCorners: false
						});
						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);
						//this.letters.item(i).top =-1* this.letters.item(i).get('fontSize')+newfont-((this.text.length-i))-((this.text.length-i));
						this.letters.item(i).top=-1*this.letters.item(i).get('fontSize')-i;

					}else if(this.effect==='bulge'){//bulge
						var small=parseInt(this.smallFont);
						var large=parseInt(this.largeFont);
						//var small = 20;
						//var large = 75;
						var difference=large-small;
						var center=Math.ceil(this.text.length/2);
						var step=difference/(this.text.length-center);
						if(i<center)
							var newfont=small+(i*step);
						else
							var newfont=large-((i-center+1)*step);
						this.letters.item(i).set('fontSize', (newfont));

						this.letters.item(i).set('left', (width));
						width+=this.letters.item(i).get('width');

						this.letters.item(i).set('padding', 0);
						this.letters.item(i).set('selectable', false);

						this.letters.item(i).set('top', -1*this.letters.item(i).get('height')/2);
					}
				}

				var scaleX=this.letters.get('scaleX');
				var scaleY=this.letters.get('scaleY');
				var angle=this.letters.get('angle');

				this.letters.set('scaleX', 1);
				this.letters.set('scaleY', 1);
				this.letters.set('angle', 0);

				// Update group coords
				this.letters._calcBounds();
				this.letters._updateObjectsCoords();
				this.letters.saveCoords();
				// this.letters.render(ctx);

				this.letters.set('scaleX', scaleX);
				this.letters.set('scaleY', scaleY);
				this.letters.set('angle', angle);

				this.width=this.letters.width;
				this.height=this.letters.height;
				this.letters.left=-(this.letters.width/2);
				this.letters.top=-(this.letters.height/2);
//				console.log('End rendering')
			}
		},
		_renderOld: function (ctx){
			if(this.letters){
				var curAngle=0,
						angleRadians=0,
						align=0;
				// Text align
				var rev=0;
				if(this.reverse){
					rev=0.5;
				}
				if(this.get('textAlign')==='center'||this.get('textAlign')==='justify'){
					align=(this.spacing/2)*(this.text.length-rev);	// Remove '-1' after this.text.length for proper angle rendering
				}else if(this.get('textAlign')==='right'){
					align=(this.spacing)*(this.text.length-rev);	// Remove '-1' after this.text.length for proper angle rendering
				}
				var multiplier=this.reverse?1:-1;
				for(var i=0, len=this.text.length; i<len; i++){
					// Find coords of each letters (radians : angle*(Math.PI / 180)
					curAngle=multiplier*(-i*parseInt(this.spacing, 10)+align);
					angleRadians=curAngle*(Math.PI/180);

					for(var key in this.delegatedProperties){
						this.letters.item(i).set(key, this.get(key));
					}
					this.letters.item(i).set('top', (multiplier-Math.cos(angleRadians)*this.radius));
					this.letters.item(i).set('left', (multiplier+Math.sin(angleRadians)*this.radius));
					this.letters.item(i).setAngle(curAngle);
					this.letters.item(i).set('padding', 0);
					this.letters.item(i).set('selectable', false);
				}
				// Update group coords
				this.letters._calcBounds();
				if(this.reverse){
					this.letters.top=this.letters.top-this.height*2.5;
				}else{
					this.letters.top=0;
				}
				this.letters.left=this.letters.left-this.width/2; // Change here, for proper group display
				//this.letters._updateObjectsCoords();					// Commented off this line for group misplacement
				this.letters.saveCoords();
//				this.letters.render(ctx);
				this.width=this.letters.width;
				this.height=this.letters.height;
				this.letters.left=-(this.letters.width/2);
				this.letters.top=-(this.letters.height/2);
			}
		},
		render: function (ctx, noTransform){
			// do not render if object is not visible
			if(!this.visible)
				return;
			if(!this.letters)
				return;

			ctx.save();
			this.transform(ctx);

			var groupScaleFactor=Math.max(this.scaleX, this.scaleY);

			this.clipTo&&fabric.util.clipContext(this, ctx);

			//The array is now sorted in order of highest first, so start from end.
			for(var i=0, len=this.letters.size(); i<len; i++){
				var object=this.letters.item(i),
						originalScaleFactor=object.borderScaleFactor,
						originalHasRotatingPoint=object.hasRotatingPoint;

				// do not render if object is not visible
				if(!object.visible)
					continue;

//				object.borderScaleFactor=groupScaleFactor;
//				object.hasRotatingPoint=false;

				object.render(ctx);

//				object.borderScaleFactor=originalScaleFactor;
//				object.hasRotatingPoint=originalHasRotatingPoint;
			}
			this.clipTo&&ctx.restore();

			//Those lines causes double borders.. not sure why
//			if(!noTransform&&this.active){
//				this.drawBorders(ctx);
//				this.drawControls(ctx);
//			}
			ctx.restore();
			this.setCoords();
		},
		/**
		 * @private
		 */
		_set: function (key, value){
			this.callSuper('_set', key, value);
			if(this.letters){
				this.letters.set(key, value);
				//Properties are delegated with the object is rendered
//				if (key in this.delegatedProperties) {
//					var i = this.letters.size();
//					while (i--) {
//						this.letters.item(i).set(key, value);
//					}
//				}
				if(key in this._dimensionAffectingProps){
					this._initDimensions();
					this.setCoords();
				}
			}
		},
		toObject: function (propertiesToInclude){
			var object=extend(this.callSuper('toObject', propertiesToInclude), {
				radius: this.radius,
				spacing: this.spacing,
				reverse: this.reverse,
				effect: this.effect,
				range: this.range,
				smallFont: this.smallFont,
				largeFont: this.largeFont
						//				letters: this.letters	//No need to pass this, the letters are recreated on the fly every time when initiated
			});
			if(!this.includeDefaultValues){
				this._removeDefaultValues(object);
			}
			return object;
		},
		/**
		 * Returns string represenation of a group
		 * @return {String}
		 */
		toString: function (){
			return '#<fabric.CurvedText ('+this.complexity()+'): { "text": "'+this.text+'", "fontFamily": "'+this.fontFamily+'", "radius": "'+this.radius+'", "spacing": "'+this.spacing+'", "reverse": "'+this.reverse+'" }>';
		},
		/* _TO_SVG_START_ */
		/**
		 * Returns svg representation of an instance
		 * @param {Function} [reviver] Method for further parsing of svg representation.
		 * @return {String} svg representation of an instance
		 */
		toSVG: function (reviver){
			var markup=[
				'<g ',
				'transform="', this.getSvgTransform(),
				'">'
			];
			if(this.letters){
				for(var i=0, len=this.letters.size(); i<len; i++){
					markup.push(this.letters.item(i).toSVG(reviver));
				}
			}
			markup.push('</g>');
			return reviver?reviver(markup.join('')):markup.join('');
		}
		/* _TO_SVG_END_ */
	});

	/**
	 * Returns {@link fabric.CurvedText} instance from an object representation
	 * @static
	 * @memberOf fabric.CurvedText
	 * @param {Object} object Object to create a group from
	 * @param {Object} [options] Options object
	 * @return {fabric.CurvedText} An instance of fabric.CurvedText
	 */
	fabric.CurvedText.fromObject=function (object){
		return new fabric.CurvedText(object.text, clone(object));
	};

	fabric.util.createAccessors(fabric.CurvedText);

	/**
	 * Indicates that instances of this type are async
	 * @static
	 * @memberOf fabric.CurvedText
	 * @type Boolean
	 * @default
	 */
	fabric.CurvedText.async=false;

})(typeof exports!=='undefined'?exports:this);

/*
 * Copyright 2015 Small Batch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/* Web Font Loader v1.5.18 - (c) Adobe Systems, Google. License: Apache 2.0 */
;(function(window,document,undefined){function aa(a,b,c){return a.call.apply(a.bind,arguments)}function ba(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function k(a,b,c){k=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?aa:ba;return k.apply(null,arguments)}var n=Date.now||function(){return+new Date};function q(a,b){this.K=a;this.w=b||a;this.G=this.w.document}q.prototype.createElement=function(a,b,c){a=this.G.createElement(a);if(b)for(var d in b)b.hasOwnProperty(d)&&("style"==d?a.style.cssText=b[d]:a.setAttribute(d,b[d]));c&&a.appendChild(this.G.createTextNode(c));return a};function r(a,b,c){a=a.G.getElementsByTagName(b)[0];a||(a=document.documentElement);a&&a.lastChild&&a.insertBefore(c,a.lastChild)}function ca(a,b){function c(){a.G.body?b():setTimeout(c,0)}c()}
function s(a,b,c){b=b||[];c=c||[];for(var d=a.className.split(/\s+/),e=0;e<b.length;e+=1){for(var f=!1,g=0;g<d.length;g+=1)if(b[e]===d[g]){f=!0;break}f||d.push(b[e])}b=[];for(e=0;e<d.length;e+=1){f=!1;for(g=0;g<c.length;g+=1)if(d[e]===c[g]){f=!0;break}f||b.push(d[e])}a.className=b.join(" ").replace(/\s+/g," ").replace(/^\s+|\s+$/,"")}function t(a,b){for(var c=a.className.split(/\s+/),d=0,e=c.length;d<e;d++)if(c[d]==b)return!0;return!1}
function u(a){if("string"===typeof a.na)return a.na;var b=a.w.location.protocol;"about:"==b&&(b=a.K.location.protocol);return"https:"==b?"https:":"http:"}function v(a,b){var c=a.createElement("link",{rel:"stylesheet",href:b,media:"all"}),d=!1;c.onload=function(){d||(d=!0)};c.onerror=function(){d||(d=!0)};r(a,"head",c)}
function w(a,b,c,d){var e=a.G.getElementsByTagName("head")[0];if(e){var f=a.createElement("script",{src:b}),g=!1;f.onload=f.onreadystatechange=function(){g||this.readyState&&"loaded"!=this.readyState&&"complete"!=this.readyState||(g=!0,c&&c(null),f.onload=f.onreadystatechange=null,"HEAD"==f.parentNode.tagName&&e.removeChild(f))};e.appendChild(f);window.setTimeout(function(){g||(g=!0,c&&c(Error("Script load timeout")))},d||5E3);return f}return null};function x(a,b){this.Y=a;this.ga=b};function y(a,b,c,d){this.c=null!=a?a:null;this.g=null!=b?b:null;this.D=null!=c?c:null;this.e=null!=d?d:null}var da=/^([0-9]+)(?:[\._-]([0-9]+))?(?:[\._-]([0-9]+))?(?:[\._+-]?(.*))?$/;y.prototype.compare=function(a){return this.c>a.c||this.c===a.c&&this.g>a.g||this.c===a.c&&this.g===a.g&&this.D>a.D?1:this.c<a.c||this.c===a.c&&this.g<a.g||this.c===a.c&&this.g===a.g&&this.D<a.D?-1:0};y.prototype.toString=function(){return[this.c,this.g||"",this.D||"",this.e||""].join("")};
function z(a){a=da.exec(a);var b=null,c=null,d=null,e=null;a&&(null!==a[1]&&a[1]&&(b=parseInt(a[1],10)),null!==a[2]&&a[2]&&(c=parseInt(a[2],10)),null!==a[3]&&a[3]&&(d=parseInt(a[3],10)),null!==a[4]&&a[4]&&(e=/^[0-9]+$/.test(a[4])?parseInt(a[4],10):a[4]));return new y(b,c,d,e)};function A(a,b,c,d,e,f,g,h){this.N=a;this.k=h}A.prototype.getName=function(){return this.N};function B(a){this.a=a}var ea=new A("Unknown",0,0,0,0,0,0,new x(!1,!1));
B.prototype.parse=function(){var a;if(-1!=this.a.indexOf("MSIE")||-1!=this.a.indexOf("Trident/")){a=C(this);var b=z(D(this)),c=null,d=E(this.a,/Trident\/([\d\w\.]+)/,1),c=-1!=this.a.indexOf("MSIE")?z(E(this.a,/MSIE ([\d\w\.]+)/,1)):z(E(this.a,/rv:([\d\w\.]+)/,1));""!=d&&z(d);a=new A("MSIE",0,0,0,0,0,0,new x("Windows"==a&&6<=c.c||"Windows Phone"==a&&8<=b.c,!1))}else if(-1!=this.a.indexOf("Opera"))a:if(a=z(E(this.a,/Presto\/([\d\w\.]+)/,1)),z(D(this)),null!==a.c||z(E(this.a,/rv:([^\)]+)/,1)),-1!=this.a.indexOf("Opera Mini/"))a=
z(E(this.a,/Opera Mini\/([\d\.]+)/,1)),a=new A("OperaMini",0,0,0,C(this),0,0,new x(!1,!1));else{if(-1!=this.a.indexOf("Version/")&&(a=z(E(this.a,/Version\/([\d\.]+)/,1)),null!==a.c)){a=new A("Opera",0,0,0,C(this),0,0,new x(10<=a.c,!1));break a}a=z(E(this.a,/Opera[\/ ]([\d\.]+)/,1));a=null!==a.c?new A("Opera",0,0,0,C(this),0,0,new x(10<=a.c,!1)):new A("Opera",0,0,0,C(this),0,0,new x(!1,!1))}else/OPR\/[\d.]+/.test(this.a)?a=F(this):/AppleWeb(K|k)it/.test(this.a)?a=F(this):-1!=this.a.indexOf("Gecko")?
(a="Unknown",b=new y,z(D(this)),b=!1,-1!=this.a.indexOf("Firefox")?(a="Firefox",b=z(E(this.a,/Firefox\/([\d\w\.]+)/,1)),b=3<=b.c&&5<=b.g):-1!=this.a.indexOf("Mozilla")&&(a="Mozilla"),c=z(E(this.a,/rv:([^\)]+)/,1)),b||(b=1<c.c||1==c.c&&9<c.g||1==c.c&&9==c.g&&2<=c.D),a=new A(a,0,0,0,C(this),0,0,new x(b,!1))):a=ea;return a};
function C(a){var b=E(a.a,/(iPod|iPad|iPhone|Android|Windows Phone|BB\d{2}|BlackBerry)/,1);if(""!=b)return/BB\d{2}/.test(b)&&(b="BlackBerry"),b;a=E(a.a,/(Linux|Mac_PowerPC|Macintosh|Windows|CrOS|PlayStation|CrKey)/,1);return""!=a?("Mac_PowerPC"==a?a="Macintosh":"PlayStation"==a&&(a="Linux"),a):"Unknown"}
function D(a){var b=E(a.a,/(OS X|Windows NT|Android) ([^;)]+)/,2);if(b||(b=E(a.a,/Windows Phone( OS)? ([^;)]+)/,2))||(b=E(a.a,/(iPhone )?OS ([\d_]+)/,2)))return b;if(b=E(a.a,/(?:Linux|CrOS|CrKey) ([^;)]+)/,1))for(var b=b.split(/\s/),c=0;c<b.length;c+=1)if(/^[\d\._]+$/.test(b[c]))return b[c];return(a=E(a.a,/(BB\d{2}|BlackBerry).*?Version\/([^\s]*)/,2))?a:"Unknown"}
function F(a){var b=C(a),c=z(D(a)),d=z(E(a.a,/AppleWeb(?:K|k)it\/([\d\.\+]+)/,1)),e="Unknown",f=new y,f="Unknown",g=!1;/OPR\/[\d.]+/.test(a.a)?e="Opera":-1!=a.a.indexOf("Chrome")||-1!=a.a.indexOf("CrMo")||-1!=a.a.indexOf("CriOS")?e="Chrome":/Silk\/\d/.test(a.a)?e="Silk":"BlackBerry"==b||"Android"==b?e="BuiltinBrowser":-1!=a.a.indexOf("PhantomJS")?e="PhantomJS":-1!=a.a.indexOf("Safari")?e="Safari":-1!=a.a.indexOf("AdobeAIR")?e="AdobeAIR":-1!=a.a.indexOf("PlayStation")&&(e="BuiltinBrowser");"BuiltinBrowser"==
e?f="Unknown":"Silk"==e?f=E(a.a,/Silk\/([\d\._]+)/,1):"Chrome"==e?f=E(a.a,/(Chrome|CrMo|CriOS)\/([\d\.]+)/,2):-1!=a.a.indexOf("Version/")?f=E(a.a,/Version\/([\d\.\w]+)/,1):"AdobeAIR"==e?f=E(a.a,/AdobeAIR\/([\d\.]+)/,1):"Opera"==e?f=E(a.a,/OPR\/([\d.]+)/,1):"PhantomJS"==e&&(f=E(a.a,/PhantomJS\/([\d.]+)/,1));f=z(f);g="AdobeAIR"==e?2<f.c||2==f.c&&5<=f.g:"BlackBerry"==b?10<=c.c:"Android"==b?2<c.c||2==c.c&&1<c.g:526<=d.c||525<=d.c&&13<=d.g;return new A(e,0,0,0,0,0,0,new x(g,536>d.c||536==d.c&&11>d.g))}
function E(a,b,c){return(a=a.match(b))&&a[c]?a[c]:""};function G(a){this.ma=a||"-"}G.prototype.e=function(a){for(var b=[],c=0;c<arguments.length;c++)b.push(arguments[c].replace(/[\W_]+/g,"").toLowerCase());return b.join(this.ma)};function H(a,b){this.N=a;this.Z=4;this.O="n";var c=(b||"n4").match(/^([nio])([1-9])$/i);c&&(this.O=c[1],this.Z=parseInt(c[2],10))}H.prototype.getName=function(){return this.N};function I(a){return a.O+a.Z}function ga(a){var b=4,c="n",d=null;a&&((d=a.match(/(normal|oblique|italic)/i))&&d[1]&&(c=d[1].substr(0,1).toLowerCase()),(d=a.match(/([1-9]00|normal|bold)/i))&&d[1]&&(/bold/i.test(d[1])?b=7:/[1-9]00/.test(d[1])&&(b=parseInt(d[1].substr(0,1),10))));return c+b};function ha(a,b){this.d=a;this.q=a.w.document.documentElement;this.Q=b;this.j="wf";this.h=new G("-");this.ha=!1!==b.events;this.F=!1!==b.classes}function J(a){if(a.F){var b=t(a.q,a.h.e(a.j,"active")),c=[],d=[a.h.e(a.j,"loading")];b||c.push(a.h.e(a.j,"inactive"));s(a.q,c,d)}K(a,"inactive")}function K(a,b,c){if(a.ha&&a.Q[b])if(c)a.Q[b](c.getName(),I(c));else a.Q[b]()};function ia(){this.C={}};function L(a,b){this.d=a;this.I=b;this.o=this.d.createElement("span",{"aria-hidden":"true"},this.I)}
function M(a,b){var c=a.o,d;d=[];for(var e=b.N.split(/,\s*/),f=0;f<e.length;f++){var g=e[f].replace(/['"]/g,"");-1==g.indexOf(" ")?d.push(g):d.push("'"+g+"'")}d=d.join(",");e="normal";"o"===b.O?e="oblique":"i"===b.O&&(e="italic");c.style.cssText="display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:"+d+";"+("font-style:"+e+";font-weight:"+(b.Z+"00")+";")}
function N(a){r(a.d,"body",a.o)}L.prototype.remove=function(){var a=this.o;a.parentNode&&a.parentNode.removeChild(a)};function O(a,b,c,d,e,f,g,h){this.$=a;this.ka=b;this.d=c;this.m=d;this.k=e;this.I=h||"BESbswy";this.v={};this.X=f||3E3;this.ca=g||null;this.H=this.u=this.t=null;this.t=new L(this.d,this.I);this.u=new L(this.d,this.I);this.H=new L(this.d,this.I);M(this.t,new H("serif",I(this.m)));M(this.u,new H("sans-serif",I(this.m)));M(this.H,new H("monospace",I(this.m)));N(this.t);N(this.u);N(this.H);this.v.serif=this.t.o.offsetWidth;this.v["sans-serif"]=this.u.o.offsetWidth;this.v.monospace=this.H.o.offsetWidth}
var P={sa:"serif",ra:"sans-serif",qa:"monospace"};O.prototype.start=function(){this.oa=n();M(this.t,new H(this.m.getName()+",serif",I(this.m)));M(this.u,new H(this.m.getName()+",sans-serif",I(this.m)));Q(this)};function R(a,b,c){for(var d in P)if(P.hasOwnProperty(d)&&b===a.v[P[d]]&&c===a.v[P[d]])return!0;return!1}
function Q(a){var b=a.t.o.offsetWidth,c=a.u.o.offsetWidth;b===a.v.serif&&c===a.v["sans-serif"]||a.k.ga&&R(a,b,c)?n()-a.oa>=a.X?a.k.ga&&R(a,b,c)&&(null===a.ca||a.ca.hasOwnProperty(a.m.getName()))?S(a,a.$):S(a,a.ka):ja(a):S(a,a.$)}function ja(a){setTimeout(k(function(){Q(this)},a),50)}function S(a,b){a.t.remove();a.u.remove();a.H.remove();b(a.m)};function T(a,b,c,d){this.d=b;this.A=c;this.S=0;this.ea=this.ba=!1;this.X=d;this.k=a.k}function ka(a,b,c,d,e){c=c||{};if(0===b.length&&e)J(a.A);else for(a.S+=b.length,e&&(a.ba=e),e=0;e<b.length;e++){var f=b[e],g=c[f.getName()],h=a.A,m=f;h.F&&s(h.q,[h.h.e(h.j,m.getName(),I(m).toString(),"loading")]);K(h,"fontloading",m);h=null;h=new O(k(a.ia,a),k(a.ja,a),a.d,f,a.k,a.X,d,g);h.start()}}
T.prototype.ia=function(a){var b=this.A;b.F&&s(b.q,[b.h.e(b.j,a.getName(),I(a).toString(),"active")],[b.h.e(b.j,a.getName(),I(a).toString(),"loading"),b.h.e(b.j,a.getName(),I(a).toString(),"inactive")]);K(b,"fontactive",a);this.ea=!0;la(this)};
T.prototype.ja=function(a){var b=this.A;if(b.F){var c=t(b.q,b.h.e(b.j,a.getName(),I(a).toString(),"active")),d=[],e=[b.h.e(b.j,a.getName(),I(a).toString(),"loading")];c||d.push(b.h.e(b.j,a.getName(),I(a).toString(),"inactive"));s(b.q,d,e)}K(b,"fontinactive",a);la(this)};function la(a){0==--a.S&&a.ba&&(a.ea?(a=a.A,a.F&&s(a.q,[a.h.e(a.j,"active")],[a.h.e(a.j,"loading"),a.h.e(a.j,"inactive")]),K(a,"active")):J(a.A))};function U(a){this.K=a;this.B=new ia;this.pa=new B(a.navigator.userAgent);this.a=this.pa.parse();this.U=this.V=0;this.R=this.T=!0}
U.prototype.load=function(a){this.d=new q(this.K,a.context||this.K);this.T=!1!==a.events;this.R=!1!==a.classes;var b=new ha(this.d,a),c=[],d=a.timeout;b.F&&s(b.q,[b.h.e(b.j,"loading")]);K(b,"loading");var c=this.B,e=this.d,f=[],g;for(g in a)if(a.hasOwnProperty(g)){var h=c.C[g];h&&f.push(h(a[g],e))}c=f;this.U=this.V=c.length;a=new T(this.a,this.d,b,d);d=0;for(g=c.length;d<g;d++)e=c[d],e.L(this.a,k(this.la,this,e,b,a))};
U.prototype.la=function(a,b,c,d){var e=this;d?a.load(function(a,b,d){ma(e,c,a,b,d)}):(a=0==--this.V,this.U--,a&&0==this.U?J(b):(this.R||this.T)&&ka(c,[],{},null,a))};function ma(a,b,c,d,e){var f=0==--a.V;(a.R||a.T)&&setTimeout(function(){ka(b,c,d||null,e||null,f)},0)};function na(a,b,c){this.P=a?a:b+oa;this.s=[];this.W=[];this.fa=c||""}var oa="//fonts.googleapis.com/css";na.prototype.e=function(){if(0==this.s.length)throw Error("No fonts to load!");if(-1!=this.P.indexOf("kit="))return this.P;for(var a=this.s.length,b=[],c=0;c<a;c++)b.push(this.s[c].replace(/ /g,"+"));a=this.P+"?family="+b.join("%7C");0<this.W.length&&(a+="&subset="+this.W.join(","));0<this.fa.length&&(a+="&text="+encodeURIComponent(this.fa));return a};function pa(a){this.s=a;this.da=[];this.M={}}
var qa={latin:"BESbswy",cyrillic:"&#1081;&#1103;&#1046;",greek:"&#945;&#946;&#931;",khmer:"&#x1780;&#x1781;&#x1782;",Hanuman:"&#x1780;&#x1781;&#x1782;"},ra={thin:"1",extralight:"2","extra-light":"2",ultralight:"2","ultra-light":"2",light:"3",regular:"4",book:"4",medium:"5","semi-bold":"6",semibold:"6","demi-bold":"6",demibold:"6",bold:"7","extra-bold":"8",extrabold:"8","ultra-bold":"8",ultrabold:"8",black:"9",heavy:"9",l:"3",r:"4",b:"7"},sa={i:"i",italic:"i",n:"n",normal:"n"},ta=/^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
pa.prototype.parse=function(){for(var a=this.s.length,b=0;b<a;b++){var c=this.s[b].split(":"),d=c[0].replace(/\+/g," "),e=["n4"];if(2<=c.length){var f;var g=c[1];f=[];if(g)for(var g=g.split(","),h=g.length,m=0;m<h;m++){var l;l=g[m];if(l.match(/^[\w-]+$/)){l=ta.exec(l.toLowerCase());var p=void 0;if(null==l)p="";else{p=void 0;p=l[1];if(null==p||""==p)p="4";else var fa=ra[p],p=fa?fa:isNaN(p)?"4":p.substr(0,1);l=l[2];p=[null==l||""==l?"n":sa[l],p].join("")}l=p}else l="";l&&f.push(l)}0<f.length&&(e=f);
3==c.length&&(c=c[2],f=[],c=c?c.split(","):f,0<c.length&&(c=qa[c[0]])&&(this.M[d]=c))}this.M[d]||(c=qa[d])&&(this.M[d]=c);for(c=0;c<e.length;c+=1)this.da.push(new H(d,e[c]))}};function V(a,b){this.a=(new B(navigator.userAgent)).parse();this.d=a;this.f=b}var ua={Arimo:!0,Cousine:!0,Tinos:!0};V.prototype.L=function(a,b){b(a.k.Y)};V.prototype.load=function(a){var b=this.d;"MSIE"==this.a.getName()&&1!=this.f.blocking?ca(b,k(this.aa,this,a)):this.aa(a)};
V.prototype.aa=function(a){for(var b=this.d,c=new na(this.f.api,u(b),this.f.text),d=this.f.families,e=d.length,f=0;f<e;f++){var g=d[f].split(":");3==g.length&&c.W.push(g.pop());var h="";2==g.length&&""!=g[1]&&(h=":");c.s.push(g.join(h))}d=new pa(d);d.parse();v(b,c.e());a(d.da,d.M,ua)};function W(a,b){this.d=a;this.f=b;this.p=[]}W.prototype.J=function(a){var b=this.d;return u(this.d)+(this.f.api||"//f.fontdeck.com/s/css/js/")+(b.w.location.hostname||b.K.location.hostname)+"/"+a+".js"};
W.prototype.L=function(a,b){var c=this.f.id,d=this.d.w,e=this;c?(d.__webfontfontdeckmodule__||(d.__webfontfontdeckmodule__={}),d.__webfontfontdeckmodule__[c]=function(a,c){for(var d=0,m=c.fonts.length;d<m;++d){var l=c.fonts[d];e.p.push(new H(l.name,ga("font-weight:"+l.weight+";font-style:"+l.style)))}b(a)},w(this.d,this.J(c),function(a){a&&b(!1)})):b(!1)};W.prototype.load=function(a){a(this.p)};function X(a,b){this.d=a;this.f=b;this.p=[]}X.prototype.J=function(a){var b=u(this.d);return(this.f.api||b+"//use.typekit.net")+"/"+a+".js"};X.prototype.L=function(a,b){var c=this.f.id,d=this.d.w,e=this;c?w(this.d,this.J(c),function(a){if(a)b(!1);else{if(d.Typekit&&d.Typekit.config&&d.Typekit.config.fn){a=d.Typekit.config.fn;for(var c=0;c<a.length;c+=2)for(var h=a[c],m=a[c+1],l=0;l<m.length;l++)e.p.push(new H(h,m[l]));try{d.Typekit.load({events:!1,classes:!1})}catch(p){}}b(!0)}},2E3):b(!1)};
X.prototype.load=function(a){a(this.p)};function Y(a,b){this.d=a;this.f=b;this.p=[]}Y.prototype.L=function(a,b){var c=this,d=c.f.projectId,e=c.f.version;if(d){var f=c.d.w;w(this.d,c.J(d,e),function(e){if(e)b(!1);else{if(f["__mti_fntLst"+d]&&(e=f["__mti_fntLst"+d]()))for(var h=0;h<e.length;h++)c.p.push(new H(e[h].fontfamily));b(a.k.Y)}}).id="__MonotypeAPIScript__"+d}else b(!1)};Y.prototype.J=function(a,b){var c=u(this.d),d=(this.f.api||"fast.fonts.net/jsapi").replace(/^.*http(s?):(\/\/)?/,"");return c+"//"+d+"/"+a+".js"+(b?"?v="+b:"")};
Y.prototype.load=function(a){a(this.p)};function Z(a,b){this.d=a;this.f=b}Z.prototype.load=function(a){var b,c,d=this.f.urls||[],e=this.f.families||[],f=this.f.testStrings||{};b=0;for(c=d.length;b<c;b++)v(this.d,d[b]);d=[];b=0;for(c=e.length;b<c;b++){var g=e[b].split(":");if(g[1])for(var h=g[1].split(","),m=0;m<h.length;m+=1)d.push(new H(g[0],h[m]));else d.push(new H(g[0]))}a(d,f)};Z.prototype.L=function(a,b){return b(a.k.Y)};var $=new U(this);$.B.C.custom=function(a,b){return new Z(b,a)};$.B.C.fontdeck=function(a,b){return new W(b,a)};$.B.C.monotype=function(a,b){return new Y(b,a)};$.B.C.typekit=function(a,b){return new X(b,a)};$.B.C.google=function(a,b){return new V(b,a)};this.WebFont||(this.WebFont={},this.WebFont.load=k($.load,$),this.WebFontConfig&&$.load(this.WebFontConfig));})(this,document);


//change fabricjs cursormap
//fabric.Canvas.prototype.cursorMap = ['default', 'default', 'default', 'se-resize', 'default', 'pointer', 'default', 'copy'];



//----------------------------------
// ------- Fabric.js Methods ----------
//----------------------------------


fabric.Object.prototype._drawControl = function(control, ctx, methodName, left, top) {

	var size = this.cornerSize,
		iconOffset = 4,
		iconSize = size - (iconOffset*2),
		offset = (size*.5),
		offsetCorner = 10;

	offset = offsetCorner = 0;

	this._fpdOffset = offset;
	this._fpdOffsetCorner = offsetCorner;

	if (this.isControlVisible(control)) {

		var wh = this._calculateCurrentDimensions(),
          	width = wh.x;

		var icon = false;
		if (control == 'br' || control == 'mtr' || control == 'tl' || control == 'bl') {
			switch (control) {

				case 'tl': //copy
					left = left - offset + offsetCorner;
					top = top  - offset + offsetCorner;
					icon = this.__editorMode || this.copyable ? String.fromCharCode('0xe623') : false;
					break;
				case 'mtr': // rotate
					left = left + (width/2) + offset - offsetCorner;
					top = top  - offset + offsetCorner;
					icon = this.__editorMode || this.rotatable ? String.fromCharCode('0xe923') : false;
					break;
				case 'br': // resize
					left = left + offset - offsetCorner;
					top = top  + offset - offsetCorner;
					icon = this.__editorMode || this.resizable ? String.fromCharCode('0xe922') : false;
					break;
				case 'bl': //remove
					left = left - offset + offsetCorner;
					top = top + offset - offsetCorner;
					icon = this.__editorMode || this.removable ? String.fromCharCode('0xe926') : false;
					break;
			}

		}

		this.transparentCorners || ctx.clearRect(left, top, size, size);
		if (icon !== false) {
			ctx.fillStyle = this.cornerColor;
			ctx.fillRect(left, top, size, size);
			ctx.font = iconSize+'px FontFPD';
			ctx.fillStyle = this.cornerIconColor;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText(icon, left+iconOffset, top+iconOffset);
			ctx[methodName](left, top, size, size);
		}
	}
};

fabric.Object.prototype.findTargetCorner = function(pointer) {
	if (!this.hasControls || !this.active) {
        return false;
      }

      var ex = pointer.x,
          ey = pointer.y,
          xPoints,
          lines;
      this.__corner = 0;
      for (var i in this.oCoords) {

        if (!this.isControlVisible(i)) {
          continue;
        }

        if (i === 'mtr' && !this.hasRotatingPoint) {
          continue;
        }

        if (this.get('lockUniScaling') &&
           (i === 'mt' || i === 'mr' || i === 'mb' || i === 'ml')) {
          continue;
        }

        lines = this._getImageLines(this.oCoords[i].corner);

		//FPD: target corner not working when canvas has zoom greater than 1
        var zoom = this.canvas.getZoom() ? this.canvas.getZoom() : 1;

        xPoints = this._findCrossPoints({ x: ex*zoom, y: ey*zoom }, lines);
        if (xPoints !== 0 && xPoints % 2 === 1) {
          this.__corner = i;
          return i;
        }
      }
      return false;
};

fabric.Object.prototype.setCoords = function() {

	var theta = fabric.util.degreesToRadians(this.angle),
		vpt = this.getViewportTransform(),
		dim = this._calculateCurrentDimensions(),
		//FPD: Set cursor offset
		fpdOffset = this._fpdOffset ? this._fpdOffset : 0,
		fpdOffsetCorner = this._fpdOffsetCorner ? this._fpdOffsetCorner : 0,
		fpdOffset = fpdOffsetCorner = 0,
		currentWidth = dim.x+(fpdOffset-fpdOffsetCorner)*2, currentHeight = dim.y+(fpdOffset-fpdOffsetCorner)*2;

	// If width is negative, make postive. Fixes path selection issue
	if (currentWidth < 0) {
		currentWidth = Math.abs(currentWidth);
	}

	var sinTh = Math.sin(theta),
		cosTh = Math.cos(theta),
		_angle = currentWidth > 0 ? Math.atan(currentHeight / currentWidth) : 0,
		_hypotenuse = (currentWidth / Math.cos(_angle)) / 2,
		offsetX = Math.cos(_angle + theta) * _hypotenuse,
		offsetY = Math.sin(_angle + theta) * _hypotenuse,


	// offset added for rotate and scale actions
	coords = fabric.util.transformPoint(this.getCenterPoint(), vpt),
	tl  = new fabric.Point(coords.x - offsetX, coords.y - offsetY),
	tr  = new fabric.Point(tl.x + (currentWidth * cosTh), tl.y + (currentWidth * sinTh)),
	bl  = new fabric.Point(tl.x - (currentHeight * sinTh), tl.y + (currentHeight * cosTh)),
	br  = new fabric.Point(coords.x + offsetX, coords.y + offsetY),
	ml  = new fabric.Point((tl.x + bl.x)/2, (tl.y + bl.y)/2),
	mt  = new fabric.Point((tr.x + tl.x)/2, (tr.y + tl.y)/2),
	mr  = new fabric.Point((br.x + tr.x)/2, (br.y + tr.y)/2),
	mb  = new fabric.Point((br.x + bl.x)/2, (br.y + bl.y)/2),
	mtr = new fabric.Point(tr.x + sinTh * this.rotatingPointOffset, tr.y - cosTh * this.rotatingPointOffset); //FPD: Adjust calculation for top/right position

	this.oCoords = {
		// corners
		tl: tl, tr: tr, br: br, bl: bl,
		// middle
		ml: ml, mt: mt, mr: mr, mb: mb,
		// rotating point
		mtr: mtr
	};

	// set coordinates of the draggable boxes in the corners used to scale/rotate the image
	this._setCornerCoords && this._setCornerCoords();

	return this;
 };

fabric.Canvas.prototype._getRotatedCornerCursor = function(corner, target, e) {
  var n = Math.round((target.getAngle() % 360) / 45);

  //FPD: add CursorOffset
   var cursorOffset = {
    mt: 0, // n
    tr: 1, // ne
    mr: 2, // e
    br: 3, // se
    mb: 4, // s
    bl: 5, // sw
    ml: 6, // w
    tl: 7 // nw
  };

  if (n < 0) {
    n += 8; // full circle ahead
  }
  n += cursorOffset[corner];
  //FPD: uncomment for older version of fabricjs
  /*if (e.shiftKey && cursorOffset[corner] % 2 === 0) {
    //if we are holding shift and we are on a mx corner...
    n += 2;
  }*/
  // normalize n to be from 0 to 7
  n %= 8;

  //FPD: set cursor for copy and remove
  switch(corner) {
	  case 'tl':
	  	return target.copyable ? 'copy' : 'default';
	  break;
	  case 'bl':
	  	return 'pointer';
	  break;
  }
  return this.cursorMap[n];
}

/**
 * A class with some static helper functions. You do not need to initiate the class, just call the methods directly, e.g. FPDUtil.isIE();
 *
 * @class FPDUtil
 */
var FPDUtil =  {

	/**
	 * Checks if browser is IE and return version number.
	 *
	 * @method isIE
	 * @return {Boolean} Returns true if browser is IE.
	 * @static
	 */
	isIE : function() {

		var myNav = navigator.userAgent.toLowerCase();
		return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : false;

	},

	/**
	 * Resets the key names of the deprecated keys.
	 *
	 * @method rekeyDeprecatedKeys
	 * @param {Object} object An object containing element parameters.
	 * @return {Object} Returns the edited object.
	 * @static
	 */
	rekeyDeprecatedKeys : function(object) {

		var depractedKeys = [
			{old: 'x', replace: 'left'},
			{old: 'y', replace: 'top'},
			{old: 'degree', replace: 'angle'},
			{old: 'currentColor', replace: 'fill'},
			{old: 'filters', replace: 'availableFilters'},
			{old: 'textSize', replace: 'fontSize'},
			{old: 'font', replace: 'fontFamily'},
			{old: 'scale', replace: ['scaleX', 'scaleY']},
		];

		for(var i=0; i < depractedKeys.length; ++i) {
			if(object.hasOwnProperty(depractedKeys[i].old) && !object.hasOwnProperty(depractedKeys[i].replace)) {

				var replaceObj = depractedKeys[i].replace;
				//this.log('FPD 4.0.0: Parameter "'+depractedKeys[i].old+'" is depracted. Please use "'+replaceObj.toString()+'" instead!', 'warn');

				if(typeof replaceObj === 'object') { //check if old needs to be replaced with multiple options, e.g. scale=>scaleX,scaleY

					for(var j=0; j < replaceObj.length; ++j) {
						object[replaceObj[j]] = object[depractedKeys[i].old];
					}

				}
				else {
					object[depractedKeys[i].replace] = object[depractedKeys[i].old];
				}

				delete object[depractedKeys[i].old];
			}
		}

		return object;

	},

	/**
	 * Writes a message in the console.
	 *
	 * @method log
	 * @param {String} message The text that will be displayed in the console.
	 * @param {String} [type=log] The output type - info, error, warn or log.
	 * @static
	 */
	log : function(message, type) {

		if(typeof console === 'undefined') { return false; }

		if(type === 'info') {
			console.info(message);
		}
		else if (type === 'error') {
			console.error(message);
		}
		else if (type === 'warn') {
			console.warn(message);
		}
		else {
			console.log(message);
		}

	},

	/**
	 * Checks if a string is an URL.
	 *
	 * @method isUrl
	 * @param {String} s The string.
	 * @return {Boolean} Returns true if string is an URL.
	 * @static
	 */
	isUrl : function(s) {

		var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
		return regexp.test(s);

	},

	/**
	 * Removes an element from an array by value.
	 *
	 * @method removeFromArray
	 * @param {Array} array The target array.
	 * @param {String} element The element value.
	 * @return {Array} Returns the edited array.
	 * @static
	 */
	removeFromArray : function(array, element) {

	    var index = array.indexOf(element);
	    if (index > -1) {
		    array.splice(index, 1);
		}

		return array;

	},

	/**
	 * Checks if a string is XML formatted.
	 *
	 * @method isXML
	 * @param {String} string The target string.
	 * @return {Boolean} Returns true if string is XML formatted.
	 * @static
	 */
	isXML : function(string){

	    try {
	        xmlDoc = jQuery.parseXML(string); //is valid XML
	        return true;
	    } catch (err) {
	        // was not XML
	        return false;
	    }

	},

	/**
	 * Checks if an image can be colorized and returns the image type
	 *
	 * @method elementIsColorizable
	 * @param {fabric.Object} element The target element.
	 * @return {String | Boolean} Returns the element type(text, dataurl, png or svg) or false if the element can not be colorized.
	 * @static
	 */
	elementIsColorizable : function(element) {

		if(this.getType(element.type) === 'text') {
			return 'text';
		}

		//check if url is a png or base64 encoded
		var imageParts = element.source.split('.');
		//its base64 encoded
		if(imageParts.length == 1) {

			//check if dataurl is png
			if(imageParts[0].search('data:image/png;') == -1) {
				element.fill = element.colors = false;
				return false;
			}
			else {
				return 'dataurl';
			}

		}
		//its a url
		else {

			var source = element.source;
			source = source.split('?')[0];//remove all url parameters
			imageParts = source.split('.');

			//only png and svg are colorizable
			if($.inArray('png', imageParts) == -1 && $.inArray('svg', imageParts) == -1) {
				element.fill = element.colors = false;
				return false;
			}
			else {
				if($.inArray('svg', imageParts) == -1) {
					return 'png';
				}
				else {
					return 'svg';
				}
			}

		}

	},

	/**
	 * Returns a simpler type of a fabric object.
	 *
	 * @method getType
	 * @param {String} fabricType The fabricjs type.
	 * @return {String} This could be image or text.
	 * @static
	 */
	getType : function(fabricType) {

		if(fabricType === 'text' || fabricType === 'i-text' || fabricType === 'curvedText') {
			return 'text';
		}
		else {
			return 'image';
		}

	},

	/**
	 * Looks for the .fpd-tooltip classes and adds a nice tooltip to these elements (tooltipster).
	 *
	 * @method updateTooltip
	 * @param {jQuery} [$container] The container to look in. If not set, the whole document will be searched.
	 * @static
	 */
	updateTooltip : function($container) {

		$tooltips = $container ? $container.find('.fpd-tooltip') : $('.fpd-tooltip');

		$tooltips.each(function(i, tooltip) {

			var $tooltip = $(tooltip);
			if($tooltip.hasClass('tooltipstered')) {
				$tooltip.tooltipster('reposition');
			}
			else {
				$tooltip.tooltipster({
					offsetY: 0,
					position: 'bottom',
					theme: '.fpd-tooltip-theme',
					touchDevices: false
				});
			}

		});

	},

	/**
	 * Makes an unique array.
	 *
	 * @method arrayUnique
	 * @param {Array} array The target array.
	 * @return {Array} Returns the edited array.
	 * @static
	 */
	arrayUnique : function(array) {

	    var a = array.concat();
	    for(var i=0; i<a.length; ++i) {
	        for(var j=i+1; j<a.length; ++j) {
	            if(a[i] === a[j])
	                a.splice(j--, 1);
	        }
	    }

	    return a;
	},

	/**
	 * Creates a nice scrollbar for an element.
	 *
	 * @method createScrollbar
	 * @param {jQuery} target The target element.
	 * @static
	 */
	createScrollbar : function($target) {

		if($target.hasClass('mCustomScrollbar')) {
			$target.mCustomScrollbar('scrollTo', 0);
		}
		else {
			$target.mCustomScrollbar({
				scrollbarPosition: 'outside',
				autoExpandScrollbar: true,
				autoHideScrollbar: true,
				scrollInertia: 200,
				axis: 'y',
				callbacks: {
					onTotalScrollOffset: 100,
					onTotalScroll:function() {
						$(this).trigger('_sbOnTotalScroll');
						FPDUtil.refreshLazyLoad($(this).find('.fpd-grid'), true);
					}
				}
			});
		}

	},

	/**
	 * Checks if a value is not empty. 0 is allowed.
	 *
	 * @method notEmpty
	 * @param {NUmber | String} value The target value.
	 * @return {Array} Returns true if not empty.
	 * @static
	 */
	notEmpty : function(value) {

		if(value === undefined || value === false || value.length === 0) {
			return false;
		}
		return true;

	},

	/**
	 * Opens the modal box with an own message.
	 *
	 * @method showModal
	 * @param {String} message The message you would like to display in the modal box.
	 * @return {jQuery} Returns a jQuery object containing the modal.
	 * @static
	 */
	showModal : function(htmlMessage, fullscreen, type) {

		type = type === undefined ? '' : type;

		var $body = $('body').addClass('fpd-overflow-hidden'),
			fullscreenCSS = fullscreen ? 'fpd-fullscreen' : '';
			html = '<div class="fpd-modal-internal fpd-modal-overlay"><div class="fpd-modal-wrapper fpd-shadow-3"><div class="fpd-modal-close"><span class="fpd-icon-close"></span></div><div class="fpd-modal-content"></div></div></div>';

		if($('.fpd-modal-internal').size() === 0) {

			$body.append(html)
			.children('.fpd-modal-internal:first').click(function(evt) {

				$target = $(evt.target);
				if($target.hasClass('fpd-modal-overlay')) {

					$target.find('.fpd-modal-close').click();

				}

			});

		}

		if(type === 'prompt') {
			htmlMessage = '<input placeholder="'+htmlMessage+'" /><span class="fpd-btn"></span>';
		}

		$body.children('.fpd-modal-internal').attr('data-type', type).removeClass('fpd-fullscreen').addClass(fullscreenCSS)
		.fadeIn(300).find('.fpd-modal-content').html(htmlMessage);

		return $body.children('.fpd-modal-internal');

	},

	/**
	 * Shows a message in the snackbar.
	 *
	 * @method showMessage
	 * @param {String} text The text for the message.
	 * @static
	 */
	showMessage : function(text) {

		var $body = $('body'),
			$snackbar;

		if($body.children('.fpd-snackbar-internal').size() > 0) {
			$snackbar = $body.children('.fpd-snackbar');
		}
		else {
			$snackbar = $body.append('<div class="fpd-snackbar-internal fpd-snackbar fpd-shadow-1"><p></p></div>').children('.fpd-snackbar-internal');
		}

		$snackbar.removeClass('fpd-show-up').children('p').html(text).parent().addClass('fpd-show-up');

		setTimeout(function() {
			$snackbar.removeClass('fpd-show-up');
		}, 5000);

	},

	/**
	 * Adds a preloader icon to loading picture and loads the image.
	 *
	 * @method loadGridImage
	 * @param {jQuery} picture The image container.
	 * @param {String} source The image URL.
	 * @static
	 */
	loadGridImage : function($picture, source) {

		if($picture.size() > 0 && source) {

			$picture.addClass('fpd-on-loading');
			var image = new Image();
			image.src = source;
			image.onload = function() {
				$picture.attr('data-img', '').removeClass('fpd-on-loading').fadeOut(0)
				.stop().fadeIn(200).css('background-image', 'url("'+this.src+'")');
			};

		}

	},

	//
	/**
	 * Refreshs the items using lazy load.
	 *
	 * @method refreshLazyLoad
	 * @param {jQuery} container The container.
	 * @param {Boolean} loadByCounter If true 15 images will be loaded at once. If false all images will be loaded in the container.
	 * @static
	 */
	refreshLazyLoad : function($container, loadByCounter) {

		if($container && $container.size() > 0 && $container.is(':visible')) {

			var $item = $container.children('.fpd-item.fpd-hidden:first'),
				counter = 0,
				amount = loadByCounter ? 15 : 0;
			while((counter < amount || $container.parent('.mCSB_container').height()-150 < $container.parents('.fpd-scroll-area:first').height()) && $item.size() > 0) {
				var $pic = $item.children('picture');
				$item.removeClass('fpd-hidden');
				FPDUtil.loadGridImage($pic, $pic.data('img'));
				$item = $item.next('.fpd-item.fpd-hidden');
				counter++;
			}

		}

	},

	/**
	 * Parses the fabricjs options to a FPD options object.
	 *
	 * @method parseFabricObjectToFPDElement
	 * @param {Object} object The target fabricjs object.
	 * @return {Object} Returns the FPD object.
	 * @static
	 */
	parseFabricObjectToFPDElement : function(object) {

		if(!object) { return {}; }

		var options = new FancyProductDesignerOptions(),
			properties = Object.keys(options.defaults.elementParameters),
			additionalKeys  = FPDUtil.getType(object.type) === 'text' ? Object.keys(options.defaults.textParameters) : Object.keys(options.defaults.imageParameters);

		properties = $.merge(properties, additionalKeys);

		var parameters = {};
		for(var i=0; i < properties.length; ++i) {
			var prop = properties[i];
			if(object[prop] !== undefined) {
				parameters[prop] = object[prop];
			}

		}

		return {
			type: FPDUtil.getType(object.type), //type
			source: object.source, //source
			title: object.title,  //title
			parameters: parameters  //parameters
		};

	},

	/**
	 * If pop-up blocker is enabled, the user will get a notification modal.
	 *
	 * @method popupBlockerAlert
	 * @param {window} popup The target popup window.
	 * @static
	 */
	popupBlockerAlert : function(popup) {

		if (popup == null || typeof(popup)=='undefined') {
			FPDUtil.showModal('Please disable your pop-up blocker and try again.');
		}

	},

	/**
	 * Returns the scale value calculated with the passed image dimensions and the defined "resize-to" dimensions.
	 *
	 * @method getScalingByDimesions
	 * @param {Number} imgW The width of the image.
	 * @param {Number} imgH The height of the image.
	 * @param {Number} resizeToW The maximum width for the image.
	 * @param {Number} resizeToH The maximum height for the image.
	 * @return {Number} The scale value to resize an image to a desired dimension.
	  * @static
	 */
	getScalingByDimesions : function(imgW, imgH, resizeToW, resizeToH, mode) {

		mode = typeof mode === 'undefined' ? 'fit' : mode;

		var scaling = 1;

		if(mode === 'cover') {

			if(imgW < imgH) {
				if(imgW > resizeToW) { scaling = resizeToW / imgW; }
			}
			else if (imgW == imgH) {
			 	if(resizeToW > resizeToH) { scaling = resizeToW / imgW}
			 	else { scaling = resizeToH / imgH}
			}
			else {
				if(imgH > resizeToH) { scaling = resizeToH / imgH; }
			}

		}
		else {

			if(imgW > imgH) {
				if(imgW > resizeToW) { scaling = resizeToW / imgW; }
				if(scaling * imgH > resizeToH) { scaling = resizeToH / imgH; }
			}
			else {
				if(imgH > resizeToH) { scaling = resizeToH / imgH; }
				if(scaling * imgW > resizeToW) { scaling = resizeToW / imgW; }
			}

		}


		return parseFloat(scaling.toFixed(2));

	},

	/**
	 * Checks if the browser local storage is available.
	 *
	 * @method localStorageAvailable
	 * @return {Boolean} Returns true if local storage is available.
	 * @static
	 */
	localStorageAvailable : function() {

		localStorageAvailable = true;
		//execute this because of a ff issue with localstorage
		try {
			window.localStorage.length;
			window.localStorage.setItem('fpd-storage', 'just-testing');
			//window.localStorage.clear();
		}
		catch(error) {
			localStorageAvailable = false;
			//In Safari, the most common cause of this is using "Private Browsing Mode". You are not able to save products in your browser.
		}

		return localStorageAvailable;

	},

	/**
	 * Checks if the dimensions of an image is within the allowed range set in the customImageParameters of the view options.
	 *
	 * @method checkImageDimensions
	 * @param {FancyProductDesigner} fpdInstance Instance of FancyProductDesigner.
	 * @param {Number} imageW The image width.
	 * @param {Number} imageH The image height.
	 * @return {Array} Returns true if image dimension is within allowed range(minW, minH, maxW, maxH).
	 * @static
	 */
	checkImageDimensions : function(fpdInstance, imageW, imageH) {

		var currentCustomImageParameters = fpdInstance.currentViewInstance.options.customImageParameters;

		if(imageW > currentCustomImageParameters.maxW ||
		imageW < currentCustomImageParameters.minW ||
		imageH > currentCustomImageParameters.maxH ||
		imageH < currentCustomImageParameters.minH) {

			var msg = fpdInstance.getTranslation('misc', 'uploaded_image_size_alert')
					  .replace('%minW', currentCustomImageParameters.minW)
					  .replace('%minH', currentCustomImageParameters.minH)
					  .replace('%maxW', currentCustomImageParameters.maxW)
					  .replace('%maxH', currentCustomImageParameters.maxH);

			FPDUtil.showModal(msg);
			return false;

		}
		else {
			return true;
		}

	},

	/**
	 * Checks if an element has a color selection.
	 *
	 * @method elementHasColorSelection
	 * @param {fabric.Object} element The target element.
	 * @return {Boolean} Returns true if element has colors.
	 * @static
	 */
	elementHasColorSelection : function(element) {

		return (Array.isArray(element.colors) || Boolean(element.colors) || element.colorLinkGroup) && FPDUtil.elementIsColorizable(element) !== false;

	},

	/**
	 * Returns the available colors of an element.
	 *
	 * @method elementAvailableColors
	 * @param {fabric.Object} element The target element.
	 * @param {FancyProductDesigner} fpdInstance Instance of FancyProductDesigner.
	 * @return {Array} Available colors.
	 * @static
	 */
	elementAvailableColors : function(element, fpdInstance) {

		var availableColors = [];
		if(element.type == 'path-group') {

			availableColors = [];
			for(var i=0; i<element.paths.length; ++i) {
				var path = element.paths[i],
					color = tinycolor(path.fill);
				availableColors.push(color.toHexString());
			}

		}
		else if(element.colorLinkGroup) {
			availableColors = fpdInstance.colorLinkGroups[element.colorLinkGroup].colors;
		}
		else {
			availableColors = element.colors;
		}

		return availableColors;

	},

	/**
	 * Changes a single path color by index.
	 *
	 * @method changePathColor
	 * @param {fabric.Object} element The target element.
	 * @param {Number} index The path index.
	 * @param {String} color Hexadecimal color value.
	 * @return {Array} All colors used in the SVG.
	 * @static
	 */
	changePathColor : function(element, index, color) {

		var svgColors = [];

		for(var i=0; i<element.paths.length; ++i) {

			var path = element.paths[i],
				c = tinycolor(path.fill);

			svgColors.push(c.toHexString());
		}

		svgColors[index] = color.toHexString();

		return svgColors;

	},

	/**
	 * Checks if a string is a valid hexadecimal color value.
	 *
	 * @method isHex
	 * @param {String} value The target value.
	 * @return {Boolean} Returns true if value is a valid hexadecimal color.
	 * @static
	 */
	isHex : function(value) {
		return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value);
	},

};

/**
 * The class defining the default options for Fancy Product Designer.
 *
 * @class FancyProductDesignerOptions
 */
var FancyProductDesignerOptions = function() {

	/**
	 * The default options. See: {{#crossLink "FancyProductDesignerOptions.defaults"}}{{/crossLink}}
	 *
	 * @property defaults
	 * @for FancyProductDesignerOptions
	 * @type {Object}
	 */
	this.defaults = {
	    /**
		* The stage(canvas) width for the product designer.
		*
		* @property stageWidth
		* @for FancyProductDesignerOptions.defaults
		* @type {Number}
		* @default "900"
		*/
		stageWidth: 900,
		/**
		* The stage(canvas) height for the product designer.
		*
		* @property stageHeight
		* @for FancyProductDesignerOptions.defaults
		* @type {Number}
		* @default "600"
		*/
		stageHeight: 600,
		/**
		* Enables the editor mode, which will add a helper box underneath the product designer with some options of the current selected element.
		*
		* @property editorMode
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default false
		*/
		editorMode: false,
		/**
		* The properties that will be displayed in the editor box when an element is selected.
		*
		* @property editorBoxParameters
		* @for FancyProductDesignerOptions.defaults
		* @type {Array}
		* @default ['left', 'top', 'angle', 'fill', 'width', 'height', 'fontSize', 'price']
		*/
		editorBoxParameters: ['left', 'top', 'angle', 'fill', 'width', 'height', 'fontSize', 'price'],
		/**
		* An array containing all available fonts.
		*
		* @property fonts
		* @for FancyProductDesignerOptions.defaults
		* @type {Aarray}
		* @default ['Arial', 'Helvetica', 'Times New Roman', 'Verdana', 'Geneva']
		*/
		fonts: ['Arial', 'Helvetica', 'Times New Roman', 'Verdana', 'Geneva'],
		/**
		* The directory path that contains the templates.
		*
		* @property templatesDirectory
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default 'templates/'
		*/
		templatesDirectory: 'html/',
		/**
		* An array with image URLs that are used for text patterns.
		*
		* @property patterns
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default []
		*/
		patterns: [],
		/**
		* To add photos from Facebook, you have to set your own Facebook API key.
		*
		* @property facebookAppId
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default ''
		*/
		facebookAppId: '',
		/**
		* To add photos from Instagram, you have to set an <a href="http://instagram.com/developer/" target="_blank">Instagram client ID</a>.
		*
		* @property instagramClientId
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default ''
		*/
		instagramClientId: '', //the instagram client ID -
		/**
		* This URI to the php/instagram-auth.php. You have to update this option if you are using a different folder structure.
		*
		* @property instagramRedirectUri
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default ''
		*/
		instagramRedirectUri: '',
		/**
		* The zoom step when using the UI slider to change the zoom level.
		*
		* @property zoomStep
		* @for FancyProductDesignerOptions.defaults
		* @type {Number}
		* @default 0.2
		*/
		zoomStep: 0.2,
		/**
		* The maximal zoom factor. Set it to 1 to hide the zoom feature in the user interface.
		*
		* @property maxZoom
		* @for FancyProductDesignerOptions.defaults
		* @type {Number}
		* @default 3
		*/
		maxZoom: 3,
		/**
		* Set custom names for your hexdecimal colors. key=hexcode without #, value: name of the color.
		*
		* @property hexNames
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		* @default {}
		* @example hexNames: {000000: 'dark',ffffff: 'white'}
		*/
		hexNames: {},
		/**
		* The border color of the selected element.
		*
		* @property selectedColor
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default '#d5d5d5'
		*/
		selectedColor: '#f5f5f5',
		/**
		* The border color of the bounding box.
		*
		* @property boundingBoxColor
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default '#005ede'
		*/
		boundingBoxColor: '#005ede',
		/**
		* The border color of the element when its outside of his bounding box.
		*
		* @property outOfBoundaryColor
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default '#990000'
		*/
		outOfBoundaryColor: '#990000',
		/**
		* If true only the initial elements will be replaced when changing the product. Custom added elements will not be removed.
		*
		* @property replaceInitialElements
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default false
		*/
		replaceInitialElements: false,
		/**
		* If true lazy load will be used for the images in the "Designs" module and "Change Product" module.
		*
		* @property lazyLoad
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default true
		*/
		lazyLoad: true,
		/**
		* Defines the file type used for the templates. E.g. if you want to convert all template files (productdesigner.html, instagram_auth.html and canvaserror.html) into PHP files, you need to change this option to 'php'.
		*
		* @property templatesType
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default 'html'
		*/
		templatesType: 'html',
		/**
		* An object that contains the settings for the AJAX post when a photo from a social network (Facebook, Instagram) is selected. This allows to send the URL of the photo to a custom-built script. By default the URL is send to php/get_image_data_url.php, which returns the data URI of the photo. See the <a href="http://api.jquery.com/jquery.ajax/" target="_blank">official jQuery.ajax documentation</a> for more information. The data object has a reserved property called url, which is the image URL that will send to the script. The success function is also reserved.
		*
		* @property customImageAjaxSettings
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		customImageAjaxSettings: {
			/**
			* The URL to the custom-image-handler.php
			*
			* @property url
			* @type {String}
			* @for FancyProductDesignerOptions.defaults.customImageAjaxSettings
			* @default 'php/custom-image-handler.php'
			*/
			url: 'php/custom-image-handler.php',
			/**
			* The HTTP method to use for the request.
			*
			* @property method
			* @type {String}
			* @for FancyProductDesignerOptions.defaults.customImageAjaxSettings
			* @default 'POST'
			*/
			method: 'POST',
			/**
			* The type of data that you're expecting back from the server.
			*
			* @property dataType
			* @type {String}
			* @for FancyProductDesignerOptions.defaults.customImageAjaxSettings
			* @default 'json'
			*/
			dataType: 'json',
			/**
			* The data object sent to the server.
			*
			* @property data
			* @type {Object}
			* @for FancyProductDesignerOptions.defaults.customImageAjaxSettings
			* @default {
				saveOnServer: 0, - use integer as boolean value. 0=false, 1=true
				uploadsDir: './uploads', - if saveOnServer is 1, you need to specify the directory path where the images are saved
				uploadsDirURL: 'http://yourdomain.com/uploads' - if saveOnServer is 1, you need to specify the directory URL where the images are saved
			}
			*/
			data: {
				saveOnServer: 0, //use integer as boolean value. 0=false, 1=true
				uploadsDir: './uploads', //if saveOnServer is true, you need to specify the directory path where the images are saved
				uploadsDirURL: 'http://yourdomain.com/uploads' //if saveOnServer is true, you need to specify the directory URL where the images are saved
			}
		},
		/**
		* Enable an improved resize filter, that may improve the image quality when its resized.
		*
		* @property improvedResizeQuality
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default false
		*/
		improvedResizeQuality: false,
		/**
		* Make the canvas and the elements in the canvas responsive.
		*
		* @property responsive
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default true
		*/
		responsive: true,
		/**
		* Hex color value defining the color for the corner icon controls.
		*
		* @property cornerIconColor
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default '#000000'
		*/
		cornerIconColor: '#000000', //hex
		/**
		* The URL to the JSON file or an object containing all content from the JSON file. Set to false, if you do not need it.
		*
		* @property langJSON
		* @for FancyProductDesignerOptions.defaults
		* @type {String | Object | Boolean}
		* @default 'lang/default.json'
		*/
		langJSON: 'lang/default.json',
		/**
		* The color palette when the color wheel is displayed.
		*
		* @property colorPickerPalette
		* @for FancyProductDesignerOptions.defaults
		* @type {Array}
		* @default []
		* @example ['#000', '#fff']
		*/
		colorPickerPalette: [], //when colorpicker is enabled, you can define a default palette
		/**
		* An object defining the available actions in the different zones.
		*
		* @property actions
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		* @default {'top': [], 'right': [], 'bottom': [], 'left': []}
		* @example {'top': ['manage-layers'], 'right': ['info'], 'bottom': ['undo', 'redo'], 'left': []}
		*/
		actions:  {
			'top': [],
			'right': [],
			'bottom': [],
			'left': []
		},
		/**
		* An array defining the available modules in the main bar.
		*
		* @property mainBarModules
		* @for FancyProductDesignerOptions.defaults
		* @type {Array}
		* @default ['products', 'images', 'text', 'designs']
		*/
		mainBarModules: ['products', 'images', 'text', 'designs', 'manage-layers'],
		/**
		* Set the initial active module.
		*
		* @property initialActiveModule
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default ''
		*/
		initialActiveModule: '',
		/**
		* An object defining the maximum values for input elements in the toolbar.
		*
		* @property maxValues
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default {}
		*/
		maxValues: {},
		/**
		* Set a watermark image when the user downloads/prints the product via the actions.
		*
		* @property watermark
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean | String}
		* @default false
		*/
		watermark: false,
		/**
		* The number of columns used for the grid images in the images and designs module.
		*
		* @property gridColumns
		* @for FancyProductDesignerOptions.defaults
		* @type {Number}
		* @default 2
		*/
		gridColumns: 2,
		/**
		* Define the price format. Use %d as placeholder for the price.
		*
		* @property priceFormat
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default '&#36;%d'
		*/
		priceFormat: '&#36;%d',
		/**
		* The ID of an element that will be used as container for the main bar.
		*
		* @property mainBarContainer
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean | String}
		* @default false
		* @example #customMainBarContainer
		*/
		mainBarContainer: false,
		/**
		* The ID of an element that will be used to open the modal, in which the designer is included.
		*
		* @property modalMode
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean | String}
		* @default false
		* @example #modalButton
		*/
		modalMode: false,
		/**
		* Enable keyboard control. Use arrow keys to move and backspace key to delete selected element.
		*
		* @property keyboardControl
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default true
		*/
		keyboardControl: true,
		/**
		* Deselect active element when clicking outside of the product designer.
		*
		* @property deselectActiveOnOutside
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default true
		*/
		deselectActiveOnOutside: true,
		/**
		* All upload zones will be always on top of all elements.
		*
		* @property uploadZonesTopped
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default true
		*/
		uploadZonesTopped: true,
		/**
		* Loads the first initial product into stage.
		*
		* @property loadFirstProductInStage
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default true
		*/
		loadFirstProductInStage: true,
		/**
		* If the user leaves the page without saving the product or the getProduct() method is not, a alert window will pop up.
		*
		* @property unsavedProductAlert
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default false
		*/
		unsavedProductAlert: false,
		/**
		* If the user adds something and off-canvas panel or dialog is opened, it will be closed.
		*
		* @property hideDialogOnAdd
		* @for FancyProductDesignerOptions.defaults
		* @type {Boolean}
		* @default false
		*/
		hideDialogOnAdd: false,
		/**
		* Set the placement of the toolbar. Possible values: 'dynamic', 'inside-bottom', 'inside-top'
		*
		* @property toolbarPlacement
		* @for FancyProductDesignerOptions.defaults
		* @type {String}
		* @default 'dynamic'
		*/
		toolbarPlacement: 'dynamic',
		/**
		* The grid size for snap action. First value defines the width on the a-axis, the second on the y-axis.
		*
		* @property snapGridSize
		* @for FancyProductDesignerOptions.defaults
		* @type {Array}
		* @default [50, 50]
		*/
		snapGridSize: [50, 50],
		/**
		* An object containing <a href="http://fabricjs.com/docs/fabric.Canvas.html" target="_blank">options for the fabricjs canvas</a>.
		*
		* @property fabricCanvasOptions
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		fabricCanvasOptions: {},
		/**
		* An object containing the default element parameters in addition to the <a href="http://fabricjs.com/docs/fabric.Object.html" target="_blank">default Fabric Object properties</a>. See <a href="./FancyProductDesignerOptions.defaults.elementParameters.html">FancyProductDesignerOptions.defaults.elementParameters</a>.
		*
		* @property elementParameters
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		elementParameters: {
			/**
			* Allows to set the z-index of an element, -1 means it will be added on the stack of layers
			*
			* @property z
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default -1
			*/
			z: -1,
			/**
			* The price for the element.
			*
			* @property price
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default 0
			*/
			price: 0, //how much does the element cost
			/**
			* <ul><li>If false, no colorization for the element is possible.</li><li>One hexadecimal color will enable the colorpicker</li><li>Mulitple hexadecimal colors separated by commmas will show a range of colors the user can choose from.</li></ul>
			*
			* @property colors
			* @type {Boolean | String}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			* @example colors: "#000000" => Colorpicker, colors: "#000000,#ffffff" => Range of colors
			*/
			colors: false,
			/**
			* If true the user can remove the element.
			*
			* @property removable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			removable: false,
			/**
			* If true the user can drag the element.
			*
			* @property draggable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			draggable: false,
			/**
			* If true the user can rotate the element.
			*
			* @property rotatable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			rotatable: false,
			/**
			* If true the user can resize the element.
			*
			* @property resizable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			resizable: false,
			/**
			* If true the user can copy non-initial elements.
			*
			* @property copyable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			copyable: false,
			/**
			* If true the user can change the z-position the element.
			*
			* @property zChangeable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			zChangeable: false,
			/**
			* Defines a bounding box (printing area) for the element.<ul>If false no bounding box</li><li>The title of an element in the same view, then the boundary of the target element will be used as bounding box.</li><li>An object with x,y,width and height defines the bounding box</li></ul>
			*
			* @property boundingBox
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			boundingBox: false,
			/**
			* Set the mode for the bounding box. Possible values: 'none', 'clipping', 'limitModify', 'inside'
			*
			* @property boundingBoxMode
			* @type {String}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default 'inside'
			*/
			boundingBoxMode: 'inside',
			/**
			* Centers the element in the canvas or when it has a bounding box in the bounding box.
			*
			* @property autoCenter
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			autoCenter: false,
			/**
			* Replaces an element with the same type and replace value.
			*
			* @property replace
			* @type {String}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default ''
			*/
			replace: '',
			/**
			* If a replace value is set, you can decide if the element replaces the elements with the same replace value in all views or only in the current showing view.
			*
			* @property replaceInAllViews
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default ''
			*/
			replaceInAllViews: false,
			/**
			* Selects the element when its added to stage.
			*
			* @property autoSelect
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			autoSelect: false,
			/**
			* Sets the element always on top.
			*
			* @property topped
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			*/
			topped: false,
			/**
			* You can define different prices when using a range of colors, set through the colors option.
			*
			* @property colorPrices
			* @type {Object}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default {}
			* @example colorPrices: {"000000": 2, "ffffff: "3.5"}
			*/
			colorPrices: {},
			/**
			* Include the element in a color link group. So elements with the same color link group are changing to same color as soon as one element in the group is changing the color.
			*
			* @property colorLinkGroup
			* @type {Boolean | String}
			* @for FancyProductDesignerOptions.defaults.elementParameters
			* @default false
			* @example 'my-color-group'
			*/
			colorLinkGroup: false,
			originX: 'center',
			originY: 'center',
			cornerSize: 24,
			fill: false,
			lockUniScaling: true,
			pattern: false,
			top: 0,
			left: 0,
			angle: 0,
			flipX: false,
			flipY: false,
			opacity: 1,
			scaleX: 1,
			scaleY: 1,
		},
		/**
		* An object containing the default text element parameters in addition to the <a href="http://fabricjs.com/docs/fabric.IText.html" target="_blank">default Fabric IText properties</a>. See <a href="./FancyProductDesignerOptions.defaults.textParameters.html">FancyProductDesignerOptions.defaults.textParameters</a>. The properties in the object will merge with the properties in the elementParameters.
		*
		* @property textParameters
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		textParameters: {
			/**
			* If true the user can set a pattern for the text element.
			*
			* @property patternable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default false
			*/
			patternable: false,
			/**
			* The maximal allowed characters. 0 means unlimited characters.
			*
			* @property maxLength
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default 0
			*/
			maxLength: 0,
			/**
			* If true the text will be curved.
			*
			* @property curved
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default false
			*/
			curved: false,
			/**
			* If true the the user can switch between curved and normal text.
			*
			* @property curvable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default false
			*/
			curvable: false,
			/**
			* The letter spacing when the text is curved.
			*
			* @property curveSpacing
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default 10
			*/
			curveSpacing: 10,
			/**
			* The radius when the text is curved.
			*
			* @property curveRadius
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default 80
			*/
			curveRadius: 80,
			/**
			* Reverses the curved text.
			*
			* @property curveReverse
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default false
			*/
			curveReverse: false,
			/**
			* The maximal allowed lines. 0 means unlimited characters.
			*
			* @property maxLines
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.textParameters
			* @default 0
			*/
			maxLines: 0,
			editable: true,
			fontFamily: "Arial",
			fontSize: 18,
			lineHeight: 1,
			fontWeight: 'normal', //set the font weight - bold or normal
			fontStyle: 'normal', //'normal', 'italic'
			textDecoration: 'normal', //'normal' or 'underline'
			padding: 10,
			textAlign: 'left',
			stroke: null,
			strokeWidth: 1
		},
		/**
		* An object containing the default image element parameters in addition to the <a href="http://fabricjs.com/docs/fabric.Image.html" target="_blank">default Fabric Image properties</a>. See <a href="./FancyProductDesignerOptions.defaults.imageParameters.html">FancyProductDesignerOptions.defaults.imageParameters</a>. The properties in the object will merge with the properties in the elementParameters.
		*
		* @property imageParameters
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		imageParameters: {
			/**
			* If true the image will be used as upload zone. That means the image is a clickable area where the user can add different media types.
			*
			* @property uploadZone
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.imageParameters
			* @default false
			*/
			uploadZone: false,
			/**
			* Sets a filter on the image. Possible values: 'grayscale', 'sepia', 'sepia2'
			*
			* @property filter
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.imageParameters
			* @default false
			*/
			filter: false,
			/**
			* An array of filters the user can choose from.
			*
			* @property availableFilters
			* @type {Array}
			* @for FancyProductDesignerOptions.defaults.imageParameters
			* @default []
			* @example availableFilters: ['grayscale', 'sepia', 'sepia2']
			*/
			availableFilters: [],
			/**
			* Set the scale mode when image is added in upload zone. Possible values: 'fit', 'cover'
			*
			* @property uploadZoneScaleMode
			* @type {String}
			* @for FancyProductDesignerOptions.defaults.imageParameters
			* @default 'fit'
			*/
			uploadZoneScaleMode: 'fit',
			/**
			* Allow user to unlock proportional resizing in the toolbar.
			*
			* @property uniScalingUnlockable
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.imageParameters
			* @default false
			*/
			uniScalingUnlockable: false,
			padding: 0
		},
		/**
		* An object containing the default parameters for custom added images. See <a href="./FancyProductDesignerOptions.defaults.customImageParameters.html">FancyProductDesignerOptions.defaults.customImageParameters</a>. The properties in the object will merge with the properties in the elementParameters and imageParameters.
		*
		* @property customImageParameters
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		customImageParameters: {
			/**
			* The minimum upload size width.
			*
			* @property minW
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 100
			*/
			minW: 100,
			/**
			* The minimum upload size height.
			*
			* @property minH
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 100
			*/
			minH: 100,
			/**
			* The maximum upload size width.
			*
			* @property maxW
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 1500
			*/
			maxW: 1500,
			/**
			* The maximum upload size height.
			*
			* @property maxH
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 1500
			*/
			maxH: 1500,
			/**
			* Resizes the uploaded image to this width.
			*
			* @property resizeToW
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 300
			*/
			resizeToW: 300,
			/**
			* Resizes the uploaded image to this height.
			*
			* @property resizeToH
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 300
			*/
			resizeToH: 300,
			/**
			* The minimum allowed DPI for uploaded images. Works only with JPEG images.
			*
			* @property minDPI
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 72
			*/
			minDPI: 72,
			/**
			* The maxiumum image size in MB.
			*
			* @property maxSize
			* @type {Number}
			* @for FancyProductDesignerOptions.defaults.customImageParameters
			* @default 10
			*/
			maxSize: 10
		},
		/**
		* An object containing additional parameters for custom added text.The properties in the object will merge with the properties in the elementParameters and textParameters.
		*
		* @property customTextParameters
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		customTextParameters: {

		},
		/**
		* An object containing the supported media types the user can add in the product designer.
		*
		* @property customAdds
		* @for FancyProductDesignerOptions.defaults
		* @type {Object}
		*/
		customAdds: {
			/**
			* If true the user can add images from the designs library.
			*
			* @property designs
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.customAdds
			* @default true
			*/
			designs: true,
			/**
			* If true the user can add an own image.
			*
			* @property uploads
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.customAdds
			* @default true
			*/
			uploads: true,
			/**
			* If true the user can add own text.
			*
			* @property texts
			* @type {Boolean}
			* @for FancyProductDesignerOptions.defaults.customAdds
			* @default true
			*/
			texts: true
		}
	};

	/**
	 * Merges the default options with custom options.
	 *
	 * @method merge
	 * @for FancyProductDesignerOptions
	 * @param {Object} defaults The default object.
	 * @param {Object} [merge] The merged object, that will be merged into the defaults.
	 * @return {Object} The new options object.
	 */
	this.merge = function(defaults, merge) {

		typeof merge === 'undefined' ? {} : merge;

		var options = $.extend({}, defaults, merge);
		options.elementParameters = $.extend({}, defaults.elementParameters, options.elementParameters);
		options.textParameters = $.extend({}, defaults.textParameters, options.textParameters);
		options.imageParameters = $.extend({}, defaults.imageParameters, options.imageParameters);
		options.customTextParameters = $.extend({}, defaults.customTextParameters, options.customTextParameters);
		options.customImageParameters = $.extend({}, defaults.customImageParameters, options.customImageParameters);
		options.customAdds = $.extend({}, defaults.customAdds, options.customAdds);
		options.customImageAjaxSettings = $.extend({}, defaults.customImageAjaxSettings, options.customImageAjaxSettings);

		return options;

	};

	/**
	 * Returns all element parameter keys.
	 *
	 * @method getParameterKeys
	 * @for FancyProductDesignerOptions
	 * @return {Array} An array containing all element parameter keys.
	 */
	this.getParameterKeys = function() {

		var elementParametersKeys = Object.keys(this.defaults.elementParameters),
			imageParametersKeys = Object.keys(this.defaults.imageParameters),
			textParametersKeys = Object.keys(this.defaults.textParameters);

		elementParametersKeys = elementParametersKeys.concat(imageParametersKeys);
		elementParametersKeys = elementParametersKeys.concat(textParametersKeys);

		return elementParametersKeys;

	};

};

/**
 * The class to create a view. A view contains the canvas. You need to call {{#crossLink "FancyProductDesignerView/setup:method"}}{{/crossLink}} to set up the canvas with all elements, after setting an instance of {{#crossLink "FancyProductDesignerView"}}{{/crossLink}}.
 *
 * @class FancyProductDesignerView
 * @constructor
 * @param {jQuery} elem - jQuery object holding the container.
 * @param {Object} view - The default options for the view.
 * @param {Function} callback - This function will be called as soon as the view and all initial elements are loaded.
 * @param {Object} fabricjsCanvasOptions - Options for the fabricjs canvas.
 */
var FancyProductDesignerView = function($productStage, view, callback, fabricCanvasOptions) {

	fabricCanvasOptions = typeof fabricCanvasOptions === 'undefined' ? {} : fabricCanvasOptions;

	var $this = $(this),
		instance = this,
		mouseDownStage = false,
		initialElementsLoaded = false,
		tempModifiedParameters = null,
		modifiedType = null,
		limitModifyParameters = {},
		fpdOptions = new FancyProductDesignerOptions();

	var _initialize = function() {

		/**
		 * The view title.
		 *
		 * @property title
		 * @type String
		 */
		instance.title = view.title;
		/**
		 * The view thumbnail.
		 *
		 * @property thumbnail
		 * @type String
		 */
		instance.thumbnail = view.thumbnail;
		/**
		 * The view elements.
		 *
		 * @property elements
		 * @type Object
		 */
		instance.elements = view.elements;
		/**
		 * The view options.
		 *
		 * @property options
		 * @type Object
		 */
		instance.options = view.options;
		/**
		 * The view undos.
		 *
		 * @property undos
		 * @type Array
		 * @default []
		 */
		instance.undos = [];
		/**
		 * The view redos.
		 *
		 * @property redos
		 * @type Array
		 * @default []
		 */
		instance.redos = [];
		/**
		 * The total price for the view.
		 *
		 * @property totalPrice
		 * @type Number
		 * @default 0
		 */
		instance.totalPrice = 0;
		/**
		 * The set zoom for the view.
		 *
		 * @property zoom
		 * @type Number
		 * @default 0
		 */
		instance.zoom = 1;
		/**
		 * The responsive scale.
		 *
		 * @property responsiveScale
		 * @type Number
		 * @default 1
		 */
		instance.responsiveScale = 1;
		/**
		 * The current selected element.
		 *
		 * @property currentElement
		 * @type fabric.Object
		 * @default null
		 */
		instance.currentElement = null;
		/**
		 * The current selected bounding box object.
		 *
		 * @property currentBoundingObject
		 * @type fabric.Object
		 * @default null
		 */
		instance.currentBoundingObject = null;
		/**
		 * The title of the current selected upload zone.
		 *
		 * @property currentUploadZone
		 * @type String
		 * @default null
		 */
		instance.currentUploadZone = null;
		/**
		 * An instance of fabricjs canvas class. <a href="http://fabricjs.com/docs/fabric.Canvas.html" target="_blank">It allows to interact with the fabricjs API.</a>
		 *
		 * @property stage
		 * @type fabric.Canvas
		 * @default null
		 */
		instance.stage = null;
		/**
		 * Properties to include when using the {{#crossLink "FancyProductDesignerView/getJSON:method"}}{{/crossLink}} or {{#crossLink "FancyProductDesignerView/getElementJSON:method"}}{{/crossLink}} .
		 *
		 * @property propertiesToInclude
		 * @type Array
		 * @default ['_isInitial', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'lockScalingFlip', 'lockUniScaling', 'resizeType', 'clipTo', 'clippingRect', 'boundingBox', 'boundingBoxMode', 'selectable', 'evented', 'title', 'editable', 'cornerColor', 'cornerIconColor', 'borderColor', 'isEditable', 'hasUploadZone']
		 */
		instance.propertiesToInclude = ['_isInitial', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'lockScalingFlip', 'lockUniScaling', 'resizeType', 'clipTo', 'clippingRect', 'boundingBox', 'boundingBoxMode', 'selectable', 'evented', 'title', 'editable', 'cornerColor', 'cornerIconColor', 'borderColor', 'isEditable', 'hasUploadZone'];
		instance.dragStage = false;

		//replace old width option with stageWidth
		if(instance.options.width) {
			instance.options.stageWidth = instance.options.width;
			delete instance.options['width'];
		}

		//add new canvas
		$productStage.append('<canvas></canvas>');

		$this.on('elementAdd', function(evt, element){

			//price handler in custom elementAdd function, not in object:added, because its not working with replaceInitialElements and upload zones


			//check for other topped elements
			_bringToppedElementsToFront();

			if(element.isCustom && !element.hasUploadZone && !element.replace) {
				element.copyable = true;
				instance.stage.renderAll();
			}

		});

		//create fabric stage
		var canvas = $productStage.children('canvas:last').get(0),
			canvasOptions = $.extend({}, {
				containerClass: 'fpd-view-stage fpd-hidden',
				selection: false,
				hoverCursor: 'pointer',
				controlsAboveOverlay: true,
				centeredScaling: true,
				allowTouchScrolling: true
			}, fabricCanvasOptions);

		instance.stage = new fabric.Canvas(canvas, canvasOptions).on({
			'object:added': function(opts) {

				var element = opts.target,
					price = element.price;

				//if element is addded into upload zone, use upload zone price if one is set
				if((instance.currentUploadZone && instance.currentUploadZone != '')) {

					var uploadZoneObj = instance.getElementByTitle(instance.currentUploadZone);
					price = uploadZoneObj.price !== undefined ? uploadZoneObj.price : price;

				}

				if(price !== undefined && price !== 0 && !element.uploadZone && element.type !== 'rect') {

					instance.totalPrice += price;
					element.setCoords();

					/**
				     * Gets fired as soon as the price has changed.
				     *
				     * @event FancyProductDesignerView#priceChange
				     * @param {Event} event
				     * @param {number} elementPrice - The price of the element.
				     * @param {number} totalPrice - The total price.
				     */
					$this.trigger('priceChange', [price, instance.totalPrice]);
				}

			},
			'object:removed': function(opts) {

				var element = opts.target;

				if(element.price !== undefined && element.price !== 0 && !element.uploadZone) {
					instance.totalPrice -= element.price;
					$this.trigger('priceChange', [element.price, instance.totalPrice]);
				}

			}
		});

		instance.stage.setDimensions({width: instance.options.stageWidth, height: instance.options.stageHeight});

		//retina-ready
		if( window.devicePixelRatio !== 1 ){

		    var htmlCanvas = instance.stage.getElement();

		    // Scale the canvas up by two for retina
		    htmlCanvas.setAttribute('width', instance.options.stageWidth * window.devicePixelRatio);
		    htmlCanvas.setAttribute('height', instance.options.stageHeight * window.devicePixelRatio);

		    // finally set the scale of the context
		    htmlCanvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);

		}

	};

	var _afterSetup = function() {

		callback.call(callback, instance);

		initialElementsLoaded = true;

		if(instance.options.keyboardControl) {

			$(document).on('keydown', function(evt) {

				var $target = $(evt.target);

				if(instance.currentElement && !$target.is('textarea,input[type="text"],input[type="number"]')) {

					switch(evt.which) {
						case 8:
							//remove element
							if(instance.currentElement.removable) {
								instance.removeElement(instance.currentElement);
							}

						break;
				        case 37: // left

					        if(instance.currentElement.draggable) {
						        instance.setElementParameters({left: instance.currentElement.left - 1});
					        }

				        break;
				        case 38: // up

				        	if(instance.currentElement.draggable) {
						        instance.setElementParameters({top: instance.currentElement.top - 1});
					        }

				        break;
				        case 39: // right

				        	if(instance.currentElement.draggable) {
						        instance.setElementParameters({left: instance.currentElement.left + 1});
					        }

				        break;
				        case 40: // down

				        	if(instance.currentElement.draggable) {
						        instance.setElementParameters({top: instance.currentElement.top + 1});
					        }

				        break;

				        default: return; //other keys
				    }

				    evt.preventDefault();

				}

			});

		}

		//attach handlers to stage
		instance.stage.on({
			'mouse:over': function(opts) {

				if(instance.currentElement && instance.currentElement.draggable && opts.target === instance.currentElement) {
					instance.stage.hoverCursor = 'move';
				}
				else {
					instance.stage.hoverCursor = 'pointer';
				}

			},
			'mouse:down': function(opts) {

				mouseDownStage = true;

				if(opts.target == undefined) {
					instance.deselectElement();
				}
				else {

					var pointer = instance.stage.getPointer(opts.e),
						targetCorner = opts.target.findTargetCorner(pointer);

					tempModifiedParameters = instance.getElementJSON();

					//remove element
					if(targetCorner == 'bl' && instance.currentElement.removable) {
						instance.removeElement(instance.currentElement);
					}

					//copy element
					if(targetCorner == 'tl' && instance.currentElement.copyable && !instance.currentElement.hasUploadZone) {

						var newOpts = instance.getElementJSON();
						newOpts.autoCenter = true;

						instance.addElement(
							FPDUtil.getType(instance.currentElement.type),
							instance.currentElement.source,
							'Copy '+instance.currentElement.title,
							newOpts
						);

					}

				}
			},
			'mouse:up': function() {

				mouseDownStage = false;

			},
			'mouse:move': function(opts) {

				if(mouseDownStage && instance.dragStage) {

					instance.stage.relativePan(new fabric.Point(opts.e.movementX, opts.e.movementY));

				}

			},
			'text:changed': function(opts) {

				instance.setElementParameters({text: opts.target.text});

			},
			'object:moving': function(opts) {

				modifiedType = 'moving';
				_checkContainment(opts.target);

				/**
			     * Gets fired when an element is changing via drag, resize or rotate.
			     *
			     * @event FancyProductDesignerView#elementChange
			     * @param {Event} event
			     * @param {String} modifiedType - The modified type.
			     * @param {fabric.Object} element - The fabricJS object.
			     */
				$this.trigger('elementChange', [modifiedType, opts.target]);

			},
			'object:scaling': function(opts) {

				modifiedType = 'scaling';
				_checkContainment(opts.target);

				$this.trigger('elementChange', [modifiedType, opts.target]);

			},
			'object:rotating': function(opts) {

				modifiedType = 'rotating';
				_checkContainment(opts.target);

				$this.trigger('elementChange', [modifiedType, opts.target]);

			},
			'object:modified': function(opts) {

				if(tempModifiedParameters) {

					_setUndoRedo({element: opts.target, parameters: tempModifiedParameters, interaction: 'modify'});
					tempModifiedParameters = null;

				}

				if(FPDUtil.getType(opts.target.type) === 'text' && opts.target.type !== 'curvedText') {

					opts.target.fontSize *= opts.target.scaleX;
		            opts.target.fontSize = parseFloat(Number(opts.target.fontSize).toFixed(0));
		            opts.target.scaleX = 1;
		            opts.target.scaleY = 1;
		            opts.target._clearCache();

				}

				if(modifiedType !== null) {

					var modifiedParameters = {};

					switch(modifiedType) {
						case 'moving':
							modifiedParameters.left = Number(opts.target.left);
							modifiedParameters.top = Number(opts.target.top);
						break;
						case 'scaling':
							if(FPDUtil.getType(opts.target.type) === 'text' && opts.target.type !== 'curvedText') {
								modifiedParameters.fontSize = parseInt(opts.target.fontSize);
							}
							else {
								modifiedParameters.scaleX = parseFloat(opts.target.scaleX);
								modifiedParameters.scaleY = parseFloat(opts.target.scaleY);
							}
						break;
						case 'rotating':
							modifiedParameters.angle = opts.target.angle;
						break;
					}

					/**
				     * Gets fired when an element is modified.
				     *
				     * @event FancyProductDesignerView#elementModify
				     * @param {Event} event
				     * @param {fabric.Object} element - The fabricJS object.
				     * @param {Object} modifiedParameters - The modified parameters.
				     */
					$this.trigger('elementModify', [opts.target, modifiedParameters]);
				}

				modifiedType = null;

			},
			'object:selected': function(opts) {

				instance.deselectElement(false);

				//dont select anything when in dragging mode
				if(instance.dragStage) {
					instance.deselectElement();
					return false;
				}

				instance.currentElement = opts.target;


				/**
			     * Gets fired as soon as an element is selected.
			     *
			     * @event FancyProductDesignerView#elementSelect
			     * @param {Event} event
			     * @param {fabric.Object} currentElement - The current selected element.
			     */
				$this.trigger('elementSelect', [instance.currentElement]);


				instance.currentElement.setControlVisible('tr', false);
				instance.currentElement.set({
					borderColor: instance.options.selectedColor,
					rotatingPointOffset: 0
				});

				//change cursor to move when element is draggable
				instance.currentElement.draggable ? instance.stage.hoverCursor = 'move' : instance.stage.hoverCursor = 'pointer';

				//check for a boundingbox
				if(instance.currentElement.boundingBox && !instance.options.editorMode) {

					var bbCoords = instance.getBoundingBoxCoords(opts.target);
					if(bbCoords) {
						instance.currentBoundingObject = new fabric.Rect({
							left: bbCoords.left,
							top: bbCoords.top,
							width: bbCoords.width,
							height: bbCoords.height,
							stroke: instance.options.boundingBoxColor,
							strokeWidth: 1,
							strokeDashArray: [5, 5],
							fill: false,
							selectable: false,
							evented: false,
							originX: 'left',
							originY: 'top',
							name: "bounding-box"
						});


						instance.stage.add(instance.currentBoundingObject);
						instance.currentBoundingObject.bringToFront();

						/**
					     * Gets fired when bounding box is toggling.
					     *
					     * @event FancyProductDesignerView#boundingBoxToggle
					     * @param {Event} event
					     * @param {fabric.Object} currentBoundingObject - The current bounding box object.
					     * @param {Boolean} state
					     */
						$this.trigger('boundingBoxToggle', [instance.currentBoundingObject, true]);

					}

					_checkContainment(opts.target);
				}

			}
		});

	};

	var _setUndoRedo = function(undo, redo, trigger) {

		trigger = typeof trigger === 'undefined' ? true : trigger;

		if(undo) {
			instance.undos.push(undo);

			if(instance.undos.length > 20) {
				instance.undos.shift();
			}
		}

		if(redo) {
			instance.redos.push(redo);
		}

		if(trigger) {

			/**
		     * Gets fired when the canvas has been saved in the undos or redos array.
		     *
		     * @event FancyProductDesignerView#undoRedoSet
		     * @param {Event} event
		     * @param {Array} undos - An array containing all undo objects.
		     * @param {Array} redos - An array containing all redos objects.
		    */

			$this.trigger('undoRedoSet', [instance.undos, instance.redos]);

		}

	};

	//brings all topped elements to front
	var _bringToppedElementsToFront = function() {

		var objects = instance.stage.getObjects(),
			bringToFrontObj = [];

		for(var i = 0; i < objects.length; ++i) {
			var object = objects[i];
			if((object.topped || object.uploadZone) && instance.options.uploadZonesTopped) {
				bringToFrontObj.push(object);
			}
		}

		for(var i = 0; i < bringToFrontObj.length; ++i) {
			bringToFrontObj[i].bringToFront();
		}

		//bring all elements inside a upload zone to front
		/*for(var i = 0; i < objects.length; ++i) {
			var object = objects[i];
			if(object.hasUploadZone) {
				object.bringToFront().setCoords();
			}
		}*/

		if(instance.currentBoundingObject) {
			instance.currentBoundingObject.bringToFront();
		}

		var snapLinesGroup = instance.getElementByTitle('snap-lines-group');
		if(snapLinesGroup) {
			snapLinesGroup.bringToFront();
		}

		instance.stage.renderAll();

	};

	//checks if an element is in its containment (bounding box)
	var _checkContainment = function(target) {

		if(instance.currentBoundingObject && !target.hasUploadZone) {

			target.setCoords();

			if(target.boundingBoxMode === 'limitModify') {

				var targetBoundingRect = target.getBoundingRect(),
					bbBoundingRect = instance.currentBoundingObject.getBoundingRect(),
					minX = bbBoundingRect.left,
					maxX = bbBoundingRect.left+bbBoundingRect.width-targetBoundingRect.width;
					minY = bbBoundingRect.top,
					maxY = bbBoundingRect.top+bbBoundingRect.height-targetBoundingRect.height;

				//check if target element is not contained within bb
			    if(!target.isContainedWithinObject(instance.currentBoundingObject)) {

					//check if no corner is used, 0 means its dragged
					if(target.__corner === 0) {
						if(targetBoundingRect.left > minX && targetBoundingRect.left < maxX) {
						   limitModifyParameters.left = target.left;
					    }

					    if(targetBoundingRect.top > minY && targetBoundingRect.top < maxY) {
						   limitModifyParameters.top = target.top;
					    }
					}

			        target.setOptions(limitModifyParameters);


			    } else {

				    limitModifyParameters = {left: target.left, top: target.top, angle: target.angle, scaleX: target.scaleX, scaleY: target.scaleY};

			    }

				/**
			     * Gets fired when the containment of an element is checked.
			     *
			     * @event FancyProductDesignerView#elementCheckContainemt
			     * @param {Event} event
			     * @param {fabric.Object} target
			     * @param {Boolean} boundingBoxMode
			     */
			    $this.trigger('elementCheckContainemt', [target, 'limitModify']);

			}
			else if(target.boundingBoxMode === 'inside') {

				var isOut = false,
					tempIsOut = target.isOut;

					isOut = !target.isContainedWithinObject(instance.currentBoundingObject);

				if(isOut) {

					target.borderColor = instance.options.outOfBoundaryColor;
					target.isOut = true;

				}
				else {

					target.borderColor = instance.options.selectedColor;
					target.isOut = false;

				}

				if(tempIsOut != target.isOut && tempIsOut != undefined) {
					if(isOut) {

						/**
					     * Gets fired as soon as an element is outside of its bounding box.
					     *
					     * @event FancyProductDesigner#elementOut
					     * @param {Event} event
					     */
						$this.trigger('elementOut', [target]);
					}
					else {

						/**
					     * Gets fired as soon as an element is inside of its bounding box again.
					     *
					     * @event FancyProductDesigner#elementIn
					     * @param {Event} event
					     */
						$this.trigger('elementIn', [target]);
					}
				}

				$this.trigger('elementCheckContainemt', [target, 'inside']);

			}

		}

		instance.stage.renderAll();

	};

	//center object
	var _centerObject = function(object, hCenter, vCenter, boundingBox) {

		var cp = object.getCenterPoint(),
			left = cp.x,
			top = cp.y;

		if(hCenter) {

			if(boundingBox) {
				left = boundingBox.left + boundingBox.width * 0.5;
			}
			else {
				left = instance.options.stageWidth * 0.5;
			}

		}

		if(vCenter) {
			if(boundingBox) {
				top = boundingBox.top + boundingBox.height * 0.5;
			}
			else {
				top = instance.options.stageHeight * 0.5;
			}

		}

		object.setPositionByOrigin(new fabric.Point(left, top), 'center', 'center');

		instance.stage.renderAll();
		object.setCoords();

		_checkContainment(object);

	};

	//loads custom fonts
	var _renderOnFontLoaded = function(fontName, element) {

		WebFont.load({
			custom: {
			  families: [fontName]
			},
			fontactive: function(familyName, fvd) {

				//$('body').mouseup();
				instance.stage.renderAll();

				if(element) {
					element.setFontSize(element._tempFontSize);
					element.setCoords();
					instance.stage.renderAll();
				}

			}
		});

	};

	//sets the price for the element if it has color prices
	var _setColorPrice = function(element, hex) {

		if(element.colorPrices && typeof element.colors === 'object' && element.colors.length > 1) {

			if(element.currentColorPrice !== undefined) {
				element.price -= element.currentColorPrice;
				instance.totalPrice -= element.currentColorPrice;
			}

			if(typeof hex === 'string') {

				var hexKey = hex.replace('#', '');
				if(element.colorPrices.hasOwnProperty(hexKey) || element.colorPrices.hasOwnProperty(hexKey.toUpperCase())) {

					var elementColorPrice = element.colorPrices[hexKey] === undefined ? element.colorPrices[hexKey.toUpperCase()] : element.colorPrices[hexKey];

					element.currentColorPrice = elementColorPrice;
					element.price += element.currentColorPrice;
					instance.totalPrice += element.currentColorPrice;

				}
				else {
					element.currentColorPrice = 0;
				}

			}
			else {
				element.currentColorPrice = 0;
			}

			$this.trigger('priceChange', [element.price, instance.totalPrice]);

		}

	};

	//sets the pattern for an object
	var _setPattern = function(element, url) {

		if(element.type == 'image') {

			//todo: find proper solution

		}
		else if(FPDUtil.getType(element.type) === 'text') {

			if(url) {
				fabric.util.loadImage(url, function(img) {

					element.setFill(new fabric.Pattern({
						source: img,
						repeat: 'repeat'
					}));
					instance.stage.renderAll();
				});
			}
			else {
				var color = element.fill ? element.fill : element.colors[0];
				color = color ? color : '#000000';
				element.setFill(color);
			}

		}

	};

	//defines the clipping area
	var _clipElement = function(element) {

		var bbCoords = instance.getBoundingBoxCoords(element) || element.clippingRect;
		if(bbCoords) {

			element.clippingRect = bbCoords;
			element.setClipTo(function(ctx) {
				_clipById(ctx, this);
			});

		}

	};

	//draws the clipping
	var _clipById = function (ctx, _this, scale) {

		scale = scale === undefined ? 1 : scale;

		var centerPoint = _this.getCenterPoint(),
			clipRect = _this.clippingRect,
			scaleXTo1 = (1 / _this.scaleX),
			scaleYTo1 = (1 / _this.scaleY);

	    ctx.save();
	    ctx.translate(0,0);
	    ctx.rotate(fabric.util.degreesToRadians(_this.angle * -1));
	    ctx.scale(scaleXTo1, scaleYTo1);
	    ctx.beginPath();
	    ctx.rect(
	        (clipRect.left) - centerPoint.x,
	        (clipRect.top) - centerPoint.y,
	        clipRect.width * scale,
	        clipRect.height * scale
	    );
	    ctx.fillStyle = 'transparent';
	    ctx.fill();
	    ctx.closePath();
	    ctx.restore();

	};

	//returns the fabrich filter
	var _getFabircFilter = function(type) {

		switch(type) {
			case 'grayscale':
				return new fabric.Image.filters.Grayscale();
			break;
			case 'sepia':
				return new fabric.Image.filters.Sepia();
			break;
			case 'sepia2':
				return new fabric.Image.filters.Sepia2();
			break;
		}

		return null;

	};

	var _elementHasUploadZone = function(element) {

		if(element && element.hasUploadZone) {

			//check if upload zone contains objects
			var objects = instance.stage.getObjects(),
				uploadZoneEmpty = true;

			for(var i=0; i < objects.length; ++i) {

				var object = objects[i];
				if(object.replace == element.replace) {
					uploadZoneEmpty = false;
					break;
				}

			}

			var uploadZoneObject = instance.getUploadZone(element.replace);
			if(uploadZoneObject) {
				uploadZoneObject.opacity = uploadZoneEmpty ? 1 : 0;
				uploadZoneObject.evented = uploadZoneEmpty;
			}

			instance.stage.renderAll();
		}

	};

	var _imageColorError = function() {

		FPDUtil.showModal("Error: Please make sure that the images are hosted under the same domain and protocol, in which you are using the product designer!");

	};

	//return an element by ID
	this.getElementByID = function(id) {

		var objects = instance.stage.getObjects();
		for(var i=0; i < objects.length; ++i) {
			if(objects[i].id == id) {
				return objects[i];
				break;
			}
		}

		return false;

	};

	/**
	 * Adds a new element to the view.
	 *
	 * @method addElement
	 * @param {string} type The type of an element you would like to add, 'image' or 'text'.
	 * @param {string} source For image the URL to the image and for text elements the default text.
	 * @param {string} title Only required for image elements.
	 * @param {object} [parameters] An object with the parameters, you would like to apply on the element.
	 */
	this.addElement = function(type, source, title, params) {

		if(type === undefined || source === undefined || title === undefined) {
			return;
		}

		params = typeof params !== 'undefined' ? params : {};

		if(typeof params != "object") {
			FPDUtil.showModal("The element "+title+" does not have a valid JSON object as parameters! Please check the syntax, maybe you set quotes wrong.");
			return false;
		}

		//check that fill is a string
		if(typeof params.fill !== 'string' && !$.isArray(params.fill)) {
			params.fill = false;
		}

		//replace depraceted keys
		params = FPDUtil.rekeyDeprecatedKeys(params);

		//merge default options
		if(FPDUtil.getType(type) === 'text') {
			params = $.extend({}, instance.options.elementParameters, instance.options.textParameters, params);
		}
		else {
			params = $.extend({}, instance.options.elementParameters, instance.options.imageParameters, params);
		}

		var pushTargetObject = false,
			targetObject = null;

		//store current color and convert colors in string to array
		if(params.colors && typeof params.colors == 'string') {

			//check if string contains hex color values
			if(params.colors.indexOf('#') == 0) {
				//convert string into array
				var colors = params.colors.replace(/\s+/g, '').split(',');
				params.colors = colors;
			}

		}

		params._isInitial = !initialElementsLoaded;

		if(FPDUtil.getType(type) === 'text') {
			var defaultTextColor = params.colors[0] ? params.colors[0] : '#000000';
			params.fill = params.fill ? params.fill : defaultTextColor;
		}

		var fabricParams = {
			source: source,
			title: title,
			id: String(new Date().getTime()),
			cornerColor: instance.options.cornerColor ? instance.options.cornerColor : instance.options.selectedColor,
			cornerIconColor: instance.options.cornerIconColor
		};

		params.__editorMode = instance.options.editorMode;
		if(instance.options.editorMode) {
			fabricParams.selectable = fabricParams.evented = fabricParams.draggable = fabricParams.removable = fabricParams.resizable = fabricParams.rotatable = fabricParams.zChangeable = fabricParams.copyable = fabricParams.lockUniScaling = true;
		}
		else {
			$.extend(fabricParams, {
				selectable: false,
				lockRotation: true,
				hasRotatingPoint: false,
				lockScalingX: true,
				lockScalingY: true,
				lockMovementX: true,
				lockMovementY: true,
				hasControls: false,
				evented: false,
			});
		}

		fabricParams = $.extend({}, params, fabricParams);

		if(type == 'image' || type == 'path' || type == 'path-group') {

			var _fabricImageLoaded = function(fabricImage, params, vectorImage, originParams) {

				originParams = originParams === undefined ? {} : originParams;

				$.extend(params, {
					crossOrigin: 'anonymous',
					originParams: $.extend({}, params, originParams)
				});

				fabricImage.setOptions(params);
				instance.stage.add(fabricImage);
				instance.setElementParameters(params, fabricImage, false);

				fabricImage.originParams.angle = fabricImage.angle;
				fabricImage.originParams.z = instance.getZIndex(fabricImage);

				if(instance.options.improvedResizeQuality && !vectorImage) {

					fabricImage.resizeFilters.push(new fabric.Image.filters.Resize({
					    resizeType: 'hermite'
					}));

					fabricImage.fire('scaling');

				}

				if(!fabricImage._isInitial) {
					_setUndoRedo({
						element: fabricImage,
						parameters: params,
						interaction: 'add'
					});
				}

				/**
			     * Gets fired as soon as an element has beed added.
			     *
			     * @event FancyProductDesigner#elementAdd
			     * @param {Event} event
			     * @param {fabric.Object} object - The fabric object.
			     */
				$this.trigger('elementAdd', [fabricImage]);

			};


			if(source === undefined || source.length === 0) {
				FPDUtil.log('No image source set for: '+ title);
				return;
			}

			var imageParts = source.split('.');

			//add SVG from XML document
			if(FPDUtil.isXML(source)) {

				fabric.loadSVGFromString(source, function(objects, options) {
					var svgGroup = fabric.util.groupSVGElements(objects, options);
					_fabricImageLoaded(svgGroup, fabricParams, true);
				});

			}
			//load svg from url
			else if($.inArray('svg', imageParts) != -1) {

				fabric.loadSVGFromURL(source, function(objects, options) {

					var svgGroup = fabric.util.groupSVGElements(objects, options);
					if(!params.fill) {
						params.colors = [];
						for(var i=0; i < objects.length; ++i) {
							var color = tinycolor(objects[i].fill);
							params.colors.push(color.toHexString());
						}
						params.fill = params.colors;
					}

					_fabricImageLoaded(svgGroup, fabricParams, true, {fill: params.fill});

				});

			}
			//load png/jpeg from url
			else {

				new fabric.Image.fromURL(source, function(fabricImg) {
					_fabricImageLoaded(fabricImg, fabricParams, false);
				});

			}

		}
		else if(FPDUtil.getType(type) === 'text') {

			source = source.replace(/\\n/g, '\n');
			params.text = params.text ? params.text : source;

			$.extend(fabricParams, {
				spacing: params.curveSpacing,
				radius: params.curveRadius,
				reverse: params.curveReverse,
				originParams: $.extend({}, params)
			});

			//fix for correct boundary when using custom fonts
			var tempFontSize = fabricParams.fontSize;
			fabricParams._tempFontSize = tempFontSize;
			fabricParams.fontSize = tempFontSize + 0.01;

			//make text curved
			if(params.curved) {
				var fabricText = new fabric.CurvedText(source, fabricParams);
			}
			//just interactive text
			else {
				var fabricText = new fabric.IText(source, fabricParams);
			}

			instance.stage.add(fabricText);
			instance.setElementParameters(fabricParams, fabricText, false);

			fabricText.originParams = $.extend({}, fabricText.toJSON(), fabricText.originParams);
			delete fabricText.originParams['clipTo'];
			fabricText.originParams.z = instance.getZIndex(fabricText);

			if(!fabricText._isInitial) {
				_setUndoRedo({
					element: fabricText,
					parameters: fabricParams,
					interaction: 'add'
				});
			}

			/**
		     * Gets fired as soon as an element has beed added.
		     *
		     * @event FancyProductDesigner#elementAdd
		     * @param {Event} event
		     * @param {fabric.Object} object - The fabric object.
		     */
			$this.trigger('elementAdd', [fabricText]);

		}
		else {

			FPDUtil.showModal('Sorry. This type of element is not allowed!');

		}

	};

	/**
	 * Returns an fabric object by title.
	 *
	 * @method getElementByTitle
	 * @param {string} title The title of an element.
	 * @return {Object} FabricJS Object.
	 */
	this.getElementByTitle = function(title) {

		var objects = instance.stage.getObjects();
		for(var i = 0; i < objects.length; ++i) {
			if(objects[i].title == title) {
				return objects[i];
				break;
			}
		}

	};

	/**
	 * Deselects the current selected element.
	 *
	 * @method deselectElement
	 * @param {boolean} [discardActiveObject=true] Discards the active element.
	 */
	this.deselectElement = function(discardActiveObject) {

		discardActiveObject = typeof discardActiveObject == 'undefined' ? true : discardActiveObject;

		if(instance.currentBoundingObject) {

			instance.currentBoundingObject.remove();
			$this.trigger('boundingBoxToggle', [instance.currentBoundingObject, false]);
			instance.currentBoundingObject = null;

		}

		if(discardActiveObject) {
			instance.stage.discardActiveObject();
		}

		instance.currentElement = null;
		instance.stage.renderAll().calcOffset();

		$this.trigger('elementSelect', [null]);

	};

	/**
	 * Removes an element using the fabric object or the title of an element.
	 *
	 * @method removeElement
	 * @param {object|string} element Needs to be a fabric object or the title of an element.
	 */
	this.removeElement = function(element) {

		if(typeof element === 'string') {
			element = instance.getElementByTitle(element);
		}

		_setUndoRedo({
			element: element,
			parameters: instance.getElementJSON(element),
			interaction: 'remove'
		});

		instance.stage.remove(element);

		_elementHasUploadZone(element);

		/**
	     * Gets fired as soon as an element has been removed.
	     *
	     * @event FancyProductDesigner#elementRemove
	     * @param {Event} event
	     * @param {fabric.Object} element - The fabric object that has been removed.
	     */
		$this.trigger('elementRemove', [element]);

		this.deselectElement();

	};

	/**
	 * Sets the parameters for a specified element.
	 *
	 * @method setElementParameters
	 * @param {object} parameters An object with the parameters that should be applied to the element.
	 * @param {fabric.Object | string} [element] A fabric object or the title of an element. If no element is set, the parameters will be applied to the current selected element.
	 * @param {Boolean} [saveUndo=true] Save new parameters also in undos.
	 */
	this.setElementParameters = function(parameters, element, saveUndo) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;
		saveUndo = typeof saveUndo === 'undefined' ? true : saveUndo;

		if(!element || parameters === undefined) {
			return false;
		}

		//if element is string, get by title
		if(typeof element == 'string') {
			element = instance.getElementByTitle(element);
		}

		//store undos
		if(saveUndo && initialElementsLoaded) {

			var undoParameters = instance.getElementJSON();

			if(element._tempFill) {
				undoParameters.fill = element._tempFill;
				element._tempFill = undefined;
			}

			_setUndoRedo({
				element: element,
				parameters: undoParameters,
				interaction: 'modify'
			});

		}

		//adds the element into a upload zone
		if((instance.currentUploadZone && instance.currentUploadZone != '')) {

			parameters.z = -1;
			var uploadZoneObj = instance.getElementByTitle(instance.currentUploadZone),
				scale = FPDUtil.getScalingByDimesions(
					element.width,
					element.height,
					uploadZoneObj.width * uploadZoneObj.scaleX,
					uploadZoneObj.height * uploadZoneObj.scaleY,
					uploadZoneObj.uploadZoneScaleMode
				);

			$.extend(parameters, {
					boundingBox: instance.currentUploadZone,
					boundingBoxMode: 'clipping',
					scaleX: scale,
					scaleY: scale,
					autoCenter: true,
					removable: true,
					zChangeable: false,
					autoSelect: false,
					rotatable: uploadZoneObj.rotatable,
					draggable: uploadZoneObj.draggable,
					resizable: uploadZoneObj.resizable,
					price: uploadZoneObj.price,
					replace: instance.currentUploadZone,
					hasUploadZone: true
				}
			);

		}

		//if topped, z-index can not be changed
		if(parameters.topped) {
			parameters.zChangeable = false;
		}

		//new element added
		if(	typeof parameters.colors === 'object' ||
			parameters.removable ||
			parameters.draggable ||
			parameters.resizable ||
			parameters.rotatable ||
			parameters.zChangeable ||
			parameters.editable ||
			parameters.patternable
			|| parameters.uploadZone
			|| (parameters.colorLinkGroup && parameters.colorLinkGroup.length > 0)) {

			parameters.isEditable = parameters.evented = parameters.selectable = true;

		}

		//upload zones have no controls
		if(!parameters.uploadZone || instance.options.editorMode) {

			if(parameters.draggable) {
				parameters.lockMovementX = parameters.lockMovementY = false;
			}

			if(parameters.rotatable) {
				parameters.lockRotation = false;
				parameters.hasRotatingPoint = true;
			}

			if(parameters.resizable) {
				parameters.lockScalingX = parameters.lockScalingY = false;
			}

			if((parameters.resizable || parameters.rotatable || parameters.removable)) {
				parameters.hasControls = true;
			}

		}

		if(parameters.replace && parameters.replace != '') {

			var replacedElement = instance.getElementByReplace(parameters.replace);

			//element with replace in view found and replaced element is not the new element
			if(replacedElement !== null && replacedElement !== element ) {
				parameters.z = instance.getZIndex(replacedElement);
				parameters.left = replacedElement.left;
				parameters.top = replacedElement.top;
				parameters.autoCenter = false;
				instance.removeElement(replacedElement);
			}

		}

		//needs to before setOptions
		if(parameters.text) {

			var text = parameters.text;
			if(element.maxLength != 0 && text.length > element.maxLength) {
				text = text.substr(0, element.maxLength);
				element.selectionStart = element.maxLength;
			}

			//check lines length
			if(element.maxLines != 0 && text.split("\n").length > element.maxLines) {
				text = text.replace(/([\s\S]*)\n/, "$1");
				element.selectionStart = text.length;
			}

			element.setText(text);
			parameters.text = text;

		}

		delete parameters['paths']; //no paths in parameters
		element.setOptions(parameters);

		if(parameters.autoCenter) {
			instance.centerElement(true, true, element);
		}

		//change element color
		if(parameters.fill !== undefined) {
			instance.changeColor(element, parameters.fill);
			element.pattern = undefined;
		}

		//set pattern
		if(parameters.pattern !== undefined) {
			_setPattern(element, parameters.pattern);
			_setColorPrice(element, parameters.pattern);
		}

		//set filter
		if(parameters.filter) {

			element.filters = [];
			var fabricFilter = _getFabircFilter(parameters.filter);
			if(fabricFilter != null) {
				element.filters.push(fabricFilter);
			}
			element.applyFilters(function() {
				instance.stage.renderAll();
			});

			/*element.filters = [];

			var fabricFilter = _getFabircFilter(parameters.filter);
			if(fabricFilter != null) {
				element.filters.push(fabricFilter);
				element.filters.push(new fabric.Image.filters.Resize({
		            resizeType: 'hermite', scaleX: element.scaleX, scaleY: element.scaleY
		        }));
			}
			element.applyFilters(function() {
				instance.stage.renderAll();
			});*/

		}

		//clip element
		if((parameters.boundingBox && parameters.boundingBoxMode === 'clipping') || parameters.hasUploadZone) {
			_clipElement(element);
		}

		//set z position
		if(parameters.z >= 0) {
			element.moveTo(parameters.z);
			_bringToppedElementsToFront();
		}

		if(parameters.fontFamily !== undefined) {
			_renderOnFontLoaded(parameters.fontFamily, element);
		}

		if(element.curved) {

			if(parameters.curveRadius) {
				element.set('radius', parameters.curveRadius);
			}

			if(parameters.curveSpacing) {
				element.set('spacing', parameters.curveSpacing);
			}

			if(parameters.curveReverse !== undefined) {
				element.set('reverse', parameters.curveReverse);
			}

		}

		if(element.uploadZone) {
			element.evented = element.opacity !== 0;
		}

		//check if a upload zone contains an object
		var objects = instance.stage.getObjects();
		for(var i=0; i < objects.length; ++i) {

			var object = objects[i];

			if(object.uploadZone && object.title == parameters.replace) {
				object.opacity = 0;
				object.evented = false;
			}

		}

		element.setCoords();
		instance.stage.renderAll().calcOffset();

		$this.trigger('elementModify', [element, parameters]);

		_checkContainment(element);

		//select element
		if(parameters.autoSelect && element.isEditable && !instance.options.editorMode && $(instance.stage.getElement()).is(':visible')) {

			setTimeout(function() {
				instance.stage.setActiveObject(element);
				instance.stage.renderAll();
			}, 1);

		}

	};

	/**
	 * Returns the bounding box of an element.
	 *
	 * @method getBoundingBoxCoords
	 * @param {fabric.Object} element A fabric object
	 * @return {Object | Boolean} The bounding box object with x,y,width and height or false.
	 */
	this.getBoundingBoxCoords = function(element) {

		if(element.boundingBox || element.uploadZone) {

			if(typeof element.boundingBox == "object") {

				return {
					left: element.boundingBox.x,
					top: element.boundingBox.y,
					width: element.boundingBox.width,
					height: element.boundingBox.height
				};

			}
			else {

				var objects = instance.stage.getObjects();

				for(var i=0; i < objects.length; ++i) {

					//get all layers from first view
					var object = objects[i];
					if(element.boundingBox == object.title) {

						var topLeftPoint = object.getPointByOrigin('left', 'top');

						return {
							left: topLeftPoint.x,
							top: topLeftPoint.y,
							width: object.getWidth(),
							height: object.getHeight()
						};

						break;
					}

				}

			}

		}

		return false;

	};

	/**
	 * Creates a data URL of the view.
	 *
	 * @method toDataURL
	 * @param {Function} callback A function that will be called when the data URL is created. The function receives the data URL.
	 * @param {String} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {Object} [options] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 * @param {String} [watermarkImg=false] URL to an imae that will be added as watermark.
	 */
	this.toDataURL = function(callback, backgroundColor, options, watermarkImg) {

		callback = typeof callback !== 'undefined' ? callback : function() {};
		backgroundColor = typeof backgroundColor !== 'undefined' ? backgroundColor : 'transparent';
		options = typeof options !== 'undefined' ? options : {};
		watermarkImg = typeof watermarkImg !== 'undefined' ? watermarkImg : false;

		var snapLinesGroup = instance.getElementByTitle('snap-lines-group');
		if(snapLinesGroup) {
			snapLinesGroup.visible = false;
		}

		instance.deselectElement();
		instance.stage.setDimensions({width: instance.options.stageWidth, height: instance.options.stageHeight}).setZoom(1);

		instance.stage.setBackgroundColor(backgroundColor, function() {

			if(watermarkImg) {
				instance.stage.add(watermarkImg);
				watermarkImg.center();
				watermarkImg.bringToFront();
			}

			//get data url
			try {
				callback(instance.stage.toDataURL(options));
			}
			catch(evt) {
				callback('');
				_imageColorError();
			}

			if(watermarkImg) {
				instance.stage.remove(watermarkImg);
			}

			if($(instance.stage.wrapperEl).is(':visible')) {
				instance.resetCanvasSize();
			}

			instance.stage.setBackgroundColor('transparent', function() {
				instance.stage.renderAll();
			});

			if(snapLinesGroup) {
				snapLinesGroup.visible = true;
			}

		});

	};

	/**
	 * Returns the view as SVG.
	 *
	 * @method toSVG
	 * @return {String} A XML representing a SVG.
	 */
	this.toSVG = function(options, reviver) {

		var svg;

		instance.deselectElement();
		instance.stage.setDimensions({width: instance.options.stageWidth, height: instance.options.stageHeight}).setZoom(1);

		//get data url
		try {
			svg = instance.stage.toSVG(options, reviver);
		}
		catch(evt) {
			_imageColorError();
		}

		if($(instance.stage.wrapperEl).is(':visible')) {
			instance.resetCanvasSize();
		}

		$svg = $(svg);

		$svg.children('rect').remove(); //remove bounding boxes
		$svg.children('g').children('[style*="visibility: hidden"]').parent('g').remove(); //remove hidden elements
		svg = $('<div>').append($svg.clone()).html().replace(/(?:\r\n|\r|\n)/g, ''); //replace all newlines

		return svg;

	};

	/**
	 * Removes the canvas and resets all relevant view properties.
	 *
	 * @method clear
	 */
	this.clear = function() {

		instance.undos = [];
		instance.redos = [];
		instance.elements = null;
		instance.totalPrice = 0;
		instance.stage.clear();
		instance.stage.wrapperEl.remove();

		$this.trigger('clear');
		$this.trigger('priceChange', [0, 0]);

	};

	/**
	 * Undo the last change.
	 *
	 * @method undo
	 */
	this.undo = function() {

		if(instance.undos.length > 0) {

			var last = instance.undos.pop();

			//check if element was removed
			if(last.interaction === 'remove') {

				instance.stage.add(last.element);
				last.interaction = 'add';
			}
			else if(last.interaction === 'add') {
				instance.stage.remove(last.element);
				last.interaction = 'remove';
			}

			_setUndoRedo(false, {
				element: last.element,
				parameters: instance.getElementJSON(last.element),
				interaction: last.interaction
			});

			instance.setElementParameters(last.parameters, last.element, false);

			this.deselectElement();
			_elementHasUploadZone(last.element);

		}

		return instance.undos;

	};

	/**
	 * Redo the last change.
	 *
	 * @method redo
	 */
	this.redo = function() {

		if(instance.redos.length > 0) {

			var last = instance.redos.pop();

			if(last.interaction === 'remove') {
				instance.stage.add(last.element);
				last.interaction = 'add';
			}
			else if(last.interaction === 'add') {
				instance.stage.remove(last.element);
				last.interaction = 'remove';
			}

			_setUndoRedo({
				element: last.element,
				parameters: instance.getElementJSON(last.element),
				interaction: last.interaction
			});

			instance.setElementParameters(last.parameters, last.element, false);

			this.deselectElement();
			_elementHasUploadZone(last.element);

		}

		return instance.redos;

	};

	/**
	 * Get the canvas(stage) JSON.
	 *
	 * @method getJSON
	 * @return {Object} An object with properties.
	 */
	this.getJSON = function() {

		var parameterKeys = fpdOptions.getParameterKeys();

		parameterKeys = parameterKeys.concat(instance.propertiesToInclude);

		return instance.stage.toJSON(parameterKeys);

	};

	/**
	 * Resizes the canvas responsive.
	 *
	 * @method resetCanvasSize
	 */
	this.resetCanvasSize = function() {

		instance.responsiveScale = $productStage.outerWidth() < instance.options.stageWidth ? $productStage.outerWidth() / instance.options.stageWidth : 1;
		instance.responsiveScale = parseFloat(Number(instance.responsiveScale.toFixed(2)));
		instance.responsiveScale = instance.responsiveScale > 1 ? 1 : instance.responsiveScale;

		if(!instance.options.responsive) {
			instance.responsiveScale = 1;
		}

		instance.stage.setDimensions({width: $productStage.width(), height: instance.options.stageHeight * instance.responsiveScale})
		.setZoom(instance.responsiveScale)
		.calcOffset()
		.renderAll();

		$productStage.height(instance.stage.height);

		var $container = $productStage.parents('.fpd-container:first');
		if($container.size() > 0) {
			$container.height($container.hasClass('fpd-sidebar') ? instance.stage.height : 'auto');
			$container.width($container.hasClass('fpd-topbar') ? instance.options.stageWidth : 'auto');
		}

		return instance.responsiveScale;

	};

	/**
	 * Gets an elment by replace property.
	 *
	 * @method getElementByReplace
	 */
	this.getElementByReplace = function(replaceValue) {

		var objects = instance.stage.getObjects();
		for(var i = 0; i < objects.length; ++i) {
			var object = objects[i];
			if(object.replace === replaceValue) {
				return object;
				break;
			}
		}

		return null;

	};

	/**
	 * Gets the JSON of an element.
	 *
	 * @method getElementJSON
	 * @param {String} [element] The target element. If not set, it it will use the current selected.
	 * @param {Boolean} [includeFabricProperties=false] Include the properties from {{#crossLink "FancyProductDesignerView/propertiesToInclude:property"}}{{/crossLink}}.
	 * @return {Object} An object with properties.
	 */
	this.getElementJSON = function(element, includeFabricProperties) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;
		includeFabricProperties = typeof includeFabricProperties === 'undefined' ? false : includeFabricProperties;

		if(!element) { return {}; }

		var properties = Object.keys(instance.options.elementParameters),
			additionalKeys  = FPDUtil.getType(element.type) === 'text' ? Object.keys(instance.options.textParameters) : Object.keys(instance.options.imageParameters);

		properties = $.merge(properties, additionalKeys);

		if(includeFabricProperties) {
			properties = $.merge(properties, instance.propertiesToInclude);
		}

		if(element.uploadZone) {
			properties.push('customAdds');
		}

		if(FPDUtil.getType(element.type) === 'text') {
			properties.push('text');
		}
		else {
			properties.push('width');
			properties.push('height');
		}

		properties.push('isEditable');
		properties.push('hasUploadZone');
		properties.push('clippingRect');
		properties.push('evented');
		properties.push('isCustom');
		properties = properties.sort();

		if(includeFabricProperties) {

			return element.toJSON(properties);

		}
		else {

			var json = {};
			for(var i=0; i < properties.length; ++i) {
				var prop = properties[i];
				if(element[prop] !== undefined) {
					json[prop] = element[prop];
				}

			}

			return json;
		}

	};

	/**
	 * Centers an element horizontal or/and vertical.
	 *
	 * @method centerElement
	 * @param {Boolean} h Center horizontal.
	 * @param {Boolean} v Center vertical.
	 * @param {fabric.Object} [element] The element to center. If not set, it centers the current selected element.
	 */
	this.centerElement = function(h, v, element) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;

		_centerObject(element, h, v, instance.getBoundingBoxCoords(element));
		element.autoCenter = false;

	};

	/**
	 * Aligns an element.
	 *
	 * @method alignElement
	 * @param {String} pos Allowed values: left, right, top or bottom.
	 * @param {fabric.Object} [element] The element to center. If not set, it centers the current selected element.
	 */
	this.alignElement = function(pos, element) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;

		var localPoint = element.getPointByOrigin('left', 'top'),
			boundingBox = instance.getBoundingBoxCoords(element),
			posOriginX = 'left',
			posOriginY = 'top';

		if(pos === 'left') {

			localPoint.x = boundingBox ? boundingBox.left + 1 : 0;
			localPoint.x += element.padding;

		}
		else if(pos === 'top') {

			localPoint.y = boundingBox ? boundingBox.top + 1 : 0;
			localPoint.y += element.padding;

		}
		else if(pos === 'right') {

			localPoint.x = boundingBox ? boundingBox.left + boundingBox.width - element.padding : instance.options.stageWidth ;
			posOriginX = 'right';

		}
		else {

			localPoint.y = boundingBox ? boundingBox.top + boundingBox.height - element.padding : instance.options.stageHeight ;
			posOriginY = 'bottom';

		}

		element.setPositionByOrigin(localPoint, posOriginX, posOriginY);

		instance.stage.renderAll();
		element.setCoords();

		_checkContainment(element);

	};

	/**
	 * Gets the z-index of an element.
	 *
	 * @method getZIndex
	 * @param {fabric.Object} [element] The element to center. If not set, it centers the current selected element.
	 * @return {Number} The index.
	 */
	this.getZIndex = function(element) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;

		var objects = instance.stage.getObjects();
		return objects.indexOf(element);
	};

	/**
	 * Changes the color of an element.
	 *
	 * @method changeColor
	 * @param {fabric.Object} element The element to colorize.
	 * @param {String} hex The color.
	 * @param {Boolean} temp Only save color temporary.
	 * @param {Boolean} colorLinking Use color linking.
	 */
	this.changeColor = function(element, hex, temp, colorLinking) {

		temp = typeof temp === 'undefined' ? false : temp;
		colorLinking = typeof colorLinking === 'undefined' ? true : colorLinking;

		//check if hex color has only 4 digits, if yes, append 3 more
		if(typeof hex === 'string' && hex.length == 4) {
			hex += hex.substr(1, hex.length);
		}

		//text
		if(FPDUtil.getType(element.type) === 'text') {

			hex = hex === false ? '#000000' : hex;

			//set color of a text element
			element.setFill(hex);
			instance.stage.renderAll();

			if(temp == false) { element.pattern = null; }

		}
		//path groups (svg)
		else if(element.type == 'path-group' && typeof hex == 'object') {

			for(var i=0; i<hex.length; ++i) {
				element.paths[i].setFill(hex[i]);
				instance.stage.renderAll();
			}

		}
		//image
		else {

			var colorizable = FPDUtil.elementIsColorizable(element);
			//colorize png or dataurl image
			if(colorizable == 'png' || colorizable == 'dataurl') {

				element.filters = [];
				if(hex !== false) {
					element.filters.push(new fabric.Image.filters.Tint({color: hex}));
				}

				try {
					element.applyFilters(function() {
						instance.stage.renderAll();
					});
				}
				catch(evt) {
					_imageColorError();
				}

			}
			//colorize svg
			else if(colorizable == 'svg') {
				element.setFill(hex);
			}

		}

		if(temp == false) { element.fill = hex; }

		_setColorPrice(element, hex);

		/**
	     * Gets fired when the color of an element is changing.
	     *
	     * @event FancyProductDesignerView#elementColorChange
	     * @param {Event} event
	     * @param {fabric.Object} element
	     * @param {String} hex
	     * @param {Boolean} colorLinking
	     */
		$this.trigger('elementColorChange', [element, hex, colorLinking]);

	};

	/**
	 * Gets the index of the view.
	 *
	 * @method getIndex
	 * @return {Number} The index.
	 */
	this.getIndex = function() {

		return $productStage.children('.fpd-view-stage').index(instance.stage.wrapperEl);

	};

	/**
	 * Gets an upload zone by title.
	 *
	 * @method getUploadZone
	 * @param {String} title The target title of an element.
	 * @return {fabric.Object} A fabric object representing the upload zone.
	 */
	this.getUploadZone = function(title) {

		var objects = instance.stage.getObjects();

		for(var i=0; i < objects.length; ++i) {

			if(objects[i].uploadZone && objects[i].title == title) {
				return objects[i];
				break;
			}

		}

	};

	/**
	 * This method needs to be called after the instance of {{#crossLink "FancyProductDesignerView"}}{{/crossLink}} is set.
	 *
	 * @method setup
	 */
	this.setup = function() {

		function _removeNotValidElementObj(element) {

			if(element.type === undefined || element.source === undefined || element.title === undefined) {

				var removeInd = instance.elements.indexOf(element)
				if(removeInd !== -1) {
					instance.elements.splice(removeInd, 1);
					FPDUtil.log('Element index '+removeInd+' from instance.elements removed, its not a valid element object!', 'info');
					_onElementAdded();
					return true;
				}

			}

			return false;

		};

		var element = instance.elements[0];

		//check if view contains at least one element
		if(element) {

			var countElements = 0;
			//iterative function when element is added, add next one
			function _onElementAdded() {

				countElements++;

				//add all elements of a view
				if(countElements < instance.elements.length) {
					var element = instance.elements[countElements];
					if(!_removeNotValidElementObj(element)) {
						instance.addElement( element.type, element.source, element.title, element.parameters);
					}

				}
				//all elements are added
				else {

					$this.off('elementAdd', _onElementAdded);
					_afterSetup();

				}

			};

			//listen when element is added
			$this.on('elementAdd', _onElementAdded);
			//add first element of view
			if(!_removeNotValidElementObj(element)) {
				instance.addElement( element.type, element.source, element.title, element.parameters);
			}


		}
		//no elements in view, view is created without elements
		else {
			_afterSetup();
		}

	};

	_initialize();

};

var FPDToolbar = function($uiElementToolbar, fpdInstance) {

	var instance = this,
		$body = $('body'),
		$uiToolbarSub = $uiElementToolbar.children('.fpd-sub-panel'),
		$colorPicker = $uiElementToolbar.find('.fpd-color-wrapper'),
		$fontFamilyDropdown = $uiElementToolbar.find('.fpd-tool-font-family'),
		colorDragging = false,
		colorChanged = false; //fix for change event in spectrum

	this.isTransforming = false; //is true, while transforming via slider
	this.placement = fpdInstance.mainOptions.toolbarPlacement;

	var _initialize = function() {

		$uiElementToolbar.appendTo($body);
		instance.setPlacement(instance.placement);

		$body.mousedown(function(evt) { //check when transforming via slider

			if($(evt.target).parents('.fpd-range-slider').length > 0) {
				$(evt.target).parents('.fpd-range-slider').prev('input').change();
				instance.isTransforming = true;
			}

		})
		.mouseup(function() {
			instance.isTransforming = false;
		});

		//set max values
		var maxValuesKeys = Object.keys(fpdInstance.mainOptions.maxValues);
		for(var i=0; i < maxValuesKeys.length; ++i) {

			var maxValueProp = maxValuesKeys[i];
			$uiElementToolbar.find('[data-control="'+maxValueProp+'"]').attr('max', fpdInstance.mainOptions.maxValues[maxValueProp]);

		}

		//first-level tools
		$uiElementToolbar.find('.fpd-row > div').click(function() {

			var $this = $(this);

			$uiElementToolbar.find('.fpd-row > div').not($this).removeClass('fpd-active');

			if($this.data('panel')) { //has a sub a panel

				$this.tooltipster('hide');

				$this.toggleClass('fpd-active'); //activate panel opener
				$uiToolbarSub.toggle($this.hasClass('fpd-active')) //display sub wrapper, if opener is active
				.children().removeClass('fpd-active') //hide all panels in sub wrapper
				.filter('.fpd-panel-'+$this.data('panel')).addClass('fpd-active'); //display related panel

				$uiToolbarSub.css({
					top: $this.parent('.fpd-row').position().top+$this.position().top+$this.outerHeight(true),
					left: $this.parent().position().left - 5
				});

				instance.updatePosition(fpdInstance.currentElement);

			}
			else {

				$uiToolbarSub.hide();

			}

		});

		//create range slider
		$uiToolbarSub.find('.fpd-slider-range').rangeslider({
			polyfill: false,
			rangeClass: 'fpd-range-slider',
			disabledClass: 'fpd-range-slider--disabled',
			horizontalClass: 'fpd-range-slider--horizontal',
		    verticalClass: 'fpd-range-slider--vertical',
		    fillClass: 'fpd-range-slider__fill',
		    handleClass: 'fpd-range-slider__handle',
		    onSlide: function(pos, value) {

			    this.$element.parent().prev('.fpd-slider-number').val(value).change();

			    //proportional scaling
			    if(this.$element.data('control') === 'scaleX' && fpdInstance.currentElement && fpdInstance.currentElement.lockUniScaling) {
				    $uiToolbarSub.find('.fpd-slider-number[data-control="scaleY"]').val(value).change();
			    }

		    },
		    onSlideEnd: function() {

			    instance.isTransforming = false;
			    instance.updatePosition(fpdInstance.currentElement);

		    }
		});

		//patterns
		if(fpdInstance.mainOptions.patterns && fpdInstance.mainOptions.patterns.length > 0) {

			for(var i=0; i < fpdInstance.mainOptions.patterns.length; ++i) {

				var patternUrl = fpdInstance.mainOptions.patterns[i];
				$uiToolbarSub.find('.fpd-patterns > .fpd-grid').append('<div class="fpd-item" data-pattern="'+patternUrl+'"><picture style="background-image: url('+patternUrl+');"></picture></div>')
				.children(':last').click(function() {

					var patternUrl = $(this).data('pattern');
					$uiElementToolbar.find('.fpd-current-fill').css('background', 'url('+patternUrl+')');
					fpdInstance.currentViewInstance.setElementParameters( {pattern: patternUrl} );


				});

			}

		}

		//filters
		$uiToolbarSub.find('.fpd-filters .fpd-item').click(function() {

			var $this = $(this);
			$uiElementToolbar.find('.fpd-current-fill').css('background', $this.children('picture').css('background-image'));
			fpdInstance.currentViewInstance.setElementParameters( {filter: $this.data('filter')} );

		});

		//position
		$uiToolbarSub.find('.fpd-panel-position .fpd-icon-button-group > span').click(function() {

			var $this = $(this);
			if($this.hasClass('fpd-align-left')) {
				fpdInstance.currentViewInstance.alignElement('left');
			}
			else if($this.hasClass('fpd-align-top')) {
				fpdInstance.currentViewInstance.alignElement('top');
			}
			else if($this.hasClass('fpd-align-right')) {
				fpdInstance.currentViewInstance.alignElement('right');
			}
			else if($this.hasClass('fpd-align-bottom')) {
				fpdInstance.currentViewInstance.alignElement('bottom');
			}
			else if($this.hasClass('fpd-align-center-h')) {
				fpdInstance.currentViewInstance.centerElement(true, false);
			}
			else if($this.hasClass('fpd-align-center-v')) {
				fpdInstance.currentViewInstance.centerElement(false, true);
			}
			else if($this.hasClass('fpd-flip-h')) {
				fpdInstance.currentViewInstance.setElementParameters({flipX: !fpdInstance.currentElement.getFlipX()});
			}
			else if($this.hasClass('fpd-flip-v')) {
				fpdInstance.currentViewInstance.setElementParameters({flipY: !fpdInstance.currentElement.getFlipY()});
			}

			instance.updatePosition(fpdInstance.currentElement);

		});

		//move layer position
		$uiElementToolbar.find('.fpd-tool-move-up, .fpd-tool-move-down').click(function() {

			var currentZ = fpdInstance.currentViewInstance.getZIndex();

			currentZ = $(this).hasClass('fpd-tool-move-up') ? currentZ+1 : currentZ-1;
			currentZ = currentZ < 0 ? 0 : currentZ;

			fpdInstance.currentViewInstance.setElementParameters( {z: currentZ} );

	    });

		//reset element
	    $uiElementToolbar.find('.fpd-tool-reset').click(function() {

			$uiElementToolbar.find('.tooltipstered').tooltipster('destroy');
		    fpdInstance.currentViewInstance.setElementParameters( fpdInstance.currentElement.originParams );
			instance.update(fpdInstance.currentElement);
			FPDUtil.updateTooltip();

		});

		//append fonts to dropdown
		if(fpdInstance.mainOptions.fonts && fpdInstance.mainOptions.fonts.length > 0) {

			fpdInstance.mainOptions.fonts.sort();

			for(var i=0; i < fpdInstance.mainOptions.fonts.length; ++i) {

				var font = fpdInstance.mainOptions.fonts[i];
				$fontFamilyDropdown.children('.fpd-dropdown-list')
				.append('<span class="fpd-item" data-value="'+font+'">'+font+'</span>')
				.children(':last').css('font-family', font);

			}

		}
		else {
			$fontFamilyDropdown.hide();
		}

		//edit text
		var tempFocusText = null;
	    $uiToolbarSub.find('.fpd-panel-edit-text textarea').keyup(function(evt) {

		    evt.stopPropagation;
		    evt.preventDefault();

		    var selectionStart = this.selectionStart,
			 	selectionEnd = this.selectionEnd;

			fpdInstance.currentViewInstance.currentElement.isEditing = true;
		    fpdInstance.currentViewInstance.setElementParameters( {text: this.value} );

		    this.selectionStart = selectionStart;
			this.selectionEnd = selectionEnd;

	    })
	    .focus(function() {
		    tempFocusText = fpdInstance.currentViewInstance.currentElement;
		    tempFocusText.isEditing = true;
	    })
	    .focusout(function() {
		    tempFocusText.isEditing = false;
		    tempFocusText = null;
	    });

		//call content in tab
		$uiToolbarSub.find('.fpd-panel-tabs > span').click(function() {

			var $this = $(this);

			$this.addClass('fpd-active').siblings().removeClass('fpd-active');
			$this.parent().nextAll('.fpd-panel-tabs-content').children('[data-id="'+this.id+'"]').addClass('fpd-active')
			.siblings().removeClass('fpd-active');

		});


		$uiElementToolbar.find('.fpd-number').change(function() {

			var $this = $(this),
				numberParameters = {};

			if( this.value > Number($this.attr('max')) ) {
				this.value = Number($this.attr('max'));
			}

			if( this.value < Number($this.attr('min')) ) {
				this.value = Number($this.attr('min'));
			}

			if($this.hasClass('fpd-slider-number')) {
				$this.next('.fpd-range-wrapper').children('input').val(this.value)
				.rangeslider('update', true, false);

				if($this.data('control') === 'scaleX' && fpdInstance.currentElement && fpdInstance.currentElement.lockUniScaling) {
					$uiElementToolbar.find('[data-control="scaleY"]').val(this.value).change();
				}

			}

			numberParameters[$this.data('control')] = Number(this.value);

			if(fpdInstance.currentViewInstance) {

				fpdInstance.currentViewInstance.setElementParameters(
					numberParameters,
					fpdInstance.currentViewInstance.currentElement,
					!instance.isTransforming
				);

			}

		});

		$uiElementToolbar.find('.fpd-toggle').click(function() {

			var $this = $(this).toggleClass('fpd-enabled'),
				toggleParameters = {};

			if(!$this.hasClass('fpd-curved-text-switcher')) {

				toggleParameters[$this.data('control')] = $this.hasClass('fpd-enabled') ? $this.data('enabled') : $this.data('disabled');

				if($this.hasClass('fpd-tool-uniscaling-locker')) {
					_lockUniScaling($this.hasClass('fpd-enabled'));
				}

				fpdInstance.currentViewInstance.setElementParameters(toggleParameters);

			}


		});

		$uiElementToolbar.find('.fpd-dropdown .fpd-item').click(function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				$current = $this.parent().prevAll('.fpd-dropdown-current:first'),
				value = $this.data('value'),
				parameter = {};

			var control = $current.is('input') ? $current.val(value) : $current.html($this.clone()).data('value', value);

			parameter[$current.data('control')] = value;

			if($current.data('control') === 'fontFamily') {
				$current.css('font-family', value);
			}

			fpdInstance.currentViewInstance.setElementParameters(parameter);

			$this.siblings('.fpd-item').show();

		});

		$uiElementToolbar.find('.fpd-dropdown.fpd-search > input').keyup(function() {

			var $items = $(this).css('font-family', 'Helvetica').nextAll('.fpd-dropdown-list:first')
			.children('.fpd-item').hide();

			if(this.value.length === 0) {
				$items.show();
			}
			else {
				$items.filter(':containsCaseInsensitive("'+this.value+'")').show();
			}

		});

	};


	var _toggleUiTool = function(tool, showHide) {

		showHide = showHide === undefined ? true : showHide;

		var $tool = $uiElementToolbar.find('.fpd-tool-'+tool).toggle(showHide); //show tool
		$tool.parent('.fpd-row').toggle(Boolean($tool.parent('.fpd-row').children('div[style*="block"]').length > 0)); //show row if at least one visible tool in row

		return $tool;

	};

	var _toggleSubTool = function(panel, tool, showHide) {

		showHide = Boolean(showHide);

		return $uiToolbarSub.children('.fpd-panel-'+panel)
		.children('.fpd-tool-'+tool).toggle(showHide);
	};

	var _togglePanelTab = function(panel, tab, showHide) {

		$uiToolbarSub.children('.fpd-panel-'+panel)
		.find('.fpd-panel-tabs #'+tab).toggleClass('fpd-disabled', !showHide);

	};

	var _setElementColor = function(color) {

		$uiElementToolbar.find('.fpd-current-fill').css('background', color);
		fpdInstance.currentViewInstance.changeColor(fpdInstance.currentViewInstance.currentElement, color);

	};

	var _lockUniScaling = function(toggle) {

		 $uiToolbarSub.find('.fpd-tool-uniscaling-locker > span').removeClass().addClass(toggle ? 'fpd-icon-locked' : 'fpd-icon-unlocked');
		 $uiToolbarSub.find('.fpd-tool-scaleY').toggleClass('fpd-disabled', toggle);

	};

	this.update = function(element) {

		this.hideTools();

		_toggleUiTool('reset');

		if(element.availableFilters && element.availableFilters.length > 0 && element.type == 'image') {

			_toggleUiTool('fill');
			_togglePanelTab('fill', 'filter', true);

			$uiToolbarSub.find('.fpd-filters .fpd-item:not(.fpd-filter-none)').addClass('fpd-hidden');
			for(var i=0; i < element.availableFilters.length; ++i) {
				var filterName = element.availableFilters[i];
				$uiToolbarSub.find('.fpd-filter-'+filterName).removeClass('fpd-hidden');
			}

		}

		//colors array, true=svg colorization,
		if(FPDUtil.elementHasColorSelection(element)) {

			colorChanged = false;

			if(element.colorLinkGroup) {
				var availableColors = fpdInstance.colorLinkGroups[element.colorLinkGroup].colors;
			}
			else {
				var availableColors = element.colors;
			}

			$colorPicker.empty().removeClass('fpd-colorpicker-group');

			//path (svg)
			if(element.type == 'path-group') {

				for(var i=0; i<element.paths.length; ++i) {
					var path = element.paths[i],
						color = tinycolor(path.fill);

					$colorPicker.append('<input type="text" value="'+color.toHexString()+'" />');
				}

				$colorPicker.addClass('fpd-colorpicker-group').children('input').spectrum('destroy').spectrum({
					showPaletteOnly: $.isArray(element.colors),
					preferredFormat: "hex",
					showInput: true,
					showInitial: true,
					showButtons: false,
					showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
					palette: $.isArray(element.colors) ? element.colors : fpdInstance.mainOptions.colorPickerPalette,
					show: function(color) {

						var svgColors = FPDUtil.changePathColor(
							fpdInstance.currentElement,
							$colorPicker.children('input').index(this),
							color
						);

						element._tempFill = svgColors;

					},
					move: function(color) {

						var svgColors = FPDUtil.changePathColor(
							fpdInstance.currentElement,
							$colorPicker.children('input').index(this),
							color
						);

						fpdInstance.currentViewInstance.changeColor(fpdInstance.currentElement, svgColors);

					},
					change: function(color) {

						var svgColors = FPDUtil.changePathColor(
							element,
							$colorPicker.children('input').index(this),
							color
						);

						$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
						fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

					}
				});

			}
			//color list
			else if(availableColors.length > 1) {

				$colorPicker.html('<div class="fpd-color-palette fpd-grid"></div>');

				for(var i=0; i<availableColors.length; ++i) {

					var color = availableColors[i];
						colorName = fpdInstance.mainOptions.hexNames[color.replace('#', '')];

					colorName = colorName ? colorName : color;
					$colorPicker.children('.fpd-grid').append('<div class="fpd-item fpd-tooltip" title="'+colorName+'" style="background-color: '+color+';"></div>')
					.children('.fpd-item:last').click(function() {
						var color = tinycolor($(this).css('backgroundColor'));
						fpdInstance.currentViewInstance.setElementParameters({fill: color.toHexString()});
					});

				}

				FPDUtil.updateTooltip();

			}
			//colorwheel
			else {

				$colorPicker.html('<input type="text" value="'+(element.fill ? element.fill : availableColors[0])+'" />');

				$colorPicker.children('input').spectrum('destroy').spectrum({
					flat: true,
					preferredFormat: "hex",
					showInput: true,
					showInitial: true,
					showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
					palette: fpdInstance.mainOptions.colorPickerPalette,
					show: function(color) {
						element._tempFill = color.toHexString();
					},
					move: function(color) {

						//only non-png images are chaning while dragging
						if(colorDragging === false || FPDUtil.elementIsColorizable(element) !== 'png') {
							_setElementColor(color.toHexString());
						}

					},
					change: function(color) {

						$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
						fpdInstance.currentViewInstance.setElementParameters({fill: color.toHexString()}, element);

					}
				})
				.on('dragstart.spectrum', function() {
					colorDragging = true;
				})
				.on('dragstop.spectrum', function(evt, color) {
					colorDragging = false;
					_setElementColor(color.toHexString());
				});

			}

			_toggleUiTool('fill');
			_togglePanelTab('fill', 'color', true);

		}

		if((element.resizable && FPDUtil.getType(element.type) === 'image') || element.rotatable) {
			_toggleUiTool('transform');
			_toggleSubTool('transform', 'scale', (element.resizable && FPDUtil.getType(element.type) === 'image'));
			//uni scaling tools
			_lockUniScaling(element.lockUniScaling);
			_toggleSubTool('transform', 'uniscaling-locker', element.uniScalingUnlockable);
			_toggleSubTool('transform', 'angle', element.rotatable);
		}

		if(element.draggable || element.resizable) {
			_toggleUiTool('position');
		}

		if(element.zChangeable) {
			_toggleUiTool('move');
		}

		//text options
		if(FPDUtil.getType(element.type) === 'text' && element.editable) {


			if(fpdInstance.mainOptions.patterns.length > 0 && element.patternable) {
				_toggleUiTool('fill');
				_togglePanelTab('fill', 'pattern', true);
			}

			_toggleUiTool('font-family');
			_toggleUiTool('text-size');
			_toggleUiTool('text-line-height');
			_toggleUiTool('text-bold');
			_toggleUiTool('text-italic');
			_toggleUiTool('text-underline');
			_toggleUiTool('text-align');
			_toggleUiTool('text-stroke');
			if(element.curvable) {
				_toggleUiTool('curved-text');
			}
			$uiToolbarSub.find('.fpd-panel-edit-text textarea').val(element.getText());
			_toggleUiTool('edit-text');

			//stroke color
		    $uiToolbarSub.find('.fpd-stroke-color-picker input').spectrum('destroy').spectrum({
				flat: true,
				preferredFormat: "hex",
				showInput: true,
				showInitial: true,
				showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
				palette: fpdInstance.mainOptions.colorPickerPalette,
				move: function(color) {
					instance.isTransforming = true;
					fpdInstance.currentViewInstance.setElementParameters( {stroke: color.toHexString()} );

				}
			});

		}

		//display only enabled tabs and when tabs length > 1
		$uiToolbarSub.find('.fpd-panel-tabs').each(function(index, panelTabs) {

			var $panelTabs = $(panelTabs);
			$panelTabs.toggle($panelTabs.children(':not(.fpd-disabled)').length > 1);
			$panelTabs.children(':not(.fpd-disabled):first').addClass('fpd-active').click();

		});

		//set UI value by selected element
		$uiElementToolbar.find('[data-control]').each(function(index, uiElement) {

			var $uiElement = $(uiElement),
				parameter = $uiElement.data('control');

			if($uiElement.hasClass('fpd-number')) {

				if(element[parameter] !== undefined) {
					var numVal = $uiElement.attr('step') && $uiElement.attr('step').length > 1 ? parseFloat(element[parameter].toFixed(2)) : parseInt(element[parameter]);
					$uiElement.val(numVal);
				}

			}
			else if($uiElement.hasClass('fpd-toggle')) {

				$uiElement.toggleClass('fpd-enabled', element[parameter] === $uiElement.data('enabled'));

			}
			else if($uiElement.hasClass('fpd-current-fill')) {

				var currentFill = element[parameter];

				//fill: hex
				if(typeof currentFill === 'string') {
					$uiElement.css('background', currentFill);
				}
				//fill: pattern or svg fill
				else if(typeof currentFill === 'object') {

					if(currentFill.source) { //pattern
						currentFill = currentFill.source.src;
						$uiElement.css('background', 'url('+currentFill+')');
					}
					else { //svg has fill
						currentFill = currentFill[0];
						$uiElement.css('background', currentFill);
					}

				}
				//element: svg
				else if(element.colors === true && element.type === 'path-group') {
					currentFill = tinycolor(element.paths[0].fill);
					$uiElement.css('background', currentFill);
				}
				//no fill, only colors set
				else if(currentFill === false && element.colors && element.colors[0]) {
					currentFill = element.colors[0];

					$uiElement.css('background', currentFill);
				}
				//image that accepts only filters
				else if(element.filter) {
					$uiElement.css('background', $uiToolbarSub.find('.fpd-filter-'+element.filter+' picture').css('background-image'));
				}

			}
			else if($uiElement.hasClass('fpd-dropdown-current')) {

				if(element[parameter] !== undefined) {

					var value = $uiElement.nextAll('.fpd-dropdown-list:first').children('[data-value="'+element[parameter]+'"]').html();
					$uiElement.is('input') ? $uiElement.val(value) : $uiElement.html(value).data('value');

					if(parameter === 'fontFamily') {
						$uiElement.css('font-family', value);
					}
				}


			}


		});

		instance.updatePosition(element);
		/* maybe later
		setTimeout(function() {

		}, 10);*/

	};

	this.hideTools = function() {

		$uiElementToolbar.children('.fpd-row').hide() //hide row
		.children('div').hide().removeClass('fpd-active'); //hide tool in row

		$uiToolbarSub.hide()//hide sub toolbar
		.children().removeClass('fpd-active')//hide all sub panels in sub toolbar
		.find('.fpd-panel-tabs > span').addClass('fpd-disabled'); //disable all tabs

	};

	this.updatePosition = function(element, showHide) {

		showHide = typeof showHide === 'undefined' ? true : showHide;

		if(!element) {
			this.toggle(false);
			return;
		}

		var oCoords = element.oCoords,
			topOffset = oCoords.mb.y,
			designerOffset = fpdInstance.$productStage.offset(),
			mainWrapperOffset = fpdInstance.$mainWrapper.offset();

		if(instance.placement == 'inside-bottom' || instance.placement == 'inside-top') {

			posLeft = mainWrapperOffset.left;
			topOffset = instance.placement == 'inside-top' ? mainWrapperOffset.top : mainWrapperOffset.top + fpdInstance.$mainWrapper.height();
			$uiElementToolbar.width(fpdInstance.$productStage.width() - parseInt($uiElementToolbar.css('paddingLeft')) * 2);

		}
		else { //dynamic

			//set maximal width
			$uiElementToolbar.width(320);
			//calculate largest width of rows
			var maxWidth = Math.max.apply( null, $( $uiElementToolbar.children('.fpd-row') ).map( function () {
			    return $( this ).outerWidth( true );
			}).get() );
			//set new width
			$uiElementToolbar.width(maxWidth+2);

			topOffset = oCoords.tl.y > topOffset ? oCoords.tl.y : topOffset;
			topOffset = oCoords.tr.y > topOffset ? oCoords.tr.y : topOffset;
			topOffset = oCoords.bl.y > topOffset ? oCoords.bl.y : topOffset;
			topOffset = oCoords.br.y > topOffset ? oCoords.br.y : topOffset;
			topOffset = topOffset + element.padding + element.cornerSize + designerOffset.top;
			topOffset = topOffset > fpdInstance.$productStage.height() + designerOffset.top ? fpdInstance.$productStage.height() + designerOffset.top + 5 : topOffset;
			topOffset = topOffset + 400 > document.body.scrollHeight ? document.body.scrollHeight - 400 : topOffset;

			var posLeft = designerOffset.left + oCoords.mb.x,
				halfWidth =  $uiElementToolbar.outerWidth() * .5;

			posLeft = posLeft < halfWidth ? halfWidth : posLeft; //move toolbar not left outside of document
			posLeft = posLeft > $(window).width() - halfWidth ? $(window).width() - halfWidth : posLeft; //move toolbar not right outside of document

		}

		$uiElementToolbar.css({
			left: posLeft,
			top: topOffset
		}).toggleClass('fpd-show', showHide);

	};

	this.updateUIValue = function(tool, value) {

		var $UIController = $uiElementToolbar.find('[data-control="'+tool+'"]');

		$UIController.val(value);
		$UIController.filter('.fpd-slider-range').rangeslider('update', true, false);

	};

	this.toggle = function(showHide) {

		$uiElementToolbar.toggleClass('fpd-show', showHide);

	};

	this.setPlacement = function(placement) {

		instance.placement = placement;

		//remove fpd-toolbar-placement-* class
		$uiElementToolbar.removeClass (function (index, css) {
		    return (css.match (/(^|\s)fpd-toolbar-placement-\S+/g) || []).join(' ');
		});

		$uiElementToolbar.addClass('fpd-toolbar-placement-'+placement);

	}

	_initialize();

};

var FPDMainBar = function(fpdInstance, $mainBar, $modules, $draggableDialog) {

	var instance = this,
		$body = $('body'),
		$nav = $mainBar.children('.fpd-navigation'),
		$content;

	this.currentModules = fpdInstance.mainOptions.mainBarModules;
	this.$selectedModule = null;
	this.$container = $mainBar;

	var _initialize = function() {

		if(fpdInstance.$container.hasClass('fpd-topbar') && !fpdInstance.$container.hasClass('fpd-main-bar-container-enabled') && fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').size() === 0) { //draggable dialog

			$content = $draggableDialog.addClass('fpd-grid-columns-'+fpdInstance.mainOptions.gridColumns).append('<div class="fpd-content"></div>').children('.fpd-content');

		}
		else {
			$content = $mainBar.append('<div class="fpd-content"></div>').children('.fpd-content');
		}

		instance.$content = $content;

		if(fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').size() > 0) {

			var touchStart = 0,
				panX = 0,
				closeStartX = 0,
				$closeBtn = $mainBar.children('.fpd-close-off-canvas');

			$content.on('touchstart', function(evt) {

				touchStart = evt.originalEvent.touches[0].pageX;
				closeStartX = parseInt($closeBtn.css(fpdInstance.$container.hasClass('fpd-off-canvas-left') ? 'left' : 'right'));

			})
			.on('touchmove', function(evt) {

				evt.preventDefault();

				var moveX = evt.originalEvent.touches[0].pageX;
					panX = touchStart-moveX,
					targetPos = fpdInstance.$container.hasClass('fpd-off-canvas-left') ? 'left' : 'right';

				panX = Math.abs(panX) < 0 ? 0 : Math.abs(panX);
				$content.css(targetPos, -panX);
				$closeBtn.css(targetPos, closeStartX - panX);

			})
			.on('touchend', function(evt) {

				var targetPos = fpdInstance.$container.hasClass('fpd-off-canvas-left') ? 'left' : 'right';

				if(Math.abs(panX) > 100) {

					instance.toggleDialog(false);

				}
				else {
					$content.css(targetPos, 0);
					$closeBtn.css(targetPos, closeStartX);
				}

				panX = 0;

			});

		}

		//close off-canvas
		$mainBar.on('click', '.fpd-close-off-canvas', function(evt) {

			evt.stopPropagation();

			$nav.children('div').removeClass('fpd-active');
			instance.toggleDialog(false);

		});

		$body.append($draggableDialog);
		$draggableDialog.draggable({
			handle: $draggableDialog.find('.fpd-dialog-head'),
			containment: $body
		});

		//select module
		$nav.on('click', '> div', function(evt) {

			evt.stopPropagation();

			var $this = $(this);

			fpdInstance.deselectElement();

			if(fpdInstance.currentViewInstance) {
				fpdInstance.currentViewInstance.currentUploadZone = null;
			}

			$content.find('.fpd-manage-layers-panel')
			.find('.fpd-current-color, .fpd-path-colorpicker').spectrum('destroy');

			if(fpdInstance.$container.hasClass('fpd-topbar') && $this.hasClass('fpd-active')) {

				$this.removeClass('fpd-active');
				instance.toggleDialog(false);

			}
			else {

				instance.callModule($this.data('module'));

			}

		});

		//prevent document scrolling when in dialog content
		$body.on({
		    'mousewheel': function(evt) {

				var $target = $(evt.target);
		        if ($target.hasClass('fpd-draggable-dialog') || $target.parents('.fpd-draggable-dialog').size() > 0) {
			    	evt.preventDefault();
				    evt.stopPropagation();
			    }

		    }
		});

		$content.on('click', '.fpd-bottom-nav > div', function() {

			var $this = $(this);

			$this.addClass('fpd-active').siblings().removeClass('fpd-active');

			var $selectedModule = $this.parent().next().children('[data-module="'+$this.data('module')+'"]').addClass('fpd-active');
			$selectedModule.siblings().removeClass('fpd-active');

			//short timeout, because fpd-grid must be visible
			setTimeout(function() {
				FPDUtil.refreshLazyLoad($selectedModule.find('.fpd-grid'), false);
			}, 10);


		});

		//close dialog
		$body.on('click', '.fpd-close-dialog', function() {

			$nav.children('.fpd-active').removeClass('fpd-active');
			$draggableDialog.removeClass('fpd-active');

		});

		fpdInstance.$container.on('viewSelect', function() {

			if(instance.$selectedModule) {

				if(instance.$selectedModule.filter('[data-module="manage-layers"]').length > 0) {
					ManageLayersModule.createList(fpdInstance, instance.$selectedModule);
				}

			}

		});

		fpdInstance.$container.on('elementAdd elementRemove', function() {

			if(fpdInstance.productCreated && instance.$selectedModule) {

				if(instance.$selectedModule.filter('[data-module="manage-layers"]').length > 0) {
					ManageLayersModule.createList(fpdInstance, instance.$selectedModule);
				}

			}

		});

		instance.setup(instance.currentModules);

	}

	//call module by name
	this.callModule = function(name) {

		var $selectedNavItem = $nav.children('div').removeClass('fpd-active').filter('[data-module="'+name+'"]').addClass('fpd-active');
		instance.$selectedModule = $content.children('div').removeClass('fpd-active').filter('[data-module="'+name+'"]').addClass('fpd-active');

		if($content.parent('.fpd-draggable-dialog').size() > 0) {

			if($draggableDialog.attr('style') === undefined) {
				$draggableDialog.css('top', $mainBar.offset().top + $mainBar.height());
			}
			$draggableDialog.addClass('fpd-active')
			.find('.fpd-dialog-title').text($selectedNavItem.find('.fpd-label').text());

		}

		if(name === 'manage-layers') {

			if(fpdInstance.productCreated) {
				ManageLayersModule.createList(fpdInstance, instance.$selectedModule);
			}

		}

		instance.toggleDialog(true);

		FPDUtil.refreshLazyLoad(instance.$selectedModule.find('.fpd-grid'), false);

	};

	this.callSecondary = function(className) {

		instance.callModule('secondary');

		$content.children('.fpd-secondary-module').children('.'+className).addClass('fpd-active')
		.siblings().removeClass('fpd-active');


		if(className === 'fpd-upload-zone-adds-panel') {
			$content.find('.fpd-upload-zone-adds-panel .fpd-bottom-nav > :not(.fpd-hidden)').first().click();
		}

	};

	this.setContentWrapper = function(wrapper) {

		$draggableDialog.removeClass('fpd-active');

		if(wrapper === 'sidebar') {

			if($nav.children('.fpd-active').size() === 0) {
				$nav.children().first().addClass('fpd-active');
			}

			$content.appendTo($mainBar);

		}
		else if(wrapper === 'draggable-dialog') {

			$content.appendTo($draggableDialog);

		}

		//toogle tooltips
		$nav.children().each(function(i, navItem) {

			var $navItem = $(navItem);
			$navItem.filter('.fpd-tooltip').tooltipster('destroy');
			if(fpdInstance.$container.hasClass('fpd-sidebar')) {
				$navItem.addClass('fpd-tooltip').attr('title', $navItem.children('.fpd-label').text());
			}
			else {
				$navItem.removeClass('fpd-tooltip').removeAttr('title');
			}

		});

		FPDUtil.updateTooltip($nav);

		$nav.children('.fpd-active').click();

	};

	this.toggleDialog = function(toggle) {

		if(fpdInstance.$container.hasClass('fpd-topbar') && fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').size() === 0) {

			toggle = typeof toggle === 'undefined' ? true : toggle;

			$draggableDialog.toggleClass('fpd-active', toggle);

		}

		if(fpdInstance.$container.filter('[class*="fpd-off-canvas-"]').size() > 0) {

			instance.$container.toggleClass('fpd-show', toggle)
			.children('.fpd-close-off-canvas').removeAttr('style');
			instance.$content.removeAttr('style')
			.height(fpdInstance.$mainWrapper.height());

		}

	};

	this.toggleUploadZoneAdds = function(customAdds) {

		var $uploadZoneAddsPanel = $content.find('.fpd-upload-zone-adds-panel');

		$uploadZoneAddsPanel.find('.fpd-add-image').toggleClass('fpd-hidden', !Boolean(customAdds.uploads));
		$uploadZoneAddsPanel.find('.fpd-add-text').toggleClass('fpd-hidden', !Boolean(customAdds.texts));
		$uploadZoneAddsPanel.find('.fpd-add-design').toggleClass('fpd-hidden', !Boolean(customAdds.designs));

		if(fpdInstance.currentElement.price) {
			var price = fpdInstance.mainOptions.priceFormat.replace('%d', fpdInstance.currentElement.price);
			$uploadZoneAddsPanel.find('[data-module="text"] .fpd-btn > .fpd-price').html(' - '+price);
		}
		else {
			$uploadZoneAddsPanel.find('[data-module="text"] .fpd-btn > .fpd-price').html('');
		}


		//select first visible add panel
		$uploadZoneAddsPanel.find('.fpd-off-canvas-nav > :not(.fpd-hidden)').first().click();

	};

	this.setup = function(modules) {

		instance.currentModules = modules;

		var selectedModule = fpdInstance.mainOptions.initialActiveModule;

		//if only modules exist, select it and hide nav
		if(instance.currentModules.length <= 1) {
			selectedModule = instance.currentModules[0] ? instance.currentModules[0] : '';
			$nav.addClass('fpd-hidden');
		}
		else {
			$nav.removeClass('fpd-hidden');
		}

		$nav.empty();
		$content.empty();

		//add selected modules
		for(var i=0; i < modules.length; ++i) {

			var module = modules[i],
				$module = $modules.children('[data-module="'+module+'"]'),
				$moduleClone = $module.clone(),
				navItemClass = fpdInstance.$container.hasClass('fpd-sidebar') ? 'class="fpd-tooltip"' : '',
				navItemTitle = fpdInstance.$container.hasClass('fpd-sidebar') ? 'title="'+$module.data('title')+'"' : '';

			$nav.append('<div data-module="'+module+'" '+navItemClass+' '+navItemTitle+'><span class="'+$module.data('moduleicon')+'"></span><span class="fpd-label">'+$module.data('title')+'</span></div>');
			$content.append($moduleClone);

			if(module === 'products') {
				new ProductsModule(fpdInstance, $moduleClone);
			}
			else if(module === 'text') {
				new TextModule(fpdInstance, $moduleClone);
			}
			else if(module === 'designs') {
				new DesignsModule(fpdInstance, $moduleClone);
			}
			else if(module === 'images') {
				new ImagesModule(fpdInstance, $moduleClone);
			}

		}

		if($content.children('[data-module="manage-layers"]').length === 0) {
			$content.append($modules.children('[data-module="manage-layers"]').clone());
		}

		$content.append($modules.children('[data-module="secondary"]').clone());

		//add upload zone modules
		var uploadZoneModules = ['images', 'text', 'designs'];
		for(var i=0; i < uploadZoneModules.length; ++i) {

			var module = uploadZoneModules[i],
				$module = $modules.children('[data-module="'+module+'"]'),
				$moduleClone = $module.clone();

			$content.find('.fpd-upload-zone-content').append($moduleClone);

			if(module === 'text') {
				new TextModule(fpdInstance, $moduleClone);
			}
			else if(module === 'designs') {
				new DesignsModule(fpdInstance, $moduleClone);
			}
			else if(module === 'images') {
				new ImagesModule(fpdInstance, $moduleClone);
			}

		}

		if(fpdInstance.$container.hasClass('fpd-sidebar') && selectedModule == '') {
			selectedModule = $nav.children().first().data('module');
		}
		$nav.children('[data-module="'+selectedModule+'"]').click();

	};

	_initialize();

};

FPDMainBar.availableModules = [
	'products',
	'images',
	'text',
	'designs',
	'manage-layers'
];

var FPDActions = function(fpdInstance, $actions){

	var instance = this,
		snapLinesGroup;

	this.currentActions = fpdInstance.mainOptions.actions;

	var _initialize = function() {

		//add set action buttons
		instance.setup(instance.currentActions);

		fpdInstance.$container.on('viewSelect', function() {

			instance.resetAllActions();

		});

		//action click handler
		fpdInstance.$mainWrapper.on('click', '.fpd-actions-wrapper .fpd-action-btn', function() {

			var $this = $(this),
				action = $this.data('action');

			if($this.hasClass('tooltipstered')) {
				$this.tooltipster('hide');
			}

			fpdInstance.deselectElement();

			if(action === 'print') {

				fpdInstance.print();

			}
			else if(action === 'reset-product') {

				fpdInstance.loadProduct(fpdInstance.currentViews);

			}
			else if(action === 'undo') {

				fpdInstance.currentViewInstance.undo();

			}
			else if(action === 'redo') {

				fpdInstance.currentViewInstance.redo();

			}
			else if(action === 'info') {

				FPDUtil.showModal($this.children('.fpd-info-content').text());

			}
			else if(action === 'preview-lightbox') {

				fpdInstance.getProductDataURL(function(dataURL) {

					var image = new Image();
					image.src = dataURL;

					image.onload = function() {
						FPDUtil.showModal('<img src="'+this.src+'" download="product.png" />', true);
					}

				});

			}
			else if(action === 'save') {

				var $prompt = FPDUtil.showModal(fpdInstance.getTranslation('actions', 'save_placeholder'), false, 'prompt');
				$prompt.find('.fpd-btn').text(fpdInstance.getTranslation('actions', 'save')).click(function() {

					fpdInstance.doUnsavedAlert = false;

					var title = $(this).siblings('input:first').val();

					//get key and value
					var product = fpdInstance.getProduct(),
						scaling = FPDUtil.getScalingByDimesions(fpdInstance.currentViewInstance.options.stageWidth, fpdInstance.currentViewInstance.options.stageHeight, 200, 200),
						thumbnail = fpdInstance.currentViewInstance.stage.toDataURL({multiplier: scaling, format: 'png'});

					//check if there is an existing products array
					var savedProducts = _getSavedProducts();
					if(!savedProducts) {
						//create new
						savedProducts = new Array();
					}

					savedProducts.push({thumbnail: thumbnail, product: product, title: title});
					window.localStorage.setItem(fpdInstance.$container.attr('id'), JSON.stringify(savedProducts));

					FPDUtil.showMessage(fpdInstance.getTranslation('misc', 'product_saved'));
					$prompt.find('.fpd-modal-close').click();

				});



			}
			else if(action === 'load') {

				//load all saved products into list
				var savedProducts = _getSavedProducts();

				fpdInstance.mainBar.$content.find('.fpd-saved-designs-panel .fpd-grid').empty();

				if(savedProducts) {

					for(var i=0; i < savedProducts.length; ++i) {

						var savedProduct = savedProducts[i];
						_addSavedProduct(savedProduct.thumbnail, savedProduct.product, savedProduct.title);

					}

					FPDUtil.createScrollbar(fpdInstance.mainBar.$content.find('.fpd-saved-designs-panel .fpd-scroll-area'));

				}

				fpdInstance.mainBar.callSecondary('fpd-saved-designs-panel');


			}
			else if(action === 'manage-layers') {

				fpdInstance.mainBar.callModule('manage-layers');


			}
			else if(action === 'snap') {

				$this.toggleClass('fpd-active');

				fpdInstance.$mainWrapper.children('.fpd-snap-line-h, .fpd-snap-line-v').hide();

				if($this.hasClass('fpd-active')) {

					var lines = [],
						gridX = fpdInstance.mainOptions.snapGridSize[0] ? fpdInstance.mainOptions.snapGridSize[0] : 50,
						gridY = fpdInstance.mainOptions.snapGridSize[1] ? fpdInstance.mainOptions.snapGridSize[1] : 50,
						linesXNum = Math.ceil(fpdInstance.currentViewInstance.options.stageWidth / gridX),
						linesYNum = Math.ceil(fpdInstance.currentViewInstance.options.stageHeight / gridY);

					//add x-lines
					for(var i=0; i < linesXNum; ++i) {

						var lineX = new fabric.Rect({
							width: 1,
							height: fpdInstance.currentViewInstance.options.stageHeight,
							fill: '#ccc',
							opacity: 0.6,
							left: i * gridX,
							top: 0
						});

						lines.push(lineX);

					}

					//add y-lines
					for(var i=0; i < linesYNum; ++i) {

						var lineY = new fabric.Rect({
							width: fpdInstance.currentViewInstance.options.stageWidth,
							height: 1,
							fill: '#ccc',
							opacity: 0.6,
							top: i * gridY,
							left: 0
						});

						lines.push(lineY);

					}

					snapLinesGroup = new fabric.Group(lines, {title: 'snap-lines-group', left: 0, top: 0, evented: false, selectable: false});
					fpdInstance.currentViewInstance.stage.add(snapLinesGroup);

				}
				else {

					if(snapLinesGroup) {
						fpdInstance.currentViewInstance.stage.remove(snapLinesGroup);
					}

				}

			}
			else if(action === 'qr-code') {

				var $internalModal = FPDUtil.showModal($this.children('.fpd-modal-qrcode').clone());

				$colorPickers = $internalModal.find('.fpd-qrcode-colors input').spectrum({
					preferredFormat: "hex",
					showInput: true,
					showInitial: true,
					showButtons: false,
					replacerClassName: 'fpd-spectrum-replacer'
				});

				$internalModal.find('.fpd-add-qr-code').click(function() {

					var text = $internalModal.find('.fpd-modal-qrcode > input').val();

					if(text && text.length !== 0) {

						var $qrcodeWrapper = $internalModal.find('.fpd-qrcode-wrapper').empty(),
							qrcode = new QRCode($qrcodeWrapper .get(0), {
						    text: text,
						    width: 256,
						    height: 256,
						    colorDark : $colorPickers.filter('.fpd-qrcode-color-dark').spectrum('get').toHexString(),
						    colorLight : $colorPickers.filter('.fpd-qrcode-color-light').spectrum('get').toHexString(),
						    correctLevel : QRCode.CorrectLevel.H
						});

						$qrcodeWrapper.find('img').load(function() {

							fpdInstance.addElement('image', this.src, 'QR-Code - '+text, {
								autoCenter: true,
								draggable: true,
								removable: true,
								resizable: true
							});

							$internalModal.find('.fpd-modal-close').click();

						});

					}

				});

			}
			else if(action === 'zoom') {

				if(!$this.hasClass('fpd-active')) {

					if($this.hasClass('tooltipstered')) {
						$this.tooltipster('destroy');
					}

					$this.tooltipster({
						trigger: 'click',
						position: 'bottom',
						content: $this.find('.fpd-tooltip-content'),
						theme: 'fpd-sub-tooltip-theme fpd-zoom-tooltip',
						touchDevices: false,
						interactive: true,
						//autoClose: false,
						functionReady: function(origin, tooltip) {

							var startVal = fpdInstance.currentViewInstance.stage.getZoom() / fpdInstance.currentViewInstance.responsiveScale;

							tooltip.find('.fpd-zoom-slider').attr('step', fpdInstance.mainOptions.zoomStep).attr('max', fpdInstance.mainOptions.maxZoom)
							.val(startVal).rangeslider({
								polyfill: false,
								rangeClass: 'fpd-range-slider',
								disabledClass: 'fpd-range-slider--disabled',
								horizontalClass: 'fpd-range-slider--horizontal',
							    verticalClass: 'fpd-range-slider--vertical',
							    fillClass: 'fpd-range-slider__fill',
							    handleClass: 'fpd-range-slider__handle',
							    onSlide: function(pos, value) {
									fpdInstance.setZoom(value);
							    }
							});

							tooltip.find('.fpd-stage-pan').click(function() {

								fpdInstance.currentViewInstance.dragStage = fpdInstance.currentViewInstance.dragStage ? false : true;
								$(this).toggleClass('fpd-enabled');
								fpdInstance.$productStage.toggleClass('fpd-drag');

							}).toggleClass('fpd-enabled', fpdInstance.currentViewInstance.dragStage);

						},
						functionAfter: function(origin) {

							origin.removeClass('fpd-active')
							.tooltipster('destroy');

							origin.attr('title', origin.data('defaulttext'))
							.tooltipster({
								offsetY: 0,
								position: 'bottom',
								theme: '.fpd-tooltip-theme',
								touchDevices: false,
							});

						}
					});

					$this.tooltipster('show');

				}

				$this.toggleClass('fpd-active');

			}
			else if(action === 'download') {

				if(!$this.hasClass('fpd-active')) {

					if($this.hasClass('tooltipstered')) {
						$this.tooltipster('destroy');
					}

					$this.tooltipster({
						trigger: 'click',
						position: 'bottom',
						content: $this.find('.fpd-tooltip-content'),
						theme: 'fpd-sub-tooltip-theme',
						touchDevices: false,
						functionReady: function(origin, tooltip) {

							tooltip.find('.fpd-item').click(function() {
								instance.downloadFile($(this).data('value'))
							});

						},
						functionAfter: function(origin) {

							origin.removeClass('fpd-active')
							.tooltipster('destroy');

							origin.attr('title', origin.data('defaulttext'))
							.tooltipster({
								offsetY: 0,
								position: 'bottom',
								theme: '.fpd-tooltip-theme',
								touchDevices: false,
							});

						}
					});

					$this.tooltipster('show');

				}

				$this.toggleClass('fpd-active');

			}
			else if(action === 'magnify-glass') {

				fpdInstance.resetZoom();

				if($this.hasClass('fpd-active')) {

					$(".fpd-zoom-image,.zoomContainer").remove();
					fpdInstance.$productStage.children('.fpd-view-stage').eq(fpdInstance.currentViewIndex).removeClass('fpd-hidden');

				}
				else {

					fpdInstance.toggleSpinner();

					var scaling = Number(2000 / fpdInstance.currentViewInstance.options.stageWidth).toFixed(2);
						dataURL = fpdInstance.currentViewInstance.stage.toDataURL({multiplier: scaling, format: 'png'});

					fpdInstance.$productStage.append('<img src="'+dataURL+'" class="fpd-zoom-image" />')
					.children('.fpd-zoom-image').elevateZoom({
						scrollZoom: true,
						borderSize: 1,
						zoomType: "lens",
						lensShape: "round",
						lensSize: 200,
						responsive: true
					}).load(function() {
						fpdInstance.toggleSpinner(false);
					});

					fpdInstance.$productStage.children('.fpd-view-stage').addClass('fpd-hidden');

				}

				$this.toggleClass('fpd-active');

			}

		});

	};

	//set action button to specific position
	var _setActionButtons = function(pos) {

		fpdInstance.$mainWrapper.append('<div class="fpd-actions-wrapper fpd-pos-'+pos+'"></div>');

		var posActions = instance.currentActions[pos];

		for(var i=0; i < posActions.length; ++i) {

			var actionName = posActions[i],
				$action = $actions.children('[data-action="'+actionName+'"]');

			fpdInstance.$mainWrapper.children('.fpd-actions-wrapper.fpd-pos-'+pos).append($action.clone());
		}

	};

	//returns an object with the saved products for the current showing product
	var _getSavedProducts = function() {

		return  FPDUtil.localStorageAvailable() ? JSON.parse(window.localStorage.getItem(fpdInstance.$container.attr('id'))) : false;

	};

	//add a saved product to the load dialog
	var _addSavedProduct = function(thumbnail, product, title) {

		title = title ? title : '';

		//create new list item
		var $gridWrapper = fpdInstance.mainBar.$content.find('.fpd-saved-designs-panel .fpd-grid'),
			htmlTitle = title !== '' ? 'title="'+title+'"' : '';

		$gridWrapper.append('<div class="fpd-item fpd-tooltip" '+htmlTitle+'><picture style="background-image: url('+thumbnail+')" ></picture><div class="fpd-remove-design"><span class="fpd-icon-remove"></span></div></div>')
		.children('.fpd-item:last').click(function(evt) {

			fpdInstance.loadProduct($(this).data('product'));
			fpdInstance.currentProductIndex = -1;

		}).data('product', product)
		.children('.fpd-remove-design').click(function(evt) {

			evt.stopPropagation();

			var $item = $(this).parent('.fpd-item'),
				index = $item.parent('.fpd-grid').children('.fpd-item').index($item.remove()),
				savedProducts = _getSavedProducts();

				savedProducts.splice(index, 1);

			window.localStorage.setItem(fpdInstance.$container.attr('id'), JSON.stringify(savedProducts));

		});

		FPDUtil.updateTooltip($gridWrapper);

	};

	//download png, jpeg or pdf
	this.downloadFile = function(type) {

		if(type === 'jpeg' || type === 'png') {

			var a = document.createElement('a'),
				background = type === 'jpeg' ? '#fff' : 'transparent';

			if (typeof a.download !== 'undefined') {

				fpdInstance.getProductDataURL(function(dataURL) {

					fpdInstance.$container.find('.fpd-download-anchor').attr('href', dataURL)
					.attr('download', 'Product.'+type+'')[0].click();

				}, background, {format: type})

			}
			else {

				fpdInstance.createImage(true, true, background, {format: type});

			}
		}
		else {

			_createPDF = function(dataURLs) {

				var largestWidth = fpdInstance.viewInstances[0].options.stageWidth,
					largestHeight = fpdInstance.viewInstances[0].options.stageHeight;

				for(var i=1; i < fpdInstance.viewInstances.length; ++i) {

					var viewOptions = fpdInstance.viewInstances[i].options;
					if(viewOptions.stageWidth > largestWidth) {
						largestWidth = viewOptions.stageWidth;
					}

					if(viewOptions.stageHeight > largestHeight) {
						largestHeight = viewOptions.stageHeight;
					}

				}

				var orientation = fpdInstance.currentViewInstance.stage.getWidth() > fpdInstance.currentViewInstance.stage.getHeight() ? 'l' : 'p',
					doc = new jsPDF(orientation, 'mm', [largestWidth * 0.26, largestHeight * 0.26]);

				for(var i=0; i < dataURLs.length; ++i) {

					doc.addImage(dataURLs[i], 'JPEG', 0, 0);
					if(i < dataURLs.length-1) {
						doc.addPage();
					}

				}

				doc.save('Product.pdf');

			};

			fpdInstance.getViewsDataURL(_createPDF, '#ffffff', {format: 'jpeg'});

		}

	};

	this.setup = function(actions) {

		this.currentActions = actions;

		fpdInstance.$mainWrapper.children('.fpd-actions-wrapper').remove();

		var keys = Object.keys(actions);
		for(var i=0; i < keys.length; ++i) {

			var posActions = actions[keys[i]];
			if(typeof posActions === 'object' && posActions.length > 0) {
				_setActionButtons(keys[i]);
			}

		}

	};

	this.resetAllActions = function() {

		$(".fpd-zoom-image,.zoomContainer").remove();
		fpdInstance.$productStage.children('.fpd-view-stage').eq(fpdInstance.currentViewIndex).removeClass('fpd-hidden');

		fpdInstance.$mainWrapper.find('.fpd-action-btn').removeClass('fpd-active');

	};

	_initialize();

};

FPDActions.availableActions = [
	'print',
	'reset-product',
	'undo',
	'redo',
	'info',
	'save',
	'load',
	'manage-layers',
	'snap',
	'qr-code',
	'zoom',
	'download',
	'magnify-glass',
	'preview-lightbox'
];

var DesignsModule = function(fpdInstance, $module) {

	var $head = $module.find('.fpd-head'),
		$scrollArea = $module.find('.fpd-scroll-area'),
		$designsGrid = $module.find('.fpd-grid'),
		lazyClass = fpdInstance.mainOptions.lazyLoad ? 'fpd-hidden' : '',
		$firstLevelCategories = null,
		$currentCategory = null;

	var _initialize = function() {

		if(fpdInstance.$designs.size() > 0) {

			//check if categories are used or first category also includes sub-cats
			if(fpdInstance.$designs.filter('.fpd-category').length > 1 || fpdInstance.$designs.filter('.fpd-category:first').children('.fpd-category').length > 0) {

				$firstLevelCategories = fpdInstance.$designs.filter('.fpd-category');
				$currentCategory = fpdInstance.$designs;
				_displayCategories($firstLevelCategories);

			}
			else { //display single category or designs without categories
				_displayDesigns(fpdInstance.$designs);
			}

			fpdInstance.$designs.remove();
		}

		$head.find('.fpd-back').click(function() {

			if($firstLevelCategories !== null) {
				_displayCategories($firstLevelCategories);
			}

			$currentCategory = fpdInstance.$designs;
			$module.removeClass('fpd-head-visible');

		});

	};

	var _displayCategories = function($categories) {

		$scrollArea.find('.fpd-grid').empty();

		$categories.each(function(i, cat) {

			var $cat = $(cat),
				catThumbnail = $cat.data('thumbnail');

			var catObj = {
				title: $cat.attr('title'),
				thumbnail: catThumbnail
			};

			_addDesignCategory(catObj);

		});

		FPDUtil.refreshLazyLoad($designsGrid, false);
		FPDUtil.createScrollbar($scrollArea);

	};

	var _addDesignCategory = function(category) {

		var thumbnailHTML = category.thumbnail ? '<picture data-img="'+category.thumbnail+'"></picture>' : '',
			itemClass = category.thumbnail ? lazyClass : lazyClass+' fpd-title-centered',
			$lastItem = $designsGrid.append('<div class="fpd-category fpd-item '+itemClass+'">'+thumbnailHTML+'<span>'+category.title+'</span></div>')
		.children('.fpd-item:last').click(function(evt) {

			var $this = $(this),
				index = $this.parent().children('.fpd-item').index($this),
				$children = $currentCategory.eq(index).children();

			if($children.filter('.fpd-category').size() > 0) {

				$currentCategory = $children;
				_displayCategories($children);

			}
			else {

				_displayDesigns($currentCategory.eq(index));
			}

			$module.addClass('fpd-head-visible');
			$head.children('.fpd-category-title').text($this.children('span').text());

		});

		if(lazyClass === '' && category.thumbnail) {
			FPDUtil.loadGridImage($lastItem.children('picture'), category.thumbnail);
		}

	};

	var _displayDesigns = function($designs) {

		$scrollArea.find('.fpd-grid').empty();

		var categoryParameters = {};

		if($designs.hasClass('fpd-category')) {

			categoryParameters = $designs.data('parameters') ? $designs.data('parameters') : {};
			$designs = $designs.children('img');

		}

		$designs.each(function(i, design) {

			var $design = $(design),
				designObj = {
					source: $design.data('src') === undefined ? $design.attr('src') : $design.data('src'),
					title: $design.attr('title'),
					parameters: $.extend({}, categoryParameters, $design.data('parameters')),
					thumbnail: $design.data('thumbnail')
				};

			_addGridDesign(designObj);

		});

		FPDUtil.refreshLazyLoad($designsGrid, false);
		FPDUtil.createScrollbar($scrollArea);
		FPDUtil.updateTooltip();


	};

	//adds a new design to the designs grid
	var _addGridDesign = function(design) {

		design.thumbnail = design.thumbnail === undefined ? design.source : design.thumbnail;

		var $lastItem = $designsGrid.append('<div class="fpd-item '+lazyClass+'" data-source="'+design.source+'" data-title="'+design.title+'"><picture data-img="'+design.thumbnail+'"></picture></div>')
		.children('.fpd-item:last').click(function(evt) {

			var $this = $(this),
				designParams = $this.data('parameters');

			designParams.isCustom = true;

			fpdInstance.addElement('image', $this.data('source'), $this.data('title'), designParams);

		}).data('parameters', design.parameters);

		if(lazyClass === '') {
			FPDUtil.loadGridImage($lastItem.children('picture'), design.thumbnail);
		}

	};

	this.selectCategory = function(index) {

		$categoriesDropdown.children('input').val(fpdInstance.products[index].name);

		var obj = fpdInstance.products[index];
		for(var i=0; i <obj.products.length; ++i) {
			var views = obj.products[i];
			_addGridProduct(views);
		}

	};

	_initialize();

};

var ProductsModule = function(fpdInstance, $module) {

	var instance = this,
		currentCategoryIndex = 0,
		$categoriesDropdown = $module.find('.fpd-product-categories'),
		$scrollArea = $module.find('.fpd-scroll-area'),
		$gridWrapper = $module.find('.fpd-grid'),
		lazyClass = fpdInstance.mainOptions.lazyLoad ? 'fpd-hidden' : '';

	var _initialize = function() {

		if(fpdInstance.products.length === 0) {
			return;
		}

		if(fpdInstance.products.length > 1) { //categories are used
			$module.addClass('fpd-categories-enabled');

			for(var i=0; i < fpdInstance.products.length; ++i) {
				$categoriesDropdown.find('.fpd-dropdown-list').append('<span class="fpd-item" data-value="'+i+'">'+fpdInstance.products[i].name+'</span>');
			}
		}

		var $categoryItems = $categoriesDropdown.find('.fpd-dropdown-list .fpd-item');

		$categoriesDropdown.children('input').keyup(function() {

			$categoryItems.hide();

			if(this.value.length === 0) {
				$categoryItems.show();
			}
			else {
				$categoryItems.filter(':containsCaseInsensitive("'+this.value+'")').show();
			}

		});

		$categoriesDropdown.find('.fpd-dropdown-list .fpd-item').click(function() {

			var $this = $(this);

			currentCategoryIndex = $this.data('value');

			$this.parent().prevAll('.fpd-dropdown-current:first').val($this.text());
			instance.selectCategory(currentCategoryIndex);

			$this.siblings('.fpd-item').show();

			FPDUtil.refreshLazyLoad($scrollArea.find('.fpd-grid'), false);

		});

		instance.selectCategory(currentCategoryIndex);

	};

	//adds a new product to the products grid
	var _addGridProduct = function(views) {

		//load product by click
		var thumbnail = views[0].productThumbnail ? views[0].productThumbnail : views[0].thumbnail,
			productTitle = views[0].productTitle ? views[0].productTitle : views[0].title;

		var $lastItem = $gridWrapper.append('<div class="fpd-item fpd-tooltip '+lazyClass+'" title="'+productTitle+'"><picture data-img="'+thumbnail+'"></picture></div>')
		.children('.fpd-item:last').click(function(evt) {

			var $this = $(this),
				index = $gridWrapper.children('.fpd-item').index($this);

			fpdInstance.selectProduct(index, currentCategoryIndex);

			evt.preventDefault();

		}).data('views', views);


		if(lazyClass === '') {
			FPDUtil.loadGridImage($lastItem.children('picture'), thumbnail);
		}

	};

	this.selectCategory = function(index) {

		$scrollArea.find('.fpd-grid').empty();

		$categoriesDropdown.children('input').val(fpdInstance.products[index].name);

		var obj = fpdInstance.products[index];
		for(var i=0; i <obj.products.length; ++i) {
			var views = obj.products[i];
			_addGridProduct(views);
		}

		FPDUtil.createScrollbar($scrollArea);
		FPDUtil.updateTooltip();

	};

	_initialize();

};

var TextModule = function(fpdInstance, $module) {

	var currentViewOptions;

	var _initialize = function() {

		fpdInstance.$container.on('viewSelect', function(evt, index, viewInstance) {

			currentViewOptions = viewInstance.options;

			if(currentViewOptions.customTextParameters && currentViewOptions.customTextParameters.price) {
				var price = fpdInstance.mainOptions.priceFormat.replace('%d', currentViewOptions.customTextParameters.price);
				$module.find('.fpd-btn > .fpd-price').html(' - '+price);
			}
			else {
				$module.find('.fpd-btn > .fpd-price').html('');
			}

		});

		$module.on('click', '.fpd-btn', function() {

			var $input = $(this).prevAll('textarea:first'),
				text = $input.val();

			if(text && text.length > 0) {

				var textParams = $.extend({}, currentViewOptions.customTextParameters, {isCustom: true});
				fpdInstance.addElement(
					'text',
					text,
					text,
					textParams
				);
			}

			$input.val('');

		});

		$module.on('keyup', 'textarea', function() {

			var text = this.value,
				maxLength = currentViewOptions ? currentViewOptions.customTextParameters.maxLength : 0,
				maxLines = currentViewOptions ? currentViewOptions.customTextParameters.maxLines : 0;

			if(maxLength != 0 && text.length > maxLength) {
				text = text.substr(0, maxLength);
			}

			if(maxLines != 0 && text.split("\n").length > maxLines) {
				text = text.replace(/([\s\S]*)\n/, "$1");
			}

			this.value = text;

		});

	};

	_initialize();

};

var ImagesModule = function(fpdInstance, $module) {

	var lazyClass = fpdInstance.mainOptions.lazyLoad ? 'fpd-hidden' : '',
		$imageInput = $module.find('.fpd-input-image'),
		$uploadScrollArea = $module.find('[data-context="upload"] .fpd-scroll-area'),
		$uploadGrid = $uploadScrollArea.find('.fpd-grid'),
		$fbAlbumDropdown = $module.find('.fpd-facebook-albums'),
		$fbScrollArea = $module.find('[data-context="facebook"] .fpd-scroll-area'),
		$fbGrid = $fbScrollArea.find('.fpd-grid'),
		$instaScrollArea = $module.find('[data-context="instagram"] .fpd-scroll-area'),
		$instaGrid = $instaScrollArea.find('.fpd-grid')
		facebookAppId = fpdInstance.mainOptions.facebookAppId,
		instagramClientId = fpdInstance.mainOptions.instagramClientId,
		instagramRedirectUri = fpdInstance.mainOptions.instagramRedirectUri,
		instaAccessToken = null,
		instaLoadingStack = false,
		instaNextStack = null,
		localStorageAvailable = FPDUtil.localStorageAvailable(),
		loadingImageLabel = fpdInstance.getTranslation('misc', 'loading_image'),
		ajaxSettings = fpdInstance.mainOptions.customImageAjaxSettings,
		saveOnServer = ajaxSettings.data && ajaxSettings.data.saveOnServer ? 1 : 0,
		uploadsDir = (ajaxSettings.data && ajaxSettings.data.uploadsDir) ? ajaxSettings.data.uploadsDir : '',
		uploadsDirURL = (ajaxSettings.data && ajaxSettings.data.uploadsDirURL) ? ajaxSettings.data.uploadsDirURL : '';

	var _initialize = function() {

		var $uploadZone = $module.find('.fpd-upload-zone');

		$uploadZone.click(function(evt) {

			evt.preventDefault();
			$imageInput.click();

		})
		.on('dragover dragleave', function(evt) {

			evt.stopPropagation();
			evt.preventDefault();

			$(this).toggleClass('fpd-hover', evt.type === 'dragover');

		});

		var _parseFiles = function(evt) {

			evt.stopPropagation();
			evt.preventDefault();

			if(window.FileReader) {

				var files = evt.target.files || evt.dataTransfer.files,
					addFirstToStage = true;
					fileTypes = ['jpg', 'jpeg', 'png', 'svg'];

				for(var i=0; i < files.length; ++i) {

					var extension = files[i].name.split('.').pop().toLowerCase();

					if(fileTypes.indexOf(extension) > -1) {
						_addUploadedImage(files[i], addFirstToStage);
						addFirstToStage = false;
					}

				}

			}

			$uploadZone.removeClass('fpd-hover');
			$imageInput.val('');

		};

		$uploadZone.get(0).addEventListener('drop', _parseFiles, false);
		$module.find('.fpd-upload-form').on('change', _parseFiles);


		if(facebookAppId && facebookAppId.length > 5) {

			$module.find('.fpd-module-tabs [data-context="facebook"]').removeClass('fpd-hidden');

			_initFacebook();

		}

		if(instagramClientId && instagramClientId.length > 5) {

			$module.find('.fpd-module-tabs [data-context="instagram"]').removeClass('fpd-hidden');

			$module.find('.fpd-module-tabs [data-context="instagram"]').on('click', function() {

				if($instaGrid.children('.fpd-item').size() > 0) {
					return;
				}

				//check if access token is stored in browser
				//window.localStorage.removeItem('fpd_instagram_access_token')
				instaAccessToken = window.localStorage.getItem('fpd_instagram_access_token');

				var endpoint = 'recent';
				if(!localStorageAvailable || instaAccessToken == null) {

					_authenticateInstagram(function() {
						_loadInstaImages(endpoint);
					});

				}
				//load images by requested endpoint
				else {

					_loadInstaImages(endpoint);

				}

			});

			$module.find('.fpd-insta-recent-images, .fpd-insta-liked-images').click(function() {

				var $this = $(this).addClass('fpd-active'),
					endpoint = $this.hasClass('fpd-insta-recent-images') ? 'recent' : 'liked';

				$this.siblings().removeClass('fpd-active');

			});

			$instaScrollArea.on('_sbOnTotalScroll', function() {

				if(instaNextStack !== null && !instaLoadingStack) {

					_loadInstaImages(instaNextStack, false);

				}

			});

		}

		$module.children('.fpd-module-tabs').children('div:not(.fpd-hidden):first').click();

	};

	var _addUploadedImage = function(file, addToStage) {

		//check maximum allowed size
		var maxSizeBytes = fpdInstance.mainOptions.customImageParameters.maxSize * 1024 * 1024;
		if(file.size > maxSizeBytes) {
			FPDUtil.showMessage(fpdInstance.getTranslation('misc', 'maximum_size_info').replace('%filename', file.name).replace('%mb', fpdInstance.mainOptions.customImageParameters.maxSize));
			return;
		}

		//load image with FileReader
		var reader = new FileReader();
    	reader.onload = function (evt) {

			//check image resolution of jpeg
	    	if(file.type === 'image/jpeg') {

		    	var jpeg = new JpegMeta.JpegFile(atob(this.result.replace(/^.*?,/,'')), file.name);

		    	if(jpeg.tiff && jpeg.tiff.XResolution && jpeg.tiff.XResolution.value) {

			    	var xResDen = jpeg.tiff.XResolution.value.den,
			    		xResNum = jpeg.tiff.XResolution.value.num,
			    		realRes = xResNum / xResDen;

					FPDUtil.log(file.name+', Density: '+ xResDen + ' Number: '+ xResNum + ' Real Resolution: '+ realRes, 'info');

					if(realRes < fpdInstance.mainOptions.customImageParameters.minDPI) {
						FPDUtil.showModal(fpdInstance.getTranslation('misc', 'minimum_dpi_info').replace('%dpi', fpdInstance.mainOptions.customImageParameters.minDPI));
						return false;
					}

		    	}
		    	else {
			    	FPDUtil.log(file.name + ': Resolution is not accessible.', 'info');
		    	}

	    	}

	    	var image = this.result,
				$lastItem = $uploadGrid.append('<div class="fpd-item" data-source="'+image+'" data-title="'+file.name+'"><picture data-img="'+image+'"></picture></div>')
			.children('.fpd-item:last').data('file', file).click(function(evt) {

				var $this = $(this);

				//save custom image on server
				if(saveOnServer) {

					fpdInstance.toggleSpinner(true, loadingImageLabel);

					var formDataAjaxSettings = $.extend({}, ajaxSettings),
						formdata = new FormData();
					formdata.append('uploadsDir', uploadsDir);
					formdata.append('uploadsDirURL', uploadsDirURL);
					formdata.append('images[]', $this.data('file'));

					formDataAjaxSettings.data = formdata;
					formDataAjaxSettings.processData = false;
					formDataAjaxSettings.contentType = false;
					formDataAjaxSettings.success = function(data) {

						if(data && data.error == undefined) {

							fpdInstance.addCustomImage( data.image_src, data.filename );

						}
						else {

							fpdInstance.toggleSpinner(false);
							FPDUtil.showModal(data.error);

						}

					};

					//ajax post
					$.ajax(formDataAjaxSettings)
					.fail(function(evt) {

						fpdInstance.toggleSpinner(false);
						FPDUtil.showModal(evt.statusText);

					});

				}
				//add data uri to canvas
				else {
					fpdInstance.addCustomImage( $this.data('source'), $this.data('title') );
				}

			});

			//check image dimensions
			var checkDimImage = new Image();
			checkDimImage.onload = function() {

				var imageH = this.height,
					imageW = this.width,
					currentCustomImageParameters = fpdInstance.currentViewInstance.options.customImageParameters;

				if(FPDUtil.checkImageDimensions(fpdInstance, imageW, imageH)) {
					FPDUtil.loadGridImage($lastItem.children('picture'), this.src);
					FPDUtil.createScrollbar($uploadScrollArea);

					if(addToStage) {
						$lastItem.click();
					}

				}
				else {
					$lastItem.remove();
				}

			};
			checkDimImage.src = image;

		}

		//add file to start loading
		reader.readAsDataURL(file);

	};

	var _initFacebook = function() {

		var $albumItems = $fbAlbumDropdown.find('.fpd-dropdown-list .fpd-item');

		$fbAlbumDropdown.children('input').keyup(function() {

			$albumItems.hide();

			if(this.value.length === 0) {
				$albumItems.show();
			}
			else {
				$albumItems.filter(':containsCaseInsensitive("'+this.value+'")').show();
			}

		});

		$fbAlbumDropdown.on('click', '.fpd-dropdown-list .fpd-item', function() {

			var $this = $(this);

			albumID = $this.data('value');

			$this.parent().prevAll('.fpd-dropdown-current:first').val($this.text());
			$this.siblings('.fpd-item').show();

			_selectAlbum(albumID);

		});

		var _selectAlbum = function(albumID) {

			$fbGrid.empty();
			$fbAlbumDropdown.addClass('fpd-on-loading');

			FB.api('/'+albumID+'?fields=count', function(response) {

				var albumCount = response.count;

				FB.api('/'+albumID+'?fields=photos.limit('+albumCount+').fields(source,images)', function(response) {

					$fbAlbumDropdown.removeClass('fpd-on-loading');

					if(!response.error) {

						var photos = response.photos.data;

						for(var i=0; i < photos.length; ++i) {
							var photo = photos[i],
								photoImg = photo.images[photo.images.length-1] ? photo.images[photo.images.length-1].source : photo.source;
							var $lastItem = $fbGrid.append('<div class="fpd-item '+lazyClass+'" data-title="'+photo.id+'" data-source="'+photo.source+'"><picture data-img="'+photo.source+'"></picture></div>')
							.children('.fpd-item:last').click(function(evt) {

								fpdInstance.toggleSpinner(true, loadingImageLabel);

								var $this = $(this);

								ajaxSettings.data = {url: $this.data('source'), uploadsDir: uploadsDir, uploadsDirURL: uploadsDirURL, saveOnServer: saveOnServer};
								ajaxSettings.success = function(data) {

									if(data && data.error == undefined) {

										var picture = new Image();
										picture.src = data.image_src;
										picture.onload = function() {

											fpdInstance.addCustomImage( this.src, $this.data('title') );
										};

									}
									else {

										fpdInstance.toggleSpinner(false);
										FPDUtil.showModal(data.error);

									}

								};

								//ajax post
								$.ajax(ajaxSettings)
								.fail(function(evt) {

									fpdInstance.toggleSpinner(false);
									FPDUtil.showModal(evt.statusText);

								});

							});

							if(lazyClass === '') {
								FPDUtil.loadGridImage($lastItem.children('picture'), photoImg);
							}

						}


						FPDUtil.createScrollbar($fbScrollArea);
						FPDUtil.refreshLazyLoad($fbGrid, false);

					}

					fpdInstance.toggleSpinner(false);

				});

			});

		};

		$.ajaxSetup({ cache: true });
		$.getScript('//connect.facebook.com/en_US/sdk.js', function(){

			//init facebook
			FB.init({
				appId: facebookAppId,
				status: true,
				cookie: true,
				xfbml: true,
				version: 'v2.5'
			});

			FB.Event.subscribe('auth.statusChange', function(response) {

				if (response.status === 'connected') {
					// the user is logged in and has authenticated your app

					$module.addClass('fpd-facebook-logged-in');

					FB.api('/me/albums?fields=name,count,id', function(response) {

						var albums = response.data;
						//add all albums to select
						for(var i=0; i < albums.length; ++i) {

							var album = albums[i];
							if(album.count > 0) {
								$fbAlbumDropdown.find('.fpd-dropdown-list').append('<span class="fpd-item" data-value="'+album.id+'">'+album.name+'</span>');
							}

						}

						$albumItems = $fbAlbumDropdown.find('.fpd-dropdown-list .fpd-item');

						$fbAlbumDropdown.removeClass('fpd-on-loading');

					});

				}

			});

		});

	};

	//log into instagram via a popup
	var _authenticateInstagram = function(callback) {

		var popupLeft = (window.screen.width - 700) / 2,
			popupTop = (window.screen.height - 500) / 2;

		var popup = window.open(fpdInstance.mainOptions.templatesDirectory+'/instagram_auth.'+fpdInstance.mainOptions.templatesType, '', 'width=700,height=500,left='+popupLeft+',top='+popupTop+'');
		FPDUtil.popupBlockerAlert(popup);

		popup.onload = new function() {

			if(window.location.hash.length == 0) {

				popup.open('https://instagram.com/oauth/authorize/?client_id='+instagramClientId+'&redirect_uri='+instagramRedirectUri+'&response_type=token', '_self');

			}

			var interval = setInterval(function() {

				try {
					if(popup.location.hash.length) {

						clearInterval(interval);
						instaAccessToken = popup.location.hash.slice(14);
						if(localStorageAvailable) {
							window.localStorage.setItem('fpd_instagram_access_token', instaAccessToken);
						}
						popup.close();
						if(callback != undefined && typeof callback == 'function') callback();

					}
				}
				catch(evt) {
					//permission denied
				}

			}, 100);
		}

	};

	//load photos from instagram using an endpoint
	var _loadInstaImages = function(endpoint, emptyGrid) {

		emptyGrid = typeof emptyGrid === 'undefined' ? true : emptyGrid;

		instaLoadingStack = true;

		var endpointUrl;

		switch(endpoint) {
			case 'liked':
				endpointUrl = 'https://api.instagram.com/v1/users/self/media/liked?access_token='+instaAccessToken;
			break;
			case 'recent':
				endpointUrl = 'https://api.instagram.com/v1/users/self/media/recent?access_token='+instaAccessToken;
			break;
			default:
				endpointUrl = endpoint;
		}

		if(emptyGrid) {
			$instaGrid.empty();
		}

		$.ajax({
	        method: 'GET',
	        url: endpointUrl,
	        dataType: 'jsonp',
	        jsonp: 'callback',
	        jsonpCallback: 'jsonpcallback',
	        cache: false,
	        success: function(data) {

	        	if(data.data) {

		        	instaNextStack = (data.pagination && data.pagination.next_url) ? data.pagination.next_url : null;

		        	$.each(data.data, function(i, item) {

		        		if(item.type == 'image') {

			        		var image = item.images.standard_resolution.url,
			        			$lastItem = $instaGrid.append('<div class="fpd-item '+lazyClass+'" data-title="'+item.id+'" data-source="'+image+'"><picture data-img="'+image+'"></picture></div>')
			        		.children('.fpd-item:last').click(function(evt) {

								fpdInstance.toggleSpinner(true, loadingImageLabel);

								var $this = $(this);
								ajaxSettings.data = {url: $this.data('source'), uploadsDir: uploadsDir, uploadsDirURL: uploadsDirURL, saveOnServer: saveOnServer};
								ajaxSettings.success = function(data) {

									if(data && data.error == undefined) {

										var picture = new Image();
										picture.src = data.image_src;
										picture.onload = function() {

											fpdInstance.addCustomImage( this.src, $this.data('title') );
										};

									}
									else {

										fpdInstance.toggleSpinner(false);
										FPDUtil.showModal(data.error);

									}

								};

								//ajax post
								$.ajax(ajaxSettings)
								.fail(function(evt) {

									fpdInstance.toggleSpinner(false);
									FPDUtil.showModal(evt.statusText);

								});

							});

		        		}

		        		if(lazyClass === '') {
							FPDUtil.loadGridImage($lastItem.children('picture'), image);
						}

		            });

					if(emptyGrid) {
						FPDUtil.createScrollbar($instaScrollArea);
						FPDUtil.refreshLazyLoad($instaGrid, false);
					}



	        	}
	        	else {

		        	window.localStorage.removeItem('fpd_instagram_access_token');
		        	if(data.meta && data.meta.error_message) {
			        	FPDUtil.showModal('<strong>Instagram Error</strong><p>'+data.meta.error_message+'</p>');
		        	}

	        	}

	        	instaLoadingStack = false;

	        },
	        error: function(jqXHR, textStatus, errorThrown) {

		        instaLoadingStack = false;
	            FPDUtil.showModal("Could not load data from instagram. Please try again!");

	        }
	    });

	};

	_initialize();

};

var ManageLayersModule = {

	createList : function(fpdInstance, $container) {

		var $currentColorList,
			colorDragging = false;

		//append a list item to the layers list
		var _appendLayerItem = function(element) {

			var colorHtml = '<span></span>';
			if(FPDUtil.elementHasColorSelection(element)) {

				var availableColors = FPDUtil.elementAvailableColors(element, fpdInstance);

				var currentColor = '';
				if(element.uploadZone) {
					colorHtml = '<span></span>';
				}
				else if(element.type == 'path-group') {
					currentColor = availableColors[0];
					colorHtml = '<span class="fpd-current-color" style="background: '+currentColor+'"></span>';
				}
				else if(availableColors.length > 1) {
					currentColor = element.fill ? element.fill : availableColors[0];
					colorHtml = '<span class="fpd-current-color" style="background: '+currentColor+'" data-colors=""></span>';
				}
				else {
					currentColor = element.fill ? element.fill : availableColors[0];
					colorHtml = '<input class="fpd-current-color" type="text" value="'+currentColor+'" />'
				}

			}

			$container.find('.fpd-list').append('<div class="fpd-list-row" id="'+element.id+'"><div class="fpd-cell-0">'+colorHtml+'</div><div class="fpd-cell-1">'+element.title+'</div><div class="fpd-cell-2"></div></div>');

			var $lastItem = $container.find('.fpd-list-row:last')
				.data('element', element)
				.data('colors', availableColors);

			if(element.uploadZone) {
				$lastItem.addClass('fpd-add-layer')
				.find('.fpd-cell-2').append('<span><span class="fpd-icon-add"></span></span>');
			}
			else {

				var lockIcon = !element.evented ? 'fpd-icon-locked-full' : 'fpd-icon-unlocked',
					reorderHtml = element.zChangeable ? '<span class="fpd-icon-reorder"></span>' : '';

				$lastItem.find('.fpd-cell-2').append(reorderHtml+'<span class="fpd-lock-element"><span class="'+lockIcon+'"></span></span>');

				if(element.removable) {
					$lastItem.find('.fpd-lock-element').after('<span class="fpd-remove-element"><span class="fpd-icon-remove"></span></span>');
				}

				$lastItem.toggleClass('fpd-locked', !element.evented);

			}

		};

		//destroy all color pickers and empty list
		$container.find('.fpd-current-color').spectrum('destroy');
		$container.find('.fpd-list').empty();

		var viewElements = fpdInstance.getElements(fpdInstance.currentViewIndex);
		for(var i=0; i < viewElements.length; ++i) {

			var element = viewElements[i];

			if(element.isEditable) {
				_appendLayerItem(element);
			}

		}

		FPDUtil.createScrollbar($container.find('.fpd-scroll-area'));

		//sortable layers list
		$container.find('.fpd-list').sortable({
			handle: '.fpd-icon-reorder',
			placeholder: 'fpd-list-row fpd-sortable-placeholder',
			scroll: false,
			axis: 'y',
			containment: 'parent',
			items: '.fpd-list-row:not(.fpd-locked)',
			change: function(evt, ui) {

				var targetElement = fpdInstance.getElementByID(ui.item.attr('id')),
					index = $container.find( ".fpd-list-row:not(.ui-sortable-helper)" ).index(ui.placeholder);

				index = index === 0 ? 0 : index+2;

				/*
				var prevItem = ui.placeholder.nextAll(".fpd-list-row:not(.ui-sortable-helper)").first(),
					prevEl = fpdInstance.currentViewInstance.getElementByID(prevItem.attr('id'));
				*/

				fpdInstance.setElementParameters({z: index}, targetElement);

			}
		});

		$container.find('input.fpd-current-color').spectrum('destroy').spectrum({
			flat: false,
			preferredFormat: "hex",
			showInput: true,
			showInitial: true,
			showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
			palette: fpdInstance.mainOptions.colorPickerPalette,
			showButtons: false,
			show: function(color) {
				var element = $(this).parents('.fpd-list-row:first').data('element');
				element._tempFill = color.toHexString();
			},
			move: function(color) {

				var element = $(this).parents('.fpd-list-row:first').data('element');
				//only non-png images are chaning while dragging
				if(colorDragging === false || FPDUtil.elementIsColorizable(element) !== 'png') {
					fpdInstance.currentViewInstance.changeColor(element, color.toHexString());
				}

			},
			change: function(color) {

				$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
				var element = $(this).parents('.fpd-list-row:first').data('element');
				fpdInstance.currentViewInstance.setElementParameters({fill: color.toHexString()}, element);

			}
		})
		.on('beforeShow.spectrum', function(e, tinycolor) {
			if($currentColorList) {
				$currentColorList.remove();
				$currentColorList = null;
			}
		})
		.on('dragstart.spectrum', function() {
			colorDragging = true;
		})
		.on('dragstop.spectrum', function(evt, color) {
			colorDragging = false;
			var element = $(this).parents('.fpd-list-row:first').data('element');
			fpdInstance.currentViewInstance.changeColor(element, color.toHexString());
		});

		$container.off('click', '.fpd-current-color') //unregister click, otherwise triggers multi-times when changing view
		.on('click', '.fpd-current-color', function(evt) { //open sub

			evt.stopPropagation();

			$container.find('.fpd-path-colorpicker').spectrum('destroy');
			$container.find('input.fpd-current-color').spectrum('hide');

			var $listItem = $(this).parents('.fpd-list-row'),
				element = $listItem.data('element'),
				availableColors = $listItem.data('colors');

			//clicked on opened sub colors, just close it
			if($currentColorList && $listItem.children('.fpd-scroll-area').length > 0) {
				$currentColorList.slideUp(200, function(){ $(this).remove(); });
				$currentColorList = null;
				return;
			}

			//close another sub colors
			if($currentColorList) {
				$currentColorList.slideUp(200, function(){ $(this).remove(); });
				$currentColorList = null;
			}

			if(availableColors.length > 0) {

				$listItem.append('<div class="fpd-scroll-area"><div class="fpd-color-palette fpd-grid"></div></div>');

				for(var i=0; i < availableColors.length; ++i) {

					var item;
					if(element.type === 'path-group') {

						item = '<input class="fpd-path-colorpicker" type="text" value="'+availableColors[i]+'" />';

					}
					else {

						var tooltipTitle = fpdInstance.mainOptions.hexNames[availableColors[i].replace('#', '')];
						tooltipTitle = tooltipTitle ? tooltipTitle : availableColors[i];

						item = '<div class="fpd-item fpd-tooltip" title="'+tooltipTitle+'" style="background-color: '+availableColors[i]+'" data-color="'+availableColors[i]+'"></div>';

					}

					$listItem.find('.fpd-color-palette').append(item);
				}

				FPDUtil.updateTooltip($listItem);

				if(element.type === 'path-group') {

					$listItem.find('.fpd-path-colorpicker').spectrum({
						showPaletteOnly: $.isArray(element.colors),
						preferredFormat: "hex",
						showInput: true,
						showInitial: true,
						showButtons: false,
						showPalette: fpdInstance.mainOptions.colorPickerPalette && fpdInstance.mainOptions.colorPickerPalette.length > 0,
						palette: $.isArray(element.colors) ? element.colors : fpdInstance.mainOptions.colorPickerPalette,
						show: function(color) {

							var $listItem = $(this).parents('.fpd-list-row'),
								element = $listItem.data('element');

							var svgColors = FPDUtil.changePathColor(
								element,
								$listItem.find('.fpd-path-colorpicker').index(this),
								color
							);

							element._tempFill = svgColors;

						},
						move: function(color) {

							var $listItem = $(this).parents('.fpd-list-row'),
								element = $listItem.data('element');

							var svgColors = FPDUtil.changePathColor(
								element,
								$listItem.find('.fpd-path-colorpicker').index(this),
								color
							);

							fpdInstance.currentViewInstance.changeColor(element, svgColors);

						},
						change: function(color) {

							var $listItem = $(this).parents('.fpd-list-row'),
								element = $listItem.data('element');

							var svgColors = FPDUtil.changePathColor(
								element,
								$listItem.find('.fpd-path-colorpicker').index(this),
								color
							);

							$(document).unbind("click.spectrum"); //fix, otherwise change is fired on every click
							fpdInstance.currentViewInstance.setElementParameters({fill: svgColors}, element);

						}
					});

				}

				$currentColorList = $listItem.children('.fpd-scroll-area').slideDown(300);

			}

		});

		//select color from color palette
		$container.on('click', '.fpd-color-palette .fpd-item', function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				$listItem = $this.parents('.fpd-list-row'),
				element = $listItem.data('element'),
				newColor = $this.data('color');

			$listItem.find('.fpd-current-color').css('background', newColor);
			fpdInstance.currentViewInstance.setElementParameters({fill: newColor}, element);

		});

		//select associated element on stage when choosing one from the layers list
		$container.on('click', '.fpd-list-row', function() {

			if($(this).hasClass('fpd-locked')) {
				return;
			}

			var targetElement = fpdInstance.getElementByID(this.id);
			if(targetElement) {
				targetElement.canvas.setActiveObject(targetElement).renderAll();
			}

		});

		//lock element
		$container.on('click', '.fpd-lock-element',function(evt) {

			evt.stopPropagation();

			var $this = $(this),
				element = $this.parents('.fpd-list-row').data('element');

			if($currentColorList) {
				$currentColorList.slideUp(200, function(){ $(this).remove(); });
				$currentColorList = null;
			}

			element.evented = !element.evented;

			$this.children('span').toggleClass('fpd-icon-unlocked', element.evented)
			.toggleClass('fpd-icon-locked-full', !element.evented);

			$this.parents('.fpd-list-row').toggleClass('fpd-locked', !element.evented);
			$this.parents('.fpd-list:first').sortable( 'refresh' );

		});

		//remove element
		$container.on('click', '.fpd-remove-element',function(evt) {

			evt.stopPropagation();

			var $listItem = $(this).parents('.fpd-list-row');

			fpdInstance.currentViewInstance.removeElement($listItem.data('element'));

		});

	},

};

/**
 * The main Fancy Product Designer class. It creates all views and the main UI.
 *
 * @class FancyProductDesigner
 * @constructor
 * @param {HTMLElement | jQuery} elem - A HTML element with an unique ID.
 * @param {Object} [opts] - The default options - {{#crossLink "FancyProductDesignerOptions"}}{{/crossLink}}.
 */
var FancyProductDesigner = function(elem, opts) {

	$ = jQuery;

	var instance = this,
		$window = $(window),
		$body = $('body'),
		$products,
		$elem,
		$mainBar,
		$stageLoader,
		$uiElements,
		$modules,
		$editorBox = null,
		$thumbnailPreview = null,
		nonInitials = [],
		_viewInstances = [];
		stageCleared = false;
		productIsCustomized = false,
		initCSSClasses = '',
		anonymFuncs = {};

	/**
	 * Array containing all added products categorized.
	 *
	 * @property products
	 * @type Array
	 */
	this.products = [];
	/**
	 * Array containing all added products uncategorized.
	 *
	 * @property products
	 * @type Array
	 */
	this.plainProducts = [];
	/**
	 * The current selected product category index.
	 *
	 * @property currentCategoryIndex
	 * @type Number
	 * @default 0
	 */
	this.currentCategoryIndex = 0;
	/**
	 * The current selected product index.
	 *
	 * @property currentProductIndex
	 * @type Number
	 * @default 0
	 */
	this.currentProductIndex = 0;
	/**
	 * The current selected view index.
	 *
	 * @property currentViewIndex
	 * @type Number
	 * @default 0
	 */
	this.currentViewIndex = 0;
	/**
	 * The current price.
	 *
	 * @property currentPrice
	 * @type Number
	 * @default 0
	 */
	this.currentPrice = 0;
	/**
	 * The current views.
	 *
	 * @property currentViews
	 * @type Array
	 * @default null
	 */
	this.currentViews = null;
	/**
	 * The current view instance.
	 *
	 * @property currentViewInstance
	 * @type FancyProductDesignerView
	 * @default null
	 */
	this.currentViewInstance = null;
	/**
	 * The current selected element.
	 *
	 * @property currentElement
	 * @type fabric.Object
	 * @default null
	 */
	this.currentElement = null;
	/**
	 * JSON Object containing all translations.
	 *
	 * @property langJson
	 * @type Object
	 * @default null
	 */
	this.langJson = null;
	/**
	 * The main options set for this Product Designer.
	 *
	 * @property mainOptions
	 * @type Object
	 */
	this.mainOptions;
	/**
	 * jQuery object pointing on the product stage.
	 *
	 * @property $productStage
	 * @type jQuery
	 */
	this.$productStage = null;
	/**
	 * jQuery object pointing on the tooltip for the current selected element.
	 *
	 * @property $elementTooltip
	 * @type jQuery
	 */
	this.$elementTooltip = null;
	/**
	 * URL to the watermark image if one is set via options.
	 *
	 * @property watermarkImg
	 * @type String
	 * @default null
	 */
	this.watermarkImg = null;
	/**
	 * Indicates if the product is created or not.
	 *
	 * @property watermarkImg
	 * @type Boolean
	 * @default false
	 */
	this.productCreated = false;
	/**
	 * Indicates if the product was saved.
	 *
	 * @property doUnsavedAlert
	 * @type Boolean
	 * @default false
	 */
	this.doUnsavedAlert = false;
	/**
	 * Array containing all FancyProductDesignerView instances of the current showing product.
	 *
	 * @property viewInstances
	 * @type Array
	 * @default []
	 */
	this.viewInstances = [];
	/**
	 * Object containing all color link groups.
	 *
	 * @property colorLinkGroups
	 * @type Object
	 * @default {}
	 */
	this.colorLinkGroups = {};
	this.languageJSON = {
		"toolbar": {},
		"actions": {},
		"modules": {},
		"misc": {}
	};

	var fpdOptions = new FancyProductDesignerOptions(),
		options = fpdOptions.merge(fpdOptions.defaults, opts);

	this.mainOptions = options;

	var _initialize = function() {

		// @@include('../envato/evilDomain.js')

		//create custom jquery expression to ignore case when filtering
		$.expr[":"].containsCaseInsensitive = $.expr.createPseudo(function(arg) {
		    return function( elem ) {
		        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
		    };
		});

		//check if element is a jquery object
		if(elem instanceof jQuery) {
			$elem = elem;
		}
		else {
			$elem = $(elem);
		}

		initCSSClasses = $elem.attr('class');
		options.mainBarContainer = options.modalMode !== false ? false : options.mainBarContainer;

		instance.$container = $elem.data('instance', instance);

		//save products and designs HTML
		$products = $elem.children('.fpd-category').size() > 0 ? $elem.children('.fpd-category').remove() : $elem.children('.fpd-product').remove();
		instance.$designs = $elem.find('.fpd-design > .fpd-category').size() > 0 ? $elem.find('.fpd-design > .fpd-category') : $elem.find('.fpd-design > img');
		$elem.children('.fpd-design').remove();

		//add product designer into modal
		if(options.modalMode) {

			$elem.removeClass('fpd-hidden');
			$body.addClass('fpd-modal-mode-active');

			var $modalProductDesigner = $elem.wrap('<div class="fpd-modal-product-designer fpd-modal-overlay fpd-fullscreen"><div class="fpd-modal-wrapper"></div></div>').parents('.fpd-modal-overlay:first'),
				modalProductDesignerOnceOpened = false;

			$modalProductDesigner.children()
			.append('<div class="fpd-done fpd-btn" data-defaulttext="Done">misc.modal_done</div><div class="fpd-modal-close"><span class="fpd-icon-close"></span></div>');

			$(options.modalMode).addClass('fpd-modal-mode-btn').click(function(evt) {

				evt.preventDefault();

				$body.addClass('fpd-overflow-hidden').removeClass('fpd-modal-mode-active');

				$modalProductDesigner.addClass('fpd-fullscreen').fadeIn(300);
				if(instance.currentViewInstance) {
					instance.currentViewInstance.resetCanvasSize();
				}

				var $selectedModule = $mainBar.children('.fpd-navigation').children('.fpd-active');
				if($selectedModule.size() > 0) {
					instance.mainBar.callModule($selectedModule.data('module'));
				}

				//auto-select
				var autoSelectElement = null;
				if(!modalProductDesignerOnceOpened && !instance.mainOptions.editorMode && instance.currentViewInstance) {
					var viewElements = instance.currentViewInstance.stage.getObjects();
					for(var i=0; i < viewElements.length; ++i) {
						var obj = viewElements[i];

						 if(obj.autoSelect && !obj.hasUploadZone) {
							 autoSelectElement = obj;

						 }

					}
				}

				setTimeout(function() {

					if(autoSelectElement) {
						instance.currentViewInstance.stage.setActiveObject(autoSelectElement);
						instance.currentViewInstance.stage.renderAll();
					}

				}, 300);

				modalProductDesignerOnceOpened = true;

			});

			$modalProductDesigner.find('.fpd-done').click(function() {

				$modalProductDesigner.find('.fpd-modal-close').click();

			});

		}

		//test if browser is supported (safari, chrome, opera, firefox IE>9)
		var canvasTest = document.createElement('canvas'),
			canvasIsSupported = Boolean(canvasTest.getContext && canvasTest.getContext('2d')),
			minIE = options.templatesDirectory ? 9 : 8;

		if(!canvasIsSupported || (FPDUtil.isIE() && Number(FPDUtil.isIE()) <= minIE)) {

			anonymFuncs.loadCanvasError = function(html) {

				$elem.append($.parseHTML(html)).fadeIn(300);

				/**
			     * Gets fired as soon as a template has been loaded.
			     *
			     * @event FancyProductDesigner#templateLoad
			     * @param {Event} event
			     * @param {string} URL - The URL of the loaded template.
			     */
				$elem.trigger('templateLoad', [this.url]);

			};
			$.post(options.templatesDirectory+'canvaserror.'+options.templatesType, anonymFuncs.loadCanvasError);

			/**
		     * Gets fired when the browser does not support HTML5 canvas.
		     *
		     * @event FancyProductDesigner#canvasFail
		     * @param {Event} event
		     */
			$elem.trigger('canvasFail');

			return false;
		}

		//lowercase all keys in hexNames
		var key,
			keys = Object.keys(options.hexNames),
			n = keys.length,
			newHexNames = {};

		while (n--) {
		  key = keys[n];
		  newHexNames[key.toLowerCase()] = options.hexNames[key];
		}
		options.hexNames = newHexNames;


		//load language JSON
		if(options.langJSON !== false) {

			if(typeof options.langJSON === 'object') {

				instance.langJson = options.langJSON;

				$elem.trigger('langJSONLoad', [instance.langJson]);

				_initProductStage();

			}
			else {

				$.getJSON(options.langJSON).done(function(data) {

					instance.langJson = data;

					/**
				     * Gets fired when the language JSON is loaded.
				     *
				     * @event FancyProductDesigner#langJSONLoad
				     * @param {Event} event
				     * @param {Object} langJSON - A JSON containing the translation.
				     */
					$elem.trigger('langJSONLoad', [instance.langJson]);

					_initProductStage();

				})
				.fail(function(data) {

					FPDUtil.showModal('Language JSON "'+options.langJSON+'" could not be loaded or is not valid. Make sure you set the correct URL in the options and the JSON is valid!');

					$elem.trigger('langJSONLoad', [instance.langJson]);
				});

			}


		}
		else {
			_initProductStage();
		}


	}; //init end

	//init the product stage
	var _initProductStage = function() {

		var loaderHTML = '<div class="fpd-loader-wrapper"><div class="fpd-loader"><div class="fpd-loader-circle"></div><span class="fpd-loader-text" data-defaulttext="Initializing Product Designer">misc.initializing</span></div></div>',
			tooltipHtml = '<div class="fpd-element-tooltip" style="display: none;">misc.out_of_bounding_box</div>';

		//add init loader
		instance.$mainWrapper = $elem.addClass('fpd-container fpd-clearfix fpd-grid-columns-'+options.gridColumns).html(loaderHTML+'<div class="fpd-main-wrapper">'+tooltipHtml+'<div class="fpd-snap-line-h"></div><div class="fpd-snap-line-v"></div><div class="fpd-product-stage" style="width:'+options.stageWidth+'px;height: '+options.stageHeight+'px;"></div></div>').children('.fpd-main-wrapper');

		$elem.after('<div class="fpd-device-info">'+instance.getTranslation('misc', 'not_supported_device_info')+'</div>');


		instance.$productStage  = instance.$mainWrapper.children('.fpd-product-stage')
		instance.$elementTooltip = instance.$mainWrapper.children('.fpd-element-tooltip');
		$stageLoader = $elem.children('.fpd-loader-wrapper');

		_translateElement($stageLoader.find('.fpd-loader-text'));
		_translateElement(instance.$elementTooltip);
		if(options.modalMode) {
			_translateElement($body.find('.fpd-modal-overlay .fpd-done'));
		}

		//load editor box if requested
		if(typeof options.editorMode === 'string') {

			$editorBox = $('<div class="fpd-editor-box"><h5></h5><div class="fpd-clearfix"></div></div>');
			$(options.editorMode).append($editorBox);

		}

		//window resize handler
		var device = 'desktop';
		$window.resize(function() {

			if(instance.currentElement && instance.currentElement.isEditing) {
				return;
			}

			if(instance.currentElement) {
				instance.deselectElement();
			}

			if($window.width() < 568 && !instance.$container.hasClass('fpd-topbar')) {
				instance.$container.removeClass('fpd-sidebar').addClass('fpd-topbar');
				if(instance.mainBar && !options.mainBarContainer) {
					instance.mainBar.setContentWrapper('draggable-dialog');
				}

				device = 'smartphone';
			}
			else if(device === 'smartphone' && $window.width() > 568 && initCSSClasses.search('fpd-topbar') === -1 && instance.$container.hasClass('fpd-topbar')) {
				instance.$container.removeClass('fpd-topbar').addClass('fpd-sidebar');
				if(instance.mainBar && !options.mainBarContainer) {
					instance.mainBar.setContentWrapper('sidebar');
				}

				device = 'monitor';
			}

			if(instance.currentViewInstance) {
				instance.currentViewInstance.resetCanvasSize();
			}

			if(instance.$container.filter('[class*="fpd-off-canvas-"]').size() > 0) {
				instance.mainBar.$content.height(instance.$mainWrapper.height());
			}

		});

		//check if categories are used
		if($products.is('.fpd-category') && $products.filter('.fpd-category').size() > 1) {

			//loop through all categories
			$products.each(function(i, cat) {
				var $cat = $(cat);
				_createProductsFromHTML($cat.children('.fpd-product'), $cat.attr('title'));
			});

		}
		else {

			//no categories are used
			$products = $products.filter('.fpd-category').size() === 0 ? $products : $products.children('.fpd-product');
			_createProductsFromHTML($products, false);

		}

		options.templatesDirectory ? _loadUIElements() : _ready();

	};

	//now load UI elements from external HTML file
	var _loadUIElements = function() {

		_checkProductsLength();

		anonymFuncs.loadProductDesignerTemplate = function(html) {

			/**
		     * Gets fired as soon as a template has been loaded.
		     *
		     * @event FancyProductDesigner#templateLoad
		     * @param {Event} event
		     * @param {string} URL - The URL of the loaded template.
		     */
			$elem.trigger('templateLoad', [this.url]);

			$uiElements = $(html);

			$uiElements.find('[data-defaulttext]').each(function(index, uiElement) {

				_translateElement($(uiElement));

			});

			if(options.mainBarContainer) {

				$elem.addClass('fpd-main-bar-container-enabled');
				$mainBar = $(options.mainBarContainer).addClass('fpd-container fpd-main-bar-container fpd-tabs fpd-tabs-top fpd-sidebar fpd-grid-columns-'+options.gridColumns).html($uiElements.children('.fpd-mainbar')).children('.fpd-mainbar');

			}
			else {
				$mainBar = $elem.prepend($uiElements.children('.fpd-mainbar')).children('.fpd-mainbar');
			}

			$modules = $uiElements.children('.fpd-modules');

			if($elem.hasClass('fpd-sidebar')) {
				$elem.height(options.stageHeight);
			}
			else {
				$elem.width(options.stageWidth);
			}

			//show tabs content
			$body.on('click', '.fpd-module-tabs > div', function() {

				var $this = $(this),
					context = $(this).data('context');

				$this.addClass('fpd-active').siblings().removeClass('fpd-active');
				$this.parent().next('.fpd-module-tabs-content').children().hide().filter('[data-context="'+context+'"]').show();

			});

			//add modules
			if(options.mainBarModules) {

				instance.mainBar = new FPDMainBar(
					instance,
					$mainBar,
					$modules,
					$uiElements.children('.fpd-draggable-dialog')
				);

			}

			//init Actions
			if(options.actions) {

				instance.actions = new FPDActions(instance, $uiElements.children('.fpd-actions'));

			}

			//init Toolbar
			instance.toolbar = new FPDToolbar($uiElements.children('.fpd-element-toolbar'), instance);

			$elem.on('elementSelect', function(evt, element) {

				if(element && instance.currentViewInstance) {

					//upload zone is selected
					if(element.uploadZone && !instance.mainOptions.editorMode) {

						element.set('borderColor', 'transparent');

						var customAdds = $.extend({}, instance.currentViewInstance.options.customAdds, element.customAdds ? element.customAdds : {});

						instance.mainBar.toggleUploadZoneAdds(customAdds);
						instance.mainBar.callSecondary('fpd-upload-zone-adds-panel');
						instance.currentViewInstance.currentUploadZone = element.title;

						return;
					}
					//if element has no upload zone and an upload zone is selected, close dialogs and call first module
					else if(instance.currentViewInstance.currentUploadZone) {

						instance.mainBar.toggleDialog(false);

						instance.currentViewInstance.currentUploadZone = null;

						if(instance.$container.hasClass('fpd-sidebar')) {
							instance.mainBar.callModule(instance.mainBar.currentModules[0]);
						}

					}

					instance.toolbar.update(element);
					_updateEditorBox(element);

				}
				else {

					instance.toolbar.toggle(false);
					$body.children('.fpd-element-toolbar').find('input').spectrum('destroy');

				}

			})
			.on('elementChange', function(evt, type, element) {

				instance.toolbar.toggle(false);

			})
			.on('elementModify', function(evt, element, parameters) {

				if(instance.productCreated && !instance.toolbar.isTransforming) {

					if(parameters.fontSize !== undefined) {
						instance.toolbar.updateUIValue('fontSize', Number(parameters.fontSize));
					}
					if(parameters.scaleX !== undefined) {
						instance.toolbar.updateUIValue('scaleX', parseFloat(Number(parameters.scaleX).toFixed(2)));
					}
					if(parameters.scaleY !== undefined) {
						instance.toolbar.updateUIValue('scaleY', parseFloat(Number(parameters.scaleY).toFixed(2)));
					}
					if(parameters.angle !== undefined) {
						instance.toolbar.updateUIValue('angle', parseInt(parameters.angle));
					}
					if(parameters.text !== undefined) {
						instance.toolbar.updateUIValue('text', parameters.text);
					}

					if(instance.currentElement && !instance.currentElement.uploadZone) {
						instance.toolbar.updatePosition(instance.currentElement);
					}

				}

			});

			//switchers
			$('.fpd-switch-container').click(function() {

				var $this = $(this);

				if($this.hasClass('fpd-curved-text-switcher')) {

					var z = instance.currentViewInstance.getZIndex(instance.currentElement),
						defaultText = instance.currentElement.getText(),
						parameters = instance.currentViewInstance.getElementJSON(instance.currentElement);

					parameters.z = z;
					parameters.curved = instance.currentElement.type == 'i-text';
					parameters.textAlign = 'center';

					function _onTextModeChanged(evt, textElement) {
						instance.currentViewInstance.stage.setActiveObject(textElement);
						$elem.off('elementAdd', _onTextModeChanged);
					};
					$elem.on('elementAdd', _onTextModeChanged);

					instance.currentViewInstance.removeElement(instance.currentElement);
					instance.currentViewInstance.addElement('text', defaultText, defaultText, parameters);

				}
			});

			$('.fpd-dropdown').click(function() {

				$(this).toggleClass('fpd-active');

			});

			_ready();

		};

		$.post(options.templatesDirectory+'productdesigner.'+options.templatesType, anonymFuncs.loadProductDesignerTemplate);

	};

	var _ready = function() {

		//load watermark image
		if(instance.mainOptions.watermark && instance.mainOptions.watermark.length > 3) {

			fabric.Image.fromURL(instance.mainOptions.watermark, function(oImg) {
				instance.watermarkImg = oImg;
			});

		}

		if(instance.mainOptions.unsavedProductAlert) {

			$window.on('beforeunload', function () {

				if(instance.doUnsavedAlert) {
					return instance.getTranslation('misc', 'unsaved_product_alert');
				}

			});

		}

		//general close handler for modal
		$body.on('click', '.fpd-modal-close', function(evt) {

			var $this = $(this);

			if($this.parents('.fpd-modal-product-designer').length) {
				$body.addClass('fpd-modal-mode-active');
			}

			$this.parents('.fpd-modal-overlay').fadeOut(200, function() {
				$this.removeClass('fpd-fullscreen');
			});

			$body.removeClass('fpd-overflow-hidden');

			//modal product designer is closing
			if($this.parents('.fpd-modal-product-designer:first').size() > 0) {
				instance.deselectElement();
			}

		});

		$body.on('mouseup touchend', function(evt) {

			var $target = $(evt.target);

			//deselect element if click outside of a fpd-container
			if($target.closest('.fpd-container, .fpd-element-toolbar, .sp-container').length === 0 &&
			   instance.mainOptions.deselectActiveOnOutside) {
				   instance.deselectElement();
			}

		});

		//thumbnail preview effect
		$body.on('mouseover mouseout mousemove', '[data-module="designs"] .fpd-item, [data-module="images"] .fpd-item', function(evt) {

			var $this = $(this),
				price = null;

			if(instance.currentViewInstance && instance.currentViewInstance.currentUploadZone && $(evt.target).parents('.fpd-upload-zone-adds-panel').size() > 0) {
				var uploadZone = instance.currentViewInstance.getUploadZone(instance.currentViewInstance.currentUploadZone);
				if(uploadZone && uploadZone.price) {
					price = uploadZone.price;
				}
			}

			if(evt.type === 'mouseover' && $this.data('source')) {

				$thumbnailPreview = $('<div class="fpd-thumbnail-preview")"><picture></picture></div>');
				FPDUtil.loadGridImage($thumbnailPreview.children('picture'), $this.data('source'));

				//thumbnails in images module
				if($this.parents('[data-module="images"]:first').size() > 0 && price === null) {

					if(instance.currentViewInstance && instance.currentViewInstance.options.customImageParameters.price) {
						price = instance.mainOptions.priceFormat.replace('%d', instance.currentViewInstance.options.customImageParameters.price);
					}

				}
				//thumbnails in designs module
				else {

					if($this.data('title')) {
						$thumbnailPreview.addClass('fpd-title-enabled');
						$thumbnailPreview.append('<div class="fpd-preview-title">'+$this.data('title')+'</div>');
					}

					if($this.data('parameters') && $this.data('parameters').price && price === null) {
						price = instance.mainOptions.priceFormat.replace('%d', $this.data('parameters').price);
					}

				}

				if(price) {
					$thumbnailPreview.append('<div class="fpd-preview-price">'+price+'</div>');
				}

				$body.append($thumbnailPreview);

			}
			else if($thumbnailPreview !== null && evt.type === 'mousemove') {

				var leftPos = evt.pageX + 10 + $thumbnailPreview.outerWidth() > $window.width() ? $window.width() - $thumbnailPreview.outerWidth() : evt.pageX + 10;
				$thumbnailPreview.css({left: leftPos, top: evt.pageY + 10})

			}
			else if($thumbnailPreview !== null && evt.type === 'mouseout') {

				$thumbnailPreview.siblings('.fpd-thumbnail-preview').remove();
				$thumbnailPreview.remove();

			}

		});

		//load first product
		if(instance.mainOptions.loadFirstProductInStage && instance.products.length > 0 && !stageCleared) {
			instance.selectProduct(0);
		}
		else {
			instance.toggleSpinner(false);
		}

		/**
	     * Gets fired as soon as the product designer is ready to receive API calls.
	     *
	     * @event FancyProductDesigner#ready
	     * @param {Event} event
	     */
		$elem.trigger('ready');
		$window.resize();

	};

	//creates all products from HTML markup
	var _createProductsFromHTML = function($products, category) {

		var views = [];
		for(var i=0; i < $products.length; ++i) {

			//get other views
			views = $($products.get(i)).children('.fpd-product');
			//get first view
			views.splice(0,0,$products.get(i));

			var viewsArr = [];
			views.each(function(j, view) {

				var $view = $(view);
				var viewObj = {
					title: view.title,
					thumbnail: $view.data('thumbnail'),
					elements: [],
					options: $view.data('options') === undefined && typeof $view.data('options') !== 'object' ? options : fpdOptions.merge(options, $view.data('options'))
				};

				//get product thumbnail from first view
				if(j === 0 && $view.data('producttitle')) {
					viewObj.productTitle = $view.data('producttitle');
				}

				//get product thumbnail from first view
				if(j === 0 && $view.data('productthumbnail')) {
					viewObj.productThumbnail = $view.data('productthumbnail');
				}

				$view.children('img,span').each(function(k, element) {

					var $element = $(element),
						source;

					if($element.is('img')) {
						source = $element.data('src') == undefined ? $element.attr('src') : $element.data('src');
					}
					else {
						source = $element.text()
					}

					var elementObj = {
						type: $element.is('img') ? 'image' : 'text', //type
						source: source, //source
						title: $element.attr('title'),  //title
						parameters: $element.data('parameters') == undefined || $element.data('parameters').length <= 2 ? {} : $element.data('parameters')  //parameters
					};

					viewObj.elements.push(elementObj);

				});

				viewsArr.push(viewObj);

			});

			instance.addProduct(viewsArr, category);

		}

	};

	var _snapToGrid = function(element) {

		if($('[data-action="snap"]').hasClass('fpd-active')) {

			var gridX = instance.mainOptions.snapGridSize[0] ? instance.mainOptions.snapGridSize[0] : 50,
				gridY = instance.mainOptions.snapGridSize[1] ? instance.mainOptions.snapGridSize[1] : 50,
				currentPosPoint = element.getPointByOrigin('left', 'top');
				point = new fabric.Point(element.padding + (Math.round(currentPosPoint.x / gridX) * gridX), element.padding + (Math.round(currentPosPoint.y / gridY) * gridY));

				element.setPositionByOrigin(point, 'left', 'top');

		}

	};

	//snap element to center
	var _snapToCenter = function(element) {

		if($('[data-action="snap"]').hasClass('fpd-active')) {

			var edgeDetectionX = instance.mainOptions.snapGridSize[0] ? instance.mainOptions.snapGridSize[0] : 50,
				edgeDetectionY = instance.mainOptions.snapGridSize[1] ? instance.mainOptions.snapGridSize[1] : 50,
				elementCenter = element.getCenterPoint(),
				stageCenter = {x: instance.currentViewInstance.options.stageWidth * .5, y: instance.currentViewInstance.options.stageHeight * .5};

			if(Math.abs(elementCenter.x - stageCenter.x) < edgeDetectionX) {

				element.setPositionByOrigin(new fabric.Point(stageCenter.x, elementCenter.y), 'center', 'center');
		       	instance.$mainWrapper.children('.fpd-snap-line-v').css('left', '50%' ).show();

		    }
		    else {
			     instance.$mainWrapper.children('.fpd-snap-line-v').hide();
		    }
		    if (Math.abs(elementCenter.y - stageCenter.y) < edgeDetectionY) {

			    elementCenter = element.getCenterPoint();
				element.setPositionByOrigin(new fabric.Point(elementCenter.x, stageCenter.y), 'center', 'center');
		        instance.$mainWrapper.children('.fpd-snap-line-h').css('top', '50%' ).show();

		    }
		    else {
			    instance.$mainWrapper.children('.fpd-snap-line-h').hide();
		    }

		}

	};

	//get category index by category name
	var _getCategoryIndexInTemplates = function(catName) {

		for(var i=0; i < instance.products.length; ++i) {

			if(instance.products[i].name === catName) {
				return i;
				break;
			}

		}

		return false;

	};

	//translates a HTML element
	var _translateElement = function($tag) {

		if(instance.langJson) {

			var objString = '';

			if($tag.attr('placeholder') !== undefined) {
				objString = $tag.attr('placeholder');
			}
			else if($tag.attr('title') !== undefined) {
				objString = $tag.attr('title');
			}
			else if($tag.data('title') !== undefined) {
				objString = $tag.data('title');
			}
			else {
				objString = $tag.text();
			}

			var keys = objString.split('.'),
				firstObject = instance.langJson[keys[0]],
				label = '';

			if(firstObject) { //check if object exists

				label = firstObject[keys[1]];

				if(label === undefined) { //if label does not exist in JSON, take default text
					label = $tag.data('defaulttext');
				}

			}
			else {
				label = $tag.data('defaulttext');
			}

			//store all translatable labels in json
			var sectionObj = instance.languageJSON[keys[0]];
			sectionObj[keys[1]] = label;

		}
		else {
			label = $tag.data('defaulttext');
		}

		if($tag.attr('placeholder') !== undefined) {
			$tag.attr('placeholder', label).text('');
		}
		else if($tag.attr('title') !== undefined) {
			$tag.attr('title', label);
		}
		else if($tag.data('title') !== undefined) {
			$tag.data('title', label);
		}
		else {
			$tag.text(label);
		}

	};

	var _toggleUndoRedoBtn = function(undos, redos) {

		if(undos.length === 0) {
		  	instance.$mainWrapper.find('[data-action="undo"]').addClass('fpd-disabled');
  		}
  		else {
	  		instance.$mainWrapper.find('[data-action="undo"]').removeClass('fpd-disabled');
  		}

  		if(redos.length === 0) {
	  		instance.$mainWrapper.find('[data-action="redo"]').addClass('fpd-disabled');
  		}
  		else {
	  		instance.$mainWrapper.find('[data-action="redo"]').removeClass('fpd-disabled');
  		}

	};

	var _updateEditorBox = function(element) {

		if($editorBox === null) {
			return;
		}

		$editorBox.children('div').empty();
		$editorBox.children('h5').text(element.title);

		for(var i=0; i < instance.mainOptions.editorBoxParameters.length; ++i) {

			var parameter = instance.mainOptions.editorBoxParameters[i];
				value = element[parameter];

			if(value !== undefined) {

				value = typeof value === 'number' ? value.toFixed(2) : value;
				value = typeof value === 'object' ? value.source.src : value;

				$editorBox.children('div').append('<p><i>'+parameter+'</i>: <input type="text" value="'+value+'" readonly /></p>');

			}

		}

	};

	var _checkProductsLength = function() {

		if(instance.mainOptions.editorMode) { return; }

		if(instance.plainProducts.length === 0 || instance.plainProducts.length === 1) {
			instance.$container.addClass('fpd-products-module-hidden');
		}
		else {
			instance.$container.removeClass('fpd-products-module-hidden');
		}

	};

	var _onViewCreated = function() {

		//add all views of product till views end is reached
		if(instance.viewInstances.length < instance.currentViews.length) {
			instance.addView(instance.currentViews[instance.viewInstances.length]);

		}
		//all views added
		else {

			$elem.off('viewCreate', _onViewCreated);

			instance.toggleSpinner(false);
			instance.selectView(0);

			//search for object with auto-select
			if(!instance.mainOptions.editorMode && instance.currentViewInstance && $(instance.currentViewInstance.stage.getElement()).is(':visible')) {
				var viewElements = instance.currentViewInstance.stage.getObjects(),
					selectElement = null;

				for(var i=0; i < viewElements.length; ++i) {
					var obj = viewElements[i];

					 if(obj.autoSelect && !obj.hasUploadZone) {
					 	selectElement = obj;
					 }

				}
			}

			if(selectElement && instance.currentViewInstance) {
				setTimeout(function() {

					instance.currentViewInstance.stage.setActiveObject(selectElement);
					selectElement.setCoords();
					instance.currentViewInstance.stage.renderAll();

				}, 10);
			}


			instance.productCreated = true;

			/**
		     * Gets fired as soon as a product has been fully added to the designer.
		     *
		     * @event FancyProductDesigner#productCreate
		     * @param {Event} event
		     * @param {array} currentViews - An array containing all views of the product.
		     */
			$elem.trigger('productCreate', [instance.currentViews]);

		}

	};

	/**
	 * Adds a new product to the product designer.
	 *
	 * @method addProduct
	 * @param {array} views An array containing the views for a product. A view is an object with a title, thumbnail and elements property. The elements property is an array containing one or more objects with source, title, parameters and type.
	 * @param {string} [category] If categories are used, you need to define the category title.
	 */
	this.addProduct = function(views, category) {

		var catIndex = _getCategoryIndexInTemplates(category);

		if(catIndex === false) {

			catIndex = instance.products.length;
			instance.products[catIndex] = {name: category, products: []};
			instance.products[catIndex].products.push(views);

		}
		else {

			instance.products[catIndex].products.push(views);

		}

		this.plainProducts.push(views);

		_checkProductsLength();

	};

	/**
	 * Selects a product by index and category index.
	 *
	 * @method selectProduct
	 * @param {number} index The requested product by an index value. 0 will load the first product.
	 */
	this.selectProduct = function(index, categoryIndex) {

		instance.currentCategoryIndex = typeof categoryIndex === 'undefined' ? instance.currentCategoryIndex : categoryIndex;

		var category = instance.products[instance.currentCategoryIndex];

		instance.currentProductIndex = index;
		if(index < 0) { currentProductIndex = 0; }
		else if(index > category.products.length-1) { instance.currentProductIndex = category.products.length-1; }

		var views = category.products[instance.currentProductIndex];
		instance.loadProduct(views, options.replaceInitialElements);

	};

	/**
	 * Loads a new product to the product designer.
	 *
	 * @method loadProduct
	 * @param {array} views An array containing the views for the product.
	 * @param {Boolean} [onlyReplaceInitialElements=false] If true, the initial elements will be replaced. Custom added elements will stay on the canvas.
	 */
	this.loadProduct = function(views, replaceInitialElements) {

		replaceInitialElements = typeof replaceInitialElements !== 'undefined' ? replaceInitialElements : false;

		if($stageLoader.is(':hidden')) {
			instance.toggleSpinner(true);
		}

		instance.productCreated = instance.doUnsavedAlert = productIsCustomized = false;

		if(replaceInitialElements) {

			nonInitials = [];
			nonInitials = instance.getCustomElements();

		}

		instance.clear();
		instance.currentViews = views;

		var viewSelectionHtml = '<div class="fpd-views-selection fpd-grid-contain fpd-clearfix"></div>';

		if($elem.hasClass('fpd-views-outside')) {
			instance.$viewSelectionWrapper = $elem.after(viewSelectionHtml).nextAll('.fpd-views-selection:first');
		}
		else {
			instance.$viewSelectionWrapper = instance.$mainWrapper.append(viewSelectionHtml).children('.fpd-views-selection:first');
		}

		$elem.on('viewCreate', _onViewCreated);

		if(instance.currentViews) {
			instance.addView(instance.currentViews[0]);
		}

	};

	/**
	 * Adds a view to the current visible product.
	 *
	 * @method addView
	 * @param {object} view An object with title, thumbnail and elements properties.
	 */
	this.addView = function(view) {

		instance.$viewSelectionWrapper.append('<div class="fpd-shadow-1 fpd-item fpd-tooltip" title="'+view.title+'"><picture style="background-image: url('+view.thumbnail+');"></picture></div>')
		.children('div:last').click(function(evt) {

			instance.selectView(instance.$viewSelectionWrapper.children('div').index($(this)));

		});

		view.options = $.extend({}, instance.mainOptions, view.options);
		var viewInstance = new FancyProductDesignerView(instance.$productStage, view, function(viewInstance) {

			//remove view instance if not added to product container
			if($(viewInstance.stage.wrapperEl).parent().size() === 0) {
				viewInstance.clear();
				return;
			}

			if(instance.viewInstances.length == 0) {
				viewInstance.resetCanvasSize();
			}

			if(nonInitials.length > 0) {

				for(var i=0; i < nonInitials.length; ++i) {
					var object = nonInitials[i];
					if(object.viewIndex === instance.viewInstances.length) {

						var fpdElement = object.element;
						viewInstance.addElement(
							FPDUtil.getType(fpdElement.type),
							fpdElement.source,
							fpdElement.title,
							viewInstance.getElementJSON(fpdElement)
						);

					}

				}

			}

			instance.viewInstances.push(viewInstance);
			/**
			 * Gets fired when a view is created.
			 *
			 * @event FancyProductDesigner#viewCreate
			 * @param {Event} event
			 * @param {FancyProductDesignerView} viewInstance
			 */
			$elem.trigger('viewCreate', [viewInstance]);

		}, instance.mainOptions.fabricCanvasOptions);

		viewInstance.stage.on({

			'object:moving': function(opts) {

				var element = opts.target;

				if(!element.lockMovementX || !element.lockMovementY) {
					_snapToGrid(element);
					_snapToCenter(element);
				}

			}

		});

		_viewInstances.push(viewInstance);

		$(viewInstance)
		.on('elementAdd', function(evt, element) {

			//check if element has a color linking group
			if(element.colorLinkGroup && element.colorLinkGroup.length > 0) {

				var viewIndex = this.getIndex();

				if(instance.colorLinkGroups.hasOwnProperty(element.colorLinkGroup)) { //check if color link object exists for the link group

					//add new element with id and view index of it
					instance.colorLinkGroups[element.colorLinkGroup].elements.push({id: element.id, viewIndex: viewIndex});

					if(typeof element.colors === 'object') {

						//concat colors
						var concatArray = instance.colorLinkGroups[element.colorLinkGroup].colors.concat(element.colors);
						//remove duplicate colors
						instance.colorLinkGroups[element.colorLinkGroup].colors = FPDUtil.arrayUnique(concatArray);

					}

				}
				else {

					//create initial color link object
					instance.colorLinkGroups[element.colorLinkGroup] = {elements: [{id:element.id, viewIndex: viewIndex}], colors: []};

					if(typeof element.colors === 'object') {

						instance.colorLinkGroups[element.colorLinkGroup].colors = element.colors;

					}

				}

			}

			//close dialog and off-canvas on element add
			if(instance.productCreated && instance.mainOptions.hideDialogOnAdd && instance.$container.hasClass('fpd-topbar') && instance.mainBar) {

				instance.mainBar.toggleDialog(false);

			}

			/**
			 * Gets fired when an element is added.
			 *
			 * @event FancyProductDesigner#elementAdd
			 * @param {Event} event
			 * @param {fabric.Object} element
			 */
			$elem.trigger('elementAdd', [element]);

		})
		.on('boundingBoxToggle', function(evt, currentBoundingObject, addRemove) {

			/**
		     * Gets fired as soon as the bounding box is added to or removed from the stage.
		     *
		     * @event FancyProductDesigner#boundingBoxToggle
		     * @param {Event} event
		     * @param {fabric.Object} currentBoundingObject - A fabricJS rectangle representing the bounding box.
		     * @param {Boolean} addRemove - True=added, false=removed.
		     */
			$elem.trigger('boundingBoxToggle', [currentBoundingObject, addRemove]);

		})
		.on('elementSelect', function(evt, element) {

			instance.currentElement = element;

			if(element) {

			}
			else {

				if(instance.$elementTooltip) {
					instance.$elementTooltip.hide();
				}

				instance.$mainWrapper.children('.fpd-snap-line-h, .fpd-snap-line-v').hide();

			}
			/**
			 * Gets fired when an element is selected
			 *
			 * @event FancyProductDesigner#elementSelect
			 * @param {Event} event
			 * @param {fabric.Object} element
			 */
			$elem.trigger('elementSelect', [element]);

		})
		.on('elementChange', function(evt, type, element) {

			_updateEditorBox(element);
			/**
			 * Gets fired when an element is selected.
			 *
			 * @event FancyProductDesigner#elementSelect
			 * @param {Event} event
			 * @param {fabric.Object} element
			 */
			$elem.trigger('elementChange', [type, element]);

		})
		.on('elementModify', function(evt, element, parameters) {

			/**
			 * Gets fired when an element is modified.
			 *
			 * @event FancyProductDesigner#elementModify
			 * @param {Event} event
			 * @param {fabric.Object} element
			 * @param {Object} parameters
			 */
			$elem.trigger('elementModify', [element, parameters]);

		})
		.on('undoRedoSet', function(evt, undos, redos) {

			instance.doUnsavedAlert = productIsCustomized = true;
			_toggleUndoRedoBtn(undos, redos);

			/**
			 * Gets fired when an undo or redo state is set.
			 *
			 * @event FancyProductDesigner#undoRedoSet
			 * @param {Event} event
			 * @param {Array} undos - Array containing all undo objects.
			 * @param {Array} redos - Array containing all redo objects.
			 */
			$elem.trigger('undoRedoSet', [undos, redos]);

		})
		.on('priceChange', function(evt, price, viewPrice) {

			instance.currentPrice = 0;
			//calulate total price of all views
			for(var i=0; i < _viewInstances.length; ++i) {

				instance.currentPrice += _viewInstances[i].totalPrice;
			}

			/**
		     * Gets fired as soon as the price changes in a view.
		     *
		     * @event FancyProductDesigner#priceChange
		     * @param {Event} event
		     * @param {number} elementPrice - The price of the element.
		     * @param {number} totalPrice - The total price of all views.
		     */
			$elem.trigger('priceChange', [price, instance.currentPrice]);

		})
		.on('elementCheckContainemt', function(evt, element, boundingBoxMode) {

			if(boundingBoxMode === 'inside') {

				if(element.isOut) {

					instance.$elementTooltip.css({
						left: element.oCoords.mb.x,
						top: element.oCoords.tl.y - instance.$elementTooltip.outerHeight() - 20 + instance.$productStage.position().top
					}).show();

				}
				else {
					instance.$elementTooltip.hide();
				}

			}


		})
		.on('elementColorChange', function(evt, element, hex, colorLinking) {

			if(instance.productCreated && colorLinking && element.colorLinkGroup && element.colorLinkGroup.length > 0 && element.type !== 'path-group') {

				var group = instance.colorLinkGroups[element.colorLinkGroup];
				if(group && group.elements) {
					for(var i=0; i < group.elements.length; ++i) {

						var id = group.elements[i].id,
							viewIndex = group.elements[i].viewIndex,
							target = instance.getElementByID(id, viewIndex);

						if(target && target !== element && hex) {
							instance.viewInstances[viewIndex].changeColor(target, hex, false, false);
						}

					}
				}

			}

		})
		.on('elementRemove', function(evt, element) {

			/**
		     * Gets fired as soon as an element has been removed.
		     *
		     * @event FancyProductDesigner#elementRemove
		     * @param {Event} event
		     * @param {fabric.Object} element - The fabric object that has been removed.
		     */
			$elem.trigger('elementRemove', [element]);

		});

		viewInstance.setup();

		FPDUtil.updateTooltip();

		instance.$viewSelectionWrapper.children().size() > 1 ? instance.$viewSelectionWrapper.show() : instance.$viewSelectionWrapper.hide();

	};

	/**
	 * Selects a view from the current visible views.
	 *
	 * @method selectView
	 * @param {number} index The requested view by an index value. 0 will load the first view.
	 */
	this.selectView = function(index) {

		if(instance.currentViews === null) {return;}

		instance.currentViewIndex = index;
		if(index < 0) { instance.currentViewIndex = 0; }
		else if(index > instance.currentViews.length-1) { instance.currentViewIndex = instance.currentViews.length-1; }

		instance.$viewSelectionWrapper.children('div').removeClass('fpd-view-active')
		.eq(index).addClass('fpd-view-active');

		if(instance.currentViewInstance) {
			//delete all undos/redos
			instance.currentViewInstance.undos = [];
			instance.currentViewInstance.redos = [];

			//remove snap lines
			var snapLinesGroup = instance.currentViewInstance.getElementByTitle('snap-lines-group');
			if(snapLinesGroup) {
				instance.currentViewInstance.stage.remove(snapLinesGroup);
			}

		}

		instance.currentViewInstance = instance.viewInstances[instance.currentViewIndex];

		instance.deselectElement();

		//select view wrapper and render stage of view
		instance.$productStage.children('.fpd-view-stage').addClass('fpd-hidden').eq(instance.currentViewIndex).removeClass('fpd-hidden');
		instance.currentViewInstance.stage.renderAll();

		//toggle custom adds
		if($mainBar && $mainBar.find('.fpd-navigation').size()) {
			var viewOpts = instance.currentViewInstance.options,
				$nav = $mainBar.find('.fpd-navigation');

			$nav.children('[data-module="designs"]').toggleClass('fpd-disabled', !viewOpts.customAdds.designs);
			$nav.children('[data-module="images"]').toggleClass('fpd-disabled', !viewOpts.customAdds.uploads);
			$nav.children('[data-module="text"]').toggleClass('fpd-disabled', !viewOpts.customAdds.texts);

			//select nav item, if topbar layout is not used, no active item is set and active item is not disabled
			if((!$elem.hasClass('fpd-topbar') && $nav.children('.fpd-active').size() === 0) || $nav.children('.fpd-active').hasClass('fpd-disabled')) {
				$nav.children(':not(.fpd-disabled)').first().click();
			}

			//if products module is hidden and selected, select next
			if(instance.$container.hasClass('fpd-products-module-hidden') && $nav.children('.fpd-active').filter('[data-module="products"]').length > 0) {
				$nav.children(':not(.fpd-disabled)').eq(1).click();
			}

		}

		//reset view canvas size
		instance.$productStage.width(instance.currentViewInstance.options.stageWidth);
		instance.currentViewInstance.resetCanvasSize();

		if(instance.$container.filter('[class*="fpd-off-canvas-"]').size() > 0) {
			instance.mainBar.$content.height(instance.$mainWrapper.height());
		}

		_toggleUndoRedoBtn(instance.currentViewInstance.undos, instance.currentViewInstance.redos);

		/**
	     * Gets fired as soon as a view has been selected.
	     *
	     * @event FancyProductDesigner#viewSelect
	     * @param {Event} event
	     * @param {Number} viewIndex
	     * @param {Object} viewInstance
	     */
		$elem.trigger('viewSelect', [instance.currentViewIndex, instance.currentViewInstance]);

	};

	/**
	 * Adds a new element to the product designer.
	 *
	 * @method addElement
	 * @param {string} type The type of an element you would like to add, 'image' or 'text'.
	 * @param {string} source For image the URL to the image and for text elements the default text.
	 * @param {string} title Only required for image elements.
	 * @param {object} [parameters] An object with the parameters, you would like to apply on the element.
	 * @param {number} [viewIndex] The index of the view where the element needs to be added to. If no index is set, it will be added to current showing view.
	 */
	this.addElement = function(type, source, title, parameters, viewIndex) {

		viewIndex = typeof viewIndex !== 'undefined' ? viewIndex : instance.currentViewIndex;
		parameters = typeof parameters !== 'undefined' ? parameters : {};

		instance.viewInstances[viewIndex].addElement(type, source, title, parameters);

		//element should be replaced in all views
		if(parameters.replace && parameters.replaceInAllViews) {

			for(var i=0; i < instance.viewInstances.length; ++i) {

				var viewInstance = instance.viewInstances[i];
				//check if not current view and view has at least one element with the replace value
				if(viewIndex !== i && viewInstance.getElementByReplace(parameters.replace) !== null) {
					viewInstance.addElement(type, source, title, parameters, i);
				}

			}

		}

	};

	/**
	 * Sets the parameters for a specified element.
	 *
	 * @method setElementParameters
	 * @param {object} parameters An object with the parameters that should be applied to the element.
	 * @param {fabric.Object | string} element A fabric object or the title of an element.
	 * @param {Number} viewIndex The index of the view you would like target. If not set, the current showing view will be used.
	 */
	this.setElementParameters = function(parameters, element, viewIndex) {

		element = typeof element === 'undefined' ? instance.stage.getActiveObject() : element;

		if(!element || parameters === undefined) {
			return false;
		}

		viewIndex = typeof viewIndex === 'undefined' ? instance.currentViewIndex : viewIndex;

		instance.viewInstances[viewIndex].setElementParameters(parameters, element);

	};

	/**
	 * Clears the product stage and resets everything.
	 *
	 * @method clear
	 */
	this.clear = function() {

		if(instance.currentViews === null) { return; }

		$elem.off('viewCreate', _onViewCreated);

		instance.deselectElement();
		instance.resetZoom();
		instance.currentViewIndex = instance.currentPrice = 0;
		instance.currentViewInstance = instance.currentViews = instance.currentElement = null;

		instance.$mainWrapper.find('.fpd-view-stage').remove();
		$body.find('.fpd-views-selection').remove();

		instance.viewInstances = [];
		_viewInstances = [];

		/**
	     * Gets fired as soon as the stage has been cleared.
	     *
	     * @event FancyProductDesigner#clear
	     * @param {Event} event
	     */
		$elem.trigger('clear');
		$elem.trigger('priceChange', [0, 0]);
		stageCleared = true;

	};

	/**
	 * Deselects the selected element of the current showing view.
	 *
	 * @method deselectElement
	 */
	this.deselectElement = function() {

		if(instance.currentViewInstance) {

			instance.currentViewInstance.deselectElement();

		}

	};

	/**
	 * Creates all views in one data URL. The different views will be positioned below each other.
	 *
	 * @method getProductDataURL
	 * @param {Function} callback A function that will be called when the data URL is created. The function receives the data URL.
	 * @param {String} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {Object} [options] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 * @example fpd.getProductDataURL( function(dataURL){} );
	 */
	this.getProductDataURL = function(callback, backgroundColor, options) {

		callback = typeof callback !== 'undefined' ? callback : function() {};
		backgroundColor = typeof backgroundColor !== 'undefined' ? backgroundColor : 'transparent';
		options = typeof options !== 'undefined' ? options : {};

		//check
		if(instance.viewInstances.length === 0) { callback('') }

		$body.append('<canvas id="fpd-hidden-canvas"></canvas>');
		var printCanvas = new fabric.Canvas('fpd-hidden-canvas', {containerClass: 'fpd-hidden fpd-hidden-canvas'}),
			viewCount = 0;

		function _addCanvasImage(viewInstance) {

			if(viewInstance.options.stageWidth > printCanvas.getWidth()) {
				printCanvas.setDimensions({width: viewInstance.options.stageWidth});
			}

			viewInstance.toDataURL(function(dataURL) {

				fabric.Image.fromURL(dataURL, function(img) {

					printCanvas.add(img);

					if(viewCount > 0) {
						img.setTop(printCanvas.getHeight());
						printCanvas.setDimensions({height: printCanvas.getHeight() + viewInstance.options.stageHeight});
					}

					viewCount++;
					if(viewCount < instance.viewInstances.length) {
						_addCanvasImage(instance.viewInstances[viewCount]);
					}
					else {
						callback(printCanvas.toDataURL(options));
						printCanvas.dispose();
						$body.children('.fpd-hidden-canvas, #fpd-hidden-canvas').remove();

						if(instance.currentViewInstance) {
							instance.currentViewInstance.resetCanvasSize();
						}

					}

				});

			}, backgroundColor, {}, instance.watermarkImg);

		};

		var firstView = instance.viewInstances[0];
		printCanvas.setDimensions({width: firstView.options.stageWidth, height: firstView.options.stageHeight});
		_addCanvasImage(firstView);

	};

	/**
	 * Creates the views as data URL.
	 *
	 * @method getViewsDataURL
	 * @param {Function} callback A function that will be called when the data URL is created. The function receives the data URL.
	 * @param {string} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {string} [options] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 */
	this.getViewsDataURL = function(callback, backgroundColor, options) {

		callback = typeof callback !== 'undefined' ? callback : function() {};
		backgroundColor = typeof backgroundColor !== 'undefined' ? backgroundColor : 'transparent';
		options = typeof options !== 'undefined' ? options : {};

		var dataURLs = [];

		for(var i=0; i < instance.viewInstances.length; ++i) {

			instance.viewInstances[i].toDataURL(function(dataURL) {

				dataURLs.push(dataURL);

				if(dataURLs.length === instance.viewInstances.length) {
					callback(dataURLs);
				}

			}, backgroundColor, options, instance.watermarkImg);

		}

	};

	/**
	 * Returns the views as SVG.
	 *
	 * @method getViewsSVG
	 * @return {array} An array with all views as SVG.
	 */
	this.getViewsSVG = function(options, reviver) {

		var SVGs = [];

		for(var i=0; i < instance.viewInstances.length; ++i) {
			SVGs.push(instance.viewInstances[i].toSVG(options, reviver));
		}

		return SVGs;

	};

	/**
	 * Shows or hides the spinner with an optional message.
	 *
	 * @method toggleSpinner
	 * @param {String} state The state can be "show" or "hide".
	 * @param {Boolean} msg The message that will be displayed underneath the spinner.
	 */
	this.toggleSpinner = function(state, msg) {

		state = typeof state === 'undefined' ? true : state;
		msg = typeof msg === 'undefined' ? '' : msg;

		if(state) {

			$stageLoader.fadeIn(300).find('.fpd-loader-text').text(msg);

		}
		else {

			$stageLoader.stop().fadeOut(300);

		}

	};

	/**
	 * Returns an fabric object by title.
	 *
	 * @method getElementByTitle
	 * @param {String} title The title of an element.
	 * @param {Number} viewIndex The index of the target view.
	 * @return {fabric.Object} FabricJS Object.
	 */
	this.getElementByTitle = function(title, viewIndex) {

		if(typeof viewIndex === 'undefined') {
			//scans all view instances
			for(var i=0; i < instance.viewInstances.length; ++i) {
				var objects = instance.viewInstances[i].stage.getObjects();
				for(var j = 0; j < objects.length; ++j) {
					if(objects[j].title == title) {
						return objects[j];
						break;
					}
				}
			}

		}
		else {
			//scans the view instance by index
			var objects = instance.viewInstances[viewIndex].stage.getObjects();
			for(var i = 0; i < objects.length; ++i) {
				if(objects[i].title == title) {
					return objects[i];
					break;
				}
			}

		}

	};

	/**
	 * Returns an array view all elements or only the elements of a specific view.
	 *
	 * @method getElements
	 * @param {Number} viewIndex The index of the target view.
	 * @return {Array} An array containg the elements.
	 */
	this.getElements = function(viewIndex) {

		this.deselectElement();

		if(typeof viewIndex === 'undefined') {

			var allElements = [];

			for(var i=0; i < instance.viewInstances.length; ++i) {
				allElements.push(instance.viewInstances[i].stage.getObjects());
			}

			return allElements;

		}
		else {

			return instance.viewInstances[viewIndex].stage.getObjects();

		}

	};

	/**
	 * Opens the current showing product in a Pop-up window and shows the print dialog.
	 *
	 * @method print
	 */
	this.print = function() {

		_createPopupImage = function(dataURLs) {

			var images = new Array(),
				imageLoop = 0;

			//load all images first
			for(var i=0; i < dataURLs.length; ++i) {

				var image = new Image();
				image.src = dataURLs[i];
				image.onload = function() {

					images.push(this);
					imageLoop++;

					//add images to popup and print popup
					if(imageLoop == dataURLs.length) {

						var popup = window.open('','','width='+images[0].width+',height='+(images[0].height*dataURLs.length)+',location=no,menubar=no,scrollbars=yes,status=no,toolbar=no');
						FPDUtil.popupBlockerAlert(popup);

						popup.document.title = "Print Image";
						for(var j=0; j < images.length; ++j) {
							$(popup.document.body).append('<img src="'+images[j].src+'" />');
						}

						setTimeout(function() {
							popup.print();
						}, 1000);

					}
				}

			}

		};

		instance.getViewsDataURL(_createPopupImage);

	};

	/**
	 * Creates an image of the current showing product.
	 *
	 * @method createImage
	 * @param {boolean} [openInBlankPage= true] Opens the image in a Pop-up window.
	 * @param {boolean} [forceDownload=false] Downloads the image to the user's computer.
	 * @param {string} [backgroundColor=transparent] The background color as hexadecimal value. For 'png' you can also use 'transparent'.
	 * @param {string} [options] See fabricjs documentation http://fabricjs.com/docs/fabric.Canvas.html#toDataURL.
	 */
	this.createImage = function(openInBlankPage, forceDownload, backgroundColor, options) {

		if(typeof(openInBlankPage)==='undefined') openInBlankPage = true;
		if(typeof(forceDownload)==='undefined') forceDownload = false;
		backgroundColor = typeof backgroundColor !== 'undefined' ? backgroundColor : 'transparent';
		options = typeof options !== 'undefined' ? options : {};
		format = options.format === undefined ? 'png' : options.format;

		instance.getProductDataURL(function(dataURL) {

			var image = new Image();
			image.src = dataURL;

			image.onload = function() {

				if(openInBlankPage) {

					var popup = window.open('','_blank');
					FPDUtil.popupBlockerAlert(popup);

					popup.document.title = "Product Image";
					$(popup.document.body).append('<img src="'+this.src+'" download="product.'+format+'" />');

					if(forceDownload) {
						window.location.href = popup.document.getElementsByTagName('img')[0].src.replace('image/'+format+'', 'image/octet-stream');
					}
				}

			}

		}, backgroundColor, options);


	};

	/**
	 * Sets the zoom of the stage. 1 is equal to no zoom.
	 *
	 * @method setZoom
	 * @param {number} value The zoom value.
	 */
	this.setZoom = function(value) {

		this.deselectElement();

		if(instance.currentViewInstance) {

			var responsiveScale = instance.currentViewInstance.responsiveScale;

			var point = new fabric.Point(instance.currentViewInstance.stage.getWidth() * 0.5, instance.currentViewInstance.stage.getHeight() * 0.5);

			instance.currentViewInstance.stage.zoomToPoint(point, value * responsiveScale);

			if(value == 1) {
				instance.resetZoom();
			}

		}


	};

	/**
	 * Resets the zoom.
	 *
	 * @method resetZoom
	 */
	this.resetZoom = function() {

		this.deselectElement();

		if(instance.currentViewInstance) {

			var responsiveScale = instance.currentViewInstance.responsiveScale;

			instance.currentViewInstance.stage.zoomToPoint(new fabric.Point(0, 0), responsiveScale);
			instance.currentViewInstance.stage.absolutePan(new fabric.Point(0, 0));

		}

	};

	/**
	 * Get an elment by ID.
	 *
	 * @method getElementByID
	 * @param {Number} id The id of an element.
	 * @param {Number} [viewIndex] The view index you want to search in. If no index is set, it will use the current showing view.
	 */
	this.getElementByID = function(id, viewIndex) {

		viewIndex = typeof viewIndex === 'undefined' ? instance.currentViewIndex : viewIndex;

		return instance.viewInstances[viewIndex].getElementByID(id);

	};

	/**
	 * Returns the current showing product with all views and elements in the views.
	 *
	 * @method getProduct
	 * @param {boolean} [onlyEditableElements=false] If true, only the editable elements will be returned.
	 * @param {boolean} [customizationRequired=false] To receive the product the user needs to customize the initial elements.
	 * @return {array} An array with all views. A view is an object containing the title, thumbnail, custom options and elements. An element object contains the title, source, parameters and type.
	 */
	this.getProduct = function(onlyEditableElements, customizationRequired) {

		onlyEditableElements = typeof onlyEditableElements !== 'undefined' ? onlyEditableElements : false;
		customizationRequired = typeof customizationRequired !== 'undefined' ? customizationRequired : false;

		if(customizationRequired && !productIsCustomized) {
			FPDUtil.showModal(instance.getTranslation('misc', 'customization_required_info'));
			return false;
		}

		this.deselectElement();
		this.resetZoom();

		instance.doUnsavedAlert = false;

		//check if an element is out of his containment
		var viewElements = this.getElements();
		for(var i=0; i < viewElements.length; ++i) {

			for(var j=0; j < viewElements[i].length; ++j) {

				if(viewElements[i][j].isOut) {
					FPDUtil.showModal(viewElements[i][j].title+': '+instance.getTranslation('misc', 'out_of_bounding_box'));
					return false;
				}

			}

		}

		var product = [];
		//add views
		for(var i=0; i < instance.viewInstances.length; ++i) {
			var viewInstance = instance.viewInstances[i],
				relevantViewOpts = {
					stageWidth: viewInstance.options.stageWidth,
					stageHeight: viewInstance.options.stageHeight,
					customAdds: viewInstance.options.customAdds
				};

			product.push({title: viewInstance.title, thumbnail: viewInstance.thumbnail, elements: [], options: relevantViewOpts});
		}

		for(var i=0; i < viewElements.length; ++i) {

			for(var j=0; j < viewElements[i].length; ++j) {
				var element = viewElements[i][j];

				if(element.title !== undefined && element.source !== undefined) {
					var jsonItem = {
						title: element.title,
						source: element.source,
						parameters: instance.viewInstances[i].getElementJSON(element),
						type: FPDUtil.getType(element.type)
					};

					if(onlyEditableElements) {
						if(element.isEditable) {
							product[i].elements.push(jsonItem);
						}
					}
					else {
						product[i].elements.push(jsonItem);
					}
				}
			}
		}

		//returns an array with all views
		return product;

	};

	/**
	 * Get the translation of a label.
	 *
	 * @method getTranslation
	 * @param {String} section The section key you want - toolbar, actions, modules or misc.
	 * @param {String} label The label key.
	 */
	this.getTranslation = function(section, label) {

		if(instance.langJson) {

			section = instance.langJson[section];
			if(section) {
				return section[label];
			}

		}

		return '';

	};

	/**
	 * Returns an array with all custom added elements.
	 *
	 * @method getCustomElements
	 * @param {string} [type='all'] The type of elements. Possible values: 'all', 'image', 'text'
	 * @return {array} An array with objects with the fabric object and the view index.
	 */
	this.getCustomElements = function(type) {

		type = typeof type === 'undefined' ? 'all' : type;

		var views = this.getElements(),
			customElements = [];

		for(var i=0; i< views.length; ++i) {
			var elements = views[i];

			for(var j=0; j < elements.length; ++j) {
				var element = elements[j],
					fpdElement = null;

				if(element.isCustom) {

					if(type === 'image' || type === 'text') { //only image or text elements

						if(FPDUtil.getType(element.type) === type) {
							customElements.push({element: element, viewIndex: i});
						}

					}
					else { //get all custom added elements
						customElements.push({element: element, viewIndex: i});
					}

				}

			}


		}

		return customElements;

	};

	/**
	 * Adds a new custom image to the product stage. This method should be used if you are using an own image uploader for the product designer. The customImageParameters option will be applied on the images that are added via this method.
	 *
	 * @method addCustomImage
	 * @param {string} source The URL of the image.
	 * @param {string} title The title for the design.
	 */
	this.addCustomImage = function(source, title) {

		var image = new Image;
    		image.src = source;

    	this.toggleSpinner();

		image.onload = function() {

			var imageH = this.height,
				imageW = this.width,
				currentCustomImageParameters = instance.currentViewInstance.options.customImageParameters,
				imageParts = this.src.split('.'),
				scaling = 1;

			if(!FPDUtil.checkImageDimensions(instance, imageW, imageH)) {
				instance.toggleSpinner(false);
    			return false;
			}

			scaling = FPDUtil.getScalingByDimesions(
				imageW,
				imageH,
				currentCustomImageParameters.resizeToW,
				currentCustomImageParameters.resizeToH
			);

			var fixedParams = {
				scaleX: scaling,
				scaleY: scaling,
				isCustom: true
			};

			if($.inArray('svg', imageParts) != -1) {
				fixedParams.colors = true;
			}

    		instance.addElement(
    			'image',
    			source,
    			title,
	    		$.extend({}, currentCustomImageParameters, fixedParams)
    		);

    		instance.toggleSpinner(false);

		}

		image.onerror = function(evt) {
			FPDUtil.showModal('Image could not be loaded!');
		}

	};

	/**
	 * Sets the dimensions of all views.
	 *
	 * @method setDimensions
	 * @param {Number} width The width in pixel.
	 * @param {Number} height The height in pixel.
	 */
	this.setDimensions = function(width, height) {

		options.stageWidth = instance.mainOptions.stageWidth = width;
		options.stageHeight = instance.mainOptions.stageHeight = height;

		instance.$container.find('.fpd-product-stage').width(width);
		for(var i=0; i < instance.viewInstances.length; ++i) {

			instance.viewInstances[i].options.stageWidth = width;
			instance.viewInstances[i].options.stageHeight = height;
			instance.viewInstances[i].resetCanvasSize();

		}

		if(instance.$container.filter('[class*="fpd-off-canvas-"]').size() > 0) {
			instance.mainBar.$content.height(instance.$mainWrapper.height());
		}

	};

	_initialize();

};



/*
Copyright (c) 2009 Ben Leslie

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
 This JavaScript library is used to parse meta-data from files
 with mime-type image/jpeg.

 Include it with something like:

   <script type="text/javascript" src="jpegmeta.js"></script>

 This adds a single 'module' object called 'JpegMeta' to the global
 namespace.

 Public Functions
 ----------------
 JpegMeta.parseNum - parse unsigned integers from binary data
 JpegMeta.parseSnum - parse signed integers from binary data

 Public Classes
 --------------
 JpegMeta.Rational - A rational number class
 JpegMeta.JfifSegment
 JpegMeta.ExifSegment
 JpegMeta.JpegFile - Primary class for Javascript parsing
*/

if (this.JpegMeta) {
    throw Error("Library included multiple times");
}

var JpegMeta = {};

JpegMeta.stringIsClean = function stringIsClean(str) {
    for (var i = 0; i < str.length; i++) {
	if (str.charCodeAt(i) < 0x20) {
	    return false;
	}
    }
    return true;
}

/*
   parse an unsigned number of size bytes at offset in some binary string data.
   If endian
   is "<" parse the data as little endian, if endian
   is ">" parse as big-endian.
*/
JpegMeta.parseNum = function parseNum(endian, data, offset, size) {
    var i;
    var ret;
    var big_endian = (endian === ">");
    if (offset === undefined) offset = 0;
    if (size === undefined) size = data.length - offset;
    for (big_endian ? i = offset : i = offset + size - 1;
	 big_endian ? i < offset + size : i >= offset;
	 big_endian ? i++ : i--) {
	ret <<= 8;
	ret += data.charCodeAt(i);
    }
    return ret;
};

/*
   parse an signed number of size bytes at offset in some binary string data.
   If endian
   is "<" parse the data as little endian, if endian
   is ">" parse as big-endian.
*/
JpegMeta.parseSnum = function parseSnum(endian, data, offset, size) {
    var i;
    var ret;
    var neg;
    var big_endian = (endian === ">");
    if (offset === undefined) offset = 0;
    if (size === undefined) size = data.length - offset;
    for (big_endian ? i = offset : i = offset + size - 1;
	 big_endian ? i < offset + size : i >= offset;
	 big_endian ? i++ : i--) {
	if (neg === undefined) {
	    /* Negative if top bit is set */
	    neg = (data.charCodeAt(i) & 0x80) === 0x80;
	}
	ret <<= 8;
	/* If it is negative we invert the bits */
	ret += neg ? ~data.charCodeAt(i) & 0xff: data.charCodeAt(i);
    }
    if (neg) {
	/* If it is negative we do two's complement */
	ret += 1;
	ret *= -1;
    }
    return ret;
};

/* Rational number class */
JpegMeta.Rational = function Rational(num, den)
{
    this.num = num;
    this.den = den || 1;
    return this;
};

/* Rational number methods */
JpegMeta.Rational.prototype.toString = function toString() {
    if (this.num === 0) {
	return "" + this.num;
    }
    if (this.den === 1) {
	return "" + this.num;
    }
    if (this.num === 1) {
	return this.num + " / " + this.den;
    }
    return this.num / this.den; // + "/" + this.den;
};

JpegMeta.Rational.prototype.asFloat = function asFloat() {
    return this.num / this.den;
};


/* MetaGroup class */
JpegMeta.MetaGroup = function MetaGroup(fieldName, description) {
    this.fieldName = fieldName;
    this.description = description;
    this.metaProps = {};
    return this;
};

JpegMeta.MetaGroup.prototype._addProperty = function _addProperty(fieldName, description, value) {
    var property = new JpegMeta.MetaProp(fieldName, description, value);
    this[property.fieldName] = property;
    this.metaProps[property.fieldName] = property;
};

JpegMeta.MetaGroup.prototype.toString = function toString() {
    return "[MetaGroup " + this.description + "]";
};


/* MetaProp class */
JpegMeta.MetaProp = function MetaProp(fieldName, description, value) {
    this.fieldName = fieldName;
    this.description = description;
    this.value = value;
    return this;
};

JpegMeta.MetaProp.prototype.toString = function toString() {
    return "" + this.value;
};



/* JpegFile class */
this.JpegMeta.JpegFile = function JpegFile(binary_data, filename) {
    /* Change this to EOI if we want to parse. */
    var break_segment = this._SOS;

    this.metaGroups = {};
    this._binary_data = binary_data;
    this.filename = filename;

    /* Go through and parse. */
    var pos = 0;
    var pos_start_of_segment = 0;
    var delim;
    var mark;
    var _mark;
    var segsize;
    var headersize;
    var mark_code;
    var mark_fn;

    /* Check to see if this looks like a JPEG file */
    if (this._binary_data.slice(0, 2) !== this._SOI_MARKER) {
	throw new Error("Doesn't look like a JPEG file. First two bytes are " +
			this._binary_data.charCodeAt(0) + "," +
			this._binary_data.charCodeAt(1) + ".");
    }

    pos += 2;

    while (pos < this._binary_data.length) {
	delim = this._binary_data.charCodeAt(pos++);
	mark = this._binary_data.charCodeAt(pos++);

	pos_start_of_segment = pos;

	if (delim != this._DELIM) {
	    break;
	}

	if (mark === break_segment) {
	    break;
	}

	headersize = JpegMeta.parseNum(">", this._binary_data, pos, 2);

	/* Find the end */
	pos += headersize;
	while (pos < this._binary_data.length) {
	    delim = this._binary_data.charCodeAt(pos++);
	    if (delim == this._DELIM) {
		_mark = this._binary_data.charCodeAt(pos++);
		if (_mark != 0x0) {
		    pos -= 2;
		    break;
		}
	    }
	}

	segsize = pos - pos_start_of_segment;

	if (this._markers[mark]) {
	    mark_code = this._markers[mark][0];
	    mark_fn = this._markers[mark][1];
	} else {
	    mark_code = "UNKN";
	    mark_fn = undefined;
	}

	if (mark_fn) {
	    this[mark_fn](mark, pos_start_of_segment + 2, segsize - 2);
	}

    }

    if (this.general === undefined) {
	throw Error("Invalid JPEG file.");
    }

    return this;
};

this.JpegMeta.JpegFile.prototype.toString = function () {
    return "[JpegFile " + this.filename + " " +
	this.general.type + " " +
	this.general.pixelWidth + "x" +
	this.general.pixelHeight +
	" Depth: " + this.general.depth + "]";
};

/* Some useful constants */
this.JpegMeta.JpegFile.prototype._SOI_MARKER = '\xff\xd8';
this.JpegMeta.JpegFile.prototype._DELIM = 0xff;
this.JpegMeta.JpegFile.prototype._EOI = 0xd9;
this.JpegMeta.JpegFile.prototype._SOS = 0xda;

this.JpegMeta.JpegFile.prototype._sofHandler = function _sofHandler (mark, pos) {
    if (this.general !== undefined) {
	throw Error("Unexpected multiple-frame image");
    }

    this._addMetaGroup("general", "General");
    this.general._addProperty("depth", "Depth", JpegMeta.parseNum(">", this._binary_data, pos, 1));
    this.general._addProperty("pixelHeight", "Pixel Height", JpegMeta.parseNum(">", this._binary_data, pos + 1, 2));
    this.general._addProperty("pixelWidth", "Pixel Width",JpegMeta.parseNum(">", this._binary_data, pos + 3, 2));
    this.general._addProperty("type", "Type", this._markers[mark][2]);
};

this.JpegMeta.JpegFile.prototype._commentHandler = function _commentHandler (mark, pos, size) {

    var _pos, result;
    pos++;
    size--;
    _pos = pos;
    result = "";

    while(_pos < pos+size) {
        result += String.fromCharCode(this._binary_data.charCodeAt(_pos));
        _pos++;
    }

    this._addMetaGroup("comment", "Comment");
    this.comment._addProperty("comment", "Comment", result);
};


/* JFIF idents */
this.JpegMeta.JpegFile.prototype._JFIF_IDENT = "JFIF\x00";
this.JpegMeta.JpegFile.prototype._JFXX_IDENT = "JFXX\x00";

/* EXIF idents */
this.JpegMeta.JpegFile.prototype._EXIF_IDENT = "Exif\x00";

/* TIFF types */
this.JpegMeta.JpegFile.prototype._types = {
    /* The format is identifier : ["type name", type_size_in_bytes ] */
    1 : ["BYTE", 1],
    2 : ["ASCII", 1],
    3 : ["SHORT", 2],
    4 : ["LONG", 4],
    5 : ["RATIONAL", 8],
    6 : ["SBYTE", 1],
    7 : ["UNDEFINED", 1],
    8 : ["SSHORT", 2],
    9 : ["SLONG", 4],
    10 : ["SRATIONAL", 8],
    11 : ["FLOAT", 4],
    12 : ["DOUBLE", 8]
};

this.JpegMeta.JpegFile.prototype._tifftags = {
    /* A. Tags relating to image data structure */
    256 : ["Image width", "ImageWidth"],
    257 : ["Image height", "ImageLength"],
    258 : ["Number of bits per component", "BitsPerSample"],
    259 : ["Compression scheme", "Compression",
	   {1 : "uncompressed", 6 : "JPEG compression" }],
    262 : ["Pixel composition", "PhotmetricInerpretation",
	   {2 : "RGB", 6 : "YCbCr"}],
    274 : ["Orientation of image", "Orientation",
	   /* FIXME: Check the mirror-image / reverse encoding and rotation */
	   {1 : "Normal", 2 : "Reverse?",
	    3 : "Upside-down", 4 : "Upside-down Reverse",
	    5 : "90 degree CW", 6 : "90 degree CW reverse",
	    7 : "90 degree CCW", 8 : "90 degree CCW reverse"}],
    277 : ["Number of components", "SamplesPerPixel"],
    284 : ["Image data arrangement", "PlanarConfiguration",
	   {1 : "chunky format", 2 : "planar format"}],
    530 : ["Subsampling ratio of Y to C", "YCbCrSubSampling"],
    531 : ["Y and C positioning", "YCbCrPositioning",
	   {1 : "centered", 2 : "co-sited"}],
    282 : ["X Resolution", "XResolution"],
    283 : ["Y Resolution", "YResolution"],
    296 : ["Resolution Unit", "ResolutionUnit",
	   {2 : "inches", 3 : "centimeters"}],
    /* B. Tags realting to recording offset */
    273 : ["Image data location", "StripOffsets"],
    278 : ["Number of rows per strip", "RowsPerStrip"],
    279 : ["Bytes per compressed strip", "StripByteCounts"],
    513 : ["Offset to JPEG SOI", "JPEGInterchangeFormat"],
    514 : ["Bytes of JPEG Data", "JPEGInterchangeFormatLength"],
    /* C. Tags relating to image data characteristics */
    301 : ["Transfer function", "TransferFunction"],
    318 : ["White point chromaticity", "WhitePoint"],
    319 : ["Chromaticities of primaries", "PrimaryChromaticities"],
    529 : ["Color space transformation matrix coefficients", "YCbCrCoefficients"],
    532 : ["Pair of black and white reference values", "ReferenceBlackWhite"],
    /* D. Other tags */
    306 : ["Date and time", "DateTime"],
    270 : ["Image title", "ImageDescription"],
    271 : ["Make", "Make"],
    272 : ["Model", "Model"],
    305 : ["Software", "Software"],
    315 : ["Person who created the image", "Artist"],
    316 : ["Host Computer", "HostComputer"],
    33432 : ["Copyright holder", "Copyright"],

    34665 : ["Exif tag", "ExifIfdPointer"],
    34853 : ["GPS tag", "GPSInfoIfdPointer"]
};

this.JpegMeta.JpegFile.prototype._exiftags = {
    /* Tag Support Levels (2) - 0th IFX Exif Private Tags */
    /* A. Tags Relating to Version */
    36864 : ["Exif Version", "ExifVersion"],
    40960 : ["FlashPix Version", "FlashpixVersion"],

    /* B. Tag Relating to Image Data Characteristics */
    40961 : ["Color Space", "ColorSpace"],

    /* C. Tags Relating to Image Configuration */
    37121 : ["Meaning of each component", "ComponentsConfiguration"],
    37122 : ["Compressed Bits Per Pixel", "CompressedBitsPerPixel"],
    40962 : ["Pixel X Dimension", "PixelXDimension"],
    40963 : ["Pixel Y Dimension", "PixelYDimension"],

    /* D. Tags Relating to User Information */
    37500 : ["Manufacturer notes", "MakerNote"],
    37510 : ["User comments", "UserComment"],

    /* E. Tag Relating to Related File Information */
    40964 : ["Related audio file", "RelatedSoundFile"],

    /* F. Tags Relating to Date and Time */
    36867 : ["Date Time Original", "DateTimeOriginal"],
    36868 : ["Date Time Digitized", "DateTimeDigitized"],
    37520 : ["DateTime subseconds", "SubSecTime"],
    37521 : ["DateTimeOriginal subseconds", "SubSecTimeOriginal"],
    37522 : ["DateTimeDigitized subseconds", "SubSecTimeDigitized"],

    /* G. Tags Relating to Picture-Taking Conditions */
    33434 : ["Exposure time", "ExposureTime"],
    33437 : ["FNumber", "FNumber"],
    34850 : ["Exposure program", "ExposureProgram"],
    34852 : ["Spectral sensitivity", "SpectralSensitivity"],
    34855 : ["ISO Speed Ratings", "ISOSpeedRatings"],
    34856 : ["Optoelectric coefficient", "OECF"],
    37377 : ["Shutter Speed",  "ShutterSpeedValue"],
    37378 : ["Aperture Value", "ApertureValue"],
    37379 : ["Brightness", "BrightnessValue"],
    37380 : ["Exposure Bias Value", "ExposureBiasValue"],
    37381 : ["Max Aperture Value", "MaxApertureValue"],
    37382 : ["Subject Distance", "SubjectDistance"],
    37383 : ["Metering Mode", "MeteringMode"],
    37384 : ["Light Source", "LightSource"],
    37385 : ["Flash", "Flash"],
    37386 : ["Focal Length", "FocalLength"],
    37396 : ["Subject Area", "SubjectArea"],
    41483 : ["Flash Energy", "FlashEnergy"],
    41484 : ["Spatial Frequency Response", "SpatialFrequencyResponse"],
    41486 : ["Focal Plane X Resolution", "FocalPlaneXResolution"],
    41487 : ["Focal Plane Y Resolution", "FocalPlaneYResolution"],
    41488 : ["Focal Plane Resolution Unit", "FocalPlaneResolutionUnit"],
    41492 : ["Subject Location", "SubjectLocation"],
    41493 : ["Exposure Index", "ExposureIndex"],
    41495 : ["Sensing Method", "SensingMethod"],
    41728 : ["File Source", "FileSource"],
    41729 : ["Scene Type", "SceneType"],
    41730 : ["CFA Pattern", "CFAPattern"],
    41985 : ["Custom Rendered", "CustomRendered"],
    41986 : ["Exposure Mode", "Exposure Mode"],
    41987 : ["White Balance", "WhiteBalance"],
    41988 : ["Digital Zoom Ratio", "DigitalZoomRatio"],
    41989 : ["Focal length in 35 mm film", "FocalLengthIn35mmFilm"],
    41990 : ["Scene Capture Type", "SceneCaptureType"],
    41991 : ["Gain Control", "GainControl"],
    41992 : ["Contrast", "Contrast"],
    41993 : ["Saturation", "Saturation"],
    41994 : ["Sharpness", "Sharpness"],
    41995 : ["Device settings description", "DeviceSettingDescription"],
    41996 : ["Subject distance range", "SubjectDistanceRange"],

    /* H. Other Tags */
    42016 : ["Unique image ID", "ImageUniqueID"],

    40965 : ["Interoperability tag", "InteroperabilityIFDPointer"]
};

this.JpegMeta.JpegFile.prototype._gpstags = {
    /* A. Tags Relating to GPS */
    0 : ["GPS tag version", "GPSVersionID"],
    1 : ["North or South Latitude", "GPSLatitudeRef"],
    2 : ["Latitude", "GPSLatitude"],
    3 : ["East or West Longitude", "GPSLongitudeRef"],
    4 : ["Longitude", "GPSLongitude"],
    5 : ["Altitude reference", "GPSAltitudeRef"],
    6 : ["Altitude", "GPSAltitude"],
    7 : ["GPS time (atomic clock)", "GPSTimeStamp"],
    8 : ["GPS satellites usedd for measurement", "GPSSatellites"],
    9 : ["GPS receiver status", "GPSStatus"],
    10 : ["GPS mesaurement mode", "GPSMeasureMode"],
    11 : ["Measurement precision", "GPSDOP"],
    12 : ["Speed unit", "GPSSpeedRef"],
    13 : ["Speed of GPS receiver", "GPSSpeed"],
    14 : ["Reference for direction of movement", "GPSTrackRef"],
    15 : ["Direction of movement", "GPSTrack"],
    16 : ["Reference for direction of image", "GPSImgDirectionRef"],
    17 : ["Direction of image", "GPSImgDirection"],
    18 : ["Geodetic survey data used", "GPSMapDatum"],
    19 : ["Reference for latitude of destination", "GPSDestLatitudeRef"],
    20 : ["Latitude of destination", "GPSDestLatitude"],
    21 : ["Reference for longitude of destination", "GPSDestLongitudeRef"],
    22 : ["Longitude of destination", "GPSDestLongitude"],
    23 : ["Reference for bearing of destination", "GPSDestBearingRef"],
    24 : ["Bearing of destination", "GPSDestBearing"],
    25 : ["Reference for distance to destination", "GPSDestDistanceRef"],
    26 : ["Distance to destination", "GPSDestDistance"],
    27 : ["Name of GPS processing method", "GPSProcessingMethod"],
    28 : ["Name of GPS area", "GPSAreaInformation"],
    29 : ["GPS Date", "GPSDateStamp"],
    30 : ["GPS differential correction", "GPSDifferential"]
};

this.JpegMeta.JpegFile.prototype._iptctags = {
    0 : ['Record Version', 'recordVersion'],
    3 : ['Object Type Reference', 'objectType'],
    4 : ['Object Attribute Reference', 'objectAttribute'],
    5 : ['Object Name', 'objectName'],
    7 : ['Edit Status', 'editStatus'],
    8 : ['Editorial Update', 'editorialUpdate'],
    10 : ['Urgency', 'urgency'],
    12 : ['Subject Reference', 'subjectRef'],
    15 : ['Category', 'category'],
    20 : ['Supplemental Category', 'supplCategory'],
    22 : ['Fixture Identifier', 'fixtureID'],
    25 : ['Keywords', 'keywords'],
    26 : ['Content Location Code', 'contentLocCode'],
    27 : ['Content Location Name', 'contentLocName'],
    30 : ['Release Date', 'releaseDate'],
    35 : ['Release Time', 'releaseTime'],
    37 : ['Expiration Date', 'expirationDate'],
    38 : ['Expiration Time', 'expirationTime'],
    40 : ['Special Instructions', 'specialInstructions'],
    42 : ['Action Advised', 'actionAdvised'],
    45 : ['Reference Service', 'refService'],
    47 : ['Reference Date', 'refDate'],
    50 : ['Reference Number', 'refNumber'],
    55 : ['Date Created', 'dateCreated'],
    60 : ['Time Created', 'timeCreated'],
    62 : ['Digital Creation Date', 'digitalCreationDate'],
    63 : ['Digital Creation Time', 'digitalCreationTime'],
    65 : ['Originating Program', 'originatingProgram'],
    70 : ['Program Version', 'programVersion'],
    75 : ['Object Cycle', 'objectCycle'],
    80 : ['By-line', 'byline'],
    85 : ['By-line Title', 'bylineTitle'],
    90 : ['City', 'city'],
    92 : ['Sub-location', 'sublocation'],
    95 : ['Province/State', 'state'],
    100 : ['Country Code', 'countryCode'],
    101 : ['Country Name', 'countryName'],
    103 : ['Original Transmission Reference', 'origTransRef'],
    105 : ['Headline', 'headline'],
    110 : ['Credit', 'credit'],
    115 : ['Source', 'source'],
    116 : ['Copyright Notice', 'copyrightNotice'],
    118 : ['Contact', 'contact'],
    120 : ['Caption/Abstract', 'caption'],
    122 : ['Writer/Editor', 'writerEditor'],
    125 : ['Rasterized Caption', 'rasterizedCaption'],
    130 : ['Image Type', 'imageType'],
    131 : ['Image Orientation', 'imageOrientation'],
    135 : ['Language Identifier', 'languageID'],
    150 : ['Audio Type', 'audioType'],
    151 : ['Audio Sampling Rate', 'audioSamplingRate'],
    152 : ['Audio Sampling Resolution', 'audioSamplingRes'],
    153 : ['Audio Duration', 'audioDuration'],
    154 : ['Audio Outcue', 'audioOutcue'],
    200 : ['Preview File Format', 'previewFileFormat'],
    201 : ['Preview File Format Version', 'previewFileFormatVer'],
    202 : ['Preview Data', 'previewData']
};

this.JpegMeta.JpegFile.prototype._markers = {
    /* Start Of Frame markers, non-differential, Huffman coding */
    0xc0: ["SOF0", "_sofHandler", "Baseline DCT"],
    0xc1: ["SOF1", "_sofHandler", "Extended sequential DCT"],
    0xc2: ["SOF2", "_sofHandler", "Progressive DCT"],
    0xc3: ["SOF3", "_sofHandler", "Lossless (sequential)"],

    /* Start Of Frame markers, differential, Huffman coding */
    0xc5: ["SOF5", "_sofHandler", "Differential sequential DCT"],
    0xc6: ["SOF6", "_sofHandler", "Differential progressive DCT"],
    0xc7: ["SOF7", "_sofHandler", "Differential lossless (sequential)"],

    /* Start Of Frame markers, non-differential, arithmetic coding */
    0xc8: ["JPG", null, "Reserved for JPEG extensions"],
    0xc9: ["SOF9", "_sofHandler", "Extended sequential DCT"],
    0xca: ["SOF10", "_sofHandler", "Progressive DCT"],
    0xcb: ["SOF11", "_sofHandler", "Lossless (sequential)"],

    /* Start Of Frame markers, differential, arithmetic coding */
    0xcd: ["SOF13", "_sofHandler", "Differential sequential DCT"],
    0xce: ["SOF14", "_sofHandler", "Differential progressive DCT"],
    0xcf: ["SOF15", "_sofHandler", "Differential lossless (sequential)"],

    /* Huffman table specification */
    0xc4: ["DHT", null, "Define Huffman table(s)"],
    0xcc: ["DAC", null, "Define arithmetic coding conditioning(s)"],

    /* Restart interval termination" */
    0xd0: ["RST0", null, "Restart with modulo 8 count �0�"],
    0xd1: ["RST1", null, "Restart with modulo 8 count �1�"],
    0xd2: ["RST2", null, "Restart with modulo 8 count �2�"],
    0xd3: ["RST3", null, "Restart with modulo 8 count �3�"],
    0xd4: ["RST4", null, "Restart with modulo 8 count �4�"],
    0xd5: ["RST5", null, "Restart with modulo 8 count �5�"],
    0xd6: ["RST6", null, "Restart with modulo 8 count �6�"],
    0xd7: ["RST7", null, "Restart with modulo 8 count �7�"],

    /* Other markers */
    0xd8: ["SOI", null, "Start of image"],
    0xd9: ["EOI", null, "End of image"],
    0xda: ["SOS", null, "Start of scan"],
    0xdb: ["DQT", null, "Define quantization table(s)"],
    0xdc: ["DNL", null, "Define number of lines"],
    0xdd: ["DRI", null, "Define restart interval"],
    0xde: ["DHP", null, "Define hierarchical progression"],
    0xdf: ["EXP", null, "Expand reference component(s)"],
    0xe0: ["APP0", "_app0Handler", "Reserved for application segments"],
    0xe1: ["APP1", "_app1Handler"],
    0xe2: ["APP2", null],
    0xe3: ["APP3", null],
    0xe4: ["APP4", null],
    0xe5: ["APP5", null],
    0xe6: ["APP6", null],
    0xe7: ["APP7", null],
    0xe8: ["APP8", null],
    0xe9: ["APP9", null],
    0xea: ["APP10", null],
    0xeb: ["APP11", null],
    0xec: ["APP12", null],
    0xed: ["IPTC", "_iptcHandler", "IPTC Photo Metadata"],
    0xee: ["APP14", null],
    0xef: ["APP15", null],
    0xf0: ["JPG0", null], /* Reserved for JPEG extensions */
    0xf1: ["JPG1", null],
    0xf2: ["JPG2", null],
    0xf3: ["JPG3", null],
    0xf4: ["JPG4", null],
    0xf5: ["JPG5", null],
    0xf6: ["JPG6", null],
    0xf7: ["JPG7", null],
    0xf8: ["JPG8", null],
    0xf9: ["JPG9", null],
    0xfa: ["JPG10", null],
    0xfb: ["JPG11", null],
    0xfc: ["JPG12", null],
    0xfd: ["JPG13", null],
    0xfe: ["COM", "_commentHandler", "Comment"], /* Comment */

    /* Reserved markers */
    0x01: ["JPG13", null] /* For temporary private use in arithmetic coding */
    /* 02 -> bf are reserverd */
};

/* Private methods */
this.JpegMeta.JpegFile.prototype._addMetaGroup = function _addMetaGroup(name, description) {
    var group = new JpegMeta.MetaGroup(name, description);
    this[group.fieldName] = group;
    this.metaGroups[group.fieldName] = group;
    return group;
};

this.JpegMeta.JpegFile.prototype._parseIfd = function _parseIfd(endian, _binary_data, base, ifd_offset, tags, name, description) {
    var num_fields = JpegMeta.parseNum(endian, _binary_data, base + ifd_offset, 2);
    /* Per tag variables */
    var tag_base;
    var tag_field;
    var type, type_field, type_size;
    var num_values;
    var value_offset;
    var value;
    var _val;
    var num;
    var den;

    var group;

    group = this._addMetaGroup(name, description);

    for (var i = 0; i < num_fields; i++) {
	/* parse the field */
	tag_base = base + ifd_offset + 2 + (i * 12);
	tag_field = JpegMeta.parseNum(endian, _binary_data, tag_base, 2);
	type_field = JpegMeta.parseNum(endian, _binary_data, tag_base + 2, 2);
	num_values = JpegMeta.parseNum(endian, _binary_data, tag_base + 4, 4);
	value_offset = JpegMeta.parseNum(endian, _binary_data, tag_base + 8, 4);
	if (this._types[type_field] === undefined) {
	    continue;
	}
	type = this._types[type_field][0];
	type_size = this._types[type_field][1];

	if (type_size * num_values <= 4) {
	    /* Data is in-line */
	    value_offset = tag_base + 8;
	} else {
	    value_offset = base + value_offset;
	}

	/* Read the value */
	if (type == "UNDEFINED") {
	    /* FIXME: This should be done better */
	    /*value = _binary_data.slice(value_offset, value_offset + num_values); */
	    value = undefined;
	} else if (type == "ASCII") {
	    value = _binary_data.slice(value_offset, value_offset + num_values);
	    value = value.split('\x00')[0];
	    if (!JpegMeta.stringIsClean(value)) {
		value = "";
	    }
	    /* strip trail nul */
	} else {
	    value = new Array();
	    for (var j = 0; j < num_values; j++, value_offset += type_size) {
		if (type == "BYTE" || type == "SHORT" || type == "LONG") {
		    value.push(JpegMeta.parseNum(endian, _binary_data, value_offset, type_size));
		}
		if (type == "SBYTE" || type == "SSHORT" || type == "SLONG") {
		    value.push(JpegMeta.parseSnum(endian, _binary_data, value_offset, type_size));
		}
		if (type == "RATIONAL") {
		    num = JpegMeta.parseNum(endian, _binary_data, value_offset, 4);
		    den = JpegMeta.parseNum(endian, _binary_data, value_offset + 4, 4);
		    value.push(new JpegMeta.Rational(num, den));
		}
		if (type == "SRATIONAL") {
		    num = JpegMeta.parseSnum(endian, _binary_data, value_offset, 4);
		    den = JpegMeta.parseSnum(endian, _binary_data, value_offset + 4, 4);
		    value.push(new JpegMeta.Rational(num, den));
		}
		value.push();
	    }
	    if (num_values === 1) {
		value = value[0];
	    }
	}
        if (tags.hasOwnProperty(tag_field)) {
	    group._addProperty(tags[tag_field][1], tags[tag_field][0], value);
        } else {
            console.log("WARNING(jpegmeta.js): Unknown tag: ", tag_field);
        }
    }
};

this.JpegMeta.JpegFile.prototype._jfifHandler = function _jfifHandler(mark, pos) {
    if (this.jfif !== undefined) {
	throw Error("Multiple JFIF segments found");
    }
    this._addMetaGroup("jfif", "JFIF");
    this.jfif._addProperty("version_major", "Version Major", this._binary_data.charCodeAt(pos + 5));
    this.jfif._addProperty("version_minor", "Version Minor", this._binary_data.charCodeAt(pos + 6));
    this.jfif._addProperty("version", "JFIF Version", this.jfif.version_major.value + "." + this.jfif.version_minor.value);
    this.jfif._addProperty("units", "Density Unit", this._binary_data.charCodeAt(pos + 7));
    this.jfif._addProperty("Xdensity", "X density", JpegMeta.parseNum(">", this._binary_data, pos + 8, 2));
    this.jfif._addProperty("Ydensity", "Y Density", JpegMeta.parseNum(">", this._binary_data, pos + 10, 2));
    this.jfif._addProperty("Xthumbnail", "X Thumbnail", JpegMeta.parseNum(">", this._binary_data, pos + 12, 1));
    this.jfif._addProperty("Ythumbnail", "Y Thumbnail", JpegMeta.parseNum(">", this._binary_data, pos + 13, 1));
};


/* Handle app0 segments */
this.JpegMeta.JpegFile.prototype._app0Handler = function app0Handler(mark, pos) {
    var ident = this._binary_data.slice(pos, pos + 5);
    if (ident == this._JFIF_IDENT) {
	this._jfifHandler(mark, pos);
    } else if (ident == this._JFXX_IDENT) {
	/* Don't handle JFXX Ident yet */
    } else {
	/* Don't know about other idents */
    }
};


/* Handle app1 segments */
this.JpegMeta.JpegFile.prototype._app1Handler = function _app1Handler(mark, pos) {
    var ident = this._binary_data.slice(pos, pos + 5);
    if (ident == this._EXIF_IDENT) {
	this._exifHandler(mark, pos + 6);
    } else {
	/* Don't know about other idents */
    }
};

/* Handle exif segments */
JpegMeta.JpegFile.prototype._exifHandler = function _exifHandler(mark, pos) {
    if (this.exif !== undefined) {
	throw new Error("Multiple JFIF segments found");
    }

    /* Parse this TIFF header */
    var endian;
    var magic_field;
    var ifd_offset;
    var primary_ifd, exif_ifd, gps_ifd;
    var endian_field = this._binary_data.slice(pos, pos + 2);

    /* Trivia: This 'I' is for Intel, the 'M' is for Motorola */
    if (endian_field === "II") {
	endian = "<";
    } else if (endian_field === "MM") {
	endian = ">";
    } else {
	throw new Error("Malformed TIFF meta-data. Unknown endianess: " + endian_field);
    }

    magic_field = JpegMeta.parseNum(endian, this._binary_data, pos + 2, 2);

    if (magic_field !== 42) {
	throw new Error("Malformed TIFF meta-data. Bad magic: " + magic_field);
    }

    ifd_offset = JpegMeta.parseNum(endian, this._binary_data, pos + 4, 4);

    /* Parse 0th IFD */
    this._parseIfd(endian, this._binary_data, pos, ifd_offset, this._tifftags, "tiff", "TIFF");

    if (this.tiff.ExifIfdPointer) {
	this._parseIfd(endian, this._binary_data, pos, this.tiff.ExifIfdPointer.value, this._exiftags, "exif", "Exif");
    }

    if (this.tiff.GPSInfoIfdPointer) {
	this._parseIfd(endian, this._binary_data, pos, this.tiff.GPSInfoIfdPointer.value, this._gpstags, "gps", "GPS");
	if (this.gps.GPSLatitude) {
	    var latitude;
	    latitude = this.gps.GPSLatitude.value[0].asFloat() +
		(1 / 60) * this.gps.GPSLatitude.value[1].asFloat() +
		(1 / 3600) * this.gps.GPSLatitude.value[2].asFloat();
	    if (this.gps.GPSLatitudeRef.value === "S") {
		latitude = -latitude;
	    }
	    this.gps._addProperty("latitude", "Dec. Latitude", latitude);
	}
	if (this.gps.GPSLongitude) {
	    var longitude;
	    longitude = this.gps.GPSLongitude.value[0].asFloat() +
		(1 / 60) * this.gps.GPSLongitude.value[1].asFloat() +
		(1 / 3600) * this.gps.GPSLongitude.value[2].asFloat();
	    if (this.gps.GPSLongitudeRef.value === "W") {
		longitude = -longitude;
	    }
	    this.gps._addProperty("longitude", "Dec. Longitude", longitude);
	}
    }
};

this.JpegMeta.JpegFile.prototype._iptcHandler = function _iptcHandler(mark, pos, segsize) {
    this._addMetaGroup("iptc", "IPTC");

    var endian = '<';
    var offset, fieldStart, title, value, tag;
    var length = JpegMeta.parseNum(endian, this._binary_data, pos + 4, 1);
    var FILE_SEPARATOR_CHAR = 28,
        START_OF_TEXT_CHAR = 2;

    for (var i = 0; i < segsize; i++) {
        fieldStart = pos + i;
        if (JpegMeta.parseNum(endian, this._binary_data, fieldStart, 1) == START_OF_TEXT_CHAR) {
            tag = JpegMeta.parseNum(endian, this._binary_data, fieldStart + 1, 1);
            tag_desc = this._iptctags[tag];

            if (!tag_desc) continue;
            length = 0;
            offset = 2;

            while (
                offset < segsize &&
                JpegMeta.parseNum(endian, this._binary_data, fieldStart + offset, 1) != FILE_SEPARATOR_CHAR &&
                JpegMeta.parseNum(endian, this._binary_data, fieldStart + offset + 1, 1) != START_OF_TEXT_CHAR) {
                offset++;
                length++;
            }

            if (!length) continue;

            value = this._binary_data.slice(pos + i + 2, pos + i + 2 + length);
            value = value.replace('\000', '').trim();

            this.iptc._addProperty(tag_desc[1], tag_desc[0], value);
            i += length - 1;
        }
    }
};

"function"!=typeof Object.create&&(Object.create=function(o){function e(){}return e.prototype=o,new e}),function($,o,e,i){var t={init:function(o,e){var i=this;i.elem=e,i.$elem=$(e),i.imageSrc=i.$elem.data("zoom-image")?i.$elem.data("zoom-image"):i.$elem.attr("src"),i.options=$.extend({},$.fn.elevateZoom.options,o),i.options.tint&&(i.options.lensColour="none",i.options.lensOpacity="1"),"inner"==i.options.zoomType&&(i.options.showLens=!1),i.$elem.parent().removeAttr("title").removeAttr("alt"),i.zoomImage=i.imageSrc,i.refresh(1),$("#"+i.options.gallery+" a").click(function(o){return i.options.galleryActiveClass&&($("#"+i.options.gallery+" a").removeClass(i.options.galleryActiveClass),$(this).addClass(i.options.galleryActiveClass)),o.preventDefault(),$(this).data("zoom-image")?i.zoomImagePre=$(this).data("zoom-image"):i.zoomImagePre=$(this).data("image"),i.swaptheimage($(this).data("image"),i.zoomImagePre),!1})},refresh:function(o){var e=this;setTimeout(function(){e.fetch(e.imageSrc)},o||e.options.refresh)},fetch:function(o){var e=this,i=new Image;i.onload=function(){e.largeWidth=i.width,e.largeHeight=i.height,e.startZoom(),e.currentImage=e.imageSrc,e.options.onZoomedImageLoaded(e.$elem)},i.src=o},startZoom:function(){var o=this;if(o.nzWidth=o.$elem.width(),o.nzHeight=o.$elem.height(),o.isWindowActive=!1,o.isLensActive=!1,o.isTintActive=!1,o.overWindow=!1,o.options.imageCrossfade&&(o.zoomWrap=o.$elem.wrap('<div style="height:'+o.nzHeight+"px;width:"+o.nzWidth+'px;" class="zoomWrapper" />'),o.$elem.css("position","absolute")),o.zoomLock=1,o.scrollingLock=!1,o.changeBgSize=!1,o.currentZoomLevel=o.options.zoomLevel,o.nzOffset=o.$elem.offset(),o.widthRatio=o.largeWidth/o.currentZoomLevel/o.nzWidth,o.heightRatio=o.largeHeight/o.currentZoomLevel/o.nzHeight,"window"==o.options.zoomType&&(o.zoomWindowStyle="overflow: hidden;background-position: 0px 0px;text-align:center;background-color: "+String(o.options.zoomWindowBgColour)+";width: "+String(o.options.zoomWindowWidth)+"px;height: "+String(o.options.zoomWindowHeight)+"px;float: left;background-size: "+o.largeWidth/o.currentZoomLevel+"px "+o.largeHeight/o.currentZoomLevel+"px;display: none;z-index:100;border: "+String(o.options.borderSize)+"px solid "+o.options.borderColour+";background-repeat: no-repeat;position: absolute;"),"inner"==o.options.zoomType){var e=o.$elem.css("border-left-width");o.zoomWindowStyle="overflow: hidden;margin-left: "+String(e)+";margin-top: "+String(e)+";background-position: 0px 0px;width: "+String(o.nzWidth)+"px;height: "+String(o.nzHeight)+"px;px;float: left;display: none;cursor:"+o.options.cursor+";px solid "+o.options.borderColour+";background-repeat: no-repeat;position: absolute;"}"window"==o.options.zoomType&&(o.nzHeight<o.options.zoomWindowWidth/o.widthRatio?lensHeight=o.nzHeight:lensHeight=String(o.options.zoomWindowHeight/o.heightRatio),o.largeWidth<o.options.zoomWindowWidth?lensWidth=o.nzWidth:lensWidth=o.options.zoomWindowWidth/o.widthRatio,o.lensStyle="background-position: 0px 0px;width: "+String(o.options.zoomWindowWidth/o.widthRatio)+"px;height: "+String(o.options.zoomWindowHeight/o.heightRatio)+"px;float: right;display: none;overflow: hidden;z-index: 999;-webkit-transform: translateZ(0);opacity:"+o.options.lensOpacity+";filter: alpha(opacity = "+100*o.options.lensOpacity+"); zoom:1;width:"+lensWidth+"px;height:"+lensHeight+"px;background-color:"+o.options.lensColour+";cursor:"+o.options.cursor+";border: "+o.options.lensBorderSize+"px solid "+o.options.lensBorderColour+";background-repeat: no-repeat;position: absolute;"),o.tintStyle="display: block;position: absolute;background-color: "+o.options.tintColour+";filter:alpha(opacity=0);opacity: 0;width: "+o.nzWidth+"px;height: "+o.nzHeight+"px;",o.lensRound="","lens"==o.options.zoomType&&(o.lensStyle="background-position: 0px 0px;float: left;display: none;border: "+String(o.options.borderSize)+"px solid "+o.options.borderColour+";width:"+String(o.options.lensSize)+"px;height:"+String(o.options.lensSize)+"px;background-repeat: no-repeat;position: absolute;"),"round"==o.options.lensShape&&(o.lensRound="border-top-left-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;border-top-right-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;border-bottom-left-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;border-bottom-right-radius: "+String(o.options.lensSize/2+o.options.borderSize)+"px;"),o.zoomContainer=$('<div class="zoomContainer" style="-webkit-transform: translateZ(0);position:absolute;left:'+o.nzOffset.left+"px;top:"+o.nzOffset.top+"px;height:"+o.nzHeight+"px;width:"+o.nzWidth+'px;"></div>'),$("body").append(o.zoomContainer),o.options.containLensZoom&&"lens"==o.options.zoomType&&o.zoomContainer.css("overflow","hidden"),"inner"!=o.options.zoomType&&(o.zoomLens=$("<div class='zoomLens' style='"+o.lensStyle+o.lensRound+"'>&nbsp;</div>").appendTo(o.zoomContainer).click(function(){o.$elem.trigger("click")}),o.options.tint&&(o.tintContainer=$("<div/>").addClass("tintContainer"),o.zoomTint=$("<div class='zoomTint' style='"+o.tintStyle+"'></div>"),o.zoomLens.wrap(o.tintContainer),o.zoomTintcss=o.zoomLens.after(o.zoomTint),o.zoomTintImage=$('<img style="position: absolute; left: 0px; top: 0px; max-width: none; width: '+o.nzWidth+"px; height: "+o.nzHeight+'px;" src="'+o.imageSrc+'">').appendTo(o.zoomLens).click(function(){o.$elem.trigger("click")}))),isNaN(o.options.zoomWindowPosition)?o.zoomWindow=$("<div style='z-index:999;left:"+o.windowOffsetLeft+"px;top:"+o.windowOffsetTop+"px;"+o.zoomWindowStyle+"' class='zoomWindow'>&nbsp;</div>").appendTo("body").click(function(){o.$elem.trigger("click")}):o.zoomWindow=$("<div style='z-index:999;left:"+o.windowOffsetLeft+"px;top:"+o.windowOffsetTop+"px;"+o.zoomWindowStyle+"' class='zoomWindow'>&nbsp;</div>").appendTo(o.zoomContainer).click(function(){o.$elem.trigger("click")}),o.zoomWindowContainer=$("<div/>").addClass("zoomWindowContainer").css("width",o.options.zoomWindowWidth),o.zoomWindow.wrap(o.zoomWindowContainer),"lens"==o.options.zoomType&&o.zoomLens.css({backgroundImage:"url('"+o.imageSrc+"')"}),"window"==o.options.zoomType&&o.zoomWindow.css({backgroundImage:"url('"+o.imageSrc+"')"}),"inner"==o.options.zoomType&&o.zoomWindow.css({backgroundImage:"url('"+o.imageSrc+"')"}),o.$elem.bind("touchmove",function(e){e.preventDefault();var i=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];o.setPosition(i)}),o.zoomContainer.bind("touchmove",function(e){"inner"==o.options.zoomType&&o.showHideWindow("show"),e.preventDefault();var i=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];o.setPosition(i)}),o.zoomContainer.bind("touchend",function(e){o.showHideWindow("hide"),o.options.showLens&&o.showHideLens("hide"),o.options.tint&&"inner"!=o.options.zoomType&&o.showHideTint("hide")}),o.$elem.bind("touchend",function(e){o.showHideWindow("hide"),o.options.showLens&&o.showHideLens("hide"),o.options.tint&&"inner"!=o.options.zoomType&&o.showHideTint("hide")}),o.options.showLens&&(o.zoomLens.bind("touchmove",function(e){e.preventDefault();var i=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];o.setPosition(i)}),o.zoomLens.bind("touchend",function(e){o.showHideWindow("hide"),o.options.showLens&&o.showHideLens("hide"),o.options.tint&&"inner"!=o.options.zoomType&&o.showHideTint("hide")})),o.$elem.bind("mousemove",function(e){0==o.overWindow&&o.setElements("show"),(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),o.zoomContainer.bind("mousemove",function(e){0==o.overWindow&&o.setElements("show"),(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),"inner"!=o.options.zoomType&&o.zoomLens.bind("mousemove",function(e){(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),o.options.tint&&"inner"!=o.options.zoomType&&o.zoomTint.bind("mousemove",function(e){(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),"inner"==o.options.zoomType&&o.zoomWindow.bind("mousemove",function(e){(o.lastX!==e.clientX||o.lastY!==e.clientY)&&(o.setPosition(e),o.currentLoc=e),o.lastX=e.clientX,o.lastY=e.clientY}),o.zoomContainer.add(o.$elem).mouseenter(function(){0==o.overWindow&&o.setElements("show")}).mouseleave(function(){o.scrollLock||(o.setElements("hide"),o.options.onDestroy(o.$elem))}),"inner"!=o.options.zoomType&&o.zoomWindow.mouseenter(function(){o.overWindow=!0,o.setElements("hide")}).mouseleave(function(){o.overWindow=!1}),1!=o.options.zoomLevel,o.options.minZoomLevel?o.minZoomLevel=o.options.minZoomLevel:o.minZoomLevel=2*o.options.scrollZoomIncrement,o.options.scrollZoom&&o.zoomContainer.add(o.$elem).bind("mousewheel DOMMouseScroll MozMousePixelScroll",function(e){o.scrollLock=!0,clearTimeout($.data(this,"timer")),$.data(this,"timer",setTimeout(function(){o.scrollLock=!1},250));var i=e.originalEvent.wheelDelta||-1*e.originalEvent.detail;return e.stopImmediatePropagation(),e.stopPropagation(),e.preventDefault(),i/120>0?o.currentZoomLevel>=o.minZoomLevel&&o.changeZoomLevel(o.currentZoomLevel-o.options.scrollZoomIncrement):o.options.maxZoomLevel?o.currentZoomLevel<=o.options.maxZoomLevel&&o.changeZoomLevel(parseFloat(o.currentZoomLevel)+o.options.scrollZoomIncrement):o.changeZoomLevel(parseFloat(o.currentZoomLevel)+o.options.scrollZoomIncrement),!1})},setElements:function(o){var e=this;return e.options.zoomEnabled?("show"==o&&e.isWindowSet&&("inner"==e.options.zoomType&&e.showHideWindow("show"),"window"==e.options.zoomType&&e.showHideWindow("show"),e.options.showLens&&e.showHideLens("show"),e.options.tint&&"inner"!=e.options.zoomType&&e.showHideTint("show")),void("hide"==o&&("window"==e.options.zoomType&&e.showHideWindow("hide"),e.options.tint||e.showHideWindow("hide"),e.options.showLens&&e.showHideLens("hide"),e.options.tint&&e.showHideTint("hide")))):!1},setPosition:function(o){var e=this;return e.options.zoomEnabled?(e.nzHeight=e.$elem.height(),e.nzWidth=e.$elem.width(),e.nzOffset=e.$elem.offset(),e.options.tint&&"inner"!=e.options.zoomType&&(e.zoomTint.css({top:0}),e.zoomTint.css({left:0})),e.options.responsive&&!e.options.scrollZoom&&e.options.showLens&&(e.nzHeight<e.options.zoomWindowWidth/e.widthRatio?lensHeight=e.nzHeight:lensHeight=String(e.options.zoomWindowHeight/e.heightRatio),e.largeWidth<e.options.zoomWindowWidth?lensWidth=e.nzWidth:lensWidth=e.options.zoomWindowWidth/e.widthRatio,e.widthRatio=e.largeWidth/e.nzWidth,e.heightRatio=e.largeHeight/e.nzHeight,"lens"!=e.options.zoomType&&(e.nzHeight<e.options.zoomWindowWidth/e.widthRatio?lensHeight=e.nzHeight:lensHeight=String(e.options.zoomWindowHeight/e.heightRatio),e.nzWidth<e.options.zoomWindowHeight/e.heightRatio?lensWidth=e.nzWidth:lensWidth=String(e.options.zoomWindowWidth/e.widthRatio),e.zoomLens.css("width",lensWidth),e.zoomLens.css("height",lensHeight),e.options.tint&&(e.zoomTintImage.css("width",e.nzWidth),e.zoomTintImage.css("height",e.nzHeight))),"lens"==e.options.zoomType&&e.zoomLens.css({width:String(e.options.lensSize)+"px",height:String(e.options.lensSize)+"px"})),e.zoomContainer.css({top:e.nzOffset.top}),e.zoomContainer.css({left:e.nzOffset.left}),e.mouseLeft=parseInt(o.pageX-e.nzOffset.left),e.mouseTop=parseInt(o.pageY-e.nzOffset.top),"window"==e.options.zoomType&&(e.Etoppos=e.mouseTop<e.zoomLens.height()/2,e.Eboppos=e.mouseTop>e.nzHeight-e.zoomLens.height()/2-2*e.options.lensBorderSize,e.Eloppos=e.mouseLeft<0+e.zoomLens.width()/2,e.Eroppos=e.mouseLeft>e.nzWidth-e.zoomLens.width()/2-2*e.options.lensBorderSize),"inner"==e.options.zoomType&&(e.Etoppos=e.mouseTop<e.nzHeight/2/e.heightRatio,e.Eboppos=e.mouseTop>e.nzHeight-e.nzHeight/2/e.heightRatio,e.Eloppos=e.mouseLeft<0+e.nzWidth/2/e.widthRatio,e.Eroppos=e.mouseLeft>e.nzWidth-e.nzWidth/2/e.widthRatio-2*e.options.lensBorderSize),e.mouseLeft<0||e.mouseTop<0||e.mouseLeft>e.nzWidth||e.mouseTop>e.nzHeight?void e.setElements("hide"):(e.options.showLens&&(e.lensLeftPos=String(Math.floor(e.mouseLeft-e.zoomLens.width()/2)),e.lensTopPos=String(Math.floor(e.mouseTop-e.zoomLens.height()/2))),e.Etoppos&&(e.lensTopPos=0),e.Eloppos&&(e.windowLeftPos=0,e.lensLeftPos=0,e.tintpos=0),"window"==e.options.zoomType&&(e.Eboppos&&(e.lensTopPos=Math.max(e.nzHeight-e.zoomLens.height()-2*e.options.lensBorderSize,0)),e.Eroppos&&(e.lensLeftPos=e.nzWidth-e.zoomLens.width()-2*e.options.lensBorderSize)),"inner"==e.options.zoomType&&(e.Eboppos&&(e.lensTopPos=Math.max(e.nzHeight-2*e.options.lensBorderSize,0)),e.Eroppos&&(e.lensLeftPos=e.nzWidth-e.nzWidth-2*e.options.lensBorderSize)),"lens"==e.options.zoomType&&(e.windowLeftPos=String(-1*((o.pageX-e.nzOffset.left)*e.widthRatio-e.zoomLens.width()/2)),e.windowTopPos=String(-1*((o.pageY-e.nzOffset.top)*e.heightRatio-e.zoomLens.height()/2)),e.zoomLens.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"}),e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"})),e.changeBgSize=!1),e.setWindowPostition(o)),e.options.tint&&"inner"!=e.options.zoomType&&e.setTintPosition(o),"window"==e.options.zoomType&&e.setWindowPostition(o),"inner"==e.options.zoomType&&e.setWindowPostition(o),e.options.showLens&&(e.fullwidth&&"lens"!=e.options.zoomType&&(e.lensLeftPos=0),e.zoomLens.css({left:e.lensLeftPos+"px",top:e.lensTopPos+"px"})),void 0)):!1},showHideWindow:function(o){var e=this;"show"==o&&(e.isWindowActive||(e.options.zoomWindowFadeIn?e.zoomWindow.stop(!0,!0,!1).fadeIn(e.options.zoomWindowFadeIn):e.zoomWindow.show(),e.isWindowActive=!0)),"hide"==o&&e.isWindowActive&&(e.options.zoomWindowFadeOut?e.zoomWindow.stop(!0,!0).fadeOut(e.options.zoomWindowFadeOut,function(){e.loop&&(clearInterval(e.loop),e.loop=!1)}):e.zoomWindow.hide(),e.isWindowActive=!1)},showHideLens:function(o){var e=this;"show"==o&&(e.isLensActive||(e.options.lensFadeIn?e.zoomLens.stop(!0,!0,!1).fadeIn(e.options.lensFadeIn):e.zoomLens.show(),e.isLensActive=!0)),"hide"==o&&e.isLensActive&&(e.options.lensFadeOut?e.zoomLens.stop(!0,!0).fadeOut(e.options.lensFadeOut):e.zoomLens.hide(),e.isLensActive=!1)},showHideTint:function(o){var e=this;"show"==o&&(e.isTintActive||(e.options.zoomTintFadeIn?e.zoomTint.css({opacity:e.options.tintOpacity}).animate().stop(!0,!0).fadeIn("slow"):(e.zoomTint.css({opacity:e.options.tintOpacity}).animate(),e.zoomTint.show()),e.isTintActive=!0)),"hide"==o&&e.isTintActive&&(e.options.zoomTintFadeOut?e.zoomTint.stop(!0,!0).fadeOut(e.options.zoomTintFadeOut):e.zoomTint.hide(),e.isTintActive=!1)},setLensPostition:function(o){},setWindowPostition:function(o){var e=this;if(isNaN(e.options.zoomWindowPosition))e.externalContainer=$("#"+e.options.zoomWindowPosition),e.externalContainerWidth=e.externalContainer.width(),e.externalContainerHeight=e.externalContainer.height(),e.externalContainerOffset=e.externalContainer.offset(),e.windowOffsetTop=e.externalContainerOffset.top,e.windowOffsetLeft=e.externalContainerOffset.left;else switch(e.options.zoomWindowPosition){case 1:e.windowOffsetTop=e.options.zoomWindowOffety,e.windowOffsetLeft=+e.nzWidth;break;case 2:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=-1*(e.options.zoomWindowHeight/2-e.nzHeight/2),e.windowOffsetLeft=e.nzWidth);break;case 3:e.windowOffsetTop=e.nzHeight-e.zoomWindow.height()-2*e.options.borderSize,e.windowOffsetLeft=e.nzWidth;break;case 4:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=e.nzWidth;break;case 5:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=e.nzWidth-e.zoomWindow.width()-2*e.options.borderSize;break;case 6:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=-1*(e.options.zoomWindowWidth/2-e.nzWidth/2+2*e.options.borderSize));break;case 7:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=0;break;case 8:e.windowOffsetTop=e.nzHeight,e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 9:e.windowOffsetTop=e.nzHeight-e.zoomWindow.height()-2*e.options.borderSize,e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 10:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=-1*(e.options.zoomWindowHeight/2-e.nzHeight/2),e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize));break;case 11:e.windowOffsetTop=e.options.zoomWindowOffety,e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 12:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=-1*(e.zoomWindow.width()+2*e.options.borderSize);break;case 13:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=0;break;case 14:e.options.zoomWindowHeight>e.nzHeight&&(e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=-1*(e.options.zoomWindowWidth/2-e.nzWidth/2+2*e.options.borderSize));break;case 15:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=e.nzWidth-e.zoomWindow.width()-2*e.options.borderSize;break;case 16:e.windowOffsetTop=-1*(e.zoomWindow.height()+2*e.options.borderSize),e.windowOffsetLeft=e.nzWidth;break;default:e.windowOffsetTop=e.options.zoomWindowOffety,e.windowOffsetLeft=e.nzWidth}e.isWindowSet=!0,e.windowOffsetTop=e.windowOffsetTop+e.options.zoomWindowOffety,e.windowOffsetLeft=e.windowOffsetLeft+e.options.zoomWindowOffetx,e.zoomWindow.css({top:e.windowOffsetTop}),e.zoomWindow.css({left:e.windowOffsetLeft}),"inner"==e.options.zoomType&&(e.zoomWindow.css({top:0}),e.zoomWindow.css({left:0})),e.windowLeftPos=String(-1*((o.pageX-e.nzOffset.left)*e.widthRatio-e.zoomWindow.width()/2)),e.windowTopPos=String(-1*((o.pageY-e.nzOffset.top)*e.heightRatio-e.zoomWindow.height()/2)),e.Etoppos&&(e.windowTopPos=0),e.Eloppos&&(e.windowLeftPos=0),e.Eboppos&&(e.windowTopPos=-1*(e.largeHeight/e.currentZoomLevel-e.zoomWindow.height())),e.Eroppos&&(e.windowLeftPos=-1*(e.largeWidth/e.currentZoomLevel-e.zoomWindow.width())),e.fullheight&&(e.windowTopPos=0),e.fullwidth&&(e.windowLeftPos=0),("window"==e.options.zoomType||"inner"==e.options.zoomType)&&(1==e.zoomLock&&(e.widthRatio<=1&&(e.windowLeftPos=0),e.heightRatio<=1&&(e.windowTopPos=0)),"window"==e.options.zoomType&&(e.largeHeight<e.options.zoomWindowHeight&&(e.windowTopPos=0),e.largeWidth<e.options.zoomWindowWidth&&(e.windowLeftPos=0)),e.options.easing?(e.xp||(e.xp=0),e.yp||(e.yp=0),e.loop||(e.loop=setInterval(function(){e.xp+=(e.windowLeftPos-e.xp)/e.options.easingAmount,e.yp+=(e.windowTopPos-e.yp)/e.options.easingAmount,e.scrollingLock?(clearInterval(e.loop),e.xp=e.windowLeftPos,e.yp=e.windowTopPos,e.xp=-1*((o.pageX-e.nzOffset.left)*e.widthRatio-e.zoomWindow.width()/2),e.yp=-1*((o.pageY-e.nzOffset.top)*e.heightRatio-e.zoomWindow.height()/2),e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"!=e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"})),e.changeBgSize=!1),e.zoomWindow.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"}),e.scrollingLock=!1,e.loop=!1):Math.round(Math.abs(e.xp-e.windowLeftPos)+Math.abs(e.yp-e.windowTopPos))<1?(clearInterval(e.loop),e.zoomWindow.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"}),e.loop=!1):(e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"!=e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"})),e.changeBgSize=!1),e.zoomWindow.css({backgroundPosition:e.xp+"px "+e.yp+"px"}))},16))):(e.changeBgSize&&(e.nzHeight>e.nzWidth?("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"}),e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})):("lens"==e.options.zoomType&&e.zoomLens.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}),e.largeHeight/e.newvaluewidth<e.options.zoomWindowHeight?e.zoomWindow.css({"background-size":e.largeWidth/e.newvaluewidth+"px "+e.largeHeight/e.newvaluewidth+"px"}):e.zoomWindow.css({"background-size":e.largeWidth/e.newvalueheight+"px "+e.largeHeight/e.newvalueheight+"px"})),e.changeBgSize=!1),e.zoomWindow.css({backgroundPosition:e.windowLeftPos+"px "+e.windowTopPos+"px"})))},setTintPosition:function(o){var e=this;e.nzOffset=e.$elem.offset(),e.tintpos=String(-1*(o.pageX-e.nzOffset.left-e.zoomLens.width()/2)),e.tintposy=String(-1*(o.pageY-e.nzOffset.top-e.zoomLens.height()/2)),e.Etoppos&&(e.tintposy=0),e.Eloppos&&(e.tintpos=0),e.Eboppos&&(e.tintposy=-1*(e.nzHeight-e.zoomLens.height()-2*e.options.lensBorderSize)),e.Eroppos&&(e.tintpos=-1*(e.nzWidth-e.zoomLens.width()-2*e.options.lensBorderSize)),e.options.tint&&(e.fullheight&&(e.tintposy=0),e.fullwidth&&(e.tintpos=0),e.zoomTintImage.css({left:e.tintpos+"px"}),e.zoomTintImage.css({top:e.tintposy+"px"}))},swaptheimage:function(o,e){var i=this,t=new Image;i.options.loadingIcon&&(i.spinner=$("<div style=\"background: url('"+i.options.loadingIcon+"') no-repeat center;height:"+i.nzHeight+"px;width:"+i.nzWidth+'px;z-index: 2000;position: absolute; background-position: center center;"></div>'),i.$elem.after(i.spinner)),i.options.onImageSwap(i.$elem),t.onload=function(){i.largeWidth=t.width,i.largeHeight=t.height,i.zoomImage=e,i.zoomWindow.css({"background-size":i.largeWidth+"px "+i.largeHeight+"px"}),i.swapAction(o,e)},t.src=e},swapAction:function(o,e){var i=this,t=new Image;if(t.onload=function(){i.nzHeight=t.height,i.nzWidth=t.width,i.options.onImageSwapComplete(i.$elem),i.doneCallback()},t.src=o,i.currentZoomLevel=i.options.zoomLevel,i.options.maxZoomLevel=!1,"lens"==i.options.zoomType&&i.zoomLens.css({backgroundImage:"url('"+e+"')"}),"window"==i.options.zoomType&&i.zoomWindow.css({backgroundImage:"url('"+e+"')"}),"inner"==i.options.zoomType&&i.zoomWindow.css({backgroundImage:"url('"+e+"')"}),i.currentImage=e,i.options.imageCrossfade){var n=i.$elem,s=n.clone();if(i.$elem.attr("src",o),i.$elem.after(s),s.stop(!0).fadeOut(i.options.imageCrossfade,function(){$(this).remove()}),i.$elem.width("auto").removeAttr("width"),i.$elem.height("auto").removeAttr("height"),n.fadeIn(i.options.imageCrossfade),i.options.tint&&"inner"!=i.options.zoomType){var h=i.zoomTintImage,a=h.clone();i.zoomTintImage.attr("src",e),i.zoomTintImage.after(a),a.stop(!0).fadeOut(i.options.imageCrossfade,function(){$(this).remove()}),h.fadeIn(i.options.imageCrossfade),i.zoomTint.css({height:i.$elem.height()}),i.zoomTint.css({width:i.$elem.width()})}i.zoomContainer.css("height",i.$elem.height()),i.zoomContainer.css("width",i.$elem.width()),"inner"==i.options.zoomType&&(i.options.constrainType||(i.zoomWrap.parent().css("height",i.$elem.height()),i.zoomWrap.parent().css("width",i.$elem.width()),i.zoomWindow.css("height",i.$elem.height()),i.zoomWindow.css("width",i.$elem.width()))),i.options.imageCrossfade&&(i.zoomWrap.css("height",i.$elem.height()),i.zoomWrap.css("width",i.$elem.width()))}else i.$elem.attr("src",o),i.options.tint&&(i.zoomTintImage.attr("src",e),i.zoomTintImage.attr("height",i.$elem.height()),i.zoomTintImage.css({height:i.$elem.height()}),i.zoomTint.css({height:i.$elem.height()})),i.zoomContainer.css("height",i.$elem.height()),i.zoomContainer.css("width",i.$elem.width()),i.options.imageCrossfade&&(i.zoomWrap.css("height",i.$elem.height()),i.zoomWrap.css("width",i.$elem.width()));i.options.constrainType&&("height"==i.options.constrainType&&(i.zoomContainer.css("height",i.options.constrainSize),i.zoomContainer.css("width","auto"),i.options.imageCrossfade?(i.zoomWrap.css("height",i.options.constrainSize),i.zoomWrap.css("width","auto"),i.constwidth=i.zoomWrap.width()):(i.$elem.css("height",i.options.constrainSize),i.$elem.css("width","auto"),i.constwidth=i.$elem.width()),"inner"==i.options.zoomType&&(i.zoomWrap.parent().css("height",i.options.constrainSize),i.zoomWrap.parent().css("width",i.constwidth),i.zoomWindow.css("height",i.options.constrainSize),i.zoomWindow.css("width",i.constwidth)),i.options.tint&&(i.tintContainer.css("height",i.options.constrainSize),i.tintContainer.css("width",i.constwidth),i.zoomTint.css("height",i.options.constrainSize),i.zoomTint.css("width",i.constwidth),i.zoomTintImage.css("height",i.options.constrainSize),i.zoomTintImage.css("width",i.constwidth))),"width"==i.options.constrainType&&(i.zoomContainer.css("height","auto"),i.zoomContainer.css("width",i.options.constrainSize),i.options.imageCrossfade?(i.zoomWrap.css("height","auto"),i.zoomWrap.css("width",i.options.constrainSize),i.constheight=i.zoomWrap.height()):(i.$elem.css("height","auto"),i.$elem.css("width",i.options.constrainSize),i.constheight=i.$elem.height()),"inner"==i.options.zoomType&&(i.zoomWrap.parent().css("height",i.constheight),i.zoomWrap.parent().css("width",i.options.constrainSize),i.zoomWindow.css("height",i.constheight),i.zoomWindow.css("width",i.options.constrainSize)),i.options.tint&&(i.tintContainer.css("height",i.constheight),i.tintContainer.css("width",i.options.constrainSize),i.zoomTint.css("height",i.constheight),i.zoomTint.css("width",i.options.constrainSize),i.zoomTintImage.css("height",i.constheight),i.zoomTintImage.css("width",i.options.constrainSize))))},doneCallback:function(){var o=this;o.options.loadingIcon&&o.spinner.hide(),o.nzOffset=o.$elem.offset(),o.nzWidth=o.$elem.width(),o.nzHeight=o.$elem.height(),o.currentZoomLevel=o.options.zoomLevel,o.widthRatio=o.largeWidth/o.nzWidth,o.heightRatio=o.largeHeight/o.nzHeight,"window"==o.options.zoomType&&(o.nzHeight<o.options.zoomWindowWidth/o.widthRatio?lensHeight=o.nzHeight:lensHeight=String(o.options.zoomWindowHeight/o.heightRatio),o.options.zoomWindowWidth<o.options.zoomWindowWidth?lensWidth=o.nzWidth:lensWidth=o.options.zoomWindowWidth/o.widthRatio,o.zoomLens&&(o.zoomLens.css("width",lensWidth),o.zoomLens.css("height",lensHeight)))},getCurrentImage:function(){var o=this;return o.zoomImage},getGalleryList:function(){var o=this;return o.gallerylist=[],o.options.gallery?$("#"+o.options.gallery+" a").each(function(){var e="";$(this).data("zoom-image")?e=$(this).data("zoom-image"):$(this).data("image")&&(e=$(this).data("image")),e==o.zoomImage?o.gallerylist.unshift({href:""+e,title:$(this).find("img").attr("title")}):o.gallerylist.push({href:""+e,title:$(this).find("img").attr("title")})}):o.gallerylist.push({href:""+o.zoomImage,title:$(this).find("img").attr("title")}),o.gallerylist},changeZoomLevel:function(o){var e=this;e.scrollingLock=!0,e.newvalue=parseFloat(o).toFixed(2),newvalue=parseFloat(o).toFixed(2),maxheightnewvalue=e.largeHeight/(e.options.zoomWindowHeight/e.nzHeight*e.nzHeight),maxwidthtnewvalue=e.largeWidth/(e.options.zoomWindowWidth/e.nzWidth*e.nzWidth),"inner"!=e.options.zoomType&&(maxheightnewvalue<=newvalue?(e.heightRatio=e.largeHeight/maxheightnewvalue/e.nzHeight,e.newvalueheight=maxheightnewvalue,e.fullheight=!0):(e.heightRatio=e.largeHeight/newvalue/e.nzHeight,e.newvalueheight=newvalue,e.fullheight=!1),maxwidthtnewvalue<=newvalue?(e.widthRatio=e.largeWidth/maxwidthtnewvalue/e.nzWidth,e.newvaluewidth=maxwidthtnewvalue,e.fullwidth=!0):(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,e.newvaluewidth=newvalue,e.fullwidth=!1),"lens"==e.options.zoomType&&(maxheightnewvalue<=newvalue?(e.fullwidth=!0,e.newvaluewidth=maxheightnewvalue):(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,e.newvaluewidth=newvalue,e.fullwidth=!1))),"inner"==e.options.zoomType&&(maxheightnewvalue=parseFloat(e.largeHeight/e.nzHeight).toFixed(2),maxwidthtnewvalue=parseFloat(e.largeWidth/e.nzWidth).toFixed(2),newvalue>maxheightnewvalue&&(newvalue=maxheightnewvalue),newvalue>maxwidthtnewvalue&&(newvalue=maxwidthtnewvalue),maxheightnewvalue<=newvalue?(e.heightRatio=e.largeHeight/newvalue/e.nzHeight,newvalue>maxheightnewvalue?e.newvalueheight=maxheightnewvalue:e.newvalueheight=newvalue,e.fullheight=!0):(e.heightRatio=e.largeHeight/newvalue/e.nzHeight,newvalue>maxheightnewvalue?e.newvalueheight=maxheightnewvalue:e.newvalueheight=newvalue,e.fullheight=!1),maxwidthtnewvalue<=newvalue?(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,newvalue>maxwidthtnewvalue?e.newvaluewidth=maxwidthtnewvalue:e.newvaluewidth=newvalue,e.fullwidth=!0):(e.widthRatio=e.largeWidth/newvalue/e.nzWidth,e.newvaluewidth=newvalue,e.fullwidth=!1)),scrcontinue=!1,"inner"==e.options.zoomType&&(e.nzWidth>=e.nzHeight&&(e.newvaluewidth<=maxwidthtnewvalue?scrcontinue=!0:(scrcontinue=!1,e.fullheight=!0,e.fullwidth=!0)),e.nzHeight>e.nzWidth&&(e.newvaluewidth<=maxwidthtnewvalue?scrcontinue=!0:(scrcontinue=!1,e.fullheight=!0,e.fullwidth=!0))),"inner"!=e.options.zoomType&&(scrcontinue=!0),scrcontinue&&(e.zoomLock=0,e.changeZoom=!0,e.options.zoomWindowHeight/e.heightRatio<=e.nzHeight&&(e.currentZoomLevel=e.newvalueheight,"lens"!=e.options.zoomType&&"inner"!=e.options.zoomType&&(e.changeBgSize=!0,e.zoomLens.css({height:String(e.options.zoomWindowHeight/e.heightRatio)+"px"})),("lens"==e.options.zoomType||"inner"==e.options.zoomType)&&(e.changeBgSize=!0)),e.options.zoomWindowWidth/e.widthRatio<=e.nzWidth&&("inner"!=e.options.zoomType&&e.newvaluewidth>e.newvalueheight&&(e.currentZoomLevel=e.newvaluewidth),"lens"!=e.options.zoomType&&"inner"!=e.options.zoomType&&(e.changeBgSize=!0,e.zoomLens.css({width:String(e.options.zoomWindowWidth/e.widthRatio)+"px"})),("lens"==e.options.zoomType||"inner"==e.options.zoomType)&&(e.changeBgSize=!0)),"inner"==e.options.zoomType&&(e.changeBgSize=!0,e.nzWidth>e.nzHeight&&(e.currentZoomLevel=e.newvaluewidth),e.nzHeight>e.nzWidth&&(e.currentZoomLevel=e.newvaluewidth))),e.setPosition(e.currentLoc)},closeAll:function(){self.zoomWindow&&self.zoomWindow.hide(),self.zoomLens&&self.zoomLens.hide(),self.zoomTint&&self.zoomTint.hide()},changeState:function(o){var e=this;"enable"==o&&(e.options.zoomEnabled=!0),"disable"==o&&(e.options.zoomEnabled=!1)}};$.fn.elevateZoom=function(o){return this.each(function(){var e=Object.create(t);e.init(o,this),$.data(this,"elevateZoom",e)})},$.fn.elevateZoom.options={zoomActivation:"hover",zoomEnabled:!0,preloading:1,zoomLevel:1,scrollZoom:!1,scrollZoomIncrement:.1,minZoomLevel:!1,maxZoomLevel:!1,easing:!1,easingAmount:12,lensSize:200,zoomWindowWidth:400,zoomWindowHeight:400,zoomWindowOffetx:0,zoomWindowOffety:0,zoomWindowPosition:1,zoomWindowBgColour:"#fff",lensFadeIn:!1,lensFadeOut:!1,debug:!1,zoomWindowFadeIn:!1,zoomWindowFadeOut:!1,zoomWindowAlwaysShow:!1,zoomTintFadeIn:!1,zoomTintFadeOut:!1,borderSize:4,showLens:!0,borderColour:"#888",lensBorderSize:1,lensBorderColour:"#000",lensShape:"square",zoomType:"window",containLensZoom:!1,lensColour:"white",lensOpacity:.4,lenszoom:!1,tint:!1,tintColour:"#333",tintOpacity:.4,gallery:!1,galleryActiveClass:"zoomGalleryActive",imageCrossfade:!1,constrainType:!1,constrainSize:!1,loadingIcon:!1,cursor:"default",responsive:!0,onComplete:$.noop,onDestroy:function(){},onZoomedImageLoaded:function(){},onImageSwap:$.noop,onImageSwapComplete:$.noop
}}(jQuery,window,document);

!function(e){"undefined"!=typeof module&&module.exports?module.exports=e:e(jQuery,window,document)}(function($){!function(e){var t="function"==typeof define&&define.amd,o="undefined"!=typeof module&&module.exports,a="https:"==document.location.protocol?"https:":"http:",n="cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js";t||(o?require("jquery-mousewheel")($):$.event.special.mousewheel||$("head").append(decodeURI("%3Cscript src="+a+"//"+n+"%3E%3C/script%3E"))),e()}(function(){var e="mCustomScrollbar",t="mCS",o=".mCustomScrollbar",a={setTop:0,setLeft:0,axis:"y",scrollbarPosition:"inside",scrollInertia:950,autoDraggerLength:!0,alwaysShowScrollbar:0,snapOffset:0,mouseWheel:{enable:!0,scrollAmount:"auto",axis:"y",deltaFactor:"auto",disableOver:["select","option","keygen","datalist","textarea"]},scrollButtons:{scrollType:"stepless",scrollAmount:"auto"},keyboard:{enable:!0,scrollType:"stepless",scrollAmount:"auto"},contentTouchScroll:25,documentTouchScroll:!0,advanced:{autoScrollOnFocus:"input,textarea,select,button,datalist,keygen,a[tabindex],area,object,[contenteditable='true']",updateOnContentResize:!0,updateOnImageLoad:"auto",autoUpdateTimeout:60},theme:"light",callbacks:{onTotalScrollOffset:0,onTotalScrollBackOffset:0,alwaysTriggerOffsets:!0}},n=0,i={},r=window.attachEvent&&!window.addEventListener?1:0,l=!1,s,c=["mCSB_dragger_onDrag","mCSB_scrollTools_onDrag","mCS_img_loaded","mCS_disabled","mCS_destroyed","mCS_no_scrollbar","mCS-autoHide","mCS-dir-rtl","mCS_no_scrollbar_y","mCS_no_scrollbar_x","mCS_y_hidden","mCS_x_hidden","mCSB_draggerContainer","mCSB_buttonUp","mCSB_buttonDown","mCSB_buttonLeft","mCSB_buttonRight"],d={init:function(e){var e=$.extend(!0,{},a,e),r=u.call(this);if(e.live){var l=e.liveSelector||this.selector||o,s=$(l);if("off"===e.live)return void h(l);i[l]=setTimeout(function(){s.mCustomScrollbar(e),"once"===e.live&&s.length&&h(l)},500)}else h(l);return e.setWidth=e.set_width?e.set_width:e.setWidth,e.setHeight=e.set_height?e.set_height:e.setHeight,e.axis=e.horizontalScroll?"x":m(e.axis),e.scrollInertia=e.scrollInertia>0&&e.scrollInertia<17?17:e.scrollInertia,"object"!=typeof e.mouseWheel&&1==e.mouseWheel&&(e.mouseWheel={enable:!0,scrollAmount:"auto",axis:"y",preventDefault:!1,deltaFactor:"auto",normalizeDelta:!1,invert:!1}),e.mouseWheel.scrollAmount=e.mouseWheelPixels?e.mouseWheelPixels:e.mouseWheel.scrollAmount,e.mouseWheel.normalizeDelta=e.advanced.normalizeMouseWheelDelta?e.advanced.normalizeMouseWheelDelta:e.mouseWheel.normalizeDelta,e.scrollButtons.scrollType=p(e.scrollButtons.scrollType),f(e),$(r).each(function(){var o=$(this);if(!o.data(t)){o.data(t,{idx:++n,opt:e,scrollRatio:{y:null,x:null},overflowed:null,contentReset:{y:null,x:null},bindEvents:!1,tweenRunning:!1,sequential:{},langDir:o.css("direction"),cbOffsets:null,trigger:null,poll:{size:{o:0,n:0},img:{o:0,n:0},change:{o:0,n:0}}});var a=o.data(t),i=a.opt,r=o.data("mcs-axis"),l=o.data("mcs-scrollbar-position"),s=o.data("mcs-theme");r&&(i.axis=r),l&&(i.scrollbarPosition=l),s&&(i.theme=s,f(i)),g.call(this),a&&i.callbacks.onCreate&&"function"==typeof i.callbacks.onCreate&&i.callbacks.onCreate.call(this),$("#mCSB_"+a.idx+"_container img:not(."+c[2]+")").addClass(c[2]),d.update.call(null,o)}})},update:function(e,o){var a=e||u.call(this);return $(a).each(function(){var e=$(this);if(e.data(t)){var a=e.data(t),n=a.opt,i=$("#mCSB_"+a.idx+"_container"),r=$("#mCSB_"+a.idx),l=[$("#mCSB_"+a.idx+"_dragger_vertical"),$("#mCSB_"+a.idx+"_dragger_horizontal")];if(!i.length)return;a.tweenRunning&&j(e),o&&a&&n.callbacks.onBeforeUpdate&&"function"==typeof n.callbacks.onBeforeUpdate&&n.callbacks.onBeforeUpdate.call(this),e.hasClass(c[3])&&e.removeClass(c[3]),e.hasClass(c[4])&&e.removeClass(c[4]),r.css("max-height","none"),r.height()!==e.height()&&r.css("max-height",e.height()),x.call(this),"y"===n.axis||n.advanced.autoExpandHorizontalScroll||i.css("width",v(i)),a.overflowed=C.call(this),k.call(this),n.autoDraggerLength&&w.call(this),S.call(this),B.call(this);var s=[Math.abs(i[0].offsetTop),Math.abs(i[0].offsetLeft)];"x"!==n.axis&&(a.overflowed[0]?l[0].height()>l[0].parent().height()?y.call(this):(N(e,s[0].toString(),{dir:"y",dur:0,overwrite:"none"}),a.contentReset.y=null):(y.call(this),"y"===n.axis?T.call(this):"yx"===n.axis&&a.overflowed[1]&&N(e,s[1].toString(),{dir:"x",dur:0,overwrite:"none"}))),"y"!==n.axis&&(a.overflowed[1]?l[1].width()>l[1].parent().width()?y.call(this):(N(e,s[1].toString(),{dir:"x",dur:0,overwrite:"none"}),a.contentReset.x=null):(y.call(this),"x"===n.axis?T.call(this):"yx"===n.axis&&a.overflowed[0]&&N(e,s[0].toString(),{dir:"y",dur:0,overwrite:"none"}))),o&&a&&(2===o&&n.callbacks.onImageLoad&&"function"==typeof n.callbacks.onImageLoad?n.callbacks.onImageLoad.call(this):3===o&&n.callbacks.onSelectorChange&&"function"==typeof n.callbacks.onSelectorChange?n.callbacks.onSelectorChange.call(this):n.callbacks.onUpdate&&"function"==typeof n.callbacks.onUpdate&&n.callbacks.onUpdate.call(this)),Y.call(this)}})},scrollTo:function(e,o){if("undefined"!=typeof e&&null!=e){var a=u.call(this);return $(a).each(function(){var a=$(this);if(a.data(t)){var n=a.data(t),i=n.opt,r={trigger:"external",scrollInertia:i.scrollInertia,scrollEasing:"mcsEaseInOut",moveDragger:!1,timeout:60,callbacks:!0,onStart:!0,onUpdate:!0,onComplete:!0},l=$.extend(!0,{},r,o),s=F.call(this,e),c=l.scrollInertia>0&&l.scrollInertia<17?17:l.scrollInertia;s[0]=q.call(this,s[0],"y"),s[1]=q.call(this,s[1],"x"),l.moveDragger&&(s[0]*=n.scrollRatio.y,s[1]*=n.scrollRatio.x),l.dur=oe()?0:c,setTimeout(function(){null!==s[0]&&"undefined"!=typeof s[0]&&"x"!==i.axis&&n.overflowed[0]&&(l.dir="y",l.overwrite="all",N(a,s[0].toString(),l)),null!==s[1]&&"undefined"!=typeof s[1]&&"y"!==i.axis&&n.overflowed[1]&&(l.dir="x",l.overwrite="none",N(a,s[1].toString(),l))},l.timeout)}})}},stop:function(){var e=u.call(this);return $(e).each(function(){var e=$(this);e.data(t)&&j(e)})},disable:function(e){var o=u.call(this);return $(o).each(function(){var o=$(this);if(o.data(t)){var a=o.data(t);Y.call(this,"remove"),T.call(this),e&&y.call(this),k.call(this,!0),o.addClass(c[3])}})},destroy:function(){var o=u.call(this);return $(o).each(function(){var a=$(this);if(a.data(t)){var n=a.data(t),i=n.opt,r=$("#mCSB_"+n.idx),l=$("#mCSB_"+n.idx+"_container"),s=$(".mCSB_"+n.idx+"_scrollbar");i.live&&h(i.liveSelector||$(o).selector),Y.call(this,"remove"),T.call(this),y.call(this),a.removeData(t),J(this,"mcs"),s.remove(),l.find("img."+c[2]).removeClass(c[2]),r.replaceWith(l.contents()),a.removeClass(e+" _"+t+"_"+n.idx+" "+c[6]+" "+c[7]+" "+c[5]+" "+c[3]).addClass(c[4])}})}},u=function(){return"object"!=typeof $(this)||$(this).length<1?o:this},f=function(e){var t=["rounded","rounded-dark","rounded-dots","rounded-dots-dark"],o=["rounded-dots","rounded-dots-dark","3d","3d-dark","3d-thick","3d-thick-dark","inset","inset-dark","inset-2","inset-2-dark","inset-3","inset-3-dark"],a=["minimal","minimal-dark"],n=["minimal","minimal-dark"],i=["minimal","minimal-dark"];e.autoDraggerLength=$.inArray(e.theme,t)>-1?!1:e.autoDraggerLength,e.autoExpandScrollbar=$.inArray(e.theme,o)>-1?!1:e.autoExpandScrollbar,e.scrollButtons.enable=$.inArray(e.theme,a)>-1?!1:e.scrollButtons.enable,e.autoHideScrollbar=$.inArray(e.theme,n)>-1?!0:e.autoHideScrollbar,e.scrollbarPosition=$.inArray(e.theme,i)>-1?"outside":e.scrollbarPosition},h=function(e){i[e]&&(clearTimeout(i[e]),J(i,e))},m=function(e){return"yx"===e||"xy"===e||"auto"===e?"yx":"x"===e||"horizontal"===e?"x":"y"},p=function(e){return"stepped"===e||"pixels"===e||"step"===e||"click"===e?"stepped":"stepless"},g=function(){var o=$(this),a=o.data(t),n=a.opt,i=n.autoExpandScrollbar?" "+c[1]+"_expand":"",r=["<div id='mCSB_"+a.idx+"_scrollbar_vertical' class='mCSB_scrollTools mCSB_"+a.idx+"_scrollbar mCS-"+n.theme+" mCSB_scrollTools_vertical"+i+"'><div class='"+c[12]+"'><div id='mCSB_"+a.idx+"_dragger_vertical' class='mCSB_dragger' style='position:absolute;' oncontextmenu='return false;'><div class='mCSB_dragger_bar' /></div><div class='mCSB_draggerRail' /></div></div>","<div id='mCSB_"+a.idx+"_scrollbar_horizontal' class='mCSB_scrollTools mCSB_"+a.idx+"_scrollbar mCS-"+n.theme+" mCSB_scrollTools_horizontal"+i+"'><div class='"+c[12]+"'><div id='mCSB_"+a.idx+"_dragger_horizontal' class='mCSB_dragger' style='position:absolute;' oncontextmenu='return false;'><div class='mCSB_dragger_bar' /></div><div class='mCSB_draggerRail' /></div></div>"],l="yx"===n.axis?"mCSB_vertical_horizontal":"x"===n.axis?"mCSB_horizontal":"mCSB_vertical",s="yx"===n.axis?r[0]+r[1]:"x"===n.axis?r[1]:r[0],d="yx"===n.axis?"<div id='mCSB_"+a.idx+"_container_wrapper' class='mCSB_container_wrapper' />":"",u=n.autoHideScrollbar?" "+c[6]:"",f="x"!==n.axis&&"rtl"===a.langDir?" "+c[7]:"";n.setWidth&&o.css("width",n.setWidth),n.setHeight&&o.css("height",n.setHeight),n.setLeft="y"!==n.axis&&"rtl"===a.langDir?"989999px":n.setLeft,o.addClass(e+" _"+t+"_"+a.idx+u+f).wrapInner("<div id='mCSB_"+a.idx+"' class='mCustomScrollBox mCS-"+n.theme+" "+l+"'><div id='mCSB_"+a.idx+"_container' class='mCSB_container' style='position:relative; top:"+n.setTop+"; left:"+n.setLeft+";' dir="+a.langDir+" /></div>");var h=$("#mCSB_"+a.idx),m=$("#mCSB_"+a.idx+"_container");"y"===n.axis||n.advanced.autoExpandHorizontalScroll||m.css("width",v(m)),"outside"===n.scrollbarPosition?("static"===o.css("position")&&o.css("position","relative"),o.css("overflow","visible"),h.addClass("mCSB_outside").after(s)):(h.addClass("mCSB_inside").append(s),m.wrap(d)),_.call(this);var p=[$("#mCSB_"+a.idx+"_dragger_vertical"),$("#mCSB_"+a.idx+"_dragger_horizontal")];p[0].css("min-height",p[0].height()),p[1].css("min-width",p[1].width())},v=function(e){var t=[e[0].scrollWidth,Math.max.apply(Math,e.children().map(function(){return $(this).outerWidth(!0)}).get())],o=e.parent().width();return t[0]>o?t[0]:t[1]>o?t[1]:"100%"},x=function(){var e=$(this),o=e.data(t),a=o.opt,n=$("#mCSB_"+o.idx+"_container");if(a.advanced.autoExpandHorizontalScroll&&"y"!==a.axis){n.css({width:"auto","min-width":0,"overflow-x":"scroll"});var i=Math.ceil(n[0].scrollWidth);3===a.advanced.autoExpandHorizontalScroll||2!==a.advanced.autoExpandHorizontalScroll&&i>n.parent().width()?n.css({width:i,"min-width":"100%","overflow-x":"inherit"}):n.css({"overflow-x":"inherit",position:"absolute"}).wrap("<div class='mCSB_h_wrapper' style='position:relative; left:0; width:999999px;' />").css({width:Math.ceil(n[0].getBoundingClientRect().right+.4)-Math.floor(n[0].getBoundingClientRect().left),"min-width":"100%",position:"relative"}).unwrap()}},_=function(){var e=$(this),o=e.data(t),a=o.opt,n=$(".mCSB_"+o.idx+"_scrollbar:first"),i=ee(a.scrollButtons.tabindex)?"tabindex='"+a.scrollButtons.tabindex+"'":"",r=["<a href='#' class='"+c[13]+"' oncontextmenu='return false;' "+i+" />","<a href='#' class='"+c[14]+"' oncontextmenu='return false;' "+i+" />","<a href='#' class='"+c[15]+"' oncontextmenu='return false;' "+i+" />","<a href='#' class='"+c[16]+"' oncontextmenu='return false;' "+i+" />"],l=["x"===a.axis?r[2]:r[0],"x"===a.axis?r[3]:r[1],r[2],r[3]];a.scrollButtons.enable&&n.prepend(l[0]).append(l[1]).next(".mCSB_scrollTools").prepend(l[2]).append(l[3])},w=function(){var e=$(this),o=e.data(t),a=$("#mCSB_"+o.idx),n=$("#mCSB_"+o.idx+"_container"),i=[$("#mCSB_"+o.idx+"_dragger_vertical"),$("#mCSB_"+o.idx+"_dragger_horizontal")],l=[a.height()/n.outerHeight(!1),a.width()/n.outerWidth(!1)],s=[parseInt(i[0].css("min-height")),Math.round(l[0]*i[0].parent().height()),parseInt(i[1].css("min-width")),Math.round(l[1]*i[1].parent().width())],c=r&&s[1]<s[0]?s[0]:s[1],d=r&&s[3]<s[2]?s[2]:s[3];i[0].css({height:c,"max-height":i[0].parent().height()-10}).find(".mCSB_dragger_bar").css({"line-height":s[0]+"px"}),i[1].css({width:d,"max-width":i[1].parent().width()-10})},S=function(){var e=$(this),o=e.data(t),a=$("#mCSB_"+o.idx),n=$("#mCSB_"+o.idx+"_container"),i=[$("#mCSB_"+o.idx+"_dragger_vertical"),$("#mCSB_"+o.idx+"_dragger_horizontal")],r=[n.outerHeight(!1)-a.height(),n.outerWidth(!1)-a.width()],l=[r[0]/(i[0].parent().height()-i[0].height()),r[1]/(i[1].parent().width()-i[1].width())];o.scrollRatio={y:l[0],x:l[1]}},b=function(e,t,o){var a=o?c[0]+"_expanded":"",n=e.closest(".mCSB_scrollTools");"active"===t?(e.toggleClass(c[0]+" "+a),n.toggleClass(c[1]),e[0]._draggable=e[0]._draggable?0:1):e[0]._draggable||("hide"===t?(e.removeClass(c[0]),n.removeClass(c[1])):(e.addClass(c[0]),n.addClass(c[1])))},C=function(){var e=$(this),o=e.data(t),a=$("#mCSB_"+o.idx),n=$("#mCSB_"+o.idx+"_container"),i=null==o.overflowed?n.height():n.outerHeight(!1),r=null==o.overflowed?n.width():n.outerWidth(!1),l=n[0].scrollHeight,s=n[0].scrollWidth;return l>i&&(i=l),s>r&&(r=s),[i>a.height(),r>a.width()]},y=function(){var e=$(this),o=e.data(t),a=o.opt,n=$("#mCSB_"+o.idx),i=$("#mCSB_"+o.idx+"_container"),r=[$("#mCSB_"+o.idx+"_dragger_vertical"),$("#mCSB_"+o.idx+"_dragger_horizontal")];if(j(e),("x"!==a.axis&&!o.overflowed[0]||"y"===a.axis&&o.overflowed[0])&&(r[0].add(i).css("top",0),N(e,"_resetY")),"y"!==a.axis&&!o.overflowed[1]||"x"===a.axis&&o.overflowed[1]){var l=dx=0;"rtl"===o.langDir&&(l=n.width()-i.outerWidth(!1),dx=Math.abs(l/o.scrollRatio.x)),i.css("left",l),r[1].css("left",dx),N(e,"_resetX")}},B=function(){function e(){i=setTimeout(function(){$.event.special.mousewheel?(clearTimeout(i),E.call(o[0])):e()},100)}var o=$(this),a=o.data(t),n=a.opt;if(!a.bindEvents){if(O.call(this),n.contentTouchScroll&&I.call(this),D.call(this),n.mouseWheel.enable){var i;e()}A.call(this),z.call(this),n.advanced.autoScrollOnFocus&&L.call(this),n.scrollButtons.enable&&P.call(this),n.keyboard.enable&&H.call(this),a.bindEvents=!0}},T=function(){var e=$(this),o=e.data(t),a=o.opt,n=t+"_"+o.idx,i=".mCSB_"+o.idx+"_scrollbar",r=$("#mCSB_"+o.idx+",#mCSB_"+o.idx+"_container,#mCSB_"+o.idx+"_container_wrapper,"+i+" ."+c[12]+",#mCSB_"+o.idx+"_dragger_vertical,#mCSB_"+o.idx+"_dragger_horizontal,"+i+">a"),l=$("#mCSB_"+o.idx+"_container");a.advanced.releaseDraggableSelectors&&r.add($(a.advanced.releaseDraggableSelectors)),a.advanced.extraDraggableSelectors&&r.add($(a.advanced.extraDraggableSelectors)),o.bindEvents&&($(document).add($(!R()||top.document)).unbind("."+n),r.each(function(){$(this).unbind("."+n)}),clearTimeout(e[0]._focusTimeout),J(e[0],"_focusTimeout"),clearTimeout(o.sequential.step),J(o.sequential,"step"),clearTimeout(l[0].onCompleteTimeout),J(l[0],"onCompleteTimeout"),o.bindEvents=!1)},k=function(e){var o=$(this),a=o.data(t),n=a.opt,i=$("#mCSB_"+a.idx+"_container_wrapper"),r=i.length?i:$("#mCSB_"+a.idx+"_container"),l=[$("#mCSB_"+a.idx+"_scrollbar_vertical"),$("#mCSB_"+a.idx+"_scrollbar_horizontal")],s=[l[0].find(".mCSB_dragger"),l[1].find(".mCSB_dragger")];"x"!==n.axis&&(a.overflowed[0]&&!e?(l[0].add(s[0]).add(l[0].children("a")).css("display","block"),r.removeClass(c[8]+" "+c[10])):(n.alwaysShowScrollbar?(2!==n.alwaysShowScrollbar&&s[0].css("display","none"),r.removeClass(c[10])):(l[0].css("display","none"),r.addClass(c[10])),r.addClass(c[8]))),"y"!==n.axis&&(a.overflowed[1]&&!e?(l[1].add(s[1]).add(l[1].children("a")).css("display","block"),r.removeClass(c[9]+" "+c[11])):(n.alwaysShowScrollbar?(2!==n.alwaysShowScrollbar&&s[1].css("display","none"),r.removeClass(c[11])):(l[1].css("display","none"),r.addClass(c[11])),r.addClass(c[9]))),a.overflowed[0]||a.overflowed[1]?o.removeClass(c[5]):o.addClass(c[5])},M=function(e){var t=e.type,o=e.target.ownerDocument!==document?[$(frameElement).offset().top,$(frameElement).offset().left]:null,a=R()&&e.target.ownerDocument!==top.document?[$(e.view.frameElement).offset().top,$(e.view.frameElement).offset().left]:[0,0];switch(t){case"pointerdown":case"MSPointerDown":case"pointermove":case"MSPointerMove":case"pointerup":case"MSPointerUp":return o?[e.originalEvent.pageY-o[0]+a[0],e.originalEvent.pageX-o[1]+a[1],!1]:[e.originalEvent.pageY,e.originalEvent.pageX,!1];break;case"touchstart":case"touchmove":case"touchend":var n=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0],i=e.originalEvent.touches.length||e.originalEvent.changedTouches.length;return e.target.ownerDocument!==document?[n.screenY,n.screenX,i>1]:[n.pageY,n.pageX,i>1];break;default:return o?[e.pageY-o[0]+a[0],e.pageX-o[1]+a[1],!1]:[e.pageY,e.pageX,!1]}},O=function(){function e(e){var t=d.find("iframe");if(t.length){var o=e?"auto":"none";t.css("pointer-events",o)}}function o(e,t,o,r){if(d[0].idleTimer=i.scrollInertia<233?250:0,f.attr("id")===c[1])var l="x",s=(f[0].offsetLeft-t+r)*n.scrollRatio.x;else var l="y",s=(f[0].offsetTop-e+o)*n.scrollRatio.y;N(a,s.toString(),{dir:l,drag:!0})}var a=$(this),n=a.data(t),i=n.opt,s=t+"_"+n.idx,c=["mCSB_"+n.idx+"_dragger_vertical","mCSB_"+n.idx+"_dragger_horizontal"],d=$("#mCSB_"+n.idx+"_container"),u=$("#"+c[0]+",#"+c[1]),f,h,m,p=i.advanced.releaseDraggableSelectors?u.add($(i.advanced.releaseDraggableSelectors)):u,g=i.advanced.extraDraggableSelectors?$(!R()||top.document).add($(i.advanced.extraDraggableSelectors)):$(!R()||top.document);u.bind("mousedown."+s+" touchstart."+s+" pointerdown."+s+" MSPointerDown."+s,function(t){if(t.stopImmediatePropagation(),t.preventDefault(),K(t)){l=!0,r&&(document.onselectstart=function(){return!1}),e(!1),j(a),f=$(this);var o=f.offset(),n=M(t)[0]-o.top,s=M(t)[1]-o.left,c=f.height()+o.top,d=f.width()+o.left;c>n&&n>0&&d>s&&s>0&&(h=n,m=s),b(f,"active",i.autoExpandScrollbar)}}).bind("touchmove."+s,function(e){e.stopImmediatePropagation(),e.preventDefault();var t=f.offset(),a=M(e)[0]-t.top,n=M(e)[1]-t.left;o(h,m,a,n)}),$(document).add(g).bind("mousemove."+s+" pointermove."+s+" MSPointerMove."+s,function(e){if(f){var t=f.offset(),a=M(e)[0]-t.top,n=M(e)[1]-t.left;if(h===a&&m===n)return;o(h,m,a,n)}}).add(p).bind("mouseup."+s+" touchend."+s+" pointerup."+s+" MSPointerUp."+s,function(t){f&&(b(f,"active",i.autoExpandScrollbar),f=null),l=!1,r&&(document.onselectstart=null),e(!0)})},I=function(){function e(e){if(!Z(e)||l||M(e)[2])return void(s=0);s=1,A=0,L=0,g=1,c.removeClass("mCS_touch_action");var t=m.offset();v=M(e)[0]-t.top,x=M(e)[1]-t.left,W=[M(e)[0],M(e)[1]]}function o(e){if(Z(e)&&!l&&!M(e)[2]&&(u.documentTouchScroll||e.preventDefault(),e.stopImmediatePropagation(),(!L||A)&&g)){y=Q();var t=h.offset(),o=M(e)[0]-t.top,a=M(e)[1]-t.left,n="mcsLinearOut";if(S.push(o),b.push(a),W[2]=Math.abs(M(e)[0]-W[0]),W[3]=Math.abs(M(e)[1]-W[1]),d.overflowed[0])var i=p[0].parent().height()-p[0].height(),s=v-o>0&&o-v>-(i*d.scrollRatio.y)&&(2*W[3]<W[2]||"yx"===u.axis);if(d.overflowed[1])var f=p[1].parent().width()-p[1].width(),_=x-a>0&&a-x>-(f*d.scrollRatio.x)&&(2*W[2]<W[3]||"yx"===u.axis);s||_?(H||e.preventDefault(),A=1):(L=1,c.addClass("mCS_touch_action")),H&&e.preventDefault(),O="yx"===u.axis?[v-o,x-a]:"x"===u.axis?[null,x-a]:[v-o,null],m[0].idleTimer=250,d.overflowed[0]&&r(O[0],I,n,"y","all",!0),d.overflowed[1]&&r(O[1],I,n,"x",E,!0)}}function a(e){if(!Z(e)||l||M(e)[2])return void(s=0);s=1,e.stopImmediatePropagation(),j(c),C=Q();var t=h.offset();_=M(e)[0]-t.top,w=M(e)[1]-t.left,S=[],b=[]}function n(e){if(Z(e)&&!l&&!M(e)[2]){g=0,e.stopImmediatePropagation(),A=0,L=0,B=Q();var t=h.offset(),o=M(e)[0]-t.top,a=M(e)[1]-t.left;if(!(B-y>30)){k=1e3/(B-C);var n="mcsEaseOut",s=2.5>k,c=s?[S[S.length-2],b[b.length-2]]:[0,0];T=s?[o-c[0],a-c[1]]:[o-_,a-w];var f=[Math.abs(T[0]),Math.abs(T[1])];k=s?[Math.abs(T[0]/4),Math.abs(T[1]/4)]:[k,k];var p=[Math.abs(m[0].offsetTop)-T[0]*i(f[0]/k[0],k[0]),Math.abs(m[0].offsetLeft)-T[1]*i(f[1]/k[1],k[1])];O="yx"===u.axis?[p[0],p[1]]:"x"===u.axis?[null,p[1]]:[p[0],null],D=[4*f[0]+u.scrollInertia,4*f[1]+u.scrollInertia];var v=parseInt(u.contentTouchScroll)||0;O[0]=f[0]>v?O[0]:0,O[1]=f[1]>v?O[1]:0,d.overflowed[0]&&r(O[0],D[0],n,"y",E,!1),d.overflowed[1]&&r(O[1],D[1],n,"x",E,!1)}}}function i(e,t){var o=[1.5*t,2*t,t/1.5,t/2];return e>90?t>4?o[0]:o[3]:e>60?t>3?o[3]:o[2]:e>30?t>8?o[1]:t>6?o[0]:t>4?t:o[2]:t>8?t:o[3]}function r(e,t,o,a,n,i){e&&N(c,e.toString(),{dur:t,scrollEasing:o,dir:a,overwrite:n,drag:i})}var c=$(this),d=c.data(t),u=d.opt,f=t+"_"+d.idx,h=$("#mCSB_"+d.idx),m=$("#mCSB_"+d.idx+"_container"),p=[$("#mCSB_"+d.idx+"_dragger_vertical"),$("#mCSB_"+d.idx+"_dragger_horizontal")],g,v,x,_,w,S=[],b=[],C,y,B,T,k,O,I=0,D,E="yx"===u.axis?"none":"all",W=[],A,L,z=m.find("iframe"),P=["touchstart."+f+" pointerdown."+f+" MSPointerDown."+f,"touchmove."+f+" pointermove."+f+" MSPointerMove."+f,"touchend."+f+" pointerup."+f+" MSPointerUp."+f],H=void 0!==document.body.style.touchAction;m.bind(P[0],function(t){e(t)}).bind(P[1],function(e){o(e)}),h.bind(P[0],function(e){a(e)}).bind(P[2],function(e){n(e)}),z.length&&z.each(function(){$(this).load(function(){R(this)&&$(this.contentDocument||this.contentWindow.document).bind(P[0],function(t){e(t),a(t)}).bind(P[1],function(e){o(e)}).bind(P[2],function(e){n(e)})})})},D=function(){function e(){return window.getSelection?window.getSelection().toString():document.selection&&"Control"!=document.selection.type?document.selection.createRange().text:0}function o(e,t,o){r.type=o&&f?"stepped":"stepless",r.scrollAmount=10,U(a,e,t,"mcsLinearOut",o?60:null)}var a=$(this),n=a.data(t),i=n.opt,r=n.sequential,c=t+"_"+n.idx,d=$("#mCSB_"+n.idx+"_container"),u=d.parent(),f;d.bind("mousedown."+c,function(e){s||f||(f=1,l=!0)}).add(document).bind("mousemove."+c,function(t){if(!s&&f&&e()){var a=d.offset(),l=M(t)[0]-a.top+d[0].offsetTop,c=M(t)[1]-a.left+d[0].offsetLeft;l>0&&l<u.height()&&c>0&&c<u.width()?r.step&&o("off",null,"stepped"):("x"!==i.axis&&n.overflowed[0]&&(0>l?o("on",38):l>u.height()&&o("on",40)),"y"!==i.axis&&n.overflowed[1]&&(0>c?o("on",37):c>u.width()&&o("on",39)))}}).bind("mouseup."+c+" dragend."+c,function(e){s||(f&&(f=0,o("off",null)),l=!1)})},E=function(){function e(e,t){if(j(o),!W(o,e.target)){var i="auto"!==n.mouseWheel.deltaFactor?parseInt(n.mouseWheel.deltaFactor):r&&e.deltaFactor<100?100:e.deltaFactor||100,c=n.scrollInertia;if("x"===n.axis||"x"===n.mouseWheel.axis)var d="x",u=[Math.round(i*a.scrollRatio.x),parseInt(n.mouseWheel.scrollAmount)],f="auto"!==n.mouseWheel.scrollAmount?u[1]:u[0]>=l.width()?.9*l.width():u[0],h=Math.abs($("#mCSB_"+a.idx+"_container")[0].offsetLeft),m=s[1][0].offsetLeft,p=s[1].parent().width()-s[1].width(),g=e.deltaX||e.deltaY||t;else var d="y",u=[Math.round(i*a.scrollRatio.y),parseInt(n.mouseWheel.scrollAmount)],f="auto"!==n.mouseWheel.scrollAmount?u[1]:u[0]>=l.height()?.9*l.height():u[0],h=Math.abs($("#mCSB_"+a.idx+"_container")[0].offsetTop),m=s[0][0].offsetTop,p=s[0].parent().height()-s[0].height(),g=e.deltaY||t;"y"===d&&!a.overflowed[0]||"x"===d&&!a.overflowed[1]||((n.mouseWheel.invert||e.webkitDirectionInvertedFromDevice)&&(g=-g),n.mouseWheel.normalizeDelta&&(g=0>g?-1:1),(g>0&&0!==m||0>g&&m!==p||n.mouseWheel.preventDefault)&&(e.stopImmediatePropagation(),e.preventDefault()),e.deltaFactor<2&&!n.mouseWheel.normalizeDelta&&(f=e.deltaFactor,c=17),N(o,(h-g*f).toString(),{dir:d,dur:c}))}}if($(this).data(t)){var o=$(this),a=o.data(t),n=a.opt,i=t+"_"+a.idx,l=$("#mCSB_"+a.idx),s=[$("#mCSB_"+a.idx+"_dragger_vertical"),$("#mCSB_"+a.idx+"_dragger_horizontal")],c=$("#mCSB_"+a.idx+"_container").find("iframe");c.length&&c.each(function(){$(this).load(function(){R(this)&&$(this.contentDocument||this.contentWindow.document).bind("mousewheel."+i,function(t,o){e(t,o)})})}),l.bind("mousewheel."+i,function(t,o){e(t,o)})}},R=function(e){var t=null;if(e){try{var o=e.contentDocument||e.contentWindow.document;t=o.body.innerHTML}catch(a){}return null!==t}try{var o=top.document;t=o.body.innerHTML}catch(a){}return null!==t},W=function(e,o){var a=o.nodeName.toLowerCase(),n=e.data(t).opt.mouseWheel.disableOver,i=["select","textarea"];return $.inArray(a,n)>-1&&!($.inArray(a,i)>-1&&!$(o).is(":focus"))},A=function(){var e=$(this),o=e.data(t),a=t+"_"+o.idx,n=$("#mCSB_"+o.idx+"_container"),i=n.parent(),r=$(".mCSB_"+o.idx+"_scrollbar ."+c[12]),s;r.bind("mousedown."+a+" touchstart."+a+" pointerdown."+a+" MSPointerDown."+a,function(e){l=!0,$(e.target).hasClass("mCSB_dragger")||(s=1)}).bind("touchend."+a+" pointerup."+a+" MSPointerUp."+a,function(e){l=!1}).bind("click."+a,function(t){if(s&&(s=0,$(t.target).hasClass(c[12])||$(t.target).hasClass("mCSB_draggerRail"))){j(e);var a=$(this),r=a.find(".mCSB_dragger");if(a.parent(".mCSB_scrollTools_horizontal").length>0){if(!o.overflowed[1])return;var l="x",d=t.pageX>r.offset().left?-1:1,u=Math.abs(n[0].offsetLeft)-d*(.9*i.width())}else{if(!o.overflowed[0])return;var l="y",d=t.pageY>r.offset().top?-1:1,u=Math.abs(n[0].offsetTop)-d*(.9*i.height())}N(e,u.toString(),{dir:l,scrollEasing:"mcsEaseInOut"})}})},L=function(){var e=$(this),o=e.data(t),a=o.opt,n=t+"_"+o.idx,i=$("#mCSB_"+o.idx+"_container"),r=i.parent();i.bind("focusin."+n,function(t){var o=$(document.activeElement),n=i.find(".mCustomScrollBox").length,l=0;o.is(a.advanced.autoScrollOnFocus)&&(j(e),clearTimeout(e[0]._focusTimeout),e[0]._focusTimer=n?(l+17)*n:0,e[0]._focusTimeout=setTimeout(function(){var t=[te(o)[0],te(o)[1]],n=[i[0].offsetTop,i[0].offsetLeft],s=[n[0]+t[0]>=0&&n[0]+t[0]<r.height()-o.outerHeight(!1),n[1]+t[1]>=0&&n[0]+t[1]<r.width()-o.outerWidth(!1)],c="yx"!==a.axis||s[0]||s[1]?"all":"none";"x"===a.axis||s[0]||N(e,t[0].toString(),{dir:"y",scrollEasing:"mcsEaseInOut",overwrite:c,dur:l}),"y"===a.axis||s[1]||N(e,t[1].toString(),{dir:"x",scrollEasing:"mcsEaseInOut",overwrite:c,dur:l})},e[0]._focusTimer))})},z=function(){var e=$(this),o=e.data(t),a=t+"_"+o.idx,n=$("#mCSB_"+o.idx+"_container").parent();n.bind("scroll."+a,function(e){(0!==n.scrollTop()||0!==n.scrollLeft())&&$(".mCSB_"+o.idx+"_scrollbar").css("visibility","hidden")})},P=function(){var e=$(this),o=e.data(t),a=o.opt,n=o.sequential,i=t+"_"+o.idx,r=".mCSB_"+o.idx+"_scrollbar",s=$(r+">a");s.bind("mousedown."+i+" touchstart."+i+" pointerdown."+i+" MSPointerDown."+i+" mouseup."+i+" touchend."+i+" pointerup."+i+" MSPointerUp."+i+" mouseout."+i+" pointerout."+i+" MSPointerOut."+i+" click."+i,function(t){function i(t,o){n.scrollAmount=a.scrollButtons.scrollAmount,U(e,t,o)}if(t.preventDefault(),K(t)){var r=$(this).attr("class");switch(n.type=a.scrollButtons.scrollType,t.type){case"mousedown":case"touchstart":case"pointerdown":case"MSPointerDown":if("stepped"===n.type)return;l=!0,o.tweenRunning=!1,i("on",r);break;case"mouseup":case"touchend":case"pointerup":case"MSPointerUp":case"mouseout":case"pointerout":case"MSPointerOut":if("stepped"===n.type)return;l=!1,n.dir&&i("off",r);break;case"click":if("stepped"!==n.type||o.tweenRunning)return;i("on",r)}}})},H=function(){function e(e){function t(e,t){i.type=n.keyboard.scrollType,i.scrollAmount=n.keyboard.scrollAmount,"stepped"===i.type&&a.tweenRunning||U(o,e,t)}switch(e.type){case"blur":a.tweenRunning&&i.dir&&t("off",null);break;case"keydown":case"keyup":var r=e.keyCode?e.keyCode:e.which,l="on";if("x"!==n.axis&&(38===r||40===r)||"y"!==n.axis&&(37===r||39===r)){if((38===r||40===r)&&!a.overflowed[0]||(37===r||39===r)&&!a.overflowed[1])return;"keyup"===e.type&&(l="off"),$(document.activeElement).is(d)||(e.preventDefault(),e.stopImmediatePropagation(),t(l,r))}else if(33===r||34===r){if((a.overflowed[0]||a.overflowed[1])&&(e.preventDefault(),e.stopImmediatePropagation()),"keyup"===e.type){j(o);var u=34===r?-1:1;if("x"===n.axis||"yx"===n.axis&&a.overflowed[1]&&!a.overflowed[0])var f="x",h=Math.abs(s[0].offsetLeft)-u*(.9*c.width());else var f="y",h=Math.abs(s[0].offsetTop)-u*(.9*c.height());N(o,h.toString(),{dir:f,scrollEasing:"mcsEaseInOut"})}}else if((35===r||36===r)&&!$(document.activeElement).is(d)&&((a.overflowed[0]||a.overflowed[1])&&(e.preventDefault(),e.stopImmediatePropagation()),"keyup"===e.type)){if("x"===n.axis||"yx"===n.axis&&a.overflowed[1]&&!a.overflowed[0])var f="x",h=35===r?Math.abs(c.width()-s.outerWidth(!1)):0;else var f="y",h=35===r?Math.abs(c.height()-s.outerHeight(!1)):0;N(o,h.toString(),{dir:f,scrollEasing:"mcsEaseInOut"})}}}var o=$(this),a=o.data(t),n=a.opt,i=a.sequential,r=t+"_"+a.idx,l=$("#mCSB_"+a.idx),s=$("#mCSB_"+a.idx+"_container"),c=s.parent(),d="input,textarea,select,datalist,keygen,[contenteditable='true']",u=s.find("iframe"),f=["blur."+r+" keydown."+r+" keyup."+r];u.length&&u.each(function(){$(this).load(function(){R(this)&&$(this.contentDocument||this.contentWindow.document).bind(f[0],function(t){e(t)})})}),l.attr("tabindex","0").bind(f[0],function(t){e(t)})},U=function(e,o,a,n,i){function r(t){d.snapAmount&&(u.scrollAmount=d.snapAmount instanceof Array?"x"===u.dir[0]?d.snapAmount[1]:d.snapAmount[0]:d.snapAmount);var o="stepped"!==u.type,a=i?i:t?o?m/1.5:p:1e3/60,l=t?o?7.5:40:2.5,c=[Math.abs(f[0].offsetTop),Math.abs(f[0].offsetLeft)],h=[s.scrollRatio.y>10?10:s.scrollRatio.y,s.scrollRatio.x>10?10:s.scrollRatio.x],g="x"===u.dir[0]?c[1]+u.dir[1]*(h[1]*l):c[0]+u.dir[1]*(h[0]*l),v="x"===u.dir[0]?c[1]+u.dir[1]*parseInt(u.scrollAmount):c[0]+u.dir[1]*parseInt(u.scrollAmount),x="auto"!==u.scrollAmount?v:g,_=n?n:t?o?"mcsLinearOut":"mcsEaseInOut":"mcsLinear",w=t?!0:!1;return t&&17>a&&(x="x"===u.dir[0]?c[1]:c[0]),N(e,x.toString(),{dir:u.dir[0],scrollEasing:_,dur:a,onComplete:w}),t?void(u.dir=!1):(clearTimeout(u.step),void(u.step=setTimeout(function(){r()},a)))}function l(){clearTimeout(u.step),J(u,"step"),j(e)}var s=e.data(t),d=s.opt,u=s.sequential,f=$("#mCSB_"+s.idx+"_container"),h="stepped"===u.type?!0:!1,m=d.scrollInertia<26?26:d.scrollInertia,p=d.scrollInertia<1?17:d.scrollInertia;switch(o){case"on":if(u.dir=[a===c[16]||a===c[15]||39===a||37===a?"x":"y",a===c[13]||a===c[15]||38===a||37===a?-1:1],j(e),ee(a)&&"stepped"===u.type)return;r(h);break;case"off":l(),(h||s.tweenRunning&&u.dir)&&r(!0)}},F=function(e){var o=$(this).data(t).opt,a=[];return"function"==typeof e&&(e=e()),e instanceof Array?a=e.length>1?[e[0],e[1]]:"x"===o.axis?[null,e[0]]:[e[0],null]:(a[0]=e.y?e.y:e.x||"x"===o.axis?null:e,a[1]=e.x?e.x:e.y||"y"===o.axis?null:e),"function"==typeof a[0]&&(a[0]=a[0]()),"function"==typeof a[1]&&(a[1]=a[1]()),a},q=function(e,o){if(null!=e&&"undefined"!=typeof e){var a=$(this),n=a.data(t),i=n.opt,r=$("#mCSB_"+n.idx+"_container"),l=r.parent(),s=typeof e;o||(o="x"===i.axis?"x":"y");var c="x"===o?r.outerWidth(!1):r.outerHeight(!1),u="x"===o?r[0].offsetLeft:r[0].offsetTop,f="x"===o?"left":"top";switch(s){case"function":return e();break;case"object":var h=e.jquery?e:$(e);if(!h.length)return;return"x"===o?te(h)[1]:te(h)[0];break;case"string":case"number":if(ee(e))return Math.abs(e);if(-1!==e.indexOf("%"))return Math.abs(c*parseInt(e)/100);if(-1!==e.indexOf("-="))return Math.abs(u-parseInt(e.split("-=")[1]));if(-1!==e.indexOf("+=")){var m=u+parseInt(e.split("+=")[1]);return m>=0?0:Math.abs(m)}if(-1!==e.indexOf("px")&&ee(e.split("px")[0]))return Math.abs(e.split("px")[0]);if("top"===e||"left"===e)return 0;if("bottom"===e)return Math.abs(l.height()-r.outerHeight(!1));if("right"===e)return Math.abs(l.width()-r.outerWidth(!1));if("first"===e||"last"===e){var h=r.find(":"+e);return"x"===o?te(h)[1]:te(h)[0]}return $(e).length?"x"===o?te($(e))[1]:te($(e))[0]:(r.css(f,e),void d.update.call(null,a[0]))}}},Y=function(e){function o(){return clearTimeout(u[0].autoUpdate),0===r.parents("html").length?void(r=null):void(u[0].autoUpdate=setTimeout(function(){return s.advanced.updateOnSelectorChange&&(l.poll.change.n=n(),l.poll.change.n!==l.poll.change.o)?(l.poll.change.o=l.poll.change.n,void i(3)):s.advanced.updateOnContentResize&&(l.poll.size.n=r[0].scrollHeight+r[0].scrollWidth+u[0].offsetHeight+r[0].offsetHeight+r[0].offsetWidth,l.poll.size.n!==l.poll.size.o)?(l.poll.size.o=l.poll.size.n,void i(1)):!s.advanced.updateOnImageLoad||"auto"===s.advanced.updateOnImageLoad&&"y"===s.axis||(l.poll.img.n=u.find("img").length,l.poll.img.n===l.poll.img.o)?void((s.advanced.updateOnSelectorChange||s.advanced.updateOnContentResize||s.advanced.updateOnImageLoad)&&o()):(l.poll.img.o=l.poll.img.n,void u.find("img").each(function(){a(this)}))},s.advanced.autoUpdateTimeout))}function a(e){function t(e,t){return function(){return t.apply(e,arguments)}}function o(){this.onload=null,$(e).addClass(c[2]),i(2)}if($(e).hasClass(c[2]))return void i();var a=new Image;a.onload=t(a,o),a.src=e.src}function n(){s.advanced.updateOnSelectorChange===!0&&(s.advanced.updateOnSelectorChange="*");var e=0,t=u.find(s.advanced.updateOnSelectorChange);
return s.advanced.updateOnSelectorChange&&t.length>0&&t.each(function(){e+=this.offsetHeight+this.offsetWidth}),e}function i(e){clearTimeout(u[0].autoUpdate),d.update.call(null,r[0],e)}var r=$(this),l=r.data(t),s=l.opt,u=$("#mCSB_"+l.idx+"_container");return e?(clearTimeout(u[0].autoUpdate),void J(u[0],"autoUpdate")):void o()},X=function(e,t,o){return Math.round(e/t)*t-o},j=function(e){var o=e.data(t),a=$("#mCSB_"+o.idx+"_container,#mCSB_"+o.idx+"_container_wrapper,#mCSB_"+o.idx+"_dragger_vertical,#mCSB_"+o.idx+"_dragger_horizontal");a.each(function(){G.call(this)})},N=function(e,o,a){function n(e){return l&&s.callbacks[e]&&"function"==typeof s.callbacks[e]}function i(){return[s.callbacks.alwaysTriggerOffsets||_>=w[0]+C,s.callbacks.alwaysTriggerOffsets||-y>=_]}function r(){var t=[f[0].offsetTop,f[0].offsetLeft],o=[v[0].offsetTop,v[0].offsetLeft],n=[f.outerHeight(!1),f.outerWidth(!1)],i=[u.height(),u.width()];e[0].mcs={content:f,top:t[0],left:t[1],draggerTop:o[0],draggerLeft:o[1],topPct:Math.round(100*Math.abs(t[0])/(Math.abs(n[0])-i[0])),leftPct:Math.round(100*Math.abs(t[1])/(Math.abs(n[1])-i[1])),direction:a.dir}}var l=e.data(t),s=l.opt,c={trigger:"internal",dir:"y",scrollEasing:"mcsEaseOut",drag:!1,dur:s.scrollInertia,overwrite:"all",callbacks:!0,onStart:!0,onUpdate:!0,onComplete:!0},a=$.extend(c,a),d=[a.dur,a.drag?0:a.dur],u=$("#mCSB_"+l.idx),f=$("#mCSB_"+l.idx+"_container"),h=f.parent(),m=s.callbacks.onTotalScrollOffset?F.call(e,s.callbacks.onTotalScrollOffset):[0,0],p=s.callbacks.onTotalScrollBackOffset?F.call(e,s.callbacks.onTotalScrollBackOffset):[0,0];if(l.trigger=a.trigger,(0!==h.scrollTop()||0!==h.scrollLeft())&&($(".mCSB_"+l.idx+"_scrollbar").css("visibility","visible"),h.scrollTop(0).scrollLeft(0)),"_resetY"!==o||l.contentReset.y||(n("onOverflowYNone")&&s.callbacks.onOverflowYNone.call(e[0]),l.contentReset.y=1),"_resetX"!==o||l.contentReset.x||(n("onOverflowXNone")&&s.callbacks.onOverflowXNone.call(e[0]),l.contentReset.x=1),"_resetY"!==o&&"_resetX"!==o){if(!l.contentReset.y&&e[0].mcs||!l.overflowed[0]||(n("onOverflowY")&&s.callbacks.onOverflowY.call(e[0]),l.contentReset.x=null),!l.contentReset.x&&e[0].mcs||!l.overflowed[1]||(n("onOverflowX")&&s.callbacks.onOverflowX.call(e[0]),l.contentReset.x=null),s.snapAmount){var g=s.snapAmount instanceof Array?"x"===a.dir?s.snapAmount[1]:s.snapAmount[0]:s.snapAmount;o=X(o,g,s.snapOffset)}switch(a.dir){case"x":var v=$("#mCSB_"+l.idx+"_dragger_horizontal"),x="left",_=f[0].offsetLeft,w=[u.width()-f.outerWidth(!1),v.parent().width()-v.width()],S=[o,0===o?0:o/l.scrollRatio.x],C=m[1],y=p[1],B=C>0?C/l.scrollRatio.x:0,T=y>0?y/l.scrollRatio.x:0;break;case"y":var v=$("#mCSB_"+l.idx+"_dragger_vertical"),x="top",_=f[0].offsetTop,w=[u.height()-f.outerHeight(!1),v.parent().height()-v.height()],S=[o,0===o?0:o/l.scrollRatio.y],C=m[0],y=p[0],B=C>0?C/l.scrollRatio.y:0,T=y>0?y/l.scrollRatio.y:0}S[1]<0||0===S[0]&&0===S[1]?S=[0,0]:S[1]>=w[1]?S=[w[0],w[1]]:S[0]=-S[0],e[0].mcs||(r(),n("onInit")&&s.callbacks.onInit.call(e[0])),clearTimeout(f[0].onCompleteTimeout),V(v[0],x,Math.round(S[1]),d[1],a.scrollEasing),(l.tweenRunning||!(0===_&&S[0]>=0||_===w[0]&&S[0]<=w[0]))&&V(f[0],x,Math.round(S[0]),d[0],a.scrollEasing,a.overwrite,{onStart:function(){a.callbacks&&a.onStart&&!l.tweenRunning&&(n("onScrollStart")&&(r(),s.callbacks.onScrollStart.call(e[0])),l.tweenRunning=!0,b(v),l.cbOffsets=i())},onUpdate:function(){a.callbacks&&a.onUpdate&&n("whileScrolling")&&(r(),s.callbacks.whileScrolling.call(e[0]))},onComplete:function(){if(a.callbacks&&a.onComplete){"yx"===s.axis&&clearTimeout(f[0].onCompleteTimeout);var t=f[0].idleTimer||0;f[0].onCompleteTimeout=setTimeout(function(){n("onScroll")&&(r(),s.callbacks.onScroll.call(e[0])),n("onTotalScroll")&&S[1]>=w[1]-B&&l.cbOffsets[0]&&(r(),s.callbacks.onTotalScroll.call(e[0])),n("onTotalScrollBack")&&S[1]<=T&&l.cbOffsets[1]&&(r(),s.callbacks.onTotalScrollBack.call(e[0])),l.tweenRunning=!1,f[0].idleTimer=0,b(v,"hide")},t)}}})}},V=function(e,t,o,a,n,i,r){function l(){S.stop||(v||f.call(),v=Q()-p,s(),v>=S.time&&(S.time=v>S.time?v+g-(v-S.time):v+g-1,S.time<v+1&&(S.time=v+1)),S.time<a?S.id=w(l):m.call())}function s(){a>0?(S.currVal=u(S.time,x,b,a,n),_[t]=Math.round(S.currVal)+"px"):_[t]=o+"px",h.call()}function c(){g=1e3/60,S.time=v+g,w=window.requestAnimationFrame?window.requestAnimationFrame:function(e){return s(),setTimeout(e,.01)},S.id=w(l)}function d(){null!=S.id&&(window.requestAnimationFrame?window.cancelAnimationFrame(S.id):clearTimeout(S.id),S.id=null)}function u(e,t,o,a,n){switch(n){case"linear":case"mcsLinear":return o*e/a+t;break;case"mcsLinearOut":return e/=a,e--,o*Math.sqrt(1-e*e)+t;break;case"easeInOutSmooth":return e/=a/2,1>e?o/2*e*e+t:(e--,-o/2*(e*(e-2)-1)+t);break;case"easeInOutStrong":return e/=a/2,1>e?o/2*Math.pow(2,10*(e-1))+t:(e--,o/2*(-Math.pow(2,-10*e)+2)+t);break;case"easeInOut":case"mcsEaseInOut":return e/=a/2,1>e?o/2*e*e*e+t:(e-=2,o/2*(e*e*e+2)+t);break;case"easeOutSmooth":return e/=a,e--,-o*(e*e*e*e-1)+t;break;case"easeOutStrong":return o*(-Math.pow(2,-10*e/a)+1)+t;break;case"easeOut":case"mcsEaseOut":default:var i=(e/=a)*e,r=i*e;return t+o*(.499999999999997*r*i+-2.5*i*i+5.5*r+-6.5*i+4*e)}}e._mTween||(e._mTween={top:{},left:{}});var r=r||{},f=r.onStart||function(){},h=r.onUpdate||function(){},m=r.onComplete||function(){},p=Q(),g,v=0,x=e.offsetTop,_=e.style,w,S=e._mTween[t];"left"===t&&(x=e.offsetLeft);var b=o-x;S.stop=0,"none"!==i&&d(),c()},Q=function(){return window.performance&&window.performance.now?window.performance.now():window.performance&&window.performance.webkitNow?window.performance.webkitNow():Date.now?Date.now():(new Date).getTime()},G=function(){var e=this;e._mTween||(e._mTween={top:{},left:{}});for(var t=["top","left"],o=0;o<t.length;o++){var a=t[o];e._mTween[a].id&&(window.requestAnimationFrame?window.cancelAnimationFrame(e._mTween[a].id):clearTimeout(e._mTween[a].id),e._mTween[a].id=null,e._mTween[a].stop=1)}},J=function(e,t){try{delete e[t]}catch(o){e[t]=null}},K=function(e){return!(e.which&&1!==e.which)},Z=function(e){var t=e.originalEvent.pointerType;return!(t&&"touch"!==t&&2!==t)},ee=function(e){return!isNaN(parseFloat(e))&&isFinite(e)},te=function(e){var t=e.parents(".mCSB_container");return[e.offset().top-t.offset().top,e.offset().left-t.offset().left]},oe=function(){function e(){var e=["webkit","moz","ms","o"];if("hidden"in document)return"hidden";for(var t=0;t<e.length;t++)if(e[t]+"Hidden"in document)return e[t]+"Hidden";return null}var t=e();return t?document[t]:!1};$.fn[e]=function(e){return d[e]?d[e].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof e&&e?void $.error("Method "+e+" does not exist"):d.init.apply(this,arguments)},$[e]=function(e){return d[e]?d[e].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof e&&e?void $.error("Method "+e+" does not exist"):d.init.apply(this,arguments)},$[e].defaults=a,window[e]=!0,$(window).load(function(){$(o)[e](),$.extend($.expr[":"],{mcsInView:$.expr[":"].mcsInView||function(e){var t=$(e),o=t.parents(".mCSB_container"),a,n;if(o.length)return a=o.parent(),n=[o[0].offsetTop,o[0].offsetLeft],n[0]+te(t)[0]>=0&&n[0]+te(t)[0]<a.height()-t.outerHeight(!1)&&n[1]+te(t)[1]>=0&&n[1]+te(t)[1]<a.width()-t.outerWidth(!1)},mcsOverflow:$.expr[":"].mcsOverflow||function(e){var o=$(e).data(t);if(o)return o.overflowed[0]||o.overflowed[1]}})})})});

!function(t,o,e){function i(o,e){this.bodyOverflowX,this.callbacks={hide:[],show:[]},this.checkInterval=null,this.Content,this.$el=t(o),this.$elProxy,this.elProxyPosition,this.enabled=!0,this.options=t.extend({},l,e),this.mouseIsOverProxy=!1,this.namespace="tooltipster-"+Math.round(1e5*Math.random()),this.Status="hidden",this.timerHide=null,this.timerShow=null,this.$tooltip,this.options.iconTheme=this.options.iconTheme.replace(".",""),this.options.theme=this.options.theme.replace(".",""),this._init()}function n(o,e){var i=!0;return t.each(o,function(t,n){return"undefined"==typeof e[t]||o[t]!==e[t]?(i=!1,!1):void 0}),i}function s(){return!f&&p}function r(){var t=e.body||e.documentElement,o=t.style,i="transition";if("string"==typeof o[i])return!0;v=["Moz","Webkit","Khtml","O","ms"],i=i.charAt(0).toUpperCase()+i.substr(1);for(var n=0;n<v.length;n++)if("string"==typeof o[v[n]+i])return!0;return!1}var a="tooltipster",l={animation:"fade",arrow:!0,arrowColor:"",autoClose:!0,content:null,contentAsHTML:!1,contentCloning:!0,debug:!0,delay:200,minWidth:0,maxWidth:null,functionInit:function(t,o){},functionBefore:function(t,o){o()},functionReady:function(t,o){},functionAfter:function(t){},hideOnClick:!1,icon:"(?)",iconCloning:!0,iconDesktop:!1,iconTouch:!1,iconTheme:"tooltipster-icon",interactive:!1,interactiveTolerance:350,multiple:!1,offsetX:0,offsetY:0,onlyOne:!1,position:"top",positionTracker:!1,positionTrackerCallback:function(t){"hover"==this.option("trigger")&&this.option("autoClose")&&this.hide()},restoration:"current",speed:350,timer:0,theme:"tooltipster-default",touchDevices:!0,trigger:"hover",updateAnimation:!0};i.prototype={_init:function(){var o=this;if(e.querySelector){var i=null;void 0===o.$el.data("tooltipster-initialTitle")&&(i=o.$el.attr("title"),void 0===i&&(i=null),o.$el.data("tooltipster-initialTitle",i)),null!==o.options.content?o._content_set(o.options.content):o._content_set(i);var n=o.options.functionInit.call(o.$el,o.$el,o.Content);"undefined"!=typeof n&&o._content_set(n),o.$el.removeAttr("title").addClass("tooltipstered"),!p&&o.options.iconDesktop||p&&o.options.iconTouch?("string"==typeof o.options.icon?(o.$elProxy=t('<span class="'+o.options.iconTheme+'"></span>'),o.$elProxy.text(o.options.icon)):o.options.iconCloning?o.$elProxy=o.options.icon.clone(!0):o.$elProxy=o.options.icon,o.$elProxy.insertAfter(o.$el)):o.$elProxy=o.$el,"hover"==o.options.trigger?(o.$elProxy.on("mouseenter."+o.namespace,function(){(!s()||o.options.touchDevices)&&(o.mouseIsOverProxy=!0,o._show())}).on("mouseleave."+o.namespace,function(){(!s()||o.options.touchDevices)&&(o.mouseIsOverProxy=!1)}),p&&o.options.touchDevices&&o.$elProxy.on("touchstart."+o.namespace,function(){o._showNow()})):"click"==o.options.trigger&&o.$elProxy.on("click."+o.namespace,function(){(!s()||o.options.touchDevices)&&o._show()})}},_show:function(){var t=this;"shown"!=t.Status&&"appearing"!=t.Status&&(t.options.delay?t.timerShow=setTimeout(function(){("click"==t.options.trigger||"hover"==t.options.trigger&&t.mouseIsOverProxy)&&t._showNow()},t.options.delay):t._showNow())},_showNow:function(e){var i=this;i.options.functionBefore.call(i.$el,i.$el,function(){if(i.enabled&&null!==i.Content){e&&i.callbacks.show.push(e),i.callbacks.hide=[],clearTimeout(i.timerShow),i.timerShow=null,clearTimeout(i.timerHide),i.timerHide=null,i.options.onlyOne&&t(".tooltipstered").not(i.$el).each(function(o,e){var i=t(e),n=i.data("tooltipster-ns");t.each(n,function(t,o){var e=i.data(o),n=e.status(),s=e.option("autoClose");"hidden"!==n&&"disappearing"!==n&&s&&e.hide()})});var n=function(){i.Status="shown",t.each(i.callbacks.show,function(t,o){o.call(i.$el)}),i.callbacks.show=[]};if("hidden"!==i.Status){var s=0;"disappearing"===i.Status?(i.Status="appearing",r()?(i.$tooltip.clearQueue().removeClass("tooltipster-dying").addClass("tooltipster-"+i.options.animation+"-show"),i.options.speed>0&&i.$tooltip.delay(i.options.speed),i.$tooltip.queue(n)):i.$tooltip.stop().fadeIn(n)):"shown"===i.Status&&n()}else{i.Status="appearing";var s=i.options.speed;i.bodyOverflowX=t("body").css("overflow-x"),t("body").css("overflow-x","hidden");var a="tooltipster-"+i.options.animation,l="-webkit-transition-duration: "+i.options.speed+"ms; -webkit-animation-duration: "+i.options.speed+"ms; -moz-transition-duration: "+i.options.speed+"ms; -moz-animation-duration: "+i.options.speed+"ms; -o-transition-duration: "+i.options.speed+"ms; -o-animation-duration: "+i.options.speed+"ms; -ms-transition-duration: "+i.options.speed+"ms; -ms-animation-duration: "+i.options.speed+"ms; transition-duration: "+i.options.speed+"ms; animation-duration: "+i.options.speed+"ms;",f=i.options.minWidth?"min-width:"+Math.round(i.options.minWidth)+"px;":"",d=i.options.maxWidth?"max-width:"+Math.round(i.options.maxWidth)+"px;":"",c=i.options.interactive?"pointer-events: auto;":"";if(i.$tooltip=t('<div class="tooltipster-base '+i.options.theme+'" style="'+f+" "+d+" "+c+" "+l+'"><div class="tooltipster-content"></div></div>'),r()&&i.$tooltip.addClass(a),i._content_insert(),i.$tooltip.appendTo("body"),i.reposition(),i.options.functionReady.call(i.$el,i.$el,i.$tooltip),r()?(i.$tooltip.addClass(a+"-show"),i.options.speed>0&&i.$tooltip.delay(i.options.speed),i.$tooltip.queue(n)):i.$tooltip.css("display","none").fadeIn(i.options.speed,n),i._interval_set(),t(o).on("scroll."+i.namespace+" resize."+i.namespace,function(){i.reposition()}),i.options.autoClose)if(t("body").off("."+i.namespace),"hover"==i.options.trigger){if(p&&setTimeout(function(){t("body").on("touchstart."+i.namespace,function(){i.hide()})},0),i.options.interactive){p&&i.$tooltip.on("touchstart."+i.namespace,function(t){t.stopPropagation()});var h=null;i.$elProxy.add(i.$tooltip).on("mouseleave."+i.namespace+"-autoClose",function(){clearTimeout(h),h=setTimeout(function(){i.hide()},i.options.interactiveTolerance)}).on("mouseenter."+i.namespace+"-autoClose",function(){clearTimeout(h)})}else i.$elProxy.on("mouseleave."+i.namespace+"-autoClose",function(){i.hide()});i.options.hideOnClick&&i.$elProxy.on("click."+i.namespace+"-autoClose",function(){i.hide()})}else"click"==i.options.trigger&&(setTimeout(function(){t("body").on("click."+i.namespace+" touchstart."+i.namespace,function(){i.hide()})},0),i.options.interactive&&i.$tooltip.on("click."+i.namespace+" touchstart."+i.namespace,function(t){t.stopPropagation()}))}i.options.timer>0&&(i.timerHide=setTimeout(function(){i.timerHide=null,i.hide()},i.options.timer+s))}})},_interval_set:function(){var o=this;o.checkInterval=setInterval(function(){if(0===t("body").find(o.$el).length||0===t("body").find(o.$elProxy).length||"hidden"==o.Status||0===t("body").find(o.$tooltip).length)("shown"==o.Status||"appearing"==o.Status)&&o.hide(),o._interval_cancel();else if(o.options.positionTracker){var e=o._repositionInfo(o.$elProxy),i=!1;n(e.dimension,o.elProxyPosition.dimension)&&("fixed"===o.$elProxy.css("position")?n(e.position,o.elProxyPosition.position)&&(i=!0):n(e.offset,o.elProxyPosition.offset)&&(i=!0)),i||(o.reposition(),o.options.positionTrackerCallback.call(o,o.$el))}},200)},_interval_cancel:function(){clearInterval(this.checkInterval),this.checkInterval=null},_content_set:function(t){"object"==typeof t&&null!==t&&this.options.contentCloning&&(t=t.clone(!0)),this.Content=t},_content_insert:function(){var t=this,o=this.$tooltip.find(".tooltipster-content");"string"!=typeof t.Content||t.options.contentAsHTML?o.empty().append(t.Content):o.text(t.Content)},_update:function(t){var o=this;o._content_set(t),null!==o.Content?"hidden"!==o.Status&&(o._content_insert(),o.reposition(),o.options.updateAnimation&&(r()?(o.$tooltip.css({width:"","-webkit-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-moz-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-o-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-ms-transition":"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms",transition:"all "+o.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms"}).addClass("tooltipster-content-changing"),setTimeout(function(){"hidden"!=o.Status&&(o.$tooltip.removeClass("tooltipster-content-changing"),setTimeout(function(){"hidden"!==o.Status&&o.$tooltip.css({"-webkit-transition":o.options.speed+"ms","-moz-transition":o.options.speed+"ms","-o-transition":o.options.speed+"ms","-ms-transition":o.options.speed+"ms",transition:o.options.speed+"ms"})},o.options.speed))},o.options.speed)):o.$tooltip.fadeTo(o.options.speed,.5,function(){"hidden"!=o.Status&&o.$tooltip.fadeTo(o.options.speed,1)}))):o.hide()},_repositionInfo:function(t){return{dimension:{height:t.outerHeight(!1),width:t.outerWidth(!1)},offset:t.offset(),position:{left:parseInt(t.css("left")),top:parseInt(t.css("top"))}}},hide:function(e){var i=this;e&&i.callbacks.hide.push(e),i.callbacks.show=[],clearTimeout(i.timerShow),i.timerShow=null,clearTimeout(i.timerHide),i.timerHide=null;var n=function(){t.each(i.callbacks.hide,function(t,o){o.call(i.$el)}),i.callbacks.hide=[]};if("shown"==i.Status||"appearing"==i.Status){i.Status="disappearing";var s=function(){i.Status="hidden","object"==typeof i.Content&&null!==i.Content&&i.Content.detach(),i.$tooltip.remove(),i.$tooltip=null,t(o).off("."+i.namespace),t("body").off("."+i.namespace).css("overflow-x",i.bodyOverflowX),t("body").off("."+i.namespace),i.$elProxy.off("."+i.namespace+"-autoClose"),i.options.functionAfter.call(i.$el,i.$el),n()};r()?(i.$tooltip.clearQueue().removeClass("tooltipster-"+i.options.animation+"-show").addClass("tooltipster-dying"),i.options.speed>0&&i.$tooltip.delay(i.options.speed),i.$tooltip.queue(s)):i.$tooltip.stop().fadeOut(i.options.speed,s)}else"hidden"==i.Status&&n();return i},show:function(t){return this._showNow(t),this},update:function(t){return this.content(t)},content:function(t){return"undefined"==typeof t?this.Content:(this._update(t),this)},reposition:function(){function e(){var e=t(o).scrollLeft();0>M-e&&(s=M-e,M=e),M+l-e>r&&(s=M-(r+e-l),M=r+e-l)}function i(e,i){a.offset.top-t(o).scrollTop()-f-A-12<0&&i.indexOf("top")>-1&&(F=e),a.offset.top+a.dimension.height+f+12+A>t(o).scrollTop()+t(o).height()&&i.indexOf("bottom")>-1&&(F=e,W=a.offset.top-f-A-12)}var n=this;if(0!==t("body").find(n.$tooltip).length){n.$tooltip.css("width",""),n.elProxyPosition=n._repositionInfo(n.$elProxy);var s=null,r=t(o).width(),a=n.elProxyPosition,l=n.$tooltip.outerWidth(!1),p=n.$tooltip.innerWidth()+1,f=n.$tooltip.outerHeight(!1);if(n.$elProxy.is("area")){var d=n.$elProxy.attr("shape"),c=n.$elProxy.parent().attr("name"),h=t('img[usemap="#'+c+'"]'),u=h.offset().left,m=h.offset().top,v=void 0!==n.$elProxy.attr("coords")?n.$elProxy.attr("coords").split(","):void 0;if("circle"==d){var g=parseInt(v[0]),y=parseInt(v[1]),w=parseInt(v[2]);a.dimension.height=2*w,a.dimension.width=2*w,a.offset.top=m+y-w,a.offset.left=u+g-w}else if("rect"==d){var g=parseInt(v[0]),y=parseInt(v[1]),b=parseInt(v[2]),x=parseInt(v[3]);a.dimension.height=x-y,a.dimension.width=b-g,a.offset.top=m+y,a.offset.left=u+g}else if("poly"==d){for(var C=[],P=[],T=0,_=0,k=0,I=0,S="even",O=0;O<v.length;O++){var H=parseInt(v[O]);"even"==S?(H>k&&(k=H,0===O&&(T=k)),T>H&&(T=H),S="odd"):(H>I&&(I=H,1==O&&(_=I)),_>H&&(_=H),S="even")}a.dimension.height=I-_,a.dimension.width=k-T,a.offset.top=m+_,a.offset.left=u+T}else a.dimension.height=h.outerHeight(!1),a.dimension.width=h.outerWidth(!1),a.offset.top=m,a.offset.left=u}var M=0,D=0,W=0,A=parseInt(n.options.offsetY),z=parseInt(n.options.offsetX),F=n.options.position;if("top"==F){var N=a.offset.left+l-(a.offset.left+a.dimension.width);M=a.offset.left+z-N/2,W=a.offset.top-f-A-12,e(),i("bottom","top")}if("top-left"==F&&(M=a.offset.left+z,W=a.offset.top-f-A-12,e(),i("bottom-left","top-left")),"top-right"==F&&(M=a.offset.left+a.dimension.width+z-l,W=a.offset.top-f-A-12,e(),i("bottom-right","top-right")),"bottom"==F){var N=a.offset.left+l-(a.offset.left+a.dimension.width);M=a.offset.left-N/2+z,W=a.offset.top+a.dimension.height+A+12,e(),i("top","bottom")}if("bottom-left"==F&&(M=a.offset.left+z,W=a.offset.top+a.dimension.height+A+12,e(),i("top-left","bottom-left")),"bottom-right"==F&&(M=a.offset.left+a.dimension.width+z-l,W=a.offset.top+a.dimension.height+A+12,e(),i("top-right","bottom-right")),"left"==F){M=a.offset.left-z-l-12,D=a.offset.left+z+a.dimension.width+12;var X=a.offset.top+f-(a.offset.top+a.dimension.height);if(W=a.offset.top-X/2-A,0>M&&D+l>r){var q=2*parseFloat(n.$tooltip.css("border-width")),j=l+M-q;n.$tooltip.css("width",j+"px"),f=n.$tooltip.outerHeight(!1),M=a.offset.left-z-j-12-q,X=a.offset.top+f-(a.offset.top+a.dimension.height),W=a.offset.top-X/2-A}else 0>M&&(M=a.offset.left+z+a.dimension.width+12,s="left")}if("right"==F){M=a.offset.left+z+a.dimension.width+12,D=a.offset.left-z-l-12;var X=a.offset.top+f-(a.offset.top+a.dimension.height);if(W=a.offset.top-X/2-A,M+l>r&&0>D){var q=2*parseFloat(n.$tooltip.css("border-width")),j=r-M-q;n.$tooltip.css("width",j+"px"),f=n.$tooltip.outerHeight(!1),X=a.offset.top+f-(a.offset.top+a.dimension.height),W=a.offset.top-X/2-A}else M+l>r&&(M=a.offset.left-z-l-12,s="right")}if(n.options.arrow){var E="tooltipster-arrow-"+F;if(n.options.arrowColor.length<1)var L=n.$tooltip.css("background-color");else var L=n.options.arrowColor;if(s?"left"==s?(E="tooltipster-arrow-right",s=""):"right"==s?(E="tooltipster-arrow-left",s=""):s="left:"+Math.round(s)+"px;":s="","top"==F||"top-left"==F||"top-right"==F)var Q=parseFloat(n.$tooltip.css("border-bottom-width")),U=n.$tooltip.css("border-bottom-color");else if("bottom"==F||"bottom-left"==F||"bottom-right"==F)var Q=parseFloat(n.$tooltip.css("border-top-width")),U=n.$tooltip.css("border-top-color");else if("left"==F)var Q=parseFloat(n.$tooltip.css("border-right-width")),U=n.$tooltip.css("border-right-color");else if("right"==F)var Q=parseFloat(n.$tooltip.css("border-left-width")),U=n.$tooltip.css("border-left-color");else var Q=parseFloat(n.$tooltip.css("border-bottom-width")),U=n.$tooltip.css("border-bottom-color");Q>1&&Q++;var Y="";if(0!==Q){var B="",R="border-color: "+U+";";-1!==E.indexOf("bottom")?B="margin-top: -"+Math.round(Q)+"px;":-1!==E.indexOf("top")?B="margin-bottom: -"+Math.round(Q)+"px;":-1!==E.indexOf("left")?B="margin-right: -"+Math.round(Q)+"px;":-1!==E.indexOf("right")&&(B="margin-left: -"+Math.round(Q)+"px;"),Y='<span class="tooltipster-arrow-border" style="'+B+" "+R+';"></span>'}n.$tooltip.find(".tooltipster-arrow").remove();var K='<div class="'+E+' tooltipster-arrow" style="'+s+'">'+Y+'<span style="border-color:'+L+';"></span></div>';n.$tooltip.append(K)}n.$tooltip.css({top:Math.round(W)+"px",left:Math.round(M)+"px"})}return n},enable:function(){return this.enabled=!0,this},disable:function(){return this.hide(),this.enabled=!1,this},destroy:function(){var o=this;o.hide(),o.$el[0]!==o.$elProxy[0]&&o.$elProxy.remove(),o.$el.removeData(o.namespace).off("."+o.namespace);var e=o.$el.data("tooltipster-ns");if(1===e.length){var i=null;"previous"===o.options.restoration?i=o.$el.data("tooltipster-initialTitle"):"current"===o.options.restoration&&(i="string"==typeof o.Content?o.Content:t("<div></div>").append(o.Content).html()),i&&o.$el.attr("title",i),o.$el.removeClass("tooltipstered").removeData("tooltipster-ns").removeData("tooltipster-initialTitle")}else e=t.grep(e,function(t,e){return t!==o.namespace}),o.$el.data("tooltipster-ns",e);return o},elementIcon:function(){return this.$el[0]!==this.$elProxy[0]?this.$elProxy[0]:void 0},elementTooltip:function(){return this.$tooltip?this.$tooltip[0]:void 0},option:function(t,o){return"undefined"==typeof o?this.options[t]:(this.options[t]=o,this)},status:function(){return this.Status}},t.fn[a]=function(){var o=arguments;if(0===this.length){if("string"==typeof o[0]){var e=!0;switch(o[0]){case"setDefaults":t.extend(l,o[1]);break;default:e=!1}return e?!0:this}return this}if("string"==typeof o[0]){var n="#*$~&";return this.each(function(){var e=t(this).data("tooltipster-ns"),i=e?t(this).data(e[0]):null;if(!i)throw new Error("You called Tooltipster's \""+o[0]+'" method on an uninitialized element');if("function"!=typeof i[o[0]])throw new Error('Unknown method .tooltipster("'+o[0]+'")');var s=i[o[0]](o[1],o[2]);return s!==i?(n=s,!1):void 0}),"#*$~&"!==n?n:this}var s=[],r=o[0]&&"undefined"!=typeof o[0].multiple,a=r&&o[0].multiple||!r&&l.multiple,p=o[0]&&"undefined"!=typeof o[0].debug,f=p&&o[0].debug||!p&&l.debug;return this.each(function(){var e=!1,n=t(this).data("tooltipster-ns"),r=null;n?a?e=!0:f&&console.log('Tooltipster: one or more tooltips are already attached to this element: ignoring. Use the "multiple" option to attach more tooltips.'):e=!0,e&&(r=new i(this,o[0]),n||(n=[]),n.push(r.namespace),t(this).data("tooltipster-ns",n),t(this).data(r.namespace,r)),s.push(r)}),a?s:this};var p=!!("ontouchstart"in o),f=!1;t("body").one("mousemove",function(){f=!0})}(jQuery,window,document);

function Tree(){var t=this;t.build_tree=function(e){var s=t.dyn_tree,r=t.stat_desc.static_tree,n=t.stat_desc.elems,o,i=-1,a;for(e.heap_len=0,e.heap_max=HEAP_SIZE,o=0;n>o;o++)0!==s[2*o]?(e.heap[++e.heap_len]=i=o,e.depth[o]=0):s[2*o+1]=0;for(;2>e.heap_len;)a=e.heap[++e.heap_len]=2>i?++i:0,s[2*a]=1,e.depth[a]=0,e.opt_len--,r&&(e.static_len-=r[2*a+1]);for(t.max_code=i,o=Math.floor(e.heap_len/2);o>=1;o--)e.pqdownheap(s,o);a=n;do o=e.heap[1],e.heap[1]=e.heap[e.heap_len--],e.pqdownheap(s,1),r=e.heap[1],e.heap[--e.heap_max]=o,e.heap[--e.heap_max]=r,s[2*a]=s[2*o]+s[2*r],e.depth[a]=Math.max(e.depth[o],e.depth[r])+1,s[2*o+1]=s[2*r+1]=a,e.heap[1]=a++,e.pqdownheap(s,1);while(2<=e.heap_len);e.heap[--e.heap_max]=e.heap[1],o=t.dyn_tree;for(var i=t.stat_desc.static_tree,u=t.stat_desc.extra_bits,c=t.stat_desc.extra_base,l=t.stat_desc.max_length,f,d,w=0,n=0;MAX_BITS>=n;n++)e.bl_count[n]=0;for(o[2*e.heap[e.heap_max]+1]=0,a=e.heap_max+1;HEAP_SIZE>a;a++)r=e.heap[a],n=o[2*o[2*r+1]+1]+1,n>l&&(n=l,w++),o[2*r+1]=n,r>t.max_code||(e.bl_count[n]++,f=0,r>=c&&(f=u[r-c]),d=o[2*r],e.opt_len+=d*(n+f),i&&(e.static_len+=d*(i[2*r+1]+f)));if(0!==w){do{for(n=l-1;0===e.bl_count[n];)n--;e.bl_count[n]--,e.bl_count[n+1]+=2,e.bl_count[l]--,w-=2}while(w>0);for(n=l;0!==n;n--)for(r=e.bl_count[n];0!==r;)i=e.heap[--a],i>t.max_code||(o[2*i+1]!=n&&(e.opt_len+=(n-o[2*i+1])*o[2*i],o[2*i+1]=n),r--)}for(o=t.max_code,a=e.bl_count,e=[],r=0,n=1;MAX_BITS>=n;n++)e[n]=r=r+a[n-1]<<1;for(a=0;o>=a;a++)if(u=s[2*a+1],0!==u){r=s,n=2*a,i=e[u]++,c=0;do c|=1&i,i>>>=1,c<<=1;while(0<--u);r[n]=c>>>1}}}function StaticTree(t,e,s,r,n){this.static_tree=t,this.extra_bits=e,this.extra_base=s,this.elems=r,this.max_length=n}function Config(t,e,s,r,n){this.good_length=t,this.max_lazy=e,this.nice_length=s,this.max_chain=r,this.func=n}function smaller(t,e,s,r){var n=t[2*e];return t=t[2*s],t>n||n==t&&r[e]<=r[s]}function Deflate(){function t(){var t;for(t=0;L_CODES>t;t++)G[2*t]=0;for(t=0;D_CODES>t;t++)Y[2*t]=0;for(t=0;BL_CODES>t;t++)J[2*t]=0;G[2*END_BLOCK]=1,rt=ot=y.opt_len=y.static_len=0}function e(t,e){var s,r=-1,n,o=t[1],i=0,a=7,u=4;for(0===o&&(a=138,u=3),t[2*(e+1)+1]=65535,s=0;e>=s;s++)n=o,o=t[2*(s+1)+1],++i<a&&n==o||(u>i?J[2*n]+=i:0!==n?(n!=r&&J[2*n]++,J[2*REP_3_6]++):10>=i?J[2*REPZ_3_10]++:J[2*REPZ_11_138]++,i=0,r=n,0===o?(a=138,u=3):n==o?(a=6,u=3):(a=7,u=4))}function s(t){y.pending_buf[y.pending++]=t}function r(t){s(255&t),s(t>>>8&255)}function n(t,e){ut>Buf_size-e?(at|=t<<ut&65535,r(at),at=t>>>Buf_size-ut,ut+=e-Buf_size):(at|=t<<ut&65535,ut+=e)}function o(t,e){var s=2*t;n(65535&e[s],65535&e[s+1])}function i(t,e){var s,r=-1,i,a=t[1],u=0,c=7,l=4;for(0===a&&(c=138,l=3),s=0;e>=s;s++)if(i=a,a=t[2*(s+1)+1],!(++u<c&&i==a)){if(l>u){do o(i,J);while(0!==--u)}else 0!==i?(i!=r&&(o(i,J),u--),o(REP_3_6,J),n(u-3,2)):10>=u?(o(REPZ_3_10,J),n(u-3,3)):(o(REPZ_11_138,J),n(u-11,7));u=0,r=i,0===a?(c=138,l=3):i==a?(c=6,l=3):(c=7,l=4)}}function a(){16==ut?(r(at),ut=at=0):ut>=8&&(s(255&at),at>>>=8,ut-=8)}function u(t,e){var s,r,n;if(y.pending_buf[nt+2*rt]=t>>>8&255,y.pending_buf[nt+2*rt+1]=255&t,y.pending_buf[et+rt]=255&e,rt++,0===t?G[2*e]++:(ot++,t--,G[2*(Tree._length_code[e]+LITERALS+1)]++,Y[2*Tree.d_code(t)]++),0===(8191&rt)&&Z>2){for(s=8*rt,r=L-z,n=0;D_CODES>n;n++)s+=Y[2*n]*(5+Tree.extra_dbits[n]);if(ot<Math.floor(rt/2)&&s>>>3<Math.floor(r/2))return!0}return rt==st-1}function c(t,e){var s,r,i=0,a,u;if(0!==rt)do s=y.pending_buf[nt+2*i]<<8&65280|255&y.pending_buf[nt+2*i+1],r=255&y.pending_buf[et+i],i++,0===s?o(r,t):(a=Tree._length_code[r],o(a+LITERALS+1,t),u=Tree.extra_lbits[a],0!==u&&(r-=Tree.base_length[a],n(r,u)),s--,a=Tree.d_code(s),o(a,e),u=Tree.extra_dbits[a],0!==u&&(s-=Tree.base_dist[a],n(s,u)));while(rt>i);o(END_BLOCK,t),it=t[2*END_BLOCK+1]}function l(){ut>8?r(at):ut>0&&s(255&at),ut=at=0}function f(t,e,s){n((STORED_BLOCK<<1)+(s?1:0),3),l(),it=8,r(e),r(~e),y.pending_buf.set(S.subarray(t,t+e),y.pending),y.pending+=e}function d(s){var r=z>=0?z:-1,o=L-z,a,u,d=0;if(Z>0){for(V.build_tree(y),Q.build_tree(y),e(G,V.max_code),e(Y,Q.max_code),tt.build_tree(y),d=BL_CODES-1;d>=3&&0===J[2*Tree.bl_order[d]+1];d--);y.opt_len+=3*(d+1)+14,a=y.opt_len+3+7>>>3,u=y.static_len+3+7>>>3,a>=u&&(a=u)}else a=u=o+5;if(a>=o+4&&-1!=r)f(r,o,s);else if(u==a)n((STATIC_TREES<<1)+(s?1:0),3),c(StaticTree.static_ltree,StaticTree.static_dtree);else{for(n((DYN_TREES<<1)+(s?1:0),3),r=V.max_code+1,o=Q.max_code+1,d+=1,n(r-257,5),n(o-1,5),n(d-4,4),a=0;d>a;a++)n(J[2*Tree.bl_order[a]+1],3);i(G,r-1),i(Y,o-1),c(G,Y)}t(),s&&l(),z=L,v.flush_pending()}function w(){var t,e,s,r;do{if(r=T-B-L,0===r&&0===L&&0===B)r=x;else if(-1==r)r--;else if(L>=x+x-MIN_LOOKAHEAD){S.set(S.subarray(x,x+x),0),H-=x,L-=x,z-=x,s=t=F;do e=65535&E[--s],E[s]=e>=x?e-x:0;while(0!==--t);s=t=x;do e=65535&A[--s],A[s]=e>=x?e-x:0;while(0!==--t);r+=x}if(0===v.avail_in)break;t=v.read_buf(S,L+B,r),B+=t,B>=MIN_MATCH&&(R=255&S[L],R=(R<<O^255&S[L+1])&C)}while(MIN_LOOKAHEAD>B&&0!==v.avail_in)}function m(t){var e=65535,s;for(e>g-5&&(e=g-5);;){if(1>=B){if(w(),0===B&&t==Z_NO_FLUSH)return NeedMore;if(0===B)break}if(L+=B,B=0,s=z+e,(0===L||L>=s)&&(B=L-s,L=s,d(!1),0===v.avail_out))return NeedMore;if(L-z>=x-MIN_LOOKAHEAD&&(d(!1),0===v.avail_out))return NeedMore}return d(t==Z_FINISH),0===v.avail_out?t==Z_FINISH?FinishStarted:NeedMore:t==Z_FINISH?FinishDone:BlockDone}function h(t){var e=P,s=L,r,n=U,o=L>x-MIN_LOOKAHEAD?L-(x-MIN_LOOKAHEAD):0,i=X,a=k,u=L+MAX_MATCH,c=S[s+n-1],l=S[s+n];U>=W&&(e>>=2),i>B&&(i=B);do if(r=t,S[r+n]==l&&S[r+n-1]==c&&S[r]==S[s]&&S[++r]==S[s+1]){s+=2,r++;do;while(S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&S[++s]==S[++r]&&u>s);if(r=MAX_MATCH-(u-s),s=u-MAX_MATCH,r>n){if(H=t,n=r,r>=i)break;c=S[s+n-1],l=S[s+n]}}while((t=65535&A[t&a])>o&&0!==--e);return B>=n?n:B}function p(t){for(var e=0,s,r;;){if(MIN_LOOKAHEAD>B){if(w(),MIN_LOOKAHEAD>B&&t==Z_NO_FLUSH)return NeedMore;if(0===B)break}if(B>=MIN_MATCH&&(R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,e=65535&E[R],A[L&k]=E[R],E[R]=L),U=N,M=H,N=MIN_MATCH-1,0!==e&&j>U&&x-MIN_LOOKAHEAD>=(L-e&65535)&&(K!=Z_HUFFMAN_ONLY&&(N=h(e)),5>=N&&(K==Z_FILTERED||N==MIN_MATCH&&L-H>4096)&&(N=MIN_MATCH-1)),U>=MIN_MATCH&&U>=N){r=L+B-MIN_MATCH,s=u(L-1-M,U-MIN_MATCH),B-=U-1,U-=2;do++L<=r&&(R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,e=65535&E[R],A[L&k]=E[R],E[R]=L);while(0!==--U);if(D=0,N=MIN_MATCH-1,L++,s&&(d(!1),0===v.avail_out))return NeedMore}else if(0!==D){if((s=u(0,255&S[L-1]))&&d(!1),L++,B--,0===v.avail_out)return NeedMore}else D=1,L++,B--}return 0!==D&&(u(0,255&S[L-1]),D=0),d(t==Z_FINISH),0===v.avail_out?t==Z_FINISH?FinishStarted:NeedMore:t==Z_FINISH?FinishDone:BlockDone}var y=this,v,_,g,q,x,b,k,S,T,A,E,R,F,I,C,O,z,N,M,D,L,H,B,U,P,j,Z,K,W,X,G,Y,J,V=new Tree,Q=new Tree,tt=new Tree;y.depth=[];var et,st,rt,nt,ot,it,at,ut;y.bl_count=[],y.heap=[],G=[],Y=[],J=[],y.pqdownheap=function(t,e){for(var s=y.heap,r=s[e],n=e<<1;n<=y.heap_len&&(n<y.heap_len&&smaller(t,s[n+1],s[n],y.depth)&&n++,!smaller(t,r,s[n],y.depth));)s[e]=s[n],e=n,n<<=1;s[e]=r},y.deflateInit=function(e,s,r,n,o,i){if(n||(n=Z_DEFLATED),o||(o=DEF_MEM_LEVEL),i||(i=Z_DEFAULT_STRATEGY),e.msg=null,s==Z_DEFAULT_COMPRESSION&&(s=6),1>o||o>MAX_MEM_LEVEL||n!=Z_DEFLATED||9>r||r>15||0>s||s>9||0>i||i>Z_HUFFMAN_ONLY)return Z_STREAM_ERROR;for(e.dstate=y,b=r,x=1<<b,k=x-1,I=o+7,F=1<<I,C=F-1,O=Math.floor((I+MIN_MATCH-1)/MIN_MATCH),S=new Uint8Array(2*x),A=[],E=[],st=1<<o+6,y.pending_buf=new Uint8Array(4*st),g=4*st,nt=Math.floor(st/2),et=3*st,Z=s,K=i,e.total_in=e.total_out=0,e.msg=null,y.pending=0,y.pending_out=0,_=BUSY_STATE,q=Z_NO_FLUSH,V.dyn_tree=G,V.stat_desc=StaticTree.static_l_desc,Q.dyn_tree=Y,Q.stat_desc=StaticTree.static_d_desc,tt.dyn_tree=J,tt.stat_desc=StaticTree.static_bl_desc,ut=at=0,it=8,t(),T=2*x,e=E[F-1]=0;F-1>e;e++)E[e]=0;return j=config_table[Z].max_lazy,W=config_table[Z].good_length,X=config_table[Z].nice_length,P=config_table[Z].max_chain,B=z=L=0,N=U=MIN_MATCH-1,R=D=0,Z_OK},y.deflateEnd=function(){return _!=INIT_STATE&&_!=BUSY_STATE&&_!=FINISH_STATE?Z_STREAM_ERROR:(S=A=E=y.pending_buf=null,y.dstate=null,_==BUSY_STATE?Z_DATA_ERROR:Z_OK)},y.deflateParams=function(t,e,s){var r=Z_OK;return e==Z_DEFAULT_COMPRESSION&&(e=6),0>e||e>9||0>s||s>Z_HUFFMAN_ONLY?Z_STREAM_ERROR:(config_table[Z].func!=config_table[e].func&&0!==t.total_in&&(r=t.deflate(Z_PARTIAL_FLUSH)),Z!=e&&(Z=e,j=config_table[Z].max_lazy,W=config_table[Z].good_length,X=config_table[Z].nice_length,P=config_table[Z].max_chain),K=s,r)},y.deflateSetDictionary=function(t,e,s){t=s;var r=0;if(!e||_!=INIT_STATE)return Z_STREAM_ERROR;if(MIN_MATCH>t)return Z_OK;for(t>x-MIN_LOOKAHEAD&&(t=x-MIN_LOOKAHEAD,r=s-t),S.set(e.subarray(r,r+t),0),z=L=t,R=255&S[0],R=(R<<O^255&S[1])&C,e=0;t-MIN_MATCH>=e;e++)R=(R<<O^255&S[e+(MIN_MATCH-1)])&C,A[e&k]=E[R],E[R]=e;return Z_OK},y.deflate=function(t,e){var r,i,c;if(e>Z_FINISH||0>e)return Z_STREAM_ERROR;if(!t.next_out||!t.next_in&&0!==t.avail_in||_==FINISH_STATE&&e!=Z_FINISH)return t.msg=z_errmsg[Z_NEED_DICT-Z_STREAM_ERROR],Z_STREAM_ERROR;if(0===t.avail_out)return t.msg=z_errmsg[Z_NEED_DICT-Z_BUF_ERROR],Z_BUF_ERROR;if(v=t,r=q,q=e,_==INIT_STATE&&(i=Z_DEFLATED+(b-8<<4)<<8,c=(Z-1&255)>>1,c>3&&(c=3),i|=c<<6,0!==L&&(i|=PRESET_DICT),_=BUSY_STATE,i+=31-i%31,s(i>>8&255),s(255&i)),0!==y.pending){if(v.flush_pending(),0===v.avail_out)return q=-1,Z_OK}else if(0===v.avail_in&&r>=e&&e!=Z_FINISH)return v.msg=z_errmsg[Z_NEED_DICT-Z_BUF_ERROR],Z_BUF_ERROR;if(_==FINISH_STATE&&0!==v.avail_in)return t.msg=z_errmsg[Z_NEED_DICT-Z_BUF_ERROR],Z_BUF_ERROR;if(0!==v.avail_in||0!==B||e!=Z_NO_FLUSH&&_!=FINISH_STATE){switch(r=-1,config_table[Z].func){case STORED:r=m(e);break;case FAST:t:{for(r=0;;){if(MIN_LOOKAHEAD>B){if(w(),MIN_LOOKAHEAD>B&&e==Z_NO_FLUSH){r=NeedMore;break t}if(0===B)break}if(B>=MIN_MATCH&&(R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,r=65535&E[R],A[L&k]=E[R],E[R]=L),0!==r&&x-MIN_LOOKAHEAD>=(L-r&65535)&&K!=Z_HUFFMAN_ONLY&&(N=h(r)),N>=MIN_MATCH)if(i=u(L-H,N-MIN_MATCH),B-=N,j>=N&&B>=MIN_MATCH){N--;do L++,R=(R<<O^255&S[L+(MIN_MATCH-1)])&C,r=65535&E[R],A[L&k]=E[R],E[R]=L;while(0!==--N);L++}else L+=N,N=0,R=255&S[L],R=(R<<O^255&S[L+1])&C;else i=u(0,255&S[L]),B--,L++;if(i&&(d(!1),0===v.avail_out)){r=NeedMore;break t}}d(e==Z_FINISH),r=0===v.avail_out?e==Z_FINISH?FinishStarted:NeedMore:e==Z_FINISH?FinishDone:BlockDone}break;case SLOW:r=p(e)}if((r==FinishStarted||r==FinishDone)&&(_=FINISH_STATE),r==NeedMore||r==FinishStarted)return 0===v.avail_out&&(q=-1),Z_OK;if(r==BlockDone){if(e==Z_PARTIAL_FLUSH)n(STATIC_TREES<<1,3),o(END_BLOCK,StaticTree.static_ltree),a(),9>1+it+10-ut&&(n(STATIC_TREES<<1,3),o(END_BLOCK,StaticTree.static_ltree),a()),it=7;else if(f(0,0,!1),e==Z_FULL_FLUSH)for(r=0;F>r;r++)E[r]=0;if(v.flush_pending(),0===v.avail_out)return q=-1,Z_OK}}return e!=Z_FINISH?Z_OK:Z_STREAM_END}}function ZStream(){this.total_out=this.avail_out=this.total_in=this.avail_in=this.next_out_index=this.next_in_index=0}function Deflater(t){var e=new ZStream,s=Z_NO_FLUSH,r=new Uint8Array(512);"undefined"==typeof t&&(t=Z_DEFAULT_COMPRESSION),e.deflateInit(t),e.next_out=r,this.append=function(t,n){var o,i=[],a=0,u=0,c=0,l;if(t.length){e.next_in_index=0,e.next_in=t,e.avail_in=t.length;do{if(e.next_out_index=0,e.avail_out=512,o=e.deflate(s),o!=Z_OK)throw"deflating: "+e.msg;e.next_out_index&&(512==e.next_out_index?i.push(new Uint8Array(r)):i.push(new Uint8Array(r.subarray(0,e.next_out_index)))),c+=e.next_out_index,n&&0<e.next_in_index&&e.next_in_index!=a&&(n(e.next_in_index),a=e.next_in_index)}while(0<e.avail_in||0===e.avail_out);return l=new Uint8Array(c),i.forEach(function(t){l.set(t,u),u+=t.length}),l}},this.flush=function(){var t,s=[],n=0,o=0,i;do{if(e.next_out_index=0,e.avail_out=512,t=e.deflate(Z_FINISH),t!=Z_STREAM_END&&t!=Z_OK)throw"deflating: "+e.msg;0<512-e.avail_out&&s.push(new Uint8Array(r.subarray(0,e.next_out_index))),o+=e.next_out_index}while(0<e.avail_in||0===e.avail_out);return e.deflateEnd(),i=new Uint8Array(o),s.forEach(function(t){i.set(t,n),n+=t.length}),i}}var jsPDF=function(){function t(r,n,o,i){r="undefined"==typeof r?"p":r.toString().toLowerCase(),"undefined"==typeof n&&(n="mm"),"undefined"==typeof o&&(o="a4"),"undefined"==typeof i&&"undefined"==typeof zpipe&&(i=!1);var a=o.toString().toLowerCase(),u=[],c=0,l=i;i={a0:[2383.94,3370.39],a1:[1683.78,2383.94],a2:[1190.55,1683.78],a3:[841.89,1190.55],a4:[595.28,841.89],a5:[419.53,595.28],a6:[297.64,419.53],a7:[209.76,297.64],a8:[147.4,209.76],a9:[104.88,147.4],a10:[73.7,104.88],b0:[2834.65,4008.19],b1:[2004.09,2834.65],b2:[1417.32,2004.09],b3:[1000.63,1417.32],b4:[708.66,1000.63],b5:[498.9,708.66],b6:[354.33,498.9],b7:[249.45,354.33],b8:[175.75,249.45],b9:[124.72,175.75],b10:[87.87,124.72],c0:[2599.37,3676.54],c1:[1836.85,2599.37],c2:[1298.27,1836.85],c3:[918.43,1298.27],c4:[649.13,918.43],c5:[459.21,649.13],c6:[323.15,459.21],c7:[229.61,323.15],c8:[161.57,229.61],c9:[113.39,161.57],c10:[79.37,113.39],letter:[612,792],"government-letter":[576,756],legal:[612,1008],"junior-legal":[576,360],ledger:[1224,792],tabloid:[792,1224]};var f="0 g",d=0,w=[],m=2,h=!1,p=[],y={},v={},_=16,g,q,x,b,k={title:"",subject:"",author:"",keywords:"",creator:""},S=0,T=0,A={},E=new s(A),R,F=function(t){return t.toFixed(2)},I=function(t){var e=t.toFixed(0);return 10>t?"0"+e:e},C=function(t){h?w[d].push(t):(u.push(t),c+=t.length+1)},O=function(){return m++,p[m]=c,C(m+" 0 obj"),m},z=function(t){C("stream"),C(t),C("endstream")},N,M,D,L=function(t,e){var s;s=t;var r=e,n,o,i,a,u,c;if(void 0===r&&(r={}),n=r.sourceEncoding?n:"Unicode",i=r.outputEncoding,(r.autoencode||i)&&y[g].metadata&&y[g].metadata[n]&&y[g].metadata[n].encoding&&(n=y[g].metadata[n].encoding,!i&&y[g].encoding&&(i=y[g].encoding),!i&&n.codePages&&(i=n.codePages[0]),"string"==typeof i&&(i=n[i]),i)){for(u=!1,a=[],n=0,o=s.length;o>n;n++)(c=i[s.charCodeAt(n)])?a.push(String.fromCharCode(c)):a.push(s[n]),a[n].charCodeAt(0)>>8&&(u=!0);s=a.join("")}for(n=s.length;void 0===u&&0!==n;)s.charCodeAt(n-1)>>8&&(u=!0),n--;if(u){for(a=r.noBOM?[]:[254,255],n=0,o=s.length;o>n;n++){if(c=s.charCodeAt(n),r=c>>8,r>>8)throw Error("Character at position "+n.toString(10)+" of string '"+s+"' exceeds 16bits. Cannot be encoded into UCS-2 BE");a.push(r),a.push(c-(r<<8))}s=String.fromCharCode.apply(void 0,a)}return s.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")},H=function(){d++,h=!0,w[d]=[],C(F(.200025*b)+" w"),C("0 G"),0!==S&&C(S.toString(10)+" J"),0!==T&&C(T.toString(10)+" j"),E.publish("addPage",{pageNumber:d})},B=function(t,e){var s;void 0===t&&(t=y[g].fontName),void 0===e&&(e=y[g].fontStyle);try{s=v[t][e]}catch(r){s=void 0}if(!s)throw Error("Unable to look up font label for font '"+t+"', '"+e+"'. Refer to getFontList() for available fonts.");return s},U=function(){h=!1,u=[],p=[],C("%PDF-1.3"),N=x*b,M=q*b;var t,e,s,r,n;for(t=1;d>=t;t++){if(O(),C("<</Type /Page"),C("/Parent 1 0 R"),C("/Resources 2 0 R"),C("/Contents "+(m+1)+" 0 R>>"),C("endobj"),e=w[t].join("\n"),O(),l){for(s=[],r=0;r<e.length;++r)s[r]=e.charCodeAt(r);n=adler32cs.from(e),e=new Deflater(6),e.append(new Uint8Array(s)),e=e.flush(),s=[new Uint8Array([120,156]),new Uint8Array(e),new Uint8Array([255&n,n>>8&255,n>>16&255,n>>24&255])],e="";for(r in s)s.hasOwnProperty(r)&&(e+=String.fromCharCode.apply(null,s[r]));C("<</Length "+e.length+" /Filter [/FlateDecode]>>")}else C("<</Length "+e.length+">>");z(e),C("endobj")}for(p[1]=c,C("1 0 obj"),C("<</Type /Pages"),D="/Kids [",r=0;d>r;r++)D+=3+2*r+" 0 R ";C(D+"]"),C("/Count "+d),C("/MediaBox [0 0 "+F(N)+" "+F(M)+"]"),C(">>"),C("endobj");for(var o in y)y.hasOwnProperty(o)&&(t=y[o],t.objectNumber=O(),C("<</BaseFont/"+t.PostScriptName+"/Type/Font"),"string"==typeof t.encoding&&C("/Encoding/"+t.encoding),C("/Subtype/Type1>>"),C("endobj"));E.publish("putResources"),p[2]=c,C("2 0 obj"),C("<<"),C("/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]"),C("/Font <<");for(var i in y)y.hasOwnProperty(i)&&C("/"+i+" "+y[i].objectNumber+" 0 R");for(C(">>"),C("/XObject <<"),E.publish("putXobjectDict"),C(">>"),C(">>"),C("endobj"),E.publish("postPutResources"),O(),C("<<"),C("/Producer (jsPDF 0.9.0rc2)"),k.title&&C("/Title ("+L(k.title)+")"),k.subject&&C("/Subject ("+L(k.subject)+")"),k.author&&C("/Author ("+L(k.author)+")"),k.keywords&&C("/Keywords ("+L(k.keywords)+")"),k.creator&&C("/Creator ("+L(k.creator)+")"),o=new Date,C("/CreationDate (D:"+[o.getFullYear(),I(o.getMonth()+1),I(o.getDate()),I(o.getHours()),I(o.getMinutes()),I(o.getSeconds())].join("")+")"),C(">>"),C("endobj"),O(),C("<<"),C("/Type /Catalog"),C("/Pages 1 0 R"),C("/OpenAction [3 0 R /FitH null]"),C("/PageLayout /OneColumn"),E.publish("putCatalog"),C(">>"),C("endobj"),o=c,C("xref"),C("0 "+(m+1)),C("0000000000 65535 f "),i=1;m>=i;i++)t=p[i].toFixed(0),t=10>t.length?Array(11-t.length).join("0")+t:t,C(t+" 00000 n ");return C("trailer"),C("<<"),C("/Size "+(m+1)),C("/Root "+m+" 0 R"),C("/Info "+(m-1)+" 0 R"),C(">>"),C("startxref"),C(o),C("%%EOF"),h=!0,u.join("\n")},P=function(t){var e="S";return"F"===t?e="f":("FD"===t||"DF"===t)&&(e="B"),e},j=function(t,e){var s,r,n,o;switch(t){case void 0:return U();case"save":if(navigator.getUserMedia&&(void 0===window.URL||void 0===window.URL.createObjectURL))return A.output("dataurlnewwindow");for(s=U(),r=s.length,n=new Uint8Array(new ArrayBuffer(r)),o=0;r>o;o++)n[o]=s.charCodeAt(o);s=new Blob([n],{type:"application/pdf"}),saveAs(s,e);break;case"datauristring":case"dataurlstring":return"data:application/pdf;base64,"+btoa(U());case"datauri":case"dataurl":document.location.href="data:application/pdf;base64,"+btoa(U());break;case"dataurlnewwindow":window.open("data:application/pdf;base64,"+btoa(U()));break;default:throw Error('Output type "'+t+'" is not supported.')}};if("pt"===n)b=1;else if("mm"===n)b=72/25.4;else if("cm"===n)b=72/2.54;else{if("in"!==n)throw"Invalid unit: "+n;b=72}if(i.hasOwnProperty(a))q=i[a][1]/b,x=i[a][0]/b;else try{q=o[1],x=o[0]}catch(Z){throw"Invalid format: "+o}if("p"===r||"portrait"===r)r="p",x>q&&(r=x,x=q,q=r);else{if("l"!==r&&"landscape"!==r)throw"Invalid orientation: "+r;r="l",q>x&&(r=x,x=q,q=r)}A.internal={pdfEscape:L,getStyle:P,getFont:function(){return y[B.apply(A,arguments)]},getFontSize:function(){return _},getLineHeight:function(){return 1.15*_},btoa:btoa,write:function(t,e,s,r){C(1===arguments.length?t:Array.prototype.join.call(arguments," "))},getCoordinateString:function(t){return F(t*b)},getVerticalCoordinateString:function(t){return F((q-t)*b)},collections:{},newObject:O,putStream:z,events:E,scaleFactor:b,pageSize:{width:x,height:q},output:function(t,e){return j(t,e)},getNumberOfPages:function(){return w.length-1},pages:w},A.addPage=function(){return H(),this},A.text=function(t,e,s,r){var n,o;if("number"==typeof t&&(n=t,o=e,t=s,e=n,s=o),"string"==typeof t&&t.match(/[\n\r]/)&&(t=t.split(/\r\n|\r|\n/g)),"undefined"==typeof r?r={noBOM:!0,autoencode:!0}:(void 0===r.noBOM&&(r.noBOM=!0),void 0===r.autoencode&&(r.autoencode=!0)),"string"==typeof t)r=L(t,r);else{if(!(t instanceof Array))throw Error('Type of text must be string or Array. "'+t+'" is not recognized.');for(t=t.concat(),n=t.length-1;-1!==n;n--)t[n]=L(t[n],r);r=t.join(") Tj\nT* (")}return C("BT\n/"+g+" "+_+" Tf\n"+1.15*_+" TL\n"+f+"\n"+F(e*b)+" "+F((q-s)*b)+" Td\n("+r+") Tj\nET"),this},A.line=function(t,e,s,r){return C(F(t*b)+" "+F((q-e)*b)+" m "+F(s*b)+" "+F((q-r)*b)+" l S"),this},A.lines=function(t,e,s,r,n,o){var i,a,u,c,l,f,d,w;for("number"==typeof t&&(i=t,a=e,t=s,e=i,s=a),n=P(n),r=void 0===r?[1,1]:r,C((e*b).toFixed(3)+" "+((q-s)*b).toFixed(3)+" m "),i=r[0],r=r[1],a=t.length,w=s,s=0;a>s;s++)u=t[s],2===u.length?(e=u[0]*i+e,w=u[1]*r+w,C((e*b).toFixed(3)+" "+((q-w)*b).toFixed(3)+" l")):(c=u[0]*i+e,l=u[1]*r+w,f=u[2]*i+e,d=u[3]*r+w,e=u[4]*i+e,w=u[5]*r+w,C((c*b).toFixed(3)+" "+((q-l)*b).toFixed(3)+" "+(f*b).toFixed(3)+" "+((q-d)*b).toFixed(3)+" "+(e*b).toFixed(3)+" "+((q-w)*b).toFixed(3)+" c"));return 1==o&&C(" h"),C(n),this},A.rect=function(t,e,s,r,n){return n=P(n),C([F(t*b),F((q-e)*b),F(s*b),F(-r*b),"re",n].join(" ")),this},A.triangle=function(t,e,s,r,n,o,i){return this.lines([[s-t,r-e],[n-s,o-r],[t-n,e-o]],t,e,[1,1],i,!0),this},A.roundedRect=function(t,e,s,r,n,o,i){var a=4/3*(Math.SQRT2-1);return this.lines([[s-2*n,0],[n*a,0,n,o-o*a,n,o],[0,r-2*o],[0,o*a,-(n*a),o,-n,o],[-s+2*n,0],[-(n*a),0,-n,-(o*a),-n,-o],[0,-r+2*o],[0,-(o*a),n*a,-o,n,-o]],t+n,e,[1,1],i),this},A.ellipse=function(t,e,s,r,n){n=P(n);var o=4/3*(Math.SQRT2-1)*s,i=4/3*(Math.SQRT2-1)*r;return C([F((t+s)*b),F((q-e)*b),"m",F((t+s)*b),F((q-(e-i))*b),F((t+o)*b),F((q-(e-r))*b),F(t*b),F((q-(e-r))*b),"c"].join(" ")),C([F((t-o)*b),F((q-(e-r))*b),F((t-s)*b),F((q-(e-i))*b),F((t-s)*b),F((q-e)*b),"c"].join(" ")),C([F((t-s)*b),F((q-(e+i))*b),F((t-o)*b),F((q-(e+r))*b),F(t*b),F((q-(e+r))*b),"c"].join(" ")),C([F((t+o)*b),F((q-(e+r))*b),F((t+s)*b),F((q-(e+i))*b),F((t+s)*b),F((q-e)*b),"c",n].join(" ")),this},A.circle=function(t,e,s,r){return this.ellipse(t,e,s,s,r)},A.setProperties=function(t){for(var e in k)k.hasOwnProperty(e)&&t[e]&&(k[e]=t[e]);return this},A.setFontSize=function(t){return _=t,this},A.setFont=function(t,e){return g=B(t,e),this},A.setFontStyle=A.setFontType=function(t){return g=B(void 0,t),this},A.getFontList=function(){var t={},e,s,r;for(e in v)if(v.hasOwnProperty(e))for(s in t[e]=r=[],v[e])v[e].hasOwnProperty(s)&&r.push(s);return t},A.setLineWidth=function(t){return C((t*b).toFixed(2)+" w"),this},A.setDrawColor=function(t,e,s,r){return t=void 0===e||void 0===r&&t===e===s?"string"==typeof t?t+" G":F(t/255)+" G":void 0===r?"string"==typeof t?[t,e,s,"RG"].join(" "):[F(t/255),F(e/255),F(s/255),"RG"].join(" "):"string"==typeof t?[t,e,s,r,"K"].join(" "):[F(t),F(e),F(s),F(r),"K"].join(" "),C(t),this},A.setFillColor=function(t,e,s,r){return t=void 0===e||void 0===r&&t===e===s?"string"==typeof t?t+" g":F(t/255)+" g":void 0===r?"string"==typeof t?[t,e,s,"rg"].join(" "):[F(t/255),F(e/255),F(s/255),"rg"].join(" "):"string"==typeof t?[t,e,s,r,"k"].join(" "):[F(t),F(e),F(s),F(r),"k"].join(" "),C(t),this},A.setTextColor=function(t,e,s){return f=0===t&&0===e&&0===s||"undefined"==typeof e?(t/255).toFixed(3)+" g":[(t/255).toFixed(3),(e/255).toFixed(3),(s/255).toFixed(3),"rg"].join(" "),this},A.CapJoinStyles={0:0,butt:0,but:0,miter:0,1:1,round:1,rounded:1,circle:1,2:2,projecting:2,project:2,square:2,bevel:2},A.setLineCap=function(t){var e=this.CapJoinStyles[t];if(void 0===e)throw Error("Line cap style of '"+t+"' is not recognized. See or extend .CapJoinStyles property for valid styles");return S=e,C(e.toString(10)+" J"),this},A.setLineJoin=function(t){var e=this.CapJoinStyles[t];if(void 0===e)throw Error("Line join style of '"+t+"' is not recognized. See or extend .CapJoinStyles property for valid styles");return T=e,C(e.toString(10)+" j"),this},A.output=j,A.save=function(t){A.output("save",t)};for(R in t.API)t.API.hasOwnProperty(R)&&("events"===R&&t.API.events.length?function(t,e){var s,r,n;for(n=e.length-1;-1!==n;n--)s=e[n][0],r=e[n][1],t.subscribe.apply(t,[s].concat("function"==typeof r?[r]:r))}(E,t.API.events):A[R]=t.API[R]);return function(){var t=[["Helvetica","helvetica","normal"],["Helvetica-Bold","helvetica","bold"],["Helvetica-Oblique","helvetica","italic"],["Helvetica-BoldOblique","helvetica","bolditalic"],["Courier","courier","normal"],["Courier-Bold","courier","bold"],["Courier-Oblique","courier","italic"],["Courier-BoldOblique","courier","bolditalic"],["Times-Roman","times","normal"],["Times-Bold","times","bold"],["Times-Italic","times","italic"],["Times-BoldItalic","times","bolditalic"]],s,r,n,o;for(s=0,r=t.length;r>s;s++){var i=t[s][0],a=t[s][1];n=t[s][2],o="F"+(e(y)+1).toString(10);var i=y[o]={id:o,PostScriptName:i,fontName:a,fontStyle:n,encoding:"StandardEncoding",metadata:{}},u=o;void 0===v[a]&&(v[a]={}),v[a][n]=u,E.publish("addFont",i),n=o,o=t[s][0].split("-"),i=o[0],o=o[1]||"",void 0===v[i]&&(v[i]={}),v[i][o]=n}E.publish("addFonts",{fonts:y,dictionary:v})}(),g="F1",H(),E.publish("initialized"),A}"undefined"==typeof btoa&&(window.btoa=function(t){var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split(""),s,r,n,o,i=0,a=0,u="",u=[];do s=t.charCodeAt(i++),r=t.charCodeAt(i++),n=t.charCodeAt(i++),o=s<<16|r<<8|n,s=o>>18&63,r=o>>12&63,n=o>>6&63,o&=63,u[a++]=e[s]+e[r]+e[n]+e[o];while(i<t.length);return u=u.join(""),t=t.length%3,(t?u.slice(0,t-3):u)+"===".slice(t||3)}),"undefined"==typeof atob&&(window.atob=function(t){var e,s,r,n,o,i=0,a=0;n="";var u=[];if(!t)return t;t+="";do e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(t.charAt(i++)),r=e<<18|s<<12|n<<6|o,e=r>>16&255,s=r>>8&255,r&=255,64===n?u[a++]=String.fromCharCode(e):64===o?u[a++]=String.fromCharCode(e,s):u[a++]=String.fromCharCode(e,s,r);while(i<t.length);return n=u.join("")});var e="function"==typeof Object.keys?function(t){return Object.keys(t).length}:function(t){var e=0,s;for(s in t)t.hasOwnProperty(s)&&e++;return e},s=function(t){this.topics={},this.context=t,this.publish=function(t,e){if(this.topics[t]){var s=this.topics[t],r=[],n,o,i,a,u=function(){};for(e=Array.prototype.slice.call(arguments,1),o=0,i=s.length;i>o;o++)a=s[o],n=a[0],a[1]&&(a[0]=u,r.push(o)),n.apply(this.context,e);for(o=0,i=r.length;i>o;o++)s.splice(r[o],1)}},this.subscribe=function(t,e,s){return this.topics[t]?this.topics[t].push([e,s]):this.topics[t]=[[e,s]],{topic:t,callback:e}},this.unsubscribe=function(t){if(this.topics[t.topic]){var e=this.topics[t.topic],s,r;for(s=0,r=e.length;r>s;s++)e[s][0]===t.callback&&e.splice(s,1)}}};return t.API={events:[]},t}();!function(t){var e=function(){var t=this.internal.collections.addImage_images,e;for(e in t){var s=t[e],r=this.internal.newObject(),n=this.internal.write,o=this.internal.putStream;if(s.n=r,n("<</Type /XObject"),n("/Subtype /Image"),n("/Width "+s.w),n("/Height "+s.h),"Indexed"===s.cs?n("/ColorSpace [/Indexed /DeviceRGB "+(s.pal.length/3-1)+" "+(r+1)+" 0 R]"):(n("/ColorSpace /"+s.cs),"DeviceCMYK"===s.cs&&n("/Decode [1 0 1 0 1 0 1 0]")),n("/BitsPerComponent "+s.bpc),"f"in s&&n("/Filter /"+s.f),"dp"in s&&n("/DecodeParms <<"+s.dp+">>"),"trns"in s&&s.trns.constructor==Array)for(var i="",a=0;a<s.trns.length;a++)i+=s[i][a]+" "+s.trns[a]+" ",n("/Mask ["+i+"]");"smask"in s&&n("/SMask "+(r+1)+" 0 R"),n("/Length "+s.data.length+">>"),o(s.data),n("endobj")}},s=function(){var t=this.internal.collections.addImage_images,e=this.internal.write,s,r;for(r in t)s=t[r],e("/I"+s.i,s.n,"0","R")};t.addImage=function(t,r,n,o,i,a){if("object"==typeof t&&1===t.nodeType){r=document.createElement("canvas"),r.width=t.clientWidth,r.height=t.clientHeight;var u=r.getContext("2d");if(!u)throw"addImage requires canvas to be supported by browser.";u.drawImage(t,0,0,r.width,r.height),t=r.toDataURL("image/jpeg"),r="JPEG"}if("JPEG"!==r.toUpperCase())throw Error("addImage currently only supports format 'JPEG', not '"+r+"'");var c;r=this.internal.collections.addImage_images;var u=this.internal.getCoordinateString,l=this.internal.getVerticalCoordinateString;if("data:image/jpeg;base64,"===t.substring(0,23)&&(t=atob(t.replace("data:image/jpeg;base64,",""))),r)if(Object.keys)c=Object.keys(r).length;else{var f=r,d=0;for(c in f)f.hasOwnProperty(c)&&d++;c=d}else c=0,this.internal.collections.addImage_images=r={},this.internal.events.subscribe("putResources",e),this.internal.events.subscribe("putXobjectDict",s);t:{var f=t,w;if(255===!f.charCodeAt(0)||216===!f.charCodeAt(1)||255===!f.charCodeAt(2)||224===!f.charCodeAt(3)||74===!f.charCodeAt(6)||70===!f.charCodeAt(7)||73===!f.charCodeAt(8)||70===!f.charCodeAt(9)||0===!f.charCodeAt(10))throw Error("getJpegSize requires a binary jpeg file");w=256*f.charCodeAt(4)+f.charCodeAt(5);for(var d=4,m=f.length;m>d;){if(d+=w,255!==f.charCodeAt(d))throw Error("getJpegSize could not find the size of the image");if(192===f.charCodeAt(d+1)||193===f.charCodeAt(d+1)||194===f.charCodeAt(d+1)||195===f.charCodeAt(d+1)||196===f.charCodeAt(d+1)||197===f.charCodeAt(d+1)||198===f.charCodeAt(d+1)||199===f.charCodeAt(d+1)){w=256*f.charCodeAt(d+5)+f.charCodeAt(d+6),f=256*f.charCodeAt(d+7)+f.charCodeAt(d+8),f=[f,w];break t}d+=2,w=256*f.charCodeAt(d)+f.charCodeAt(d+1)}f=void 0}return t={w:f[0],h:f[1],cs:"DeviceRGB",bpc:8,f:"DCTDecode",i:c,data:t},r[c]=t,i||a||(a=i=-96),0>i&&(i=-72*t.w/i/this.internal.scaleFactor),0>a&&(a=-72*t.h/a/this.internal.scaleFactor),0===i&&(i=a*t.w/t.h),0===a&&(a=i*t.h/t.w),this.internal.write("q",u(i),"0 0",u(a),u(n),l(o+a),"cm /I"+t.i,"Do Q"),this}}(jsPDF.API),function(t){function e(t,e,s,r){return this.pdf=t,this.x=e,this.y=s,this.settings=r,this.init(),this}function s(t){var e=a[t];return e?e:(e={"xx-small":9,"x-small":11,small:13,medium:16,large:19,"x-large":23,"xx-large":28,auto:0}[t],void 0!==e||(e=parseFloat(t))?a[t]=e/16:(e=t.match(/([\d\.]+)(px)/),3===e.length?a[t]=parseFloat(e[1])/16:a[t]=1))}function r(t,e,a){var u=t.childNodes,c;c=$(t),t={};for(var l,f=c.css("font-family").split(","),d=f.shift();!l&&d;)l=n[d.trim().toLowerCase()],d=f.shift();for(t["font-family"]=l||"times",t["font-style"]=i[c.css("font-style")]||"normal",l=o[c.css("font-weight")]||"normal","bold"===l&&(t["font-style"]="normal"===t["font-style"]?l:l+t["font-style"]),t["font-size"]=s(c.css("font-size"))||1,t["line-height"]=s(c.css("line-height"))||1,t.display="inline"===c.css("display")?"inline":"block","block"===t.display&&(t["margin-top"]=s(c.css("margin-top"))||0,t["margin-bottom"]=s(c.css("margin-bottom"))||0,t["padding-top"]=s(c.css("padding-top"))||0,t["padding-bottom"]=s(c.css("padding-bottom"))||0),(l="block"===t.display)&&(e.setBlockBoundary(),e.setBlockStyle(t)),f=0,d=u.length;d>f;f++)if(c=u[f],"object"==typeof c)if(1===c.nodeType&&"SCRIPT"!=c.nodeName){var w=c,m=e,h=a,p=!1,y=void 0,v=void 0,_=h["#"+w.id];if(_)if("function"==typeof _)p=_(w,m);else for(y=0,v=_.length;!p&&y!==v;)p=_[y](w,m),y++;if(_=h[w.nodeName],!p&&_)if("function"==typeof _)p=_(w,m);else for(y=0,v=_.length;!p&&y!==v;)p=_[y](w,m),y++;p||r(c,e,a)}else 3===c.nodeType&&e.addText(c.nodeValue,t);else"string"==typeof c&&e.addText(c,t);l&&e.setBlockBoundary()}String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}),String.prototype.trimLeft||(String.prototype.trimLeft=function(){return this.replace(/^\s+/g,"")}),String.prototype.trimRight||(String.prototype.trimRight=function(){return this.replace(/\s+$/g,"")}),e.prototype.init=function(){this.paragraph={text:[],style:[]},this.pdf.internal.write("q")},e.prototype.dispose=function(){return this.pdf.internal.write("Q"),{x:this.x,y:this.y}},e.prototype.splitFragmentsIntoLines=function(t,e){for(var s=this.pdf.internal.scaleFactor,r={},n,o,i,a,u,c=[],l=[c],f=0,d=this.settings.width;t.length;)if(a=t.shift(),u=e.shift(),a)if(n=u["font-family"],o=u["font-style"],i=r[n+o],i||(i=this.pdf.internal.getFont(n,o).metadata.Unicode,r[n+o]=i),n={widths:i.widths,kerning:i.kerning,fontSize:12*u["font-size"],textIndent:f},o=this.pdf.getStringUnitWidth(a,n)*n.fontSize/s,f+o>d){for(a=this.pdf.splitTextToSize(a,d,n),c.push([a.shift(),u]);a.length;)c=[[a.shift(),u]],l.push(c);f=this.pdf.getStringUnitWidth(c[0][0],n)*n.fontSize/s}else c.push([a,u]),f+=o;return l},e.prototype.RenderTextFragment=function(t,e){var s=this.pdf.internal.getFont(e["font-family"],e["font-style"]);this.pdf.internal.write("/"+s.id,(12*e["font-size"]).toFixed(2),"Tf","("+this.pdf.internal.pdfEscape(t)+") Tj")},e.prototype.renderParagraph=function(){for(var t=this.paragraph.text,e=0,s=t.length,r,n=!1,o=!1;!n&&e!==s;)(r=t[e]=t[e].trimLeft())&&(n=!0),e++;for(e=s-1;s&&!o&&-1!==e;)(r=t[e]=t[e].trimRight())&&(o=!0),e--;for(n=/\s+$/g,o=!0,e=0;e!==s;e++)r=t[e].replace(/\s+/g," "),o&&(r=r.trimLeft()),r&&(o=n.test(r)),t[e]=r;if(e=this.paragraph.style,r=(s=this.paragraph.blockstyle)||{},this.paragraph={text:[],style:[],blockstyle:{},priorblockstyle:s},t.join("").trim()){t=this.splitFragmentsIntoLines(t,e),e=12/this.pdf.internal.scaleFactor,n=(Math.max((s["margin-top"]||0)-(r["margin-bottom"]||0),0)+(s["padding-top"]||0))*e,
s=((s["margin-bottom"]||0)+(s["padding-bottom"]||0))*e,r=this.pdf.internal.write;var i,a;for(this.y+=n,r("q","BT",this.pdf.internal.getCoordinateString(this.x),this.pdf.internal.getVerticalCoordinateString(this.y),"Td");t.length;){for(n=t.shift(),i=o=0,a=n.length;i!==a;i++)n[i][0].trim()&&(o=Math.max(o,n[i][1]["line-height"],n[i][1]["font-size"]));for(r(0,(-12*o).toFixed(2),"Td"),i=0,a=n.length;i!==a;i++)n[i][0]&&this.RenderTextFragment(n[i][0],n[i][1]);this.y+=o*e}r("ET","Q"),this.y+=s}},e.prototype.setBlockBoundary=function(){this.renderParagraph()},e.prototype.setBlockStyle=function(t){this.paragraph.blockstyle=t},e.prototype.addText=function(t,e){this.paragraph.text.push(t),this.paragraph.style.push(e)};var n={helvetica:"helvetica","sans-serif":"helvetica",serif:"times",times:"times","times new roman":"times",monospace:"courier",courier:"courier"},o={100:"normal",200:"normal",300:"normal",400:"normal",500:"bold",600:"bold",700:"bold",800:"bold",900:"bold",normal:"normal",bold:"bold",bolder:"bold",lighter:"normal"},i={normal:"normal",italic:"italic",oblique:"italic"},a={normal:1};t.fromHTML=function(t,s,n,o){if("string"==typeof t){var i="jsPDFhtmlText"+Date.now().toString()+(1e3*Math.random()).toFixed(0);$('<div style="position: absolute !important;clip: rect(1px 1px 1px 1px); /* IE6, IE7 */clip: rect(1px, 1px, 1px, 1px);padding:0 !important;border:0 !important;height: 1px !important;width: 1px !important; top:auto;left:-100px;overflow: hidden;"><iframe style="height:1px;width:1px" name="'+i+'" /></div>').appendTo(document.body),t=$(window.frames[i].document.body).html(t)[0]}return s=new e(this,s,n,o),r(t,s,o.elementHandlers),s.dispose()}}(jsPDF.API),function(t){t.addSVG=function(t,e,s,r,n){function o(t){for(var e=parseFloat(t[1]),s=parseFloat(t[2]),r=[],n=3,o=t.length;o>n;)"c"===t[n]?(r.push([parseFloat(t[n+1]),parseFloat(t[n+2]),parseFloat(t[n+3]),parseFloat(t[n+4]),parseFloat(t[n+5]),parseFloat(t[n+6])]),n+=7):"l"===t[n]?(r.push([parseFloat(t[n+1]),parseFloat(t[n+2])]),n+=3):n+=1;return[e,s,r]}if(void 0===e||void 0===e)throw Error("addSVG needs values for 'x' and 'y'");var i=function(t){var e=t.createElement("iframe"),s=t.createElement("style");return s.type="text/css",s.styleSheet?s.styleSheet.cssText=".jsPDF_sillysvg_iframe {display:none;position:absolute;}":s.appendChild(t.createTextNode(".jsPDF_sillysvg_iframe {display:none;position:absolute;}")),t.getElementsByTagName("head")[0].appendChild(s),e.name="childframe",e.setAttribute("width",0),e.setAttribute("height",0),e.setAttribute("frameborder","0"),e.setAttribute("scrolling","no"),e.setAttribute("seamless","seamless"),e.setAttribute("class","jsPDF_sillysvg_iframe"),t.body.appendChild(e),e}(document),i=function(t,e){var s=(e.contentWindow||e.contentDocument).document;return s.write(t),s.close(),s.getElementsByTagName("svg")[0]}(t,i);t=[1,1];var a=parseFloat(i.getAttribute("width")),u=parseFloat(i.getAttribute("height"));for(a&&u&&(r&&n?t=[r/a,n/u]:r?t=[r/a,r/a]:n&&(t=[n/u,n/u])),i=i.childNodes,r=0,n=i.length;n>r;r++)a=i[r],a.tagName&&"PATH"===a.tagName.toUpperCase()&&(a=o(a.getAttribute("d").split(" ")),a[0]=a[0]*t[0]+e,a[1]=a[1]*t[1]+s,this.lines.call(this,a[2],a[0],a[1],t));return this}}(jsPDF.API),function(t){var e=t.getCharWidthsArray=function(t,e){e||(e={});var s=e.widths?e.widths:this.internal.getFont().metadata.Unicode.widths,r=s.fof?s.fof:1,n=e.kerning?e.kerning:this.internal.getFont().metadata.Unicode.kerning,o=n.fof?n.fof:1,i,a,u,c=0,l=s[0]||r,f=[];for(i=0,a=t.length;a>i;i++)u=t.charCodeAt(i),f.push((s[u]||l)/r+(n[u]&&n[u][c]||0)/o),c=u;return f},s=function(t){for(var e=t.length,s=0;e;)e--,s+=t[e];return s};t.getStringUnitWidth=function(t,r){return s(e.call(this,t,r))};var r=function(t,r,n){n||(n={});var o=e(" ",n)[0],i=t.split(" "),a=[];t=[a];var u=n.textIndent||0,c=0,l=0,f,d,w,m;for(w=0,m=i.length;m>w;w++){if(f=i[w],d=e(f,n),l=s(d),u+c+l>r){if(l>r){for(var l=f,h=d,p=r,y=[],v=0,_=l.length,g=0;v!==_&&g+h[v]<r-(u+c);)g+=h[v],v++;for(y.push(l.slice(0,v)),u=v,g=0;v!==_;)g+h[v]>p&&(y.push(l.slice(u,v)),g=0,u=v),g+=h[v],v++;for(u!==v&&y.push(l.slice(u,v)),u=y,a.push(u.shift()),a=[u.pop()];u.length;)t.push([u.shift()]);l=s(d.slice(f.length-a[0].length))}else a=[f];t.push(a),u=l}else a.push(f),u+=c+l;c=o}for(r=[],w=0,m=t.length;m>w;w++)r.push(t[w].join(" "));return r};t.splitTextToSize=function(t,e,s){s||(s={});var n=s.fontSize||this.internal.getFontSize(),o,i=s;o={0:1};var a={};for(i.widths&&i.kerning?o={widths:i.widths,kerning:i.kerning}:(i=this.internal.getFont(i.fontName,i.fontStyle),o=i.metadata.Unicode?{widths:i.metadata.Unicode.widths||o,kerning:i.metadata.Unicode.kerning||a}:{widths:o,kerning:a}),t=t.match(/[\n\r]/)?t.split(/\r\n|\r|\n/g):[t],e=1*this.internal.scaleFactor*e/n,o.textIndent=s.textIndent?1*s.textIndent*this.internal.scaleFactor/n:0,a=[],s=0,n=t.length;n>s;s++)a=a.concat(r(t[s],e,o));return a}}(jsPDF.API),function(t){var e=function(t){for(var e={},s=0;16>s;s++)e["klmnopqrstuvwxyz"[s]]="0123456789abcdef"[s];for(var r={},n=1,o,i=r,a=[],u,c="",l="",f,d=t.length-1,s=1;s!=d;)u=t[s],s+=1,"'"==u?o?(f=o.join(""),o=void 0):o=[]:o?o.push(u):"{"==u?(a.push([i,f]),i={},f=void 0):"}"==u?(u=a.pop(),u[0][u[1]]=i,f=void 0,i=u[0]):"-"==u?n=-1:void 0===f?e.hasOwnProperty(u)?(c+=e[u],f=parseInt(c,16)*n,n=1,c=""):c+=u:e.hasOwnProperty(u)?(l+=e[u],i[f]=parseInt(l,16)*n,n=1,f=void 0,l=""):l+=u;return r},s={codePages:["WinAnsiEncoding"],WinAnsiEncoding:e("{19m8n201n9q201o9r201s9l201t9m201u8m201w9n201x9o201y8o202k8q202l8r202m9p202q8p20aw8k203k8t203t8v203u9v2cq8s212m9t15m8w15n9w2dw9s16k8u16l9u17s9z17x8y17y9y}")},r={Unicode:{Courier:s,"Courier-Bold":s,"Courier-BoldOblique":s,"Courier-Oblique":s,Helvetica:s,"Helvetica-Bold":s,"Helvetica-BoldOblique":s,"Helvetica-Oblique":s,"Times-Roman":s,"Times-Bold":s,"Times-BoldItalic":s,"Times-Italic":s}},n={Unicode:{"Courier-Oblique":e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Times-BoldItalic":e("{'widths'{k3o2q4ycx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2r202m2n2n3m2o3m2p5n202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5n4l4m4m4m4n4m4o4s4p4m4q4m4r4s4s4y4t2r4u3m4v4m4w3x4x5t4y4s4z4s5k3x5l4s5m4m5n3r5o3x5p4s5q4m5r5t5s4m5t3x5u3x5v2l5w1w5x2l5y3t5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q2l6r3m6s3r6t1w6u1w6v3m6w1w6x4y6y3r6z3m7k3m7l3m7m2r7n2r7o1w7p3r7q2w7r4m7s3m7t2w7u2r7v2n7w1q7x2n7y3t202l3mcl4mal2ram3man3mao3map3mar3mas2lat4uau1uav3maw3way4uaz2lbk2sbl3t'fof'6obo2lbp3tbq3mbr1tbs2lbu1ybv3mbz3mck4m202k3mcm4mcn4mco4mcp4mcq5ycr4mcs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz2w203k6o212m6o2dw2l2cq2l3t3m3u2l17s3x19m3m}'kerning'{cl{4qu5kt5qt5rs17ss5ts}201s{201ss}201t{cks4lscmscnscoscpscls2wu2yu201ts}201x{2wu2yu}2k{201ts}2w{4qx5kx5ou5qx5rs17su5tu}2x{17su5tu5ou}2y{4qx5kx5ou5qx5rs17ss5ts}'fof'-6ofn{17sw5tw5ou5qw5rs}7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qs}3v{17su5tu5os5qs}7p{17su5tu}ck{4qu5kt5qt5rs17ss5ts}4l{4qu5kt5qt5rs17ss5ts}cm{4qu5kt5qt5rs17ss5ts}cn{4qu5kt5qt5rs17ss5ts}co{4qu5kt5qt5rs17ss5ts}cp{4qu5kt5qt5rs17ss5ts}6l{4qu5ou5qw5rt17su5tu}5q{ckuclucmucnucoucpu4lu}5r{ckuclucmucnucoucpu4lu}7q{cksclscmscnscoscps4ls}6p{4qu5ou5qw5rt17sw5tw}ek{4qu5ou5qw5rt17su5tu}el{4qu5ou5qw5rt17su5tu}em{4qu5ou5qw5rt17su5tu}en{4qu5ou5qw5rt17su5tu}eo{4qu5ou5qw5rt17su5tu}ep{4qu5ou5qw5rt17su5tu}es{17ss5ts5qs4qu}et{4qu5ou5qw5rt17sw5tw}eu{4qu5ou5qw5rt17ss5ts}ev{17ss5ts5qs4qu}6z{17sw5tw5ou5qw5rs}fm{17sw5tw5ou5qw5rs}7n{201ts}fo{17sw5tw5ou5qw5rs}fp{17sw5tw5ou5qw5rs}fq{17sw5tw5ou5qw5rs}7r{cksclscmscnscoscps4ls}fs{17sw5tw5ou5qw5rs}ft{17su5tu}fu{17su5tu}fv{17su5tu}fw{17su5tu}fz{cksclscmscnscoscps4ls}}}"),"Helvetica-Bold":e("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"),Courier:e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Courier-BoldOblique":e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Times-Bold":e("{'widths'{k3q2q5ncx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2l202m2n2n3m2o3m2p6o202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5x4l4s4m4m4n4s4o4s4p4m4q3x4r4y4s4y4t2r4u3m4v4y4w4m4x5y4y4s4z4y5k3x5l4y5m4s5n3r5o4m5p4s5q4s5r6o5s4s5t4s5u4m5v2l5w1w5x2l5y3u5z3m6k2l6l3m6m3r6n2w6o3r6p2w6q2l6r3m6s3r6t1w6u2l6v3r6w1w6x5n6y3r6z3m7k3r7l3r7m2w7n2r7o2l7p3r7q3m7r4s7s3m7t3m7u2w7v2r7w1q7x2r7y3o202l3mcl4sal2lam3man3mao3map3mar3mas2lat4uau1yav3maw3tay4uaz2lbk2sbl3t'fof'6obo2lbp3rbr1tbs2lbu2lbv3mbz3mck4s202k3mcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3rek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3m3u2l17s4s19m3m}'kerning'{cl{4qt5ks5ot5qy5rw17sv5tv}201t{cks4lscmscnscoscpscls4wv}2k{201ts}2w{4qu5ku7mu5os5qx5ru17su5tu}2x{17su5tu5ou5qs}2y{4qv5kv7mu5ot5qz5ru17su5tu}'fof'-6o7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qu}3v{17su5tu5os5qu}fu{17su5tu5ou5qu}7p{17su5tu5ou5qu}ck{4qt5ks5ot5qy5rw17sv5tv}4l{4qt5ks5ot5qy5rw17sv5tv}cm{4qt5ks5ot5qy5rw17sv5tv}cn{4qt5ks5ot5qy5rw17sv5tv}co{4qt5ks5ot5qy5rw17sv5tv}cp{4qt5ks5ot5qy5rw17sv5tv}6l{17st5tt5ou5qu}17s{ckuclucmucnucoucpu4lu4wu}5o{ckuclucmucnucoucpu4lu4wu}5q{ckzclzcmzcnzcozcpz4lz4wu}5r{ckxclxcmxcnxcoxcpx4lx4wu}5t{ckuclucmucnucoucpu4lu4wu}7q{ckuclucmucnucoucpu4lu}6p{17sw5tw5ou5qu}ek{17st5tt5qu}el{17st5tt5ou5qu}em{17st5tt5qu}en{17st5tt5qu}eo{17st5tt5qu}ep{17st5tt5ou5qu}es{17ss5ts5qu}et{17sw5tw5ou5qu}eu{17sw5tw5ou5qu}ev{17ss5ts5qu}6z{17sw5tw5ou5qu5rs}fm{17sw5tw5ou5qu5rs}fn{17sw5tw5ou5qu5rs}fo{17sw5tw5ou5qu5rs}fp{17sw5tw5ou5qu5rs}fq{17sw5tw5ou5qu5rs}7r{cktcltcmtcntcotcpt4lt5os}fs{17sw5tw5ou5qu5rs}ft{17su5tu5ou5qu}7m{5os}fv{17su5tu5ou5qu}fw{17su5tu5ou5qu}fz{cksclscmscnscoscps4ls}}}"),Helvetica:e("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}"),"Helvetica-BoldOblique":e("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"),"Courier-Bold":e("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"),"Times-Italic":e("{'widths'{k3n2q4ycx2l201n3m201o5t201s2l201t2l201u2l201w3r201x3r201y3r2k1t2l2l202m2n2n3m2o3m2p5n202q5t2r1p2s2l2t2l2u3m2v4n2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w4n3x4n3y4n3z3m4k5w4l3x4m3x4n4m4o4s4p3x4q3x4r4s4s4s4t2l4u2w4v4m4w3r4x5n4y4m4z4s5k3x5l4s5m3x5n3m5o3r5p4s5q3x5r5n5s3x5t3r5u3r5v2r5w1w5x2r5y2u5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q1w6r3m6s3m6t1w6u1w6v2w6w1w6x4s6y3m6z3m7k3m7l3m7m2r7n2r7o1w7p3m7q2w7r4m7s2w7t2w7u2r7v2s7w1v7x2s7y3q202l3mcl3xal2ram3man3mao3map3mar3mas2lat4wau1vav3maw4nay4waz2lbk2sbl4n'fof'6obo2lbp3mbq3obr1tbs2lbu1zbv3mbz3mck3x202k3mcm3xcn3xco3xcp3xcq5tcr4mcs3xct3xcu3xcv3xcw2l2m2ucy2lcz2ldl4mdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr4nfs3mft3mfu3mfv3mfw3mfz2w203k6o212m6m2dw2l2cq2l3t3m3u2l17s3r19m3m}'kerning'{cl{5kt4qw}201s{201sw}201t{201tw2wy2yy6q-t}201x{2wy2yy}2k{201tw}2w{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}2x{17ss5ts5os}2y{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}'fof'-6o6t{17ss5ts5qs}7t{5os}3v{5qs}7p{17su5tu5qs}ck{5kt4qw}4l{5kt4qw}cm{5kt4qw}cn{5kt4qw}co{5kt4qw}cp{5kt4qw}6l{4qs5ks5ou5qw5ru17su5tu}17s{2ks}5q{ckvclvcmvcnvcovcpv4lv}5r{ckuclucmucnucoucpu4lu}5t{2ks}6p{4qs5ks5ou5qw5ru17su5tu}ek{4qs5ks5ou5qw5ru17su5tu}el{4qs5ks5ou5qw5ru17su5tu}em{4qs5ks5ou5qw5ru17su5tu}en{4qs5ks5ou5qw5ru17su5tu}eo{4qs5ks5ou5qw5ru17su5tu}ep{4qs5ks5ou5qw5ru17su5tu}es{5ks5qs4qs}et{4qs5ks5ou5qw5ru17su5tu}eu{4qs5ks5qw5ru17su5tu}ev{5ks5qs4qs}ex{17ss5ts5qs}6z{4qv5ks5ou5qw5ru17su5tu}fm{4qv5ks5ou5qw5ru17su5tu}fn{4qv5ks5ou5qw5ru17su5tu}fo{4qv5ks5ou5qw5ru17su5tu}fp{4qv5ks5ou5qw5ru17su5tu}fq{4qv5ks5ou5qw5ru17su5tu}7r{5os}fs{4qv5ks5ou5qw5ru17su5tu}ft{17su5tu5qs}fu{17su5tu5qs}fv{17su5tu5qs}fw{17su5tu5qs}}}"),"Times-Roman":e("{'widths'{k3n2q4ycx2l201n3m201o6o201s2l201t2l201u2l201w2w201x2w201y2w2k1t2l2l202m2n2n3m2o3m2p5n202q6o2r1m2s2l2t2l2u3m2v3s2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v1w3w3s3x3s3y3s3z2w4k5w4l4s4m4m4n4m4o4s4p3x4q3r4r4s4s4s4t2l4u2r4v4s4w3x4x5t4y4s4z4s5k3r5l4s5m4m5n3r5o3x5p4s5q4s5r5y5s4s5t4s5u3x5v2l5w1w5x2l5y2z5z3m6k2l6l2w6m3m6n2w6o3m6p2w6q2l6r3m6s3m6t1w6u1w6v3m6w1w6x4y6y3m6z3m7k3m7l3m7m2l7n2r7o1w7p3m7q3m7r4s7s3m7t3m7u2w7v3k7w1o7x3k7y3q202l3mcl4sal2lam3man3mao3map3mar3mas2lat4wau1vav3maw3say4waz2lbk2sbl3s'fof'6obo2lbp3mbq2xbr1tbs2lbu1zbv3mbz2wck4s202k3mcm4scn4sco4scp4scq5tcr4mcs3xct3xcu3xcv3xcw2l2m2tcy2lcz2ldl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek2wel2wem2wen2weo2wep2weq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr3sfs3mft3mfu3mfv3mfw3mfz3m203k6o212m6m2dw2l2cq2l3t3m3u1w17s4s19m3m}'kerning'{cl{4qs5ku17sw5ou5qy5rw201ss5tw201ws}201s{201ss}201t{ckw4lwcmwcnwcowcpwclw4wu201ts}2k{201ts}2w{4qs5kw5os5qx5ru17sx5tx}2x{17sw5tw5ou5qu}2y{4qs5kw5os5qx5ru17sx5tx}'fof'-6o7t{ckuclucmucnucoucpu4lu5os5rs}3u{17su5tu5qs}3v{17su5tu5qs}7p{17sw5tw5qs}ck{4qs5ku17sw5ou5qy5rw201ss5tw201ws}4l{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cm{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cn{4qs5ku17sw5ou5qy5rw201ss5tw201ws}co{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cp{4qs5ku17sw5ou5qy5rw201ss5tw201ws}6l{17su5tu5os5qw5rs}17s{2ktclvcmvcnvcovcpv4lv4wuckv}5o{ckwclwcmwcnwcowcpw4lw4wu}5q{ckyclycmycnycoycpy4ly4wu5ms}5r{cktcltcmtcntcotcpt4lt4ws}5t{2ktclvcmvcnvcovcpv4lv4wuckv}7q{cksclscmscnscoscps4ls}6p{17su5tu5qw5rs}ek{5qs5rs}el{17su5tu5os5qw5rs}em{17su5tu5os5qs5rs}en{17su5qs5rs}eo{5qs5rs}ep{17su5tu5os5qw5rs}es{5qs}et{17su5tu5qw5rs}eu{17su5tu5qs5rs}ev{5qs}6z{17sv5tv5os5qx5rs}fm{5os5qt5rs}fn{17sv5tv5os5qx5rs}fo{17sv5tv5os5qx5rs}fp{5os5qt5rs}fq{5os5qt5rs}7r{ckuclucmucnucoucpu4lu5os}fs{17sv5tv5os5qx5rs}ft{17ss5ts5qs}fu{17sw5tw5qs}fv{17sw5tw5qs}fw{17ss5ts5qs}fz{ckuclucmucnucoucpu4lu5os5rs}}}"),"Helvetica-Oblique":e("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}")}};t.events.push(["addFonts",function(t){var e,s,o,i;for(s in t.fonts)t.fonts.hasOwnProperty(s)&&(e=t.fonts[s],(o=n.Unicode[e.PostScriptName])&&(i=e.metadata.Unicode?e.metadata.Unicode:e.metadata.Unicode={},i.widths=o.widths,i.kerning=o.kerning),(o=r.Unicode[e.PostScriptName])&&(i=e.metadata.Unicode?e.metadata.Unicode:e.metadata.Unicode={},i.encoding=o,o.codePages&&o.codePages.length&&(e.encoding=o.codePages[0])))}])}(jsPDF.API),function(t){var e,s,r,n,o={x:void 0,y:void 0,w:void 0,h:void 0,ln:void 0},i=1;t.setHeaderFunction=function(t){n=t},t.getTextDimensions=function(t){e=this.internal.getFont().fontName,s=this.internal.getFontSize(),r=this.internal.getFont().fontStyle;var n=19.049976/25.4,o;return o=document.createElement("font"),o.id="jsPDFCell",o.style.fontStyle=r,o.style.fontName=e,o.style.fontSize=s+"pt",o.innerText=t,document.body.appendChild(o),t={w:(o.offsetWidth+1)*n,h:(o.offsetHeight+1)*n},document.body.removeChild(o),t},t.cellAddPage=function(){this.addPage(),o={x:void 0,y:void 0,w:void 0,h:void 0,ln:void 0},i+=1},t.cellInitialize=function(){o={x:void 0,y:void 0,w:void 0,h:void 0,ln:void 0},i=1},t.cell=function(t,e,s,r,n,i,a){var u=o;if(void 0!==u.ln&&(u.ln===i?(t=u.x+u.w,e=u.y):(u.y+u.h+r+13>=this.internal.pageSize.height&&(this.cellAddPage(),this.printHeaders&&this.tableHeaderRow&&this.printHeaderRow(i)),e=o.y+o.h)),""!==n[0])if(this.printingHeaderRow?this.rect(t,e,s,r,"FD"):this.rect(t,e,s,r),"right"===a){if(n instanceof Array)for(a=0;a<n.length;a++){var u=n[a],c=this.getStringUnitWidth(u)*this.internal.getFontSize();this.text(u,t+s-c-3,e+this.internal.getLineHeight()*(a+1))}}else this.text(n,t+3,e+this.internal.getLineHeight());return o={x:t,y:e,w:s,h:r,ln:i},this},t.getKeys="function"==typeof Object.keys?function(t){return t?Object.keys(t):[]}:function(t){var e=[],s;for(s in t)t.hasOwnProperty(s)&&e.push(s);return e},t.arrayMax=function(t,e){var s=t[0],r,n,o;for(r=0,n=t.length;n>r;r+=1)o=t[r],e?-1===e(s,o)&&(s=o):o>s&&(s=o);return s},t.table=function(e,s,r){var n=[],o=[],i,a,u,c={},l={},f,d,w=[],m,h=[],p;if(this.lnMod=0,r&&(this.printHeaders=r.printHeaders||!0),!e)throw"No data for PDF table";if(void 0===s||null===s)n=this.getKeys(e[0]);else if(s[0]&&"string"!=typeof s[0])for(a=0,u=s.length;u>a;a+=1)i=s[a],n.push(i.name),o.push(i.prompt),l[i.name]=i.width;else n=s;if(r.autoSize)for(p=function(t){return t[i]},a=0,u=n.length;u>a;a+=1){for(i=n[a],c[i]=e.map(p),w.push(this.getTextDimensions(o[a]||i).w),d=c[i],m=0,u=d.length;u>m;m+=1)f=d[m],w.push(this.getTextDimensions(f).w);l[i]=t.arrayMax(w)}if(r.printHeaders){for(r=this.calculateLineHeight(n,l,o.length?o:n),a=0,u=n.length;u>a;a+=1)i=n[a],h.push([13,13,l[i],r,String(o.length?o[a]:i)]);this.setTableHeaderRow(h),this.printHeaderRow(1)}for(a=0,u=e.length;u>a;a+=1)for(o=e[a],r=this.calculateLineHeight(n,l,o),m=0,h=n.length;h>m;m+=1)i=n[m],this.cell(13,13,l[i],r,o[i],a+2,s[m].align);return this},t.calculateLineHeight=function(t,e,s){for(var r,n=0,o=0;o<t.length;o++)r=t[o],s[r]=this.splitTextToSize(String(s[r]),e[r]-3),r=this.internal.getLineHeight()*s[r].length+3,r>n&&(n=r);return n},t.setTableHeaderRow=function(t){this.tableHeaderRow=t},t.printHeaderRow=function(t){if(!this.tableHeaderRow)throw"Property tableHeaderRow does not exist.";var e,s,r;for(this.printingHeaderRow=!0,void 0!==n&&(s=n(this,i),o={x:s[0],y:s[1],w:s[2],h:s[3],ln:-1}),this.setFontStyle("bold"),s=0,r=this.tableHeaderRow.length;r>s;s+=1)this.setFillColor(200,200,200),e=this.tableHeaderRow[s],e=[].concat(e),this.cell.apply(this,e.concat(t));this.setFontStyle("normal"),this.printingHeaderRow=!1}}(jsPDF.API),function(t){t.putTotalPages=function(t){t=RegExp(t,"g");for(var e=1;e<=this.internal.getNumberOfPages();e++)for(var s=0;s<this.internal.pages[e].length;s++)this.internal.pages[e][s]=this.internal.pages[e][s].replace(t,this.internal.getNumberOfPages());return this}}(jsPDF.API);var BlobBuilder=BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder||function(t){var e=function(t){return Object.prototype.toString.call(t).match(/^\[object\s(.*)\]$/)[1]},s=function(){this.data=[]},r=function(t,e,s){this.data=t,this.size=t.length,this.type=e,this.encoding=s},n=s.prototype,o=r.prototype,i=t.FileReaderSync,a=function(t){this.code=this[this.name=t]},u="NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR".split(" "),c=u.length,l=t.URL||t.webkitURL||t,f=l.createObjectURL,d=l.revokeObjectURL,w=l,m=t.btoa,h=t.atob,p=!1,y=function(t){p=!t},v=t.ArrayBuffer,_=t.Uint8Array;for(s.fake=o.fake=!0;c--;)a.prototype[u[c]]=c+1;try{_&&y.apply(0,new _(1))}catch(g){}return l.createObjectURL||(w=t.URL={}),w.createObjectURL=function(t){var e=t.type;return null===e&&(e="application/octet-stream"),t instanceof r?(e="data:"+e,"base64"===t.encoding?e+";base64,"+t.data:"URI"===t.encoding?e+","+decodeURIComponent(t.data):m?e+";base64,"+m(t.data):e+","+encodeURIComponent(t.data)):f?f.call(l,t):void 0},w.revokeObjectURL=function(t){"data:"!==t.substring(0,5)&&d&&d.call(l,t)},n.append=function(t){var s=this.data;if(_&&t instanceof v)if(p)s.push(String.fromCharCode.apply(String,new _(t)));else{s="",t=new _(t);for(var n=0,o=t.length;o>n;n++)s+=String.fromCharCode(t[n])}else if("Blob"===e(t)||"File"===e(t)){if(!i)throw new a("NOT_READABLE_ERR");n=new i,s.push(n.readAsBinaryString(t))}else t instanceof r?"base64"===t.encoding&&h?s.push(h(t.data)):"URI"===t.encoding?s.push(decodeURIComponent(t.data)):"raw"===t.encoding&&s.push(t.data):("string"!=typeof t&&(t+=""),s.push(unescape(encodeURIComponent(t))))},n.getBlob=function(t){return arguments.length||(t=null),new r(this.data.join(""),t,"raw")},n.toString=function(){return"[object BlobBuilder]"},o.slice=function(t,e,s){var n=arguments.length;return 3>n&&(s=null),new r(this.data.slice(t,n>1?e:this.data.length),s,this.encoding)},o.toString=function(){return"[object Blob]"},s}(self),saveAs=saveAs||navigator.msSaveBlob&&navigator.msSaveBlob.bind(navigator)||function(t){var e=t.document,s=t.URL||t.webkitURL||t,r=e.createElementNS("http://www.w3.org/1999/xhtml","a"),n="download"in r,o=function(s){var r=e.createEvent("MouseEvents");return r.initMouseEvent("click",!0,!1,t,0,0,0,0,0,!1,!1,!1,!1,0,null),s.dispatchEvent(r)},i=t.webkitRequestFileSystem,a=t.requestFileSystem||i||t.mozRequestFileSystem,u=function(e){(t.setImmediate||t.setTimeout)(function(){throw e},0)},c=0,l=[],f=function(t,e,s){e=[].concat(e);for(var r=e.length;r--;){var n=t["on"+e[r]];if("function"==typeof n)try{n.call(t,s||t)}catch(o){u(o)}}},d=function(e,s){var u=this,d=e.type,w=!1,m,h,p=function(){var s=(t.URL||t.webkitURL||t).createObjectURL(e);return l.push(s),s},y=function(){f(u,["writestart","progress","write","writeend"])},v=function(){(w||!m)&&(m=p(e)),h&&(h.location.href=m),u.readyState=u.DONE,y()},_=function(t){return function(){return u.readyState!==u.DONE?t.apply(this,arguments):void 0}},g={create:!0,exclusive:!1},q;return u.readyState=u.INIT,s||(s="download"),n&&(m=p(e),r.href=m,r.download=s,o(r))?(u.readyState=u.DONE,void y()):(t.chrome&&d&&"application/octet-stream"!==d&&(q=e.slice||e.webkitSlice,e=q.call(e,0,e.size,"application/octet-stream"),w=!0),i&&"download"!==s&&(s+=".download"),h="application/octet-stream"===d||i?t:t.open(),void(a?(c+=e.size,a(t.TEMPORARY,c,_(function(t){t.root.getDirectory("saved",g,_(function(t){var r=function(){t.getFile(s,g,_(function(t){t.createWriter(_(function(s){s.onwriteend=function(e){h.location.href=t.toURL(),l.push(t),u.readyState=u.DONE,f(u,"writeend",e)},s.onerror=function(){var t=s.error;t.code!==t.ABORT_ERR&&v()},["writestart","progress","write","abort"].forEach(function(t){s["on"+t]=u["on"+t]}),s.write(e),u.abort=function(){s.abort(),u.readyState=u.DONE},u.readyState=u.WRITING}),v)}),v)};t.getFile(s,{create:!1},_(function(t){t.remove(),r()}),_(function(t){t.code===t.NOT_FOUND_ERR?r():v()}))}),v)}),v)):v()))},w=d.prototype;return w.abort=function(){this.readyState=this.DONE,f(this,"abort")},w.readyState=w.INIT=0,w.WRITING=1,w.DONE=2,w.error=w.onwritestart=w.onprogress=w.onwrite=w.onabort=w.onerror=w.onwriteend=null,t.addEventListener("unload",function(){for(var t=l.length;t--;){var e=l[t];"string"==typeof e?s.revokeObjectURL(e):e.remove()}l.length=0},!1),function(t,e){return new d(t,e)}}(self),MAX_BITS=15,D_CODES=30,BL_CODES=19,LENGTH_CODES=29,LITERALS=256,L_CODES=LITERALS+1+LENGTH_CODES,HEAP_SIZE=2*L_CODES+1,END_BLOCK=256,MAX_BL_BITS=7,REP_3_6=16,REPZ_3_10=17,REPZ_11_138=18,Buf_size=16,Z_DEFAULT_COMPRESSION=-1,Z_FILTERED=1,Z_HUFFMAN_ONLY=2,Z_DEFAULT_STRATEGY=0,Z_NO_FLUSH=0,Z_PARTIAL_FLUSH=1,Z_FULL_FLUSH=3,Z_FINISH=4,Z_OK=0,Z_STREAM_END=1,Z_NEED_DICT=2,Z_STREAM_ERROR=-2,Z_DATA_ERROR=-3,Z_BUF_ERROR=-5,_dist_code=[0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29];Tree._length_code=[0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28],Tree.base_length=[0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224,0],Tree.base_dist=[0,1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384,24576],Tree.d_code=function(t){return 256>t?_dist_code[t]:_dist_code[256+(t>>>7)]},Tree.extra_lbits=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],Tree.extra_dbits=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],Tree.extra_blbits=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],Tree.bl_order=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],StaticTree.static_ltree=[12,8,140,8,76,8,204,8,44,8,172,8,108,8,236,8,28,8,156,8,92,8,220,8,60,8,188,8,124,8,252,8,2,8,130,8,66,8,194,8,34,8,162,8,98,8,226,8,18,8,146,8,82,8,210,8,50,8,178,8,114,8,242,8,10,8,138,8,74,8,202,8,42,8,170,8,106,8,234,8,26,8,154,8,90,8,218,8,58,8,186,8,122,8,250,8,6,8,134,8,70,8,198,8,38,8,166,8,102,8,230,8,22,8,150,8,86,8,214,8,54,8,182,8,118,8,246,8,14,8,142,8,78,8,206,8,46,8,174,8,110,8,238,8,30,8,158,8,94,8,222,8,62,8,190,8,126,8,254,8,1,8,129,8,65,8,193,8,33,8,161,8,97,8,225,8,17,8,145,8,81,8,209,8,49,8,177,8,113,8,241,8,9,8,137,8,73,8,201,8,41,8,169,8,105,8,233,8,25,8,153,8,89,8,217,8,57,8,185,8,121,8,249,8,5,8,133,8,69,8,197,8,37,8,165,8,101,8,229,8,21,8,149,8,85,8,213,8,53,8,181,8,117,8,245,8,13,8,141,8,77,8,205,8,45,8,173,8,109,8,237,8,29,8,157,8,93,8,221,8,61,8,189,8,125,8,253,8,19,9,275,9,147,9,403,9,83,9,339,9,211,9,467,9,51,9,307,9,179,9,435,9,115,9,371,9,243,9,499,9,11,9,267,9,139,9,395,9,75,9,331,9,203,9,459,9,43,9,299,9,171,9,427,9,107,9,363,9,235,9,491,9,27,9,283,9,155,9,411,9,91,9,347,9,219,9,475,9,59,9,315,9,187,9,443,9,123,9,379,9,251,9,507,9,7,9,263,9,135,9,391,9,71,9,327,9,199,9,455,9,39,9,295,9,167,9,423,9,103,9,359,9,231,9,487,9,23,9,279,9,151,9,407,9,87,9,343,9,215,9,471,9,55,9,311,9,183,9,439,9,119,9,375,9,247,9,503,9,15,9,271,9,143,9,399,9,79,9,335,9,207,9,463,9,47,9,303,9,175,9,431,9,111,9,367,9,239,9,495,9,31,9,287,9,159,9,415,9,95,9,351,9,223,9,479,9,63,9,319,9,191,9,447,9,127,9,383,9,255,9,511,9,0,7,64,7,32,7,96,7,16,7,80,7,48,7,112,7,8,7,72,7,40,7,104,7,24,7,88,7,56,7,120,7,4,7,68,7,36,7,100,7,20,7,84,7,52,7,116,7,3,8,131,8,67,8,195,8,35,8,163,8,99,8,227,8],
StaticTree.static_dtree=[0,5,16,5,8,5,24,5,4,5,20,5,12,5,28,5,2,5,18,5,10,5,26,5,6,5,22,5,14,5,30,5,1,5,17,5,9,5,25,5,5,5,21,5,13,5,29,5,3,5,19,5,11,5,27,5,7,5,23,5],StaticTree.static_l_desc=new StaticTree(StaticTree.static_ltree,Tree.extra_lbits,LITERALS+1,L_CODES,MAX_BITS),StaticTree.static_d_desc=new StaticTree(StaticTree.static_dtree,Tree.extra_dbits,0,D_CODES,MAX_BITS),StaticTree.static_bl_desc=new StaticTree(null,Tree.extra_blbits,0,BL_CODES,MAX_BL_BITS);var MAX_MEM_LEVEL=9,DEF_MEM_LEVEL=8,STORED=0,FAST=1,SLOW=2,config_table=[new Config(0,0,0,0,STORED),new Config(4,4,8,4,FAST),new Config(4,5,16,8,FAST),new Config(4,6,32,32,FAST),new Config(4,4,16,16,SLOW),new Config(8,16,32,32,SLOW),new Config(8,16,128,128,SLOW),new Config(8,32,128,256,SLOW),new Config(32,128,258,1024,SLOW),new Config(32,258,258,4096,SLOW)],z_errmsg="need dictionary;stream end;;;stream error;data error;;buffer error;;".split(";"),NeedMore=0,BlockDone=1,FinishStarted=2,FinishDone=3,PRESET_DICT=32,INIT_STATE=42,BUSY_STATE=113,FINISH_STATE=666,Z_DEFLATED=8,STORED_BLOCK=0,STATIC_TREES=1,DYN_TREES=2,MIN_MATCH=3,MAX_MATCH=258,MIN_LOOKAHEAD=MAX_MATCH+MIN_MATCH+1;ZStream.prototype={deflateInit:function(t,e){return this.dstate=new Deflate,e||(e=MAX_BITS),this.dstate.deflateInit(this,t,e)},deflate:function(t){return this.dstate?this.dstate.deflate(this,t):Z_STREAM_ERROR},deflateEnd:function(){if(!this.dstate)return Z_STREAM_ERROR;var t=this.dstate.deflateEnd();return this.dstate=null,t},deflateParams:function(t,e){return this.dstate?this.dstate.deflateParams(this,t,e):Z_STREAM_ERROR},deflateSetDictionary:function(t,e){return this.dstate?this.dstate.deflateSetDictionary(this,t,e):Z_STREAM_ERROR},read_buf:function(t,e,s){var r=this.avail_in;return r>s&&(r=s),0===r?0:(this.avail_in-=r,t.set(this.next_in.subarray(this.next_in_index,this.next_in_index+r),e),this.next_in_index+=r,this.total_in+=r,r)},flush_pending:function(){var t=this.dstate.pending;t>this.avail_out&&(t=this.avail_out),0!==t&&(this.next_out.set(this.dstate.pending_buf.subarray(this.dstate.pending_out,this.dstate.pending_out+t),this.next_out_index),this.next_out_index+=t,this.dstate.pending_out+=t,this.total_out+=t,this.avail_out-=t,this.dstate.pending-=t,0===this.dstate.pending&&(this.dstate.pending_out=0))}},void function(t,e){"object"==typeof module?module.exports=e():"function"==typeof define?define(e):t.adler32cs=e()}(this,function(){var t="function"==typeof ArrayBuffer&&"function"==typeof Uint8Array,e=null,s=function(){if(!t)return function(){return!1};try{var s=require("buffer");"function"==typeof s.Buffer&&(e=s.Buffer)}catch(r){}return function(t){return t instanceof ArrayBuffer||null!==e&&t instanceof e}}(),r=function(){return null!==e?function(t){return new e(t,"utf8").toString("binary")}:function(t){return unescape(encodeURIComponent(t))}}(),n=function(t,e){for(var s=65535&t,r=t>>>16,n=0,o=e.length;o>n;n++)s=(s+(255&e.charCodeAt(n)))%65521,r=(r+s)%65521;return(r<<16|s)>>>0},o=function(t,e){for(var s=65535&t,r=t>>>16,n=0,o=e.length;o>n;n++)s=(s+e[n])%65521,r=(r+s)%65521;return(r<<16|s)>>>0},i={},a=i.Adler32=function(){var e=function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(!isFinite(t=null==t?1:+t))throw Error("First arguments needs to be a finite number.");this.checksum=t>>>0},i=e.prototype={};return i.constructor=e,e.from=function(t){return t.prototype=i,t}(function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(null==t)throw Error("First argument needs to be a string.");this.checksum=n(1,t.toString())}),e.fromUtf8=function(t){return t.prototype=i,t}(function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(null==t)throw Error("First argument needs to be a string.");t=r(t.toString()),this.checksum=n(1,t)}),t&&(e.fromBuffer=function(t){return t.prototype=i,t}(function(t){if(!(this instanceof e))throw new TypeError("Constructor cannot called be as a function.");if(!s(t))throw Error("First argument needs to be ArrayBuffer.");return t=new Uint8Array(t),this.checksum=o(1,t)})),i.update=function(t){if(null==t)throw Error("First argument needs to be a string.");return t=t.toString(),this.checksum=n(this.checksum,t)},i.updateUtf8=function(t){if(null==t)throw Error("First argument needs to be a string.");return t=r(t.toString()),this.checksum=n(this.checksum,t)},t&&(i.updateBuffer=function(t){if(!s(t))throw Error("First argument needs to be ArrayBuffer.");return t=new Uint8Array(t),this.checksum=o(this.checksum,t)}),i.clone=function(){return new a(this.checksum)},e}();return i.from=function(t){if(null==t)throw Error("First argument needs to be a string.");return n(1,t.toString())},i.fromUtf8=function(t){if(null==t)throw Error("First argument needs to be a string.");return t=r(t.toString()),n(1,t)},t&&(i.fromBuffer=function(t){if(!s(t))throw Error("First argument need to be ArrayBuffer.");return t=new Uint8Array(t),o(1,t)}),i});

var QRCode;!function(){function t(t){this.mode=u.MODE_8BIT_BYTE,this.data=t,this.parsedData=[];for(var e=0,r=this.data.length;r>e;e++){var o=[],i=this.data.charCodeAt(e);i>65536?(o[0]=240|(1835008&i)>>>18,o[1]=128|(258048&i)>>>12,o[2]=128|(4032&i)>>>6,o[3]=128|63&i):i>2048?(o[0]=224|(61440&i)>>>12,o[1]=128|(4032&i)>>>6,o[2]=128|63&i):i>128?(o[0]=192|(1984&i)>>>6,o[1]=128|63&i):o[0]=i,this.parsedData.push(o)}this.parsedData=Array.prototype.concat.apply([],this.parsedData),this.parsedData.length!=this.data.length&&(this.parsedData.unshift(191),this.parsedData.unshift(187),this.parsedData.unshift(239))}function e(t,e){this.typeNumber=t,this.errorCorrectLevel=e,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function r(t,e){if(void 0==t.length)throw new Error(t.length+"/"+e);for(var r=0;r<t.length&&0==t[r];)r++;this.num=new Array(t.length-r+e);for(var o=0;o<t.length-r;o++)this.num[o]=t[o+r]}function o(t,e){this.totalCount=t,this.dataCount=e}function i(){this.buffer=[],this.length=0}function n(){return"undefined"!=typeof CanvasRenderingContext2D}function a(){var t=!1,e=navigator.userAgent;if(/android/i.test(e)){t=!0;var r=e.toString().match(/android ([0-9]\.[0-9])/i);r&&r[1]&&(t=parseFloat(r[1]))}return t}function s(t,e){for(var r=1,o=h(t),i=0,n=p.length;n>=i;i++){var a=0;switch(e){case l.L:a=p[i][0];break;case l.M:a=p[i][1];break;case l.Q:a=p[i][2];break;case l.H:a=p[i][3]}if(a>=o)break;r++}if(r>p.length)throw new Error("Too long data");return r}function h(t){var e=encodeURI(t).toString().replace(/\%[0-9a-fA-F]{2}/g,"a");return e.length+(e.length!=t?3:0)}t.prototype={getLength:function(t){return this.parsedData.length},write:function(t){for(var e=0,r=this.parsedData.length;r>e;e++)t.put(this.parsedData[e],8)}},e.prototype={addData:function(e){var r=new t(e);this.dataList.push(r),this.dataCache=null},isDark:function(t,e){if(0>t||this.moduleCount<=t||0>e||this.moduleCount<=e)throw new Error(t+","+e);return this.modules[t][e]},getModuleCount:function(){return this.moduleCount},make:function(){this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(t,r){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var o=0;o<this.moduleCount;o++){this.modules[o]=new Array(this.moduleCount);for(var i=0;i<this.moduleCount;i++)this.modules[o][i]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(t,r),this.typeNumber>=7&&this.setupTypeNumber(t),null==this.dataCache&&(this.dataCache=e.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,r)},setupPositionProbePattern:function(t,e){for(var r=-1;7>=r;r++)if(!(-1>=t+r||this.moduleCount<=t+r))for(var o=-1;7>=o;o++)-1>=e+o||this.moduleCount<=e+o||(r>=0&&6>=r&&(0==o||6==o)||o>=0&&6>=o&&(0==r||6==r)||r>=2&&4>=r&&o>=2&&4>=o?this.modules[t+r][e+o]=!0:this.modules[t+r][e+o]=!1)},getBestMaskPattern:function(){for(var t=0,e=0,r=0;8>r;r++){this.makeImpl(!0,r);var o=f.getLostPoint(this);(0==r||t>o)&&(t=o,e=r)}return e},createMovieClip:function(t,e,r){var o=t.createEmptyMovieClip(e,r),i=1;this.make();for(var n=0;n<this.modules.length;n++)for(var a=n*i,s=0;s<this.modules[n].length;s++){var h=s*i,u=this.modules[n][s];u&&(o.beginFill(0,100),o.moveTo(h,a),o.lineTo(h+i,a),o.lineTo(h+i,a+i),o.lineTo(h,a+i),o.endFill())}return o},setupTimingPattern:function(){for(var t=8;t<this.moduleCount-8;t++)null==this.modules[t][6]&&(this.modules[t][6]=t%2==0);for(var e=8;e<this.moduleCount-8;e++)null==this.modules[6][e]&&(this.modules[6][e]=e%2==0)},setupPositionAdjustPattern:function(){for(var t=f.getPatternPosition(this.typeNumber),e=0;e<t.length;e++)for(var r=0;r<t.length;r++){var o=t[e],i=t[r];if(null==this.modules[o][i])for(var n=-2;2>=n;n++)for(var a=-2;2>=a;a++)-2==n||2==n||-2==a||2==a||0==n&&0==a?this.modules[o+n][i+a]=!0:this.modules[o+n][i+a]=!1}},setupTypeNumber:function(t){for(var e=f.getBCHTypeNumber(this.typeNumber),r=0;18>r;r++){var o=!t&&1==(e>>r&1);this.modules[Math.floor(r/3)][r%3+this.moduleCount-8-3]=o}for(var r=0;18>r;r++){var o=!t&&1==(e>>r&1);this.modules[r%3+this.moduleCount-8-3][Math.floor(r/3)]=o}},setupTypeInfo:function(t,e){for(var r=this.errorCorrectLevel<<3|e,o=f.getBCHTypeInfo(r),i=0;15>i;i++){var n=!t&&1==(o>>i&1);6>i?this.modules[i][8]=n:8>i?this.modules[i+1][8]=n:this.modules[this.moduleCount-15+i][8]=n}for(var i=0;15>i;i++){var n=!t&&1==(o>>i&1);8>i?this.modules[8][this.moduleCount-i-1]=n:9>i?this.modules[8][15-i-1+1]=n:this.modules[8][15-i-1]=n}this.modules[this.moduleCount-8][8]=!t},mapData:function(t,e){for(var r=-1,o=this.moduleCount-1,i=7,n=0,a=this.moduleCount-1;a>0;a-=2)for(6==a&&a--;;){for(var s=0;2>s;s++)if(null==this.modules[o][a-s]){var h=!1;n<t.length&&(h=1==(t[n]>>>i&1));var u=f.getMask(e,o,a-s);u&&(h=!h),this.modules[o][a-s]=h,i--,-1==i&&(n++,i=7)}if(o+=r,0>o||this.moduleCount<=o){o-=r,r=-r;break}}}},e.PAD0=236,e.PAD1=17,e.createData=function(t,r,n){for(var a=o.getRSBlocks(t,r),s=new i,h=0;h<n.length;h++){var u=n[h];s.put(u.mode,4),s.put(u.getLength(),f.getLengthInBits(u.mode,t)),u.write(s)}for(var l=0,h=0;h<a.length;h++)l+=a[h].dataCount;if(s.getLengthInBits()>8*l)throw new Error("code length overflow. ("+s.getLengthInBits()+">"+8*l+")");for(s.getLengthInBits()+4<=8*l&&s.put(0,4);s.getLengthInBits()%8!=0;)s.putBit(!1);for(;;){if(s.getLengthInBits()>=8*l)break;if(s.put(e.PAD0,8),s.getLengthInBits()>=8*l)break;s.put(e.PAD1,8)}return e.createBytes(s,a)},e.createBytes=function(t,e){for(var o=0,i=0,n=0,a=new Array(e.length),s=new Array(e.length),h=0;h<e.length;h++){var u=e[h].dataCount,l=e[h].totalCount-u;i=Math.max(i,u),n=Math.max(n,l),a[h]=new Array(u);for(var g=0;g<a[h].length;g++)a[h][g]=255&t.buffer[g+o];o+=u;var d=f.getErrorCorrectPolynomial(l),c=new r(a[h],d.getLength()-1),p=c.mod(d);s[h]=new Array(d.getLength()-1);for(var g=0;g<s[h].length;g++){var m=g+p.getLength()-s[h].length;s[h][g]=m>=0?p.get(m):0}}for(var v=0,g=0;g<e.length;g++)v+=e[g].totalCount;for(var _=new Array(v),C=0,g=0;i>g;g++)for(var h=0;h<e.length;h++)g<a[h].length&&(_[C++]=a[h][g]);for(var g=0;n>g;g++)for(var h=0;h<e.length;h++)g<s[h].length&&(_[C++]=s[h][g]);return _};for(var u={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},l={L:1,M:0,Q:3,H:2},g={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},f={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(t){for(var e=t<<10;f.getBCHDigit(e)-f.getBCHDigit(f.G15)>=0;)e^=f.G15<<f.getBCHDigit(e)-f.getBCHDigit(f.G15);return(t<<10|e)^f.G15_MASK},getBCHTypeNumber:function(t){for(var e=t<<12;f.getBCHDigit(e)-f.getBCHDigit(f.G18)>=0;)e^=f.G18<<f.getBCHDigit(e)-f.getBCHDigit(f.G18);return t<<12|e},getBCHDigit:function(t){for(var e=0;0!=t;)e++,t>>>=1;return e},getPatternPosition:function(t){return f.PATTERN_POSITION_TABLE[t-1]},getMask:function(t,e,r){switch(t){case g.PATTERN000:return(e+r)%2==0;case g.PATTERN001:return e%2==0;case g.PATTERN010:return r%3==0;case g.PATTERN011:return(e+r)%3==0;case g.PATTERN100:return(Math.floor(e/2)+Math.floor(r/3))%2==0;case g.PATTERN101:return e*r%2+e*r%3==0;case g.PATTERN110:return(e*r%2+e*r%3)%2==0;case g.PATTERN111:return(e*r%3+(e+r)%2)%2==0;default:throw new Error("bad maskPattern:"+t)}},getErrorCorrectPolynomial:function(t){for(var e=new r([1],0),o=0;t>o;o++)e=e.multiply(new r([1,d.gexp(o)],0));return e},getLengthInBits:function(t,e){if(e>=1&&10>e)switch(t){case u.MODE_NUMBER:return 10;case u.MODE_ALPHA_NUM:return 9;case u.MODE_8BIT_BYTE:return 8;case u.MODE_KANJI:return 8;default:throw new Error("mode:"+t)}else if(27>e)switch(t){case u.MODE_NUMBER:return 12;case u.MODE_ALPHA_NUM:return 11;case u.MODE_8BIT_BYTE:return 16;case u.MODE_KANJI:return 10;default:throw new Error("mode:"+t)}else{if(!(41>e))throw new Error("type:"+e);switch(t){case u.MODE_NUMBER:return 14;case u.MODE_ALPHA_NUM:return 13;case u.MODE_8BIT_BYTE:return 16;case u.MODE_KANJI:return 12;default:throw new Error("mode:"+t)}}},getLostPoint:function(t){for(var e=t.getModuleCount(),r=0,o=0;e>o;o++)for(var i=0;e>i;i++){for(var n=0,a=t.isDark(o,i),s=-1;1>=s;s++)if(!(0>o+s||o+s>=e))for(var h=-1;1>=h;h++)0>i+h||i+h>=e||(0!=s||0!=h)&&a==t.isDark(o+s,i+h)&&n++;n>5&&(r+=3+n-5)}for(var o=0;e-1>o;o++)for(var i=0;e-1>i;i++){var u=0;t.isDark(o,i)&&u++,t.isDark(o+1,i)&&u++,t.isDark(o,i+1)&&u++,t.isDark(o+1,i+1)&&u++,(0==u||4==u)&&(r+=3)}for(var o=0;e>o;o++)for(var i=0;e-6>i;i++)t.isDark(o,i)&&!t.isDark(o,i+1)&&t.isDark(o,i+2)&&t.isDark(o,i+3)&&t.isDark(o,i+4)&&!t.isDark(o,i+5)&&t.isDark(o,i+6)&&(r+=40);for(var i=0;e>i;i++)for(var o=0;e-6>o;o++)t.isDark(o,i)&&!t.isDark(o+1,i)&&t.isDark(o+2,i)&&t.isDark(o+3,i)&&t.isDark(o+4,i)&&!t.isDark(o+5,i)&&t.isDark(o+6,i)&&(r+=40);for(var l=0,i=0;e>i;i++)for(var o=0;e>o;o++)t.isDark(o,i)&&l++;var g=Math.abs(100*l/e/e-50)/5;return r+=10*g}},d={glog:function(t){if(1>t)throw new Error("glog("+t+")");return d.LOG_TABLE[t]},gexp:function(t){for(;0>t;)t+=255;for(;t>=256;)t-=255;return d.EXP_TABLE[t]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},c=0;8>c;c++)d.EXP_TABLE[c]=1<<c;for(var c=8;256>c;c++)d.EXP_TABLE[c]=d.EXP_TABLE[c-4]^d.EXP_TABLE[c-5]^d.EXP_TABLE[c-6]^d.EXP_TABLE[c-8];for(var c=0;255>c;c++)d.LOG_TABLE[d.EXP_TABLE[c]]=c;r.prototype={get:function(t){return this.num[t]},getLength:function(){return this.num.length},multiply:function(t){for(var e=new Array(this.getLength()+t.getLength()-1),o=0;o<this.getLength();o++)for(var i=0;i<t.getLength();i++)e[o+i]^=d.gexp(d.glog(this.get(o))+d.glog(t.get(i)));return new r(e,0)},mod:function(t){if(this.getLength()-t.getLength()<0)return this;for(var e=d.glog(this.get(0))-d.glog(t.get(0)),o=new Array(this.getLength()),i=0;i<this.getLength();i++)o[i]=this.get(i);for(var i=0;i<t.getLength();i++)o[i]^=d.gexp(d.glog(t.get(i))+e);return new r(o,0).mod(t)}},o.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],o.getRSBlocks=function(t,e){var r=o.getRsBlockTable(t,e);if(void 0==r)throw new Error("bad rs block @ typeNumber:"+t+"/errorCorrectLevel:"+e);for(var i=r.length/3,n=[],a=0;i>a;a++)for(var s=r[3*a+0],h=r[3*a+1],u=r[3*a+2],l=0;s>l;l++)n.push(new o(h,u));return n},o.getRsBlockTable=function(t,e){switch(e){case l.L:return o.RS_BLOCK_TABLE[4*(t-1)+0];case l.M:return o.RS_BLOCK_TABLE[4*(t-1)+1];case l.Q:return o.RS_BLOCK_TABLE[4*(t-1)+2];case l.H:return o.RS_BLOCK_TABLE[4*(t-1)+3];default:return}},i.prototype={get:function(t){var e=Math.floor(t/8);return 1==(this.buffer[e]>>>7-t%8&1)},put:function(t,e){for(var r=0;e>r;r++)this.putBit(1==(t>>>e-r-1&1))},getLengthInBits:function(){return this.length},putBit:function(t){var e=Math.floor(this.length/8);this.buffer.length<=e&&this.buffer.push(0),t&&(this.buffer[e]|=128>>>this.length%8),this.length++}};var p=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]],m=function(){var t=function(t,e){this._el=t,this._htOption=e};return t.prototype.draw=function(t){function e(t,e){var r=document.createElementNS("http://www.w3.org/2000/svg",t);for(var o in e)e.hasOwnProperty(o)&&r.setAttribute(o,e[o]);return r}var r=this._htOption,o=this._el,i=t.getModuleCount(),n=Math.floor(r.width/i),a=Math.floor(r.height/i);this.clear();var s=e("svg",{viewBox:"0 0 "+String(i)+" "+String(i),width:"100%",height:"100%",fill:r.colorLight});s.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:xlink","http://www.w3.org/1999/xlink"),o.appendChild(s),s.appendChild(e("rect",{fill:r.colorLight,width:"100%",height:"100%"})),s.appendChild(e("rect",{fill:r.colorDark,width:"1",height:"1",id:"template"}));for(var h=0;i>h;h++)for(var u=0;i>u;u++)if(t.isDark(h,u)){var l=e("use",{x:String(u),y:String(h)});l.setAttributeNS("http://www.w3.org/1999/xlink","href","#template"),s.appendChild(l)}},t.prototype.clear=function(){for(;this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)},t}(),v="svg"===document.documentElement.tagName.toLowerCase(),_=v?m:n()?function(){function t(){this._elImage.src=this._elCanvas.toDataURL("image/png"),this._elImage.style.display="block",this._elCanvas.style.display="none"}function e(t,e){var r=this;if(r._fFail=e,r._fSuccess=t,null===r._bSupportDataURI){var o=document.createElement("img"),i=function(){r._bSupportDataURI=!1,r._fFail&&r._fFail.call(r)},n=function(){r._bSupportDataURI=!0,r._fSuccess&&r._fSuccess.call(r)};return o.onabort=i,o.onerror=i,o.onload=n,void(o.src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==")}r._bSupportDataURI===!0&&r._fSuccess?r._fSuccess.call(r):r._bSupportDataURI===!1&&r._fFail&&r._fFail.call(r)}if(this._android&&this._android<=2.1){var r=1/window.devicePixelRatio,o=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(t,e,i,n,a,s,h,u,l){if("nodeName"in t&&/img/i.test(t.nodeName))for(var g=arguments.length-1;g>=1;g--)arguments[g]=arguments[g]*r;else"undefined"==typeof u&&(arguments[1]*=r,arguments[2]*=r,arguments[3]*=r,arguments[4]*=r);o.apply(this,arguments)}}var i=function(t,e){this._bIsPainted=!1,this._android=a(),this._htOption=e,this._elCanvas=document.createElement("canvas"),this._elCanvas.width=e.width,this._elCanvas.height=e.height,t.appendChild(this._elCanvas),this._el=t,this._oContext=this._elCanvas.getContext("2d"),this._bIsPainted=!1,this._elImage=document.createElement("img"),this._elImage.alt="Scan me!",this._elImage.style.display="none",this._el.appendChild(this._elImage),this._bSupportDataURI=null};return i.prototype.draw=function(t){var e=this._elImage,r=this._oContext,o=this._htOption,i=t.getModuleCount(),n=o.width/i,a=o.height/i,s=Math.round(n),h=Math.round(a);e.style.display="none",this.clear();for(var u=0;i>u;u++)for(var l=0;i>l;l++){var g=t.isDark(u,l),f=l*n,d=u*a;r.strokeStyle=g?o.colorDark:o.colorLight,r.lineWidth=1,r.fillStyle=g?o.colorDark:o.colorLight,r.fillRect(f,d,n,a),r.strokeRect(Math.floor(f)+.5,Math.floor(d)+.5,s,h),r.strokeRect(Math.ceil(f)-.5,Math.ceil(d)-.5,s,h)}this._bIsPainted=!0},i.prototype.makeImage=function(){this._bIsPainted&&e.call(this,t)},i.prototype.isPainted=function(){return this._bIsPainted},i.prototype.clear=function(){this._oContext.clearRect(0,0,this._elCanvas.width,this._elCanvas.height),this._bIsPainted=!1},i.prototype.round=function(t){return t?Math.floor(1e3*t)/1e3:t},i}():function(){var t=function(t,e){this._el=t,this._htOption=e};return t.prototype.draw=function(t){for(var e=this._htOption,r=this._el,o=t.getModuleCount(),i=Math.floor(e.width/o),n=Math.floor(e.height/o),a=['<table style="border:0;border-collapse:collapse;">'],s=0;o>s;s++){a.push("<tr>");for(var h=0;o>h;h++)a.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:'+i+"px;height:"+n+"px;background-color:"+(t.isDark(s,h)?e.colorDark:e.colorLight)+';"></td>');a.push("</tr>")}a.push("</table>"),r.innerHTML=a.join("");var u=r.childNodes[0],l=(e.width-u.offsetWidth)/2,g=(e.height-u.offsetHeight)/2;l>0&&g>0&&(u.style.margin=g+"px "+l+"px")},t.prototype.clear=function(){this._el.innerHTML=""},t}();QRCode=function(t,e){if(this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:l.H},"string"==typeof e&&(e={text:e}),e)for(var r in e)this._htOption[r]=e[r];"string"==typeof t&&(t=document.getElementById(t)),this._htOption.useSVG&&(_=m),this._android=a(),this._el=t,this._oQRCode=null,this._oDrawing=new _(this._el,this._htOption),this._htOption.text&&this.makeCode(this._htOption.text)},QRCode.prototype.makeCode=function(t){this._oQRCode=new e(s(t,this._htOption.correctLevel),this._htOption.correctLevel),this._oQRCode.addData(t),this._oQRCode.make(),this._el.title=t,this._oDrawing.draw(this._oQRCode),this.makeImage()},QRCode.prototype.makeImage=function(){"function"==typeof this._oDrawing.makeImage&&(!this._android||this._android>=3)&&this._oDrawing.makeImage()},QRCode.prototype.clear=function(){this._oDrawing.clear()},QRCode.CorrectLevel=l}();

!function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery"],t):"object"==typeof exports?module.exports=t(require("jquery")):t(jQuery)}(function($){"use strict";function t(){var t=document.createElement("input");return t.setAttribute("type","range"),"text"!==t.type}function i(t,i){var e=Array.prototype.slice.call(arguments,2);return setTimeout(function(){return t.apply(null,e)},i)}function e(t,i){return i=i||100,function(){if(!t.debouncing){var e=Array.prototype.slice.apply(arguments);t.lastReturnVal=t.apply(window,e),t.debouncing=!0}return clearTimeout(t.debounceTimeout),t.debounceTimeout=setTimeout(function(){t.debouncing=!1},i),t.lastReturnVal}}function n(t){return t&&(0===t.offsetWidth||0===t.offsetHeight||t.open===!1)}function o(t){for(var i=[],e=t.parentNode;n(e);)i.push(e),e=e.parentNode;return i}function s(t,i){function e(t){"undefined"!=typeof t.open&&(t.open=t.open?!1:!0)}var n=o(t),s=n.length,r=[],h=t[i];if(s){for(var a=0;s>a;a++)r[a]=n[a].style.cssText,n[a].style.display="block",n[a].style.height="0",n[a].style.overflow="hidden",n[a].style.visibility="hidden",e(n[a]);h=t[i];for(var l=0;s>l;l++)n[l].style.cssText=r[l],e(n[l])}return h}function r(t,i){var e=parseFloat(t);return Number.isNaN(e)?i:e}function h(t){return t.charAt(0).toUpperCase()+t.substr(1)}function a(t,n){if(this.$window=$(window),this.$document=$(document),this.$element=$(t),this.options=$.extend({},p,n),this.polyfill=this.options.polyfill,this.orientation=this.$element[0].getAttribute("data-orientation")||this.options.orientation,this.onInit=this.options.onInit,this.onSlide=this.options.onSlide,this.onSlideEnd=this.options.onSlideEnd,this.DIMENSION=f.orientation[this.orientation].dimension,this.DIRECTION=f.orientation[this.orientation].direction,this.DIRECTION_STYLE=f.orientation[this.orientation].directionStyle,this.COORDINATE=f.orientation[this.orientation].coordinate,this.polyfill&&u)return!1;this.identifier="js-"+l+"-"+d++,this.startEvent=this.options.startEvent.join("."+this.identifier+" ")+"."+this.identifier,this.moveEvent=this.options.moveEvent.join("."+this.identifier+" ")+"."+this.identifier,this.endEvent=this.options.endEvent.join("."+this.identifier+" ")+"."+this.identifier,this.toFixed=(this.step+"").replace(".","").length-1,this.$fill=$('<div class="'+this.options.fillClass+'" />'),this.$handle=$('<div class="'+this.options.handleClass+'" />'),this.$range=$('<div class="'+this.options.rangeClass+" "+this.options[this.orientation+"Class"]+'" id="'+this.identifier+'" />').insertAfter(this.$element).prepend(this.$fill,this.$handle),this.$element.css({position:"absolute",width:"1px",height:"1px",overflow:"hidden",opacity:"0"}),this.handleDown=$.proxy(this.handleDown,this),this.handleMove=$.proxy(this.handleMove,this),this.handleEnd=$.proxy(this.handleEnd,this),this.init();var o=this;this.$window.on("resize."+this.identifier,e(function(){i(function(){o.update()},300)},20)),this.$document.on(this.startEvent,"#"+this.identifier+":not(."+this.options.disabledClass+")",this.handleDown),this.$element.on("change."+this.identifier,function(t,i){if(!i||i.origin!==o.identifier){var e=t.target.value,n=o.getPositionFromValue(e);o.setPosition(n)}})}Number.isNaN=Number.isNaN||function(t){return"number"==typeof t&&t!==t};var l="rangeslider",d=0,u=t(),p={polyfill:!0,orientation:"horizontal",rangeClass:"rangeslider",disabledClass:"rangeslider--disabled",horizontalClass:"rangeslider--horizontal",verticalClass:"rangeslider--vertical",fillClass:"rangeslider__fill",handleClass:"rangeslider__handle",startEvent:["mousedown","touchstart","pointerdown"],moveEvent:["mousemove","touchmove","pointermove"],endEvent:["mouseup","touchend","pointerup"]},f={orientation:{horizontal:{dimension:"width",direction:"left",directionStyle:"left",coordinate:"x"},vertical:{dimension:"height",direction:"top",directionStyle:"bottom",coordinate:"y"}}};a.prototype.init=function(){this.update(!0,!1),this.onInit&&"function"==typeof this.onInit&&this.onInit()},a.prototype.update=function(t,i){t=t||!1,t&&(this.min=r(this.$element[0].getAttribute("min"),0),this.max=r(this.$element[0].getAttribute("max"),100),this.value=r(this.$element[0].value,Math.round(this.min+(this.max-this.min)/2)),this.step=r(this.$element[0].getAttribute("step"),1)),this.handleDimension=s(this.$handle[0],"offset"+h(this.DIMENSION)),this.rangeDimension=s(this.$range[0],"offset"+h(this.DIMENSION)),this.maxHandlePos=this.rangeDimension-this.handleDimension,this.grabPos=this.handleDimension/2,this.position=this.getPositionFromValue(this.value),this.$element[0].disabled?this.$range.addClass(this.options.disabledClass):this.$range.removeClass(this.options.disabledClass),this.setPosition(this.position,i)},a.prototype.handleDown=function(t){if(this.$document.on(this.moveEvent,this.handleMove),this.$document.on(this.endEvent,this.handleEnd),!((" "+t.target.className+" ").replace(/[\n\t]/g," ").indexOf(this.options.handleClass)>-1)){var i=this.getRelativePosition(t),e=this.$range[0].getBoundingClientRect()[this.DIRECTION],n=this.getPositionFromNode(this.$handle[0])-e,o="vertical"===this.orientation?this.maxHandlePos-(i-this.grabPos):i-this.grabPos;this.setPosition(o),i>=n&&i<n+this.handleDimension&&(this.grabPos=i-n)}},a.prototype.handleMove=function(t){t.preventDefault();var i=this.getRelativePosition(t),e="vertical"===this.orientation?this.maxHandlePos-(i-this.grabPos):i-this.grabPos;this.setPosition(e)},a.prototype.handleEnd=function(t){t.preventDefault(),this.$document.off(this.moveEvent,this.handleMove),this.$document.off(this.endEvent,this.handleEnd),this.$element.trigger("change",{origin:this.identifier}),this.onSlideEnd&&"function"==typeof this.onSlideEnd&&this.onSlideEnd(this.position,this.value)},a.prototype.cap=function(t,i,e){return i>t?i:t>e?e:t},a.prototype.setPosition=function(t,i){var e,n;void 0===i&&(i=!0),e=this.getValueFromPosition(this.cap(t,0,this.maxHandlePos)),n=this.getPositionFromValue(e),this.$fill[0].style[this.DIMENSION]=n+this.grabPos+"px",this.$handle[0].style[this.DIRECTION_STYLE]=n+"px",this.setValue(e),this.position=n,this.value=e,i&&this.onSlide&&"function"==typeof this.onSlide&&this.onSlide(n,e)},a.prototype.getPositionFromNode=function(t){for(var i=0;null!==t;)i+=t.offsetLeft,t=t.offsetParent;return i},a.prototype.getRelativePosition=function(t){var i=h(this.COORDINATE),e=this.$range[0].getBoundingClientRect()[this.DIRECTION],n=0;return"undefined"!=typeof t["page"+i]?n=t["client"+i]:"undefined"!=typeof t.originalEvent["client"+i]?n=t.originalEvent["client"+i]:t.originalEvent.touches&&t.originalEvent.touches[0]&&"undefined"!=typeof t.originalEvent.touches[0]["client"+i]?n=t.originalEvent.touches[0]["client"+i]:t.currentPoint&&"undefined"!=typeof t.currentPoint[this.COORDINATE]&&(n=t.currentPoint[this.COORDINATE]),n-e},a.prototype.getPositionFromValue=function(t){var i,e;return i=(t-this.min)/(this.max-this.min),e=Number.isNaN(i)?0:i*this.maxHandlePos},a.prototype.getValueFromPosition=function(t){var i,e;return i=t/(this.maxHandlePos||1),e=this.step*Math.round(i*(this.max-this.min)/this.step)+this.min,Number(e.toFixed(this.toFixed))},a.prototype.setValue=function(t){(t!==this.value||""===this.$element[0].value)&&this.$element.val(t).trigger("input",{origin:this.identifier})},a.prototype.destroy=function(){this.$document.off("."+this.identifier),this.$window.off("."+this.identifier),this.$element.off("."+this.identifier).removeAttr("style").removeData("plugin_"+l),this.$range&&this.$range.length&&this.$range[0].parentNode.removeChild(this.$range[0])},$.fn[l]=function(t){var i=Array.prototype.slice.call(arguments,1);return this.each(function(){var e=$(this),n=e.data("plugin_"+l);n||e.data("plugin_"+l,n=new a(this,t)),"string"==typeof t&&n[t].apply(n,i)})}});

!function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery"],t):"object"==typeof exports&&"object"==typeof module?module.exports=t:t(jQuery)}(function($,t){"use strict";function e(t,e,r,n){for(var a=[],i=0;i<t.length;i++){var s=t[i];if(s){var o=tinycolor(s),l=o.toHsl().l<.5?"sp-thumb-el sp-thumb-dark":"sp-thumb-el sp-thumb-light";l+=tinycolor.equals(e,s)?" sp-thumb-active":"";var c=o.toString(n.preferredFormat||"rgb"),f=g?"background-color:"+o.toRgbString():"filter:"+o.toFilter();a.push('<span title="'+c+'" data-color="'+o.toRgbString()+'" class="'+l+'"><span class="sp-thumb-inner" style="'+f+';" /></span>')}else{var u="sp-clear-display";a.push($("<div />").append($('<span data-color="" style="background-color:transparent;" class="'+u+'"></span>').attr("title",n.noColorSelectedText)).html())}}return"<div class='sp-cf "+r+"'>"+a.join("")+"</div>"}function r(){for(var t=0;t<d.length;t++)d[t]&&d[t].hide()}function n(t,e){var r=$.extend({},h,t);return r.callbacks={move:l(r.move,e),change:l(r.change,e),show:l(r.show,e),hide:l(r.hide,e),beforeShow:l(r.beforeShow,e)},r}function a(a,s){function l(){if(W.showPaletteOnly&&(W.showPalette=!0),It.text(W.showPaletteOnly?W.togglePaletteMoreText:W.togglePaletteLessText),W.palette){dt=W.palette.slice(0),pt=$.isArray(dt[0])?dt:[dt],gt={};for(var t=0;t<pt.length;t++)for(var e=0;e<pt[t].length;e++){var r=tinycolor(pt[t][e]).toRgbString();gt[r]=!0}}St.toggleClass("sp-flat",X),St.toggleClass("sp-input-disabled",!W.showInput),St.toggleClass("sp-alpha-enabled",W.showAlpha),St.toggleClass("sp-clear-enabled",Ut),St.toggleClass("sp-buttons-disabled",!W.showButtons),St.toggleClass("sp-palette-buttons-disabled",!W.togglePaletteOnly),St.toggleClass("sp-palette-disabled",!W.showPalette),St.toggleClass("sp-palette-only",W.showPaletteOnly),St.toggleClass("sp-initial-disabled",!W.showInitial),St.addClass(W.className).addClass(W.containerClassName),I()}function h(){function t(t){return t.data&&t.data.ignore?(F($(t.target).closest(".sp-thumb-el").data("color")),E()):(F($(t.target).closest(".sp-thumb-el").data("color")),E(),D(!0),W.hideAfterPaletteSelect&&H()),!1}if(p&&St.find("*:not(input)").attr("unselectable","on"),l(),Lt&&xt.after(Kt).hide(),Ut||qt.hide(),X)xt.after(St).hide();else{var e="parent"===W.appendTo?xt.parent():$(W.appendTo);1!==e.length&&(e=$("body")),e.append(St)}m(),Vt.bind("click.spectrum touchstart.spectrum",function(t){kt||P(),t.stopPropagation(),$(t.target).is("input")||t.preventDefault()}),(xt.is(":disabled")||W.disabled===!0)&&K(),St.click(o),Ot.change(C),Ot.bind("paste",function(){setTimeout(C,1)}),Ot.keydown(function(t){13==t.keyCode&&C()}),jt.text(W.cancelText),jt.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),T(),H()}),qt.attr("title",W.clearText),qt.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),Jt=!0,E(),X&&D(!0)}),Dt.text(W.chooseText),Dt.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),p&&Ot.is(":focus")&&Ot.trigger("change"),N()&&(D(!0),H())}),It.text(W.showPaletteOnly?W.togglePaletteMoreText:W.togglePaletteLessText),It.bind("click.spectrum",function(t){t.stopPropagation(),t.preventDefault(),W.showPaletteOnly=!W.showPaletteOnly,W.showPaletteOnly||X||St.css("left","-="+(Ct.outerWidth(!0)+5)),l()}),c(Tt,function(t,e,r){ht=t/st,Jt=!1,r.shiftKey&&(ht=Math.round(10*ht)/10),E()},k,S),c(Mt,function(t,e){ct=parseFloat(e/at),Jt=!1,W.showAlpha||(ht=1),E()},k,S),c(Pt,function(t,e,r){if(r.shiftKey){if(!yt){var n=ft*et,a=rt-ut*rt,i=Math.abs(t-n)>Math.abs(e-a);yt=i?"x":"y"}}else yt=null;var s=!yt||"x"===yt,o=!yt||"y"===yt;s&&(ft=parseFloat(t/et)),o&&(ut=parseFloat((rt-e)/rt)),Jt=!1,W.showAlpha||(ht=1),E()},k,S),Wt?(F(Wt),j(),Gt=Yt||tinycolor(Wt).format,y(Wt)):j(),X&&A();var r=p?"mousedown.spectrum":"click.spectrum touchstart.spectrum";Nt.delegate(".sp-thumb-el",r,t),Et.delegate(".sp-thumb-el:nth-child(1)",r,{ignore:!0},t)}function m(){if(G&&window.localStorage){try{var t=window.localStorage[G].split(",#");t.length>1&&(delete window.localStorage[G],$.each(t,function(t,e){y(e)}))}catch(e){}try{bt=window.localStorage[G].split(";")}catch(e){}}}function y(t){if(Y){var e=tinycolor(t).toRgbString();if(!gt[e]&&-1===$.inArray(e,bt))for(bt.push(e);bt.length>vt;)bt.shift();if(G&&window.localStorage)try{window.localStorage[G]=bt.join(";")}catch(r){}}}function w(){var t=[];if(W.showPalette)for(var e=0;e<bt.length;e++){var r=tinycolor(bt[e]).toRgbString();gt[r]||t.push(bt[e])}return t.reverse().slice(0,W.maxSelectionSize)}function _(){var t=O(),r=$.map(pt,function(r,n){return e(r,t,"sp-palette-row sp-palette-row-"+n,W)});m(),bt&&r.push(e(w(),t,"sp-palette-row sp-palette-row-selection",W)),Nt.html(r.join(""))}function x(){if(W.showInitial){var t=Xt,r=O();Et.html(e([t,r],r,"sp-palette-row-initial",W))}}function k(){(0>=rt||0>=et||0>=at)&&I(),tt=!0,St.addClass(mt),yt=null,xt.trigger("dragstart.spectrum",[O()])}function S(){tt=!1,St.removeClass(mt),xt.trigger("dragstop.spectrum",[O()])}function C(){var t=Ot.val();if(null!==t&&""!==t||!Ut){var e=tinycolor(t);e.isValid()?(F(e),D(!0)):Ot.addClass("sp-validation-error")}else F(null),D(!0)}function P(){Z?H():A()}function A(){var t=$.Event("beforeShow.spectrum");return Z?void I():(xt.trigger(t,[O()]),void(J.beforeShow(O())===!1||t.isDefaultPrevented()||(r(),Z=!0,$(wt).bind("keydown.spectrum",M),$(wt).bind("click.spectrum",R),$(window).bind("resize.spectrum",U),Kt.addClass("sp-active"),St.removeClass("sp-hidden"),I(),j(),Xt=O(),x(),J.show(Xt),xt.trigger("show.spectrum",[Xt]))))}function M(t){27===t.keyCode&&H()}function R(t){2!=t.button&&(tt||(Qt?D(!0):T(),H()))}function H(){Z&&!X&&(Z=!1,$(wt).unbind("keydown.spectrum",M),$(wt).unbind("click.spectrum",R),$(window).unbind("resize.spectrum",U),Kt.removeClass("sp-active"),St.addClass("sp-hidden"),J.hide(O()),xt.trigger("hide.spectrum",[O()]))}function T(){F(Xt,!0)}function F(t,e){if(tinycolor.equals(t,O()))return void j();var r,n;!t&&Ut?Jt=!0:(Jt=!1,r=tinycolor(t),n=r.toHsv(),ct=n.h%360/360,ft=n.s,ut=n.v,ht=n.a),j(),r&&r.isValid()&&!e&&(Gt=Yt||r.getFormat())}function O(t){return t=t||{},Ut&&Jt?null:tinycolor.fromRatio({h:ct,s:ft,v:ut,a:Math.round(100*ht)/100},{format:t.format||Gt})}function N(){return!Ot.hasClass("sp-validation-error")}function E(){j(),J.move(O()),xt.trigger("move.spectrum",[O()])}function j(){Ot.removeClass("sp-validation-error"),q();var t=tinycolor.fromRatio({h:ct,s:1,v:1});Pt.css("background-color",t.toHexString());var e=Gt;1>ht&&(0!==ht||"name"!==e)&&("hex"===e||"hex3"===e||"hex6"===e||"name"===e)&&(e="rgb");var r=O({format:e}),n="";if($t.removeClass("sp-clear-display"),$t.css("background-color","transparent"),!r&&Ut)$t.addClass("sp-clear-display");else{var a=r.toHexString(),i=r.toRgbString();if(g||1===r.alpha?$t.css("background-color",i):($t.css("background-color","transparent"),$t.css("filter",r.toFilter())),W.showAlpha){var s=r.toRgb();s.a=0;var o=tinycolor(s).toRgbString(),l="linear-gradient(left, "+o+", "+a+")";p?Ht.css("filter",tinycolor(o).toFilter({gradientType:1},a)):(Ht.css("background","-webkit-"+l),Ht.css("background","-moz-"+l),Ht.css("background","-ms-"+l),Ht.css("background","linear-gradient(to right, "+o+", "+a+")"))}n=r.toString(e)}W.showInput&&Ot.val(n),W.showPalette&&_(),x()}function q(){var t=ft,e=ut;if(Ut&&Jt)Ft.hide(),Rt.hide(),At.hide();else{Ft.show(),Rt.show(),At.show();var r=t*et,n=rt-e*rt;r=Math.max(-nt,Math.min(et-nt,r-nt)),n=Math.max(-nt,Math.min(rt-nt,n-nt)),At.css({top:n+"px",left:r+"px"});var a=ht*st;Ft.css({left:a-ot/2+"px"});var i=ct*at;Rt.css({top:i-lt+"px"})}}function D(t){var e=O(),r="",n=!tinycolor.equals(e,Xt);e&&(r=e.toString(Gt),y(e)),zt&&xt.val(r),t&&n&&(J.change(e),xt.trigger("change",[e]))}function I(){et=Pt.width(),rt=Pt.height(),nt=At.height(),it=Mt.width(),at=Mt.height(),lt=Rt.height(),st=Tt.width(),ot=Ft.width(),X||(St.css("position","absolute"),W.offset?St.offset(W.offset):St.offset(i(St,Vt))),q(),W.showPalette&&_(),xt.trigger("reflow.spectrum")}function z(){xt.show(),Vt.unbind("click.spectrum touchstart.spectrum"),St.remove(),Kt.remove(),d[Zt.id]=null}function B(e,r){return e===t?$.extend({},W):r===t?W[e]:(W[e]=r,void l())}function L(){kt=!1,xt.attr("disabled",!1),Vt.removeClass("sp-disabled")}function K(){H(),kt=!0,xt.attr("disabled",!0),Vt.addClass("sp-disabled")}function V(t){W.offset=t,I()}var W=n(s,a),X=W.flat,Y=W.showSelectionPalette,G=W.localStorageKey,Q=W.theme,J=W.callbacks,U=f(I,10),Z=!1,tt=!1,et=0,rt=0,nt=0,at=0,it=0,st=0,ot=0,lt=0,ct=0,ft=0,ut=0,ht=1,dt=[],pt=[],gt={},bt=W.selectionPalette.slice(0),vt=W.maxSelectionSize,mt="sp-dragging",yt=null,wt=a.ownerDocument,_t=wt.body,xt=$(a),kt=!1,St=$(v,wt).addClass(Q),Ct=St.find(".sp-picker-container"),Pt=St.find(".sp-color"),At=St.find(".sp-dragger"),Mt=St.find(".sp-hue"),Rt=St.find(".sp-slider"),Ht=St.find(".sp-alpha-inner"),Tt=St.find(".sp-alpha"),Ft=St.find(".sp-alpha-handle"),Ot=St.find(".sp-input"),Nt=St.find(".sp-palette"),Et=St.find(".sp-initial"),jt=St.find(".sp-cancel"),qt=St.find(".sp-clear"),Dt=St.find(".sp-choose"),It=St.find(".sp-palette-toggle"),zt=xt.is("input"),Bt=zt&&"color"===xt.attr("type")&&u(),Lt=zt&&!X,Kt=Lt?$(b).addClass(Q).addClass(W.className).addClass(W.replacerClassName):$([]),Vt=Lt?Kt:xt,$t=Kt.find(".sp-preview-inner"),Wt=W.color||zt&&xt.val(),Xt=!1,Yt=W.preferredFormat,Gt=Yt,Qt=!W.showButtons||W.clickoutFiresChange,Jt=!Wt,Ut=W.allowEmpty&&!Bt;h();var Zt={show:A,hide:H,toggle:P,reflow:I,option:B,enable:L,disable:K,offset:V,set:function(t){F(t),D()},get:O,destroy:z,container:St};return Zt.id=d.push(Zt)-1,Zt}function i(t,e){var r=0,n=t.outerWidth(),a=t.outerHeight(),i=e.outerHeight(),s=t[0].ownerDocument,o=s.documentElement,l=o.clientWidth+$(s).scrollLeft(),c=o.clientHeight+$(s).scrollTop(),f=e.offset();return f.top+=i,f.left-=Math.min(f.left,f.left+n>l&&l>n?Math.abs(f.left+n-l):0),f.top-=Math.min(f.top,f.top+a>c&&c>a?Math.abs(a+i-r):r),f}function s(){}function o(t){t.stopPropagation()}function l(t,e){var r=Array.prototype.slice,n=r.call(arguments,2);return function(){return t.apply(e,n.concat(r.call(arguments)))}}function c(t,e,r,n){function a(t){t.stopPropagation&&t.stopPropagation(),t.preventDefault&&t.preventDefault(),t.returnValue=!1}function i(r){if(c){if(p&&l.documentMode<9&&!r.button)return o();var n=r.originalEvent&&r.originalEvent.touches&&r.originalEvent.touches[0],i=n&&n.pageX||r.pageX,s=n&&n.pageY||r.pageY,g=Math.max(0,Math.min(i-f.left,h)),b=Math.max(0,Math.min(s-f.top,u));d&&a(r),e.apply(t,[g,b,r])}}function s(e){var n=e.which?3==e.which:2==e.button;n||c||r.apply(t,arguments)!==!1&&(c=!0,u=$(t).height(),h=$(t).width(),f=$(t).offset(),$(l).bind(g),$(l.body).addClass("sp-dragging"),i(e),a(e))}function o(){c&&($(l).unbind(g),$(l.body).removeClass("sp-dragging"),setTimeout(function(){n.apply(t,arguments)},0)),c=!1}e=e||function(){},r=r||function(){},n=n||function(){};var l=document,c=!1,f={},u=0,h=0,d="ontouchstart"in window,g={};g.selectstart=a,g.dragstart=a,g["touchmove mousemove"]=i,g["touchend mouseup"]=o,$(t).bind("touchstart mousedown",s)}function f(t,e,r){var n;return function(){var a=this,i=arguments,s=function(){n=null,t.apply(a,i)};r&&clearTimeout(n),(r||!n)&&(n=setTimeout(s,e))}}function u(){return $.fn.spectrum.inputTypeColorSupport()}var h={beforeShow:s,move:s,change:s,show:s,hide:s,color:!1,flat:!1,showInput:!1,allowEmpty:!1,showButtons:!0,clickoutFiresChange:!0,showInitial:!1,showPalette:!1,showPaletteOnly:!1,hideAfterPaletteSelect:!1,togglePaletteOnly:!1,showSelectionPalette:!0,localStorageKey:!1,appendTo:"body",maxSelectionSize:7,cancelText:"cancel",chooseText:"choose",togglePaletteMoreText:"more",togglePaletteLessText:"less",clearText:"Clear Color Selection",noColorSelectedText:"No Color Selected",preferredFormat:!1,className:"",containerClassName:"",replacerClassName:"",showAlpha:!1,theme:"sp-light",palette:[["#ffffff","#000000","#ff0000","#ff8000","#ffff00","#008000","#0000ff","#4b0082","#9400d3"]],selectionPalette:[],disabled:!1,offset:null},d=[],p=!!/msie/i.exec(window.navigator.userAgent),g=function(){function t(t,e){return!!~(""+t).indexOf(e)}var e=document.createElement("div"),r=e.style;return r.cssText="background-color:rgba(0,0,0,.5)",t(r.backgroundColor,"rgba")||t(r.backgroundColor,"hsla")}(),b=["<div class='sp-replacer'>","<div class='sp-preview'><div class='sp-preview-inner'></div></div>","<div class='sp-dd'>&#9660;</div>","</div>"].join(""),v=function(){var t="";if(p)for(var e=1;6>=e;e++)t+="<div class='sp-"+e+"'></div>";return["<div class='sp-container sp-hidden'>","<div class='sp-palette-container'>","<div class='sp-palette sp-thumb sp-cf'></div>","<div class='sp-palette-button-container sp-cf'>","<button type='button' class='sp-palette-toggle'></button>","</div>","</div>","<div class='sp-picker-container'>","<div class='sp-top sp-cf'>","<div class='sp-fill'></div>","<div class='sp-top-inner'>","<div class='sp-color'>","<div class='sp-sat'>","<div class='sp-val'>","<div class='sp-dragger'></div>","</div>","</div>","</div>","<div class='sp-clear sp-clear-display'>","</div>","<div class='sp-hue'>","<div class='sp-slider'></div>",t,"</div>","</div>","<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>","</div>","<div class='sp-input-container sp-cf'>","<input class='sp-input' type='text' spellcheck='false'  />","</div>","<div class='sp-initial sp-thumb sp-cf'></div>","<div class='sp-button-container sp-cf'>","<a class='sp-cancel' href='#'></a>","<button type='button' class='sp-choose'></button>","</div>","</div>","</div>"].join("")}(),m="spectrum.id";$.fn.spectrum=function(t,e){if("string"==typeof t){var r=this,n=Array.prototype.slice.call(arguments,1);return this.each(function(){var e=d[$(this).data(m)];if(e){var a=e[t];if(!a)throw new Error("Spectrum: no such method: '"+t+"'");"get"==t?r=e.get():"container"==t?r=e.container:"option"==t?r=e.option.apply(e,n):"destroy"==t?(e.destroy(),$(this).removeData(m)):a.apply(e,n)}}),r}return this.spectrum("destroy").each(function(){var e=$.extend({},t,$(this).data()),r=a(this,e);$(this).data(m,r.id)})},$.fn.spectrum.load=!0,$.fn.spectrum.loadOpts={},$.fn.spectrum.draggable=c,$.fn.spectrum.defaults=h,$.fn.spectrum.inputTypeColorSupport=function y(){if("undefined"==typeof y._cachedResult){var t=$("<input type='color'/>")[0];y._cachedResult="color"===t.type&&""!==t.value}return y._cachedResult},$.spectrum={},$.spectrum.localization={},$.spectrum.palettes={},$.fn.spectrum.processNativeColorInputs=function(){var t=$("input[type=color]");t.length&&!u()&&t.spectrum({preferredFormat:"hex6"})},function(){function t(t){var r={r:0,g:0,b:0},a=1,s=!1,o=!1;return"string"==typeof t&&(t=F(t)),"object"==typeof t&&(t.hasOwnProperty("r")&&t.hasOwnProperty("g")&&t.hasOwnProperty("b")?(r=e(t.r,t.g,t.b),s=!0,o="%"===String(t.r).substr(-1)?"prgb":"rgb"):t.hasOwnProperty("h")&&t.hasOwnProperty("s")&&t.hasOwnProperty("v")?(t.s=R(t.s),t.v=R(t.v),r=i(t.h,t.s,t.v),s=!0,o="hsv"):t.hasOwnProperty("h")&&t.hasOwnProperty("s")&&t.hasOwnProperty("l")&&(t.s=R(t.s),t.l=R(t.l),r=n(t.h,t.s,t.l),s=!0,o="hsl"),t.hasOwnProperty("a")&&(a=t.a)),a=x(a),{ok:s,format:t.format||o,r:D(255,I(r.r,0)),g:D(255,I(r.g,0)),b:D(255,I(r.b,0)),a:a}}function e(t,e,r){return{r:255*k(t,255),g:255*k(e,255),b:255*k(r,255)}}function r(t,e,r){t=k(t,255),e=k(e,255),r=k(r,255);var n=I(t,e,r),a=D(t,e,r),i,s,o=(n+a)/2;if(n==a)i=s=0;else{var l=n-a;switch(s=o>.5?l/(2-n-a):l/(n+a),n){case t:i=(e-r)/l+(r>e?6:0);break;case e:i=(r-t)/l+2;break;case r:i=(t-e)/l+4}i/=6}return{h:i,s:s,l:o}}function n(t,e,r){function n(t,e,r){return 0>r&&(r+=1),r>1&&(r-=1),1/6>r?t+6*(e-t)*r:.5>r?e:2/3>r?t+(e-t)*(2/3-r)*6:t}var a,i,s;if(t=k(t,360),e=k(e,100),r=k(r,100),0===e)a=i=s=r;else{var o=.5>r?r*(1+e):r+e-r*e,l=2*r-o;a=n(l,o,t+1/3),i=n(l,o,t),s=n(l,o,t-1/3)}return{r:255*a,g:255*i,b:255*s}}function a(t,e,r){t=k(t,255),e=k(e,255),r=k(r,255);var n=I(t,e,r),a=D(t,e,r),i,s,o=n,l=n-a;if(s=0===n?0:l/n,n==a)i=0;else{switch(n){case t:i=(e-r)/l+(r>e?6:0);break;case e:i=(r-t)/l+2;break;case r:i=(t-e)/l+4}i/=6}return{h:i,s:s,v:o}}function i(t,e,r){t=6*k(t,360),e=k(e,100),r=k(r,100);var n=j.floor(t),a=t-n,i=r*(1-e),s=r*(1-a*e),o=r*(1-(1-a)*e),l=n%6,c=[r,s,i,i,o,r][l],f=[o,r,r,s,i,i][l],u=[i,i,o,r,r,s][l];return{r:255*c,g:255*f,b:255*u}}function s(t,e,r,n){var a=[M(q(t).toString(16)),M(q(e).toString(16)),M(q(r).toString(16))];return n&&a[0].charAt(0)==a[0].charAt(1)&&a[1].charAt(0)==a[1].charAt(1)&&a[2].charAt(0)==a[2].charAt(1)?a[0].charAt(0)+a[1].charAt(0)+a[2].charAt(0):a.join("")}function o(t,e,r,n){var a=[M(H(n)),M(q(t).toString(16)),M(q(e).toString(16)),M(q(r).toString(16))];return a.join("")}function l(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.s-=e/100,r.s=S(r.s),B(r)}function c(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.s+=e/100,r.s=S(r.s),B(r)}function f(t){return B(t).desaturate(100)}function u(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.l+=e/100,r.l=S(r.l),B(r)}function h(t,e){e=0===e?0:e||10;var r=B(t).toRgb();return r.r=I(0,D(255,r.r-q(255*-(e/100)))),r.g=I(0,D(255,r.g-q(255*-(e/100)))),r.b=I(0,D(255,r.b-q(255*-(e/100)))),B(r)}function d(t,e){e=0===e?0:e||10;var r=B(t).toHsl();return r.l-=e/100,r.l=S(r.l),B(r)}function p(t,e){var r=B(t).toHsl(),n=(q(r.h)+e)%360;return r.h=0>n?360+n:n,B(r)}function g(t){var e=B(t).toHsl();return e.h=(e.h+180)%360,B(e)}function b(t){var e=B(t).toHsl(),r=e.h;return[B(t),B({h:(r+120)%360,s:e.s,l:e.l}),B({h:(r+240)%360,s:e.s,l:e.l})]}function v(t){var e=B(t).toHsl(),r=e.h;return[B(t),B({h:(r+90)%360,s:e.s,l:e.l}),B({h:(r+180)%360,s:e.s,l:e.l}),B({h:(r+270)%360,s:e.s,l:e.l})]}function m(t){var e=B(t).toHsl(),r=e.h;return[B(t),B({h:(r+72)%360,s:e.s,l:e.l}),B({h:(r+216)%360,s:e.s,l:e.l})]}function y(t,e,r){e=e||6,r=r||30;var n=B(t).toHsl(),a=360/r,i=[B(t)];for(n.h=(n.h-(a*e>>1)+720)%360;--e;)n.h=(n.h+a)%360,i.push(B(n));return i}function w(t,e){e=e||6;for(var r=B(t).toHsv(),n=r.h,a=r.s,i=r.v,s=[],o=1/e;e--;)s.push(B({h:n,s:a,v:i})),i=(i+o)%1;return s}function _(t){var e={};for(var r in t)t.hasOwnProperty(r)&&(e[t[r]]=r);return e}function x(t){return t=parseFloat(t),(isNaN(t)||0>t||t>1)&&(t=1),t}function k(t,e){P(t)&&(t="100%");var r=A(t);return t=D(e,I(0,parseFloat(t))),r&&(t=parseInt(t*e,10)/100),j.abs(t-e)<1e-6?1:t%e/parseFloat(e)}function S(t){return D(1,I(0,t))}function C(t){return parseInt(t,16)}function P(t){return"string"==typeof t&&-1!=t.indexOf(".")&&1===parseFloat(t)}function A(t){return"string"==typeof t&&-1!=t.indexOf("%")}function M(t){return 1==t.length?"0"+t:""+t}function R(t){return 1>=t&&(t=100*t+"%"),t}function H(t){return Math.round(255*parseFloat(t)).toString(16)}function T(t){return C(t)/255}function F(t){t=t.replace(O,"").replace(N,"").toLowerCase();var e=!1;if(L[t])t=L[t],e=!0;else if("transparent"==t)return{r:0,g:0,b:0,a:0,format:"name"};var r;return(r=V.rgb.exec(t))?{r:r[1],g:r[2],b:r[3]}:(r=V.rgba.exec(t))?{r:r[1],g:r[2],b:r[3],a:r[4]}:(r=V.hsl.exec(t))?{h:r[1],s:r[2],l:r[3]}:(r=V.hsla.exec(t))?{h:r[1],s:r[2],l:r[3],a:r[4]}:(r=V.hsv.exec(t))?{h:r[1],s:r[2],v:r[3]}:(r=V.hsva.exec(t))?{h:r[1],s:r[2],v:r[3],a:r[4]}:(r=V.hex8.exec(t))?{a:T(r[1]),r:C(r[2]),g:C(r[3]),b:C(r[4]),format:e?"name":"hex8"}:(r=V.hex6.exec(t))?{r:C(r[1]),g:C(r[2]),b:C(r[3]),format:e?"name":"hex"}:(r=V.hex3.exec(t))?{r:C(r[1]+""+r[1]),g:C(r[2]+""+r[2]),b:C(r[3]+""+r[3]),format:e?"name":"hex"}:!1}var O=/^[\s,#]+/,N=/\s+$/,E=0,j=Math,q=j.round,D=j.min,I=j.max,z=j.random,B=function(e,r){if(e=e?e:"",r=r||{},e instanceof B)return e;if(!(this instanceof B))return new B(e,r);var n=t(e);this._originalInput=e,this._r=n.r,this._g=n.g,this._b=n.b,this._a=n.a,this._roundA=q(100*this._a)/100,this._format=r.format||n.format,this._gradientType=r.gradientType,this._r<1&&(this._r=q(this._r)),this._g<1&&(this._g=q(this._g)),this._b<1&&(this._b=q(this._b)),this._ok=n.ok,this._tc_id=E++};B.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var t=this.toRgb();return(299*t.r+587*t.g+114*t.b)/1e3},setAlpha:function(t){return this._a=x(t),this._roundA=q(100*this._a)/100,this},toHsv:function(){var t=a(this._r,this._g,this._b);return{h:360*t.h,s:t.s,v:t.v,a:this._a}},toHsvString:function(){var t=a(this._r,this._g,this._b),e=q(360*t.h),r=q(100*t.s),n=q(100*t.v);return 1==this._a?"hsv("+e+", "+r+"%, "+n+"%)":"hsva("+e+", "+r+"%, "+n+"%, "+this._roundA+")"},toHsl:function(){var t=r(this._r,this._g,this._b);return{h:360*t.h,s:t.s,l:t.l,a:this._a}},toHslString:function(){var t=r(this._r,this._g,this._b),e=q(360*t.h),n=q(100*t.s),a=q(100*t.l);return 1==this._a?"hsl("+e+", "+n+"%, "+a+"%)":"hsla("+e+", "+n+"%, "+a+"%, "+this._roundA+")"},toHex:function(t){return s(this._r,this._g,this._b,t)},toHexString:function(t){return"#"+this.toHex(t)},toHex8:function(){return o(this._r,this._g,this._b,this._a)},toHex8String:function(){return"#"+this.toHex8()},toRgb:function(){return{r:q(this._r),g:q(this._g),b:q(this._b),a:this._a}},toRgbString:function(){return 1==this._a?"rgb("+q(this._r)+", "+q(this._g)+", "+q(this._b)+")":"rgba("+q(this._r)+", "+q(this._g)+", "+q(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:q(100*k(this._r,255))+"%",g:q(100*k(this._g,255))+"%",b:q(100*k(this._b,255))+"%",a:this._a}},toPercentageRgbString:function(){return 1==this._a?"rgb("+q(100*k(this._r,255))+"%, "+q(100*k(this._g,255))+"%, "+q(100*k(this._b,255))+"%)":"rgba("+q(100*k(this._r,255))+"%, "+q(100*k(this._g,255))+"%, "+q(100*k(this._b,255))+"%, "+this._roundA+")"},toName:function(){return 0===this._a?"transparent":this._a<1?!1:K[s(this._r,this._g,this._b,!0)]||!1},toFilter:function(t){var e="#"+o(this._r,this._g,this._b,this._a),r=e,n=this._gradientType?"GradientType = 1, ":"";if(t){var a=B(t);r=a.toHex8String()}return"progid:DXImageTransform.Microsoft.gradient("+n+"startColorstr="+e+",endColorstr="+r+")"},toString:function(t){var e=!!t;t=t||this._format;var r=!1,n=this._a<1&&this._a>=0,a=!e&&n&&("hex"===t||"hex6"===t||"hex3"===t||"name"===t);return a?"name"===t&&0===this._a?this.toName():this.toRgbString():("rgb"===t&&(r=this.toRgbString()),"prgb"===t&&(r=this.toPercentageRgbString()),("hex"===t||"hex6"===t)&&(r=this.toHexString()),"hex3"===t&&(r=this.toHexString(!0)),"hex8"===t&&(r=this.toHex8String()),"name"===t&&(r=this.toName()),"hsl"===t&&(r=this.toHslString()),"hsv"===t&&(r=this.toHsvString()),r||this.toHexString())},_applyModification:function(t,e){var r=t.apply(null,[this].concat([].slice.call(e)));return this._r=r._r,this._g=r._g,this._b=r._b,this.setAlpha(r._a),this},lighten:function(){return this._applyModification(u,arguments)},brighten:function(){return this._applyModification(h,arguments)},darken:function(){return this._applyModification(d,arguments)},desaturate:function(){return this._applyModification(l,arguments)},saturate:function(){return this._applyModification(c,arguments)},greyscale:function(){return this._applyModification(f,arguments)},spin:function(){return this._applyModification(p,arguments)},_applyCombination:function(t,e){return t.apply(null,[this].concat([].slice.call(e)))},analogous:function(){return this._applyCombination(y,arguments)},complement:function(){return this._applyCombination(g,arguments)},monochromatic:function(){return this._applyCombination(w,arguments)},splitcomplement:function(){return this._applyCombination(m,arguments)},triad:function(){return this._applyCombination(b,arguments)},tetrad:function(){return this._applyCombination(v,arguments)}},B.fromRatio=function(t,e){if("object"==typeof t){var r={};for(var n in t)t.hasOwnProperty(n)&&("a"===n?r[n]=t[n]:r[n]=R(t[n]));t=r}return B(t,e)},B.equals=function(t,e){return t&&e?B(t).toRgbString()==B(e).toRgbString():!1},B.random=function(){return B.fromRatio({r:z(),g:z(),b:z()})},B.mix=function(t,e,r){r=0===r?0:r||50;var n=B(t).toRgb(),a=B(e).toRgb(),i=r/100,s=2*i-1,o=a.a-n.a,l;l=s*o==-1?s:(s+o)/(1+s*o),l=(l+1)/2;var c=1-l,f={r:a.r*l+n.r*c,g:a.g*l+n.g*c,b:a.b*l+n.b*c,a:a.a*i+n.a*(1-i)};return B(f)},B.readability=function(t,e){var r=B(t),n=B(e),a=r.toRgb(),i=n.toRgb(),s=r.getBrightness(),o=n.getBrightness(),l=Math.max(a.r,i.r)-Math.min(a.r,i.r)+Math.max(a.g,i.g)-Math.min(a.g,i.g)+Math.max(a.b,i.b)-Math.min(a.b,i.b);return{brightness:Math.abs(s-o),color:l}},B.isReadable=function(t,e){var r=B.readability(t,e);return r.brightness>125&&r.color>500},B.mostReadable=function(t,e){for(var r=null,n=0,a=!1,i=0;i<e.length;i++){var s=B.readability(t,e[i]),o=s.brightness>125&&s.color>500,l=3*(s.brightness/125)+s.color/500;(o&&!a||o&&a&&l>n||!o&&!a&&l>n)&&(a=o,n=l,r=B(e[i]))}return r};var L=B.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},K=B.hexNames=_(L),V=function(){var t="[-\\+]?\\d+%?",e="[-\\+]?\\d*\\.\\d+%?",r="(?:"+e+")|(?:"+t+")",n="[\\s|\\(]+("+r+")[,|\\s]+("+r+")[,|\\s]+("+r+")\\s*\\)?",a="[\\s|\\(]+("+r+")[,|\\s]+("+r+")[,|\\s]+("+r+")[,|\\s]+("+r+")\\s*\\)?";return{rgb:new RegExp("rgb"+n),rgba:new RegExp("rgba"+a),hsl:new RegExp("hsl"+n),hsla:new RegExp("hsla"+a),hsv:new RegExp("hsv"+n),hsva:new RegExp("hsva"+a),hex3:/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex8:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/}}();window.tinycolor=B}(),$(function(){$.fn.spectrum.load&&$.fn.spectrum.processNativeColorInputs()})});