#!/bin/sh
append DRIVERS "mt7610e"

. /lib/wifi/ralink_common.sh

prepare_mt7610e() {
	prepare_ralink_wifi mt7610e
}

scan_mt7610e() {
	scan_ralink_wifi mt7610e mt7610e
}

disable_mt7610e() {
	disable_ralink_wifi mt7610e
}

enable_mt7610e() {
	enable_ralink_wifi mt7610e mt7610e
}

detect_mt7610e() {
#	detect_ralink_wifi mt7610e mt7610e
#	ssid=mt7610e-`ifconfig eth0 | grep HWaddr | cut -c 51- | sed 's/://g'`
	ssid=CastNow-1000_5G
	cd /sys/module
	[ -d $module ] || return
        [ -e /etc/config/wireless ] && return
         cat <<EOF
config wifi-device      mt7610e
        option type     mt7610e
        option vendor   ralink
        option wifimode 14
        option band     5G
        option aregion  10
        option txpower  100
        option bw       2
        option channel  0

config wifi-iface
        option device   mt7610e
        option ifname   rai0
        option network  lan
        option mode     ap
        option ssid     $ssid
        option encryption psk2
        option key      88888888

EOF
}


