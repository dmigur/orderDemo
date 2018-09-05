package com.tallink.ittel.web.filter;

import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class ResponseHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String headerForAllowOrigin = getFilterConfig().getInitParameter("headerOrigin");
        String valueForAllowOrigin = getFilterConfig().getInitParameter("valueOrigin");

        response.setHeader(headerForAllowOrigin, valueForAllowOrigin);
        response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT");
        response.setHeader("X-UA-Compatible", "IE=Edge");
        response.setHeader("Cache-Control", "no-store, no-cache, max-age=0");
        response.setHeader("Pragma", "no-cache");

        filterChain.doFilter(request, response);
    }

}
