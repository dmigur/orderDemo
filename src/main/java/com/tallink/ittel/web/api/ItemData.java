package com.tallink.ittel.web.api;


import java.io.Serializable;

/**
 * Created by dmitrigu on 18.04.17.
 */
public class ItemData implements Serializable {
    private String name;
    private String description;
    private ItemTypeData itemType;
    private int storageId;
    private String message;
    private boolean needApprove;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ItemTypeData getItemType() {
        return itemType;
    }

    public void setItemType(ItemTypeData itemType) {
        this.itemType = itemType;
    }

    public int getStorageId() {
        return storageId;
    }

    public void setStorageId(int storageId) {
        this.storageId = storageId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isNeedApprove() {
        return needApprove;
    }

    public void setNeedApprove(boolean need) {
        this.needApprove = need;
    }
}

