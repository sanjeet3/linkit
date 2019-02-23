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
from datetime import datetime

product_design_title_choice = config.get('design_img_title')
MAIL_TEMPLATE_CHOICES = config.get('MAIL_TEMPLATE_CHOICES')

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

class ClientLogs(ndb.Model):  
  client = ndb.KeyProperty(Client)
  created_on = ndb.DateProperty(auto_now_add=True)
  email = ndb.StringProperty(default='')
  in_time = ndb.IntegerProperty(default=0)
  hit_time = ndb.IntegerProperty(default=0)
  
  @classmethod
  def log_entry(cls, client_obj):
    e = cls.query(cls.client==client_obj.key, cls.created_on==datetime.now().date()).get()  
    if not e:
      ClientLogs(client=client_obj.key, email=client_obj.email, created_on=datetime.now().date(), in_time=int(time.time())).put()  
    else:
      e.hit_time = int(time.time())    
      e.put()  

  @classmethod
  def get_list(cls, dt=datetime.now().date()):
    return cls.query(cls.created_on==dt).fetch()
  
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
  status = ndb.BooleanProperty(default=True)
  code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  size = ndb.StringProperty(default='')
  uom = ndb.StringProperty(default='')
  event_list = ndb.KeyProperty(repeated=True)
  event_urlsafe = ndb.StringProperty(repeated=True)
  uom_key = ndb.KeyProperty(ProductUOM)
  category = ndb.StringProperty(default='')
  category_key = ndb.KeyProperty(ProductCategory)
  price = ndb.FloatProperty(default=0.0) 
  min_qty = ndb.IntegerProperty(default=1) 
  description = ndb.TextProperty(default='') 
  image_url = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True) 
  bucket_key = ndb.StringProperty(repeated=True)
  slider_url = ndb.StringProperty(repeated=True) 
  slider_key = ndb.StringProperty(repeated=True) 
  instock = ndb.BooleanProperty(default=True) 
  endclient_visible = ndb.BooleanProperty(default=False)
  bg_uri = ndb.StringProperty(default='')
  bg_bckt_key = ndb.StringProperty(default='')
  endclient_selection = ndb.BooleanProperty(default=False)
  promo_img = ndb.StringProperty(default='')
  promo_buckt_key = ndb.StringProperty(default='')
  promo_product_bg_img = ndb.StringProperty(default='')
  promo_product_bg_key = ndb.StringProperty(default='')
  promo_text = ndb.StringProperty(default='')
  promo_sequence = ndb.IntegerProperty(default=0)
  default_design_template = ndb.StringProperty(default='')
  custom_lable = ndb.TextProperty(default='')
  
  @classmethod
  def get_product_by_code(cls, code):
    return cls.query(cls.code==code).get()

  @classmethod
  def get_product_by_event(cls, evnt_list):
    return cls.query(cls.event_list.IN(evnt_list))

  @classmethod
  def get_home_screen_product(cls):
    return cls.query(cls.endclient_selection==True).order(cls.name).fetch()

  @classmethod
  def get_promo_product(cls):
    return cls.query(cls.endclient_selection==True).order(cls.promo_sequence).fetch()

  @classmethod
  def get_selling_product_list(cls):
    return cls.query(cls.endclient_visible==True).fetch()

  @classmethod
  def get_selling_product_list_by_category(cls, category_key):
    return cls.query(cls.endclient_visible==True, cls.category_key==category_key).fetch()

  @classmethod
  def get_product_list(cls):
    return cls.query().fetch()

  @classmethod
  def get_product_list_by_categgory(cls, category_key):
    return cls.query(cls.category_key==category_key)

  @classmethod
  def get_product_list_by_uom(cls, uom_key):
    return cls.query(cls.uom_key==uom_key)

  @classmethod
  def get_latest_product_list(cls, limit=5):
    return cls.query().order(-cls.created_on).fetch(limit)

class ProductTutorial(EndpointsModel):
  ''' Product tutorial datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  product = ndb.KeyProperty(Product)
  video_link = ndb.TextProperty(default='')
  pdf_bucket_path = ndb.StringProperty(default='')
  pdf_bucket_key = ndb.StringProperty(default='')
  
  @classmethod
  def get_tutorial(cls, product_key):
    e = cls.query(cls.product==product_key).get()
    if not e:
      e = ProductTutorial()
      e.product = product_key
      e = e.put().get()    
    return e
  
class ProductDesign(EndpointsModel):
  ''' Product datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  product = ndb.KeyProperty(Product)
  title = ndb.StringProperty(choices=product_design_title_choice)
  top = ndb.StringProperty(default='0')
  left = ndb.StringProperty(default='0') 
  scaleX = ndb.StringProperty(default='1') 
  scaleY = ndb.StringProperty(default='1') 
  image_url = ndb.StringProperty(default='') 
  bucket_path = ndb.StringProperty(default='') 
  bucket_key = ndb.StringProperty(default='')  
    
  @classmethod
  def get_exist_design(cls, product, title):
    return cls.query(cls.product==product, cls.title==title).get()
    
  @classmethod
  def get_design_list(cls, product):
    return cls.query(cls.product==product).order(cls.title).fetch()  
  
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
  @classmethod
  def get_default_seller_product(cls, master_product):
    return cls.query(cls.master_product==master_product, cls.endclient_visible==True).get()

SELLER_LADGER_BY = ['CLIENT', 'SELLER'] 
class SellerLadger(EndpointsModel):
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  created_date = ndb.DateProperty(auto_now_add=True)
  seller = ndb.KeyProperty(Seller)
  client = ndb.KeyProperty(Client)
  seller_name = ndb.StringProperty(default='')
  seller_email = ndb.StringProperty(default='')
  order = ndb.KeyProperty()
  order_number = ndb.StringProperty(default='')
  master_product = ndb.KeyProperty(Product)
  order_by = ndb.StringProperty(default='CLIENT', choices=SELLER_LADGER_BY)
  payment_ref = ndb.StringProperty(default='')
  retail_price = ndb.FloatProperty(default=0.0) 
  master_price = ndb.FloatProperty(default=0.0) 
  qty = ndb.IntegerProperty(default=0) 
  debit = ndb.FloatProperty(default=0.0) 
  credit = ndb.FloatProperty(default=0.0) 
  balance = ndb.FloatProperty(default=0.0)
  
  @classmethod
  def get_list(cls):
    return cls.query().order(-cls.created_date).fetch(100)  
      
  @classmethod
  def get_filtered_list(cls, from_date, to_date, seller=None):
    q=cls.query().order(-cls.created_date)
    if from_date and to_date:
      q = q.filter(cls.created_date>=from_date, cls.created_date<=to_date)
    if seller:
      q = q.fileter(cls.seller==seller)             
    return q.fetch()

class SellerOrder(EndpointsModel):
  '''Franchisor order Data Store model '''
  cancel = ndb.BooleanProperty(default=False) 
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  order_number = ndb.StringProperty(default='')
  payment_ref = ndb.StringProperty(default='')
  payment_dt = ndb.StringProperty(default='')
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
  client_print = ndb.StringProperty(repeated=True)
  production_print = ndb.StringProperty(repeated=True)
  qty = ndb.IntegerProperty(default=0)
  client_name = ndb.StringProperty(default='')
  phone = ndb.StringProperty(default='')
  email = ndb.StringProperty(default='')
  alternate_phone = ndb.StringProperty(default='')
  status = ndb.StringProperty(default='Ordered')
  history = ndb.TextProperty(default='[]')
  
  @classmethod
  def get_order_filetered(cls, from_date, to_date, seller_list=[], status_list=[]):  
    q = cls.query(cls.date>=from_date, cls.date<=to_date).order(-cls.date)
    if seller_list:
      q = q.filter(cls.seller.IN(seller_list))    
    if status_list:  
      q = q.filter(cls.seller.IN(status_list))    
    return q

  @classmethod
  def get_client_filetered(cls, client, from_date=None, to_date=None): 
    q = cls.query(cls.client==client).order(-cls.date)
    if from_date and to_date:
      q = q.filter(cls.date>=from_date, cls.date<=to_date)    
    return q.fetch(projection=[
      cls.amount,
      cls.code,
      cls.date,
      cls.image_url,
      cls.name,
      cls.qty,
      cls.retail_price,
      cls.status,
      cls.size,
      ])    
  
  @classmethod
  def get_by_ref(cls, ref):
    return cls.query(cls.payment_ref==ref).get()
      
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
  svg_url = ndb.StringProperty(repeated=True)
  svg_key = ndb.StringProperty(repeated=True)
  png_key = ndb.StringProperty(repeated=True)
  png_url = ndb.StringProperty(repeated=True)

  @classmethod
  def get_by_design_id(cls, design_id):
    e = cls.query(cls.design_id==design_id).get()      
    return e

  @classmethod
  def get_client_design(cls, client, product):
    e = cls.query(cls.client==client, cls.product==product).fetch()      
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
  
  @classmethod
  def get_theme(cls):  
    return cls.query(cls.status==True).get()

  @classmethod
  def get_active_theme(cls):  
    return cls.query(cls.status==True)
  
  @classmethod
  def get_theme_list(cls):  
    return cls.query()

  @classmethod
  def get_theme_count(cls):  
    return cls.query().count()

class HomeScreenStaticURL(EndpointsModel):
  ''' Themes datastore '''
  updated_on = ndb.DateTimeProperty(auto_now_add=True)
  url_one = ndb.StringProperty(default='')
  url_one_key = ndb.StringProperty(default='')
  url_tow = ndb.StringProperty(default='')
  url_tow_key = ndb.StringProperty(default='')
  url_three = ndb.StringProperty(default='')
  url_three_key = ndb.StringProperty(default='')

  @classmethod
  def get_obj(cls):  
    e = cls.query().get()
    if not e:
      e = HomeScreenStaticURL().put().get()
    return e      

class EventMaster(EndpointsModel):
  ''' Themes datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  title = ndb.StringProperty(default='')
  description = ndb.TextProperty(default='')
  religion = ndb.StringProperty(repeated=True)
  gender = ndb.StringProperty(repeated=True)
  age_list = ndb.IntegerProperty(repeated=True)
  all_age = ndb.BooleanProperty(default=False) 
  img_url = ndb.StringProperty(default='')
  bucket_key = ndb.StringProperty(default='')
  seq_num = ndb.IntegerProperty(default=0)
  seq_selected = ndb.BooleanProperty(default=False)
  status = ndb.BooleanProperty(default=True)
  date = ndb.DateProperty()
  start_date = ndb.DateProperty()
  end_date = ndb.DateProperty()
  
  @classmethod
  def get_list(cls):  
    return cls.query().fetch()

  @classmethod
  def search_event(cls, religion, gender, age): 
    q = cls.query(cls.all_age==False)
    if religion:
      q = q.filter(cls.religion.IN([religion]))
    if gender:
      q = q.filter(cls.gender.IN([gender]))
    if age:
      q = q.filter(cls.age_list.IN([age]))
             
    return q.fetch()

  @classmethod
  def search_event_all_age(cls, religion, gender): 
    q = cls.query(cls.all_age==True)
    if religion:
      q = q.filter(cls.religion.IN([religion]))
    if gender:
      q = q.filter(cls.gender.IN([gender]))
              
    return q.fetch()
  
  @classmethod
  def get_client_view(cls):  
    return cls.query(cls.seq_selected==True, cls.status==True).order(cls.seq_num).fetch()

class StaticImage(EndpointsModel):
  ''' Themes datastore ''' 
  img_url = ndb.StringProperty(repeated=True)
  
  @classmethod
  def get_obj(cls):
    e = cls.query().get()
    if not e:
      e = StaticImage().put().get()    
    return e   
 
class DesignCategory(EndpointsModel):
  ''' Themes datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  title = ndb.StringProperty(default='')
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  img_title = ndb.StringProperty(repeated=True)
  product_category = ndb.KeyProperty(repeated=True)
  
  @classmethod
  def get_list(cls):  
    return cls.query().order(cls.title)  
  
  @classmethod
  def get_mapping_list(cls, category):  
    return cls.query(cls.product_category.IN([category])).order(cls.title)  
      
class DesignSubCategory(EndpointsModel):
  ''' Themes datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  title = ndb.StringProperty(default='')
  category = ndb.KeyProperty(DesignCategory)
  category_urlsafe = ndb.StringProperty(default='')
  category_name = ndb.StringProperty(default='')
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  img_title = ndb.StringProperty(repeated=True)
  
  @classmethod
  def get_list(cls):  
    return cls.query().order(cls.title)  
  
  @classmethod
  def query_by_category(cls, category):  
    return cls.query(cls.category==category)  

class BGCategory(EndpointsModel):
  ''' Background category datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  title = ndb.StringProperty(default='')
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  img_title = ndb.StringProperty(repeated=True)
  product_category = ndb.KeyProperty(repeated=True)
  
  @classmethod
  def get_list(cls):  
    return cls.query().order(cls.title)  

  @classmethod
  def get_mapping_list(cls, category):  
    return cls.query(cls.product_category.IN([category])).order(cls.title)  
        
        
class BGSubCategory(EndpointsModel):
  ''' Background sub-category datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  title = ndb.StringProperty(default='')
  category = ndb.KeyProperty(BGCategory)
  category_urlsafe = ndb.StringProperty(default='')
  category_name = ndb.StringProperty(default='')
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  img_title = ndb.StringProperty(repeated=True)
  
  @classmethod
  def get_list(cls):  
    return cls.query().order(cls.title)   
  
  @classmethod
  def query_by_category(cls, category):  
    return cls.query(cls.category==category)

class FrameCategory(EndpointsModel):
  ''' Background category datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  title = ndb.StringProperty(default='')
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  img_title = ndb.StringProperty(repeated=True)
  product_category = ndb.KeyProperty(repeated=True)
  
  @classmethod
  def get_list(cls):  
    return cls.query().order(cls.title)  

  @classmethod
  def get_mapping_list(cls, category):  
    return cls.query(cls.product_category.IN([category])).order(cls.title)  
        
        
class FrameSubCategory(EndpointsModel):
  ''' Background sub-category datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  title = ndb.StringProperty(default='')
  category = ndb.KeyProperty(FrameCategory)
  category_urlsafe = ndb.StringProperty(default='')
  category_name = ndb.StringProperty(default='')
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  img_title = ndb.StringProperty(repeated=True)
  
  @classmethod
  def get_list(cls):  
    return cls.query().order(cls.title)   
  
  @classmethod
  def query_by_category(cls, category):  
    return cls.query(cls.category==category)

class TextPatterns(EndpointsModel):
  ''' Text Patterns datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  
  @classmethod
  def get_img_url_list(cls):
    l = []
    e = cls.query().get()
    if e:
      l = e.img_url        
    return l 

  @classmethod
  def get_obj(cls):
    e = cls.query().get()
    if not e:
      e = TextPatterns()      
    return e

class Masks(EndpointsModel):
  ''' Text Patterns datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  img_url = ndb.StringProperty(repeated=True)
  bucket_key = ndb.StringProperty(repeated=True)
  bucket_path = ndb.StringProperty(repeated=True)
  
  @classmethod
  def get_img_url_list(cls):
    l = []
    e = cls.query().get()
    if e:
      l = e.img_url        
    return l 
  
  @classmethod
  def get_bucket_list(cls):
    l = []
    e = cls.query().get()
    if e:
      l = e.bucket_path        
    return l 

  @classmethod
  def get_obj(cls):
    e = cls.query().get()
    if not e:
      e = Masks()      
    return e

class ProductCanvas(EndpointsModel):
  ''' Text Patterns datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True) 
  active = ndb.BooleanProperty(default=True)
  product = ndb.KeyProperty(Product)
  code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  img_url = ndb.StringProperty(default='')
  bucket_key = ndb.StringProperty()
  bucket_path = ndb.StringProperty()
  top = ndb.StringProperty(default='0')
  left = ndb.StringProperty(default='0') 
  stage_height = ndb.StringProperty(default='780')
  stage_width = ndb.StringProperty(default='780')
  preview_url = ndb.StringProperty(default='')
  preview_key = ndb.StringProperty()
  preview_top = ndb.StringProperty(default='0')
  preview_left = ndb.StringProperty(default='0') 
  preview_width = ndb.StringProperty(default='500') 
  designer_module = ndb.StringProperty(repeated=True)
  
  @classmethod
  def get_obj(cls, product_key):
    return cls.query(cls.product==product_key).get()

ROLE_LIST = ['ADMIN', 'ACCOUNT', 'DESIGN', 'PRODUCTION', 'STORE']  
class UserModel(EndpointsModel):
  created_on = ndb.DateTimeProperty(auto_now_add=True)    
  acl = ndb.IntegerProperty(default=0)   
  name = ndb.StringProperty(default='')   
  email = ndb.StringProperty(required=True)   
  role = ndb.StringProperty(choices=ROLE_LIST)   
  active = ndb.BooleanProperty(default=True)
  
  @classmethod
  def get_list(cls):  
    return cls.query().order(cls.name).fetch()  

  @classmethod
  def get_by_role(cls, role):  
    return cls.query(cls.role==role).fetch()  

  @classmethod
  def get_by_email(cls, email):  
    return cls.query(cls.email==email).get()
  @classmethod
  def get_active_by_email(cls, email):  
    return cls.query(cls.email==email.lower(), cls.active==True).get()

class ReadyDesignTemplate(EndpointsModel):
  ''' Text Patterns datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  status = ndb.BooleanProperty(default=True)
  product = ndb.KeyProperty(Product)
  product_code = ndb.StringProperty(default='')
  name = ndb.StringProperty(default='')
  design_prev_url = ndb.TextProperty(default='')
  template_source = ndb.TextProperty(repeated=True)
  template_name = ndb.StringProperty(default='')

  @classmethod
  def get_list(cls):  
    return cls.query().order(-cls.created_on).fetch()  
  @classmethod
  def get_ready_design_list(cls, product):  
    return cls.query(cls.product==product).order(-cls.created_on).fetch()  

class RoleModel(EndpointsModel):
  created_on = ndb.DateTimeProperty(auto_now_add=True)    
  acl = ndb.IntegerProperty(default=0) 
  role = ndb.StringProperty(choices=['ACCOUNT', 'DESIGN', 'PRODUCTION', 'STORE'] ) 
  
  @classmethod
  def get_by_role(cls, role):
    r = cls.query(cls.role==role).get()
    if not r:
      r = RoleModel(role=role).put().get()        
    return r 

  @classmethod
  def _post_put_hook(self, future):
    ''' update user acl in reference of role update '''
    _role_obj = future.get_result().get()  
    _e_list=[]
    for u in UserModel.get_by_role(_role_obj.role):
      u.acl = _role_obj.acl
      _e_list.append(u)
    if _e_list:
      logging.info('updating_user_Acl %s' %(_e_list.__len__()))
      ndb.put_multi(_e_list)
              
class MailUploads(EndpointsModel):
  created_on = ndb.DateTimeProperty(auto_now_add=True)  
  serving_url = ndb.StringProperty(default='')  
  bucket_key = ndb.StringProperty(default='')  
  bucket_path = ndb.StringProperty(default='')  
    
  @classmethod
  def get_list(cls):
    return cls.query().fetch()  
        
class AllowDesignerOffLogin(ndb.Model):
  allow = ndb.BooleanProperty(default=False)
  
  @classmethod
  def get_obj(cls):
    e = cls.query().get()
    if not e:
      e = AllowDesignerOffLogin().put().get()
    return e

      
class MailTemplateModel(EndpointsModel):
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  header_img = ndb.StringProperty(default='')    
  bg_img = ndb.StringProperty(default='')    
  padding_bottom = ndb.StringProperty(default='50')    
  padding_top = ndb.StringProperty(default='50')    
  codeline_html = ndb.TextProperty(default='')  
  template = ndb.TextProperty(default='')  
  template_type = ndb.StringProperty(choices=MAIL_TEMPLATE_CHOICES)  
  subject = ndb.StringProperty(default='')  
    
  @classmethod
  def get_list(cls):
    return cls.query().fetch()  
        
  @classmethod
  def get_template(cls, template_type):
    return cls.query(cls.template_type==template_type).get()          

class ProductDiscount(EndpointsModel):
  ''' Product datastore '''
  created_on = ndb.DateTimeProperty(auto_now_add=True)
  product = ndb.KeyProperty(Product)
  p_key = ndb.StringProperty()
  qty = ndb.IntegerProperty(default=1)
  discount = ndb.FloatProperty(default=0)
  
  @classmethod
  def get_product_discount_list(cls, product_key):
    return cls.query(cls.product==product_key).fetch()

class MasterData(EndpointsModel):
  ''' Product datastore '''
  hire_data = ndb.TextProperty(default='')

  @classmethod
  def get_obj(cls):
    e = cls.query().get()
    if not e:
      e = MasterData().put().get()
      
    return e      
