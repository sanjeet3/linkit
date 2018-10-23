'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.Database import Product, Seller, SellerProduct, SellerOrder, BGCategory
from src.Database import Client, ClientProductDesign, ProductDesign, AllowDesignerOffLogin
from src.Database import OrderStage, ProductCategory, Themes, EventMaster
from src.Database import SellerLadger, ReadyDesignTemplate
from src.Database import ProductCanvas ,DesignCategory, DesignSubCategory, FrameCategory,FrameSubCategory, BGSubCategory, Masks, TextPatterns 
from src.lib.ECBasehandler import ActionSupport
 
import logging, time 
from uuid import uuid1
import json
from src.api.baseapi import json_response, SUCCESS, ERROR
from src.api.bucketHandler import get_by_bucket_key, write_urlecoded_png_img, upload_text_file
from src.api.datetimeapi import get_dt_by_country
import datetime

from google.appengine.api import taskqueue
from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.api import images
from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError
from src.app_configration import config
import base64

design_img_title = config.get('design_img_title')

import webapp2
import src.lib.external.cloudstorage as gcs
class PrivacyPolicy(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('endclient/privacy_policy.html') 
    self.response.out.write(template.render({}))
                              
class TermsAndConditions(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('endclient/terms_conditions.html') 
    self.response.out.write(template.render({}))
                              
class Imgage(webapp2.RequestHandler):
  def get(self):
    bucket_path = self.request.get('id')
    try:
      with gcs.open(bucket_path, 'r') as gcs_file:
        contents = gcs_file.read()
        gcs_file.close()
        self.response.headers['Content-Type'] = "image/svg+xml"
        self.response.write(contents)
    except Exception, e:
      logging.error(e) 

class GetBucketFile(webapp2.RequestHandler):
  def get(self):
    bucket_path = self.request.get('id')
    try:
      with gcs.open(bucket_path, 'r') as gcs_file:
        contents = gcs_file.read()
        gcs_file.close()
        self.response.headers['Content-Type'] = "image/svg+xml"
        self.response.write(contents)
    except Exception, e:
      logging.error(e) 

      
class ActivateAccount(ActionSupport):
  def get(self):     
    key = self.request.get('key')
    
    try:
      e = ndb.Key(urlsafe=key).get()    
    except Exception, msg:
      logging.error(msg)
      self.abort(401) 
      return
    
    e.status=True
    e.put()
    return self.redirect('/')  
  
          

class Register(ActionSupport): 
  def post(self):  
    data_dict = {}  
    name = self.request.get('name')
    email = self.request.get('email')
    password = self.request.get('password')
    contact = self.request.get('contact') 
    if not email or '@' not in  email or email.__len__()<5:
      return json_response(self.response, data_dict, ERROR, 'Invalid email')
  
    if Client.verify_email(email):
      return json_response(self.response, data_dict, ERROR, 'Email account exist')    
    
    e = Client()
    e.email=email
    e.name=name
    e.telephone=contact
    e.password=password 
    e.alert = True if self.request.get('recieved_offers') else False
    e = e.put().get()
    try:
      taskqueue.add(url='/taskqueue/VerifyAccountMailer',
                    queue_name='VerifyAccountMailer',
                    params={'receiver_mail': email,
                            'name': name,
                            'key': e.entityKey})
    except Exception, msg:
      logging.error(msg)
      
        
    data_dict['email']=email    
    return json_response(self.response, data_dict, SUCCESS, '%s account created' %(email))
    
class Login(ActionSupport): 
  def get(self):
    template = self.get_jinja2_env.get_template('endclient/loginerror.html')    
    self.response.out.write(template.render({'msg': 'Kindly fill login details',
                                             'register': self.request.get('r')}))    
      
  def validate_login_detail(self):
    self.valid_credential = True     
    email = self.request.get('email').lower()
    password =  self.request.get('password').lower()
    if email.__len__() < 5:
      self.valid_credential = False
      self.msg = 'invalid email: minimum 5 char'       
    if password.__len__() < 5:
      self.valid_credential = False    
      self.msg = 'invalid password: minimum 5 char'
      
  def post(self):
    logging.info('Validating log-in!')
    user = None
    email = self.request.get('email').lower()
    password =  self.request.get('password').lower()
    self.validate_login_detail()
    if self.valid_credential:
      user  = Client.validate_active_client(email, password)
      self.msg = 'invalid email or password'
    sesion_success = False
    if user:
      sesion_success = True    
      if not self.validate_in_session(email, password):
        if not self.register_and_validate(email, password): 
          self.msg = 'Please try again' 
          sesion_success = False
    
    if sesion_success:
      return self.redirect('/')      
    else:
      template = self.get_jinja2_env.get_template('endclient/loginerror.html')    
      self.response.out.write(template.render({'msg': self.msg}))   
    
  def validate_in_session(self, user_name, password):
    ''' Validate User in Webapp2.model.user '''  
    #logging.info('validating User: %s, Password:%s' % (user_name, password))  
    try:
      u = self.auth.get_user_by_password(user_name,
                                         password,
                                         remember=True,
                                         save_session=True)
      logging.info(u) 
    except (InvalidAuthIdError, InvalidPasswordError) as e:
      logging.info('login_failed for user %s because of %s', user_name, type(e))
      return None
    
    return u  

  def register_and_validate(self, email, password):
    ''' Register New User in Webapp2.model.user 
        def user_session_model.create_user(cls, auth_id, unique_properties=None, **user_values)
    '''
    logging.info('Registering')
    user_data = [False]  
    try: 
      user_data = self.user_session_model.create_user(email,
                                                      username = email,                    
                                                      password_raw=password,
                                                      verified=False)
      logging.info(user_data)
    except Exception, e:
      logging.info(e)    
    
    if user_data[0]:
      time.sleep(2)    
             
    try:
      logging.info('Get User by password')  
      u = self.auth.get_user_by_password(email,
                                         password,
                                         remember=True,
                                         save_session=True)
      #logging.info(u) 
    except (InvalidAuthIdError, InvalidPasswordError) as e:
      logging.info('register_failed for user %s because of %s', email, type(e))
      return None
    
    return u

           
class Logout(ActionSupport):
  def get(self):
    #logout from session
    self.auth.unset_session()     
    return self.redirect('/')   

class Home(ActionSupport):
  def get(self): 
    product_cat_list = ProductCategory.get_list()
    e_list = EventMaster.get_client_view()
    new_product = Product.get_latest_product_list(10)
    selected_product = Product.get_home_screen_product()
    th = Themes.get_theme()
    themes_path = th.title if th else 'theme1'
    template = self.get_jinja2_env.get_template('endclient/home.html')    
    self.response.headers['Access-Control-Allow-Origin']='https://storage.googleapis.com'
    self.response.out.write(template.render({'product_cat_list': product_cat_list,
                                             'user_obj': self.client,
                                             'e_list': e_list,
                                             'r': self.request.get('r'),
                                             'new_product': new_product,
                                             'selected_product': selected_product,
                                             'themes_path': themes_path}))

class GetEventView(ActionSupport):
  def get(self):
    gender=self.request.get('gender')
    age=int(self.request.get('age')) if self.request.get('age') else None
    religion=self.request.get('religion')          
    event_list = EventMaster.search_event(religion, gender, age)
    event_list_all_age = EventMaster.search_event_all_age(religion, gender)
    template = self.get_jinja2_env.get_template('endclient/event_list.html') 
    self.response.out.write(template.render({'event_list_all_age': event_list_all_age,
                                             'event_list': event_list}))
class ProductView(ActionSupport):
  def get(self):
    product_key=self.request.get('key')
    category_key=self.request.get('cat')
    evt_key=self.request.get('evt')
    selected_cat = None
    product_list = []
    product_cat_list = ProductCategory.get_list()
    
    if evt_key:
      product_list=Product.get_product_by_event([ndb.Key(urlsafe=evt_key)])  
    elif product_key:
      p = ndb.Key(urlsafe=product_key).get()
      logging.info(p)
      selected_cat = p.category_key
      product_list = Product.get_selling_product_list_by_category(selected_cat)
      logging.info(product_list)
    elif category_key:
      selected_cat = ndb.Key(urlsafe=category_key)
      product_list = Product.get_selling_product_list_by_category(selected_cat)  
    else:
      self.abort(401)        
    
    category_list = ProductCategory.get_list()
    
    data = {'selected_cat': selected_cat,
            'category_list': category_list,
            'product_list': product_list,
            'product_cat_list': product_cat_list,
            'user_obj': self.client}
    
    template = self.get_jinja2_env.get_template('endclient/product_view.html')    
    self.response.headers['Access-Control-Allow-Origin']='https://storage.googleapis.com'
    self.response.out.write(template.render(data))
    
class GetProductDetails(ActionSupport):
  def get(self):
    save_design_list = []  
    p = ndb.Key(urlsafe=self.request.get('key')).get()
    seller_dict = {}#Seller.get_key_obj_dict()
    seller_product_list = []#SellerProduct.get_product_by_master_key_for_client(p.key)
    design_list = ReadyDesignTemplate.get_ready_design_list(p.key) #ProductDesign.get_design_list(p.key)
    product_cat_list = ProductCategory.get_list()
    if self.client:
      save_design_list = ClientProductDesign.get_client_design(self.client.key, p.key)
    template = self.get_jinja2_env.get_template('endclient/product_datails.html')    
    self.response.out.write(template.render({'p': p,
                                             'AllowDesignerOffLogin': AllowDesignerOffLogin.get_obj().allow,
                                             'design_list': design_list,
                                             'save_design_list': save_design_list,
                                             'seller_product': SellerProduct.get_default_seller_product(p.key),
                                             'seller_product_list': seller_product_list,
                                             'seller_dict': seller_dict,
                                             'product_cat_list': product_cat_list,
                                             'user_obj': self.client}))

QUANTITY_ERROR='''
'<div style="text-align: center;padding-bottom: 150px; padding-top: 150px;width: 100%;">
  <p>Please choose minimum quantity 1 for place order</p>
  <br>
  <button type="button" onclick="[ONCLICK]"
      class="btn btn-sm btn-primary btn-white btn-round btn-mini">
      <i class="ace-icon fa fa-refresh"></i> Reset Quantity
    </button>
<div>
'''

class OrderStageFirst(ActionSupport):
  def get(self):
    seller = Seller()
    product = SellerProduct()  
    qty = int(self.request.get('qty'))
    if qty < 1:
      HTML= QUANTITY_ERROR.replace('[ONCLICK]', 'backFromOrderStageFirst()')  
      return self.response.out.write(HTML)  
      
    product = ndb.Key(urlsafe=self.request.get('product')).get()
    seller = product.seller.get()
    
    template = self.get_jinja2_env.get_template('endclient/product-buy-stage1.html')    
    self.response.out.write(template.render({'product': product,
                                             'seller': seller,
                                             'qty': qty,
                                             'user_obj': self.client,
                                             }))

class PlaceOrder(ActionSupport):
  def post(self):
    seller = Seller()
    master_product = Product()
    product = SellerProduct()  
    design = ClientProductDesign()
    qty = int(self.request.get('qty'))   
    if qty < 1:
      HTML= QUANTITY_ERROR.replace('[ONCLICK]', 'backToProductAction()')  
      return json_response(self.response, {'html': HTML}, 'ERROR', 'Item quantity missing') 
     
    #client_name = self.request.get('client_name')
    #client_mobile = self.request.get('client_mobile')
    #client_email = self.request.get('client_email')
    #card_number = self.request.get('card_number')
    #name_on_card = self.request.get('name_on_card')
    #cvv_number = self.request.get('cvv_number')
    design_id = self.request.get('design_id')
    cdt=datetime.datetime.now()
    ldt=get_dt_by_country(cdt, 'KE')
    logging.info(ldt)  
    history_list = []  
    product = ndb.Key(urlsafe=self.request.get('product')).get()
    seller = product.seller.get()
    master_product = product.master_product.get()
    if design_id:  
      design = ClientProductDesign.get_by_design_id(design_id)
    
    order = SellerOrder()
    if design and design.product== product.master_product:
      order.design = design.key
    order.date = ldt.date()
    order.qty = qty
    order.amount = qty*product.retail_price
    order.category = product.category
    order.client = self.client.key
    order.client_name = self.client.name
    order.code = product.code
    order.description = product.description
    order.email = self.client.email
    try:
      order.image_url = master_product.image_url[0]
    except:
      pass    
    order.master_price = product.master_price
    order.master_product = product.master_product
    order.master_product_urlsafe = product.master_product_urlsafe
    order.name = product.name
    order.retail_price = product.retail_price
    order.seller = seller.key
    order.seller_email = seller.email
    order.seller_name = seller.name
    order.seller_urlsafe = seller.entityKey
    order.size = product.size
    order.phone = self.client.telephone
    order.uom = product.uom
    order.payed =True
    order.payment_ref = str(uuid1(123456789))
    order.order_number = order.payment_ref.replace('-','').upper()[:10]
    
    order_stage_list = OrderStage.get_order_stage().name
    
    order.status = order_stage_list[0] if order_stage_list else 'Ordered'
    history_list.append({'status': order.status,
                         'qty': qty,
                         'retail_price': product.retail_price,
                         'price': product.master_price,
                         'amount': order.amount,
                         'time': ldt.strftime('%I:%M %p'),
                         'date': ldt.strftime('%d %b%Y'),
                         })
    order.history = json.dumps(history_list) 
    order = order.put().get()
    master_amt = product.master_price*qty
    cr = order.amount - master_amt
    ladger = SellerLadger()
    ladger.balance = cr
    ladger.client = order.client
    ladger.credit =  cr
    #ladger.debit
    ladger.master_price = product.master_price
    ladger.master_product = product.master_product
    ladger.order = order.key
    ladger.order_by = 'CLIENT'
    ladger.order_number = order.order_number
    ladger.payment_ref = order.payment_ref
    ladger.qty = qty
    ladger.retail_price = product.retail_price
    ladger.seller = seller.key
    ladger.seller_email = seller.email
    ladger.seller_name = seller.name
    ladger.put()
        
    data={'order': order,
          'product': product,
          'seller': seller}
    template = self.get_jinja2_env.get_template('endclient/order-success.html') 
    html_str = template.render(data)   
    return json_response(self.response, {'html': html_str}, SUCCESS, 'Order success')

class GetProductDesignor(ActionSupport):
    
  def set_frames(self):  
    self.frame_list = FrameCategory.get_mapping_list(self.p.category_key)
    for e in FrameSubCategory.get_list():
      if e.category in self.sub_frame_dict:
        self.sub_frame_dict[e.category].append(e)
      else:
        self.sub_frame_dict[e.category]=[e] 
        
  def set_designs(self):        
    self.design_list  = DesignCategory.get_mapping_list(self.p.category_key)
    for e in DesignSubCategory.get_list():
      if e.category in self.sub_cat_dict:
        self.sub_cat_dict[e.category].append(e)
      else:
        self.sub_cat_dict[e.category]=[e]  
  
  def set_bg(self):
    self.bg_list = BGCategory.get_mapping_list(self.p.category_key).fetch()
    self.sub_bg_list = BGSubCategory.get_list()
    for e in self.sub_bg_list:
      if e.category in self.sub_bg_dict:  
        self.sub_bg_dict[e.category].append(e)
      else:
        self.sub_bg_dict[e.category]=[e]
           
  def get(self): 
    self.sub_frame_dict = {}
    self.sub_cat_dict = {}
    self.sub_bg_dict = {}
    self.frame_list=[]
    self.design_list=[]
    self.bg_list=[]
    self.sub_bg_list=[]  
    designer_module = [] #['images', 'frames', 'backgrounds', 'text', 'designs']
    redayDesignKey=self.request.get('redayDesign')
    saveDesignKey=self.request.get('saveDesign')
    self.p = ndb.Key(urlsafe=self.request.get('key')).get() 
    if self.p.default_design_template:
      template_path = 'endclient/%s.html' %(self.p.default_design_template)
    else:     
      template_path = 'endclient/product_designor.html'
    template = self.get_jinja2_env.get_template(template_path)    
    patterns = TextPatterns.get_img_url_list()
    canvas = ProductCanvas.get_obj(self.p.key)
    logging.info(canvas)
    if canvas:
      designer_module = canvas.designer_module  
      if 'frames' in designer_module:
        self.set_frames()      
      if 'designs' in designer_module:
        self.set_designs()    
      if 'backgrounds' in designer_module:
        self.set_bg()  
       
    self.response.out.write(template.render({'p': self.p,
                                             'designer_module': designer_module,
                                             'saveDesignKey': saveDesignKey,
                                             'redayDesignKey': redayDesignKey, 
                                             'dev': self.DEV,
                                             'key': self.request.get('key'), 
                                             'user_obj': self.client, 
                                             'canvas': canvas,
                                             'patterns': patterns,
                                             'frame_list': self.frame_list,
                                             'sub_frame_dict': self.sub_frame_dict,
                                             'bg_list': self.bg_list,
                                             'sub_bg_dict': self.sub_bg_dict,
                                             'design_list': self.design_list,
                                             'sub_cat_dict': self.sub_cat_dict}))  
                                
class TestFPD(ActionSupport):
  def get(self):  
    logging.info(self.DEV)
    design_list  = DesignCategory.get_list()
    sub_cat_dict = {}
    e=DesignSubCategory()  
    for e in DesignSubCategory.get_list():
      if e.category in sub_cat_dict:
        sub_cat_dict[e.category].append(e)
      else:
        sub_cat_dict[e.category]=[e]    
    template_path = 'endclient/fpd2.html'
    template = self.get_jinja2_env.get_template(template_path)          
    self.response.out.write(template.render({'dev': self.DEV,
                                             'design_list': design_list,
                                             'sub_cat_dict': sub_cat_dict}))  
    
    
class PhotoBookDesign(ActionSupport):
  def get(self):  
    logging.info(self.DEV)
    design_list  = DesignCategory.get_list()
    sub_cat_dict = {}
    e=DesignSubCategory()  
    for e in DesignSubCategory.get_list():
      if e.category in sub_cat_dict:
        sub_cat_dict[e.category].append(e)
      else:
        sub_cat_dict[e.category]=[e]    
    template_path = 'endclient/photobook.html'
    template = self.get_jinja2_env.get_template(template_path)          
    self.response.out.write(template.render({'dev': self.DEV,
                                             'design_list': design_list,
                                             'sub_cat_dict': sub_cat_dict}))  
        

class GetReadyDesign(ActionSupport):
  def get(self):
    data_dict = {}  
    e = ndb.Key(urlsafe=self.request.get('key')).get() 
    e.json_bucket_key
    try:
      with gcs.open(e.json_bucket_path, 'r') as gcs_file:
        contents = gcs_file.read()
        gcs_file.close()
        data_dict['contents']=contents.decode('utf8')
    except Exception, msg:
      logging.error(msg)        
    
    return json_response(self.response, data_dict, SUCCESS, 'Ready design loaded')

class GetSavedDesign(ActionSupport):
  def get(self):
    data_dict = {}  
    e = ndb.Key(urlsafe=self.request.get('key')).get() 
    e.json_bucket_key
    try:
      with gcs.open(e.json_bucket_path, 'r') as gcs_file:
        contents = gcs_file.read()
        gcs_file.close()
        data_dict['contents']=contents.decode('utf8')
    except Exception, msg:
      logging.error(msg)        
    
    return json_response(self.response, data_dict, SUCCESS, 'Saved design loaded')

class CreateDesign(ActionSupport):
  def get(self): 
    template_path = 'endclient/customDesign.html' #'endclient/fancy_product_designer.html'
    p = ndb.Key(urlsafe=self.request.get('k')).get() 
    design_list = ProductDesign.get_design_list(p.key)
    template = self.get_jinja2_env.get_template(template_path)    
    html_dta={'p': p,
              'design_list': design_list,
              'key': self.request.get('k'), 
              'user_obj': self.client} 
    return self.response.out.write(template.render(html_dta))
    
  def post(self):  
    p = Product()  
    p = ndb.Key(urlsafe=self.request.get('product')).get()                          
    design_print = self.request.get('design_print2')
    layer = self.request.get('layer')
    layer=layer.encode('utf8')
     
    logging.info(layer.__len__())
    
    #layer_json = json.loads(layer)   
    if self.request.get('design_key'):
      design_obj = ndb.Key(urlsafe=self.request.get('design_key')).get()                    
    else:        
      design_obj = ClientProductDesign(client = self.client.key, product_code = p.code, product = p.key).put().get()                    
    bucket_path = '/designer_textptrn/%s/preview/%s/%s' %(p.code, self.client.id, design_obj.id)
    write_urlecoded_png_img(design_print, bucket_path) 
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)  
    design_obj.design_prev_url = serving_url
    design_obj.design_prev_key = bucket_key
    design_obj.design_prev_path = bucket_path
    bucket_path = '/designer_textptrn/%s/json/%s/%s.png' %(p.code, self.client.id, design_obj.id)
    upload_text_file(layer, bucket_path)
    try:
      bucket_key = blobstore.create_gs_key('/gs' + bucket_path)
      serving_url = images.get_serving_url(bucket_key)  
    except Exception, msg:
      logging.error(msg)
    design_obj.json_bucket_key = bucket_key
    design_obj.json_bucket_path = bucket_path
    design_obj.put()  
    data_dict = {'id': design_obj.id, 'design_key': design_obj.entityKey}                        
    return json_response(self.response, data_dict, SUCCESS, 'Product design saved')                        


class GetMyOrders(ActionSupport):
  def get(self):
    order_list=SellerOrder.get_client_filetered(self.client.key)
    data = {'order_list': order_list}
    template = self.get_jinja2_env.get_template('endclient/order-list.html') 
    self.response.out.write(template.render(data))

class MyOrders(ActionSupport):
  def get(self):
    order_list=SellerOrder.get_client_filetered(self.client.key)
    product_cat_list = ProductCategory.get_list()
    data = {'order_list': order_list,
            'product_cat_list': product_cat_list,
            'user_obj': self.client}
    template = self.get_jinja2_env.get_template('endclient/orders.html') 
    self.response.out.write(template.render(data))
    
class GetMyOrderDetails(ActionSupport):
  def get(self):
    order=ndb.Key(urlsafe=self.request.get('k')).get()
    history = json.loads(order.history)
    
    data = {'order': order,
            'seller':order.seller.get(),
            'history': history}
    template = self.get_jinja2_env.get_template('endclient/order_details.html') 
    self.response.out.write(template.render(data))
    
class AboutUs(ActionSupport):
  def get(self):
    product_cat_list = ProductCategory.get_list()
    template = self.get_jinja2_env.get_template('endclient/aboutus.html') 
    self.response.out.write(template.render({'product_cat_list': product_cat_list}))

class ContactUs(ActionSupport):
  def get(self):
    product_cat_list = ProductCategory.get_list()
    template = self.get_jinja2_env.get_template('endclient/contactus.html') 
    self.response.out.write(template.render({'product_cat_list': product_cat_list}))
      
     
     
''' Fetch FPD JSON    
    layer = self.request.get('layer')
    layer_json = json.loads(layer)
    layer_json = layer_json[0]['elements']
    for data in layer_json:
      layr_type=data['type']
      title = data['title']  
      if layr_type =="image" and title in design_img_title:
        continue    
      source = data['source']
      if layr_type =="image":
        layer_list.append('<img src="%s">' %(source))
        layer_ext_list.append('image')   
      else:
        parameters= data['parameters']
        fontSize = parameters['fontSize']
        fontFamily = parameters['fontFamily']
        r= '<font style="font-family: %s;font-size: %spx">%s</font>' %(fontFamily, fontSize, source)
        layer_list.append(r)
        layer_ext_list.append('text')     '''