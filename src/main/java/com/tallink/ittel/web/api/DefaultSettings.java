package com.tallink.ittel.web.api;

import com.tallink.ittel.dao.model.domain.Manager;
import org.springframework.beans.factory.annotation.Value;

import java.io.Serializable;
import java.util.List;

/**
 * Created by dmitrigu on 24.04.17.
 */
public class DefaultSettings implements Serializable {

    boolean isSamlSecurityEnabled;

    private String jiraUrl;

    private String jiraCreateUri;

    private String jiraAuthUri;


    private String jiraTicketKey;


    private String jiraTicketSummary;


    private String jiraTicketName;


    private String jiraTicketPriority;


    private String jiraUsername;

    private String jiraPassword;

    private List<Manager> managers;

    private String support_ee;
    private String support_fi;
    private String support_se;
    private String support_lv;
    private String support_ru;
    private String support_ge;

    public boolean isSamlSecurityEnabled() {
        return isSamlSecurityEnabled;
    }

    public void setSamlSecurityEnabled(boolean samlSecurityEnabled) {
        isSamlSecurityEnabled = samlSecurityEnabled;
    }

    public String getJiraUrl() {
        return jiraUrl;
    }

    public void setJiraUrl(String jiraUrl) {
        this.jiraUrl = jiraUrl;
    }

    public String getJiraCreateUri() {
        return jiraCreateUri;
    }

    public void setJiraCreateUri(String jiraCreateUri) {
        this.jiraCreateUri = jiraCreateUri;
    }

    public String getJiraAuthUri() {
        return jiraAuthUri;
    }

    public void setJiraAuthUri(String jiraAuthUri) {
        this.jiraAuthUri = jiraAuthUri;
    }

    public String getJiraTicketKey() {
        return jiraTicketKey;
    }

    public void setJiraTicketKey(String jiraTicketKey) {
        this.jiraTicketKey = jiraTicketKey;
    }

    public String getJiraTicketSummary() {
        return jiraTicketSummary;
    }

    public void setJiraTicketSummary(String jiraTicketSummary) {
        this.jiraTicketSummary = jiraTicketSummary;
    }

    public String getJiraTicketName() {
        return jiraTicketName;
    }

    public void setJiraTicketName(String jiraTicketName) {
        this.jiraTicketName = jiraTicketName;
    }

    public String getJiraTicketPriority() {
        return jiraTicketPriority;
    }

    public void setJiraTicketPriority(String jiraTicketPriority) {
        this.jiraTicketPriority = jiraTicketPriority;
    }

    public String getJiraUsername() {
        return jiraUsername;
    }

    public void setJiraUsername(String jiraUsername) {
        this.jiraUsername = jiraUsername;
    }

    public String getJiraPassword() {
        return jiraPassword;
    }

    public void setJiraPassword(String jiraPassword) {
        this.jiraPassword = jiraPassword;
    }

    public List<Manager>  getManagers() {
        return managers;
    }

    public void setManagers(List<Manager> managers) {
        this.managers = managers;
    }

    public String getSupport_ee() {
        return support_ee;
    }

    public void setSupport_ee(String support_ee) {
        this.support_ee = support_ee;
    }

    public String getSupport_fi() {
        return support_fi;
    }

    public void setSupport_fi(String support_fi) {
        this.support_fi = support_fi;
    }

    public String getSupport_se() {
        return support_se;
    }

    public void setSupport_se(String support_se) {
        this.support_se = support_se;
    }

    public String getSupport_lv() {
        return support_lv;
    }

    public void setSupport_lv(String support_lv) {
        this.support_lv = support_lv;
    }

    public String getSupport_ru() {
        return support_ru;
    }

    public void setSupport_ru(String support_ru) {
        this.support_ru = support_ru;
    }

    public String getSupport_ge() {
        return support_ge;
    }

    public void setSupport_ge(String support_ge) {
        this.support_ge = support_ge;
    }
}
