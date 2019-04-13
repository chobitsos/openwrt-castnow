#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <unistd.h>
#include <signal.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <time.h>
#include <cutil.h>

#define BUFLEN_TINY 8
#define BUFLEN_SMALL 16
#define BUFLEN_NORMAL 32
#define BUFLEN_BIG 64
#define BUFLEN_LARGE 256
#define BUFLEN_HUGE 1024

#define ATE_TRACE printf("HERE [%s:%d]\n", __FUNCTION__, __LINE__)
#define ARRAY_SIZE(a) (sizeof(a)/sizeof(a[0]))
#define MAX(a,b) ((a>b)?(a):(b))

#define ETH_ADDR_LEN 6
#define MAX_NAME_LEN 64
#define MAX_VALUE_LEN 1024
#define MSG_MAX_LEN 4096
#define MAX_NAME_ARRAY 10

#define MP_QUERY_STATS     0x8B6D
#define MP_QUERY_THER    0x8B77
#define MP_QUERY_TSSI    0x8B6F

#define foreach_arch(word, wordlist, next,temp,temp1) \
	for (next = &wordlist[strspn(wordlist, temp)], \
	     strncpy(word, next, sizeof(word)), \
	     word[strcspn(word, temp)] = '\0', \
	     word[sizeof(word) - 1] = '\0', \
	     next = strchr(next, temp1); \
	     strlen(word); \
	     next = next ? &next[strspn(next, temp)] : "", \
	     strncpy(word, next, sizeof(word)), \
	     word[strcspn(word, temp)] = '\0', \
	     word[sizeof(word) - 1] = '\0', \
	     next = strchr(next, temp1))

typedef enum
{
    RTN_SUCCESS = 0,
    RTN_FAILED = 1,
    RTN_BUFFER = 2,
    RTN_FORMAT_ERR = 3,
    RTN_UNKNOW = 4
} rtn_type;

typedef struct
{
    char name[MAX_NAME_LEN];
    unsigned int wl_id;
    unsigned int id;
    char value[MAX_VALUE_LEN];
    char cfg_name[128];
    rtn_type (*func)(char* name, char *cfg_name, char* value);
} check_t;

typedef struct
{
    unsigned int irq;
    pid_t pid;
} gpio_reg_info;

typedef enum
{
    o_noarg = 0,
    o_string
} opt_type;

typedef enum
{
    ATE_BYTE6_T = 0,
    ATE_STRING_T,
    ATE_BYTE8_T,
    ATE_TYPE_MAX
} ATE_TYPE_T;

typedef struct
{
    char *name[MAX_NAME_ARRAY];        /* name of the option */
    opt_type type;
    rtn_type (*func)(char *arg, char *rtn);
    char *desc;
} option_t;

typedef struct
{
    char name[MAX_NAME_LEN];        /* name of the option */
    rtn_type (*func)(char *arg, char *rtn);
} prod_option_t;

//现在hw_id暂时没用，产测已经不写入apmib了
struct name_to_id
{
    unsigned int wlan_id;
    char name[128];
    unsigned int hw_id;
    ATE_TYPE_T type;
    char cfg_name[128];
};

struct device_info
{
    char    name[BUFLEN_BIG];/* router name */
    char    vendor[BUFLEN_BIG]; /* vendor name */
    char    model_name[BUFLEN_BIG]; /* module name */
    char    model_revision[BUFLEN_NORMAL]; /* module revision */
    char    firmware_version[BUFLEN_NORMAL]; /* firmware version */
    char    firmware_date[BUFLEN_NORMAL]; /* firmware date，"2014 06 10 19 00" */
    int     uptime; /* up time, seconds */
};

static int ate_mfg_button_press = 0;

static int get_compile_date_time(char *szDateTime)
{
    const char szEnglishMonth[12][4]={ "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
    char szTmpDate[40]={0};
    char szTmpTime[20]={0};
    char szMonth[4]={0};
    int iYear = 2000;
    int iMonth = 0;
    int iDay = 0;
    int iHour = 0;
    int iMin = 0;
    int iSec = 0;
    int i = 0 ;

    sprintf(szTmpDate, "%s", __DATE__); //"Sep 18 2010"
    sprintf(szTmpTime, "%s", __TIME__); //"10:59:19"

    sscanf(szTmpDate, "%s %d %d", szMonth, &iDay, &iYear);
    sscanf(szTmpTime, "%d:%d:%d", &iHour, &iMin, &iSec);

    for (i = 0; i < 12; i++)
    {
        if (strncmp(szMonth,szEnglishMonth[i],3)==0)
        {
            iMonth=i+1;
            break;
        }
    }

    //printf("%04d %02d %02d %02d %02d %02d\n",iYear,iMonth,iDay,iHour,iMin,iSec);
    sprintf(szDateTime,"%04d %02d %02d %02d %02d",iYear,iMonth,iDay,iHour,iMin);
    if (0 == strlen(szDateTime))
    {
        return 0;
    }
    return 1;
}

rtn_type ate_mfg_get_hw_wlan(char *arg, char *rtn)
{
    return RTN_SUCCESS;
}

rtn_type ate_mfg_check_usb(char *arg, char *rtn)
{
    return RTN_SUCCESS ;
}

rtn_type ate_mfg_check_usb3(char *arg, char *rtn)
{
    return RTN_BUFFER ;
}

rtn_type ate_mfg_check_wpsbutton(char *arg, char *rtn)
{
    return RTN_SUCCESS;
}

rtn_type ate_mfg_check_wifibutton(char *arg, char *rtn)
{
    return RTN_FAILED;
}

void ate_mfg_signal_handler(int sig)
{
    if (SIGUSR1 == sig)
    {
        ate_mfg_button_press = 1;
    }
}

rtn_type ate_mfg_check_resetbutton(char *arg, char *rtn)
{
    int times = 10;

    ate_mfg_button_press = 0;
    while (times--)
    {
        if (ate_mfg_button_press)
            return RTN_SUCCESS;

        sleep(1);
    }

    return RTN_FAILED;
}

rtn_type ate_mfg_check_led(char *arg, char *rtn)
{
    if (!strcmp(arg, "on"))
    {
        system("iwpriv ra0 set WlanLedEn=1 > /dev/null");
        system("switch reg w a4 0xc > /dev/null");
        system("switch reg w a8 0xc > /dev/null");
        system("switch reg w ac 0xc > /dev/null");
        system("switch reg w b0 0xc > /dev/null");
        system("switch reg w b4 0xc > /dev/null");
    }
    else if (!strcmp(arg, "off"))
    {
        system("iwpriv ra0 set WlanLedEn=0 > /dev/null");
        system("switch reg w a4 0xb > /dev/null");
        system("switch reg w a8 0xb > /dev/null");
        system("switch reg w ac 0xb > /dev/null");
        system("switch reg w b0 0xb > /dev/null");
        system("switch reg w b4 0xb > /dev/null");
    }

    return RTN_SUCCESS  ;
}

rtn_type ate_mfg_reboot(char *arg, char *rtn)
{
    return RTN_SUCCESS;
}

rtn_type ate_mfg_default(char *arg, char *rtn)
{
    system_do_cmd("rm -rf /overlay/*");
    return RTN_SUCCESS;
}

void ate_mfg_get_swversion(char *swversion, int len)
{
    int i;
    FILE *fp;

    if (fp = fopen("/etc/castnow.version", "r"))
    {
        fgets(swversion, len, fp);
        if (strlen(swversion) > 0)
        {
            if (swversion[strlen(swversion) - 1] == '\n')
                swversion[strlen(swversion) - 1] = 0;

            if (swversion[strlen(swversion) - 1] == '\r')
                swversion[strlen(swversion) - 1] = 0;
        }

        fclose(fp);
    }
}


int ate_mfg_set_lanmac(char *lanmac, int len)
{
    unsigned char mac[6] = {0};

    if (!lanmac || !strlen(lanmac))
        return RTN_FAILED;

    if (6 != sscanf(lanmac, "%02X:%02X:%02X:%02X:%02X:%02X", &mac[0], &mac[1], &mac[2], &mac[3], &mac[4], &mac[5]))
    {
        return RTN_FAILED;
    }

    if (factory_mtd_write(E2PROM_LMAC_OFFSET, mac, sizeof(mac)) < 0)
    {
        return RTN_FAILED;
    }

    return RTN_SUCCESS;
}

void ate_mfg_get_lanmac(char *lanmac, int len)
{
    unsigned char mac[6] = {0};

    factory_mtd_read(E2PROM_LMAC_OFFSET, mac, sizeof(mac));
    snprintf(lanmac, len, "%02X:%02X:%02X:%02X:%02X:%02X",
        mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

void ate_mfg_get_wan1mac(char *wan1mac, int len)
{
    unsigned char mac[6] = {0};

    factory_mtd_read(E2PROM_LMAC_OFFSET, mac, sizeof(mac));
    snprintf(wan1mac, len, "%02X:%02X:%02X:%02X:%02X:%02X",
        mac[0], mac[1], mac[2], mac[3], mac[4], mac[5] + 1);
}

void ate_mfg_get_ssid(char *ssid, int len)
{
    char buffer[E2PROM_SSID_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_SSID_OFFSET, buffer, E2PROM_SSID_MAXLEN);
    snprintf(ssid, len, "%s", buffer);
}

void ate_mfg_get_wpapwd(char *wpapwd, int len)
{
    char buffer[E2PROM_WPAPWD_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_WPAPWD_OFFSET, buffer, E2PROM_WPAPWD_MAXLEN);
    snprintf(wpapwd, len, "%s", buffer);
}

void ate_mfg_get_serialnum(char *serialnum, int len)
{
    char buffer[E2PROM_SN_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_SN_OFFSET, buffer, E2PROM_SN_MAXLEN);
    snprintf(serialnum, len, "%s", buffer);
}

void ate_mfg_get_rtflag(char *rtflag, int len)
{
    char buffer[E2PROM_RTFLAG_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_RTFLAG_OFFSET, buffer, E2PROM_RTFLAG_MAXLEN);
    snprintf(rtflag, len, "%s", buffer);
}

void ate_mfg_get_ftflag(char *ftflag, int len)
{
    char buffer[E2PROM_FTFLAG_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_FTFLAG_OFFSET, buffer, E2PROM_FTFLAG_MAXLEN);
    snprintf(ftflag, len, "%s", buffer);
}

void ate_mfg_get_ttflag(char *ttflag, int len)
{
    char buffer[E2PROM_TTFLAG_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_TTFLAG_OFFSET, buffer, E2PROM_TTFLAG_MAXLEN);
    snprintf(ttflag, len, "%s", buffer);
}

void ate_mfg_get_country_2g(char *country, int len)
{
    char buffer[E2PROM_COUNTRY_2G_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_COUNTRY_2G_OFFSET, buffer, E2PROM_COUNTRY_2G_MAXLEN);
    snprintf(country, len, "%s", buffer);
}

void ate_mfg_get_country_5g(char *country, int len)
{
    char buffer[E2PROM_COUNTRY_5G_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_COUNTRY_5G_OFFSET, buffer, E2PROM_COUNTRY_5G_MAXLEN);
    snprintf(country, len, "%s", buffer);
}

void ate_mfg_get_power_2g(char *power, int len)
{
    char buffer[E2PROM_POWER_2G_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_POWER_2G_OFFSET, buffer, E2PROM_POWER_2G_MAXLEN);
    snprintf(power, len, "%s", buffer);
}

void ate_mfg_get_power_5g(char *power, int len)
{
    char buffer[E2PROM_POWER_5G_MAXLEN + 1] = {0};

    factory_mtd_read(E2PROM_POWER_5G_OFFSET, buffer, E2PROM_POWER_5G_MAXLEN);
    snprintf(power, len, "%s", buffer);
}

rtn_type ate_mfg_htmlVersionInfo(char *arg, char *rtn)
{
    char ssid[64] = {0};
    char lanmac[32] = {0};
    char wan1mac[32] = {0};
    char wpapwd[64] = {0};
    char serialnum[64] = {0};
    char swversion[32] = {0};
    char rtflag[32] = {0};
    char ttflag[32] = {0};
    char ftflag[32] = {0};
    char country[8] = {0};
    char power_2g[8] = {0};
    char power_5g[8] = {0};

    /* soft version */
    ate_mfg_get_swversion(swversion, sizeof(swversion));
    sprintf(rtn, "SV=%s", swversion);
    sprintf(rtn + strlen(rtn), ";HV=%s", "HWVERSION");

    /* lanmac */
    ate_mfg_get_lanmac(lanmac, sizeof(lanmac));
    sprintf(rtn + strlen(rtn), ";LANMAC=%s", lanmac);

    /* wanmac */
    ate_mfg_get_wan1mac(wan1mac, sizeof(wan1mac));
    sprintf(rtn + strlen(rtn), ";WAN1MAC=%s", wan1mac);
    sprintf(rtn + strlen(rtn), ";WAN2MAC=%s", "");

    /* ssid */
    ate_mfg_get_ssid(ssid, sizeof(ssid));
    sprintf(rtn + strlen(rtn), ";SSID=%s", ssid);

    /* wpapwd */
    ate_mfg_get_wpapwd(wpapwd, sizeof(wpapwd));
    sprintf(rtn + strlen(rtn), ";WPA_PW=%s", wpapwd);

    /* sn */
    ate_mfg_get_serialnum(serialnum, sizeof(serialnum));
    sprintf(rtn + strlen(rtn), ";SN=%s", serialnum);

    sprintf(rtn + strlen(rtn), ";PIN=%s", "");

    /* country */
    ate_mfg_get_country_2g(country, sizeof(country));
    sprintf(rtn + strlen(rtn), ";COUNTRY=%s", country);

    sprintf(rtn + strlen(rtn), ";MAXPOWER=");

    /* power 2g */
    ate_mfg_get_power_2g(power_2g, sizeof(power_2g));
    sprintf(rtn + strlen(rtn), ";MAXPOWER_2G=%s", power_2g);

    /* power 5g */
    ate_mfg_get_power_2g(power_5g, sizeof(power_5g));
    sprintf(rtn + strlen(rtn), ";MAXPOWER_5G=%s", power_5g);

    /* useless */
    sprintf(rtn + strlen(rtn), ";ACCESS_WRITE=%s", "");
    sprintf(rtn + strlen(rtn), ";SUPPORT_POWER=%s", "");

    /* RFTestFlag */
    ate_mfg_get_rtflag(rtflag, sizeof(rtflag));
    sprintf(rtn + strlen(rtn), ";RFTestFlag=", rtflag);

    /* ThroughputTestFlag */
    ate_mfg_get_ttflag(ttflag, sizeof(ttflag));
    sprintf(rtn + strlen(rtn), ";ThroughputTestFlag=", ttflag);

    /* FinishTestFlag */
    ate_mfg_get_ftflag(ftflag, sizeof(ftflag));
    sprintf(rtn + strlen(rtn), ";FinishTestFlag=%s", ftflag);
    //sprintf(rtn + strlen(rtn), ";MeshID=%s", "MeshID");
    //sprintf(rtn + strlen(rtn), ";MeshPW=%s", "MeshPW");
    //sprintf(rtn + strlen(rtn), ";MeshGroupSn=%s", "MeshGroupSn");

    return RTN_BUFFER;
}

/*
    WanNum=2;LanNum=3;Wan1=DOWN;Wan2=UP_100M_FULL;Lan1=DOWN;Lan2=UP_100M_FULL;Lan3=UP_100M_HALF;END
    信息不存在:Wan3=;
    信息获取错误:Wan3=error;
*/
rtn_type ate_mfg_LanWanInfo(char *arg, char *rtn)
{
    int wanNums = 0;
    int lanNums = 0;
    char wanBuf[1204] = {0};
    char lanBuf[1024] = {0};
    char *wanInfo[3] = {"DOWN", "DOWN", "DOWN"};
    char *lanInfo[4] = {"UP_100M_FULL", "DOWN", "DOWN", "DOWN"};

    switch(wanNums)
    {
        case 0:
            sprintf(wanBuf, "Wan1=;Wan2=;Wan3=;");
            break;
        case 1:
            sprintf(wanBuf, "Wan1=%s;Wan2=;Wan3=;",wanInfo[0]);
            break;
        case 2:
            sprintf(wanBuf, "Wan1=%s;Wan2=%s;Wan3=;",wanInfo[0], wanInfo[1]);
            break;
        case 3:
            sprintf(wanBuf, "Wan1=%s;Wan2=%s;Wan3=%s;",wanInfo[0], wanInfo[1], wanInfo[2]);
            break;
        default:
            sprintf(wanBuf, "Wan1=%s;Wan2=;Wan3=;",wanInfo[0]);
            break;
    }

    switch(lanNums)
    {
        case 0:
            sprintf(lanBuf, "Lan1=;Lan2=;Lan3=;Lan4=;Lan5=;Lan6=;END");
            break;
        case 1:
            sprintf(lanBuf, "Lan1=%s;Lan2=;Lan3=;Lan4=;Lan5=;Lan6=;END", lanInfo[0]);
            break;
        case 2:
            sprintf(lanBuf, "Lan1=%s;Lan2=%s;Lan3=;Lan4=;Lan5=;Lan6=;END", lanInfo[0], lanInfo[1]);
            break;
        case 3:
            sprintf(lanBuf, "Lan1=%s;Lan2=%s;Lan3=%s;Lan4=;Lan5=;Lan6=;END", lanInfo[0], lanInfo[1], lanInfo[2] );
            break;
        case 4:
            sprintf(lanBuf, "Lan1=%s;Lan2=%s;Lan3=%s;Lan4=%s;Lan5=;Lan6=;END",    lanInfo[0], lanInfo[1], lanInfo[2], lanInfo[3]);
            break;
        default:
            sprintf(lanBuf, "Lan1=%s;Lan2=%s;Lan3=%s;Lan4=%s;Lan5=;Lan6=;END", lanInfo[0], lanInfo[1], lanInfo[2], lanInfo[3]);
            break;
    }

    sprintf(rtn, "WanNum=%d;LanNum=%d;%s%s", wanNums, lanNums, wanBuf, lanBuf);

    return RTN_BUFFER;
}



rtn_type ate_wlctrl_set(char *arg, char *rtn)
{
    char* start = NULL ;
    char* end = NULL ;
    ATE_TRACE;

    if(!arg)
    {
        return RTN_FAILED ;
    }

    start = arg ;

    while(start)
    {
        end = strchr(start , ';') ;
        if(!end)
        {
            break ;
        }

        *end = '\0' ;
        system_do_cmd(start);
        start = end + 1 ;
        end = NULL ;
    }

    return RTN_SUCCESS;
}

rtn_type ate_wlctrl_get(char *arg, char *rtn)
{
    return RTN_BUFFER;
}

/*------------------------------------------------------------------*/

static int MP_get_ext(char *ifname, char *buf, unsigned int ext_num)
{
#if 0
    int skfd;
    struct iwreq wrq;

    skfd = socket(AF_INET, SOCK_DGRAM, 0);
    wrq.u.data.pointer = (caddr_t)buf;
    wrq.u.data.length = strlen(buf);

    if (iw_get_ext(skfd, ifname, ext_num, &wrq) < 0)
    {
        printf("MP_get_ext failed\n");
        return -1;
    }

    close(skfd);
#endif

    return 0;
}

static rtn_type iwpriv_wlan_set(int i, char* cmd_type, char *cmd_buf, char *mp_buf)
{
    char wlan[2][16] = {"wlan0", "wlan1"};
    char temp_buf[48] = {0};
    char *p = NULL;

    if(NULL == cmd_buf)
    {
        return RTN_FAILED;
    }

    if(!(p = strstr(cmd_buf, cmd_type)))
    {
        printf("[%s:%d]Don't find iwpriv wlan!\n", __func__, __LINE__);
        return RTN_FAILED;
    }
    else
    {
        p += strlen(cmd_type) + 1;
    }

    //一些需要返回结果的命令处理
    if (strcmp(p,"mp_query") == 0)
    {
        MP_get_ext(wlan[i], cmd_buf, MP_QUERY_STATS);
        printf("---mp_query=%s\n",cmd_buf);
        sprintf(mp_buf,"%s",cmd_buf);
    }
    else if (strcmp(p,"mp_ther") == 0)
    {
        MP_get_ext(wlan[i], cmd_buf, MP_QUERY_THER);
        printf("---mp_ther=%s\n",cmd_buf);
        sprintf(mp_buf,"%s",cmd_buf);
    }
    else if (strcmp(p,"mp_tssi") == 0)
    {
        MP_get_ext(wlan[i], cmd_buf, MP_QUERY_TSSI);
        printf("---mp_tssi=%s\n",cmd_buf);
        sprintf(mp_buf,"%s",cmd_buf);
    }
    else
    {
        system_do_cmd(cmd_buf);
    }

    return RTN_SUCCESS;
}


static rtn_type ate_ifconfig_set(char *arg, char *rtn)
{
    if (!system_do_cmd("ifconfig %s", arg))
        return RTN_SUCCESS;

    return RTN_FAILED;
}

static rtn_type ate_iwpriv_set(char *arg, char *rtn)
{
    rtn_type ret = RTN_UNKNOW;
    int i = 0;
    char * cmd_type[2] = {"iwpriv wlan0", "iwpriv wlan1"};
    char *next = NULL;
    char buf[1024] = {0}, cmd_buf[512] = {0};
    int first_cmd_flag = 0;
    char mp_query_buf[512] = {0},recv_buff[MSG_MAX_LEN] = {0};

    if(!arg)
    {
        return RTN_FAILED;
    }

    strcpy(recv_buff, "iwpriv ");
    strcat(recv_buff, arg);

    //iwpriv wlan%d XXX XXX;XXX XXX;.....;
    if(NULL != strchr(recv_buff, ';'))
    {
        memset(buf, 0, sizeof(buf));

        for(i = 0; i < ARRAY_SIZE(cmd_type); i++)
        {
            if(0 == strncmp(recv_buff, cmd_type[i], strlen(cmd_type[i])))
            {
                first_cmd_flag = 1;

                foreach_arch(buf, recv_buff, next, ";", ';')
                {
                    if(0 == strlen(buf))
                    {
                        printf("[%s:%d]the value is NULL\n", __func__, __LINE__);
                    }
                    else
                    {
                        memset(cmd_buf,0x0,sizeof(cmd_buf));
                        if(1 == first_cmd_flag)
                        {
                            first_cmd_flag = 0;
                            strncpy(cmd_buf, buf, sizeof(cmd_buf) - 1);
                        }
                        else
                        {
                            snprintf(cmd_buf, sizeof(cmd_buf), "%s %s", cmd_type[i],buf);
                        }

                        ret = iwpriv_wlan_set(i, cmd_type[i], cmd_buf, mp_query_buf);
                    }
                }
            }

            strcpy(buf,mp_query_buf);
        }

    }
    else    //iwpriv wlan%d XXX XXX;   or  iwpriv wlan%d XXX XXX
    {
        for(i = 0; i < ARRAY_SIZE(cmd_type); i++)
        {
            if(0 == strncmp(recv_buff, cmd_type[i], strlen(cmd_type[i])))
            {
                ret = iwpriv_wlan_set(i, cmd_type[i], recv_buff, mp_query_buf);
            }
        }

        strcpy(buf,mp_query_buf);
    }

    if (ret == RTN_SUCCESS)
    {
        if(strlen(buf))
        {
            strcpy(rtn,buf);
        }
    }

    return ret;
}

rtn_type ate_mfg_set_hw_wlan(char *arg, char *rtn)
{
    char *key;
    char *val;
    char *item;

    foreach_item_in_str(item, arg, ";")
    {
        key = item;
        val = strstr(item, "=");
        if (!val)
            val = strstr(item, " ");

        if (!val)
            continue;

        *val++ = 0;

        if (!strlen(val))
            continue;

        if (!strcmp(key, "MAC"))
        {
            ate_mfg_set_lanmac(val, strlen(val));
        }
        else if (!strcmp(key, "PIN"))
        {
        }
        else if (!strcmp(key, "SN"))
        {
            factory_mtd_write(E2PROM_SN_OFFSET, val, MAX(strlen(val), E2PROM_SN_MAXLEN));
        }
        else if (!strcmp(key, "WPA_PW"))
        {
            factory_mtd_write(E2PROM_WPAPWD_OFFSET, val, MAX(strlen(val), E2PROM_WPAPWD_MAXLEN));
        }
        else if (!strcmp(key, "PLC_DPW"))
        {
        }
        else if (!strcmp(key, "PLC_NPW"))
        {
        }
        else if (!strcmp(key, "SSID"))
        {
            factory_mtd_write(E2PROM_SSID_OFFSET, val, MAX(strlen(val), E2PROM_SSID_MAXLEN));
        }
        else if (!strcmp(key, "COUNTRY"))
        {
            factory_mtd_write(E2PROM_COUNTRY_2G_OFFSET, val, MAX(strlen(val), E2PROM_COUNTRY_2G_MAXLEN));
            factory_mtd_write(E2PROM_COUNTRY_5G_OFFSET, val, MAX(strlen(val), E2PROM_COUNTRY_5G_MAXLEN));
        }
        else if (!strcmp(key, "MAXPOWER"))
        {
            factory_mtd_write(E2PROM_POWER_2G_OFFSET, val, MAX(strlen(val), E2PROM_POWER_2G_MAXLEN));
            factory_mtd_write(E2PROM_POWER_5G_OFFSET, val, MAX(strlen(val), E2PROM_POWER_5G_MAXLEN));
        }
        else if (!strcmp(key, "MAXPOWER_2G"))
        {
            factory_mtd_write(E2PROM_POWER_2G_OFFSET, val, MAX(strlen(val), E2PROM_POWER_2G_MAXLEN));
        }
        else if (!strcmp(key, "MAXPOWER_5G"))
        {
            factory_mtd_write(E2PROM_POWER_5G_OFFSET, val, MAX(strlen(val), E2PROM_POWER_5G_MAXLEN));
        }
        else if (!strcmp(key, "Channel"))
        {
        }
        else if (!strcmp(key, "Login_PW"))
        {
        }
        else if (!strcmp(key, "IP"))
        {
        }
        else if (!strcmp(key, "RFTestFlag"))
        {
            factory_mtd_write(E2PROM_RTFLAG_OFFSET, val, MAX(strlen(val), E2PROM_RTFLAG_MAXLEN));
        }
        else if (!strcmp(key, "FinishTestFlag"))
        {
            factory_mtd_write(E2PROM_FTFLAG_OFFSET, val, MAX(strlen(val), E2PROM_FTFLAG_MAXLEN));
        }
        else if (!strcmp(key, "ThroughputTestFlag"))
        {
            factory_mtd_write(E2PROM_TTFLAG_OFFSET, val, MAX(strlen(val), E2PROM_TTFLAG_MAXLEN));
        }
        else if (!strcmp(key, "MeshID"))
        {
        }
        else if (!strcmp(key, "MeshPW"))
        {
        }
        else if (!strcmp(key, "MeshGroupSn"))
        {
        }
        else
        {
            printf("Unknown key [%s]\n", key);
        }
    }

    return RTN_SUCCESS;
}

option_t g_ate_cmds[] =
{
    /* 由产测工具下发的命令Tenda_mfg XXX */
    {{"Tenda_mfg", "USB",  NULL}, o_noarg, ate_mfg_check_usb},
    {{"Tenda_mfg", "USB3.0", NULL}, o_noarg, ate_mfg_check_usb3},
    {{"Tenda_mfg", "WPSButton", NULL}, o_noarg, ate_mfg_check_wpsbutton},
    {{"Tenda_mfg", "WiFiButton", NULL}, o_noarg, ate_mfg_check_wifibutton},
    {{"Tenda_mfg", "ResetButton", NULL}, o_noarg, ate_mfg_check_resetbutton},
    {{"Tenda_mfg", "reboot", NULL}, o_noarg, ate_mfg_reboot},
    {{"Tenda_mfg", "default",  NULL}, o_noarg, ate_mfg_default},
    {{"Tenda_mfg", "htmlVersionInfo", NULL}, o_noarg, ate_mfg_htmlVersionInfo},
    {{"Tenda_mfg", "LanWanInfo",  NULL}, o_noarg, ate_mfg_LanWanInfo},

    /* 射频参数及由产测工具下发的成品参数命令nvram set XXX XXX */
    {{"ledtest", NULL}, o_string, ate_mfg_check_led},
    {{"nvram", "set",  NULL}, o_string, ate_mfg_set_hw_wlan},    // 设置射频参数
    {{"nvram", "get",  NULL}, o_string, ate_mfg_get_hw_wlan},    // 获取射频参数
    {{"iwpriv", NULL}, o_string, ate_iwpriv_set},                // 执行iwpriv命令参数
    {{"ifconfig", NULL}, o_string, ate_ifconfig_set},            // ifconfig命令处理
};

/*
    Return:   1(match), 0(not match)
*/
int ate_cmd_find_match(char *cmd, char *match[], char **arg)
{
    int i = 0;
    char *p = cmd;
    char *end = cmd + strlen(cmd);
    int m_len = 0;

    while(match[i] && p < end)
    {
        //skip  blank/line feed
        p += strspn(p, " \n\r");
        m_len = strcspn(p, " \n\r");

        if(strncasecmp(match[i], p , MAX(strlen(match[i]), m_len)))
            return 0;

        i++;
        p += m_len;
    }

    /* check max match. */
    if(NULL == match[i])
    {
        //skip  blank/line feed
        p += strspn(p, " \n\r");
        *arg = p;
        return 1;
    }

    return 0;
}

rtn_type ate_cmd_process(char *cmd, char *rtn_buf)
{
    int i = 0;
    char *arg = NULL;

    for(i = 0; i < sizeof(g_ate_cmds) / sizeof(option_t); i++)
    {
        if(ate_cmd_find_match(cmd, g_ate_cmds[i].name, &arg))
        {
            return g_ate_cmds[i].func(arg, rtn_buf);
        }
    }

    return RTN_UNKNOW;
}

#if 0
rtn_type ate_mfg_cmd_process_check()
{
    char temp_value[1024] = {0};
    char hw_conf[MSG_MAX_LEN] = {0}, rtn_buf[1024]  = {0};
    rtn_type ret = RTN_SUCCESS;

    struct ate_apmib_tuple* node = NULL;
    struct ate_hw_tuple* hw_node = NULL;

    printf("----%s---%d------\n",__func__, __LINE__);

    if(!list_empty(&apmib_check_list))
    {
        list_for_each_entry(node ,&apmib_check_list , list)
        {
            memset(temp_value , 0x0 , sizeof(temp_value));
            switch(node->type)
            {
                case ATE_BYTE6_T:
                    ate_apmib_get_mac(node->name, node->cfg_name, &temp_value);
                    break;
                case ATE_STRING_T:
                    ate_apmib_get_common(node->name, node->cfg_name, &temp_value);
                    break;
                default:
                    break;
            }

            if(strcmp(temp_value , node->value))
            {
                return RTN_FAILED ;
            }

        }
    }

    if(!list_empty(&hw_check_list))
    {
        list_for_each_entry(hw_node ,&hw_check_list , list)
        {
            memset(temp_value , 0x0 , sizeof(temp_value));

            ate_hw_get_common(hw_node->name , temp_value, rtn_buf);
            if(0 == strlen(hw_node->value))
            {
                ret =  RTN_SUCCESS;
            }
            else
            {
                printf("----%s---%d----temp_value = %s---hw_node->value = %s---\n",
                    __func__, __LINE__, temp_value, hw_node->value);
                if(strcmp(temp_value , hw_node->value))
                {
                    return RTN_FAILED;
                }

                ret = RTN_SUCCESS;
            }
        }
    }

    return ret;
}
#endif

int ate_mfg_init_button ()
{
    int fd;
    gpio_reg_info info;

    fd = open("/dev/gpio", O_RDONLY);
    if (fd < 0)
    {
        perror("/dev/gpio");
        return -1;
    }

    /* enable gpio interrupt */
    if (ioctl(fd, 0x08/*RALINK_GPIO_ENABLE_INTP*/) < 0)
    {
        goto __ERROR;
    }

    /* register information */
    info.irq = 38;
    info.pid = getpid();
    if (ioctl(fd, 0x0A/*RALINK_GPIO_REG_IRQ*/, &info) < 0)
    {
        goto __ERROR;
    }

    signal(SIGUSR1, ate_mfg_signal_handler);

    close(fd);
    return 0;

__ERROR:
    perror("ioctl");
    close(fd);

    return 0;
}

int main(void)
{
    int i = 1;
    int sk = 0;
    int ret = 0;
    char recv_buf[MSG_MAX_LEN] = {0};
    char send_buf[MSG_MAX_LEN] = {0};
    char rtn_buf[MSG_MAX_LEN] = {0};
    struct sockaddr cli_addr = {0};
    struct sockaddr_in local = {0};
    int addr_len = 0;
    fd_set r_fds;
    struct timeval tm = {0};

    /* 创建socket接收消息 */
    sk = socket(AF_INET, SOCK_DGRAM, 0);
    if(sk < 0)
    {
        perror("scoket");
        return -1;
    }

    if(setsockopt(sk, SOL_SOCKET, SO_REUSEADDR, (char *) &i, sizeof(i)) == -1)
    {
        close(sk);
        perror("setsockopt");
        return -1;
    }

    local.sin_family = AF_INET;
    local.sin_port = htons(7329);
    if (bind(sk, (struct sockaddr*)&local, sizeof(local)) < 0)
    {
        perror("bind");
        return -1;
    }

    /* 按键产测初始化 */
    if(ate_mfg_init_button() < 0)
    {
        printf("Failed to init button test mode\n");
        return -1;
    }

    while(1)
    {
        addr_len = sizeof(cli_addr);
        memset(&cli_addr, 0x0, sizeof(cli_addr));
        memset(recv_buf, 0x0, sizeof(recv_buf));
        memset(send_buf, 0x0, sizeof(send_buf));
        memset(rtn_buf, 0x0, sizeof(rtn_buf));

        tm.tv_usec = 200 * 1000;

        FD_ZERO(&r_fds);
        FD_SET(sk, &r_fds);

        ret = select(sk + 1, &r_fds, NULL, NULL, &tm);
        if(ret <= 0 || !FD_ISSET(sk, &r_fds))
            continue;

        ret = recvfrom(sk, recv_buf, sizeof(recv_buf), 0, &cli_addr, &addr_len);
        if(ret <= 0)
            continue;

        // 处理接收的buf
        printf("+++++++++++++++++++++++++++++ Recv :\n[%s]\n", recv_buf);
        ret = ate_cmd_process(recv_buf, send_buf);
        switch(ret)
        {
            case RTN_SUCCESS:
#if 0
                //check 设置到flash中的参数
                ret = ate_mfg_cmd_process_check();
                if(ret == RTN_SUCCESS)
                {
                    strcpy(rtn_buf, "success");
                    if(strlen(send_buf))
                    {
                        strcat(rtn_buf,":");
                        strcat(rtn_buf,send_buf);
                    }
                }
                else
                {
                    strcpy(rtn_buf, "error");
                    if(strlen(send_buf))
                    {
                        strcat(rtn_buf,":");
                        strcat(rtn_buf,send_buf);
                    }
                }
#endif
                sprintf(rtn_buf, "success");
                break;

            case RTN_FAILED:
                sprintf(rtn_buf, "error");
                break;

            case RTN_BUFFER:
                sprintf(rtn_buf, send_buf);
                break;

            default:
                sprintf(rtn_buf, "Unknown ate_cmd_process return value.\n");
                break;
        }

        // 返回产测结果
        printf("+++++++++++++++++++++++++++++ Send :\n[%s]\n", rtn_buf);
        sendto(sk, rtn_buf, strlen(rtn_buf), 0, (struct sockaddr*)&cli_addr, sizeof(cli_addr));
    }

    return 0;
}

