package com.tallink.ittel.web.api;


import com.tallink.ittel.IttelStatus;

import java.io.Serializable;

/**
 * Created by dmitrigu on 20.04.17.
 */
public class JiraTicketResult implements Serializable {

    private String message;
    private String ticketId;
    private String ticketLink;
    private IttelStatus status;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public String getTicketLink() {
        return ticketLink;
    }

    public void setTicketLink(String ticketLink) {
        this.ticketLink = ticketLink;
    }

    public IttelStatus getStatus() {
        return status;
    }

    public void setStatus(IttelStatus status) {
        this.status = status;
    }
}
