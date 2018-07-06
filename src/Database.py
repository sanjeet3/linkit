'''
Created on 05-Jul-2018

@author: Sanjay Saini
'''
 
from src.endpoints_proto_datastore.ndb import EndpointsModel

from google.appengine.ext import ndb

class Franchisor(EndpointsModel):
  '''Franchisor Data Store model '''
  status = ndb.BooleanProperty(default=True) 
  name = ndb.StringProperty(default='')
  telephone = ndb.StringProperty(default='')
  mobile = ndb.StringProperty(default='')
  email = ndb.StringProperty(default='')
  geo_code = ndb.StringProperty(default='')
  geo = ndb.GeoPtProperty()
  address = ndb.TextProperty(default='')

class Product(EndpointsModel):
  ''' Product datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  size = ndb.StringProperty(default='')
  uom = ndb.StringProperty(default='')
  category = ndb.StringProperty(default='')
  price = ndb.FloatProperty(default=0.0) 
  description = ndb.TextProperty(default='') 
  image_url = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True) 
  bucket_key = ndb.StringProperty(repeated=True) 
  instock = ndb.BooleanProperty(default=True) 
  endclient_visible = ndb.BooleanProperty(default=False)
  
class FranchisorProduct(EndpointsModel):
  ''' Franchisor Product datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  master_product = ndb.KeyProperty(Product)
  master_product_urlsafe= ndb.StringProperty(default='')
  franchisor = ndb.KeyProperty(Franchisor)
  franchisor_urlsafe = ndb.StringProperty(default='')
  code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  size = ndb.StringProperty(default='')
  uom = ndb.StringProperty(default='')
  category = ndb.StringProperty(default='')
  retail_price = ndb.FloatProperty(default=0.0) 
  master_price = ndb.FloatProperty(default=0.0) 
  description = ndb.TextProperty(default='') 
  image_url = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True) 
  bucket_key = ndb.StringProperty(repeated=True) 
  instock = ndb.BooleanProperty(default=True) 
  endclient_visible = ndb.BooleanProperty(default=False)  
