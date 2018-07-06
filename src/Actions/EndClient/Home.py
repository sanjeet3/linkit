'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''
from src.lib.ECBasehandler import ActionSupport
 
import logging 

class Home(ActionSupport):
  def get(self):
    template = self.get_jinja2_env.get_template('endclient/home.html')    
    self.response.out.write(template.render({}))      