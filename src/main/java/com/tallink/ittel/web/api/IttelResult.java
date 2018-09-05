package com.tallink.ittel.web.api;
import com.tallink.ittel.IttelStatus;

import java.io.Serializable;

/**
 * Created by dmitrigu on 20.04.17.
 */
public class IttelResult implements Serializable {

    private String message;
    private IttelStatus status;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public IttelStatus getStatus() {
        return status;
    }

    public void setStatus(IttelStatus status) {
        this.status = status;
    }
}
