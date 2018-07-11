'''
Created on 09-Jul-2018

@author: Sanjay Saini
'''
import datetime
#import calendar
#from datetime import date
#import time
from pytz.gae import pytz

def get_dt_by_country(datetime, country_code):
  tz = pytz.country_timezones[country_code][0]
  local_tz = pytz.timezone(tz)
  utc = pytz.utc
  utc_date = utc.localize(datetime)
  local_dt = utc_date.astimezone(local_tz)
  return local_dt;