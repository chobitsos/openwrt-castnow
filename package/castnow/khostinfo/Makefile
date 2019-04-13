include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/kernel.mk

PKG_NAME:=khostinfo
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define KernelPackage/khostinfo
	SECTION:=net
	CATEGORY:=CastNow
	TITLE:=khostinfo - Kernel host info for CastNow
	FILES:=$(PKG_BUILD_DIR)/khostinfo.ko
endef

define KernelPackage/khostinfo/description
	Kernel host info for CastNow
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) ./files/lib/modules/3.10.14/* $(PKG_BUILD_DIR)/
endef

define Build/Compile
endef

define KernelPackage/khostinfo/install
	$(CP) ./files/* $(1)/
endef

$(eval $(call KernelPackage,khostinfo))