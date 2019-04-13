#!/bin/sh
append DRIVERS "mt7628"

. /lib/wifi/ralink_common.sh

prepare_mt7628() {
	prepare_ralink_wifi mt7628
}

scan_mt7628() {
	scan_ralink_wifi mt7628 mt7628
}


disable_mt7628() {
	disable_ralink_wifi mt7628
}

enable_mt7628() {
	enable_ralink_wifi mt7628 mt7628
}

detect_mt7628() {
#	detect_ralink_wifi mt7628 mt7628
#	ssid=mt7628-`ifconfig eth0 | grep HWaddr | cut -c 51- | sed 's/://g'`
	ssid=CastNow-1000
	cd /sys/module/
	[ -d $module ] || return
	[ -e /etc/config/wireless ] && return
         cat <<EOF
config wifi-device      mt7628
        option type     mt7628
        option vendor   ralink
        option band     2.4G
        option channel  0
        option txpower  100
        option bw       1
        option leden    1

config wifi-iface
        option device   mt7628
        option ifname   ra0
        option network  lan
        option mode     ap
        option ssid     $ssid
        option encryption psk2
        option key      88888888

EOF


}


