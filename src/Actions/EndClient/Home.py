'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.Database import Product, Seller, SellerProduct, SellerOrder
from src.lib.ECBasehandler import ActionSupport
 
import logging 
from uuid import uuid1
from google.appengine.ext import ndb
import json
from src.api.baseapi import json_response, SUCCESS

class Home(ActionSupport):
  def get(self):
    product_list = Product.get_selling_product_list()  
    template = self.get_jinja2_env.get_template('endclient/home.html')    
    self.response.out.write(template.render({'product_list': product_list}))
    
    
class GetProductDetails(ActionSupport):
  def get(self):
    p = ndb.Key(urlsafe=self.request.get('key')).get()
    seller_dict = Seller.get_key_obj_dict()
    seller_product_list = SellerProduct.get_product_by_master_key_for_client(p.key)
    
    template = self.get_jinja2_env.get_template('endclient/product_datails.html')    
    self.response.out.write(template.render({'p': p,
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
                                             'qty': qty
                                             }))

class PlaceOrder(ActionSupport):
  def post(self):
    seller = Seller()
    master_product = Product()
    product = SellerProduct()  
    qty = int(self.request.get('qty'))   
    if qty < 1:
      HTML= QUANTITY_ERROR.replace('[ONCLICK]', 'backFromOrderStageFirst()')  
      return json_response(self.response, {'html': HTML}, 'ERROR', 'Item quantity missing') 
     
    client_name = self.request.get('client_name')
    client_mobile = self.request.get('client_mobile')
    client_email = self.request.get('client_email')
    card_number = self.request.get('card_number')
    name_on_card = self.request.get('name_on_card')
    cvv_number = self.request.get('cvv_number')
    history_list = []  
    product = ndb.Key(urlsafe=self.request.get('product')).get()
    seller = product.seller.get()  
    order = SellerOrder()
    order.amount = qty*product.retail_price
    order.category = product.category
    order.client_name = client_name
    order.code = product.code
    order.description = product.description
    order.email = client_email
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
    order.status = 'CREATED'
    order.phone = client_mobile
    order.uom = product.uom
    order.payed =True
    order.payment_ref = str(uuid1(123456789))
    order.order_number = order.payment_ref.replace('-','').upper()[:10]
    history_list.append({'qty': qty,
                         'retail_price': product.retail_price,
                         'price': product.master_price,
                         'amount': order.amount
                         })
    order.history = json.dumps(history_list) 
    order.put()
    
    
    data={'order': order,
          'product': product,
          'seller': seller}
    template = self.get_jinja2_env.get_template('endclient/order-success.html') 
    html_str = template.render(data)   
    return json_response(self.response, {'html': html_str}, SUCCESS, 'Payment success')
                            
                            
                            
                            