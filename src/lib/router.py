'''
Created on 06-Apr-2017

@author: sanjay
'''
from src.Actions.EndClient import Home
from src.Actions.Super import SuperAdmin
from src.Actions.franchisor import franchisor

from webapp2_extras.routes import RedirectRoute

__route_list = [
    RedirectRoute(r'/', Home.Home, name='Home page', strict_slash=True),
    RedirectRoute(r'/CreateDesign', Home.CreateDesign, name='Create Product Design page', strict_slash=True),
    RedirectRoute(r'/GetProductDetails', Home.GetProductDetails, name='Get product details page', strict_slash=True),
    RedirectRoute(r'/OrderStageFirst', Home.OrderStageFirst, name='Order stage 1', strict_slash=True),
    RedirectRoute(r'/PlaceOrder', Home.PlaceOrder, name='Place Order', strict_slash=True),
     
    #Super Admin handlers Frenchise
    RedirectRoute(r'/superadmin', SuperAdmin.Home, name='SuperAdmin Home page', strict_slash=True),
    RedirectRoute(r'/superadmin/Seller', SuperAdmin.Frenchise, name='SuperAdmin Frenchise page', strict_slash=True),
    RedirectRoute(r'/superadmin/Products', SuperAdmin.Products, name='SuperAdmin Products page', strict_slash=True),
    RedirectRoute(r'/superadmin/GetProductPics', SuperAdmin.GetProductPics, name='SuperAdmin Products page', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadProductPicture', SuperAdmin.UploadProductPicture, name='SuperAdmin Upload Product Picture', strict_slash=True),
    RedirectRoute(r'/superadmin/SaveProductCategory', SuperAdmin.SaveProductsCategory, name='SuperAdmin SaveProductCategory', strict_slash=True),
    RedirectRoute(r'/superadmin/SaveProductUOM', SuperAdmin.SaveProductsUOM, name='SuperAdmin SaveProductUOM', strict_slash=True),
    RedirectRoute(r'/superadmin/SaveProduct', SuperAdmin.SaveProducts, name='SuperAdmin save Products action', strict_slash=True),
    RedirectRoute(r'/superadmin/CreateSeller', SuperAdmin.SaveFrenchise, name='SuperAdmin create frenchise action', strict_slash=True),
    RedirectRoute(r'/superadmin/Order', SuperAdmin.Order, name='SuperAdmin Order view', strict_slash=True),
    RedirectRoute(r'/superadmin/OrderSearch', SuperAdmin.OrderSearch, name='SuperAdmin Order view', strict_slash=True),
    RedirectRoute(r'/superadmin/AssignProductToSeller', SuperAdmin.AssignProductToSeller, name='SuperAdmin AssignProductToSeller', strict_slash=True),
    RedirectRoute(r'/superadmin/GetSellerProduct', SuperAdmin.GetSellerProduct, name='SuperAdmin get Product of Seller', strict_slash=True),
    #franchisor
    RedirectRoute(r'/Seller', franchisor.Home, name='Seller home page', strict_slash=True),
    RedirectRoute(r'/Seller/Products', franchisor.Product, name='Seller Products page', strict_slash=True),
    RedirectRoute(r'/Seller/EditProductRetailPrice', franchisor.ProductRetailPriceEdit, name='Seller ProductRetailPriceEdit', strict_slash=True),
    RedirectRoute(r'/Seller/Order', franchisor.Order, name='Seller order', strict_slash=True),
    RedirectRoute(r'/Seller/OrderSearch', franchisor.OrderSearch, name='Seller order', strict_slash=True),
    
                 
    ]

def get_routes():
  return __route_list

def add_routes(app):
  if app.debug:
    secure_scheme = 'http'
  for __route in __route_list:
    app.router.add(__route)