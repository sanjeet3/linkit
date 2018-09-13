'''
Created on 12-Sep-2018

@author: Sanjay Saini
'''
from src.api.baseapi import json_response, SUCCESS, ERROR, WARNING
from src.api.bucketHandler import upload_image_to_bucket, delete_bucket_file
from src.Database import BGCategory, BGSubCategory
from src.Database import TextPatterns, Masks, ProductCanvas, Product
from src.lib.SABasehandler import ActionSupport

import cgi    
from google.appengine.ext import ndb

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

class UploadProductCanvas(ActionSupport):   
  def get(self):   
    p_list = Product.get_product_list()
    d = {'p_list': p_list}  
    template = self.get_jinja2_env.get_template('super/product_canvas.html')    
    self.response.out.write(template.render(d)) 

