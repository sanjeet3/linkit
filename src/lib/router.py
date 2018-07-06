'''
Created on 06-Apr-2017

@author: sanjay
'''
from src.Actions.EndClient import Home
from src.Actions.Super import SuperAdmin

from webapp2_extras.routes import RedirectRoute

__route_list = [
    RedirectRoute(r'/', Home.Home, name='Home page', strict_slash=True), 
    #Super Admin handlers Frenchise
    RedirectRoute(r'/superadmin', SuperAdmin.Home, name='SuperAdmin Home page', strict_slash=True),
    RedirectRoute(r'/superadmin/Frenchise', SuperAdmin.Frenchise, name='SuperAdmin Frenchise page', strict_slash=True),
    RedirectRoute(r'/superadmin/Products', SuperAdmin.Products, name='SuperAdmin Products page', strict_slash=True),
    RedirectRoute(r'/superadmin/SaveProduct', SuperAdmin.SaveProducts, name='SuperAdmin save Products action', strict_slash=True),
    RedirectRoute(r'/superadmin/CreateFrenchise', SuperAdmin.SaveFrenchise, name='SuperAdmin create frenchise action', strict_slash=True),
                 
    ]

def get_routes():
  return __route_list

def add_routes(app):
  if app.debug:
    secure_scheme = 'http'
  for __route in __route_list:
    app.router.add(__route)