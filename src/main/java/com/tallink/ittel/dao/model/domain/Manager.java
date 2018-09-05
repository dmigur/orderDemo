package com.tallink.ittel.dao.model.domain;

import java.io.Serializable;

/**
 * Created by dmitrigu on 26.07.18.
 */
public class Manager implements Serializable{

    String name;
    String jiraName;
    String fullName;
    String country;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getJiraName() {
        return jiraName;
    }

    public void setJiraName(String jiraName) {
        this.jiraName = jiraName;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}