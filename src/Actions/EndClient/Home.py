'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.Database import Product, Seller, SellerProduct
from src.lib.ECBasehandler import ActionSupport
 
import logging 

from google.appengine.ext import ndb

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

    