package com.tallink.ittel.proxy;

import com.tallink.ittel.service.DefaultConfigService;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;
import org.springframework.web.filter.DelegatingFilterProxy;

import javax.servlet.*;
import java.io.IOException;

import static com.tallink.ittel.ServiceNames.DEFAULT_CONFIG_SERVICE;

/**
 * Created by dmitrigu on 11.10.17.
 */
public class IttelDelegatingFilterProxy extends DelegatingFilterProxy  {

/*
    @Autowired
    @Qualifier(DEFAULT_CONFIG_SERVICE)
    private DefaultConfigService configService;
*/
    ApplicationContext applicationContext;
    ServletContext sc;

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        WebApplicationContext appContext = findWebApplicationContext();

        DefaultConfigService configService = (DefaultConfigService)appContext.getBean(DEFAULT_CONFIG_SERVICE);
        if (!configService.isIttelSamlSecurityEnabled()){
            // Ignore the DelegatingProxyFilter delegate
            filterChain.doFilter(request, response);
        } else {
            // Call the delegate
            super.doFilter(request, response, filterChain);
        }
    }

}