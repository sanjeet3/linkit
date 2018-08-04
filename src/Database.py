'''
Created on 05-Jul-2018

@author: Sanjay Saini
'''
 
from src.endpoints_proto_datastore.ndb import EndpointsModel

import time
import logging
  
from google.appengine.ext import ndb
from webapp2_extras import security
from webapp2_extras.appengine.auth.models import User as UserSessionModel
from src.app_configration import config

product_design_title_choice = config.get('design_img_title')

class UserSession(UserSessionModel):
  username = ndb.StringProperty()
    
  def set_password(self, raw_password):
    """Sets the password for the current user

    :param raw_password:
        The raw password which will be hashed and stored
    """
    self.password = security.generate_password_hash(raw_password, length=12)

  @classmethod
  def get_by_auth_token(cls, user_id, token, subject='auth'):
    """Returns a user object based on a user ID and token.

    :param user_id:
        The user_id of the requesting user.
    :param token:
        The token string to be verified.
    :returns:
        A tuple ``(User, timestamp)``, with a user object and
        the token timestamp, or ``(None, None)`` if both were not found.
    """
    token_key = cls.token_model.get_key(user_id, subject, token)
    user_key = ndb.Key(cls, user_id)
    # Use get_multi() to save a RPC call.
    valid_token, user = ndb.get_multi([token_key, user_key])
    if valid_token and user:
        timestamp = int(time.mktime(valid_token.created.timetuple()))
        return user, timestamp

    return None, None

  @classmethod
  def get_user_session_model_by_username(cls, username):
    return cls.query(cls.username==username).get()  


class Client(EndpointsModel):
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=False) 
  alert = ndb.BooleanProperty(default=False) 
  name = ndb.StringProperty(default='')
  email = ndb.StringProperty(default='')
  password = ndb.StringProperty(default='')
  telephone = ndb.StringProperty(default='')
  verification_code = ndb.StringProperty(default='')
  address = ndb.TextProperty(default='')

  @classmethod
  def get_all(cls):
    return cls.query()

  @classmethod
  def get_inactive(cls):
    return cls.query(cls.status==False)

  @classmethod
  def get_active_client_by_email(cls, email):
    return cls.query(cls.status==True, cls.email==email).get() 

  @classmethod
  def verify_email(cls, email):
    return cls.query(cls.email==email).get() 

  @classmethod
  def validate_active_client(cls, email, password):
    return cls.query(cls.status==True, cls.email==email, cls.password==password).get()   
  
  
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
    return cls.query().order(cls.name).fetch()

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
  bg_uri = ndb.StringProperty(default='')
  bg_bckt_key= ndb.StringProperty(default='')

  @classmethod
  def get_product_by_code(cls, code):
    return cls.query(cls.code==code).get()

  @classmethod
  def get_selling_product_list(cls):
    return cls.query(cls.endclient_visible==True).fetch()

  @classmethod
  def get_selling_product_list_by_category(cls, category_key):
    return cls.query(cls.endclient_visible==True, cls.category_key==category_key).fetch()

  @classmethod
  def get_product_list(cls):
    return cls.query().fetch()

class ProductDesign(EndpointsModel):
  ''' Product datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  product = ndb.KeyProperty(Product)
  title = ndb.StringProperty(choices=product_design_title_choice)
  top = ndb.StringProperty(default='')
  left = ndb.StringProperty(default='') 
  image_url = ndb.StringProperty(default='') 
  bucket_path = ndb.StringProperty(default='') 
  bucket_key = ndb.StringProperty(default='')  
    
  @classmethod
  def get_exist_design(cls, product, title):
    return cls.query(cls.product==product, cls.title==title).get()
    
  @classmethod
  def get_design_list(cls, product):
    return cls.query(cls.product==product).order(cls.created_on).fetch()  
  
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
  payment_ref = ndb.StringProperty(default='')
  payed = ndb.BooleanProperty(default=False) 
  amount = ndb.FloatProperty(default=0.0) 
  date = ndb.DateProperty(auto_now_add=True)
  seller = ndb.KeyProperty(Seller)
  client = ndb.KeyProperty(Client)
  design = ndb.KeyProperty()
  seller_urlsafe = ndb.StringProperty(default='')
  seller_name = ndb.StringProperty(default='')
  seller_email = ndb.StringProperty(default='')
  master_product = ndb.KeyProperty(Product)
  master_product_urlsafe= ndb.StringProperty(default='') 
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
  status = ndb.StringProperty(default='Ordered')
  history = ndb.TextProperty(default='[]')
  
  @classmethod
  def get_order_filetered(cls, from_date, to_date, seller_list=[]):  
    q = cls.query(cls.date>=from_date, cls.date<=to_date).order(-cls.date)
    if seller_list:
      q = q.filter(cls.seller.IN(seller_list))    
    return q

class SellerOrderHistory(EndpointsModel):
  '''Franchisor order Data Store model ''' 
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  order = ndb.KeyProperty(SellerOrder)
  stage = ndb.StringProperty()
  date = ndb.StringProperty()
  time = ndb.StringProperty()
  
  
class ClientProductDesign(EndpointsModel): 
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  client = ndb.KeyProperty(Client)
  product = ndb.KeyProperty(Product)
  product_code = ndb.StringProperty(default='')
  design_id = ndb.StringProperty(default='')
  design_prev = ndb.TextProperty(default='')
  layer_list = ndb.TextProperty(repeated=True)
  layer_ext_list = ndb.TextProperty(repeated=True)

  @classmethod
  def get_by_design_id(cls, design_id):
    e = cls.query(cls.design_id==design_id).get()      
    return e
  
class OrderStage(EndpointsModel):
  name = ndb.StringProperty(repeated=True)

  @classmethod
  def get_order_stage(cls):
    e = cls.query().get()
    if not e:
      e = OrderStage()
      
    return e

class Themes(EndpointsModel):
  ''' Themes datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  title = ndb.StringProperty(default='')
  status = ndb.BooleanProperty(default=False) 
  img1 = ndb.StringProperty(default='')
  img2 = ndb.StringProperty(default='')
  img3 = ndb.StringProperty(default='')
  img4 = ndb.StringProperty(default='')
  img5 = ndb.StringProperty(default='')
  img6 = ndb.StringProperty(default='')
  img7 = ndb.StringProperty(default='')
  img8 = ndb.StringProperty(default='')
  img9 = ndb.StringProperty(default='')
  img10 = ndb.StringProperty(default='')
  img11 = ndb.StringProperty(default='')
  img12 = ndb.StringProperty(default='')
  
  @classmethod
  def get_theme(cls):  
    return cls.query(cls.status==True).get()

  @classmethod
  def get_active_theme(cls):  
    return cls.query(cls.status==True)
  
  @classmethod
  def get_theme_list(cls):  
    return cls.query()

class EventMaster(EndpointsModel):
  ''' Themes datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  title = ndb.StringProperty(default='')
  description = ndb.TextProperty(default='')
  religion = ndb.StringProperty(repeated=True)
  gender = ndb.StringProperty(repeated=True)
  from_age = ndb.IntegerProperty(default=-1)
  to_age = ndb.IntegerProperty(default=-1)
  all_age = ndb.BooleanProperty(default=False) 
  img_url = ndb.StringProperty(default='')
  bucket_key = ndb.StringProperty(default='')
  seq_num = ndb.IntegerProperty(default=0)
  seq_selected = ndb.BooleanProperty(default=False)
  
  @classmethod
  def get_list(cls):  
    return cls.query().fetch()
  
  @classmethod
  def get_client_view(cls):  
    return cls.query(cls.seq_selected==True).order(-cls.seq_num).fetch()
