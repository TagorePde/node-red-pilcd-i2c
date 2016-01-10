#!/usr/bin/python
#
# HD44780 LCD Test Script for
# Raspberry Pi
#
# Original Author : Matt Hawkins
# Site   : http://www.raspberrypi-spy.co.uk
# Modified to use PINS not BCM : Dave Conway-Jones
# Modified to use RPLCD with I2c by Vincent P (https://akwaryoum.fr)

#import
# -*- coding: utf-8 -*-
from __future__ import print_function, division, absolute_import, unicode_literals

import RPIO, sys, select

from RPLCD.i2c import CharLCD
from RPLCD import Alignment, CursorMode, ShiftMode
from RPLCD import cursor, cleared

try:
    input = raw_input
except NameError:
    pass

RPIO.setwarnings(False)

# Main program loop
if len(sys.argv) > 1:
    address = int(sys.argv[1], 0)
    cols = int(sys.argv[2])
    rows = int(sys.argv[3])

    print ("Config: " + str(format(address, '#04x')) + " (" + str(cols) + ","+ str(rows) + ")")

    # Initialise display
    lcd = CharLCD(address, cols=cols, rows=rows)

    # Send some test
    lcd.write_string("Node-RED\n")
    lcd.write_string("LCD online")

    # Flush stdin so we start clean
    while len(select.select([sys.stdin.fileno()], [], [], 0.0)[0])>0:
        os.read(sys.stdin.fileno(), 4096)

    while True:
        try:
            data = raw_input()
            data = data.rstrip("\r\n\t")
            if data == "c:lose": # cleanup and exit
                lcd.close()
                sys.exit(0)
            elif data == "clr:": # clear the display
                lcd.clear()
            elif data.startswith("1:"):
                lcd.cursor_pos = (0,0)
                lcd.write_string(data[2:])
            elif data.startswith("2:"):
                lcd.cursor_pos = (1,0)
                lcd.write_string(data[2:])
            elif data.startswith("3:"):
                lcd.cursor_pos = (2,0)
                lcd.write_string(data[2:])
            elif data.startswith("4:"):
                lcd.cursor_pos = (3,0)
                lcd.write_string(data[2:])
            else:               # default to line 1
                lcd.cursor_pos = (0,0)
                lcd.write_string(data)
        except EOFError:        # hopefully always caused by us sigint'ing the program
            lcd.close()
            sys.exit(0)

else:
    print ("Bad params")
    print ("    sudo nrlcd.py 0x27 16 2")
    sys.exit(0)
