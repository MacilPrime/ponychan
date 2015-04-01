#!/usr/bin/env python3

import sys
from datetime import date, datetime, timedelta
import json
import re
import os.path
import csv

def statter(log_filename, csv_filename):
    date_stats = make_stats(log_filename)
    write_out(csv_filename, date_stats)

def make_stats(log_filename):
    posts_per_thread = dict()
    with open(log_filename, 'r') as inputf:
        for line in inputf:
            action = json.loads(line)
            if action['thread'] is not None:
                threadid = (action['board'], int(action['thread']))
                if threadid not in posts_per_thread:
                    posts_per_thread[threadid] = 1
                else:
                    posts_per_thread[threadid] += 1

    serial_thread_post_count = 1500
    serial_threads = set()
    for threadid in posts_per_thread:
        if posts_per_thread[threadid] >= serial_thread_post_count:
            serial_threads.add(threadid)
            print(threadid, "is a serial thread")

    date_stats = dict()
    # We only want the stats for full days. So we're ignoring the
    # first and last days in the log.
    first_day = None
    last_day = None

    with open(log_filename, 'r') as inputf:
        for line in inputf:
            action = json.loads(line)
            timestring = re.sub(r':(\d{2}$)', r'\1', action['time'])
            action_time = datetime.strptime(timestring, '%Y-%m-%dT%H:%M:%S%z')
            action_date = action_time.date()
            if first_day is None:
                first_day = action_date
            elif action_date != first_day:
                if action_date not in date_stats:
                    date_stats[action_date] = dict()
                    date_stats[action_date]['posts_board'] = dict()
                    date_stats[action_date]['poster_ips'] = set()
                    date_stats[action_date]['poster_ids'] = set()
                    date_stats[action_date]['nonserial_posts'] = 0
                    last_day = action_date
                if action['action'] == 'post':
                    if isinstance(action['userid'], str):
                        idlen = len(action['userid'])
                        good_id = False
                        if action_date < date(2012, 11, 22):
                            if idlen == 16:
                                good_id = True
                        else:
                            if idlen == 32:
                                good_id = True
                        if good_id:
                            date_stats[action_date]['poster_ids'].add( action['userid'] )
                    date_stats[action_date]['poster_ips'].add( action['ip'] )
                    board = action['board']
                    if board not in date_stats[action_date]['posts_board']:
                        date_stats[action_date]['posts_board'][board] = 1
                    else:
                        date_stats[action_date]['posts_board'][board] += 1
                
                    not_serial = True
                    if action['thread'] is not None:
                        threadid = (action['board'], int(action['thread']))
                        not_serial = threadid not in serial_threads
                    if not_serial:
                        date_stats[action_date]['nonserial_posts'] += 1

    # Ignore the last day
    if last_day is not None:
        del date_stats[last_day]

    for dt in date_stats:
        date_stats[dt]['posts_total'] = 0
        for board in date_stats[dt]['posts_board']:
            date_stats[dt]['posts_total'] += date_stats[dt]['posts_board'][board]
            date_stats[dt]['serial_posts'] = date_stats[dt]['posts_total'] - date_stats[dt]['nonserial_posts']

    return date_stats

def write_out(csv_filename, date_stats):
    all_boards = set()
    
    for dt in date_stats:
        for board in date_stats[dt]['posts_board']:
            all_boards.add(board)
    
    board_list = list(all_boards)
    board_list.sort()
    
    ordered_dates = list(date_stats)
    ordered_dates.sort()
    
    with open(csv_filename, 'w', newline='') as f:
        wr = csv.writer(f)
        header_row = [ 'Date', 'Unique Posters', 'Total Posts', 'Serial Posts', 'Non-Serial Posts' ]
        for board in board_list:
            header_row.append(board)
        wr.writerow(header_row)
        for dt in ordered_dates:
            row = [ dt.isoformat(),
                    len(date_stats[dt]['poster_ips']),
                    date_stats[dt]['posts_total'],
                    date_stats[dt]['serial_posts'],
                    date_stats[dt]['nonserial_posts'] ]
            for board in board_list:
                if board in date_stats[dt]['posts_board']:
                    row.append(date_stats[dt]['posts_board'][board])
                else:
                    row.append(0)
            wr.writerow(row)

if __name__=='__main__':
    log_filename = '/var/log/tinyboard/action.log'
    csv_filename = '/mnt/mlpc/www/stats/poststats.csv'
    
    statter(log_filename, csv_filename)
