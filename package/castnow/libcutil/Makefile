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
	$(CP) ./src/* $(PKG_BUILD_DIR)/
	$(CP) ./files/usr/lib/libcutil.so $(PKG_BUILD_DIR)/
endef

define Build/Compile
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include $(1)/usr/lib
	$(CP) $(PKG_BUILD_DIR)/*.h $(1)/usr/include
	$(CP) $(PKG_BUILD_DIR)/libcutil.so $(1)/usr/lib
endef

define Package/libcutil/description
	Utils library for CastNow
endef

define Package/libcutil/install
	$(CP) ./files/* $(1)/
endef

$(eval $(call BuildPackage,libcutil))
