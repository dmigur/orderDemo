package com.tallink.ittel.auth;

import com.tallink.ittel.util.SecurityUtil;
import org.springframework.security.access.expression.SecurityExpressionRoot;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.FilterInvocation;

import javax.servlet.http.HttpServletRequest;

public class IsInternalUserSecurityExpressionRoot extends SecurityExpressionRoot  implements MethodSecurityExpressionOperations {
	private HttpServletRequest request;
	private Object filterObject;
	private Object returnObject;
	private Object target;

	public IsInternalUserSecurityExpressionRoot(Authentication a) {
		super(a);
	}

	public IsInternalUserSecurityExpressionRoot(Authentication a, FilterInvocation fi) {
		super(a);
		this.request = fi.getRequest();
	}

	public boolean isInternalUser() {
		String s = SecurityUtil.getXForwardedByHeaderValueFromServletRequest(this.request);
		return SecurityUtil.isCurrentUserInternalCheckByIp(s);
	}

	public void setFilterObject(Object filterObject) {
		this.filterObject = filterObject;
	}

	public Object getFilterObject() {
		return filterObject;
	}

	public void setReturnObject(Object returnObject) {
		this.returnObject = returnObject;
	}

	public Object getReturnObject() {
		return returnObject;
	}

	void setThis(Object target) {
		this.target = target;
	}

	public Object getThis() {
		return target;
	}


}
