'''
Created on 12-Sep-2018

@author: Sanjay Saini
'''

from src.Database import UserModel
from src.lib.SABasehandler import ActionSupport

class Home(ActionSupport):
  def get(self):
    context = {}  
    template = self.get_jinja2_env.get_template('super/designer_setup.html')    
    self.response.out.write(template.render(context))   
      