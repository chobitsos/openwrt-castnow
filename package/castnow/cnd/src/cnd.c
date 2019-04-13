#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>
#include <netdb.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <netinet/ip_icmp.h>
#include <arpa/inet.h>
#include <sys/ioctl.h>
#include <linux/if.h>
#include <time.h>
#include <signal.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <pthread.h>
#include <json-c/json.h>

#include "cutil.h"

enum MSG_MAX_LEN
{
    MSG_LogData = 101,
    MSG_ACK = 105,
    MSG_NACK = 106,
    MSG_CMD = 107,
    MSG_CMD_Response = 108,
};

enum CMD
{
    CMD_CheckConnectedDeviceInfo_LAN1,
    CMD_CheckConnectedDeviceInfo_LAN2,
    CMD_ResetWholeCastNowUnit,
    CMD_ResetMicroUSBPower,
    CMD_UpgradeFirmware,
    CMD_HasConnectedDeviceOn_LAN1,
    CMD_HasConnectedDeviceOn_LAN2,
    CMD_FetchCastNowUnitSysInfo,
};

#define CASTNOW_DBG printf

static char *default_server_addr = "http://dvdnow.etonnet.net/api/CastNowReportConfigInfo";
static char webapi[200];
static char unit_mac[13];

static char serverinfo[500];    /* 500 is enough for now */
static char udp_server_ip[32] = "192.168.168.25";
static char udp_server_port[32] = "41000";
static char encryption_key[64] = "csTn9o82WR";

/* log */
static time_t log_interval = 60;
static time_t next_log_time = 0;

/* usb reset pw */
static int usb_reset_pw = 5;

/* server socket */
int sockfd = -1;
struct sockaddr_in addr = {0};

/* upgrate */
static int last_tid = 0;
static int last_cmd = 0;
static int can_send_response = 0;
static int wait_udp_ack_count = 0;

/* icmp */
static const int DEFDATALEN = 56;
static const int MAXIPLEN   = 60;
static const int MAXICMPLEN = 76;

static int in_cksum(unsigned short *buf, int sz)
{
    int sum = 0;
    int nleft = sz;
    unsigned short *w = buf;
    unsigned short ans = 0;

    while (nleft > 1)
    {
        sum += *w++;
        nleft -= 2;
    }

    if (nleft == 1)
    {
        *(unsigned char *) (&ans) = *(unsigned char *) w;
        sum += ans;
    }

    sum = (sum >> 16) + (sum & 0xFFFF);
    sum += (sum >> 16);
    ans = ~sum;

    return ans;
}

int ping(char *host, unsigned int timeout)
{
    int c;
    int ret;
    int pid;
    int pingsock;
    fd_set rfds;
    static int reqnum = 0;
    struct timeval *tval;
    struct timeval tv;
    unsigned int stm, etm;
    struct protoent *proto;
    size_t fromlen;
    struct sockaddr_in from;
    struct iphdr *iphdr;
    struct icmp   *pkt;
    struct sockaddr_in pingaddr;
    char packet[DEFDATALEN + MAXIPLEN + MAXICMPLEN];

    proto = getprotobyname("icmp");
    pingsock = socket(AF_INET, SOCK_RAW, (proto ? proto->p_proto : 1));
    if (pingsock < 0)
    {
        perror("create icmp socket");
        return -1;
    }

    reqnum++;
    pid = getpid();
    setuid(getuid());

    memset(&pingaddr, 0, sizeof(struct sockaddr_in));
    pingaddr.sin_family = AF_INET;
    pingaddr.sin_addr.s_addr = inet_addr(host);

    pkt = (struct icmp *) packet;
    memset(pkt, 0, sizeof(packet));
    pkt->icmp_type = ICMP_ECHO;
    pkt->icmp_seq = reqnum;
    pkt->icmp_id = pid;
    tval = (struct timeval *)pkt->icmp_data;
    gettimeofday(tval, NULL);
    pkt->icmp_cksum = in_cksum((unsigned short *) pkt, sizeof(packet));

    c = sendto(pingsock, packet, sizeof(packet), 0, (struct sockaddr *) &pingaddr, sizeof(struct sockaddr_in));
    if (c < 0 || c != sizeof(packet))
    {
        close(pingsock);
        return -1;
    }

    fromlen = sizeof(from);
    stm = system_get_uptime();
    while(1)
    {
        tv.tv_sec = timeout;
        tv.tv_usec = 0;

        FD_ZERO(&rfds);
        FD_SET(pingsock, &rfds);

        ret = select(pingsock+1, &rfds, NULL, NULL, &tv);
        if(ret > 0)
        {
            c = recvfrom(pingsock, packet, sizeof(packet), 0, (struct sockaddr *) &from, &fromlen);
            if (c >= 76)
            {
                iphdr = (struct iphdr *) packet;
                pkt = (struct icmp *) (packet + (iphdr->ihl << 2));

                if ((pkt->icmp_type == 0) || (pkt->icmp_type == 8))
                {
                    if ((pkt->icmp_id == pid) && (pkt->icmp_seq == reqnum))
                    {
                        close(pingsock);
                        return 0;
                    }
                    else
                    {
                        etm = system_get_uptime();
                        if((etm - stm) < timeout)
                        {
                            continue;
                        }
                        else
                        {
                            close(pingsock);
                            return -1;
                        }
                    }
                }
                else
                {
                    close(pingsock);
                    return -1;
                }
            }
            else
            {
                etm = system_get_uptime();
                if((etm - stm) < timeout)
                {
                    continue;
                }
                else
                {
                    close(pingsock);
                    return -1;
                }
            }
        }
        else if(ret == 0)
        {
            CASTNOW_DBG("ping timed out\n");
            close(pingsock);
            return -2;
        }
        else
        {
            CASTNOW_DBG("ping error : %s\n", strerror(errno));
            close(pingsock);
            return -1;
        }
    }
}

void encrypt_decrypt(char *input, int input_len, char *output, char *key)
{
    int i;
    int key_len = strlen(key);

    for(i = 0; i < input_len; i++)
    {
        output[i] = input[i] ^ key[i % key_len];
    }
}

void send_message(int type, const char *message)
{
    char buf[10];
    char *package = NULL;
    int package_len = 0;
    int msg_data_len = 0;
    int name_len = 0;

    msg_data_len = message ? strlen(message) : 0;

    /* convert msg_data_len to string */
    sprintf(buf, "%d", msg_data_len);
    name_len = 12 + 1 + strlen(buf);

    /* malloc package */
    package_len = 2              /* dataIdentifier */
                + 2              /* name length */
                + 2              /* message length */
                + name_len       /* name length */
                + msg_data_len;
    package = (char *) malloc(package_len);
    if(!package)
    {
        CASTNOW_DBG("calloc package error.");
        return;
    }

    /* fill package */
    memset(package, package_len, 0);
    *((unsigned short *)package) = type;                              /* dataIdentifier */
    *((unsigned short *)(package + 2)) = name_len;                    /* name length */
    *((unsigned short *)(package + 4)) = msg_data_len;                /* message length */
    memcpy(package + 6, unit_mac, 12);
    *(package + 18) = ';';
    encrypt_decrypt(buf, strlen(buf), (package + 19), encryption_key);
    encrypt_decrypt((char *)message, msg_data_len, (package + 19 + strlen(buf)), encryption_key);

    /* send package */
    if(sendto(sockfd, package, package_len, 0, (struct sockaddr*)&addr, sizeof(addr)) < 0)
    {
        CASTNOW_DBG("Send package error.\n");
    }

    free(package);
}

void send_ack_message(int trans_id, int cmd_type)
{
    struct json_object *msg;

    msg = json_object_new_object();
    if (!msg)
        return;

    json_object_object_add(msg, "TransactionId", json_object_new_int(trans_id));
    json_object_object_add(msg, "CmdType", json_object_new_int(cmd_type));
    json_object_object_add(msg, "Cmd_ResultType", json_object_new_int(1));
    json_object_object_add(msg, "Cmd_Result", json_object_new_string(""));

    send_message(MSG_ACK, json_object_to_json_string(msg));
    json_object_put(msg);
}

void send_nack_message(int trans_id, int cmd_type)
{
    struct json_object *msg;

    msg = json_object_new_object();
    if (!msg)
        return;

    json_object_object_add(msg, "TransactionId", json_object_new_int(trans_id));
    json_object_object_add(msg, "CmdType", json_object_new_int(cmd_type));
    json_object_object_add(msg, "Cmd_ResultType", json_object_new_int(1));
    json_object_object_add(msg, "Cmd_Result", json_object_new_string("Unknown message body cmd"));

    send_message(MSG_NACK, json_object_to_json_string(msg));
    json_object_put(msg);
}

void save_last_log_msg(const char *msg)
{
    FILE *fp = NULL;
    char tm[64] = {0};

    if (msg)
    {
        fp = fopen("/tmp/castnow.log", "w");
        if(!fp)
        {
            CASTNOW_DBG("Failed to open dump file.\n");
            return;
        }

        /* log message */
        fprintf(fp, "The last time SendLogMsg:\r\n");
        fprintf(fp, "%s\r\n", msg);
        fprintf(fp, "LogMsgTime:%s", system_get_localtime(tm));
        fclose(fp);
    }
}

void send_log_message()
{
    int i;
    FILE *fp;
    int lrx, ltx, wrx, wtx;
    int lrx2, ltx2, wrx2, wtx2;
    int wifi24g_rx, wifi24g_tx;
    int wifi5g_rx, wifi5g_tx;
    const char *message = NULL;
    char *wanifname = NULL;
    char ifname[32] = {0};
    char macaddr[32] = {0};
    char buffer[256] = {0};
    int wifi24g_devcnt = 0;
    int wifi5g_devcnt = 0;
    char wifi24g_devmac[3][32] = {0};
    char wifi5g_devmac[3][32] = {0};
    char target_ips[5][32] = {0};
    struct json_object *msg;
    struct uci_context *ctx;

    msg = json_object_new_object();
    if (!msg)
        return;

    ctx = uci_alloc_context();
    if (!ctx)
    {
        json_object_put(msg);
        return;
    }

    /* host info */
    fp = fopen("/proc/net/khostinfo", "r");
    if (fp)
    {
        fgets(buffer, sizeof(buffer), fp);

        while (fgets(buffer, sizeof(buffer), fp))
        {
            if (sscanf(buffer, "%*[^ ] %[^ ] %*[^ ] %*[^ ] %*[^ ] %*[^ ] %*[^ ] %[^ ]", macaddr, ifname) == 2)
            {
                if (!strcmp(ifname, "rai0"))
                {
                    if (wifi5g_devcnt < 3)
                    {
                        strcpy(wifi5g_devmac[wifi5g_devcnt], macaddr);
                    }

                    wifi5g_devcnt++;
                }
                else if (!strcmp(ifname, "ra0"))
                {
                    if (wifi24g_devcnt < 3)
                    {
                        strcpy(wifi24g_devmac[wifi24g_devcnt], macaddr);
                    }

                    wifi24g_devcnt++;
                }
            }
        }

        fclose(fp);
    }

    /* wan ifname */
    wanifname = "pppoe-wan";
    if (strcmp(uci_get_option_string(ctx, "network.wan.proto", ""), "pppoe"))
        wanifname = "pppoe-wan";

    /* statistics */
    wrx = wtx = 0;
    system_get_if_rxtx(wanifname, &wrx, &wtx);
    lrx = ltx = 0;
    system_get_if_rxtx("eth0.1", &lrx, &ltx);

    sleep(1);

    wrx2 = wtx2 = 0;
    system_get_if_rxtx(wanifname, &wrx2, &wtx2);
    lrx2 = ltx2 = 0;
    system_get_if_rxtx("eth0.1", &lrx2, &ltx2);
    wifi24g_rx = wifi24g_tx = 0;
    system_get_if_rxtx("ra0", &wifi24g_rx, &wifi24g_tx);
    wifi5g_rx = wifi5g_tx = 0;
    system_get_if_rxtx("rai0", &wifi5g_rx, &wifi5g_tx);

    /* Ver */
    json_object_object_add(msg, "Ver",
        json_object_new_string(uci_get_option_string(ctx, "castnow.@web[0].version", "")));

    /* LAN1_Dev */
    json_object_object_add(msg, "LAN1_Dev", json_object_new_string("0::"));

    /* LAN2_Dev */
    sprintf(buffer, "%d:%d", system_get_phyport_status(1), system_get_phyport_status(4));
    json_object_object_add(msg, "LAN2_Dev", json_object_new_string(buffer));

    /* WAN_MAC */
    memset(macaddr, 0, sizeof(macaddr));
    system_get_if_mac(wanifname, macaddr);
    json_object_object_add(msg, "WAN_MAC", json_object_new_string(macaddr));

    /* TotalOPTime */
    json_object_object_add(msg, "TotalOPTime", json_object_new_int(system_get_uptime()));

    /* WAN_ByteIn, WAN_ByteOut */
    json_object_object_add(msg, "WAN_ByteIn", json_object_new_int(wrx2));
    json_object_object_add(msg, "WAN_ByteOut", json_object_new_int(wtx2));

    /* WAN_BW */
    json_object_object_add(msg, "WAN_BW", json_object_new_int(((wrx2 - wrx)*8)/2));

    /* LAN1_ByteIn, LAN1_ByteOut */
    json_object_object_add(msg, "LAN1_ByteIn", json_object_new_int(lrx2));
    json_object_object_add(msg, "LAN1_ByteOut", json_object_new_int(ltx2));

    /* LAN1_BW, LAN2_BW */
    json_object_object_add(msg, "LAN1_BW", json_object_new_int(((lrx2 - lrx)*8)/2));
    json_object_object_add(msg, "LAN2_BW", json_object_new_int(((lrx2 - lrx)*8)/2));

    /* target_ip */
    fp = fopen("/proc/mt7628/esw_cnt", "r");
    if (fp)
    {
        while (fgets(buffer, sizeof(buffer), fp))
        {
            if (!strncmp(buffer, "target ip : ", strlen("target ip : ")))
            {
                sscanf(buffer + strlen("target ip : "), "%[^ ] %[^ ] %[^ ] %[^ ] %[^ ]",
                    target_ips[0], target_ips[1], target_ips[2], target_ips[3], target_ips[4]);
                break;
            }
        }

        fclose(fp);
    }

    buffer[0] = 0;
    for (i = 0; i < sizeof(target_ips)/sizeof(target_ips[0]); i++)
    {
        if (strlen(target_ips[i]) && strcmp(target_ips[i], "0.0.0.0"))
        {
            sprintf(buffer + strlen(buffer), "%s,", target_ips[i]);
        }
    }

    json_object_object_add(msg, "target_ip", json_object_new_string(buffer));

    /* WiFi24G_Dev */
    sprintf(buffer, "%d::", wifi24g_devcnt);
    for (i = 0; i < MIN(wifi24g_devcnt, 3); i++)
    {
        sprintf(buffer + strlen(buffer), "%s,", wifi24g_devmac[i]);
    }
    json_object_object_add(msg, "WiFi24G_Dev", json_object_new_string(buffer));

    /* WiFi24G_ByteIn, WiFi24G_ByteOut */
    json_object_object_add(msg, "WiFi24G_ByteIn", json_object_new_int(wifi24g_rx));
    json_object_object_add(msg, "WiFi24G_ByteOut", json_object_new_int(wifi24g_tx));

    /* WiFi50G_Dev */
    sprintf(buffer, "%d::", wifi5g_devcnt);
    for (i = 0; i < MIN(wifi5g_devcnt, 3); i++)
    {
        sprintf(buffer + strlen(buffer), "%s,", wifi5g_devmac[i]);
    }
    json_object_object_add(msg, "WiFi50G_Dev", json_object_new_string(buffer));

    /* WiFi50G_ByteIn, WiFi50G_ByteOut */
    json_object_object_add(msg, "WiFi50G_ByteIn", json_object_new_int(wifi5g_rx));
    json_object_object_add(msg, "WiFi50G_ByteOut", json_object_new_int(wifi5g_tx));

    message = json_object_to_json_string(msg);
    send_message(MSG_LogData, message);
    save_last_log_msg(message);

    json_object_put(msg);
    uci_free_context(ctx);
}

void send_cmd_response_message(int trans_id, int cmd_type, int result_type, const char *result)
{
    struct json_object *msg;

    msg = json_object_new_object();
    if (!msg)
        return;

    json_object_object_add(msg, "TransactionId", json_object_new_int(trans_id));
    json_object_object_add(msg, "CmdType", json_object_new_int(cmd_type));
    json_object_object_add(msg, "Cmd_ResultType", json_object_new_int(result_type));
    json_object_object_add(msg, "Cmd_Result", json_object_new_string(result ? result : ""));

    send_message(MSG_CMD_Response, json_object_to_json_string(msg));
    json_object_put(msg);
}

void send_sysinfo_message(int trans_id, int cmd_type)
{
    char *tmp = NULL;
    struct json_object *msg;
    struct uci_context *ctx;

    msg = json_object_new_object();
    if (!msg)
        return;

    ctx = uci_alloc_context();
    if (!ctx)
    {
        json_object_put(msg);
        return;
    }

    /* some simple */
    json_object_object_add(msg, "CastNow_mac", json_object_new_string(unit_mac));
    json_object_object_add(msg, "CastNow_ServerConfig_url", json_object_new_string(webapi));
    json_object_object_add(msg, "UDPServer_ip", json_object_new_string(udp_server_ip));
    json_object_object_add(msg, "UDPServer_port", json_object_new_int(atoi(udp_server_port)));
    json_object_object_add(msg, "Encrypt_key", json_object_new_string(encryption_key));
    json_object_object_add(msg, "ReportPeriod_base_value", json_object_new_int(log_interval));
    json_object_object_add(msg, "ReportPeriod_enable_flag", json_object_new_boolean(1));
    json_object_object_add(msg, "NTP_Enable", json_object_new_boolean(1));

    json_object_object_add(msg, "CastNow_admin_pswd",
        json_object_new_string(uci_get_option_string(ctx, "castnow.@web[0].userid", "")));

    tmp = uci_get_option_string(ctx, "castnow.@server[0].reboot_h", "");
    json_object_object_add(msg, "AutoReboot_time", json_object_new_string(atoi(tmp) ? tmp : "no"));

    /* time zone */
    json_object_object_add(msg, "Time_zone",
        json_object_new_string(uci_get_option_string(ctx, "system.@system[0].timezone", "")));

    /* 2.4G SSID */
    json_object_object_add(msg, "WiFi24G_ssid",
        json_object_new_string(uci_get_option_string(ctx, "wireless.@wifi-iface[ifname=ra0].ssid", "")));

    /* 5G SSID */
    json_object_object_add(msg, "WiFi5G_ssid",
        json_object_new_string(uci_get_option_string(ctx, "wireless.@wifi-iface[ifname=rai0].ssid", "")));

    /* firmware version */
    json_object_object_add(msg, "Firmware_version",
        json_object_new_string(uci_get_option_string(ctx, "castnow.@web[0].version", "")));

    send_cmd_response_message(trans_id, cmd_type, 1, json_object_to_json_string(msg));

    uci_free_context(ctx);
    json_object_put(msg);
}

void get_lan1_status(int trans_id, int cmd_type)
{
    struct json_object *msg;

    msg = json_object_new_object();
    if (!msg)
        return;

    json_object_object_add(msg, "LAN1_has_connected_device", json_object_new_boolean(system_get_phyport_status(1)));
    send_cmd_response_message(trans_id, cmd_type, 1, json_object_to_json_string(msg));
    json_object_put(msg);
}

void get_lan2_status(int trans_id, int cmd_type)
{
    struct json_object *msg;

    msg = json_object_new_object();
    if (!msg)
        return;

    json_object_object_add(msg, "LAN2_has_connected_device", json_object_new_boolean(system_get_phyport_status(4)));
    send_cmd_response_message(trans_id, cmd_type, 1, json_object_to_json_string(msg));
    json_object_put(msg);
}

void upgrade_firmware(int trans_id, int cmd_type, char *url, char *option)
{
    int i = 0;
    struct uci_context *ctx;

    /* save info to next boot */
    ctx = uci_alloc_context();
    uci_set_option_int(ctx, "castnow.@server[0].cmd", cmd_type);
    uci_set_option_int(ctx, "castnow.@server[0].transid", trans_id);
    uci_set_option_string(ctx, "castnow.@server[0].fmurl", url);
    uci_set_option_string(ctx, "castnow.@server[0].rebooting", "1");
    uci_commit_all(ctx);
    uci_free_context(ctx);

    if(url && strlen(url))
    {
        /* 1. download firmware. */
        while(system_do_cmd("wget %s -O /tmp/fw.bin", url))
        {
            i++;

            if(i >= 10)
            {
                i = 1;
                goto __OUT;
            }
        }

        /* 2. firmware check. */
        if(system_do_cmd("sysupgrade -T /tmp/fw.bin"))
        {
            i = 2;
            goto __OUT;
        }

        i = 3;
        system_do_cmd("sysupgrade /tmp/fw.bin");
    }

__OUT:
    if(i == 0)
        send_cmd_response_message(trans_id, cmd_type, 0, "Invalid firmware url.");
    else if(i == 1)
        send_cmd_response_message(trans_id, cmd_type, 0, "Fail to download firmware.");
    else if(i == 2)
        send_cmd_response_message(trans_id, cmd_type, 0, "Invalid firmware format.");
    else
        send_cmd_response_message(trans_id, cmd_type, 0, "Fail to upgrade firmware.");    /* if upgrate successful, it will never be here. so upgrate error */

    ctx = uci_alloc_context();
    uci_set_option_string(ctx, "castnow.@server[0].cmd", "");
    uci_set_option_string(ctx, "castnow.@server[0].transid", "");
    uci_set_option_string(ctx, "castnow.@server[0].fmurl", "");
    uci_set_option_string(ctx, "castnow.@server[0].rebooting", "");
    uci_commit_all(ctx);
    uci_free_context(ctx);
}

void reset_castnowunit(int trans_id, int cmd_type, char *option_1, char *option_2)
{
    system_do_cmd("gpio e 11 0");
    sleep(3);
    system_do_cmd("reboot");
}

void reset_microusb()
{
    system_do_cmd("gpio e 11 0");
    sleep(usb_reset_pw);
    system_do_cmd("gpio e 11 1");
}

void wan_detecter()
{
    int wan_status = 0;
    int wan_detecter_timer = 5;
    int icmp_package_number = 0;
    static unsigned int total_ping_count = 0;
    static unsigned int ping_fail_count = 0;

    if(total_ping_count++ % 10)
    {
        return;
    }

    while(wan_detecter_timer--)
    {
        if (ping("8.8.8.8", 3) == 0)
        {
            wan_status = 1;
            break;
        }

        sleep(2);
    }

    if (wan_status)
    {
        ping_fail_count = 0;
    }
    else if (ping_fail_count++ > 10)
    {
        exit(0);  /* restart cnd */
    }
}

void udp_recive_ack_timer()
{
    if(wait_udp_ack_count > 20)
    {
        exit(0);  /* restart cnd */
    }
}

void log_timer(int sig)
{
    send_log_message();
    udp_recive_ack_timer();
    wan_detecter();

    wait_udp_ack_count++;

    srand(time(NULL));
    alarm(log_interval + rand()%log_interval);
}

void handle_message(char *package, int len)
{
    int i;
    char *comma = NULL;
    char *message = NULL;
    unsigned short type;
    unsigned short name_len;
    unsigned short msg_len;
    struct json_object *o_cmd;
    struct json_object *o_cmd_type;
    struct json_object *o_trans_id;
    struct json_object *o_option_1;
    struct json_object *o_option_2;
    int cmd_type;
    int trans_id;
    const char *option_1;
    const char *option_2;

    if(len < 6)
        return;

    type = *((unsigned short *)package);
    name_len = *((unsigned short *)(package + 2));
    msg_len = *((unsigned short *)(package + 4));

    for(i = 0; i < name_len; i++)
    {
        if(*(package + 6 + i) == ';')
        {
            comma = package + 6 + i;
            break;
        }
    }

    if(!comma || i == name_len)
        return;

    /* decrypt msg len */
    i = name_len - (comma + 1 - (package + 6));
    memcpy(package + 6, comma + 1, i);
    encrypt_decrypt(package + 6, i, package + 6, encryption_key);

    *(package + 6 + i) = 0;
    if(atoi(package + 6) != msg_len)
        return;

    /* decrypt message */
    message = package + 6 + name_len;
    memcpy(message - 1, message, msg_len);
    *(message + msg_len - 1) = 0;
    message = message - 1;
    encrypt_decrypt(message, msg_len, message, encryption_key);

    if(type == MSG_CMD)
    {
        /* handle message */
        o_cmd = json_tokener_parse(message);
        if(!o_cmd)
        {
            fprintf(stderr, "Failed to parse cmd '%s'\n", message);
            return;
        }

        o_cmd_type = json_object_object_get(o_cmd, "CmdType");
        o_trans_id = json_object_object_get(o_cmd, "TransactionId");
        o_option_1 = json_object_object_get(o_cmd, "Option_1");
        o_option_2 = json_object_object_get(o_cmd, "Option_2");

        if(!o_cmd_type || !o_trans_id || !o_option_1 || !o_option_2)
        {
            fprintf(stderr, "Failed to parse cmd filed (%p, %p, %p, %p)\n", o_cmd_type, o_trans_id, o_option_1, o_option_2);
            json_object_put(o_cmd);
            return;
        }

        trans_id = json_object_get_int(o_trans_id);
        cmd_type = json_object_get_int(o_cmd_type);
        option_1 = json_object_get_string(o_option_1);
        option_2 = json_object_get_string(o_option_2);

        if(cmd_type == CMD_CheckConnectedDeviceInfo_LAN1)
        {
            send_ack_message(trans_id, cmd_type);
        }
        else if(cmd_type == CMD_CheckConnectedDeviceInfo_LAN2)
        {
            send_ack_message(trans_id, cmd_type);
        }
        else if(cmd_type == CMD_ResetWholeCastNowUnit)
        {
            send_ack_message(trans_id, cmd_type);
            send_cmd_response_message(trans_id, cmd_type, 1, NULL);
            reset_castnowunit(trans_id, cmd_type, NULL, NULL);
        }
        else if(cmd_type == CMD_ResetMicroUSBPower)
        {
            send_ack_message(trans_id, cmd_type);
            reset_microusb();
            send_cmd_response_message(trans_id, cmd_type, 1, NULL);
        }
        else if(cmd_type == CMD_UpgradeFirmware)
        {
            send_ack_message(trans_id, cmd_type);
            upgrade_firmware(trans_id, cmd_type, (char *)option_1, (char *)option_2);
        }
        else if(cmd_type == CMD_HasConnectedDeviceOn_LAN1)
        {
            send_ack_message(trans_id, cmd_type);
            get_lan1_status(trans_id, cmd_type);
        }
        else if(cmd_type == CMD_HasConnectedDeviceOn_LAN2)
        {
            send_ack_message(trans_id, cmd_type);
            get_lan2_status(trans_id, cmd_type);
        }
        else if(cmd_type == CMD_FetchCastNowUnitSysInfo)
        {
            send_ack_message(trans_id, cmd_type);
            send_sysinfo_message(trans_id, cmd_type);
        }
        else
        {
            send_nack_message(trans_id, cmd_type);
        }

        json_object_put(o_cmd);
    }
    else if(type == MSG_ACK)
    {
        can_send_response = 1;
        wait_udp_ack_count= 0;

        CASTNOW_DBG("Recv message : MSG_ACK\n");
    }
    else if(type == MSG_NACK)
    {
        CASTNOW_DBG("Recv message : MSG_ACK\n");
    }
    else
    {
        CASTNOW_DBG("Recv message : Invalide message type [%d]\n", type);
    }
}

void get_config_from_webapi()
{
    FILE *fp;
    char cmd[200];

    sprintf(cmd, "wget %s -O /tmp/castnow 2> /dev/null && cat /tmp/castnow", webapi);
    while (1)    /* 2 min */
    {
        if(!(fp = popen(cmd, "r")))
        {
            CASTNOW_DBG("Fail to get serverinfo from webapi\n");
        }
        else
        {
            memset(serverinfo, 0, 300);
            fgets(serverinfo, 300, fp);

            if(strlen(serverinfo) > 0)
            {
                system("rm /tmp/castnow");
                pclose(fp);
                break;
            }
        }

        pclose(fp);
        sleep(5);
    }
}

int main(int argc, char *argv[])
{
    int i;
    time_t ct;
    char *buf;
    int saddr_len;
    struct hostent *host;
    struct ifreq ifreq;
    struct uci_context *ctx;
    struct timeval timeout = {3, 0};
    int need_commit_uci = 0;
    int boot_from_rebooting = 0;
    struct json_object *sercfg;
    struct sockaddr_in saddr, daddr;
    int buffer_size, buffer_index, buffer_step;
    struct json_object *p_server_ip, *p_server_port, *p_encryption_key;

    signal(SIGPIPE, SIG_IGN);

    /* 1. init socket */
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if(sockfd < 0)
    {
        CASTNOW_DBG("Create socket failed : %s\n", strerror(errno));
        goto __OUT;
    }

    /* 2. set socket send timeout */
    if(setsockopt(sockfd, SOL_SOCKET, SO_SNDTIMEO, (const char*)&timeout, sizeof(timeout)) < 0)
    {
        CASTNOW_DBG("Setsockopt failed : %s\n", strerror(errno));
        goto __OUT;
    }

    /* 3. get lan mac addr */
    strcpy(ifreq.ifr_name, "br-lan");
    if(ioctl(sockfd, SIOCGIFHWADDR, &ifreq) < 0)
    {
        CASTNOW_DBG("SIOCGIFHWADDR failed : %s\n", strerror(errno));
        goto __OUT;
    }

    sprintf(unit_mac, "%02X%02X%02X%02X%02X%02X",
        (unsigned char)ifreq.ifr_hwaddr.sa_data[0],
        (unsigned char)ifreq.ifr_hwaddr.sa_data[1],
        (unsigned char)ifreq.ifr_hwaddr.sa_data[2],
        (unsigned char)ifreq.ifr_hwaddr.sa_data[3],
        (unsigned char)ifreq.ifr_hwaddr.sa_data[4],
        (unsigned char)ifreq.ifr_hwaddr.sa_data[5]);

    /* 4 : init uci context */
    ctx = uci_alloc_context();
    if (!ctx)
    {
        CASTNOW_DBG("Alloc uci context failed\n");
        goto __OUT;
    }

    /* 5 : boot from upgrade ? */
    buf = uci_get_option_string(ctx, "castnow.@server[0].rebooting", NULL);
    if (buf)
    {
        need_commit_uci = 1;
        boot_from_rebooting = 1;

        last_tid = uci_get_option_int(ctx, "castnow.@server[0].transid");
        last_cmd = uci_get_option_int(ctx, "castnow.@server[0].cmd");

        uci_set_option_string(ctx, "castnow.@server[0].cmd", "");
        uci_set_option_string(ctx, "castnow.@server[0].fmurl", "");
        uci_set_option_string(ctx, "castnow.@server[0].transid", "");
        uci_set_option_string(ctx, "castnow.@server[0].rebooting", "");
    }

    /* 6 : get udp_server_ip, udp_server_port and encryption_key */
    if (uci_get_option_int(ctx, "castnow.@server[0].auto"))
    {
        snprintf(webapi, sizeof(webapi), "%s?mac=%s",
            uci_get_option_string(ctx, "castnow.@server[0].server_addr", default_server_addr), unit_mac);

        /* get config from server util success */
        while(1)
        {
            get_config_from_webapi();

            sercfg = json_tokener_parse(serverinfo);
            if (!sercfg)
            {
                p_server_ip = json_object_object_get(sercfg, "udp_server_ip");
                p_server_port = json_object_object_get(sercfg, "udp_server_port");
                p_encryption_key = json_object_object_get(sercfg, "encryption_key");

                if(p_server_ip && p_server_port && p_encryption_key) /* save */
                {
                    snprintf(udp_server_ip, sizeof(udp_server_ip), "%s", json_object_get_string(p_server_ip));
                    snprintf(udp_server_port, sizeof(udp_server_port), "%s", json_object_get_string(p_server_port));
                    snprintf(encryption_key, sizeof(encryption_key), "%s", json_object_get_string(p_encryption_key));

                    uci_set_option_string(ctx, "castnow.@server[0].server_ip", udp_server_ip);
                    uci_set_option_string(ctx, "castnow.@server[0].server_port", udp_server_port);
                    uci_set_option_string(ctx, "castnow.@server[0].encrypt_key", encryption_key);

                    need_commit_uci = 1;
                    break;    /* get config from server success. */
                }

                json_object_put(sercfg);
            }
        }
    }
    else
    {
        snprintf(udp_server_ip, sizeof(udp_server_ip), "%s", uci_get_option_string(ctx, "castnow.@server[0].server_ip", ""));
        snprintf(udp_server_port, sizeof(udp_server_port), "%s", uci_get_option_string(ctx, "castnow.@server[0].server_port", ""));
        snprintf(encryption_key, sizeof(encryption_key), "%s", uci_get_option_string(ctx, "castnow.@server[0].encrypt_key", ""));
    }

    /* log interval */
    buf = uci_get_option_string(ctx, "castnow.@server[0].log_interval", "");
    if (strlen(buf))
    {
        log_interval = atoi(buf);
    }

    if (need_commit_uci == 1)
    {
        uci_commit_all(ctx);
    }

    uci_free_context(ctx);

    /* for debug */
    CASTNOW_DBG("[%s] [%s] [%s] [%s]\n", unit_mac, udp_server_ip, udp_server_port, encryption_key);

    /* 7. gen server address info */
    addr.sin_family = AF_INET;
    addr.sin_port = htons(atoi(udp_server_port));
    do
    {
        host = gethostbyname(udp_server_ip);
        if(!host)
        {
            sleep(5);
        }
        else
        {
            memcpy(&addr.sin_addr, host->h_addr, host->h_length);
            daddr.sin_addr = addr.sin_addr;
            break;
        }
    } while(1);

    /* 8. init buffer */
    buf = NULL;
    buffer_index = 0;
    buffer_size = 0;
    buffer_step = 300;

    /* 9. log timer */
    signal(SIGALRM, log_timer);
    alarm(10);

    /* 10. main loop */
    while(1)
    {
        /* send upgrade success message */
        if(boot_from_rebooting && can_send_response)
        {
            send_cmd_response_message(last_tid, last_cmd, 1, NULL);
            boot_from_rebooting = 0;
        }

        buf = (char *)realloc(buf, buffer_size + buffer_step);
        if(!buf)
        {
            CASTNOW_DBG("Allo buffer error.\n");
        }
        else
        {
            buffer_size += buffer_step;

            i = recvfrom(sockfd, (buf + buffer_index), buffer_step, 0, (struct sockaddr *)&saddr, &saddr_len);
            if(i >= 0 && i < buffer_step)
            {
                /* Receive package and handle it */
                if(daddr.sin_addr.s_addr == saddr.sin_addr.s_addr)
                {
                    handle_message(buf, i);
                    CASTNOW_DBG("Handle message done.\n");
                }

                free(buf);
                buf = NULL;
                buffer_index = 0;
                buffer_size = 0;
            }
            else if(i == buffer_step)
            {
                buffer_index += buffer_step;
            }
            else
            {
                free(buf);
                buf = NULL;
                buffer_index = 0;
                buffer_size = 0;
            }
        }
    }

__OUT:
    close(sockfd);

    return 0;
}

