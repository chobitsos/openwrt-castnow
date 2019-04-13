#!/bin/sh

echo "+++++++++++++++++++++ reset to factory +++++++++++++++++++++"

sleep 5
jffs2reset -y
/etc/init.d/telnet disable

gpio e 11 0
sleep 5
reboot
