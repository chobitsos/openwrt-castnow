#ifndef __ATE_H__
#define __ATE_H__

#define RECV_MAX_LEN 4096
#define SEND_MAX_LEN 4096
#define CLI_MAX_ARGV 32

#define RETURN_SUCCESS 0
#define RETURN_INFO -1
#define RETURN_ERROR 1

#define COMMAND_NUM 11
struct Ate_command
{
    char name[16];
    int (*func)(char **argv);
};

#define INPUT
#define OUTPUT
#define OPTIONAL

#define ATE_PORT 7329

#define RET_ERROR_INPUT -32602
#define RET_ERROR   0
#define RET_SUCCESS 1
#define RET_REBOOT  2

#define BUFLEN_IPADDR       16
#define BUFLEN_IPV6ADDR     48
#define BUFLEN_MACADDR      20
#define BUFLEN_DEVICEID     40
#define BUFLEN_SSID         40

#define BUFLEN_TINY 8
#define BUFLEN_SMALL 16
#define BUFLEN_NORMAL 32
#define BUFLEN_BIG      64
#define BUFLEN_LARGE 256
#define BUFLEN_HUGE 1024

#endif
