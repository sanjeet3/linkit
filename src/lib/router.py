'''
Created on 06-Apr-2017

@author: sanjay
'''
from src.Actions.EndClient import Home
from src.Actions.Super import SuperAdmin
from src.Actions.Super import DesignerSetup
from src.Actions.franchisor import franchisor

from webapp2_extras.routes import RedirectRoute

__route_list = [
    RedirectRoute(r'/', Home.Home, name='Home page', strict_slash=True),
    RedirectRoute(r'/TermsAndConditions', Home.TermsAndConditions, name='TermsAndConditions page', strict_slash=True),
    RedirectRoute(r'/PrivacyPolicy', Home.PrivacyPolicy, name='PrivacyPolicy page', strict_slash=True),
    RedirectRoute(r'/ContactUs', Home.ContactUs, name='ContactUs page', strict_slash=True),
    RedirectRoute(r'/ActivateAccount', Home.ActivateAccount, name='ActivateAccount page', strict_slash=True),
    RedirectRoute(r'/Register', Home.Register, name='Register page', strict_slash=True),
    RedirectRoute(r'/Login', Home.Login, name='Login page', strict_slash=True),
    RedirectRoute(r'/Logout', Home.Logout, name='Logout page', strict_slash=True),
    RedirectRoute(r'/Orders', Home.MyOrders, name='My orders page', strict_slash=True),
    RedirectRoute(r'/CreateDesign', Home.CreateDesign, name='Create Product Design', strict_slash=True),
    RedirectRoute(r'/GetSavedDesingJson', Home.GetSavedDesign, name='Create Product Saved Design Json', strict_slash=True),
    RedirectRoute(r'/GetReadyDesingJson', Home.GetReadyDesign, name='Get Product Ready Design Json', strict_slash=True),
    RedirectRoute(r'/GetProductDesignor', Home.GetProductDesignor, name='Get Product Designor page', strict_slash=True),
    RedirectRoute(r'/GetProductDetails', Home.GetProductDetails, name='Get product details page', strict_slash=True),
    RedirectRoute(r'/Product', Home.ProductView, name='View product page', strict_slash=True),
    RedirectRoute(r'/SearchEvent', Home.GetEventView, name='GetEventView', strict_slash=True),
    RedirectRoute(r'/FPD', Home.TestFPD, name='Test FPD', strict_slash=True),
    RedirectRoute(r'/PhotoBookDesign', Home.PhotoBookDesign, name='Test FPD', strict_slash=True),
    RedirectRoute(r'/OrderStageFirst', Home.OrderStageFirst, name='Order stage 1', strict_slash=True),
    RedirectRoute(r'/PlaceOrder', Home.PlaceOrder, name='Place Order', strict_slash=True),
    RedirectRoute(r'/GetMyOrders', Home.GetMyOrders, name='Place Order', strict_slash=True),
    RedirectRoute(r'/GetMyOrderDetails', Home.GetMyOrderDetails, name='Get My Order Details', strict_slash=True),
    RedirectRoute(r'/Imgage', Home.Imgage, name='Read svg image only ', strict_slash=True),
    RedirectRoute(r'/DownloadFile', Home.DownloadFile, name='DownloadFile', strict_slash=True),
    
    RedirectRoute(r'/DeleteBucketFile', DesignerSetup.DeleteBucketFile, name='DeleteBucketFile', strict_slash=True),
     
    #Super Admin handlers Frenchise
    RedirectRoute(r'/superadmin', SuperAdmin.Home, name='SuperAdmin Home page', strict_slash=True),
    RedirectRoute(r'/superadmin/test', SuperAdmin.Test, name='SuperAdmin Test', strict_slash=True),
    RedirectRoute(r'/superadmin/UserAccount', SuperAdmin.UserAccount, name='SuperAdmin UserAccount', strict_slash=True),
    RedirectRoute(r'/superadmin/ManageUserStatus', SuperAdmin.ManageUserStatus, name='SuperAdmin UserAccount', strict_slash=True),
    RedirectRoute(r'/superadmin/UpdateRoleSettings', SuperAdmin.UpdateRoleSettings, name='SuperAdmin UserAccount', strict_slash=True),
    RedirectRoute(r'/superadmin/GetRoleSettings', SuperAdmin.GetRoleSettings, name='SuperAdmin UserAccount', strict_slash=True),
    
    #Designer Setup
    RedirectRoute(r'/DesinerDemo', DesignerSetup.DesinerDemo, name='SuperAdmin Designer Demo page', strict_slash=True),
    RedirectRoute(r'/superadmin/ReadyDesingSetup', DesignerSetup.ReadyDesingSetup, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/DesignerSetup', DesignerSetup.Home, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/CatSubCatRename', DesignerSetup.CatSubCatRename, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/DesignerModuleSetup', DesignerSetup.DesignerModuleSetup, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/DesignerLoginAccess', DesignerSetup.DesignerLoginAccess, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/GetDesignerImgaes', DesignerSetup.GetDesignerImgaes, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/ProductLiveSetting', DesignerSetup.ProductLiveSetting, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/GetProductLiveSetting', DesignerSetup.GetProductLiveSetting, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/GetProductLiveInfo', DesignerSetup.GetProductLiveInfo, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/Backgrounds', DesignerSetup.Backgrounds, name='SuperAdmin DesignerSetup page', strict_slash=True),
    RedirectRoute(r'/superadmin/BGCategorySave', DesignerSetup.BGCategorySave, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/BGSubCategorySave', DesignerSetup.BGSubCategorySave, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/FramesView', DesignerSetup.FramesView, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/FrameCategorySave', DesignerSetup.FrameCategorySave, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/FrameSubCategorySave', DesignerSetup.FrameSubCategorySave, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadFrameImage', DesignerSetup.UploadFrameImage, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadBGImage', DesignerSetup.UploadBGImage, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadPattern', DesignerSetup.UploadTextPattern, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadMasks', DesignerSetup.UploadMasks, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/ProductCanvasSetup', DesignerSetup.ProductCanvasSetup, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/GetProductCanvasPrev', DesignerSetup.GetProductCanvasPrev, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadProductCanvas', DesignerSetup.UploadProductCanvas, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/ChangeCanvasMargin', DesignerSetup.ChangeCanvasMargin, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/ChangePreviewMargin', DesignerSetup.ChangePreviewMargin, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadProductPreview', DesignerSetup.UploadProductPreview, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/MappingCustomDesign', DesignerSetup.MappingCustomDesign, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/GetMappingCustomDesign', DesignerSetup.GetMappingCustomDesign, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/MappingBackground', DesignerSetup.MappingBackground, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/GetMappingBackground', DesignerSetup.GetMappingBackground, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/MappingFrame', DesignerSetup.MappingFrame, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/GetMappingFrame', DesignerSetup.GetMappingFrame, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/DeleteCategory', DesignerSetup.DeleteCategory, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/DeleteSUBCategory', DesignerSetup.DeleteSUBCategory, name='SuperAdmin', strict_slash=True),
    RedirectRoute(r'/superadmin/DeleteProductCategoryUOM', DesignerSetup.DeleteProductCategoryUOM, name='SuperAdmin', strict_slash=True),
    
    #Super Admin Seller
    RedirectRoute(r'/superadmin/Seller', SuperAdmin.Frenchise, name='SuperAdmin Frenchise page', strict_slash=True),
    RedirectRoute(r'/superadmin/CreateSeller', SuperAdmin.SaveFrenchise, name='SuperAdmin create frenchise action', strict_slash=True),
   
    #Super Admin Product
    RedirectRoute(r'/superadmin/MailTemplates', SuperAdmin.MailTemplates, name='SuperAdmin themes page', strict_slash=True),
    RedirectRoute(r'/superadmin/GetMailTemplates', SuperAdmin.GetMailTemplates, name='SuperAdmin themes page', strict_slash=True),
    RedirectRoute(r'/superadmin/Themes', SuperAdmin.ThemesView, name='SuperAdmin themes page', strict_slash=True),
    RedirectRoute(r'/superadmin/SetupThemesLive', SuperAdmin.SetupThemesLive, name='SuperAdmin themes page', strict_slash=True),
    RedirectRoute(r'/superadmin/ManageStripImg', SuperAdmin.ManageStripImg, name='SuperAdmin themes page', strict_slash=True),
    RedirectRoute(r'/superadmin/Events', SuperAdmin.EventView, name='SuperAdmin EventView page', strict_slash=True),
    RedirectRoute(r'/superadmin/EventSequenceSet', SuperAdmin.EventSequenceSet, name='SuperAdmin Event client view setup', strict_slash=True),
    RedirectRoute(r'/superadmin/Products', SuperAdmin.Products, name='SuperAdmin Products page', strict_slash=True),
    RedirectRoute(r'/superadmin/SearchProducts', SuperAdmin.SearchProducts, name='SuperAdmin Products page', strict_slash=True),
    RedirectRoute(r'/superadmin/GetEventList', SuperAdmin.GetEventList, name='SuperAdmin event list', strict_slash=True),
    RedirectRoute(r'/superadmin/GetProductPics', SuperAdmin.GetProductPics, name='SuperAdmin Products page', strict_slash=True),
    RedirectRoute(r'/superadmin/DeleteProductIMG', SuperAdmin.DeleteProductIMG, name='SuperAdmin Products page', strict_slash=True),
    RedirectRoute(r'/superadmin/ProductTutorialObj', SuperAdmin.ProductTutorialObj, name='SuperAdmin Products TutorialObj', strict_slash=True),
    RedirectRoute(r'/superadmin/UpdateDesignSize', SuperAdmin.UpdateDesignSize, name='SuperAdmin UpdateDesignSize', strict_slash=True),
    RedirectRoute(r'/superadmin/DeleteDesign', SuperAdmin.DeleteDesign, name='SuperAdmin DeleteDesign', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadProductPicture', SuperAdmin.UploadProductPicture, name='SuperAdmin Upload Product Picture', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadProductDesign', SuperAdmin.UploadProductDesign, name='SuperAdmin Upload Product Design', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadProductBG', SuperAdmin.UploadProductBG, name='SuperAdmin Upload Product BG', strict_slash=True),
    RedirectRoute(r'/superadmin/DeleteProductBG', SuperAdmin.DeleteProductBG, name='SuperAdmin delete Product BG', strict_slash=True),
    RedirectRoute(r'/superadmin/SaveProductCategory', SuperAdmin.SaveProductsCategory, name='SuperAdmin SaveProductCategory', strict_slash=True),
    RedirectRoute(r'/superadmin/SaveProductUOM', SuperAdmin.SaveProductsUOM, name='SuperAdmin SaveProductUOM', strict_slash=True),
    RedirectRoute(r'/superadmin/SaveProduct', SuperAdmin.SaveProducts, name='SuperAdmin save Products action', strict_slash=True),
    RedirectRoute(r'/superadmin/EditProducts', SuperAdmin.EditProducts, name='SuperAdmin Edit Products action', strict_slash=True),
    RedirectRoute(r'/superadmin/EditProductsCATUOM', SuperAdmin.EditProductsCATUOM, name='SuperAdmin Edit Products action', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadTest', SuperAdmin.UploadTest, name='SuperAdmin UploadTest', strict_slash=True),
    #Super Admin order
    RedirectRoute(r'/superadmin/Order', SuperAdmin.Order, name='SuperAdmin Order view', strict_slash=True),
    RedirectRoute(r'/superadmin/GerOrderDetails', SuperAdmin.GerOrderDetails, name='SuperAdmin Order view', strict_slash=True),
    RedirectRoute(r'/superadmin/GerOrderProductPrint', SuperAdmin.GerOrderProductPrint, name='SuperAdmin GerOrderProductPrint', strict_slash=True),
    RedirectRoute(r'/superadmin/EditOrderStage', SuperAdmin.EditOrderStage, name='SuperAdmin EditOrderStage', strict_slash=True),
    RedirectRoute(r'/superadmin/OrderStage', SuperAdmin.OrderStageView, name='SuperAdmin Order Stage view', strict_slash=True),
    RedirectRoute(r'/superadmin/OrderStageUpdate', SuperAdmin.OrderStageUpdated, name='SuperAdmin Order Stage view', strict_slash=True),
    RedirectRoute(r'/superadmin/RenameOrderStatus', SuperAdmin.RenameOrderStatus, name='SuperAdmin Order Stage view', strict_slash=True),
    RedirectRoute(r'/superadmin/OrderSearch', SuperAdmin.OrderSearch, name='SuperAdmin Order view', strict_slash=True),
    RedirectRoute(r'/superadmin/AssignProductToSeller', SuperAdmin.AssignProductToSeller, name='SuperAdmin AssignProductToSeller', strict_slash=True),
    RedirectRoute(r'/superadmin/GetSellerProduct', SuperAdmin.GetSellerProduct, name='SuperAdmin get Product of Seller', strict_slash=True),
    RedirectRoute(r'/superadmin/Ledger', SuperAdmin.Ledger, name='SuperAdmin get Ledger of Seller', strict_slash=True),
    
    #Custom Designs
    RedirectRoute(r'/superadmin/CustomDesign', SuperAdmin.CustomDesign, name='SuperAdmin Custom designs', strict_slash=True),
    RedirectRoute(r'/superadmin/DesignCategorySave', SuperAdmin.DesignCategorySave, name='SuperAdmin Custom designs', strict_slash=True),
    RedirectRoute(r'/superadmin/DesignSubCategorySave', SuperAdmin.DesignSubCategorySave, name='SuperAdmin Custom designs', strict_slash=True),
    RedirectRoute(r'/superadmin/UploadDesignImage', SuperAdmin.UploadDesignImage, name='SuperAdmin Custom designs', strict_slash=True),
    
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