'''
Created on 10-Feb-2018

@author: sanjay
'''
geoCodes = {
    'IN': [28.662266, 77.212407],
    'KE': [-1.275918, 36.831076],
}
def get_latitude_and_longitude_arr_by_country_code(country):
  latlng = [28.662266, 77.212407]
  if country in geoCodes:
    latlng = geoCodes[country]      
  return latlng  