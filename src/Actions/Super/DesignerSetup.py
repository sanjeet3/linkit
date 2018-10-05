'''
Created on 12-Sep-2018

@author: Sanjay Saini
'''
from src.api.baseapi import json_response, SUCCESS, ERROR, WARNING
from src.api.bucketHandler import upload_file, delete_bucket_file
from src.Database import BGCategory, BGSubCategory, ProductCategory, DesignCategory,DesignSubCategory
from src.Database import FrameCategory, FrameSubCategory
from src.Database import TextPatterns, Masks, ProductCanvas, Product, ReadyDesignTemplate
from src.lib.SABasehandler import ActionSupport

import cgi    
from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.api import images
import json
import logging

class Home(ActionSupport):
  def get(self):
    context = {}  
    template = self.get_jinja2_env.get_template('super/designer_setup.html')    
    self.response.out.write(template.render(context))  
     
class DesinerDemo(ActionSupport):
  def post(self):
    '''Create ready design templates ''' 
    p = ndb.Key(urlsafe=self.request.get('product'))                     
    design_print = self.request.get('design_print')
    layer = self.request.get('layer')    
    name = self.request.get('name')    
    code = self.request.get('code')    
    e = ReadyDesignTemplate()   
    e.code = code
    e.design_json = layer
    e.design_prev = design_print
    e.name = name
    e.product = p
    e.put()
    return json_response(self.response, { }, SUCCESS,'Ready design created')
    
  def get(self):
    template_path = 'super/product_designor_demo.html'  
    sub_frame_dict = {} 
    template = self.get_jinja2_env.get_template(template_path)  
    p = ndb.Key(urlsafe=self.request.get('product')).get()  
    sub_cat_dict = {}
    sub_bg_dict = {}  
    patterns = TextPatterns.get_img_url_list()
    canvas = ProductCanvas.get_obj(p.key)
    
    frame_list = FrameCategory.get_mapping_list(p.category_key)
    for e in FrameSubCategory.get_list():
      if e.category in sub_frame_dict:
        sub_frame_dict[e.category].append(e)
      else:
        sub_frame_dict[e.category]=[e] 
    
    
    design_list  = DesignCategory.get_mapping_list(p.category_key)
    for e in DesignSubCategory.get_list():
      if e.category in sub_cat_dict:
        sub_cat_dict[e.category].append(e)
      else:
        sub_cat_dict[e.category]=[e]    
                
    bg_list = BGCategory.get_mapping_list(p.category_key).fetch()
    sub_bg_list = BGSubCategory.get_list()
    for e in sub_bg_list:
      if e.category in sub_bg_dict:  
        sub_bg_dict[e.category].append(e)
      else:
        sub_bg_dict[e.category]=[e]      
             
    self.response.out.write(template.render({'p': p,
                                             'key': self.request.get('product'),   
                                             'canvas': canvas,
                                             'patterns': patterns,
                                             'sub_frame_dict': sub_frame_dict,
                                             'sub_cat_dict': sub_cat_dict,
                                             'sub_bg_dict': sub_bg_dict,
                                             'frame_list': frame_list,
                                             'design_list': design_list,
                                             'bg_list': bg_list,
                                             }))  
      
class Backgrounds(ActionSupport):   
  def get(self):   
    cat_list = BGCategory.get_list()
    sub_list = BGSubCategory.get_list()    
    d = {'cat_list': cat_list, 'sub_list': sub_list}  
    template = self.get_jinja2_env.get_template('super/background.html')    
    self.response.out.write(template.render(d)) 

class UploadTextPattern(ActionSupport):   
  def get(self):   
    img_url_list = TextPatterns.get_img_url_list()
    d = {'img_url_list': img_url_list}  
    template = self.get_jinja2_env.get_template('super/text-pattern.html')    
    self.response.out.write(template.render(d)) 

  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
            
    file_name = image_file.filename    
    bucket_path = '/designer_textptrn/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again')   
      
    e = TextPatterns.get_obj()
    e.img_url.append(serving_url)
    e.bucket_key.append(bucket_key)
    e.bucket_path.append(bucket_path)
    e.put()
    return json_response(self.response, {'serving_url':serving_url}, SUCCESS, 'Success')

class UploadMasks(ActionSupport):   
  def get(self):   
    img_url_list = Masks.get_img_url_list()
    d = {'img_url_list': img_url_list}  
    template = self.get_jinja2_env.get_template('super/masks.html')    
    self.response.out.write(template.render(d)) 

  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
            
    file_name = image_file.filename    
    bucket_path = '/designer_masks/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path) 
      if self.DEV: 
        serving_url = images.get_serving_url(bucket_key)
      else:
        file_name = file_name.replace(' ', '%20').lower()  
        serving_url = 'https://storage.googleapis.com/designer_masks/%s' %(file_name) 
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again') 
      
    e = Masks.get_obj()
    e.img_url.append(serving_url)
    e.bucket_key.append(bucket_key)
    e.bucket_path.append(bucket_path)
    e.put()
    return json_response(self.response, {'serving_url':serving_url}, SUCCESS, 'Success')
    
class BGCategorySave(ActionSupport):
  def post(self):
    title = self.request.get('title').upper()  
    e = BGCategory()
    e.title = title
    e = e.put().get()  
    data_dict = {'title': title,
                 'key': e.entityKey}
    return json_response(self.response, data_dict, SUCCESS, 'Category created')
      
class BGSubCategorySave(ActionSupport):
  def post(self):
    title = self.request.get('title').upper()  
    category = self.request.get('category')
    cat = ndb.Key(urlsafe=category).get()
    e = BGSubCategory()
    e.category = cat.key
    e.category_name = cat.title
    e.category_urlsafe = category
    e.title = title
    e = e.put().get()
    data_dict = {'title': title,
                 'category': cat.title,
                 'category_key': category,
                 'key': e.entityKey}      
    return json_response(self.response, data_dict, SUCCESS, 'Sub-Category created') 

class UploadBGImage(ActionSupport):
  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
    
    key = self.request.get('key') 
    e = ndb.Key(urlsafe=key).get()
            
    file_name = image_file.filename    
    bucket_path = '/designer_backgrounds/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again') 
    
    key = self.request.get('key') 
    e = ndb.Key(urlsafe=key).get()
    e.img_url.append(serving_url)
    e.bucket_key.append(bucket_key)
    e.bucket_path.append(bucket_path)
    e.img_title.append(self.request.get('title'))
    e.put()
    return json_response(self.response, {'serving_url':serving_url}, SUCCESS, 'Success')     

class FramesView(ActionSupport):   
  def get(self):   
    cat_list = FrameCategory.get_list()
    sub_list = FrameSubCategory.get_list()    
    d = {'cat_list': cat_list, 'sub_list': sub_list}  
    template = self.get_jinja2_env.get_template('super/frame.html')    
    self.response.out.write(template.render(d)) 

class FrameCategorySave(ActionSupport):
  def post(self):
    title = self.request.get('title').upper()  
    e = FrameCategory()
    e.title = title
    e = e.put().get()  
    data_dict = {'title': title,
                 'key': e.entityKey}
    return json_response(self.response, data_dict, SUCCESS, 'Category created')
      
class FrameSubCategorySave(ActionSupport):
  def post(self):
    title = self.request.get('title').upper()  
    category = self.request.get('category')
    cat = ndb.Key(urlsafe=category).get()
    e = FrameSubCategory()
    e.category = cat.key
    e.category_name = cat.title
    e.category_urlsafe = category
    e.title = title
    e = e.put().get()
    data_dict = {'title': title,
                 'category': cat.title,
                 'category_key': category,
                 'key': e.entityKey}      
    return json_response(self.response, data_dict, SUCCESS, 'Sub-Category created') 

class UploadFrameImage(ActionSupport):
  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
    
    key = self.request.get('key') 
    e = ndb.Key(urlsafe=key).get()
            
    file_name = image_file.filename    
    bucket_path = '/designer_frames/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      logging.info('create_gs_key')  
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      logging.info(bucket_key)
      logging.info('serving_url')
      if self.DEV: 
        serving_url = images.get_serving_url(bucket_key)
      else:
        file_name = file_name.replace(' ', '%20').lower()  
        serving_url = 'https://storage.googleapis.com/designer_frames/%s' %(file_name)  
      logging.info(serving_url)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again') 
  
    key = self.request.get('key') 
    e = ndb.Key(urlsafe=key).get()
    e.img_url.append(serving_url)
    e.bucket_key.append(bucket_key)
    e.bucket_path.append(bucket_path)
    e.img_title.append(self.request.get('title'))
    e.put()
    return json_response(self.response, {'serving_url':serving_url}, SUCCESS, 'Success')     



class ProductCanvasSetup(ActionSupport):   
  def get(self):   
    p_list = Product.get_product_list()
    d = {'p_list': p_list}  
    template = self.get_jinja2_env.get_template('super/product_canvas.html')    
    self.response.out.write(template.render(d)) 
    
class GetProductCanvasPrev(ActionSupport):   
  def get(self): 
    key = self.request.get('k') 
    product_key = ndb.Key(urlsafe=key)
    e = ProductCanvas.get_obj(product_key)  
    d = {'img_url': '',
         'preview_url': ''}  
    if e:
      d = {'img_url': e.img_url,
           'bucket_key': e.bucket_key,
           'k': e.entityKey,
           'top': e.top,
           'left': e.left,
           'stage_height': e.stage_height,
           'preview_left': e.preview_left,
           'preview_top': e.preview_top,
           'preview_key': e.preview_key,
           'preview_url': e.preview_url}    
    return json_response(self.response, d, SUCCESS, 'Success')  

class UploadProductCanvas(ActionSupport):
  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file') 
      
    product_key = ndb.Key(urlsafe=self.request.get('p'))
    file_name = image_file.filename    
    bucket_path = '/designer_canvas/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again') 
      
    e = ProductCanvas.get_obj(product_key) 
    if not e:
      p=product_key.get()  
      e = ProductCanvas(product=product_key,
                        code=p.code,
                        name=p.name)    
  
    e.bucket_key = bucket_key
    e.bucket_path = bucket_path
    e.img_url = serving_url
    e.top = self.request.get('top')
    e.left = self.request.get('left')
    e.stage_height = self.request.get('stage_height')
    e.put()
    return json_response(self.response, {'img_url': serving_url}, SUCCESS, 'Success')

class ChangeCanvasMargin(ActionSupport):
  def post(self):
    canvas = ndb.Key(urlsafe=self.request.get('key')).get() 
    top = self.request.get('top')
    left = self.request.get('left')
    stage_height = self.request.get('stage_height')
    
    canvas.top = top
    canvas.left = left
    canvas.stage_height = stage_height
    canvas.put()       
    return json_response(self.response, {}, SUCCESS, 'Success')

class ChangePreviewMargin(ActionSupport):
  def post(self):
    canvas = ndb.Key(urlsafe=self.request.get('key')).get() 
    top = self.request.get('top')
    left = self.request.get('left')
    canvas.preview_top = top
    canvas.preview_left = left
    canvas.put()       
    return json_response(self.response, {}, SUCCESS, 'Success')
  
class UploadProductPreview(ActionSupport):
  def post(self):
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')        
    product_key = ndb.Key(urlsafe=self.request.get('p'))
    preview_top = self.request.get('preview_top')
    preview_left = self.request.get('preview_left')
    file_name = image_file.filename    
    bucket_path = '/designer_preview/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url = ''
    upload_file(file_obj, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
      return json_response(self.response, {}, WARNING, 'Try again')  
    
    e = ProductCanvas.get_obj(product_key) 
    if not e:
      p=product_key.get()  
      e = ProductCanvas(product=product_key,
                        code=p.code,
                        name=p.name)    
  
    e.preview_key = bucket_key 
    e.preview_url = serving_url
    e.preview_left = preview_left
    e.preview_top = preview_top
    e.put()
    return json_response(self.response, {'preview_url': serving_url}, SUCCESS, 'Success')

class GetMappingCustomDesign(ActionSupport):
  def get(self): 
    mapping_list = []  
    category = ndb.Key(urlsafe=self.request.get('cat'))
    for e in DesignCategory.get_mapping_list(category):
      mapping_list.append(e.entityKey)  
    return json_response(self.response, {'mapping_list': mapping_list}, SUCCESS, 'Success')

class MappingCustomDesign(ActionSupport):
  def get(self):    
    cat_list = ProductCategory.get_list()  
    design_list = DesignCategory.get_list()
    d = {'cat_list': cat_list,
         'design_list': design_list}  
    template = self.get_jinja2_env.get_template('super/design_mapping.html')    
    self.response.out.write(template.render(d)) 
  
  def post(self): 
    category = ndb.Key(urlsafe=self.request.get('category') ) 
    key_list = json.loads( self.request.get('data') )  
    design_key = [ndb.Key(urlsafe=k) for k in key_list]
    logging.info(design_key)
    logging.info(category)
    ndb_list = []
    for e in DesignCategory.get_list():
      if e.key in design_key:
        if category not in e.product_category:         
          e.product_category.append(category)
          ndb_list.append(e)
      elif category in e.product_category:
        e.product_category.remove(category)         
        ndb_list.append(e)
        
    if ndb_list:
      ndb.put_multi(ndb_list)      
            
    return json_response(self.response, {}, SUCCESS, 'Success')   

class GetMappingBackground(ActionSupport):
  def get(self):    
    mapping_list = []  
    category = ndb.Key(urlsafe=self.request.get('cat'))
    for e in BGCategory.get_mapping_list(category):
      mapping_list.append(e.entityKey) 

    return json_response(self.response, {'mapping_list': mapping_list}, SUCCESS, 'Success')   

class MappingBackground(ActionSupport):
  def get(self):    
    cat_list = ProductCategory.get_list()  
    bg_list = BGCategory.get_list()
    d = {'cat_list': cat_list, 'bg_list': bg_list}  
    template = self.get_jinja2_env.get_template('super/background_mapping.html')    
    self.response.out.write(template.render(d)) 

  def post(self): 
    category = ndb.Key(urlsafe=self.request.get('category') ) 
    key_list = json.loads( self.request.get('data') )  
    design_key = [ndb.Key(urlsafe=k) for k in key_list]
    logging.info(design_key)
    logging.info(category)
    ndb_list = []
    for e in BGCategory.get_list():
      if e.key in design_key:
        if category not in e.product_category:         
          e.product_category.append(category)
          ndb_list.append(e)
      elif category in e.product_category:
        e.product_category.remove(category)         
        ndb_list.append(e)
        
    if ndb_list:
      ndb.put_multi(ndb_list)  
    return json_response(self.response, {}, SUCCESS, 'Success')

class MappingFrame(ActionSupport):
  def get(self):    
    cat_list = ProductCategory.get_list()  
    bg_list = FrameCategory.get_list()
    d = {'cat_list': cat_list, 'bg_list': bg_list}  
    template = self.get_jinja2_env.get_template('super/frame_mapping.html')    
    self.response.out.write(template.render(d)) 

  def post(self): 
    category = ndb.Key(urlsafe=self.request.get('category') ) 
    key_list = json.loads( self.request.get('data') )  
    design_key = [ndb.Key(urlsafe=k) for k in key_list]
    logging.info(design_key)
    logging.info(category)
    ndb_list = []
    for e in FrameCategory.get_list():
      if e.key in design_key:
        if category not in e.product_category:         
          e.product_category.append(category)
          ndb_list.append(e)
      elif category in e.product_category:
        e.product_category.remove(category)         
        ndb_list.append(e)
        
    if ndb_list:
      ndb.put_multi(ndb_list)  
    return json_response(self.response, {}, SUCCESS, 'Success')

class GetMappingFrame(ActionSupport):
  def get(self):    
    mapping_list = []  
    category = ndb.Key(urlsafe=self.request.get('cat'))
    for e in FrameCategory.get_mapping_list(category):
      mapping_list.append(e.entityKey) 

    return json_response(self.response, {'mapping_list': mapping_list}, SUCCESS, 'Success') 

class ProductLiveSetting(ActionSupport):
  def post(self):
    e_list = []
    prod_keys = [ndb.Key(urlsafe=k) for k in json.loads(self.request.get('data'))]
    logging.info(prod_keys)
    for p in Product.get_selling_product_list():
      if p.key in prod_keys:
        p.endclient_selection=True
      else:
        p.endclient_selection=False
      e_list.append(p)
    logging.info(e_list)  
    if e_list:
      ndb.put_multi(e_list)
                           
    return json_response(self.response, {}, SUCCESS, 'Product live setting updated')

class GetProductLiveSetting(ActionSupport):
  def get(self):     
    d= {'live_product': Product.get_home_screen_product()}  
    template = self.get_jinja2_env.get_template('super/live_product_setting.html')    
    self.response.out.write(template.render(d))   
                    
class GetProductLiveInfo(ActionSupport):
  def get(self):
    if not self.request.get('k'):
       return json_response(self.response, {}, ERROR, '')
        
    p = ndb.Key(urlsafe=self.request.get('k')).get()
    d={'k': self.request.get('k'), 
       'promo_img': p.promo_img,
       'promo_buckt_key': p.promo_buckt_key,
       'promo_product_bg_img': p.promo_product_bg_img,
       'promo_product_bg_key': p.promo_product_bg_key,
       'promo_text': p.promo_text,
       'promo_sequence': p.promo_sequence
       }  
    return json_response(self.response, d, SUCCESS, '')

  def post(self):
    serving_url = ''
    p = ndb.Key(urlsafe=self.request.get('k')).get()
    sequence = self.request.get('sequence')
    p.promo_sequence = int(sequence) if sequence else 0
    p.promo_text = self.request.get('promo_text')
    
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not p.promo_img and  isinstance(image_file, cgi.FieldStorage):        
      file_name = image_file.filename    
      bucket_path = '/product_sponsor/%s' %(file_name)
      bucket_path = bucket_path.lower()
      serving_url = ''
      upload_file(file_obj, bucket_path)
      try:
        bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
        serving_url = images.get_serving_url(bucket_key)
        p.promo_img=serving_url
        p.promo_buckt_key=bucket_key
      except Exception, msg:
        logging.error(msg)   
        
    image_file = self.request.POST.get("bg", None)
    file_obj = self.request.get("bg", None)  
    if not p.promo_product_bg_img and  isinstance(image_file, cgi.FieldStorage):        
      file_name = image_file.filename    
      bucket_path = '/product_bg/%s' %(file_name)
      bucket_path = bucket_path.lower()
      upload_file(file_obj, bucket_path)
      try:
        bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
        serving_url = images.get_serving_url(bucket_key)
        p.promo_product_bg_img=serving_url
        p.promo_product_bg_key=bucket_key
      except Exception, msg:
        logging.error(msg)
        
       
    p.put()
    return json_response(self.response, {}, SUCCESS, '')

class GetDesignerImgaes(ActionSupport): 
  def get(self):
    k = self.request.get('k')  
    e = ndb.Key(urlsafe=k).get()
    d= {'k': k,
        'img_url': e.img_url,
        'bucket_key': e.bucket_key,
        'bucket_path': e.bucket_path}  
    return json_response(self.response, d, SUCCESS, '')  
          

PRODUCTPROMO ='PRODUCTPROMO'
PRODUCTPROMOBG='PRODUCTPROMOBG'
CANVASIMG='CANVASIMG'
CANVASPREV='CANVASPREV'
DESINGERUPLOAD='DESINGERUPLOAD'
class DeleteBucketFile(ActionSupport): 
  def get(self):
    self.status = ERROR  
    self.msg='Try again'
    k = self.request.get('k')
    self.e = ndb.Key(urlsafe=k).get()
    self.bucket_key = self.request.get('bucket_key')
    self.index = 0
    selection = self.request.get('selection').upper()
    if selection==PRODUCTPROMO:
      self.product_promo()
    elif selection==PRODUCTPROMOBG:
      self.product_promo_bg()          
    elif selection==CANVASIMG:
      self.product_cavan()
    elif selection==CANVASPREV:
      self.product_preview_canvas()
    elif selection==DESINGERUPLOAD:
      self.remove_designer_upload()                  
    return json_response(self.response, {'k': k, 'i': self.index}, self.status, self.msg)
  
  def remove_designer_upload(self):
    bucket_path = self.request.get('bucket_path')  
    if delete_bucket_file(self.bucket_key):
      try:
        i = self.e.bucket_path.index(bucket_path)
        self.index = i
        self.e.img_url.pop(i)
        self.e.bucket_key.pop(i)
        self.e.bucket_path.pop(i)
        self.e.put()
        self.status=SUCCESS
        self.msg='Image file removed'
      except Exception, msg:
        logging.error(msg)
             
  def product_promo(self):
    if delete_bucket_file(self.bucket_key):
      self.status=SUCCESS
      self.msg='Image file removed'
      self.e.promo_img=''           
      self.e.promo_buckt_key=''           
      self.e.put()
      
  def product_promo_bg(self):
    if delete_bucket_file(self.bucket_key):
      self.status=SUCCESS
      self.msg='Image file removed'
      self.e.promo_product_bg_img=''           
      self.e.promo_product_bg_key=''           
      self.e.put()
   
  def product_cavan(self):
    if delete_bucket_file(self.bucket_key):
      self.status=SUCCESS
      self.msg='Image file removed'
      self.e.img_url=''           
      self.e.bucket_key=''           
      self.e.bucket_path=''           
      self.e.put()
      
      
  def product_preview_canvas(self):
    if delete_bucket_file(self.bucket_key):
      self.status=SUCCESS
      self.msg='Image file removed'
      self.e.preview_url=''           
      self.e.preview_key=''           
      self.e.put()   

CLIP_ART='CLIP_ART'
FRAMES='FRAMES'
BACKGROUNDS='BACKGROUNDS'     
    
class DeleteCategory(ActionSupport): 
  def post(self):
    self.status = ERROR  
    self.msg='Delete all categories and uploaded images'  
    k = self.request.get('k')
    k_type = self.request.get('entity')
    self.e = ndb.Key(urlsafe=k).get()
    if k_type==CLIP_ART:
      self.clipart_deletion()    
    elif k_type==FRAMES:
      self.frame_deletion()
    elif k_type==BACKGROUNDS:
      self.backgound_deletion()
            
    return json_response(self.response, {'k': k}, self.status, self.msg)

  def clipart_deletion(self):
    e_query = DesignSubCategory.query_by_category(self.e.key)
    if e_query.count()!=0:
      self.msg='Delete sub-category first'
    elif self.e.img_url:
      self.msg='Delete uploaded images first'
    else:          
      self.e.key.delete()  
      self.status=SUCCESS
      self.msg='Deletion completed'
    
  def frame_deletion(self):
    e_query = FrameSubCategory.query_by_category(self.e.key)
    if e_query.count()!=0:
      self.msg='Delete sub-category first'
    elif self.e.img_url:
      self.msg='Delete uploaded images first'
    else:          
      self.e.key.delete()  
      self.status=SUCCESS
      self.msg='Deletion completed'
      
  def backgound_deletion(self):  
    e_query = BGSubCategory.query_by_category(self.e.key)
    if e_query.count()!=0:
      self.msg='Delete sub-category first'
    elif self.e.img_url:
      self.msg='Delete uploaded images first'
    else:          
      self.e.key.delete()  
      self.status=SUCCESS
      self.msg='Deletion completed'

class DeleteSUBCategory(ActionSupport): 
  def post(self):
    self.status = ERROR  
    self.msg='Delete all categories and uploaded images'  
    k = self.request.get('k')
    self.e = ndb.Key(urlsafe=k).get()
    if self.e.img_url:
      self.msg='Delete uploaded images first'
    else:          
      self.e.key.delete()  
      self.status=SUCCESS
      self.msg='Deletion completed'
            
    return json_response(self.response, {'k': k}, self.status, self.msg)
 
        