include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/package.mk

PKG_NAME:=ligqos
PKG_VERSION:=1.0.0
PKG_RELEASE:=$(PKG_SOURCE_VERSION)

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

define Package/ligqos
	SECTION:=net
	CATEGORY:=CastNow
	TITLE:=ligqos - Qos script for CastNow
endef

define Build/Prepare
endef

define Build/Compile
endef

define Package/ligqos/description
	Qos script for CastNow
endef

define Package/ligqos/install
	$(CP) ./files/* $(1)/
endef

$(eval $(call BuildPackage,ligqos))
