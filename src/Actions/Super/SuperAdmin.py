'''
Created on 04-Jul-2018

@author: Sanjay Saini '''

from src.api.baseapi import json_response, SUCCESS, ERROR, WARNING
from src.api.bucketHandler import upload_image_to_bucket
from src.api.datetimeapi import get_dt_by_country
from src.api.datetimeapi import get_date_from_str
from src.Database import Product
from src.Database import ProductCategory
from src.Database import ProductUOM
from src.Database import Seller
from src.Database import SellerProduct
from src.Database import SellerOrder
from src.lib.SABasehandler import ActionSupport
 
import logging, datetime
import cgi    
from google.appengine.ext import ndb

class Home(ActionSupport):
  def get(self):
    cdt=datetime.datetime.now()
    dt=get_dt_by_country(cdt, 'KE')
    logging.info(dt)  
    
    context = self.get_context
    template = self.get_jinja2_env.get_template('super/base.html')    
    self.response.out.write(template.render(context))      
     
class Frenchise(ActionSupport):
  def get(self):
    prd_list=Product.get_product_list()
    seller_list=Seller.get_list()
    context={'prd_list': prd_list,
             'seller_list':seller_list}  
    template = self.get_jinja2_env.get_template('super/Frenchise.html')    
    self.response.out.write(template.render(context))      
     
class Products(ActionSupport):
  def get(self):
    prd_list=Product.get_product_list() 
    category_list=ProductCategory.get_list()
    uom_list=ProductUOM.get_list()
    context={'prd_list': prd_list,
             'category_list': category_list,
             'uom_list': uom_list
             }
    template = self.get_jinja2_env.get_template('super/Products.html')    
    self.response.out.write(template.render(context))

class GetProductPics(ActionSupport):
  def get(self):  
    
    key = self.request.get('key') 
    product = ndb.Key(urlsafe=key).get()
    img_list = product.image_url
    
    data_dict = {'img_list': img_list}  
    return  json_response(self.response, data_dict, SUCCESS,'')

class SaveProducts(ActionSupport):
  def post(self):          
    code=self.request.get('code').upper()
    name=self.request.get('name')
    size=self.request.get('size')
    price=float(self.request.get('price'))
    category=self.request.get('category')
    uom=self.request.get('uom')
    description=self.request.get('description')
    if code.__len__() < 3:
      return json_response(self, {}, WARNING, 'Product code minimum 3 character')    
    if Product.get_product_by_code(code):
      return json_response(self, {}, WARNING, 'Product code duplicate')
    cdt=datetime.datetime.now()
    dt=get_dt_by_country(cdt, 'KE')
    p=Product()
    p.code=code
    p.created_on=dt.replace(tzinfo=None)
    p.description=description
    p.name=name
    p.price=price
    p.size=size
    if category:
      e=ndb.Key(urlsafe=category).get()
      p.category=e.name
      p.category_key=e.key
      category=e.name
    if uom:
      e=ndb.Key(urlsafe=uom).get()
      p.uom=e.name
      p.uom_key=e.key
      uom=e.name
          
    p=p.put().get()   
    data_dict={'code':code,
    'name': name,
    'size':size,
    'category': category,
    'price': price,
    'uom': uom,
    'description': description,
    'key': p.entityKey, 
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product %s saved' %(name))

class SaveProductsUOM(ActionSupport):
  def post(self):           
    uom=self.request.get('uom').upper() 
    uom_obj = ProductUOM.get_product_uom(uom)
    if not uom_obj:
      uom_obj = ProductUOM(name=uom).put().get()
    data_dict={ 
    'name': uom, 
    'key': uom_obj.entityKey
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product UOM %s saved' %(uom))

class SaveProductsCategory(ActionSupport):
  def post(self):           
    category=self.request.get('category').upper() 
    c_obj = ProductCategory.get_product_cat(category)
    if not c_obj:
      c_obj = ProductCategory(name=category).put().get()
    data_dict={ 
    'name': category, 
    'key': c_obj.entityKey
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Product category %s saved' %(category))



class SaveFrenchise(ActionSupport):
  def post(self):          
    person=self.request.get('person')
    name=self.request.get('name')
    email=self.request.get('email').lower().strip()
    telephone=self.request.get('telephone')
    mobile=self.request.get('mobile')
    geo=self.request.get('geo')
    address=self.request.get('address') 
    if '@' not in email:
      return  json_response(self.response, {}, WARNING, 'Seller %s email' %(email))    
    
    if Seller.get_by_email(email):
      return  json_response(self.response, {}, WARNING, 'Seller %s account exist' %(email))    
    
    e = Seller(email=email,
               name=name,
               address=address,
               geo_code=geo,
               mobile=mobile,
               telephone=telephone,
               person=person)
               
    e=e.put().get()
    
    data_dict={'person':person,
    'name': name,
    'email':email,
    'telephone': telephone,
    'mobile': mobile,
    'geo': geo,
    'address': address, 
    'key': e.entityKey
    }
    return  json_response(self.response, data_dict, SUCCESS, 'Seller %s account created' %(email))
     
class AssignProductToSeller(ActionSupport):     
  def get(self):
    seller=Seller()
    product=Product()  
    product=ndb.Key(urlsafe=self.request.get('product_key')).get()  
    seller=ndb.Key(urlsafe=self.request.get('seller_key')).get()   
    e=SellerProduct()
    e.seller=seller.key
    e.seller_urlsafe=seller.entityKey
    e.master_price=product.price
    e.master_product=product.key
    e.master_product_urlsafe=product.entityKey
    e.code=product.code
    e.name=product.name 
    e.size=product.size 
    e.uom=product.uom 
    e.category=product.category 
    e.description=product.description
    e.retail_price=float(self.request.get('reatilPrice')) 
    e.master_price=product.price 
    e.image_url=product.image_url 
    e.endclient_visible=True 
    e.instock=product.instock
    
    e.put().get()  
    product.endclient_visible=True
    product.put()
    d={'key': e.entityKey,
       'code': e.code,
       'name': e.name,
       'size': e.size,
       'uom': e.uom,
       'category': e.category,
       'retail_price': e.retail_price,
       'master_price': e.master_price,
       'description':e.description,
       'product_key': self.request.get('product_key'),
       }
    return  json_response(self.response, d, SUCCESS, '')   

class GetSellerProduct(ActionSupport):     
  def get(self): 
    seller_key=ndb.Key(urlsafe=self.request.get('key'))
    product_list=[]
    for e in SellerProduct.get_seller_product_list(seller_key):
      product_list.append({'key': e.entityKey,
       'code': e.code,
       'name': e.name,
       'size': e.size,
       'uom': e.uom,
       'category': e.category,
       'retail_price': e.retail_price,
       'master_price': e.master_price,
       'description':e.description,
       'product_key': e.master_product_urlsafe})  
      
    return json_response(self.response, {'product_list': product_list}, SUCCESS, '')  
           
class Order(ActionSupport):
  def get(self):
    seller_list = Seller.get_list()  
    template = self.get_jinja2_env.get_template('super/Order.html')
    now = datetime.datetime.now() 
    now = get_dt_by_country(now, 'KE')
    today = now.strftime('%d-%m-%Y')
    today_date = now.date()
    order_list = SellerOrder.get_order_filetered(today_date, today_date).fetch()
    data = {'dt': today,
            'seller_list': seller_list,
            'order_list': order_list}   
    self.response.out.write(template.render(data))

class OrderSearch(ActionSupport):
  def post(self):
    seller_list=[]
    key = self.request.get('seller')
    if key:
      seller_list = [ndb.Key(urlsafe=key)]    
    start= get_date_from_str(self.request.get('start'))
    end=get_date_from_str(self.request.get('end'))
    order_list = SellerOrder.get_order_filetered(start, end, seller_list).fetch()
    data = {'order_list': order_list}
    template = self.get_jinja2_env.get_template('super/ordersearch.html')
    html = template.render(data)
    
    return json_response(self.response,
                         {'html': html},
                         SUCCESS,
                         'Order search result')

class UploadProductPicture(ActionSupport):    
  def post(self):  
    key = self.request.get('key') 
    product = ndb.Key(urlsafe=key).get()
    
    image_file = self.request.POST.get("pic", None)
    file_obj = self.request.get("pic", None)     
    if not isinstance(image_file, cgi.FieldStorage):        
      return json_response(self.response, { },
                           ERROR,
                           'Select image file')    
        
    file_name = image_file.filename    
    bucket_path = '/product/%s/%s' %(product.code, file_name)
    bucket_path = bucket_path.lower()
    serving_url, bucket_key = upload_image_to_bucket(file_obj, bucket_path)
    
    product.image_url.append(serving_url)
    product.bucket_path.append(bucket_path)
    product.bucket_key.append(bucket_key)
    product.put()
    return json_response(self.response, 
                         {'serving_url': serving_url},
                         SUCCESS,
                         'Product image uploaded')
    