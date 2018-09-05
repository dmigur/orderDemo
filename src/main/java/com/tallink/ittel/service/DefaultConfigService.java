package com.tallink.ittel.service;

import com.tallink.ittel.dao.model.domain.Manager;
import com.tallink.ittel.enums.Country;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static com.tallink.ittel.ServiceNames.DEFAULT_CONFIG_SERVICE;

/**
 * Created by dmitrigu on 01.09.16.
 */

@Service(DEFAULT_CONFIG_SERVICE)
public class DefaultConfigService {

    @Value("${ittel.saml.security.enabled}")
    private boolean ittelSamlSecurityEnabled;

    @Value("${ittel.jira.url}")
    private String jiraUrl;

    @Value("${ittel.jira.issue.uri}")
    private String jiraIssueUri;


    @Value("${ittel.jira.auth.uri}")
    private String jiraAuthUri;

    @Value("${ittel.jira.watchers.uri}")
    private String jiraWatchersUri;

    @Value("${ittel.jira.ticket.key}")
    private String jiraTicketKey;

    @Value("${ittel.jira.ticket.summary}")
    private String jiraTicketSummary;


    @Value("${ittel.jira.ticket.name}")
    private String jiraTicketName;

    @Value("${ittel.jira.ticket.priority}")
    private String jiraTicketPriority;

    @Value("${ittel.jira.username}")
    private String jiraUsername;

    @Value("${ittel.jira.password}")
    private String jiraPassword;

    @Value("${ittel.order.managers.ee}")
    private String managers_ee;

    @Value("${ittel.order.managers.se}")
    private String managers_se;

    @Value("${ittel.order.managers.fi}")
    private String managers_fi;

    @Value("${ittel.order.managers.lv}")
    private String managers_lv;

    @Value("${ittel.order.managers.ru}")
    private String managers_ru;

    @Value("${ittel.order.managers.ge}")
    private String managers_ge;

    @Value("${ittel.support.email.ee}")
    private String support_ee;

    @Value("${ittel.support.email.se}")
    private String support_se;

    @Value("${ittel.support.email.fi}")
    private String support_fi;

    @Value("${ittel.support.email.lv}")
    private String support_lv;

    @Value("${ittel.support.email.ru}")
    private String support_ru;

    @Value("${ittel.support.email.ge}")
    private String support_ge;

    public boolean isIttelSamlSecurityEnabled() {
        return ittelSamlSecurityEnabled;
    }

    public void setIttelSamlSecurityEnabled(boolean ittelSamlSecurityEnabled) {
        this.ittelSamlSecurityEnabled = ittelSamlSecurityEnabled;
    }

    public String getJiraUrl() {
        return jiraUrl;
    }

    public void setJiraUrl(String jiraUrl) {
        this.jiraUrl = jiraUrl;
    }

    public String getJiraIssueUri() {
        return jiraIssueUri;
    }

    public void setJiraIssueUri(String jiraIssueUri) {
        this.jiraIssueUri = jiraIssueUri;
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


    public String getJiraWatchersUri() {
        return jiraWatchersUri;
    }

    public void setJiraWatchersUri(String jiraWatchersUri) {
        this.jiraWatchersUri = jiraWatchersUri;
    }

    public String getManagers_ee() {
        return managers_ee;
    }

    public void setManagers_ee(String managers_ee) {
        this.managers_ee = managers_ee;
    }

    public String getManagers_se() {
        return managers_se;
    }

    public void setManagers_se(String managers_se) {
        this.managers_se = managers_se;
    }

    public String getManagers_fi() {
        return managers_fi;
    }

    public void setManagers_fi(String managers_fi) {
        this.managers_fi = managers_fi;
    }

    public String getManagers_lv() {
        return managers_lv;
    }

    public void setManagers_lv(String managers_lv) {
        this.managers_lv = managers_lv;
    }

    public String getManagers_ru() {
        return managers_ru;
    }

    public void setManagers_ru(String managers_ru) {
        this.managers_ru = managers_ru;
    }

    public String getManagers_ge() {
        return managers_ge;
    }

    public void setManagers_ge(String managers_ge) {
        this.managers_ge = managers_ge;
    }

    public List<Manager> getManagers() {
        return processManagers();
    }

    private List<Manager> processManagers(){
        List<Manager> res = new ArrayList<Manager>();

        res.addAll(parseManagers(managers_ee, Country.EE));
        res.addAll(parseManagers(managers_fi, Country.FI));
        res.addAll(parseManagers(managers_se, Country.SE));
        res.addAll(parseManagers(managers_lv, Country.LV));
        res.addAll(parseManagers(managers_se, Country.RU));
        res.addAll(parseManagers(managers_lv, Country.GE));

        return res;
    }


    private static List<Manager> parseManagers(String str, Country country){

        String[] arr = str.split(",");
        List<Manager> res = new ArrayList<Manager>();
        if (arr.length == 0) return res;

        for (String s: arr ){
            Manager manager = new Manager();
            int index = s.indexOf("#");
            String jiraname="", name=s, fullname = s;
            if (index >= 0){
                name=s.substring(0, index);
                jiraname = s.substring(index+1);
            }
            manager.setName(name);
            manager.setJiraName(jiraname);
            manager.setFullName(fullname);
            manager.setCountry(country.name());
            res.add(manager);
        }
        return res;
    }

    public String getSupport_ee() {
        return support_ee;
    }

    public void setSupport_ee(String support_ee) {
        this.support_ee = support_ee;
    }

    public String getSupport_se() {
        return support_se;
    }

    public void setSupport_se(String support_se) {
        this.support_se = support_se;
    }

    public String getSupport_fi() {
        return support_fi;
    }

    public void setSupport_fi(String support_fi) {
        this.support_fi = support_fi;
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
