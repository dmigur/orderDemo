package com.tallink.ittel.auth;

import org.apache.log4j.Logger;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.FilterInvocation;
import org.springframework.security.web.access.expression.DefaultWebSecurityExpressionHandler;


public class IsInternalUserSecurityExpressionHandler extends DefaultWebSecurityExpressionHandler {
	Logger LOGGER = Logger.getLogger(IsInternalUserSecurityExpressionHandler.class);

	public IsInternalUserSecurityExpressionHandler() {
		super();
	}

	@Override
	protected IsInternalUserSecurityExpressionRoot createSecurityExpressionRoot(Authentication authentication, FilterInvocation filterInvocation) {

		IsInternalUserSecurityExpressionRoot root = new IsInternalUserSecurityExpressionRoot(authentication, filterInvocation);
		root.setPermissionEvaluator(getPermissionEvaluator());

		return root;
	}

}