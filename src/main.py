'''
Created on 04-Jul-2018

@author: Sanjay Saini
'''
import os
import sys

# before importing webapp2 3rd=party libraries path must be fixed 
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib/external'))

from src import app_configration
from src import app_configration as cofig
#from src.errorConstant import ERROR_401
from src.lib import router

import webapp2 
from google.appengine.api import users


webapp2_config = app_configration.config
webapp2_config.update(cofig.config)

 
def handle_401(request, response, exception): 
  response.write('<b>Access denied</b>')
  response.set_status(401)   
  
app = webapp2.WSGIApplication(router.get_routes(), debug=True,
                              config = webapp2_config)  

app.error_handlers[401] = handle_401