var before_down_bytes = 0;
var before_up_bytes = 0
var intervalTimerCount = 0;
var commonInterval = 4000;
var common_total_speed = 0;
var common_speed_step = 100;
var common_speed_min = 5;
var ledStatus = false;
var interval_flag = false;
var regexp = RegExp(/[\':;*?~`!@#$%^&+={}\[\]\<\\(\),\.\。\，]/);
var MODEL = new Array("Other", "华为", "小米", "魅族", "磊科", "联想", "长虹", "HTC", "苹果", "三星", "诺基亚", "索尼", "酷派", "OPPO", "LG", "中兴", "步步高VIVO", "摩托罗拉", "金立", "天语", "TCL", "飞利浦", "戴尔", "惠普", "华硕", "东芝", "宏碁", "海信", "腾达", "TPLINK", "一加", "锤子", "瑞昱", "清华同方", "触云", "创维", "康佳", "乐视", "海尔", "夏普", "VMware", "Intel", "技嘉", "海华", "Other", "Other", "Other", "Other", "仁宝", "Other", "糖葫芦", "Other", "Other", "谷歌", "天珑", "泛泰", "Other", "Other", "微软", "极路由", "奇虎360", "水星", "华勤", "安利", "富士施乐", "D-Link", "网件", "阿里巴巴", "微星", "TCT", "莱蒙", "高科", "Nexus", "朵唯", "小辣椒", "语信", "欧博信", "爱立顺", "蓝魔", "海美迪", "优尔得", "夏新", "金讯宏盛", "E派", "同洲", "海客", "天迈通讯", "尚锋", "蓝博兴", "斐讯", "七彩虹", "酷鸽", "欧新", "佳域", "艾优尼", "亿通", "唯乐", "大成", "酷比魔方", "本为", "国虹", "VINUS", "强者", "爱可视", "迈乐", "汇科", "富可视", "先锋", "奥克斯", "波导", "邦华", "神舟", "宏为", "英特奇", "酷宝", "欧比", "昂达", "卓酷", "高新奇", "广信", "酷比", "酷博", "维图", "飞秒", "果米", "米歌", "米蓝", "诺亚信", "糯米", "腾信时代", "小霸王", "华星", "UBTEL", "neken", "真米", "MTK", "思科", "必联");
var actionUrl = document.domain;
if (actionUrl != null && actionUrl != "") {
    actionUrl = "http://" + actionUrl + "/router.csp?";
} else {
    alert(get_gateway_failed);
}

var browser = {
    versions: function() {
        var u = navigator.userAgent,
            app = navigator.appVersion;
        return {
            trident: u.indexOf('Trident') > -1,
            //IE内核
            presto: u.indexOf('Presto') > -1,
            //opera内核
            webKit: u.indexOf('AppleWebKit') > -1,
            //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,
            //火狐内核
            mobile: !! u.match(/AppleWebKit.*Mobile.*/),
            //是否为移动终端
            ios: !! u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
            //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1,
            //android终端或uc浏览器
            iPhone: u.indexOf('iPhone') > -1,
            //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1,
            //是否iPad
            webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
        };
    }(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
}

/*
 * MAP对象，实现MAP功能
 */

function Map() {
    this.elements = new Array();

    //获取MAP元素个数
    this.size = function() {
        return this.elements.length;
    }

    //判断MAP是否为空
    this.isEmpty = function() {
        return (this.elements.length < 1);
    }

    //删除MAP所有元素
    this.clear = function() {
        this.elements = new Array();
    }

    //向MAP中增加元素（key, value)
    this.put = function(_key, _value) {
        this.elements.push({
            key: _key,
            value: _value
        });
    }

    //删除指定KEY的元素，成功返回True，失败返回False
    this.remove = function(_key) {
        var bln = false;
        try {
            for (i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key) {
                    this.elements.splice(i, 1);
                    return true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    }

    //获取指定KEY的元素值VALUE，失败返回NULL
    this.get = function(_key) {
        try {
            for (i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key) {
                    return this.elements[i].value;
                }
            }
        } catch (e) {
            return null;
        }
    }

    //获取指定索引的元素（使用element.key，element.value获取KEY和VALUE），失败返回NULL
    this.element = function(_index) {
        if (_index < 0 || _index >= this.elements.length) {
            return null;
        }
        return this.elements[_index];
    }

    //判断MAP中是否含有指定KEY的元素
    this.containsKey = function(_key) {
        varbln = false;
        try {
            for (i = 0; i < this.elements.length; i++) {
                if (this.elements[i].key == _key) {
                    bln = true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    }

    //判断MAP中是否含有指定VALUE的元素
    this.containsValue = function(_value) {
        var bln = false;
        try {
            for (i = 0; i < this.elements.length; i++) {
                if (this.elements[i].value == _value) {
                    bln = true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    }

    //获取MAP中所有VALUE的数组（ARRAY）
    this.values = function() {
        var arr = new Array();
        for (i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].value);
        }
        return arr;
    }

    //获取MAP中所有KEY的数组（ARRAY）
    this.keys = function() {
        var arr = new Array();
        for (i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].key);
        }
        return arr;
    }
}

var terminal_speed_map = new Map();

/*
 * 去重字符串两边空格
 */

function trim(str) {
    regExp1 = /^ */;
    regExp2 = / *$/;
    return str.replace(regExp1, '').replace(regExp2, '');
}

/*
 * 转换时间为两位数字
 */

function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }
    return i
}

/*
 * 映射端口port 重复验证
 */

function checkMapPort(port) {
    var result = true;
    $("#host_nat tr td:nth-child(1)").each(function(key, value) {
        if (port == $(this).text()) {
            result = false;
            return false;
        };
    });
    return result;
}

/*
 * 验证MAC
 */

function checkMac(mac) {
    mac = mac.toUpperCase();
    if (mac == "" || mac.indexOf(":") == -1) {
        return false;
    } else {
        var macs = mac.split(":");
        if (macs.length != 6) {
            return false;
        }
        for (var i = 0; i < macs.length; i++) {
            if (macs[i].length != 2) {
                return false;
            }
        }
        var reg_name = /[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}/;
        if (!reg_name.test(mac)) {
            return false;
        }
        if (mac == "FF:FF:FF:FF:FF:FF" || mac == "00:00:00:00:00:00") {
            return false;
        }
    }
    return true;
}

/*
 * 获取URL参数值
 */

function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}
/*
 * 检查域名是否合法
 */

function checkDomain(domain) {
    var obj = domain;
    var exp = /[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+/;
    var reg = obj.match(exp);
    if (reg == null) {
        return false;
    } else {
        return true;
    }
}
/*
 * 检查IP是否合法
 */

function checkIP(ip) {
    var obj = ip;
    var exp = /(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.([1-9]{1,2}|1\d\d|2[0-4]\d|25[0-4])|50$/;
    var reg = obj.match(exp);
    if (reg == null) {
        return false;
    } else {
        return true;
    }
}
/*
 * 检查掩码是否合法
 */

function checkMask(mask) {
    var obj = mask;
    var exp = /^(254|252|248|240|224|192|128)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/;
    var reg = obj.match(exp);
    if (reg == null) {
        return false;
    } else {
        return true;
    }
}

/*
 * 设置 select 默认值
 */

function selectValue(sId, value) {
    var s = document.getElementById(sId);
    var ops = s.options;
    for (var i = 0; i < ops.length; i++) {
        var tempValue = ops[i].value;
        if (tempValue == value) {
            ops[i].selected = true;
        }
    }
}

/*
 * 功能：实现IP地址，子网掩码，网关的规则验证
 * 参数：IP地址，子网掩码，网关
 * 返回值：BOOL
 */
var validateNetwork = function(ip, netmask, gateway) {
        var parseIp = function(ip) {
                return ip.split(".");
            }
        var conv = function(num) {
                var num = parseInt(num).toString(2);
                while ((8 - num.length) > 0)
                num = "0" + num;
                return num;
            }
        var bitOpera = function(ip1, ip2) {
                var result = '',
                    binaryIp1 = '',
                    binaryIp2 = '';
                for (var i = 0; i < 4; i++) {
                    if (i != 0) result += ".";
                    for (var j = 0; j < 8; j++) {
                        result += conv(parseIp(ip1)[i]).substr(j, 1) & conv(parseIp(ip2)[i]).substr(j, 1)
                    }
                }
                return result;
            }
        var ip_re = /^(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])$/;
        if (ip == null || netmask == null || gateway == null) {
            return false;
        }
        if (!ip_re.test(ip) || !ip_re.test(netmask) || !ip_re.test(gateway)) {
            return false
        }
        return bitOpera(ip, netmask) == bitOpera(netmask, gateway);
    }

    /**
     * [isEqualIPAddress 判断两个IP地址是否在同一个网段]
     * @param  {[String]}  addr1 [地址一]
     * @param  {[String]}  addr2 [地址二]
     * @param  {[String]}  mask  [子网掩码]
     * @return {Boolean}     [true or false]
     */

function isEqualIPAddress(addr1, addr2, mask) {
    if (!addr1 || !addr2 || !mask) {
        //    getMsg("各参数不能为空");
        return false;
    }
    var res1 = [],
        res2 = [];
    addr1 = addr1.split(".");
    addr2 = addr2.split(".");
    mask = mask.split(".");
    for (var i = 0, ilen = addr1.length; i < ilen; i += 1) {
        res1.push(parseInt(addr1[i]) & parseInt(mask[i]));
        res2.push(parseInt(addr2[i]) & parseInt(mask[i]));
    }
    if (res1.join(".") == res2.join(".")) {
        return true;
    } else {
        return false;
    }
}

/*
 * 获取错误码
 */

function getErrorCode(type) {
    switch (type) {
    case 19:
        return pppoe_un_pw_error;
        break;
    case 20:
        return pppoe_no_response;
        break;
    case 10001:
        return get_params_failed;
        break;
    case 10002:
        return params_invalid;
        break;
    case 10003:
        return out_of_memory;
        break;
    case 10004:
        return item_existed;
        break;
    case 10005:
        return item_donot_exist;
        break;
    case 10006:
        return item_full;
        break;
    case 10007:
        return no_login;
        break;
    case 10008:
        return unspport;
        break;
    case 10009:
        return failed_to_get_account;
        break;
    case 10010:
        return time_expire;
        break;
    case 10011:
        return invalid_oldpwd;
        break;
    case 10012:
        return firmware_format_error;
        break;
    default:
        return request_timeout_and_errcode + type;
    }
}

/*
 * 转换tcp/udp
 */

function changeTcpUdp(tu) {
    tu = parseInt(tu);
    switch (tu) {
    case 1:
        return 'TCP';
        break;
    case 2:
        return 'UDP';
        break;
    default:
        return 'TCP/UDP';
    }
}

function changeTuNum(tu) {
    switch (tu) {
    case 'TCP':
        return 1;
        break;
    case 'UDP':
        return 2;
        break;
    default:
        return 3;
    }
}

//转换open/close


function switch_open(op, num) {
    var enable = 'switch' + num;
    if (op == 1) {
        enable = 'switch' + num + ' open' + num;
    } else if (op == 0) {
        enable = 'switch' + num;
    }
    return enable;
}


//网络配置四种模式显示


function netTypeChoice(type) {
    $("#netWorkSet").show().siblings(".wrap").hide();
    if (type == 1) {
        $("#t_3").addClass('selected');
        $("#t_1").removeClass('selected');
        $("#t_2").removeClass('selected');
        $("#t_4").removeClass('selected');
        $("#t_3_box").show();
        $("#t_1_box").hide();
        $("#t_2_box").hide();
        $("#t_4_box").hide();
        showDHCP();
    } else if (type == 2 || type == 0) {
        $("#t_1").addClass('selected');
        $("#t_2").removeClass('selected');
        $("#t_3").removeClass('selected');
        $("#t_4").removeClass('selected');
        $("#t_1_box").show();
        $("#t_2_box").hide();
        $("#t_3_box").hide();
        $("#t_4_box").hide();
        if (wanConfigJsonObject.user != '' && typeof(wanConfigJsonObject.user) != 'undefined') {
            showPPOE();
        }
    } else if (type == 3) {
        $("#t_2").addClass('selected');
        $("#t_1").removeClass('selected');
        $("#t_3").removeClass('selected');
        $("#t_4").removeClass('selected');
        $("#t_1_box").hide();
        $("#t_3_box").hide();
        $("#t_2_box").show();
        $("#t_4_box").hide();
        if (wanConfigJsonObject.ip != '' && typeof(wanConfigJsonObject.ip) != 'undefined') {
            showStatic();
        }
    } else if (type == 4) {
        $("#t_4").addClass('selected');
        $("#t_1").removeClass('selected');
        $("#t_2").removeClass('selected');
        $("#t_3").removeClass('selected');
        $("#t_1_box").hide();
        $("#t_2_box").hide();
        $("#t_3_box").hide();
        $("#t_4_box").show();
        $("#mac_panel").hide();
        getWifiList();
        if (wanConfigJsonObject.oldmode == 2) {
            showPPOE();
        } else if (wanConfigJsonObject.oldmode == 3) {
            showStatic();
        } else if (wanConfigJsonObject.oldmode == 1) {
            showDHCP();
        }

        if (wanInfoJsonObject.mode == 2) {
            showPPOE();
        } else if (wanInfoJsonObject.mode == 3) {
            showStatic();
        } else if (wanInfoJsonObject.mode == 1) {
            showDHCP();
        }
    }
}

function showPPOE() {
    if (wanConfigJsonObject.user != '' && typeof(wanConfigJsonObject.user) != 'undefined') {
        $("#acc").val(wanConfigJsonObject.user).siblings("label").hide();
        $("#pwd").val(wanConfigJsonObject.passwd).siblings("label").hide();
        $("#pp_mtu").val(wanConfigJsonObject.mtu).siblings("label").hide();
        if (trim(wanConfigJsonObject.dns) != '') {
            $("#pp_dns").val(wanConfigJsonObject.dns).siblings("label").hide();
        }
        if (trim(wanConfigJsonObject.dns1) != '') {
            $("#pp_dns1").val(wanConfigJsonObject.dns1).siblings("label").hide();
        }
        $("#mac_box1").text(wanConfigJsonObject.mac);
        if (wanConfigJsonObject.mac == wanConfigJsonObject.hostmac) {
            $("#macChoose1 option[value=2]").attr('selected', 'selected');
        } else if (wanConfigJsonObject.mac == wanConfigJsonObject.rawmac) {
            $("#macChoose1 option[value=3]").attr('selected', 'selected');
        } else {
            $("#mac_box1").hide();
            $("#macChoose1 option[value=1]").attr('selected', 'selected');
            $("#macEnter1").val(wanConfigJsonObject.mac).parent('span').show();
        }

        if (wanConfigJsonObject.oldmode == 2) {
            if (trim(wanConfigJsonObject.olddns) != '') {
                $("#pp_dns").val(wanConfigJsonObject.olddns).siblings("label").hide();
            }
            if (trim(wanConfigJsonObject.olddns1) != '') {
                $("#pp_dns1").val(wanConfigJsonObject.olddns1).siblings("label").hide();
            }
            $("#pp_mtu").val(wanConfigJsonObject.oldmtu).siblings("label").hide();
        }
    }
    var li = $("#t_1_box ul").find('li');
    if (wanConfigJsonObject.dns == '' && wanConfigJsonObject.dns1 == '') {
        if (wanConfigJsonObject.oldmode == undefined) {
            li.each(function(index) {
                if (index > 1) {
                    $(this).hide();
                    $("#PpoeHightSet").text(adv_cfg);
                }
            });
        } else if ((wanConfigJsonObject.olddns !== undefined && wanConfigJsonObject.olddns != '') || (wanConfigJsonObject.olddns1 !== undefined && wanConfigJsonObject.olddns1 != '')) {
            li.each(function(index) {
                if (index > 1) {
                    $(this).show();
                    $("#PpoeHightSet").text(sim_cfg);
                }
            });
        }
    } else {
        li.each(function(index) {
            if (index > 1) {
                $(this).show();
                $("#PpoeHightSet").text(sim_cfg);
            }
        });
    }
}

function showDHCP() {
    if (trim(wanConfigJsonObject.dns) != '') {
        $("#dhcp_dns").val(wanConfigJsonObject.dns).siblings("label").hide();
    }
    if (trim(wanConfigJsonObject.dns1) != '') {
        $("#dhcp_dns1").val(wanConfigJsonObject.dns1).siblings("label").hide();
    }
    $("#dhcp_mtu").val(wanConfigJsonObject.mtu).siblings("label").hide();
    $("#mac_box3").text(wanConfigJsonObject.mac);
    if (wanConfigJsonObject.mac == wanConfigJsonObject.hostmac) {
        $("#macChoose3 option[value=2]").attr('selected', 'selected');
    } else if (wanConfigJsonObject.mac == wanConfigJsonObject.rawmac) {
        $("#macChoose3 option[value=3]").attr('selected', 'selected');
    } else {
        $("#mac_box3").hide();
        $("#macChoose3 option[value=1]").attr('selected', 'selected');
        $("#macEnter3").val(wanConfigJsonObject.mac).parent('span').show();
    }

    if (wanConfigJsonObject.oldmode == 1) {
        if (trim(wanConfigJsonObject.olddns) != '') {
            $("#dhcp_dns").val(wanConfigJsonObject.olddns).siblings("label").hide();
        }
        if (trim(wanConfigJsonObject.olddns1) != '') {
            $("#dhcp_dns1").val(wanConfigJsonObject.olddns1).siblings("label").hide();
        }
        $("#dhcp_mtu").val(wanConfigJsonObject.oldmtu).siblings("label").hide();
    }



    var li = $("#t_3_box ul").find('li');
    if (wanConfigJsonObject.dns == '' && wanConfigJsonObject.dns1 == '') {
        if (wanConfigJsonObject.oldmode == undefined) {
            li.each(function() {
                $(this).hide();
                $("#DhcpHightSet").text(adv_cfg);
            });
        } else if ((wanConfigJsonObject.olddns !== undefined && wanConfigJsonObject.olddns != '') || (wanConfigJsonObject.olddns1 !== undefined && wanConfigJsonObject.olddns1 != '')) {
            li.each(function() {
                $(this).show();
                $("#DhcpHightSet").text(sim_cfg);
            });
        }
    } else {
        li.each(function() {
            $(this).show();
            $("#DhcpHightSet").text(sim_cfg);
        });
    }
}

function showStatic() {
    if (wanConfigJsonObject.ip != '' && typeof(wanConfigJsonObject.ip) != 'undefined') {
        $("#static_ip").val(wanConfigJsonObject.ip).siblings("label").hide();
        $("#static_mask").val(wanConfigJsonObject.mask).siblings("label").hide();
        $("#static_gw").val(wanConfigJsonObject.gw).siblings("label").hide();
        if (trim(wanConfigJsonObject.dns) != '') {
            $("#static_dns").val(wanConfigJsonObject.dns).siblings("label").hide();
        }
        if (trim(wanConfigJsonObject.dns1) != '') {
            $("#static_dns1").val(wanConfigJsonObject.dns1).siblings("label").hide();
        }
        $("#static_mtu").val(wanConfigJsonObject.mtu).siblings("label").hide();

        $("#mac_box2").text(wanConfigJsonObject.mac);
        if (wanConfigJsonObject.mac == wanConfigJsonObject.hostmac) {
            $("#macChoose2 option[value=2]").attr('selected', 'selected');
        } else if (wanConfigJsonObject.mac == wanConfigJsonObject.rawmac) {
            $("#macChoose2 option[value=3]").attr('selected', 'selected');
        } else {
            $("#mac_box2").hide();
            $("#macChoose2 option[value=1]").attr('selected', 'selected');
            $("#macEnter2").val(wanConfigJsonObject.mac).parent('span').show();
        }

        if (wanConfigJsonObject.oldmode == 3) {
            if (trim(wanConfigJsonObject.olddns) != '') {
                $("#static_dns").val(wanConfigJsonObject.olddns).siblings("label").hide();
            }
            if (trim(wanConfigJsonObject.olddns1) != '') {
                $("#static_dns1").val(wanConfigJsonObject.olddns1).siblings("label").hide();
            }
            $("#static_mtu").val(wanConfigJsonObject.oldmtu).siblings("label").hide();
        }


        myStaticIp = wanConfigJsonObject.ip;
        myStaticMask = wanConfigJsonObject.mask;
        myStaticGw = wanConfigJsonObject.gw;
        myStaticDns = wanConfigJsonObject.dns;
    }
    var li = $("#t_2_box ul").find('li');
    if (wanConfigJsonObject.dns == '' && wanConfigJsonObject.dns1 == '') {
        if (wanConfigJsonObject.oldmode == undefined) {
            li.each(function(index) {
                if (index > 2) {
                    $(this).hide();
                    $("#StaticHightSet").text(adv_cfg);
                }
            });
        } else if ((wanConfigJsonObject.olddns !== undefined && wanConfigJsonObject.olddns != '') || (wanConfigJsonObject.olddns1 !== undefined && wanConfigJsonObject.olddns1 != '')) {
            li.each(function(index) {
                if (index > 2) {
                    $(this).show();
                    $("#StaticHightSet").text(sim_cfg);
                }
            });
        }
    } else {
        li.each(function(index) {
            if (index > 2) {
                $(this).show();
                $("#StaticHightSet").text(sim_cfg);
            }
        });
    }
}

function toUrl() {
    document.location = 'http://' + document.domain + "/adv.html?tt=" + new Date().getTime();
}

function uniencode(text) {
    text = escape(text.toString()).replace(/\+/g, "%u2");
    var matches = text.match(/(%([0-9A-F]{2}))/gi);
    if (matches) {
        for (var matchid = 0; matchid < matches.length; matchid++) {
            var code = matches[matchid].substring(1, 3);
            if (parseInt(code, 16) >= 128) {
                text = text.replace(matches[matchid], '%u00' + code);
            }
        }
    }
    text = text.replace('%25', '%u0025');
    return text;
}


/*
 * 检测是否是手机
 */

function getMobile() {
    var mob = 0;
    if (browser.versions.mobile || browser.versions.android || browser.versions.iPhone) {
        mob = 1;
    }
    return mob;
}

function getMsg(msg, type, sid) {
    layer.closeAll();
    if (type == 1) {
        layer.tips(msg, sid, {
            tips: [1, '#000000']
        });
    } else {
        layer.msg(msg);
    }
}

/*
 * 设置wifi账户密码
 */

function setWifiAp(ssid, security, pwd, channel, hidden_ssid, hidden_all, wifiBandwidth, _5g) {
    var suffix = _5g ? "_5g" : "";
    var dat = "fname=net&opt=wifi_ap" + suffix + "&function=set&ssid=" + ssid + "&security=" + security + "&passwd=" + pwd + "&hidden=" + hidden_ssid + "&hiddenall=" + hidden_all + "&channel=" + channel + "&bw=" + wifiBandwidth;
    $.ajax({
        type: "POST",
        url: actionUrl + dat + "&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                getMsg(setting_success);
                $("#wifi_name" + suffix).text(ssid);
                $("#wifi_password" + suffix).text(pwd);
            } else {
                locationUrl(data.error);
            }
        }
    });
}

/*
 设置终端昵称
 */
function setTerminalNick(mac, nick) {
    var macTmp = mac.replace(/:/g, "");
    var macNick = $("#h_nick_" + macTmp).val();
    //alert(encodeURIComponent(macNick) + "   " + nick);
    if (encodeURIComponent(macNick) != nick) {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=host_nick&function=set&mac=" + mac + "&nick=" + nick + "&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                if (data.error == 0) {} else {
                    locationUrl(data.error);
                }
            }
        });
    }
}


/*
 设置终端网络禁用
 */
function setTerminalForbidden(mac, act) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=host_black&function=set&mac=" + mac + "&act=" + act + "&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {} else {
                locationUrl(data.error);
            }
        }
    });
}


/*
 设置终端上传下载速度
 */
function setTerminalSpeed(mac, down_speed, up_speed) {
    var macTmp = mac.replace(/:/g, "");
    var macDownSpeed = $("#h_d_" + macTmp).val() == unlimit ? "0" : $("#h_d_" + macTmp).val();
    var macUpSpeed = $("#h_u_" + macTmp).val() == unlimit ? "0" : $("#h_u_" + macTmp).val();

    if (macDownSpeed != down_speed || macUpSpeed != up_speed) {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=host_ls&function=set&mac=" + mac + "&speed=" + down_speed + "&up_speed=" + up_speed + "&math=" + Math.random(),
            //  kbyte -- > kbit
            dataType: "json",
            success: function(data) {
                if (data.error == 0) {} else {
                    locationUrl(data.error);
                }
            }
        });
    }
}

function getStrLength(str) {
    var realLength = 0,
        len = str.length,
        charCode = -1;
    for (var i = 0; i < len; i++) {
        charCode = str.charCodeAt(i);
        if (charCode > 0 && charCode <= 128) {
            realLength += 1;
        } else {
            realLength += 3;
        }
    }
    return realLength;
}

function getLedLogin() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=led&function=get&math=" + Math.random(),
        async: false,
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                ledStatus = data.status;
            } else {
                locationUrl(data.error);
            }
        },
        error: function() {
            ledStatus = false;
        }
    });
    return ledStatus;
}

/* upnp设置 */

function setUPnP(state) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=net&opt=upnp&function=set&state=" + state + "&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                getMsg(setting_success);
            } else {
                locationUrl(data.error);
            }
        }
    });
}

/*
 * 终端列表
 */

function getClientList() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=main&function=get&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            var jsonObject = data;
            if (jsonObject.error == 0) {
                var terminals = jsonObject.terminals;
                var html = '';
                var html2 = '';
                var mac_mark = '';
                if (terminals != null && terminals.length > 0) {
                    for (var i = 0; i < terminals.length; i++) {
                        var model = "";
                        if (MODEL != null) {
                            if (MODEL[terminals[i].vendor] === undefined) {
                                MODEL[terminals[i].vendor] == '';
                            } else {
                                model = MODEL[terminals[i].vendor] + "-";
                            }
                        }
                        var device_name;
                        if (terminals[i].flag.substr(6, 1) == 'T') {
                            device_name = terminals[i].name;
                        } else if (terminals[i].vendor == 34) {
                            mac_mark = terminals[i].mac.replace(/:/g, "");
                            device_name = mac_mark.substr(-4, 4);
                        } else {
                            device_name = terminals[i].name;
                        }

                        if (terminals[i].flag.substr(1, 1) == 'T') {
                            html += "<option ip=" + terminals[i].ip + " mac=" + terminals[i].mac + ">" + device_name + "</option>";
                            if (i == 0) {
                                hostNatList('get', terminals[i].mac, '', 'dump');
                            }
                        }

                        if (terminals[i].flag.substr(1, 1) == 'F') {
                            html2 += "<option mac=" + terminals[i].mac + ">" + device_name + "</option>";
                        }
                    }
                }
                $("#client_list").html(html + html2);

                /* upnp */
                if (jsonObject.upnpon == false) {
                    $("#upnp_list").hide();
                    $("#upnp_switch").removeClass("open2");
                } else {
                    var content = "";
                    var upnpmappings = jsonObject.upnpmappings;
                    for (var i = 0; i < upnpmappings.length; i++) {
                        content += "<tr><td>" + upnpmappings[i].desc + "</td><td>" + upnpmappings[i].proto + "</td><td>" + upnpmappings[i].extport + "</td><td>" + upnpmappings[i].interip + "</td><td>" + upnpmappings[i].interport + "</td></tr>";
                    }

                    $("#upnp_list table tbody").html(content);
                    $("#upnp_switch").addClass("open2");
                    $("#upnp_list").show();
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

/*
 * 秒转时分秒
 */

function formatSeconds(value) {
    var theTime = parseInt(value); // 秒
    var theTime1 = 0; // 分
    var theTime2 = 0; // 小时
    // alert(theTime);
    if (theTime > 60) {
        theTime1 = parseInt(theTime / 60);
        theTime = parseInt(theTime % 60);
        // alert(theTime1+"-"+theTime);
        if (theTime1 > 60) {
            theTime2 = parseInt(theTime1 / 60);
            theTime1 = parseInt(theTime1 % 60);
        }
    }
    var result = "" + parseInt(theTime) + __s;
    if (theTime1 > 0) {
        result = "" + parseInt(theTime1) + __m + result;
    }
    if (theTime2 > 0) {
        result = "" + parseInt(theTime2) + __h + result;
    }
    return result;
}

function sortOnLineList(obj) {
    var len = obj.length;
    for (var i = 0; i < len; i++) {
        if (obj[i].flag.substr(0, 1) == 'T') {
            obj[i] = 0;
        }
        console.log(obj[i].flag);
        if (obj[i].flag.substr(1, 1) == 'F') {
            obj[i] = obj[i] + 1;
        }
    }
}

function down(x, y) {
    return (x.ip.length < y.ip.length) ? 1 : -1;
}

var router = {
    //获取网络类型
    getWanInfo: function() {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=wan_info&function=get&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                var jsonObject = data;
                if (jsonObject.error == 0) {
                    $("#netType").text(getWanNetType(jsonObject.mode));
                    if (jsonObject.ip && jsonObject.ip != "") $("#wanIP").text(jsonObject.ip);
                    else $("#wanIP").text("...");
                    if (jsonObject.mac && jsonObject.mac != "") $('#macTy').text(jsonObject.mac);
                    else $('#macTy').text("...");
                    if (jsonObject.DNS1 && jsonObject.DNS1 != "") $("#dns1").text(jsonObject.DNS1);
                    else $("#dns1").text("...");
                    if (jsonObject.DNS2 && jsonObject.DNS2 != "") $("#dns2").text(jsonObject.DNS2);
                    else $("#dns2").text("...");
                    if (jsonObject.mask && jsonObject.mask != "") $("#mask").text(jsonObject.mask);
                    else $("#mask").text("...");
                    if (jsonObject.gateway && jsonObject.gateway != "") $("#gw").text(jsonObject.gateway);
                    else $("#gw").text("...");
                } else {
                    locationUrl(data.error);
                }
            }
        });
    },
    //获取LAN IP
    getLanIP: function() {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=dhcpd&function=get&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                var jsonObject = data;
                if (jsonObject.error == 0) {
                    $("#lanIP").html(jsonObject.ip);
                } else {
                    locationUrl(jsonObject.error);
                }
            }
        });
    },
    //获取QOS信息
    getQos: function() {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=qos&function=get&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                var jsonObject = data;
                if (jsonObject.error == 0) {
                    if (jsonObject.enable == 0) {
                        $("#totalSpeed").html("未知");
                    } else {
                        $("#totalSpeed").html((jsonObject.down / 1024).toFixed(0) + "Mb");
                    }
                } else {
                    locationUrl(jsonObject.error);
                }
            }
        });
    },
    //获取终端限速
    getTerminalLimitSpeed: function() {
        terminal_speed_map = new Map();
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=net&opt=host_if&function=get&if=FFFFFFFT&math=" + Math.random(),
            async: false,
            dataType: "json",
            success: function(data) {
                var jsonObject = data;
                if (jsonObject.error == 0) {
                    var terminals = jsonObject.terminals;
                    if (terminals != null && terminals.length > 0) {
                        for (var i = 0; i < terminals.length; i++) {
                            terminal_speed_map.put(terminals[i].mac, terminals[i].ls + ":" + terminals[i].ls_up);
                        }
                    }
                } else {
                    locationUrl(jsonObject.error);
                }
            },
            complete: function(XHR, TS) {
                XHR = null;
            },
            error: function(XHRequest, status, data) {
                XHRequest.abort();
            }
        });
    },
    //获取路由器动态信息
    getDynamicInfo: function() {
        router.getWanInfo();
        //router.getTerminalLimitSpeed();
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=system&opt=main&function=get&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                var jsonObject = data;
                var cur_speed, up_speed;

                if (jsonObject.error == 0) {
                    common_total_speed = jsonObject.total_speed;
                    if (jsonObject.connected == true) {
                        $("#netStatus").html(connected);
                        $(".state-img").removeClass('failed');
                    } else {
                        $("#netStatus").html(connecting);
                        $(".state-img").addClass('failed');
                    }
                    $("#ontime").text(formatSeconds(jsonObject.ontime));

                    if (jsonObject.connected == true) {
                        // down speed
                        var down_bytes = jsonObject.down_bytes;
                        if (before_down_bytes > down_bytes || !before_down_bytes) {
                            cur_speed = 0;
                        } else {
                            cur_speed = ((down_bytes - before_down_bytes) / 1024 / commonInterval * 1000).toFixed(2); // KB/S
                        }
                        before_down_bytes = down_bytes;

                        // up speed
                        var up_bytes = jsonObject.up_bytes;
                        if (before_up_bytes > up_bytes || !before_up_bytes) {
                            up_speed = 0;
                        } else {
                            up_speed = ((up_bytes - before_up_bytes) / 1024 / commonInterval * 1000).toFixed(2); // KB/S
                        }
                        before_up_bytes = up_bytes;


                        if ($("#netType").text() == "Wireless Repeat") {
                            cur_speed = cur_speed ^ up_speed;
                            up_speed = up_speed ^ cur_speed;
                            cur_speed = up_speed ^ cur_speed;
                        }
                    } else {
                        cur_speed = 0;
                        up_speed = 0;
                    }

                    if (parseInt(cur_speed) > 1024) {
                        $("#curSpeed").html((cur_speed / 1024).toFixed(2) + "<em>M/S</em>");
                        $('#macTy').text(jsonObject.mac);
                    } else {
                        $("#curSpeed").html(cur_speed + "<em>KB/S</em>");
                    }

                    if (parseInt(up_speed) > 1024) {
                        $("#up_speed").html((up_speed / 1024).toFixed(2) + "<em>M/S</em>");
                    } else {
                        $("#up_speed").html(up_speed + "<em>KB/S</em>");
                    }

                    /* sysinfo */
                    $("#version").html(data.version);
                    $("#hversion").html(data.hversion);
                    $("#slanip").html(data.ip);
                    $("#slanmask").html(data.mask);
                    $("#slanmac").html(data.mac);
                    $("#s24g_enable").html(data.s24g_enable ? wifi_enabled : wifi_disaled);
                    $("#s24g_ssid").html(data.s24g_ssid);
                    $("#s24g_mode").html(data.s24g_mode);
                    $("#s24g_mac").html(data.s24g_mac);
                    $("#s24g_channel").html((data.s24g_channel == "0") ? "Auto" : data.s24g_channel);
                    if (data.s24g_security == "none") $("#s24g_security").html("NONE");
                    else if (data.s24g_security == "psk") $("#s24g_security").html("WPAPSK");
                    else if (data.s24g_security == "psk2") $("#s24g_security").html("WPAPSK2");
                    else if (data.s24g_security == "psk+psk2") $("#s24g_security").html("WPAPSK/WPAPSK2");

                    $("#s5g_enable").html(data.s5g_enable ? wifi_enabled : wifi_disaled);
                    $("#s5g_ssid").html(data.s5g_ssid);
                    $("#s5g_mode").html(data.s5g_mode);
                    $("#s5g_mac").html(data.s5g_mac);
                    $("#s5g_channel").html((data.s5g_channel == "0") ? "Auto" : data.s5g_channel);
                    if (data.s5g_security == "none") $("#s5g_security").html("NONE");
                    else if (data.s5g_security == "psk") $("#s5g_security").html("WPAPSK");
                    else if (data.s5g_security == "psk2") $("#s5g_security").html("WPAPSK2");
                    else if (data.s5g_security == "psk+psk2") $("#s5g_security").html("WPAPSK/WPAPSK2");

                    /* terminal */
                    var terminals = jsonObject.terminals;
                    var html = "";
                    var html2 = "";
                    var sort = 0;
                    var switch_flag = "";
                    var wifi_flag = "";
                    var t_count = 0;
                    var mac_mark = '';
                    terminal_speed_map = new Map();
                    if (terminals != null && terminals.length > 0) {
                        for (var i = 0; i < terminals.length; i++) {
                            var model = "";
                            var device_name;
                            var flag = terminals[i].flag;

                            terminal_speed_map.put(terminals[i].mac, terminals[i].ls + ":" + terminals[i].ls_up);
                            if (flag.charCodeAt(1) == 84) { //T
                                t_count++;
                                sort++;
                            } else {
                                terminals[i].ip = offline;
                            }

                            if (MODEL != null) {
                                if (MODEL[terminals[i].vendor] === undefined) {
                                    MODEL[terminals[i].vendor] == '';
                                } else if (MODEL[terminals[i].vendor] == 'Other') {
                                    MODEL[terminals[i].vendor] == '';
                                } else {
                                    model = MODEL[terminals[i].vendor] + "-";
                                }
                            }
                            if (terminals[i].speed > 1024) {
                                terminals[i].speed = (terminals[i].speed / 1024).toFixed(2) + 'MB/S';
                            } else {
                                terminals[i].speed = terminals[i].speed + 'KB/S';
                            }

                            if (terminals[i].up_speed > 1024) {
                                terminals[i].up_speed = (terminals[i].up_speed / 1024).toFixed(2) + 'MB/S';
                            } else {
                                terminals[i].up_speed = terminals[i].up_speed + 'KB/S';
                            }

                            if (terminals[i].flag.substr(6, 1) == 'T') {
                                device_name = terminals[i].name;
                            } else if (terminals[i].vendor == 34) {
                                mac_mark = terminals[i].mac.replace(/:/g, "");
                                device_name = mac_mark.substr(-4, 4);
                            } else {
                                device_name = terminals[i].name;
                            }

                            if (terminals[i].flag.substr(0, 1) == 'T') {
                                $("#main_mac").val(terminals[i].mac);
                            }
                            if (terminals[i].flag.substr(2, 1) == 'F') {
                                switch_flag = 'switch open';
                            } else {
                                switch_flag = 'switch';
                            }
                            if (flag.charCodeAt(9) == 84) { //T
                                wifi_flag = "";
                            } else {
                                wifi_flag = "wifiOpen";
                            }
                            var tmp_down_speed = "0";
                            var tmp_up_speed = "0";
                            if (terminal_speed_map != null) {
                                if (terminal_speed_map.get(terminals[i].mac) != null) {
                                    tmp_down_speed = (terminal_speed_map.get(terminals[i].mac)).split(":")[0];
                                    tmp_up_speed = (terminal_speed_map.get(terminals[i].mac)).split(":")[1];
                                }
                                tmp_down_speed = tmp_down_speed == "0" ? unlimit : tmp_down_speed;
                                tmp_up_speed = tmp_up_speed == "0" ? unlimit : tmp_up_speed;
                            }
                            if (terminals[i].flag.substr(1, 1) == 'T') {
                                html += '<tr mac="' + terminals[i].mac + '">';
                                html += "<td><div class='tbDiv'><span class='name'><input type='hidden' id='h_nick_" + terminals[i].mac.replace(/:/g, "") + "' value='" + device_name + "' title='" + device_name + "'><input type='text' readonly='readonly' class='tbInpt nameInpt' value='" + device_name + "' title='" + device_name + "'></span><span class='small'><i class='tbicon-1 " + wifi_flag + "'></i>" + terminals[i].ip + "<br>" + terminals[i].mac + "</span></div></td>";
                                html += "<td width='60'><div class='tbDiv'><i class='tbicon-2 edit'></i></div></td>";
                                html += "<td><div class='tbDiv'><i class='tbicon-3'></i>" + terminals[i].speed + "</div></td>";
                                html += "<td><div class='tbDiv'><i class='tbicon-4'></i>" + terminals[i].up_speed + "</div></td>";
                                html += "<td><div class='tbDiv'><span><input type='hidden' id='h_d_" + terminals[i].mac.replace(/:/g, "") + "' value='" + tmp_down_speed + "'><input type='text' id='ds_" + i + "' class='tbInpt limit dsLimit' value='" + tmp_down_speed + "'></span><div class='progress' id='slider_" + terminals[i].mac.replace(/:/g, "") + "_1'></div></div></td>";
                                html += "<td><div class='tbDiv'><span><input type='hidden' id='h_u_" + terminals[i].mac.replace(/:/g, "") + "' value='" + tmp_up_speed + "'><input type='text' id='us_" + i + "' class='tbInpt limit usLimit' value='" + tmp_up_speed + "'></span><div class='progress' id='slider_" + terminals[i].mac.replace(/:/g, "") + "_2'></div></div></td>";
                                html += "<td><div class='tbDiv'><i class='" + switch_flag + "'></i></div></td>";
                                html += '</tr>';
                            }

                            if (terminals[i].flag.substr(1, 1) == 'F') {
                                html2 += '<tr mac="' + terminals[i].mac + '">';
                                html2 += "<td><div class='tbDiv'><span class='name'><input type='hidden' id='h_nick_" + terminals[i].mac.replace(/:/g, "") + "' value='" + device_name + "' title='" + device_name + "'><input type='text' readonly='readonly' class='tbInpt nameInpt' value='" + device_name + "' title='" + device_name + "'></span><span class='small'><i class='tbicon-1 " + wifi_flag + "'></i>" + terminals[i].ip + "</span></div></td>";
                                html2 += "<td width='60'><div class='tbDiv'><i class='tbicon-2 edit'></i></div></td>";
                                html2 += "<td><div class='tbDiv'><i class='tbicon-3'></i>" + terminals[i].speed + "</div></td>";
                                html2 += "<td><div class='tbDiv'><i class='tbicon-4'></i>" + terminals[i].up_speed + "</div></td>";
                                html2 += "<td><div class='tbDiv'><span><input type='hidden' id='h_d_" + terminals[i].mac.replace(/:/g, "") + "' value='" + tmp_down_speed + "'><input type='text' id='ds_" + i + "' class='tbInpt limit dsLimit' value='" + tmp_down_speed + "'></span><div class='progress' id='slider_" + terminals[i].mac.replace(/:/g, "") + "_1'></div></div></td>";
                                html2 += "<td><div class='tbDiv'><span><input type='hidden' id='h_u_" + terminals[i].mac.replace(/:/g, "") + "' value='" + tmp_up_speed + "'><input type='text' id='us_" + i + "' class='tbInpt limit usLimit' value='" + tmp_up_speed + "'></span><div class='progress' id='slider_" + terminals[i].mac.replace(/:/g, "") + "_2'></div></div></td>";
                                html2 += "<td><div class='tbDiv'><i class='" + switch_flag + "'></i></div></td>";
                                html2 += "<td><div class='tbDiv'><div class='editBtn remove'></div></div></td>";
                                html2 += '</tr>';
                            }
                        }
                    }
                    $("#count_devices").html(sort);
                    $("#terminal_count").html(t_count);
                    $("#devices").html(html + html2);

                    //名称
                    $(".edit").on("click", function() {
                        if (!interval_flag) {
                            clearInterval(intervalTimerCount);
                            interval_flag = true;
                        }

                        $(this).parents("tr").find(".name").children("input").removeAttr("readonly").removeClass("nameInpt").select();
                    });
                    $(".name").find("input.tbInpt").on("focusout", function() {
                        $(this).attr("readonly", "readonly");
                        $(this).addClass("nameInpt");
                        var terminal_mac = $(this).parents("tr").attr("mac");
                        var terminal_nick = $(this).val();
                        var v = $(this).siblings("input").val();
                        if (interval_flag) {
                            if (getStrLength(trim(terminal_nick)) < 1) {
                                getMsg(terminal_name_cannot_empty);
                                terminal_nick = v;
                            }

                            if (getStrLength(terminal_nick) > 31) {
                                getMsg(terminal_name_too_long);
                                terminal_nick = v;
                            }

                            if (/[\':;*?~`!@#$%^&+={}\[\]\<\\(\),\.\。\，]/.test(terminal_nick)) {
                                getMsg(terminal_name_invalid);
                                terminal_nick = v;
                            }

                            terminal_nick = encodeURIComponent(terminal_nick);

                            setTerminalNick(terminal_mac, terminal_nick);
                            if (interval_flag) {
                                intervalTimerCount = setInterval(function() {
                                    router.getDynamicInfo();
                                }, commonInterval);
                                interval_flag = false;
                            }
                        }
                    });

                    //开关
                    $(".switch").on("click", function() {
                        clearInterval(intervalTimerCount);
                        $(this).toggleClass("open");
                        var switch_act = "on";
                        var terminal_mac = $(this).parents("tr").attr("mac");
                        if ($(this).hasClass("open")) {
                            switch_act = "off";
                        } else {
                            switch_act = "on";
                        }
                        setTerminalForbidden(terminal_mac, switch_act);
                        intervalTimerCount = setInterval(function() {
                            router.getDynamicInfo();
                        }, commonInterval);
                    })

                    //输入框限速
                    var regx = /^[1-9]\d*$/;
                    $(".limit").on("focusin", function() {
                        clearInterval(intervalTimerCount);
                        $(this).select();
                    }).on("focusout", function() {
                        //var mySpeed = "";
                        var terminal_mac = $(this).parents("tr").attr("mac");
                        var ds_val, us_val;

                        if (!regx.exec($(this).val())) {
                            $(this).val(unlimit);
                            $(this).parent().siblings(".progress").slider("value", common_total_speed);
                        } else if ($(this).val() <= 0 || $(this).val() >= (common_total_speed - common_speed_step - common_speed_min)) {
                            $(this).val(unlimit);
                            $(this).parent().siblings(".progress").slider("value", common_total_speed);
                        } else {
                            var v = $(this).val();
                            if (v != '') {
                                $(this).val(v);
                                $(this).parent().siblings(".progress").slider("value", v);
                            }
                        }
                        if ($(this).attr("id").indexOf("ds") >= 0) {
                            ds_val = $(this).val();
                            us_val = $(this).parents("tr").find(".usLimit").val();
                        }
                        if ($(this).attr("id").indexOf("us") >= 0) {
                            us_val = $(this).val();
                            ds_val = $(this).parents("tr").find(".dsLimit").val();
                        }
                        if (ds_val == unlimit) {
                            ds_val = 0;
                        }
                        if (us_val == unlimit) {
                            us_val = 0;
                        }
                        //alert(ds_val +"     "+us_val);
                        setTerminalSpeed(terminal_mac, ds_val, us_val);
                        intervalTimerCount = setInterval(function() {
                            router.getDynamicInfo();
                        }, commonInterval);
                    })
                    //拖动条限速
                    var mapArray = terminal_speed_map.keys();
                    if (mapArray != null && mapArray.length > 0) {
                        var ds_val, us_val;
                        //alert("mapArray = " + mapArray);
                        for (var m = 0; m < mapArray.length; m++) {
                            for (var i = 1; i <= 2; i++) {
                                var mySpeed = 0;
                                if (i == 2) {
                                    mySpeed = (terminal_speed_map.get(mapArray[m])).split(":")[1];
                                } else {
                                    mySpeed = (terminal_speed_map.get(mapArray[m])).split(":")[0];
                                }
                                if (mySpeed == 0) {
                                    mySpeed = common_total_speed;
                                }
                                $("#slider_" + mapArray[m].replace(/:/g, "") + "_" + i).slider({
                                    range: "min",
                                    step: common_speed_step,
                                    value: mySpeed,
                                    min: common_speed_min,
                                    max: common_total_speed,
                                    slide: function(event, ui) {
                                        clearInterval(intervalTimerCount);
                                        if (ui.value >= (common_total_speed - common_speed_step - common_speed_min)) {
                                            $(this).siblings().find(".limit").val(unlimit);
                                        } else {
                                            $(this).siblings().find(".limit").val(ui.value);
                                        }
                                    },
                                    stop: function(event, ui) {
                                        clearInterval(intervalTimerCount);
                                        var _this = $(this).siblings().find(".limit");
                                        if (_this.attr("id").indexOf("ds") >= 0) {
                                            ds_val = _this.val();
                                            us_val = _this.parents("tr").find(".usLimit").val();
                                        }
                                        if (_this.attr("id").indexOf("us") >= 0) {
                                            us_val = _this.val();
                                            ds_val = _this.parents("tr").find(".dsLimit").val();
                                        }
                                        if (ds_val == unlimit) {
                                            ds_val = 0;
                                        }
                                        if (us_val == unlimit) {
                                            us_val = 0;
                                        }
                                        var terminal_mac = $(this).parents("tr").attr("mac");
                                        //alert(terminal_mac + "   " + ds_val +"     "+us_val);
                                        setTerminalSpeed(terminal_mac, ds_val, us_val);
                                        intervalTimerCount = setInterval(function() {
                                            router.getDynamicInfo();
                                        }, commonInterval);
                                    }
                                });
                            }
                        }
                    }
                } else {
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
    },
    //获取设备SSID
    getWifiAp: function(_5g) {
        var suffix = _5g ? "_5g" : "";
        $.ajax({
            type: "POST",
            url: actionUrl + 'fname=net&opt=wifi_ap' + suffix + '&function=get&math=' + Math.random(),
            dataType: 'JSON',
            success: function(data) {
                var jsonObject = data;
                if (jsonObject.error == 0) {
                    $("#channel" + suffix).val(jsonObject.channel);
                    if (jsonObject.hidden == 1) $("#hidden_ssid" + suffix).attr("checked", true);
                    if (jsonObject.hiddenall == 1) $("#hidden_all" + suffix).attr("checked", true);
                    if (suffix) $('#wifi_name' + suffix).text(' / ' + jsonObject.ssid);
                    else $('#wifi_name').text(jsonObject.ssid);

                    $('#wf_nameset' + suffix).val(function(i, origVal) {
                        if (jsonObject.ssid) $(this).siblings("label").hide();
                        return jsonObject.ssid;
                    });

                    if (jsonObject.security == "none") {
                        $('#wf_pwdset' + suffix).parent().parent().hide();
                    } else {
                        $('#wf_pwdset' + suffix).parent().parent().show();
                        $('#wf_pwdset' + suffix).val(function(i, origVal) {
                            if (jsonObject.passwd) $(this).siblings("label").hide();
                            return jsonObject.passwd;
                        });
                    }
                    $('#wf_security' + suffix).val(jsonObject.security);

                    $("#wifiChannel" + suffix + " option[value=" + jsonObject.channel + "]").attr('selected', 'selected');
                    $("#wifiBandwidth" + suffix + " option[value=" + jsonObject.bw + "]").attr('selected', 'selected');
                } else {
                    locationUrl(jsonObejct.error);
                }
            }
        });
    },
    getLedInfo: function() {
        $.ajax({
            type: "POST",
            url: actionUrl + 'fname=system&opt=led&function=get&math=' + Math.random(),
            dataType: 'JSON',
            success: function(data) {
                var jsonObject = data;
                if (jsonObject.error == 0) {
                    if (jsonObject.enable == 1) {
                        $("#led_on").addClass('selected');
                    } else if (jsonObject.enable == 0) {
                        $("#led_off").addClass('selected');
                    }
                } else {
                    locationUrl(jsonObject.error);
                }
            }
        });
    },
    getCastNowInfo: function() {
        $.ajax({
            type: "POST",
            url: actionUrl + "fname=sys&opt=castnow&function=get&math=" + Math.random(),
            dataType: "json",
            success: function(data) {
                if (data.error == 0) {
                    $("#castnow_config_server").val(data.castnow_config_server);
                    $("#castnow_server_ip").val(data.castnow_server_ip);
                    $("#castnow_server_port").val(data.castnow_server_port);
                    $("#castnow_encrypt_key").val(data.castnow_encrypt_key);
                    $("#castnow_log_interval").val(data.castnow_log_interval);
                    $("#castnow_name").html(data.castnow_name);
                    $("#castnow_reboot_h").val(data.castnow_reboot_h);
                    $("#castnow_reboot_m").val(data.castnow_reboot_m);

                    if (data.auto == 1) {
                        $(".castnow_auto").show();
                        $(".castnow_manual").hide();
                        $("#castnow_onoff").addClass("open2");
                    } else {
                        $(".castnow_auto").hide();
                        $(".castnow_manual").show();
                        $("#castnow_onoff").removeClass("open2");
                    }
                } else {
                    locationUrl(data.error);
                }
            }
        });
    }
}

//获取网络类型字符串


function getWanNetType(type) {
    switch (type) {
    case 1:
        return dynamic_ip;
        break;
    case 2:
        return pppoe;
        break;
    case 3:
        return static_ip;
        break;
    case 4:
        return wifi_repeat;
        break;
    default:
        return failed_to_get_wan_type;
    }
}

//错误消息提示


function locationUrl(error) {
    if (error == 10007) {
        getMsg(please_relogin);
        setTimeout(function() {
            $.cookie('lstatus', false, {
                path: '/'
            });
            document.location = 'http://' + document.domain + "/index.html?tt=" + new Date().getTime();
        }, 3000);
    } else {
        getMsg(getErrorCode(error));
    }
}

function get_language() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=language&function=get&math=" + Math.random(),
        //async: false,
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                if (data.language == 'cn') {
                    $("#en").removeClass("selected");
                    $("#cn").addClass("selected");
                } else {
                    $("#en").addClass("selected");
                    $("#cn").removeClass("selected");
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function set_language(str) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=language&function=set&language=" + str + "&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            if (data.error == '0') {
                location.reload();
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function get_wifi_mode() {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=wifimode&function=get&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            if (data.error == 0) {
                if (data.mode == 'standard') {
                    $("#wifi_mode_smart").removeClass("selected");
                    $("#wifi_mode_standard").addClass("selected");
                } else {
                    $("#wifi_mode_smart").addClass("selected");
                    $("#wifi_mode_standard").removeClass("selected");
                }
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function set_wifi_mode(mode) {
    $.ajax({
        type: "POST",
        url: actionUrl + "fname=system&opt=wifimode&function=set&mode=" + mode + "&math=" + Math.random(),
        dataType: "json",
        success: function(data) {
            if (data.error == '0') {
                getMsg(setting_success);
            } else {
                locationUrl(data.error);
            }
        }
    });
}

function init() {
    router.getDynamicInfo();
    router.getLanIP();
    //router.getQos();
    router.getWifiAp();
    router.getWifiAp(1);
    router.getLedInfo();
    router.getWanInfo();
    //router.getTerminalLimitSpeed();
    router.getCastNowInfo();
    intervalTimerCount = setInterval(function() {
        router.getDynamicInfo();
    }, commonInterval);

    update_logout_timer();
}