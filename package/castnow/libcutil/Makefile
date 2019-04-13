include $(TOPDIR)/rules.mk

PKG_NAME:=libcutil
PKG_VERSION:=1.0.0
PKG_RELEASE:=$(PKG_SOURCE_VERSION)

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/libcutil
	SECTION:=net
	CATEGORY:=CastNow
	TITLE:=libcutil - Utils library for CastNow
	DEPENDS:=+libuci
endef

TARGET_LDFLAGS += -luci

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/InstallDev
endef

define Package/libcutil/description
	Utils library for CastNow
endef

define Package/libcutil/install
	$(CP) ./files/* $(1)/
endef

$(eval $(call BuildPackage,libcutil))
