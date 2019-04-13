#ifndef __CUTIL_H__
#define __CUTIL_H__

#include <uci.h>

/*
    sn(32 bytes)
    ssid(32 bytes)
    wpapwd(32 bytes)
    RTFlag(20 bytes)
    FTFlag(20 bytes)
    TTFlag(20 bytes)
*/
#define E2PROM_LMAC_OFFSET 0x28
#define E2PROM_LMAC_MAXLEN (6)

#define E2PROM_CN_BASE 0x200
#define E2PROM_SN_OFFSET (E2PROM_CN_BASE)
#define E2PROM_SN_MAXLEN (32)
#define E2PROM_SSID_OFFSET (E2PROM_SN_OFFSET + E2PROM_SN_MAXLEN)
#define E2PROM_SSID_MAXLEN (32)
#define E2PROM_WPAPWD_OFFSET (E2PROM_SSID_OFFSET + E2PROM_SSID_MAXLEN)
#define E2PROM_WPAPWD_MAXLEN (32)
#define E2PROM_RTFLAG_OFFSET (E2PROM_WPAPWD_OFFSET + E2PROM_WPAPWD_MAXLEN)
#define E2PROM_RTFLAG_MAXLEN (20)
#define E2PROM_FTFLAG_OFFSET (E2PROM_RTFLAG_OFFSET + E2PROM_RTFLAG_MAXLEN)
#define E2PROM_FTFLAG_MAXLEN (20)
#define E2PROM_TTFLAG_OFFSET (E2PROM_FTFLAG_OFFSET + E2PROM_FTFLAG_MAXLEN)
#define E2PROM_TTFLAG_MAXLEN (20)
#define E2PROM_COUNTRY_2G_OFFSET (E2PROM_TTFLAG_OFFSET + E2PROM_TTFLAG_MAXLEN)
#define E2PROM_COUNTRY_2G_MAXLEN (2)
#define E2PROM_COUNTRY_5G_OFFSET (E2PROM_COUNTRY_2G_OFFSET + E2PROM_COUNTRY_2G_MAXLEN)
#define E2PROM_COUNTRY_5G_MAXLEN (2)
#define E2PROM_POWER_2G_OFFSET (E2PROM_COUNTRY_5G_OFFSET + E2PROM_COUNTRY_5G_MAXLEN)
#define E2PROM_POWER_2G_MAXLEN (1)
#define E2PROM_POWER_5G_OFFSET (E2PROM_POWER_2G_OFFSET + E2PROM_POWER_2G_MAXLEN)
#define E2PROM_POWER_5G_MAXLEN (1)

#ifndef MIN
#define MIN(a, b) ((a) > (b) ? (b) : (a))
#endif

#ifndef MAX
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#endif

#define foreach_item_in_str(item, str, delimiter) \
    char *_tmp##__LINE__;\
    for ((item) = strtok_r((str), (delimiter), &(_tmp##__LINE__));\
        (item);\
        (item) = strtok_r(NULL, (delimiter), &(_tmp##__LINE__)))

int system_get_uptime();
int system_do_cmd(char *fmt, ...);
void system_do_cmd_in_bg(int delay, char *fmt, ...);
int system_do_cmd_for_result(char *result, int len, char *fmt, ...);
int system_get_phyport_status(int port);
int system_get_factory_wanmac(char *buf, int len);
int system_check_file_exist(char *filename);
void system_set_led_status(int enable);
int system_get_if_ip(const char *ifname, char *if_addr);
int system_get_if_netmask(const char *ifname, char *if_net);
int system_get_if_mac(char *ifname, unsigned char *if_mac);
int system_get_if_mtu(const char *ifname, unsigned int *mtu);
int system_get_mac_by_ip(char *req_ip, char *req_mac);
int system_get_if_rxtx(char *ifname, int *rx_bytes, int *tx_bytes);
int system_ethaddr_aton(char *macstr, unsigned char *macbin);
char *system_ethaddr_ntoa(const unsigned char *macbin, char *macstr);
char *system_get_localtime (char *tm);
char *system_cal_string_md5 (char *str, char *md5);
char *system_string_toupper (char *str);

int factory_mtd_read(unsigned int offset, char *buffer, unsigned int size);
int factory_mtd_write(unsigned int offset, void *buffer, unsigned int size);

int uci_lookup_ptr2 (struct uci_context *ctx, struct uci_ptr *ptr, char *str);
char *uci_get_option_string (struct uci_context *ctx, char *str, char *defval);
int uci_get_option_int (struct uci_context *ctx, char *str);
int uci_set_option_string (struct uci_context *ctx, char *str, char *val);
int uci_set_option_int (struct uci_context *ctx, char *str, int val);
struct uci_list* uci_get_option_list (struct uci_context *ctx, char *str);
void uci_del_list_all (struct uci_context *ctx, char *str);
int uci_add_list_item (struct uci_context *ctx, char *str, char *val);
void uci_commit_all (struct uci_context *ctx);

#endif
