include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/package.mk

PKG_NAME:=ate
PKG_VERSION:=1.0.0
PKG_RELEASE:=$(PKG_SOURCE_VERSION)

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

define Package/ate
	SECTION:=net
	CATEGORY:=CastNow
	TITLE:=ate - Factory test daemon for CastNow
	DEPENDS:=+libcutil
endef

TARGET_LDFLAGS += -luci -lcutil

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) ./src/* $(PKG_BUILD_DIR)/
endef

define Package/ate/description
	Factory test daemon for CastNow
endef

define Package/ate/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/ate $(1)/usr/bin/ate
endef

$(eval $(call BuildPackage,ate))
