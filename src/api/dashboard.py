'''
Created on 15-Jul-2018

@author: Sanjay Saini
'''



from src.Database import SellerOrder

class OrderDataProvider:
  def __init__(self, from_date, to_date, seller_key_list):
    self.seller_key_list = seller_key_list
    self.from_date = from_date    
    self.to_date = to_date  
    self.today_order_count = 0
    self.today_order_amount = 0.0
    
    
  def fetch_order_list(self):
    order_query = SellerOrder.get_order_filetered(self.from_date, self.to_date, self.seller_key_list)
    self.today_order_count = order_query.count()  
    
  def prepaire_super_admin_data(self):  
    self.fetch_order_list()  