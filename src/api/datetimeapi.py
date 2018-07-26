'''
Created on 09-Jul-2018

@author: Sanjay Saini
'''
import datetime
from datetime import date
#import calendar
#from datetime import date
#import time
from pytz.gae import pytz

DATE_STRING_FORMAT0 = '%d-%m-%Y'
DATE_STRING_FORMAT1 = '%Y-%m-%d'
TIME_STRING_FORMAT0 = '%H:%M'
TIME_STRING_FORMAT1 = '%H:%M:%S'

def get_first_day_of_month(dt, d_years=0, d_months=0): 
    y, m = dt.year + d_years, dt.month + d_months
    a, m = divmod(m-1, 12)
    return date(y+a, m+1, 1)

def get_date_from_str(value):
  try:
    return datetime.datetime.strptime(value, DATE_STRING_FORMAT0).date()
  except ValueError:
    pass
  try:
    return datetime.datetime.strptime(value, DATE_STRING_FORMAT1).date()
  except ValueError:
    pass
  return None

def get_time_from_str(value):
  try:
    return datetime.datetime.strptime(value, TIME_STRING_FORMAT0).time()
  except ValueError:
    pass
  try:
    return datetime.datetime.strptime(value, TIME_STRING_FORMAT1).time()
  except ValueError:
    pass
  return None

def get_dt_by_country(datetime, country_code):
  tz = pytz.country_timezones[country_code][0]
  local_tz = pytz.timezone(tz)
  utc = pytz.utc
  utc_date = utc.localize(datetime)
  local_dt = utc_date.astimezone(local_tz)
  return local_dt;