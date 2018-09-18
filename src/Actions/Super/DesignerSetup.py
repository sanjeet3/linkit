'''
Created on 12-Sep-2018

@author: Sanjay Saini
'''
from src.api.baseapi import json_response, SUCCESS, ERROR, WARNING
from src.api.bucketHandler import upload_image_to_bucket, delete_bucket_file
from src.Database import BGCategory, BGSubCategory, ProductCategory,\
    DesignCategory
from src.Database import TextPatterns, Masks, ProductCanvas, Product
from src.lib.SABasehandler import ActionSupport

import cgi    
from google.appengine.ext import ndb
import json
import logging

class Home(ActionSupport):
  def get(self):
    context = {}  
    template = self.get_jinja2_env.get_template('super/designer_setup.html')    
    self.response.out.write(template.render(context))   

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
    bucket_path = '/productpromo/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url, bucket_key = upload_image_to_bucket(file_obj, bucket_path)
    if not serving_url:
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
    bucket_path = '/productpromo/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url, bucket_key = upload_image_to_bucket(file_obj, bucket_path)
    if not serving_url:
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
    bucket_path = '/productpromo/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url, bucket_key = upload_image_to_bucket(file_obj, bucket_path)
    if not serving_url:
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
           'k': e.entityKey,
           'top': e.top,
           'left': e.left,
           'preview_left': e.preview_left,
           'preview_top': e.preview_top,
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
    bucket_path = '/productpromo/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url, bucket_key = upload_image_to_bucket(file_obj, bucket_path)
    if not serving_url:
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
    e.put()
    return json_response(self.response, {'img_url': serving_url}, SUCCESS, 'Success')

class ChangeCanvasMargin(ActionSupport):
  def post(self):
    canvas = ndb.Key(urlsafe=self.request.get('key')).get() 
    top = self.request.get('top')
    left = self.request.get('left')
    canvas.top = top
    canvas.left = left
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
    bucket_path = '/productpromo/%s' %(file_name)
    bucket_path = bucket_path.lower()
    serving_url, bucket_key = upload_image_to_bucket(file_obj, bucket_path)
    if not serving_url:
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