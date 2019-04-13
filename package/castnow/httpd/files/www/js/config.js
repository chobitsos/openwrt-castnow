var isGet = false;
var interval = 0;
var ntp_interval = 0;
var checkWanDetectLinkInterval = 0;
var checkWanDetectModeInterval = 0;
var timeout = 0;
var timeoutCount = 15;
var timeoutCheck = 0;
var timeoutCheckCount = 10;
var wanConfigJsonObject;
var wanInfoJsonObject;
var deviceJsonObject;
var currentLanIP = "";
var currentMode = "";
var myMac = "";
var myStaticIp = "";
var myStaticMask = "";
var myStaticGw = "";
var myStaticDns = "";
var isConfiged = false;
var isConnected = false;
var responseReason = 0;
var userLoginStatus = false;
var userLoginFlags = -1;

/*
 * 设置PPPOE账号密码
 */
function setPPPOE(account, passwd, mac, mtu, dns, dns1, clone) {
    $("#btn_1").attr("disabled", true);
    $("#btn_1").val(dialing);

    if (typeof(wanConfigJsonObject) == 'undefined') {
        getWanConfigJsonObject();
    }

    if (clone > 1) {
        mac = getCloneMac(clone);
    }

    dns = dns.length > 0 ? dns : "";
    dns1 = dns1.length > 0 ? dns1 : "";

    if (currentMode != 2 || mac != myMac || account != wanConfigJsonObject.user || passwd != wanConfigJsonObject.passwd || clone > 0 || dns != wanConfigJsonObject.dns || dns1 != wanConfigJsonObject.dns1 || mtu != wanConfigJsonObject.mtu || wanInfoJsonObject.connected == 0) {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=wan_conf&function=set&user=" + account + "&passwd=" + passwd + "&mode=2&mtu=" + mtu + "&dns=" + dns + "&dns1=" + dns1 + "&mac=" + mac + "&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                if (data.error == 0) {
                    if (data.link) {
                        currentMode = 2;
                        loading(1, 'PPPoE confing...');
                        setTimeout("intervalTime(1, 'dial', 'pppoe', 2)", 10000);
                    } else {
                        getMsg(please_plugin_wan_cable);
                        $("#btn_1").attr("disabled", false);
                        $("#btn_1").val(start_dialing);
                        return;
                    }
                } else {
                    locationUrl(data.error);
                    $("#btn_1").attr("disabled", false);
                    $("#btn_1").val(start_dialing);
                    return;
                }
            },
            error: function() {
                getMsg(dial_timeout);
                return;
            }
        });
    } else {
        if (wanInfoJsonObject.connected == 0) {
            intervalTime(1, dial, pppoe, 2);
        } else {
            toUrl();
        }
    }
}


/*
 * 设置DHCP
 */
function setDHCP(mac, mtu, dns, dns1, clone) {
    $("#btn_3").attr("disabled", true);
    $("#btn_3").val(connecting);

    if (typeof(wanConfigJsonObject) == 'undefined') {
        getWanConfigJsonObject();
    }

    if (clone > 1) {
        mac = getCloneMac(clone);
    }

    dns = dns.length > 0 ? dns : "";
    dns1 = dns1.length > 0 ? dns1 : "";

    if (currentMode != 1 || mac != myMac || clone > 0 || dns != wanConfigJsonObject.dns || dns1 != wanConfigJsonObject.dns1 || mtu != wanConfigJsonObject.mtu || wanInfoJsonObject.connected == 0) {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=wan_conf&function=set&mode=1&mtu=" + mtu + "&dns=" + dns + "&dns1=" + dns1 + "&mac=" + mac + "&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                if (data.error == 0) {
                    if (data.link) {
                        currentMode = 1;
                        loading(1, 'DHCP confing...');
                        setTimeout("intervalTime(3, 'enable', 'DHCP config', 1)", 10000);
                    } else {
                        getMsg(please_plugin_wan_cable);
                        $("#btn_3").attr("disabled", false);
                        $("#btn_3").val(reenable);
                        return;
                    }
                } else {
                    locationUrl(data.error);
                    $("#btn_3").attr("disabled", false);
                    $("#btn_3").val(reenable);
                    return;
                }
            },
            error: function() {
                getMsg(dhcp_timeout);
                return;
            }
        });
    } else {
        if (wanInfoJsonObject.connected == 0) {
            intervalTime(3, enable, dhcp_cfg, 1);
        } else {
            toUrl();
        }
    }
}

/*
 * 设置 NTP
 */
function setNTP() {
    var ntp_address = $("#ntp_server").val();
    var ntp_zone = $("#ntp_zone").val();

    if (!checkDomain(ntp_address)) {
        getMsg(invalid_ip_address, 1, '#ntp_server');
        return;
    };

    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=ntp&function=set&ntp_address=" + ntp_address + "&ntp_zone=" + ntp_zone + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                getMsg(modify_NTP_success_note);
                setTimeout(function() {
                    getNTP();
                }, 3000);
            } else {
                locationUrl(data.error);
            }
        }
    });
}

/*
 * 设置静态IP
 */
function setStatic(ip, mask, gw, dns, dns1, mac, mtu, clone) {
    $("#btn_2").attr("disabled", true);
    $("#btn_2").val(connecting);
    if (typeof(wanConfigJsonObject) == 'undefined') {
        getWanConfigJsonObject();
    }
    if (clone > 1) {
        mac = getCloneMac(clone);
    }

    dns = dns.length > 0 ? dns : "";
    dns1 = dns1.length > 0 ? dns1 : "";

    if (currentMode != 3 || mac != myMac || ip != myStaticIp || mask != myStaticMask || gw != myStaticGw || clone > 0 || dns != wanConfigJsonObject.dns || dns1 != wanConfigJsonObject.dns1 || mtu != wanConfigJsonObject.mtu || wanInfoJsonObject.connected == 0) {
        var data = "fname=net&opt=wan_conf&function=set&ip=" + ip + "&mask=" + mask + "&gw=" + gw + "&mode=3&mtu=" + mtu + "&dns=" + dns + "&dns1=" + dns1 + "&mac=" + mac;
        $.ajax({
            type: "POST",
            url: actionUrl + data + "&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                var jsonObject = data;
                if (jsonObject.error == 0) {
                    if (jsonObject.link) {
                        currentMode = 3;
                        loading(1, 'Static IP confing...');
                        setTimeout("intervalTime(2, 'enable', 'Static IP cfg', 3)", 10000);
                    } else {
                        getMsg(please_plugin_wan_cable);
                        $("#btn_2").attr("disabled", false);
                        $("#btn_2").val(reenable);
                        return;
                    }
                } else {
                    locationUrl(jsonObject.error);
                    $("#btn_2").attr("disabled", false);
                    $("#btn_2").val(reenable);
                    return;
                }
            },
            error: function() {
                getMsg(static_ip_timeout);
                return;
            }
        });
    } else {
        if (wanInfoJsonObject.connected == 0) {
            intervalTime(2, enable, static_ip_cfg, 3);
        } else {
            toUrl();
        }
    }
}

/*
 * 无线中继
 */
function getWifiList() {
    var bssid = "";

    getWanInfoJsonObject();

    if (wanConfigJsonObject.bssid) if (wanConfigJsonObject.bssid.split(":").length == 6) bssid = wanConfigJsonObject.bssid

    if (wanInfoJsonObject.ip != "" && wanInfoJsonObject.mode == 4) {
        $("#wf_name").text(wanConfigJsonObject.ssid + "(" + bssid + ")");
        $("#noinpt").text(connected);
    } else {
        if (wanConfigJsonObject.ssid) {
            $("#wf_name").text(wanConfigJsonObject.ssid + "(" + bssid + ")");
        } else {
            $("#wf_name").text(please_select);
        }
        $("#noinpt").text(unconnected);
    }

    loading(1, i18n_loading);
    $.ajax({
        type: 'POST',
        url: actionUrl + "fname=net&opt=ap_list&function=get&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            var jsonWifiListObject = data;
            if (jsonWifiListObject.error == 0) {
                var aplist = jsonWifiListObject.aplist;
                var wifi = "";
                var list = "";
                var data_ssid = new Array();
                if (aplist.length > 0) {
                    for (var i = 0; i < aplist.length; i++) {
                        if (aplist[i].dbm >= 0 && aplist[i].dbm <= 33) {
                            aplist[i].dbm = '"lvl lvl-3"';
                        } else if (aplist[i].dbm >= 34 && aplist[i].dbm <= 66) {
                            aplist[i].dbm = '"lvl lvl-2"';
                        } else if (aplist[i].dbm >= 67 && aplist[i].dbm <= 100) {
                            aplist[i].dbm = '"lvl lvl-1"';
                        }
                        if (aplist[i].security == 'NONE') {
                            aplist[i].security_lock = "<div class=" + aplist[i].dbm + "></div>";
                        } else {
                            aplist[i].security_lock = "<div class=" + aplist[i].dbm + "><i class='lock'></i></div>";
                        }
                        if (aplist[i].ssid.length > 15) {
                            data_ssid[i] = aplist[i].ssid.substr(0, 15) + '...';
                        } else {
                            if (aplist[i].ssid.length < 2) {
                                data_ssid[i] = ssid_be_hidden;
                            } else {
                                data_ssid[i] = aplist[i].ssid;
                            }
                        }
                        if (aplist[i].ssid.length > 1) {
                            list = "<tr style='cursor: pointer' ssid='" + aplist[i].ssid + "' bssid='" + aplist[i].bssid + "' channel=" + aplist[i].channel + " sec=" + 
                            aplist[i].security + "><td width='143' title='" + aplist[i].ssid + "'>" + data_ssid[i] + "</td><td width='170'>" + 
                            aplist[i].bssid.toUpperCase() + "</td><td width='40'>" + aplist[i].channel + "</td><td width='230'>" + aplist[i].security + "</td><td>" + 
                            aplist[i].security_lock + "</td></tr>";
                            wifi += list;
                        }
                    }
                }
                layer.closeAll();
                $("#getWifiList").empty().html(wifi);
            } else {
                layer.closeAll();
                locationUrl(data.error);
                return;
            }
        },
        complete: function(XHR, TS) {
            XHR = null;
        },
        error: function(XHRequest, status, data) {
            XHRequest.abort();
        }
    });
}

/*
 * 无线中继连接
 * @param {type} ssid
 * @param {type} pwd
 * @param {type} mac
 * @param {type} channel
 */
function connectWisp(ssid, pwd, mac, channel, sec, bssid) {
    $("#btn_4").attr("disabled", true);
    $("#btn_4").val(connecting);
    var dat, dat2;

    if (typeof(wanInfoJsonObject) == 'undefined') {
        getWanInfoJsonObject();
    }

    if (typeof(wanConfigJsonObject.ssid) == 'undefined') {
        getWanConfigJsonObject();
    }

    if (sec == 1) {
        sec = 'NONE';
    } else if (sec != 'NONE') {
        var secsp = sec.split('/');
        if (secsp.length == 1) {
            sec = sec.replace(' ', '') + '/TKIPAES';
        }
    }

    if (pwd == '') {
        pwd = 'NONE';
    }

    if (mac == '00:00:00:00:00:00') {
        mac = wanConfigJsonObject.rawmac;
    }

    dat = "fname=net&opt=wan_conf&function=set" + "&mac=" + mac + "&mode=4&ssid=" + ssid + "&security=" + sec + "&key=" + pwd + "&channel=" + channel;
    if (bssid) dat = dat + "&bssid=" + bssid;
    dat2 = "fname=net&opt=wan_conf&function=get" + "&mac=" + mac + "&mode=4&ssid=" + ssid + "&security=" + sec + "&key=" + pwd + "&channel=" + channel;
    if (currentMode != 4 || mac != myMac || wanInfoJsonObject.connected == 0 || wanConfigJsonObject.ssid != ssid || (bssid && (bssid != wanConfigJsonObject.bssid))) {
        $.ajax({
            type: "POST",
            url: actionUrl + dat + "&math=" + Math.random(),
            dataType: "JSON",
            success: function(data) {
                if (data.error == 0) {
                    currentMode = 4;
                    loading(1, connecting);
                    $.ajax({
                        type: "POST",
                        url: actionUrl + dat2,
                        dataType: "JSON",
                        success: function(jsonWisp) {
                            if (jsonWisp.error == 0) {
                                intervalTime(4, wireless_repeat, wireless_repeat, jsonWisp.mode);
                            } else {
                                getMsg(connect_timeout);
                                $("#noinpt").text(repeat_failed);
                                layer.closeAll();
                            }
                        }
                    });
                } else if (data.error != 0) {
                    locationUrl(data.error);
                }
            },
            complete: function(XHR, TS) {
                XHR = null;
            },
            error: function(XHRequest, status, data) {
                XHRequest.abort();
            }
        });
    } else {
        if (wanInfoJsonObject.connected == 0) {
            intervalTime(4, wireless_repeat, wireless_repeat, 4);
        } else if (wanInfoJsonObject.connected == 1 && wanInfoJsonObject.mode == 4) {
            getMsg(repeat_success);
            setTimeout(function() {
                toUrl();
            }, 3000);
        }
    }
}

function getWanConfigJsonObject() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=wan_conf&function=get&math=" + Math.random(),
        async: false,
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                wanConfigJsonObject = data;
            } else {
                locationUrl(data.error);
            }
        },
        complete: function(XHR, TS) {
            XHR = null;
        },
        error: function(XHRequest, status, data) {
            getMsg(please_reconnect_router);
            layer.closeAll();
            XHRequest.abort();
        }
    });
}

function getDeviceCheck() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=device_check&function=get&math=" + Math.random(),
        async: false,
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                deviceJsonObject = data;
            } else {
                locationUrl(data.error);
                return;
            }
        }
    });
}

/*
 * 获取wanInfoJson
 */
function getWanInfoJsonObject() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=wan_info&function=get&math=" + Math.random(),
        async: false,
        dataType: "json",
        success: function(data) {
            var jsonObject = data;
            if (jsonObject.error == 0) {
                wanInfoJsonObject = jsonObject;
                currentMode = wanInfoJsonObject.mode;
                if (jsonObject.reason > 0) {
                    responseReason = jsonObject.reason;
                }
            } else {
                getMsg(getErrorCode(jsonObject.error));
                locationUrl(data.error);
                return;
            }
        },
        complete: function(XHR, TS) {
            XHR = null;
        },
        error: function(XHRequest, status, data) {
            getMsg(please_reconnect_router);
            layer.closeAll();
            XHRequest.abort();
        }
    });
}

/*
 * 检查网线
 */

function checkWanDetectLink() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=wan_detect&function=get&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            var jsonObject = data;
            if (jsonObject.wan_link == 1) {
                clearInterval(checkWanDetectLinkInterval);
                checkWanDetect(0);
            } else if (jsonObject.wan_link == 0) {
                getWanInfoJsonObject();
                if (wanInfoJsonObject.connected == 1) {
                    toUrl();
                } else {
                    layer.closeAll();
                    clearInterval(checkWanDetectLinkInterval);
                    var lineDivShow = $("#lineOff");
                    loading(1, lineDivShow, 1);
                }
            }
        }
    });
}

/*
 * 检查网络类型
 */

function checkWanDetect(type) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=wan_detect&function=get&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            var jsonObject = data;
            if (jsonObject.error == 0) {
                if (jsonObject.wan_link == 0 && type < 1) {
                    var i = 0;
                    checkWanDetectLinkInterval = setInterval(function() {
                        checkWanDetectLink();
                        i++;
                    }, 2000);
                    if (i == 15) {
                        clearInterval(checkWanDetectLinkInterval);
                        layer.closeAll();
                    }
                } else {
                    layer.closeAll();
                    clearInterval(checkWanDetectLinkInterval);
                    if (jsonObject.connected == 0) {
                        if (type > 0) {
                            netTypeChoice(type);
                        } else {
                            netTypeChoice(jsonObject.mode);
                        }
                    } else {
                        toUrl();
                    }
                }
            } else {
                locationUrl(data.error);
                return;
            }
        }
    });
}

function userLogin(str) {
    var name = 'admin';
    var str_md5 = $.md5(name + str);
    ajax = $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=login&function=set&usrid=" + str_md5 + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                $.cookie('lstatus', true);
                checkConfig();
            } else {
                getMsg(login_failed);
                $("#user_login").text(relogin);
                $("#user_login").attr("disabled", false);
            }
        },
        complete: function(XHR, TS) {
            XHR = null;
        },
        error: function(XHRequest, status, data) {
            //getMsg(XHRequest.status);
            //XHRequest.abort();
            if (userLoginFlags < 0) {
                loading(1, logining);
            }
            userLoginFlags++;
            ajax.abort();
        }
    });
}

function getNTP() {
    var dat = "fname=system&opt=ntp&function=get";
    $.ajax({
        type: "POST",
        url: actionUrl + dat + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                var ctime = new Date(data.ntp_time);
                if (ntp_interval) clearInterval(ntp_interval);

                ntp_interval = setInterval(function() {
                    var month = ctime.getMonth() + 1;
                    $("#realtime").text(ctime.getFullYear() + "/" + checkTime(month) + "/" + checkTime(ctime.getDate()) + "   " + checkTime(ctime.getHours()) + ":" + 
                    checkTime(ctime.getMinutes()) + ":" + checkTime(ctime.getSeconds()));
                    ctime.setTime(ctime.getTime() + 1000);
                }, 1000);

                selectValue("ntp_zone", data.ntp_zone);
                $("#ntp_server").val(data.ntp_address);
            } else {
                locationUrl(data.error);
            }
        }
    })
}

function setLedOnOff(act, val) {
    var dat = "fname=system&opt=led&function=get";
    if (act == 'set') dat = "fname=system&opt=led&function=set&enable=" + val;
    $.ajax({
        type: "POST",
        url: actionUrl + dat + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                if (act == 'set') {
                    getMsg(setting_success);
                } else {
                    if (data.enable == 1) {
                        if ($("#led_on").hasClass('selected') == false) {
                            $("#led_on").addClass('selected');
                        }
                        if ($("#led_off").hasClass('selected') == true) {
                            $("#led_off").removeClass('selected');
                        }
                    } else {
                        if ($("#led_on").hasClass('selected') == true) {
                            $("#led_on").removeClass('selected');
                        }
                        if ($("#led_off").hasClass('selected') == false) {
                            $("#led_off").addClass('selected');
                        }
                    }
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function wifiGet(_5g) {
    var suffix = _5g ? "_5g" : "";
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=wifi_lt" + suffix + "&function=get&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                router.getWifiAp(_5g);
                $("#startHour" + suffix + " option[value=" + data.sh + "]").attr('selected', 'selected');
                $("#startMin" + suffix + " option[value=" + data.sm + "]").attr('selected', 'selected');
                $("#endHour" + suffix + " option[value=" + data.eh + "]").attr('selected', 'selected');
                $("#endMin" + suffix + " option[value=" + data.em + "]").attr('selected', 'selected');
                $("input[name=day" + suffix + "]").each(function(index) {
                    for (var i = 0; i <= data.week.length; i++) {
                        if (index == data.week[i]) {
                            $(this).attr("checked", true);
                        }
                    }
                });
                if (data.time_on == 1) {
                    $("#wifiTimeOn" + suffix).addClass('selected');
                    $("#wifiTimeOff" + suffix).removeClass('selected');
                    $("#wf_time_div" + suffix).show();
                } else if (data.time_on == 0) {
                    $("#wifiTimeOff" + suffix).addClass('selected');
                    $("#wifiTimeOn" + suffix).removeClass('selected');
                    $("#wf_time_div" + suffix).hide();
                }

                if (data.enable == 1) {
                    $("#wifi_on" + suffix).addClass('selected');
                    $("#wifi_off" + suffix).removeClass('selected');
                    $("#swichDiv" + suffix).show();
                } else {
                    $("#wifi_off" + suffix).addClass('selected');
                    $("#wifi_on" + suffix).removeClass('selected');
                    $("#swichDiv" + suffix).hide();
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}


function wifiSet(enable, time_on, week, sh, sm, eh, em, _5g) {
    var suffix = _5g ? "_5g" : "";
    var url = actionUrl + "fname=net&opt=wifi_lt" + suffix + "&function=set&";
    $.ajax({
        type: "POST",
        url: url + "enable=" + enable + "&time_on=" + time_on + "&week=" + week + "&sh=" + sh + "&sm=" + sm + "&eh=" + eh + "&em=" + em + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                getMsg(setting_success);
                if (enable == 0) {
                    if (_5g) $("#swichDiv_5g").hide();
                    else $("#swichDiv").hide();
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function wifiTxrateGet(act, rate, _5g) {
    var suffix = _5g ? "_5g" : "";
    var dat = "fname=net&opt=txrate" + suffix + "&function=" + act;
    if (rate > 0) {
        dat = "fname=net&opt=txrate" + suffix + "&function=" + act + "&txrate=" + rate;
    }

    $.ajax({
        type: "POST",
        url: actionUrl + dat + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                if (rate > 0) {
                    getMsg(setting_success);
                } else {
                    if (data.txrate <= 30) {
                        $("#rate_mode_1" + suffix).addClass('selected');
                        $("#rate_mode_2" + suffix).removeClass('selected');
                        $("#rate_mode_3" + suffix).removeClass('selected');
                    } else if (data.txrate <= 65 && data.txrate > 30) {
                        $("#rate_mode_2" + suffix).addClass('selected');
                        $("#rate_mode_1" + suffix).removeClass('selected');
                        $("#rate_mode_3" + suffix).removeClass('selected');
                    } else if (data.txrate <= 100 && data.txrate > 65) {
                        $("#rate_mode_3" + suffix).addClass('selected');
                        $("#rate_mode_1" + suffix).removeClass('selected');
                        $("#rate_mode_2" + suffix).removeClass('selected');
                    }
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}
/*
 * wifi来宾模式设置
 * @param {type} act
 * @param {type} status
 */

function wifiGuestGet(act, status) {
    var dat = "fname=net&opt=wifi_vap&function=get";
    if (act == 'set') {
        dat = "fname=net&opt=wifi_vap&function=set" + "&enable=" + status;
    }
    $.ajax({
        type: "POST",
        url: actionUrl + dat + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                if (act == 'get' && data.enable == 1) {
                    $("#guest_on").addClass('selected');
                    $("#guest_off").removeClass('selected');
                    wifiGuestList('get');
                } else if (act == 'get' && data.enable == 0) {
                    $("#guest_off").addClass('selected');
                    $("#guest_on").removeClass('selected');
                    $("#visit_mode_div").hide();
                    $("#reGuestList").hide();
                } else {
                    getMsg(setting_success);
                    if (act == 'set' && status == 1) {
                        wifiGuestList('get');
                        $("#reGuestList").show();
                    } else if (act == 'set' && status == 0) {
                        $("#reGuestList").hide();
                    }
                }
                if (status == 0) {
                    $("#visit_mode_div").hide();
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

/*
 *端口映射
 */
function hostNatList(fc, mac, ip, act, out_port, in_port, proto, enable, tr) {
    var dat = "fname=net&opt=host_nat&function=" + fc + "&mac=" + mac + "&act=" + act;
    if (act == 'add' || act == 'del' || act == 'mod') {
        dat = "fname=net&opt=host_nat&function=" + fc + "&mac=" + mac + "&act=" + act + "&out_port=" + out_port + "&in_port=" + in_port + "&proto=" + proto + "&enable=" + enable;
        if (ip != '') dat = dat + "&ip=" + ip;
    }
    $.ajax({
        type: "POST",
        url: actionUrl + dat + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                var html = '';
                if (fc == 'get') {
                    for (var i = 0; i < data.nat.length; i++) {
                        data.nat[i].mark = switch_open(data.nat[i].enable, 2);
                        data.nat[i].protoMark = changeTcpUdp(data.nat[i].proto);
                        html += "<tr><td>" + data.nat[i].out_port + "</td><td>" + data.nat[i].in_port + "</td><td>" + data.nat[i].protoMark + "</td><td class='mod_nat'><div class='tbDiv'><i class='" + data.nat[i].mark + "'></i></div></td><td class='del_nat'><div class='editBtn remove'></div></td></tr>";
                    }
                    $("#host_nat").empty().html(html);
                } else if (fc == 'set') {
                    if (act == 'del') {
                        getMsg(delete_success);
                        $("#host_nat").find('tr').eq(tr).remove();
                    } else if (act == 'add') {
                        getMsg(add_success);
                        var mark = switch_open(enable, 2);
                        proto = changeTcpUdp(proto);
                        $("#dk_out").val('');
                        $("#dk_inner").val('');
                        html = "<tr><td>" + out_port + "</td><td>" + in_port + "</td><td>" + proto + "</td><td class='mod_nat'><div class='tbDiv'><i class='" + mark + "'></i></div></td><td class='del_nat'><div lass='editBtn remove'></div></td></tr>";
                        $("#host_nat").append(html);
                    } else if (act == 'mod') {
                        getMsg(modify_success);
                    }
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function routerRestart(act) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=" + act + "&function=set&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                var content = '';
                if (act == 'reboot') {
                    content = rebooting_router;
                } else {
                    content = factorying_router;
                }
                GetProgressBar(content);
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function checkConfig() {
    if ($.cookie('lstatus') == 'true') {
        toUrl();
        loading(1, detecting_wan_type);
    } else {
        $("#account_login").show();
    }
}

/*
 * 设置
 */

function checkSetting() {
    userLoginStatus = $.cookie('lstatus');
    if (userLoginStatus == 'true') {
        loading(1, detecting_wan_type);
        getWanConfigJsonObject();
        getWanInfoJsonObject();
        myMac = (wanConfigJsonObject.mac).toUpperCase();
        $("#mac_inpt").val(myMac).siblings("label").hide();
        $("#macInpt").text(myMac);
        layer.closeAll();
        netTypeChoice(wanConfigJsonObject.mode);
    } else {
        locationUrl(10007);
    }
}

/*
 * 获取宽带账号
 */

function getPPPOEAccount() {
    $(".dot").hide();
    $(".txt").removeClass("hide").text(router_obtaining);
    $(".d2").removeClass("error");
    $('#getAccount').val(obtaining);
    $('#getAccount').attr("disabled", true);
    timeoutCount = 30;
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=wan_account&function=set&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                $.ajax({
                    type: "POST",
                    url: actionUrl + "fname=net&opt=wan_account&function=get&math=" + Math.random(),
                    dataType: "json",
                    success: function(data) {
                        if (data.error == 0) {
                            layer.closeAll();
                            loading(1, $('#sucLayer'), 1);
                            $('#account_get').empty().text(data.account);
                            $('#pwd_get').empty().text(data.passwd);
                        } else {
                            interval = setInterval(function() {
                                if (timeout > timeoutCount - 1) {
                                    timeout = 0;
                                    $(".dot").show();
                                    $(".d2").addClass("error");
                                    $(".txt").text(obtain_failed);
                                    clearInterval(interval);
                                    $("#getAccount").removeAttr("disabled");
                                    $("#getAccount").val(reobtain);
                                }
                                if (!isGet) {
                                    $(".d1").delay(100).fadeIn();
                                    $(".d2").delay(400).fadeIn();
                                    $(".d3").delay(700).fadeIn();
                                    if (timeout != 0) {
                                        setTimeout(function() {
                                            $(".dot").fadeOut();
                                        }, 1200);
                                    }
                                    getAccountTimer();
                                    timeout++;
                                }
                            }, 2000);
                        }
                    }
                });
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function getAccountTimer() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=wan_account&function=get&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            var jsonObject = data;
            if (jsonObject.error == 0) {
                clearInterval(interval);
                isGet = true;
                timeout = 0;
                layer.closeAll();
                loading(1, $('#sucLayer'), 1);
                $('#account_get').empty().text(jsonObject.account);
                $('#pwd_get').empty().text(jsonObject.passwd);
            }
        }
    });
}

function intervalTime(btn, btnText, msgText, mode) {
    responseReason = 0;
    interval = setInterval(function() {
        getWanInfoJsonObject();
        if ((wanInfoJsonObject.link == 0 && mode != 4) || responseReason == 19) {
            timeout = 15;
        }
        if (timeout > timeoutCount - 1) {
            if (wanInfoJsonObject.error == 0) {
                if (wanInfoJsonObject.connected == 0) {
                    if (wanInfoJsonObject.link == 0 && mode != 4) {
                        getMsg(please_plugin_wan_cable);
                    } else {
                        if (responseReason > 0) {
                            getMsg(getErrorCode(responseReason));
                        } else {
                            getMsg(msgText + " " + timeout);
                        }
                    }
                } else if (wanInfoJsonObject.connected == 1 && wanInfoJsonObject.mode == mode) {
                    toUrl();
                }
            } else {
                getMsg(getErrorCode(wanInfoJsonObject.error));
            }
            if (mode == 4) {
                layer.closeAll();
                getMsg(getErrorCode(wanInfoJsonObject.error));
                if (mode == 4) {
                    $("#noinpt").text(repeat_failed);
                }
            }
            $("#btn_" + btn).attr("disabled", false);
            $("#btn_" + btn).val(again + " " + btnText);
            timeout = 0;
            clearInterval(interval);
            return;
        }
        if (wanInfoJsonObject.connected == 0 || wanInfoJsonObject.mode != mode) {
            timeout++;
        } else if (wanInfoJsonObject.connected == 1 && wanInfoJsonObject.mode == mode) {
            toUrl();
        }
    }, 4000);
}

function checkVersion() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=firmstatus&function=get&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            var jsonObject = data;
            if (jsonObject.error == 0) {
                if (jsonObject.status == 0) {
                    $("#update_1").val(latest_firmware);
                    $("#checkMsg").text(already_be_latest_version);
                } else if (jsonObject.status == 1) {
                    $("#update_1").val(download_firmware);
                    $("#update_1").attr('onclick', 'getGradeStatus()');
                    $("#checkMsg").text('');
                } else if (jsonObject.status == 2) {
                    $("#update_1").val(downloading);
                    $("#update_1").attr('disabled', true);
                    $("#checkMsg").text('');
                } else if (jsonObject.status == 3) {
                    $("#update_1").attr('disabled', false);
                    $("#update_1").val(upgrade_firmware);
                    $("#update_1").attr('onclick', 'up_Wrap()');
                    $("#checkMsg").text('');
                } else if (jsonObject.status == 4) {
                    $("#update_1").val(reupgrade);
                    $("#update_1").attr('onclick', 'up_Wrap()');
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function getGradeStatus() {
    $("#update_1").val(downloading);
    $("#update_1").attr('disabled', true);
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=firmstatus&function=set&flag=get&math=" + Math.random(),
        dataType: "JSON",
        success: function(doStatus) {
            if (doStatus.error == 0) {
                layer.open({
                    type: 1,
                    title: false,
                    shade: [0.7, '#000'],
                    closeBtn: false,
                    content: $("#uploadLay"),
                    skin: 'cy-class'
                });
                var ProgressBar = {
                    maxValue: 100,
                    value: 0,
                    SetValue: function(aValue) {
                        this.value = aValue;
                        if (this.value >= this.maxValue) this.value = this.maxValue;
                        if (this.value <= 0) this.value = 0;
                        var mWidth = this.value / this.maxValue * $("#progressBar_do").width() + "px";
                        $("#progressBar_Track").css("width", mWidth);
                        $("#progressBarTxt").html(this.value + "%");
                    }
                }
                //        设置最大值
                ProgressBar.maxValue = 100;
                //        设置当前刻度
                var index = 0;
                var mProgressTimer = window.setInterval(function() {
                    $.ajax({
                        type: "POST",
                        url: actionUrl + "fname=system&opt=firmstatus&function=get&math=" + Math.random(),
                        dataType: "JSON",
                        success: function(jsonDoad) {
                            if (jsonDoad.error == 0) {
                                index = ((jsonDoad.curl / jsonDoad.total) * 100).toFixed(2);
                                ProgressBar.SetValue(index);
                                if (index == 100) {
                                    window.clearInterval(mProgressTimer);
                                    ProgressBar.SetValue(0);
                                    layer.closeAll();
                                    $("#update_1").val(upgrade_firmware);
                                    $("#update_1").attr('disabled', false);
                                    $("#update_1").attr('onclick', 'up_Wrap()');
                                }
                            }
                        }
                    });
                }, 1000);
            }
        }
    });
}

function up_Wrap() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=firmup&function=set&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            var jsonObject = data;
            if (jsonObject.error == 0) {
                $("#update_1").val("Upgrading...");
                $("#update_1").attr('disabled', true);
                var content = upgrading_note;
                GetProgressBar(content);
            } else {
                locationUrl(jsonObject.error);
            }
        }
    });
}

function setUpgrade() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=local_firmup&function=set&math=" + Math.random(),
        async: false,
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                $("#_submit").val(upgrading);
                $("#_submit").attr("disabled", true);
                $("#msg").html(upgrading_note);
                initBar();
            } else {
                $("#_submit").val(upgrade_error);
                $("#_submit").attr("disabled", false);
                $("#msg").html(upgrade_error_note + data.error);
            }
        }
    });
}

function uploadFile() {
    if ($("#file").val() == "") {
        $("#msg").html(select_firmware);
    } else {
        if ($("#file").val().indexOf(".bin") == -1) {
            $("#msg").html(invalid_firmware_name);
        } else {
            var form = new FormData();
            form.append("fw", $('#file')[0].files[0]);

            $("#_submit").attr("disabled", true);
            $("#msg").html(uploading_and_wait);

            $.ajax({
                url: actionUrl + "fname=system&opt=firmupload&function=set&math=" + Math.random(),
                type: 'POST',
                cache: false,
                async: false,
                data: form,
                processData: false,
                contentType: false,
                dataType: "json",
                success: function(data) {
                    if (data.error == 0) {
                        clearInterval(interval);
                        isGet = true;
                        timeout = 0;

                        setUpgrade();
                    } else {
                        $("#msg").html("");
                        $("#_submit").val(confirm_upload);

                        locationUrl(data.error);
                    }
                },
                error: function(err) {
                    $("#msg").html("");
                }
            });

            $("#_submit").attr("disabled", false);
        }
    }
}

var barWidth = 300;
var barTimer = 250;
if (syj == null) var syj = {};
syj.ProgressBar = function(parent, width, barClass, display) {
    this.parent = parent;
    this.pixels = width;
    this.parent.innerHTML = "<div/>";
    this.outerDIV = this.parent.childNodes[0];
    this.outerDIV.innerHTML = "<div/>";
    this.fillDIV = this.outerDIV.childNodes[0];
    this.fillDIV.innerHTML = "0";
    this.fillDIV.style.width = "0px";
    this.outerDIV.className = barClass;
    this.outerDIV.style.width = (width + 2) + "px";
    this.parent.style.display = display == false ? 'none' : 'block';
}

syj.ProgressBar.prototype.setPercent = function(pct) {
    var fillPixels;
    if (pct < 0.99) {
        fillPixels = this.pixels * pct;
    } else {
        pct = 1.0;
        fillPixels = this.pixels;
        stopAuto();
        document.getElementById("_submit").value = confirm_upload;
        document.getElementById("_submit").disabled = true;
        document.getElementById("msg").innerHTML = upgrade_success_note;
        jtProBar.display(false);
        setTimeout("toLogin()", 4000);
    }
    this.fillDIV.innerHTML = (100 * pct).toFixed(0) + "%";
    this.fillDIV.style.width = fillPixels + "px";
}

syj.ProgressBar.prototype.display = function(v) {
    this.parent.style.display = v == true ? 'block' : 'none';
}

//初始化进度条


function initBar() {
    window.jtProBar = new syj.ProgressBar(document.getElementById("progressBar"), barWidth, "bgBar");
    jtProBar.display(true);
    startAuto();
}

function startAuto() {
    if (window.thread == null) window.thread = window.setInterval("updatePercent()", barTimer);
}

function stopAuto() {
    window.clearInterval(window.thread);
    window.thread = null;
}

function updatePercent() {
    if (window.count == null) window.count = 0;
    window.count = count % barWidth;
    jtProBar.setPercent(window.count / barWidth);
    window.count++;
}

function toLogin() {
    $.cookie('lstatus', false, {
        path: '/'
    });
    document.location = 'http://' + document.domain + "/index.html?tt=" + new Date().getTime();
}

function getLanDHCP() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=dhcpd&function=get&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                $("#lan_ip").val(data.ip).siblings("label").hide();
                $("#lan_mask").val(data.mask).siblings("label").hide();
                $("#lan_ip_start").val(data.start).siblings("label").hide();
                $("#lan_ip_end").val(data.end).siblings("label").hide();
                $("#lanIpMark").val(data.ip);
                if (data.enable == 0) {
                    $("#dhcp_onoff").removeClass('open3');
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function setLanDHCP(ip, mask, start, end, enable, ipMark) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=dhcpd&function=set&start=" + start + "&end=" + end + "&mask=" + mask + "&ip=" + ip + "&enable=" + enable + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error != 0) {
                locationUrl(data.error);
                $("#lan_btn").attr('disabled', false);
                $("#lan_btn").val(re_configure);
            } else {
                if (ip == ipMark) {
                    getMsg(configure_success);
                    $("#lan_btn").attr('disabled', false);
                }
            }
        }
    });
}

//设置路由登录账户


function setUserAccount(oldpwd, newpwd) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=account&function=set&oldusrid=" + oldpwd + "&newusrid=" + newpwd + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(data) {
            if (data.error == 0) {
                getMsg(modify_password_success_note);
                setTimeout(function() {
                    $.cookie('lstatus', false, {
                        path: '/'
                    });
                    document.location = 'http://' + document.domain + '/index.html?tt=' + new Date().getTime();
                }, 3000);
            } else {
                locationUrl(data.error);
            }
        }
    });
}

//获取/授权访客列表


function wifiGuestList(fun, mac, action) {
    var data = "fname=net&opt=vap_host&function=" + fun;
    if (mac != '' && fun == 'set') {
        data = "fname=net&opt=vap_host&function=" + fun + "&mac=" + mac + "&action=" + action;
    }
    $.ajax({
        type: "POST",
        url: actionUrl + data + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(json) {
            if (json.error == 0) {
                if (mac != '' && fun == 'set') {
                    getMsg(setting_success);
                } else {
                    var len = json.guests.length;
                    var guestList = json.guests;
                    var html = '';
                    var switchClass = '';
                    var guestName = '';
                    if (len > 0) {
                        for (var i = 0; i < len; i++) {
                            if (MODEL[guestList[i].vender] !== undefined) {
                                guestName = MODEL[guestList[i].vender] + "-" + guestList[i].name;
                            } else {
                                guestName = guestList[i].name;
                            }
                            switchClass = switch_open(guestList[i].wlist, 4);
                            html += '<tr><td><div class="client-name">' + guestName + '</div></td><td><div class="tbDiv"><i class="' + switchClass + '" data=' + guestList[i].mac + '></i></div></td></tr>';
                        }
                        $("#visit_mode_div").show();
                        $("#guestList").empty().html(html);
                    } else {
                        $("#visit_mode_div").hide();
                    }
                }
            } else {
                locationUrl(json.error);
            }
        }
    });
}

function system_log(type) {
    var requrl = actionUrl + 'fname=sys&opt=sys_log&function=get&math=' + Math.random();
    if (type == 1) {
        requrl = actionUrl + 'fname=sys&opt=sys_log&function=set&math=' + Math.random();
    } else {
        loading(2, i18n_loading);
    }
    $.get(requrl, function(json) {
        if (json.error == 0) {
            if (json.count > 0) {
                var logs = json.sys_logs;
                var html = '';
                var logtime;
                for (var i = json.count - 1; i >= 0; i--) {
                    logtime = json.sys_logs[i].time;
                    if (i % 2 == 0) {
                        html += '<tr class="even"><td width="300">' + logtime + '</td><td class="nobd">' + logs[i].event + '</td></tr>';
                    } else {
                        html += '<tr><td width="300">' + logtime + '</td><td class="nobd">' + logs[i].event + '</td></tr>';
                    }
                }
                $("#count_log").empty().text(json.count);
                $("#log_list").empty().html(html);
            } else {
                $("#count_log").empty();
                $("#log_list").empty();
            }
            layer.closeAll();
        } else {
            locationUrl(json.error);
        }
    }, 'json');
}

function GetProgressBar(text) {
    layer.open({
        type: 1,
        closeBtn: false,
        content: '<div style="padding:10px 20px;background:#fff;text-align:center;">' + text + '</div><div id="progressBar2" class="progress"><div id="progressBar_Track2"></div></div><p id="progressBarTxt2"></p>',
        area: ['260px', '180px'],
        titile: ["Info"]
    });
    var ProgressBar = {
        maxValue: 100,
        value: 0,
        SetValue: function(aValue) {
            this.value = aValue;
            if (this.value >= this.maxValue) this.value = this.maxValue;
            if (this.value <= 0) this.value = 0;
            var mWidth = this.value / this.maxValue * $("#progressBar2").width() + "px";
            $("#progressBar_Track2").css("width", mWidth);
            $("#progressBarTxt2").html(this.value + "/" + this.maxValue);
        }
    }
    //设置最大值
    ProgressBar.maxValue = 100;
    //设置当前刻度
    var index = 0;
    var mProgressTimer = setInterval(function() {
        index += 2.5;
        if (index > 99) {
            window.clearInterval(mProgressTimer);
            ProgressBar.SetValue(0);
            layer.closeAll();
        }
        ProgressBar.SetValue(index.toFixed(2));
    }, 1000);
    setTimeout(function() {
        $.cookie('lstatus', false, {
            path: '/'
        });
        document.location = 'http://' + document.domain + '/index.html?tt=' + new Date().getTime();
    }, 40000);
}

function getHostRaMac(type, Id) {
    if (Id == 'macChoose1') {
        Id = 1;
    } else if (Id == 'macChoose2') {
        Id = 2
    } else if (Id == 'macChoose3') {
        Id = 3;
    }
    if (wanConfigJsonObject.mode != '' || wanConfigJsonObject.mode !== undefined) {
        if (type == 2) {
            $("#mac_box" + Id).show().text(wanConfigJsonObject.hostmac);
        } else if (type == 3) {
            $("#mac_box" + Id).show().text(wanConfigJsonObject.rawmac);
        }
    }
}

function getCloneMac(clone) {
    var mac;
    if (clone == 2) {
        mac = wanConfigJsonObject.hostmac;
    } else if (clone == 3) {
        mac = wanConfigJsonObject.rawmac;
    }
    return mac;
}

function removeDownClient(tr, mac) {
    $.ajax({
        type: "POST",
        url: actionUrl + 'fname=net&opt=host_del_history&function=set&mac=' + mac + "&math=" + Math.random(),
        dataType: "JSON",
        success: function(json) {
            if (json.error == 0) {
                getMsg(remove_offline_client_success);
                $("#devices").find('tr').eq(tr).remove();
            } else {
                locationUrl(json.error);
            }
        }
    });
}

function update_logout_timer() {
    if (window.__logout_timer) clearTimeout(window.__logout_timer)

    window.__logout_timer = setTimeout(toLogin, 600000);
}