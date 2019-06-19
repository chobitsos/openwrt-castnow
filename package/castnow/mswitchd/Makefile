include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/package.mk

PKG_NAME:=mswitchd
PKG_VERSION:=1.0.0
PKG_RELEASE:=$(PKG_SOURCE_VERSION)

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

define Package/mswitchd
	SECTION:=net
	CATEGORY:=CastNow
	TITLE:=mswitchd - Workmode switch daemon
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Compile
endef

define Package/mswitchd/description
	Workmode switch daemon
endef

define Package/mswitchd/install
	$(CP) ./files/* $(1)/
endef

$(eval $(call BuildPackage,mswitchd))
