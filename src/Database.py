'''
Created on 05-Jul-2018

@author: Sanjay Saini
'''
 
from src.endpoints_proto_datastore.ndb import EndpointsModel

from google.appengine.ext import ndb

class Seller(EndpointsModel):
  '''Franchisor Data Store model '''
  status = ndb.BooleanProperty(default=True) 
  name = ndb.StringProperty(default='')
  person = ndb.StringProperty(default='')
  telephone = ndb.StringProperty(default='')
  mobile = ndb.StringProperty(default='')
  email = ndb.StringProperty(default='')
  geo_code = ndb.StringProperty(default='')
  geo = ndb.GeoPtProperty()
  address = ndb.TextProperty(default='')
  img_url = ndb.StringProperty(default='') 
  bucket_key = ndb.StringProperty(default='')

  @classmethod
  def get_by_email(cls, email):
    return cls.query(cls.email==email).get()
  
  @classmethod
  def get_list(cls):
    return cls.query().fetch()

  @classmethod
  def get_key_obj_dict(cls):
    d = {}
    for e in cls.query():
      d[e.key] = e
            
    return d

class ProductUOM(EndpointsModel):
  name = ndb.StringProperty(default='') 
  
  @classmethod
  def get_list(cls):
    return cls.query().fetch()

  @classmethod
  def get_product_uom(cls, uom):
    return cls.query(cls.name==uom).get()

class ProductCategory(EndpointsModel):
  name = ndb.StringProperty(default='') 
  
  @classmethod
  def get_list(cls):
    return cls.query().fetch()

  @classmethod
  def get_product_cat(cls, category):
    return cls.query(cls.name==category).get()

class Product(EndpointsModel):
  ''' Product datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  size = ndb.StringProperty(default='')
  uom = ndb.StringProperty(default='')
  uom_key = ndb.KeyProperty(ProductUOM)
  category = ndb.StringProperty(default='')
  category_key = ndb.KeyProperty(ProductCategory)
  price = ndb.FloatProperty(default=0.0) 
  description = ndb.TextProperty(default='') 
  image_url = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True) 
  bucket_key = ndb.StringProperty(repeated=True)
  slider_url = ndb.StringProperty(repeated=True) 
  slider_key = ndb.StringProperty(repeated=True) 
  instock = ndb.BooleanProperty(default=True) 
  endclient_visible = ndb.BooleanProperty(default=False)

  @classmethod
  def get_product_by_code(cls, code):
    return cls.query(cls.code==code).get()

  @classmethod
  def get_selling_product_list(cls):
    return cls.query(cls.endclient_visible==True).fetch()

  @classmethod
  def get_product_list(cls):
    return cls.query().fetch()
      
  
class SellerProduct(EndpointsModel):
  ''' Franchisor Product datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  master_product = ndb.KeyProperty(Product)
  master_product_urlsafe= ndb.StringProperty(default='')
  seller = ndb.KeyProperty(Seller)
  seller_urlsafe = ndb.StringProperty(default='')
  code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  size = ndb.StringProperty(default='')
  uom = ndb.StringProperty(default='')
  category = ndb.StringProperty(default='')
  retail_price = ndb.FloatProperty(default=0.0) 
  master_price = ndb.FloatProperty(default=0.0) 
  description = ndb.TextProperty(default='') 
  image_url = ndb.StringProperty(repeated=True) 
  instock = ndb.BooleanProperty(default=True) 
  endclient_visible = ndb.BooleanProperty(default=False)  
  
  @classmethod
  def get_seller_product_list(cls, seller_key):
    return cls.query(cls.seller==seller_key).fetch()
  
  @classmethod
  def get_product_by_master_key_for_client(cls, master_product):
    return cls.query(cls.master_product==master_product, cls.endclient_visible==True).fetch()

class SellerOrder(EndpointsModel):
  '''Franchisor order Data Store model '''
  cancel = ndb.BooleanProperty(default=False) 
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  order_number = ndb.StringProperty(default='')
  amount = ndb.FloatProperty(default=0.0) 
  date = ndb.DateProperty(auto_now_add=True)
  seller = ndb.KeyProperty(Seller)
  seller_urlsafe = ndb.StringProperty(default='')
  seller_name = ndb.StringProperty(default='')
  seller_email = ndb.StringProperty(default='')
  master_product = ndb.KeyProperty(Product)
  master_product_urlsafe= ndb.StringProperty(default='')
  product = ndb.KeyProperty(Product)
  product_urlsafe= ndb.StringProperty(default='')
  code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  size = ndb.StringProperty(default='')
  uom = ndb.StringProperty(default='')
  category = ndb.StringProperty(default='')
  description = ndb.TextProperty(default='')
  retail_price = ndb.FloatProperty(default=0.0) 
  master_price = ndb.FloatProperty(default=0.0) 
  image_url = ndb.StringProperty(default='')
  client_print = ndb.StringProperty(default='[]')
  qty = ndb.IntegerProperty(default=0)
  client_name = ndb.StringProperty(default='')
  phone = ndb.StringProperty(default='')
  email = ndb.StringProperty(default='')
  alternate_phone = ndb.StringProperty(default='')
  status = ndb.StringProperty(default='created')
  history = ndb.TextProperty(default='[]')