'''
Created on 06-Apr-2017

@author: sanjay
'''

from src.app_configration import config
from src.business_logic.businessApi import getOrganizationObject
from src.business_logic.businessApi import get_64bit_binary_string_from_int
from src.datastore.ndbmodels import User
from src.datastore.ndbmodels import Role

import os
import logging
import webapp2
import jinja2

from google.appengine.api import users
from google.appengine.api import namespace_manager
import json

ALL_PERMISSION_BIN = '1111111111111111111111111111111111111111111111111111111111111111'

class ActionSupport(webapp2.RequestHandler):
  '''
     Action support for all requests in app
  '''
  
  def __init__(self, request, response):
    
    self.initialize(request, response)
    self.SUCCESS = 'SUCCESS'
    self.ERROR = 'ERROR'
    self.org = getOrganizationObject()
    if self.org is None:   
      self.raise_unauthorize_exception(request)  
    if self.org.package[0].count == 0:
      self.raise_unauthorize_exception(request)    
    self.login_user = self.get_loging_user_account()
    if self.login_user == None or self.login_user.role is '':
      self.raise_unauthorize_exception(request)
    
    if self.login_user.role == 'ADMIN':
      self.permission = ALL_PERMISSION_BIN
    else:  
      try:
        permission = Role.get_role_by_name(self.login_user.role).permission
      except Exception, e:
        logging.debug(e)  
        permission = 0
          
      self.permission = get_64bit_binary_string_from_int(permission)
      if self.permission[-1] == '0':
        self.raise_unauthorize_exception(request)
        
  def dispatch(self):
    webapp2.RequestHandler.dispatch(self) 
    
  @webapp2.cached_property
  def get_jinja2_env(self): 
    environment = jinja2.Environment(loader = jinja2.FileSystemLoader(os.path.join(
        os.path.dirname(__file__), '..')), extensions=['jinja2.ext.do',],
        autoescape=True)
    environment.filters['datetimeformat'] = datetimeformat
    environment.filters['dateformat'] = dateformat
    environment.filters['dayformat'] = dayformat
    environment.filters['timeformat'] = timeformat
    environment.filters['format_currency'] = format_currency
    return environment
    
  @webapp2.cached_property
  def get_default_values_for_template(self):
    super_admin_list = config.get('super_admin')
    return {'org': self.org,
            'country': self.org.country,
            'currency': self.org.currency,
            'super_admin_list': super_admin_list, 
            'login_user': self.login_user,
            'logout_url': users.create_logout_url('/'),
            'path': self.request.path,
            'namespace':namespace_manager.get_namespace(),
            'permission': self.permission,
            'right_menu': 'html/mt_right_menu_default.html'
           }  
    
  def get_loging_user_account(self):  
    ''' '''
    user = users.get_current_user()
    if user:
      user = User.get_active_user_by_email(user.email())
    return user
    
  def raise_unauthorize_exception(self, request):
    ''' In-case un-authorised user tried to access the 
    application then 401 Exception to be raise.
    '''
    self.abort(401)  

  def raise_invalide_domain_exception(self, request):
    ''' In-case un-authorised user tried to access the 
    application then 500 Exception to be raise.
    '''
    self.abort(500)  
    
    
  def post_response(self, response, response_type, message, response_text=None):  
    ''' Response json string '''
    
    response.content_type = 'application/json'
    data = {'responseType' : response_type,
            'message': json.dumps(message),
            'responseText': response_text}
    
    response.out.write(json.dumps(data))
    
def datetimeformat(value, format='%d %b %Y %H:%M:%S'):
  return value.strftime(format) if value else 'NA'

def dateformat(value, format='%d %b, %Y'):
  return value.strftime(format) if value else 'NA'

def dayformat(value, format='%a'):
  return value.strftime(format) if value else 'NA'   

def timeformat(value, format='%I:%M %p'):
  return value.strftime(format) if value else 'NA'
  
def format_currency(value):  
  return "{:,.2f}".format(value) if value else 'NA'   