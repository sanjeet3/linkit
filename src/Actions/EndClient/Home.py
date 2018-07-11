'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''

from src.Database import Product
from src.lib.ECBasehandler import ActionSupport
 
import logging 

class Home(ActionSupport):
  def get(self):
    product_list = Product.get_selling_product_list()  
    template = self.get_jinja2_env.get_template('endclient/home.html')    
    self.response.out.write(template.render({'product_list': product_list}))      