#!/bin/sh

. /lib/functions.sh
. ../netifd-proto.sh
init_proto "$@"

proto_apcli_init_config() {
    renew_handler=1

    proto_config_add_string 'channel'
    proto_config_add_string 'ssid'
    proto_config_add_string 'bssid'
    proto_config_add_string 'authmod'
    proto_config_add_string 'encryptype'
    proto_config_add_string 'wpapsk'
    proto_config_add_string 'mac'
}

proto_apcli_setup() {
    local config="$1"
    local iface="$2"

    local channel ssid bssid authmod encryptype wpapsk
    json_get_vars channel ssid bssid authmod encryptype wpapsk

    ### enable apcli
    ifconfig apcli0 down 2> /dev/null
    ifconfig apclii0 down 2> /dev/null
    ifconfig $iface up
    iwpriv $iface set ApCliEnable=0
    iwpriv $iface set Channel=$channel
    iwpriv $iface set ApCliSsid="$ssid"
    [ "$authmod" == "WPA1PSKWPA2PSK" ] && iwpriv $iface set ApCliAuthMode=WPA2PSK || iwpriv $iface set ApCliAuthMode=$authmod
    [ "$encryptype" == "TKIPAES" ] && iwpriv $iface set ApCliEncrypType=AES || iwpriv $iface set ApCliEncrypType=$encryptype
    [ -n "$wpapsk" ] && iwpriv $iface set ApCliWPAPSK=$wpapsk
    [ -n "$bssid" ] && iwpriv $iface set ApCliBssid=$bssid || iwpriv $iface set ApCliBssid=00:00:00:00:00:00
    iwpriv $iface set ApCliAutoConnect=1
    iwpriv $iface set ApCliEnable=1

    ### start dhcpc
    proto_export "INTERFACE=$config"
    proto_run_command "$config" udhcpc \
        -p /var/run/udhcpc-$iface.pid \
        -s /lib/netifd/dhcp.script \
        -f -t 0 -i "$iface"
}

proto_apcli_renew() {
    local interface="$1"
    # SIGUSR1 forces udhcpc to renew its lease
    local sigusr1="$(kill -l SIGUSR1)"
    [ -n "$sigusr1" ] && proto_kill_command "$interface" $sigusr1
}

proto_apcli_teardown() {
    local interface="$1"
    proto_kill_command "$interface"
}

add_protocol apcli
