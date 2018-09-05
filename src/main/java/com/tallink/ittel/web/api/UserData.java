package com.tallink.ittel.web.api;

import org.springframework.security.core.GrantedAuthority;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;

import java.io.Serializable;
import java.util.List;

public class UserData implements Serializable {

    public String distinguishedName;
    public Integer identityId;
    private String ldapEmail;
    private List<String> companyCodes;
    private String username;
    private Collection<GrantedAuthority> authorities;


    public String getDistinguishedName() {
        return distinguishedName;
    }

    public void setDistinguishedName(String distinguishedName) {
        this.distinguishedName = distinguishedName;
    }

    public Integer getIdentityId() {
        return identityId;
    }

    public void setIdentityId(Integer identityId) {
        this.identityId = identityId;
    }

    public String getLdapEmail() {
        return ldapEmail;
    }

    public void setLdapEmail(String ldapEmail) {
        this.ldapEmail = ldapEmail;
    }

    public List<String> getCompanyCodes() {
        return companyCodes;
    }

    public void setCompanyCodes(List<String> companyCodes) {
        this.companyCodes = companyCodes;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
   }

    public Collection<GrantedAuthority> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(Collection<GrantedAuthority> authorities) {
        this.authorities = authorities;
    }
}
