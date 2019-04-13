include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/package.mk

PKG_NAME:=httpd
PKG_VERSION:=1.0.0
PKG_RELEASE:=$(PKG_SOURCE_VERSION)

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

define Package/httpd
	SECTION:=net
	CATEGORY:=CastNow
	TITLE:=httpd - Web server for CastNow
	DEPENDS:=+libjson-c +libuci +libcutil
endef

TARGET_LDFLAGS += -ljson-c -luci -lcutil

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Compile
endef

define Package/httpd/description
	Web server for CastNow
endef

define Package/httpd/install
	$(CP) ./files/* $(1)/
	@echo `git tag | awk 'END {print}'`-`git rev-parse --short HEAD` > $(1)/etc/castnow.version
endef

$(eval $(call BuildPackage,httpd))
