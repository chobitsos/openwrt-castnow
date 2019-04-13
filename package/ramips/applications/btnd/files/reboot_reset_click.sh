#!/bin/sh

echo "+++++++++++++++++++++ reboot +++++++++++++++++++++"
gpio e 11 0
sleep 3
reboot
