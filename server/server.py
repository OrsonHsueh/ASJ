#!/usr/bin/env python
import os
import sys
import logging
import types
import time
from errno import *

import tornado
import tornado.wsgi
from tornado.websocket import WebSocketHandler
import json
import sys

GAME_MODE_TIME = 0
GAME_MODE_SPEED = 1

N_PLAYER = 1
WAY_LENGTH = 100
GAME_MODE = GAME_MODE_TIME
logger = logging.getLogger()

GameServer = None

class RaceGame(WebSocketHandler):
  
  def check_origin(self, org):
    return True

  def open(self):
    logger.info('someone logged in')

  def on_close(self):
    GameServer.close(self)

  def on_message(self, msg):
    try:
      cmd = json.loads(msg)
    except:
      logger.info("wrong cmd: %s" % msg)
      self.close()
    GameServer.msg(self, cmd)
    pass


#TODO more than N_PLAYER connect...
class GameServer(object):

  def __init__(self):
    self.clients = []
    self.reset()

  def reset(self):
    logger.info('reset')
    for c in self.clients:
      c.close()
    self.others = []
    self.clients = []
    self.ready = []
    self.over = []
    self.startTime = 0

  def close(self, client):
    if client in self.clients:
      self.clients.remove(client)
    if client in self.others:
      self.others.remove(client)
    if client in self.ready: # The game have started....
      logger.info('someone closed connection during the game')
      self.reset()

  def msg(self, client, msg):
    logger.info("msg: %s", json.dumps(msg))
    if msg['act'] == 'login':
      client.name = msg['name']
      client.car = msg['car']
      client.pos = 0
      if len(self.clients) >= N_PLAYER:
        self.others.append(client)
        client.write_message(json.dumps({'act': 'lane', 'lane':-1}))
        openInfo = [{'name': c.name, 'car': c.car} for c in self.clients]
        client.write_message(json.dumps({'act':'open', 'info': openInfo}))
        return
      if client not in self.clients:
        self.clients.append(client)
      client.write_message(json.dumps({'act': 'lane', 'lane': self.clients.index(client)}))
      if len(self.clients) == N_PLAYER:
        logger.info('open the game')
        openInfo = [{'name': c.name, 'car': c.car} for c in self.clients]
        for c in self.clients:
          c.write_message(json.dumps({'act':'open', 'info': openInfo}))
        for c in self.others:
          c.write_message(json.dumps({'act':'open', 'info': openInfo}))
    elif client in self.clients:
      self.msg2(client, msg)
    else:
      logger.info('MSG from client not in client list.')

  def msg2(self, client, msg):
    if msg['act'] == 'ready':
      if client not in self.ready:
        self.ready.append(client)
      if len(self.ready) == N_PLAYER:
        self.startTime = time.time()
        logger.info('go')
        for c in self.clients:
          c.write_message(json.dumps({'act':'go'}))
        for c in self.others:
          c.write_message(json.dumps({'act':'go'}))
    elif msg['act'] == 'pos':
      client.pos += msg['pos']
      for c in self.clients:
        c.write_message(json.dumps({'act':'pos', 'lane':self.clients.index(client), 'pos': client.pos}))
      for c in self.others:
        c.write_message(json.dumps({'act':'pos', 'lane':self.clients.index(client), 'pos': client.pos}))
      if GAME_MODE == GAME_MODE_SPEED:
        if msg['pos'] >= WAY_LENGTH:
          if client not in self.over:
            client.time = time.time() - self.startTime
            self.over.append(client)
        if len(self.over) == N_PLAYER:
          logger.info('the game is over')
          rank = [{'name':c.name, 'car':c.car, 'sec':int(c.time)} for c in self.over]
          for c in self.clients:
            c.write_message(json.dumps({'act':'over', 'rank': rank}))
          for c in self.others:
            c.write_message(json.dumps({'act':'over', 'rank': rank}))
          self.reset()
    elif GAME_MODE == GAME_MODE_TIME and msg['act'] == 'over':
      order = sorted(self.clients, lambda a: a.pos, reverse = True)
      rank = [{'name': c.name, 'car': c.car, 'pos': c.pos} for c in order ]
      logger.info(rank)
      for c in self.clients:
        c.write_message(json.dumps({'act': 'over', 'rank': rank}))
      for c in self.others:
        c.write_message(json.dumps({'act':'over', 'rank': rank}))
      self.reset()


if __name__ == '__main__':
  root_logger = logging.getLogger()
  logging.basicConfig(format='%(asctime)s: %(levelname)s: %(module)s: %(message)s', level=logging.INFO)

  GameServer = GameServer()
  urlpattern = [(r'^/', RaceGame)]
  logger.info(urlpattern)
  application = tornado.web.Application(urlpattern, debug=True)
  application.listen(20666, xheaders=True)
  instance = tornado.ioloop.IOLoop.instance()
  instance.start()
