include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/package.mk

PKG_NAME:=cnd
PKG_VERSION:=1.0.0
PKG_RELEASE:=$(PKG_SOURCE_VERSION)

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

define Package/cnd
	SECTION:=net
	CATEGORY:=CastNow
	TITLE:=cnd - Remote control client for CastNow
	DEPENDS:=+libjson-c +libuci +libcutil
endef

TARGET_LDFLAGS += -ljson-c -luci -lcutil

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) ./src/* $(PKG_BUILD_DIR)/
endef

define Package/cnd/description
	Remote control client for CastNow
endef

define Package/cnd/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(CP) ./files/* $(1)/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/cnd $(1)/usr/bin/cnd
endef

$(eval $(call BuildPackage,cnd))
