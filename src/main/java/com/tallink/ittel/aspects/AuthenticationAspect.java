package com.tallink.ittel.aspects;

import com.tallink.ittel.service.HRISProvider;
import com.tallink.ittel.util.SecurityUtil;
import com.tallink.ittel.web.api.UserData;
/*
import com.tallink.ittel.ws.client.api.hris.GetIdentitiesRequest;
import com.tallink.ittel.ws.client.api.hris.HRISBaseRequest;
import com.tallink.ittel.ws.client.api.hris.Identity;
*/
import com.tallink.ittel.ws.client.api.hris.GetIdentitiesRequest;
import com.tallink.ittel.ws.client.api.hris.HRISBaseRequest;
import com.tallink.ittel.ws.client.api.hris.HRSystemReference;
import com.tallink.ittel.ws.client.api.hris.Identity;
import org.apache.commons.lang.StringUtils;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.opensaml.saml2.core.Attribute;
import org.opensaml.saml2.core.impl.AttributeImpl;
import org.opensaml.xml.schema.impl.XSAnyImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.providers.ExpiringUsernameAuthenticationToken;
import org.springframework.security.saml.SAMLCredential;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.naming.NamingException;
import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Aspect
public class AuthenticationAspect {

    private static final Logger authenticationLogger = LoggerFactory.getLogger(AuthenticationAspect.class);

    @Value("${sso.adminGroup}")
    private String adminGroupName;

    @Value("${sso.roleAttrName}")
    private String ssoRoleAttrName;

    @Value("${hris.authenticationToken}")
    private String authenticationToken;

    @Autowired
    private HRISProvider hrisProvider;

    private int defaultID = 16560;

/*    @Before("execution( * com.tallink.ittel.web.controller.ItemController.getTypes(..))")
  */

    @Before("execution( * com.tallink.ittel.web.controller.ItemController.getDefaultSettings(..))")
    public void editAuth(JoinPoint joinPoint) throws NamingException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        try {

            if (auth == null) {
                return;
            }

            authenticationLogger.info("Login request for: " + auth.getPrincipal().toString());
            SAMLCredential creds = (SAMLCredential) auth.getCredentials();

            UserData userData = constructUserDataWithEmployeeInfo(auth);
            List<SimpleGrantedAuthority> authList = null;
            try {
                authList = extractUserPermissions(creds.getAttributes(), userData.getIdentityId());
            }catch (Exception e){
                authenticationLogger.error("Error getting permissions of user: " + auth.getName());
            }
            String authListString;

            if (authList != null){
                authListString = authList.stream()
                        .map(SimpleGrantedAuthority::toString)
                        .collect(Collectors.joining(", "));

                authenticationLogger.info("Permissions for " + auth.getPrincipal().toString() + " are: " + authListString);

            }
            ExpiringUsernameAuthenticationToken editedAuth = new ExpiringUsernameAuthenticationToken(
                    null, auth.getPrincipal(), auth.getCredentials(), authList);
            editedAuth.setDetails(userData);

            SecurityContextHolder.getContext().setAuthentication(editedAuth);

        } catch (Exception ex) {
            authenticationLogger.error("Error getting permissions of user: " + auth.getName());
        }
    }

    private List<SimpleGrantedAuthority> getRolesForPerson(List<Attribute> attributes, String attributeName) {
        List authList = new ArrayList();

        for (Attribute attr : attributes) {
            AttributeImpl impl = (AttributeImpl) attr;
            if (attributeName.equals(impl.getName())) {
                String textValue = getTextValueOfAttribute(impl);

                if (textValue.contains(adminGroupName)) {
                    authList.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    break;
                }
            }
        }
        return authList;
    }

    private List<SimpleGrantedAuthority> extractUserPermissions(List<Attribute> attributes, Integer identityId) throws NamingException {
        List<SimpleGrantedAuthority> authList = new ArrayList<>();

        authList.add(new SimpleGrantedAuthority("ROLE_USER"));
        List<SimpleGrantedAuthority> roles = getRolesForPerson(attributes, ssoRoleAttrName);
        authList.addAll(roles);

        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = requestAttributes.getRequest();
        String ipAddress = SecurityUtil.getXForwardedByHeaderValueFromServletRequest(request);
        Boolean isInternalUser = SecurityUtil.isCurrentUserInternalCheckByIp(ipAddress);
        if (isInternalUser) {
            authList.add(new SimpleGrantedAuthority("ROLE_INTERNAL_USER"));
        }

        return authList;
    }

    private String getTextValueOfAttribute(AttributeImpl impl) {
        return ((XSAnyImpl) impl.getAttributeValues().get(0)).getTextContent();
    }


    private HRISBaseRequest.Authentication constructHrisAuth(Authentication auth) {
        HRISBaseRequest.Authentication hrisAuth = new HRISBaseRequest.Authentication();
        hrisAuth.setSecurityToken(authenticationToken);
        hrisAuth.setUserName(auth.getPrincipal().toString());
        return hrisAuth;
    }


    private Identity getIdentityById(Integer id,
                                     com.tallink.ittel.ws.client.api.hris.HRISBaseRequest.Authentication requestAuthentication) {
        if (id == null) {
            return createDefaultIdentity();
        }
        GetIdentitiesRequest.Options requestOptions = new GetIdentitiesRequest.Options();
        Identity identity = new Identity();
        identity.setId(id);
        identity.setActive(true);
        requestOptions.setLoadPosition(true);
        GetIdentitiesRequest request = new GetIdentitiesRequest();
        request.setOptions(requestOptions);
        request.setIdentity(identity);
        request.setAuthentication(requestAuthentication);
        List<Identity> identities = hrisProvider.getHRIS().getIdentities(request).getIdentities();
        return identities.isEmpty() ? createDefaultIdentity() : identities.get(0);
    }


    private Identity createDefaultIdentity() {
        Identity identity = new Identity();
        identity.setId(defaultID);
        return identity;
    }


/*
FOR FUTURE RELEASES:


    private List<SimpleGrantedAuthority> extractUserPermissions(List<Attribute> attributes, Integer identityId) throws NamingException {

        List<SimpleGrantedAuthority> authList = new ArrayList<>();
        authList.add(new SimpleGrantedAuthority("ROLE_USER"));
        String roleAttributeName;

        if (identityId == null || 0 == identityId) {
            roleAttributeName = "urn:dell/cam/role";
        } else {
            roleAttributeName = "Groups";
        }
        List<SimpleGrantedAuthority> roles = getRolesForPerson(attributes, roleAttributeName);
        authList.addAll(roles);

        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = requestAttributes.getRequest();
        String ipAddress = SecurityUtil.getXForwardedByHeaderValueFromServletRequest(request);
        //if (ipAddress == null && !Strings.isNullOrEmpty(fakeIp)) {
        //ipAddress = fakeIp;
        //}
        Boolean isInternalUser = SecurityUtil.isCurrentUserInternalCheckByIp(ipAddress);
        if (isInternalUser) {
            authList.add(new SimpleGrantedAuthority("ROLE_INTERNAL_USER"));
        }

        String userName = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        authenticationLogger.info("IP-address of " + userName + " : " + ipAddress);

        return authList;
    }

    private List<SimpleGrantedAuthority> getRolesForPerson(List<Attribute> attributes, String attributeName) {
        List authList = new ArrayList();

        for (Attribute attr : attributes) {
            AttributeImpl impl = (AttributeImpl) attr;
            if (attributeName.equals(impl.getName())) {
                String textValue = getTextValueOfAttribute(impl);

                if (textValue.contains(adminGroupName)) {
                    authList.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }
            }
        }
        return authList;
    }



    private Boolean hasCurrentCandidatesSystemReference(Integer identityId, Authentication auth) {
        Identity identity = getIdentityById(identityId, constructHrisAuth(auth));
        if(0 == identity.getId()) { //does not have identity
            return false;
        }
        Boolean hasCurrentCandidatesSysRef = identity.getHRSystemReferences()
                .stream()
                .filter(ref -> HRSystemTypeEnum.CANDIDATES.equals(ref.getHRSystemType()) &&
                        HRSystemReferenceStatus.ACTIVE.equals(ref.getStatus()))
                .count() > 0;
        return hasCurrentCandidatesSysRef;
    }

    private Boolean hasCurrentPartnerssSystemReference(Integer identityId, Authentication auth) {
        Identity identity = getIdentityById(identityId, constructHrisAuth(auth));
        if(0 == identity.getId()) { //does not have identity
            return false;
        }
        Boolean hasCurrentPartnersSysRef = identity.getHRSystemReferences()
                .stream()
                .filter(ref -> HRSystemTypeEnum.PARTNERS.equals(ref.getHRSystemType()) &&
                        HRSystemReferenceStatus.ACTIVE.equals(ref.getStatus()))
                .count() > 0;
        return hasCurrentPartnersSysRef;
    }
*/

    private UserData constructUserDataWithEmployeeInfo(Authentication auth) {
         		UserData userData = new UserData();

         		SAMLCredential creds = (SAMLCredential) auth.getCredentials();
         		for(Attribute attr: creds.getAttributes()) {
             			AttributeImpl impl = (AttributeImpl) attr;
             			if (StringUtils.lowerCase("EmployeeID").equals(StringUtils.lowerCase(impl.getName()))) {
                 				String employeeId = getTextValueOfAttribute(impl);
                 				if(StringUtils.isNotBlank(employeeId) && StringUtils.isNumeric(employeeId)) {
                     					userData.setIdentityId(Integer.valueOf(employeeId));
                 				}
                 			} else if(StringUtils.lowerCase("mail").equals(StringUtils.lowerCase(impl.getName())) ||
                 					StringUtils.lowerCase("emailAddress").equals(StringUtils.lowerCase(impl.getName()))) {
                 				userData.setLdapEmail(getTextValueOfAttribute(impl));
                 			} else if(StringUtils.lowerCase("name").equals(StringUtils.lowerCase(impl.getName()))) {
                 				userData.setDistinguishedName(getTextValueOfAttribute(impl));
                 			}
         		}

         		if(userData.getIdentityId() == null) {
           			userData.setIdentityId(0);
           		}

         		Identity identity = null;
                try {
                    identity = getIdentityById(userData.getIdentityId(), constructHrisAuth(auth));
                }catch (Exception e){
                    authenticationLogger.error("Error getting HRIS identity", e);
                }
                if (identity != null){
                    userData.setCompanyCodes(identity.getHRSystemReferences().stream().map(HRSystemReference::getCompanyCode).collect(Collectors.toList()));
                }
         		return userData;
         	}
}

