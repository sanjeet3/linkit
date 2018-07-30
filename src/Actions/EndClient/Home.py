'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.Database import Product, Seller, SellerProduct, SellerOrder
from src.Database import Client, ClientProductDesign, ProductDesign
from src.Database import OrderStage
from src.lib.ECBasehandler import ActionSupport
 
import logging, time 
from uuid import uuid1
import json
from src.api.baseapi import json_response, SUCCESS, ERROR
from src.api.datetimeapi import get_dt_by_country
import datetime

from google.appengine.api import taskqueue
from google.appengine.ext import ndb
from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError
from src.app_configration import config

design_img_title = config.get('design_img_title')

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
                            'key': e.key.urlsafe()})
    except Exception, msg:
      logging.error(msg)
      
        
    data_dict['email']=email    
    return json_response(self.response, data_dict, SUCCESS, '%s account created' %(email))
    
class Login(ActionSupport): 
  def get(self):
    template = self.get_jinja2_env.get_template('endclient/loginerror.html')    
    self.response.out.write(template.render({'msg': 'Kindly fill login details'}))    
      
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
    product_list = Product.get_selling_product_list()  
    template = self.get_jinja2_env.get_template('endclient/home.html')    
    self.response.out.write(template.render({'product_list': product_list,
                                             'user_obj': self.client}))

class ProductView(ActionSupport):
  def get(self):    
    p = ndb.Key(urlsafe=self.request.get('key')).get()
    seller_dict = Seller.get_key_obj_dict()
    seller_product_list = SellerProduct.get_product_by_master_key_for_client(p.key)
    template = self.get_jinja2_env.get_template('endclient/product_view.html')    
    self.response.out.write(template.render({'seller_dict': seller_dict,
                                             'seller_product_list': seller_product_list,
                                             'p': p,
                                             'user_obj': self.client}))
    
class GetProductDetails(ActionSupport):
  def get(self):
    p = ndb.Key(urlsafe=self.request.get('key')).get()
    seller_dict = Seller.get_key_obj_dict()
    seller_product_list = SellerProduct.get_product_by_master_key_for_client(p.key)
    design_list = ProductDesign.get_design_list(p.key)
    template = self.get_jinja2_env.get_template('endclient/product_datails.html')    
    self.response.out.write(template.render({'p': p,
                                             'design_list': design_list,
                                             'seller_product_list': seller_product_list,
                                             'seller_dict': seller_dict}))

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
      HTML= QUANTITY_ERROR.replace('[ONCLICK]', 'backFromOrderStageFirst()')  
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
    order.put()
    
    
    data={'order': order,
          'product': product,
          'seller': seller}
    template = self.get_jinja2_env.get_template('endclient/order-success.html') 
    html_str = template.render(data)   
    return json_response(self.response, {'html': html_str}, SUCCESS, 'Payment success')
                            

class CreateDesign(ActionSupport):
  def get(self): 
    template_path = 'endclient/customDesign.html' #'endclient/fancy_product_designer.html'
    p = ndb.Key(urlsafe=self.request.get('k')).get() 
    design_list = ProductDesign.get_design_list(p.key)
    template = self.get_jinja2_env.get_template(template_path)    
    self.response.out.write(template.render({'p': p,
                                             'design_list': design_list,
                                             'key': self.request.get('k'), 
                                             'user_obj': self.client}))  
    
    
  def post(self): 
    layer_list = []
    layer_ext_list = []  
    p = Product()  
    p = ndb.Key(urlsafe=self.request.get('product')).get()                          
    design_print = self.request.get('design_print')
    layer = self.request.get('layer')
    layer_json = json.loads(layer)
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
        layer_ext_list.append('text')
        
      logging.info(data['type'])  
        
    design_obj = ClientProductDesign()                    
    design_obj.client = self.client.key
    design_obj.product_code = p.code
    design_obj.product = p.key
    design_obj.design_prev = design_print
    design_obj.layer_ext_list =layer_ext_list
    design_obj.layer_list = layer_list
    design_obj = design_obj.put().get()
    design_obj.design_id = str(design_obj.id)
    design_obj.put()
    
    data_dict = {'id': design_obj.id}                        
    return json_response(self.response, data_dict, SUCCESS, 'Product design saved')                        